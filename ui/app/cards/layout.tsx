import type { Metadata } from "next"
import { pageMetadata } from "@/lib/og/static"
import { OG_CARDS } from "./og-config"

export const metadata: Metadata = pageMetadata(OG_CARDS)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
