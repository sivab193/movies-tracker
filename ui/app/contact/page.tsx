import Link from "next/link"
import { Header } from "@/components/header"
import { Github, MessageCircle } from "lucide-react"

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
                Use the guided data correction form so the request includes the title, source, and expected value an admin needs.
              </p>
              <Link
                href="https://github.com/sivab193/movies-tracker/issues/new?template=data_correction.yml"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                <Github className="h-4 w-4" />
                Request a data correction
              </Link>
            </section>

            <section className="rounded-2xl border border-muted/20 bg-background p-6">
              <h2 className="text-xl font-semibold">Submit bugs or feature requests</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Choose the guided bug or feature form. Please do not include passwords, API keys, tokens, or private account data.
              </p>
              <Link
                href="https://github.com/sivab193/movies-tracker/issues/new/choose"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/90"
              >
                <Github className="h-4 w-4" />
                Create a request
              </Link>
            </section>

            <section className="rounded-2xl border border-muted/20 bg-background p-6">
              <h2 className="text-xl font-semibold">Want to help build this?</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Start with an accepted issue, keep the change focused, and follow the repository contribution and pull request checklist.
              </p>
              <Link
                href="https://github.com/sivab193/movies-tracker/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Read the contribution guide
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
