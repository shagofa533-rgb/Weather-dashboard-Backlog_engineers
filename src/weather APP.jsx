import { useState, useEffect, useRef } from "react";
import SearchBar from "./components/SearchBar";
import TemperatureMap from "./TemperatureMap";
import WeatherWarnings from "./WeatherWarnings";
import WindForecast from "./WindForecast";
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
    if (c.includes("thunder"))                         return "weather-storm";
    if (c.includes("rain") || c.includes("drizzle"))  return isNight ? "weather-rain weather-rain-night" : "weather-rain";
    if (c.includes("snow"))                            return "weather-snow";
    if (c.includes("mist") || c.includes("fog") || c.includes("haze")) return "weather-mist";
    if (c.includes("cloud"))                           return "weather-clouds";
    if (c === "clear")                                 return isNight ? "weather-clear-night" : "weather-clear-day";
    return "weather-clear-day";
}

/* ── Sky Scene — animated elements layered behind hero content ── */
function SkyScene({ condition, isNight }) {
        const c = condition?.toLowerCase() || "";

        /* ── CLEAR NIGHT: stars + shooting star ── */
        if (c === "clear" && isNight) {
        return (
      <>
        <div className="sky-stars" />
        <div className="sky-shooting-star" />
      </>
        );
        }

        /* ── CLEAR DAY: clouds + sun glow (sun is CSS ::after) ── */
        if (c === "clear" && !isNight) {
        const clouds = [
        { w:180, h:48, top:"18%", left:"-5%",  dur:"55s", delay:"0s",   op:0.75 },
        { w:140, h:38, top:"30%", left:"-8%",  dur:"75s", delay:"12s",  op:0.6  },
        { w:220, h:56, top:"10%", left:"-10%", dur:"90s", delay:"25s",  op:0.5  },
        ];
        return (
<>
{clouds.map((cl, i) => (
        <div key={i} className="sky-cloud" style={{
        width: cl.w, height: cl.h,
        top: cl.top, left: cl.left,
        opacity: cl.op,
        animationDuration: cl.dur,
        animationDelay: cl.delay,
          }} />
        ))}
      </>
        );
        }

        /* ── RAIN: falling raindrops ── */
        if (c.includes("rain") || c.includes("drizzle")) {
        const drops = Array.from({ length: 80 }, (_, i) => ({
left:   `${Math.random() * 100}%`,
height: `${12 + Math.random() * 22}px`,
dur:    `${0.55 + Math.random() * 0.6}s`,
delay:  `${(Math.random() * 1.5).toFixed(2)}s`,
opacity: 0.35 + Math.random() * 0.45,
        }));
        return (
      <div className="sky-rain">
        {drops.map((d, i) => (
          <div key={i} className="sky-raindrop" style={{
left: d.left, height: d.height,
animationDuration: d.dur,
animationDelay: d.delay,
opacity: d.opacity,
        }} />
        ))}
      </div>
        );
        }

        /* ── SNOW: falling snowflakes ── */
        if (c.includes("snow")) {
        const flakes = Array.from({ length: 45 }, (_, i) => ({
left:  `${Math.random() * 100}%`,
size:  `${10 + Math.random() * 14}px`,
dur:   `${5 + Math.random() * 8}s`,
delay: `${(Math.random() * 6).toFixed(2)}s`,
char:  ["❄","❅","❆","·","*"][Math.floor(Math.random() * 5)],
        }));
        return (
<>
{flakes.map((f, i) => (
        <div key={i} className="sky-snowflake" style={{
        left: f.left, fontSize: f.size,
        animationDuration: f.dur,
        animationDelay: f.delay,
          }}>{f.char}</div>
        ))}
      </>
        );
        }

        /* ── STORM: lightning flash + bolt ── */
        if (c.includes("thunder")) {
        return (
      <>
        <div className="sky-lightning-flash" />
        <svg className="sky-lightning-bolt" viewBox="0 0 60 140" fill="none">
          <polyline points="40,0 20,65 35,65 15,140 55,50 38,50 58,0"
fill="#fffde0" stroke="rgba(255,255,200,0.6)" strokeWidth="1"/>
        </svg>
      </>
        );
        }

        return null;
        }

