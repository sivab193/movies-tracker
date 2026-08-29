"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminSeries } from "@/components/admin-series"
export default function Page() { return <AdminSectionShell title="Series" description="Import series, manage seasons, refresh metadata and edit streaming availability."><AdminSeries standalone /></AdminSectionShell> }
