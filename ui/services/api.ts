import { auth } from "@/lib/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function addMovie(imdbId: string) {
    const user = auth?.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/movies/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imdbId }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to add movie");
    }

    return data;
}

export async function addWatchHistory(data: any) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/users/watch-history`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to add watch history");
    return result;
}

export async function deleteWatchHistory(userId: string, entryId: string) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/users/${userId}/watch-history/${entryId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Failed to delete entry");
    }
    return true;
}

export async function updateWatchHistory(userId: string, entryId: string, data: any) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/users/${userId}/watch-history/${entryId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Failed to update entry");
    }
    return true;
}

// Admin

export async function getAllUsers() {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch users");
    return result;
}

export async function toggleLeaderboardBan(userId: string) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/users/${userId}/ban`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to toggle ban");
    return result;
}

export async function getPublicProfile(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch profile");
    return result;
}

export async function getMovies(skip: number = 0, limit: number = 50) {
    const response = await fetch(`${API_BASE_URL}/movies/?skip=${skip}&limit=${limit}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch movies");
    }

    return data;
}

export async function searchMovies(query: string, year?: string, language?: string, upcoming?: string) {
    const url = new URL(`${API_BASE_URL}/movies/search-discover`);
    url.searchParams.append("s", query || '*');
    if (year) url.searchParams.append("y", year);
    if (language && language !== 'all') url.searchParams.append("language", language);
    if (upcoming && upcoming !== 'all') url.searchParams.append("upcoming", upcoming);

    const response = await fetch(url.toString());
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Search failed");
    return data;
}
export async function getTheaters() {
    const response = await fetch(`${API_BASE_URL}/theaters/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch theaters");
    return data.theaters;
}

export async function addTheater(name: string, location?: string) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/theaters/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, location })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to add theater");
    return data.theater;
}

export async function deleteTheater(id: string) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/theaters/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to delete theater");
    return data;
}

export async function getLeaderboard() {
    const response = await fetch(`${API_BASE_URL}/leaderboard/`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch leaderboard");
    }

    return data.leaderboard;
}

export async function getMovie(id: string) {
    const response = await fetch(`${API_BASE_URL}/movies/${id}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch movie");
    }

    return data;
}

export async function deleteMovie(id: string) {
    const token = await auth?.currentUser?.getIdToken();
    const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to delete movie");
    return data;
}

export async function addSubmission(submission: {
    movieId: string;
    timeInSeconds: number;
    rawInput: string;
    comment?: string;
}) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/movies/submissions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(submission)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to add submission");
    return data;
}

export async function getSubmissions(movieId: string) {
    const response = await fetch(`${API_BASE_URL}/movies/submissions?movieId=${movieId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch submissions");
    return data;
}
