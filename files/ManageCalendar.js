//const urlServizio = '/BookingCalendar/';
var ItaliaEstero, GiorniConEventi = [], Oggi, GiornoSelezionato, UltimaEsecuzione;
moment.locale('it');

document.addEventListener('DOMContentLoaded', function (event) {
    ShowLoader(true);
    const calendario = document.querySelector("section.calendario");
    const timeline = document.querySelector("section.cd-horizontal-timeline");
    calendario.style.display = "block";
    timeline.style.display = "block";
    //GetUltimaEsecuzione();
    CaricaServerInfo();
});

/* Server info */
function CaricaServerInfo() {
    let Metodo = 'RetrieveServerInfo';
    let Parametri = {};
    EseguiAsync(Metodo, Parametri, ValorizzaComponentiPagina, StampaErroreInConsole);
}
//function GetUltimaEsecuzione() {
//    let Metodo = 'RetrieveUltimaEsecuzione';
//    let Parametri = {};
//    EseguiAsync(Metodo, Parametri, ValorizzaUltimaEsecuzione, StampaErroreInConsole);
//}
//function ValorizzaUltimaEsecuzione(JsonUltimaEsecuzione) {
//    JsonUltimaEsecuzione = $.parseJSON(JsonUltimaEsecuzione);
//    UltimaEsecuzione = JsonUltimaEsecuzione[0].ULTIMA_ESECUZIONE;
//    CaricaServerInfo();
//}
function ValorizzaComponentiPagina(JsonServerInfo) {
    //if (!JsonServerInfo) {
        Oggi = JsonServerInfo.substring(0, 10);
        GiornoSelezionato = moment(FormattaData(Oggi));
        let Mese = moment(FormattaData(Oggi)).format('MM'),
            Anno = moment(FormattaData(Oggi)).format('YYYY');
        CostruisciFiltroAnni(Anno);
        ValorizzaFiltroMesi(Mese);
        _Servizio = JsonServerInfo.split(',')[1];
        $("#idServizio").val(_Servizio);
        CaricaTimelineOrizzontale(Mese, Anno, Oggi, _Servizio);
        
    //}
    //else {
    //    window.location.href = "/UserArea";
    //}
}
function CostruisciFiltroAnni(Anno) {
    Anno = Number(Anno);
    let FiltroAnni = document.querySelector('#filtroAnni');
    for (let i = Anno - 1; i <= Anno + 1; i++) {
        let optionAnno = document.createElement('option');
        optionAnno.value = String(i);
        optionAnno.innerHTML = String(i);
        if (i === Anno) {
            optionAnno.selected = true;
        }
        FiltroAnni.appendChild(optionAnno);
    }
}
function ValorizzaFiltroMesi(Mese) {
    let FiltroMesi = document.querySelector('#filtroMesi');
    FiltroMesi.selectedIndex = Mese - 1;
}

