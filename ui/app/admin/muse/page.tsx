"use client"

import { AdminMuseApi, AdminMuseTheaterSuggestions } from "@/components/admin-muse-api"
import { AdminSectionShell } from "@/components/admin-section-shell"

export default function MuseAdminPage() {
  return <AdminSectionShell title="Muse API" description="Generate and rotate the dedicated anniversary-automation key."><AdminMuseApi /><AdminMuseTheaterSuggestions /></AdminSectionShell>
}
