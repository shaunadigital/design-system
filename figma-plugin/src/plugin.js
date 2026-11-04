// shauna.dev Design System: builds the Figma library from tokens/tokens.json (inlined as TOKENS by build.mjs).
// Run once in a new, empty design file. It creates:
//   variables: Color (Day, plus Dusk when the plan allows modes), Art, Space, Radius, Type size, Font
//   text styles: the type scale
//   pages: Tokens (swatches and type specimens) and Components (Button set, Card)
// Every component fill, stroke, padding, gap and radius is bound to a variable, never a raw value.

const T = TOKENS;
const FALLBACK = { family: 'Inter', style: 'Regular' };
const notes = [];

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: 1 };
}

async function font(family, style) {
  try {
    await figma.loadFontAsync({ family, style });
    return { family, style };
  } catch (e) {
    notes.push(`Font "${family} ${style}" not available, used Inter. Install it and swap later.`);
    await figma.loadFontAsync(FALLBACK);
    return FALLBACK;
  }
}

function boundPaint(variable, opacity = 1) {
  const paint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity };
  return figma.variables.setBoundVariableForPaint(paint, 'color', variable);
}

function bind(node, field, variable) {
  try { node.setBoundVariable(field, variable); } catch (e) { /* field not bindable on this plan or node */ }
}

