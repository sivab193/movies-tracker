"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminDataQualityManager } from "@/components/admin-data-quality-manager"
export default function Page() { return <AdminSectionShell title="Data Quality" description="Find movies missing runtimes, posters or title-card timing and open them for correction."><AdminDataQualityManager /></AdminSectionShell> }
