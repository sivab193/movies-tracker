import type { Metadata } from "next"
import { pageMetadata } from "@/lib/og/static"
import { OG_SERIES } from "./og-config"

export const metadata: Metadata = pageMetadata(OG_SERIES)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
