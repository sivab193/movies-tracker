# design-sync notes — movies-tracker

Repo-specific gotchas for future syncs. Read this before re-running the sync.

## What this repo is

Not a component library — a **Next.js app** (`ui/`, private, `next build` only). There is no
Storybook, no `dist/`, no published entry. Everything the converter needs is therefore
*manufactured* by `.design-sync/build.mjs`, which must run before `package-build.mjs`
(it is `cfg.buildCmd`). It produces:

- `ui/.ds-styles.css` — the compiled Tailwind stylesheet (`build-css.mjs`; `cfg.cssEntry`).
- `ui/dist/types/**` — declarations (`tsconfig.dts.json`), so props aren't stubs.
- `ui/index.d.ts` — the types-entry barrel. **Load-bearing, see below.**

All three are gitignored build outputs. `.design-sync/fonts/` is *not* — it's durable.

## The three things that were hard to get right

- **`ui/index.d.ts` is why props exist.** The converter resolves a component's props by
  finding `<Name>Props`; when there isn't one it falls back to reading the call signature
  off the *types entry*. Every shadcn component inlines its props
  (`React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>`) instead of
  declaring `ButtonProps`, so they all take the fallback — and without a types entry the
  fallback silently dies and **80 of 86 components ship `[key: string]: unknown`**.
  The barrel is generated in `build.mjs`. Don't delete it.

- **`ds-process-shim.mjs` must stay FIRST in `cfg.extraEntries`.** `lib/firebase.ts` reads
  `process.env.NEXT_PUBLIC_*`. Next inlines those at build time; esbuild does not, so the
  bundle throws `ReferenceError: process is not defined` on load, the whole IIFE dies, and
  *nothing* lands on `window.MoviesTracker` (validate reports `[BUNDLE_EXPORT] 86/86`).
  The converter emits `extraEntries` ahead of the main entry, which is the only reason a
  shim module can win the race. Leaving the env vars undefined is correct, not a hack:
  `lib/firebase` skips init when unconfigured and `AuthProvider` settles into the
  logged-out state — which is the state designs should be composed against, and it keeps
  credentials out of the uploaded artifact.

- **Tailwind is JIT — the shipped stylesheet is static.** A plain compile of `globals.css`
  emits only the classes *this app already uses*: `grid-cols-7` was present, `grid-cols-3`
  was not. Designs would then use classes that silently don't exist. `build-css.mjs`
  therefore safelists an explicit utility vocabulary (`@source inline(...)`) on top of the
  app's own scan. **Arbitrary values (`w-[220px]`, `h-[320px]`) can never work** in a
  static stylesheet — they cost real debugging time here (previews rendered unsized and
  blown up). Previews and designs must stick to the standard scale. `.design-sync/previews/`
  is in the `@source` scan so preview classes are always emitted; designs written in
  Claude Design are NOT scanned, hence the rule is stated in `conventions.md`.

## Preview authoring conventions (established during the first sync)

- Import components from `'movies-tracker'` (shimmed to `window.MoviesTracker`).
- Shared sample data lives in `.design-sync/previews/_fixtures.ts` — realistic movies
  (Oppenheimer, RRR, Barbie…), inline-SVG posters so nothing hits the network. `_fixtures.ts`
  is `.ts` not `.tsx`, so the converter doesn't mistake it for a component preview.
- **Compound subparts get the parent composition as their preview** (`CardHeader.tsx`
  renders a whole `Card`). A subpart rendered alone is either a crash or a meaningless box.
- Overlays (Dialog, AlertDialog, DropdownMenu, Popover, Select) need `defaultOpen` plus a
  height wrapper, and `cfg.overrides.<Name>.cardMode: "single"` so the open state renders
  inside the card instead of escaping it.
- `MovieCard` needs a `w-64` wrapper; at full card width the poster dominates and the
  "TITLE AT" banner wraps.

## Theme quirks that look like bugs but aren't

- **`--accent` is the brand red, not a neutral.** Stock shadcn uses a near-grey accent; this
  theme sets `--accent: oklch(0.65 0.2 25)`. Consequences: `Skeleton` (which is `bg-accent`)
  renders as *red* loading blocks, and `hover:bg-accent` gives ghost/outline buttons a red
  hover. This is how the product genuinely looks — don't "fix" it in previews. It is called
  out in `conventions.md` so the design agent isn't surprised.

## Known render warns (triaged, expect these)

- `[RENDER_THIN] ThemeProvider` — it's a context provider with no visual output of its own.
  Its preview renders themed swatches to give the card something true to show.

## Gotchas for future preview authors

- **Grep classes against `ds-bundle/_ds_bundle.css`, not `ds-bundle/styles.css`.** The latter
  is a 57-byte file containing only two `@import`s, so checking a class against it reports
  everything as missing. (Escape Tailwind's `.` `/` `:` `[` and check the right boundary, or
  `.h-4` false-positives on `.h-40`.)
- `preview-rebuild.mjs` does NOT re-run `build-css.mjs`. The stylesheet is frozen to the
  safelist plus whatever the app itself uses — so a few arbitrary values do exist by accident
  (e.g. `aspect-[2/3]`, because `movie-card-skeleton.tsx` uses it). Don't rely on that.

## Re-sync risks

- **`.design-sync/fonts/` is lifted from `ui/.next`.** `build-fonts.mjs` reads
  `ui/.next/static/media` — a **disposable build artifact that won't exist on a fresh
  clone**. The fonts themselves are committed, so a normal sync is fine; only re-run
  `build-fonts.mjs` (after a `next build`) if `app/layout.tsx` changes its typeface.
  If the app ever switches away from `next/font/google`, this script's assumptions break.
- **`dtsPropsFor` inlines domain types.** `MovieCard`/`MovieGrid`/`AddWatchDialog` reference
  `Movie` / `WatchHistoryEntry` from `lib/types.ts`, which the converter emits as a bare
  type name it never imports (invalid TS). The config inlines those shapes by hand — so
  **they silently rot when `lib/types.ts` changes**. Re-check them against `lib/types.ts`
  on any sync that follows a types change.
- The 4 no-prop components (`BottomNav`, `Footer`, `Header`, `MovieCardSkeleton`) have
  explicit empty `dtsPropsFor` bodies. If any of them gains a prop, remove its entry.
- `Geist Mono` is in `cfg.runtimeFontPrefixes` (suppressing `[FONT_MISSING]`): the
  `--font-mono` token names it but the app never actually loads it. If the app starts
  using it, ship it via `extraFonts` instead.
