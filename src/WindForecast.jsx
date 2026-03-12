import { useState } from "react";

/* ── Helpers ── */
const msToKmh  = ms => Math.round(ms * 3.6);
const msToKnot = ms => Math.round(ms * 1.94384);
const msToMph  = ms => Math.round(ms * 2.23694);

const DIR_LABELS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
function degToDir(deg) {
  return DIR_LABELS[Math.round(deg / 22.5) % 16];
}

/* Beaufort scale */
function beaufort(ms) {
  if (ms < 0.3)  return { num: 0, label: "Calm",            color: "#a8d8f0" };
  if (ms < 1.6)  return { num: 1, label: "Light Air",       color: "#74c476" };
  if (ms < 3.4)  return { num: 2, label: "Light Breeze",    color: "#74c476" };
  if (ms < 5.5)  return { num: 3, label: "Gentle Breeze",   color: "#a8d857" };
  if (ms < 8.0)  return { num: 4, label: "Moderate Breeze", color: "#fddd82" };
  if (ms < 10.8) return { num: 5, label: "Fresh Breeze",    color: "#fddd82" };
  if (ms < 13.9) return { num: 6, label: "Strong Breeze",   color: "#fd8d3c" };
  if (ms < 17.2) return { num: 7, label: "Near Gale",       color: "#fd8d3c" };
  if (ms < 20.8) return { num: 8, label: "Gale",            color: "#e6550d" };
  if (ms < 24.5) return { num: 9, label: "Strong Gale",     color: "#e6550d" };
  if (ms < 28.5) return { num:10, label: "Storm",           color: "#c0392b" };
  if (ms < 32.7) return { num:11, label: "Violent Storm",   color: "#c0392b" };
  return           { num:12, label: "Hurricane",            color: "#7b0000" };
}

const DAY_NAMES  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MON_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDay(dt_txt)  { const d = new Date(dt_txt); return DAY_NAMES[d.getDay()]; }
function fmtDate(dt_txt) { const d = new Date(dt_txt); return `${d.getDate()} ${MON_NAMES[d.getMonth()]}`; }
function fmtHour(dt_txt) {
  const d = new Date(dt_txt);
  return d.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
}

/* ── Wind Compass ── */
function WindCompass({ deg, speed }) {
  const bf = beaufort(speed);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      {/* Compass ring */}
      <div style={{ position:"relative", width:200, height:200 }}>
        {/* Outer ring */}
        <svg width="200" height="200" style={{ position:"absolute", inset:0 }}>
          {/* Tick marks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const isMajor = i % 9 === 0;
            const r1 = isMajor ? 82 : 88;
            const r2 = 94;
            return (
              <line key={i}
                x1={100 + r1 * Math.sin(angle)} y1={100 - r1 * Math.cos(angle)}
                x2={100 + r2 * Math.sin(angle)} y2={100 - r2 * Math.cos(angle)}
                stroke={isMajor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}
                strokeWidth={isMajor ? 2 : 1}
              />
            );
          })}
          {/* Cardinal labels */}
          {[["N",0],["E",90],["S",180],["W",270]].map(([lbl, angle]) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <text key={lbl}
                x={100 + 68 * Math.sin(rad)}
                y={100 - 68 * Math.cos(rad) + 5}
                textAnchor="middle"
                fill={lbl === "N" ? "#00d4d8" : "rgba(255,255,255,0.6)"}
                fontSize={lbl === "N" ? "14" : "12"}
                fontWeight={lbl === "N" ? "700" : "400"}
                fontFamily="DM Sans, sans-serif"
              >{lbl}</text>
            );
          })}
          {/* Intercardinal */}
          {[["NE",45],["SE",135],["SW",225],["NW",315]].map(([lbl, angle]) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <text key={lbl}
                x={100 + 68 * Math.sin(rad)}
                y={100 - 68 * Math.cos(rad) + 4}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="9"
                fontFamily="DM Sans, sans-serif"
              >{lbl}</text>
            );
          })}
          {/* Glow rings */}
          <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(0,164,167,0.15)" strokeWidth="1"/>
          {/* Speed arc */}
          <circle cx="100" cy="100" r="75"
            fill="none"
            stroke={bf.color}
            strokeWidth="4"
            strokeOpacity="0.35"
            strokeDasharray={`${(speed / 35) * 471} 471`}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
          {/* Wind arrow */}
          <g transform={`rotate(${deg}, 100, 100)`}>
            {/* Arrow shaft */}
            <line x1="100" y1="100" x2="100" y2="40"
              stroke={bf.color} strokeWidth="2.5" strokeLinecap="round"/>
            {/* Arrowhead */}
            <polygon
              points="100,28 95,44 105,44"
              fill={bf.color}
              style={{ filter:`drop-shadow(0 0 6px ${bf.color})` }}
            />
            {/* Tail */}
            <line x1="100" y1="100" x2="100" y2="135"
              stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"/>
          </g>
          {/* Centre dot */}
          <circle cx="100" cy="100" r="5" fill={bf.color} style={{ filter:`drop-shadow(0 0 8px ${bf.color})` }}/>
        </svg>
      </div>

      {/* Speed display */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:48, fontWeight:900, color:"white", lineHeight:1 }}>
          {msToKmh(speed)}
        </div>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>km/h · {degToDir(deg)}</div>
        <div style={{
          display:"inline-block",
          background:`${bf.color}22`,
          border:`1px solid ${bf.color}55`,
          color: bf.color,
          borderRadius:20, padding:"3px 14px",
          fontSize:12, fontWeight:700, letterSpacing:"0.5px"
        }}>
          Bft {bf.num} · {bf.label}
        </div>
      </div>
    </div>
  );
}

