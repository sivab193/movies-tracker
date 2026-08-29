"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Check, ExternalLink, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollapsibleSection } from "@/components/collapsible-section"
import type { WatchLinkReport } from "@/lib/types"
import { getWatchLinkReports, resolveWatchLinkReport } from "@/services/api"

export function AdminWatchLinkReports() {
  const [reports, setReports] = useState<WatchLinkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    getWatchLinkReports()
      .then((data) => setReports(data.reports || []))
      .catch((error) => console.error("Failed to load watch-link reports", error))
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id: string, status: "resolved" | "dismissed") => {
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

  return (
    <div id="watch-link-reports">
      <CollapsibleSection
        defaultOpen
        title={<><AlertTriangle className="h-5 w-5 text-amber-500" />Watch-link reports ({reports.length})</>}
        description="Links viewers flagged as expired or not working"
      >
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading reports…</div>
        ) : reports.length ? (
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
                    <Button asChild size="sm" variant="outline"><a href={report.providerUrl} target="_blank" rel="noopener noreferrer">Test link</a></Button>
                    <Button size="sm" variant="outline" disabled={updatingId === report.id} onClick={() => updateStatus(report.id, "dismissed")}><X className="mr-1.5 h-3.5 w-3.5" />Dismiss</Button>
                    <Button size="sm" disabled={updatingId === report.id} onClick={() => updateStatus(report.id, "resolved")}>
                      {updatingId === report.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}Resolved
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-3 text-sm text-muted-foreground">No pending watch-link reports.</p>}
      </CollapsibleSection>
    </div>
  )
}
