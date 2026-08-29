"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminCleanupManager } from "@/components/admin-cleanup-manager"
export default function Page() { return <AdminSectionShell title="Database Cleanup" description="Scan movie and theater collections for duplicates and merge references safely."><AdminCleanupManager /></AdminSectionShell> }
