import { useState, useEffect, useRef } from "react";
import SearchBar from "./components/SearchBar";
import TemperatureMap from "./TemperatureMap";
import WeatherWarnings from "./WeatherWarnings";
import WindForecast from "./WindForecast";
import "./App.css";
import CookieBanner from "./CookieBanner";

function weatherIcon(condition, isNight = false) {
  const c = condition?.toLowerCase() || "";
  if (c.includes("thunderstorm")) return "⛈️";
  if (c.includes("drizzle"))      return "🌦️";
  if (c.includes("rain"))         return "🌧️";
  if (c.includes("snow"))         return "🌨️";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze") || c.includes("smoke") || c.includes("dust") || c.includes("sand") || c.includes("ash")) return isNight ? "🌑" : "🌫️";
  if (c.includes("cloud"))        return isNight ? "☁️" : "⛅";
  if (c === "clear")              return isNight ? "🌙" : "☀️";
  return "🌤️";
}

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MON_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDay(dt_txt) {
  const d = new Date(dt_txt);
  return DAY_NAMES[d.getDay()].slice(0,3).toUpperCase();
}
function fmtDate(dt_txt) {
  const d = new Date(dt_txt);
  return `${d.getDate()} ${MON_NAMES[d.getMonth()]}`;
}
function fmtTime(unix, offset) {
  const d = new Date((unix + offset) * 1000);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2,"0");
  return `${h}:${m}`;
}
function windDir(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg/45)%8];
}
function toF(c) { return Math.round(c * 9/5 + 32); }
function fmtTemp(c, unit) { return unit==="F" ? `${toF(c)}°F` : `${Math.round(c)}°C`; }
function fmtTempVal(c, unit) { return unit==="F" ? toF(c) : Math.round(c); }
function fmtTempUnit(unit) { return unit==="F" ? "°F" : "°C"; }