/* ── Forecast day card ── */
function WindDayCard({ item, isSelected, onClick, dailyData }) {
  const avgSpeed = dailyData.reduce((s,d) => s + d.wind.speed, 0) / dailyData.length;
  const maxSpeed = Math.max(...dailyData.map(d => d.wind.speed));
  const avgDeg   = dailyData.reduce((s,d) => s + d.wind.deg, 0) / dailyData.length;
  const bf       = beaufort(maxSpeed);

  return (
    <div onClick={onClick} style={{
      background: isSelected ? "rgba(0,164,167,0.12)" : "#0a1628",
      border:`1px solid ${isSelected ? "rgba(0,164,167,0.5)" : "rgba(255,255,255,0.07)"}`,
      borderTop: isSelected ? `3px solid #00d4d8` : "3px solid transparent",
      borderRadius:10, padding:"16px 14px",
      cursor:"pointer", transition:"all 0.2s",
      display:"flex", flexDirection:"column", alignItems:"center", gap:8,
      minWidth: 0,
    }}
    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = "#0f1f35"; }}
    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = "#0a1628"; }}
    >
      <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.8px" }}>
        {fmtDay(item.dt_txt)}
      </span>
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{fmtDate(item.dt_txt)}</span>

      {/* Mini compass arrow */}
      <svg width="44" height="44" style={{ margin:"4px 0" }}>
        <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        <g transform={`rotate(${avgDeg}, 22, 22)`}>
          <polygon points="22,4 19,16 25,16" fill={bf.color} opacity="0.9"/>
          <line x1="22" y1="22" x2="22" y2="34" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
        </g>
        <circle cx="22" cy="22" r="3" fill={bf.color}/>
      </svg>

      <div style={{ fontSize:18, fontWeight:700, color:"white" }}>{msToKmh(maxSpeed)}</div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>km/h max</div>
      <div style={{ fontSize:11, color: bf.color, fontWeight:600 }}>{bf.label}</div>
    </div>
  );
}

