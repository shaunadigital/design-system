# shauna.dev Design System: Figma plugin

Builds the Figma library from `tokens/tokens.json`, so Figma reads the same values as the site.

## Run it (Figma desktop app)

1. `npm run figma:plugin` (only after a token change; `code.js` is committed).
2. Figma desktop: create a new, empty design file.
3. Menu: Plugins > Development > Import plugin from manifest, and pick `figma-plugin/manifest.json`.
4. Plugins > Development > shauna.dev Design System. It runs once and closes with a summary.

## What it makes

- Variables: Color (Day, plus Dusk when the plan allows a second mode), Art (not for text), Space, Radius, Type size, Font.
- Text styles for the type scale (DM Serif Display, LINE Seed JP, Unbounded for the pins headline).
- Tokens page: color swatches and type specimens.
- Components page: Button (Style: Default, Fill, Text; State: Default, Hover; a Label text property) and Card.
  Every fill, stroke, padding, gap and radius is bound to a variable.

## Notes

- Fonts it can't find fall back to Inter; the closing message says so. Install the font, then swap.
- On the free Starter plan, Dusk is skipped (one mode per collection). On a paid plan, run it again in a new file.
- Source: `src/plugin.js`. `code.js` is generated; don't edit it by hand.
