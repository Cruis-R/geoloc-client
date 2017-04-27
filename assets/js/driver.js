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



    return {
        "driverMap": this.driverMap
    }
})();