/* Timeline orizzontale */
function CaricaTimelineOrizzontale(_Mese, _Anno, _Oggi, _Servizio, _GiornoDaSelezionare) {
    let Metodo = 'RetrieveCalendarAvailability';

    let Parametri = [
        {
            // Parametri WebMethod.

            _Servizio: _Servizio,
            selectedDay: _Oggi,
        },
        {
            // Paramentri funzione di callback success.
            GiornoDaSelezionare: _Oggi
        },
        {
            // Paramentri funzione di callback error.
        }
    ];
    EseguiAsync(Metodo, Parametri, CostruisciTimelineOrizzontale, StampaErroreInConsole);
}
function CostruisciTimelineOrizzontale(JsonGiorniTimelineOrizzontale, Parametri) {
    JsonGiorniTimelineOrizzontale = $.parseJSON(JsonGiorniTimelineOrizzontale);
    if (JsonGiorniTimelineOrizzontale.length) {
        var data = $('#DataDisponibilita').val();
        var primaDataDisponibile = JsonGiorniTimelineOrizzontale[0].DateLibere;
        if (data) {
            var d1 = new Date(primaDataDisponibile);
            var d2 = new Date(data);
            var same = d1.getTime() == d2.getTime();
            if (same) {
                $('#GiorniDisponibili').val(2);
            }
            else {
                var dataChecked = d1.getTime() > d2.getTime();
                if (dataChecked) {
                    $('#GiorniDisponibili').val(1);
                }
                else {
                    $('#GiorniDisponibili').val(0);
                }
            }
        }
        else {
            $('#GiorniDisponibili').val(2);
            $('#DataDisponibilita').val(primaDataDisponibile);
        }
    }
    else {
        $('#GiorniDisponibili').val(0);
    }

    ResetHtmlTimelineOrizzontale();
    GiorniConPrenotazioni = [];

    let ListaGiorni = document.querySelector('.events ol');
    let ListaPrenotazioniGiorni = document.querySelector('.events-content ol');
    for (let i = 0; i < JsonGiorniTimelineOrizzontale.length; i++) {
        let DataBreve = JsonGiorniTimelineOrizzontale[i].DateLibere.substring(0, 10);
        let DataFormattata = FormattaData(DataBreve);
        let slotLiberi = JsonGiorniTimelineOrizzontale[i].SlotRimanenti;
        GiorniConPrenotazioni.push(DataBreve + '@' + slotLiberi);

        let Giorno = CreaGiorno(DataFormattata);
        ListaGiorni.appendChild(Giorno);
        let GiornoPrenotazione = CreaEventiGiorno(DataFormattata);
        ListaPrenotazioniGiorni.appendChild(GiornoPrenotazione);
    }
    InizializzaTimelineOrizzontale(Parametri.GiornoDaSelezionare);
}
function InizializzaTimelineOrizzontale(GiornoDaSelezionare) {
    var timelines = $('.cd-horizontal-timeline');
    eventsMinDistance = 120;
    (timelines.length > 0) && initTimeline(timelines);

    // Faccio in modo che non venga attaccato lo stesso evento più volte al calendario.
    //
    $('#datetimepicker').off('dp.update');
    $('#datetimepicker').off('dp.change');

    InizializzaCalendario();
    DisabilitaGiorniSenzaPrenotazioni();
    AbilitaInputAsincroni();
    ShowLoader(false);
    GiornoDaSelezionare = moment(FormattaData(GiornoDaSelezionare));
    let GiornoTimelineOrizzontale = document.querySelector('.events a[data-date="' + GiornoDaSelezionare.format("YYYY-MM-DD") + '"]');
    // Se il giorno cercato non esiste mi posiziono sul primo giorno utile nella timeline orizzontale.
    if (GiornoTimelineOrizzontale === null) {
        GiornoTimelineOrizzontale = document.querySelector('.events ol li a:first-child');
    }
    if (GiornoTimelineOrizzontale !== null) {
        GiornoTimelineOrizzontale.click();
    }
}
function ResetHtmlTimelineOrizzontale() {
    var TimelineOrizzontale = document.querySelector('.cd-horizontal-timeline');
    TimelineOrizzontale.classList.remove('loaded');
    TimelineOrizzontale.innerHTML = TemplateTimelineOrizzontale;
}
function CreaGiorno(Data) {
    let li = document.createElement('li');
    let a = document.createElement('a');
    a.setAttribute('href', '#0');
    a.setAttribute('data-date', Data);
    a.setAttribute('data-async', 'true');
    a.innerHTML = CreaEtichettaGiorno(Data);
    li.appendChild(a);
    return li;
}
function CreaEtichettaGiorno(Data) {
    let MomentData = moment(Data),
        NomeGiorno = MomentData.format('ddd'),
        Giorno = MomentData.format('DD'),
        NomeMese = MomentData.format('MMM');
    return NomeGiorno + ' ' + Giorno + ' ' + NomeMese;
}
function CreaEventiGiorno(Data) {
    let li = document.createElement('li');
    li.setAttribute('data-date', Data);
    return li;
}

