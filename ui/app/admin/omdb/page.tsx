import { redirect } from "next/navigation"

export default function AdminOmdbPage() {
    redirect("/admin/tools#omdb-api-keys")
}
