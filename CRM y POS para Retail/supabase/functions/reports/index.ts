import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { store_id, format, start_date, end_date } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: sales } = await supabaseClient
      .from('sales')
      .select('*, items:sale_items(*)')
      .eq('store_id', store_id)
      .gte('created_at', start_date)
      .lte('created_at', end_date)
      .order('created_at', { ascending: false })

    const totalSales = sales?.reduce((s: number, r: any) => s + Number(r.total), 0) || 0
    const totalTransactions = sales?.length || 0
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0

    const { data: products } = await supabaseClient
      .from('products')
      .select('*')
      .eq('store_id', store_id)

    const lowStock = products?.filter((p: any) => p.existencia < p.stock_min).length || 0
    const outOfStock = products?.filter((p: any) => p.existencia <= 0).length || 0

    if (format === 'pdf') {
      const html = `
        <html>
        <head><meta charset="utf-8"><title>Reporte de Ventas</title>
        <style>
          body { font-family: Arial; padding: 40px; }
          h1 { color: #628141; }
          .kpi { display: flex; gap: 20px; margin: 20px 0; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 8px; flex: 1; }
          .card h3 { margin: 0 0 5px; font-size: 12px; color: #666; }
          .card .value { font-size: 24px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
          th { background: #628141; color: white; }
        </style></head>
        <body>
          <h1>Reporte de Ventas</h1>
          <p>Periodo: ${start_date} - ${end_date}</p>
          <div class="kpi">
            <div class="card"><h3>Ventas Totales</h3><div class="value">$${totalSales.toLocaleString()}</div></div>
            <div class="card"><h3>Transacciones</h3><div class="value">${totalTransactions}</div></div>
            <div class="card"><h3>Ticket Promedio</h3><div class="value">$${avgTicket.toFixed(2)}</div></div>
          </div>
          <div class="kpi">
            <div class="card"><h3>Productos con Stock Bajo</h3><div class="value">${lowStock}</div></div>
            <div class="card"><h3>Productos Agotados</h3><div class="value">${outOfStock}</div></div>
          </div>
          ${sales && sales.length > 0 ? `
          <h2>Ventas Recientes</h2>
          <table>
            <tr><th>Folio</th><th>Cliente</th><th>Total</th><th>Metodo</th><th>Fecha</th></tr>
            ${sales.slice(0, 20).map((s: any) => `
              <tr>
                <td>${s.folio}</td>
                <td>${s.cliente}</td>
                <td>$${Number(s.total).toFixed(2)}</td>
                <td>${s.metodo_pago}</td>
                <td>${new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </table>` : ''}
        </body></html>
      `

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Excel-like CSV format
    if (format === 'excel') {
      let csv = 'Folio,Cliente,Total,Metodo Pago,Fecha\n'
      for (const sale of sales || []) {
        csv += `${sale.folio},"${sale.cliente}",${sale.total},${sale.metodo_pago},${sale.created_at}\n`
      }

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=reporte_ventas.csv',
        },
      })
    }

    return new Response(JSON.stringify({
      total_sales: totalSales,
      total_transactions: totalTransactions,
      avg_ticket: avgTicket,
      low_stock: lowStock,
      out_of_stock: outOfStock,
      sales: sales || [],
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
