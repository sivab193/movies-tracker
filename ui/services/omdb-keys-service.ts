import { auth } from "@/lib/firebase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await auth?.currentUser?.getIdToken()
  if (!token) throw new Error("User not authenticated")
  return { "Authorization": `Bearer ${token}` }
}

export async function getOmdbKeys(): Promise<any[]> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_BASE_URL}/omdb-keys`, { headers })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch OMDb keys")
    }
    return res.json()
}

export async function addOmdbKey(key: string, email: string, label?: string): Promise<any> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_BASE_URL}/omdb-keys`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ key, email, label })
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add OMDb key")
    }
    return res.json()
}

export async function updateOmdbKey(id: string, data: {email?: string, label?: string, active?: boolean}): Promise<any> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_BASE_URL}/omdb-keys/${id}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update OMDb key")
    }
    return res.json()
}

export async function deleteOmdbKey(id: string): Promise<void> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_BASE_URL}/omdb-keys/${id}`, {
        method: "DELETE",
        headers
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete OMDb key")
    }
}

export async function getOmdbKeyUsage(days?: number): Promise<any> {
    const headers = await getAuthHeader()
    const url = new URL(`${API_BASE_URL}/omdb-keys/usage`)
    if (days) url.searchParams.set("days", days.toString())
    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch OMDb key usage")
    }
    return res.json()
}

export async function reorderOmdbKeys(keyIds: string[]): Promise<any> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_BASE_URL}/omdb-keys/reorder`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ keyIds })
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to reorder OMDb keys")
    }
    return res.json()
}
