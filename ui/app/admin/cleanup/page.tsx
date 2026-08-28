import { redirect } from "next/navigation"

export default function AdminCleanupPage() {
    redirect("/admin/tools#database-deduplication-cleanup")
}
