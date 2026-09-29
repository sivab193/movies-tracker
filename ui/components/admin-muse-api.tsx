"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, Check, Copy, KeyRound, Loader2, Plus, RefreshCw, RotateCcw, ShieldCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { dismissAgentTheaterDeleteSuggestion, getAgentApiActivity, getAgentApiKeys, getAgentTheaterDeleteSuggestions, generateAgentApiKey, updateAgentApiKey, type AgentApiActivityResponse, type AgentApiKey, type AgentTheaterDeleteSuggestion } from "@/services/api"

export function AdminMuseApi() {
  const [keys, setKeys] = useState<AgentApiKey[]>([])
  const [dailyLimit, setDailyLimit] = useState(100)
  const [label, setLabel] = useState("Muse primary")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    try {
      const data = await getAgentApiKeys()
      setKeys(data.keys)
      setDailyLimit(data.dailyLimit)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Muse keys")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const generate = async () => {
    setCreating(true)
    setError(null)
    try {
      const data = await generateAgentApiKey(label.trim() || "Muse primary")
      setKeys((current) => [...current, data.record])
      setNewSecret(data.key)
      setCopied(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a Muse key")
    } finally {
      setCreating(false)
    }
  }

  const retire = async (key: AgentApiKey) => {
    setUpdatingId(key.id)
    setError(null)
    try {
      await updateAgentApiKey(key.id, false)
      setKeys((current) => current.map((item) => item.id === key.id ? { ...item, active: false, retiredAt: new Date().toISOString() } : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not retire this key")
    } finally {
      setUpdatingId(null)
    }
  }

  const copy = async () => {
    if (!newSecret) return
    await navigator.clipboard.writeText(newSecret)
    setCopied(true)
  }

  return <>
    <section className="border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="h-5 w-5 text-primary" />Muse access keys</h2>
          <p className="mt-1 text-sm text-muted-foreground">Active keys can call only the anniversary-movie endpoints. The daily limit is {dailyLimit} requests per key.</p>
        </div>
        <div className="flex w-full max-w-sm gap-2">
          <Input aria-label="New Muse key label" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} disabled={creating} />
          <Button onClick={() => void generate()} disabled={creating} className="shrink-0 gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Generate
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {loading ? <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : keys.length === 0 ? <div className="px-4 py-12 text-center text-sm text-muted-foreground">No Muse key has been generated yet.</div> : <div className="divide-y divide-border">
        {keys.map((key) => <div key={key.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{key.label}</p><span className={key.active ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400" : "text-xs font-semibold text-muted-foreground"}>{key.active ? "Active" : "Retired"}</span></div>
            <p className="mt-1 text-xs text-muted-foreground">Created {new Date(key.createdAt).toLocaleString()}{key.lastFour ? ` · ends in ${key.lastFour}` : ""}</p>
          </div>
          {key.active && <Button variant="outline" size="sm" className="shrink-0 gap-2" disabled={updatingId === key.id} onClick={() => void retire(key)}>{updatingId === key.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}Retire</Button>}
        </div>)}
      </div>}
    </section>

    <Dialog open={Boolean(newSecret)} onOpenChange={(open) => { if (!open) setNewSecret(null) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />New Muse key</DialogTitle>
          <DialogDescription>This value is shown once. Put it in Muse’s Secure Vault before closing this window.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border border-border bg-muted/35 p-2">
          <Input readOnly value={newSecret || ""} aria-label="New Muse API key" className="border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0" />
          <Button type="button" size="icon" variant="outline" onClick={() => void copy()} aria-label="Copy Muse API key">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
}

export function AdminMuseTheaterSuggestions() {
  const [suggestions, setSuggestions] = useState<AgentTheaterDeleteSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await getAgentTheaterDeleteSuggestions()
        setSuggestions(data.suggestions)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load theater suggestions")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const dismiss = async (suggestionId: string) => {
    setDismissingId(suggestionId)
    setError(null)
    try {
      await dismissAgentTheaterDeleteSuggestion(suggestionId)
      setSuggestions((current) => current.filter((suggestion) => suggestion.id !== suggestionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not dismiss theater suggestion")
    } finally {
      setDismissingId(null)
    }
  }

  return <section className="border border-border bg-card">
    <div className="border-b border-border p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Trash2 className="h-5 w-5 text-primary" />Theater deletion suggestions</h2>
      <p className="mt-1 text-sm text-muted-foreground">Muse can flag a venue, but only you can delete it from the theater workspace.</p>
    </div>
    {error && <p role="alert" className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    {loading ? <div className="flex min-h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : suggestions.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted-foreground">No pending theater deletion suggestions.</p> : <div className="divide-y divide-border">
      {suggestions.map((suggestion) => <div key={suggestion.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><p className="font-medium">{suggestion.theaterName}</p><p className="text-xs text-muted-foreground">{suggestion.theaterLocation || "Location not set"}</p><p className="mt-2 text-sm text-muted-foreground">{suggestion.reason}</p>{suggestion.evidenceUrl && <a href={suggestion.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">Review supporting link</a>}</div>
        <div className="flex shrink-0 gap-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/theaters/${suggestion.theaterId}`}>Review theater</Link></Button><Button size="sm" variant="ghost" disabled={dismissingId === suggestion.id} onClick={() => void dismiss(suggestion.id)}>{dismissingId === suggestion.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dismiss"}</Button></div>
      </div>)}
    </div>}
  </section>
}

function formatActivityTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleString()
}

export function AdminMuseActivity() {
  const [activity, setActivity] = useState<AgentApiActivityResponse | null>(null)
  const [days, setDays] = useState("30")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async (selectedDays = days) => {
    setLoading(true)
    setError(null)
    try {
      setActivity(await getAgentApiActivity(Number(selectedDays)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Muse activity")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const changeDays = (value: string) => {
    setDays(value)
    void load(value)
  }

  return <section className="border border-border bg-card">
    <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Activity className="h-5 w-5 text-primary" />Muse activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Latest authenticated calls. Request payloads and secrets are never recorded.</p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Select value={days} onValueChange={changeDays} disabled={loading}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Activity date range"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" size="icon" variant="outline" onClick={() => void load()} disabled={loading} aria-label="Refresh Muse activity" title="Refresh activity">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>
    </div>
    {error && <p role="alert" className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    {activity && <dl className="grid grid-cols-3 divide-x divide-border border-b border-border">
      <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Shown</dt><dd className="mt-1 text-lg font-semibold">{activity.summary.displayedCalls}</dd></div>
      <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Successful</dt><dd className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">{activity.summary.successfulCalls}</dd></div>
      <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Failed</dt><dd className="mt-1 text-lg font-semibold text-destructive">{activity.summary.failedCalls}</dd></div>
    </dl>}
    {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : !activity || activity.calls.length === 0 ? <p className="px-4 py-12 text-center text-sm text-muted-foreground">No authenticated Muse activity in this period.</p> : <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-border bg-muted/35 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Time</th><th className="px-4 py-3 font-medium">Route</th><th className="px-4 py-3 font-medium">Result</th><th className="px-4 py-3 font-medium">Duration</th><th className="px-4 py-3 font-medium">Reference</th></tr></thead>
        <tbody className="divide-y divide-border">{activity.calls.map((call, index) => <tr key={`${call.createdAt}-${call.endpoint}-${index}`}>
          <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatActivityTime(call.createdAt)}</td>
          <td className="px-4 py-3"><p className="font-mono text-xs">{call.method} {call.endpoint}</p><p className="mt-1 text-xs text-muted-foreground">{call.keyLabel || "Muse key"}{call.keyLastFour ? ` ending ${call.keyLastFour}` : ""}</p></td>
          <td className={call.status < 400 ? "px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400" : "px-4 py-3 font-medium text-destructive"}>{call.status}</td>
          <td className="px-4 py-3 text-muted-foreground">{call.durationMs} ms</td>
          <td className="max-w-64 truncate px-4 py-3 font-mono text-xs text-muted-foreground" title={call.externalRef || undefined}>{call.externalRef || "-"}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>
}
