"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminTheatersManager } from "@/components/admin-theaters-manager"
export default function Page() { return <AdminSectionShell title="Theaters" description="Add, import, verify and edit theaters, then open individual venues for screen-level details."><AdminTheatersManager /></AdminSectionShell> }
