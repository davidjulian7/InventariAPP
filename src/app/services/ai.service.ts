import { apiFetch } from './api'
import type { AIMessage } from '../types'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-1.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const SYSTEM_PROMPT = `Eres un asistente experto en retail y abarrotes que ayuda a dueños de tiendas a gestionar su negocio. Hablas español. 
Analizas datos de ventas, inventario y proveedores para dar recomendaciones accionables.
Sé conciso, práctico y directo. Tus respuestas deben ser cortas (máximo 3 párrafos).`

interface StoreContext {
  totalProducts: number
  lowStockCount: number
  totalSalesCount: number
  totalRevenue: number
  lowStock: { nombre: string; cantidad: number; stockMin: number }[]
}

async function fetchContext(storeId: number): Promise<StoreContext> {
  return apiFetch<StoreContext>('/ai/context')
}

function buildContext(ctx: StoreContext): string {
  return `Contexto actual de la tienda:
- Productos en catálogo: ${ctx.totalProducts}
- Productos con stock bajo: ${ctx.lowStockCount}
- Ventas totales registradas: ${ctx.totalSalesCount}
- Ingresos totales: $${ctx.totalRevenue.toLocaleString()}
- Productos con bajo stock: ${ctx.lowStock.map(p => `${p.nombre} (${p.cantidad} uds)`).join(', ') || 'Ninguno'}`
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
    const ctx = await fetchContext(storeId)
    const context = buildContext(ctx)
    const history = messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n')
    const prompt = `${SYSTEM_PROMPT}\n\n${context}\n\nHistorial del chat:\n${history}\n\nAsistente:`
    return callGemini(prompt)
  }

  static async getInsights(storeId: number): Promise<{ titulo: string; desc: string; tipo: string }[]> {
    if (!GEMINI_API_KEY) {
      return [
        { titulo: 'Configura IA', desc: 'Agrega VITE_GEMINI_API_KEY en .env para obtener insights.', tipo: 'alert' },
        { titulo: 'Demo activa', desc: 'Los datos se guardan en la base de datos local (SQLite).', tipo: 'star' },
      ]
    }

    const ctx = await fetchContext(storeId)
    const context = buildContext(ctx)
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
    const suggestions = await apiFetch<{ producto: string; prioridad: string; razon: string }[]>('/ai/restock-suggestions')

    if (suggestions.length === 0) {
      return [{ producto: 'Todo en stock', prioridad: 'baja', razon: 'No hay productos por reabastecer.' }]
    }

    return suggestions
  }

  static async saveChat(userId: number, title: string, messages: AIMessage[]) {
    return apiFetch<{ id: number; title: string; messages: { role: string; content: string }[] }>('/ai/chats', {
      method: 'POST',
      body: JSON.stringify({ title, messages }),
    })
  }

  static async getChatHistory(userId: number) {
    return apiFetch<{ id: number; title: string; messages: { role: string; content: string }[] }[]>('/ai/chats')
  }
}