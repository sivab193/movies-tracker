#!/usr/bin/env node
// Generates .design-sync/docs/<name>.md — one short doc per component.
//
// Two jobs:
//   1. `category:` frontmatter sets the component's GROUP. Without this every one of the 86
//      components lands in a single flat "general" group (the converter derives the group
//      from the src dir, and shadcn keeps them all in components/ui), which makes the
//      Design System pane unbrowsable.
//   2. The one-line description tells the design agent what the component is FOR. The
//      converter appends the generated `## Props` section underneath, so nothing is lost.
//
// Committed (durable). Edit the descriptions here, not the emitted .md files.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = join(dirname(fileURLToPath(import.meta.url)), 'docs')

// group → { Component: description }
const DOCS = {
  Actions: {
    Button:
      'The primary action control. Six variants (`default` is the brand red, `destructive` for deletes, plus `secondary`/`outline`/`ghost`/`link`) and six sizes including icon-only. Set `asChild` to render a link as a button.',
  },
  Forms: {
    Input: 'Single-line text field. Used for movie search and the title-card time entry.',
    Textarea: 'Multi-line text field — e.g. the optional note on a title-card submission.',
    Label: 'Accessible label for a form control. Pair via `htmlFor` with the control `id`.',
    Checkbox: 'Boolean toggle for lists and filters. Compose with `Label` for a clickable row.',
    Switch: 'On/off toggle for immediate settings (e.g. dark mode, leaderboard visibility).',
    DatePicker:
      'Controlled date field. `value`/`onChange` use `YYYY-MM-DD` strings; `min`/`max` bound the range. Used for the watch date.',
    Select: 'Dropdown list. Compose `SelectTrigger` + `SelectValue` with `SelectContent` items.',
    SelectTrigger: 'The button that opens a `Select`. Contains a `SelectValue`.',
    SelectValue: 'Renders the current `Select` selection, or its `placeholder` when empty.',
    SelectContent: 'The popover listbox of a `Select`. Holds `SelectItem`s, groups and separators.',
    SelectItem: 'One option inside `SelectContent`. Requires a `value`.',
    SelectGroup: 'Groups related `SelectItem`s under a `SelectLabel`.',
    SelectLabel: 'A non-selectable heading for a `SelectGroup` (e.g. a city above its theaters).',
    SelectSeparator: 'A divider between `SelectGroup`s.',
    SelectScrollUpButton: 'Scroll affordance shown at the top of a long `SelectContent`.',
    SelectScrollDownButton: 'Scroll affordance shown at the bottom of a long `SelectContent`.',
    SubmissionForm:
      "The product's signature interaction: log when the title card appears. Validates the entered time against the movie runtime.",
  },
  Overlays: {
    Dialog: 'Modal dialog. Compose `DialogTrigger` + `DialogContent`; use `defaultOpen`/`open` to control it.',
    DialogTrigger: 'The control that opens a `Dialog`.',
    DialogContent: 'The modal panel. Portals to the body and renders above a `DialogOverlay`.',
    DialogHeader: 'Header region of a `DialogContent` — wraps `DialogTitle` and `DialogDescription`.',
    DialogTitle: 'The accessible title of a `Dialog`. Required for screen readers.',
    DialogDescription: 'Supporting text under a `DialogTitle`.',
    DialogFooter: 'Footer region of a `DialogContent` — right-aligned action buttons.',
    DialogClose: 'Closes the enclosing `Dialog`. Use `asChild` to wrap your own button.',
    DialogOverlay: 'The dimmed backdrop behind a `DialogContent`.',
    DialogPortal: 'Portals dialog parts to the document body. Rendered for you by `DialogContent`.',
    AlertDialog:
      'Confirmation dialog for destructive or irreversible actions — it deliberately has no dismiss-on-outside-click.',
    AlertDialogTrigger: 'The control that opens an `AlertDialog`.',
    AlertDialogContent: 'The modal panel of an `AlertDialog`.',
    AlertDialogHeader: 'Header region — wraps `AlertDialogTitle` and `AlertDialogDescription`.',
    AlertDialogTitle: 'The question being confirmed, e.g. "Delete this watch entry?".',
    AlertDialogDescription: 'Explains the consequence of confirming.',
    AlertDialogFooter: 'Footer holding `AlertDialogCancel` and `AlertDialogAction`.',
    AlertDialogAction: 'The confirming button. Give it the `destructive` styling for deletes.',
    AlertDialogCancel: 'The dismissing button. Always offer it.',
    AlertDialogOverlay: 'The dimmed backdrop behind an `AlertDialogContent`.',
    AlertDialogPortal: 'Portals alert-dialog parts to the body. Rendered for you by `AlertDialogContent`.',
    DropdownMenu: 'Contextual action menu opened from a trigger.',
    DropdownMenuTrigger: 'The control that opens a `DropdownMenu`. Use `asChild` to wrap a `Button`.',
    DropdownMenuContent: 'The floating menu panel holding items, groups and separators.',
    DropdownMenuItem: 'A single action. Set `variant="destructive"` for deletes.',
    DropdownMenuCheckboxItem: 'A menu item with a checked state — for toggling columns or filters.',
    DropdownMenuRadioGroup: 'Groups `DropdownMenuRadioItem`s into a single-choice set (e.g. sort order).',
    DropdownMenuRadioItem: 'One mutually-exclusive choice inside a `DropdownMenuRadioGroup`.',
    DropdownMenuLabel: 'A non-interactive heading inside a menu (e.g. "Signed in as …").',
    DropdownMenuSeparator: 'A divider between menu sections.',
    DropdownMenuShortcut: 'Right-aligned keyboard-shortcut hint on a menu item.',
    DropdownMenuGroup: 'Groups related menu items.',
    DropdownMenuSub: 'A nested submenu.',
    DropdownMenuSubTrigger: 'The item that opens a `DropdownMenuSub`.',
    DropdownMenuSubContent: 'The nested submenu panel.',
    DropdownMenuPortal: 'Portals menu parts to the body. Rendered for you by `DropdownMenuContent`.',
    Popover: 'Non-modal floating panel anchored to a trigger — for filters and detail peeks.',
    PopoverTrigger: 'The control that opens a `Popover`.',
    PopoverContent: 'The floating panel of a `Popover`.',
  },
  'Data display': {
    Card: 'The core surface. Compose `CardHeader` / `CardContent` / `CardFooter`.',
    CardHeader: 'Top region of a `Card` — holds `CardTitle`, `CardDescription` and an optional `CardAction`.',
    CardTitle: 'The heading of a `Card`.',
    CardDescription: 'Muted supporting line under a `CardTitle`.',
    CardContent: 'The main body region of a `Card`.',
    CardFooter: 'Bottom region of a `Card` — typically actions.',
    CardAction: 'Slots a control (icon button, menu) to the right edge of a `CardHeader`.',
    Table: 'Data table root. Used for watch history and the leaderboard.',
    TableHeader: 'The `<thead>` region, holding a `TableRow` of `TableHead` cells.',
    TableBody: 'The `<tbody>` region holding data `TableRow`s.',
    TableFooter: 'The `<tfoot>` region — e.g. a totals row summing ticket spend.',
    TableRow: 'One row. Hover styling is built in.',
    TableHead: 'A header cell.',
    TableCell: 'A data cell.',
    TableCaption: 'A caption below the table describing its contents.',
    Tabs: 'Tabbed panel switcher. Set `defaultValue` to the initially selected tab.',
    TabsList: 'The row of tab triggers.',
    TabsTrigger: 'One tab button. Its `value` pairs with a `TabsContent`.',
    TabsContent: 'The panel shown when its `value` is the selected tab.',
    Skeleton: 'Animated loading placeholder. Mirror the shape of the content it stands in for.',
  },
  Movies: {
    MovieCard:
      'The product\'s signature card: poster, runtime pill, and the "TITLE AT" banner showing the crowd-sourced average time the title card appears — or a muted "Not reported yet" when no one has logged it.',
    MovieCardSkeleton: 'Loading placeholder matching `MovieCard`\'s shape. Use while a grid loads.',
    MovieGrid:
      'Responsive grid of `MovieCard`s with built-in loading (skeletons) and empty states. Takes `movies`; does not fetch.',
    AddMovieDialog: 'Dialog for searching OMDb and adding a movie to the tracker.',
    AddWatchDialog:
      'Dialog for logging (or editing, via `initialData`) a cinema visit — theater, showtime, ticket and food cost.',
  },
  Layout: {
    Header: 'The top app bar: brand, primary nav, theme toggle, and the auth control.',
    BottomNav: 'Mobile bottom navigation bar. Hidden at `md` and up, where `Header` nav takes over.',
    Footer: 'Site footer with secondary links.',
    ThemeProvider:
      'Supplies light/dark theme and puts the theme class on `<html>` — which is what activates the token set. Wrap the app in it (it is inside `DesignSystemProvider` already).',
  },
}

mkdirSync(out, { recursive: true })
let n = 0
for (const [category, comps] of Object.entries(DOCS)) {
  for (const [name, description] of Object.entries(comps)) {
    writeFileSync(join(out, `${name}.md`), `---\ncategory: ${category}\n---\n\n${description}\n`)
    n++
  }
}
console.log(`wrote ${n} docs → .design-sync/docs/`)
