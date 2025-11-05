const API_KEY = "3da5b07faee1bcb1ec9587454037859f";

let watchId = null;
let startPosition = null;
let lastPosition = null;
let totalDistance = 0;
let route = [];
let startName = "";

const display = document.getElementById("location-display");

const showLoader = () => {
  display.innerHTML = `
    <div class="flex flex-col items-center justify-center w-full py-10">
      <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-gray-600 font-medium">Fetching your location...</p>
    </div>
  `;
};


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

const checkGpsAccuracy = () => {
    // 🌀 Show loader while waiting for first GPS fix
    showLoader();

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const accuracy = position.coords.accuracy;
        console.log("Initial GPS accuracy:", accuracy, "meters");

        if(accuracy > 50){
            // Weak GPS signal — stop here and show warning
        display.innerHTML = `  
            <div class="flex flex-col items-center justify-center bg-yellow-50 border border-yellow-400 rounded-lg shadow-md p-6 text-center transition-all duration-500 ease-in-out">
                <div class="text-5xl mb-3 animate-bounce">⚠️</div>
                <h2 class="text-xl font-bold text-yellow-700 mb-2">Weak GPS Signal</h2>
                <p class="text-gray-700 text-sm md:text-base">
                Please move <span class="font-semibold">outside</span> to get a stronger GPS connection.
                </p>
                <p class="mt-2 text-xs text-gray-500">(Accuracy: ${accuracy.toFixed(1)} meters)</p>
            </div>
            `;
            return; // stop here — no tracking
        };

        // ✅ Good GPS signal
        display.innerHTML = `
            <div class="flex flex-col items-center justify-center bg-green-50 border border-green-400 rounded-lg shadow-md p-6 text-center transition-all duration-500 ease-in-out">
            <div class="relative flex items-center justify-center mb-3">
                <div class="w-16 h-16 bg-green-400 rounded-full animate-ping opacity-60 absolute"></div>
                <div class="text-4xl relative z-10">✅</div>
            </div>
            <h2 class="text-lg font-bold text-green-700 mb-2">GPS Signal Good</h2>
            <p class="text-gray-700">Starting tracking...</p>
            <p class="mt-2 text-xs text-gray-500">(Accuracy: ${accuracy.toFixed(1)} m)</p>
            </div>
        `;

        // feedback ping for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(500);
        }

        // Wait briefly before starting tracking
        setTimeout(() => startTracking(), 800);
    }, (error) => {
        alert(`Error occurred. Error code: ${error.code}: ${error.message}`);
    }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    });
};

