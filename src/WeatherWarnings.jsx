import { useState } from "react";

/* ── Severity config ── */
const SEVERITY = {
  red:    { label: "Red Warning",    bg: "#c0392b", border: "#e74c3c", text: "#fff", badge: "#e74c3c", icon: "🔴", desc: "Dangerous conditions. Take action now." },
  amber:  { label: "Amber Warning",  bg: "#d35400", border: "#e67e22", text: "#fff", badge: "#e67e22", icon: "🟠", desc: "Weather is expected to have significant impact." },
  yellow: { label: "Yellow Warning", bg: "#b7950b", border: "#f1c40f", text: "#fff", badge: "#f1c40f", icon: "🟡", desc: "Be aware and prepared for disruption." },
  info:   { label: "Advisory",       bg: "#1a4a7a", border: "#2980b9", text: "#fff", badge: "#2980b9", icon: "🔵", desc: "Stay informed about developing conditions." },
};

/* ── Warning type icons ── */
const TYPE_ICON = {
  storm:     "⛈️",
  wind:      "💨",
  rain:      "🌧️",
  snow:      "❄️",
  fog:       "🌫️",
  heat:      "🌡️",
  cold:      "🥶",
  lightning: "⚡",
  flood:     "🌊",
  ice:       "🧊",
};

/* ── Dynamic date helpers ── */
// Offset hours from now: e.g. hoursFromNow(-2) = 2 hours ago
function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}

