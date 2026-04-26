import { useState, useEffect } from "react";

/* ────────────────────────────────────────
   COOKIE CONSENT BANNER
   Stores user choice in localStorage under
   the key  "wo_cookie_consent"
   Values:  "all" | "essential" | null (not yet decided)
─────────────────────────────────────── */
export default function CookieBanner() {
  const [visible,      setVisible]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState({
    essential:   true,   // always on, cannot be disabled
    analytics:   false,
    preferences: false,
  });

  /* Only show if no choice has been saved yet */
  useEffect(() => {
    const saved = sessionStorage.getItem("wo_cookie_consent");
    if (!saved) {
      /* Small delay so banner slides in after page load */
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  /* ── Accept all ── */
  const acceptAll = () => {
    localStorage.setItem("wo_cookie_consent", "all");
    localStorage.setItem("wo_cookie_prefs", JSON.stringify({
      essential: true, analytics: true, preferences: true,
    }));
    setVisible(false);
  };

  /* ── Essential only ── */
  const acceptEssential = () => {
    localStorage.setItem("wo_cookie_consent", "essential");
    localStorage.setItem("wo_cookie_prefs", JSON.stringify({
      essential: true, analytics: false, preferences: false,
    }));
    setVisible(false);
  };

  /* ── Save custom preferences ── */
  const savePrefs = () => {
    const value = prefs.analytics || prefs.preferences ? "partial" : "essential";
    localStorage.setItem("wo_cookie_consent", value);
    localStorage.setItem("wo_cookie_prefs", JSON.stringify(prefs));
    setVisible(false);
  };

  /* ── Toggle helper ── */
  const toggle = (key) =>
    setPrefs(p => ({ ...p, [key]: !p[key] }));

  /* ── Shared styles ── */
  const btn = (bg, color, border) => ({
    fontFamily: "inherit", fontSize: 13, fontWeight: 600,
    padding: "10px 20px", borderRadius: 50, cursor: "pointer",
    border: border || "none", background: bg, color,
    transition: "all 0.2s", whiteSpace: "nowrap",
  });

  const toggleStyle = (on) => ({
    position: "relative", width: 42, height: 24, borderRadius: 12,
    background: on ? "linear-gradient(135deg,#00a4a7,#0065bd)" : "rgba(255,255,255,0.15)",
    border: "none", cursor: on ? "default" : "pointer",
    transition: "background 0.25s", flexShrink: 0,
    display: "flex", alignItems: "center", padding: "0 3px",
  });

  const knob = (on) => ({
    width: 18, height: 18, borderRadius: "50%", background: "white",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
    transition: "transform 0.25s",
    transform: on ? "translateX(18px)" : "translateX(0)",
  });

  return (
    <>
      {/* ── Backdrop (settings only) ── */}
      {showSettings && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)", zIndex: 498,
        }} onClick={() => setShowSettings(false)} />
      )}

      {/* ── Main banner / settings panel ── */}
      <div style={{
        position: "fixed",
        bottom: 24, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 499,
        width: "min(720px, calc(100vw - 32px))",
        background: "#0a1628",
        border: "1px solid rgba(0,164,167,0.3)",
        borderRadius: 18,
        boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,164,167,0.08)",
        overflow: "hidden",
        animation: "cookieSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>

        {/* ── Coloured top accent ── */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, #00a4a7, #0065bd, #00a4a7)",
          backgroundSize: "200% 100%",
          animation: "cookieAccent 3s linear infinite",
        }} />

        {/* ── Simple banner view ── */}
        {!showSettings && (
          <div style={{
            padding: "22px 28px",
            display: "flex", alignItems: "center",
            gap: 20, flexWrap: "wrap",
          }}>
            {/* Icon + text */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 260 }}>
              <span style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>🍪</span>
              <div>
                <p style={{
                  fontSize: 14, fontWeight: 700, color: "white",
                  margin: "0 0 4px", fontFamily: "'DM Sans',sans-serif",
                }}>
                  We use cookies
                </p>
                <p style={{
                  fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0,
                  lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif",
                }}>
                  We use essential cookies to keep the app working. With your consent,
                  we'd also like to use analytics cookies to improve your experience.{" "}
                  <button onClick={() => setShowSettings(true)} style={{
                    background: "none", border: "none", color: "#00d4d8",
                    cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                    textDecoration: "underline", padding: 0,
                  }}>Manage preferences</button>
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
              <button
                onClick={acceptEssential}
                style={btn("rgba(255,255,255,0.07)", "rgba(255,255,255,0.7)", "1px solid rgba(255,255,255,0.15)")}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              >
                Essential only
              </button>
              <button
                onClick={() => setShowSettings(true)}
                style={btn("rgba(0,164,167,0.12)", "#00d4d8", "1px solid rgba(0,164,167,0.3)")}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,164,167,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(0,164,167,0.12)"}  
              >
                Customise
              </button>
              
              <button
                onClick={acceptAll}
                style={btn("linear-gradient(135deg,#00a4a7,#0065bd)", "white", "none")}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Accept all
              </button>
            </div>
          </div>
        )}

        {/* ── Settings / manage view ── */}
        {showSettings && (
          <div style={{ padding: "24px 28px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{
                  fontFamily: "'Playfair Display',serif", fontSize: 19,
                  fontWeight: 700, color: "white", margin: "0 0 3px",
                }}>Cookie Preferences</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  Choose which cookies you allow us to use.
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "white", borderRadius: "50%", width: 30, height: 30,
                  cursor: "pointer", fontSize: 16, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >×</button>
            </div>

            {/* Cookie rows */}
            {[
              {
                key: "essential",
                label: "Essential Cookies",
                icon: "🔒",
                desc: "Required for the app to function. Cannot be disabled.",
                locked: true,
              },
              {
                key: "analytics",
                label: "Analytics Cookies",
                icon: "📊",
                desc: "Help us understand how you use the app so we can improve it. No personal data is sold.",
                locked: false,
              },
              {
                key: "preferences",
                label: "Preference Cookies",
                icon: "⚙️",
                desc: "Remember your settings like last searched city and unit preferences across visits.",
                locked: false,
              },
            ].map(row => (
              <div key={row.key} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: "white",
                    marginBottom: 3, fontFamily: "'DM Sans',sans-serif",
                  }}>{row.label}</div>
                  <div style={{
                    fontSize: 12, color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif",
                  }}>{row.desc}</div>
                </div>
                {/* Toggle */}
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  {row.locked ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#00d4d8",
                      background: "rgba(0,164,167,0.12)",
                      border: "1px solid rgba(0,164,167,0.25)",
                      borderRadius: 10, padding: "3px 10px",
                    }}>Always on</span>
                  ) : (
                    <button
                      onClick={() => toggle(row.key)}
                      style={toggleStyle(prefs[row.key])}
                      aria-label={`Toggle ${row.label}`}
                      aria-checked={prefs[row.key]}
                      role="switch"
                    >
                      <div style={knob(prefs[row.key])} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Footer buttons */}
            <div style={{
              display: "flex", gap: 10, marginTop: 20,
              justifyContent: "flex-end", flexWrap: "wrap",
            }}>
              <button
                onClick={acceptEssential}
                style={btn("rgba(255,255,255,0.07)", "rgba(255,255,255,0.6)", "1px solid rgba(255,255,255,0.12)")}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              >
                Essential only
              </button>
              <button
                onClick={savePrefs}
                style={btn("rgba(0,164,167,0.15)", "#00d4d8", "1px solid rgba(0,164,167,0.35)")}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,164,167,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(0,164,167,0.15)"}
              >
                Save preferences
              </button>
              <button
                onClick={acceptAll}
                style={btn("linear-gradient(135deg,#00a4a7,#0065bd)", "white")}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Accept all
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }
        @keyframes cookieAccent {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>
    </>
  );
}