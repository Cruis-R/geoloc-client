var Pins = (function () {
    // 'use strict';

    const ACK = 0,
          COORDS_NOT_FOUND = 1,
          COORDS_NOT_STORED = 2,
          NO_GEOLOCATION = 3;

    this.trafficMap = L.map('leafletmap');
    this.markers = [];
    this.me = null;

    /**
     * Fonction exécutée lorsque les coordonnées GPS ont bien été récupérées par l'application
     * @param Geolocation position
     * @return Promise
     */
    this.positionMake = function (position) {
        console.log("GPS")
        console.log(position);
        return new Promise(function (resolve, reject) {
            var x = position.coords.latitude;
            var y = position.coords.longitude;
            current = {
                "@context": "https://deductions.github.io/drivers.context.jsonld",
                "@type": USER_TYPE,
                "lat": position.coords.latitude,
                "long": position.coords.longitude,
                "timestamp": Math.round(new Date().getTime()),
                "@id" : id,
                "error": ACK
            };
            if (deviceDetector.isMobile) {
                // TODO : Nourrir localStorage lors de l'inscription
                current["@id"] = id;
                // current["@id"] = localStorage.getItem('id');
            }
            if(typeof sessionStorage != 'undefined') {
                sessionStorage.setItem('phileasPosition', JSON.stringify(current));
                console.log('stored');
                console.log(sessionStorage.getItem('phileasPosition'));
            } else {
                console.log("sessionStorage n'est pas supporté");
            }
            resolve(current);
        })
    }

    /**
     * Fonction exécutée lorsque les coordonnées GPS n'ont pu être récupérées par l'application
     * @param Geolocation position
     * @return Promise
     */
    this.positionFail = function(err){
        console.log("No GPS")
        console.log(err);
        return new Promise(function (resolve, reject) {
            var current;
            console.log("Erreur de géolocalisation");
            if(typeof sessionStorage !== 'undefined') {
                current = JSON.parse(sessionStorage.getItem('phileasPosition'));
                if (current == null) current = {};
                current.error = COORDS_NOT_FOUND;
                if (typeof current.timestamp == 'undefined') {
                    current.lat = DEF_LATITUDE;
                    current.long = DEF_LONGITUDE;
                }
                current.timestamp = Math.round(new Date().getTime());
                sessionStorage.setItem('phileasPosition',JSON.stringify(current));
            } else {
                current = {
                    "@context": "https://deductions.github.io/drivers.context.jsonld",
                    "@type": USER_TYPE,
                    "lat": DEF_LATITUDE,
                    "long": DEF_LONGITUDE,
                    "error": COORDS_NOT_STORED
                };
                if (deviceDetector.isMobile) {
                    current["@id"] = window.id
                }
                console.log("sessionStorage n'est pas supporté");
            }
            reject(err);
        })
    }

    /**
     *Calcul de la distance en kilomètres entre deux points décrits
     * par leurs coordonnées GPS
     * @param Object point1 premier point
     * @param Object point2 second point
     * @return float
     */
    function distance(point1, point2) {
        const RT = 6371;
        const RX = Math.PI / 180;

        var latitude1 = point1.lat * RX;
        var latitude2 = point2.lat * RX;
        var longitude1 = point1.long * RX;
        var longitude2 = point2.long * RX;

        return RT * Math.acos(Math.cos(latitude1) * Math.cos(latitude2) * Math.cos(longitude2 - longitude1) + Math.sin(latitude1) * Math.sin(latitude2));
    }

    /**
     * Affiche un message d'erreur si la localisation échoue à l'ouverture de l'application
     * @param err : le message d'erreur engendré par la géolocalisation
     */
    this.warning = function (err) {
        var message = "<h1 class='no-init geo-error'>Votre terminal est en cours de géo-localisation</h1>";
        console.log(err);
        displayAlertNoGPS(message);
        return new Promise (function (resolve, reject) {
            reject(err)
        })
    }

    function displayAlertNoGPS (message) {
        if ($(".contenu .no-init").length == 0) { $(".contenu").prepend(message) }
        $('.entete p').removeClass('session-info');
        $('.entete p').addClass('session-none');
    }

    /**
     * Détection des possibilités du navigateur, puis lance la fonction donnée
     * avec en argument une structure "@id", "lat", "long"
     * @param id id RDF de la personne localisée
     * @param callback
     */
    function gpsPicker () {
    	console.log("try to get device's geolocation");
        return new Promise(function (resolve, reject) {
            if(navigator.geolocation){
            	console.log('Avoir le géolocalisation');
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {timeout: 10000}
                );
            } else {
            	console.log('Pas de géolocalisation');
                reject({"lat": DEF_LATITUDE, "long": DEF_LONGITUDE, "error": NO_GEOLOCATION});
            }
        })
    }

    /**
     * Rafraîchit la carte en enlevant les marqueurs précédents
     */
    function unMark() {
        Pins.markers.map(function(m) {
            trafficMap.removeLayer(m);
        });
        Pins.markers = [];
    }

    /** Pose une marque sur la carte
     * @param point une structure "@id", "lat", "long"
     */
    function mark(point) {
        if (point['@id']) {
            console.log(point);
            var marker = L.marker([point.lat, point.long]).addTo(this.trafficMap);
            Pins.markers.push(marker);
                if (point.name) {
                var label = point.name;
            } else {
                var label = point['@id'];
            }
            if (point.error) {
                var msg = "<strong>" + label + "</strong> n’a pas pu être localisé"
            } else {
                var msg = "<strong>"+label+"</strong><br>est ici."
            }
            marker.bindPopup(msg);
            /*L'ouverture du label provoque le déplacement de la carte .openPopup()*/
        }
    }

    /** Rafraîchit l'affichagede la position des chauffeurs à chaque requête
     * @param [Object {"lat", "long"}] points : Coordonnées des points à afficher
     */
    function repaint(points) {
        console.log('refreshing positions');
        console.log(points);
        unMark();
        points.map(function(p) {
            console.log("  point " + p["@id"]);
            mark(p);
        })
    }

    /** Pose une marque sur la carte pour l'extrêmité d'un trajet
     * @param [Object {"lat", "long"}] point : Coordonnées du point à afficher
     @ @param string type : Départ, Etape ou Arrivée
     */
    function markStep(point, type) {
        console.log('extrémité : '+type);
        var marker = L.marker([point.lat, point.lng]).addTo(this.trafficMap);
        switch (type) {
            case 'e':
                label = "Etape";
                break;
            case 'a':
                label = "Arrivée";
                break;
            case 'd':
            default:
            label = "Départ";
        }
        var msg = "<strong>"+label+"</strong>";
        /*L'ouverture du label provoque le déplacement de la carte */
        marker.bindPopup(msg).openPopup();
    }

    /** Initialisation de la carte à une position donnée ;
     * @param profil une structure "@id", "lat", "long"
     */
    this.initMap = function(lat, long) {
        this.trafficMap.setView([lat, long], DEF_ZOOM);
        console.log("Carte recentrée : " + lat + " " + long + " : " + DEF_ZOOM);
        var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
        var osm = L.tileLayer(osmUrl, {
            attribution: osmAttrib,
            //  maxZoom: 18,
            //  id: 'mapbox.satellite',
            //  accessToken: 'pk.eyJ1IjoibWljaGVsY2FkZW5uZXMiLCJhIjoiY2luZDl6ZzJyMDA1NnZpbTU3aGpjNzQ0eCJ9.Q_E5sqe_rXa9uSuyxeMgBw'
        }).addTo(this.trafficMap);
    }

    /** Initialisation et affichage de la carte du le terminal du chauffeur ;
    * @param Object erreur : Le message renvoyé par le GPS
    */
    var warningMap = function (erreur) {
        return new Promise(function (resolve, reject) {
            if (profil.error == 0) {
                initMap(profil.lat, profil.long);
                // TODO : Afficher la position de user
                console.log(profil);
                mark({
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

    /** log d'un message d'erreur
    * @param message Le message d'erreur transmis par le GPS
    */
    function tacet(err) {
        console.log("Echec du cycle d'affichage");
        console.log(err);
        var message = "<div class='gps-interruption geo-error'><h1>Perturbation de la géo-localisation</h1><p><em>"+err.message+"</em></p></div>";
        if ($(".gps-interruption").length == 0) { $(".contenu").prepend(message) }
        $('.entete p').removeClass('session-info');
        $('.entete p').addClass('session-none');
        return {};
    }

    return {
        "markers" : this.markers,
        "trafficMap" : this.trafficMap,
        "positionMake": this.positionMake,
        "positionFail": this.positionFail,
        "warning": this.warning,
        "initMap": this.initMap,
        // "positionMake": function (position) { return new Promise( function(resolve, reject) {current = getPosition(position); resolve(current);}) },
        "gpsPicker" : function (id, callback) { return gpsPicker(id, callback); },
        // "passengerMap" : function (profil) { return passengerMap(profil); },
        "unMark" : function (point) { return unMark(point); },
        "mark" : function (point) { return mark(point); },
        "markJourney" : function (point, type) { return markStep(point, type); },
        "repaint" : function (points) { return repaint(points); },
        "tacet" : function (message) { return tacet(message); },
    }
})();