// ---------- 1. Variables ----------
async function buildVariables() {
  const existing = await figma.variables.getLocalVariableCollectionsAsync();
  if (existing.length) throw new Error('This file already has variables. Run the plugin in a new, empty design file.');

  const v = { color: {}, art: {}, space: {}, radius: {}, size: {}, font: {} };

  // Base: the real palette (tokens.json $colorGroups.base), hidden from pickers.
  const G = T.$colorGroups;
  const baseCol = figma.variables.createVariableCollection('Base');
  const bMode = baseCol.modes[0].modeId; baseCol.renameMode(bMode, 'Value');
  const base = {};
  for (const [name, hex] of Object.entries(G.base)) {
    const variable = figma.variables.createVariable(name, baseCol, 'COLOR');
    variable.setValueForMode(bMode, hexToRgb(hex)); variable.scopes = []; base[name] = variable;
  }

  // Color roles: each points to its base by Day; Dusk (when the plan allows a second mode) uses the dusk hex.
  const color = figma.variables.createVariableCollection('Color');
  const day = color.modes[0].modeId;
  color.renameMode(day, 'Day');
  let dusk = null;
  try { dusk = color.addMode('Dusk'); } catch (e) {
    notes.push('Dusk mode skipped: this Figma plan allows one mode per collection. Upgrade, then run again in a new file.');
  }
  for (const [name, baseName] of Object.entries(G.roles)) {
    const variable = figma.variables.createVariable(name, color, 'COLOR');
    variable.setValueForMode(day, { type: 'VARIABLE_ALIAS', id: base[baseName].id });
    if (dusk) variable.setValueForMode(dusk, hexToRgb((T.dusk.color || {})[name] || T.color[name]));
    variable.setVariableCodeSyntax('WEB', `var(--${name})`);
    v.color[name] = variable;
  }

  // Component colors: one component each.
  const comp = figma.variables.createVariableCollection('Component');
  const cMode = comp.modes[0].modeId; comp.renameMode(cMode, 'Day');
  for (const name of G.component) {
    const variable = figma.variables.createVariable(name, comp, 'COLOR');
    variable.setValueForMode(cMode, hexToRgb(T.color[name]));
    variable.setVariableCodeSyntax('WEB', `var(--${name})`);
    v.color[name] = variable;
  }

  // Art colors are for artwork and swatches, never text (DESIGN.md).
  const art = figma.variables.createVariableCollection('Art (rescue case study only)');
  const artDay = art.modes[0].modeId;
  art.renameMode(artDay, 'Day');
  let artDusk = null;
  if (dusk) { try { artDusk = art.addMode('Dusk'); } catch (e) { /* plan limit */ } }
  for (const [name, hex] of Object.entries(T.art)) {
    const variable = figma.variables.createVariable(name, art, 'COLOR');
    variable.setValueForMode(artDay, hexToRgb(hex));
    if (artDusk) variable.setValueForMode(artDusk, hexToRgb((T.dusk.art || {})[name] || hex));
    variable.scopes = ['ALL_FILLS', 'STROKE_COLOR'];
    v.art[name] = variable;
  }

  const num = (collectionName, entries, scopes) => {
    const c = figma.variables.createVariableCollection(collectionName);
    const mode = c.modes[0].modeId;
    const out = {};
    for (const [name, value] of entries) {
      const variable = figma.variables.createVariable(name, c, 'FLOAT');
      variable.setValueForMode(mode, value);
      if (scopes) variable.scopes = scopes;
      out[name] = variable;
    }
    return out;
  };

  v.space = num('Space', T.space.map((px, i) => [`space-${i + 1}`, px]), ['GAP', 'WIDTH_HEIGHT']);
  v.radius = num('Radius', Object.entries(T.radius).map(([k, px]) => [`radius-${k}`, px]), ['CORNER_RADIUS']);
  v.size = num('Type size', Object.entries(T.type).filter(([k]) => !k.startsWith('$')).map(([k, t]) => [`text-${k}`, t.px]), ['FONT_SIZE']);

  const fonts = figma.variables.createVariableCollection('Font');
  const fMode = fonts.modes[0].modeId;
  for (const [name, stack] of Object.entries(T.font)) {
    const variable = figma.variables.createVariable(`font-${name}`, fonts, 'STRING');
    variable.setValueForMode(fMode, stack.split(',')[0].replace(/'/g, '').trim());
    variable.scopes = ['FONT_FAMILY'];
    v.font[name] = variable;
  }
  return v;
}

// ---------- 2. Text styles ----------
// DM Serif Display for headings and big numbers, LINE Seed JP for everything else (tokens.json, type).
const DISPLAY = ['hero', 'display-xl', 'heading', 'statement', 'step', 'title'];
async function buildTextStyles(v) {
  const serif = await font('DM Serif Display', 'Regular');
  const body = await font('LINE Seed JP', 'Regular');
  const bodyBold = await font('LINE Seed JP', 'Bold');
  const pins = await font('Unbounded', 'Light');
  const styles = {};
  for (const [name, t] of Object.entries(T.type)) {
    if (name.startsWith('$')) continue;
    const s = figma.createTextStyle();
    s.name = `${DISPLAY.includes(name) ? 'Display' : 'Text'}/${name}`;
    s.fontName = name === 'pins' ? pins : DISPLAY.includes(name) ? serif : name === 'label' ? bodyBold : body;
    s.fontSize = t.px;
    s.lineHeight = DISPLAY.includes(name) || name === 'pins' ? { unit: 'PERCENT', value: 105 } : { unit: 'PERCENT', value: 150 };
    if (name === 'label') { s.letterSpacing = { unit: 'PERCENT', value: parseFloat(T.tracking.label) * 100 }; s.textCase = 'UPPER'; }
    if (name === 'pins') s.textCase = 'UPPER';
    s.description = t.use || '';
    try { s.setBoundVariable('fontSize', v.size[`text-${name}`]); } catch (e) { /* plan limit */ }
    styles[name] = s;
  }
  return { styles, fonts: { serif, body, bodyBold } };
}

// ---------- helpers ----------
async function text(chars, style, colorVar) {
  const t = figma.createText();
  await figma.loadFontAsync(style.fontName);
  await t.setTextStyleIdAsync(style.id);
  t.characters = chars;
  t.fills = [boundPaint(colorVar)];
  return t;
}

function autoLayout(node, dir, v, { pad, gap } = {}) {
  node.layoutMode = dir;
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  if (pad) for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) {
    node[side] = pad.value; bind(node, side, pad.variable);
  }
  if (gap) { node.itemSpacing = gap.value; bind(node, 'itemSpacing', gap.variable); }
}

function radius(node, variable, value) {
  node.cornerRadius = value;
  for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) bind(node, c, variable);
}

