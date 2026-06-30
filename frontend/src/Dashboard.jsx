import React, { useState, useEffect, useRef, useContext, createContext } from "react";

// ═══════════════════════════════════════════════════════════════
// ABSOLUTE MOTION — Cinematic Animation Studio (monochrome)
// ═══════════════════════════════════════════════════════════════

const API = import.meta.env.VITE_API_URL || "/api";
const api = (path, opts) => fetch(`${API}${path}`, opts);

function fileToData(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const dataUrl = r.result; resolve({ dataUrl, base64: String(dataUrl).split(",")[1], mediaType: file.type || "image/png", name: file.name }); };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const T = {
  bg: "#FFFFFF", bg2: "#FAFAFA", bg3: "#F4F4F5",
  ink: "#000000", text: "#171717", sub: "#525252", muted: "#A3A3A3",
  line: "#E5E5E5", lineDark: "#D4D4D8", accent: "#000000", accentHover: "#262626",
};

const IC = {
  play: "M5 3l14 9-14 9V3z",
  film: "M7 4V20M17 4V20M3 8H7M17 8H21M3 12H7M17 12H21M3 16H7M17 16H21M4 4H20C20.5523 4 21 4.44772 21 5V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V5C3 4.44772 3.44772 4 4 4Z",
  layer: "M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12",
  sparkles: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  chevronDown: "M19 9l-7 7-7-7",
  plus: "M12 4v16m8-8H4",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  alert: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  server: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  check: "M5 13l4 4L19 7",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  image: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  refresh: "M4 4v5h5M20 20v-5h-5M20 9A8 8 0 006 5.3L4 7M4 15a8 8 0 0014 3.7l2-1.7",
  x: "M6 6l12 12M18 6L6 18",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  globe: ["M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "M3.6 9h16.8", "M3.6 15h16.8", "M12 3a15 15 0 010 18", "M12 3a15 15 0 000 18"],
  book: "M12 6.25v13M12 6.25C10.83 5.48 9.25 5 7.5 5S4.17 5.48 3 6.25v13C4.17 18.48 5.75 18 7.5 18s3.33.48 4.5 1.25m0-13C13.17 5.48 14.75 5 16.5 5c1.75 0 3.33.48 4.5 1.25v13C19.83 18.48 18.25 18 16.5 18c-1.75 0-3.33.48-4.5 1.25",
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  phone: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7M13 16v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  share: "M8.7 13.3a3 3 0 110-2.6m0 2.6l6.6 3.3m-6.6-6l6.6-3.3m0 0a3 3 0 105.4-2.7 3 3 0 00-5.4 2.7zm0 9.4a3 3 0 105.4 2.7 3 3 0 00-5.4-2.7z",
  star: "M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.52 4.67a1 1 0 00.95.69h4.91c.97 0 1.37 1.24.59 1.81l-3.98 2.89a1 1 0 00-.36 1.12l1.52 4.67c.3.92-.76 1.69-1.54 1.12l-3.98-2.89a1 1 0 00-1.18 0l-3.98 2.89c-.78.57-1.84-.2-1.54-1.12l1.52-4.67a1 1 0 00-.36-1.12L2.05 10.8c-.78-.57-.38-1.81.59-1.81h4.91a1 1 0 00.95-.69l1.52-4.67z",
  folderPlus: ["M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", "M12 11v4", "M10 13h4"],
  variation: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.59a1 1 0 01.7.29l4.42 4.42a1 1 0 01.29.7V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2",
  scissors: "M14.12 14.12L19 19m-7-7l7-7m-7 7l-2.88 2.88M12 12L9.12 9.12m0 5.76a3 3 0 10-4.24 4.24 3 3 0 004.24-4.24zm0-5.76a3 3 0 10-4.24-4.24 3 3 0 004.24 4.24z",
  thumbUp: "M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3",
  thumbDown: "M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17",
  copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  external: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
  grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  wand: "M5 21l9-9M14 7l3 3M13 4l1-1 6 6-1 1M6 12l-1 1 4 4 1-1M3 13l2 2M19 13l2 2M13 19l2 2",
  music: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z",
  mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
};

const Ico = ({ d, size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === "string" ? <path d={d} /> : Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : null}
  </svg>
);

// Logo monocromático Absolute Motion (monograma AM).
const Logo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Absolute Motion" style={{ flexShrink: 0, display: "block" }}>
    <rect width="64" height="64" rx="14" fill={T.ink} />
    <g stroke={T.bg} strokeWidth="5" fill="none" strokeLinejoin="miter" strokeLinecap="butt">
      <path d="M10 46 L19 19 L28 46" />
      <path d="M13.5 35 H24.5" />
      <path d="M32 46 V19 L43 33 L54 19 V46" />
    </g>
  </svg>
);

