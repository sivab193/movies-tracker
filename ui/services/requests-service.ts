import { auth } from "@/lib/firebase";
import { API_BASE_URL } from "./api";

export async function getMovieRequests() {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    
    const response = await fetch(`${API_BASE_URL}/requests`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch requests");
    return data;
}

export async function resolveMovieRequest(requestId: string, status: 'approved' | 'rejected') {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Failed to ${status} request`);
    return data;
}
