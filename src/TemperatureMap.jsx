import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

/* ── Temp colour scale ── */
const TEMP_SCALE = d3.scaleLinear()
  .domain([-40, -20, -5, 5, 15, 25, 35, 50])
  .range(["#a8d8f0","#6aaed6","#4393c3","#74c476","#fddd82","#fd8d3c","#e6550d","#a10026"])
  .clamp(true);

/* ── Cities dataset ── */
const CITIES = [
  { name:"London",      lat:51.5,   lon:-0.1,    temp:8  },
  { name:"Paris",       lat:48.85,  lon:2.35,    temp:10 },
  { name:"Berlin",      lat:52.5,   lon:13.4,    temp:4  },
  { name:"Rome",        lat:41.9,   lon:12.5,    temp:13 },
  { name:"Madrid",      lat:40.42,  lon:-3.70,   temp:11 },
  { name:"Stockholm",   lat:59.33,  lon:18.07,   temp:-3 },
  { name:"Oslo",        lat:59.91,  lon:10.75,   temp:-6 },
  { name:"Reykjavik",   lat:64.13,  lon:-21.82,  temp:-4 },
  { name:"Moscow",      lat:55.75,  lon:37.6,    temp:-9 },
  { name:"Istanbul",    lat:41.0,   lon:28.97,   temp:9  },
  { name:"Cairo",       lat:30.06,  lon:31.24,   temp:21 },
  { name:"Casablanca",  lat:33.57,  lon:-7.59,   temp:17 },
  { name:"Lagos",       lat:6.45,   lon:3.39,    temp:32 },
  { name:"Nairobi",     lat:-1.29,  lon:36.82,   temp:20 },
  { name:"Johannesburg",lat:-26.2,  lon:28.04,   temp:22 },
  { name:"Addis Ababa", lat:9.03,   lon:38.74,   temp:16 },
  { name:"Dubai",       lat:25.2,   lon:55.3,    temp:29 },
  { name:"Riyadh",      lat:24.69,  lon:46.72,   temp:26 },
  { name:"Tehran",      lat:35.69,  lon:51.39,   temp:8  },
  { name:"Karachi",     lat:24.86,  lon:67.01,   temp:27 },
  { name:"Delhi",       lat:28.6,   lon:77.2,    temp:22 },
  { name:"Mumbai",      lat:19.08,  lon:72.88,   temp:30 },
  { name:"Dhaka",       lat:23.72,  lon:90.41,   temp:25 },
  { name:"Bangkok",     lat:13.75,  lon:100.5,   temp:34 },
  { name:"Singapore",   lat:1.35,   lon:103.82,  temp:30 },
  { name:"Ho Chi Minh", lat:10.82,  lon:106.63,  temp:35 },
  { name:"Beijing",     lat:39.9,   lon:116.4,   temp:2  },
  { name:"Seoul",       lat:37.57,  lon:126.98,  temp:2  },
  { name:"Tokyo",       lat:35.68,  lon:139.69,  temp:11 },
  { name:"Sydney",      lat:-33.87, lon:151.21,  temp:24 },
  { name:"New York",    lat:40.71,  lon:-74.0,   temp:3  },
  { name:"Chicago",     lat:41.88,  lon:-87.63,  temp:-1 },
  { name:"Los Angeles", lat:34.05,  lon:-118.24, temp:18 },
  { name:"Toronto",     lat:43.65,  lon:-79.38,  temp:-2 },
  { name:"Anchorage",   lat:61.22,  lon:-149.9,  temp:-13},
  { name:"Mexico City", lat:19.43,  lon:-99.13,  temp:18 },
  { name:"Bogotá",      lat:4.71,   lon:-74.07,  temp:14 },
  { name:"Lima",        lat:-12.05, lon:-77.04,  temp:22 },
  { name:"São Paulo",   lat:-23.55, lon:-46.63,  temp:27 },
  { name:"Buenos Aires",lat:-34.6,  lon:-58.38,  temp:29 },
];

/* ── Helpers ── */
const toF   = c => Math.round(c * 9/5 + 32);
const fmt   = (c, u) => u === "°F" ? `${toF(c)}°F` : `${c}°C`;
const fmtSc = (c, u) => u === "°F" ? `${toF(c)}°` : `${c}°`;
const TICKS  = [-40,-20,-5,5,15,25,35,50];

