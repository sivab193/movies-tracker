import type { Metadata } from "next"
import { pageMetadata } from "@/lib/og/static"
import { OG_ROADMAP } from "./og-config"

export const metadata: Metadata = pageMetadata(OG_ROADMAP)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
