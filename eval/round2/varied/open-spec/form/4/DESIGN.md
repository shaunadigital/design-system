# DESIGN.md: shauna.dev

## 1. Visual Theme & Atmosphere
A designer's portfolio. Calm, precise and editorial: white paper, near-black ink and one deep ocean-blue accent.
Large, light, all-caps headlines over plain, readable body text. Generous white space, few colors, nothing decorative.

## 2. Color Palette & Roles
| Role | Hex | Use |
|---|---|---|
| Paper | #FFFFFF | Page and card backgrounds |
| Sand | #EEF4FA | Pale blue bands and quiet surfaces |
| Ink | #0B1416 | Primary text, primary buttons |
| Muted | #55656A | Secondary text, captions |
| Accent | #0263AC | Links, labels, the one accent per view |
| Accent tint | #E6EFF7 | Selected and hover backgrounds |
| Accent line | #9CC3EA | Thin accent borders |
| On ink | #FFFFFF | Text on ink fills |
Text contrast stays at 4.5:1 or more in every state. Use only these colors; do not invent tints or greys.

## 3. Typography Rules
- Families: Unbounded for headlines (Light 300, all caps; Medium 500 mixed case for small titles), Archivo for
  everything else, JetBrains Mono for code only.
- Scale (px): 88, 56, 48, 46, 32, 28, 22, 18, 16, 14, 12. No other sizes.
  56 page titles, 46 section headings, 28 card and smaller headings, 22 lead, 18 large body, 16 body and buttons,
  14 captions, 12 labels.
- Labels: Archivo 500, 12px, all caps, letter-spacing 0.14em.
- Letter-spacing values: -0.03, -0.02, -0.01, 0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14em. No others.

## 4. Component Stylings
- Buttons: pill shape (999px radius), at least 44px tall, labels in Title Case, 16px. Primary: ink fill, white text.
  Quiet: no fill, ink text.
- Cards: white, 16px radius, thin border, generous padding.
- Inputs: labeled, 16px text, 12px radius.
- Icons: 24px grid, drawn in currentColor; decorative unless they are the only label.

## 5. Layout Principles
- Spacing on a 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96. Corner radii: 8, 12, 16, or full pill.
- Desktop: 12 columns, 32px gutters, 64px margins. Phone: one column, 20px margins.

## 6. Depth & Elevation
Mostly flat. Soft, low shadows only on floating layers (menus, dialogs), tinted with ink, never pure black.

## 7. Do's and Don'ts
- Do keep text contrast at 4.5:1 or more. Do give every image alt text and every control a label.
- Do write button labels in Title Case. Don't use em dashes anywhere in copy.
- Don't move anything on hover unless it is a link or a button.
- Motion: one curve, cubic-bezier(0.2, 0.7, 0.2, 1); 120ms hover, 180ms buttons, 320ms panels. Stop loops when
  reduced motion is set.

## 8. Responsive Behavior
Touch targets at least 44px. Menus stack and toolbars wrap on phones.

## 9. Agent Prompt Guide
Use only the colors, sizes, radii, spacing and letter-spacing listed above. If something you need isn't listed,
pick the nearest listed value rather than inventing one.
