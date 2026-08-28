"use client"

import { useEffect } from "react"

const ADMIN_PANELS = [
    {
        title: "Movies",
        description: "Manage movie metadata, posters, title-card timing, and verification.",
        accent: "rose",
    },
    {
        title: "Series",
        description: "Maintain TV series metadata and streaming availability.",
        accent: "red",
    },
    {
        title: "Theaters",
        description: "Add, import, verify, and clean up theater records.",
        accent: "pink",
    },
    {
        title: "Users",
        description: "Review user accounts, roles, leaderboard status, and profiles.",
        href: "/admin/users",
        accent: "slate",
    },
    {
        title: "OTT catalog",
        description: "Browse every title linked to each streaming service.",
        accent: "fuchsia",
    },
    {
        title: "Watch Orders",
        description: "Edit curated watch-order links and descriptions.",
        accent: "orange",
    },
    {
        title: "Cards & Offers",
        description: "Manage bank-card and movie-ticket offers.",
        accent: "rose",
    },
    {
        title: "OMDb API Keys",
        description: "Monitor key health and usage limits.",
        accent: "violet",
    },
    {
        title: "Database Deduplication & Cleanup",
        description: "Scan and merge duplicate movies or theaters.",
        accent: "amber",
    },
    {
        title: "Data Quality",
        description: "Find missing runtime, cover art, and title-card times.",
        accent: "sky",
    },
]

