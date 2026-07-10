"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, CheckCircle2, AlertCircle } from "lucide-react"

export default function DeviceAuthPage() {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setStatus("error")
      setMessage("Please sign in first to authorize this device.")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/device/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userCode: code.toUpperCase().trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify device authorization code.")
      }

      setStatus("success")
      setMessage("Device authorized successfully! You can now close this browser window and return to your AI assistant CLI.")
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "Failed to verify device code. Please check and try again.")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/80 shadow-lg">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Bot className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Authorize AI Assistant</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Enter the 8-character verification code displayed on your command line or Claude/AI CLI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user ? (
              <div className="text-center space-y-4 py-4">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-3 justify-center">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>You must be signed in to grant account access.</span>
                </div>
                <Button onClick={() => router.push("/auth")} className="w-full rounded-full">
                  Sign In to Continue
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium text-foreground block text-center">
                    Device Code
                  </label>
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    className="h-14 text-center text-2xl font-mono tracking-[0.2em] font-bold uppercase bg-muted/40"
                    disabled={status === "loading" || status === "success"}
                    required
                  />
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-lg text-sm flex items-start gap-3 border ${
                      status === "success"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-destructive/10 border-destructive/30 text-destructive"
                    }`}
                  >
                    {status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    )}
                    <span>{message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={status === "loading" || status === "success" || !code}
                  className="w-full h-11 rounded-full font-semibold"
                >
                  {status === "loading"
                    ? "Verifying Code..."
                    : status === "success"
                    ? "Authorized ✓"
                    : "Authorize Device"}
                </Button>

                <div className="pt-4 border-t border-border text-center space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Signed in as <span className="font-medium text-foreground">{user.email}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/auth")}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Switch account or Sign out
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