// ── Primitives ──────────────────────────────────────
const Input = (p) => <input {...p} style={{ width: "100%", padding: "10px 14px", background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.ink, transition: "border-color 0.2s", ...p.style }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.line} />;
const TextArea = (p) => <textarea {...p} style={{ width: "100%", padding: "10px 14px", background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.ink, transition: "border-color 0.2s", resize: "vertical", ...p.style }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.line} />;
const Label = ({ children, style }) => <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5, ...style }}>{children}</div>;
const Btn = ({ children, onClick, primary, block, disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: primary ? T.ink : T.bg, color: primary ? T.bg : T.ink, border: primary ? "none" : `1px solid ${T.lineDark}`,
    padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled ? "wait" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: block ? "100%" : "auto", opacity: disabled ? 0.6 : 1, transition: "all 0.15s", whiteSpace: "nowrap", ...style
  }}
  onMouseOver={e => { if (!disabled) e.currentTarget.style.background = primary ? T.accentHover : T.bg3 }}
  onMouseOut={e => { if (!disabled) e.currentTarget.style.background = primary ? T.ink : T.bg }}>
    {children}
  </button>
);
const Select = ({ value, onChange, options, style }) => (
  <select value={value} onChange={onChange} style={{ width: "100%", padding: "10px 14px", background: `${T.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23525252'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") no-repeat right 12px center/14px`, border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.ink, appearance: "none", cursor: "pointer", ...style }}>
    {options.map((o) => <option key={o.val ?? o} value={o.val ?? o}>{o.label ?? o}</option>)}
  </select>
);
const Badge = ({ children, color = T.sub, style }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, border: `1px solid ${T.line}`, color, background: T.bg2, textTransform: "uppercase", letterSpacing: 0.5, ...style }}>{children}</span>
);
const IconBtn = ({ icon, onClick, active, title, color, size = 18 }) => (
  <button title={title} onClick={onClick} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${active ? T.ink : T.lineDark}`, background: active ? T.bg3 : T.bg, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: color || (active ? T.ink : T.sub), transition: "all .15s" }} onMouseOver={e => e.currentTarget.style.background = T.bg3} onMouseOut={e => e.currentTarget.style.background = active ? T.bg3 : T.bg}>
    <Ico d={icon} size={size} color={color || (active ? T.ink : T.sub)} />
  </button>
);
const Segmented = ({ value, onChange, options }) => (
  <div style={{ display: "flex", background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 10, padding: 3, gap: 3 }}>
    {options.map(o => (
      <button key={o.val} onClick={() => onChange(o.val)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: value === o.val ? T.bg : "transparent", color: value === o.val ? T.ink : T.sub, boxShadow: value === o.val ? "0 1px 2px rgba(0,0,0,0.08)" : "none", transition: "all .15s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        {o.icon && <Ico d={o.icon} size={14} color={value === o.val ? T.ink : T.sub} />}{o.label}
      </button>
    ))}
  </div>
);

const spinnerCSS = `
*{box-sizing:border-box}
::selection{background:#E5E5E5}
.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}
.fade{animation:fade .16s cubic-bezier(.4,0,.2,1)}@keyframes fade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.pop{animation:pop .22s cubic-bezier(.34,1.56,.64,1)}@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
.view-enter{animation:viewIn .24s cubic-bezier(.4,0,.2,1)}@keyframes viewIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.card-hover{transition:transform .2s cubic-bezier(.4,0,.2,1),box-shadow .2s cubic-bezier(.4,0,.2,1),border-color .2s}
.card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.06);border-color:#D4D4D8}
.nav-item{transition:background .15s ease,color .15s ease}
.bar{transition:width .5s cubic-bezier(.4,0,.2,1)}
.blink{animation:blink 1s step-end infinite}@keyframes blink{50%{opacity:0}}
*::-webkit-scrollbar{width:10px;height:10px}*::-webkit-scrollbar-thumb{background:#E5E5E5;border-radius:99px;border:3px solid #fff}*::-webkit-scrollbar-thumb:hover{background:#D4D4D8}
`;
const Spinner = ({ size = 16, light }) => <div className="spin" style={{ width: size, height: size, border: `2px solid ${light ? "rgba(255,255,255,0.3)" : T.line}`, borderTopColor: light ? "#fff" : T.ink, borderRadius: "50%" }} />;

const IMAGE_MODELS = [{ val: "flux-dev", label: "FLUX.1 Dev — budget" }, { val: "flux-pro", label: "FLUX Pro — high quality" }, { val: "seedream-4", label: "Seedream 4" }];
const VIDEO_MODELS = [{ val: "seedance-2.0", label: "Seedance 2.0" }, { val: "seedance-2.0-mini", label: "Seedance 2.0 Mini — budget" }, { val: "kling-3.0", label: "Kling 3.0" }, { val: "kling-2.5-turbo", label: "Kling 2.5 Turbo" }, { val: "veo-3.1", label: "Veo 3.1 — premium" }, { val: "wan-2.5", label: "WAN 2.5" }];
// Estilos de animação que convertem em anúncios (curadoria de mercado).
const STYLES = ["Claymation", "Pixar 3D style", "Anime", "Paper Cutout", "LEGO", "Wes Anderson", "Retro Cartoon", "Surreal 3D", "Miniature", "Realistic / Photographic", "Motion Graphics"];
const STYLE_META = {
  "Claymation": "Clay / stop-motion", "Pixar 3D style": "Glossy 3D render", "Anime": "2D cel shading",
  "Paper Cutout": "Layered paper", "LEGO": "Brick build", "Wes Anderson": "Symmetry / pastel",
  "Retro Cartoon": "Rubber-hose vintage", "Surreal 3D": "Morphing loops", "Miniature": "Tilt-shift diorama",
  "Realistic / Photographic": "Photoreal render", "Motion Graphics": "Vector / kinetic",
};
const FORMATS = [{ val: "9:16", label: "Vertical (9:16)" }, { val: "16:9", label: "Horizontal (16:9)" }, { val: "1:1", label: "Square (1:1)" }];
const DURATIONS = [{ val: 15, label: "15 seconds" }, { val: 30, label: "30 seconds" }, { val: 45, label: "45 seconds" }, { val: 60, label: "60 seconds" }];
const OBJECTIVES = ["Conversion / direct sales", "Brand awareness", "Product launch", "Traffic / clicks"];
const TONES = ["Fun", "Inspiring", "Urgent", "Premium / Sophisticated", "Trustworthy"];
const VOICES = ["Premium voiceover", "Energetic male", "Energetic female", "Calm male", "Calm female"];
const LANGS = ["Português (BR)", "English (US)", "Español", "Français", "Deutsch", "Italiano", "日本語", "中文"];
const MUSIC_MOODS = [{ val: "none", label: "No music" }, { val: "cinematic", label: "Cinematic" }, { val: "upbeat", label: "Upbeat" }, { val: "corporate", label: "Corporate" }, { val: "chill", label: "Chill" }];
const RES_OPTS = [{ val: "720p", label: "720p" }, { val: "1080p", label: "1080p" }, { val: "4k", label: "4K" }];
const OUTPUT_OPTS = [{ val: 1, label: "1" }, { val: 2, label: "2" }, { val: 3, label: "3" }, { val: 4, label: "4" }];
const MODEL_NOTES = {
  "seedance-2.0": "Balanced quality & cost · native audio", "seedance-2.0-mini": "Fastest & cheapest", "kling-3.0": "Top motion & consistency",
  "kling-2.5-turbo": "Fast, stable results", "veo-3.1": "Premium cinematic quality", "wan-2.5": "Lowest cost",
};
const EXPORT_FORMATS = [{ val: "9:16", label: "9:16 · Reels/TikTok" }, { val: "1:1", label: "1:1 · Feed" }, { val: "16:9", label: "16:9 · YouTube" }];
const TEMPLATES = [
  { id: "reveal", name: "Product Reveal", desc: "Dramatic hero reveal of the product.", values: { style: "3D Pixar style", tone: "Inspiring", objective: "Brand awareness", duration: 15, format: "9:16" } },
  { id: "problem", name: "Problem → Solution", desc: "Show the pain, then the product as the fix.", values: { style: "Motion Graphics", tone: "Trustworthy", objective: "Conversion / direct sales", duration: 30, format: "9:16" } },
  { id: "features", name: "Feature Highlights", desc: "Fast-cut tour of the top benefits.", values: { style: "3D Pixar style", tone: "Fun", objective: "Product launch", duration: 30, format: "9:16" } },
  { id: "hype", name: "UGC-style Hype", desc: "Urgent, punchy, social-first energy.", values: { style: "Realistic / Photographic", tone: "Urgent", objective: "Traffic / clicks", duration: 15, format: "9:16" } },
  { id: "story", name: "Brand Story", desc: "Emotional narrative for awareness.", values: { style: "Motion Graphics", tone: "Inspiring", objective: "Brand awareness", duration: 45, format: "16:9" } },
  { id: "promo", name: "Sale / Promo", desc: "Discount-driven, high urgency.", values: { style: "3D Pixar style", tone: "Urgent", objective: "Conversion / direct sales", duration: 15, format: "9:16" } },
];

const UICtx = createContext({});
const useUI = () => useContext(UICtx);

// ── i18n: dicionário do "chrome". EN é a base (as próprias chaves). ──
const TR = {
  pt: {
    "Animation Studio": "Estúdio de Animação", "Projects": "Projetos", "Render Queue": "Fila de Render", "Assets Library": "Biblioteca", "Tools": "Ferramentas", "Team": "Time", "Settings & API": "Config. & API",
    "Workspace": "Área de trabalho", "Account": "Conta", "New Project": "Novo Projeto", "New Folder": "Nova Pasta", "Upgrade": "Fazer Upgrade", "credits": "créditos", "My account": "Minha conta",
    "Profile Settings": "Perfil", "Quick Start": "Início rápido", "Switch Language": "Trocar idioma", "App Download": "Baixar app", "Policies & Agreements": "Políticas", "Sign Out": "Sair",
    "AI Animation Engine": "Motor de Animação IA", "Settings & Integrations": "Configurações & Integrações",
    "Parameters": "Parâmetros", "Generate Storyboard": "Gerar Storyboard", "Render Video": "Renderizar Vídeo", "Start from a template": "Começar de um template", "More options": "Mais opções",
    "Notifications": "Notificações", "Mark all as read": "Marcar como lidas", "New render": "Novo render", "New project": "Novo projeto", "New folder": "Nova pasta",
    "Studio": "Estúdio", "Queue": "Fila", "Assets": "Mídia", "Settings": "Config", "New": "Novo",
  },
  es: {
    "Animation Studio": "Estudio de Animación", "Projects": "Proyectos", "Render Queue": "Cola de Render", "Assets Library": "Biblioteca", "Tools": "Herramientas", "Team": "Equipo", "Settings & API": "Ajustes & API",
    "Workspace": "Espacio", "Account": "Cuenta", "New Project": "Nuevo Proyecto", "New Folder": "Nueva Carpeta", "Upgrade": "Mejorar plan", "credits": "créditos", "My account": "Mi cuenta",
    "Profile Settings": "Perfil", "Quick Start": "Inicio rápido", "Switch Language": "Cambiar idioma", "App Download": "Descargar app", "Policies & Agreements": "Políticas", "Sign Out": "Salir",
    "AI Animation Engine": "Motor de Animación IA", "Settings & Integrations": "Ajustes e Integraciones",
    "Parameters": "Parámetros", "Generate Storyboard": "Generar Storyboard", "Render Video": "Renderizar Video", "Start from a template": "Empezar con plantilla", "More options": "Más opciones",
    "Notifications": "Notificaciones", "Mark all as read": "Marcar como leídas", "New render": "Nuevo render", "New project": "Nuevo proyecto", "New folder": "Nueva carpeta",
    "Studio": "Estudio", "Queue": "Cola", "Assets": "Medios", "Settings": "Ajustes", "New": "Nuevo",
  },
};
const langCode = (l) => (l?.startsWith("Port") ? "pt" : l?.startsWith("Esp") ? "es" : "en");
const makeT = (lang) => { const c = langCode(lang); return (s) => (TR[c] && TR[c][s]) || s; };

function Menu({ trigger, children, align = "left", up = false, width = 240, panelStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && <div className="fade" style={{ position: "absolute", [align]: 0, [up ? "bottom" : "top"]: "calc(100% + 8px)", zIndex: 60, width, background: T.bg, border: `1px solid ${T.lineDark}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.14)", overflow: "hidden", ...panelStyle }}>{children(() => setOpen(false))}</div>}
    </div>
  );
}
const MenuItem = ({ icon, label, onClick, danger, hint }) => (
  <div onClick={onClick} className="nav-item" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", color: T.text, fontSize: 13, fontWeight: danger ? 600 : 500 }} onMouseOver={e => e.currentTarget.style.background = T.bg2} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
    {icon && <Ico d={icon} size={16} color={T.sub} />}<span style={{ flex: 1 }}>{label}</span>{hint && <span style={{ fontSize: 11, color: T.muted }}>{hint}</span>}
  </div>
);
const MenuSep = () => <div style={{ height: 1, background: T.line }} />;

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="pop" onClick={e => e.stopPropagation()} style={{ width, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", background: T.bg, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${T.line}` }}><div style={{ fontSize: 16, fontWeight: 700, color: T.ink, flex: 1 }}>{title}</div><button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><Ico d={IC.x} size={20} /></button></div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [activeView, setActiveView] = useState("studio");
  const [collapsed, setCollapsed] = useState(false);
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [lang, setLang] = useState(() => localStorage.getItem("am_lang") || "English (US)");
  const [favs, setFavs] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem("am_favs") || "[]")); } catch { return new Set(); } });
  const [folders, setFolders] = useState([]);

  const reloadMe = () => api("/me?userId=local-user").then(r => r.json()).then(setMe).catch(() => {});
  const reloadFolders = () => api("/folders?userId=local-user").then(r => r.json()).then(setFolders).catch(() => {});
  useEffect(() => { api("/health").then(r => r.json()).then(setHealth).catch(() => setHealth({ ok: false })); reloadMe(); reloadFolders(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); } }, [toast]);

  const notify = (m) => setToast(m);
  const toggleFav = (id) => setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); localStorage.setItem("am_favs", JSON.stringify([...n])); notify(n.has(id) ? "Added to favorites" : "Removed from favorites"); return n; });
  const addFolder = async (name) => { await api("/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "local-user", name }) }); reloadFolders(); };
  const removeFolder = async (id) => { await api(`/folders/${id}`, { method: "DELETE" }); reloadFolders(); };
  const setLangPersist = (l) => { setLang(l); localStorage.setItem("am_lang", l); notify("Language: " + l); };

  const [pendingStyle, setPendingStyle] = useState(null);
  const t = makeT(lang);
  const startWithStyle = (s) => { setPendingStyle(s); setActiveView("studio"); notify("Style: " + s); };
  const ctx = { health, me, reloadMe, notify, favs, toggleFav, lang, setLang: setLangPersist, openModal: setModal, folders, addFolder, removeFolder, setActiveView, t, pendingStyle, clearPendingStyle: () => setPendingStyle(null), startWithStyle };
  const NAV = [["explore", "Explore", IC.sparkles, "Explore"], ["studio", "Animation Studio", IC.film, "Studio"], ["projects", "Projects", IC.folder, "Projects"], ["queue", "Render Queue", IC.layer, "Queue"], ["assets", "Assets Library", IC.image, "Assets"], ["tools", "Tools", IC.wand, "Tools"]];
  const TITLES = { explore: "Explore", studio: "AI Animation Engine", projects: "Projects", queue: "Render Queue", assets: "Assets Library", tools: "Tools", team: "Team", settings: "Settings & Integrations" };

  return (
    <UICtx.Provider value={ctx}>
    <div style={{ display: "flex", height: "100vh", background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, letterSpacing: "-0.01em" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{spinnerCSS}</style>

      {/* Sidebar */}
      <div style={{ width: collapsed ? 88 : 264, borderRight: `1px solid ${T.line}`, display: "flex", flexDirection: "column", flexShrink: 0, background: T.bg2, transition: "width 0.2s ease" }}>
        <div style={{ height: 64, padding: collapsed ? "0 12px" : "0 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.line}`, justifyContent: collapsed ? "center" : "flex-start", position: "relative" }}>
          <Logo size={30} />
          {!collapsed && <span style={{ fontWeight: 800, fontSize: 15, color: T.ink, letterSpacing: "-0.01em" }}>Absolute Motion</span>}
          <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand" : "Collapse"} style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, background: T.bg, border: `1px solid ${T.lineDark}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.ink, zIndex: 10 }}><Ico d={IC.chevronDown} size={14} style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(90deg)" }} /></button>
        </div>

        <div style={{ padding: collapsed ? "12px 12px 4px" : 12, display: "flex", gap: 8, justifyContent: "center" }}>
          {collapsed
            ? <NavItem icon={IC.plus} label={t("New Project")} short={t("New")} onClick={() => { setActiveView("studio"); notify("New project — fill the brief"); }} c accent />
            : <><Btn primary block onClick={() => { setActiveView("studio"); notify("New project — fill the brief"); }} style={{ height: 40 }}><Ico d={IC.plus} size={16} color={T.bg} /> {t("New Project")}</Btn><IconBtn icon={IC.folderPlus} title={t("New Folder")} onClick={() => setModal("folder")} /></>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: collapsed ? "8px 10px" : "8px 12px" }}>
          {!collapsed && <div style={navHdr}>{t("Workspace")}</div>}
          {collapsed && <div style={{ height: 1, background: T.line, margin: "4px 6px 10px" }} />}
          {NAV.map(([k, label, icon, short]) => <NavItem key={k} icon={icon} label={t(label)} short={t(short)} active={activeView === k} onClick={() => setActiveView(k)} c={collapsed} />)}
          {!collapsed ? <div style={{ ...navHdr, marginTop: 24 }}>{t("Account")}</div> : <div style={{ height: 1, background: T.line, margin: "12px 6px 10px" }} />}
          <NavItem icon={IC.user} label={t("Team")} short={t("Team")} active={activeView === "team"} onClick={() => setActiveView("team")} c={collapsed} />
          <NavItem icon={IC.settings} label={t("Settings & API")} short={t("Settings")} active={activeView === "settings"} onClick={() => setActiveView("settings")} c={collapsed} />
        </div>

        <div style={{ padding: collapsed ? "10px 10px 12px" : 12, borderTop: `1px solid ${T.line}` }}>
          {!collapsed ? (
            <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Ico d={IC.bolt} size={16} color={T.sub} /><span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{me?.credits ?? "—"}</span><span style={{ fontSize: 12, color: T.sub }}>{t("credits")}</span><span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase" }}>{me?.plan || ""}</span></div>
              <Btn primary block onClick={() => setModal("upgrade")} style={{ height: 34, fontSize: 12 }}><Ico d={IC.sparkles} size={13} color={T.bg} /> {t("Upgrade")}</Btn>
            </div>
          ) : (
            <div onClick={() => setModal("upgrade")} className="nav-item" title={`${me?.credits ?? "—"} ${t("credits")}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "9px 2px", borderRadius: 10, cursor: "pointer", border: `1px solid ${T.lineDark}`, marginBottom: 8 }} onMouseOver={e => e.currentTarget.style.background = T.bg3} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <Ico d={IC.bolt} size={18} color={T.ink} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{me?.credits ?? "—"}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: T.sub, lineHeight: 1, textTransform: "uppercase", letterSpacing: 0.3 }}>{t("Upgrade")}</span>
            </div>
          )}

          <Menu up width={250} trigger={
            <div className="nav-item" title={t("My account")} style={{ display: "flex", flexDirection: collapsed ? "column" : "row", alignItems: "center", gap: collapsed ? 4 : 10, padding: collapsed ? "8px 2px" : 8, borderRadius: 10, cursor: "pointer", justifyContent: "center" }} onMouseOver={e => e.currentTarget.style.background = T.bg3} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: collapsed ? 28 : 32, height: collapsed ? 28 : 32, borderRadius: "50%", background: T.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>A</div>
              {collapsed
                ? <span style={{ fontSize: 10, fontWeight: 600, color: T.sub, lineHeight: 1 }}>{t("Account")}</span>
                : <><div style={{ flex: 1, overflow: "hidden" }}><div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: "nowrap" }}>{t("My account")}</div><div style={{ fontSize: 11, color: T.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me?.email || "local-user"}</div></div><Ico d={IC.chevronDown} size={14} color={T.muted} /></>}
            </div>
          }>
            {close => (
              <div>
                <MenuItem icon={IC.user} label={t("Profile Settings")} onClick={() => { close(); setActiveView("settings"); }} />
                <MenuItem icon={IC.bolt} label={t("Quick Start")} onClick={() => { close(); setModal("quickstart"); }} />
                <MenuItem icon={IC.book} label="Blog" onClick={() => { close(); window.open("https://absolutemotion.ai/blog", "_blank"); }} hint="↗" />
                <MenuItem icon={IC.globe} label={t("Switch Language")} onClick={() => { close(); setModal("language"); }} hint={lang.split(" ")[0]} />
                <MenuItem icon={IC.phone} label={t("App Download")} onClick={() => { close(); setModal("apps"); }} />
                <MenuItem icon={IC.shield} label={t("Policies & Agreements")} onClick={() => { close(); setModal("policies"); }} />
                <MenuSep />
                <MenuItem icon={IC.logout} label={t("Sign Out")} danger onClick={() => { close(); notify("Signed out (demo)"); }} />
              </div>
            )}
          </Menu>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 64, borderBottom: `1px solid ${T.line}`, background: T.bg, display: "flex", alignItems: "center", padding: "0 24px", gap: 16, zIndex: 40 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>{t(TITLES[activeView])}</div>
          <div style={{ display: "flex", gap: 10, marginLeft: "auto", alignItems: "center" }}>
            <NotificationsBell />
            <div style={{ background: T.bg3, color: T.text, padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Ico d={IC.bolt} size={14} color={T.sub} /> {me?.credits ?? "—"}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden", display: "flex", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: `linear-gradient(${T.line} 1px, transparent 1px), linear-gradient(90deg, ${T.line} 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />
          <div key={activeView} className="view-enter" style={{ flex: 1, display: "flex", minWidth: 0, zIndex: 1 }}>
            {activeView === "explore" && <ExploreView />}
            {activeView === "studio" && <AnimationEngine />}
            {activeView === "projects" && <ProjectsView />}
            {activeView === "queue" && <RenderQueue />}
            {activeView === "assets" && <AssetsLibrary />}
            {activeView === "tools" && <ToolsView />}
            {activeView === "team" && <TeamView />}
            {activeView === "settings" && <SettingsView />}
          </div>
        </div>
      </div>

      {modal === "folder" && <FolderModal onClose={() => setModal(null)} />}
      {modal === "upgrade" && <UpgradeModal onClose={() => setModal(null)} />}
      {modal === "quickstart" && <QuickStartModal onClose={() => setModal(null)} />}
      {modal === "apps" && <AppsModal onClose={() => setModal(null)} />}
      {modal === "language" && <LanguageModal onClose={() => setModal(null)} />}
      {modal === "policies" && <PoliciesModal onClose={() => setModal(null)} />}

      {toast && <div className="fade" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", padding: "12px 20px", borderRadius: 99, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>{toast}</div>}
    </div>
    </UICtx.Provider>
  );
}

const navHdr = { fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, padding: "0 12px" };
function NavItem({ icon, label, short, active, onClick, c, accent }) {
  if (c) {
    // Recolhida: ícone + nome curto embaixo, centralizados.
    const fg = accent ? T.bg : active ? T.ink : T.sub;
    return (
      <div onClick={onClick} title={label} className="nav-item" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 2px", borderRadius: 10, cursor: "pointer", background: accent ? T.ink : active ? T.bg : "transparent", color: fg, border: `1px solid ${accent ? T.ink : active ? T.lineDark : "transparent"}`, marginBottom: 4, width: "100%" }}
        onMouseOver={e => { if (!accent && !active) e.currentTarget.style.background = T.bg3; }} onMouseOut={e => { if (!accent && !active) e.currentTarget.style.background = "transparent"; }}>
        <Ico d={icon} size={20} color={fg} />
        <span style={{ fontSize: 10, fontWeight: active || accent ? 700 : 600, lineHeight: 1, textAlign: "center", whiteSpace: "nowrap", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{short || label}</span>
      </div>
    );
  }
  return (
    <div onClick={onClick} className="nav-item" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: active ? T.bg : "transparent", color: active ? T.ink : T.sub, border: `1px solid ${active ? T.lineDark : "transparent"}`, marginBottom: 2 }}>
      <Ico d={icon} size={18} color={active ? T.ink : T.muted} /><span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{label}</span>
    </div>
  );
}

const ANNOUNCEMENTS = [
  { id: 1, tag: "New", title: "Kling 3.0 & Seedance 2.0 available", date: "Today", body: "New image-to-video models with native audio are now selectable in the Studio." },
  { id: 2, tag: "Improved", title: "Faster storyboard", date: "2 days ago", body: "The creative engine now writes the script and scenes live, streaming as it thinks." },
  { id: 3, tag: "Beta", title: "Regenerate a single scene", date: "1 week ago", body: "Tweak only the scene you don't like, without redoing the whole video." },
];
function NotificationsBell() {
  const { t } = useUI();
  const [read, setRead] = useState(false);
  return (
    <Menu align="right" width={340} trigger={
      <button style={{ position: "relative", width: 38, height: 38, borderRadius: 10, border: `1px solid ${T.lineDark}`, background: T.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.sub }}><Ico d={IC.bell} size={18} />{!read && <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: T.ink, border: `2px solid ${T.bg}` }} />}</button>
    }>
      {() => (
        <div>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${T.line}` }}><div style={{ fontWeight: 700, fontSize: 14, color: T.ink, flex: 1 }}>{t("Notifications")}</div><button onClick={() => setRead(true)} style={{ background: "none", border: "none", color: T.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t("Mark all as read")}</button></div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>{ANNOUNCEMENTS.map(a => (
            <div key={a.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${T.line}`, display: "flex", gap: 10 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: read ? T.line : T.ink, marginTop: 6, flexShrink: 0 }} /><div><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}><Badge>{a.tag}</Badge><span style={{ fontSize: 11, color: T.muted }}>{a.date}</span></div><div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{a.title}</div><div style={{ fontSize: 12, color: T.sub, marginTop: 2, lineHeight: 1.5 }}>{a.body}</div></div></div>
          ))}</div>
        </div>
      )}
    </Menu>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW: Explore (Animation OS) — tendências de estilos que convertem
// ═══════════════════════════════════════════════════════════════
const STYLE_VIEWS = { "Claymation": "451M", "Pixar 3D style": "388M", "Anime": "540M", "Paper Cutout": "92M", "LEGO": "210M", "Wes Anderson": "167M", "Retro Cartoon": "130M", "Surreal 3D": "305M", "Miniature": "78M", "Realistic / Photographic": "96M", "Motion Graphics": "142M" };
const TREND_VIEWS = ["9.4M", "12.7M", "4.0M", "21.1M", "6.8M", "3.3M", "18M", "12M"];
const SCAN_FEED = ["@petlovers.br", "@techgadgetz", "@glow.skincare", "@fitfuel", "@homehacks", "@toy.world", "@coffee.daily", "@ecomgrowth"];

// Número que "conta" de 0 até o alvo (easing) — dá vida às estatísticas.
function CountUp({ to, fmt, dur = 1000 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - start) / dur); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return <>{fmt(v)}</>;
}

