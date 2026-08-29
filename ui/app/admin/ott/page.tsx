"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminOttCatalog } from "@/components/admin-ott-catalog"
import { AdminOttProviders } from "@/components/admin-ott-providers"
export default function Page() { return <AdminSectionShell title="OTT Catalog" description="Manage shared provider branding and inspect every linked movie and series."><AdminOttProviders /><AdminOttCatalog standalone /></AdminSectionShell> }
