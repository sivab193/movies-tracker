"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { resolveShortUrl } from "@/services/api"
import { Loader2, Film, AlertCircle } from "lucide-react"

export default function ShortUrlRedirectPage() {
    const { code } = useParams()
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!code) return
        async function doResolve() {
            try {
                const data = await resolveShortUrl(code as string)
                if (data.movieId) {
                    router.replace(`/movie/${data.movieId}`)
                } else {
                    setError("Invalid short link.")
                }
            } catch (err: any) {
                setError(err.message || "Short link not found or expired (30-day expiration).")
            }
        }
        doResolve()
    }, [code, router])

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-foreground text-center px-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h1 className="text-2xl font-bold">Link Expired or Not Found</h1>
                <p className="text-muted-foreground max-w-md">{error}</p>
                <a href="/" className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    Back to Home
                </a>
            </div>
        )
    }

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
            <div className="relative flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <Film className="h-4 w-4 text-primary absolute" />
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Redirecting to movie...</p>
        </div>
    )
}