function getFavourites() {
  try { return JSON.parse(localStorage.getItem("wo_favourites") || "[]"); }
  catch { return []; }
}
function saveFavourites(list) {
  localStorage.setItem("wo_favourites", JSON.stringify(list));
}
/* ── SEARCH HISTORY helpers ── */
const HISTORY_KEY = "wo_search_history";
const HISTORY_MAX = 10;

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
function addToHistory(cityName, country) {
  const prev = getHistory().filter(h => h.name.toLowerCase() !== cityName.toLowerCase());
  const updated = [{ name: cityName, country, time: Date.now() }, ...prev].slice(0, HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}
function removeFromHistory(cityName) {
  const updated = getHistory().filter(h => h.name.toLowerCase() !== cityName.toLowerCase());
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
function fmtHistoryTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function bgClass(condition, isNight) {
  const c = condition?.toLowerCase() || "";
  if (c.includes("thunder")) return "weather-storm";
  if (c.includes("rain") || c.includes("drizzle")) return isNight ? "weather-rain weather-rain-night" : "weather-rain";
  if (c.includes("snow")) return "weather-snow";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze") || c.includes("smoke") || c.includes("dust") || c.includes("sand") || c.includes("ash"))
    return isNight ? "weather-mist weather-mist-night" : "weather-mist";
  if (c.includes("cloud")) return isNight ? "weather-clouds weather-clouds-night" : "weather-clouds";
  if (c === "clear") return isNight ? "weather-clear-night" : "weather-clear-day";
  return isNight ? "weather-clear-night" : "weather-clear-day";
}

function SkyScene({ condition, isNight, windSpeed = 0 }) {
  const c = condition?.toLowerCase() || "";
  const isWindy = windSpeed >= 7; // 7 m/s ≈ 25 km/h — noticeable wind

  /* Wind streaks — shown whenever wind is significant, layered on top of any scene */
  const windStreaks = isWindy ? Array.from({ length: 18 }, (_, i) => ({
    top:    `${5 + Math.random() * 85}%`,
    width:  `${60 + Math.random() * 160}px`,
    dur:    `${0.8 + Math.random() * 0.9}s`,
    delay:  `${(Math.random() * 2).toFixed(2)}s`,
    opacity: 0.25 + Math.random() * 0.45,
  })) : [];

  let children = null;

  /* CLEAR NIGHT */
  if (c === "clear" && isNight) {
    children = (
      <>
        <div className="sky-stars" />
        <div className="sky-shooting-star" />
      </>
    );
  }

  /* CLEAR DAY */
  else if (c === "clear" && !isNight) {
    const clouds = [
      { w:180, h:48, top:"18%", left:"-5%",  dur:"55s", delay:"0s",   op:0.75 },
      { w:140, h:38, top:"30%", left:"-8%",  dur:"75s", delay:"12s",  op:0.6  },
      { w:220, h:56, top:"10%", left:"-10%", dur:"90s", delay:"25s",  op:0.5  },
    ];
    children = clouds.map((cl, i) => (
      <div key={i} className="sky-cloud" style={{
        width: cl.w, height: cl.h, top: cl.top, left: cl.left,
        opacity: cl.op, animationDuration: cl.dur, animationDelay: cl.delay,
      }} />
    ));
  }

  /* ── CLOUDY ── */
  else if (c.includes("cloud")) {
    const puffs = [
      { w:260, h:65, top:"8%",  left:"-10%", dur:"60s",  delay:"0s",   op:0.55 },
      { w:200, h:52, top:"22%", left:"-8%",  dur:"80s",  delay:"10s",  op:0.45 },
      { w:320, h:75, top:"5%",  left:"-12%", dur:"100s", delay:"22s",  op:0.5  },
      { w:180, h:48, top:"35%", left:"-6%",  dur:"70s",  delay:"35s",  op:0.4  },
      { w:240, h:60, top:"15%", left:"-14%", dur:"90s",  delay:"50s",  op:0.48 },
    ];
    children = puffs.map((p, i) => (
      <div key={i} className="sky-cloud-puff" style={{
        width: p.w, height: p.h, top: p.top, left: p.left,
        opacity: p.op, animationDuration: p.dur, animationDelay: p.delay,
      }} />
    ));
  }

  /* ── RAIN ── */
  else if (c.includes("rain") || c.includes("drizzle")) {
    const drops = Array.from({ length: 80 }, () => ({
      left:    `${Math.random() * 100}%`,
      height:  `${12 + Math.random() * 22}px`,
      dur:     `${0.55 + Math.random() * 0.6}s`,
      delay:   `${(Math.random() * 1.5).toFixed(2)}s`,
      opacity: 0.35 + Math.random() * 0.45,
    }));
    children = (
      <div className="sky-rain">
        {drops.map((d, i) => (
          <div key={i} className="sky-raindrop" style={{
            left: d.left, height: d.height,
            animationDuration: d.dur, animationDelay: d.delay, opacity: d.opacity,
          }} />
        ))}
      </div>
    );
  }

  /* ── SNOW ── */
  else if (c.includes("snow")) {
    const flakes = Array.from({ length: 50 }, () => ({
      left:  `${Math.random() * 100}%`,
      size:  `${10 + Math.random() * 14}px`,
      dur:   `${5 + Math.random() * 8}s`,
      delay: `${(Math.random() * 6).toFixed(2)}s`,
      char:  ["❄","❅","❆","·","*"][Math.floor(Math.random() * 5)],
    }));
    children = flakes.map((f, i) => (
      <div key={i} className="sky-snowflake" style={{
        left: f.left, fontSize: f.size,
        animationDuration: f.dur, animationDelay: f.delay,
      }}>{f.char}</div>
    ));
  }

  /* ── MIST / FOG / HAZE / SMOKE ── */
  else if (c.includes("mist") || c.includes("fog") || c.includes("haze") ||
           c.includes("smoke") || c.includes("dust") || c.includes("sand") || c.includes("ash")) {
    if (isNight) {
      children = (
        <>
          <div className="sky-mist-layer sky-mist-layer-1" />
          <div className="sky-mist-layer sky-mist-layer-2" />
          <div className="sky-stars" style={{ opacity: 0.3 }} />
        </>
      );
    }
    /* day mist: CSS ::before handles the visual, no extra elements needed */
  }

  /* ── STORM ── */
  else if (c.includes("thunder")) {
    children = (
      <>
        <div className="sky-lightning-flash" />
        <svg className="sky-lightning-bolt" viewBox="0 0 60 140" fill="none">
          <polyline points="40,0 20,65 35,65 15,140 55,50 38,50 58,0"
            fill="#fffde0" stroke="rgba(255,255,200,0.6)" strokeWidth="1"/>
        </svg>
      </>
    );
  }

  /* Render nothing at all if no scene and no wind */
  if (!children && !isWindy) return null;

  return (
    <div className="sky-scene">
      {children}
      {/* Wind streaks overlay — rendered on top of any weather scene */}
      {windStreaks.map((s, i) => (
        <div key={`wind-${i}`} className="sky-wind-streak" style={{
          top: s.top, width: s.width,
          animationDuration: s.dur, animationDelay: s.delay, opacity: s.opacity,
        }} />
      ))}
    </div>
  );
}

/* ── HOME PAGE ── */
function HomePage({ onSearch, error, loading, onNavigate, onGeoLocate, geoLoading, geoError, history = [], onRemoveHistory, onClearHistory, theme = "dark" }) {
  const exploreRef = useRef(null);
  const quickLinks = [
    { icon:"🌡️", title:"Temperature Maps", desc:"High-resolution global temperature charts",  key:"tempmap",  live:true },
    { icon:"💨", title:"Wind Forecast",    desc:"Speed and direction forecasts up to 5 days", key:"wind",     live:true },
    { icon:"⚡", title:"Weather Warnings", desc:"Active alerts, red & amber warnings",         key:"warnings", live:true },
  ];
  const orbs = [
    { size:180,left:"8%", delay:"0s",dur:"18s",color:"rgba(0,164,167,0.12)" },
    { size:120,left:"25%",delay:"4s",dur:"22s",color:"rgba(0,101,189,0.10)" },
    { size:200,left:"55%",delay:"2s",dur:"16s",color:"rgba(0,58,112,0.15)"  },
    { size:90, left:"75%",delay:"7s",dur:"20s",color:"rgba(0,164,167,0.08)" },
    { size:140,left:"88%",delay:"1s",dur:"25s",color:"rgba(0,101,189,0.12)" },
    { size:70, left:"42%",delay:"9s",dur:"14s",color:"rgba(0,164,167,0.10)" },
  ];

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-stars"></div>
        {orbs.map((o,i) => (
          <div key={i} className="hero-orb" style={{ width:o.size,height:o.size,left:o.left,bottom:"-20%",background:`radial-gradient(circle, ${o.color} 0%, transparent 70%)`,animationDelay:o.delay,animationDuration:o.dur }} />
        ))}
        <div className="hero-content">
          <div className="hero-weather-cluster">
            <span className="hero-emoji">🌤️</span>
            <span className="hero-emoji">⛈️</span>
            <span className="hero-emoji">❄️</span>
          </div>
          <span className="hero-badge">Live Global Forecast Service</span>
          <h1 className="hero-title">Know Your<span className="hero-title-accent">Weather</span></h1>
          <p className="hero-subtitle">Science-backed forecasts for every city on Earth. Search anywhere, see everything.</p>

          <div className="hero-search-wrap">
            <SearchBar onSearch={onSearch} placeholder="Search any city or town…" />
            {error   && <p className="hero-error">⚠️ {error}</p>}
            {loading && <p className="hero-error" style={{color:"rgba(255,255,255,0.5)"}}>Fetching forecast…</p>}
            <p className="hero-hint">Try "London" · "Tokyo" · "New York" · "Sydney"</p>

            {/* Geolocation button */}
            <button
              onClick={onGeoLocate}
              disabled={geoLoading}
              style={{ marginTop:12, display:"inline-flex", alignItems:"center", gap:8, background:geoLoading?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", color:geoLoading?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.8)", borderRadius:50, padding:"10px 22px", fontSize:14, fontWeight:600, fontFamily:"inherit", cursor:geoLoading?"not-allowed":"pointer", transition:"all 0.2s" }}
              onMouseEnter={e => { if(!geoLoading) e.currentTarget.style.background="rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { if(!geoLoading) e.currentTarget.style.background="rgba(255,255,255,0.08)"; }}
            >
              {geoLoading
                ? <><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}} /> Detecting location…</>
                : "📍 Use my location"
              }
            </button>
            {geoError && <p className="hero-error" style={{marginTop:8}}>⚠️ {geoError}</p>}
          </div>

          <div className="hero-stats-strip">
            {[{num:"200+",label:"Countries"},{num:"1M+",label:"Forecasts daily"},{num:"15m",label:"Update interval"},{num:"99%",label:"Accuracy rate"}].map(s=>(
              <div className="hero-stat" key={s.label}>
                <span className="hero-stat-num">{s.num}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="scroll-cue" onClick={() => exploreRef.current?.scrollIntoView({behavior:"smooth"})} style={{cursor:"pointer"}}>
          <span>Explore</span>
          <div className="scroll-arrow"></div>
        </div>
      </div>

      <div className="home-content">
        <div className="home-content-inner" ref={exploreRef}>
          <p className="home-section-eyebrow">What's available</p>
          <h2 className="home-section-title">Explore our <span>forecast tools</span></h2>

          <div className="quick-links">
            {quickLinks.map(l => (
              <div className="quick-link-card" key={l.title} onClick={l.key ? ()=>onNavigate(l.key) : undefined} style={{cursor:l.key?"pointer":"default"}}>
                {l.live && <span className="quick-link-live">Live</span>}
                <span className="quick-link-icon">{l.icon}</span>
                <span className="quick-link-title">{l.title}</span>
                <span className="quick-link-desc">{l.desc}</span>
                <span className="quick-link-arrow">↗</span>
              </div>
            ))}
          </div>

          {/* Saved Locations */}
          {getFavourites().length > 0 && (
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,215,0,0.15)",borderRadius:16,padding:"28px 32px",marginBottom:28}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                <span style={{fontSize:20}}>★</span>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"white",margin:0}}>Saved Locations</h3>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                {getFavourites().map((f,i) => (
                  <button key={i} onClick={()=>onSearch(f.name)} style={{background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.25)",color:"white",borderRadius:50,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",display:"flex",alignItems:"center",gap:8}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,215,0,0.15)";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,215,0,0.08)";e.currentTarget.style.transform="translateY(0)";}}
                  >★ {f.name}, {f.country}</button>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
  <div style={{background: theme==="light" ? "#dbeafe" : "rgba(255,255,255,0.03)", border: `1px solid ${theme==="light" ? "#93c5fd" : "rgba(0,164,167,0.15)"}`, borderRadius:16, padding:"28px 32px", marginBottom:28}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🕐</span>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"white",margin:0}}>Recent Searches</h3>
        <span style={{fontSize:12,background:"rgba(0,164,167,0.15)",color:"#00d4d8",borderRadius:50,padding:"2px 10px",fontWeight:600}}>{history.length}</span>
      </div>
      <button
        onClick={onClearHistory}
        style={{background:"transparent",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.4)",borderRadius:50,padding:"6px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,80,80,0.4)";e.currentTarget.style.color="rgba(255,100,100,0.8)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.color="rgba(255,255,255,0.4)";}}
      >🗑 Clear all</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {history.map((h, i) => (
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background: theme==="light" ? "#bfdbfe" : "rgba(255,255,255,0.04)", border: `1px solid ${theme==="light" ? "#93c5fd" : "rgba(255,255,255,0.07)"}`, borderRadius:10, padding:"10px 16px", transition:"all 0.2s", gap:12}}
        onMouseEnter={e=>e.currentTarget.style.background= theme==="light" ? "#93c5fd" : "rgba(0,164,167,0.08)"}
        onMouseLeave={e=>e.currentTarget.style.background= theme==="light" ? "#bfdbfe" : "rgba(255,255,255,0.04)"}
        >
          <button onClick={() => onSearch(h.name)} style={{flex:1,background:"none",border:"none",color:"white",cursor:"pointer",textAlign:"left",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12,padding:0}}>
            <span style={{fontSize:16}}>🔍</span>
            <div>
              <span style={{fontSize:15,fontWeight:600,color: theme==="light" ? "#1e3a5f" : "white"}}>{h.name}</span>
              {h.country && <span style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginLeft:8}}>{h.country}</span>}
            </div>
            <span style={{fontSize:12,color: theme==="light" ? "#3b82f6" : "rgba(255,255,255,0.3)",marginLeft:"auto",paddingRight:12}}>{fmtHistoryTime(h.time)}</span>
          </button>
          <button onClick={() => onRemoveHistory(h.name)}
            style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer",fontSize:16,padding:"4px 6px",borderRadius:6,transition:"all 0.15s",lineHeight:1,flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,100,100,0.8)";e.currentTarget.style.background="rgba(255,80,80,0.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.25)";e.currentTarget.style.background="transparent";}}
          >×</button>
        </div>
      ))}
    </div>
  </div>
)}

          <div className="home-cta">
            <div className="home-cta-text">
              <h3>Get instant forecasts</h3>
              <p>Search any city above for a full 5-day breakdown with wind, humidity, pressure and a live map.</p>
            </div>
            <button className="home-cta-btn" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>Search a city →</button>
          </div>

          <div style={{marginTop:20,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"32px 36px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:28,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:18}}>
              <div style={{width:52,height:52,borderRadius:14,flexShrink:0,background:"linear-gradient(135deg,rgba(0,164,167,0.2),rgba(0,101,189,0.2))",border:"1px solid rgba(0,164,167,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>❓</div>
              <div>
                <div style={{fontSize:17,fontWeight:700,color:"white",marginBottom:4}}>Help & Support</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.5,maxWidth:380}}>Having trouble finding a forecast? Browse our FAQs or get in touch with our support team.</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>onNavigate("help")} style={{background:"linear-gradient(135deg,#00a4a7,#0065bd)",border:"none",color:"white",fontFamily:"inherit",fontSize:14,fontWeight:600,padding:"11px 24px",borderRadius:50,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,101,189,0.35)",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>View FAQs</button>
              <button onClick={()=>onNavigate("help")} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.7)",fontFamily:"inherit",fontSize:14,fontWeight:600,padding:"11px 24px",borderRadius:50,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.35)";e.currentTarget.style.color="white";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.15)";e.currentTarget.style.color="rgba(255,255,255,0.7)";}}>Contact Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── HOURLY CHART ── */
