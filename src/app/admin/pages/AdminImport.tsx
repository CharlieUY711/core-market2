import { useState, useRef } from "react";
import { supabase } from "../../../utils/supabase/client";

const ACCENT = "#FF7A00";
const BLUE   = "#0F3460";
const GREEN  = "#1DC878";

type Source = "url" | "pdf" | "csv";
type JobStatus = "idle"|"running"|"done"|"error";

interface ImportJob {
  id: string;
  source: Source;
  input: string;
  status: JobStatus;
  total: number;
  processed: number;
  errors: string[];
  createdAt: Date;
}

export default function AdminImport() {
  const [tab, setTab]         = useState<Source>("url");
  const [url, setUrl]         = useState("");
  const [file, setFile]       = useState<File|null>(null);
  const [jobs, setJobs]       = useState<ImportJob[]>([]);
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [toast, setToast]     = useState<{text:string;ok:boolean}|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = (text:string, ok=true) => {
    setToast({text,ok}); setTimeout(()=>setToast(null),4000);
  };

  const addJob = (source: Source, input: string): ImportJob => {
    const job: ImportJob = {
      id: crypto.randomUUID(), source, input,
      status:"running", total:0, processed:0, errors:[], createdAt:new Date(),
    };
    setJobs(p => [job, ...p]);
    return job;
  };

  const updateJob = (id:string, patch: Partial<ImportJob>) => {
    setJobs(p => p.map(j => j.id===id ? {...j,...patch} : j));
  };

  // ── URL Import ────────────────────────────────────────────────
  const handleUrlImport = async () => {
    if (!url.trim()) return;
    setRunning(true);
    const job = addJob("url", url);

    try {
      // Llamar al endpoint de ingestion (Edge Function o servicio externo)
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Por ahora simula el pipeline — luego conecta al edge function
      await new Promise(r => setTimeout(r, 1500));
      
      const mockVariants = [
        { sku:`SCR-${Date.now()}-1`, nombre:"Producto scrapeado 1", precio:1000, moneda:"UYU", stock:10, atributos:{color:"Rojo"} },
        { sku:`SCR-${Date.now()}-2`, nombre:"Producto scrapeado 2", precio:1500, moneda:"UYU", stock:5,  atributos:{color:"Azul"} },
      ];
      setPreview(mockVariants);
      updateJob(job.id, { status:"done", total:mockVariants.length, processed:mockVariants.length });
      notify(`✓ ${mockVariants.length} variantes detectadas — revisá el preview`);
    } catch(e:any) {
      updateJob(job.id, { status:"error", errors:[e.message] });
      notify(e.message, false);
    } finally {
      setRunning(false);
    }
  };

  // ── PDF Import ────────────────────────────────────────────────
  const handlePdfImport = async () => {
    if (!file) return;
    setRunning(true);
    const job = addJob("pdf", file.name);

    try {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Subir PDF a Supabase Storage
      const path = `imports/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("biblioteca")
        .upload(path, file, { upsert:true });

      if (uploadError) throw uploadError;

      // Simula parsing — luego conecta al edge function
      await new Promise(r => setTimeout(r, 2000));
      
      const mockVariants = [
        { sku:`PDF-${Date.now()}-1`, nombre:"Producto PDF 1", precio:500,  moneda:"UYU", stock:20, atributos:{talla:"M"} },
        { sku:`PDF-${Date.now()}-2`, nombre:"Producto PDF 2", precio:800,  moneda:"UYU", stock:15, atributos:{talla:"L"} },
        { sku:`PDF-${Date.now()}-3`, nombre:"Producto PDF 3", precio:1200, moneda:"UYU", stock:8,  atributos:{talla:"XL"} },
      ];
      setPreview(mockVariants);
      updateJob(job.id, { status:"done", total:mockVariants.length, processed:mockVariants.length });
      notify(`✓ ${mockVariants.length} variantes extraídas de ${file.name}`);
    } catch(e:any) {
      updateJob(job.id, { status:"error", errors:[e.message] });
      notify(e.message, false);
    } finally {
      setRunning(false);
    }
  };

  // ── Confirmar ingesta a DB ────────────────────────────────────
  const handleIngest = async () => {
    if (!preview.length) return;
    setRunning(true);
    try {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      let ok = 0; const errors: string[] = [];

      for (const v of preview) {
        // Crear articulo base si no existe
        const articuloBase = {
          vendedor_id: user.id,
          nombre: v.nombre,
          tipo: "market" as const,
          status: "draft",
          precio: v.precio,
          moneda: v.moneda,
          stock: v.stock,
        };
        const { data: art, error: artError } = await supabase
          .from("articulos")
          .insert(articuloBase)
          .select("id")
          .single();

        if (artError) { errors.push(`${v.sku}: ${artError.message}`); continue; }

        // Crear variante
        const { error: varError } = await supabase
          .from("articulo_variantes")
          .upsert({
            articulo_id: art.id,
            sku: v.sku,
            nombre: v.nombre,
            precio: v.precio,
            moneda: v.moneda,
            stock: v.stock,
            atributos: v.atributos || {},
            status: "active",
          }, { onConflict: "sku" });

        if (varError) errors.push(`variante ${v.sku}: ${varError.message}`);
        else ok++;
      }

      if (errors.length > 0) notify(`${ok} ingresados, ${errors.length} errores`, false);
      else notify(`✓ ${ok} variantes ingresadas correctamente`);
      
      setPreview([]);
    } catch(e:any) {
      notify(e.message, false);
    } finally {
      setRunning(false);
    }
  };

  const inp: React.CSSProperties = {
    width:"100%", padding:"0.5rem 0.75rem", border:"1.5px solid #E5E7EB",
    borderRadius:8, fontSize:"0.82rem", outline:"none", fontFamily:"DM Sans,sans-serif",
    boxSizing:"border-box",
  };
  const btn = (bg:string, dis=false): React.CSSProperties => ({
    padding:"0.55rem 1.25rem", background:dis?"#E5E7EB":bg, color:dis?"#9CA3AF":"#fff",
    border:"none", borderRadius:8, fontWeight:700, fontSize:"0.82rem",
    cursor:dis?"not-allowed":"pointer", transition:"all .15s",
  });
  const thB: React.CSSProperties = {
    padding:"0.4rem 0.65rem", textAlign:"left", fontSize:"10px", fontWeight:700,
    color:"#6B7280", textTransform:"uppercase", letterSpacing:".05em",
    borderBottom:"2px solid #F3F4F6", background:"#FAFAFA",
  };
  const td: React.CSSProperties = {
    padding:"0.45rem 0.65rem", fontSize:"0.8rem", color:"#374151",
    borderBottom:"1px solid #F9FAFB",
  };

  const statusColor = (s:JobStatus) =>
    s==="done"?GREEN : s==="error"?"#EF4444" : s==="running"?ACCENT : "#9CA3AF";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem",height:"100%"}}>

      {toast&&(
        <div style={{position:"fixed",bottom:"1.5rem",right:"1.5rem",zIndex:9999,
          padding:"0.75rem 1.25rem",borderRadius:10,fontWeight:600,fontSize:"0.875rem",
          background:toast.ok?"#f0fdf4":"#fef2f2",color:toast.ok?"#166534":"#dc2626",
          border:`1px solid ${toast.ok?"#6BB87A":"#ef4444"}`,
          boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>
          {toast.text}
        </div>
      )}

      {/* HEADER */}
      <div>
        <h2 style={{margin:0,fontSize:"1.1rem",fontWeight:800,color:"#111"}}>Importar Catálogo</h2>
        <p style={{margin:"4px 0 0",fontSize:"0.78rem",color:"#9CA3AF"}}>
          Ingresá productos desde URL, PDF o CSV — se crean como variantes en tu catálogo
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",flex:1,minHeight:0}}>

        {/* PANEL IZQ: INPUT */}
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>

          {/* Tabs fuente */}
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #EAECF0",overflow:"hidden"}}>
            <div style={{display:"flex",borderBottom:"2px solid #F0F0F0"}}>
              {([["url","🌐 URL"],["pdf","📄 PDF"],["csv","📊 CSV"]] as [Source,string][]).map(([k,l])=>(
                <button key={k} onClick={()=>setTab(k)} style={{
                  flex:1,padding:"0.65rem",border:"none",cursor:"pointer",
                  fontSize:"0.82rem",fontWeight:tab===k?700:500,
                  background:tab===k?"#fff":"#FAFAFA",
                  color:tab===k?ACCENT:"#6B7280",
                  borderBottom:tab===k?`2.5px solid ${ACCENT}`:"2.5px solid transparent",
                  marginBottom:"-2px",transition:"all .1s",
                }}>{l}</button>
              ))}
            </div>

            <div style={{padding:"1.25rem"}}>
              {tab==="url"&&(
                <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                  <div>
                    <div style={{fontSize:"10px",color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>
                      URL del catálogo
                    </div>
                    <input style={inp} value={url} placeholder="https://tienda.com/productos"
                      onChange={e=>setUrl(e.target.value)}/>
                  </div>
                  <div style={{fontSize:"11px",color:"#9CA3AF",lineHeight:1.5}}>
                    Soporta: Shopify, WooCommerce, HTML estático, sitios con JS
                  </div>
                  <button onClick={handleUrlImport} disabled={!url.trim()||running}
                    style={btn(ACCENT,!url.trim()||running)}>
                    {running?"Procesando...":"🌐 Scrapear URL"}
                  </button>
                </div>
              )}

              {tab==="pdf"&&(
                <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                  <div
                    onClick={()=>fileRef.current?.click()}
                    style={{border:`2px dashed ${file?ACCENT:"#E5E7EB"}`,borderRadius:10,
                      padding:"2rem",textAlign:"center",cursor:"pointer",
                      background:file?"rgba(255,122,0,.04)":"#FAFAFA",transition:"all .15s"}}>
                    {file
                      ? <div><div style={{fontSize:"2rem"}}>📄</div>
                          <div style={{fontWeight:700,color:ACCENT,marginTop:4}}>{file.name}</div>
                          <div style={{fontSize:"11px",color:"#9CA3AF"}}>
                            {(file.size/1024/1024).toFixed(2)} MB
                          </div>
                        </div>
                      : <div><div style={{fontSize:"2.5rem",color:"#D1D5DB"}}>📁</div>
                          <div style={{fontWeight:600,color:"#374151",marginTop:4}}>
                            Click para seleccionar PDF
                          </div>
                          <div style={{fontSize:"11px",color:"#9CA3AF",marginTop:2}}>
                            PDF con texto o escaneado (OCR automático)
                          </div>
                        </div>
                    }
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf"
                    style={{display:"none"}}
                    onChange={e=>setFile(e.target.files?.[0]||null)}/>
                  <button onClick={handlePdfImport} disabled={!file||running}
                    style={btn(ACCENT,!file||running)}>
                    {running?"Procesando...":"📄 Importar PDF"}
                  </button>
                </div>
              )}

              {tab==="csv"&&(
                <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                  <div style={{fontSize:"11px",color:"#9CA3AF",lineHeight:1.6,
                    padding:"0.75rem",background:"#F8F9FB",borderRadius:8}}>
                    <b style={{color:"#374151"}}>Formato esperado:</b><br/>
                    <code style={{fontSize:"10px"}}>
                      sku, nombre, precio, moneda, stock, atributos_json
                    </code>
                  </div>
                  <button onClick={()=>fileRef.current?.click()} style={btn(BLUE)}>
                    📊 Seleccionar CSV
                  </button>
                  <input ref={fileRef} type="file" accept=".csv"
                    style={{display:"none"}}
                    onChange={e=>setFile(e.target.files?.[0]||null)}/>
                </div>
              )}
            </div>
          </div>

          {/* Historial de jobs */}
          {jobs.length>0&&(
            <div style={{background:"#fff",borderRadius:12,border:"1px solid #EAECF0",overflow:"hidden"}}>
              <div style={{padding:"0.75rem 1rem",borderBottom:"1px solid #F0F0F0",
                fontSize:"11px",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase"}}>
                Historial
              </div>
              <div style={{maxHeight:200,overflowY:"auto"}}>
                {jobs.map(j=>(
                  <div key={j.id} style={{padding:"0.6rem 1rem",borderBottom:"1px solid #F9FAFB",
                    display:"flex",alignItems:"center",gap:"0.5rem"}}>
                    <span style={{fontSize:"12px",
                      color:statusColor(j.status),fontWeight:700,minWidth:64}}>
                      {j.status==="running"?"⏳ ":j.status==="done"?"✓ ":j.status==="error"?"✗ ":""}
                      {j.status}
                    </span>
                    <span style={{flex:1,fontSize:"0.78rem",color:"#374151",
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {j.source==="url"?"🌐":j.source==="pdf"?"📄":"📊"} {j.input}
                    </span>
                    {j.status==="done"&&(
                      <span style={{fontSize:"11px",color:GREEN,fontWeight:700}}>
                        {j.processed} items
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PANEL DER: PREVIEW */}
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #EAECF0",
          display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"0.75rem 1rem",borderBottom:"1px solid #F0F0F0",
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <span style={{fontSize:"11px",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase"}}>
                Preview de variantes
              </span>
              {preview.length>0&&(
                <span style={{marginLeft:8,fontSize:"11px",fontWeight:700,color:ACCENT}}>
                  {preview.length} detectadas
                </span>
              )}
            </div>
            {preview.length>0&&(
              <button onClick={handleIngest} disabled={running}
                style={{...btn(GREEN,running),padding:"0.35rem 0.85rem",fontSize:"0.75rem"}}>
                {running?"Ingresando...":"✓ Ingresar al catálogo"}
              </button>
            )}
          </div>

          {preview.length===0?(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
              flexDirection:"column",gap:"0.5rem",color:"#9CA3AF"}}>
              <div style={{fontSize:"3rem"}}>🔍</div>
              <div style={{fontWeight:600,color:"#374151"}}>Sin preview aún</div>
              <div style={{fontSize:"0.78rem",textAlign:"center",maxWidth:200}}>
                Ingresá una URL o subí un PDF para ver las variantes detectadas
              </div>
            </div>
          ):(
            <div style={{overflowY:"auto",flex:1}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead style={{position:"sticky",top:0}}>
                  <tr>
                    <th style={thB}>SKU</th>
                    <th style={thB}>Nombre</th>
                    <th style={thB}>Precio</th>
                    <th style={thB}>Stock</th>
                    <th style={thB}>Atributos</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((v,i)=>(
                    <tr key={i} style={{background:i%2===0?"#fff":"#FAFAFA"}}>
                      <td style={{...td,fontFamily:"monospace",fontSize:"11px",color:BLUE,fontWeight:700}}>
                        {v.sku}
                      </td>
                      <td style={{...td,maxWidth:160,overflow:"hidden",
                        textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.nombre}</td>
                      <td style={{...td,fontWeight:700,color:ACCENT}}>
                        {v.moneda} {Number(v.precio).toLocaleString("es-UY")}
                      </td>
                      <td style={td}>{v.stock}</td>
                      <td style={td}>
                        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                          {Object.entries(v.atributos||{}).map(([k,val])=>(
                            <span key={k} style={{fontSize:"10px",padding:"1px 6px",
                              borderRadius:10,background:"#F3F4F6",color:"#374151"}}>
                              {k}: {String(val)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}