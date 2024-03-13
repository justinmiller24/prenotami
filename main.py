import os
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver import ChromeOptions
from selenium.webdriver.support.ui import Select
from datetime import datetime
from selenium.common.exceptions import NoSuchElementException
from time import sleep
import logging
import sys
import time
import random
import undetected_chromedriver as udc

load_dotenv()

logging.basicConfig(
    format="%(levelname)s:%(message)s",
    level=logging.INFO,
    handlers=[logging.FileHandler("/tmp/out.log"), logging.StreamHandler(sys.stdout)],
)

def handle_timeout(driver, attempt):
    try:
        logging.info("Attempting to recover from timeout...")
        if Prenota.is_on_login_page(driver):
            Prenota.login(driver, os.getenv("username"), os.getenv("password"))
        else:
            driver.refresh()  # Refresh the current page
    except Exception as e:
        logging.error(f"Error while recovering from timeout: {e}")
        if attempt < 3:  # Limit the number of retries
            time.sleep(10)  # Wait for 10 seconds before retrying
            handle_timeout(driver, attempt + 1)
        else:
            driver.quit()
            sys.exit("Failed to recover from timeout after multiple attempts.")

class Prenota:
    @staticmethod
    def check_file_exists(file_name):
        file_path = os.path.join(os.getcwd(), file_name)
        return os.path.isfile(file_path)

    @staticmethod
    def check_for_dialog(driver):
        try:
            dialog = WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']"))
            )
            button_inside_dialog = dialog.find_element(
                By.XPATH, "//button[contains(text(),'ok')]"
            )
            button_inside_dialog.click()
            logging.info(
                f"Timestamp: {str(datetime.now())} - Scheduling is not available right now."
            )
            return True
        except NoSuchElementException:
            logging.info(
                f"Timestamp: {str(datetime.now())} - Element WlNotAvailable not found. Start filling the forms."
            )
            return False

    @staticmethod
    def fill_citizenship_form(driver):
        try:
            driver.get("https://prenotami.esteri.it/Services/Booking/3549")
            time.sleep(6)
            if not Prenota.check_for_dialog(driver):
                file_location = os.path.join("files/residencia.pdf")
                choose_file = driver.find_elements(By.ID, "File_0")
                choose_file[0].send_keys(file_location)
                privacy_check = driver.find_elements(By.ID, "PrivacyCheck")
                privacy_check[0].click()
                submit = driver.find_elements(By.ID, "btnAvanti")
                submit[0].click()
                with open("files/citizenship_form.html", "w") as f:
                    f.write(driver.page_source)
                return True
        except Exception as e:
            logging.info(f"Exception {e}")
            return False

    @staticmethod
    def is_on_login_page(driver):
        try:
            driver.find_element(By.ID, "login-email")
            driver.find_element(By.ID, "login-password")
            return True
        except NoSuchElementException:
            return False

    @staticmethod
    def login(driver, email, password):
        try:
            driver.get("https://prenotami.esteri.it/")
            email_box = WebDriverWait(driver, 60).until(
                EC.presence_of_element_located((By.ID, "login-email"))
            )
            password_box = driver.find_element(By.ID, "login-password")
            email_box.send_keys(email)
            password_box.send_keys(password)
            time.sleep(4)
            button = driver.find_elements(
                By.XPATH, "//button[contains(@class,'button primary g-recaptcha')]"
            )
            button[0].click()
            logging.info(
                f"Timestamp: {str(datetime.now())} - Successfully logged in."
            )
            time.sleep(10)
        except TimeoutException as e:
            logging.error(f"TimeoutException during login: {e}")
            return False
        except Exception as e:
            logging.error(f"Exception during login: {e}")
            return False
        return True

    @staticmethod
    def run(driver):
        if Prenota.check_file_exists("files/residencia.pdf"):
            logging.info(
                f"Timestamp: {str(datetime.now())} - Required files available."
            )
            email = os.getenv("username")
            password = os.getenv("password")

            if not Prenota.login(driver, email, password):
                sys.exit("Failed to login")

            for i in range(100000):
                random_number = random.randint(10, 40)

                if Prenota.fill_citizenship_form(driver):
                    break

                time.sleep(random_number)

            user_input = input(
                f"Timestamp: {str(datetime.now())} - Go ahead and fill manually the rest of the process. "
                f"When finished, type quit to exit the program and close the browser. "
            )
            while True:
                if user_input == "quit":
                    driver.quit()
                    break
        else:
            logging.info(
                "Required files are not available. Check the required files in README.md file. Ending execution."
            )
            sys.exit(0)


if __name__ == "__main__":
    options = udc.ChromeOptions()
    options.headless = False
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--password-store=basic")
    options.add_experimental_option(
        "prefs",
        {
            "credentials_enable_service": False,
            "profile.password_manager_enabled": False,
        },
    )
    driver = udc.Chrome(use_subprocess=True, options=options)
    driver.delete_all_cookies()

    Prenota.run(driver)
