import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ThemeProvider } from 'movies-tracker'
import { Clock, Moon, Sun } from 'lucide-react'

// ThemeProvider renders no markup of its own — it puts the theme class on
// <html>, which is what resolves every `bg-*` / `text-*` token below to an
// actual oklch value. So the only honest preview is themed content INSIDE it.

const TOKENS = [
  { name: 'background', swatch: 'bg-background', note: 'page' },
  { name: 'card', swatch: 'bg-card', note: 'surface' },
  { name: 'muted', swatch: 'bg-muted', note: 'rows, chips' },
  { name: 'accent', swatch: 'bg-accent', note: 'hover' },
  { name: 'primary', swatch: 'bg-primary', note: 'brand red' },
  { name: 'destructive', swatch: 'bg-destructive', note: 'errors' },
]

function Swatches() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TOKENS.map((t) => (
        <div key={t.name}>
          <div
            className={`h-14 w-full rounded-md border border-border ${t.swatch}`}
          />
          <p className="mt-1.5 font-mono text-xs font-medium">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.note}</p>
        </div>
      ))}
    </div>
  )
}

// The semantic token set the provider supplies, in the app's default theme.
export function SemanticTokens() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="max-w-md rounded-lg border border-border bg-background p-4 text-foreground">
        <div className="mb-3 flex items-center gap-2">
          <Sun className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Light theme tokens</h3>
        </div>
        <Swatches />
      </div>
    </ThemeProvider>
  )
}

// The same tokens re-resolved under the dark class — the `.dark` scope the
// provider toggles is what every component reads through.
export function DarkTheme() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="dark max-w-md rounded-lg border border-border bg-background p-4 text-foreground">
        <div className="mb-3 flex items-center gap-2">
          <Moon className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Dark theme tokens</h3>
        </div>
        <Swatches />
      </div>
    </ThemeProvider>
  )
}

// What the tokens buy you: a real product surface, light and dark, with no
// per-theme styling in the component itself.
export function ThemedSurfaces() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-background p-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Oppenheimer</CardTitle>
              <CardDescription>42 title-card times logged</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <Clock className="size-4 text-primary" />
                <span className="text-2xl font-bold tabular-nums">6:24</span>
              </div>
              <Button size="sm" className="w-full">
                Log your time
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="dark rounded-lg bg-background p-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Oppenheimer</CardTitle>
              <CardDescription>42 title-card times logged</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <Clock className="size-4 text-primary" />
                <span className="text-2xl font-bold tabular-nums">6:24</span>
              </div>
              <Button size="sm" className="w-full">
                Log your time
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  )
}
