import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../utils/supabase/client";

const ACCENT = "#FF7A00";
const GREEN  = "#1DC878";
const BLUE   = "#0F3460";

const TABS = ["Información","Multimedia","Moneda y Precio","Detalles","Inventario","Vista previa"];
const CONDICIONES = ["Nuevo","Excelente","Muy bueno","Bueno","Regular","Para reparar"];
const MONEDAS = ["UYU","USD","EUR"];

const CANALES = [
  { key:"sync_ml",   label:"ML",   color:"#F5C518", tc:"#333" },
  { key:"sync_meta", label:"Meta", color:"#1877F2", tc:"#fff" },
  { key:"sync_wa",   label:"WA",   color:"#25D366", tc:"#fff" },
  { key:"sync_web",  label:"Web",  color:"#6B7280", tc:"#fff" },
];

interface Articulo {
  id:string; nombre:string; tipo:"market"|"secondhand"; status:string;
  precio:number; moneda:string; imagen_principal?:string; imagenes?:any[];
  videos?:any[]; stock:number; condicion?:string; departamento_id?:string;
  departamento_nombre?:string; categoria_id?:string; categoria_nombre?:string;
  atributos?:Record<string,any>; descripcion?:string;
  rating_promedio?:number; rating_count?:number;
  impresiones?:number; clicks?:number; ranking_score?:number;
  created_at:string; published_at?:string; deleted_at?:string;
  baja_prevista?:string;
  sync_ml?:boolean; sync_meta?:boolean; sync_wa?:boolean; sync_web?:boolean;
  precio_original?:number; sku?:string; stock_ilimitado?:boolean;
  envio_tipo?:string; envio_gratis?:boolean; peso_kg?:number;
  garantia_tipo?:string; garantia_meses?:number;
}

const EMPTY: Partial<Articulo> = {
  nombre:"", descripcion:"", precio:0, moneda:"UYU", stock:1,
  stock_ilimitado:false, imagenes:[], videos:[], atributos:{},
  envio_tipo:"retiro", envio_gratis:false, status:"draft",
  sync_ml:false, sync_meta:false, sync_wa:false, sync_web:false,
};

const S_CFG: Record<string,{label:string;bg:string;color:string}> = {
  active:  {label:"Activo",   bg:"#dcfce7",color:"#166534"},
  draft:   {label:"Borrador", bg:"#F3F4F6", color:"#6B7280"},
  paused:  {label:"Pausado",  bg:"#fef9c3", color:"#854d0e"},
  inactive:{label:"Inactivo", bg:"#fee2e2", color:"#991b1b"},
};

const ALL_COLS = [
  {id:"categoria",label:"Categoría"},{id:"marca",label:"Marca"},
  {id:"ranking",label:"Ranking"},{id:"ctr",label:"CTR"},
  {id:"baja",label:"Baja"},{id:"mkt1",label:"MKT 1"},{id:"mkt2",label:"MKT 2"},
];

type SortKey = "precio"|"stock"|"status"|"alta"|null;

const fmt = (s?:string) => s ? new Date(s).toLocaleDateString("es-UY",{day:"2-digit",month:"2-digit",year:"2-digit"}) : "—";
const fmtP = (n:number,m="UYU") => m+" "+Number(n).toLocaleString("es-UY");

// ── Botón toggle canal (presionado / suelto) ──────────────────────────────
function CanalBtn({ canal, active, onClick }: {
  canal: typeof CANALES[0]; active: boolean; onClick: ()=>void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onMouseDown={()=>setPressed(true)}
      onMouseUp={()=>{setPressed(false);onClick();}}
      onMouseLeave={()=>setPressed(false)}
      onTouchStart={()=>setPressed(true)}
      onTouchEnd={()=>{setPressed(false);onClick();}}
      title={active?"Sincronizado — click para desactivar":"Click para activar sync"}
      style={{
        padding:"2px 0", width:"100%", border:`1.5px solid ${canal.color}`,
        borderRadius:5, fontSize:"10px", fontWeight:800, cursor:"pointer",
        background: active ? canal.color : "#fff",
        color: active ? canal.tc : canal.color,
        boxShadow: active
          ? `inset 0 2px 5px rgba(0,0,0,.25), 0 1px 0 rgba(255,255,255,.15)`
          : `0 2px 4px rgba(0,0,0,.08), 0 1px 0 #fff`,
        transform: (active||pressed) ? "translateY(1px) scale(0.97)" : "translateY(0) scale(1)",
        transition:"all .1s",
        letterSpacing:".02em",
      }}>
      {canal.label}
    </button>
  );
}

