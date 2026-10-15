"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  DatabaseZap,
  Eye,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useAuth } from "@/contexts/auth-context"
import {
  getMaintenanceTasks,
  runMaintenanceTask,
  type MaintenanceRun,
  type MaintenanceTask,
} from "@/services/maintenance-service"

export default function MaintenancePage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, MaintenanceRun>>({})
  const [applyTarget, setApplyTarget] = useState<MaintenanceTask | null>(null)
  const [confirmation, setConfirmation] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/auth")
      return
    }
    if (!userProfile?.isAdmin) {
      router.push("/")
      return
    }

    getMaintenanceTasks()
      .then(setTasks)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Could not load maintenance tasks")
      })
      .finally(() => setLoading(false))
  }, [authLoading, router, user, userProfile])

  async function runTask(task: MaintenanceTask, mode: "preview" | "apply") {
    setRunningTaskId(task.id)
    setError(null)
    try {
      const result = await runMaintenanceTask(task.id, mode)
      setResults((current) => ({ ...current, [task.id]: result }))
      if (mode === "apply") {
        setApplyTarget(null)
        setConfirmation("")
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Maintenance task failed")
    } finally {
      setRunningTaskId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading maintenance tasks" />
        </div>
      </div>
    )
  }

  if (!user || !userProfile?.isAdmin) return null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
        <Button asChild variant="ghost" className="mb-6 -ml-3 gap-2">
          <Link href="/admin"><ArrowLeft className="h-4 w-4" />Admin dashboard</Link>
        </Button>

        <div className="mb-8 flex flex-col gap-5 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Database maintenance</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              Preview an allowlisted migration against production data, inspect its impact, then apply it with explicit confirmation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />Admin-only server execution
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div><p className="font-semibold">The request could not be completed</p><p className="mt-1 text-destructive/90">{error}</p></div>
          </div>
        )}

        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {tasks.length === 0 ? (
            <div className="p-8 text-center">
              <DatabaseZap className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No maintenance tasks are registered</p>
              <p className="mt-1 text-sm text-muted-foreground">Add a task to the server-side registry before it can appear here.</p>
            </div>
          ) : tasks.map((task) => {
            const result = results[task.id]
            const isRunning = runningTaskId === task.id
            return (
              <section key={task.id} className="p-5 md:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary"><DatabaseZap className="h-5 w-5" /></div>
                      <h2 className="text-lg font-bold tracking-tight">{task.title}</h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{task.description}</p>
                    <p className="mt-2 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{task.impact}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" disabled={isRunning || !!runningTaskId} onClick={() => runTask(task, "preview")} className="gap-2">
                      {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : result ? <RotateCcw className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {result ? "Preview again" : "Preview impact"}
                    </Button>
                    <Button disabled={isRunning || !!runningTaskId || result?.mode !== "preview"} onClick={() => setApplyTarget(task)} className="gap-2">
                      <Play className="h-4 w-4" />Apply
                    </Button>
                  </div>
                </div>

                {result && <RunResult result={result} />}
              </section>
            )
          })}
        </div>
      </main>

      <AlertDialog open={!!applyTarget} onOpenChange={(open) => { if (!open && !runningTaskId) { setApplyTarget(null); setConfirmation("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply {applyTarget?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This writes to the production database. Type <span className="font-semibold text-foreground">{applyTarget?.id}</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={applyTarget?.id} autoComplete="off" aria-label="Migration confirmation" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!runningTaskId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!applyTarget || confirmation !== applyTarget.id || !!runningTaskId}
              onClick={(event) => {
                event.preventDefault()
                if (applyTarget) runTask(applyTarget, "apply")
              }}
              className="gap-2"
            >
              {runningTaskId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Apply migration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function RunResult({ result }: { result: MaintenanceRun }) {
  return (
    <div className="mt-5 rounded-xl bg-muted/50 p-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{result.mode === "apply" ? "Applied successfully" : "Preview complete"}</p>
        <time className="text-xs tabular-nums text-muted-foreground" dateTime={result.completedAt}>{new Date(result.completedAt).toLocaleString()}</time>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(result.output).map(([key, value]) => (
          <div key={key} className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">{formatLabel(key)}</dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function formatLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase())
}
