import { auth } from "@/lib/firebase"
import { WatchOrder, WatchOrderItem, EnrichedWatchOrderItem } from "@/lib/types"
import { lookupMovie, lookupSeries } from "@/services/series-service"

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

// Enrich watch order items with live data from movies/series collections
export async function enrichWatchOrderItems(items: WatchOrderItem[]): Promise<EnrichedWatchOrderItem[]> {
  const enriched = await Promise.allSettled(
    items.map(async (item) => {
      try {
        if (item.type === 'series') {
          const data = await lookupSeries(item.itemId)
          return {
            ...item,
            title: data.title,
            year: data.year,
            endYear: data.endYear,
            posterUrl: data.posterUrl,
            totalSeasons: data.totalSeasons,
            totalEpisodes: data.totalEpisodes,
            totalRuntimeMinutes: data.totalRuntimeMinutes,
            imdbRating: data.imdbRating,
            isOngoing: data.isOngoing,
          }
        } else {
          const data = await lookupMovie(item.itemId)
          return {
            ...item,
            title: data.title,
            year: data.year,
            posterUrl: data.posterUrl,
            runtime: data.runtime,
            imdbRating: data.imdbRating,
          }
        }
      } catch {
        // Return item with whatever data it has (fallback)
        return { ...item }
      }
    })
  )
  return enriched.map(r => r.status === 'fulfilled' ? r.value : (r as any).value || {})
}
