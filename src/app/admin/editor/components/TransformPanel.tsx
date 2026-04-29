import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "../engine/useEditorStore";

const ACCENT  = "#FF7A00";
const BLUE    = "#0F3460";

const ASPECTS = [
  { label:"1:1",  w:1,   h:1   },
  { label:"4:5",  w:4,   h:5   },
  { label:"16:9", w:16,  h:9   },
  { label:"9:16", w:9,   h:16  },
  { label:"3:2",  w:3,   h:2   },
  { label:"○",   w:0,   h:0   },
];

const ROTATE_PRESETS = [
  { label:"↻ 90°",  deg:90  },
  { label:"↺ -90°", deg:-90 },
  { label:"⟺ H",   flip:"h" as const },
  { label:"⟷ V",   flip:"v" as const },
];

const BG_COLORS: { label: string; color: string }[] = [
  { label:"Blanco",      color:"#FFFFFF" },
  { label:"Negro",       color:"#000000" },
  { label:"Gris",        color:"#808080" },
  { label:"Transparente",color:"transparent" },
  { label:"Azul",        color:"#0F3460" },
  { label:"Naranja",     color:"#FF7A00" },
];

export default function TransformPanel() {
  const store = useEditorStore();
  const { rotation, fineRotation, set, saveHistory } = store;
  const [activePreset, setActivePreset]   = useState<string|null>(null);
  const [activeAspect, setActiveAspect]   = useState<string|null>(null);
  const [activeBg, setActiveBg]           = useState<string|null>(null);
  const [activeTool, setActiveTool]       = useState<string|null>(null);
  const dialRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lastAngle = useRef(0);

  const rotate = (deg: number) => {
    const next = (rotation + deg + 360) % 360;
    set("rotation", next);
    saveHistory(`Rotar ${deg > 0 ? "+" : ""}${deg}°`);
  };

  const flip = (axis: "h"|"v") => {
    if (axis === "h") { set("flipH", !useEditorStore.getState().flipH); saveHistory("Flip H"); }
    else              { set("flipV", !useEditorStore.getState().flipV); saveHistory("Flip V"); }
  };

  // Dial de rotación libre — drag sobre SVG
  const getAngleFromEvent = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = dialRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    return Math.round(Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI);
  };

  const onDialMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    dragging.current = true;
    lastAngle.current = getAngleFromEvent(e);
  };

  const onDialMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const angle = getAngleFromEvent(e);
    const delta = angle - lastAngle.current;
    lastAngle.current = angle;
    const next = Math.max(-45, Math.min(45, fineRotation + delta));
    set("fineRotation", next);
  }, [fineRotation, set]);

  const onDialMouseUp = () => {
    if (dragging.current) { dragging.current = false; saveHistory(`Ángulo: ${fineRotation}°`); }
  };

  // Calcular posición del punto en el dial
  const dialAngle = (fineRotation / 45) * 135; // -135 a +135 grados en el arco
  const dialRad   = (dialAngle - 90) * Math.PI / 180;
  const dialR     = 32;
  const dotX      = 40 + dialR * Math.cos(dialRad);
  const dotY      = 40 + dialR * Math.sin(dialRad);

  const sectionTitle = (t: string) => (
    <div style={{ fontSize:"10px", fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".08em", marginBottom:"6px" }}>{t}</div>
  );

  const toolBtn = (id: string, icon: string, title: string) => (
    <button
      key={id}
      title={title}
      onClick={() => setActiveTool(activeTool === id ? null : id)}
      style={{
        width:"32px", height:"32px", display:"flex", alignItems:"center", justifyContent:"center",
        border:`1.5px solid ${activeTool === id ? ACCENT : "#E5E7EB"}`,
        borderRadius:"7px", background: activeTool === id ? "rgba(255,122,0,.08)" : "#fff",
        color: activeTool === id ? ACCENT : "#6B7280",
        fontSize:"14px", cursor:"pointer"
      }}
    >{icon}</button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>

      {/* Rotación rápida — 4 presets en una línea */}
      <div style={{ padding:"10px 12px", borderBottom:`1px solid #F3F4F6` }}>
        {sectionTitle("Rotación")}
        <div style={{ display:"flex", gap:"4px" }}>
          {ROTATE_PRESETS.map(p => {
            const key = "flip" in p ? `flip-${p.flip}` : `rot-${p.deg}`;
            const active = activePreset === key;
            return (
              <button key={key}
                onClick={() => {
                  setActivePreset(active ? null : key);
                  if ("flip" in p) flip(p.flip);
                  else rotate(p.deg);
                }}
                style={{
                  flex:1, padding:"5px 2px", fontSize:"10px", cursor:"pointer",
                  border:`1.5px solid ${active ? ACCENT : "#E5E7EB"}`,
                  borderRadius:"7px",
                  background: active ? "rgba(255,122,0,.08)" : "#fff",
                  color: active ? ACCENT : "#6B7280",
                  fontWeight: active ? 600 : 400,
                  whiteSpace:"nowrap"
                }}
              >{p.label}</button>
            );
          })}
        </div>
      </div>

      {/* Dial de ángulo libre */}
      <div style={{ padding:"10px 12px", borderBottom:`1px solid #F3F4F6`, display:"flex", alignItems:"center", gap:"12px" }}>
        <svg
          ref={dialRef}
          width="80" height="80" viewBox="0 0 80 80"
          style={{ cursor:"grab", flexShrink:0 }}
          onMouseDown={onDialMouseDown}
          onMouseMove={onDialMouseMove}
          onMouseUp={onDialMouseUp}
          onMouseLeave={onDialMouseUp}
        >
          {/* Arco de fondo */}
          <path d="M 8 40 A 32 32 0 1 1 72 40" fill="none" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round"/>
          {/* Arco naranja proporcional */}
          <path
            d={`M ${40 + dialR * Math.cos((-135-90)*Math.PI/180)} ${40 + dialR * Math.sin((-135-90)*Math.PI/180)} A ${dialR} ${dialR} 0 ${Math.abs(dialAngle) > 135 ? 1:0} 1 ${dotX.toFixed(2)} ${dotY.toFixed(2)}`}
            fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round"
          />
          {/* Punto arrastrable */}
          <circle cx={dotX.toFixed(2)} cy={dotY.toFixed(2)} r="7" fill={ACCENT} stroke="#fff" strokeWidth="2"/>
          {/* Centro con valor */}
          <text x="40" y="44" textAnchor="middle" fontSize="11" fontWeight="600" fill={ACCENT}>{fineRotation}°</text>
        </svg>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"11px", color:"#6B7280", marginBottom:"4px" }}>Ángulo libre</div>
          <input type="range" min="-45" max="45" value={fineRotation}
            style={{ width:"100%", height:"3px", accentColor:ACCENT }}
            onChange={e => { set("fineRotation", parseInt(e.target.value)); }}
            onMouseUp={e => saveHistory(`Ángulo: ${(e.target as HTMLInputElement).value}°`)}
          />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"9px", color:"#C4C4C4", marginTop:"2px" }}>
            <span>-45°</span><span>0°</span><span>+45°</span>
          </div>
        </div>
      </div>

      {/* Aspecto — 2 filas de 3, sin Libre, con circular */}
      <div style={{ padding:"10px 12px", borderBottom:`1px solid #F3F4F6` }}>
        {sectionTitle("Aspecto")}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"4px", marginBottom:"8px" }}>
          {ASPECTS.map(a => {
            const active = activeAspect === a.label;
            return (
              <button key={a.label}
                onClick={() => setActiveAspect(active ? null : a.label)}
                style={{
                  padding:"6px 4px", fontSize:"10px", cursor:"pointer",
                  border:`1.5px solid ${active ? ACCENT : "#E5E7EB"}`,
                  borderRadius: a.label === "○" ? "50%" : "7px",
                  background: active ? "rgba(255,122,0,.08)" : "#fff",
                  color: active ? ACCENT : "#6B7280",
                  fontWeight: active ? 600 : 400,
                  aspectRatio: a.label === "○" ? "1" : "auto",
                  display:"flex", alignItems:"center", justifyContent:"center"
                }}
              >{a.label}</button>
            );
          })}
        </div>

        {/* Fondo del preview */}
        {sectionTitle("Fondo")}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"4px", marginBottom:"8px" }}>
          {BG_COLORS.map(bg => (
            <button key={bg.label} title={bg.label}
              onClick={() => setActiveBg(activeBg === bg.label ? null : bg.label)}
              style={{
                width:"100%", aspectRatio:"1", borderRadius:"6px", cursor:"pointer",
                background: bg.color === "transparent" ? "linear-gradient(45deg,#ccc 25%,#fff 25%,#fff 75%,#ccc 75%)" : bg.color,
                border:`2px solid ${activeBg === bg.label ? ACCENT : "#E5E7EB"}`,
              }}
            />
          ))}
        </div>

        {/* Auto-proporción */}
        <button
          onClick={() => saveHistory("Auto proporción")}
          style={{ width:"100%", padding:"6px", fontSize:"10px", fontWeight:600,
            border:`1.5px solid ${BLUE}`, borderRadius:"7px",
            background:"rgba(15,52,96,.06)", color:BLUE, cursor:"pointer" }}
        >
          ⊞ Ajustar proporción automático
        </button>
      </div>

      {/* Herramientas de selección y corte */}
      <div style={{ padding:"10px 12px" }}>
        {sectionTitle("Selección y corte")}
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
          {toolBtn("select",  "↖",  "Seleccionar")}
          {toolBtn("move",    "✥",  "Mover")}
          {toolBtn("crop",    "⊡",  "Recortar")}
          {toolBtn("stretch", "↔",  "Estirar")}
          {toolBtn("scale",   "⤡",  "Escalar proporcionalmente")}
          {toolBtn("cut",     "✂",  "Cortar selección")}
        </div>
        {activeTool && (
          <div style={{ marginTop:"6px", fontSize:"10px", color:"#9CA3AF", padding:"4px 8px", background:"#F9FAFB", borderRadius:"6px" }}>
            {activeTool === "select"  && "Arrastrá para seleccionar un área"}
            {activeTool === "move"    && "Arrastrá la imagen para moverla"}
            {activeTool === "crop"    && "Arrastrá para definir el recorte"}
            {activeTool === "stretch" && "Arrastrá los bordes para estirar"}
            {activeTool === "scale"   && "Arrastrá las esquinas para escalar"}
            {activeTool === "cut"     && "Cortá la selección actual"}
          </div>
        )}
      </div>
    </div>
  );
}