var Dialog = (function () {

    var request_data = {},
        listener = null;

    /**
    * @param string iri
    * @return string : nom de l'entité
    */
    this.entityShortName = function (iri) {
        if (typeof iri === 'undefined') {
            return true;
        } else {
            return iri.split('#')[1];
        }
    }

    /**
    * écouteur générique sous forme de chaîne de Promises
    * @return listener : écouteur
    */
    function listen() {
        console.log("Démarrage de l'écouteur de messages");
        console.log("Etat  : "+ window.driverStatus);
        listener = window.setInterval(function(){
            var method = pollRequest;
            // TODO : Ligne pas à sa place dans ce fichier
            if ($('.no-init').length > 0 && (typeof Driver !== 'undefined')) { method = Driver.driverMap; }
            Pins.gpsPicker()
            .then(Pins.positionMake, Pins.positionFail)
            .then(method, Pins.tacet);
        }, 1000);
        return listener;
    }

    /** Affichages des positions contenues dans les message
     * @param JSON-LD JSONData : le message envoyé par le serveur
     * @return boolean
     */
    function plot(JSONData) {
    	
        if (typeof JSONData['@graph'] === 'undefined') {
            if (entityShortName(JSONData['@type']) === 'Driver') {
            // if (typeof JSONData.name !== 'undefined') {
                console.log('chauffeur isolé');
                Pins.unMark();
                Pins.mark(JSONData);
            } else {
                console.log('Impossible d’interpréter le format de données');
            }
        } else {
            // var points = JSONData['@graph'].filter(function (objet) {return (typeof objet.name !== 'undefined')});
            var points = JSONData['@graph'].filter(function (objet) {return ( entityShortName(objet['@type']) === 'Driver'); });
            if (points.length > 0) {
                // TODO : la fonction plot n'affiche plus seulement les chauffeurs mais tous les
                // points envoyés par le serveur quelle que soit leur nature
                console.log(points.length.toString()+' chauffeur(s) en activité');
                Pins.repaint(points);
            } else {
                console.log('Aucun chauffeur à afficher sur la carte');
            }
        }
        $('#presents').html(Pins.markers.length + " chauffeur(s) en service");
    }

    /** Vérifie que le message envoyé par le serveur contient une indication de service
     * @param JSON-LD graphe : le message envoyé
     * @return JSON-LD
     */
    function containsService (graphe) {
        return graphe.filter(function (objet) { return ((entityShortName(objet['@type']) !== 'Driver') && (entityShortName(objet['@type']) !== 'Person')); });
    }

    /** Extrait le noyau du service envoyé de la liste des fragments qui le composent
     * @param JSON-LD fragments : le message envoyé
     * @return JSON-LD
     */
    function serviceCore (fragments) {
        return fragments.filter(function (objet) { return (typeof objet['@type'] !== 'undefined'); })
    }

    /** Analyse le message pour déterminer quel service est requis
     * @param JSON-LD graphe : le message envoyé
     */
    function serviceWorkflow(graphe) {
        console.log('Sélection du service à exécuter');
        var flattenedService = containsService(graphe);
        console.log(flattenedService);
        if (flattenedService.length > 0) {
            var message = (serviceCore(flattenedService))[0];
            var typeOfMessage = entityShortName(message['@type']);
            console.log(typeOfMessage+"_"+window.currentStatus);
            switch (typeOfMessage) {
                case 'RideEnquiry':
                    var todo = APP[typeOfMessage+"_"+window.currentStatus];
                    console.log(todo);
                    todo(graphe);
                    break;
                default:
                // TODO : Un message erroné peut indquer une désynchronisation du serveur et du client
                // Comment re-synch
                console.log("Aucune action trouvée pour : "+typeOfMessage)
            }
        } else {
            console.log("Aucun message de service transmis")
        }
    }

    /** Envoi au serveur de la structure "@id", "lat", "long" ;
     * rafraîchissement de la carte avec les positions reçues des autres personnes
     * @param profil une structure "@id", "lat", "long"
     */
    var pollRequest = function (profil) {
        console.log(profil);
        var position_data = '{}';
        var x = profil.lat;
        var y = profil.long;
        if ((typeof profil['@id'] !== 'undefined') && profil.error == 0) {
            position_data = JSON.stringify(current);
        }

        $('#derniere-update').html((new Date()).toLocaleTimeString());
        console.log("Envoi périodique des données : " + position_data);
        // $('header.entete').css('background-color', COULEURS_ERREURS[profil.error]);
        $.ajax({
                type: 'POST',
                url: SERVICE_PORT,
                data: position_data,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 4000
            }).done(function(data) {
                console.log("XHR returned");
                var JSONData = jQuery.parseJSON(data);
                console.log(JSONData);
                // Traitement des positions des chaffeurs
                plot(JSONData);
                // Traitement d'un éventuel message
                if (typeof JSONData['@graph'] !== 'undefined') {
                    serviceWorkflow(JSONData['@graph']);
                }
                var message = JSONData.message;
                $('.geo-error').detach();
                $('.entete p').removeClass('session-none session-offline');
                $('.entete p').addClass('session-info');
                $('.serveur-interruption').remove();
                // var statusManager = "statusManage_"+sessionStorage.getItem('driverStatus');
                // statusManager(message);
            }).fail(function (message) {
                console.log('XHR failed');
                $('.entete p').removeClass('session-info');
                $('.entete p').addClass('session-offline');
                console.log("L’URL /position n’a pas répondu dans le temps imparti");
                var message = "<h1 class='serveur-interruption geo-error'>Perturbation de la géo-localisation</h1>";
                if ($(".geo-error").length == 0) { $(".contenu").prepend(message) }
                console.log(message);
            }).always(function() {
                console.log('XHR passed');
            });
    }

    return {
        "entityShortName": this.entityShortName,
        "listen": function (service) { return listen(service); }
    }
})();
