const API_KEY = "3da5b07faee1bcb1ec9587454037859f";
const display = document.getElementById("location-display");
const placeHolder = document.getElementById("placeholder");

let watchId = null;
let startPosition = null;
let lastPosition = null;
let totalDistance = 0;
let route = [];
let startName = "";
let endName = "";

// const lastPosition =  { lat: 6.605874, lon: 3.349149 }; 
// const currentPosition = { lat: 6.50837, lon: 3.384247 }; 

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

    navigator.geolocation.getCurrentPosition( (position) => {
        const { latitude, longitude, accuracy }  = position.coords;
        const timestamp  = position.timestamp;
        console.log(latitude, longitude, accuracy, timestamp);

        if (accuracy > 100){
            alert(`GPS accuracy is low: ${accuracy} meters. Please try again.`);
            return;
        } 

        navigator.vibrate(500);

        startTracking();
        // const userData = processData( latitude, longitude );
        // display.innerHTML = `<div>${userData[0].name}</div>`;
    }, (error) => {
        // throw new Error(`Error Code = ${error.code} - ${error.message}`);
        alert(`Error Code = ${error.code} - ${error.message}`);
    }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    })
}

const startTracking = () => {
    if (!navigator.geolocation) {
        console.log("Geolocation is not supported by your browser");
        return;
    }

    watchId = navigator.geolocation.watchPosition( async (position) => {
        const {latitude, longitude} = position.coords;
        const timestamp = position.timestamp;

        let currentPosition = {latitude, longitude, timestamp};

        if (!startPosition) {
            startPosition = currentPosition;
            lastPosition = currentPosition;
            route.push(currentPosition);

            startName = await processData( startPosition.latitude, startPosition.longitude );

            placeHolder.classList.toggle("hidden")

            display.innerHTML = `<div class="bg-indigo-400 text-white p-2 w-full">Tracking started at: ${startName[0].name}, ${startName[0].country}</div>`;

            return;
        }

        const segmentDistance = getDistanceInMeters( lastPosition.latitude, lastPosition.longitude, currentPosition.latitude, currentPosition.longitude );

        if( segmentDistance > 25 ) {
            totalDistance += segmentDistance;
            route.push(currentPosition);
        }

        lastPosition = currentPosition;

    }, (error) => {
        if (error.code === error.PERMISSION_DENIED) {
            alert("Geolocation request failed. please reset location permission to grant access and reload")
        }

        alert(`Error Code = ${error.code} - ${error.message}`);
    }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    })

}

const getTotalTime = (startTime, endTime) => {
    const startTimeStamp = new Date(startTime);
    const endTimestamp = new Date(endTime);

    const diffInTime = endTimestamp.getTime() - startTimeStamp.getTime();
    const totalSeconds = Math.floor(diffInTime / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);

    const formattedTime = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;

    return { formattedTime, totalMinutes };
}

const getPace = ( totalDistanceInKilometers, totalMinutes ) => {
    let formattedPace = "0:00 min/km";

    if (totalDistanceInKilometers !== 0) {
        const paceInMinutesPerKilometer = totalMinutes / totalDistanceInKilometers;

        const minutes = Math.floor(paceInMinutesPerKilometer);
        const seconds = Math.floor((paceInMinutesPerKilometer - minutes) * 60);

        formattedPace = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} min/km`;
    } else{
        formattedPace = "-min/km";
    }

    return formattedPace;
}

const stopTracking = async () => {
    if( watchId !== null ) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    display.innerHTML = "";

    try {
        if (startPosition && lastPosition) {
            const staightDistance = getDistanceInMeters( startPosition.latitude, startPosition.longitude, lastPosition.latitude, lastPosition.longitude );

            const getDate = new Date(startPosition.timestamp);


            endName = await processData( lastPosition.latitude, lastPosition.longitude );

            const { formattedTime, totalMinutes } = getTotalTime( startPosition.timestamp, lastPosition.timestamp );

            const formattedPace = getPace( (totalDistance / 1000), totalMinutes );


            placeHolder.classList.toggle("hidden");

            display.innerHTML += `
                <div class="desc grid grid-cols-1 border-green-500 border-2 w-full mb-2">
                    <div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2">
                        <h2>Start To End</h2>
                        <p>${(staightDistance / 1000).toFixed(2)} kilometers</p>
                    </div>

                    <div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2">
                        <h2>Time elapsed</h2>
                        <p class=" text-lg font-mono">${formattedTime}</p>
                    </div>

                    <div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2">
                        <h2>Average Pace</h2>
                        <p>${formattedPace}</p>
                    </div>

                    <div class="distance-location flex flex-col items-center border-purple-500 border-2 p-2">
                        <div class="locations flex justify-between items-center">
                            <h2>${startName[0].name}</h2>
                            <span> --> </span>
                            <h2>${endName[0].name}</h2>
                        </div>

                        <h2 class="text-desc p-2 w-full ">${getDate.toLocaleString()}</h2>
                    </div>
                </div>
            `;
        } else {
            placeHolder.classList.remove("hidden");
            return;
        }

        startPosition = null;
        lastPosition = null;
        totalDistance = 0;
        route = [];
        startName = "";

    } catch (error) {
        alert(error)
    }
}

// console.log(segmentDistance)

// dom eventlisteners for start button and stop button
document.querySelector(".start-btn").addEventListener("click", checkGpsAccuracy );
document.querySelector(".stop-btn").addEventListener("click", stopTracking );