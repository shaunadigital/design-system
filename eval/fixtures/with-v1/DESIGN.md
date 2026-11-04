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
