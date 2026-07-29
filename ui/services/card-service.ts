import { auth } from "@/lib/firebase"
import { CardInfo, UserCard, CardReport } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Normalize card data from backend (_id -> id, bank -> bankName aliases)
function normalizeCard(raw: any): CardInfo {
  return {
    ...raw,
    id: raw._id || raw.id,
    bankName: raw.bank || raw.bankName,
    offers: (raw.offers || []).map((o: any) => ({
      ...o,
      id: o._id || o.id
    }))
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await auth?.currentUser?.getIdToken()
  if (!token) throw new Error("User not authenticated")
  return { "Authorization": `Bearer ${token}` }
}

// Public
export async function getAllCards(): Promise<CardInfo[]> {
  const response = await fetch(`${API_BASE_URL}/cards/`)
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to fetch cards")
  return result.map(normalizeCard)
}

export async function getCard(cardId: string): Promise<CardInfo> {
  const response = await fetch(`${API_BASE_URL}/cards/${cardId}`)
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to fetch card")
  return result
}

// Auth required
export async function getUserCards(): Promise<UserCard[]> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/user/cards`, { headers })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to fetch user cards")
  // Backend returns { cardId, addedAt, usageLog, cardDetails } - normalize to { cardInfo }
  return result.map((uc: any) => ({
    cardId: uc.cardId,
    addedAt: uc.addedAt,
    usageLog: (uc.usageLog || []).map((u: any) => ({
      ...u,
      id: u._id || u.id
    })),
    cardInfo: normalizeCard(uc.cardDetails || uc.cardInfo),
  }))
}

export async function addUserCard(cardId: string): Promise<void> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/user/cards`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ cardId })
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to add card")
}

export async function removeUserCard(cardId: string): Promise<void> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/user/cards/${cardId}`, {
    method: "DELETE",
    headers
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to remove card")
}

export async function logCardUsage(cardId: string, data: {
  date: string
  platform: string
  offerId: string
  movieTitle: string
  ticketsSaved: number
  notes?: string
}): Promise<void> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/user/cards/${cardId}/usage`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to log card usage")
}

export async function removeCardUsage(cardId: string, usageId: string): Promise<void> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/user/cards/${cardId}/usage/${usageId}`, {
    method: "DELETE",
    headers
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to remove card usage")
}

export async function reportCard(cardId: string, reason: string): Promise<void> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/${cardId}/report`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to report card")
}

// Admin
export async function createCard(data: Partial<CardInfo>): Promise<CardInfo> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to create card")
  return result
}

export async function updateCard(cardId: string, data: Partial<CardInfo>): Promise<CardInfo> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to update card")
  return result
}

export async function deleteCard(cardId: string): Promise<void> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: "DELETE",
    headers
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to delete card")
}

export async function getCardReports(): Promise<CardReport[]> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/reports`, { headers })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to fetch reports")
  return result
}

export async function resolveCardReport(reportId: string, status: "resolved" | "dismissed", adminNote?: string): Promise<void> {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_BASE_URL}/cards/reports/${reportId}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ status, adminNote })
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Failed to resolve report")
}
