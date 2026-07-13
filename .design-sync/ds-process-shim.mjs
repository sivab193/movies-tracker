// Must stay the FIRST entry in cfg.extraEntries.
//
// movies-tracker is a Next app, and Next inlines `process.env.NEXT_PUBLIC_*` at build
// time. esbuild does not, so lib/firebase.ts's `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`
// survives into the bundle and throws `ReferenceError: process is not defined` the moment
// it loads — taking the whole IIFE down, so nothing lands on window.MoviesTracker.
//
// The converter's bundle entry emits extraEntries ahead of the main entry, so this module
// evaluates before any component (and before Firebase) is imported.
//
// Leaving the vars undefined is the intended state, not a workaround: lib/firebase treats
// absent config as "not configured" and skips initialization, and AuthProvider handles the
// resulting null `auth` by settling into the logged-out state. Designs are composed against
// a logged-out app, and no credentials are baked into an uploaded artifact.
globalThis.process ??= { env: {} }
globalThis.process.env ??= {}
