const driverStatus = {
    // Le chauffeur est inactif
    "IDLE": 0,
    // Le chauffeur a reçu une proposition de course
    "CANDIDATE_RIDE": 1,
    // Le chauffeur a accepté la course
    "ACCEPTED_RIDE": 2,
    // Le chauffeur est entré en contact avec le client
    "APPROACHING_DEPARTURE": 3,
    // Le chauffeur est entré en contact avec le client
    "PASSENGER_TOUCH": 4,
    // Le chauffeur est arrivé à destination
    "STARTED_RIDE": 5,
    // Le chauffeur est arrivé à destination
    "ARRIVAL_TOUCH": 6,
    // La course a été payée
    "PAID_RIDE": 7,
    // La course a été interrompue
    "DISMISSED_REQUEST": 8,
    // Le chauffeur est en pause
    "PAUSE_STATUS": 9,
    // Le chauffeur est indisponible
    "UNAVAILABLE_STATUS": 10,
    // La demande a été annulée
    "ABORTED_REQUEST": -1
};

const APP = Driver;

const USER_TYPE = "https://deductions.github.io/drivers.owl.ttl#Driver";

const SERVICE_PORT = "/position";