/* ────────────────────────────────────────
   HOME PAGE
─────────────────────────────────────── */
function HomePage({ onSearch, error, loading, onNavigate }) {
        const exploreRef = useRef(null);
  const quickLinks = [
        { icon: "🌡️", title: "Temperature Maps", desc: "High-resolution global temperature charts",   key: "tempmap",  live: true },
        { icon: "💨", title: "Wind Forecast",    desc: "Speed and direction forecasts up to 5 days",  key: "wind",     live: true },
        { icon: "⚡", title: "Weather Warnings", desc: "Active alerts, red & amber warnings",          key: "warnings", live: true },
        ];

        /* Floating orbs config */
        const orbs = [
        { size:180, left:"8%",  delay:"0s",   dur:"18s", color:"rgba(0,164,167,0.12)" },
        { size:120, left:"25%", delay:"4s",   dur:"22s", color:"rgba(0,101,189,0.10)" },
        { size:200, left:"55%", delay:"2s",   dur:"16s", color:"rgba(0,58,112,0.15)"  },
        { size: 90, left:"75%", delay:"7s",   dur:"20s", color:"rgba(0,164,167,0.08)" },
        { size:140, left:"88%", delay:"1s",   dur:"25s", color:"rgba(0,101,189,0.12)" },
        { size: 70, left:"42%", delay:"9s",   dur:"14s", color:"rgba(0,164,167,0.10)" },
        ];

        return (
    <div className="home-page">
        {/* ── HERO ── */}
      <div className="home-hero">
        <div className="hero-stars"></div>

        {/* Floating orbs */}
        {orbs.map((o, i) => (
          <div key={i} className="hero-orb" style={{
width: o.size, height: o.size,
left: o.left, bottom: "-20%",
background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
animationDelay: o.delay,
animationDuration: o.dur,
        }} />
        ))}

        <div className="hero-content">
        {/* Animated emoji cluster */}
          <div className="hero-weather-cluster">
            <span className="hero-emoji">🌤️</span>
            <span className="hero-emoji">⛈️</span>
            <span className="hero-emoji">❄️</span>
          </div>

          <span className="hero-badge">Live Global Forecast Service</span>

          <h1 className="hero-title">
Know Your
            <span className="hero-title-accent">Weather</span>
          </h1>

          <p className="hero-subtitle">
Science-backed forecasts for every city on Earth.
        Search anywhere, see everything.
          </p>

          <div className="hero-search-wrap">
            <SearchBar onSearch={onSearch} placeholder="Search any city or town…" />
        {error   && <p className="hero-error">⚠️ {error}</p>}
        {loading && <p className="hero-error" style={{ color:"rgba(255,255,255,0.5)" }}>Fetching forecast…</p>}
            <p className="hero-hint">Try "London" · "Tokyo" · "New York" · "Sydney"</p>
          </div>

        {/* Stats strip */}
          <div className="hero-stats-strip">
        {[
        { num:"200+", label:"Countries" },
        { num:"1M+",  label:"Forecasts daily" },
        { num:"15m",  label:"Update interval" },
        { num:"99%",  label:"Accuracy rate" },
        ].map(s => (
        <div className="hero-stat" key={s.label}>
                <span className="hero-stat-num">{s.num}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
        ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="scroll-cue" onClick={() => exploreRef.current?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer" }}></div>
        <div className="scroll-cue">
          <span>Explore</span>
          <div className="scroll-arrow"></div>
        </div>
      </div>

        {/* ── FEATURE GRID ── */}
      <div className="home-content">
        <div className="home-content-inner">
          <p className="home-section-eyebrow">What's available</p>
          <h2 className="home-section-title">
Explore our <span>forecast tools</span>
          </h2>

          <div className="quick-links">
        {quickLinks.map((l) => (
              <div
className="quick-link-card"
key={l.title}
onClick={l.key ? () => onNavigate(l.key) : undefined}
style={{ cursor: l.key ? "pointer" : "default" }}
        >
        {l.live && <span className="quick-link-live">Live</span>}
                <span className="quick-link-icon">{l.icon}</span>
                <span className="quick-link-title">{l.title}</span>
                <span className="quick-link-desc">{l.desc}</span>
                <span className="quick-link-arrow">↗</span>
              </div>
        ))}
          </div>

        {/* Bottom CTA */}
          <div className="home-cta">
            <div className="home-cta-text">
<h3>Get instant forecasts</h3>
<p>Search any city above for a full 5-day breakdown with wind, humidity, pressure and a live map.</p>
            </div>
            <button className="home-cta-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
Search a city →
            </button>
          </div>

        {/* Help & Support */}
          <div style={{
marginTop: 20,
background: "rgba(255,255,255,0.03)",
border: "1px solid rgba(255,255,255,0.07)",
borderRadius: 16,
padding: "32px 36px",
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: 28,
flexWrap: "wrap",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{
width: 52, height: 52, borderRadius: 14, flexShrink: 0,
background: "linear-gradient(135deg, rgba(0,164,167,0.2), rgba(0,101,189,0.2))",
border: "1px solid rgba(0,164,167,0.25)",
display: "flex", alignItems: "center", justifyContent: "center",
fontSize: 24,
        }}>❓</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white", marginBottom: 4 }}>Help & Support</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, maxWidth: 380 }}>
Having trouble finding a forecast? Browse our FAQs or get in touch with our support team.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => onNavigate("help")} style={{
background: "linear-gradient(135deg, #00a4a7, #0065bd)",
border: "none", color: "white",
fontFamily: "inherit", fontSize: 14, fontWeight: 600,
padding: "11px 24px", borderRadius: 50, cursor: "pointer",
boxShadow: "0 4px 16px rgba(0,101,189,0.35)",
transition: "all 0.2s",
        }}
onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
View FAQs
              </button>
              <button onClick={() => onNavigate("help")} style={{
background: "transparent",
border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)",
fontFamily: "inherit", fontSize: 14, fontWeight: 600,
padding: "11px 24px", borderRadius: 50, cursor: "pointer",
transition: "all 0.2s",
        }}
onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "white"; }}
onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
        >
Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
        );
        }

/* ────────────────────────────────────────
   WEATHER DETAIL PAGE
─────────────────────────────────────── */
function WeatherPage({ weather, forecast, onBack, onSearch }) {
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
      </div>

        {/* Current weather hero */}
      <div className={`current-weather-hero ${heroBg}`}>
        <SkyScene condition={condition} isNight={isNight} />
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

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginLeft: "auto" }}>
        {/* Map — 440×440 */}
            <div style={{
borderRadius: 12,
overflow: "hidden",
border: "1px solid rgba(255,255,255,0.15)",
width: 440,
height: 440,
boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
flexShrink: 0,
        }}>
              <iframe
