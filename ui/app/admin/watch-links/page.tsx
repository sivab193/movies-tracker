"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminWatchLinkReports } from "@/components/admin-watch-link-reports"
export default function Page() { return <AdminSectionShell title="Watch-link Moderation" description="Approve viewer suggestions and resolve broken or expired streaming links."><AdminWatchLinkReports /></AdminSectionShell> }