/* ── Inline topojson feature extractor ── */
function extractFeatures(topology, object) {
  return { type:"FeatureCollection", features: object.geometries.map(g => toFeature(topology, g)) };
}
function toFeature(topology, o) {
  return { type:"Feature", id:o.id, properties:o.properties||{}, geometry:toGeometry(topology, o) };
}
function toGeometry(topology, o) {
  if(!o) return null;
  const T = topology.transform;
  function arc(idx){
    const raw = idx<0 ? topology.arcs[~idx].slice().reverse() : topology.arcs[idx];
    let x=0,y=0;
    return raw.map(d=>{ x+=d[0]; y+=d[1]; return T?[x*T.scale[0]+T.translate[0],y*T.scale[1]+T.translate[1]]:[x,y]; });
  }
  switch(o.type){
    case "Polygon":      return {type:"Polygon",      coordinates: o.arcs.map(a=>a.flatMap(arc))};
    case "MultiPolygon": return {type:"MultiPolygon", coordinates: o.arcs.map(p=>p.map(a=>a.flatMap(arc)))};
    default:             return null;
  }
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function TemperatureMap() {
  const containerRef = useRef(null);
  const svgRef       = useRef(null);
  const [unit,       setUnit]    = useState("°C");
  const [tooltip,    setTooltip] = useState(null);
  const [world,      setWorld]   = useState(null);
  const [filter,     setFilter]  = useState("all"); // all | hot | cold | mild
  const [loading,    setLoading] = useState(true);

  /* Load world atlas */
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r=>r.json())
      .then(data=>{ setWorld(data); setLoading(false); })
      .catch(()=>setLoading(false));
  }, []);

  const getVisibleCities = useCallback(() => {
    switch(filter){
      case "hot":  return CITIES.filter(c=>c.temp>=25);
      case "cold": return CITIES.filter(c=>c.temp<=0);
      case "mild": return CITIES.filter(c=>c.temp>0&&c.temp<25);
      default:     return CITIES;
    }
  }, [filter]);

  const drawMap = useCallback(() => {
    if(!svgRef.current || !world) return;
    const container = containerRef.current;
    const W = container.clientWidth || 900;
    const H = Math.round(W * 0.50);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const proj = d3.geoNaturalEarth1()
      .scale(W / 6.4)
      .translate([W/2, H/2 + H*0.03]);

    const path = d3.geoPath().projection(proj);

    /* Defs */
    const defs = svg.append("defs");

    /* Ocean gradient */
    const oceanGrad = defs.append("linearGradient")
      .attr("id","ocean-grad").attr("x1","0%").attr("y1","0%").attr("x2","0%").attr("y2","100%");
    oceanGrad.append("stop").attr("offset","0%").attr("stop-color","#071422");
    oceanGrad.append("stop").attr("offset","100%").attr("stop-color","#0d2035");

    svg.append("rect").attr("width",W).attr("height",H).attr("fill","url(#ocean-grad)");

    /* Sphere outline */
    svg.append("path")
      .datum({type:"Sphere"})
      .attr("d", path)
      .attr("fill","none")
      .attr("stroke","rgba(100,160,220,0.12)")
      .attr("stroke-width",1);

    /* Graticule */
    svg.append("path")
      .datum(d3.geoGraticule()())
      .attr("d", path)
      .attr("fill","none")
      .attr("stroke","rgba(255,255,255,0.035)")
      .attr("stroke-width",0.5);

    /* Countries */
    const countries = extractFeatures(world, world.objects.countries);
    svg.append("g").selectAll("path")
      .data(countries.features)
      .join("path")
        .attr("d", path)
        .attr("fill","#162438")
        .attr("stroke","#2a3f58")
        .attr("stroke-width",0.4);

    /* Heatmap blobs per city */
    const visibleCities = getVisibleCities();

    /* clip path */
    defs.append("clipPath").attr("id","sphere-clip")
      .append("path").datum({type:"Sphere"}).attr("d",path);

    const blobG = svg.append("g").attr("clip-path","url(#sphere-clip)");

    visibleCities.forEach(city=>{
      const pos = proj([city.lon, city.lat]);
      if(!pos) return;
      const [cx,cy] = pos;
      const id = `blob-${city.name.replace(/\s/g,"")}`;

      const g = defs.append("radialGradient")
        .attr("id", id)
        .attr("cx","50%").attr("cy","50%").attr("r","50%");
      g.append("stop").attr("offset","0%")
        .attr("stop-color", TEMP_SCALE(city.temp))
        .attr("stop-opacity", 0.65);
      g.append("stop").attr("offset","55%")
        .attr("stop-color", TEMP_SCALE(city.temp))
        .attr("stop-opacity", 0.22);
      g.append("stop").attr("offset","100%")
        .attr("stop-color", TEMP_SCALE(city.temp))
        .attr("stop-opacity", 0);

      blobG.append("ellipse")
        .attr("cx",cx).attr("cy",cy)
        .attr("rx",50).attr("ry",38)
        .attr("fill",`url(#${id})`);
    });

    /* City dots */
    const dotG = svg.append("g");

    visibleCities.forEach(city=>{
      const pos = proj([city.lon, city.lat]);
      if(!pos) return;
      const [cx,cy] = pos;
      const col = TEMP_SCALE(city.temp);

      const g = dotG.append("g").style("cursor","pointer");

      /* Outer ring */
      g.append("circle")
        .attr("cx",cx).attr("cy",cy).attr("r",8)
        .attr("fill","none")
        .attr("stroke",col)
        .attr("stroke-width",1)
        .attr("opacity",0.35);

      /* Dot */
      const dot = g.append("circle")
        .attr("cx",cx).attr("cy",cy).attr("r",4.5)
        .attr("fill",col)
        .attr("stroke","rgba(255,255,255,0.8)")
        .attr("stroke-width",1)
        .style("transition","r 0.15s");

      g.on("mouseenter", evt=>{
        dot.attr("r",7).attr("stroke-width",1.8);
        const rect = svgRef.current.getBoundingClientRect();
        setTooltip({ city, x: evt.clientX - rect.left, y: evt.clientY - rect.top });
      })
      .on("mousemove", evt=>{
        const rect = svgRef.current.getBoundingClientRect();
        setTooltip(prev=>prev?{...prev, x:evt.clientX-rect.left, y:evt.clientY-rect.top}:null);
      })
      .on("mouseleave", ()=>{
        dot.attr("r",4.5).attr("stroke-width",1);
        setTooltip(null);
      });
    });

  }, [world, getVisibleCities]);

  useEffect(()=>{ drawMap(); }, [drawMap]);

  useEffect(()=>{
    const ro = new ResizeObserver(()=>{ drawMap(); });
    if(containerRef.current) ro.observe(containerRef.current);
    return ()=>ro.disconnect();
  },[drawMap]);

  /* Legend bar */
  const legendW = 260, legendH = 12;
  const legendStops = TICKS.map((t,i)=>({
    pct: (i/(TICKS.length-1))*100,
    col: TEMP_SCALE(t)
  }));

  const filterBtns = [
    { key:"all",  label:"All",         color:"#8ecae6" },
    { key:"cold", label:"❄️ Cold (≤0°C)", color:"#4393c3" },
    { key:"mild", label:"🌤 Mild (1–24°C)",color:"#74c476" },
    { key:"hot",  label:"🔥 Hot (≥25°C)", color:"#e6550d" },
  ];

  return (
    <div style={{ fontFamily:"'Source Sans 3','Helvetica Neue',sans-serif", background:"#071422", minHeight:"100vh", color:"white" }}>

      {/* Header */}
      <div style={{ background:"#003a70", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, letterSpacing:"-0.3px" }}>🌍 Temperature Map</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:2 }}>Global surface temperature today</div>
        </div>

        {/* Unit toggle */}
        <div style={{ display:"flex", gap:6 }}>
          {["°C","°F"].map(u=>(
            <button key={u} onClick={()=>setUnit(u)} style={{
              padding:"6px 16px", borderRadius:20, border:"1px solid",
              borderColor: unit===u ? "#00a4a7" : "rgba(255,255,255,0.2)",
              background:  unit===u ? "#00a4a7" : "transparent",
              color:"white", cursor:"pointer", fontSize:13, fontWeight:600,
              transition:"all 0.2s"
            }}>{u}</button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background:"#0d1e30", padding:"10px 24px", display:"flex", gap:8, flexWrap:"wrap", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        {filterBtns.map(b=>(
          <button key={b.key} onClick={()=>setFilter(b.key)} style={{
            padding:"5px 14px", borderRadius:16, border:"1px solid",
            borderColor: filter===b.key ? b.color : "rgba(255,255,255,0.15)",
            background:  filter===b.key ? `${b.color}22` : "transparent",
            color: filter===b.key ? b.color : "rgba(255,255,255,0.55)",
            cursor:"pointer", fontSize:12, fontWeight:600, transition:"all 0.2s"
          }}>{b.label}</button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:12, color:"rgba(255,255,255,0.35)", alignSelf:"center" }}>
          {getVisibleCities().length} cities shown
        </span>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ position:"relative", width:"100%", background:"#071422" }}>
        {loading && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, zIndex:10 }}>
            <div style={{ width:36, height:36, border:"3px solid #2a3f58", borderTopColor:"#00a4a7", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}></div>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>Loading world map…</p>
          </div>
        )}
        <svg ref={svgRef} style={{ display:"block", width:"100%" }}></svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position:"absolute",
            left: tooltip.x + 14,
            top:  tooltip.y - 14,
            background:"rgba(3,12,28,0.92)",
            backdropFilter:"blur(12px)",
            border:`1px solid ${TEMP_SCALE(tooltip.city.temp)}55`,
            borderRadius:10,
            padding:"10px 14px",
            pointerEvents:"none",
            zIndex:50,
            minWidth:140,
            boxShadow:`0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${TEMP_SCALE(tooltip.city.temp)}33`
          }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{tooltip.city.name}</div>
            <div style={{ fontSize:24, fontWeight:700, color: TEMP_SCALE(tooltip.city.temp), lineHeight:1.1, fontFamily:"Georgia,serif" }}>
              {fmt(tooltip.city.temp, unit)}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:4 }}>
              {tooltip.city.lat.toFixed(1)}°{tooltip.city.lat>=0?"N":"S"} · {Math.abs(tooltip.city.lon).toFixed(1)}°{tooltip.city.lon>=0?"E":"W"}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ padding:"18px 24px", background:"#0d1e30", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:600 }}>
            Temperature Scale
          </div>

          {/* Gradient bar */}
          <div style={{ position:"relative", height:14, borderRadius:7, overflow:"hidden", marginBottom:6,
            background:`linear-gradient(90deg, ${TICKS.map((t,i)=>`${TEMP_SCALE(t)} ${(i/(TICKS.length-1)*100).toFixed(0)}%`).join(", ")})`
          }}></div>

          {/* Tick labels */}
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            {TICKS.map(t=>(
              <span key={t} style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{fmtSc(unit==="°F"?toF(t):t, unit)}</span>
            ))}
          </div>

          {/* Category pills */}
          <div style={{ display:"flex", gap:12, marginTop:14, flexWrap:"wrap" }}>
            {[
              { label:"Freezing", range:"< −10°C", col:"#a8d8f0" },
              { label:"Cold",     range:"−10–0°C",  col:"#4393c3" },
              { label:"Cool",     range:"0–15°C",   col:"#74c476" },
              { label:"Warm",     range:"15–25°C",  col:"#fddd82" },
              { label:"Hot",      range:"25–35°C",  col:"#fd8d3c" },
              { label:"Extreme",  range:"> 35°C",   col:"#a10026" },
            ].map(c=>(
              <div key={c.label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(255,255,255,0.6)" }}>
                <span style={{ width:10, height:10, borderRadius:"50%", background:c.col, display:"inline-block", flexShrink:0 }}></span>
                <strong style={{ color:"rgba(255,255,255,0.8)" }}>{c.label}</strong> {c.range}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data note */}
      <div style={{ textAlign:"center", padding:"10px 24px", fontSize:11, color:"rgba(255,255,255,0.25)", background:"#071422" }}>
        Sample data for demonstration · Integrate OpenWeatherMap API for live temperatures
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap');
      `}</style>
    </div>
  );
}
