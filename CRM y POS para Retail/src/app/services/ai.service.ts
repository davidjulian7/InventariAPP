import { localDb } from '../lib/db'
import type { AIMessage } from '../types'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-1.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const SYSTEM_PROMPT = `Eres un asistente experto en retail y abarrotes que ayuda a dueños de tiendas a gestionar su negocio. Hablas español. 
Analizas datos de ventas, inventario y proveedores para dar recomendaciones accionables.
Sé conciso, práctico y directo. Tus respuestas deben ser cortas (máximo 3 párrafos).`

function buildContext(storeId: number): string {
  const invs = localDb.query<any>('inventario', (i: any) => i.tienda_id === storeId)
  const productos = invs.map((i: any) => {
    const p = localDb.getById<any>('producto', i.producto_id)
    return p ? { ...p, cantidad: i.cantidad, stock_minimo: i.stock_minimo, precio_venta: i.precio_venta } : null
  }).filter(Boolean)

  const lowStock = productos.filter((p: any) => p.cantidad < p.stock_minimo)
  const ventas = localDb.getAll<any>('venta').filter((v: any) => v.tienda_id === storeId)
  const totalSales = ventas.reduce((sum: number, v: any) => sum + Number(v.total), 0)

  return `Contexto actual de la tienda:
- Productos en catálogo: ${productos.length}
- Productos con stock bajo: ${lowStock.length}
- Ventas totales registradas: ${ventas.length}
- Ingresos totales: $${totalSales.toLocaleString()}
- Productos con bajo stock: ${lowStock.map((p: any) => `${p.nombre} (${p.cantidad} uds)`).join(', ') || 'Ninguno'}`
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'Configura VITE_GEMINI_API_KEY en tu archivo .env para usar el asistente IA.'
  }

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.'
}

export class AIService {
  static async sendMessage(messages: AIMessage[], storeId: number): Promise<string> {
    const context = buildContext(storeId)
    const history = messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n')
    const prompt = `${SYSTEM_PROMPT}\n\n${context}\n\nHistorial del chat:\n${history}\n\nAsistente:`
    return callGemini(prompt)
  }

  static async getInsights(storeId: number): Promise<{ titulo: string; desc: string; tipo: string }[]> {
    if (!GEMINI_API_KEY) {
      return [
        { titulo: 'Configura IA', desc: 'Agrega VITE_GEMINI_API_KEY en .env para obtener insights.', tipo: 'alert' },
        { titulo: 'Demo activa', desc: 'Los datos se guardan localmente en el navegador.', tipo: 'star' },
      ]
    }

    const context = buildContext(storeId)
    const prompt = `${SYSTEM_PROMPT}\n\n${context}\n\nGenera 3 insights de negocio en formato JSON exacto (sin markdown): 
[{ "titulo": "...", "desc": "...", "tipo": "trending_up|alert|star|zap" }]`

    try {
      const text = await callGemini(prompt)
      const cleaned = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      return Array.isArray(parsed) ? parsed.slice(0, 3) : []
    } catch {
      return [
        { titulo: 'Análisis no disponible', desc: 'Intenta de nuevo más tarde.', tipo: 'alert' },
      ]
    }
  }

  static async getRestockSuggestions(storeId: number): Promise<{ producto: string; prioridad: string; razon: string }[]> {
    const invs = localDb.query<any>('inventario', (i: any) =>
      i.tienda_id === storeId && i.cantidad <= i.stock_minimo
    )
    const suggestions = invs.map((i: any) => {
      const p = localDb.getById<any>('producto', i.producto_id)
      return {
        producto: p ? p.nombre : `Producto #${i.producto_id}`,
        prioridad: i.cantidad === 0 ? 'alta' : i.cantidad < i.stock_minimo / 2 ? 'media' : 'baja',
        razon: `Stock actual: ${i.cantidad} / Mínimo: ${i.stock_minimo}`,
      }
    })

    if (suggestions.length === 0) {
      return [{ producto: 'Todo en stock', prioridad: 'baja', razon: 'No hay productos por reabastecer.' }]
    }

    return suggestions
  }

  static async saveChat(userId: number, title: string, messages: AIMessage[]) {
    const chat = localDb.insert('ai_chats', { title, user_id: userId })
    for (const m of messages) {
      localDb.insert('ai_messages', {
        chat_id: chat.id,
        role: m.role,
        content: m.content,
      })
    }
    return chat
  }

  static async getChatHistory(userId: number) {
    const chats = localDb.query<any>('ai_chats', (c: any) => c.user_id === userId)
      .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    return chats.map((chat: any) => ({
      ...chat,
      messages: localDb.query<any>('ai_messages', (m: any) => m.chat_id === chat.id),
    }))
  }
}