function ExploreView() {
  const ui = useUI();
  const [ads, setAds] = useState(0);
  const [si, setSi] = useState(0);
  useEffect(() => { api("/jobs").then(r => r.json()).then(j => setAds((j || []).filter(x => x.status === "done").length)).catch(() => {}); }, []);
  useEffect(() => { const t = setInterval(() => setSi(i => (i + 1) % SCAN_FEED.length), 1800); return () => clearInterval(t); }, []);
  const stats = [
    { n: 6078, fmt: (v) => Math.round(v).toLocaleString("en-US"), label: "Ads analyzed" },
    { n: 454.2, fmt: (v) => v.toFixed(1) + "M", label: "Views scanned" },
    { n: 1669, fmt: (v) => Math.round(v).toLocaleString("en-US"), label: "Winning patterns" },
    { n: ads, fmt: (v) => String(Math.round(v)), label: "Animation ads generated" },
  ];
  const tiles = STYLES.slice(0, 8);

  return (
    <div style={{ flex: 1, padding: 32, overflowY: "auto", zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ border: `1px solid ${T.lineDark}`, borderRadius: 18, padding: 28, marginBottom: 20, position: "relative", overflow: "hidden", background: T.bg }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 2, textTransform: "uppercase" }}>AI · Creative · Ad Agent</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em", margin: "6px 0 8px" }}>Animation <span style={{ fontStyle: "italic", fontWeight: 700 }}>OS</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.sub }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.ink }} className="blink" /> Scanning viral animation patterns on TikTok · <span key={si} className="fade" style={{ fontWeight: 700, color: T.ink }}>{SCAN_FEED[si]}</span>
          </div>
          <div style={{ position: "absolute", top: 24, right: 24 }}><Btn primary onClick={() => ui.setActiveView("studio")}><Ico d={IC.play} size={14} color={T.bg} /> Run automation</Btn></div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: 20, background: T.bg }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}><CountUp to={s.n} fmt={s.fmt} /></div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
          {/* Top styles */}
          <div style={{ border: `1px solid ${T.lineDark}`, borderRadius: 16, overflow: "hidden", background: T.bg }}>
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5, flex: 1 }}>Top performing styles</div>
              <Badge color={T.ink} style={{ borderColor: T.lineDark, fontWeight: 700 }}>Live</Badge>
            </div>
            <div style={{ maxHeight: 460, overflowY: "auto" }}>
              {STYLES.map(s => (
                <div key={s} onClick={() => ui.startWithStyle(s)} className="nav-item" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", cursor: "pointer", borderBottom: `1px solid ${T.line}` }} onMouseOver={e => e.currentTarget.style.background = T.bg2} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.bg3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ico d={IC.sparkles} size={16} color={T.sub} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{s}</div><div style={{ fontSize: 11, color: T.sub }}>{STYLE_META[s]}</div></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{STYLE_VIEWS[s]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending grid */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {tiles.map((s, i) => (
                <div key={s} onClick={() => ui.startWithStyle(s)} className="card-hover" style={{ border: `1px solid ${T.line}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", background: T.bg }}>
                  <div style={{ aspectRatio: "1/1", background: T.bg3, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <Ico d={IC.film} size={28} color={T.muted} />
                    <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{TREND_VIEWS[i % TREND_VIEWS.length]}</div>
                  </div>
                  <div style={{ padding: "10px 12px" }}><div style={{ fontSize: 12, fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s}</div><div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{STYLE_META[s]}</div></div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 18, border: `1px dashed ${T.lineDark}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 14 }}>
              <Ico d={IC.sparkles} size={20} color={T.sub} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Turn any product into a fully animated ad</div><div style={{ fontSize: 12, color: T.sub }}>Photo + landing page → script, storyboard, render, voiceover, music & captions — automatically.</div></div>
              <Btn primary onClick={() => ui.setActiveView("studio")}><Ico d={IC.play} size={14} color={T.bg} /> Create now</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW 1: Animation Engine
// ═══════════════════════════════════════════════════════════════
function AnimationEngine() {
  const ui = useUI();
  const [f, setF] = useState({ name: "Main Campaign", product: "", desc: "", landingUrl: "", objective: OBJECTIVES[0], tone: TONES[0], style: STYLES[1], format: "9:16", duration: 30, lang: ui.lang, voice: VOICES[0], audience: "", brandContext: "", videoModel: "seedance-2.0", imageModel: "flux-dev", audioMode: "narration", musicMood: "cinematic", resolution: "1080p", outputs: 1 });
  const [photo, setPhoto] = useState(null);
  const [endFrame, setEndFrame] = useState(null);
  const [advanced, setAdvanced] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const endRef = useRef(null);
  const [stage, setStage] = useState("idle");   // idle|streaming|preview|rendering|done|error
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState(null);
  const [ids, setIds] = useState({ projectId: null, jobId: null });
  const [job, setJob] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [regening, setRegening] = useState(null);
  const fileRef = useRef(null); const pollRef = useRef(null); const videoRef = useRef(null);
  const update = (k, v) => setF(p => ({ ...p, [k]: v }));
  const onPickFile = async (file) => { if (!file) return; if (file.size > 10 * 1024 * 1024) { alert("Image over 10MB."); return; } setPhoto(await fileToData(file)); };

  // Storyboard com streaming (cenas chegando uma a uma)
  const generateStoryboard = async () => {
    if (!f.product.trim()) { alert("Enter the product name."); return; }
    setStage("streaming"); setErrorMsg(""); setPreview({ title: f.product, hook: "", cta: "", scenes: [], done: false });
    const body = { userId: "local-user", ...f }; if (photo) body.photo = { mediaType: photo.mediaType, base64: photo.base64 };
    try {
      const res = await api("/preview/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok || !res.body) throw new Error("stream-unavailable");
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n"); buf = parts.pop();
        for (const p of parts) {
          const line = p.split("\n").find(l => l.startsWith("data: ")); if (!line) continue;
          const ev = JSON.parse(line.slice(6));
          if (ev.type === "analysis") setPreview(s => ({ ...s, traits: ev.analysis.traits }));
          else if (ev.type === "concept") setPreview(s => ({ ...s, title: ev.concept.titulo, hook: ev.concept.gancho, cta: ev.concept.cta }));
          else if (ev.type === "scene") setPreview(s => ({ ...s, scenes: [...s.scenes, ev.scene] }));
          else if (ev.type === "audio") setPreview(s => ({ ...s, audio: ev.audio }));
          else if (ev.type === "done") setPreview(s => ({ ...s, done: true }));
          else if (ev.type === "error") throw new Error(ev.error);
        }
      }
      setStage("preview");
    } catch (e) {
      // fallback não-streaming
      try {
        const res = await api("/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
        const d = await res.json();
        setPreview({ title: d.concept?.titulo || f.product, hook: d.concept?.gancho || "", cta: d.concept?.cta || "", audio: d.audio, done: true, scenes: (d.scenes || []) });
        setStage("preview");
      } catch (e2) { setErrorMsg(e2.message); setStage("error"); }
    }
  };

  const renderVideo = async () => {
    setStage("rendering"); setErrorMsg(""); setScenes([]); setJob({ status: "queued", progress: 0, step: "Queued…" });
    try {
      const up = async (ph) => { if (!ph) return undefined; const r = await api("/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaType: ph.mediaType, base64: ph.base64, name: ph.name }) }); return r.ok ? (await r.json()).url : undefined; };
      const productRefUrl = await up(photo);
      const endFrameUrl = await up(endFrame);
      // renderiza o storyboard JÁ aprovado/editado (não regenera com o Claude)
      const approvedScenes = (preview?.scenes || []).map(s => ({ n: s.n, dur: s.dur, keyframe: s.keyframe, motion: s.motion, narracao: s.narracao || "", legenda: s.legenda || "" }));
      const concept = preview ? { titulo: preview.title, gancho: preview.hook, cta: preview.cta } : undefined;
      const res = await api("/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "local-user", ...f, productRefUrl, endFrameUrl, scenes: approvedScenes.length ? approvedScenes : undefined, concept }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const { projectId, jobId } = await res.json(); setIds({ projectId, jobId }); ui.reloadMe();
    } catch (e) { setErrorMsg(e.message); setStage("error"); }
  };

  useEffect(() => {
    if (stage !== "rendering" || !ids.jobId) return;
    const tick = async () => {
      try {
        const [j, p] = await Promise.all([api(`/jobs/${ids.jobId}`).then(r => r.json()), api(`/projects/${ids.projectId}`).then(r => r.json())]);
        setJob(j); setScenes(p.scenes || []);
        if (j.status === "done") { clearInterval(pollRef.current); setStage("done"); ui.reloadMe(); }
        if (j.status === "error") { clearInterval(pollRef.current); setErrorMsg(j.error || "Render failed"); setStage("error"); }
      } catch {}
    };
    tick(); pollRef.current = setInterval(tick, 2500);
    return () => clearInterval(pollRef.current);
  }, [stage, ids.jobId]);

  // Estilo vindo da tela Explore
  useEffect(() => { if (ui.pendingStyle) { setF(p => ({ ...p, style: ui.pendingStyle })); ui.clearPendingStyle?.(); } }, [ui.pendingStyle]);

  const regenerate = async (sceneId) => {
    setRegening(sceneId);
    try { await api(`/scenes/${sceneId}/regenerate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoModel: f.videoModel, imageModel: f.imageModel, format: f.format, lang: f.lang, style: f.style, brandContext: f.brandContext }) }); const p = await api(`/projects/${ids.projectId}`).then(r => r.json()); setScenes(p.scenes || []); ui.notify("Scene regenerated"); }
    catch { ui.notify("Failed to regenerate"); }
    setRegening(null);
  };

  const busy = stage === "streaming" || stage === "rendering";

  return (
    <div style={{ display: "flex", flex: 1, width: "100%", zIndex: 1 }}>
      {/* Left panel */}
      <div style={{ width: 420, background: T.bg, borderRight: `1px solid ${T.line}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: 32, flex: 1, overflowY: "auto" }}>
          <div style={{ marginBottom: 16 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{ui.t("Parameters")}</div><div style={{ fontSize: 12, color: T.sub }}>Product photo + brief → the engine builds your ad.</div></div>

          <Btn block onClick={() => setShowTemplates(true)} style={{ marginBottom: 20, height: 40 }}><Ico d={IC.grid} size={15} /> {ui.t("Start from a template")}</Btn>

          <div style={{ marginBottom: 20 }}>
            <Label>Product photo (optional)</Label>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onPickFile(e.target.files?.[0])} />
            {!photo ? (
              <div onClick={() => fileRef.current?.click()} style={{ border: `1px dashed ${T.lineDark}`, borderRadius: 12, padding: "24px 16px", textAlign: "center", background: T.bg2, cursor: "pointer", transition: "border-color .2s" }} onMouseOver={e => e.currentTarget.style.borderColor = T.ink} onMouseOut={e => e.currentTarget.style.borderColor = T.lineDark}><Ico d={IC.image} size={24} color={T.muted} style={{ marginBottom: 8 }} /><div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Click to upload an image</div><div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>JPG, PNG up to 10MB</div></div>
            ) : (
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.line}` }}><img src={photo.dataUrl} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} /><button onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ico d={IC.x} size={14} color="#fff" /></button></div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <Label>End frame (optional)</Label>
            <input ref={endRef} type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { const file = e.target.files?.[0]; if (file) setEndFrame(await fileToData(file)); }} />
            {!endFrame ? (
              <div onClick={() => endRef.current?.click()} style={{ border: `1px dashed ${T.lineDark}`, borderRadius: 12, padding: "14px 16px", textAlign: "center", background: T.bg2, cursor: "pointer", fontSize: 12, color: T.sub }}>Click to set the last frame of the ad</div>
            ) : (
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.line}` }}><img src={endFrame.dataUrl} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }} /><button onClick={() => { setEndFrame(null); if (endRef.current) endRef.current.value = ""; }} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer" }}><Ico d={IC.x} size={13} color="#fff" /></button></div>
            )}
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div><Label>Product / Service *</Label><Input value={f.product} onChange={e => update("product", e.target.value)} placeholder="e.g. Sincere Whey Protein" /></div>
            <div><Label>Description / benefits</Label><TextArea value={f.desc} onChange={e => update("desc", e.target.value)} style={{ height: 72 }} placeholder="What makes it special?" /></div>
            <div><Label>Landing page URL (optional)</Label><Input value={f.landingUrl} onChange={e => update("landingUrl", e.target.value)} placeholder="https://yourstore.com/product — the engine reads it" /></div>
            <div><Label>Audio</Label><Segmented value={f.audioMode} onChange={v => update("audioMode", v)} options={[{ val: "narration", label: "AI Narration", icon: IC.mic }, { val: "music", label: "Music only", icon: IC.music }]} /></div>
            <div><Label>Background music</Label><Select value={f.musicMood} onChange={e => update("musicMood", e.target.value)} options={MUSIC_MOODS} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><Label>Image model</Label><Select value={f.imageModel} onChange={e => update("imageModel", e.target.value)} options={IMAGE_MODELS} /></div>
              <div><Label>Video model</Label><Select value={f.videoModel} onChange={e => update("videoModel", e.target.value)} options={VIDEO_MODELS} /></div>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: -10, display: "flex", alignItems: "center", gap: 6 }}><Ico d={IC.sparkles} size={12} color={T.muted} /> {MODEL_NOTES[f.videoModel]}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><Label>Style</Label>
                <button onClick={() => setShowStyles(true)} style={{ width: "100%", padding: "10px 14px", background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 13, color: T.ink, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                  <Ico d={IC.sparkles} size={14} color={T.sub} /><span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>{f.style}</span><Ico d={IC.chevronDown} size={14} color={T.muted} />
                </button>
              </div>
              <div><Label>Format</Label><Select value={f.format} onChange={e => update("format", e.target.value)} options={FORMATS} /></div>
            </div>
            <div><Label>Duration</Label><Select value={f.duration} onChange={e => update("duration", parseInt(e.target.value))} options={DURATIONS} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><Label>Resolution</Label><Segmented value={f.resolution} onChange={v => update("resolution", v)} options={RES_OPTS} /></div>
              <div><Label>Outputs</Label><Segmented value={f.outputs} onChange={v => update("outputs", v)} options={OUTPUT_OPTS} /></div>
            </div>

            <div onClick={() => setAdvanced(a => !a)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: T.sub, fontSize: 12, fontWeight: 600, userSelect: "none" }}><Ico d={IC.chevronDown} size={14} style={{ transform: advanced ? "rotate(180deg)" : "none", transition: "transform .2s" }} /> {ui.t("More options")}</div>
            {advanced && (
              <div className="fade" style={{ display: "grid", gap: 18, padding: 16, background: T.bg2, borderRadius: 12, border: `1px solid ${T.line}` }}>
                <div><Label>Target audience</Label><Input value={f.audience} onChange={e => update("audience", e.target.value)} placeholder="e.g. gym-goers 20-35y" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}><div><Label>Objective</Label><Select value={f.objective} onChange={e => update("objective", e.target.value)} options={OBJECTIVES} /></div><div><Label>Tone</Label><Select value={f.tone} onChange={e => update("tone", e.target.value)} options={TONES} /></div></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}><div><Label>Language</Label><Select value={f.lang} onChange={e => update("lang", e.target.value)} options={LANGS} /></div><div><Label>Voice</Label><Select value={f.voice} onChange={e => update("voice", e.target.value)} options={VOICES} /></div></div>
                <div><Label>Brand kit / context</Label><TextArea value={f.brandContext} onChange={e => update("brandContext", e.target.value)} style={{ height: 60 }} placeholder="Colors, logo, mascot, slogan…" /></div>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: "20px 32px", borderTop: `1px solid ${T.line}`, background: T.bg, display: "grid", gap: 10 }}>
          <Btn primary block onClick={generateStoryboard} disabled={busy} style={{ height: 48, fontSize: 14 }}>{stage === "streaming" ? <><Spinner light /> Generating…</> : <><Ico d={IC.sparkles} size={16} color={T.bg} /> {ui.t("Generate Storyboard")}</>}</Btn>
          {(stage === "preview" || stage === "done") && <Btn block onClick={renderVideo} disabled={busy} style={{ height: 44 }}><Ico d={IC.film} size={16} /> {ui.t("Render Video")} · {f.duration * f.outputs} {ui.t("credits")}</Btn>}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, padding: 40, overflowY: "auto" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {stage === "idle" && <CanvasCard><EmptyState /></CanvasCard>}
          {stage === "error" && <CanvasCard><div style={{ background: T.bg2, border: `1px solid ${T.lineDark}`, borderRadius: 12, padding: 24, display: "flex", gap: 16, color: T.text }}><Ico d={IC.alert} size={24} color={T.sub} /><div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: T.ink }}>Error</div><div style={{ fontSize: 13 }}>{errorMsg}</div><div style={{ fontSize: 12, color: T.sub, marginTop: 12 }}>Make sure the backend is running on :8787.</div></div></div></CanvasCard>}
          {(stage === "streaming" || stage === "preview") && preview && <CanvasCard><Storyboard preview={preview} streaming={stage === "streaming"} editable={stage === "preview"} onChange={setPreview} /></CanvasCard>}

          {(stage === "rendering" || stage === "done") && (
            <div style={{ display: "grid", gap: 20 }}>
              {job && <CanvasCard>
                <ProgressView job={job} />
                {stage === "done" && job.outputUrl && (
                  <div style={{ marginTop: 24 }}>
                    <video ref={videoRef} src={job.outputUrl} crossOrigin="anonymous" controls style={{ width: "100%", maxHeight: 460, borderRadius: 12, background: T.bg3 }} />
                    <div style={{ marginTop: 16 }}><VideoActions url={job.outputUrl} id={ids.jobId} videoRef={videoRef} onRegen={renderVideo} regenLabel="Generate variation" /></div>
                    <ExportRow projectId={ids.projectId} />
                    {Number(job.cost) > 0 && <div style={{ marginTop: 12 }}><Badge>Cost ~ ${Number(job.cost).toFixed(2)}</Badge></div>}
                  </div>
                )}
              </CanvasCard>}
              {scenes.length > 0 && <CanvasCard><div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Scenes</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>{scenes.map(s => <SceneCard key={s.id} scene={s} onRegen={() => regenerate(s.id)} regening={regening === s.id} canRegen={stage === "done"} />)}</div></CanvasCard>}
            </div>
          )}
        </div>
      </div>
      {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} onPick={(t) => { setF(p => ({ ...p, ...t.values })); setShowTemplates(false); ui.notify("Template applied: " + t.name); }} />}
      {showStyles && <StylesModal current={f.style} onClose={() => setShowStyles(false)} onPick={(s) => { update("style", s); setShowStyles(false); }} />}
    </div>
  );
}

