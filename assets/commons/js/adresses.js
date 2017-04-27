var Adresses = (function () {
    // 'use strict';
    /*browser: true */
    /*global $ */

    this.addressServer = 'https://api-adresse.data.gouv.fr/search/?';
    this.reverseServer = 'https://api-adresse.data.gouv.fr/reverse/?';

    /** Suggestion d'une adresse en fonction de fragments de texte saisis ;
     * Utilisation du service public BANO
     * Version jQuery (reste problématique)
     * @param string fragment : fragment de texte saisi par l'utilisateur
     * @param string liste : id CSS du widget qui contient l'adresse saisie
     */
    function suggest(fragment, liste) {
        $.ajax({
            type: 'GET',
            url: this.addressServer + "q=" + fragment + "&limit=10",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                // 'Access-Control-Request-Method': 'GET',
                // 'Access-Control-Request-Headers': 'X-PINGOTHER',
                // 'X-PINGOTHER': 'pingpong',
            },
            // jmv: TODO nombre en dur
            timeout: 4000
        }).done(function (json_response) {
            var reponse = jQuery.parseJSON(json_response);
            console.log(reponse.features);
            var suggestions = $('#'+liste);
            suggestions.empty();
            reponse.features.forEach(function (lieu) {
                var adresse = $('<option value="'+ lieu.properties.label +'"/>');
                suggestions.append(adresse);
            })
        }).fail(function() {
        }).always(function() {
        })
    }

    /** Utilitaire pour créer un objet XMLHttpRequest compatible avec CORS ;
     * @param string method : méthode HTTP utilisée
     * @param string url : URL cible de la requête
     * @return [Object XMLHttpRequest]
     */
    var createCORSRequest = function(method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            xhr.open(method, url, true);
            // Most browsers.
        } else if (typeof XDomainRequest != "undefined") {
            // IE8 & IE9
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            // CORS not supported.
            xhr = null;
        }
        return xhr;
    }

    /**
     * Affiche un marqueur pour signaler une étape sur la carte
     * @param string lat : latitude
     * @param string lng : longitude
     * @param string etape : classe d'étape (départ, arrivée, ou étape intermédiaire)
     * @version 1.0
     */
    function markEtape(lat, lng, etape) {
        Pins.markJourney({"lat": lat, "lng": lng}, etape);

        if ($("#adresse-depart").data('lat') && $("#adresse-arrivee").data('lat')) {
            L.Routing.control({
                waypoints: [
                    L.latLng($("#adresse-depart").data('lat'), $("#adresse-depart").data('lng')),
                    L.latLng($("#adresse-arrivee").data('lat'), $("#adresse-arrivee").data('lng'))
                ],
                routeWhileDragging: true
            }).addTo(Pins.trafficMap);
        }
    }

    /** Suggestion d'une adresse en fonction de fragments de texte saisis ;
     * Utilisation du service public BANO
     * Version Vanilla JS
     * @param string fragment : fragment de texte saisi par l'utilisateur
     * @param string liste : id CSS du widget qui contient l'adresse saisie
     */
    function suggestXHR (fragment, liste) {
        var url = 'https://api-adresse.data.gouv.fr/search/?q='+fragment+"&limit=10";
        var method = 'GET';
        var xhr = createCORSRequest(method, url);

        xhr.onload = function(event) {
            console.log(this.response);
            var reponse = jQuery.parseJSON(this.response);
            console.log(reponse.features);
            var suggestions = $('#'+liste);
            suggestions.empty();
            reponse.features.forEach(function (lieu) {
                var coordinates = lieu.geometry.coordinates;
                console.log(coordinates);
                var lat = lieu.geometry.coordinates[1];
                var lng = lieu.geometry.coordinates[0];
                console.log(lat+ " "+lng);
                var adresse = $('<li class="location-suggestion" data-lat="' + lat +'" data-lng="' + lng +'">'+ lieu.properties.label +'</li>');
                suggestions.append(adresse);
            })
        };

        xhr.onerror = function() {
            // Error code goes here.
        };

        xhr.send();
    }

    /** Suggestion d'une adresse en fonction des coordonnées GPS ;
     * Utilisation du service public BANO
     * @param [Object {"lat": "", "lng":""}] position : Coordonnées du point à identifier
     */
    function addressXHR (position) {
        console.log(position);
        var url = 'https://api-adresse.data.gouv.fr/reverse/?lon='+position.long+'&lat='+ position.lat;
        var method = 'GET';
        var xhr = createCORSRequest(method, url);

        xhr.onload = function(event) {
            // console.log(this.response);
            var reponse = jQuery.parseJSON(this.response);
            var adresse = reponse.features[0];
            window.inputHasFocus.val(adresse.properties.label);
            window.inputHasFocus.data('lat', adresse.geometry.coordinates[1]);
            window.inputHasFocus.data('lng', adresse.geometry.coordinates[0]);
            Pins.trafficMap.setView([adresse.geometry.coordinates[1],adresse.geometry.coordinates[0]], 16);
            markEtape(adresse.geometry.coordinates[1], adresse.geometry.coordinates[0], window.inputHasFocus.prop('id').slice(8,9))
            window.inputHasFocus = $("#adresse-arrivee");
        };

        xhr.onerror = function() {
            // Error code goes here.
        };

        xhr.send();
    }

    function suggestGPS (adresse) {

    }



    return {
        "suggest" : function (fragment, liste) { return suggestXHR(fragment, liste); },
        "address" : function (position) { return addressXHR(position); },
        "markEtape" : function (lat, lng, etape) { return markEtape(lat, lng, etape); },
    }
})();
