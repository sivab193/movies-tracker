# Building with the movies-tracker design system

A movie-tracking product (**MediaVerse**). Its signature feature — and the thing its UI is
built around — is crowd-sourcing *when the title card appears* in a film. Components are
shadcn/ui primitives (Radix + CVA) plus app components that carry the product's identity.

## Setup

Wrap the tree in **`DesignSystemProvider`**. It supplies the theme (which is what puts the
`light`/`dark` class on `<html>`, and therefore what activates the token set) and the auth
context that `Header` and `BottomNav` read. Without it, those components throw and
everything else renders untokenized.

```jsx
const { DesignSystemProvider, Button, Card, CardHeader, CardTitle, CardContent } = window.MoviesTracker

<DesignSystemProvider>
  <div className="min-h-screen bg-background text-foreground p-8">…</div>
</DesignSystemProvider>
```

Auth is in its logged-out state, so `Header` shows "Sign in". That is correct — don't try to
fake a signed-in user.

**Dark mode**: put `dark` on a wrapping element (`<div className="dark bg-background">`).
Every `dark:` utility resolves against a `.dark` ancestor. The product is dark-first —
design for both.

## The styling idiom: Tailwind v4 utilities over semantic tokens

Style with utility classes bound to **semantic tokens**, never raw palette colors. The brand
is a saturated red (`oklch(55% .22 25)`) carried entirely by `--primary`.

| Family | Use these — the full vocabulary |
|---|---|
| Surfaces | `bg-background` `bg-card` `bg-popover` `bg-muted` `bg-secondary` `bg-accent` `bg-primary` `bg-destructive` |
| Text | `text-foreground` `text-muted-foreground` `text-primary` `text-primary-foreground` `text-card-foreground` `text-secondary-foreground` `text-destructive` |
| Borders/rings | `border` `border-border` `border-input` `ring-ring` |
| Charts | `bg-chart-1` … `bg-chart-5` (also `text-`/`fill-`/`stroke-`) |
| Opacity | suffix any color: `bg-primary/10` `border-primary/20` (`/10 /20 /30 /50 /70 /90`) |
| Radius | `rounded-sm|md|lg|xl|2xl|full` — `--radius` is `0.75rem`, so cards read soft |
| Variants | `hover:` `dark:` `dark:hover:` `group-hover:` `sm:` `md:` `lg:` |

Each has a light and dark value already; `bg-card text-card-foreground` is legible in both.
Type is **Inter** (shipped) and applies automatically — you don't need `font-sans`.

**`--accent` is red here, not a neutral.** Unlike stock shadcn, this theme sets accent to the
brand red, so `bg-accent` and `hover:bg-accent` are *red* — that's why `Skeleton` loading
states read as red blocks, and why ghost/outline buttons get a red hover. Intentional. When
you want a neutral fill, reach for `bg-muted` or `bg-secondary`.

### The one hard constraint: no arbitrary values

The stylesheet is **static and pre-generated**. Arbitrary values —`w-[220px]`, `h-[320px]`,
`text-[13px]`, `bg-[#ff0000]` — **produce no CSS at all** and fail silently: the element just
renders unstyled. Nothing warns you.

Use the standard scale only: widths/heights `w-56 h-80 w-96 max-w-sm max-w-4xl`, spacing
`p-4 gap-6 space-y-4` (0–32, plus 36–96 for sizing), grids `grid-cols-1..12`, text
`text-xs..text-9xl`. Same rule for colors — a color that isn't a token above doesn't exist.

## Where the truth is

- **`styles.css`** at the design-system root, and the files it `@import`s — the real tokens,
  defined in `:root` and `.dark`. Read it before inventing a color.
- **`components/<Group>/<Name>/<Name>.prompt.md`** — per-component usage, and `.d.ts` for the
  exact prop contract (e.g. `Button` has `variant`, `size`, `asChild`).
- Groups: **Actions**, **Forms**, **Overlays**, **Data display**, **Movies**, **Layout**.

## An idiomatic screen

Library components for the controls; utilities over tokens for your own layout glue.

```jsx
<DesignSystemProvider>
  <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <MovieGrid movies={movies} />
      <Button>Log a title card</Button>
    </main>
  </div>
</DesignSystemProvider>
```

`MovieCard`/`MovieGrid` take a `movie` object (`title`, `posterUrl`, `runtime`,
`submissionCount`, `averageTimeSeconds`) — `averageTimeSeconds` drives the amber "TITLE AT"
banner, and `null` renders the muted "Not reported yet" state instead.
