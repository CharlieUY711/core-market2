import { useEffect, useRef } from "react";
import { useEditorStore } from "../engine/useEditorStore";

export default function OriginalCanvas() {
  const store     = useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const src = store.originalSrc;
    const c   = canvasRef.current;
    const w   = wrapRef.current;
    if (!src || !c || !w) return;
    const maxW  = w.clientWidth  - 24;
    const maxH  = w.clientHeight - 24;
    const scale = Math.min(maxW / src.width, maxH / src.height, 1);
    c.width  = Math.round(src.width  * scale);
    c.height = Math.round(src.height * scale);
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.filter = "none";
    ctx.drawImage(src, 0, 0, c.width, c.height);
  }, [store.originalSrc]);

  return (
    <div ref={wrapRef} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:"12px" }}>
      {!store.originalSrc ? (
        <div style={{ color:"#aaa", fontSize:"12px", textAlign:"center" }}>
          <div style={{ fontSize:"28px", marginBottom:"8px" }}>🖼</div>
          Original aparece aqui
        </div>
      ) : (
        <canvas ref={canvasRef} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", borderRadius:"6px" }} />
      )}
    </div>
  );
}