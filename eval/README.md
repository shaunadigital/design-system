# Design Systems That AI Follows eval: does Claude use the design system correctly?

Run on 2026-10-19 for the UI Checks case study (/work/ui-checks). Every number on that page comes from this folder.

## The question

When a fresh Claude session builds a component for shauna.dev, does it follow the design system? And does it do better
with the system than with the kind of brand notes most people hand an AI?

## Method

- **Five components**, the ones the Anthropic Design Systems posting names plus the card from the original test:
  card, menu, dialog, sidebar, chat composer. Prompts and the exact copy each build must use: `components.json`.
- **Four groups, ten fresh sessions per component each** (200 builds in `runs/`):
  - `without`: the folder holds `fixtures/without/BRAND.md`, three lines of brand notes (colors and fonts).
  - `with`: the folder holds DESIGN.md (v1, the live rules on Oct 19) and tokens.css.
  - `with-v2`: the same plus one new rule (`fixtures/with-v2/DESIGN.md`, Buttons section) written after v1's failures.
  - `with-v3`: v2 (now the live DESIGN.md) plus a Components section with each component's size and spacing
    (`fixtures/with-v3/DESIGN.md`), written after the v2 overlays showed widths and spacing still drifting.
- **Same prompt for every group.** Claude Code with Claude Sonnet 5.5 (`--model sonnet`; Claude Code also calls Haiku 5.5 for small background tasks), `--safe-mode` (no user CLAUDE.md,
  memory, skills or plugins), tools limited to Read, Write and Glob, one clean folder per session. `run-one.sh`.
- **Scoring** (`score.mjs`): each build is rendered at 1440px in Chromium with the site's fonts and checked against
  DESIGN.md: type sizes on the scale, palette colors only, radius tokens, tracking tokens, the three families, text
  contrast 4.5:1 (3:1 large), only links and buttons move on hover, transitions on duration tokens and loops off under
  reduced motion, Title Case button labels and no em dashes, labels on controls, 44px touch targets. A build passes
  only if every check passes. Each run folder keeps `component.html`, `score.json` (every issue found) and
  `session.json` (time, turns, model).
- To re-render a `with` build, copy `fixtures/with-v1/tokens.css` (or with-v2) next to its component.html.

## Results (controlled copy, `runs/`)

| Group | Card | Menu | Dialog | Sidebar | Composer |
|---|---|---|---|---|---|
| Brand notes only | 0/10 | 0/10 | 0/10 | 0/10 | 4/10 |
| DESIGN.md v1 + tokens | 10/10 | 10/10 | 10/10 | 0/10 | 10/10 |
| DESIGN.md v2 + tokens | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| DESIGN.md v3 + tokens | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |

How much each component's rendered size varied across its ten builds (standard deviation, width × height, px):

| Group | Card | Menu | Dialog | Sidebar | Composer |
|---|---|---|---|---|---|
| Brand notes only | 8 × 14 | 9 × 90 | 0 × 2 | 0 × 66 | 32 × 16 |
| v2 | 0 × 4 | 6 × 7 | 0 × 16 | 4 × 24 | 24 × 50 |
| v3 | 0 × 8 | 0 × 5 | 0 × 0 | 0 × 0 | 0 × 4 |

All ten v1 failures were the sidebar's chat titles: the titles are buttons, the rules said button labels use Title
Case, and the rules didn't say what happens to text a person wrote. v2 adds that rule plus a `data-user-content`
marker the check can read. All ten v2 sidebars used the marker.

## Rebrand test

`rebrand.mjs` re-renders each build with the New Brand's token values swapped in (dark, coral, Fraunces, square).
All ten system cards followed the new brand. None of the ten brand-notes cards changed. `padshots.mjs` makes the
four images on the case study.

## Earlier run with free copy (`runs-free-copy/`)

The first run let each session write its own copy. Same pattern (0/50 without,
42/50 v1, 50/50 v2), but the
overlays mixed copy with design, so the controlled run replaced it on the site. Kept as a record.

| Group | Card | Menu | Dialog | Sidebar | Composer |
|---|---|---|---|---|---|
| Brand notes only | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 |
| DESIGN.md v1 + tokens | 10/10 | 10/10 | 10/10 | 2/10 | 10/10 |
| DESIGN.md v2 + tokens | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |

## Cost and time

350 sessions in all (including the free-copy run), median about 28 seconds each, about $26 at API list prices (run on a Max plan).

## Added Oct 19 to 20: the standard format and the whole-product test

- **`open-spec`** group: the same values written as a standard DESIGN.md (no tokens file). Components: 40/50, the same
  as v1 (every sidebar failed the user-content Title Case rule). The motion check was changed to judge actual
  durations (120/180/320ms) so this group was not failed for not using token names; other groups were unchanged.
- **Whole-product test** (`screens.json`, `teams.json`, `run-team.sh`, `inventory.mjs`): twelve screens of a made-up
  workspace app, Harbor. Each screen built by its own fresh session, two builds per screen per group, with the
  requests written four ways (platform team, PM, designer, engineer). `suite-same-wording/` is the control with one
  wording. `inventory.mjs` counts distinct button, field, text colour, background, corner and font-size styles.
- **`with-v4`**: v3 plus a Screens section (one page layout, one form-field style, three button kinds at one size),
  written after v3 and the standard format both drifted at suite scale.

| Group (different wording) | Screens passed | Buttons | Fields | Text colours | Corners |
|---|---|---|---|---|---|
| Brand notes | 0/24 | 32 | 14 | 12 | 12 |
| Standard DESIGN.md | 22/24 | 16 | 9 | 4 | 6 |
| My system v3 | 22/24 | 21 | 11 | 4 | 6 |
| My system v4 | 24/24 | 7 | 2 | 4 | 5 |

Scope: one model (Sonnet 5.5), one day, two builds per screen per group, and a checker corrected twice (motion
durations, "as" and friends in the Title Case small words). Treat it as a working result.
