import type { Metadata } from "next"
import { pageMetadata } from "@/lib/og/static"
import { OG_CONTACT } from "./og-config"

export const metadata: Metadata = pageMetadata(OG_CONTACT)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
