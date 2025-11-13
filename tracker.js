const API_KEY = "3da5b07faee1bcb1ec9587454037859f";
const display = document.getElementById("location-display");

let totalDistance = 0;

const lastPosition =  { lat: 6.605874, lon: 3.349149 }; 
const currentPosition = { lat: 6.50837, lon: 3.384247 }; 

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371000;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


async function processData(lat, lon) {
    try {
        const REVERSE_GEOCODING_API = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const response = await fetch(REVERSE_GEOCODING_API);
        const data = await response.json();

        return data;

        // const { name, country } = data[0];
        // console.log(name, country);
    } catch (error) {
        alert(error.message);
    }
}

const checkGpsAccuracy = () => {
    if (!navigator.geolocation){
        alert("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude, accuracy }  = position.coords;
        const timestamp  = position.timestamp;
        console.log(latitude, longitude, accuracy, timestamp);

        if (accuracy > 100){
            alert(`GPS accuracy is low: ${accuracy} meters. Please try again.`);
            return;
        } 

        navigator.vibrate(500);

        const userData = processData( latitude, longitude );
        display.innerHTML = `<div>${userData}</div>`;
    }, (error) => {
        // throw new Error(`Error Code = ${error.code} - ${error.message}`);
        alert(`Error Code = ${error.code} - ${error.message}`);
    }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    })
}

// const startTracking = () => {
//     if (!navigator.geolocation) {
//         console.log("Geolocation is not supported by your browser");
//         return;
//     }

//     const watchId = navigator.geolocation.watchPosition(() => {

//     }, () => {

//     })

// }


const segmentDistance= getDistanceInMeters( lastPosition.lat, lastPosition.lon, currentPosition.lat, currentPosition.lon );
    
totalDistance += segmentDistance;
// console.log(segmentDistance)

document.querySelector(".start-btn").addEventListener("click", checkGpsAccuracy );