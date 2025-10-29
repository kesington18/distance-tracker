const API_KEY = "3da5b07faee1bcb1ec9587454037859f";

let watchId;

const startTracking = () => {
    // if (navigator.geolocation) {
    //     navigator.geolocation.watchPosition((position) => {
    //         const { latitude, longitude } = position.coords;
    //         console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
    //     });
    // } else {
    //     console.error("Geolocation is not supported by this browser.");
    // }

    // console.log(navigator.geolocation)

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            // console.log(position)
            const { latitude, longitude } = position.coords;
            // console.log(latitude, longitude)

            const REVERSE_GEOCODING_API = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`

            async function processData(url) {
                try {
                    const response = await fetch(url);
                    const data = await response.json();

                    // console.log(data)
                    const { name, country } = data[0];
                    console.log(name, country)
                } catch (error) {
                    alert(error.message);
                }
            }

            processData(REVERSE_GEOCODING_API);
        },
        (error) => {
            console.log(error)
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// console.log(watchId)

document.querySelector('.start-btn').addEventListener('click', startTracking);