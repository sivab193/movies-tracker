"use client"
import { AdminSectionShell } from "@/components/admin-section-shell"
import { AdminWatchOrders } from "@/components/admin-watch-orders"
export default function Page() { return <AdminSectionShell title="Watch Orders" description="Edit watch-order names, public slugs, descriptions and cover art."><AdminWatchOrders standalone /></AdminSectionShell> }
