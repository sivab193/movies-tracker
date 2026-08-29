"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminOmdbKeys } from "@/components/admin-omdb-keys"
export default function Page() { return <AdminSectionShell title="OMDb API Keys" description="Manage key availability, usage and daily request limits."><AdminOmdbKeys standalone /></AdminSectionShell> }