/* ── Hourly wind bar ── */
function HourlyBar({ item, maxSpeed }) {
  const pct = Math.min((item.wind.speed / (maxSpeed || 1)) * 100, 100);
  const bf  = beaufort(item.wind.speed);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
      {/* Time */}
      <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", width:44, flexShrink:0, fontFamily:"monospace" }}>
        {fmtHour(item.dt_txt)}
      </span>

      {/* Mini arrow */}
      <svg width="22" height="22" style={{ flexShrink:0 }}>
        <g transform={`rotate(${item.wind.deg}, 11, 11)`}>
          <polygon points="11,2 8,11 14,11" fill={bf.color} opacity="0.9"/>
          <line x1="11" y1="11" x2="11" y2="19" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
        </g>
        <circle cx="11" cy="11" r="2.5" fill={bf.color}/>
      </svg>

      {/* Bar */}
      <div style={{ flex:1, height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg, ${bf.color}88, ${bf.color})`,
          borderRadius:4,
          transition:"width 0.8s ease",
        }}/>
      </div>

      {/* Values */}
      <span style={{ fontSize:13, fontWeight:600, color:"white", width:52, textAlign:"right", flexShrink:0 }}>
        {msToKmh(item.wind.speed)} <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:400 }}>km/h</span>
      </span>
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", width:30, flexShrink:0 }}>
        {degToDir(item.wind.deg)}
      </span>
      <span style={{ fontSize:11, color: bf.color, width:80, flexShrink:0, fontWeight:600 }}>
        {bf.label}
      </span>
    </div>
  );
}

/* ── Beaufort legend ── */
function BeaufortLegend() {
  const entries = [1,2,3,4,5,6,7,8,9,10,11,12].map(n => {
    const limits = [0, 0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];
    return beaufort(limits[n] || limits[n - 1] + 1);
  });

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:8 }}>
      {entries.map((b, i) => (
        <div key={i} style={{
          display:"flex", alignItems:"center", gap:10,
          background:"rgba(255,255,255,0.03)",
          border:`1px solid ${b.color}22`,
          borderLeft:`3px solid ${b.color}`,
          borderRadius:8, padding:"8px 12px",
        }}>
          <span style={{ fontSize:18, fontWeight:800, color: b.color, width:20, textAlign:"center", fontFamily:"monospace" }}>{b.num}</span>
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function WindForecast({ onBack }) {
  const [city,        setCity]        = useState("");
  const [weather,     setWeather]     = useState(null);
  const [forecast,    setForecast]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [unit,        setUnit]        = useState("kmh");

  const convertSpeed = (ms) => {
    if (unit === "kmh")  return `${msToKmh(ms)} km/h`;
    if (unit === "knot") return `${msToKnot(ms)} kn`;
    return `${msToMph(ms)} mph`;
  };

  const handleSearch = async (e) => {
    if (e.key !== "Enter" && e.type !== "click") return;
    if (!city.trim()) return;
    setLoading(true); setError(null); setWeather(null); setForecast([]);

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      const [wRes, fRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
      ]);
      if (!wRes.ok) throw new Error("City not found.");
      const [wData, fData] = await Promise.all([wRes.json(), fRes.json()]);
      setWeather(wData);
      setForecast(fData.list);
      setSelectedDay(0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* Group forecast by day */
  const byDay = {};
  forecast.forEach(item => {
    const day = item.dt_txt.slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(item);
  });
  const days     = Object.keys(byDay).slice(0, 5);
  const selItems = days[selectedDay] ? byDay[days[selectedDay]] : [];
  const maxSpeed = selItems.length ? Math.max(...selItems.map(d => d.wind.speed)) : 1;

  /* Representative item per day (noon or first) */
  const repItem = (key) => byDay[key].find(i => i.dt_txt.includes("12:00")) || byDay[key][0];

  const bf = weather ? beaufort(weather.wind.speed) : null;

  return (
    <div style={{
      fontFamily:"'DM Sans','Source Sans 3','Helvetica Neue',sans-serif",
      background:"#03080f", minHeight:"100vh", color:"white",
    }}>

      {/* ── Top bar ── */}
      <div style={{ background:"#001a38", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"12px 24px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <button className="back-btn" onClick={onBack}>← Home</button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>💨</span>
          <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:20, fontWeight:700 }}>Wind Forecast</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginLeft:4 }}>5-day global wind analysis</span>
        </div>

        {/* Unit toggle */}
        <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
          {[["kmh","km/h"],["knot","kn"],["mph","mph"]].map(([k,l]) => (
            <button key={k} onClick={() => setUnit(k)} style={{
              padding:"5px 12px", borderRadius:16, border:"1px solid",
              borderColor: unit===k ? "#00d4d8" : "rgba(255,255,255,0.15)",
              background: unit===k ? "rgba(0,164,167,0.2)" : "transparent",
              color: unit===k ? "#00d4d8" : "rgba(255,255,255,0.45)",
              fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.2s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ background:"linear-gradient(135deg, #03080f 0%, #071422 100%)", padding:"32px 24px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:560, margin:"0 auto" }}>
          <div style={{
            display:"flex", background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:50,
            overflow:"hidden", backdropFilter:"blur(12px)",
            transition:"border-color 0.2s",
          }}
          onFocus={e => e.currentTarget.style.borderColor = "rgba(0,212,216,0.4)"}
          onBlur={e  => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
          >
            <span style={{ display:"flex", alignItems:"center", padding:"0 14px 0 20px", color:"rgba(255,255,255,0.35)", fontSize:18 }}>💨</span>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search city for wind forecast…"
              style={{
                flex:1, background:"none", border:"none", outline:"none",
                color:"white", fontSize:15, padding:"16px 0",
                fontFamily:"inherit",
              }}
            />
            <button onClick={handleSearch} style={{
              background:"linear-gradient(135deg, #00a4a7, #0065bd)",
              border:"none", color:"white", padding:"0 24px", margin:6,
              borderRadius:40, fontSize:13, fontWeight:700, cursor:"pointer",
              fontFamily:"inherit", transition:"all 0.2s",
            }}>Search</button>
          </div>
          {error && <p style={{ color:"#ff9f9f", marginTop:10, fontSize:13, textAlign:"center" }}>⚠️ {error}</p>}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, padding:"80px 0" }}>
          <div style={{ width:40, height:40, border:"3px solid #0a1628", borderTopColor:"#00a4a7", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}></div>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14 }}>Fetching wind data…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !weather && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", gap:16, textAlign:"center" }}>
          <div style={{ fontSize:80, animation:"floatEmoji 3s ease-in-out infinite" }}>🌬️</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:"white" }}>Where's the wind?</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.35)", maxWidth:360, lineHeight:1.6 }}>
            Search any city above to see live wind speed, direction, Beaufort scale and a 5-day hourly forecast.
          </p>
          <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap", justifyContent:"center" }}>
            {["London","Chicago","Wellington","Cape Town"].map(c => (
              <button key={c} onClick={() => { setCity(c); }} style={{
                background:"rgba(0,164,167,0.1)", border:"1px solid rgba(0,164,167,0.25)",
                color:"#00d4d8", borderRadius:20, padding:"6px 16px", fontSize:13,
                cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,164,167,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(0,164,167,0.1)"}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      {!loading && weather && (
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px 60px" }}>

          {/* City + current wind hero */}
          <div style={{
            background:"linear-gradient(135deg, #071e3d 0%, #0a2a5e 50%, #071e3d 100%)",
            border:"1px solid rgba(0,164,167,0.15)",
            borderRadius:16, padding:"32px 36px", marginBottom:24,
            display:"grid", gridTemplateColumns:"1fr auto",
            gap:24, alignItems:"center",
            position:"relative", overflow:"hidden",
          }}>
            {/* bg glow */}
            <div style={{ position:"absolute", right:-40, top:-40, width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle, ${bf.color}18 0%, transparent 70%)`, pointerEvents:"none" }}/>

            <div style={{ position:"relative" }}>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:600, marginBottom:6 }}>Current Wind</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:clampFont(28,40), fontWeight:900, color:"white", margin:"0 0 4px" }}>
                {weather.name}
              </h2>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, marginBottom:24 }}>{weather.sys.country}</p>

              <div style={{ display:"flex", flexWrap:"wrap", gap:24 }}>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Speed</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color:"white", lineHeight:1 }}>{convertSpeed(weather.wind.speed).split(" ")[0]}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{unit === "kmh" ? "km/h" : unit === "knot" ? "knots" : "mph"}</div>
                </div>
                {weather.wind.gust && (
                  <div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Gusts</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color: bf.color, lineHeight:1 }}>{convertSpeed(weather.wind.gust).split(" ")[0]}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{unit === "kmh" ? "km/h" : unit === "knot" ? "knots" : "mph"}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Direction</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color:"white", lineHeight:1 }}>{degToDir(weather.wind.deg)}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{weather.wind.deg}°</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Beaufort</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color: bf.color, lineHeight:1 }}>Bft {bf.num}</div>
                  <div style={{ fontSize:12, color: bf.color }}>{bf.label}</div>
                </div>
              </div>
            </div>

            {/* Compass */}
            <WindCompass deg={weather.wind.deg} speed={weather.wind.speed} />
          </div>

          {/* ── 5-day selector ── */}
          <h3 style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:12 }}>
            5-Day Wind Outlook
          </h3>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${days.length}, 1fr)`, gap:8, marginBottom:24 }}>
            {days.map((day, i) => (
              <WindDayCard
                key={day}
                item={repItem(day)}
                isSelected={selectedDay === i}
                onClick={() => setSelectedDay(i)}
                dailyData={byDay[day]}
              />
            ))}
          </div>

          {/* ── Hourly breakdown ── */}
          <div style={{ background:"#0a1628", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"24px 24px", marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"white" }}>
                Hourly Wind — {days[selectedDay] ? `${fmtDay(selItems[0]?.dt_txt)} ${fmtDate(selItems[0]?.dt_txt)}` : ""}
              </h3>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>{selItems.length} readings</span>
            </div>

            {selItems.length === 0 ? (
              <p style={{ color:"rgba(255,255,255,0.3)", textAlign:"center", padding:"20px 0" }}>No hourly data for this day.</p>
            ) : selItems.map((item, i) => (
              <HourlyBar key={i} item={item} maxSpeed={maxSpeed} />
            ))}
          </div>

          {/* ── Beaufort scale ── */}
          <div style={{ background:"#0a1628", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"24px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"white", marginBottom:16 }}>
              Beaufort Wind Scale Reference
            </h3>
            <BeaufortLegend />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes floatEmoji { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;600;700&display=swap');
      `}</style>
    </div>
  );
}

/* tiny helper to avoid inline clamp() issues in JS strings */
function clampFont(min, max) {
  return `clamp(${min}px, 3vw, ${max}px)`;
}
