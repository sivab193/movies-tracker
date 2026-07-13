#!/usr/bin/env node
// The "package build" movies-tracker doesn't otherwise have.
//
// It's a private Next app, not a published library: no dist/, no types. The converter
// needs two things this produces:
//   1. ui/.ds-styles.css  — the compiled Tailwind stylesheet (see build-css.mjs).
//   2. ui/dist/types/**   — declarations, so <Name>Props carries the real API
//                           (Button's variant/size unions, etc.) instead of a stub.
//
// Run this before package-build.mjs. Both outputs are gitignored.
import { execFileSync } from 'node:child_process'
import { readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(here, '..', 'ui')

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  )

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: pkg, stdio: 'inherit', ...opts })

console.log('── stylesheet ──')
run('node', [resolve(here, 'build-css.mjs')])

console.log('\n── declarations ──')
run('rm', ['-rf', resolve(pkg, 'dist/types')])
// tsc exits non-zero on type errors but still emits declarations (noEmitOnError is off).
// The app's own `next build` is the gate for type errors — don't fail the sync on them.
try {
  run(resolve(pkg, 'node_modules/.bin/tsc'), ['-p', resolve(here, 'tsconfig.dts.json')])
} catch {
  console.warn('! tsc reported type errors — declarations still emitted; continuing')
}
console.log('wrote ui/dist/types')

// The .d.ts entry barrel. The converter resolves a component's props by looking up
// <Name>Props, and when there isn't one (every shadcn component — they inline
// `React.ComponentProps<'button'> & VariantProps<...>` instead) it falls back to reading
// the component's call signature off the *types entry*. Without this file that entry
// doesn't exist, the fallback dies, and 80 of 86 components ship `[key: string]: unknown`.
console.log('\n── types entry ──')
const decls = walk(resolve(pkg, 'dist/types/components'))
  .filter((p) => p.endsWith('.d.ts'))
  .sort()
const barrel = decls
  .map((p) => `export * from './${relative(pkg, p).replace(/\.d\.ts$/, '')}';`)
  .join('\n')
writeFileSync(resolve(pkg, 'index.d.ts'), `${barrel}\n`)
console.log(`wrote ui/index.d.ts (${decls.length} modules)`)