// the main function to start tracking
const startTracking = () => {
    if(!navigator.geolocation){
        alert("Geolocation is not supported by your browser");
        return;
    }


    watchId = navigator.geolocation.watchPosition(
        async (position) => {
            // console.log(position)
            const { latitude, longitude, accuracy } = position.coords;
            const timestamp = position.timestamp;
            // console.log(latitude, longitude, timestamp)

            if (accuracy > 50) return;

            const currentPosition = { latitude, longitude, timestamp };

            if (!startPosition){
                startPosition = currentPosition;
                lastPosition = currentPosition;
                route.push(currentPosition);

                // Fade out placeholder (if visible)
                const placeholder = document.getElementById("placeholder");
                if (placeholder) {
                placeholder.classList.add("opacity-0");
                setTimeout(() => placeholder.remove(), 700); // remove after fade completes
                }

                startName = await processData(startPosition.latitude, startPosition.longitude);
    
                display.innerHTML = `<h2 class="tracking-start border-green-500 border-2 w-full mb-2 p-2 opacity-0 transition-opacity duration-700 ease-in-out">📍Tracking started at ${startName[0].name}, ${startName[0].country}</h2>`;

                // Smooth fade-in effect for the new content
                setTimeout(() => {
                    document.querySelector(".tracking-start").classList.replace("opacity-0", "opacity-100");
                }, 100);

                return;
            };



            // calculate distance from last position to current position
            const segmentDistance= getDistanceInMeters(
                lastPosition.latitude,
                lastPosition.longitude,
                currentPosition.latitude,
                currentPosition.longitude
            );


            if(segmentDistance > 25){
                totalDistance += segmentDistance;
                route.push(currentPosition); // add current position to route
            }
            console.log(segmentDistance)

            lastPosition = currentPosition;

            document.querySelector('.total-distance').textContent = `${totalDistance.toFixed(2)} meters`;
        },
        (error) => {
            // console.log(error)
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request failed. please reset location permission to grant access and reload")
            }

            alert(`Error occurred. Error code: ${error.code}: ${error.message}`);
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
        console.log("tracking stopped")
    }

    display.innerHTML = "";

    try {
        if (startPosition && lastPosition) {
            const finalDistance = getDistanceInMeters(startPosition.latitude, startPosition.longitude, lastPosition.latitude, lastPosition.longitude);

            const endPositionName = await processData(lastPosition.latitude, lastPosition.longitude);

            const getFirstDate = new Date(startPosition.timestamp);
            const getLastDate = new Date(lastPosition.timestamp);



            const totalTime = calculateTotalTime(startPosition, lastPosition);

            const { averageSpeed, formattedPace} = calculateSpeedAndPace(startPosition, lastPosition, totalDistance);

            console.log(totalTime, finalDistance, totalDistance, averageSpeed, formattedPace);

            document.querySelector('.total-distance').textContent = `${totalDistance.toFixed(2)} meters`;

            display.innerHTML += `
                <div class="desc grid grid-cols-1 border-green-500 border-2 w-full mb-2  opacity-0 transition-opacity duration-700 ease-in-out summary-card">
                    <div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2">
                        <h2>Start To End</h2>
                        <p>${finalDistance.toFixed(2)} meters</p>
                    </div>

                    <div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2">
                        <h2>Time elapsed</h2>
                        <p class=" text-lg font-mono">${totalTime.formattedTime}</p>
                    </div>

                    <div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2">
                        <h2>Average Speed</h2>
                        <p>${averageSpeed.toFixed(2)} km/h</p>
                    </div>

                    <div class="text-desc flex justify-between items-center border-teal-500 border-2 p-2">
                        <h2>Average Pace</h2>
                        <p>${formattedPace}</p>
                    </div>

                    <div class="distance-location flex justify-between items-center border-purple-500 border-2 p-2">
                        <div>
                            <h2>${startName[0].name}</h2>
                            <br>
                            <h2>${getFirstDate.toLocaleString()}</h2>
                        </div>

                        <span> --> </span>
                        
                        <div>
                            <h2>${endPositionName[0].name}</h2>
                            <br>
                            <h2>${getLastDate.toLocaleString()}</h2>
                        </div>
                    </div>
                </div>
            `;

            // Smooth fade-in effect for the new content
            setTimeout(() => {
                document.querySelector(".summary-card").classList.replace("opacity-0", "opacity-100");
            }, 100);

        } else {
            display.innerHTML = `
                <div
                    id="placeholder"
                    class="flex flex-col items-center justify-center text-center bg-gray-50 border border-yellow-300 rounded-xl shadow-md p-6 w-full sm:w-3/4 md:w-1/2 transition-opacity duration-700 ease-in-out"
                >
                    <div class="text-6xl mb-4 animate-pulse">🗺️</div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">No Active Tracking</h2>
                    <p class="text-gray-600 text-sm md:text-base leading-relaxed">
                    Press 
                    <span class="text-blue-600 font-semibold">Start Tracking</span> 
                    to begin recording your journey.
                    </p>
                </div>
            `;
            return;
        }

        startPosition = null;
        lastPosition = null;
        totalDistance = 0;
        route = [];
        startName = "";

    } catch (error) {
        alert(error.message);
    }


};

// calculate total time between start and end timestamps
const calculateTotalTime = (startTime, endTime) => {
    const startTimestamp = new Date(startTime.timestamp);
    const endTimestamp = new Date(endTime.timestamp);

    const timeElapsed = endTimestamp.getTime() - startTimestamp.getTime();

    const hours = Math.floor((timeElapsed / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeElapsed / (1000 * 60)) % 60);
    const seconds = Math.floor((timeElapsed / 1000) % 60);

    // console.log(startTimestamp, endTimestamp, timeElapsed);

      // Format with leading zeros
    const format = num => String(num).padStart(2, "0");

    const formattedTime = `${format(hours)}:${format(minutes)}:${format(seconds)}`;

    return { hours, minutes, seconds, formattedTime };
}


// calculate average speed and pace
const calculateSpeedAndPace = (startPosition, lastPosition, totalDistance) => {

    let formattedPace = "0:00 min/km";
    let averageSpeed = 0;

    // checking if the distance is zero to avoid division by zero error
    if (totalDistance !== 0) {
        // To be implemented
        const totalSeconds = (lastPosition.timestamp - startPosition.timestamp) / 1000;
        const totalMinutes = totalSeconds / 60;
        const totalKm = totalDistance / 1000;
    
        // 🧠 Average speed (km/h)
        averageSpeed = (totalDistance / totalSeconds) * 3.6;
    
        // 🧠 Pace (min/km)
        const pace = totalMinutes / totalKm;
    
        // Convert to minutes and seconds for display
        const paceMinutes = Math.floor(pace);
        const paceSeconds = Math.floor((pace - paceMinutes) * 60);
    
        // Format pace as mm:ss
        formattedPace = `${paceMinutes}:${String(paceSeconds).padStart(2, '0')} min/km`;
        
    } else {
        formattedPace = "-min/km"
    }
    

    return { averageSpeed, formattedPace };

};

// console.log(watchId)

document.querySelector('.start-btn').addEventListener('click', checkGpsAccuracy);
document.querySelector('.stop-btn').addEventListener('click', stopTracking);