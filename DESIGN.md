# DESIGN.md · read by people and by Claude

The rules for shauna.dev. Claude reads this before writing any UI here, and
`npm run check:ui` turns the checkable ones into a build failure.
Tokens live in `tokens/tokens.json`; `src/styles/tokens.css` is generated from it.

## Colour
- Palette (one teal, shared with shauna.digital): white paper, ink, one accent
 (deep teal #1F6A75, shauna.digital's accent-ink; #5FB3BF at dusk) and `--live` (#E26D7E) for small "live" dots and the
  second card shadow only. `--sand` is the pale teal band (#E4F0F2) and the tint behind callouts and active states;
  `--wash` (#F6F8F8) is the lightest surface (browser frame bar, top of the pins felt).
- Fewer colours: nine base colours, and every role uses one of them by Day (tokens.json
  `$colorGroups`; the token build fails if a role drifts). Colours for a single component (browser frame, terminal,
  pins card) are listed as component colours. Before adding a colour, reuse a role; add a role only when Dusk needs
  it to differ.
- Text uses `--ink`, `--muted` or `--accent-text` (and `--on-ink` on an ink fill). `--accent` passes
  for text by day (6.2:1) but keep text on `--accent-text`, so the two can split again later.
- `--live` is a graphic only. Never text, buttons or states. `--rescue*` is the rescue app's own purple (faf-app design-system.css), for its case study art.
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
- Two families, the same as shauna.digital . DM Serif Display
 (`--font-display`, `--font-hero`), weight 400, sentence case, for page titles, section headings, one callout per band
  and big numbers; item and card titles are LINE Seed JP 700 at body-l. LINE Seed JP
 (`--font-body`, `--font-label`; 400 and 700, 800 for the wordmark: 500 renders as 400, 600 as 700) for reading, labels
  in spaced capitals and the wordmark. Self-hosted (src/styles/fonts.css, public/fonts/). One exception: the homepage
  pins headline keeps Unbounded Light in capitals (`--font-pins`, Google Fonts). JetBrains Mono (`--font-mono`) only for code.

- Twelve sizes, all tokens (`--text-*`): pins 84 (homepage headline only), display-xl 56 (page titles), hero 48 (big numbers), heading 46
 (section headings, project names), statement 32, title 28, step 28 (smaller headings), lead 22, body-l 18, body 16,
  small 14, label 12. Headings are DM Serif Display at display-xl or heading. Two small text styles. Label: LINE Seed JP 700, 12px,
  spaced capitals (`.label`, `.meta`), for data labels. Subtitle: `.subtitle`, LINE Seed JP 400, 14px, sentence case,
  `--muted`, directly under a heading for category, type or read time.
- Serif for headlines only: DM Serif Display is for page titles (h1), section headings (h2 at
  display sizes), one callout, pull quote or call to action headline per band, and big numbers. Never under 28px.
  Item and card titles (cards, list rows, blog list, resume jobs): `.t-item` in v2.css, LINE Seed JP 700, body-l,
  line-height 1.35, tracking 0, balanced wrap. Group labels: the `.label` style. Negative tracking only at 32px and up.
  check:ui fails any rule that sets the serif with a text token under 28px (step, lead, body-l, body, small, label);
  a documented exception carries `/* serif-ok: why */` inside the rule (the pull quote `.callout`, the case study
  question `.ncards-q`, the homepage wave ribbon).
- No closing period on section headings (h2, h3); page titles (h1) keep theirs. Exceptions: the homepage "Selected work."
  and "I'm Shauna." keep their accent period because it echoes the wordmark period.
- Every `font-size` is a `--text-*` token. The only exceptions are print sizes (pt) and
  type inside a scaled illustration (cqw). Need a new size? Add a token, don't type a number.

## Letter-spacing and the wordmark
- Every letter-spacing is a `--tracking-*` token or 0: tighter (-0.03em), tight (-0.02em), snug (-0.01em), loose (0.02em),
  wordmark (0.05em), wide (0.06em), wider (0.08em), caps (0.1em), caps-wide (0.12em), label (0.14em). check:ui enforces it.
- The logo wordmark (System 2) is the `.wordmark` class in v2.css: LINE Seed JP 800, caps, `--tracking-wordmark` (as on shauna.digital).
  Where it is used, set only size and colour. Values live in tokens.json "wordmark". shauna.digital uses the same system
 ("SHAUNA.DIGITAL").
- The logo lockup (one spec on both sites): the S mark + the wordmark, as `.lockup` / `.lockup-s` in v2.css.
  All in em of the name's font-size, from the `--wordmark-*` tokens: S height 1.32em (`--wordmark-mark`), gap 0.4em
 (`--wordmark-gap`), no vertical offset (centred, line-height 1). Name never under 14px (`--wordmark-min`; below that,
  the S alone). Clear space 0.5em on every side (`--wordmark-clear`). S colour: `--accent` on light, `--mark-on-deep`
  on the dark footer. shauna.digital also pulls its period in (`--wordmark-dot-pull`) and colours it like the S.
  Two weights: the first name in the wordmark weight (800), the rest in `--wordmark-weight-2` (400,
  `.wordmark-2`). Both sites set the name in LINE Seed JP.

## Space and layout
- 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Desktop: 12 columns, 32px gutters, 64px margins. Phone: one column, 20px margins.
- No small label above a heading. The heading says what the section is.

## Buttons
- Use `.btn`: a soft-cornered rectangle (radius-sm) with the offset shape behind it.
  Never hand-style a link as a button. One button per area; the second action is `.btn--text` (no box, bold,
  underlined).
- Labels in Title Case. No em dashes anywhere in copy.
- Title Case is for labels the interface writes: buttons, menu items, tabs. Text a person wrote (chat titles,
  file names, project names) keeps the case they typed, even inside a button. Mark it with `data-user-content`
  on the element that holds it, so check:ui knows to leave it alone. (Added after the first eval:
  every v1 sidebar failed on chat titles; see eval/README.md.)
- Three kinds, one size (Screens has the CSS): `.btn--fill` for the main action (Email Me), plain `.btn` for a standalone
  action (Download PDF), `.btn--text` for the second action (Résumé next to Email Me). No others.

## Components
- Tokens and rules keep type, colour and corners consistent, but not size and spacing. Before Claude builds a shared
  component, give it a spec here: width, padding, the gaps between its parts, and which tokens it uses. (In the first eval, specs cut the size drift across ten builds of each component to almost zero.
  Worked examples for a card, dialog, menu, sidebar and composer: eval/fixtures/with-v3/DESIGN.md.)
- Specs scale up to whole screens. When Claude builds screens across a product, also write down the page layout, one
  form-field style, and a small fixed set of buttons (kinds and one size). (In a 12-screen test,
  those three rules cut button styles from 21 to 7 and form-field styles from 11 to 2. This site's are in Screens.)
- Chat composer (`src/components/v2/Composer.astro`, live on /system#composer):
  - Parts: a thread, then the box (chips row, text box, bottom bar). Bar: attach and Context on the left, a hint in
    the middle (hidden on phones), send on the right. Box on `--paper` inside a `--card` panel, both `--radius-card`,
    1px borders in `rgba(var(--ink-rgb), 0.14)`. Send is a 44px ink circle; every other control is at least 44px.
  - States: Empty, Ready, Streaming, Stopped, Error, Finished, plus Listening, Speaking and Interrupted for voice (see Voice and sound). Send is disabled until there is text or a file that
    can send. While streaming, send becomes Stop (same spot, same size) and Esc stops too.
  - The text box grows to 200px, then scrolls. Enter sends, Shift+Enter is a new line, nothing sends during IME input.
  - Attachments and context share one chip row, each removable, focus moves to the next chip. Over 10 MB or past 5
    files: the chip says so in words and a dashed ink border; it never sends.
  - Context is a real menu (menuitemcheckbox, arrows, Home, End, Esc).
  - The thread follows new text only while you are at the bottom; scroll up and a Jump to Latest button appears.
  - Errors are words plus an ink rule, not a colour: "The reply was interrupted. Your message is safe." with Try
    Again. (Koa was retired; add an error role to tokens.json only if Dusk ever needs it.)
  - Every state change is announced in a polite live region. Reduced motion: no caret blink, no pulse, text arrives
    in chunks.
- Sidebar, menu and dialog (`src/components/v2/AppShell.astro`, live on /system#app-shell):
  - Sidebar: 280px wide, `--sand`, padding 16px, a `<nav>` with a label. New Chat (`.btn--fill`, full width) first,
    then each section label (label style, `--muted`), 24px below it. Rows are 44px tall, 12px side padding,
    `--radius-sm`, `--text-small`, 4px apart, one line with an ellipsis. The open chat has `aria-current="page"`, a
    `--card` row, bold text and a 3px ink bar on the left, so it never relies on colour. Chat titles are what a person
    wrote: sentence case, marked `data-user-content`. Under 720px the sidebar folds behind a Chats button
    (`aria-expanded`).
  - Each row has a 44px More button on its right (three dots, `aria-label="More for <title>"`, `aria-haspopup="menu"`).
  - Menu: the same spec as the composer's Context menu. 220px, 4px padding, `--radius-md`, `--card`, 1px border in
    `rgba(var(--ink-rgb), 0.14)`, shadow `0 18px 40px -20px rgba(var(--shadow-rgb), 0.45)`. It opens 8px below its
    button with their right edges lined up, or above when there's no room. Items are 44px, 12px side padding,
    `--radius-sm`, `--text-small`, Title Case; hover and focus are `--sand`, focus adds a 2px inset `--accent-text`
    ring. A 1px divider sits before a destructive item, and Delete stays ink, never red.
  - Menu keys: Enter, Space or the down arrow opens it on the first item, the up arrow on the last. Arrows move and
    wrap, Home and End jump, a letter jumps to the item that starts with it, Esc closes and returns focus to the
    button, Tab closes and moves on, a click outside closes it.
  - Dialog: a native `<dialog>` opened with `showModal()`, so focus stays inside, the page behind is inert and Esc
    closes it. Up to 440px wide, centred, padding 32px, `--radius-card`, `--card`, shadow
    `0 24px 48px -24px rgba(var(--shadow-rgb), 0.35)`, backdrop `rgba(var(--ink-rgb), 0.4)`. The title is an item
    title (`.t-item`), a question for anything destructive ("Delete this chat?"). The message is `--text-body`
    `--muted`, 12px below, and names the thing and what happens to it. A field (label style, then a 44px box on
    `--paper`) sits 24px below the message. Buttons are right-aligned, 24px apart, 32px below: Cancel (`.btn--text`)
    first, the main action (`.btn--fill`) last, named for what it does ("Delete Chat", not "OK").
  - Dialog focus: it opens on the field, or on the main action when there's no field. Save stays disabled until the
    name changes. On close, focus returns to the More button that opened it; after a delete it moves to the next chat,
    or New Chat when none are left. Clicking the backdrop is Cancel.
  - Every change (renamed, pinned, deleted, restored) is announced in a polite live region. Reduced motion: no fade.
- Phone frame: every phone screen on the site sits in `src/components/v2/PhoneFrame.astro`, never a
  hand-made frame. Screens are 390 x 844 (shipped at 780 x 1688). The frame is a thin --deep bezel with no notch;
  bezel 2.4% and corners 11% (screen corners 8.6%) of the phone's own width, from the `device` tokens, so a phone
  has the same shape at any size. Use `flat` for small phones in a grid, and the slot for a video or a screenshot
  with markers. Phones baked into an image are rendered from PhoneFrame itself in a browser, never drawn by hand (how: scripts/bake/README.md). check:ui fails a phone-sized screenshot outside
  the frame; list thumbnails that crop a screen are marked data-thumb.
- Browser frame: every desktop screen in a browser sits in `src/components/v2/BrowserFrame.astro`, never a
  hand-made bar and dots. Its corners, bar, dots and border scale with its own width, so a 264px homepage preview and a
  full-width case study screen are the same shape.

## Screens
These rules apply to every app screen: anything a person works in, such as a dashboard, form, settings page or list.
A builder needs only this file and `tokens.css`.

- **Page layout:** every app screen sits on `--paper` (white), never a tinted page. Content is one column, max 1120px
  wide, centred, with `--space-7` (48px) above it and `--space-6` (32px) side padding (20px on phones). The top row is
  the page title on the left (DM Serif Display 400, sentence case, `--text-heading`) and the screen's one primary
  action on the right. Sections stack `--space-6` (32px) apart. Group related content in cards (`--card`, 1px border in
  `rgba(var(--ink-rgb), 0.14)`, `--radius-card`, padding `--space-5`); don't put cards on tinted panels.
- **Navigation:** when a screen has app navigation, it's a top bar the full width of the page: 64px tall, `--paper`,
  a 1px bottom border in `rgba(var(--ink-rgb), 0.14)`, links in `--text-small` weight 500. The current one has
  `aria-current="page"`, `--accent-text` text and a 2px `--accent` bottom border, so it never relies on colour alone.
  Chat apps use the Sidebar spec in Components instead.
- **Form fields:** inputs, selects and text areas use the site's type, never the browser's: `font: inherit`,
  `--text-body`, `--ink` text, placeholder in `--muted`. 44px tall (text areas 112px), padding 0 `--space-3` (12px),
  1px border in `rgba(var(--ink-rgb), 0.14)`, `--radius-sm`, `--paper` fill; focus ring 2px `--accent-text`. Labels sit
  8px above in the label style (LINE Seed JP 700, `--text-label`, `--tracking-label`, caps, `--muted`). Fields stack
  24px apart.
- **Buttons: three kinds, one size.** All are 44px tall, in LINE Seed JP at `--text-body`.
  - Primary (`.btn .btn--fill`): `--ink` fill, `--on-ink` text, the `--accent` shape behind it. One per screen.
  - Secondary (`.btn`): `--card` fill, 1px `--ink` border, `--ink` text, the `--accent` shape behind it.
  - Quiet (`.btn .btn--text`): no fill, no border, no shape, bold underlined `--ink` text, for Cancel, Skip and row
    actions.
  - No other button styles: no teal fills at rest, no pills, no square corners, no small buttons. Destructive actions
    use Secondary and there is no red. The one exception is the confirm dialog (Components), where the main action is
    Primary and is named for what it does ("Delete Chat").
  - Copy this CSS as it is. Never hand-style a link as a button.

```css
:root { --btn-offset: 7px; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; }

/* Secondary, and the base for all three kinds */
.btn {
  display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 20px;
  border: 1px solid var(--ink); border-radius: var(--radius-sm); background: var(--card); color: var(--ink);
  font-size: var(--text-body); font-weight: 500; white-space: nowrap;
  box-shadow: var(--btn-offset) calc(var(--btn-offset) * -1) 0 0 var(--shape, var(--accent));
  transition: background var(--dur-base) var(--ease), color var(--dur-base) var(--ease), box-shadow var(--dur-slow) var(--ease), border-color var(--dur-base) var(--ease);
}
.btn:hover, .btn:focus-visible { background: var(--ink); color: var(--on-ink); box-shadow: 0 0 0 0 var(--shape, var(--accent)); }

/* Primary */
.btn--fill { background: var(--ink); color: var(--on-ink); border-color: var(--ink); --shape: var(--accent); }
.btn--fill:hover, .btn--fill:focus-visible { background: var(--accent); border-color: var(--accent); color: var(--white); }

/* Quiet */
.btn--text { padding: 0 2px; border: 0; border-radius: 0; background: none; box-shadow: none; font-weight: 600; text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 6px; }
.btn--text:hover, .btn--text:focus-visible { background: none; color: var(--accent-text); box-shadow: none; }

/* Any kind, disabled */
.btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
```

- **Tables and lists:** header row in the label style, rows 52px tall, 1px dividers in `rgba(var(--ink-rgb), 0.1)`,
  `--text-small` text. Status values are pills: `--sand` fill, `--accent-text`, `--text-label`, weight 700,
  `--radius-pill`, padding 2px 10px.

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

## Voice and sound
A reply can be heard, and a phone can buzz when it is done, so the system covers ears and hands as well as eyes.
Values live in tokens.json (`voice`, `sound`, `haptic`). The composer on /system uses all of it.

### Spoken replies
- Answer first, in 60 words or fewer. Offer more ("Want the details?") instead of reading everything out.
- Keep every sentence to 25 words or fewer.
- No markdown: no headings, bullets, numbered lists, bold, tables or code. Say a short list as a sentence: "three things: A, B and C." For more than three, say how many, name the three that matter most, and offer the rest. Name each item in a few words; if an item needs a description, give it its own sentence.
- No links, file paths, file names, site addresses or email addresses read out, even well-known ones like DESIGN.md. Name the place instead: "the System page", "the tokens file", "her site".
- No shorthand a speech engine stumbles on: e.g., i.e., etc., vs., &, or a slash between words. Say the words.
- No emoji.

History: v1 was tested first (eval/voice). Of its 8 failures, 6 were long lists said as one sentence and 2
read "DESIGN.md" aloud, so v2 added the "more than three" list rule and named file names and site addresses.
v2 (tested the same day) read no file names aloud, and Claude followed the list rule every time, but described each
of the three items inside the same sentence, so v3 says to name items in a few words and give descriptions their own sentence.
v3 passed all 60 replies.

### Sound
- Three sounds, one per motion speed: start (fast, two rising notes), done (base, one soft note), error (slow, two
  falling notes). Sine tones, quiet. Off until the person turns Sounds on.
- Never a sound alone: whatever a sound says, the screen and the live region say too.

### Touch
- Three vibration patterns that match the sounds: start, done, error. Only with Sounds on, and only on devices that
  vibrate. Never the only signal.

### Voice input and reading aloud
- Listening shows live captions in the text box. Nothing sends until the person presses send. Esc or the mic stops.
- If the browser has no speech input, the mic is hidden and nothing else changes.
- Reading aloud uses the spoken version of a reply (the rules above). A caption under the reply shows the sentence
  being read. Typing, sending or Esc stops it, and the state reads Interrupted.
