"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminMoviesManager } from "@/components/admin-movies-manager"
export default function Page() { return <AdminSectionShell title="Movies" description="Add movies, edit metadata and streaming links, verify records and manage title-card submissions."><AdminMoviesManager /></AdminSectionShell> }
