"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export function AdminSectionShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/auth")
    else if (!userProfile?.isAdmin) router.replace("/")
  }, [loading, router, user, userProfile])

  if (loading || !user || !userProfile?.isAdmin) return <div className="min-h-screen bg-background"><Header /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></div>

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-2 text-muted-foreground"><Link href="/admin"><ArrowLeft className="h-4 w-4" />Admin dashboard</Link></Button>
        <div className="mb-7"><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  )
}