function HourlyChart({ data, unit }) {
  const [activeIdx, setActiveIdx] = useState(null);
  if (!data.length) return null;

  const temps  = data.map(d => d.temp);
  const minT   = Math.min(...temps);
  const maxT   = Math.max(...temps);
  const range  = maxT - minT || 1;

  const W = 900, H = 220, padL = 40, padR = 20, padT = 30, padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = data.length;

  const xOf  = i => padL + (i / (n - 1)) * innerW;
  const yOf  = v => padT + innerH - ((v - minT) / range) * innerH;

  // Build SVG path for temperature line
  const linePath = data.map((d,i) => `${i===0?"M":"L"}${xOf(i).toFixed(1)},${yOf(d.temp).toFixed(1)}`).join(" ");
  // Filled area under the line
  const areaPath = `${linePath} L${xOf(n-1).toFixed(1)},${(padT+innerH).toFixed(1)} L${padL},${(padT+innerH).toFixed(1)} Z`;

  // Feels-like dashed line
  const feelsPath = data.map((d,i) => `${i===0?"M":"L"}${xOf(i).toFixed(1)},${yOf(d.feels).toFixed(1)}`).join(" ");

  const active = activeIdx !== null ? data[activeIdx] : null;

  return (
    <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:16,padding:"24px 20px 12px",overflowX:"auto"}}>
      {/* Legend */}
      <div style={{display:"flex",gap:20,marginBottom:12,paddingLeft:padL}}>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"rgba(255,255,255,0.6)"}}>
          <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#00d4d8" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Temperature
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"rgba(255,255,255,0.6)"}}>
          <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round"/></svg>
          Feels like
        </div>
        {data.some(d => d.pop > 0) && (
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"rgba(255,255,255,0.6)"}}>
            <svg width="12" height="12"><rect width="12" height="12" rx="2" fill="rgba(96,165,250,0.5)"/></svg>
            Rain chance
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",minWidth:480,display:"block",overflow:"visible"}}>
        <defs>
          <linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00d4d8" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#00d4d8" stopOpacity="0.02"/>
          </linearGradient>
          <linearGradient id="popGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1"/>
          </linearGradient>
        </defs>

        {/* Rain probability bars (background) */}
        {data.map((d, i) => {
          if (!d.pop) return null;
          const bw = Math.max(innerW / n - 6, 8);
          const bh = (d.pop / 100) * innerH * 0.4;
          return (
            <rect key={`pop-${i}`}
              x={xOf(i) - bw / 2} y={padT + innerH - bh}
              width={bw} height={bh}
              fill="url(#popGrad)" rx="3"
            />
          );
        })}

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = padT + innerH * (1 - f);
          const val = Math.round(minT + f * range);
          return (
            <g key={f}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.3)">{val}°</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#hcGrad)"/>

        {/* Feels-like dashed line */}
        <path d={feelsPath} fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>

        {/* Temperature line */}
        <path d={linePath} fill="none" stroke="#00d4d8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

        {/* Data points + hover targets */}
        {data.map((d, i) => {
          const cx = xOf(i), cy = yOf(d.temp);
          const isActive = activeIdx === i;
          return (
            <g key={i} onMouseEnter={() => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(null)} style={{cursor:"default"}}>
              {/* Invisible wider hit area */}
              <rect x={cx - innerW/(n*2)} y={padT} width={innerW/n} height={innerH+padB} fill="transparent"/>
              {/* Vertical highlight */}
              {isActive && <line x1={cx} y1={padT} x2={cx} y2={padT+innerH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3"/>}
              {/* Dot */}
              <circle cx={cx} cy={cy} r={isActive ? 5 : 3.5}
                fill={isActive ? "#00d4d8" : "#0a1628"}
                stroke="#00d4d8" strokeWidth={isActive ? 2 : 1.5}
                style={{transition:"r 0.15s"}}
              />
              {/* Weather icon above point */}
              <text x={cx} y={padT - 8} textAnchor="middle" fontSize="15">{d.icon}</text>
              {/* Time label */}
              <text x={cx} y={padT + innerH + 18} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.45)">{d.time}</text>
              {/* Rain % label */}
              {d.pop > 0 && (
                <text x={cx} y={padT + innerH + 32} textAnchor="middle" fontSize="9" fill="#60a5fa">{d.pop}%</text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {active && (() => {
          const i = activeIdx;
          const cx = xOf(i);
          const tw = 120, th = 80;
          const tx = Math.min(Math.max(cx - tw/2, padL), padL + innerW - tw);
          const ty = padT - th - 14;
          return (
            <g>
              <rect x={tx} y={ty} width={tw} height={th} rx="8"
                fill="#0a1628" stroke="rgba(0,212,216,0.4)" strokeWidth="1"
                style={{filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.5))"}}
              />
              <text x={tx+tw/2} y={ty+18} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{active.time}</text>
              <text x={tx+tw/2} y={ty+34} textAnchor="middle" fontSize="13" fontWeight="700" fill="#00d4d8">{active.temp}°</text>
              <text x={tx+tw/2} y={ty+50} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.55)">Feels {active.feels}°</text>
              <text x={tx+tw/2} y={ty+65} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.45)">💧{active.humidity}% · 💨{active.wind}km/h</text>
            </g>
          );
        })()}
      </svg>

      {/* Scrollable slot cards below chart */}
      <div style={{display:"flex",gap:8,marginTop:8,overflowX:"auto",paddingBottom:4}}>
        {data.map((d,i) => (
          <div key={i}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
            style={{
              flexShrink:0, minWidth:72, padding:"10px 10px 8px",
              borderRadius:10, textAlign:"center", cursor:"default",
              background: activeIdx===i ? "rgba(0,212,216,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeIdx===i ? "rgba(0,212,216,0.4)" : "rgba(255,255,255,0.07)"}`,
              transition:"all 0.15s",
            }}
          >
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginBottom:4}}>{d.time}</div>
            <div style={{fontSize:18,marginBottom:4}}>{d.icon}</div>
            <div style={{fontSize:14,fontWeight:700,color:"white"}}>{d.temp}°</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:2}}>{d.desc}</div>
            {d.pop > 0 && <div style={{fontSize:10,color:"#60a5fa",marginTop:2}}>{d.pop}%</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── WEATHER PAGE ── */
function WeatherPage({ weather, forecast, onBack, onSearch, history = [], onRemoveHistory }) {
  const condition  = weather.weather[0].main;
  const isNight    = weather.dt < weather.sys.sunrise || weather.dt > weather.sys.sunset;
  const heroBg     = bgClass(condition, isNight);
  const offset     = weather.timezone;

  const [unit, setUnit] = useState(() => localStorage.getItem("wo_temp_unit") || "C");
  const toggleUnit = () => {
    const next = unit==="C"?"F":"C";
    setUnit(next);
    localStorage.setItem("wo_temp_unit", next);
  };

  const [favs, setFavs] = useState(getFavourites);
  const [showHistory, setShowHistory] = useState(false);
  const isFav = favs.some(f => f.name===weather.name && f.country===weather.sys.country);
  const toggleFav = () => {
    const updated = isFav
      ? favs.filter(f => !(f.name===weather.name && f.country===weather.sys.country))
      : [{name:weather.name,country:weather.sys.country},...favs].slice(0,10);
    setFavs(updated);
    saveFavourites(updated);
  };

  const dailyMap = {};
  forecast.forEach(item => { const day=item.dt_txt.slice(0,10); if(!dailyMap[day]) dailyMap[day]=item; });
  const today = new Date().toISOString().slice(0, 10);
  const daily = Object.values(dailyMap).filter(item => item.dt_txt.slice(0, 10) !== today).slice(0, 5);

  const dailyMinMax = {};
  forecast.forEach(item => {
    const day = item.dt_txt.slice(0,10);
    if(!dailyMinMax[day]) dailyMinMax[day]={min:item.main.temp_min,max:item.main.temp_max};
    else { dailyMinMax[day].min=Math.min(dailyMinMax[day].min,item.main.temp_min); dailyMinMax[day].max=Math.max(dailyMinMax[day].max,item.main.temp_max); }
  });

  // Today's hourly data (OWM /forecast gives 3-hourly slots; filter to today's date)
  const todayStr = new Date().toISOString().slice(0,10);
  const todayHourly = forecast
    .filter(item => item.dt_txt.slice(0,10) === todayStr)
    .map(item => ({
      time: fmtTime(item.dt, offset),
      temp: fmtTempVal(item.main.temp, unit),
      feels: fmtTempVal(item.main.feels_like, unit),
      humidity: item.main.humidity,
      wind: Math.round(item.wind.speed * 3.6),
      icon: weatherIcon(item.weather[0].main, false),
      desc: item.weather[0].description,
      pop: Math.round((item.pop || 0) * 100),
    }));

  const humidity     = weather.main.humidity;
  const windSpeedMs  = weather.wind.speed;
  const windSpeedKmh = Math.round(windSpeedMs*3.6);
  const windDeg      = weather.wind.deg;
  const visibility   = weather.visibility ? Math.round(weather.visibility/1000) : "—";
  const pressure     = weather.main.pressure;

  return (
    <div className="weather-page">

      {/* Topbar */}
      <div className="weather-topbar">
        <div className="weather-topbar-inner">
          <button className="back-btn" onClick={onBack}>← Home</button>
          <SearchBar compact onSearch={onSearch} placeholder="Search another city…" />

          {/* History dropdown */}
{history.length > 0 && (
  <div style={{position:"relative",flexShrink:0}}>
    <button
      onClick={() => setShowHistory(p => !p)}
      title="Recent searches"
      style={{height:35,padding:"0 14px",borderRadius:20,border:`1px solid ${showHistory?"rgba(0,164,167,0.5)":"rgba(255,255,255,0.2)"}`,background:showHistory?"rgba(0,164,167,0.2)":"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:14,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,transition:"all 0.2s"}}
    >
      🕐 <span style={{fontSize:12,fontWeight:600}}>{history.length}</span>
    </button>
    {showHistory && (
      <div className="history-dropdown" style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:280,background:"#0a1628",border:"1px solid rgba(0,164,167,0.25)",borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,0.5)",zIndex:200,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13,fontWeight:700,color:"white"}}>Recent Searches</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{history.length} / 10</span>
        </div>
        <div style={{maxHeight:260,overflowY:"auto"}}>
          {history.map((h, i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)",transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,164,167,0.08)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <button onClick={() => { onSearch(h.name); setShowHistory(false); }} style={{flex:1,background:"none",border:"none",color:"white",cursor:"pointer",textAlign:"left",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13}}>🔍</span>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:600}}>{h.name}</span>
                  {h.country && <span style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginLeft:6}}>{h.country}</span>}
                </div>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{fmtHistoryTime(h.time)}</span>
              </button>
              <button onClick={() => onRemoveHistory(h.name)}
                style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.2)",cursor:"pointer",fontSize:14,padding:"2px 4px",borderRadius:4,transition:"color 0.15s",lineHeight:1}}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(255,100,100,0.8)"}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}
              >×</button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

          {/* Favourite toggle */}
          <button onClick={toggleFav} title={isFav?"Remove from favourites":"Save to favourites"} style={{height:35,padding:"0 16px",borderRadius:20,border:`1px solid ${isFav?"rgba(255,200,0,0.5)":"rgba(255,255,255,0.2)"}`,background:isFav?"rgba(255,200,0,0.15)":"rgba(255,255,255,0.1)",color:isFav?"#ffd700":"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:18,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,transition:"all 0.2s",flexShrink:0}}>
            {isFav?"★":"☆"}
          </button>

          {/* °C / °F toggle */}
          <button onClick={toggleUnit} style={{display:"flex",alignItems:"center",height:35,borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",cursor:"pointer",padding:0,fontSize:13,fontWeight:500,fontFamily:"inherit",flexShrink:0,transition:"background 0.2s"}}>
            <span style={{padding:"0 16px",height:"100%",display:"flex",alignItems:"center",background:unit==="C"?"rgba(0,164,167,0.7)":"transparent",color:unit==="C"?"white":"rgba(255,255,255,0.7)",transition:"all 0.2s"}}>°C</span>
            <span style={{width:1,height:"60%",background:"rgba(255,255,255,0.2)",flexShrink:0}} />
            <span style={{padding:"0 16px",height:"100%",display:"flex",alignItems:"center",background:unit==="F"?"rgba(0,164,167,0.7)":"transparent",color:unit==="F"?"white":"rgba(255,255,255,0.7)",transition:"all 0.2s"}}>°F</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className={`current-weather-hero ${heroBg}`}>
        <SkyScene condition={condition} isNight={isNight} windSpeed={windSpeedMs} />
        <div className="current-hero-inner">

          {/* Left: weather info glass card */}
          <div className="current-weather-hero-transparent">
            <h1 className="city-name">{weather.name}</h1>
            <p className="city-country">{weather.sys.country} · {isNight?"Night":"Day"}</p>
            <div className="current-main">
              <span className="current-temp">{fmtTempVal(weather.main.temp,unit)}°</span>
              <span className="current-icon">{weatherIcon(condition,isNight)}</span>
            </div>
            <p className="current-desc">{weather.weather[0].description}</p>
            <div className="current-stats">
              <div className="stat-item"><span className="stat-label">High</span><span className="stat-value">{fmtTemp(weather.main.temp_max,unit)}</span></div>
              <div className="stat-item"><span className="stat-label">Low</span><span className="stat-value">{fmtTemp(weather.main.temp_min,unit)}</span></div>
              <div className="stat-item"><span className="stat-label">Sunrise</span><span className="stat-value">{fmtTime(weather.sys.sunrise,offset)}</span></div>
              <div className="stat-item"><span className="stat-label">Sunset</span><span className="stat-value">{fmtTime(weather.sys.sunset,offset)}</span></div>
            </div>
          </div>

          {/* Right: map */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginLeft:"auto"}}>
            <div style={{borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,0.15)",width:300,height:400,boxShadow:"0 4px 24px rgba(0,0,0,0.35)",flexShrink:0}}>
              <iframe title="City Map" width="440" height="440" style={{border:"none",display:"block"}}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${weather.coord.lon-0.15}%2C${weather.coord.lat-0.15}%2C${weather.coord.lon+0.15}%2C${weather.coord.lat+0.15}&layer=mapnik&marker=${weather.coord.lat}%2C${weather.coord.lon}&lang=en`}
              />
            </div>
            <div style={{display:"flex",gap:24,padding:"6px 4px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.7px",fontWeight:600}}>Feels like</span>
                <span style={{fontSize:16,fontWeight:700,color:"white"}}>{fmtTemp(weather.main.feels_like,unit)}</span>
              </div>
              <div style={{width:1,background:"rgba(255,255,255,0.15)"}}></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.7px",fontWeight:600}}>Local Time</span>
                <span style={{fontSize:16,fontWeight:700,color:"white"}}>{fmtTime(weather.dt,offset)}</span>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>UTC{offset>=0?"+":""}{offset/3600}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Hourly Chart */}
      {todayHourly.length > 0 && (
        <div className="forecast-section">
          <h2 className="section-heading">Today's Hourly Forecast <span style={{fontSize:13,fontWeight:500,opacity:0.5,marginLeft:6}}>· {fmtTempUnit(unit)}</span></h2>
          <HourlyChart data={todayHourly} unit={unit} />
        </div>
      )}

      {/* Forecast */}
      <div className="forecast-section">
        <h2 className="section-heading">5-Day Forecast <span style={{fontSize:13,fontWeight:500,opacity:0.5,marginLeft:6}}>· {fmtTempUnit(unit)}</span></h2>
        <div className="forecast-grid">
          {daily.map((item,i) => {
            const day=item.dt_txt.slice(0,10);
            const mm=dailyMinMax[day]||{};
            const cond=item.weather[0].main;
            return (
              <div className="forecast-card" key={item.dt}>
                <span className="forecast-day">{fmtDay(item.dt_txt)}</span>
                <span className="forecast-date">{fmtDate(item.dt_txt)}</span>
                <span className="forecast-icon">{weatherIcon(cond,false)}</span>
                <div className="forecast-temps">
                  <span className="forecast-high">{fmtTempVal(mm.max??item.main.temp_max,unit)}°</span>
                  <span className="forecast-low">{fmtTempVal(mm.min??item.main.temp_min,unit)}°</span>
                </div>
                <span className="forecast-desc">{item.weather[0].description}</span>
                <div className="forecast-detail">
                  <span>💧 {item.main.humidity}%</span>
                  <span>💨 {Math.round(item.wind.speed*3.6)} km/h</span>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="section-heading" style={{marginTop:32}}>Current Conditions</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-label">💨 Wind</div>
            <div className="info-card-value">{windSpeedKmh} <span style={{fontSize:16,fontWeight:400}}>km/h</span></div>
            <div className="info-card-sub"><span className="wind-arrow" style={{transform:`rotate(${windDeg}deg)`}}>↑</span> {windDir(windDeg)} · gusts up to {Math.round((windSpeedMs+2)*3.6)} km/h</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">💧 Humidity</div>
            <div className="info-card-value">{humidity}<span style={{fontSize:16,fontWeight:400}}>%</span></div>
            <div className="progress-bar"><div className="progress-fill" style={{width:`${humidity}%`}}></div></div>
            <div className="info-card-sub" style={{marginTop:6}}>{humidity<40?"Dry":humidity<70?"Comfortable":"Humid"}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">👁 Visibility</div>
            <div className="info-card-value">{visibility} <span style={{fontSize:16,fontWeight:400}}>km</span></div>
            <div className="info-card-sub">{visibility>=10?"Excellent":visibility>=5?"Good":visibility>=2?"Moderate":"Poor"}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">🔵 Pressure</div>
            <div className="info-card-value">{pressure} <span style={{fontSize:16,fontWeight:400}}>hPa</span></div>
            <div className="info-card-sub">{pressure>1013?"High pressure – settled":"Low pressure – unsettled"}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">🌅 Sunrise / Sunset</div>
            <div className="sun-row" style={{margin:"10px 0"}}>
              <span className="sun-time">{fmtTime(weather.sys.sunrise,offset)}</span>
              <span className="sun-sep"></span>
              <span className="sun-time">{fmtTime(weather.sys.sunset,offset)}</span>
            </div>
            <div className="info-card-sub">Local time (UTC{offset>=0?"+":""}{offset/3600})</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">☁️ Cloud Cover</div>
            <div className="info-card-value">{weather.clouds?.all??"—"}<span style={{fontSize:16,fontWeight:400}}>%</span></div>
            <div className="progress-bar"><div className="progress-fill" style={{width:`${weather.clouds?.all||0}%`,background:"linear-gradient(90deg,#6b7b8d,#a0aec0)"}}></div></div>
            <div className="info-card-sub" style={{marginTop:6}}>{(weather.clouds?.all||0)<20?"Clear skies":(weather.clouds?.all||0)<60?"Partly cloudy":"Overcast"}</div>
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

/* ── LIVE CHAT ── */
const BOT_RESPONSES = {
  greet:["Hello! 👋 I'm the Weather Office support assistant. How can I help you today?"],
  default:["Thanks for reaching out! A support agent will follow up within 24 hours.","Great question. Let me note that for you — our team will get back to you shortly.","I've logged your message. Is there anything else I can help with?"],
  keywords:[
    {match:["city","find","search","not found"],    reply:"Try using the full English city name, e.g. 'New York' or 'Bradford, UK'. If it still fails, the city may not be in our database."},
    {match:["accurate","accuracy","wrong","incorrect"],reply:"Forecasts from OpenWeatherMap are typically accurate to ±1–2°C for 24–48h. Accuracy drops slightly beyond 3 days — this is normal for all weather services."},
    {match:["update","refresh","how often","latest"],reply:"Current conditions refresh every 10 minutes. The 5-day forecast updates every 3 hours."},
    {match:["map","language","arabic","chinese","foreign"],reply:"Map labels come from OpenStreetMap and may display in the local language for some countries. This is a limitation of the free tile layer we use."},
    {match:["beaufort","wind scale","bft"],          reply:"The Beaufort scale runs from 0 (Calm) to 12 (Hurricane). Each level describes observable wind effects — you can see the full chart on the Wind Forecast page."},
    {match:["data","privacy","stored","location"],   reply:"We never store your location or search history on our servers. Searches go directly to OpenWeatherMap's API."},
    {match:["history","historical","past"],          reply:"Historical weather data isn't available in this version. We only show live conditions and 5-day forecasts."},
    {match:["thank","thanks","cheers","great","perfect"],reply:"You're very welcome! 😊 Is there anything else I can help with?"},
    {match:["bye","goodbye","done","no thanks"],     reply:"Thanks for chatting! Have a great day ☀️"},
  ],
};
function getBotReply(msg) {
  const lower=msg.toLowerCase();
  for(const kw of BOT_RESPONSES.keywords) { if(kw.match.some(k=>lower.includes(k))) return kw.reply; }
  return BOT_RESPONSES.default[Math.floor(Math.random()*BOT_RESPONSES.default.length)];
}

function LiveChatWidget({ onClose }) {
  const [messages,setMessages]=useState([{from:"bot",text:BOT_RESPONSES.greet[0],time:new Date()}]);
  const [input,setInput]=useState("");
  const [typing,setTyping]=useState(false);
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,typing]);
  const send=()=>{
    const text=input.trim();if(!text)return;
    const now=new Date();
    setMessages(prev=>[...prev,{from:"user",text,time:now}]);
    setInput("");setTyping(true);
    setTimeout(()=>{setTyping(false);setMessages(prev=>[...prev,{from:"bot",text:getBotReply(text),time:new Date()}]);},900+Math.random()*600);
  };
  const fmt=d=>d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  const bubble=from=>({maxWidth:"80%",alignSelf:from==="user"?"flex-end":"flex-start",background:from==="user"?"linear-gradient(135deg,#00a4a7,#0065bd)":"#152840",border:from==="user"?"none":"1px solid rgba(255,255,255,0.07)",borderRadius:from==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",fontSize:14,color:"white",lineHeight:1.5});
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:300,width:360,height:520,background:"#0a1628",border:"1px solid rgba(0,164,167,0.35)",borderRadius:18,display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.6)",overflow:"hidden",animation:"chatSlideIn 0.25s ease"}}>
      <div style={{background:"linear-gradient(135deg,#003a70,#005fa3)",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:"white"}}>Weather Office Support</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}></span>Online now</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"white",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start"}}>
            <div style={bubble(m.from)}>{m.text}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3,textAlign:"right"}}>{fmt(m.time)}</div>
          </div>
        ))}
        {typing&&<div style={{alignSelf:"flex-start"}}><div style={{...bubble("bot"),padding:"12px 16px"}}><span style={{display:"flex",gap:4,alignItems:"center"}}>{[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.5)",animation:`typingDot 1.2s ${i*0.2}s ease-in-out infinite`}}></span>)}</span></div></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",padding:"12px 14px",display:"flex",gap:8,alignItems:"center",background:"#071422"}}>
        <input style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:"10px 16px",color:"white",fontSize:14,outline:"none",fontFamily:"inherit"}} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message…"/>
        <button style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#00a4a7,#0065bd)",border:"none",color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}} onClick={send} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>➤</button>
      </div>
    </div>
  );
}

/* ── EMAIL MODAL ── */
function EmailModal({ onClose }) {
  const [form,setForm]=useState({name:"",email:"",subject:"",message:""});
  const [errors,setErrors]=useState({});
  const [status,setStatus]=useState("idle");
  const validate=()=>{const e={};if(!form.name.trim())e.name="Name is required.";if(!form.email.trim())e.email="Email is required.";else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))e.email="Enter a valid email address.";if(!form.subject.trim())e.subject="Subject is required.";if(form.message.trim().length<10)e.message="Message must be at least 10 characters.";return e;};
  const handleSubmit=()=>{const e=validate();if(Object.keys(e).length){setErrors(e);return;}setErrors({});setStatus("sending");setTimeout(()=>setStatus("sent"),1400);};
  const iS=key=>({background:"rgba(255,255,255,0.05)",border:`1px solid ${errors[key]?"#e74c3c":"rgba(255,255,255,0.12)"}`,borderRadius:10,padding:"12px 14px",color:"white",fontSize:14,fontFamily:"inherit",outline:"none",transition:"border-color 0.2s"});
  const field=(label,key,type="text",rows)=>(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.7px"}}>{label} <span style={{color:"#e74c3c"}}>*</span></label>
      {rows?<textarea rows={rows} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={{...iS(key),resize:"vertical"}} onFocus={e=>e.target.style.borderColor=errors[key]?"#e74c3c":"rgba(0,212,216,0.5)"} onBlur={e=>e.target.style.borderColor=errors[key]?"#e74c3c":"rgba(255,255,255,0.12)"}/>:<input type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={iS(key)} onFocus={e=>e.target.style.borderColor=errors[key]?"#e74c3c":"rgba(0,212,216,0.5)"} onBlur={e=>e.target.style.borderColor=errors[key]?"#e74c3c":"rgba(255,255,255,0.12)"}/>}
      {errors[key]&&<span style={{fontSize:12,color:"#e74c3c"}}>⚠ {errors[key]}</span>}
    </div>
  );
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"#0a1628",border:"1px solid rgba(0,164,167,0.25)",borderTop:"3px solid #00a4a7",borderRadius:18,width:"100%",maxWidth:520,padding:36,boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}} onClick={e=>e.stopPropagation()}>
        {status==="sent"?(<div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:56,marginBottom:16}}>✅</div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"white",marginBottom:10}}>Message Sent!</h2><p style={{fontSize:14,color:"rgba(255,255,255,0.5)",lineHeight:1.6,marginBottom:28}}>Thanks, <strong style={{color:"white"}}>{form.name}</strong>! We'll reply to <strong style={{color:"#00d4d8"}}>{form.email}</strong> within 24 hours.</p><button onClick={onClose} style={{background:"linear-gradient(135deg,#00a4a7,#0065bd)",border:"none",color:"white",padding:"12px 32px",borderRadius:50,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>):(
          <><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}><div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"white",marginBottom:4}}>📧 Email Support</h2><p style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>We'll reply within 24 hours</p></div><button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"white",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>
          <div style={{display:"flex",flexDirection:"column",gap:18}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{field("Your Name","name")}{field("Email Address","email","email")}</div>{field("Subject","subject")}{field("Message","message","text",5)}<button onClick={handleSubmit} disabled={status==="sending"} style={{background:status==="sending"?"rgba(0,164,167,0.4)":"linear-gradient(135deg,#00a4a7,#0065bd)",border:"none",color:"white",padding:"14px",borderRadius:50,fontSize:15,fontWeight:700,cursor:status==="sending"?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>{status==="sending"?<><span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}></span>Sending…</>:"Send Message →"}</button></div></>
        )}
      </div>
    </div>
  );
}

/* ── BUG REPORT ── */
function BugReportModal({ onClose }) {
  const [form,setForm]=useState({title:"",category:"ui",steps:"",expected:"",actual:"",email:""});
  const [errors,setErrors]=useState({});
  const [status,setStatus]=useState("idle");
  const CATS=[{value:"ui",label:"UI / Visual Issue"},{value:"forecast",label:"Incorrect Forecast Data"},{value:"map",label:"Map Problem"},{value:"search",label:"City Search Failure"},{value:"perf",label:"Performance / Loading"},{value:"other",label:"Other"}];
  const validate=()=>{const e={};if(!form.title.trim())e.title="A short title is required.";if(form.steps.trim().length<10)e.steps="Please describe the steps (min 10 chars).";if(!form.actual.trim())e.actual="Please describe what actually happened.";if(form.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))e.email="Enter a valid email address.";return e;};
  const handleSubmit=()=>{const e=validate();if(Object.keys(e).length){setErrors(e);return;}setErrors({});setStatus("sending");setTimeout(()=>setStatus("sent"),1400);};
  const iS=key=>({background:"rgba(255,255,255,0.05)",border:`1px solid ${errors[key]?"#e74c3c":"rgba(255,255,255,0.12)"}`,borderRadius:10,padding:"11px 14px",color:"white",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color 0.2s"});
  const field=(label,key,el="input",extra={})=>(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.7px"}}>{label}{extra.required!==false&&<span style={{color:"#e74c3c"}}> *</span>}</label>
      {el==="textarea"?<textarea rows={extra.rows||3} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={{...iS(key),resize:"vertical"}} placeholder={extra.placeholder||""} onFocus={e=>e.target.style.borderColor=errors[key]?"#e74c3c":"rgba(0,212,216,0.5)"} onBlur={e=>e.target.style.borderColor=errors[key]?"#e74c3c":"rgba(255,255,255,0.12)"}/>:el==="select"?<select value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={{...iS(key),cursor:"pointer"}}>{CATS.map(c=><option key={c.value} value={c.value} style={{background:"#0a1628"}}>{c.label}</option>)}</select>:<input type={extra.type||"text"} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={iS(key)} placeholder={extra.placeholder||""} onFocus={e=>e.target.style.borderColor=errors[key]?"#e74c3c":"rgba(0,212,216,0.5)"} onBlur={e=>e.target.style.borderColor=errors[key]?"#e74c3c":"rgba(255,255,255,0.12)"}/>}
      {errors[key]&&<span style={{fontSize:12,color:"#e74c3c"}}>⚠ {errors[key]}</span>}
    </div>
  );
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"#0a1628",border:"1px solid rgba(231,76,60,0.3)",borderTop:"3px solid #e74c3c",borderRadius:18,width:"100%",maxWidth:540,maxHeight:"90vh",overflowY:"auto",padding:36,boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}} onClick={e=>e.stopPropagation()}>
        {status==="sent"?(<div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:56,marginBottom:16}}>🎉</div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"white",marginBottom:10}}>Bug Reported!</h2><p style={{fontSize:14,color:"rgba(255,255,255,0.5)",lineHeight:1.6,marginBottom:10}}>Thanks for helping us improve! Your report for <strong style={{color:"white"}}>"{form.title}"</strong> has been logged.</p>{form.email&&<p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:28}}>We'll follow up at <strong style={{color:"#00d4d8"}}>{form.email}</strong> if we need more details.</p>}<button onClick={onClose} style={{background:"linear-gradient(135deg,#e74c3c,#c0392b)",border:"none",color:"white",padding:"12px 32px",borderRadius:50,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>):(
          <><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}><div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"white",marginBottom:4}}>🐛 Report a Bug</h2><p style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>Help us squash it — the more detail the better</p></div><button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"white",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button></div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>{field("Bug Title","title","input",{placeholder:"e.g. Temperature not showing for Tokyo"})}{field("Category","category","select")}{field("Steps to Reproduce","steps","textarea",{rows:3,placeholder:"1. Search for a city\n2. Click on...\n3. See error",required:true})}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{field("Expected Behaviour","expected","textarea",{rows:2,placeholder:"What should happen?",required:false})}{field("Actual Behaviour","actual","textarea",{rows:2,placeholder:"What actually happened?"})}</div>{field("Your Email (optional)","email","input",{type:"email",placeholder:"so we can follow up",required:false})}<div style={{display:"flex",gap:10,marginTop:4}}><button onClick={handleSubmit} disabled={status==="sending"} style={{flex:1,background:status==="sending"?"rgba(231,76,60,0.4)":"linear-gradient(135deg,#e74c3c,#c0392b)",border:"none",color:"white",padding:"14px",borderRadius:50,fontSize:15,fontWeight:700,cursor:status==="sending"?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>{status==="sending"?<><span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}></span>Submitting…</>:"Submit Bug Report →"}</button><button onClick={onClose} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.6)",padding:"14px 20px",borderRadius:50,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.35)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}>Cancel</button></div></div></>
        )}
      </div>
    </div>
  );
}

/* ── HELP PAGE ── */
function HelpPage({ onBack }) {
  const [openFaq,setOpenFaq]=useState(null);
  const [showChat,setShowChat]=useState(false);
  const [showEmail,setShowEmail]=useState(false);
  const [showBug,setShowBug]=useState(false);
  const faqs=[
    {q:"Why can't I find my city?",a:"Try using the full English name of the city, e.g. 'New York' instead of 'NY'. For smaller towns, try adding the country name, e.g. 'Bradford, UK'."},
    {q:"How accurate are the forecasts?",a:"Forecasts are powered by OpenWeatherMap and are generally accurate to within 1–2°C for 1–2 day outlooks. Accuracy decreases slightly beyond 3 days."},
    {q:"How often is data updated?",a:"Current weather is updated every 10 minutes. The 5-day forecast refreshes every 3 hours automatically."},
    {q:"What does the Beaufort scale mean?",a:"The Beaufort scale rates wind speed from 0 (Calm) to 12 (Hurricane force). It's a standardised way to describe wind effects on land and sea."},
    {q:"Why is the map showing a different language?",a:"The OpenStreetMap tiles may render labels in the local language for some regions. We've set English as the preferred language, but full English coverage depends on OSM data."},
    {q:"Can I see historical weather data?",a:"Currently the app shows live and 5-day forecast data only. Historical data is not available in this version."},
    {q:"Is my location data stored?",a:"No. Your search queries are sent directly to the OpenWeatherMap API and are not stored or logged by this app."},
  ];
  const cards=[
    {icon:"📧",title:"Email Support",sub:"Send us a message",note:"Response within 24 hours",badge:"Open Form →",color:"#00d4d8",bg:"rgba(0,164,167,0.1)",border:"rgba(0,164,167,0.25)",hb:"rgba(0,164,167,0.4)",fn:()=>setShowEmail(true)},
    {icon:"💬",title:"Live Chat",sub:"Online now",note:"Instant AI-assisted support",badge:"Start Chat →",color:"#4ade80",bg:"rgba(74,222,128,0.1)",border:"rgba(74,222,128,0.25)",hb:"rgba(0,164,167,0.4)",fn:()=>setShowChat(true)},
    {icon:"🐛",title:"Report a Bug",sub:"Found something broken?",note:"Help us squash it fast",badge:"File a Report →",color:"#e74c3c",bg:"rgba(231,76,60,0.1)",border:"rgba(231,76,60,0.25)",hb:"rgba(231,76,60,0.4)",fn:()=>setShowBug(true)},
  ];
  return (
    <div style={{fontFamily:"'DM Sans','Source Sans 3',sans-serif",background:"#03080f",minHeight:"100vh",color:"white"}}>
      <div style={{background:"#001a38",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"12px 24px",display:"flex",alignItems:"center",gap:16}}>
        <button className="back-btn" onClick={onBack}>← Home</button>
        <span style={{fontSize:20}}>❓</span>
        <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,fontWeight:700}}>Help & Support</span>
      </div>
      <div style={{background:"linear-gradient(135deg,#071e3d 0%,#0a2a5e 60%,#071e3d 100%)",borderBottom:"1px solid rgba(0,164,167,0.15)",padding:"52px 24px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,164,167,0.12) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:52,marginBottom:16}}>🛟</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,4vw,44px)",fontWeight:900,color:"white",marginBottom:12,letterSpacing:"-0.5px"}}>How can we help?</h1>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.45)",maxWidth:440,margin:"0 auto",lineHeight:1.6}}>Find answers below, or reach out directly via email or live chat.</p>
        </div>
      </div>
      <div style={{maxWidth:800,margin:"0 auto",padding:"48px 20px 120px"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"white",marginBottom:16}}>Get in Touch</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))",gap:14,marginBottom:52}}>
          {cards.map((c,i)=>(
            <div key={i} style={{background:"#0a1628",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"24px 20px",transition:"all 0.2s",cursor:"pointer"}} onClick={c.fn}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.hb;e.currentTarget.style.background="#0f1f35";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.background="#0a1628";e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{fontSize:32,marginBottom:14}}>{c.icon}</div>
              <div style={{fontSize:14,fontWeight:700,color:"white",marginBottom:6}}>{c.title}</div>
              <div style={{fontSize:13,color:c.color,marginBottom:4}}>{c.sub}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:14}}>{c.note}</div>
              <span style={{fontSize:12,fontWeight:700,color:c.color,background:c.bg,border:`1px solid ${c.border}`,borderRadius:20,padding:"4px 12px"}}>{c.badge}</span>
            </div>
          ))}
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"white",marginBottom:20}}>Frequently Asked Questions</h2>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:48}}>
          {faqs.map((f,i)=>(
            <div key={i} style={{background:openFaq===i?"rgba(0,164,167,0.08)":"#0a1628",border:`1px solid ${openFaq===i?"rgba(0,164,167,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:12,overflow:"hidden",transition:"all 0.2s"}}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:"100%",background:"none",border:"none",color:"white",padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit",gap:16}}>
                <span style={{fontSize:15,fontWeight:600,textAlign:"left"}}>{f.q}</span>
                <span style={{fontSize:20,color:"#00d4d8",flexShrink:0,transition:"transform 0.25s",transform:openFaq===i?"rotate(45deg)":"rotate(0deg)"}}>+</span>
              </button>
              {openFaq===i&&<div style={{padding:"0 20px 18px",fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>{f.a}</div>}
            </div>
          ))}
        </div>
        <div style={{padding:"20px 24px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.3)",lineHeight:1.6}}>
          Weather data provided by <span style={{color:"#00d4d8"}}>OpenWeatherMap</span>. This app is for demonstration purposes. Map tiles © <span style={{color:"#00d4d8"}}>OpenStreetMap</span> contributors.
        </div>
      </div>
      {!showChat&&<button onClick={()=>setShowChat(true)} style={{position:"fixed",bottom:24,right:24,zIndex:200,width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#00a4a7,#0065bd)",border:"none",color:"white",fontSize:24,cursor:"pointer",boxShadow:"0 8px 24px rgba(0,101,189,0.45)",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>💬</button>}
      {showChat&&<LiveChatWidget onClose={()=>setShowChat(false)}/>}
      {showEmail&&<EmailModal onClose={()=>setShowEmail(false)}/>}
      {showBug&&<BugReportModal onClose={()=>setShowBug(false)}/>}
      <style>{`@keyframes chatSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes typingDot{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-6px);opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── ROOT APP ── */
function App() {
  const [weather,   setWeather]   = useState(null);
  const [forecast,  setForecast]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [page,      setPage]      = useState("home");
  const [geoLoading,setGeoLoading]= useState(false);
  const [geoError,  setGeoError]  = useState(null);
  const [history,   setHistory]   = useState(getHistory);
  const refreshHistory = () => setHistory(getHistory());
  const [theme, setTheme] = useState(
  () => localStorage.getItem("wo_theme") || "dark"
);
const toggleTheme = () => {
  const next = theme === "dark" ? "light" : "dark";
  setTheme(next);
  localStorage.setItem("wo_theme", next);
};

  useEffect(() => {
    const saved = localStorage.getItem("wo_last_city");
    if (saved) handleSearch(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (city) => {
    setLoading(true); setError(null);
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      const [wRes,fRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
      ]);
      if(!wRes.ok) throw new Error("City not found. Please check the spelling and try again.");
      const [wData,fData] = await Promise.all([wRes.json(),fRes.json()]);
      setWeather(wData); setForecast(fData.list); setPage("weather");
      localStorage.setItem("wo_last_city", wData.name);
      addToHistory(wData.name, wData.sys?.country || "");
      refreshHistory();
    } catch(err) { 
      setError(err.message);
      setWeather(null);
      setForecast([]);
      setPage("home");
      localStorage.removeItem("wo_last_city"); 

    }
    finally { setLoading(false); }
  };

  const handleGeoLocate = () => {
    if(!navigator.geolocation){ setGeoError("Geolocation is not supported by your browser."); return; }
    setGeoLoading(true); setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
          const [wRes,fRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${apiKey}&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${apiKey}&units=metric`),
          ]);
          if(!wRes.ok) throw new Error("Could not fetch weather for your location.");
          const [wData,fData] = await Promise.all([wRes.json(),fRes.json()]);
          setWeather(wData); setForecast(fData.list); setPage("weather");
          localStorage.setItem("wo_last_city", wData.name);
        } catch(err) { setGeoError(err.message); }
        finally { setGeoLoading(false); }
      },
      (err) => {
        setGeoLoading(false);
        const msgs={1:"Location access denied. Please allow location in your browser.",2:"Your location could not be determined. Try searching manually.",3:"Location request timed out. Try searching manually."};
        setGeoError(msgs[err.code]||"Could not get your location.");
      },
      { timeout:10000, maximumAge:300000 }
    );
  };

  const handleBack = () => {
    setPage("home"); setWeather(null); setForecast([]); setError(null);
    localStorage.removeItem("wo_last_city");
  };

  return (
  <div className={`app-root ${theme}`}>
    <header className="mo-header">
        <div className="mo-logo" onClick={handleBack}>
          <div className="mo-logo-mark">
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

          {/* Dark / Light mode toggle */}
        <button
        onClick={toggleTheme}
        title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
        style={{
          marginLeft:"auto", height:36, padding:"0 16px",
          borderRadius:50, border:"1px solid rgba(255,255,255,0.2)",
          background:"rgba(255,255,255,0.08)", color:"white",
          cursor:"pointer", fontSize:14, fontWeight:600,
          fontFamily:"inherit", display:"flex", alignItems:"center",
          gap:8, transition:"all 0.2s",
        }}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"}
        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"}
      >
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>
    </header>

      {loading && <div className="loading-wrap"><div className="loading-spinner"></div><p className="loading-text">Fetching forecast…</p></div>}

      {!loading && page==="home" && (
        <HomePage
        onSearch={handleSearch} error={error} loading={loading} onNavigate={setPage}
        onGeoLocate={handleGeoLocate} geoLoading={geoLoading} geoError={geoError}
        history={history}
        onRemoveHistory={(name) => { removeFromHistory(name); refreshHistory(); }}
        onClearHistory={() => { clearHistory(); refreshHistory(); }}
        theme={theme} onToggleTheme={toggleTheme}
        />
      )}

      {!loading && page==="weather" && weather && (
        <WeatherPage weather={weather} forecast={forecast} onBack={handleBack} onSearch={handleSearch}
        history={history}
        onRemoveHistory={(name) => { removeFromHistory(name); refreshHistory(); }}
        theme={theme} onToggleTheme={toggleTheme}
        />
      )}

      {page==="tempmap" && <div><div style={{background:"#003a70",padding:"10px 20px"}}><button className="back-btn" onClick={handleBack}>← Home</button></div><TemperatureMap /></div>}
      {page==="warnings" && <WeatherWarnings onBack={handleBack} />}
      {page==="wind"     && <WindForecast    onBack={handleBack} />}
      {page==="help"     && <HelpPage        onBack={handleBack} />}

      <CookieBanner />
    </div>
  );
}

export default App;