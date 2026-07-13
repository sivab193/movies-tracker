#!/usr/bin/env node
// Refreshes .design-sync/fonts/ from the app's own Next build. Run rarely — only when the
// app changes its typeface (ui/app/layout.tsx) — not on every sync: the fonts it produces
// are durable, committed files, while its INPUT (ui/.next) is a disposable build artifact
// that won't exist on a fresh clone.
//
// Why copy at all: layout.tsx loads Inter through next/font/google, which downloads the
// woff2s at build time and rewrites them under .next/static/media with build-specific
// hashes. The design system can't depend on that, so we lift the files into the durable
// tree under content-addressed names and write a plain @font-face sheet beside them.
//
// Requires a prior `next build` (or `next dev`) in ui/.
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const chunks = resolve(here, '..', 'ui/.next/static/chunks')
const out = resolve(here, 'fonts')

if (!existsSync(chunks)) {
  console.error('✗ ui/.next not found — run `npm run build` (or `npm run dev`) in ui/ first')
  process.exit(1)
}

// The @font-face rules live in whichever CSS chunk Next emitted them into.
const sheets = readdirSync(chunks)
  .filter((f) => f.endsWith('.css'))
  .map((f) => join(chunks, f))
  .filter((f) => /@font-face/.test(readFileSync(f, 'utf8')))

const faces = sheets.flatMap((f) => {
  const css = readFileSync(f, 'utf8')
  return [...css.matchAll(/@font-face\{[^}]*\}/g)].map((m) => ({ rule: m[0], sheet: f }))
})

mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) rmSync(join(out, f))

const pick = (rule, prop) => new RegExp(`${prop}:\\s*([^;}]+)`).exec(rule)?.[1]?.trim()
const rules = []
let bytes = 0

for (const { rule, sheet } of faces) {
  const family = pick(rule, 'font-family')
  // "Inter Fallback" is a metrics-only local() face — nothing to ship.
  if (!family?.includes('Inter') || family.includes('Fallback')) continue
  const url = /url\(([^)]+)\)/.exec(rule)?.[1]
  if (!url) continue
  const src = resolve(dirname(sheet), url.replace(/['"]/g, ''))
  if (!existsSync(src)) {
    console.warn(`! missing ${src}`)
    continue
  }
  const buf = readFileSync(src)
  const name = `inter-${createHash('sha1').update(buf).digest('hex').slice(0, 8)}.woff2`
  writeFileSync(join(out, name), buf)
  bytes += buf.length

  const decls = [
    `  font-family: 'Inter'`,
    `  font-style: normal`,
    `  font-weight: ${pick(rule, 'font-weight') ?? '100 900'}`,
    `  font-display: ${pick(rule, 'font-display') ?? 'swap'}`,
    `  src: url('./${name}') format('woff2')`,
  ]
  const range = pick(rule, 'unicode-range')
  if (range) decls.push(`  unicode-range: ${range}`)
  rules.push(`@font-face {\n${decls.join(';\n')};\n}`)
}

if (!rules.length) {
  console.error('✗ no Inter @font-face rules found in the Next build — did layout.tsx change its font?')
  process.exit(1)
}

const header = `/* Inter — the brand typeface, as movies-tracker's own app loads it.
   Lifted from the woff2 files next/font/google resolved for \`Inter({ subsets: ['latin'] })\`
   in ui/app/layout.tsx, so the design system renders in the same font the product does.
   Filenames are content-hashed (Next's build hashes are not stable across builds).
   Regenerate with .design-sync/build-fonts.mjs. */

`
writeFileSync(join(out, 'inter.css'), header + rules.join('\n\n') + '\n')
console.log(`wrote ${rules.length} @font-face rules, ${(bytes / 1024).toFixed(0)} KB → .design-sync/fonts/`)
