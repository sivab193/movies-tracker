import type { Metadata } from "next"
import { pageMetadata } from "@/lib/og/static"
import { OG_SETTINGS } from "./og-config"

export const metadata: Metadata = pageMetadata(OG_SETTINGS)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
