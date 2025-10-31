const API_KEY = "3da5b07faee1bcb1ec9587454037859f";

let watchId = null;
let startPosition = null;
let lastPosition = null;
let totalDistance = 0;
let route = [];

const display = document.getElementById("location-display");

async function processData(lat, lon) {
    try {
        const REVERSE_GEOCODING_API = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
        const response = await fetch(REVERSE_GEOCODING_API);
        const data = await response.json();

        const { name, country } = data[0];
        console.log(name, country);
    } catch (error) {
        alert(error.message);
    }
}

// the main function to start tracking

const startTracking = () => {
    if(!navigator.geolocation){
        alert("Geolocation is not supported by your browser");
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        async (position) => {
            console.log(position)
            const { latitude, longitude } = position.coords;
            const timeStamp = position.timestamp;
            // console.log(latitude, longitude, timeStamp)
            const currentPosition = { latitude, longitude, timeStamp};

            if (!startPosition){
                startPosition = currentPosition;
                lastPosition = currentPosition;
                route.push(currentPosition);

                const startName = await processData(latitude, longitude);
                
            }
        },
        (error) => {
            console.log(error)
        },
        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        }
    );
}

const stopTracking = () => {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        console.log("tracking stopped")
    }
};

// console.log(watchId)

document.querySelector('.start-btn').addEventListener('click', startTracking);
document.querySelector('.stop-btn').addEventListener('click', stopTracking);