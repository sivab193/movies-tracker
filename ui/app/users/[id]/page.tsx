"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { getUserProfile } from "@/services/user-service"
import { Loader2, User, Film, Clock, Calendar, Lock } from "lucide-react"

interface WatchHistoryItem {
    movieId: string
    movieTitle: string
    moviePosterUrl?: string
    theaterName?: string
    timestamp?: string
    createdAt: string
}

interface UserProfile {
    displayName: string
    photoURL: string
    totalRuntimeSeconds: number
    totalMoviesWatched: number
    watchHistory?: WatchHistoryItem[]
}

export default function UserProfilePage() {
    const { id } = useParams()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            fetchProfile()
        }
    }, [id])

    async function fetchProfile() {
        try {
            const data = await getUserProfile(id as string)
            setProfile(data)
        } catch (err: any) {
            setError(err.message || "Failed to load profile")
        } finally {
            setLoading(false)
        }
    }

    const formatRuntime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }

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
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="mx-auto max-w-5xl px-4 py-12">
                <div className="mb-12 flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                    <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-4 border-primary/20">
                        {profile.photoURL ? (
                            <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-12 w-12 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold tracking-tight">{profile.displayName}</h1>
                        <div className="mt-4 flex flex-wrap justify-center gap-6 md:justify-start">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Movies Watched</span>
                                <span className="text-2xl font-bold flex items-center gap-2">
                                    <Film className="h-5 w-5 text-primary" />
                                    {profile.totalMoviesWatched}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Runtime</span>
                                <span className="text-2xl font-bold flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    {formatRuntime(profile.totalRuntimeSeconds)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {profile.watchHistory && profile.watchHistory.length > 0 ? (
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">Watch History</h2>
                        <div className="overflow-hidden rounded-2xl border bg-card">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Movie Title</th>
                                        <th className="px-6 py-4">Theater</th>
                                        <th className="px-6 py-4">Date Watched</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {profile.watchHistory.map((item, index) => (
                                        <tr key={index} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">
                                                <div className="flex items-center gap-3">
                                                    {item.moviePosterUrl && (
                                                        <img src={item.moviePosterUrl} alt="" className="h-8 w-6 object-cover rounded hidden sm:block" />
                                                    )}
                                                    <span>{item.movieTitle}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{item.theaterName || "N/A"}</td>
                                            <td className="px-6 py-4 text-primary font-mono">
                                                {new Date(item.timestamp || item.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
                        <Film className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No public movie history available.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
