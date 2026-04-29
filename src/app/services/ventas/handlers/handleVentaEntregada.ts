import { supabase }         from "../../../utils/supabase/client";
import { generarDocumento } from "../generarDocumento";

export async function handleVentaEntregada(ventaId: string): Promise<void> {
  const { data: venta } = await supabase
    .from("ventas").select("*").eq("id", ventaId).single();
  if (!venta) throw new Error("Venta no encontrada");

  const acuseUrl = await generarDocumento(ventaId, "acuse_recibo", {
    comprador:   venta.comprador_id,
    articulo:    venta.articulo_id,
    entregadoEn: new Date().toISOString(),
  });

  await supabase.from("ventas").update({
    acuse_url:   acuseUrl,
    entregado_en: new Date().toISOString(),
    cerrado_en:   new Date().toISOString(),
  }).eq("id", ventaId);

  // Disparar calificación pendiente
  await supabase.from("reviews").insert({
    venta_id:     ventaId,
    comprador_id: venta.comprador_id,
    vendedor_id:  venta.vendedor_id,
    articulo_id:  venta.articulo_id,
    status:       "pendiente",
  }).onConflict("venta_id").ignore();

  console.log(`[handleVentaEntregada] acuse generado: ${acuseUrl}`);
}