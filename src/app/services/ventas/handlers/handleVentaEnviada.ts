import { supabase }         from "../../../utils/supabase/client";
import { generarDocumento } from "../generarDocumento";

export async function handleVentaEnviada(ventaId: string): Promise<void> {
  const { data: venta } = await supabase
    .from("ventas").select("*").eq("id", ventaId).single();
  if (!venta) throw new Error("Venta no encontrada");

  const etiquetaUrl = await generarDocumento(ventaId, "etiqueta_envio", {
    comprador: venta.comprador_id,
    vendedor:  venta.vendedor_id,
    articulo:  venta.articulo_id,
    fecha:     new Date().toISOString(),
  });

  await supabase.from("ventas").update({
    etiqueta_url: etiquetaUrl,
    enviado_en:   new Date().toISOString(),
  }).eq("id", ventaId);

  console.log(`[handleVentaEnviada] etiqueta generada: ${etiquetaUrl}`);
}