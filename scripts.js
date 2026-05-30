async function getWeather() {

    const location = document.getElementById("locationInput").value;

    if (!location) {
        alert("Please enter a city name");
        return;
    }

    const apiKey = "100ff91cff5f4d0a9ec122806263005";

    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}&aqi=yes`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        document.getElementById("weatherCard").style.display = "block";

        document.getElementById("city").innerText =
            `${data.location.name}, ${data.location.country}`;

        document.getElementById("temp").innerText =
            `${data.current.temp_c}°C`;

        document.getElementById("condition").innerText =
            `Condition: ${data.current.condition.text}`;

        document.getElementById("humidity").innerText =
            `Humidity: ${data.current.humidity}%`;

        document.getElementById("wind").innerText =
            `Wind Speed: ${data.current.wind_kph} km/h`;

    } catch (error) {
        alert("Could not fetch weather data.");
        console.log(error);
    }
}