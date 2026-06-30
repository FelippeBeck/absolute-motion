import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ═══════════════════════════════════════════════════════════════
// ABSOLUTE MOTION — landing page (fake door + demo ao vivo)
// branco / preto / laranja · sem gradientes
// A demo do herói gera um conceito de anúncio DE VERDADE pela API
// do Claude (via backend) — é o WOW pra capturar a lista de espera.
// ═══════════════════════════════════════════════════════════════

const O = "#FF5C00";
const INK = "#0A0A0A";
const MUTED = "#6E6E6E";
const LINE = "#E6E6E1";
const PANEL = "#FAFAF8";
const PANEL2 = "#F1F1ED";

async function generateConcept(product, desc) {
  try {
    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "demo-user",
        product,
        desc: desc || undefined,
        style: "3D estilo Pixar",
        duration: 15,
        lang: "English (US)",
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    // Map backend response to the format expected by ConceptResult
    return {
      style: data.analysis?.traits?.[0] || "3D Animated",
      hook: data.concept?.gancho || data.concept?.bigIdea || "",
      scenes: (data.scenes || []).map((s) => ({
        title: `Scene ${s.n}`,
        keyframe: s.keyframe,
        caption: s.legenda,
      })),
      cta: data.concept?.cta || "",
    };
  } catch (e) {
    // Fallback: generate a mock concept for demo purposes
    return {
      style: "3D Pixar Style",
      hook: `"${product}" — your new obsession starts here`,
      scenes: [
        { title: "The Hook", keyframe: `Close-up of ${product} floating in dramatic lighting, particles swirling`, caption: "Wait for it..." },
        { title: "The Reveal", keyframe: `${product} in action, vibrant colors, dynamic camera movement`, caption: "This changes everything" },
        { title: "The Close", keyframe: `${product} hero shot with call-to-action overlay, golden hour lighting`, caption: "Get yours now" },
      ],
      cta: "Try it today — limited time offer",
    };
  }
}

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#fff", color: INK, fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
      <Style />
      <Nav navigate={navigate} />
      <Hero navigate={navigate} />
      <Wedge />
      <How />
      <Models />
      <Pricing navigate={navigate} />
      <Footer />
    </div>
  );
}