// ── Dropdown menú ─────────────────────────────────────────────────────────
function DropMenu({ label, items, disabled, menuStyle="default" }: {
  label:string;
  items:{label:string;onClick:()=>void;color?:string}[];
  disabled?:boolean;
  menuStyle?:"default"|"bar";
}) {
  const [open,setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const isBar = menuStyle==="bar";
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(p=>!p)} style={isBar?{
        padding:"0.55rem 0.85rem", border:"none", background:"transparent",
        color: open?"#111":"#6B7280", fontSize:"0.78rem", fontWeight: open?800:600,
        cursor:"pointer", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap",
        transition:"all .1s",
      }:{
        padding:"0.42rem 0.85rem", border:"1.5px solid #D1D5DB",
        borderRadius:8, background: disabled?"#F9FAFB":"#fff",
        color: disabled?"#CBD5E1":"#374151", fontSize:"0.78rem", fontWeight:700,
        cursor: disabled?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:4,
        whiteSpace:"nowrap",
      }}>
        {label} <span style={{fontSize:"9px",opacity:.6}}>▾</span>
      </button>
      {open && items.length>0 && (
        <div style={{position:"absolute",top:"100%",left:0,background:"#fff",
          border:"1.5px solid #E5E7EB",borderRadius:10,padding:"0.35rem",
          zIndex:300,minWidth:170,boxShadow:"0 8px 28px rgba(0,0,0,.13)"}}>
          {items.map((it,i)=>(
            it.label.startsWith("──") ? (
              <div key={i} style={{borderTop:"1px solid #F0F0F0",margin:"0.25rem 0"}}/>
            ) : (
              <button key={i} onClick={()=>{it.onClick();setOpen(false);}} style={{
                display:"block",width:"100%",textAlign:"left",
                padding:"0.45rem 0.85rem",border:"none",background:"none",
                fontSize:"0.81rem",cursor:"pointer",
                color:it.color||"#374151",fontWeight:600,borderRadius:7,transition:"background .1s",
              }}
              onMouseEnter={e=>(e.currentTarget.style.background="#F5F5F5")}
              onMouseLeave={e=>(e.currentTarget.style.background="none")}>
                {it.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPublicaciones() {
  const [articulos,  setArticulos]  = useState<Articulo[]>([]);
  const [deptos,     setDeptos]     = useState<any[]>([]);
  const [cats,       setCats]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [expanded,   setExpanded]   = useState<string|null>(null);
  const { isSH, setIsSH, setTopStats } = useShop();
  const [sortKey,    setSortKey]    = useState<SortKey>(null);
  const [sortDir,    setSortDir]    = useState<"asc"|"desc">("asc");
  const [filterSt,   setFilterSt]   = useState<string|null>(null);
  const [visCols,    setVisCols]    = useState<Set<string>>(new Set(["alta"]));
  const [showCols,   setShowCols]   = useState(false);
  const [toast,      setToast]      = useState<{text:string;ok:boolean}|null>(null);
  const [showNew,    setShowNew]    = useState(false);
  const [newForm,    setNewForm]    = useState<Partial<Articulo>>({...EMPTY});
  const [newTab,     setNewTab]     = useState(TABS[0]);
  const [editForm,   setEditForm]   = useState<Partial<Articulo>>({});
  const [editTab,    setEditTab]    = useState(TABS[0]);
  const [isDirty,    setIsDirty]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  const notify = (text:string,ok=true)=>{ setToast({text,ok}); setTimeout(()=>setToast(null),3000); };

  const load = useCallback(async ()=>{
    setLoading(true);
    const [{data:{user}},dR,cR] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("departamentos").select("id,nombre").eq("activo",true).order("orden"),
      supabase.from("categorias").select("id,nombre,departamento_id").eq("activo",true).order("nombre"),
    ]);
    if (!user) return;
    setDeptos(dR.data||[]); setCats(cR.data||[]);
    const {data} = await supabase.from("articulos").select("*")
      .eq("vendedor_id",user.id).is("deleted_at",null)
      .order("created_at",{ascending:false});
    setArticulos(data||[]);
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  // Obtener artículo activo (seleccionado o expandido)
  const activeIds = selected.size>0 ? Array.from(selected) : expanded ? [expanded] : [];
  const activeArt = articulos.find(a=>a.id===expanded);
  const hasActive = activeIds.length>0;

  const handleSort = (k:SortKey)=>{
    if(sortKey===k) setSortDir(d=>d==="asc"?"desc":"asc");
    else {setSortKey(k);setSortDir("asc");}
  };
  const cycleSt = ()=>{
    const opts=[null,"active","draft","paused"];
    setFilterSt(opts[(opts.indexOf(filterSt)+1)%opts.length]);
  };

  const toggleSel = (id:string)=>{
    setSelected(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  };
  const toggleAll = ()=>{
    if(selected.size===filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a=>a.id)));
  };
  const toggleExpand = (id:string)=>{
    if(expanded===id){setExpanded(null);setIsDirty(false);}
    else {
      const a = articulos.find(x=>x.id===id);
      if(a){setEditForm({...a});setEditTab(TABS[0]);}
      setExpanded(id); setIsDirty(false);
    }
  };

  // Toggle canal sync en tabla
  const toggleSync = async (a:Articulo, key:string)=>{
    const val = !(a as any)[key];
    await supabase.from("articulos").update({[key]:val}).eq("id",a.id);
    setArticulos(p=>p.map(x=>x.id===a.id?{...x,[key]:val}:x));
    if(expanded===a.id) setEditForm(f=>({...f,[key]:val}));
  };

  // Acciones de barra
  const accionBarra = async (accion:string)=>{
    if(!hasActive&&accion!=="nuevo") return;
    const ids = activeIds;

    if(accion==="nuevo"){
      setShowNew(true); setNewForm({...EMPTY}); setNewTab(TABS[0]);
      setExpanded(null);
      return;
    }
    if(accion==="clonar"&&activeArt){
      const {id,created_at,published_at,...rest} = activeArt;
      await supabase.from("articulos").insert({...rest,nombre:activeArt.nombre+" (copia)",status:"draft",impresiones:0,clicks:0,ranking_score:0});
      notify("Clonado como borrador"); load(); return;
    }
    if(accion==="activar")  {await supabase.from("articulos").update({status:"active"}).in("id",ids);   notify("Activado(s)");}
    if(accion==="pausar")   {await supabase.from("articulos").update({status:"paused"}).in("id",ids);   notify("Pausado(s)");}
    if(accion==="archivar") {await supabase.from("articulos").update({status:"inactive"}).in("id",ids); notify("Archivado(s)");}
    if(accion==="eliminar"){
      if(!confirm("¿Eliminar "+ids.length+" artículo(s)?")) return;
      await supabase.from("articulos").update({deleted_at:new Date().toISOString(),status:"deleted"}).in("id",ids);
      setExpanded(null); setSelected(new Set()); notify("Eliminado(s)");
    }
    if(accion==="guardar"){
      if(showNew) { await saveNew(); return; }
      if(expanded) { await saveEdit(); return; }
    }
    if(accion==="cancelar"){
      setShowNew(false); setNewForm({...EMPTY});
      setExpanded(null); setIsDirty(false);
      return;
    }
    setArticulos(p=>p.map(a=>ids.includes(a.id)?{...a,status:
      accion==="activar"?"active":accion==="pausar"?"paused":accion==="archivar"?"inactive":a.status}:a));
    if(accion==="eliminar") setArticulos(p=>p.filter(a=>!ids.includes(a.id)));
    setSelected(new Set());
  };

  const saveNew = async()=>{
    setSaving(true);
    const {data:{user}} = await supabase.auth.getUser();
    if(!user){setSaving(false);return;}
    const {error} = await supabase.from("articulos").insert({
      ...newForm, vendedor_id:user.id, tipo:isSH?"secondhand":"market",
    });
    if(!error){notify("Artículo creado");setShowNew(false);setNewForm({...EMPTY});load();}
    else notify(error.message,false);
    setSaving(false);
  };

  const saveEdit = async()=>{
    if(!expanded) return;
    setSaving(true);
    const {error} = await supabase.from("articulos").update(editForm).eq("id",expanded);
    if(!error){
      setArticulos(p=>p.map(a=>a.id===expanded?{...a,...editForm}:a));
      notify("Guardado"); setIsDirty(false);
    } else notify(error.message,false);
    setSaving(false);
  };

  // Sync dropdown items
  const syncItems = activeArt ? CANALES
    .filter(c=>(activeArt as any)[c.key])
    .map(c=>({label:"Sync → "+c.label,color:c.color,onClick:()=>notify("Sync "+c.label+" (próximamente)")}))
    : [];

  // Ver dropdown items
  const verItems = activeArt ? CANALES
    .filter(c=>(activeArt as any)[c.key])
    .map(c=>({label:"Abrir en "+c.label,color:c.color,onClick:()=>notify("Abriendo "+c.label+"...")}))
    : [];

  let filtered = articulos.filter(a=>{
    if(isSH&&a.tipo!=="secondhand") return false;
    if(!isSH&&a.tipo!=="market") return false;
    if(filterSt&&a.status!==filterSt) return false;
    return true;
  });
  if(sortKey){
    filtered=[...filtered].sort((a,b)=>{
      let va:any,vb:any;
      if(sortKey==="precio"){va=a.precio;vb=b.precio;}
      else if(sortKey==="stock"){va=a.stock;vb=b.stock;}
      else if(sortKey==="status"){va=a.status;vb=b.status;}
      else{va=a.published_at||a.created_at;vb=b.published_at||b.created_at;}
      return va<vb?(sortDir==="asc"?-1:1):va>vb?(sortDir==="asc"?1:-1):0;
    });
  }

  const color = isSH ? GREEN : ACCENT;
  const stats = {
    total:articulos.length,
    activos:articulos.filter(a=>a.status==="active").length,
    borradores:articulos.filter(a=>a.status==="draft").length,
    clicks:articulos.reduce((s,a)=>s+(a.clicks||0),0),
  };

  // Publicar stats a la topbar
  useEffect(()=>{
    setTopStats([
      {label:"Total",     value:stats.total,      color:"rgba(255,255,255,.7)"},
      {label:"Activos",   value:stats.activos,    color:GREEN},
      {label:"Borradores",value:stats.borradores, color:"#F59E0B"},
      {label:"Clicks",    value:stats.clicks,     color:color},
    ]);
    return ()=>setTopStats([]);
  },[stats.total,stats.activos,stats.borradores,stats.clicks,color]);

  // Estilos tabla
  const thB: React.CSSProperties = {
    padding:"0.45rem 0.65rem", textAlign:"left", fontSize:"10px", fontWeight:700,
    color:"#6B7280", textTransform:"uppercase", letterSpacing:".05em",
    borderBottom:"2px solid #F3F4F6", background:"#FAFAFA",
    whiteSpace:"nowrap", userSelect:"none",
  };
  const thS=(k:SortKey):React.CSSProperties=>({...thB,cursor:"pointer",color:sortKey===k?color:"#6B7280"});
  const td: React.CSSProperties={
    padding:"0.5rem 0.65rem",fontSize:"0.81rem",color:"#374151",
    borderBottom:"1px solid #F9FAFB",verticalAlign:"middle",
  };
  const sico=(k:SortKey)=>sortKey===k?(sortDir==="asc"?" ↑":" ↓"):" ↕";

  const inp:React.CSSProperties={
    width:"100%",padding:"0.42rem 0.6rem",border:"1.5px solid #E5E7EB",
    borderRadius:7,fontSize:"0.81rem",outline:"none",fontFamily:"DM Sans,sans-serif",
    boxSizing:"border-box",
  };
  const lbl:React.CSSProperties={
    fontSize:"10px",color:"#9CA3AF",fontWeight:700,
    textTransform:"uppercase",marginBottom:3,display:"block",
  };

  // Barra de acción
  const barBtn=(label:string,accion:string,col:string,fill=false,dis=false)=>(
    <button key={accion} onClick={()=>accionBarra(accion)} disabled={dis}
      style={{
        padding:"0.45rem 0.85rem",border:`1.5px solid ${dis?"#E5E7EB":col}`,
        borderRadius:8,cursor:dis?"not-allowed":"pointer",
        background:fill?(dis?"#E5E7EB":col):"#fff",
        color:fill?"#fff":(dis?"#CBD5E1":col),
        fontSize:"0.78rem",fontWeight:700,whiteSpace:"nowrap",
        transition:"all .1s",
        boxShadow:fill&&!dis?"0 2px 6px rgba(0,0,0,.12)":"none",
      }}>{label}</button>
  );

  const renderTabs = (form:Partial<Articulo>,setForm:(f:Partial<Articulo>)=>void,tab:string,setTab:(t:string)=>void)=>{
    const catsFilt = cats.filter(c=>c.departamento_id===form.departamento_id);
    return (
      <>
        {/* Tab bar */}
        <div style={{display:"flex",gap:0,borderBottom:"2px solid #E5E7EB",marginBottom:"1rem",overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"0.4rem 0.8rem",border:"none",background:"none",
              fontSize:"0.73rem",fontWeight:tab===t?800:500,cursor:"pointer",
              color:tab===t?color:"#9CA3AF",
              borderBottom:tab===t?`2.5px solid ${color}`:"2.5px solid transparent",
              marginBottom:"-2px",whiteSpace:"nowrap",transition:"all .1s",
            }}>{t}</button>
          ))}
        </div>

        {/* Contenido */}
        {tab==="Información" && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
            <div><span style={lbl}>Nombre *</span>
              <input style={inp} value={form.nombre||""} placeholder="Ej: iPhone 14 Pro 256GB Negro"
                onChange={e=>setForm({...form,nombre:e.target.value})}/>
            </div>
            <div><span style={lbl}>Descripción</span>
              <textarea style={{...inp,minHeight:80,resize:"vertical"}} value={form.descripcion||""}
                onChange={e=>setForm({...form,descripcion:e.target.value})}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
              <div><span style={lbl}>Departamento</span>
                <select style={inp} value={form.departamento_id||""} onChange={e=>{
                  const d=deptos.find(x=>x.id===e.target.value);
                  setForm({...form,departamento_id:e.target.value,departamento_nombre:d?.nombre||"",categoria_id:"",categoria_nombre:""});
                }}>
                  <option value="">Seleccionar...</option>
                  {deptos.map(d=><option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
              <div><span style={lbl}>Categoría</span>
                <select style={inp} value={form.categoria_id||""} onChange={e=>{
                  const c=cats.find(x=>x.id===e.target.value);
                  setForm({...form,categoria_id:e.target.value,categoria_nombre:c?.nombre||""});
                }}>
                  <option value="">Seleccionar...</option>
                  {catsFilt.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>
            {isSH&&<div><span style={lbl}>Condición *</span>
              <select style={inp} value={form.condicion||""} onChange={e=>setForm({...form,condicion:e.target.value})}>
                <option value="">Seleccionar...</option>
                {CONDICIONES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>}
          </div>
        )}
        {tab==="Multimedia" && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
            <div><span style={lbl}>URL imagen principal</span>
              <input style={inp} value={form.imagen_principal||""} placeholder="https://..."
                onChange={e=>setForm({...form,imagen_principal:e.target.value})}/>
              {form.imagen_principal&&<img src={form.imagen_principal} alt=""
                style={{marginTop:8,width:72,height:72,objectFit:"cover",borderRadius:8,border:"1px solid #E5E7EB"}}
                onError={e=>(e.currentTarget.style.display="none")}/>}
            </div>
            <div><span style={lbl}>Imágenes adicionales (una URL por línea)</span>
              <textarea style={{...inp,minHeight:70,resize:"vertical",fontFamily:"monospace",fontSize:"11px"}}
                value={(form.imagenes||[]).map((i:any)=>typeof i==="string"?i:i?.url).filter(Boolean).join("\n")}
                placeholder="https://img1.jpg&#10;https://img2.jpg"
                onChange={e=>{
                  const urls=e.target.value.split("\n").filter(Boolean).map((u,i)=>({url:u.trim(),orden:i,principal:i===0}));
                  setForm({...form,imagenes:urls,imagen_principal:urls[0]?.url||form.imagen_principal});
                }}/>
            </div>
          </div>
        )}
        {tab==="Moneda y Precio" && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem"}}>
              <div><span style={lbl}>Moneda</span>
                <select style={inp} value={form.moneda||"UYU"} onChange={e=>setForm({...form,moneda:e.target.value})}>
                  {MONEDAS.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div><span style={lbl}>Precio *</span>
                <input type="number" style={inp} value={form.precio||""} min={0}
                  onChange={e=>setForm({...form,precio:parseFloat(e.target.value)||0})}/>
              </div>
              <div><span style={lbl}>Precio original</span>
                <input type="number" style={inp} value={form.precio_original||""} min={0} placeholder="Opcional"
                  onChange={e=>setForm({...form,precio_original:parseFloat(e.target.value)||undefined})}/>
              </div>
            </div>
            {form.precio_original&&form.precio&&form.precio_original>form.precio&&(
              <div style={{fontSize:"0.82rem",color:GREEN,fontWeight:700,padding:"0.4rem 0.6rem",
                background:"#f0fdf4",borderRadius:7,border:"1px solid #86efac"}}>
                Descuento: {Math.round((1-form.precio/form.precio_original)*100)}% off
              </div>
            )}
          </div>
        )}
        {tab==="Detalles" && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
              <div><span style={lbl}>SKU</span>
                <input style={inp} value={form.sku||""} onChange={e=>setForm({...form,sku:e.target.value})}/>
              </div>
              <div><span style={lbl}>Garantía tipo</span>
                <select style={inp} value={form.garantia_tipo||""} onChange={e=>setForm({...form,garantia_tipo:e.target.value})}>
                  <option value="">Sin garantía</option>
                  <option value="vendedor">Del vendedor</option>
                  <option value="fabrica">De fábrica</option>
                </select>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
              <div><span style={lbl}>Garantía (meses)</span>
                <input type="number" style={inp} value={form.garantia_meses||""} min={0}
                  onChange={e=>setForm({...form,garantia_meses:parseInt(e.target.value)||undefined})}/>
              </div>
              <div><span style={lbl}>Peso kg</span>
                <input type="number" style={inp} value={form.peso_kg||""} min={0} step="0.1"
                  onChange={e=>setForm({...form,peso_kg:parseFloat(e.target.value)||undefined})}/>
              </div>
            </div>
            <div><span style={lbl}>Tipo de envío</span>
              <select style={inp} value={form.envio_tipo||"retiro"} onChange={e=>setForm({...form,envio_tipo:e.target.value})}>
                <option value="retiro">Solo retiro</option>
                <option value="custom">Envío propio</option>
                <option value="meli_like">Tipo MercadoEnvíos</option>
                <option value="pickup">Pickup point</option>
              </select>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:"0.82rem"}}>
              <input type="checkbox" checked={!!form.envio_gratis} style={{accentColor:color}}
                onChange={e=>setForm({...form,envio_gratis:e.target.checked})}/>
              Envío gratis
            </label>
          </div>
        )}
        {tab==="Inventario" && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
              <div><span style={lbl}>Stock</span>
                <input type="number" style={inp} value={form.stock||1} min={0}
                  disabled={!!form.stock_ilimitado}
                  onChange={e=>setForm({...form,stock:parseInt(e.target.value)||0})}/>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",paddingBottom:4}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:"0.82rem"}}>
                  <input type="checkbox" checked={!!form.stock_ilimitado} style={{accentColor:color}}
                    onChange={e=>setForm({...form,stock_ilimitado:e.target.checked})}/>
                  Ilimitado
                </label>
              </div>
            </div>
            <div><span style={lbl}>Estado</span>
              <select style={inp} value={form.status||"draft"} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="draft">Borrador</option>
                <option value="active">Publicar ahora</option>
                <option value="paused">Pausado</option>
              </select>
            </div>
          </div>
        )}
        {tab==="Vista previa" && (
          <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",padding:"0.5rem",
            background:"#fff",borderRadius:10,border:"1px solid #E5E7EB"}}>
            {form.imagen_principal&&(
              <img src={form.imagen_principal} alt="" style={{width:88,height:88,objectFit:"cover",borderRadius:8}}
                onError={e=>(e.currentTarget.style.display="none")}/>
            )}
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:"1rem",color:"#111"}}>{form.nombre||"Sin nombre"}</div>
              <div style={{color,fontWeight:700,fontSize:"0.95rem",margin:"4px 0"}}>
                {form.moneda} {Number(form.precio||0).toLocaleString("es-UY")}
                {form.precio_original&&form.precio_original>0&&(
                  <span style={{textDecoration:"line-through",color:"#9CA3AF",marginLeft:8,fontSize:"0.8rem"}}>
                    {form.moneda} {Number(form.precio_original).toLocaleString("es-UY")}
                  </span>
                )}
              </div>
              <div style={{fontSize:"0.78rem",color:"#6B7280"}}>
                {form.departamento_nombre||"Sin departamento"}
                {form.condicion&&" · "+form.condicion}
                {" · Stock: "+(form.stock_ilimitado?"∞":form.stock||0)}
              </div>
              {form.descripcion&&<div style={{fontSize:"0.78rem",color:"#374151",marginTop:6,lineHeight:1.5}}>
                {form.descripcion.slice(0,180)}
              </div>}
            </div>
          </div>
        )}
      </>
    );
  };

  // Panel expandido
  const renderExpanded = (a:Articulo|null, isNew=false)=>{
    const form    = isNew ? newForm  : editForm;
    const setForm = isNew
      ? (f:Partial<Articulo>)=>{ setNewForm(f); }
      : (f:Partial<Articulo>)=>{ setEditForm(f); setIsDirty(true); };
    const tab    = isNew ? newTab  : editTab;
    const setTab = isNew ? setNewTab : setEditTab;

    return (
      <tr key={(a?.id||"new")+"-panel"}>
        <td colSpan={99} style={{padding:0,borderBottom:`2.5px solid ${color}20`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 0.52fr",
            background:"#F8F9FB",borderTop:`2px solid ${color}30`}}>

            {/* Izquierda: tabs + form */}
            <div style={{padding:"1.1rem 1.25rem",borderRight:"1px solid #EAECF0"}}>
              {renderTabs(form,setForm,tab,setTab)}
            </div>

            {/* Derecha: métricas */}
            {!isNew && a && (
              <div style={{padding:"1.1rem 1rem"}}>
                <div style={{fontSize:"10px",fontWeight:700,color:"#9CA3AF",
                  textTransform:"uppercase",letterSpacing:".08em",marginBottom:"0.6rem"}}>
                  Métricas
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px"}}>
                  {[
                    {label:"Impresiones",value:a.impresiones||0},
                    {label:"Clicks",     value:a.clicks||0},
                    {label:"CTR",        value:(a.impresiones?(((a.clicks||0)/a.impresiones)*100).toFixed(1):0)+"%"},
                    {label:"Ranking",    value:a.ranking_score?Number(a.ranking_score).toFixed(3):"—"},
                    {label:"Rating",     value:a.rating_promedio?Number(a.rating_promedio).toFixed(1)+" ★":"—"},
                    {label:"Reseñas",    value:a.rating_count||0},
                  ].map(m=>(
                    <div key={m.label} style={{background:"#fff",borderRadius:8,
                      padding:"0.4rem 0.5rem",border:"1px solid #E5E7EB"}}>
                      <div style={{fontSize:"9px",color:"#9CA3AF",textTransform:"uppercase"}}>{m.label}</div>
                      <div style={{fontWeight:700,color:"#374151",fontSize:"0.85rem"}}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>

      {toast&&(
        <div style={{position:"fixed",bottom:"1.5rem",right:"1.5rem",zIndex:9999,
          padding:"0.75rem 1.25rem",borderRadius:10,fontWeight:600,fontSize:"0.875rem",
          background:toast.ok?"#f0fdf4":"#fef2f2",color:toast.ok?"#166534":"#dc2626",
          border:`1px solid ${toast.ok?"#6BB87A":"#ef4444"}`,
          boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
          {toast.text}
        </div>
      )}

      {/* STATS tira compacta */}
      <div style={{display:"flex",gap:"0.5rem"}}>
        {[
          {label:"Total",     value:stats.total,      c:BLUE},
          {label:"Activos",   value:stats.activos,    c:GREEN},
          {label:"Borradores",value:stats.borradores, c:"#F59E0B"},
          {label:"Clicks",    value:stats.clicks,     c:color},
        ].map(s=>(
          <div key={s.label} style={{background:"#fff",borderRadius:6,flex:1,
            padding:"0.2rem 0.75rem",border:"1px solid #F0F0F0",
            borderLeft:`2.5px solid ${s.c}`,display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <span style={{fontSize:"1rem",fontWeight:800,color:s.c,lineHeight:1}}>{s.value}</span>
            <span style={{fontSize:"0.65rem",color:"#9CA3AF",textTransform:"uppercase",
              letterSpacing:".04em",fontWeight:700}}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* TABLA */}
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #EAECF0",
        overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>

        {/* ── MENU BAR ─────────────────────────────────────────────────── */}
        <div style={{
          display:"flex", alignItems:"center", gap:0,
          borderBottom:"1.5px solid #F0F0F0", background:"#FAFAFA",
          padding:"0 0.5rem",
        }}>

          {/* Artículo ▾ */}
          <DropMenu label="Artículo" items={[
            {label:"+ Nuevo artículo",  onClick:()=>accionBarra("nuevo"),   color:color},
            {label:"Clonar",            onClick:()=>accionBarra("clonar"),  color:hasActive&&selected.size<=1?color:"#CBD5E1"},
            {label:"Editar",            onClick:()=>accionBarra("editar"),  color:hasActive?color:"#CBD5E1"},
            {label:"──────",            onClick:()=>{}},
            {label:"Activar",           onClick:()=>accionBarra("activar"), color:GREEN},
            {label:"Pausar",            onClick:()=>accionBarra("pausar"),  color:"#F59E0B"},
            {label:"Archivar",          onClick:()=>accionBarra("archivar"),color:"#6B7280"},
            {label:"──────",            onClick:()=>{}},
            {label:"Eliminar",          onClick:()=>accionBarra("eliminar"),color:"#EF4444"},
          ]} menuStyle="bar"/>

          <div style={{width:1,height:32,background:"#E5E7EB",margin:"0 2px"}}/>

          {/* Sync ▾ */}
          <DropMenu label="Sync" items={
            activeArt ? CANALES.map(c=>({
              label: (activeArt as any)[c.key] ? "▶ "+c.label : "○ "+c.label,
              color: (activeArt as any)[c.key] ? c.color : "#9CA3AF",
              onClick: ()=>(activeArt as any)[c.key] && notify("Sync "+c.label+" — próximamente"),
            })) : [{label:"Seleccioná un artículo",onClick:()=>{},color:"#9CA3AF"}]
          } menuStyle="bar"/>

          {/* Ver ▾ */}
          <DropMenu label="Ver" items={
            activeArt ? CANALES
              .filter(c=>(activeArt as any)[c.key])
              .map(c=>({label:"Abrir en "+c.label, color:c.color, onClick:()=>notify("Abriendo "+c.label+"...")}))
              .concat([{label:"Mi web",color:"#6B7280",onClick:()=>notify("Abriendo web...")}])
            : [{label:"Seleccioná un artículo",onClick:()=>{},color:"#9CA3AF"}]
          } menuStyle="bar"/>

          <div style={{width:1,height:32,background:"#E5E7EB",margin:"0 2px"}}/>

          {/* Columnas ▾ */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowCols(p=>!p)} style={{
              padding:"0.55rem 0.85rem", border:"none", background:"transparent",
              color:"#6B7280", fontSize:"0.78rem", cursor:"pointer", fontWeight:600,
              display:"flex", alignItems:"center", gap:4,
              borderBottom: showCols?`2px solid ${color}`:"2px solid transparent",
            }}>
              Columnas <span style={{fontSize:"9px",opacity:.7}}>▾</span>
            </button>
            {showCols&&(
              <div style={{position:"absolute",left:0,top:"100%",background:"#fff",
                border:"1.5px solid #E5E7EB",borderRadius:10,padding:"0.6rem",
                zIndex:200,minWidth:155,boxShadow:"0 8px 24px rgba(0,0,0,.12)"}}
                onMouseLeave={()=>setShowCols(false)}>
                {ALL_COLS.map(col=>(
                  <label key={col.id} style={{display:"flex",alignItems:"center",gap:8,
                    padding:"0.3rem 0",cursor:"pointer",fontSize:"0.8rem",color:"#374151"}}>
                    <input type="checkbox" checked={visCols.has(col.id)} style={{accentColor:color}}
                      onChange={()=>setVisCols(p=>{const n=new Set(p);n.has(col.id)?n.delete(col.id):n.add(col.id);return n;})}/>
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{flex:1}}/>

          {/* Contador selección */}
          {selected.size>0&&(
            <span style={{fontSize:"0.73rem",color:BLUE,fontWeight:700,
              padding:"0.25rem 0.6rem",background:"rgba(15,52,96,.08)",borderRadius:6,marginRight:"0.5rem"}}>
              {selected.size} seleccionado(s)
            </span>
          )}

          {/* Guardar / Cancelar — solo si hay edición */}
          {(isDirty||showNew)&&(
            <div style={{display:"flex",gap:6,padding:"0.35rem 0"}}>
              <button onClick={()=>accionBarra("cancelar")} style={{
                padding:"0.38rem 0.85rem",border:"1.5px solid #E5E7EB",borderRadius:8,
                background:"#fff",color:"#6B7280",fontSize:"0.78rem",fontWeight:700,cursor:"pointer",
              }}>Cancelar</button>
              <button onClick={()=>accionBarra("guardar")} disabled={saving} style={{
                padding:"0.38rem 0.85rem",border:"none",borderRadius:8,
                background:color,color:"#fff",fontSize:"0.78rem",fontWeight:700,
                cursor:saving?"not-allowed":"pointer",opacity:saving?.7:1,
              }}>{saving?"Guardando...":"Guardar"}</button>
            </div>
          )}
        </div>

        {/* ── TABLA ───────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{textAlign:"center",padding:"3rem",color:"#9CA3AF"}}>Cargando...</div>
        ) : (
          <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}>
            <thead>
              <tr>
                <th style={{...thB,width:34}}>
                  <input type="checkbox"
                    checked={selected.size===filtered.length&&filtered.length>0}
                    onChange={toggleAll} style={{accentColor:color}}/>
                </th>
                <th style={{...thB,width:48}}>Foto</th>
                <th style={thB}>Nombre</th>
                <th style={thS("precio")} onClick={()=>handleSort("precio")}>Precio{sico("precio")}</th>
                <th style={thS("stock")} onClick={()=>handleSort("stock")}>Stock{sico("stock")}</th>
                <th style={{...thS("status"),cursor:"pointer"}} onClick={cycleSt}>
                  Estado{filterSt?" · "+S_CFG[filterSt]?.label:"↕"}
                </th>
                <th style={{...thB,textAlign:"center",minWidth:130}}>Sync</th>
                <th style={thB}>Departamento</th>
                <th style={thS("alta")} onClick={()=>handleSort("alta")}>Alta{sico("alta")}</th>
                {visCols.has("categoria")&&<th style={thB}>Categoría</th>}
                {visCols.has("marca")    &&<th style={thB}>Marca</th>}
                {visCols.has("ranking")  &&<th style={thB}>Ranking</th>}
                {visCols.has("ctr")      &&<th style={thB}>CTR</th>}
                {visCols.has("baja")     &&<th style={thB}>Baja</th>}
                {visCols.has("mkt1")     &&<th style={thB}>MKT 1</th>}
                {visCols.has("mkt2")     &&<th style={thB}>MKT 2</th>}
                <th style={{...thB,width:34}}/>
              </tr>
            </thead>
            <tbody>
              {/* Fila nuevo */}
              {showNew&&(
                <>
                  <tr style={{background:`${color}08`,borderLeft:`3px solid ${color}`}}>
                    <td colSpan={99} style={{padding:"0.55rem 1rem",borderBottom:`1px solid ${color}20`}}>
                      <span style={{fontSize:"0.8rem",fontWeight:800,color}}>
                        + Artículo nuevo · {isSH?"Second Hand":"Market"}
                      </span>
                      <span style={{fontSize:"0.73rem",color:"#9CA3AF",marginLeft:8}}>
                        Completá los datos abajo y presioná Guardar
                      </span>
                    </td>
                  </tr>
                  {renderExpanded(null,true)}
                </>
              )}

              {filtered.length===0&&!showNew?(
                <tr><td colSpan={99} style={{textAlign:"center",padding:"3rem"}}>
                  <div style={{fontSize:"2.5rem"}}>📦</div>
                  <div style={{fontWeight:700,color:"#374151",marginTop:"0.5rem"}}>Sin publicaciones</div>
                  <button onClick={()=>accionBarra("nuevo")} style={{
                    marginTop:"1rem",padding:"0.6rem 1.25rem",background:color,
                    color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",
                  }}>+ Nuevo artículo</button>
                </td></tr>
              ):filtered.map(a=>{
                const cfg  = S_CFG[a.status]||S_CFG.draft;
                const isExp = expanded===a.id;
                const isSel = selected.has(a.id);
                const ctr   = a.impresiones?Math.round((a.clicks||0)/a.impresiones*100):0;
                return (
                  <>
                    <tr key={a.id} style={{
                      background: isExp?`${color}06`:isSel?`${color}04`:"#fff",
                      borderLeft: isExp?`3px solid ${color}`:"3px solid transparent",
                      transition:"all .1s",
                    }}>
                      <td style={td}>
                        <input type="checkbox" checked={isSel}
                          onChange={()=>toggleSel(a.id)} style={{accentColor:color}}/>
                      </td>
                      <td style={td}>
                        <div style={{width:38,height:38,borderRadius:6,overflow:"hidden",background:"#F3F4F6"}}>
                          {a.imagen_principal
                            ?<img src={a.imagen_principal} alt={a.nombre}
                               style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            :<div style={{width:"100%",height:"100%",display:"flex",
                               alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>
                               {a.tipo==="secondhand"?"♻️":"🛍"}
                             </div>
                          }
                        </div>
                      </td>
                      <td style={{...td,maxWidth:200}}>
                        <div style={{fontWeight:600,color:"#111",overflow:"hidden",
                          textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nombre}</div>
                        {a.condicion&&<div style={{fontSize:"10px",color:"#9CA3AF"}}>{a.condicion}</div>}
                      </td>
                      <td style={{...td,fontWeight:700,color}}>{fmtP(a.precio,a.moneda)}</td>
                      <td style={{...td,textAlign:"center"}}>
                        <span style={{color:a.stock===0?"#EF4444":a.stock<5?"#F59E0B":"#374151",
                          fontWeight:a.stock<5?700:400}}>{a.stock}</span>
                      </td>
                      <td style={td}>
                        <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:20,
                          background:cfg.bg,color:cfg.color,fontWeight:700}}>{cfg.label}</span>
                      </td>

                      {/* SYNC — botones toggle ML/Meta/WA/Web */}
                      <td style={{...td,padding:"0.4rem 0.5rem"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"3px"}}>
                          {CANALES.map(c=>(
                            <CanalBtn key={c.key} canal={c}
                              active={!!(a as any)[c.key]}
                              onClick={()=>toggleSync(a,c.key)}/>
                          ))}
                        </div>
                      </td>

                      <td style={td}>{a.departamento_nombre||"—"}</td>
                      <td style={td}>{fmt(a.published_at||a.created_at)}</td>
                      {visCols.has("categoria")&&<td style={td}>{a.categoria_nombre||"—"}</td>}
                      {visCols.has("marca")    &&<td style={td}>{a.atributos?.marca||"—"}</td>}
                      {visCols.has("ranking")  &&<td style={td}>{a.ranking_score?Number(a.ranking_score).toFixed(2):"—"}</td>}
                      {visCols.has("ctr")      &&<td style={td}>{ctr}%</td>}
                      {visCols.has("baja")     &&<td style={td}>{fmt(a.baja_prevista||a.deleted_at)}</td>}
                      {visCols.has("mkt1")     &&<td style={{...td,textAlign:"center"}}><input type="checkbox" checked={false} style={{accentColor:color}} onChange={()=>{}}/></td>}
                      {visCols.has("mkt2")     &&<td style={{...td,textAlign:"center"}}><input type="checkbox" checked={false} style={{accentColor:color}} onChange={()=>{}}/></td>}
                      <td style={td}>
                        <button onClick={()=>toggleExpand(a.id)} style={{
                          background:"none",border:"none",cursor:"pointer",
                          color:isExp?color:"#CBD5E1",fontSize:"13px",padding:"2px 4px",
                          transform:isExp?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",
                        }}>▼</button>
                      </td>
                    </tr>
                    {isExp&&renderExpanded(a,false)}
                  </>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
