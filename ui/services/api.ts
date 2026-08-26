import { auth } from "@/lib/firebase";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/** Open a protected image in a new tab using the current Firebase ID token. */
export async function openProtectedAsset(path: string) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    const apiRoot = API_BASE_URL.replace(/\/api\/?$/, "");
    const url = path.startsWith("http")
        ? path
        : path.startsWith("/api/")
            ? `${apiRoot}${path}`
            : `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const viewer = window.open("", "_blank");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
        viewer?.close();
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load protected image");
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    if (viewer) {
        viewer.opener = null;
        viewer.location.href = objectUrl;
        viewer.addEventListener("beforeunload", () => URL.revokeObjectURL(objectUrl), { once: true });
    } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    }
}

export async function fetchOmdbPreview(imdbId: string) {
    const token = (await auth?.currentUser?.getIdToken().catch(() => null)) || "anonymous";
    const response = await fetch(`${API_BASE_URL}/movies/fetch-omdb?imdbId=${encodeURIComponent(imdbId)}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch OMDB details");
    }
    return data;
}

export async function addMovie(payload: string | any) {
    const token = (await auth?.currentUser?.getIdToken().catch(() => null)) || "anonymous";
    const bodyData = typeof payload === "string" ? { imdbId: payload } : payload;

    const response = await fetch(`${API_BASE_URL}/movies/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
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

export async function getAdminUserProfile(userId: string) {
    const token = await auth?.currentUser?.getIdToken();
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch admin user profile");
    return result;
}

export async function getStatsSummary() {
    const response = await fetch(`${API_BASE_URL}/stats/summary`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to load community stats");
    return result;
}

export async function getMovies(
    skip: number = 0,
    limit: number = 50,
    language: string = "",
    search: string = "",
    year: string = "",
    missingPoster?: boolean,
    avgTimeFilter?: string,
    releaseFilter?: string,
    watchAvailable?: boolean,
    sort?: string,
) {
    let url = `${API_BASE_URL}/movies/?skip=${skip}&limit=${limit}`;
    if (language && language.toLowerCase() !== "all") {
        url += `&language=${encodeURIComponent(language)}`;
    }
    if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
    }
    if (year && year.trim() !== "" && year !== "All") {
        url += `&year=${encodeURIComponent(year.trim())}`;
    }
    if (missingPoster) {
        url += `&missingPoster=true`;
    }
    if (avgTimeFilter && avgTimeFilter !== "All") {
        url += `&avgTimeFilter=${encodeURIComponent(avgTimeFilter)}`;
    }
    if (releaseFilter && releaseFilter.toLowerCase() !== "all") {
        url += `&releaseFilter=${encodeURIComponent(releaseFilter)}`;
    }
    if (watchAvailable) {
        url += `&watchAvailable=true`;
    }
    if (sort && sort !== "latest") {
        url += `&sort=${encodeURIComponent(sort)}`;
    }
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch movies");
    }

    return data;
}

export async function searchMovies(query: string, year?: string, language?: string, upcoming?: string) {
    let urlStr = `${API_BASE_URL}/movies/search-discover?s=${encodeURIComponent(query || '*')}`;
    if (year) urlStr += `&y=${encodeURIComponent(year)}`;
    if (language && language !== 'all') urlStr += `&language=${encodeURIComponent(language)}`;
    if (upcoming && upcoming !== 'all') urlStr += `&upcoming=${encodeURIComponent(upcoming)}`;

    const response = await fetch(urlStr);
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

export async function getTheater(id: string) {
    const response = await fetch(`${API_BASE_URL}/theaters/${id}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Failed to fetch theater")
    return data
}

export async function addTheater(name: string, location?: string, gmapsLink?: string) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/theaters/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, location, gmapsLink })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to add theater");
    return data.theater;
}

export async function bulkAddTheaters(location: string, theaters: Array<{ name: string; gmapsLink?: string }>) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/theaters/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ location, theaters })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to bulk add theaters");
    return data as { created: any[]; skipped: Array<{ name: string; reason: string }>; invalid: Array<{ index: number; reason: string }> };
}

export async function updateTheater(
    id: string,
    name: string,
    location?: string,
    gmapsLink?: string,
    details: Record<string, unknown> = {}
) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/theaters/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, location, gmapsLink, ...details })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update theater");
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

export async function verifyTheater(id: string, verified?: boolean) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/theaters/${id}/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(verified === undefined ? {} : { verified })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to verify theater");
    return data;
}

export async function verifyMovie(id: string, verified?: boolean) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/movies/${id}/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(verified === undefined ? {} : { verified })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to verify movie");
    return data;
}

export async function getMovieDataQuality() {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${API_BASE_URL}/movies/data-quality`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch data quality report");
    return data;
}

export async function getSeriesLeaderboard() {
    const response = await fetch(`${API_BASE_URL}/leaderboard/series`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch series leaderboard");
    return data.leaderboard;
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

export async function updateMovie(id: string, updateData: any) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update movie");
    return data.movie || data;
}

export async function refreshMovieFromOmdb(id: string) {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${API_BASE_URL}/movies/${id}/refresh-omdb`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to refresh movie from OMDb");
    return data.movie || data;
}

export async function clearMovieSubmissions(id: string) {
    const token = await auth?.currentUser?.getIdToken();
    const response = await fetch(`${API_BASE_URL}/movies/${id}/submissions`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to clear submissions");
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
    const token = (await auth?.currentUser?.getIdToken().catch(() => null)) || "anonymous";

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

export async function createShortUrl(movieId: string): Promise<{ code: string; shortUrl: string }> {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}/shorten`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to generate short URL");
    return data;
}

export async function resolveShortUrl(code: string): Promise<{ movieId: string }> {
    const response = await fetch(`${API_BASE_URL}/movies/m/${encodeURIComponent(code)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to resolve short URL");
    return data;
}

export async function getTheaterDuplicates() {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${API_BASE_URL}/theaters/duplicates`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch theater duplicates");
    return data;
}

export async function mergeTheaterDuplicates() {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${API_BASE_URL}/theaters/duplicates/merge`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to merge theater duplicates");
    return data;
}

export async function getMovieDuplicates() {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${API_BASE_URL}/movies/duplicates`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch movie duplicates");
    return data;
}

export async function mergeMovieDuplicates() {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${API_BASE_URL}/movies/duplicates/merge`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to merge movie duplicates");
    return data;
}
