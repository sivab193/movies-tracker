"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { getUserProfile } from "@/services/user-service"
import { Loader2, User, Film, Clock, Lock } from "lucide-react"

interface WatchHistoryItem {
    movieId: string
    movieTitle: string
    moviePosterUrl?: string
    theaterId?: string
    theaterName?: string
    timestamp?: string
    createdAt: string
}

interface UserProfile {
    displayName: string
    photoURL?: string
    customUrl?: string
    totalRuntimeSeconds: number
    totalMoviesWatched: number
    watchHistory?: WatchHistoryItem[]
}

export default function CustomUserProfilePage() {
    const { username } = useParams()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (username) {
            fetchProfile()
        }
    }, [username])

    async function fetchProfile() {
        try {
            const data = await getUserProfile(username as string)
            setProfile(data)
        } catch (err: any) {
            setError(err.message || "Failed to load profile")
        } finally {
            setLoading(false)
        }
    }

    const formatRuntime = (seconds: number) => {
        if (seconds === -1 || seconds === undefined || seconds === null || isNaN(seconds)) return "Hidden"
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Unknown Date"
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return "Unknown Date"
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const sortedHistory = [...(profile?.watchHistory || [])].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0).getTime()
        const dateB = new Date(b.timestamp || b.createdAt || 0).getTime()
        return dateB - dateA
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <Lock className="h-12 w-12 text-muted-foreground" />
                    <h1 className="text-2xl font-bold">{error === "This profile is private" ? "Private Profile" : "User Not Found"}</h1>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
            <Header />

            <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
                <div className="mb-10 flex min-w-0 flex-col items-center gap-6 text-center md:mb-12 md:flex-row md:text-left">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-secondary">
                        {profile.photoURL ? (
                            <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-12 w-12 text-muted-foreground" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                            <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">{profile.displayName}</h1>
                            {profile.customUrl ? (
                                <span className="inline-block max-w-full break-all rounded-full bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary">
                                    /u/{profile.customUrl}
                                </span>
                            ) : (
                                <a href="/settings" className="inline-block max-w-full rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-500/20">
                                    ✨ Claim your short URL (/u/name) in Settings
                                </a>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-5 sm:gap-6 md:justify-start">
                            <div className="flex min-w-0 flex-col">
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Movies Watched</span>
                                <span className="flex items-center gap-2 text-2xl font-bold">
                                    <Film className="h-5 w-5 shrink-0 text-primary" />
                                    {profile.totalMoviesWatched === -1 ? "Hidden" : profile.totalMoviesWatched}
                                </span>
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Runtime</span>
                                <span className="flex items-center gap-2 text-2xl font-bold">
                                    <Clock className="h-5 w-5 shrink-0 text-primary" />
                                    {formatRuntime(profile.totalRuntimeSeconds)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {profile.watchHistory && profile.watchHistory.length > 0 ? (
                    <section className="min-w-0 space-y-6">
                        <h2 className="border-b pb-2 text-2xl font-bold tracking-tight">Watch History</h2>

                        <div className="space-y-3 md:hidden">
                            {sortedHistory.map((item, index) => (
                                <article key={index} className="min-w-0 rounded-2xl border bg-card p-4">
                                    <div className="flex min-w-0 gap-3">
                                        {item.moviePosterUrl && (
                                            <img src={item.moviePosterUrl} alt="" className="h-16 w-11 shrink-0 rounded object-cover" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <a
                                                href={`/movie/${item.movieId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block break-words font-semibold text-primary hover:underline"
                                            >
                                                {item.movieTitle}
                                            </a>
                                            <p className="mt-1 text-sm text-muted-foreground">{formatDate(item.timestamp || item.createdAt)}</p>
                                            <div className="mt-3 border-t pt-3 text-sm">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theater</span>
                                                {item.theaterId ? (
                                                    <a
                                                        href={`/theaters/${item.theaterId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-0.5 block break-words text-primary hover:underline"
                                                    >
                                                        {item.theaterName || "Unnamed Theater"}
                                                    </a>
                                                ) : (
                                                    <p className="mt-0.5 break-words text-muted-foreground">{item.theaterName || "N/A"}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
                            <table className="w-full table-fixed border-collapse text-left">
                                <thead className="bg-muted/50 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="w-[40%] px-6 py-4">Movie Title</th>
                                        <th className="w-[35%] px-6 py-4">Theater</th>
                                        <th className="w-[25%] px-6 py-4">Date Watched</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {sortedHistory.map((item, index) => (
                                        <tr key={index} className="transition-colors hover:bg-muted/30">
                                            <td className="min-w-0 px-6 py-4 font-medium">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    {item.moviePosterUrl && (
                                                        <img src={item.moviePosterUrl} alt="" className="h-8 w-6 shrink-0 rounded object-cover" />
                                                    )}
                                                    <a href={`/movie/${item.movieId}`} target="_blank" rel="noopener noreferrer" className="min-w-0 break-words text-primary hover:underline">
                                                        {item.movieTitle}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="min-w-0 px-6 py-4 text-muted-foreground">
                                                {item.theaterId ? (
                                                    <a href={`/theaters/${item.theaterId}`} target="_blank" rel="noopener noreferrer" className="break-words text-primary hover:underline">
                                                        {item.theaterName || "Unnamed Theater"}
                                                    </a>
                                                ) : (
                                                    <span className="break-words">{item.theaterName || "N/A"}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-primary">
                                                {formatDate(item.timestamp || item.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground sm:p-12">
                        <Film className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-lg">No public movie history available.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
