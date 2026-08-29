import { API_BASE_URL } from "@/services/api"
import { auth } from "@/lib/firebase"

export type OttProviderDefinition = {
  id: string
  name: string
  baseUrl: string
  iconUrl?: string
  iconText: string
  backgroundColor: string
  textColor: string
  isDefault?: boolean
}

export async function getOttProviders(): Promise<OttProviderDefinition[]> {
  const response = await fetch(`${API_BASE_URL}/ott-providers/`)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Failed to load OTT providers")
  return data.providers || []
}

async function adminRequest(path: string, method: string, body?: Partial<OttProviderDefinition>) {
  const token = await auth?.currentUser?.getIdToken()
  if (!token) throw new Error("User not authenticated")
  const response = await fetch(`${API_BASE_URL}/ott-providers${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Failed to update OTT provider")
  return data
}

export const createOttProvider = (provider: Partial<OttProviderDefinition>) => adminRequest("/", "POST", provider)
export const updateOttProvider = (id: string, provider: Partial<OttProviderDefinition>) => adminRequest(`/${encodeURIComponent(id)}`, "PUT", provider)
export const deleteOttProvider = (id: string) => adminRequest(`/${encodeURIComponent(id)}`, "DELETE")
