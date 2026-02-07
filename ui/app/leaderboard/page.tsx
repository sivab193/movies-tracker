"use client"

import { useEffect, useState } from "react"
import { getLeaderboard } from "@/services/api"
import { Loader2, Trophy, Clock, Film } from "lucide-react"
import { Header } from "@/components/header"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LeaderboardUser {
    userId: string
    displayName: string
    photoURL: string
    totalRuntimeSeconds: number
    totalMoviesWatched: number
    isPublic: boolean
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [period, setPeriod] = useState("current") // current, q4-2025, q3-2025

    // Calculate next result date (1st of next quarter at 9 PM IST)
    const getNextResultDate = () => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() // 0-11
        const quarter = Math.floor(currentMonth / 3) + 1

        // Next quarter start month (0, 3, 6, 9) -> next is (quarter * 3)
        let nextQuarterMonth = quarter * 3
        let nextQuarterYear = currentYear

        if (nextQuarterMonth >= 12) {
            nextQuarterMonth = 0
            nextQuarterYear++
        }

        // Date is 1st of that month
        const date = new Date(nextQuarterYear, nextQuarterMonth, 1) // 12 AM
        // Add 21 hours for 9 PM IST (approximate, hardcoded for now or use precise Timezone logic)
        // IST is UTC+5:30. 9 PM IST is 15:30 UTC. 
        // 9 PM local IST logic:
        return date.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    }

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getLeaderboard()
                setUsers(data)
            } catch (err) {
                setError("Failed to load leaderboard")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [])

    const formatRuntime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-1.5 text-yellow-600 border border-yellow-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                        <span className="text-sm font-semibold tracking-wide uppercase">Winner gets a free movie ticket! 🎟️</span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Trophy className="h-8 w-8 text-yellow-500" />
                                Leaderboard
                            </h1>
                            <p className="text-muted-foreground text-sm">Next result: {getNextResultDate()} at 9:00 PM IST</p>
                        </div>

                        <div className="flex items-center gap-2" title="Quarter Duration: Jan 1 - Mar 31">
                            <Clock className="h-4 w-4 text-muted-foreground cursor-help" />
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current">Current (Q1 2026)</SelectItem>
                                    <SelectItem value="q2-2026" disabled>Q2 2026 (Coming Soon)</SelectItem>
                                    <SelectItem value="q3-2026" disabled>Q3 2026 (Coming Soon)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {
                    loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-destructive">{error}</div>
                    ) : (
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 md:gap-4 border-b bg-muted/50 px-4 py-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                                <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                                <div className="col-span-6 md:col-span-8">User</div>
                                <div className="col-span-4 md:col-span-3 text-right">Runtime</div>
                            </div>
                            {users.map((user, index) => (
                                <div key={user.userId} className="grid grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center hover:bg-muted/50 transition-colors border-b last:border-0">
                                    <div className="col-span-2 md:col-span-1 text-center font-bold text-lg">
                                        {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : <span className="text-muted-foreground text-sm">#{index + 1}</span>}
                                    </div>
                                    <div className="col-span-6 md:col-span-8 overflow-hidden">
                                        {user.isPublic ? (
                                            <Link href={`/users/${user.userId}`} className="flex items-center gap-3 group truncate">
                                                <div className="h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-0 transition-all group-hover:ring-2 group-hover:ring-primary/50">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold">{user.displayName?.[0]?.toUpperCase() || 'U'}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center md:gap-2 truncate">
                                                    <span className="font-medium group-hover:text-primary transition-colors underline-offset-4 group-hover:underline truncate">{user.displayName || 'Anonymous'}</span>
                                                    <span className="hidden md:inline-flex text-xs text-muted-foreground items-center gap-1 shrink-0">
                                                        • {user.totalMoviesWatched} movies
                                                    </span>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-3 truncate">
                                                <div className="h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold">{user.displayName?.[0]?.toUpperCase() || 'U'}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center md:gap-2 truncate">
                                                    <span className="font-medium truncate">{user.displayName || 'Anonymous'}</span>
                                                    <span className="hidden md:inline-flex text-xs text-muted-foreground items-center gap-1 shrink-0">
                                                        • {user.totalMoviesWatched} movies
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-4 md:col-span-3 text-right font-mono font-medium text-primary text-sm md:text-base">
                                        {formatRuntime(user.totalRuntimeSeconds)}
                                        <div className="md:hidden text-[10px] text-muted-foreground">{user.totalMoviesWatched} movies</div>
                                    </div>
                                </div>
                            ))}

                            {users.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No data available yet.
                                </div>
                            )}
                        </div>
                    )
                }
            </main>
        </div>
    )
}
