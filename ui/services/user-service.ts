import { auth } from "@/lib/firebase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function getAuthHeader(user?: any): Promise<Record<string, string>> {
    const currentUser = user || auth?.currentUser
    if (!currentUser) return {}
    const token = await currentUser.getIdToken()
    return { "Authorization": `Bearer ${token}` }
}

function normalizeWatchHistoryTimestamps(data: any) {
    if (!Array.isArray(data?.watchHistory)) return data

    return {
        ...data,
        watchHistory: data.watchHistory.map((entry: any) => {
            const timestamp = entry.timestamp || entry.createdAt
            const watchedOn = new Date(timestamp)
            const dateKey = typeof timestamp === "string"
                ? timestamp.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
                : undefined
            const normalizedEntry = dateKey ? { ...entry, watchDate: dateKey } : entry
            const match = (entry.showTime || "").match(/^(\d{1,2}):(\d{2})$/)
            if (isNaN(watchedOn.getTime()) || !match) return normalizedEntry

            const hours = Number(match[1])
            const minutes = Number(match[2])
            if (hours >= 24 || minutes >= 60) return normalizedEntry

            // Watch dates originate in a date input and are stored at UTC midnight.
            // Preserve that submitted calendar date instead of converting midnight to
            // local time first, which can move western time zones to the prior day.
            if (!dateKey) return normalizedEntry

            const watchedAt = new Date(`${dateKey}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`)
            return { ...normalizedEntry, timestamp: watchedAt.toISOString() }
        })
    }
}

export async function getMySettings(user?: any) {
    const headers = await getAuthHeader(user)
    const response = await fetch(`${API_BASE_URL}/users/me`, { headers })
    if (!response.ok) throw new Error("Failed to fetch settings")
    const data = await response.json()
    return normalizeWatchHistoryTimestamps(data)
}

export async function getMySession(user?: any) {
    const headers = await getAuthHeader(user)
    const response = await fetch(`${API_BASE_URL}/users/session`, { headers })
    if (!response.ok) throw new Error("Failed to fetch signed-in session")
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
    displayName?: string,
    customUrl?: string
}) {
    const headers = await getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/users/settings`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(settings)
    })
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to update settings")
    }
    return response.json()
}

export async function getUserProfile(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`)
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "User profile not found or private")
    }
    return response.json()
}