function StylesModal({ current, onClose, onPick }) {
  return (
    <Modal title="Animation style" onClose={onClose} width={680}>
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>The look is locked across every scene. Pick the style that fits the product.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {STYLES.map(s => {
          const sel = current === s;
          return (
            <div key={s} className="card-hover" onClick={() => onPick(s)} style={{ border: `1px solid ${sel ? T.ink : T.lineDark}`, borderRadius: 12, padding: 16, cursor: "pointer", background: sel ? T.bg2 : T.bg }}>
              <div style={{ height: 64, borderRadius: 8, background: T.bg3, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Ico d={IC.sparkles} size={22} color={T.sub} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ fontSize: 13, fontWeight: 700, color: T.ink, flex: 1 }}>{s}</div>{sel && <Ico d={IC.check} size={15} color={T.ink} />}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{STYLE_META[s]}</div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function TemplatesModal({ onClose, onPick }) {
  return (
    <Modal title="Start from a template" onClose={onClose} width={680}>
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>Pick a recipe to prefill the brief. You can tweak everything afterwards.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {TEMPLATES.map(t => (
          <div key={t.id} className="card-hover" onClick={() => onPick(t)} style={{ border: `1px solid ${T.lineDark}`, borderRadius: 12, padding: 18, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><Ico d={IC.film} size={18} color={T.ink} /><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{t.name}</div></div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, marginBottom: 12 }}>{t.desc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><Badge>{t.values.style}</Badge><Badge>{t.values.duration}s</Badge><Badge>{t.values.format}</Badge></div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function VideoActions({ url, id, videoRef, onRegen, regenLabel = "Regenerate" }) {
  const ui = useUI(); const [vote, setVote] = useState(0); const fav = ui.favs.has(id);
  const extractFrame = () => {
    const v = videoRef?.current; if (!v) return;
    try { const c = document.createElement("canvas"); c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720; c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = `frame-${Date.now()}.png`; a.click(); ui.notify("Frame extracted"); }
    catch { ui.notify("Frame extraction unavailable for this video (CORS)"); }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <a href={url} target="_blank" rel="noreferrer" download style={{ textDecoration: "none" }}><Btn primary><Ico d={IC.download} size={16} color={T.bg} /> Download</Btn></a>
      <ShareMenu url={url} />
      {onRegen && <Btn onClick={onRegen}><Ico d={IC.variation} size={15} /> {regenLabel}</Btn>}
      {videoRef && <Btn onClick={extractFrame}><Ico d={IC.scissors} size={15} /> Extract frame</Btn>}
      <IconBtn icon={IC.star} title="Favorite" active={fav} color={fav ? T.ink : undefined} onClick={() => ui.toggleFav(id)} />
      <div style={{ flex: 1 }} />
      <IconBtn icon={IC.thumbUp} active={vote === 1} onClick={() => setVote(v => v === 1 ? 0 : 1)} title="Like" />
      <IconBtn icon={IC.thumbDown} active={vote === -1} onClick={() => setVote(v => v === -1 ? 0 : -1)} title="Dislike" />
    </div>
  );
}

// Export multi-formato: reenquadra o vídeo pronto para 9:16 / 1:1 / 16:9
function ExportRow({ projectId }) {
  const ui = useUI(); const [busy, setBusy] = useState("");
  const exportAs = async (format) => {
    if (!projectId) return; setBusy(format);
    try { const r = await api(`/projects/${projectId}/export`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format }) }).then(x => x.json()); if (r.url) { window.open(r.url, "_blank"); ui.notify("Exported " + format); } else ui.notify("Export failed"); }
    catch { ui.notify("Export failed"); }
    setBusy("");
  };
  return (
    <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Export for:</span>
      {EXPORT_FORMATS.map(fmt => <Btn key={fmt.val} disabled={busy === fmt.val} onClick={() => exportAs(fmt.val)} style={{ height: 32, fontSize: 12 }}>{busy === fmt.val ? <Spinner size={12} /> : <Ico d={IC.download} size={13} />} {fmt.label}</Btn>)}
    </div>
  );
}

function ShareMenu({ url }) {
  const ui = useUI();
  const targets = [
    { label: "Copy link", icon: IC.copy, action: () => { navigator.clipboard?.writeText(url); ui.notify("Link copied"); } },
    { label: "Facebook / Meta Ads", icon: IC.share, action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank") },
    { label: "X (Twitter)", icon: IC.share, action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank") },
    { label: "WhatsApp", icon: IC.share, action: () => window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank") },
    { label: "TikTok", icon: IC.external, action: () => window.open("https://www.tiktok.com/upload", "_blank") },
    { label: "Instagram", icon: IC.external, action: () => window.open("https://www.instagram.com", "_blank") },
    { label: "YouTube Studio", icon: IC.external, action: () => window.open("https://studio.youtube.com", "_blank") },
  ];
  return <Menu width={230} trigger={<Btn><Ico d={IC.share} size={15} /> Share</Btn>}>{close => <div>{targets.map((t, i) => <MenuItem key={i} icon={t.icon} label={t.label} onClick={() => { t.action(); close(); }} />)}</div>}</Menu>;
}

const CanvasCard = ({ children }) => <div style={{ background: T.bg, padding: 32, border: `1px solid ${T.lineDark}`, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>{children}</div>;
function EmptyState() { return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, color: T.muted, textAlign: "center" }}><div style={{ width: 64, height: 64, background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><Ico d={IC.server} size={32} color={T.sub} /></div><div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Ready to create</div><div style={{ fontSize: 14, maxWidth: 360 }}>Upload the product photo, fill the brief and hit <strong>Generate Storyboard</strong>. Then just <strong>Render Video</strong>.</div></div>; }

function Storyboard({ preview, streaming, editable, onChange }) {
  const [edit, setEdit] = useState(false);
  const [active, setActive] = useState(0);
  const renumber = (arr) => arr.map((s, i) => ({ ...s, n: i + 1 }));
  const setScenes = (scenes) => onChange({ ...preview, scenes });
  const updScene = (i, patch) => setScenes(preview.scenes.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const move = (i, d) => { const a = [...preview.scenes]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setScenes(renumber(a)); };
  const del = (i) => setScenes(renumber(preview.scenes.filter((_, idx) => idx !== i)));
  const add = () => setScenes(renumber([...(preview.scenes || []), { n: 0, dur: 5, keyframe: "", motion: "", narracao: "", legenda: "" }]));

  const eInput = (val, on) => <input value={val} onChange={e => on(e.target.value)} style={{ width: "100%", padding: "6px 10px", border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 13, color: T.ink, outline: "none", boxSizing: "border-box" }} />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1, flex: 1 }}>Generated storyboard</div>
        {streaming && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: T.sub }}><Spinner size={12} /> thinking…</span>}
        {editable && !streaming && <Btn onClick={() => setEdit(e => !e)} style={{ height: 32, fontSize: 12 }}><Ico d={edit ? IC.check : IC.settings} size={14} /> {edit ? "Done" : "Edit"}</Btn>}
      </div>

      {edit ? <div style={{ marginBottom: 16, display: "grid", gap: 8 }}><div><Label>Title</Label>{eInput(preview.title, v => onChange({ ...preview, title: v }))}</div><div><Label>Hook</Label>{eInput(preview.hook, v => onChange({ ...preview, hook: v }))}</div><div><Label>CTA</Label>{eInput(preview.cta, v => onChange({ ...preview, cta: v }))}</div></div>
        : <><div style={{ fontSize: 26, fontWeight: 800, color: T.ink, marginBottom: 8 }}>{preview.title}{streaming && !preview.title ? <span className="blink">▍</span> : null}</div>{preview.hook && <div style={{ fontSize: 14, marginBottom: 4 }}><strong>Hook:</strong> {preview.hook}</div>}{preview.cta && <div style={{ fontSize: 14, marginBottom: 24 }}><strong>CTA:</strong> {preview.cta}</div>}</>}

      {(preview.scenes || []).length > 0 && <Timeline scenes={preview.scenes} active={active} onSelect={setActive} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{(preview.scenes || []).map((s, i) => (
        <div key={i} id={`scene-${i}`} onClick={() => setActive(i)} className="pop" style={{ background: T.bg2, border: `1px solid ${active === i ? T.ink : T.line}`, borderRadius: 12, padding: 18, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, flex: 1 }}>Scene {s.n} <span style={{ color: T.sub, fontWeight: 500 }}>({s.dur}s)</span></div>
            {edit && <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => move(i, -1)} title="Move up" style={miniBtn}><Ico d={IC.chevronDown} size={14} style={{ transform: "rotate(180deg)" }} /></button>
              <button onClick={() => move(i, 1)} title="Move down" style={miniBtn}><Ico d={IC.chevronDown} size={14} /></button>
              <button onClick={() => del(i)} title="Delete" style={miniBtn}><Ico d={IC.x} size={14} /></button>
            </div>}
          </div>
          {edit ? <div style={{ display: "grid", gap: 8 }}>
            <div><Label>Visual prompt</Label>{eInput(s.keyframe, v => updScene(i, { keyframe: v }))}</div>
            <div><Label>Motion prompt</Label>{eInput(s.motion, v => updScene(i, { motion: v }))}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8 }}><div><Label>Narration</Label>{eInput(s.narracao || "", v => updScene(i, { narracao: v }))}</div><div><Label>Secs</Label><input type="number" value={s.dur} onChange={e => updScene(i, { dur: parseInt(e.target.value) || 1 })} style={{ width: "100%", padding: "6px 10px", border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} /></div></div>
          </div> : <>
            <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}><strong>Visual:</strong> {s.keyframe}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}><strong>Motion:</strong> {s.motion}</div>
            {s.narracao && <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}><strong>Narration:</strong> "{s.narracao}"</div>}
          </>}
        </div>))}
        {streaming && <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.muted, fontSize: 13, padding: 8 }}><Spinner size={14} /> writing next scene…</div>}
        {edit && <Btn onClick={add} style={{ height: 38 }}><Ico d={IC.plus} size={15} /> Add scene</Btn>}
      </div>
      {preview.audio?.hashtags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 20 }}>{preview.audio.hashtags.map((h, i) => <Badge key={i}>{h}</Badge>)}</div>}
    </div>
  );
}
const miniBtn = { width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.lineDark}`, background: T.bg, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.sub };

// Timeline visual: cada cena vira um bloco proporcional à duração; clicar seleciona.
function Timeline({ scenes, active, onSelect }) {
  const total = scenes.reduce((s, x) => s + (x.dur || 0), 0) || 1;
  return (
    <div style={{ margin: "4px 0 22px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <Label style={{ margin: 0 }}>Timeline</Label>
        <span style={{ marginLeft: "auto", fontSize: 11, color: T.muted, fontWeight: 600 }}>{total}s total</span>
      </div>
      <div style={{ display: "flex", gap: 4, height: 44 }}>
        {scenes.map((s, i) => (
          <div key={i} onClick={() => { onSelect(i); document.getElementById(`scene-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} title={`Scene ${s.n} · ${s.dur}s`}
            style={{ flex: `${s.dur || 1} 1 0`, minWidth: 36, borderRadius: 8, cursor: "pointer", border: `1px solid ${active === i ? T.ink : T.lineDark}`, background: active === i ? T.ink : T.bg2, color: active === i ? "#fff" : T.sub, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all .15s", overflow: "hidden" }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{s.n}</span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>{s.dur}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressView({ job }) {
  const done = job.status === "done";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>{done ? <Ico d={IC.check} size={20} color={T.ink} /> : <Spinner size={20} />}<div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{done ? "Video ready" : "Rendering…"}</div><div style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: T.sub }}>{job.progress || 0}%</div></div>
      <div style={{ height: 8, background: T.line, borderRadius: 99, overflow: "hidden", marginBottom: 10 }}><div className="bar" style={{ width: `${job.progress || 0}%`, height: "100%", background: T.ink, borderRadius: 99 }} /></div>
      <div style={{ fontSize: 13, color: T.sub }}>{job.step || "Queued…"}</div>
    </div>
  );
}