/* ── Warnings — all dates relative to current time so they're always current ── */
function buildWarnings() {
  return [
    {
      id: 1, severity: "red", type: "storm",
      title: "Severe Thunderstorm Warning",
      region: "South East England",
      countries: ["England"],
      issued: hoursFromNow(-3),
      from:   hoursFromNow(-1),
      until:  hoursFromNow(8),
      headline: "Violent thunderstorms with large hail and possible tornadoes.",
      detail: "A deep low pressure system is tracking rapidly northeast bringing severe convective activity. Expect lightning strikes every 1–2 minutes, hail up to 4cm diameter, locally torrential rain of 40–60mm/hr, and isolated tornado risk across Kent, Sussex and Surrey.",
      impacts: ["Power outages likely", "Flash flooding of roads", "Structural damage possible", "Travel severely disrupted", "Dangerous driving conditions"],
      advice: "Stay indoors. Avoid travel if possible. Keep away from windows. Charge devices now in case of power outage.",
    },
    {
      id: 2, severity: "amber", type: "wind",
      title: "Severe Wind Warning",
      region: "Scotland & Northern Ireland",
      countries: ["Scotland", "Northern Ireland"],
      issued: hoursFromNow(-2),
      from:   hoursFromNow(2),
      until:  hoursFromNow(14),
      headline: "Gusts of 80–95 mph on exposed coasts and hills.",
      detail: "A vigorous Atlantic frontal system is pushing across the far north. Exposed headlands and mountain passes could see gusts exceeding 90 mph. Widespread 65–75 mph inland.",
      impacts: ["High-sided vehicles blown over", "Debris on roads", "Bridge closures likely", "Coastal flooding", "Disruption to flights and ferries"],
      advice: "Delay non-essential travel. Secure outdoor furniture and trampolines. Check transport before travelling.",
    },
    {
      id: 3, severity: "amber", type: "rain",
      title: "Heavy Rain Warning",
      region: "Wales & West Midlands",
      countries: ["Wales", "England"],
      issued: hoursFromNow(-4),
      from:   hoursFromNow(-2),
      until:  hoursFromNow(10),
      headline: "60–90mm of rain expected in 12 hours over high ground.",
      detail: "Persistent and heavy rainfall will move east overnight. Snowmelt on the Brecon Beacons will compound river levels. The Severn and Wye are expected to reach major flood stage by dawn.",
      impacts: ["River flooding", "Surface water flooding", "Road closures", "Rail disruption"],
      advice: "Do not walk or drive through flood water. Move valuables upstairs. Check flood warnings for your area.",
    },
    {
      id: 4, severity: "yellow", type: "snow",
      title: "Snow & Ice Warning",
      region: "North England & Yorkshire",
      countries: ["England"],
      issued: hoursFromNow(-1),
      from:   hoursFromNow(4),
      until:  hoursFromNow(16),
      headline: "5–10cm of snow above 200m, ice on untreated surfaces.",
      detail: "Cold air will surge south overnight bringing snow showers to the Pennines and North York Moors. Ice will form rapidly on untreated roads and pavements as temperatures dip to −5°C.",
      impacts: ["Icy pavements and roads", "Some road closures over high passes", "Disruption to morning commute"],
      advice: "Allow extra time for journeys. Wear appropriate footwear. Check gritting schedules for your local area.",
    },
    {
      id: 5, severity: "yellow", type: "fog",
      title: "Dense Fog Advisory",
      region: "East Anglia & East Midlands",
      countries: ["England"],
      issued: hoursFromNow(-5),
      from:   hoursFromNow(-3),
      until:  hoursFromNow(6),
      headline: "Visibility below 100m in places overnight.",
      detail: "Clear skies and light winds overnight will allow dense radiation fog to develop across low-lying areas. Fog may persist well into the morning rush hour before lifting.",
      impacts: ["Very slow traffic on major A-roads and motorways", "Possible flight delays", "Difficult driving conditions"],
      advice: "Use fog lights. Allow extra stopping distance. Reduce speed significantly.",
    },
    {
      id: 6, severity: "yellow", type: "lightning",
      title: "Lightning & Hail Warning",
      region: "South West England",
      countries: ["England"],
      issued: hoursFromNow(-1),
      from:   hoursFromNow(1),
      until:  hoursFromNow(9),
      headline: "Frequent lightning and small hail in afternoon showers.",
      detail: "Elevated instability behind the cold front will produce intense shower cells tracking northeast. Lightning strikes and hail up to 2cm possible in any given shower.",
      impacts: ["Outdoor events disrupted", "Risk of lightning strike for those outdoors", "Localised hail damage to crops"],
      advice: "Seek shelter in a building or car during thunderstorms. Avoid trees and open ground.",
    },
    {
      id: 7, severity: "info", type: "heat",
      title: "Heat Health Advisory",
      region: "London & Home Counties",
      countries: ["England"],
      issued: hoursFromNow(-6),
      from:   hoursFromNow(24),
      until:  hoursFromNow(72),
      headline: "Warm spell expected over the coming days — check on vulnerable people.",
      detail: "An area of high pressure will bring unseasonably warm temperatures of 18–21°C to the south east. While not extreme, this may affect elderly, very young and those with chronic health conditions.",
      impacts: ["Increased demand on health services", "Discomfort at night"],
      advice: "Stay hydrated. Keep rooms cool. Check on elderly relatives and neighbours.",
    },
  ];
}

/* ── Helpers ── */
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit", timeZone:"UTC" }) + " UTC";
}

function isActive(w) {
  const now = Date.now();
  return new Date(w.from) <= now && now <= new Date(w.until);
}

function isUpcoming(w) { return new Date(w.from) > Date.now(); }

