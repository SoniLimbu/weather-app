// ⚠️ Client-side keys are always visible in devtools. For a real deployment,
// proxy this call through a small backend so the key isn't exposed in your repo.
const API_KEY = "100ff91cff5f4d0a9ec122806263005";
const BASE = "https://api.weatherapi.com/v1/forecast.json";

const els = {
  input: document.getElementById("locationInput"),
  geoBtn: document.getElementById("geoBtn"),
  unitC: document.getElementById("unitC"),
  unitF: document.getElementById("unitF"),
  stateMsg: document.getElementById("stateMsg"),
  content: document.getElementById("content"),
  place: document.getElementById("place"),
  date: document.getElementById("date"),
  condIcon: document.getElementById("condIcon"),
  temp: document.getElementById("temp"),
  condText: document.getElementById("condText"),
  feels: document.getElementById("feels"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  uv: document.getElementById("uv"),
  pressure: document.getElementById("pressure"),
  hourly: document.getElementById("hourly"),
  daily: document.getElementById("daily"),
  sky: document.getElementById("sky"),
};

let unit = "C";
let lastData = null;

els.input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") search(els.input.value.trim());
});

els.geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation isn't available in this browser.");
    return;
  }
  setState("Locating you…");
  navigator.geolocation.getCurrentPosition(
    (pos) => search(`${pos.coords.latitude},${pos.coords.longitude}`),
    () => setState("Couldn't get your location. Try searching a city instead.")
  );
});

els.unitC.addEventListener("click", () => setUnit("C"));
els.unitF.addEventListener("click", () => setUnit("F"));

function setUnit(u) {
  unit = u;
  els.unitC.classList.toggle("active", u === "C");
  els.unitF.classList.toggle("active", u === "F");
  if (lastData) render(lastData);
}

function setState(msg) {
  els.stateMsg.textContent = msg;
  els.stateMsg.classList.remove("hidden");
  els.content.classList.add("hidden");
}

async function search(query) {
  if (!query) return;
  setState("Loading sky data…");
  try {
    const url = `${BASE}?key=${API_KEY}&q=${encodeURIComponent(query)}&days=5&aqi=no&alerts=no`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      setState(data.error.message);
      return;
    }

    lastData = data;
    els.stateMsg.classList.add("hidden");
    els.content.classList.remove("hidden");
    render(data);
  } catch (err) {
    console.error(err);
    setState("Network error — check your connection and try again.");
  }
}

function render(data) {
  const cur = data.current;
  const loc = data.location;
  const isDay = cur.is_day === 1;

  themeSky(cur.condition.code, isDay);

  els.place.textContent = `${loc.name}, ${loc.country}`;
  els.date.textContent = new Date(loc.localtime).toLocaleDateString(undefined, {
    weekday: "long", month: "short", day: "numeric",
  });
  els.condIcon.src = "https:" + cur.condition.icon;
  els.condIcon.alt = cur.condition.text;

  const t = unit === "C" ? cur.temp_c : cur.temp_f;
  const f = unit === "C" ? cur.feelslike_c : cur.feelslike_f;
  els.temp.innerHTML = `${Math.round(t)}<sup>°${unit}</sup>`;
  els.condText.textContent = cur.condition.text;
  els.feels.textContent = `Feels like ${Math.round(f)}°${unit}`;

  els.humidity.textContent = `${cur.humidity}%`;
  els.wind.textContent = unit === "C" ? `${Math.round(cur.wind_kph)} km/h` : `${Math.round(cur.wind_mph)} mph`;
  els.uv.textContent = cur.uv;
  els.pressure.textContent = unit === "C" ? `${Math.round(cur.pressure_mb)} mb` : `${cur.pressure_in} in`;

  renderHourly(data);
  renderDaily(data.forecast.forecastday);
}

function renderHourly(data) {
  els.hourly.innerHTML = "";
  const nowEpoch = data.location.localtime_epoch;
  const allHours = data.forecast.forecastday.flatMap((d) => d.hour);
  const upcoming = allHours.filter((h) => h.time_epoch >= nowEpoch).slice(0, 24);

  upcoming.forEach((h) => {
    const time = new Date(h.time.replace(" ", "T"));
    const label = time.getHours() === new Date(nowEpoch * 1000).getHours() && time.getDate() === new Date(nowEpoch * 1000).getDate()
      ? "Now"
      : time.toLocaleTimeString(undefined, { hour: "numeric" });
    const t = unit === "C" ? h.temp_c : h.temp_f;

    const card = document.createElement("div");
    card.className = "hour-card";
    card.innerHTML = `
      <div class="h-time">${label}</div>
      <img src="https:${h.condition.icon}" alt="${h.condition.text}">
      <div class="h-temp">${Math.round(t)}°</div>
    `;
    els.hourly.appendChild(card);
  });
}

