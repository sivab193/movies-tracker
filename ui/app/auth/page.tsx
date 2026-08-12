"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Film, Mail, Lock, Loader2, ArrowLeft, AlertCircle, CheckCircle2, QrCode, Copy, Check, RefreshCw, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { QRCodeSVG } from "qrcode.react"
import { signInWithCustomToken } from "firebase/auth"
import { auth as firebaseAuth } from "@/lib/firebase"

export default function AuthPage() {
  const router = useRouter()
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isGmail = email.trim().toLowerCase().endsWith("@gmail.com") || email.trim().toLowerCase().endsWith("@googlemail.com")

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState("")
  const [resetOpen, setResetOpen] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // Device Code Login State
  const [showDeviceCode, setShowDeviceCode] = useState(false)
  const [deviceUserCode, setDeviceUserCode] = useState("")
  const [deviceCode, setDeviceCode] = useState("")
  const [deviceStatus, setDeviceStatus] = useState<"idle" | "loading" | "waiting" | "checking" | "success" | "error" | "expired">("idle")
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [deviceExpiresAt, setDeviceExpiresAt] = useState<Date | null>(null)

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please checking your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const displayName = `${firstName} ${lastName}`.trim()
      await signUpWithEmail(email, password, displayName)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return

    setResetLoading(true)
    setResetError(null)
    setResetSuccess(false)
    try {
      await resetPassword(resetEmail)
      setResetSuccess(true)
      setResetEmail("") // Clear email
    } catch (err: any) {
      setResetError(err.message || "Failed to send reset email.")
    } finally {
      setResetLoading(false)
    }
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  const handleRequestDeviceCode = async () => {
    setDeviceStatus("loading")
    setDeviceError(null)
    try {
      const response = await fetch(`${apiBase}/auth/device/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        throw new Error(`Server error: ${response.status}. Please try again.`)
      }
      if (!response.ok) throw new Error(data.error || "Failed to generate code")

      setDeviceUserCode(data.userCode)
      setDeviceCode(data.deviceCode)
      setDeviceExpiresAt(new Date(Date.now() + (data.expiresIn || 900) * 1000))
      setDeviceStatus("waiting")
      setShowDeviceCode(true)
    } catch (err: any) {
      setDeviceError(err.message || "Failed to generate device code")
      setDeviceStatus("error")
    }
  }

  const handleCheckDeviceStatus = async () => {
    if (!deviceCode) return

    // Check if expired locally
    if (deviceExpiresAt && new Date() > deviceExpiresAt) {
      setDeviceStatus("expired")
      setDeviceError("Code has expired. Please generate a new one.")
      return
    }

    setDeviceStatus("checking")
    setDeviceError(null)
    try {
      const response = await fetch(`${apiBase}/auth/device/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode }),
      })

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        throw new Error(`Server error: ${response.status}. Please try again.`)
      }

      if (!response.ok) {
        if (response.status === 400 && data.error === "Code expired") {
          setDeviceStatus("expired")
          setDeviceError("Code has expired. Please generate a new one.")
          return
        }
        throw new Error(data.error || "Failed to check status")
      }

      if (data.status === "pending") {
        setDeviceStatus("waiting")
        setDeviceError("Code not yet approved. Ask someone to enter the code on a signed-in device.")
        return
      }

      if (data.status === "authorized" && data.customToken) {
        setDeviceStatus("success")
        // Sign in with the custom token
        if (firebaseAuth) {
          await signInWithCustomToken(firebaseAuth, data.customToken)
          router.push("/dashboard")
        }
      }
    } catch (err: any) {
      setDeviceError(err.message || "Failed to check device code status")
      setDeviceStatus("waiting")
    }
  }

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(deviceUserCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      // Fallback
    }
  }, [deviceUserCode])

  const handleResetDeviceCode = () => {
    setShowDeviceCode(false)
    setDeviceUserCode("")
    setDeviceCode("")
    setDeviceStatus("idle")
    setDeviceError(null)
    setDeviceExpiresAt(null)
  }

  const getVerificationUrl = () => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/device?code=${encodeURIComponent(deviceUserCode)}&flow=login`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-muted/40 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Film className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue tracking your watch history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full mb-6 bg-transparent"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-10"
                        disabled={loading}
                        required
                      />
                    </div>
                    {isGmail && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                          <span>Gmail address detected. Please use the <strong>Continue with Google</strong> button above to sign in.</span>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs px-2.5 font-semibold shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 border border-amber-500/30"
                          onClick={handleGoogleSignIn}
                        >
                          Use Google
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                        <DialogTrigger asChild>
                          <Button variant="link" size="sm" className="px-0 font-normal h-auto text-xs text-muted-foreground">
                            Forgot Password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Enter your email address and we'll send you a link to reset your password.
                            </DialogDescription>
                          </DialogHeader>
                          {resetSuccess ? (
                            <div className="flex flex-col items-center gap-4 py-4 text-center">
                              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                <CheckCircle2 className="h-6 w-6" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-semibold">Check your email</h4>
                                <p className="text-sm text-muted-foreground">We have sent a password reset link to your email address.</p>
                              </div>
                              <Button variant="outline" onClick={() => setResetOpen(false)}>Close</Button>
                            </div>
                          ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-4 py-2">
                              {resetError && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex gap-2">
                                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <span>{resetError}</span>
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label htmlFor="reset-email">Email Address</Label>
                                <Input
                                  id="reset-email"
                                  placeholder="name@example.com"
                                  type="email"
                                  value={resetEmail}
                                  onChange={e => setResetEmail(e.target.value)}
                                  required
                                />
                              </div>
                              <Button type="submit" className="w-full" disabled={resetLoading}>
                                {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Link
                              </Button>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-10"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-start">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || isGmail}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input
                        id="signup-firstname"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-10"
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-10"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-10"
                        disabled={loading}
                        required
                      />
                    </div>
                    {isGmail && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                          <span>Gmail address detected. Please use the <strong>Continue with Google</strong> button above to sign up.</span>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs px-2.5 font-semibold shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 border border-amber-500/30"
                          onClick={handleGoogleSignIn}
                        >
                          Use Google
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-10"
                        disabled={loading}
                        required
                        minLength={6}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground ml-1">
                      Must be at least 6 characters
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-start">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || isGmail}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Device Code / QR Login Section */}
            <div className="relative mt-6 mb-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or sign in from another device
                </span>
              </div>
            </div>

            {!showDeviceCode ? (
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleRequestDeviceCode}
                disabled={loading || deviceStatus === "loading"}
              >
                {deviceStatus === "loading" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                Sign in with Code / QR
              </Button>
            ) : (
              <div className="space-y-5">
                {/* Code Display */}
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Enter this code on a device where you're already signed in, or scan the QR code.
                  </p>

                  <div className="flex items-center justify-center gap-2">
                    <div className="px-5 py-3 rounded-xl bg-muted/60 border border-border font-mono text-2xl font-bold tracking-[0.15em] select-all">
                      {deviceUserCode}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={handleCopyCode}
                      title="Copy code"
                    >
                      {codeCopied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
                    <QRCodeSVG
                      value={getVerificationUrl()}
                      size={160}
                      level="M"
                      marginSize={1}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>
                    Go to{" "}
                    <span className="font-medium text-foreground">/device</span>
                    {" "}on a signed-in device
                  </span>
                </div>

                {/* Status Messages */}
                {deviceError && (
                  <div className={`p-3 rounded-lg text-sm flex items-start gap-2 border ${
                    deviceStatus === "expired"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
                      : "bg-muted/50 border-border text-muted-foreground"
                  }`}>
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{deviceError}</span>
                  </div>
                )}

                {deviceStatus === "success" && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Approved! Signing you in…</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {deviceStatus === "expired" ? (
                    <Button
                      className="flex-1"
                      onClick={() => { handleResetDeviceCode(); handleRequestDeviceCode(); }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Get New Code
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      onClick={handleCheckDeviceStatus}
                      disabled={deviceStatus === "checking" || deviceStatus === "success"}
                    >
                      {deviceStatus === "checking" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {deviceStatus === "checking" ? "Checking…" : "Check Status"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleResetDeviceCode}
                    disabled={deviceStatus === "success"}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
