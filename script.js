// Get input element
const input = document.getElementById("locationInput");

// Allow Enter key to search
input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        getWeather();
    }
});

async function getWeather() {

    const city = input.value.trim();

    // Prevent empty search
    if (city === "") {
        alert("Please enter a city name");
        return;
    }

    // ⚠️ Replace this with your REAL API key
    const apiKey = "100ff91cff5f4d0a9ec122806263005";

    const url =
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=yes`;

    try {

        // Show loading state
        document.getElementById("weatherCard").style.display = "block";
        document.getElementById("city").innerText = "Loading...";

        const response = await fetch(url);
        const data = await response.json();

        // Debug (important for fixing API issues)
        console.log(data);

        // Handle API errors
        if (data.error) {
            alert(data.error.message);
            return;
        }

        // Show weather data
        document.getElementById("city").innerText =
            `${data.location.name}, ${data.location.country}`;

        document.getElementById("temp").innerText =
            `${data.current.temp_c}°C`;

        document.getElementById("condition").innerText =
            data.current.condition.text;

        document.getElementById("humidity").innerText =
            `Humidity: ${data.current.humidity}%`;

        document.getElementById("wind").innerText =
            `Wind: ${data.current.wind_kph} km/h`;

        // Weather icon
        document.getElementById("weatherIcon").src =
            "https:" + data.current.condition.icon;

    } catch (error) {
        console.log(error);
        alert("Network error or API problem");
    }
}