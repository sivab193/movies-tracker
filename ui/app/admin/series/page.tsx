"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminSeries } from "@/components/admin-series"
import { AdminSeriesTableImport } from "@/components/admin-series-table-import"

export default function Page() {
  return (
    <AdminSectionShell
      title="Series"
      description="Import series, manage seasons, refresh metadata and edit streaming availability."
    >
      <div className="space-y-6">
        <AdminSeriesTableImport />
        <AdminSeries standalone />
      </div>
    </AdminSectionShell>
  )
}
