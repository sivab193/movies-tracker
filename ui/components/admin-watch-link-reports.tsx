"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Check, ExternalLink, Link2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollapsibleSection } from "@/components/collapsible-section"
import type { WatchLinkReport, WatchLinkSubmission } from "@/lib/types"
import { getWatchLinkReports, getWatchLinkSubmissions, resolveWatchLinkReport, reviewWatchLinkSubmission } from "@/services/api"

export function AdminWatchLinkReports() {
  const [reports, setReports] = useState<WatchLinkReport[]>([])
  const [submissions, setSubmissions] = useState<WatchLinkSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getWatchLinkReports(), getWatchLinkSubmissions()])
      .then(([reportData, submissionData]) => {
        setReports(reportData.reports || [])
        setSubmissions(submissionData.submissions || [])
      })
      .catch((error) => console.error("Failed to load watch-link moderation", error))
      .finally(() => setLoading(false))
  }, [])

  const updateReport = async (id: string, status: "resolved" | "dismissed") => {
    setUpdatingId(id)
    try {
      await resolveWatchLinkReport(id, status)
      setReports((items) => items.filter((item) => item.id !== id))
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update report")
    } finally {
      setUpdatingId(null)
    }
  }

  const reviewSubmission = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id)
    try {
      await reviewWatchLinkSubmission(id, status)
      setSubmissions((items) => items.filter((item) => item.id !== id))
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not review watch link")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div id="watch-link-moderation" className="space-y-6">
      <CollapsibleSection
        defaultOpen
        title={<><Link2 className="h-5 w-5 text-sky-500" />Suggested watch links ({submissions.length})</>}
        description="Viewer links waiting for approval before they are published"
      >
        {loading ? <Loading /> : submissions.length ? (
          <div className="space-y-3">
            {submissions.map((item) => (
              <div key={item.id} className="rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.movieTitle} {item.movieYear ? <span className="font-normal text-muted-foreground">({item.movieYear})</span> : null}</p>
                    <p className="mt-1 text-sm"><span className="font-medium">{item.provider.name}</span> · {item.provider.regions?.join(", ") || "Region not specified"}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{item.provider.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><a href={item.provider.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Test</a></Button>
                    <Button size="sm" variant="outline" disabled={updatingId === item.id} onClick={() => reviewSubmission(item.id, "rejected")}><X className="mr-1.5 h-3.5 w-3.5" />Reject</Button>
                    <Button size="sm" disabled={updatingId === item.id} onClick={() => reviewSubmission(item.id, "approved")}>
                      {updatingId === item.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty text="No watch links are waiting for approval." />}
      </CollapsibleSection>

      <CollapsibleSection
        defaultOpen
        title={<><AlertTriangle className="h-5 w-5 text-amber-500" />Broken-link reports ({reports.length})</>}
        description="Published links viewers flagged as expired or not working"
      >
        {loading ? <Loading /> : reports.length ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{report.movieTitle} {report.movieYear ? <span className="font-normal text-muted-foreground">({report.movieYear})</span> : null}</p>
                    <p className="mt-1 text-sm"><span className="font-medium">{report.providerName}</span> · {report.reason === "expired" ? "Expired" : "Not working"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Reported {new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><Link href={`/movie/${report.movieId}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Open movie</Link></Button>
                    <Button asChild size="sm" variant="outline"><a href={report.providerUrl} target="_blank" rel="noopener noreferrer">Test</a></Button>
                    <Button size="sm" variant="outline" disabled={updatingId === report.id} onClick={() => updateReport(report.id, "dismissed")}><X className="mr-1.5 h-3.5 w-3.5" />Dismiss</Button>
                    <Button size="sm" disabled={updatingId === report.id} onClick={() => updateReport(report.id, "resolved")}>
                      {updatingId === report.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}Resolved
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty text="No pending broken-link reports." />}
      </CollapsibleSection>
    </div>
  )
}

function Loading() {
  return <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
}

function Empty({ text }: { text: string }) {
  return <p className="py-3 text-sm text-muted-foreground">{text}</p>
}
