"use client"

import { AdminModeration } from "@/components/admin-moderation"
import { AdminSectionShell } from "@/components/admin-section-shell"

export default function Page() {
  return <AdminSectionShell title="Requests & Reports" description="Review every pending access request, title request, watch-link suggestion, and broken-link report in one place."><AdminModeration /></AdminSectionShell>
}
