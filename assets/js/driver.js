var Driver = (function () {

    /** Initialisation et affichage de la carte du le terminal du chauffeur ;
     *
     * @param profil une structure "@id", "lat", "long"
     */
    this.driverMap = function (profil) {
        console.log('Init carte chauffeurs');
        console.log(profil);
        return new Promise(function (resolve, reject) {
            if (profil.error === 0) {
            	console.log('init map');
                Pins.initMap(profil.lat, profil.long);
                // TODO : Afficher la position de user
                console.log('make pin');
                Pins.mark({
                    "lat": profil.lat,
                    "long": profil.long,
                    "name": profil.name,
                    "@id": profil['@id']
                });
                $('.no-init').remove();
                resolve(profil);
            } else {
                reject("<h1 class='no-init geo-error'>Votre terminal est en cours de géo-localisation</h1>")
            }
        })
    }

    /** Traitement du message de service proposant à un chauffeur une nouvelle course
     *
     * @param graphe Le message envoyé par le serveur
     */
    this.RideEnquiry_0 = function(graphe) {
        window.currentStatus = driverStatus.CANDIDATE_RIDE;
        var i = 120;
        var id = localStorage.getItem('personalKey');
        var main = (graphe.filter(function (obj) { return Dialog.entityShortName(obj['@type']) === 'RideEnquiry'; }))[0];
        console.log(main);

        // TODO : Voir comment remplacer tout cela par un WebComponent
        // jmv: TODO déjà remplacer tout cela par une fonction
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
        $('body').append(alerte);

        waitAnswer = setInterval(function () {
            i -= 1;
            $('.demande-course .timer').text(i+' secondes');
            if (i <= 0) {
                clearInterval(waitAnswer);
                alerte.detach();
                window.currentStatus = driverStatus.IDLE;
                localStorage.setItem('driverStatus', driverStatus.IDLE);
            }
            // jmv TODO remplacer nombre en dur par une variable
        }, 1000);

        button.on('click', function() {
            clearInterval(waitAnswer);
            alerte.detach();
            request_data = {
                "@id": main['@id'],
                "@type": main['@type'] ,
                "departure": {
                  "lat": pointDepart.lat,
                  "long": pointDepart.long
                },
                "passengerID": "mailto:michel.cadennes@sens-commun.fr" ,
                "destination": {
                  "lat": pointArrivee.lat,
                  "long": pointArrivee.long
                },
                "vehiculeType": "http://dbpedia.org/resource/Van",
                "datetime": Math.round(new Date().getTime()),
                "passengerID": "mailto:michel.cadennes@sens-commun.fr",
                "expectedDuration": main.expectedDuration,
                "expectedDistance": main.expectedDistance,
                "price": main.price,
                "serviceStartedBy": window.id
            };
            console.log(request_data);
            $.ajax({
                    type: 'POST',
                    url:'/serviceStart',
                    data: JSON.stringify(request_data),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    timeout: 4000
                }).done(function(reponse) {
                    window.currentStatus = driverStatus.ACCEPTED_RIDE;
                    localStorage.setItem('driverStatus', driverStatus.ACCEPTED_RIDE);
                    console.log("Course acceptée : "+window.currentStatus);
                }).fail(function(err) {
                    window.currentStatus = driverStatus.IDLE;
                }).always(function() {
                    //
                });

        })
    };

    /** Traitement du message de service indiquant au chauffeur qu'il approche
     * du point de départ de la course
     *
     * Le chauffeur accepté la course (ACCEPTED_RIDE : 2)
     *
     * @param graphe Le message envoyé par le serveur
     */
    // this.RideEnquiry_2 = function (graphe) {
    //     window.currentStatus = driverStatus.APPROACHING_DEPARTURE;
    // }

    /** Traitement du message de service indiquant au chauffeur l'arrivée
     * au point de départ de la course
     *
     * Le chauffeur a accepté la course (ACCEPTED_RIDE : 2)
     *
     * @param graphe Le message envoyé par le serveur
     */
    this.RideEnquiry_2 = function (graphe) {
        window.currentStatus = driverStatus.PASSENGER_TOUCH;
        var id = localStorage.getItem('personalKey');
        // var main = (graphe.filter(function (obj) { return Dialog.entityShortName(obj['@type']) === 'RideEnquiry'; }))[0];
        // console.log(main);

        // TODO : Voir comment remplacer tout cela par un WebComponent
        // jmv: TODO déjà remplacer tout cela par une fonction
        var alerte = $("<article class='pop-window demande-course'><h1>Demande de course</h1></article>");
        // var pointDepart = (graphe.filter(function(obj) {return obj['@id'] === main.departure; }))[0];
        // var p1 = $('<h2 class="depart"></h2>').html('Départ : '+pointDepart.lat);
        var message = $('<p>Vous êtes arrivé au point de départ de la course</p>');
        var button = $('<button class="accept-button">Départ</button>');
        alerte.append(button);
        $('body').append(alerte);

        Ihm.startDisplayTimer(alerte);

        button.on('click', function() {
            clearInterval(window.waitAnswer);
            alerte.detach();
            window.currentStatus = driverStatus.STARTED_RIDE;
            localStorage.setItem('driverStatus', driverStatus.STARTED_RIDE);
            console.log("Course acceptée : "+window.currentStatus);
        })
    };

    /** Traitement du message de service indiquant au chauffeur l'arrivée
     * à la destination de la course
     *
     * La course est en cours (STARTED_RIDE : 5)
     *
     * @param graphe Le message envoyé par le serveur
     */
    this.RideEnquiry_5 = function (graphe) {
        window.currentStatus = driverStatus.ARRIVAL_TOUCH;
        var i = 120;
        var id = localStorage.getItem('personalKey');
        // var main = (graphe.filter(function (obj) { return Dialog.entityShortName(obj['@type']) === 'RideEnquiry'; }))[0];
        // console.log(main);

        // TODO : Voir comment remplacer tout cela par un WebComponent
        // jmv: TODO déjà remplacer tout cela par une fonction
        var alerte = $("<article class='pop-window demande-course'><h1>Demande de course</h1></article>");
        // var pointDepart = (graphe.filter(function(obj) {return obj['@id'] === main.departure; }))[0];
        // var p1 = $('<h2 class="depart"></h2>').html('Départ : '+pointDepart.lat);
        var message = $('<p>Vous êtes au point de destination de la course</p>');
        var button = $('<button class="accept-button">OK</button>');
        alerte.append(button);
        $('body').append(alerte);

        Ihm.startDisplayTimer(alerte);

        button.on('click', function() {
            Ihm.wipeDisplayTimer(alerte);
            messageAcknoledge_5();
        })
    };

    // TODO : Web worker ?
    function messageAcknoledge_5 () {
        $.ajax({
            type: 'POST',
            url:'/serviceStart',
            data: JSON.stringify(requestBuilder_5(main)),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 4000
        }).done(function(reponse) {
            // TODO : Réponse du serveur ?
        }).fail(function(err) {
            // TODO : Cas où l'acquittement du chauffeur n'a pu être transmis
        }).always(function() {
            window.currentStatus = driverStatus.STARTED_RIDE;
            localStorage.setItem('driverStatus', driverStatus.STARTED_RIDE);
            console.log("Course achevée : "+window.currentStatus);
        });
    }

    function requestBuilder_5 (main) {
        return {
                "@id": main['@id'],
                "@type": main['@type'] ,
                "datetime": Math.round(new Date().getTime()),
                "driverStatus" : ARRIVAL_TOUCH,
                "passengerID": "mailto:michel.cadennes@sens-commun.fr",
                "serviceStartedBy": window.id
            }
    }

    /** Traitement du message de service indiquant que le réglement de la course a été acquitté
     *
     * La client est arrivé à destination (STARTED_RIDE : 6)
     *
     * @param graphe Le message envoyé par le serveur
     */
    this.RideEnquiry_6 = function (graphe) {
        window.currentStatus = driverStatus.PAID_RIDE;
        var i = 120;
        var id = localStorage.getItem('personalKey');
        // var main = (graphe.filter(function (obj) { return Dialog.entityShortName(obj['@type']) === 'RideEnquiry'; }))[0];
        // console.log(main);
        alerte = popinAlerte_6();
        Ihm.startDisplayTimer(alerte);

        button.on('click', function() {
            Ihm.wipeDisplayTimer(alerte);
            messageAcknoledge_6();
        })
    };

    function popinAlerte_6 () {
        // TODO : Voir comment remplacer tout cela par un WebComponent
        var alerte = $("<article class='pop-window demande-course'><h1>Demande de course</h1></article>");
        var message = $('<p>La course a été payée</p>');
        var button = $('<button class="accept-button">OK</button>');
        alerte.append(button);
        $('body').append(alerte);
        return alerte;
    }

    // TODO : Web worker ?
    function messageAcknoledge_6 () {
        $.ajax({
            type: 'POST',
            url:'/serviceStart',
            data: JSON.stringify(requestBuilder_5(main)),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 4000
        }).done(function(reponse) {
            // TODO : Réponse du serveur ?
        }).fail(function(err) {
            // TODO : Cas où l'acquittement du chauffeur n'a pu être transmis
        }).always(function() {
            window.currentStatus = driverStatus.IDLE;
            localStorage.setItem('driverStatus', driverStatus.IDLE);
            console.log("Course payée : "+window.currentStatus);
        });
    }

    function requestBuilder_5 (main) {
        return {
                "@id": main['@id'],
                "@type": main['@type'] ,
                "datetime": Math.round(new Date().getTime()),
                "driverStatus" : ARRIVAL_TOUCH,
                "passengerID": "mailto:michel.cadennes@sens-commun.fr",
                "serviceStartedBy": window.id
            }
    }

    return {
        "driverMap": this.driverMap,
        "RideEnquiry_0": this.RideEnquiry_0,
        "RideEnquiry_2": this.RideEnquiry_2,
        "RideEnquiry_5": this.RideEnquiry_5,
        "RideEnquiry_6": this.RideEnquiry_6
    }
})();
