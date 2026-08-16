import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

serve(async (req) => {
  try {
    const { messages, action, store_id } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    if (action === 'insights') {
      const { data: sales } = await supabaseClient
        .from('sales')
        .select('total')
        .eq('store_id', store_id)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

      const { data: products } = await supabaseClient
        .from('products')
        .select('*')
        .eq('store_id', store_id)

      const totalSales = sales?.reduce((s: number, r: any) => s + Number(r.total), 0) || 0
      const lowStock = products?.filter((p: any) => p.existencia < p.stock_min).length || 0
      const outOfStock = products?.filter((p: any) => p.existencia <= 0).length || 0

      return new Response(JSON.stringify({
        insights: [
          { titulo: 'Ventas semanales', desc: `$${totalSales.toLocaleString()} en los ultimos 7 dias`, tipo: 'trending_up' },
          { titulo: 'Stock bajo', desc: `${lowStock} productos requieren atencion`, tipo: 'alert' },
          { titulo: 'Agotados', desc: `${outOfStock} productos sin existencia`, tipo: 'alert' },
        ]
      }), { headers: { 'Content-Type': 'application/json' } })
    }

    if (action === 'restock') {
      const { data: products } = await supabaseClient
        .from('products')
        .select('*')
        .eq('store_id', store_id)
        .lt('existencia', supabaseClient.rpc as any)

      const suggestions = (products || [])
        .filter((p: any) => p.existencia < p.stock_min)
        .slice(0, 5)
        .map((p: any) => ({
          producto: p.nombre,
          prioridad: p.existencia <= 0 ? 'urgente' : 'alta',
          razon: p.existencia <= 0 ? 'Producto agotado' : `Stock por debajo del minimo (${p.existencia}/${p.stock_min})`
        }))

      return new Response(JSON.stringify({ suggestions }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Chat con Claude API
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({
        response: 'La API de IA no esta configurada. Contacta al administrador.'
      }), { headers: { 'Content-Type': 'application/json' } })
    }

    const systemPrompt = `Eres un asistente experto en retail y gestion de inventarios.
    Ayudas al dueño de una tienda de abarrotes a analizar sus datos de ventas, inventario y tendencias.
    Responde en español de forma clara y concisa. Usa datos numericos cuando sea relevante.`

    const claudeMessages = [
      { role: 'user', content: systemPrompt },
      ...messages.map((m: AIMessage) => ({ role: m.role, content: m.content }))
    ]

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: claudeMessages,
      }),
    })

    const claudeData = await claudeResponse.json()
    const response = claudeData.content?.[0]?.text || 'Lo siento, no pude procesar tu solicitud.'

    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
