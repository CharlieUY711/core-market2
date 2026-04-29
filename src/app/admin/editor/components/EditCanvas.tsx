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

      let srcW = src.width, srcH = src.height;

      // Aplicar aspecto ratio si está definido
      if (store.aspectRatio) {
        const [rw, rh] = store.aspectRatio.split(":").map(Number);
        if (rw > 0 && rh > 0) {
          const imgAspect = srcW / srcH;
          const targetAspect = rw / rh;
          if (imgAspect > targetAspect) srcW = Math.round(srcH * targetAspect);
          else srcH = Math.round(srcW / targetAspect);
        }
      }

      const rW  = srcW * cos + srcH * sin;
      const rH  = srcW * sin + srcH * cos;
      const maxW = w.clientWidth  - 24;
      const maxH = w.clientHeight - 24;
      const scale = Math.min(maxW / rW, maxH / rH, 1) * store.zoom;
      c.width  = Math.round(rW * scale);
      c.height = Math.round(rH * scale);

      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, c.width, c.height);

      // Fondo
      if (store.bgColor && store.bgColor !== "transparent") {
        ctx.fillStyle = store.bgColor;
        ctx.fillRect(0, 0, c.width, c.height);
      }

      ctx.save();
      ctx.translate(c.width / 2, c.height / 2);
      if (store.flipH) ctx.scale(-1, 1);
      if (store.flipV) ctx.scale(1, -1);
      ctx.rotate(store.rotation * Math.PI / 180 + r);
      ctx.filter = buildCSSFilter(store);
      ctx.drawImage(src,
        (src.width - srcW) / 2, (src.height - srcH) / 2, srcW, srcH,
        -srcW * scale / 2, -srcH * scale / 2, srcW * scale, srcH * scale
      );
      ctx.restore();

      // Overlay herramienta activa
      if (store.activeTool === "crop") {
        ctx.strokeStyle = "#FF7A00";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(c.width * 0.1, c.height * 0.1, c.width * 0.8, c.height * 0.8);
        ctx.setLineDash([]);
        // Handles de esquina
        [[0.1,0.1],[0.9,0.1],[0.1,0.9],[0.9,0.9]].forEach(([fx,fy]) => {
          ctx.fillStyle = "#FF7A00";
          ctx.fillRect(c.width*fx-5, c.height*fy-5, 10, 10);
        });
      }

      if (onRender) onRender();
    });
  }, [store, canvasRef, onRender]);

  useEffect(() => { render(); }, [
    store.src, store.brightness, store.contrast, store.exposure,
    store.saturation, store.temperature, store.tint, store.sharpness,
    store.blur, store.rotation, store.fineRotation,
    store.flipH, store.flipV, store.zoom,
    store.bgColor, store.aspectRatio, store.activeTool, render
  ]);

  return (
    <div ref={wrapRef}
      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:"12px", position:"relative" }}>
      <canvas
        ref={canvasRef}
        style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", borderRadius:"6px", display: store.src ? "block" : "none" }}
      />
      {!store.src && (
        <div style={{ color:"#bbb", fontSize:"12px", textAlign:"center", position:"absolute" }}>
          <div style={{ fontSize:"32px", marginBottom:"8px" }}>✏️</div>
          Carga una imagen para editar
        </div>
      )}
    </div>
  );
}