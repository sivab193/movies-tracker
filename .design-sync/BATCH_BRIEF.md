# Preview-authoring brief (movies-tracker design-sync)

You are authoring preview cards for a design system built from **movies-tracker** — a movie
tracking app whose signature feature is logging *when the title card appears* in a film.
Repo root: `/Users/sivab/coding/movies-tracker`. Work from the repo root.

Each preview is a `.tsx` file whose **named exports each become one labeled card cell**.
These cards are browsed by humans and imitated by Claude's design agent, so they must look
like real product surfaces.

## Hard rules (violating these corrupts other agents' work)

1. **Only touch your assigned files**: `.design-sync/previews/<Name>.tsx` for YOUR components,
   your `.design-sync/.cache/review/<Name>.grade.json`, and your learnings file
   `.design-sync/learnings/<BATCH_ID>.md`. **Never** edit `.design-sync/config.json`,
   `NOTES.md`, `_fixtures.ts`, or another agent's previews.
2. **Never run `package-build.mjs` or `package-validate.mjs`** — they rewrite the shared
   bundle and would race every other agent. Your ONLY build commands are:
   ```
   node .ds-sync/lib/preview-rebuild.mjs --config .design-sync/config.json \
     --node-modules ui/node_modules --out ./ds-bundle --components <YOUR,COMPONENTS>
   node .ds-sync/package-capture.mjs --out ./ds-bundle --components <YOUR,COMPONENTS>
   ```
   Never run `package-capture.mjs` unscoped.
3. **Never write a grade for a sheet you haven't Read this iteration.**
4. If the same root cause hits 2+ of your components — or even once if it's config-level
   (provider / CSS / font / import resolution) — **STOP on those** and record it in your
   learnings file. It's the orchestrator's job, not a per-component workaround.

## How to write a preview

```tsx
import { Card, CardHeader, CardTitle } from 'movies-tracker'   // always this specifier
import { MOVIE, MOVIES } from './_fixtures'                     // shared sample data

export function Basic() {            // one named export = one card cell
  return <Card>…</Card>
}
```

- **`import … from 'movies-tracker'`** — it's shimmed to the bundle's global. Never import
  from a relative source path.
- **Sample data**: `.design-sync/previews/_fixtures.ts` exports `MOVIES` (5 realistic films),
  `MOVIE` (Oppenheimer), `MOVIE_UNREPORTED` (Barbie — no logged time), and `WATCH_ENTRY`.
  Read it first. Do NOT edit it. Icons: `lucide-react` is available.
- **Realistic content only.** Real film titles, real theaters (PVR ICON, AGS Cinemas),
  title-card times like `6:24`, INR ticket prices. Never `foo` / `test` / `Lorem ipsum`.
- **2–6 exports per component.** Canonical use first, then the main variant axis, then
  statically-renderable states (disabled, loading, empty, error, open).

## The two constraints that will bite you

- **NO arbitrary Tailwind values.** `w-[220px]`, `h-[320px]`, `text-[13px]` **silently do
  nothing** — the shipped stylesheet is static and only contains an enumerated vocabulary.
  Use the standard scale only: `w-56`, `h-80`, `max-w-sm`, `grid-cols-3`, `gap-4`,
  `text-sm`, `bg-primary`, `text-muted-foreground`. If a class you want might not exist,
  check: `grep -F '.w-56' ui/.ds-styles.css`.
- **Subparts get the PARENT composition.** A component like `CardHeader`, `DialogTitle`, or
  `TableRow` renders nothing meaningful (or throws) on its own. Its preview must render the
  **full, realistic parent composition** — `CardHeader.tsx` renders a complete `Card` that
  happens to feature a `CardHeader`. That's the only render that's true. It is fine and
  expected for several files in a family to look similar; vary the content so each card is
  still worth looking at, and lead with the export that best showcases *that* subpart.

## Overlays

Dialog / AlertDialog / DropdownMenu / Popover / Select families are already configured with
`cardMode: "single"` and `primaryStory: "Open"` — so **every one of those components must
export a story named exactly `Open`** that renders the overlay in its open state
(`defaultOpen` on the root, e.g. `<Dialog defaultOpen>`, `<DropdownMenu defaultOpen>`).
Wrap in a fixed-height container (`h-80`, `h-96`) so the open content has room. Radix
portals render into the body, so the content escapes small cards otherwise.

## Your loop

1. Read the component's source under `ui/components/` (and its emitted contract at
   `ds-bundle/components/general/<Name>/<Name>.d.ts`) so you use its real API.
2. Write `.design-sync/previews/<Name>.tsx` for each of your components.
3. Run preview-rebuild, then package-capture (scoped to your components).
4. **Read** every sheet at `ds-bundle/_screenshots/review/general__<Name>.png`.
5. Grade each cell into `.design-sync/.cache/review/<Name>.grade.json`:
   ```json
   {"cells": {"Open": {"verdict": "good", "note": "…"}}}
   ```
   Keys must exactly equal the export names (the capture log prints them).
   Rubric — all three must hold for `good`:
   - **Styled**: the DS's tokens/fonts visibly applied (red primary, Inter, real borders) —
     not browser-default text or unstyled boxes.
   - **Complete**: renders whole — no missing children, no collapsed/zero-height layout.
   - **Plausible**: a DS author would recognize it as sensible use.
6. `needs-work` is an in-progress state, not a final answer: fix the `.tsx`, rebuild,
   recapture, re-read, regrade — until every cell is `good`.

When done, report: components authored, cells graded good, anything you had to skip, and
any config-level issue you hit (also write it to your learnings file).