function SceneCard({ scene, onRegen, regening, canRegen }) {
  return (
    <div className="card-hover" style={{ background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ aspectRatio: "9/16", background: T.bg3, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {scene.clip_url ? <video src={scene.clip_url} muted loop playsInline onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : scene.keyframe_url ? <img src={scene.keyframe_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Spinner />}
        <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Scene {scene.idx}</div>
      </div>
      <div style={{ padding: 10 }}><div style={{ fontSize: 11, color: T.sub, marginBottom: 8, height: 32, overflow: "hidden" }}>{scene.caption || scene.keyframe_prompt}</div><Btn block disabled={!canRegen || regening} onClick={onRegen} style={{ height: 32, fontSize: 12 }}>{regening ? <><Spinner size={12} /> Regenerating…</> : <><Ico d={IC.refresh} size={13} /> Regenerate</>}</Btn></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW 2: Projects
// ═══════════════════════════════════════════════════════════════
function ProjectsView() {
  const ui = useUI(); const [projects, setProjects] = useState(null); const [folder, setFolder] = useState("all");
  const load = () => api("/projects").then(r => r.json()).then(setProjects).catch(() => setProjects([]));
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, []);
  const move = async (id, folderId) => { await api(`/projects/${id}/folder`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId }) }); ui.notify(folderId ? "Moved to folder" : "Removed from folder"); load(); };
  const shown = (projects || []).filter(p => folder === "all" ? true : folder === "none" ? !p.folderId : p.folderId === folder);
  const chip = (key, label, count, deletable) => (
    <div key={key} onClick={() => setFolder(key)} className="nav-item" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: folder === key ? T.ink : T.bg, color: folder === key ? "#fff" : T.sub, border: `1px solid ${folder === key ? T.ink : T.lineDark}`, borderRadius: 99, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
      <Ico d={IC.folder} size={14} color={folder === key ? "#fff" : T.sub} /><span>{label}</span>{count != null && <span style={{ opacity: 0.6 }}>{count}</span>}
      {deletable && <button onClick={(e) => { e.stopPropagation(); ui.removeFolder(key); if (folder === key) setFolder("all"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex" }}><Ico d={IC.x} size={12} color={folder === key ? "#fff" : T.muted} /></button>}
    </div>
  );
  return (
    <div style={{ flex: 1, padding: 40, overflowY: "auto", zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><div><div style={{ fontSize: 24, fontWeight: 800, color: T.ink }}>Projects</div><div style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>Your ads and folders.</div></div><div style={{ display: "flex", gap: 10 }}><Btn onClick={() => ui.openModal("folder")}><Ico d={IC.folderPlus} size={16} /> New folder</Btn><Btn primary onClick={() => ui.setActiveView("studio")}><Ico d={IC.plus} size={16} color={T.bg} /> New project</Btn></div></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {chip("all", "All", (projects || []).length)}
          {chip("none", "Unfiled", (projects || []).filter(p => !p.folderId).length)}
          {ui.folders.map(fl => chip(fl.id, fl.name, (projects || []).filter(p => p.folderId === fl.id).length, true))}
        </div>
        {projects === null && <Spinner />}
        {projects && shown.length === 0 && <div style={{ color: T.sub }}>No projects here yet. Create one in the Animation Studio.</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
          {shown.map(p => (
            <div key={p.id} className="card-hover" style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ height: 150, background: T.bg3, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.outputUrl ? <video src={`${p.outputUrl}#t=0.5`} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Ico d={IC.film} size={40} color={T.muted} />}</div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ fontSize: 14, fontWeight: 700, color: T.ink, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div><StatusBadge status={p.status} /></div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.product}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{timeAgo(p.createdAt)}</div>
                <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center" }}>
                  {p.outputUrl && <ShareMenu url={p.outputUrl} />}
                  <Menu width={200} trigger={<Btn style={{ height: 32, fontSize: 12 }}><Ico d={IC.folder} size={13} /> Folder</Btn>}>
                    {close => <div>
                      <MenuItem icon={IC.x} label="No folder" onClick={() => { move(p.id, null); close(); }} />
                      {ui.folders.map(fl => <MenuItem key={fl.id} icon={IC.folder} label={fl.name} onClick={() => { move(p.id, fl.id); close(); }} />)}
                    </div>}
                  </Menu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function StatusBadge({ status }) {
  if (status === "done") return <Badge color={T.ink} style={{ background: T.bg2, borderColor: T.lineDark, fontWeight: 700 }}>Ready</Badge>;
  if (status === "error") return <Badge color={T.ink} style={{ borderColor: T.lineDark }}>Error</Badge>;
  if (status === "running" || status === "composing") return <Badge color={T.sub}>Rendering…</Badge>;
  return <Badge color={T.sub}>{status}</Badge>;
}

// ═══════════════════════════════════════════════════════════════
// VIEW 3: Render Queue
// ═══════════════════════════════════════════════════════════════
function RenderQueue() {
  const ui = useUI(); const [jobs, setJobs] = useState(null);
  const load = () => api("/jobs").then(r => r.json()).then(setJobs).catch(() => setJobs([]));
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, []);
  return (
    <div style={{ flex: 1, padding: 40, overflowY: "auto", zIndex: 1 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}><div><div style={{ fontSize: 24, fontWeight: 800, color: T.ink }}>Render Queue</div><div style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>Monitor your video generation jobs.</div></div><Btn primary onClick={() => ui.setActiveView("studio")}><Ico d={IC.sparkles} size={16} color={T.bg} /> New render</Btn></div>
        <div style={{ background: T.bg, border: `1px solid ${T.lineDark}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead><tr style={{ background: T.bg2, borderBottom: `1px solid ${T.lineDark}` }}><th style={th}>Project</th><th style={th}>Model</th><th style={th}>Status</th><th style={th}>Progress</th><th style={{ ...th, textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {jobs === null && <tr><td colSpan={5} style={{ padding: 40, textAlign: "center" }}><Spinner /></td></tr>}
              {jobs?.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: T.sub }}>No renders yet.</td></tr>}
              {jobs?.map((j, i) => (
                <tr key={j.id} style={{ borderBottom: i === jobs.length - 1 ? "none" : `1px solid ${T.line}` }}>
                  <td style={{ padding: "18px 24px" }}><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{j.project}</div><div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{j.id.slice(0, 8)} • {timeAgo(j.createdAt)}</div></td>
                  <td style={{ padding: "18px 24px" }}><Badge>{j.model}</Badge></td>
                  <td style={{ padding: "18px 24px" }}><StatusBadge status={j.status} /></td>
                  <td style={{ padding: "18px 24px", width: 200 }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ flex: 1, height: 6, background: T.line, borderRadius: 99, overflow: "hidden" }}><div className="bar" style={{ width: `${j.progress}%`, height: "100%", background: T.ink, borderRadius: 99 }} /></div><div style={{ fontSize: 12, fontWeight: 600, color: T.sub, width: 35 }}>{j.progress}%</div></div></td>
                  <td style={{ padding: "18px 24px", textAlign: "right" }}>{j.outputUrl ? <div style={{ display: "inline-flex", gap: 6 }}><a href={j.outputUrl} target="_blank" rel="noreferrer"><Btn style={{ height: 32, fontSize: 12 }}><Ico d={IC.download} size={14} /> Open</Btn></a><IconBtn size={15} icon={IC.star} active={ui.favs.has(j.id)} color={ui.favs.has(j.id) ? T.ink : undefined} onClick={() => ui.toggleFav(j.id)} /></div> : <span style={{ color: T.muted }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const th = { padding: "16px 24px", fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase" };
function timeAgo(iso) { if (!iso) return "now"; const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return "now"; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`; return `${Math.floor(s / 86400)} d ago`; }

// ═══════════════════════════════════════════════════════════════
// VIEW 4: Assets Library
// ═══════════════════════════════════════════════════════════════
function AssetsLibrary() {
  const ui = useUI(); const [tab, setTab] = useState("all"); const [view, setView] = useState("grid"); const [videos, setVideos] = useState(null);
  useEffect(() => { api("/jobs").then(r => r.json()).then(j => setVideos((j || []).filter(x => x.outputUrl).map(x => ({ id: x.id, name: `${x.project}.mp4`, url: x.outputUrl, type: "video", createdAt: x.createdAt })))).catch(() => setVideos([])); }, []);
  const all = videos || [];
  const filtered = tab === "favorites" ? all.filter(a => ui.favs.has(a.id)) : (tab === "all" || tab === "videos") ? all : [];
  const emptyMsg = tab === "images" ? "Key images appear here once the real pipeline generates keyframes." : tab === "audio" ? "Voiceovers appear here once ElevenLabs is connected." : "No assets yet. Generate a video in the Studio.";
  const tabs = [["all", "All"], ["images", "Images"], ["videos", "Videos"], ["audio", "Audio"], ["favorites", "Favorites"]];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
      <div style={{ padding: "24px 40px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", alignItems: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: T.ink }}>Assets Library</div><div style={{ marginLeft: "auto", display: "flex", gap: 6 }}><IconBtn icon={IC.grid} active={view === "grid"} onClick={() => setView("grid")} /><IconBtn icon={IC.layer} active={view === "list"} onClick={() => setView("list")} /></div></div>
        <div style={{ display: "flex", gap: 6, marginTop: 20 }}>{tabs.map(([k, lbl]) => <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", borderRadius: 99, border: `1px solid ${tab === k ? T.ink : T.line}`, background: tab === k ? T.ink : T.bg, color: tab === k ? "#fff" : T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>{lbl}</button>)}</div>
      </div>
      <div style={{ flex: 1, padding: 40, overflowY: "auto" }}>
        {videos === null && <Spinner />}
        {videos && filtered.length === 0 && <div style={{ color: T.sub }}>{emptyMsg}</div>}
        <div style={{ display: "grid", gridTemplateColumns: view === "grid" ? "repeat(auto-fill, minmax(220px, 1fr))" : "1fr", gap: 20 }}>
          {filtered.map(a => (
            <div key={a.id} className="card-hover" style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 12, overflow: "hidden", display: view === "list" ? "flex" : "block" }}>
              <video src={`${a.url}#t=0.5`} muted preload="metadata" style={{ width: view === "list" ? 160 : "100%", height: 150, objectFit: "cover", background: T.bg3, flexShrink: 0 }} />
              <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ fontSize: 13, fontWeight: 700, color: T.ink, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div><IconBtn size={15} icon={IC.star} active={ui.favs.has(a.id)} color={ui.favs.has(a.id) ? T.ink : undefined} onClick={() => ui.toggleFav(a.id)} /></div><div style={{ fontSize: 11, color: T.sub, marginTop: 4, textTransform: "uppercase" }}>{a.type} • {timeAgo(a.createdAt)}</div><div style={{ marginTop: 12, display: "flex", gap: 6 }}><a href={a.url} target="_blank" rel="noreferrer"><Btn style={{ height: 32, fontSize: 12 }}><Ico d={IC.download} size={14} /> Open</Btn></a><ShareMenu url={a.url} /></div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW 5: Tools (micro-tools) — Animate Image
// ═══════════════════════════════════════════════════════════════
function ToolsView() {
  const ui = useUI();
  const [photo, setPhoto] = useState(null); const [prompt, setPrompt] = useState(""); const [model, setModel] = useState("seedance-2.0"); const [format, setFormat] = useState("9:16"); const [dur, setDur] = useState(5);
  const [busy, setBusy] = useState(false); const [out, setOut] = useState(null); const fileRef = useRef(null); const vidRef = useRef(null);
  const onPick = async (file) => { if (!file) return; setPhoto(await fileToData(file)); };
  const animate = async () => {
    if (!photo) { alert("Upload an image first."); return; }
    setBusy(true); setOut(null);
    try {
      const res = await api("/tools/animate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "local-user", photo: { mediaType: photo.mediaType, base64: photo.base64 }, prompt: prompt || "subtle cinematic camera move", videoModel: model, format, durationSec: dur }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setOut(await res.json()); ui.reloadMe();
    } catch (e) { ui.notify("Failed: " + e.message); }
    setBusy(false);
  };
  return (
    <div style={{ flex: 1, padding: 40, overflowY: "auto", zIndex: 1 }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.ink }}>Tools</div>
        <div style={{ fontSize: 14, color: T.sub, marginTop: 4, marginBottom: 24 }}>Micro-tools that run a single step of the engine.</div>
        <CanvasCard>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}><Ico d={IC.wand} size={20} color={T.ink} /><div><div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Animate Image</div><div style={{ fontSize: 12, color: T.sub }}>Turn a single image into a short clip (image-to-video).</div></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <Label>Source image</Label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onPick(e.target.files?.[0])} />
              {!photo ? <div onClick={() => fileRef.current?.click()} style={{ border: `1px dashed ${T.lineDark}`, borderRadius: 12, padding: "40px 16px", textAlign: "center", background: T.bg2, cursor: "pointer" }}><Ico d={IC.image} size={24} color={T.muted} style={{ marginBottom: 8 }} /><div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Click to upload</div></div>
                : <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.line}` }}><img src={photo.dataUrl} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} /><button onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer" }}><Ico d={IC.x} size={14} color="#fff" /></button></div>}
              <div style={{ marginTop: 16 }}><Label>Motion prompt</Label><TextArea value={prompt} onChange={e => setPrompt(e.target.value)} style={{ height: 70 }} placeholder="e.g. slow push-in, particles drifting" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}><div><Label>Model</Label><Select value={model} onChange={e => setModel(e.target.value)} options={VIDEO_MODELS} /></div><div><Label>Format</Label><Select value={format} onChange={e => setFormat(e.target.value)} options={FORMATS} /></div></div>
              <div style={{ marginTop: 16 }}><Label>Duration</Label><Select value={dur} onChange={e => setDur(parseInt(e.target.value))} options={[{ val: 5, label: "5 seconds" }, { val: 10, label: "10 seconds" }]} /></div>
              <Btn primary block onClick={animate} disabled={busy} style={{ marginTop: 20, height: 44 }}>{busy ? <><Spinner light /> Animating…</> : <><Ico d={IC.wand} size={16} color={T.bg} /> Animate · {dur} credits</>}</Btn>
            </div>
            <div>
              <Label>Result</Label>
              <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, background: T.bg3, minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {busy ? <Spinner size={32} /> : out ? <video ref={vidRef} src={out.url} crossOrigin="anonymous" controls style={{ width: "100%", maxHeight: 360 }} /> : <div style={{ color: T.muted, fontSize: 13 }}>Your clip appears here</div>}
              </div>
              {out && <div style={{ marginTop: 16 }}><VideoActions url={out.url} id={`tool-${out.url}`} videoRef={vidRef} /></div>}
            </div>
          </div>
        </CanvasCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW: Team / collaboration
// ═══════════════════════════════════════════════════════════════
function TeamView() {
  const ui = useUI(); const [members, setMembers] = useState(null); const [email, setEmail] = useState(""); const [role, setRole] = useState("editor");
  const load = () => api("/team?userId=local-user").then(r => r.json()).then(setMembers).catch(() => setMembers([]));
  useEffect(() => { load(); }, []);
  const invite = async () => { if (!email.includes("@")) { ui.notify("Enter a valid email"); return; } await api("/team/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "local-user", email, role }) }); setEmail(""); ui.notify("Invitation sent"); load(); };
  const setMemberRole = async (id, r) => { await api(`/team/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: r }) }); load(); };
  const remove = async (id) => { await api(`/team/${id}`, { method: "DELETE" }); load(); };
  const ROLES = ["owner", "editor", "viewer"];
  return (
    <div style={{ flex: 1, padding: 40, overflowY: "auto", zIndex: 1 }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.ink }}>Team</div>
        <div style={{ fontSize: 14, color: T.sub, marginTop: 4, marginBottom: 24 }}>Invite teammates to collaborate on your animated ads.</div>
        <div style={{ background: T.bg, border: `1px solid ${T.lineDark}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Label>Invite by email</Label>
          <div style={{ display: "flex", gap: 10 }}>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@company.com" style={{ flex: 1 }} />
            <Select value={role} onChange={e => setRole(e.target.value)} options={ROLES.filter(r => r !== "owner").map(r => ({ val: r, label: r[0].toUpperCase() + r.slice(1) }))} style={{ width: 130 }} />
            <Btn primary onClick={invite}><Ico d={IC.plus} size={15} color={T.bg} /> Invite</Btn>
          </div>
        </div>
        <div style={{ background: T.bg, border: `1px solid ${T.lineDark}`, borderRadius: 16, overflow: "hidden" }}>
          {members === null && <div style={{ padding: 30, textAlign: "center" }}><Spinner /></div>}
          {members?.map((m, i) => (
            <div key={m.id} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, borderBottom: i === members.length - 1 ? "none" : `1px solid ${T.line}` }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{(m.email[0] || "?").toUpperCase()}</div>
              <div style={{ flex: 1, overflow: "hidden" }}><div style={{ fontSize: 14, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</div><div style={{ fontSize: 11, color: T.muted }}>joined {timeAgo(m.created_at)}</div></div>
              {m.role === "owner" ? <Badge color={T.ink} style={{ borderColor: T.lineDark, fontWeight: 700 }}>Owner</Badge> : <>
                <Select value={m.role} onChange={e => setMemberRole(m.id, e.target.value)} options={ROLES.filter(r => r !== "owner").map(r => ({ val: r, label: r[0].toUpperCase() + r.slice(1) }))} style={{ width: 120 }} />
                <IconBtn size={15} icon={IC.x} title="Remove" onClick={() => remove(m.id)} />
              </>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW 6: Settings (Account/Billing + Developer/API)
// ═══════════════════════════════════════════════════════════════
function SettingsView() {
  const ui = useUI(); const { health, me } = ui; const [tab, setTab] = useState("account");
  const rows = [
    { k: "anthropic", label: "Anthropic (Claude)", desc: "Script, scenes and prompts.", env: "ANTHROPIC_API_KEY" },
    { k: "fal", label: "fal.ai (FLUX / Seedance / Kling)", desc: "Image and video generation.", env: "FAL_KEY" },
    { k: "elevenlabs", label: "ElevenLabs", desc: "Voiceover + captions.", env: "ELEVENLABS_API_KEY" },
    { k: "supabase", label: "Supabase", desc: "Database (fallback: in-memory).", env: "SUPABASE_URL / SUPABASE_SERVICE_KEY" },
    { k: "r2", label: "Cloudflare R2", desc: "Final video storage.", env: "R2_*" },
    { k: "stripe", label: "Stripe", desc: "Billing & credits.", env: "STRIPE_SECRET_KEY" },
  ];
  const credits = me?.credits ?? 0; const cap = 300; const used = Math.max(0, cap - credits);
  return (
    <div style={{ flex: 1, padding: 40, overflowY: "auto", zIndex: 1 }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 20 }}>Settings & Integrations</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[["account", "Account & Billing"], ["developer", "Developer & API"]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", borderRadius: 99, border: `1px solid ${tab === k ? T.ink : T.line}`, background: tab === k ? T.ink : T.bg, color: tab === k ? "#fff" : T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>{l}</button>)}
        </div>

        {tab === "account" ? (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: T.bg, border: `1px solid ${T.lineDark}`, borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.ink, flex: 1 }}>Plan & Credits</div><Badge color={T.ink} style={{ borderColor: T.lineDark, fontWeight: 700 }}>{me?.plan || "—"}</Badge></div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 28, fontWeight: 800, color: T.ink }}>{credits}</span><span style={{ fontSize: 13, color: T.sub }}>credits remaining</span></div>
              <div style={{ height: 8, background: T.line, borderRadius: 99, overflow: "hidden", marginBottom: 8 }}><div className="bar" style={{ width: `${Math.min(100, used / cap * 100)}%`, height: "100%", background: T.ink, borderRadius: 99 }} /></div>
              <div style={{ fontSize: 12, color: T.sub }}>{used} of {cap} credits used this period · 1 credit ≈ 1 second of video</div>
              <div style={{ marginTop: 20, display: "flex", gap: 10 }}><Btn primary onClick={() => ui.openModal("upgrade")}><Ico d={IC.sparkles} size={15} color={T.bg} /> Upgrade plan</Btn><Btn onClick={() => ui.openModal("upgrade")}>Buy credits</Btn></div>
            </div>
            <div style={{ background: T.bg, border: `1px solid ${T.lineDark}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Account</div>
              <div style={{ fontSize: 13, color: T.sub }}>Signed in as <strong>{me?.email || "local-user"}</strong>.</div>
              <div style={{ marginTop: 16, display: "flex", gap: 10 }}><Btn onClick={() => ui.openModal("language")}><Ico d={IC.globe} size={15} /> {ui.lang}</Btn><Btn onClick={() => ui.notify("Signed out (demo)")}><Ico d={IC.logout} size={15} /> Sign out</Btn></div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 14, color: T.sub, marginBottom: 20 }}>API keys live in the backend <code>.env</code>. As you fill each one, that step starts using the real service automatically.</div>
            <div style={{ background: T.bg, border: `1px solid ${T.lineDark}`, borderRadius: 16, overflow: "hidden" }}>
              {rows.map((r, i) => { const on = health?.[r.k]; return (
                <div key={r.k} style={{ padding: 24, display: "flex", alignItems: "center", gap: 16, borderBottom: i === rows.length - 1 ? "none" : `1px solid ${T.line}` }}><Ico d={IC.key} size={20} color={T.sub} /><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{r.label}</div><div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{r.desc} <code style={{ color: T.muted }}>{r.env}</code></div></div><Badge color={on ? T.ink : T.sub} style={{ background: T.bg2, border: `1px solid ${on ? T.lineDark : T.line}`, fontWeight: on ? 700 : 600 }}>{on ? "Connected" : "Not configured"}</Badge></div>
              ); })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Modals
// ═══════════════════════════════════════════════════════════════
function FolderModal({ onClose }) {
  const ui = useUI(); const [name, setName] = useState("");
  return <Modal title="New folder" onClose={onClose} width={420}><Label>Folder name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Black Friday Campaigns" autoFocus /><div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}><Btn onClick={onClose}>Cancel</Btn><Btn primary onClick={() => { if (name.trim()) { ui.addFolder(name.trim()); ui.notify("Folder created"); onClose(); } }}>Create</Btn></div></Modal>;
}

function UpgradeModal({ onClose }) {
  const ui = useUI(); const [loading, setLoading] = useState("");
  const plans = [
    { id: "starter", name: "Starter", price: "$29", per: "/mo", feats: ["5 videos / month", "Budget models", "720p / 1080p"], hot: false },
    { id: "pro", name: "Pro", price: "$99", per: "/mo", feats: ["30 videos / month", "All models", "1080p + native audio", "Regenerate scenes"], hot: true },
    { id: "enterprise", name: "Enterprise", price: "Custom", per: "", feats: ["Custom volume", "Dedicated API", "Priority support"], hot: false },
  ];
  const checkout = async (plan) => {
    if (plan === "enterprise") { window.open("mailto:sales@absolutemotion.ai", "_blank"); return; }
    setLoading(plan);
    try { const r = await api("/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) }).then(x => x.json()); if (r.url) window.location.href = r.url; else ui.notify(r.message || "Checkout coming soon"); }
    catch { ui.notify("Checkout unavailable"); }
    setLoading("");
  };
  return <Modal title="Plans & Credits" onClose={onClose} width={760}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      {plans.map(p => (
        <div key={p.id} style={{ border: `1px solid ${p.hot ? T.ink : T.lineDark}`, borderRadius: 14, padding: 20, position: "relative", boxShadow: p.hot ? "0 8px 24px rgba(0,0,0,0.06)" : "none" }}>
          {p.hot && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase" }}>Popular</div>}
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{p.name}</div>
          <div style={{ margin: "8px 0 16px" }}><span style={{ fontSize: 26, fontWeight: 800, color: T.ink }}>{p.price}</span><span style={{ fontSize: 13, color: T.sub }}>{p.per}</span></div>
          <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>{p.feats.map((ft, i) => <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: T.text }}><Ico d={IC.check} size={16} color={T.ink} /> {ft}</div>)}</div>
          <Btn primary={p.hot} block disabled={loading === p.id} onClick={() => checkout(p.id)}>{loading === p.id ? <Spinner light={p.hot} /> : "Choose"}</Btn>
        </div>
      ))}
    </div>
    <div style={{ fontSize: 12, color: T.muted, marginTop: 16, textAlign: "center" }}>Secure payments via Stripe. Current credits: <strong>{ui.me?.credits ?? "—"}</strong> (1 credit ≈ 1s of video).</div>
  </Modal>;
}

function QuickStartModal({ onClose }) {
  const steps = [
    { t: "Upload the product photo", d: "In the Animation Studio, upload an image (optional, but improves fidelity)." },
    { t: "Describe the product", d: "Name, benefits, style, format and duration. Use 'More options' for audience, tone and voice." },
    { t: "Generate Storyboard", d: "The engine streams the script and scenes live. Review before rendering." },
    { t: "Render Video", d: "Watch the progress and download the .mp4 ready for Meta/TikTok Ads." },
    { t: "Fine-tune", d: "Regenerate a specific scene or create variations without redoing everything." },
  ];
  return <Modal title="Quick Start" onClose={onClose} width={520}><div style={{ display: "grid", gap: 14 }}>{steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 12 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: T.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div><div><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{s.t}</div><div style={{ fontSize: 13, color: T.sub, marginTop: 2, lineHeight: 1.5 }}>{s.d}</div></div></div>)}</div><Btn primary block onClick={onClose} style={{ marginTop: 24 }}>Got it, let's start</Btn></Modal>;
}

function AppsModal({ onClose }) {
  const apps = [{ n: "iOS", i: IC.phone }, { n: "Android", i: IC.phone }, { n: "macOS", i: IC.grid }, { n: "Windows", i: IC.grid }];
  return <Modal title="Download the app" onClose={onClose} width={480}><div style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>Create and manage your ads anywhere.</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{apps.map(a => <div key={a.n} style={{ border: `1px solid ${T.lineDark}`, borderRadius: 12, padding: "18px 16px", display: "flex", alignItems: "center", gap: 12 }}><Ico d={a.i} size={22} color={T.ink} /><div><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{a.n}</div><div style={{ fontSize: 11, color: T.muted }}>Coming soon</div></div></div>)}</div></Modal>;
}

function LanguageModal({ onClose }) {
  const ui = useUI();
  return <Modal title="Switch Language" onClose={onClose} width={420}><div style={{ display: "grid", gap: 6 }}>{LANGS.map(l => <div key={l} onClick={() => { ui.setLang(l); onClose(); }} className="nav-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, cursor: "pointer", border: `1px solid ${ui.lang === l ? T.ink : T.line}` }} onMouseOver={e => e.currentTarget.style.background = T.bg2} onMouseOut={e => e.currentTarget.style.background = "transparent"}><Ico d={IC.globe} size={16} color={T.sub} /><span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.ink }}>{l}</span>{ui.lang === l && <Ico d={IC.check} size={16} color={T.ink} />}</div>)}</div></Modal>;
}

function PoliciesModal({ onClose }) {
  const items = ["Terms of Use", "Privacy Policy", "Cookie Policy", "Refund Policy", "License Agreement"];
  return <Modal title="Policies & Agreements" onClose={onClose} width={460}><div style={{ display: "grid", gap: 4 }}>{items.map(t => <div key={t} className="nav-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, cursor: "pointer" }} onMouseOver={e => e.currentTarget.style.background = T.bg2} onMouseOut={e => e.currentTarget.style.background = "transparent"}><Ico d={IC.shield} size={16} color={T.sub} /><span style={{ flex: 1, fontSize: 14, color: T.ink }}>{t}</span><Ico d={IC.external} size={14} color={T.muted} /></div>)}</div></Modal>;
}