function slugify(value: string) {
    return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function AdminDashboardHubPolish() {
    useEffect(() => {
        if (window.location.pathname !== "/admin") return

        const main = document.querySelector("main")
        const title = Array.from(document.querySelectorAll("h1")).find((heading) => heading.textContent?.trim() === "Admin Dashboard")
        if (!main || !title || document.getElementById("admin-dashboard-hub")) return

        const contentGrid = Array.from(main.querySelectorAll("div")).find((node) => node.className.includes("grid") && node.className.includes("gap-8")) as HTMLElement | undefined
        contentGrid?.classList.add("admin-dashboard-section-grid")

        const sections = Array.from(main.querySelectorAll("section, div")).filter((node) => {
            const text = node.textContent || ""
            return ADMIN_PANELS.some((panel) => text.includes(panel.title))
        }) as HTMLElement[]

        ADMIN_PANELS.forEach((panel) => {
            const section = sections.find((node) => (node.textContent || "").includes(panel.title))
            if (section) {
                section.id = `admin-${slugify(panel.title)}`
                section.dataset.adminPanel = "true"
            }
        })

        const hub = document.createElement("div")
        hub.id = "admin-dashboard-hub"
        hub.className = "admin-dashboard-hub"
        hub.innerHTML = `
            <div class="admin-dashboard-hub__header">
                <div>
                    <p class="admin-dashboard-hub__eyebrow">Admin workspace</p>
                    <h2>Choose what you want to manage</h2>
                    <p>Use these panels as shortcuts instead of scanning the full admin list. Existing detailed tools stay below.</p>
                </div>
                <a class="admin-dashboard-hub__users" href="/admin/users">Open Users</a>
            </div>
            <div class="admin-dashboard-hub__grid">
                ${ADMIN_PANELS.map((panel) => `
                    <a
                        class="admin-dashboard-hub__card admin-dashboard-hub__card--${panel.accent}"
                        href="${panel.href || `#admin-${slugify(panel.title)}`}"
                        data-admin-target="${panel.title}"
                    >
                        <span>${panel.title}</span>
                        <p>${panel.description}</p>
                    </a>
                `).join("")}
            </div>
        `

        title.parentElement?.after(hub)

        hub.querySelectorAll("a[data-admin-target]").forEach((link) => {
            link.addEventListener("click", (event) => {
                const href = (link as HTMLAnchorElement).getAttribute("href") || ""
                if (!href.startsWith("#")) return
                const target = document.querySelector(href) as HTMLElement | null
                if (!target) return

                event.preventDefault()
                target.scrollIntoView({ behavior: "smooth", block: "start" })
                target.classList.add("admin-dashboard-panel-highlight")
                window.setTimeout(() => target.classList.remove("admin-dashboard-panel-highlight"), 1200)
            })
        })
    }, [])

    return (
        <style jsx global>{`
            #admin-dashboard-hub {
                margin: 1.25rem 0 1.75rem;
            }

            .admin-dashboard-hub {
                border: 1px solid hsl(var(--border));
                border-radius: 1.5rem;
                background: radial-gradient(circle at top left, hsl(var(--primary) / 0.12), transparent 34%), hsl(var(--card));
                padding: 1rem;
                box-shadow: 0 18px 60px hsl(var(--background) / 0.45);
            }

            .admin-dashboard-hub__header {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                justify-content: space-between;
                border-bottom: 1px solid hsl(var(--border) / 0.7);
                padding: 0.25rem 0.25rem 1rem;
            }

            .admin-dashboard-hub__eyebrow {
                margin: 0 0 0.35rem;
                color: hsl(var(--primary));
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .admin-dashboard-hub__header h2 {
                margin: 0;
                font-size: 1.35rem;
                font-weight: 800;
                letter-spacing: -0.03em;
            }

            .admin-dashboard-hub__header p:not(.admin-dashboard-hub__eyebrow) {
                margin: 0.35rem 0 0;
                color: hsl(var(--muted-foreground));
                font-size: 0.9rem;
            }

            .admin-dashboard-hub__users {
                align-self: flex-start;
                border: 1px solid hsl(var(--border));
                border-radius: 999px;
                color: hsl(var(--foreground));
                font-size: 0.8rem;
                font-weight: 700;
                padding: 0.55rem 0.9rem;
                text-decoration: none;
                transition: background 160ms ease, border-color 160ms ease;
            }

            .admin-dashboard-hub__users:hover {
                background: hsl(var(--muted));
                border-color: hsl(var(--primary) / 0.45);
            }

            .admin-dashboard-hub__grid {
                display: grid;
                gap: 0.75rem;
                grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
                padding-top: 1rem;
            }

            .admin-dashboard-hub__card {
                border: 1px solid hsl(var(--border) / 0.78);
                border-radius: 1rem;
                color: hsl(var(--foreground));
                min-height: 7.5rem;
                padding: 1rem;
                position: relative;
                text-decoration: none;
                transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
                overflow: hidden;
            }

            .admin-dashboard-hub__card::before {
                content: "";
                height: 0.3rem;
                left: 1rem;
                right: 1rem;
                top: 0;
                position: absolute;
                border-radius: 999px;
                background: hsl(var(--primary));
                opacity: 0.75;
            }

            .admin-dashboard-hub__card:hover {
                transform: translateY(-2px);
                background: hsl(var(--muted) / 0.28);
                border-color: hsl(var(--primary) / 0.5);
            }

            .admin-dashboard-hub__card span {
                display: block;
                font-weight: 800;
                letter-spacing: -0.02em;
                margin-top: 0.25rem;
            }

            .admin-dashboard-hub__card p {
                color: hsl(var(--muted-foreground));
                font-size: 0.78rem;
                line-height: 1.35;
                margin: 0.45rem 0 0;
            }

            .admin-dashboard-hub__card--amber::before { background: #f59e0b; }
            .admin-dashboard-hub__card--sky::before { background: #0ea5e9; }
            .admin-dashboard-hub__card--rose::before { background: #f43f5e; }
            .admin-dashboard-hub__card--red::before { background: #ef4444; }
            .admin-dashboard-hub__card--pink::before { background: #ec4899; }
            .admin-dashboard-hub__card--fuchsia::before { background: #d946ef; }
            .admin-dashboard-hub__card--orange::before { background: #f97316; }
            .admin-dashboard-hub__card--violet::before { background: #8b5cf6; }
            .admin-dashboard-hub__card--slate::before { background: #94a3b8; }

            .admin-dashboard-panel-highlight {
                outline: 2px solid hsl(var(--primary) / 0.65);
                outline-offset: 4px;
            }

            @media (min-width: 768px) {
                .admin-dashboard-hub {
                    padding: 1.25rem;
                }

                .admin-dashboard-hub__header {
                    align-items: center;
                    flex-direction: row;
                }

                .admin-dashboard-hub__users {
                    align-self: center;
                    flex: 0 0 auto;
                }
            }
        `}</style>
    )
}
