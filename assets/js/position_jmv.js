var Pins = (function () {
    this.trafficMap = L.map('leafletmap');
    this.markers = [];

    /** Détection des possibilités du navigateur, puis lance la fonction donnée
     * avec en argument une structure "@id", "lat", "long"
    @param id id RDF de la personne localisée
    @param callback */
    function profileur (id, callback) {
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                function(position){
                    var x = position.coords.latitude;
                    var y = position.coords.longitude;
                    current = {"@id": id, "lat": position.coords.latitude, "long": position.coords.longitude};
                    callback(current);
                }
            );
        } else {
            callback({"@id": "Nobody", "lat": 0, "long": 0});
            alert('Pas de géolocalisation');
        }
        return current;
    }

    /** Rafraîchit la carte en enlevant les marqueurs précédents */
    function unMark() {
        Pins.markers.map(function(m) {
            trafficMap.removeLayer(m);
        });
        Pins.markers = [];
    }

    /** Pose une marque sur la carte
     * @param point une structure "@id", "lat", "long" */
    function mark(point) {
      // jmvanel: saltx etc ont l'air encore activés ???????
        let saltx = Math.random()
        let salty = Math.random()
        var marker = L.marker([point.lat + saltx, point.long + salty]).addTo(this.trafficMap);
        Pins.markers.push(marker);

        // jmvanel: TODO afficher name quand il est là, autrement id
        var re = new RegExp('(urn:user/)?(.+)');
        var matchId = re.exec(point['@id']);
        marker.bindPopup("<strong>"+matchId[2]+"</strong><br>est ici.").openPopup();
    }

    /** Initialisation de la carte
     * @param profil une structure "@id", "lat", "long" */
    function initMap(profil) {
        this.trafficMap.setView([profil.lat, profil.long], 9);
        var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        var osm = L.tileLayer(osmUrl, {
            attribution: osmAttrib,
            //  maxZoom: 18,
            //  id: 'mapbox.satellite',
            //  accessToken: 'pk.eyJ1IjoibWljaGVsY2FkZW5uZXMiLCJhIjoiY2luZDl6ZzJyMDA1NnZpbTU3aGpjNzQ0eCJ9.Q_E5sqe_rXa9uSuyxeMgBw'
        }).addTo(this.trafficMap);
        mark(profil);
        positionneur(profil);
    }

    /** Envoi au serveur de la structure "@id", "lat", "long" ;
     * rafraîchissement de la carte avec les positions reçues des autres personnes
     * @param profil une structure "@id", "lat", "long" */
    function positionneur (profil) {
        x = profil.lat;
        y = profil.long;
        id = profil['@id']
        // var position_data = `{"@context": "http://jmvanel.free.fr/contexts/geo.jsonld", "@id": "urn:user/${id}", "lat": ${x},"long": ${y}}`;
        var position_data = '{"@context": "http://jmvanel.free.fr/contexts/geo.jsonld", "@id": "urn:user/'+id+'", "lat": '+x+',"long": '+y+'}';
        $.ajax({
            type: 'POST',
            url:'http://localhost:9000/position',
            data: position_data,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).done(function(json_position) {
            var positions = jQuery.parseJSON(json_position);
            var points = positions['@graph'];
            unMark();

            // jmvanel: TODO ?? points.map(mark);
            points.map(function(p) {
                // console.log(p);
                mark(p);
            })
            // console.log(Pins.markers);
        })
    }

    return {
        // "profileur" : function (id, fonction) { return profileur(id, fonction) }
        "markers" : this.markers,
        "profileur" : function (id, callback) { return profileur(id, callback); },
        "initMap" : function (profil) { return initMap(profil); },
        "positionneur" : function (profil) { return positionneur(profil); }
    }
})();
