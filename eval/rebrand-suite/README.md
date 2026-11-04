# Rebrand test on the 12 Harbor screens (2026-10-21)

Question: if Harbor gets a new brand, does it reach every screen?

- New brand: new-brand.json (linen, forest ink, burnt orange, Fraunces + Instrument Sans, near-square corners).
- **system**: my system's builds (suite-teams/with-v4). The only change is new-tokens.css. No AI.
- **design-md**: standard DESIGN.md builds (suite-teams/open-spec). A fresh Claude session per screen gets the new
  DESIGN.md (fixtures/design-md) and is asked to apply it (run-rebrand.sh). Sonnet 5.5, safe mode.
- **brand-notes**: brand-notes builds (suite-teams/without). Same, with three lines of new notes (fixtures/brand-notes).
- render.mjs renders before and after, then flags every visible element still showing an old-brand value (colour,
  font, corner) or a value in neither brand (invented). Checked by rendering the system builds with no swap: 576
  elements flagged, so the detector sees the old brand. Hover and focus colours checked by searching the CSS text.

| Group | Screens fully on the new brand | Pieces left in the old brand | Invented values | Cost |
|---|---|---|---|---|
| My system (token file swapped, no AI) | 23/24 | 1 | 0 | none |
| Standard DESIGN.md (Claude applies new DESIGN.md) | 24/24 | 0 | 0 | 13 min, $1.96 |
| Brand notes (Claude applies 3 lines of new notes) | 12/24 | 9 | 25 | 10 min, $1.5 |

Findings:
- Claude applies a new brand well. With a full DESIGN.md: every screen, no old values anywhere in the CSS (hover states
  included), nothing invented. With three lines of notes: everything visibly on brand; the misses are in-between
  shades it had to invent (borders and greys, slightly different screen to screen) and white text left on buttons.
- The token swap does it in one file change. One stray white fill (table-1) was typed by hand.
- The rebrand does not fix drift: the three groups still look like three different apps (list vs table, orange vs black
  primary buttons) because they were built that way.
- Easy case: one self-contained file per screen. A real codebase spreads styles across many files.
