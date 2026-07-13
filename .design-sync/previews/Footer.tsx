import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Footer } from 'movies-tracker'
import { Clock } from 'lucide-react'

// The desktop footer: a single muted rule under the page with the project's
// byline and the maintainer's links. (It's `hidden md:block` — on phones the
// BottomNav takes over that edge of the screen.)
export function Default() {
  return <Footer />
}

// Where it actually lives: pinned under the page content by `mt-auto`, so a
// short page still pushes it to the bottom of the viewport.
export function AtPageBottom() {
  return (
    <div className="flex min-h-96 flex-col bg-background">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>RRR</CardTitle>
            <CardDescription>2022 · 187 min · Telugu, Hindi</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <Clock className="size-5 text-primary" />
              <span className="text-3xl font-bold tabular-nums">8:18</span>
              <span className="text-sm text-muted-foreground">
                average across 63 submissions
              </span>
            </div>
            <Button size="sm">Log your time</Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
