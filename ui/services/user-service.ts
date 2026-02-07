import { auth } from "@/lib/firebase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function getAuthHeader(): Promise<Record<string, string>> {
    const user = auth?.currentUser
    if (!user) return {}
    const token = await user.getIdToken()
    return { "Authorization": `Bearer ${token}` }
}

export async function getMySettings() {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/users/me`, { headers })
    if (!response.ok) throw new Error("Failed to fetch settings")
    return response.json()
}

export async function requestAdminAccess() {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/users/request-admin`, {
        method: "POST",
        headers
    })
    if (!response.ok) throw new Error("Failed to request admin access")
    return response.json()
}

export async function getAdminRequests() {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/users/management-requests`, { headers })
    if (!response.ok) throw new Error("Failed to fetch requests")
    return response.json()
}

export async function resolveAdminRequest(userId: string, action: 'APPROVE' | 'REJECT') {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/users/management-requests/${userId}/resolve`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action })
    })
    if (!response.ok) throw new Error(`Failed to ${action} request`)
    return response.json()
}

export async function updateUserSettings(settings: {
    isPublic?: boolean,
    publicFields?: string[],
    hiddenMovies?: string[],
    joinedLeaderboard?: boolean,
    displayName?: string
}) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/users/settings`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(settings)
    })
    if (!response.ok) throw new Error("Failed to update settings")
    return response.json()
}

export async function getUserProfile(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`)
    if (!response.ok) throw new Error("User profile not found or private")
    return response.json()
}
