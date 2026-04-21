import { useState } from "react";
import SearchBar from "./components/SearchBar";
import "./App.css";

/* ── Weather emoji helper ── */
function weatherIcon(condition, isNight = false) {
  const c = condition?.toLowerCase() || "";
  if (c.includes("thunderstorm")) return "⛈️";
  if (c.includes("drizzle"))      return "🌦️";
  if (c.includes("rain"))         return isNight ? "🌧️" : "🌧️";
  if (c.includes("snow"))         return "🌨️";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze")) return "🌫️";
  if (c.includes("cloud"))        return isNight ? "☁️" : "⛅";
  if (c === "clear")              return isNight ? "🌙" : "☀️";
  return "🌤️";
}

/* ── Format date helpers ── */
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MON_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDay(dt_txt) {
  const d = new Date(dt_txt);
  return DAY_NAMES[d.getDay()].slice(0, 3).toUpperCase();
}

function fmtDate(dt_txt) {
  const d = new Date(dt_txt);
  return `${d.getDate()} ${MON_NAMES[d.getMonth()]}`;
}

function fmtTime(unix, offset) {
  const d = new Date((unix + offset) * 1000);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/* ── Wind direction ── */
function windDir(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/* ── UV description ── */
function uvClass(uv) {
  if (uv <= 2)  return ["uv-low", "Low"];
  if (uv <= 5)  return ["uv-mod", "Moderate"];
  if (uv <= 7)  return ["uv-high", "High"];
  return ["uv-vhigh", "Very High"];
}

/* ── Bg class for current weather ── */
function bgClass(condition, isNight) {
  const c = condition?.toLowerCase() || "";
  if (c.includes("thunder")) return "weather-storm";
  if (c.includes("rain") || c.includes("drizzle")) return "weather-rain";
  if (c.includes("snow")) return "weather-snow";
  if (c.includes("cloud")) return "weather-clouds";
  if (c === "clear") return isNight ? "weather-clear-night" : "weather-clear-day";
  return "";
}

/* ────────────────────────────────────────
   HOME PAGE
─────────────────────────────────────── */
function HomePage({ onSearch, error, loading }) {
  const quickLinks = [
    { icon: "🌧️", title: "Precipitation Radar", desc: "See live rain & snow radar across the globe" },
    { icon: "🌡️", title: "Temperature Maps", desc: "High-resolution temperature charts for today" },
    { icon: "💨", title: "Wind Forecast", desc: "Speed and direction forecasts up to 5 days" },
    { icon: "⛅", title: "Cloud Cover", desc: "Hourly cloud coverage predictions" },
    { icon: "🌊", title: "Coastal & Marine", desc: "Wave height, sea temp and coastal forecasts" },
    { icon: "⚡", title: "Weather Warnings", desc: "Active weather warnings and alerts" },
  ];

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <span className="hero-badge">Official Forecast Service</span>
        <h1 className="hero-title">UK & World Weather</h1>
        <p className="hero-subtitle">
          Accurate, science-backed forecasts for any city worldwide
        </p>

        <div className="hero-search-wrap">
          <SearchBar
            onSearch={onSearch}
            placeholder="Search for a city or town…"
          />
          {error && <p className="hero-error">⚠️ {error}</p>}
          {loading && <p className="hero-error" style={{ color: "rgba(255,255,255,0.7)" }}>Fetching forecast…</p>}
          <p className="hero-hint">Try "London", "Tokyo" or "New York"</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="home-content">
        <h2 className="home-section-title">Explore Forecasts</h2>
        <div className="quick-links">
          {quickLinks.map((l) => (
            <div className="quick-link-card" key={l.title}>
              <span className="quick-link-icon">{l.icon}</span>
              <span className="quick-link-title">{l.title}</span>
              <span className="quick-link-desc">{l.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   WEATHER DETAIL PAGE
─────────────────────────────────────── */
function WeatherPage({ weather, forecast, onBack, onSearch, error}) {
  const condition   = weather.weather[0].main;
  const isNight     = weather.dt < weather.sys.sunrise || weather.dt > weather.sys.sunset;
  const heroBg      = bgClass(condition, isNight);
  const offset      = weather.timezone;

  // dedupe daily forecast (noon preferred)
  const dailyMap = {};
  forecast.forEach(item => {
    const day = item.dt_txt.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = item;
  });
  const daily = Object.values(dailyMap).slice(0, 6);

  // min/max temps per day
  const dailyMinMax = {};
  forecast.forEach(item => {
    const day = item.dt_txt.slice(0, 10);
    if (!dailyMinMax[day]) dailyMinMax[day] = { min: item.main.temp_min, max: item.main.temp_max };
    else {
      dailyMinMax[day].min = Math.min(dailyMinMax[day].min, item.main.temp_min);
      dailyMinMax[day].max = Math.max(dailyMinMax[day].max, item.main.temp_max);
    }
  });

  const humidity    = weather.main.humidity;
  const windSpeedMs = weather.wind.speed;
  const windSpeedKmh = Math.round(windSpeedMs * 3.6);
  const windDeg     = weather.wind.deg;
  const visibility  = weather.visibility ? Math.round(weather.visibility / 1000) : "—";
  const pressure    = weather.main.pressure;

  return (
    <div className="weather-page">
      {/* Top bar with back + search */}
      <div className="weather-topbar">
        <div className="weather-topbar-inner">
          <button className="back-btn" onClick={onBack}>
            ← Home
          </button>
          <SearchBar compact onSearch={onSearch} placeholder="Search another city…" />
        </div>
        {error && (
          <p style={{ textAlign: "center", color: "#ff6b6b", padding: "6px 0", fontSize: 14 }}>
            ⚠️ {error}
          </p>
        )}
    </div>

      {/* Current weather hero */}
      <div className={`current-weather-hero ${heroBg}`}>
        <div className="current-hero-inner">
          <div>
            <h1 className="city-name">{weather.name}</h1>
            <p className="city-country">{weather.sys.country} · {isNight ? "Night" : "Day"}</p>

            <div className="current-main">
              <span className="current-temp">{Math.round(weather.main.temp)}°</span>
              <span className="current-icon">{weatherIcon(condition, isNight)}</span>
            </div>

            <p className="current-desc">{weather.weather[0].description}</p>

            <div className="current-stats">
              <div className="stat-item">
                <span className="stat-label">High</span>
                <span className="stat-value">{Math.round(weather.main.temp_max)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Low</span>
                <span className="stat-value">{Math.round(weather.main.temp_min)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sunrise</span>
                <span className="stat-value">{fmtTime(weather.sys.sunrise, offset)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sunset</span>
                <span className="stat-value">{fmtTime(weather.sys.sunset, offset)}</span>
              </div>
            </div>
          </div>

          <div className="feels-like-box">
            <div className="feels-like-label">Feels like</div>
            <div className="feels-like-temp">{Math.round(weather.main.feels_like)}°</div>
            <div className="feels-like-small">°Celsius</div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", margin: "14px 0 10px" }}></div>
            <div className="feels-like-label">Local Time</div>
            <div className="feels-like-temp" style={{ fontSize: 26 }}>
              {fmtTime(weather.dt, offset)}
            </div>
            <div className="feels-like-small">
              UTC{offset >= 0 ? "+" : ""}{offset / 3600}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast section */}
      <div className="forecast-section">
        <h2 className="section-heading">5-Day Forecast</h2>
        <div className="forecast-grid">
          {daily.map((item, i) => {
            const day = item.dt_txt.slice(0, 10);
            const mm  = dailyMinMax[day] || {};
            const cond = item.weather[0].main;
            const night = false;
            return (
              <div className="forecast-card" key={item.dt}>
                <span className="forecast-day">{i === 0 ? "TODAY" : fmtDay(item.dt_txt)}</span>
                <span className="forecast-date">{fmtDate(item.dt_txt)}</span>
                <span className="forecast-icon">{weatherIcon(cond, night)}</span>
                <div className="forecast-temps">
                  <span className="forecast-high">{Math.round(mm.max ?? item.main.temp_max)}°</span>
                  <span className="forecast-low">{Math.round(mm.min ?? item.main.temp_min)}°</span>
                </div>
                <span className="forecast-desc">{item.weather[0].description}</span>
                <div className="forecast-detail">
                  <span>💧 {item.main.humidity}%</span>
                  <span>💨 {Math.round(item.wind.speed * 3.6)} km/h</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail cards */}
        <h2 className="section-heading" style={{ marginTop: 32 }}>Current Conditions</h2>
        <div className="info-grid">

          {/* Wind */}
          <div className="info-card">
            <div className="info-card-label">💨 Wind</div>
            <div className="info-card-value">{windSpeedKmh} <span style={{fontSize:16,fontWeight:400}}>km/h</span></div>
            <div className="info-card-sub">
              <span className="wind-arrow" style={{ transform: `rotate(${windDeg}deg)` }}>↑</span>
              {" "}{windDir(windDeg)} · gusts up to {Math.round((windSpeedMs + 2) * 3.6)} km/h
            </div>
          </div>

          {/* Humidity */}
          <div className="info-card">
            <div className="info-card-label">💧 Humidity</div>
            <div className="info-card-value">{humidity}<span style={{fontSize:16,fontWeight:400}}>%</span></div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${humidity}%` }}></div>
            </div>
            <div className="info-card-sub" style={{marginTop:6}}>
              {humidity < 40 ? "Dry" : humidity < 70 ? "Comfortable" : "Humid"}
            </div>
          </div>

          {/* Visibility */}
          <div className="info-card">
            <div className="info-card-label">👁 Visibility</div>
            <div className="info-card-value">{visibility} <span style={{fontSize:16,fontWeight:400}}>km</span></div>
            <div className="info-card-sub">
              {visibility >= 10 ? "Excellent" : visibility >= 5 ? "Good" : visibility >= 2 ? "Moderate" : "Poor"}
            </div>
          </div>

          {/* Pressure */}
          <div className="info-card">
            <div className="info-card-label">🔵 Pressure</div>
            <div className="info-card-value">{pressure} <span style={{fontSize:16,fontWeight:400}}>hPa</span></div>
            <div className="info-card-sub">
              {pressure > 1013 ? "High pressure – settled" : "Low pressure – unsettled"}
            </div>
          </div>

          {/* Sunrise/Sunset */}
          <div className="info-card">
            <div className="info-card-label">🌅 Sunrise / Sunset</div>
            <div className="sun-row" style={{margin:"10px 0"}}>
              <span className="sun-time">{fmtTime(weather.sys.sunrise, offset)}</span>
              <span className="sun-sep"></span>
              <span className="sun-time">{fmtTime(weather.sys.sunset, offset)}</span>
            </div>
            <div className="info-card-sub">Local time (UTC{offset >= 0 ? "+" : ""}{offset / 3600})</div>
          </div>

          {/* Cloudiness */}
          <div className="info-card">
            <div className="info-card-label">☁️ Cloud Cover</div>
            <div className="info-card-value">{weather.clouds?.all ?? "—"}<span style={{fontSize:16,fontWeight:400}}>%</span></div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${weather.clouds?.all || 0}%`, background: "linear-gradient(90deg, #6b7b8d, #a0aec0)" }}></div>
            </div>
            <div className="info-card-sub" style={{marginTop:6}}>
              {(weather.clouds?.all || 0) < 20 ? "Clear skies" : (weather.clouds?.all || 0) < 60 ? "Partly cloudy" : "Overcast"}
            </div>
          </div>

        </div>
      </div>

      <footer className="mo-footer">
        Data: <a href="https://openweathermap.org" target="_blank" rel="noreferrer">OpenWeatherMap</a>
        &nbsp;·&nbsp; Developed by Shagofa Qayoomi
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────
   ROOT APP
─────────────────────────────────────── */
function App() {
  const [weather,  setWeather]  = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [page,     setPage]     = useState("home"); // "home" | "weather"

  const handleSearch = async (city) => {
    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

      const [wRes, fRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
      ]);

      if (!wRes.ok) throw new Error("City not found. Please check the spelling and try again.");

      const [wData, fData] = await Promise.all([wRes.json(), fRes.json()]);

      setWeather(wData);
      // keep one entry per day at ~noon (or earliest available)
      setForecast(fData.list);
      setPage("weather");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPage("home");
    setWeather(null);
    setForecast([]);
    setError(null);
  };

  return (
    <>
      {/* Global header */}
      <header className="mo-header">
        <div className="mo-logo" onClick={handleBack}>
          <div className="mo-logo-mark">
            {/* Cloud / wave icon */}
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 20a6 6 0 1 1 6-6c0 .34-.03.67-.09 1H22a4 4 0 0 1 0 8H8z"/>
              <path d="M4 26c3 0 6-2 8-2s5 2 8 2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="mo-logo-text">Weather Dashboard</div>
            <div className="mo-logo-sub">Global Forecast Service</div>
          </div>
        </div>
      </header>

      {/* Pages */}
      {loading && (
        <div className="loading-wrap">
          <div className="loading-spinner"></div>
          <p className="loading-text">Fetching forecast…</p>
        </div>
      )}

      {!loading && page === "home" && (
        <HomePage onSearch={handleSearch} error={error} loading={loading} />
      )}

      {!loading && page === "weather" && weather && (
        <WeatherPage
          weather={weather}
          forecast={forecast}
          onBack={handleBack}
          onSearch={handleSearch}
          error={error}
        />
     )}
    </>
  );
}

export default App;