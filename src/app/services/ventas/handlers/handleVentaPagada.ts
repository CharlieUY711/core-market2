import { supabase }         from "../../../utils/supabase/client";
import { generarDocumento } from "../generarDocumento";

export async function handleVentaPagada(ventaId: string): Promise<void> {
  const { data: venta } = await supabase
    .from("ventas").select("*").eq("id", ventaId).single();
  if (!venta) throw new Error("Venta no encontrada");

  const ticketUrl = await generarDocumento(ventaId, "ticket", {
    monto:       venta.monto,
    comprador:   venta.comprador_id,
    articulo:    venta.articulo_id,
    fechaPago:   new Date().toISOString(),
  });

  await supabase.from("ventas").update({
    ticket_url: ticketUrl,
    pagado_en:  new Date().toISOString(),
  }).eq("id", ventaId);

  console.log(`[handleVentaPagada] ticket generado: ${ticketUrl}`);
}