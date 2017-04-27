var Ihm = (function () {

    this.startDisplayTimer = function (fenetre) {
        var delai = window.TIMER_DELAY;
        window.waitAnswer = setInterval(function () {
            if (delai <= 0) {
                clearInterval(window.waitAnswer);
                fenetre.detach();
            } else {
                delai -= 1;
                // TODO : Afficher la valeur dans un élément HTML
            }
        // jmv TODO remplacer nombre en dur par une variable
        } , 1000)
    } ;
    this.wipeDisplayTimer = function (fenetre) {
        clearInterval(waitAnswer);
        fenetre.detach();
    }

    this.messenger = function (html) {
        var alerte = $("<article class='pop-window demande-course'><h1>Demande de course</h1></article>");
        var parametres = $('<div class="parametres"></div>');
        var distance = $('<p class="distance"></p>').html('Distance : '+main.expectedDistance);
        var duree = $('<p class="distance"></p>').html('Durée estimée : '+main.expectedDuration);
        var prix = $('<p class="distance"></p>').html('Prix : '+main.price);
        parametres.append(distance).append(duree).append(prix);
        var pointDepart = (graphe.filter(function(obj) {return obj['@id'] === main.departure; }))[0];
        var p1 = $('<h2 class="depart"></h2>').html('Départ : '+pointDepart.lat);
        var pointArrivee = (graphe.filter(function(obj) {return obj['@id'] === main.destination; }))[0]
        var p2 = $('<h2 class="arrivee"></h2>').html('Arrivée : '+pointArrivee.lat);
        alerte.append(p1).append(p2).append(parametres);
        var timer = $('<p class="timer">30 secondes</p>');
        alerte.append(timer);
        var button = $('<button class="accept-button">J’accepte</button>');
        alerte.append(button);
    }

    return {
        "startDisplayTimer": this.startDisplayTimer ,
        "wipeDisplayTimer": this.wipeDisplayTimer
    }
})();
