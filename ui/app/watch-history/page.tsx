import { redirect } from "next/navigation"

/** Legacy route kept so old bookmarks continue to work. */
export default function WatchHistoryPage() {
  redirect("/dashboard")
}