function renderDaily(days) {
  els.daily.innerHTML = "";
  days.forEach((d, i) => {
    const name = i === 0 ? "Today" : new Date(d.date + "T00:00").toLocaleDateString(undefined, { weekday: "short" });
    const hi = unit === "C" ? d.day.maxtemp_c : d.day.maxtemp_f;
    const lo = unit === "C" ? d.day.mintemp_c : d.day.mintemp_f;

    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <div class="d-name">${name}</div>
      <img src="https:${d.day.condition.icon}" alt="${d.day.condition.text}">
      <div class="d-cond">${d.day.condition.text}</div>
      <div class="d-range"><span>${Math.round(hi)}°</span><span class="lo">${Math.round(lo)}°</span></div>
    `;
    els.daily.appendChild(row);
  });
}

// --- ambient sky theming ---------------------------------------------------

function themeSky(code, isDay) {
  const root = document.documentElement.style;
  let a, b, mode;

  if (!isDay) {
    a = "#0B1739"; b = "#1E1440"; mode = "night";
  } else if ([1000].includes(code)) {
    a = "#3FA9D6"; b = "#1B5E8C"; mode = "clear";
  } else if ([1003, 1006, 1009, 1030, 1135, 1147].includes(code)) {
    a = "#5B7A99"; b = "#3E5570"; mode = "cloudy";
  } else if ([1063,1150,1153,1180,1183,1186,1189,1192,1195,1198,1201,1240,1243,1246,1273,1276].includes(code)) {
    a = "#1D5C63"; b = "#173B44"; mode = "rain";
  } else if ([1066,1069,1072,1114,1117,1210,1213,1216,1219,1222,1225,1237,1255,1258,1261,1264,1279,1282].includes(code)) {
    a = "#8FA6C2"; b = "#5A6B85"; mode = "snow";
  } else if ([1087,1273,1276,1279,1282].includes(code)) {
    a = "#2B2440"; b = "#171226"; mode = "storm";
  } else {
    a = "#3FA9D6"; b = "#3E2C6B"; mode = "clear";
  }

  root.setProperty("--sky-a", a);
  root.setProperty("--sky-b", b);
  buildParticles(mode);
}

function buildParticles(mode) {
  els.sky.innerHTML = "";
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (mode === "night") {
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("div");
      s.className = "particle star";
      const size = Math.random() * 2 + 1;
      s.style.width = s.style.height = `${size}px`;
      s.style.left = `${Math.random() * vw}px`;
      s.style.top = `${Math.random() * vh * 0.6}px`;
      s.style.animationDelay = `${Math.random() * 3}s`;
      els.sky.appendChild(s);
    }
  } else if (mode === "clear") {
    const ray = document.createElement("div");
    ray.className = "particle sunray";
    ray.style.width = ray.style.height = "260px";
    ray.style.top = "-60px";
    ray.style.right = "-40px";
    els.sky.appendChild(ray);
  } else if (mode === "cloudy" || mode === "storm") {
    for (let i = 0; i < 5; i++) {
      const c = document.createElement("div");
      c.className = "particle cloud-shape";
      const w = 120 + Math.random() * 100;
      c.style.width = `${w}px`;
      c.style.height = `${w * 0.4}px`;
      c.style.borderRadius = "50%";
      c.style.top = `${Math.random() * vh * 0.5}px`;
      c.style.animationDuration = `${30 + Math.random() * 20}s`;
      c.style.animationDelay = `-${Math.random() * 30}s`;
      els.sky.appendChild(c);
    }
  } else if (mode === "rain") {
    for (let i = 0; i < 60; i++) {
      const d = document.createElement("div");
      d.className = "particle drop";
      d.style.height = `${20 + Math.random() * 30}px`;
      d.style.left = `${Math.random() * vw}px`;
      d.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
      d.style.animationDelay = `-${Math.random() * 2}s`;
      els.sky.appendChild(d);
    }
  } else if (mode === "snow") {
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("div");
      s.className = "particle star";
      const size = Math.random() * 3 + 2;
      s.style.width = s.style.height = `${size}px`;
      s.style.left = `${Math.random() * vw}px`;
      s.style.top = `${Math.random() * vh}px`;
      s.style.opacity = "0.8";
      s.style.animation = `fall ${5 + Math.random() * 5}s linear infinite`;
      s.style.animationDelay = `-${Math.random() * 5}s`;
      els.sky.appendChild(s);
    }
  }
}

// Default city on first load
search("Kathmandu");