title="City Map"
width="440"
height="440"
style={{ border: "none", display: "block" }}
src={`https://www.openstreetmap.org/export/embed.html?bbox=${weather.coord.lon - 0.15}%2C${weather.coord.lat - 0.15}%2C${weather.coord.lon + 0.15}%2C${weather.coord.lat + 0.15}&layer=mapnik&marker=${weather.coord.lat}%2C${weather.coord.lon}&lang=en`}
        />
            </div>

        {/* Feels like + Local time — slim inline rows */}
            <div style={{ display: "flex", gap: 24, padding: "6px 4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: 600 }}>Feels like</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{Math.round(weather.main.feels_like)}°C</span>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: 600 }}>Local Time</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{fmtTime(weather.dt, offset)}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>UTC{offset >= 0 ? "+" : ""}{offset / 3600}</span>
              </div>
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
        &nbsp;·&nbsp; UI inspired by <a href="https://www.metoffice.gov.uk" target="_blank" rel="noreferrer">Met Office</a>
      </footer>
    </div>
        );
        }

/* ────────────────────────────────────────
   LIVE CHAT WIDGET
─────────────────────────────────────── */
        const BOT_RESPONSES = {
greet: ["Hello! 👋 I'm the Weather Office support assistant. How can I help you today?"],
default: [
        "Thanks for reaching out! A support agent will follow up within 24 hours.",
        "Great question. Let me note that for you — our team will get back to you shortly.",
        "I've logged your message. Is there anything else I can help with?",
        ],
keywords: [
        { match: ["city","find","search","not found"],    reply: "Try using the full English city name, e.g. 'New York' or 'Bradford, UK'. If it still fails, the city may not be in our database." },
        { match: ["accurate","accuracy","wrong","incorrect"], reply: "Forecasts from OpenWeatherMap are typically accurate to ±1–2°C for 24–48h. Accuracy drops slightly beyond 3 days — this is normal for all weather services." },
        { match: ["update","refresh","how often","latest"], reply: "Current conditions refresh every 10 minutes. The 5-day forecast updates every 3 hours." },
        { match: ["map","language","arabic","chinese","foreign"], reply: "Map labels come from OpenStreetMap and may display in the local language for some countries. This is a limitation of the free tile layer we use." },
        { match: ["beaufort","wind scale","bft"],          reply: "The Beaufort scale runs from 0 (Calm) to 12 (Hurricane). Each level describes observable wind effects — you can see the full chart on the Wind Forecast page." },
        { match: ["data","privacy","stored","location"],   reply: "We never store your location or search history on our servers. Searches go directly to OpenWeatherMap's API." },
        { match: ["history","historical","past"],          reply: "Historical weather data isn't available in this version. We only show live conditions and 5-day forecasts." },
        { match: ["thank","thanks","cheers","great","perfect"], reply: "You're very welcome! 😊 Is there anything else I can help with?" },
        { match: ["bye","goodbye","done","no thanks"],     reply: "Thanks for chatting! Have a great day ☀️" },
        ],
        };

function getBotReply(msg) {
  const lower = msg.toLowerCase();
    for (const kw of BOT_RESPONSES.keywords) {
        if (kw.match.some(k => lower.includes(k))) return kw.reply;
    }
    return BOT_RESPONSES.default[Math.floor(Math.random() * BOT_RESPONSES.default.length)];
}

