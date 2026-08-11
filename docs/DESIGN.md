# EMS Design Guidelines

Source of truth: the EMS Figma file — https://www.figma.com/design/mepxJgiSCHOGlvKEeHWXh2/EMS?node-id=0-1
Key frames: Login `3:1169`, Dashboard `1:2`, Batches List `227:687`, Create Batch `230:871`,
Batch/View `329:1094`, Internees List `24:576`, Create Internee `246:860`,
Tenure step `251:970`, Add Batch modal `295:806`.

The app is **dark-only**. All tokens live in `src/app/globals.css`; use them (`bg-card`,
`text-primary`, …) rather than raw hex, except where a Figma-exact value is called out below.

## Typography

- Family: **Lexend** (loaded in `src/app/layout.tsx` as `--font-sans`). Never introduce another UI font.
- Figma weights: Light 300 for body/labels, SemiBold 600 for headings. In practice:
  `font-bold` page titles (`text-2xl`), `font-light`/normal body, small labels at 11px inside inputs.

## Color rules

- Base surface `#16151C` (`--background`), cards slightly lighter (`--card`).
- **Lime green** (`--primary`) = brand/primary: active nav item, primary form buttons (Save),
  active pagination page, "Active" status, focus rings.
- **Blue** (`--secondary`, ≈ #308dbe/#1c86bb in Figma) = secondary accent with specific jobs:
  - list-page toolbar CTAs ("Create New Batch" etc.) are **blue, not lime**
  - checkbox checked state
  - login input borders and floating labels
  - the word "System" in the EMS wordmark; "BRAINS" in the logo
- Status chips: tinted bg + colored text — Upcoming = blue, Active = lime, Closed = red/destructive.
- Primary button gradient (login): `#5d973f → #b6d232`, **top-to-bottom**, radius 10px.
  Use **dark text** on lime, never white — Figma shows white but it fails contrast (deliberate deviation).

## Surfaces & layout

- App pages sit on **ambient radial glows**: green bottom-left, blue top-right
  (see `src/app/(app)/layout.tsx`). Don't remove them; content cards are opaque on top.
- Sidebar is a **floating rounded card** (inset ~16px, `rounded-2xl`, bordered), not a flush bar.
  Nav active state: lime text, dark pill bg, lime left indicator, `font-semibold`.
- Page pattern: `PageHeader` (bold title + muted subtitle/breadcrumb like
  "Batch List > Create New Batch", bell-in-circle right) → one big `rounded-xl bg-card` content card.
- Radius scale: `--radius: 0.75rem`. Cards ~16–20px, inputs/buttons ~10–12px. Keep corners soft.

## Tables (list pages)

- Toolbar inside the card: search (icon-left) + filters left, blue CTA right.
- Generous rows (`py-3.5` cells, `h-12` headers) — airy, not dense.
- Row actions: ghost icon buttons — Eye (view), Pencil (edit), Trash (delete w/ confirm).
- Pagination: "Showing [size ▾]" left, "Showing X to Y out of Z records" center,
  chevrons + windowed page numbers right; active page outlined in lime.

## Forms

- Labels above fields (app forms); **login only** uses Figma's floating-label style
  (label inside the field, always-on blue border).
- Placeholder text: "Enter here" / "Select".
- Days Of Week = toggle chips, not a text input (deliberate improvement over Figma).
- Footer: centered `Cancel` (outline) + `Save` (lime primary).

## Known Figma mistakes — do NOT copy

- "Add New Employee" button label on Batches/Internees lists → use entity-correct labels.
- Batch View frame header says "Create Batch" → use the batch name + breadcrumb.
- Batch form "Score" field → removed; score lives on the tenure (confirmed decision).
- White text on lime buttons → use dark text (contrast).

## Verifying against Figma

The Figma MCP works with the owner's account but the **Starter plan caps reads at ~6 calls/month**.
Spend them surgically: one full-canvas screenshot of page `0:1` captures every frame at once;
reserve per-frame calls for close-ups.