// ---------- 3. Tokens page ----------
async function buildTokensPage(page, v, ts) {
  await figma.setCurrentPageAsync(page);
  const board = figma.createFrame();
  board.name = 'Tokens';
  autoLayout(board, 'VERTICAL', v, { pad: { value: 64, variable: v.space['space-8'] }, gap: { value: 48, variable: v.space['space-7'] } });
  board.fills = [boundPaint(v.color.paper)];
  page.appendChild(board);

  board.appendChild(await text('Color', ts.styles.heading, v.color.ink));
  const grid = figma.createFrame();
  grid.name = 'Swatches';
  grid.layoutMode = 'HORIZONTAL';
  grid.layoutWrap = 'WRAP';
  grid.resize(1200, 100);
  grid.primaryAxisSizingMode = 'FIXED';
  grid.counterAxisSizingMode = 'AUTO';
  grid.itemSpacing = 24; grid.counterAxisSpacing = 24;
  grid.fills = [];
  for (const [name, variable] of Object.entries(v.color)) {
    const cell = figma.createFrame();
    cell.name = name;
    autoLayout(cell, 'VERTICAL', v, { gap: { value: 8, variable: v.space['space-2'] } });
    cell.fills = [];
    const chip = figma.createRectangle();
    chip.resize(120, 72);
    chip.fills = [boundPaint(variable)];
    chip.strokes = [boundPaint(v.color.ink, 0.1)];
    radius(chip, v.radius['radius-md'], T.radius.md);
    cell.appendChild(chip);
    cell.appendChild(await text(name, ts.styles.small, v.color.ink));
    cell.appendChild(await text(T.color[name], ts.styles.label, v.color.muted));
    grid.appendChild(cell);
  }
  board.appendChild(grid);

  board.appendChild(await text('Type', ts.styles.heading, v.color.ink));
  for (const [name, style] of Object.entries(ts.styles)) {
    if (name === 'pins') continue;
    const row = figma.createFrame();
    row.name = name;
    autoLayout(row, 'HORIZONTAL', v, { gap: { value: 24, variable: v.space['space-5'] } });
    row.counterAxisAlignItems = 'BASELINE';
    row.fills = [];
    const tag = await text(`${name} · ${T.type[name].px}px`, ts.styles.label, v.color.muted);
    tag.resize(200, tag.height); tag.textAutoResize = 'HEIGHT';
    row.appendChild(tag);
    row.appendChild(await text('Land in Hawaiʻi, together', style, v.color.ink));
    board.appendChild(row);
  }
}

// ---------- 4. Components ----------
// Button (v2.css .btn): radius-sm, 44px tall, 20px sides, offset accent shape 7px up-right that slides home on hover.
const BUTTONS = [
  { style: 'Default', state: 'Default', bg: 'card', fg: 'ink', border: 'ink', shape: 'accent' },
  { style: 'Default', state: 'Hover', bg: 'ink', fg: 'on-ink', border: 'ink', shape: null },
  { style: 'Fill', state: 'Default', bg: 'ink', fg: 'on-ink', border: 'ink', shape: 'accent' },
  { style: 'Fill', state: 'Hover', bg: 'accent', fg: 'white', border: 'accent', shape: null },
  { style: 'Text', state: 'Default', bg: null, fg: 'ink', border: null, shape: null },
  { style: 'Text', state: 'Hover', bg: null, fg: 'accent-text', border: null, shape: null },
];

async function buildButton(page, v, ts) {
  const bold = ts.fonts.bodyBold;
  const variants = [];
  for (const b of BUTTONS) {
    const c = figma.createComponent();
    c.name = `Style=${b.style}, State=${b.state}`;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisSizingMode = 'AUTO';
    c.counterAxisSizingMode = 'FIXED';
    c.primaryAxisAlignItems = 'CENTER';
    c.counterAxisAlignItems = 'CENTER';
    c.resize(160, 44);
    c.itemSpacing = 8; bind(c, 'itemSpacing', v.space['space-2']);
    const side = b.style === 'Text' ? 2 : 20;
    c.paddingLeft = side; c.paddingRight = side;
    if (b.style !== 'Text') radius(c, v.radius['radius-sm'], T.radius.sm);
    c.fills = b.bg ? [boundPaint(v.color[b.bg])] : [];
    c.strokes = b.border ? [boundPaint(v.color[b.border])] : [];
    c.strokeWeight = 1;
    if (b.shape) {
      const shadow = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 1 }, offset: { x: 7, y: -7 }, radius: 0, spread: 0, visible: true, blendMode: 'NORMAL' };
      c.effects = [figma.variables.setBoundVariableForEffect(shadow, 'color', v.color[b.shape])];
    }
    const label = figma.createText();
    await figma.loadFontAsync(bold);
    await label.setTextStyleIdAsync(ts.styles.body.id);
    label.fontName = bold;
    label.characters = 'Book a Session';
    label.fills = [boundPaint(v.color[b.fg])];
    if (b.style === 'Text') label.textDecoration = 'UNDERLINE';
    c.appendChild(label);
    variants.push(c);
  }
  const set = figma.combineAsVariants(variants, page);
  set.name = 'Button';
  set.layoutMode = 'HORIZONTAL';
  set.layoutWrap = 'WRAP';
  set.resize(640, 200);
  set.primaryAxisSizingMode = 'FIXED';
  set.counterAxisSizingMode = 'AUTO';
  set.itemSpacing = 32; set.counterAxisSpacing = 32;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 32;
  const key = set.addComponentProperty('Label', 'TEXT', 'Book a Session');
  for (const child of set.children) {
    const t = child.findOne((n) => n.type === 'TEXT');
    if (t) t.componentPropertyReferences = { characters: key };
  }
  set.description = 'One button per area: Fill for the main action, Text for the second. Labels in Title Case. Hover slides the offset shape home. Source: v2.css .btn, DESIGN.md Buttons.';
  return set;
}

