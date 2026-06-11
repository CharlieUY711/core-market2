/**
 * ToolEditor — Design System
 * Repositorio: CharlieUY711/tool-editor
 * Path local:  C:\Core\tools\tool-editor\src\design\
 *
 * Archivo único con TODAS las definiciones de diseño extraídas del componente.
 * Importar donde se necesite:
 *   import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS, FILTERS, TOOLS, ... } from '../design/designSystem.js'
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. COLOR TOKENS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const COLORS = {

  // ── Superficies ──────────────────────────────────────────
  surface: {
    app:         "#f0efea",   // fondo general de la app
    panel:       "#fff",      // paneles laterales, topbar, statusbar
    canvas:      "#e8e6e0",   // área de trabajo del canvas
    input:       "#f5f5f3",   // inputs, botones secundarios, cards
    aiBanner:    "#faf5ff",   // banner sección IA (remove BG)
  },

  // ── Bordes ───────────────────────────────────────────────
  border: {
    default:     "#e0ddd5",   // bordes generales de paneles
    input:       "#e0ddd5",   // bordes de inputs y botones ghost
    checker:     "#ddd",      // patrón tablero del canvas
    aiBanner:    "#e9d5ff",   // borde banner IA
  },

  // ── Texto ────────────────────────────────────────────────
  text: {
    primary:     "#222",      // texto principal
    secondary:   "#555",      // texto secundario en botones fmtBtn
    muted:       "#888",      // labels de sliders, labels informativos
    faint:       "#aaa",      // valores de zoom, nombres de archivo
    placeholder: "#bbb",      // texto drop zone
    disabled:    "#999",      // estados deshabilitados
    sectionLabel:"#444",      // headers de sección (MAYÚSCULAS)
    tabInactive: "#bbb",      // tabs no activas
  },

  // ── Marca / Acento principal ──────────────────────────────
  accent: {
    primary:     "#00d4aa",   // acento principal (teal)
    primaryText: "#fff",      // texto sobre acento primario
  },

  // ── Botones primarios ────────────────────────────────────
  action: {
    primary:     "#111",      // fondo botón primario (negro)
    primaryText: "#fff",      // texto botón primario
    ghost:       "#f5f5f3",   // fondo botón ghost
    ghostText:   "#888",      // texto botón ghost
    ghostBorder: "#e0ddd5",   // borde botón ghost
  },

  // ── Semánticos ───────────────────────────────────────────
  semantic: {
    success:     "#16a34a",   // tamaño estimado, confirmaciones
    successBg:   "#f0fdf4",
    error:       "#dc2626",   // errores, cancelar
    errorBg:     "#fef2f2",
    warning:     "#f59e0b",
    warningBg:   "#fffbeb",
    info:        "#00d4aa",   // dimensiones, zoom
  },

  // ── IA / Purple ──────────────────────────────────────────
  ai: {
    accent:      "#7c3aed",   // color principal IA
    accentLight: "#a78bfa",   // texto sobre fondo oscuro
    bg:          "#f3e8ff",   // fondo badge IA
    border:      "#d8b4fe",   // borde badge IA
    bannerBg:    "#faf5ff",   // fondo banner IA
    bannerBorder:"#e9d5ff",   // borde banner IA
    sliderColor: "#7c3aed",   // accentColor del slider tolerancia
  },

  // ── Herramienta activa ───────────────────────────────────
  tool: {
    activeBg:    "#111",      // fondo herramienta seleccionada
    activeText:  "#fff",      // icono herramienta seleccionada
    inactiveText:"#aaa",      // icono herramienta no seleccionada
  },

  // ── Tab activa ───────────────────────────────────────────
  tab: {
    activeBorder:"#00d4aa",   // underline tab activa
    activeText:  "#00d4aa",   // texto tab activa
  },

  // ── Slider ───────────────────────────────────────────────
  slider: {
    accent:      "#00d4aa",   // accentColor sliders de ajuste
    value:       "#00d4aa",   // color del número de valor
  },

  // ── Shadows ──────────────────────────────────────────────
  shadow: {
    topbar:      "0 1px 0 rgba(0,0,0,.04)",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. TIPOGRAFÍA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TYPOGRAPHY = {

  // ── Familias ─────────────────────────────────────────────
  fontFamily: {
    ui:        "'SF Mono', 'Fira Code', monospace",   // toda la UI
    logo:      "'SF Mono', 'Fira Code', monospace",   // mismo que UI
  },

  // ── Tamaños (px) ─────────────────────────────────────────
  fontSize: {
    logo:         13,   // TOOLEDITOR en topbar
    body:         12,   // base de la app
    button:       11,   // botones topbar, apply buttons
    label:        10,   // labels de sliders, stat items
    sectionLabel:  9,   // headers de sección (UPPERCASE)
    tab:           9,   // tabs del panel derecho
    filterName:    8,   // nombre debajo de filter thumb
    badge:         8,   // badge "IA"
    subLabel:      8,   // subtítulos en format buttons
    sizeNote:      8,   // notas de dimensiones en format presets
    dimLabel:      9,   // etiquetas ANCHO / ALTO
    statusItem:   10,   // items de status bar
    zoomPct:      10,   // porcentaje de zoom
    zoomBtn:      12,   // +/- zoom buttons
    zoomFitBtn:    9,   // botón "fit"
    infoNote:     10,   // notas JPG/PNG/WebP
    sizeEstimate: 10,   // texto "Tamaño estimado"
    sizeValue:    10,   // valor del tamaño estimado
    dimValue:     10,   // valor de dimensiones
  },

  // ── Pesos ────────────────────────────────────────────────
  fontWeight: {
    logo:        700,
    aspectLabel: 600,   // "16:9", "1:1" en format presets
    sizeVal:     500,   // valores de tamaño y dimensiones
    normal:      400,
  },

  // ── Letter spacing ───────────────────────────────────────
  letterSpacing: {
    logo:         2,    // "TOOLEDITOR"
    sectionLabel: 1.5,  // "LUZ", "COLOR", etc.
    tab:          0.5,  // tabs
    badge:        0,
  },

  // ── Line height ──────────────────────────────────────────
  lineHeight: {
    infoNote:    1.9,   // notas JPG/PNG/WebP
    statusBar:   1,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. ESPACIADO Y DIMENSIONES DE LAYOUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SPACING = {
  // Gaps generales
  gap: {
    xs:  2,
    sm:  4,
    md:  6,
    lg:  8,
    xl: 16,
  },

  // Padding internos
  padding: {
    topbarH:      "0 8px",
    panelSection: "10px 10px 20px",
    sectionTop:   12,    // margin-top de cada SectionHeader
    logo:         "0 14px",
    statusbar:    "0 14px",
    tbGroup:      "0 8px",
    tab:          "8px 2px",
    aiBanner:     10,
    sliderBottom: 5,     // margin-bottom de cada SliderRow
  },

  // Margin entre elementos
  margin: {
    sectionHeaderBottom: 6,
    sectionHeaderTop:    12,
    applyBtnTop:         10,
    applyBtnGhostTop:    4,
    filterGridGap:       4,
    formatGridGap:       4,
    socialGridGap:       4,
    dimLabelBottom:      3,
    sizeCardTop:         4,
    infNoteMargin:       "10px 0",
    bgPreviewBottom:     8,
    toleranceBottom:     6,
    bgStatusBottom:      6,
    aiBtnBottom:         4,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. DIMENSIONES DE COMPONENTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DIMENSIONS = {
  // Alturas fijas
  topbar:        46,    // px
  statusbar:     36,    // px
  filterThumb:   46,    // px — canvas dentro de filter thumb

  // Anchos fijos
  toolsPanel:    69,    // px — barra izquierda de herramientas
  rightPanel:   320,    // px — panel derecho

  // Elementos de herramientas
  toolBtn: {
    width:       34,
    height:      34,
    borderRadius: 5,
    iconSize:    16,
  },

  // Zoom buttons
  zoomBtn: {
    width:       22,
    height:      22,
    borderRadius: 3,
  },

  // Inputs
  sliderHeight:   3,    // px — track del range input
  numInputPad:   "4px 6px",

  // Border radius global
  borderRadius: {
    xs:  2,
    sm:  3,
    md:  4,
    lg:  5,
    xl:  6,
  },

  // Border widths
  borderWidth: {
    default:    "1px",
    tabActive:  "2px",
    filterActive: "1.5px",
  },

  // Checkerboard del canvas
  checker: {
    size:       "14px 14px",
    positions:  "0 0, 0 7px, 7px -7px, -7px 0",
  },

  // Preview remove BG
  bgPreview: {
    height:      76,
    borderRadius: 4,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. COMPONENTES — OBJETO S (estilos React inline completos)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const S = {
  root:          { display:"flex", flexDirection:"column", height:"100%",
                   background:"#F2F5FA", color:"#0D2B55",
                   fontFamily:"Calibri,'Segoe UI',system-ui,sans-serif",
                   fontSize:13, overflow:"hidden" },

  topbar:        { height:44, background:"#0D2B55",
                   borderBottom:"1px solid #081C38",
                   display:"flex", alignItems:"center",
                   gap:4, padding:"0 8px", flexShrink:0,
                   boxShadow:"0 2px 8px rgba(13,43,85,.12)" },

  logo:          { fontSize:13, fontWeight:700, letterSpacing:2,
                   color:"#fff", padding:"0 14px",
                   borderRight:"1px solid rgba(255,255,255,.12)" },

  logoAccent:    { color:"#C9A84C" },
  tbGroup:       { display:"flex", alignItems:"center", gap:2,
                   padding:"0 8px", borderRight:"1px solid rgba(255,255,255,.1)" },

  tbBtn:         { background:"none", border:"none", color:"rgba(255,255,255,.75)",
                   padding:"4px 9px", borderRadius:4,
                   cursor:"pointer", fontSize:11, fontFamily:"inherit", fontWeight:500 },

  tbBtnAccent:   { background:"#C9A84C", color:"#fff" },
  tbBtnDanger:   { color:"#C0392B" },
  tbBtnDim:      { opacity: 0.35 },

  btnPrimary:    { background:"#1A4F9C", color:"#fff", border:"none",
                   borderRadius:4, padding:"5px 14px",
                   cursor:"pointer", fontSize:11, fontFamily:"inherit",
                   fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" },

  btnAccent:     { background:"#C9A84C", marginLeft:4 },
  main:          { display:"flex", flex:1, overflow:"hidden" },

  toolsPanel:    { width:52, background:"#0D2B55",
                   borderRight:"1px solid #081C38",
                   display:"flex", flexDirection:"column",
                   alignItems:"center", padding:"8px 0",
                   gap:2, flexShrink:0 },

  toolBtn:       { width:34, height:34, border:"none", background:"none",
                   color:"rgba(255,255,255,.45)", borderRadius:5,
                   cursor:"pointer", fontSize:16, transition:"all .15s" },

  toolActive:    { background:"rgba(201,168,76,.15)", color:"#C9A84C" },

  canvasWrap:    { flex:1, background:"#E8EDF5",
                   display:"flex", alignItems:"center", justifyContent:"center",
                   position:"relative", overflow:"hidden" },

  checker:       { position:"absolute", inset:0,
                   backgroundImage: [
                     "linear-gradient(45deg,#C8D5E8 25%,transparent 25%)",
                     "linear-gradient(-45deg,#C8D5E8 25%,transparent 25%)",
                     "linear-gradient(45deg,transparent 75%,#C8D5E8 75%)",
                     "linear-gradient(-45deg,transparent 75%,#C8D5E8 75%)",
                   ].join(","),
                   backgroundSize:"14px 14px",
                   backgroundPosition:"0 0,0 7px,7px -7px,-7px 0",
                   pointerEvents:"none", opacity:0.4 },

  dropZone:      { position:"absolute", inset:0,
                   display:"flex", flexDirection:"column",
                   alignItems:"center", justifyContent:"center", gap:8 },

  cropOverlay:   { position:"absolute", border:"2px solid #C9A84C",
                   background:"rgba(201,168,76,.05)", pointerEvents:"none" },

  cropThirdH:    { position:"absolute", top:0, bottom:0,
                   borderLeft:"1px solid rgba(255,255,255,.3)" },

  cropThirdV:    { position:"absolute", left:0, right:0,
                   borderTop:"1px solid rgba(255,255,255,.3)" },

  rightPanel:    { width:300, background:"#fff",
                   borderLeft:"1px solid #C8D5E8",
                   display:"flex", flexDirection:"column",
                   flexShrink:0, overflow:"hidden" },

  panelTabs:     { display:"flex", borderBottom:"2px solid #C8D5E8",
                   flexShrink:0, background:"#F2F5FA" },

  ptab:          { flex:1, background:"none", border:"none", color:"#7A7A7A",
                   padding:"10px 2px", cursor:"pointer", fontSize:11,
                   fontWeight:600, letterSpacing:".06em", textTransform:"uppercase",
                   borderBottom:"2px solid transparent", marginBottom:"-2px",
                   transition:"all .15s" },

  ptabActive:    { color:"#1A4F9C", borderBottomColor:"#1A4F9C", background:"#fff" },
  panelScroll:   { padding:"10px 12px 20px", overflowY:"auto", flex:1 },

  aiBanner:      { background:"rgba(26,79,156,.04)", border:"1px solid #C8D5E8",
                   borderRadius:6, padding:10, marginBottom:4 },

  aiBadge:       { fontSize:9, background:"rgba(124,58,237,.1)", color:"#7c3aed",
                   border:"1px solid rgba(124,58,237,.2)",
                   padding:"2px 6px", borderRadius:3, fontWeight:600 },

  bgPreview:     { width:"100%", height:76, borderRadius:4,
                   border:"1px solid #C8D5E8", overflow:"hidden", marginBottom:8,
                   background:"repeating-conic-gradient(#E8EDF5 0% 25%,#F2F5FA 0% 50%) 0 0/12px 12px" },

  applyBtn:      { width:"100%", background:"#1A4F9C", color:"#fff",
                   border:"none", borderRadius:4, padding:8,
                   cursor:"pointer", fontSize:11, fontFamily:"inherit",
                   fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" },

  applyBtnGhost: { background:"transparent", color:"#7A7A7A", border:"1px solid #C8D5E8" },
  applyBtnAI:    { background:"#7c3aed" },

  fmtBtn:        { background:"#F2F5FA", border:"1px solid #C8D5E8",
                   color:"#4A4A4A", borderRadius:4, padding:"7px 4px",
                   cursor:"pointer", fontSize:11, textAlign:"center" },

  fmtBtnLabel:   { fontSize:12, fontWeight:600, color:"#0D2B55" },
  fmtBtnSub:     { fontSize:9, color:"#7A7A7A" },

  outBtn:        { flex:1, background:"#F2F5FA", border:"1px solid #C8D5E8",
                   color:"#7A7A7A", borderRadius:4, padding:6,
                   cursor:"pointer", fontSize:11, textAlign:"center", fontWeight:500 },

  outBtnActive:  { background:"#1A4F9C", borderColor:"#1A4F9C", color:"#fff" },

  sizeCard:      { fontSize:11, color:"#7A7A7A", background:"#F2F5FA",
                   padding:"7px 10px", borderRadius:4, border:"1px solid #C8D5E8",
                   display:"flex", justifyContent:"space-between", alignItems:"center" },

  sizeCardValue:       { color:"#1D9E75", fontWeight:600 },
  sizeCardValueAccent: { color:"#1A4F9C", fontWeight:600 },

  numInput:      { width:"100%", background:"#fff",
                   border:"1px solid #C8D5E8", color:"#0D2B55",
                   borderRadius:4, padding:"5px 8px",
                   fontSize:12, fontFamily:"inherit" },

  statusbar:     { height:32, background:"#0D2B55",
                   borderTop:"1px solid #081C38",
                   display:"flex", alignItems:"center",
                   padding:"0 12px", gap:16, flexShrink:0 },

  statItem:      { fontSize:11, color:"rgba(255,255,255,.5)", display:"flex", gap:4 },
  statValue:     { color:"rgba(255,255,255,.8)" },

  zoomCtrl:      { marginLeft:"auto", display:"flex", gap:4, alignItems:"center" },

  zoomBtn:       { background:"none", border:"1px solid rgba(255,255,255,.2)",
                   color:"rgba(255,255,255,.6)", width:22, height:22,
                   borderRadius:3, cursor:"pointer", fontSize:12,
                   lineHeight:1, fontFamily:"inherit" },

  zoomFitBtn:    { width:"auto", padding:"0 8px", fontSize:10 },
  zoomPct:       { fontSize:11, color:"rgba(255,255,255,.5)" },

  zoomInput:     { width:48, textAlign:"center", fontSize:11,
                   background:"rgba(255,255,255,.08)",
                   border:"1px solid rgba(255,255,255,.2)",
                   borderRadius:3, padding:"2px 4px",
                   fontFamily:"inherit", color:"#fff" },
};