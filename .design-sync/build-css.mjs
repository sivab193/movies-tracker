#!/usr/bin/env node
// Compiles ui/app/globals.css into the stylesheet the design-system bundle ships.
//
// Two things this does that a plain `tailwindcss -i globals.css` does not:
//   1. Pins the scanned sources explicitly, so the output doesn't depend on where
//      the CLI decides the project root is.
//   2. Safelists a utility vocabulary. Tailwind only emits classes it sees used, so a
//      plain compile yields exactly the classes movies-tracker uses today — designs
//      built in Claude Design use classes this app happens not to, and those would
//      silently render unstyled.
//
// Tokens/theme/base are taken from globals.css verbatim: only its `@import "tailwindcss"`
// line is rewritten, so the design system can never drift from the app's own theme.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(here, '..', 'ui')
const globals = resolve(pkg, 'app/globals.css')
// Both generated files live inside the package so bare `@import`s (tailwindcss,
// tw-animate-css) resolve against ui/node_modules. Both are gitignored.
const entry = resolve(pkg, '.ds-entry.css')
const out = resolve(pkg, '.ds-styles.css')

// Kept deliberately tight: this list is multiplied out, and every extra axis costs
// megabytes in the shipped stylesheet. Colors are the design system's semantic tokens
// only — no palette colors, because a design using `bg-blue-500` is off-brand by
// definition. (Utility-scale colors the app itself uses, e.g. the amber/rose gradient
// in MovieCard, still get emitted via the @source scan above.)
const COLORS =
  'background,foreground,card,card-foreground,popover,popover-foreground,primary,primary-foreground,' +
  'secondary,secondary-foreground,muted,muted-foreground,accent,accent-foreground,destructive,' +
  'destructive-foreground,border,input,ring,chart-1,chart-2,chart-3,chart-4,chart-5'
const ALPHA = ',/10,/20,/30,/50,/70,/90'
const SPACE = '0,px,0.5,1,1.5,2,2.5,3,3.5,4,5,6,7,8,9,10,11,12,14,16,20,24,28,32'
// Sizing runs past the spacing scale: a poster is w-56, a panel is h-96. Designs reach for
// these constantly, and an absent class is silent — the element just renders unsized.
const SIZE = `${SPACE},36,40,44,48,52,56,60,64,72,80,96`
const N12 = '1,2,3,4,5,6,7,8,9,10,11,12'

