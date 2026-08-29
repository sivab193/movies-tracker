"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Check, ExternalLink, Link2, Loader2, PlaySquare, ShieldAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollapsibleSection } from "@/components/collapsible-section"
import type { WatchLinkReport, WatchLinkSubmission } from "@/lib/types"
import { getWatchLinkReports, getWatchLinkSubmissions, resolveWatchLinkReport, reviewWatchLinkSubmission } from "@/services/api"
import { getMovieRequests, resolveMovieRequest } from "@/services/requests-service"
import { getAdminRequests, resolveAdminRequest } from "@/services/user-service"

type TitleRequest = { _id: string; imdbId: string; imdbLink: string; type: string; requestedByName?: string; requestedBy?: string; createdAt: string }
type AccessRequest = { id: string; email: string; requestedAt?: string }
type Queue = "access" | "titles" | "submissions" | "reports"

export function AdminModeration() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [titleRequests, setTitleRequests] = useState<TitleRequest[]>([])
  const [submissions, setSubmissions] = useState<WatchLinkSubmission[]>([])
  const [reports, setReports] = useState<WatchLinkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    const results = await Promise.allSettled([
      getAdminRequests(), getMovieRequests(), getWatchLinkSubmissions(), getWatchLinkReports(),
    ])
    if (results[0].status === "fulfilled") setAccessRequests(results[0].value || [])
    if (results[1].status === "fulfilled") setTitleRequests(results[1].value || [])
    if (results[2].status === "fulfilled") setSubmissions(results[2].value.submissions || [])
    if (results[3].status === "fulfilled") setReports(results[3].value.reports || [])
    if (results.some((result) => result.status === "rejected")) setError("Some moderation queues could not be loaded. Refresh to try again.")
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const run = async (key: string, action: () => Promise<unknown>, remove: () => void) => {
    setBusy(key)
    setError("")
    try { await action(); remove() }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The moderation action failed.") }
    finally { setBusy(null) }
  }

  const actionsFor = (queue: Queue, approve: boolean) => {
    if (queue === "access") return accessRequests.map((item) => () => resolveAdminRequest(item.id, approve ? "APPROVE" : "REJECT"))
    if (queue === "titles") return titleRequests.map((item) => () => resolveMovieRequest(item._id, approve ? "approved" : "rejected"))
    if (queue === "submissions") return submissions.map((item) => () => reviewWatchLinkSubmission(item.id, approve ? "approved" : "rejected"))
    return reports.map((item) => () => resolveWatchLinkReport(item.id, approve ? "resolved" : "dismissed"))
  }

  const bulk = async (queue: Queue, approve: boolean) => {
    const actions = actionsFor(queue, approve)
    if (!actions.length) return
    const verb = approve ? "approve" : "reject"
    if (!window.confirm(`${verb[0].toUpperCase()}${verb.slice(1)} all ${actions.length} items in this category?`)) return
    setBusy(`bulk:${queue}`)
    setError("")
    const results = await Promise.allSettled(actions.map((action) => action()))
    await load()
    const failed = results.filter((result) => result.status === "rejected").length
    if (failed) setError(`${actions.length - failed} items updated; ${failed} failed and remain in the queue.`)
    setBusy(null)
  }

  const bulkActions = (queue: Queue, count: number) => (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={!count || busy !== null} onClick={() => void bulk(queue, false)}><X className="mr-1.5 h-3.5 w-3.5" />Reject all</Button>
      <Button size="sm" disabled={!count || busy !== null} onClick={() => void bulk(queue, true)}>{busy === `bulk:${queue}` ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}Approve all</Button>
    </div>
  )

  if (loading) return <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading moderation queues…</div>

  return <div className="space-y-6">
    {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

    <CollapsibleSection defaultOpen title={<><ShieldAlert className="h-5 w-5 text-yellow-500" />Admin access requests ({accessRequests.length})</>} description="People asking for administrator permissions" headerActions={bulkActions("access", accessRequests.length)}>
      <QueueEmpty items={accessRequests} text="No admin-access requests are pending." render={(item) => <Row key={item.id} title={item.email} detail={`Requested ${formatDate(item.requestedAt)}`} actions={<><Reject disabled={busy !== null} onClick={() => void run(`access:${item.id}`, () => resolveAdminRequest(item.id, "REJECT"), () => setAccessRequests((current) => current.filter((value) => value.id !== item.id)))} /><Approve busy={busy === `access:${item.id}`} disabled={busy !== null} onClick={() => void run(`access:${item.id}`, () => resolveAdminRequest(item.id, "APPROVE"), () => setAccessRequests((current) => current.filter((value) => value.id !== item.id)))} /></>} />} />
    </CollapsibleSection>

    <CollapsibleSection defaultOpen title={<><PlaySquare className="h-5 w-5 text-blue-500" />Title requests ({titleRequests.length})</>} description="Requested movies and series waiting for review" headerActions={bulkActions("titles", titleRequests.length)}>
      <QueueEmpty items={titleRequests} text="No title requests are pending." render={(item) => <Row key={item._id} title={<a href={item.imdbLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">{item.imdbId} <span className="font-normal capitalize text-muted-foreground">({item.type})</span></a>} detail={`Requested by ${item.requestedByName || item.requestedBy || "Unknown user"} · ${formatDate(item.createdAt)}`} actions={<><Reject disabled={busy !== null} onClick={() => void run(`title:${item._id}`, () => resolveMovieRequest(item._id, "rejected"), () => setTitleRequests((current) => current.filter((value) => value._id !== item._id)))} /><Approve busy={busy === `title:${item._id}`} disabled={busy !== null} onClick={() => void run(`title:${item._id}`, () => resolveMovieRequest(item._id, "approved"), () => setTitleRequests((current) => current.filter((value) => value._id !== item._id)))} /></>} />} />
    </CollapsibleSection>

    <CollapsibleSection defaultOpen title={<><Link2 className="h-5 w-5 text-sky-500" />Suggested watch links ({submissions.length})</>} description="Viewer links waiting for approval before publication" headerActions={bulkActions("submissions", submissions.length)}>
      <QueueEmpty items={submissions} text="No suggested watch links are pending." render={(item) => <Row key={item.id} title={`${item.movieTitle}${item.movieYear ? ` (${item.movieYear})` : ""}`} detail={`${item.provider.name} · ${item.provider.regions?.join(", ") || "Region not specified"}`} extra={<a href={item.provider.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-primary hover:underline"><ExternalLink className="mr-1 h-3 w-3" />Test link</a>} actions={<><Reject disabled={busy !== null} onClick={() => void run(`submission:${item.id}`, () => reviewWatchLinkSubmission(item.id, "rejected"), () => setSubmissions((current) => current.filter((value) => value.id !== item.id)))} /><Approve busy={busy === `submission:${item.id}`} disabled={busy !== null} onClick={() => void run(`submission:${item.id}`, () => reviewWatchLinkSubmission(item.id, "approved"), () => setSubmissions((current) => current.filter((value) => value.id !== item.id)))} /></>} />} />
    </CollapsibleSection>

    <CollapsibleSection defaultOpen title={<><AlertTriangle className="h-5 w-5 text-amber-500" />Broken-link reports ({reports.length})</>} description="Approve a valid report to mark it resolved; reject it to dismiss it" headerActions={bulkActions("reports", reports.length)}>
      <QueueEmpty items={reports} text="No broken-link reports are pending." render={(item) => <Row key={item.id} title={`${item.movieTitle}${item.movieYear ? ` (${item.movieYear})` : ""}`} detail={`${item.providerName} · ${item.reason === "expired" ? "Expired" : "Not working"} · ${formatDate(item.createdAt)}`} extra={<div className="flex gap-3"><Link href={`/movie/${item.movieId}`} className="text-xs text-primary hover:underline">Open movie</Link><a href={item.providerUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Test link</a></div>} actions={<><Reject label="Dismiss" disabled={busy !== null} onClick={() => void run(`report:${item.id}`, () => resolveWatchLinkReport(item.id, "dismissed"), () => setReports((current) => current.filter((value) => value.id !== item.id)))} /><Approve label="Resolve" busy={busy === `report:${item.id}`} disabled={busy !== null} onClick={() => void run(`report:${item.id}`, () => resolveWatchLinkReport(item.id, "resolved"), () => setReports((current) => current.filter((value) => value.id !== item.id)))} /></>} />} />
    </CollapsibleSection>
  </div>
}

function QueueEmpty<T>({ items, text, render }: { items: T[]; text: string; render: (item: T) => React.ReactNode }) { return items.length ? <div className="space-y-3">{items.map(render)}</div> : <p className="py-3 text-sm text-muted-foreground">{text}</p> }
function Row({ title, detail, extra, actions }: { title: React.ReactNode; detail: string; extra?: React.ReactNode; actions: React.ReactNode }) { return <div className="rounded-xl border bg-muted/20 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p>{extra && <div className="mt-2">{extra}</div>}</div><div className="flex shrink-0 flex-wrap gap-2">{actions}</div></div></div> }
function Reject({ onClick, disabled, label = "Reject" }: { onClick: () => void; disabled: boolean; label?: string }) { return <Button size="sm" variant="outline" disabled={disabled} onClick={onClick}><X className="mr-1.5 h-3.5 w-3.5" />{label}</Button> }
function Approve({ onClick, disabled, busy, label = "Approve" }: { onClick: () => void; disabled: boolean; busy: boolean; label?: string }) { return <Button size="sm" disabled={disabled} onClick={onClick}>{busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}{label}</Button> }
function formatDate(value?: string) { if (!value) return "an unknown date"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "an unknown date" : date.toLocaleString() }