function LiveChatWidget({ onClose }) {
        const [messages, setMessages] = useState([
{ from: "bot", text: BOT_RESPONSES.greet[0], time: new Date() },
        ]);
        const [input,   setInput]   = useState("");
  const [typing,  setTyping]  = useState(false);
  const bottomRef = useRef(null);

useEffect(() => {
bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, [messages, typing]);

        const send = () => {
        const text = input.trim();
    if (!text) return;
        const now = new Date();
setMessages(prev => [...prev, { from: "user", text, time: now }]);
setInput("");
setTyping(true);
setTimeout(() => {
setTyping(false);
setMessages(prev => [...prev, { from: "bot", text: getBotReply(text), time: new Date() }]);
        }, 900 + Math.random() * 600);
        };

        const fmtTime = (d) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

        const S = {
wrap: {
position: "fixed", bottom: 24, right: 24, zIndex: 300,
width: 360, height: 520,
background: "#0a1628",
border: "1px solid rgba(0,164,167,0.35)",
borderRadius: 18,
display: "flex", flexDirection: "column",
boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,164,167,0.1)",
overflow: "hidden",
animation: "chatSlideIn 0.25s ease",
        },
header: {
background: "linear-gradient(135deg, #003a70, #005fa3)",
padding: "14px 18px",
display: "flex", alignItems: "center", justifyContent: "space-between",
        },
msgs: {
flex: 1, overflowY: "auto", padding: "16px",
display: "flex", flexDirection: "column", gap: 10,
        },
bubble: (from) => ({
maxWidth: "80%",
alignSelf: from === "user" ? "flex-end" : "flex-start",
background: from === "user" ? "linear-gradient(135deg,#00a4a7,#0065bd)" : "#152840",
border: from === "user" ? "none" : "1px solid rgba(255,255,255,0.07)",
borderRadius: from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
padding: "10px 14px",
fontSize: 14, color: "white", lineHeight: 1.5,
        }),
time: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: "right" },
inputRow: {
borderTop: "1px solid rgba(255,255,255,0.07)",
padding: "12px 14px",
display: "flex", gap: 8, alignItems: "center",
background: "#071422",
        },
input: {
flex: 1, background: "rgba(255,255,255,0.06)",
border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
padding: "10px 16px", color: "white", fontSize: 14,
outline: "none", fontFamily: "inherit",
        },
sendBtn: {
width: 38, height: 38, borderRadius: "50%",
background: "linear-gradient(135deg,#00a4a7,#0065bd)",
border: "none", color: "white", cursor: "pointer",
display: "flex", alignItems: "center", justifyContent: "center",
fontSize: 16, flexShrink: 0,
transition: "transform 0.15s",
        },
        };

        return (
    <div style={S.wrap} role="dialog" aria-label="Live Chat Support">
        {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>Weather Office Support</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span>
Online now
            </div>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close chat" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>

        {/* Messages */}
      <div style={S.msgs}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start" }}>
            <div style={S.bubble(m.from)}>{m.text}</div>
            <div style={S.time}>{fmtTime(m.time)}</div>
          </div>
        ))}
        {typing && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ ...S.bubble("bot"), padding: "12px 16px" }}>
              <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[0,1,2].map(i => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite` }}></span>
        ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

        {/* Input */}
      <div style={S.inputRow}>
        <input
style={S.input}
value={input}
onChange={e => setInput(e.target.value)}
onKeyDown={e => e.key === "Enter" && send()}
placeholder="Type a message…"
aria-label="Chat message input"
        />
        <button style={S.sendBtn} onClick={send} aria-label="Send message"
onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >➤</button>
      </div>
    </div>
        );
        }

/* ────────────────────────────────────────
   EMAIL SUPPORT MODAL
─────────────────────────────────────── */
function EmailModal({ onClose }) {
        const [form,    setForm]    = useState({ name: "", email: "", subject: "", message: "" });
        const [errors,  setErrors]  = useState({});
        const [status,  setStatus]  = useState("idle"); // idle | sending | sent | error

  const validate = () => {
        const e = {};
        if (!form.name.trim())                              e.name    = "Name is required.";
        if (!form.email.trim())                             e.email   = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
        if (!form.subject.trim())                           e.subject = "Subject is required.";
        if (form.message.trim().length < 10)                e.message = "Message must be at least 10 characters.";
        return e;
  };

          const handleSubmit = () => {
        const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
setErrors({});
setStatus("sending");
/* Simulate API send — replace with real endpoint e.g. EmailJS / Formspree */
setTimeout(() => setStatus("sent"), 1400);
        };

        const field = (label, key, type = "text", rows) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={key} style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.7px" }}>
        {label} <span style={{ color: "#e74c3c" }}>*</span>
      </label>
        {rows ? (
        <textarea id={key} rows={rows} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${errors[key] ? "#e74c3c" : "rgba(255,255,255,0.12)"}`, borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
onFocus={e => e.target.style.borderColor = errors[key] ? "#e74c3c" : "rgba(0,212,216,0.5)"}
onBlur={e  => e.target.style.borderColor = errors[key] ? "#e74c3c" : "rgba(255,255,255,0.12)"}
        />
        ) : (
        <input id={key} type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${errors[key] ? "#e74c3c" : "rgba(255,255,255,0.12)"}`, borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color 0.2s" }}
onFocus={e => e.target.style.borderColor = errors[key] ? "#e74c3c" : "rgba(0,212,216,0.5)"}
onBlur={e  => e.target.style.borderColor = errors[key] ? "#e74c3c" : "rgba(255,255,255,0.12)"}
        />
        )}
        {errors[key] && <span style={{ fontSize: 12, color: "#e74c3c" }}>⚠ {errors[key]}</span>}
    </div>
        );

        return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
onClick={onClose} role="dialog" aria-label="Email Support Form" aria-modal="true"
        >
      <div style={{ background: "#0a1628", border: "1px solid rgba(0,164,167,0.25)", borderTop: "3px solid #00a4a7", borderRadius: 18, width: "100%", maxWidth: 520, padding: 36, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}
onClick={e => e.stopPropagation()}
        >
        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "white", marginBottom: 10 }}>Message Sent!</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 28 }}>
Thanks, <strong style={{ color: "white" }}>{form.name}</strong>! We've received your message and will reply to <strong style={{ color: "#00d4d8" }}>{form.email}</strong> within 24 hours.
            </p>
            <button onClick={onClose} style={{ background: "linear-gradient(135deg,#00a4a7,#0065bd)", border: "none", color: "white", padding: "12px 32px", borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "white", marginBottom: 4 }}>📧 Email Support</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>We'll reply within 24 hours</p>
              </div>
              <button onClick={onClose} aria-label="Close email form" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {field("Your Name", "name")}
        {field("Email Address", "email", "email")}
              </div>
        {field("Subject", "subject")}
        {field("Message", "message", "text", 5)}

              <button onClick={handleSubmit} disabled={status === "sending"} style={{
background: status === "sending" ? "rgba(0,164,167,0.4)" : "linear-gradient(135deg,#00a4a7,#0065bd)",
border: "none", color: "white", padding: "14px", borderRadius: 50,
fontSize: 15, fontWeight: 700, cursor: status === "sending" ? "not-allowed" : "pointer",
fontFamily: "inherit", transition: "all 0.2s",
display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
        {status === "sending" ? (
                  <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }}></span> Sending…</>
        ) : "Send Message →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
        );
        }

/* ────────────────────────────────────────
   BUG REPORT MODAL
─────────────────────────────────────── */
function BugReportModal({ onClose }) {
        const [form,   setForm]   = useState({ title: "", category: "ui", steps: "", expected: "", actual: "", email: "" });
        const [errors, setErrors] = useState({});
        const [status, setStatus] = useState("idle"); // idle | sending | sent

  const CATEGORIES = [
        { value: "ui",       label: "UI / Visual Issue" },
        { value: "forecast", label: "Incorrect Forecast Data" },
        { value: "map",      label: "Map Problem" },
        { value: "search",   label: "City Search Failure" },
        { value: "perf",     label: "Performance / Loading" },
        { value: "other",    label: "Other" },
        ];

        const validate = () => {
        const e = {};
        if (!form.title.trim())              e.title    = "A short title is required.";
        if (form.steps.trim().length < 10)   e.steps    = "Please describe the steps (min 10 chars).";
        if (!form.actual.trim())             e.actual   = "Please describe what actually happened.";
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
        return e;
  };

          const handleSubmit = () => {
        const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
setErrors({});
setStatus("sending");
/* Simulate submission — replace with real endpoint / GitHub API */
setTimeout(() => setStatus("sent"), 1400);
        };

        const inputStyle = (key) => ({
background: "rgba(255,255,255,0.05)",
border: `1px solid ${errors[key] ? "#e74c3c" : "rgba(255,255,255,0.12)"}`,
borderRadius: 10, padding: "11px 14px",
color: "white", fontSize: 14, fontFamily: "inherit",
outline: "none", width: "100%", boxSizing: "border-box",
transition: "border-color 0.2s",
        });

        const field = (label, key, el = "input", extra = {}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={`bug-${key}`} style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.7px" }}>
        {label}{extra.required !== false && <span style={{ color: "#e74c3c" }}> *</span>}
      </label>
        {el === "textarea" ? (
        <textarea id={`bug-${key}`} rows={extra.rows || 3} value={form[key]}
onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
style={{ ...inputStyle(key), resize: "vertical" }}
onFocus={e => e.target.style.borderColor = errors[key] ? "#e74c3c" : "rgba(0,212,216,0.5)"}
onBlur={e  => e.target.style.borderColor = errors[key] ? "#e74c3c" : "rgba(255,255,255,0.12)"}
placeholder={extra.placeholder || ""}
        />
        ) : el === "select" ? (
        <select id={`bug-${key}`} value={form[key]}
onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
style={{ ...inputStyle(key), cursor: "pointer" }}
        >
        {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: "#0a1628" }}>{c.label}</option>)}
        </select>
        ) : (
        <input id={`bug-${key}`} type={extra.type || "text"} value={form[key]}
onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
style={inputStyle(key)}
onFocus={e => e.target.style.borderColor = errors[key] ? "#e74c3c" : "rgba(0,212,216,0.5)"}
onBlur={e  => e.target.style.borderColor = errors[key] ? "#e74c3c" : "rgba(255,255,255,0.12)"}
placeholder={extra.placeholder || ""}
        />
        )}
        {errors[key] && <span style={{ fontSize: 12, color: "#e74c3c" }}>⚠ {errors[key]}</span>}
    </div>
        );

        return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.78)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
onClick={onClose} role="dialog" aria-label="Bug Report Form" aria-modal="true"
        >
      <div style={{ background:"#0a1628", border:"1px solid rgba(231,76,60,0.3)", borderTop:"3px solid #e74c3c", borderRadius:18, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto", padding:36, boxShadow:"0 24px 60px rgba(0,0,0,0.6)" }}
onClick={e => e.stopPropagation()}
        >
        {status === "sent" ? (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"white", marginBottom:10 }}>Bug Reported!</h2>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.6, marginBottom:10 }}>
Thanks for helping us improve! Your report for <strong style={{ color:"white" }}>"{form.title}"</strong> has been logged.
            </p>
        {form.email && <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:28 }}>We'll follow up at <strong style={{ color:"#00d4d8" }}>{form.email}</strong> if we need more details.</p>}
            <button onClick={onClose} style={{ background:"linear-gradient(135deg,#e74c3c,#c0392b)", border:"none", color:"white", padding:"12px 32px", borderRadius:50, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"white", marginBottom:4 }}>🐛 Report a Bug</h2>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Help us squash it — the more detail the better</p>
              </div>
              <button onClick={onClose} aria-label="Close bug report" style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"white", width:34, height:34, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>×</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {field("Bug Title", "title", "input", { placeholder:"e.g. Temperature not showing for Tokyo" })}
        {field("Category", "category", "select")}
        {field("Steps to Reproduce", "steps", "textarea", { rows:3, placeholder:"1. Search for a city\n2. Click on...\n3. See error", required:true })}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {field("Expected Behaviour", "expected", "textarea", { rows:2, placeholder:"What should happen?", required:false })}
        {field("Actual Behaviour", "actual", "textarea", { rows:2, placeholder:"What actually happened?" })}
              </div>
        {field("Your Email (optional)", "email", "input", { type:"email", placeholder:"so we can follow up", required:false })}

              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button onClick={handleSubmit} disabled={status === "sending"} style={{
flex:1, background: status==="sending" ? "rgba(231,76,60,0.4)" : "linear-gradient(135deg,#e74c3c,#c0392b)",
border:"none", color:"white", padding:"14px", borderRadius:50,
fontSize:15, fontWeight:700, cursor: status==="sending" ? "not-allowed" : "pointer",
fontFamily:"inherit", transition:"all 0.2s",
display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        }}>
        {status === "sending" ? (
                    <><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }}></span>Submitting…</>
        ) : "Submit Bug Report →"}
                </button>
                <button onClick={onClose} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.6)", padding:"14px 20px", borderRadius:50, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}
onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
        >Cancel</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
        );
        }


function HelpPage({ onBack }) {
        const [openFaq,    setOpenFaq]    = useState(null);
  const [showChat,   setShowChat]   = useState(false);
  const [showEmail,  setShowEmail]  = useState(false);
  const [showBug,    setShowBug]    = useState(false);
  const chatBtnRef = useRef(null);

  const faqs = [
        { q: "Why can't I find my city?",                    a: "Try using the full English name of the city, e.g. 'New York' instead of 'NY'. For smaller towns, try adding the country name, e.g. 'Bradford, UK'." },
        { q: "How accurate are the forecasts?",               a: "Forecasts are powered by OpenWeatherMap and are generally accurate to within 1–2°C for 1–2 day outlooks. Accuracy decreases slightly beyond 3 days." },
        { q: "How often is data updated?",                    a: "Current weather is updated every 10 minutes. The 5-day forecast refreshes every 3 hours automatically." },
        { q: "What does the Beaufort scale mean?",            a: "The Beaufort scale rates wind speed from 0 (Calm) to 12 (Hurricane force). It's a standardised way to describe wind effects on land and sea." },
        { q: "Why is the map showing a different language?",  a: "The OpenStreetMap tiles may render labels in the local language for some regions. We've set English as the preferred language, but full English coverage depends on OSM data." },
        { q: "Can I see historical weather data?",            a: "Currently the app shows live and 5-day forecast data only. Historical data is not available in this version." },
        { q: "Is my location data stored?",                   a: "No. Your search queries are sent directly to the OpenWeatherMap API and are not stored or logged by this app." },
        ];

        return (
    <div style={{ fontFamily:"'DM Sans','Source Sans 3',sans-serif", background:"#03080f", minHeight:"100vh", color:"white" }}>

        {/* Top bar */}
      <div style={{ background:"#001a38", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"12px 24px", display:"flex", alignItems:"center", gap:16 }}>
        <button className="back-btn" onClick={onBack}>← Home</button>
        <span style={{ fontSize:20 }}>❓</span>
        <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:20, fontWeight:700 }}>Help & Support</span>
      </div>

        {/* Hero banner */}
      <div style={{ background:"linear-gradient(135deg,#071e3d 0%,#0a2a5e 60%,#071e3d 100%)", borderBottom:"1px solid rgba(0,164,167,0.15)", padding:"52px 24px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,164,167,0.12) 0%, transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🛟</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:900, color:"white", marginBottom:12, letterSpacing:"-0.5px" }}>How can we help?</h1>
          <p style={{ fontSize:16, color:"rgba(255,255,255,0.45)", maxWidth:440, margin:"0 auto", lineHeight:1.6 }}>Find answers below, or reach out directly via email or live chat.</p>
        </div>
      </div>

      <div style={{ maxWidth:800, margin:"0 auto", padding:"48px 20px 120px" }}>

        {/* Contact cards — now functional */}
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"white", marginBottom:16 }}>Get in Touch</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:14, marginBottom:52 }}>

        {/* Email card */}
          <div style={{ background:"#0a1628", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"24px 20px", transition:"all 0.2s", cursor:"pointer" }}
onClick={() => setShowEmail(true)}
role="button" aria-label="Open email support form" tabIndex={0}
onKeyDown={e => e.key === "Enter" && setShowEmail(true)}
onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,164,167,0.4)"; e.currentTarget.style.background="#0f1f35"; e.currentTarget.style.transform="translateY(-2px)"; }}
onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; e.currentTarget.style.background="#0a1628"; e.currentTarget.style.transform="translateY(0)"; }}
        >
            <div style={{ fontSize:32, marginBottom:14 }}>📧</div>
            <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:6 }}>Email Support</div>
            <div style={{ fontSize:13, color:"#00d4d8", marginBottom:4 }}>Send us a message</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:14 }}>Response within 24 hours</div>
            <span style={{ fontSize:12, fontWeight:700, color:"#00d4d8", background:"rgba(0,164,167,0.1)", border:"1px solid rgba(0,164,167,0.25)", borderRadius:20, padding:"4px 12px" }}>Open Form →</span>
          </div>

        {/* Live Chat card */}
          <div style={{ background:"#0a1628", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"24px 20px", transition:"all 0.2s", cursor:"pointer" }}
onClick={() => setShowChat(true)}
ref={chatBtnRef}
role="button" aria-label="Open live chat" tabIndex={0}
onKeyDown={e => e.key === "Enter" && setShowChat(true)}
onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,164,167,0.4)"; e.currentTarget.style.background="#0f1f35"; e.currentTarget.style.transform="translateY(-2px)"; }}
onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; e.currentTarget.style.background="#0a1628"; e.currentTarget.style.transform="translateY(0)"; }}
        >
            <div style={{ fontSize:32, marginBottom:14 }}>💬</div>
            <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:6 }}>Live Chat</div>
            <div style={{ fontSize:13, color:"#4ade80", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", display:"inline-block", boxShadow:"0 0 6px #4ade80" }}></span>
Online now
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:14 }}>Instant AI-assisted support</div>
            <span style={{ fontSize:12, fontWeight:700, color:"#4ade80", background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:20, padding:"4px 12px" }}>Start Chat →</span>
          </div>

        {/* Bug Report card */}
          <div style={{ background:"#0a1628", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"24px 20px", transition:"all 0.2s", cursor:"pointer" }}
onClick={() => setShowBug(true)}
role="button" aria-label="Open bug report form" tabIndex={0}
onKeyDown={e => e.key === "Enter" && setShowBug(true)}
onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(231,76,60,0.4)"; e.currentTarget.style.background="#0f1f35"; e.currentTarget.style.transform="translateY(-2px)"; }}
onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; e.currentTarget.style.background="#0a1628"; e.currentTarget.style.transform="translateY(0)"; }}
        >
            <div style={{ fontSize:32, marginBottom:14 }}>🐛</div>
            <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:6 }}>Report a Bug</div>
            <div style={{ fontSize:13, color:"#e74c3c", marginBottom:4 }}>Found something broken?</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:14 }}>Help us squash it fast</div>
            <span style={{ fontSize:12, fontWeight:700, color:"#e74c3c", background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:20, padding:"4px 12px" }}>File a Report →</span>
          </div>
        </div>

        {/* FAQ */}
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"white", marginBottom:20 }}>Frequently Asked Questions</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:48 }}>
        {faqs.map((f, i) => (
            <div key={i} style={{ background: openFaq===i ? "rgba(0,164,167,0.08)" : "#0a1628", border:`1px solid ${openFaq===i ? "rgba(0,164,167,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius:12, overflow:"hidden", transition:"all 0.2s" }}>
              <button onClick={() => setOpenFaq(openFaq===i ? null : i)} style={{ width:"100%", background:"none", border:"none", color:"white", padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", fontFamily:"inherit", gap:16 }}>
                <span style={{ fontSize:15, fontWeight:600, textAlign:"left" }}>{f.q}</span>
                <span style={{ fontSize:20, color:"#00d4d8", flexShrink:0, transition:"transform 0.25s", transform: openFaq===i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </button>
        {openFaq===i && <div style={{ padding:"0 20px 18px", fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7 }}>{f.a}</div>}
            </div>
        ))}
        </div>

        {/* Footer note */}
        <div style={{ padding:"20px 24px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.3)", lineHeight:1.6 }}>
Weather data provided by <span style={{ color:"#00d4d8" }}>OpenWeatherMap</span>. This app is for demonstration purposes.
Map tiles © <span style={{ color:"#00d4d8" }}>OpenStreetMap</span> contributors.
        </div>
      </div>

        {/* Floating chat bubble when chat closed */}
        {!showChat && (
        <button onClick={() => setShowChat(true)} aria-label="Open live chat" style={{
position:"fixed", bottom:24, right:24, zIndex:200,
width:56, height:56, borderRadius:"50%",
background:"linear-gradient(135deg,#00a4a7,#0065bd)",
border:"none", color:"white", fontSize:24, cursor:"pointer",
boxShadow:"0 8px 24px rgba(0,101,189,0.45)",
display:"flex", alignItems:"center", justifyContent:"center",
transition:"transform 0.2s",
        }}
onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
        >💬</button>
        )}

        {/* Modals */}
        {showChat  && <LiveChatWidget onClose={() => setShowChat(false)} />}
        {showEmail && <EmailModal     onClose={() => setShowEmail(false)} />}
        {showBug   && <BugReportModal onClose={() => setShowBug(false)}  />}

<style>{`
    @keyframes chatSlideIn  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes typingDot    { 0%,60%,100% { transform:translateY(0); opacity:0.4; } 30% { transform:translateY(-6px); opacity:1; } }
    @keyframes spin         { to { transform:rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700&display=swap');
      `}</style>
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
  const [page,     setPage]     = useState("home");

    /* ── On mount: restore last city if one was saved ── */
    useEffect(() => {
    const saved = localStorage.getItem("wo_last_city");
    if (saved) handleSearch(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        setForecast(fData.list);
        setPage("weather");

        /* Save the city name returned by the API (canonical spelling) */
        localStorage.setItem("wo_last_city", wData.name);
    } catch (err) {
        setError(err.message);
        setWeather(null);
        setForecast([]);
        setPage("home");

    } finally {
        setLoading(false);
    }
  };

  const handleBack = () => {
            setPage("home");
    setWeather(null);
    setForecast([]);
    setError(null);
    /* Clear saved city so next visit starts at home */
    localStorage.removeItem("wo_last_city");
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
            <div className="mo-logo-text">Weather Office</div>
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
            <HomePage onSearch={handleSearch} error={error} loading={loading} onNavigate={setPage} />
      )}

    {!loading && page === "weather" && weather && (
            <WeatherPage
        weather={weather}
        forecast={forecast}
        onBack={handleBack}
        onSearch={handleSearch}
                />
      )}

    {page === "tempmap" && (
            <div>
            <div style={{ background:"#003a70", padding:"10px 20px" }}>
            <button className="back-btn" onClick={handleBack}>← Home</button>
            </div>
            <TemperatureMap />
            </div>
      )}

    {page === "warnings" && (
            <WeatherWarnings onBack={handleBack} />
      )}

    {page === "wind" && (
            <WindForecast onBack={handleBack} />
      )}

    {page === "help" && (
            <HelpPage onBack={handleBack} />
      )}
    </>
  );
}

export default App;