/* Timeline verticale */
function CaricaTimelineVerticale(_Giorno, _ContenutiEventi) {
    _Giorno = _Giorno;
    _idService = $("#idServizio").val();

    let Metodo = 'RetrieveTimeSlots';
    let Parametri = [
        {
            // Parametri WebMethod.
            selectedDay: _Giorno,
            idService: _idService
        },
        // Paramentri funzione di callback success.
        _ContenutiEventi,
        {
            // Paramentri funzione di callback error.
        }
    ];
    EseguiAsync(Metodo, Parametri, CostruisciSchedaFasce, StampaErroreInConsole);
}
function CostruisciSchedaFasce(JsonFasceGiorno, Parametri) {
    JsonFasceGiorno = $.parseJSON(JsonFasceGiorno);
    var selectedContent = Parametri.selectedContent;

    // Valorizzo una variabile che mi permette di capire se il giorno selezionato ha una sola fascia. 
    let unicaFascia = false;
    if (JsonFasceGiorno.length == 1) {
        unicaFascia = true;
    }

    for (let i = 0; i < JsonFasceGiorno.length; i++) {
        let html = selectedContent.html();
        
        selectedContent.html(html + CreaFasce(JsonFasceGiorno[i], unicaFascia));
    }
    Parametri.selectedContent = selectedContent;

    // Costruisco il resto del contenuto della scheda e poi passo i parametri per l'animazione.
    CostruisciTimelineVerticale(Parametri);
}
function CreaFasce(fascia, unicaFascia) {
    let HTML = TemplateFasce;
    let classeDaAssegnare = "";
    let classeDot = "";

    // Se c'è una sola fascia la faccio renderizzare già selezionata. 
    if (unicaFascia) {
        classeDaAssegnare = 'act';
    }

    if (fascia.SlotRimanenti < 0) {
        classeDaAssegnare = 'notAvailableFascia';
        classeDot = 'dotRed';
    }

    let OraInizio = moment(fascia.OrarioInizioFascia.Hours + ":" + fascia.OrarioInizioFascia.Minutes, "HH:mm").format("HH:mm");
    let OraFine = moment(fascia.OrarioFineFascia.Hours + ":" + fascia.OrarioFineFascia.Minutes, "HH:mm").format("HH:mm");

    let fasce = TemplateFasce.replace('@attivo@', classeDaAssegnare).replace('@dotNonAttivo@', classeDot).replace('@OraInizio@', OraInizio).replace('@OraFine@', OraFine).replace('@IDCalendarioServizioGiornaliero@', fascia.IDCalendarioServizioGiornaliero).replace('@PostiDiponibili@', fascia.SlotLiberi);
    HTML = fasce;
    return HTML;
}
function CostruisciTimelineVerticale(Parametri) {

    var eventsContent = Parametri.eventsContent;
    var visibleContent = Parametri.visibleContent;
    var selectedContent = Parametri.selectedContent;

    var HTML = selectedContent.html();

    selectedContent.html(HTML);

    var selectedContentHeight = selectedContent.height();

    if (selectedContent.index() > visibleContent.index()) {
        var classEnetering = 'selected enter-right',
            classLeaving = 'leave-left';
    } else {
        var classEnetering = 'selected enter-left',
            classLeaving = 'leave-right';
    }

    selectedContent.attr('class', classEnetering);
    visibleContent.attr('class', classLeaving).one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function () {
        visibleContent.removeClass('leave-right leave-left');
        selectedContent.removeClass('enter-left enter-right');
    });
    eventsContent.css('min-height', selectedContentHeight + 'px');
    AbilitaInputAsincroni();
    $('[data-toggle="tooltip"]').tooltip();
}

