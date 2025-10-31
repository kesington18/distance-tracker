const API_KEY = "3da5b07faee1bcb1ec9587454037859f";

let watchId = null;
let startPosition = null;
let lastPosition = null;
let totalDistance = 0;
let route = [];

const display = document.getElementById("location-display");


// Calculates the distance between two coordinates using the Haversine formula
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

// the main function to start tracking

const startTracking = () => {
    if(!navigator.geolocation){
        alert("Geolocation is not supported by your browser");
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        async (position) => {
            // console.log(position)
            const { latitude, longitude } = position.coords;
            const timeStamp = position.timestamp;
            // console.log(latitude, longitude, timeStamp)
            const currentPosition = { latitude, longitude, timeStamp};

            try {
                if (!startPosition){
                startPosition = currentPosition;
                lastPosition = currentPosition;
                route.push(currentPosition);

                const startName = await processData(latitude, longitude);

                const { name, country } = startName[0];

                display.innerHTML = `<div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2 w-full mb-2">
                    <h1>Start:</h1>
                    <p> ${name}, ${country}</p>
                </div>`;
                return;
            };
            } catch (error) {
                console.log(error.message)
            }

            // calculate distance from last position to current position
            const segmentDistance= getDistanceInMeters(
                lastPosition.latitude,
                lastPosition.longitude,
                currentPosition.latitude,
                currentPosition.longitude
            );

            if(segmentDistance > 10){
                totalDistance += segmentDistance;
                route.push(currentPosition); // add current position to route
            }
            console.log(segmentDistance)

            lastPosition = currentPosition;

            const endPositionName = await processData(latitude, longitude);

            const { name, country } = endPositionName[0];

            display.innerHTML = `<div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2 w-full mb-2">
                <h1>Start:</h1>
                <p> ${startPosition.latitude.toFixed(4)}, ${startPosition.longitude.toFixed(4)}</p>
            </div>
            <div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2 w-full mb-2">
                <h1>End:</h1>
                <p> ${name}, ${country}</p>
            </div>`;

            document.querySelector('.total-distance').textContent = `${totalDistance.toFixed(2)} meters`;
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



// function to stop tracking
const stopTracking = async () => {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        // console.log("tracking stopped")
    }

    if (startPosition && lastPosition) {
        const finalDistance = getDistanceInMeters(startPosition.latitude, startPosition.longitude, lastPosition.latitude, lastPosition.longitude);

        const startName = await processData(startPosition.latitude, startPosition.longitude);
        const endPositionName = await processData(lastPosition.latitude, lastPosition.longitude);

        display.innerHTML += ` <h3>✅ Tracking Stopped</h3>
      <p><strong>🏁 Start:</strong> ${startName}</p>
      <p><strong>📍 End:</strong> ${endPositionName}</p>
      <p><strong>Straight-line Distance (Start → End):</strong> ${finalDistance.toFixed(2)} m</p>
      <p><strong>Total Path Distance:</strong> ${totalDistance.toFixed(2)} m</p>`;
    }


};

// console.log(watchId)

document.querySelector('.start-btn').addEventListener('click', startTracking);
document.querySelector('.stop-btn').addEventListener('click', stopTracking);