// Each entry is expanded by Tailwind's brace expansion into concrete class names.
const SAFELIST = [
  // color utilities, with the variants a design will realistically reach for
  `{,hover:,dark:,dark:hover:,group-hover:}{bg,text,border,ring}-{${COLORS}}{${ALPHA}}`,
  `{fill,stroke,from,to,via}-{${COLORS},transparent,current}`,
  `{bg,text,border}-{transparent,current,white,black}`,
  // spacing
  `{,sm:,md:,lg:}{p,px,py,pt,pb,pl,pr,m,mx,my,mt,mb,ml,mr,gap,gap-x,gap-y,space-x,space-y}-{${SPACE}}`,
  `{,sm:,md:,lg:}{m,mx,my,mt,mb,ml,mr}-auto`,
  // sizing
  `{,sm:,md:,lg:}{w,h,size,min-w,min-h,max-w,max-h}-{${SIZE},auto,full,screen,fit,min,max,dvh,svh}`,
  `{,sm:,md:,lg:}max-w-{xs,sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,prose,none}`,
  `{,sm:,md:,lg:}{w,h}-{1/2,1/3,2/3,1/4,3/4,1/5,2/5,3/5,4/5}`,
  // layout & flex/grid
  `{,sm:,md:,lg:}{flex,grid,block,inline,inline-flex,inline-block,hidden,contents,table}`,
  `{,sm:,md:,lg:}grid-cols-{${N12},none,subgrid}`,
  `{,sm:,md:,lg:}{col-span,row-span}-{${N12},full}`,
  `{,sm:,md:,lg:}grid-rows-{1,2,3,4,5,6}`,
  `{,sm:,md:,lg:}flex-{row,col,row-reverse,col-reverse,wrap,nowrap,1,auto,initial,none}`,
  `{,sm:,md:,lg:}{items,self}-{start,center,end,baseline,stretch}`,
  `{,sm:,md:,lg:}{justify,content}-{start,center,end,between,around,evenly,stretch}`,
  `{shrink,grow}{,-0}`,
  `order-{1,2,3,4,5,6,first,last,none}`,
  // position
  `{,sm:,md:,lg:}{static,relative,absolute,fixed,sticky}`,
  `{inset,top,right,bottom,left}-{0,auto,full,1,2,3,4,6,8}`,
  `z-{0,10,20,30,40,50,auto}`,
  // typography
  `{,sm:,md:,lg:}text-{xs,sm,base,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,8xl,9xl}`,
  `{,sm:,md:,lg:}text-{left,center,right,justify}`,
  `font-{thin,extralight,light,normal,medium,semibold,bold,extrabold,black,sans,mono}`,
  `leading-{none,tight,snug,normal,relaxed,loose,3,4,5,6,7,8,9,10}`,
  `tracking-{tighter,tight,normal,wide,wider,widest}`,
  `{underline,line-through,no-underline,uppercase,lowercase,capitalize,normal-case,truncate,italic,text-balance,text-pretty}`,
  `{,group-hover:,hover:}{underline,no-underline}`,
  `line-clamp-{1,2,3,4,5,6,none}`,
  `whitespace-{normal,nowrap,pre,pre-line,pre-wrap}`,
  `{break-words,break-all,text-nowrap,text-wrap}`,
  // borders, radius, shadow, effects
  `rounded{,-none,-xs,-sm,-md,-lg,-xl,-2xl,-3xl,-full}`,
  `rounded-{t,b,l,r,tl,tr,bl,br}-{none,sm,md,lg,xl,2xl,3xl,full}`,
  `border{,-0,-2,-4,-8}`,
  `border-{t,b,l,r,x,y}{,-0,-2,-4,-8}`,
  `border-{solid,dashed,dotted,none}`,
  `{,hover:,dark:}shadow{,-2xs,-xs,-sm,-md,-lg,-xl,-2xl,-none,-inner}`,
  `opacity-{0,5,10,20,25,30,40,50,60,70,75,80,90,95,100}`,
  `{,hover:,group-hover:}scale-{95,100,105,110}`,
  `{,group-hover:}{translate-x,translate-y}-{0,1,2,4}`,
  `-{translate-x,translate-y}-{1,2,4}`,
  `backdrop-blur{,-none,-xs,-sm,-md,-lg,-xl,-2xl}`,
  `blur{,-none,-xs,-sm,-md,-lg,-xl}`,
  `bg-gradient-to-{t,tr,r,br,b,bl,l,tl}`,
  `bg-{cover,contain,center,no-repeat}`,
  `object-{cover,contain,fill,center,none}`,
  `aspect-{square,video,auto}`,
  // interaction & overflow
  `overflow-{auto,hidden,visible,scroll,x-auto,y-auto,x-hidden,y-hidden}`,
  `cursor-{pointer,default,not-allowed,wait,text}`,
  `{select-none,select-text,pointer-events-none,pointer-events-auto,outline-none}`,
  `transition{,-all,-colors,-opacity,-transform,-shadow,-none}`,
  `duration-{75,100,150,200,300,500,700,1000}`,
  `ease-{linear,in,out,in-out}`,
  `animate-{none,spin,ping,pulse,bounce}`,
  `{disabled:,}{opacity-50,pointer-events-none,cursor-not-allowed}`,
  // columns/lists
  `{list-none,list-disc,list-decimal}`,
  `{divide-x,divide-y}`,
]

let css = readFileSync(globals, 'utf8')
const importRe = /@import\s+['"]tailwindcss['"]\s*;/
if (!importRe.test(css)) {
  throw new Error(`expected an @import "tailwindcss" in ${globals} — the app's Tailwind setup changed`)
}

const injected = [
  '@import "tailwindcss" source(none);',
  '@source "./app/**/*.{ts,tsx}";',
  '@source "./components/**/*.{ts,tsx}";',
  '@source "./contexts/**/*.{ts,tsx}";',
  '@source "./lib/**/*.{ts,tsx}";',
  // The preview cards are real consumers of this stylesheet — scanning them guarantees
  // every class they use is emitted, instead of failing silently at render time.
  '@source "../.design-sync/previews/**/*.tsx";',
  ...SAFELIST.map((s) => `@source inline("${s}");`),
].join('\n')

writeFileSync(entry, css.replace(importRe, injected))
execFileSync('npx', ['@tailwindcss/cli', '-i', entry, '-o', out, '--minify'], { cwd: pkg, stdio: 'inherit' })
console.log(`\nwrote ${out}`)