/* Calendario */
function InizializzaCalendario() {

    $('#datetimepicker').datetimepicker({
        format: 'DD/MM/YYYY',
        inline: true,
        locale: 'it'
    }).on(
        'dp.change', function (e) { // Quando clicco su un giorni del calendario.
            let DataSelezionata = moment(e.date);
            GiornoSelezionato = DataSelezionata;
            let GiornoTimelineOrizzontale = document.querySelector('.events a[data-date="' + DataSelezionata.format("YYYY-MM-DD") + '"]');
            if (GiornoTimelineOrizzontale !== null) {
                GiornoTimelineOrizzontale.click();
            }
        }
    ).on(
        'dp.update', function (e) { // Quando uso le freccette dx/sx del calendario oppure cambio mese/anno.
            if (e.change === 'YYYY') {
                e.preventDefault();
            }
            else {
                ShowLoader(true);
                let Data = moment(e.viewDate);
                GiornoSelezionato = Data;
                let Mese = Data.format('MM'),
                    Anno = Data.format('YYYY');
                CaricaTimelineOrizzontale(Mese, Anno, Data, _Servizio);
            }
        }

    );

    ShowLoader(false);
    $('.picker-switch').prop('disabled', true);
    var isDisponibile = $('#GiorniDisponibili').val();
    //if (isDisponibile == 0) {
    //    $('.dtpicker-next').prop('disabled', true);
    //    $(".dtpicker-next").css("color", "darkgrey");
    //    $('.dtpicker-prev').prop('disabled', false);
    //}
    //if (isDisponibile == 1) {
    //    $('.dtpicker-next').prop('disabled', false);
    //    $(".dtpicker-next").css("color", "black");
    //    $('.dtpicker-prev').prop('disabled', false);
    //    $(".dtpicker-prev").css("color", "black");
    //}
    //if (isDisponibile == 2) {
    //    $('.dtpicker-next').prop('disabled', false);
    //    $('.dtpicker-prev').prop('disabled', true);
    //    $(".dtpicker-prev").css("color", "darkgrey");
    //}
}
/* Async */
function EseguiAsync(Metodo, Parametri, MetodoSuccess, MetodoError) {
    $.ajax({
        url: urlServizio + Metodo,
        type: 'POST',
        data: JSON.stringify(Parametri[0]),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: function (response) {
            if (MetodoSuccess !== null) {
                MetodoSuccess(response, Parametri[1]);
            }
        },
        error: function (response) {
            if (MetodoError !== null) {
                MetodoError();
            }
        }
    });
}
function StampaSuccessoInConsole(Risposta) {
    console.log(Risposta);
}
function StampaErroreInConsole(Risposta) {
   
}
function DisabilitaInputAsincroni() {
    var inputAsincroni = document.querySelectorAll('[data-async="true"]:not(.selected)');
    inputAsincroni = Array.prototype.slice.call(inputAsincroni);
    inputAsincroni.forEach(function (Input) {
        Input.classList.remove('input-async-abilitato');
        Input.classList.add('input-async-disabilitato');
    });
}
function AbilitaInputAsincroni() {
    var inputAsincroni = document.querySelectorAll('[data-async="true"]:not(.selected)');
    inputAsincroni = Array.prototype.slice.call(inputAsincroni);
    inputAsincroni.forEach(function (Input) {
        Input.classList.remove('input-async-disabilitato');
        Input.classList.add('input-async-abilitato');
    });
}
/* Eventi */
function ValorizzaTimelineOrizzontale() {
    var Mese = LeggiMeseSelezionato(),
        Anno = LeggiAnnoSelezionato();
    DisabilitaInputAsincroni();
    CaricaTimelineOrizzontale(Mese, Anno);
}
/* Altri metodi */
function LeggiMeseSelezionato() {
    let FiltroMesi = document.querySelector('#filtroMesi');
    let IndiceMeseSelezionato = FiltroMesi.selectedIndex;
    return FiltroMesi.options[IndiceMeseSelezionato].value;
}
function LeggiAnnoSelezionato() {
    let FiltroAnni = document.querySelector('#filtroAnni');
    let IndiceAnnoSelezionato = FiltroAnni.selectedIndex;
    return FiltroAnni.options[IndiceAnnoSelezionato].value;
}
function FormattaData(Data) {
    // Formato data di ritorno: AAAA/MM/GG
    //
    let ComponentiData = Data.toString().replace(/\./g,'/').split('/');
    let Giorno = ComponentiData[0],
        Mese = ComponentiData[1],
        Anno = ComponentiData[2];
    return Anno + '-' + Mese + '-' + Giorno;
}
function DisabilitaGiorniSenzaPrenotazioni() {
    let Calendario = document.querySelector('#datetimepicker');
    let Giorni = Calendario.querySelectorAll('.day');
    Giorni = Array.prototype.slice.call(Giorni);
    Giorni.forEach(function (Giorno) {
        Giorno.classList.add('disabled');
        let Data = FormattaData(Giorno.getAttribute('data-day'));
        GiorniConPrenotazioni.forEach(function (DataConPrenotazione) {
            let dataConfronto = FormattaData(DataConPrenotazione.split('@')[0]);
            if (Data === dataConfronto) {
                var slot = DataConPrenotazione.split('@')[1];
                if (slot >= 0) {
                    Giorno.classList.add('availableDay');
                    Giorno.classList.remove('disabled');
                }
                else {
                    Giorno.classList.add('notAvailableDay');
                }

            }
        });
    });
}
function ShowLoader(showing) {
    document.getElementById('loader-content').style.display = !showing ? "block" : "none";
    document.getElementById('loader-facility').style.display = showing ? "block" : "none";
}