// Card (eval/fixtures/with-v3/DESIGN.md, current fonts): 400px, space-6 padding, radius-card, 1px ink 10% border.
async function buildCard(page, v, ts, buttonSet) {
  const c = figma.createComponent();
  c.name = 'Card';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'FIXED';
  c.resize(400, 100);
  for (const s of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) { c[s] = 32; bind(c, s, v.space['space-6']); }
  c.itemSpacing = 24; bind(c, 'itemSpacing', v.space['space-5']);
  radius(c, v.radius['radius-card'], T.radius.card);
  c.fills = [boundPaint(v.color.card)];
  c.strokes = [boundPaint(v.color.ink, 0.1)];
  c.strokeWeight = 1;

  const head = figma.createFrame();
  head.name = 'Heading';
  autoLayout(head, 'VERTICAL', v, { gap: { value: 8, variable: v.space['space-2'] } });
  head.fills = [];
  head.appendChild(await text('One-on-One', ts.styles.label, v.color['accent-text']));
  head.appendChild(await text('Working Session', ts.styles.step, v.color.ink));
  c.appendChild(head);

  const price = figma.createFrame();
  price.name = 'Price';
  autoLayout(price, 'HORIZONTAL', v, { gap: { value: 8, variable: v.space['space-2'] } });
  price.counterAxisAlignItems = 'BASELINE';
  price.fills = [];
  price.appendChild(await text('$150', ts.styles.hero, v.color.ink));
  price.appendChild(await text('per hour', ts.styles.small, v.color.muted));
  c.appendChild(price);

  const desc = await text('One focused hour on your project. Bring a problem or a rough idea and we move it forward together.', ts.styles.body, v.color.ink);
  c.appendChild(desc);
  desc.layoutSizingHorizontal = 'FILL';

  const list = figma.createFrame();
  list.name = 'Included';
  autoLayout(list, 'VERTICAL', v, { gap: { value: 12, variable: v.space['space-3'] } });
  list.fills = [];
  for (const item of ['60 minutes on a video call', 'Live design and build feedback', 'Written notes and next steps']) {
    list.appendChild(await text(`✓  ${item}`, ts.styles.body, v.color.ink));
  }
  c.appendChild(list);

  const fill = buttonSet.children.find((n) => n.name === 'Style=Fill, State=Default');
  if (fill) {
    const btn = fill.createInstance();
    c.appendChild(btn);
    btn.layoutSizingHorizontal = 'FILL';
  }
  c.description = 'Booking card. Width 400, padding space-6, groups space-5 apart, label to title space-2. Source: eval/fixtures/with-v3/DESIGN.md (Card), current type.';
  page.appendChild(c);
  return c;
}

// ---------- run ----------
(async () => {
  try {
    const v = await buildVariables();
    const ts = await buildTextStyles(v);
    const tokensPage = figma.currentPage;
    tokensPage.name = 'Tokens';
    await buildTokensPage(tokensPage, v, ts);
    const compPage = figma.createPage();
    compPage.name = 'Components';
    await figma.setCurrentPageAsync(compPage);
    const buttons = await buildButton(compPage, v, ts);
    const card = await buildCard(compPage, v, ts, buttons);
    card.x = buttons.x;
    card.y = buttons.y + buttons.height + 96;
    figma.viewport.scrollAndZoomIntoView([buttons, card]);
    const summary = `Built ${Object.keys(v.color).length} colors, ${Object.keys(ts.styles).length} text styles, Button and Card.`;
    if (notes.length) console.log(notes.join('\n'));
    figma.closePlugin(notes.length ? `${summary} ${notes.length} note(s) in the console.` : summary);
  } catch (e) {
    figma.closePlugin(`Stopped: ${e.message}`);
  }
})();