/* ── Warning Card ── */
function WarningCard({ w, onClick }) {
  const s = SEVERITY[w.severity];
  const active = isActive(w);
  const upcoming = isUpcoming(w);

  return (
    <div
      onClick={() => onClick(w)}
      style={{
        background: "#0d1e30",
        border: `1px solid ${s.border}44`,
        borderLeft: `4px solid ${s.border}`,
        borderRadius: 10,
        padding: "18px 20px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#152840"}
      onMouseLeave={e => e.currentTarget.style.background = "#0d1e30"}
    >
      {active && (
        <span style={{
          position: "absolute", top: 14, right: 14,
          width: 8, height: 8, borderRadius: "50%",
          background: s.border,
          boxShadow: `0 0 0 3px ${s.border}44`,
          animation: "pulse 1.5s infinite",
        }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{TYPE_ICON[w.type]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{
              background: s.badge, color: w.severity === "yellow" ? "#000" : "#fff",
              fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 12,
              textTransform: "uppercase", letterSpacing: "0.6px"
            }}>{s.icon} {s.label}</span>
            {active   && <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>● ACTIVE NOW</span>}
            {upcoming && <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 600 }}>◷ UPCOMING</span>}
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 4 }}>{w.title}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>📍 {w.region}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{w.headline}</div>

          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              From: <span style={{ color: "rgba(255,255,255,0.7)" }}>{fmtDateTime(w.from)}</span>
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Until: <span style={{ color: "rgba(255,255,255,0.7)" }}>{fmtDateTime(w.until)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Detail Modal ── */
function WarningModal({ w, onClose }) {
  if (!w) return null;
  const s = SEVERITY[w.severity];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#0a1628",
        border: `1px solid ${s.border}55`,
        borderTop: `4px solid ${s.border}`,
        borderRadius: 16,
        width: "100%", maxWidth: 620,
        maxHeight: "90vh", overflowY: "auto",
        padding: 32,
        boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${s.border}22`,
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <span style={{
              background: s.badge, color: w.severity === "yellow" ? "#000" : "#fff",
              fontSize: 12, fontWeight: 700, padding: "3px 11px", borderRadius: 12,
              textTransform: "uppercase", letterSpacing: "0.6px", display: "inline-block", marginBottom: 10
            }}>{s.icon} {s.label}</span>
            <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>{w.title}</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "4px 0 0" }}>📍 {w.region} · {w.countries.join(", ")}</p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            color: "white", borderRadius: "50%", width: 34, height: 34, cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>×</button>
        </div>

        <div style={{
          background: `${s.border}18`, border: `1px solid ${s.border}33`,
          borderRadius: 10, padding: "14px 18px", marginBottom: 20,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        }}>
          {[
            { label: "Warning from", val: fmtDateTime(w.from) },
            { label: "Warning until", val: fmtDateTime(w.until) },
            { label: "Issued", val: fmtDateTime(w.issued) },
            {
              label: "Status",
              val: isActive(w) ? "● Active Now" : isUpcoming(w) ? "◷ Upcoming" : "Expired",
              color: isActive(w) ? "#4ade80" : isUpcoming(w) ? "#93c5fd" : "#9ca3af"
            },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: i < 2 ? 15 : 14, fontWeight: i < 2 ? 600 : 400, color: item.color || (i < 2 ? "white" : "rgba(255,255,255,0.7)") }}>{item.val}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1.5, marginBottom: 16 }}>{w.headline}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 20 }}>{w.detail}</div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Likely Impacts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {w.impacts.map((imp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.border, flexShrink: 0 }}></span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{imp}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "16px 18px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>✅ What should you do?</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{w.advice}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function WeatherWarnings({ onBack }) {
  // Build warnings fresh each render so dates are always relative to now
  const WARNINGS = buildWarnings();

  const [selected,   setSelected]   = useState(null);
  const [filter,     setFilter]     = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search,     setSearch]     = useState("");

  const activeCount = WARNINGS.filter(isActive).length;
  const redCount    = WARNINGS.filter(w => w.severity === "red").length;
  const amberCount  = WARNINGS.filter(w => w.severity === "amber").length;

  const filtered = WARNINGS.filter(w => {
    if (filter !== "all" && w.severity !== filter) return false;
    if (typeFilter !== "all" && w.type !== typeFilter) return false;
    if (search && !w.title.toLowerCase().includes(search.toLowerCase()) &&
        !w.region.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const severityFilters = [
    { key: "all",    label: "All Warnings", count: WARNINGS.length },
    { key: "red",    label: "Red",     count: WARNINGS.filter(w=>w.severity==="red").length,    color: "#e74c3c" },
    { key: "amber",  label: "Amber",   count: WARNINGS.filter(w=>w.severity==="amber").length,  color: "#e67e22" },
    { key: "yellow", label: "Yellow",  count: WARNINGS.filter(w=>w.severity==="yellow").length, color: "#f1c40f" },
    { key: "info",   label: "Advisory",count: WARNINGS.filter(w=>w.severity==="info").length,   color: "#2980b9" },
  ];

  const typeFilters = [
    { key: "all" }, ...Object.entries(TYPE_ICON).map(([k,v])=>({ key:k, icon:v }))
  ];

  return (
    <div style={{ fontFamily:"'Source Sans 3','Helvetica Neue',sans-serif", background:"#071422", minHeight:"100vh", color:"white" }}>

      <div style={{ background:"#003a70", padding:"12px 24px", display:"flex", alignItems:"center", gap:16 }}>
        <button className="back-btn" onClick={onBack}>← Home</button>
        <div>
          <span style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700 }}>⚡ Weather Warnings</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginLeft:12 }}>UK & Global Alerts</span>
        </div>
      </div>

      <div style={{ background:"#0a1628", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"16px 24px", display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 0 3px #4ade8044", display:"inline-block", animation:"pulse 1.5s infinite" }}></span>
          <span style={{ fontSize:14, color:"rgba(255,255,255,0.7)" }}><strong style={{color:"white"}}>{activeCount}</strong> active warning{activeCount!==1?"s":""}</span>
        </div>
        {redCount > 0 && <span style={{ fontSize:13, fontWeight:700, color:"#e74c3c" }}>🔴 {redCount} Red</span>}
        {amberCount > 0 && <span style={{ fontSize:13, fontWeight:700, color:"#e67e22" }}>🟠 {amberCount} Amber</span>}
        <div style={{ marginLeft:"auto", fontSize:12, color:"rgba(255,255,255,0.35)" }}>
          Last updated: {new Date().toLocaleTimeString("en-GB", {hour:"2-digit",minute:"2-digit"})} · Refreshes every 15 min
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 20px" }}>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {severityFilters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding:"7px 16px", borderRadius:20, border:"1px solid",
              borderColor: filter===f.key ? (f.color||"#00a4a7") : "rgba(255,255,255,0.12)",
              background: filter===f.key ? `${f.color||"#00a4a7"}22` : "transparent",
              color: filter===f.key ? (f.color||"#00a4a7") : "rgba(255,255,255,0.5)",
              cursor:"pointer", fontSize:13, fontWeight:600, transition:"all 0.2s",
            }}>
              {f.label} <span style={{opacity:0.7}}>({f.count})</span>
            </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap", alignItems:"center" }}>
          {typeFilters.map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)} style={{
              padding:"5px 12px", borderRadius:16, border:"1px solid",
              borderColor: typeFilter===f.key ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)",
              background: typeFilter===f.key ? "rgba(255,255,255,0.1)" : "transparent",
              color:"white", cursor:"pointer", fontSize:13, transition:"all 0.15s",
            }}>
              {f.icon || "All Types"}
            </button>
          ))}
          <input
            placeholder="Search region or title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              marginLeft:"auto", background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.12)", borderRadius:20,
              padding:"7px 16px", color:"white", fontSize:13, outline:"none", width:220,
              fontFamily:"inherit",
            }}
          />
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.3)", fontSize:15 }}>
              No warnings match your filters.
            </div>
          ) : filtered.map(w => (
            <WarningCard key={w.id} w={w} onClick={setSelected} />
          ))}
        </div>

        <div style={{ marginTop:40, padding:"20px", background:"#0d1e30", borderRadius:12, border:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:14 }}>Warning Severity Guide</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12 }}>
            {Object.entries(SEVERITY).map(([key, s]) => (
              <div key={key} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"white" }}>{s.label}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.4 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WarningModal w={selected} onClose={() => setSelected(null)} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap');
      `}</style>
    </div>
  );
}