"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Shield, User, Eye, EyeOff, CheckCircle2, Trophy, Lock, Film, AlertCircle, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { getMySettings, updateUserSettings, requestAdminAccess } from "@/services/user-service"
import { useAuth } from "@/contexts/auth-context"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const FIELDS = [
    { id: "movieCount", label: "Total Movies Count" },
    { id: "totalRuntime", label: "Total Runtime" },
    { id: "moviesList", label: "Detailed Movie List" },
]

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [isPublic, setIsPublic] = useState(false)
    const [joinedLeaderboard, setJoinedLeaderboard] = useState(false)
    const [publicFields, setPublicFields] = useState<string[]>([])
    const [hiddenMovies, setHiddenMovies] = useState<string[]>([])
    const [watchHistory, setWatchHistory] = useState<any[]>([])
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isAdminState, setIsAdminState] = useState(false)
    const [adminRequestStatus, setAdminRequestStatus] = useState("NONE")
    const [displayName, setDisplayName] = useState("")
    const [editingName, setEditingName] = useState(false)
    const [showLeaderboardConfirm, setShowLeaderboardConfirm] = useState(false)

    useEffect(() => {
        if (user) {
            loadSettings()
        } else if (!authLoading) {
            setLoading(false)
        }
    }, [user, authLoading])

    async function loadSettings() {
        try {
            const settings = await getMySettings()
            setIsPublic(settings.isPublic)
            setJoinedLeaderboard(settings.joinedLeaderboard)
            setPublicFields(settings.publicFields || [])
            setHiddenMovies(settings.hiddenMovies || [])
            setPublicFields(settings.publicFields || [])
            setHiddenMovies(settings.hiddenMovies || [])
            setWatchHistory(settings.watchHistory || [])
            setIsAdminState(settings.isAdmin || false)
            setAdminRequestStatus(settings.adminRequestStatus || "NONE")
            setDisplayName(settings.displayName || user?.displayName || "")
        } catch (error) {
            console.error("Error loading settings:", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        setSuccess(false)
        try {
            await updateUserSettings({
                isPublic,
                publicFields,
                hiddenMovies,
                displayName,
                joinedLeaderboard: joinedLeaderboard
            })
            setSuccess(true)
            setEditingName(false)
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error("Error saving settings:", error)
        } finally {
            setSaving(false)
        }
    }

    async function handleJoinLeaderboard() {
        setJoinedLeaderboard(true)
        setShowLeaderboardConfirm(false)
        try {
            await updateUserSettings({ joinedLeaderboard: true })
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error("Error joining leaderboard:", error)
            setJoinedLeaderboard(false)
        }
    }

    async function handleQuitLeaderboard() {
        setJoinedLeaderboard(false)
        try {
            await updateUserSettings({ joinedLeaderboard: false })
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error("Error quitting leaderboard:", error)
            setJoinedLeaderboard(true)
        }
    }

    async function handleRequestAdmin() {
        try {
            await requestAdminAccess()
            setAdminRequestStatus("PENDING")
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error("Error requesting admin access:", error)
        }
    }

    const toggleHiddenMovie = (imdbId: string) => {
        if (hiddenMovies.includes(imdbId)) {
            setHiddenMovies(hiddenMovies.filter(id => id !== imdbId))
        } else {
            setHiddenMovies([...hiddenMovies, imdbId])
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground" />
                    <h1 className="text-2xl font-bold">Please Sign In</h1>
                    <p className="text-muted-foreground">You need to be logged in to access settings.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
                <div className="mb-8 flex items-center gap-3">
                    <User className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                </div>

                <div className="grid gap-8">
                    {/* Display Name Section */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Display Name</h2>
                                <p className="text-sm text-muted-foreground">This name will be shown on the leaderboard</p>
                            </div>
                            {!editingName ? (
                                <div className="flex items-center gap-3">
                                    <span className="font-medium">{displayName || "Not set"}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingName(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-48"
                                        placeholder="Enter display name"
                                    />
                                    <Button size="sm" onClick={() => setEditingName(false)}>Done</Button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Leaderboard Participation */}
                    <section className={`rounded-2xl border p-6 shadow-sm ring-1 transition-colors ${joinedLeaderboard ? 'border-border bg-card ring-transparent' : 'border-primary/20 bg-primary/5 ring-primary/10'}`}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className={`flex items-center gap-2 text-xl font-bold ${joinedLeaderboard ? 'text-foreground' : 'text-primary'}`}>
                                    <Trophy className={`h-5 w-5 ${joinedLeaderboard ? 'text-yellow-500' : 'text-primary'}`} />
                                    {joinedLeaderboard ? "Leaderboard Participation" : "Join the Leaderboard"}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground text-balance">
                                    {joinedLeaderboard 
                                        ? "You are currently participating in the global runtime leaderboard. Your display name and total runtime are ranked against other users." 
                                        : "Compare your movie watch stats with other users. Once you join, your name and total runtime will be visible on the leaderboard."}
                                </p>
                            </div>
                            {joinedLeaderboard ? (
                                <Button variant="outline" onClick={handleQuitLeaderboard} className="rounded-full px-6 border-destructive/30 text-destructive hover:bg-destructive/10">
                                    Quit Leaderboard
                                </Button>
                            ) : (
                                <Button onClick={() => setShowLeaderboardConfirm(true)} className="rounded-full px-8">
                                    Join Now
                                </Button>
                            )}
                        </div>
                    </section>

                    {!isAdminState && (
                        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">Admin Access</h2>
                                    <p className="text-sm text-muted-foreground">{adminRequestStatus === 'PENDING' ? 'Your request is pending approval.' : 'Request access to manage movies and database.'}</p>
                                </div>
                                {adminRequestStatus === 'PENDING' ? (
                                    <Button disabled variant="outline">Request Pending</Button>
                                ) : adminRequestStatus === 'APPROVED' ? (
                                    <Button disabled variant="outline" className="text-green-500">Access Granted</Button>
                                ) : (
                                    <Button onClick={handleRequestAdmin} variant="outline">Request Access</Button>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Privacy Section */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Public Profile Visibility</h2>
                                <p className="text-sm text-muted-foreground">Control who can see your cinematic journey.</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                                {isPublic ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                <span className="text-xs font-semibold uppercase">{isPublic ? "Public" : "Private"}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <Label htmlFor="public-toggle" className="flex flex-col gap-1 text-left cursor-pointer">
                                    <span className="text-base font-semibold">Enable Public Profile</span>
                                    <span className="font-normal text-muted-foreground">Allow others to view your profile via the leaderboard or direct link.</span>
                                </Label>
                                <Switch
                                    id="public-toggle"
                                    checked={isPublic}
                                    onCheckedChange={setIsPublic}
                                    className="mt-1 shrink-0"
                                />
                            </div>

                            {isPublic && (
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Information to Show</h3>
                                    <div className="grid gap-3">
                                        {FIELDS.map((field) => (
                                            <div key={field.id} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={field.id}
                                                    checked={publicFields.includes(field.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setPublicFields([...publicFields, field.id])
                                                        } else {
                                                            setPublicFields(publicFields.filter(f => f !== field.id))
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={field.id} className="cursor-pointer font-medium">{field.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Hidden Movies Section */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">Manage Hidden Movies</h2>
                            <p className="text-sm text-muted-foreground">These movies will be hidden from your public detailed list, but will still count towards your total runtime.</p>
                        </div>

                        {watchHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-xl">
                                <Film className="h-10 w-10 text-muted-foreground/30 mb-2" />
                                <p className="text-muted-foreground">No movies in your history yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {watchHistory.map((movie) => (
                                    <div key={movie.imdbId} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-6 rounded bg-muted flex items-center justify-center overflow-hidden">
                                                {movie.posterUrl ? <img src={movie.posterUrl} alt="" className="h-full w-full object-cover" /> : <Film className="h-4 w-4 opacity-30" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{movie.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{movie.year}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hiddenMovies.includes(movie.imdbId) ? (
                                                <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-muted-foreground" onClick={() => toggleHiddenMovie(movie.imdbId)}>
                                                    <EyeOff className="h-3.5 w-3.5" />
                                                    Hidden
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="h-8 px-3 gap-1.5" onClick={() => toggleHiddenMovie(movie.imdbId)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Visible
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border bg-card/80 p-4 shadow-lg backdrop-blur md:relative md:bottom-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
                        <div className="flex items-center gap-2">
                            {success && (
                                <span className="flex items-center gap-2 text-sm font-medium text-green-500">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Changes saved
                                </span>
                            )}
                        </div>
                        <Button
                            size="lg"
                            className="rounded-full px-12"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save All Changes"}
                        </Button>
                    </div>
                </div>
            </main>

            {/* Leaderboard Join Confirmation Dialog */}
            <AlertDialog open={showLeaderboardConfirm} onOpenChange={setShowLeaderboardConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Join the Leaderboard?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Once you join the leaderboard, you cannot leave. Your display name and total watch runtime will be visible to everyone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleJoinLeaderboard}>
                            Join Now
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
