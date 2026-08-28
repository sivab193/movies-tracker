import type { Metadata } from "next"
import { pageMetadata } from "@/lib/og/static"
import { AdminTheaterCityAutocomplete } from "@/components/admin-theater-city-autocomplete"
import { OG_ADMIN } from "./og-config"

export const metadata: Metadata = pageMetadata(OG_ADMIN)

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminTheaterCityAutocomplete />
      {children}
    </>
  )
}
