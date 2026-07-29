import { auth } from "@/lib/firebase"
import { WatchOrder } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await auth?.currentUser?.getIdToken()
  if (!token) throw new Error("User not authenticated")
  return { "Authorization": `Bearer ${token}` }
}

function normalizeWatchOrder(raw: any): WatchOrder {
  return {
    ...raw,
    id: raw._id || raw.id,
    items: (raw.items || []).map((item: any) => ({
      ...item,
      id: item._id || item.id
    })).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
  }
}

export async function getAllWatchOrders(): Promise<WatchOrder[]> {
  const res = await fetch(`${API_BASE_URL}/watch-orders`)
  if (!res.ok) throw new Error("Failed to fetch watch orders")
  const data = await res.json()
  return data.map(normalizeWatchOrder)
}

export async function getWatchOrder(id: string): Promise<WatchOrder> {
  const res = await fetch(`${API_BASE_URL}/watch-orders/${id}`)
  if (!res.ok) throw new Error("Failed to fetch watch order")
  const data = await res.json()
  return normalizeWatchOrder(data)
}

export async function getWatchOrdersForMovie(imdbId: string): Promise<WatchOrder[]> {
  const res = await fetch(`${API_BASE_URL}/watch-orders/movie/${imdbId}`)
  if (!res.ok) throw new Error("Failed to fetch watch orders for movie")
  const data = await res.json()
  return data.map(normalizeWatchOrder)
}

export async function createWatchOrder(data: Partial<WatchOrder>): Promise<WatchOrder> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/watch-orders`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create watch order")
  const json = await res.json()
  return normalizeWatchOrder(json)
}

export async function updateWatchOrder(id: string, data: Partial<WatchOrder>): Promise<WatchOrder> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/watch-orders/${id}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update watch order")
  const json = await res.json()
  return normalizeWatchOrder(json)
}

export async function deleteWatchOrder(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/watch-orders/${id}`, {
    method: "DELETE",
    headers,
  })
  if (!res.ok) throw new Error("Failed to delete watch order")
}