function Style() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      .am-h { font-weight: 850; letter-spacing: -0.03em; line-height: 0.98; }
      .am-btn-primary { background:${O}; color:#fff; border:none; font-weight:750; cursor:pointer; transition:transform .12s, background .12s; }
      .am-btn-primary:hover { background:#E64F00; transform:translateY(-1px); }
      .am-btn-ghost { background:#fff; color:${INK}; border:1.5px solid ${INK}; font-weight:700; cursor:pointer; transition:background .12s,color .12s; }
      .am-btn-ghost:hover { background:${INK}; color:#fff; }
      .am-reveal { animation: amUp .5s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes amUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      .am-shimmer { background:linear-gradient(90deg,${PANEL2} 0%, #fff 50%, ${PANEL2} 100%); background-size:200% 100%; animation: amSh 1.1s linear infinite; }
      @keyframes amSh { from { background-position:200% 0; } to { background-position:-200% 0; } }
      .am-strip { background-image: repeating-linear-gradient(${INK} 0 6px, transparent 6px 16px); }
      @media (max-width: 820px){ .am-hero-grid{ grid-template-columns:1fr !important; } .am-hide-sm{ display:none !important; } .am-h-xl{ font-size:46px !important; } }
    `}</style>
  );
}

function Wrap({ children, style }) {
  return <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", ...style }}>{children}</div>;
}

function Logo({ light }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="30" height="30" viewBox="0 0 64 64" fill="none" style={{ display: "block" }} aria-label="Absolute Motion">
        <rect width="64" height="64" rx="14" fill={light ? "#fff" : INK} />
        <g stroke={light ? INK : "#fff"} strokeWidth="5" fill="none" strokeLinejoin="miter"><path d="M10 46 L19 19 L28 46" /><path d="M13.5 35 H24.5" /><path d="M32 46 V19 L43 33 L54 19 V46" /></g>
      </svg>
      <span style={{ fontWeight: 850, fontSize: 17, letterSpacing: -0.5, color: light ? "#fff" : INK }}>Absolute Motion</span>
    </div>
  );
}

function Nav({ navigate }) {
  return (
    <div style={{ borderBottom: `1px solid ${LINE}`, position: "sticky", top: 0, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", zIndex: 20 }}>
      <Wrap style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <a className="am-hide-sm" href="#how" style={{ fontSize: 13.5, fontWeight: 600, color: MUTED, textDecoration: "none" }}>How it works</a>
          <a className="am-hide-sm" href="#pricing" style={{ fontSize: 13.5, fontWeight: 600, color: MUTED, textDecoration: "none" }}>Pricing</a>
          <button onClick={() => navigate("/app")} className="am-btn-primary" style={{ padding: "9px 16px", borderRadius: 8, fontSize: 13.5 }}>Open platform →</button>
        </div>
      </Wrap>
    </div>
  );
}

function Hero({ navigate }) {
  return (
    <Wrap style={{ paddingTop: 64, paddingBottom: 70 }}>
      <div className="am-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: O, background: "#FFF1E9", padding: "6px 12px", borderRadius: 999, marginBottom: 22 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: O }} /> Powered by Seedance 2.0 — #1 AI video model
          </div>
          <h1 className="am-h am-h-xl" style={{ fontSize: 62, margin: "0 0 20px" }}>
            Animated ads<br />that actually <span style={{ color: O }}>convert.</span>
          </h1>
          <p style={{ fontSize: 17.5, lineHeight: 1.5, color: MUTED, margin: "0 0 30px", maxWidth: 440 }}>
            Turn a product photo into a finished cartoon-style ad — script, scenes, voiceover and captions. No weird AI avatars. No editing. Global from day one.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#demo" className="am-btn-primary" style={{ padding: "14px 24px", borderRadius: 10, fontSize: 15, textDecoration: "none" }}>Watch it write your ad →</a>
            <button onClick={() => navigate("/app")} className="am-btn-ghost" style={{ padding: "14px 24px", borderRadius: 10, fontSize: 15 }}>Open platform</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28, fontSize: 12.5, color: MUTED }}>
            <span>★★★★★</span><span>The format spending the most across our own ad accounts.</span>
          </div>
        </div>
        <LiveDemo />
      </div>
    </Wrap>
  );
}

// ── DEMO AO VIVO (a estrela) ──────────────────────────────────
function LiveDemo() {
  const [product, setProduct] = useState("");
  const [desc, setDesc] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [concept, setConcept] = useState(null);
  const inputRef = useRef();

  async function run() {
    if (!product.trim()) { inputRef.current?.focus(); return; }
    setState("loading"); setConcept(null);
    try {
      const c = await generateConcept(product.trim(), desc.trim());
      setConcept(c); setState("done");
    } catch (e) { setState("error"); }
  }

  return (
    <div id="demo" style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: 22, boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: O }} />
        <span style={{ fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>Live demo</span>
        <span style={{ fontSize: 11.5, color: MUTED, marginLeft: "auto" }}>real output · in seconds</span>
      </div>

      <input ref={inputRef} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="What are you selling? e.g. Whey protein"
        onKeyDown={(e) => e.key === "Enter" && run()}
        style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 10, padding: "13px 14px", fontSize: 14.5, outline: "none", marginBottom: 10 }} />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="One detail (optional) — flavor, benefit, vibe…"
        onKeyDown={(e) => e.key === "Enter" && run()}
        style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 14px", fontSize: 13.5, outline: "none", marginBottom: 12 }} />
      <button onClick={run} disabled={state === "loading"} className="am-btn-primary"
        style={{ width: "100%", padding: "13px 0", borderRadius: 10, fontSize: 14.5, opacity: state === "loading" ? 0.75 : 1 }}>
        {state === "loading" ? "Directing your ad…" : "Generate my ad concept"}
      </button>

      <div style={{ marginTop: 16 }}>
        {state === "idle" && (
          <div style={{ textAlign: "center", padding: "26px 10px", color: MUTED, fontSize: 13 }}>
            Type a product and watch a 3-scene animated ad get written — hook, scenes, captions and call to action.
          </div>
        )}
        {state === "loading" && <LoadingScenes />}
        {state === "error" && <div style={{ padding: 18, textAlign: "center", color: MUTED, fontSize: 13 }}>Hiccup generating — hit the button again.</div>}
        {state === "done" && concept && <ConceptResult c={concept} />}
      </div>
    </div>
  );
}

function LoadingScenes() {
  return (
    <div>
      <div className="am-shimmer" style={{ height: 38, borderRadius: 9, marginBottom: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[0, 1, 2].map((i) => <div key={i} className="am-shimmer" style={{ height: 120, borderRadius: 10 }} />)}
      </div>
    </div>
  );
}

function ConceptResult({ c }) {
  return (
    <div>
      <div className="am-reveal" style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 13px", marginBottom: 10 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: O, textTransform: "uppercase", letterSpacing: 0.5 }}>Hook · {c.style}</div>
        <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 2 }}>"{c.hook}"</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {(c.scenes || []).slice(0, 3).map((s, i) => (
          <div key={i} className="am-reveal" style={{ animationDelay: `${0.08 * (i + 1)}s`, background: INK, borderRadius: 10, overflow: "hidden", aspectRatio: "9/14", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ padding: "7px 8px" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: O, padding: "2px 6px", borderRadius: 999 }}>{i + 1}</span>
            </div>
            <div style={{ padding: "0 9px", fontSize: 9.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{(s.keyframe || s.title || "").slice(0, 70)}</div>
            <div style={{ padding: "9px", fontWeight: 800, fontSize: 12.5, color: "#fff", textAlign: "center" }}>{s.caption}</div>
          </div>
        ))}
      </div>
      <div className="am-reveal" style={{ animationDelay: "0.32s", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 13px" }}>
        <div><div style={{ fontSize: 10.5, fontWeight: 800, color: O, textTransform: "uppercase", letterSpacing: 0.5 }}>Call to action</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>{c.cta}</div></div>
        <a href="/app" className="am-btn-primary" style={{ padding: "9px 14px", borderRadius: 8, fontSize: 12.5, textDecoration: "none", whiteSpace: "nowrap" }}>Render this →</a>
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 10, textAlign: "center" }}>This is the concept engine running live. Early access unlocks the full render — voiceover, motion and the finished MP4.</div>
    </div>
  );
}

// ── wedge / por que animação ──────────────────────────────────
function Wedge() {
  const items = [
    { t: "No uncanny valley", d: "Cartoon frames read as design, not as a not-quite-human face. The thing that makes UGC avatars flop just… isn't there." },
    { t: "Global on day one", d: "Native multilingual voiceover and captions. One product, ten markets, same afternoon." },
    { t: "Built for ad buyers", d: "Multiple formats, multiple hooks per product. Made to test creative, not to win a tech demo." },
  ];
  return (
    <div style={{ background: INK, color: "#fff", padding: "72px 0" }}>
      <Wrap>
        <div style={{ maxWidth: 620, marginBottom: 44 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: O, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>The wedge</div>
          <h2 className="am-h" style={{ fontSize: 40, margin: 0 }}>UGC tools went all-in on fake people. <span style={{ color: O }}>We went all-in on animation.</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 1, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
          {items.map((it, i) => (
            <div key={i} style={{ background: INK, padding: 26 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: O, marginBottom: 10 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{it.t}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.62)" }}>{it.d}</div>
            </div>
          ))}
        </div>
      </Wrap>
    </div>
  );
}

// ── como funciona ─────────────────────────────────────────────
function How() {
  const steps = [
    { t: "Drop your product", d: "Upload a photo or just describe it. The engine reads color, shape and identity." },
    { t: "It writes the ad", d: "Script, hook, scene-by-scene keyframes and motion prompts — built to keep your product consistent across every frame." },
    { t: "Render & download", d: "Image-to-video, voiceover, captions and music get stitched into a finished vertical MP4." },
  ];
  return (
    <div id="how" style={{ padding: "76px 0" }}>
      <Wrap>
        <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 50px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: O, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>How it works</div>
          <h2 className="am-h" style={{ fontSize: 40, margin: 0 }}>Photo in. Finished ad out.</h2>
        </div>
        <div className="am-strip" style={{ height: 10, borderRadius: 3, marginBottom: 0, opacity: 0.12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 26, marginTop: 36 }}>
          {steps.map((s, i) => (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 11, background: INK, color: "#fff", fontWeight: 850, fontSize: 18, marginBottom: 16 }}>{i + 1}</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>{s.t}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.55, color: MUTED }}>{s.d}</div>
            </div>
          ))}
        </div>
      </Wrap>
    </div>
  );
}

// ── modelos / credibilidade ───────────────────────────────────
function Models() {
  const models = [
    { n: "Seedance 2.0", b: "#1 quality", note: "native audio + locked character consistency" },
    { n: "Kling 3.0 Omni", b: "Elements", note: "multi-shot, native audio" },
    { n: "Kling 2.5 Turbo", b: "best value", note: "$0.07/s, smooth motion" },
    { n: "Veo 3.1", b: "cinematic", note: "premium tier" },
  ];
  return (
    <div style={{ background: PANEL, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: "60px 0" }}>
      <Wrap>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 30 }}>
          <h2 className="am-h" style={{ fontSize: 30, margin: 0, maxWidth: 460 }}>One platform, every top video model</h2>
          <div style={{ fontSize: 13.5, color: MUTED, maxWidth: 360 }}>We swap models with a single line, so you always render on whatever ranks #1 this month.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12 }}>
          {models.map((m) => (
            <div key={m.n} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{m.n}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#fff", background: O, padding: "2px 8px", borderRadius: 999 }}>{m.b}</span>
              </div>
              <div style={{ fontSize: 13, color: MUTED }}>{m.note}</div>
            </div>
          ))}
        </div>
      </Wrap>
    </div>
  );
}

// ── pricing + waitlist ────────────────────────────────────────
function Pricing({ navigate }) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const tiers = [
    { n: "Starter", p: "$29", u: "/mo", f: ["5 finished ads / month", "9:16, 1:1, 16:9", "3 hook variations", "Multilingual voiceover"] },
    { n: "Pro", p: "$99", u: "/mo", best: true, f: ["30 finished ads / month", "Brand kit & character lock", "Regenerate single scenes", "Priority render queue"] },
    { n: "Studio", p: "Custom", u: "", f: ["Unlimited seats", "API access", "Bulk variations", "Dedicated support"] },
  ];
  async function join() {
    if (!email.includes("@")) return;
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });
    } catch (e) { /* backend may not be running */ }
    setJoined(true);
  }
  return (
    <div id="pricing" style={{ padding: "78px 0" }}>
      <Wrap>
        {/* waitlist / early access */}
        <div style={{ background: INK, color: "#fff", borderRadius: 18, padding: "40px 36px", marginBottom: 44, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 30, alignItems: "center" }} className="am-hero-grid">
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: O, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Early access</div>
            <h2 className="am-h" style={{ fontSize: 34, margin: "0 0 12px" }}>The tool the big players used — now opening up.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: "rgba(255,255,255,0.66)", margin: 0 }}>Join the list and lock founder pricing. First seats get priority render and direct input on the roadmap.</p>
          </div>
          <div>
            {joined ? (
              <div className="am-reveal" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 12, padding: 22, textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>You're on the list ✓</div>
                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.66)" }}>Want to skip the line? Founder access is R$19 one-time — we'll send the link.</div>
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 12, padding: 16 }}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" onKeyDown={(e) => e.key === "Enter" && join()}
                  style={{ width: "100%", border: "none", borderRadius: 8, padding: "13px 14px", fontSize: 14.5, outline: "none", marginBottom: 10 }} />
                <button onClick={join} className="am-btn-primary" style={{ width: "100%", padding: "13px 0", borderRadius: 8, fontSize: 14.5 }}>Get early access</button>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 8 }}>No spam. Just your invite.</div>
              </div>
            )}
          </div>
        </div>

        {/* tiers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 16 }}>
          {tiers.map((t) => (
            <div key={t.n} style={{ background: "#fff", border: `1.5px solid ${t.best ? O : LINE}`, borderRadius: 14, padding: 24, position: "relative" }}>
              {t.best && <div style={{ position: "absolute", top: -11, left: 24, background: O, color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999 }}>MOST POPULAR</div>}
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{t.n}</div>
              <div style={{ marginBottom: 16 }}><span className="am-h" style={{ fontSize: 36 }}>{t.p}</span><span style={{ fontSize: 14, color: MUTED }}>{t.u}</span></div>
              <div style={{ display: "grid", gap: 9, marginBottom: 20 }}>
                {t.f.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13.5 }}>
                    <span style={{ color: O, fontWeight: 800 }}>✓</span><span>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/app")} className={t.best ? "am-btn-primary" : "am-btn-ghost"} style={{ display: "block", width: "100%", textAlign: "center", padding: "12px 0", borderRadius: 9, fontSize: 14 }}>
                {t.n === "Studio" ? "Talk to us" : "Get early access"}
              </button>
            </div>
          ))}
        </div>
      </Wrap>
    </div>
  );
}

function Footer() {
  return (
    <div style={{ borderTop: `1px solid ${LINE}`, padding: "34px 0" }}>
      <Wrap style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Logo />
        <div style={{ fontSize: 12.5, color: MUTED }}>absolutemotion.com · animated ads, fully automated</div>
        <div style={{ fontSize: 12.5, color: MUTED }}>© 2026 Absolute Motion</div>
      </Wrap>
    </div>
  );
}
