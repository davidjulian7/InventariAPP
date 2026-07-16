import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { action, store_id, sale_id, start_date, end_date } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    switch (action) {
      case 'daily_summary': {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { data: sales } = await supabaseClient
          .from('sales')
          .select('*')
          .eq('store_id', store_id)
          .gte('created_at', today.toISOString())

        const total = sales?.reduce((s: number, r: any) => s + Number(r.total), 0) || 0
        const count = sales?.length || 0
        const byMethod: Record<string, number> = {}
        for (const s of sales || []) {
          byMethod[s.metodo_pago] = (byMethod[s.metodo_pago] || 0) + Number(s.total)
        }

        return new Response(JSON.stringify({
          total,
          count,
          promedio: count > 0 ? total / count : 0,
          por_metodo: byMethod,
        }), { headers: { 'Content-Type': 'application/json' } })
      }

      case 'top_products': {
        const { data: items } = await supabaseClient
          .from('sale_items')
          .select(`
            nombre,
            qty,
            subtotal,
            venta:sales!inner(store_id, created_at)
          `)
          .eq('venta.store_id', store_id)
          .gte('venta.created_at', start_date)
          .lte('venta.created_at', end_date)
          .order('subtotal', { ascending: false })
          .limit(10)

        const grouped: Record<string, { nombre: string; qty: number; total: number }> = {}
        for (const item of items || []) {
          if (!grouped[item.nombre]) grouped[item.nombre] = { nombre: item.nombre, qty: 0, total: 0 }
          grouped[item.nombre].qty += Number(item.qty)
          grouped[item.nombre].total += Number(item.subtotal)
        }

        return new Response(JSON.stringify({
          products: Object.values(grouped).sort((a, b) => b.total - a.total),
        }), { headers: { 'Content-Type': 'application/json' } })
      }

      default:
        return new Response(JSON.stringify({ error: 'Accion no valida' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
