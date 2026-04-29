import { useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "../engine/useEditorStore";
import { buildCSSFilter } from "../engine/filters";

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onRender?: () => void;
}

export default function EditCanvas({ canvasRef, onRender }: Props) {
  const store   = useEditorStore();
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef<number | null>(null);

  const render = useCallback(() => {
    const src = store.src;
    const c   = canvasRef.current;
    const w   = wrapRef.current;
    if (!src || !c || !w) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const r   = store.fineRotation * Math.PI / 180;
      const cos = Math.abs(Math.cos(r)), sin = Math.abs(Math.sin(r));
      const rW  = src.width * cos + src.height * sin;
      const rH  = src.width * sin + src.height * cos;
      const maxW = w.clientWidth  - 24;
      const maxH = w.clientHeight - 24;
      const scale = Math.min(maxW / rW, maxH / rH, 1) * store.zoom;
      c.width  = Math.round(rW * scale);
      c.height = Math.round(rH * scale);
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.save();
      ctx.translate(c.width / 2, c.height / 2);
      if (store.flipH) ctx.scale(-1, 1);
      if (store.flipV) ctx.scale(1, -1);
      ctx.rotate(store.rotation * Math.PI / 180 + r);
      ctx.filter = buildCSSFilter(store);
      ctx.drawImage(src, -src.width * scale / 2, -src.height * scale / 2, src.width * scale, src.height * scale);
      ctx.restore();
      if (onRender) onRender();
    });
  }, [store, canvasRef, onRender]);

  useEffect(() => { render(); }, [
    store.src, store.brightness, store.contrast, store.exposure,
    store.saturation, store.temperature, store.tint, store.sharpness,
    store.blur, store.rotation, store.fineRotation,
    store.flipH, store.flipV, store.zoom, render
  ]);

  return (
    <div ref={wrapRef} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:"12px" }}>
      {!store.src ? (
        <div style={{ color:"#aaa", fontSize:"12px", textAlign:"center" }}>
          <div style={{ fontSize:"28px", marginBottom:"8px" }}>✏️</div>
          Carga una imagen para editar
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", borderRadius:"6px" }}
        />
      )}
    </div>
  );
}