# DESIGN.md · read by people and by Claude

The rules for shauna.dev. Claude reads this before writing any UI here, and
`npm run check:ui` turns the checkable ones into a build failure.
Tokens live in `tokens/tokens.json`; `src/styles/tokens.css` is generated from it.

## Colour
- Palette (Waikīkī, 2026-10-18): white paper, ink, one accent (Deep End #0263AC, the painting's water)
  and `--live` (#E26D7E) for small "live" dots and the second card shadow only. `--sand` is the pale blue band.
- Text uses `--ink`, `--muted` or `--accent-text` (and `--on-ink` on an ink fill). `--accent` passes
  for text by day (6.2:1) but keep text on `--accent-text`, so the two can split again later.
- `--live` and the art palette (trade-wind, frond, pink-palace, sky, lagoon, art-sand, palm) are graphics and
  swatches only. Never text, buttons or states. `--rescue*` is the rescue app's own purple (faf-app design-system.css), for its case study art.
- Koa is for small marks only.
- No raw hex or rgb values in component styles. Add a token instead.

Two themes, day and dusk, from the same roles. Dusk values live in tokens.json -> dusk; the
switch is in the header and the first visit follows the system setting. To stay correct in both:
- Text on a solid --ink fill uses --on-ink (white by day, dark at dusk). Never --white for that.
- Surfaces that stay dark in both themes (footer, terminals, code, phone bodies) use --deep with
  --white or the --term-* colours.
- Shadows use rgba(var(--shadow-rgb), a), never --ink-rgb (ink turns light at dusk).
- Icons draw in currentColor; paper knockouts follow --paper. Never hardcode an icon colour.
- check:ui tests every contrast pair in both themes.

## Type
- Two families (2026-10-18). Unbounded (`--font-display`, `--font-hero`): Light 300 in capitals for
  headlines, case study titles and project names; Medium 500 in mixed case for small titles (lead and
  title sizes). Never Unbounded Light below about 22px. Archivo (`--font-body`, `--font-label`) for reading,
  for labels in spaced capitals, and for the wordmark. JetBrains Mono (`--font-mono`) only for code.
  Vujahday Script (`--font-script`) only as the System page's specimen.
- Twelve sizes, all tokens (`--text-*`): script 88, display-xl 56 (page titles), hero 48 (big numbers), heading 46
  (section headings, project names), statement 32, title 28, step 28 (smaller headings), lead 22, body-l 18, body 16,
  small 14, label 12. Headings are always Unbounded Light in capitals at display-xl, heading or step; nothing else uses Unbounded
  except the statement and big numbers. One label style: Archivo 500, 12px, spaced capitals.
- Every `font-size` is a `--text-*` token. The only exceptions are print sizes (pt) and
  type inside a scaled illustration (cqw). Need a new size? Add a token, don't type a number.

## Letter-spacing and the wordmark (2026-10-18)
- Every letter-spacing is a `--tracking-*` token or 0: tighter (-0.03em), tight (-0.02em), snug (-0.01em), loose (0.02em),
  wordmark (0.04em), wide (0.06em), wider (0.08em), caps (0.1em), caps-wide (0.12em), label (0.14em). check:ui enforces it.
- The logo wordmark (System 2) is the `.wordmark` class in v2.css: Archivo 800, width 112, caps, `--tracking-wordmark`.
  Where it is used, set only size and colour. Values live in tokens.json "wordmark". shauna.digital uses the same system
  ("SHAUNA.DIGITAL").

## Space and layout
- 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Desktop: 12 columns, 32px gutters, 64px margins. Phone: one column, 20px margins.

## Buttons
- Use the `.btn` pill. Never hand-style a link as a button.
- Labels in Title Case. No em dashes anywhere in copy.
- Title Case is for labels the interface writes: buttons, menu items, tabs. Text a person wrote (chat titles,
  file names, project names) keeps the case they typed, even inside a button. Mark it with `data-user-content`
  on the element that holds it, so check:ui knows to leave it alone. (Added 2026-10-19 after the UI Checks eval:
  every v1 sidebar failed on chat titles; see eval/README.md.)
- Accent shape for the main action, ink for the rest. `.btn--fill` (ink fill, accent shape) for Email Me;
  `.btn--plain` (no shape) for the quiet second button.

## Icons
- 24px grid, 2px padding. Rescue set: 1.8 outline, filled when selected.
  shauna.dev set: solid ink with paper cut-outs.
- One accent per icon, a tile when selected, one small movement.
- Every icon is decorative (`aria-hidden`) unless it is the only label, then `aria-label`.

## Motion
- One curve: `--ease`. Three speeds: fast 120ms (hover, press), base 180ms
  (buttons, toggles, X-ray), slow 320ms (panels, sections).
- Stop every loop when `prefers-reduced-motion` is set. Looping video also gets a pause button.
- Only things you can click move on hover. A card that lifts promises a click; if it
  isn't a link or button, it stays still.

## Accessibility
- Text contrast at or above 4.5:1 in every state.
- Every image has alt text (`alt=""` only when purely decorative).
- Every button and link has a visible label or an `aria-label`.
- Touch targets at least 44px.

## Components (2026-10-19, v3 of the eval)
Sizes and spacing for the shared components, so every build of one looks like the same component. All values are tokens.
- **Card:** 400px wide. Padding `--space-6` (32px), `--radius-card`, 1px border in `rgba(var(--ink-rgb), 0.1)` on `--card`. Label (Archivo 500,
  `--text-label`, `--tracking-label`, caps, `--accent-text`), then the title (Unbounded Light caps, `--text-step`), 8px apart.
  `--space-5` (24px) between the other groups. Price in Unbounded Light at `--text-hero`, unit in `--text-small` `--muted`.
  Included items: `--text-body`, 12px apart, a 16px check icon in `--accent-text`. One full-width primary button at the bottom.
- **Dialog:** 480px wide. Padding `--space-6`, `--radius-card`, `--card`, shadow `0 24px 48px -24px rgba(var(--shadow-rgb), 0.35)`.
  Title in Unbounded Medium 500, mixed case, `--text-lead`. Message `--text-body`, `--muted`, 12px below the title.
  Buttons right-aligned, 12px apart, `--space-6` below the message: the quiet button (no fill, ink text) first, the main
  action (ink pill) last.
- **Menu:** the trigger is an ink outline pill. The open panel sits 8px below it, left-aligned with it: 240px wide, 8px
  padding, `--radius-md`, `--card`, 1px border in `rgba(var(--ink-rgb), 0.1)`, the dialog shadow. Items are 44px tall, 12px side padding,
  `--radius-sm`, `--text-body`. A 1px divider in `rgba(var(--ink-rgb), 0.1)` (8px margin) before a destructive item. No red: Delete stays ink.
- **Sidebar:** 280px wide, 640px tall, `--sand` background, padding `--space-4` (16px), no radius. A full-width ink pill
  New Chat button, then the section label (label style, `--muted`) 24px below it. Chat rows are 44px tall, 12px side
  padding, `--radius-sm`, `--text-small`, 4px apart. The active row: `--accent-tint` background, `--accent-text`, weight 600.
- **Chat composer:** 720px wide, min 112px tall, padding `--space-4`, `--radius-card`, `--card`, 1px border in `rgba(var(--ink-rgb), 0.1)`.
  The text box fills the top (no border of its own, `--text-body`); a row at the bottom holds the attach button on the
  left and the send button on the right, both 44px circles with 20px icons; send is ink with an `--on-ink` icon.

## Screens (v4: added after the 12-screen suite test, where layouts, form fields and buttons drifted)
- **Page layout:** every app screen sits on `--paper` (white), never a tinted page. Content is one column, max 1120px
  wide, centered, with `--space-7` (48px) above it and `--space-6` (32px) side padding. The top row is the page
  title on the left (Unbounded Light caps, `--text-heading`) and the screen's one primary action on the right.
  Sections stack `--space-6` (32px) apart. Group related content in cards (`--card`, 1px border in
  `rgba(var(--ink-rgb), 0.1)`, `--radius-card`, padding `--space-5`); don't put cards on tinted panels.
- **Navigation:** when a screen has app navigation, it's a top bar the full width of the page: 64px tall, `--paper`,
  a 1px bottom border in `rgba(var(--ink-rgb), 0.1)`, links in `--text-small` weight 500, the current one in
  `--accent-text`.
- **Form fields:** inputs, selects and text areas use the site's type, never the browser's: `font: inherit`,
  `--text-body`, `--ink` text, placeholder in `--muted`. 44px tall (text areas 112px), padding 0 12px, 1px border in
  `rgba(var(--ink-rgb), 0.2)`, `--radius-md`, white fill; focus ring 2px `--accent`. Labels sit 8px above in the label
  style (Archivo 500, `--text-label`, `--tracking-label`, caps, `--muted`). Fields stack 24px apart.
- **Buttons: three kinds, one size.** All are 44px tall pills (`--radius-pill`), padding 0 20px, Archivo 600,
  `--text-small`. Primary: `--ink` fill, `--on-ink` text, one per screen. Secondary: no fill, 1.5px `--ink` border,
  `--ink` text. Quiet: no fill, no border, `--ink` text, for Cancel, Skip and row actions. No other button styles:
  no blue buttons, no square buttons, no small buttons. Destructive actions use Secondary; there is no red.
- **Tables and lists:** header row in the label style, rows 52px tall, 1px dividers in `rgba(var(--ink-rgb), 0.1)`,
  `--text-small` text. Status values are pills: `--accent-tint` fill, `--accent-text`, `--text-label`, weight 600,
  padding 2px 10px.

## Look (v6: an editorial, refined look for every app screen; overrides the Screens section where they differ)
- **Top of page:** a 6px `--accent` bar across the full width of the page. Below it, the page title in Unbounded
  Light caps at 64px, line-height 1, on the left; the one primary action on the right, vertically centred on the title.
  A 2px `--ink` rule runs under the title row, 24px below it. Content starts 32px under the rule.
- **Flat, not boxed:** no cards around tables or lists. The content sits directly on `--paper`, max 1120px wide.
- **Search and filters:** one row under the rule. A search field has its label inline to the left in the label style;
  the field is 44px tall, 320px wide, 1.5px `--ink` border, `--radius-sm`. Filter buttons use the Secondary button.
- **Tables and lists:** the header row has an `--ink` fill with `--on-ink` text in the label style, 44px tall. Rows are
  64px tall with 1px dividers in `rgba(var(--ink-rgb), 0.15)`. Body text is 16px. The first column (company, invoice,
  person) is 18px, weight 600. Money and key figures are `--accent-text`, 18px, weight 600, tabular numbers, right
  aligned. A list of people uses the same table treatment.
- **Status tags:** uppercase label style, padding 4px 12px, `--radius-sm`. Default: 1.5px `--ink` border, `--ink`
  text, no fill. Done (Won, Paid): `--accent` fill, `--on-ink` text. Needs attention (Overdue): `--ink` fill,
  `--on-ink` text.
- **Buttons stay as the Buttons rule says:** dark pills. No blue buttons, no square buttons.
