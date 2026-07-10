import Link from "next/link"
import { Header } from "@/components/header"
import { Mail, Github, MessageCircle } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <MessageCircle className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-3xl font-semibold">Contact Us</h1>
              <p className="text-muted-foreground">Need to add missing data, report a bug, or contribute?</p>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-muted/20 bg-background p-6">
              <h2 className="text-xl font-semibold">Report missing or incorrect data</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Please reach out on Instagram for any missing entries, data updates, or app issues.
              </p>
              <Link
                href="https://www.instagram.com/tamil.title.card/"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                <Mail className="h-4 w-4" />
                @tamil.title.card
              </Link>
            </section>

            <section className="rounded-2xl border border-muted/20 bg-background p-6">
              <h2 className="text-xl font-semibold">Submit bugs or feature requests</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Bugs can also be created directly in the GitHub Issues page for this repository.
              </p>
              <Link
                href="https://github.com/siv19/movies-tracker/issues"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/90"
              >
                <Github className="h-4 w-4" />
                Open GitHub Issues
              </Link>
            </section>

            <section className="rounded-2xl border border-muted/20 bg-background p-6">
              <h2 className="text-xl font-semibold">Want to help build this?</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                If you are a developer, feel free to contribute by fixing bugs or adding new features in the repository.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
