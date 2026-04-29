import { supabase }                from "../../utils/supabase/client";
import { VentaEstado, CambioEstadoResult } from "./types";
import { handleVentaPagada }       from "./handlers/handleVentaPagada";
import { handleVentaPreparando }   from "./handlers/handleVentaPreparando";
import { handleVentaEnviada }      from "./handlers/handleVentaEnviada";
import { handleVentaEntregada }    from "./handlers/handleVentaEntregada";

const TRANSICIONES_VALIDAS: Record<VentaEstado, VentaEstado[]> = {
  pendiente:  ["pagado",     "cancelado"],
  pagado:     ["preparando", "cancelado"],
  preparando: ["enviado",    "cancelado"],
  enviado:    ["entregado"],
  entregado:  [],
  cancelado:  [],
};

export async function cambiarEstadoVenta(
  ventaId:     string,
  nuevoEstado: VentaEstado
): Promise<CambioEstadoResult> {
  try {
    // 1. Obtener estado actual
    const { data: venta, error: fetchErr } = await supabase
      .from("ventas").select("estado").eq("id", ventaId).single();
    if (fetchErr || !venta) throw new Error("Venta no encontrada");

    const estadoActual = venta.estado as VentaEstado;

    // 2. Validar transición
    const validos = TRANSICIONES_VALIDAS[estadoActual];
    if (!validos.includes(nuevoEstado)) {
      throw new Error(`Transición inválida: ${estadoActual} → ${nuevoEstado}`);
    }

    // 3. Actualizar estado
    const { error: updateErr } = await supabase
      .from("ventas")
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq("id", ventaId);
    if (updateErr) throw updateErr;

    // 4. Disparar handler
    switch (nuevoEstado) {
      case "pagado":     await handleVentaPagada(ventaId);     break;
      case "preparando": await handleVentaPreparando(ventaId); break;
      case "enviado":    await handleVentaEnviada(ventaId);    break;
      case "entregado":  await handleVentaEntregada(ventaId);  break;
      case "cancelado":
        await supabase.from("ventas")
          .update({ cancelado_en: new Date().toISOString() })
          .eq("id", ventaId);
        break;
    }

    console.log(`[cambiarEstadoVenta] ${ventaId}: ${estadoActual} → ${nuevoEstado}`);
    return { ok: true, estado: nuevoEstado };

  } catch (e: any) {
    console.error("[cambiarEstadoVenta]", e);
    return { ok: false, estado: "pendiente", error: e.message };
  }
}