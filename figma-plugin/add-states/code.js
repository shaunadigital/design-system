// One-time add-on for the shauna.dev Design System file. Adds only; deletes nothing.
// Safe to run twice: anything already added is skipped.
// Adds: Button Focus and Disabled states; Chat composer Listening and Speaking;
// Reply status Interrupted; a cover frame on the Tokens page set as the file thumbnail;
// a Dusk preview frame on the Components page, using a second colour collection.
(async () => {
  const log = [];
  const find = (parent, name) => parent.children.find((c) => c.name === name);
  try {
    await Promise.all([
      { family: 'LINE Seed JP', style: 'Regular' },
      { family: 'LINE Seed JP', style: 'Bold' },
    ].map((f) => figma.loadFontAsync(f)));

    const pages = figma.root.children;
    const compPage = pages.find((p) => p.name === 'Components');
    const tokPage = pages.find((p) => p.name === 'Tokens');
    if (!compPage || !tokPage) throw new Error('Open the shauna.dev Design System file first.');
    await figma.setCurrentPageAsync(compPage);

    const colorVars = await figma.variables.getLocalVariablesAsync('COLOR');
    const accent = colorVars.find((v) => v.name.toLowerCase() === 'accent') || colorVars.find((v) => /accent/i.test(v.name));

    // Button: Focus and Disabled for each style
    const btn = compPage.children.find((n) => n.type === 'COMPONENT_SET' && n.name === 'Button');
    if (btn) {
      for (const style of ['Default', 'Fill', 'Text']) {
        const base = find(btn, `Style=${style}, State=Default`);
        if (!base) continue;
        if (!find(btn, `Style=${style}, State=Focus`)) {
          const f = base.clone(); btn.appendChild(f); f.name = `Style=${style}, State=Focus`;
          let eff = { type: 'DROP_SHADOW', color: { r: 0.122, g: 0.416, b: 0.459, a: 1 }, offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: 'NORMAL', showShadowBehindNode: false };
          if (accent) eff = figma.variables.setBoundVariableForEffect(eff, 'color', accent);
          f.effects = [eff]; log.push(`Button ${style} Focus`);
        }
        if (!find(btn, `Style=${style}, State=Disabled`)) {
          const d = base.clone(); btn.appendChild(d); d.name = `Style=${style}, State=Disabled`; d.opacity = 0.4; log.push(`Button ${style} Disabled`);
        }
      }
      if (btn.layoutMode !== 'NONE') { btn.layoutWrap = 'WRAP'; btn.counterAxisSpacing = btn.itemSpacing || 24; }
      btn.description = 'Fill is the main action, Default the second, Text the quiet one. One Fill per area. States: Default, Hover, Focus (3px accent ring), Disabled (40% opacity). The label keeps the case the person typed.';
    }

    // Chat composer: Listening and Speaking, cloned from Streaming
    const comp = compPage.children.find((n) => n.type === 'COMPONENT_SET' && n.name === 'Chat composer');
    if (comp) {
      const streaming = find(comp, 'State=Streaming');
      const make = (state, ph, hint, btnName) => {
        if (find(comp, `State=${state}`) || !streaming) return null;
        const n = streaming.clone(); comp.appendChild(n); n.name = `State=${state}`;
        const t = n.findOne((x) => x.type === 'TEXT' && x.name === 'Placeholder'); if (t) t.characters = ph;
        const h = n.findOne((x) => x.type === 'TEXT' && x.name === 'Hint'); if (h) h.characters = hint;
        const b = n.findOne((x) => x.name === 'Stop Reply'); if (b) b.name = btnName;
        log.push(`Composer ${state}`); return n;
      };
      const L = make('Listening', 'Listening…', 'Listening · Esc or the mic to stop', 'Stop Listening');
      const S = make('Speaking', 'Message Claude', 'Reading aloud · Esc or start typing to stop', 'Stop Reading');
      if (comp.layoutMode === 'NONE') {
        let y = 0;
        for (const c of comp.children) if (c !== L && c !== S) y = Math.max(y, c.y + c.height);
        for (const n of [L, S]) if (n) { n.x = 0; n.y = y + 32; y = n.y + n.height; }
        const maxY = comp.children.reduce((a, c) => Math.max(a, c.y + c.height), 0);
        comp.resizeWithoutConstraints(comp.width, maxY);
      }
      comp.description = 'Chat composer: Empty, Ready, Streaming (stop, or keep typing the next message), Attachments, Listening and Speaking. Esc stops a reply, listening or reading aloud. How a reply ends lives in Reply status.';
    }

    // Reply status: Interrupted, cloned from Stopped
    const rs = compPage.children.find((n) => n.type === 'COMPONENT_SET' && n.name === 'Reply status');
    if (rs && !find(rs, 'State=Interrupted')) {
      const stopped = find(rs, 'State=Stopped');
      if (stopped) {
        const I = stopped.clone(); rs.appendChild(I); I.name = 'State=Interrupted';
        const note = I.findAll((x) => x.type === 'TEXT').find((x) => /stopped/i.test(x.characters));
        if (note) note.characters = 'Stopped reading aloud.';
        if (rs.layoutMode === 'NONE') {
          const y = rs.children.filter((c) => c !== I).reduce((a, c) => Math.max(a, c.y + c.height), 0);
          I.x = 0; I.y = y + 32; rs.resizeWithoutConstraints(rs.width, I.y + I.height);
        }
        rs.description = 'How a reply ends: Finished (Copy), Stopped by the person, Error (the message is safe, Try Again), Interrupted (reading aloud stopped).';
        log.push('Reply status Interrupted');
      }
    }

    // Cover on the Tokens page, set as the file thumbnail
    await figma.setCurrentPageAsync(tokPage);
    if (!find(tokPage, 'Cover')) {
      let titleFont = { family: 'DM Serif Display', style: 'Regular' };
      try { await figma.loadFontAsync(titleFont); } catch (e) { titleFont = { family: 'LINE Seed JP', style: 'Bold' }; }
      const ink = colorVars.find((v) => v.name.toLowerCase() === 'ink');
      const paper = colorVars.find((v) => ['paper', 'page', 'bg', 'background'].includes(v.name.toLowerCase()));
      const cover = figma.createFrame(); cover.name = 'Cover'; cover.resize(1600, 960);
      cover.layoutMode = 'VERTICAL'; cover.primaryAxisAlignItems = 'CENTER'; cover.paddingLeft = cover.paddingRight = 120; cover.itemSpacing = 28;
      cover.primaryAxisSizingMode = 'FIXED'; cover.counterAxisSizingMode = 'FIXED';
      let bg = { type: 'SOLID', color: { r: 0.98, g: 0.97, b: 0.95 } };
      if (paper) bg = figma.variables.setBoundVariableForPaint(bg, 'color', paper);
      cover.fills = [bg];
      const t = figma.createText(); t.fontName = titleFont; t.fontSize = 120; t.characters = 'shauna.dev Design System';
      const s = figma.createText(); s.fontName = { family: 'LINE Seed JP', style: 'Regular' }; s.fontSize = 36;
      s.characters = 'Tokens, components and rules that people and Claude both follow. Built from one token file and tested on Claude.';
      for (const n of [t, s]) {
        let p = { type: 'SOLID', color: { r: 0.043, g: 0.078, b: 0.086 } };
        if (ink) p = figma.variables.setBoundVariableForPaint(p, 'color', ink);
        n.fills = [p]; cover.appendChild(n); n.layoutSizingHorizontal = 'FILL'; n.textAutoResize = 'HEIGHT';
      }
      const right = tokPage.children.reduce((a, c) => Math.min(a, c.x), 0);
      cover.x = right - 1600 - 200; cover.y = 0;
      await figma.setFileThumbnailNodeAsync(cover);
      log.push('Cover and thumbnail');
    }
    // Dusk preview: a second colour collection with the dusk values, and a frame of components rebound to it.
    // The free plan allows one mode per collection, so dusk lives in its own collection instead of a mode.
    const autoFrame = (dir, props) => { const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; Object.assign(f, props); return f; };
    const DUSK = {"paper": "#0E1618", "sand": "#131E21", "card": "#172327", "ink": "#E9EFEF", "muted": "#9DAEB1", "accent-text": "#9CCFD6", "accent": "#5FB3BF", "accent-line": "#2A5C63", "wash": "#1D2A2E", "chrome-dot": "#3B4B50", "on-ink": "#0E1618", "deep": "#060C0E", "shadow": "#000000", "live": "#EE8D9A", "felt-deep": "#0F1C1F", "pin-shadow": "#000000"};
    await figma.setCurrentPageAsync(compPage);
    if (!find(compPage, 'Dusk')) {
      const cols = await figma.variables.getLocalVariableCollectionsAsync();
      let duskCol = cols.find((c) => c.name === 'Color (Dusk)');
      if (!duskCol) duskCol = figma.variables.createVariableCollection('Color (Dusk)');
      const keepCols = new Set(cols.filter((c) => c.name === 'Color' || c.name === 'Component').map((c) => c.id));
      const dayVars = colorVars.filter((v) => keepCols.has(v.variableCollectionId));
      const existing = (await figma.variables.getLocalVariablesAsync('COLOR')).filter((v) => v.variableCollectionId === duskCol.id);
      const toDusk = new Map();
      const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
      for (const v of dayVars) {
        const key = v.name.split('/').pop().toLowerCase();
        if (!DUSK[key]) continue;
        let dv = existing.find((e) => e.name === v.name);
        if (!dv) { dv = figma.variables.createVariable(v.name, duskCol, 'COLOR'); dv.scopes = v.scopes; existing.push(dv); }
        dv.setValueForMode(duskCol.modes[0].modeId, hex(DUSK[key]));
        toDusk.set(v.id, dv);
      }
      const frame = autoFrame('VERTICAL', { name: 'Dusk', itemSpacing: 40 });
      frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = 64;
      const paperDay = dayVars.find((v) => v.name.split('/').pop().toLowerCase() === 'paper');
      let bg = { type: 'SOLID', color: hex(DUSK.paper) };
      if (paperDay && toDusk.get(paperDay.id)) bg = figma.variables.setBoundVariableForPaint(bg, 'color', toDusk.get(paperDay.id));
      frame.fills = [bg];
      const title = figma.createText(); title.fontName = { family: 'LINE Seed JP', style: 'Bold' }; title.fontSize = 32;
      title.characters = 'Dusk: the same components, at night';
      title.fills = [{ type: 'SOLID', color: hex(DUSK.ink) }];
      frame.appendChild(title);
      const pick = (setName, variant) => {
        const n = compPage.children.find((c) => c.name === setName);
        if (!n) return null;
        if (n.type === 'COMPONENT') return n;
        return variant ? find(n, variant) : n.defaultVariant;
      };
      const row = autoFrame('HORIZONTAL', { name: 'Buttons', itemSpacing: 16 }); row.fills = [];
      for (const v of ['Style=Fill, State=Default', 'Style=Default, State=Default', 'Style=Text, State=Default', 'Style=Fill, State=Focus']) {
        const c = pick('Button', v); if (c) row.appendChild(c.createInstance());
      }
      frame.appendChild(row);
      for (const [setName, v] of [['Chat composer', 'State=Ready'], ['Chat composer', 'State=Streaming'], ['Reply status', 'State=Error']]) {
        const c = pick(setName, v); if (c) frame.appendChild(c.createInstance());
      }
      const row2 = autoFrame('HORIZONTAL', { name: 'Menu, dialog, sidebar', itemSpacing: 32 }); row2.fills = [];
      for (const n of ['Sidebar', 'Menu', 'Dialog']) { const c = pick(n); if (c) row2.appendChild(c.createInstance()); }
      frame.appendChild(row2);
      // Rebind every Day colour inside the frame to its Dusk twin
      let swapped = 0;
      const swapPaints = (paints) => paints.map((p) => {
        const id = p.boundVariables && p.boundVariables.color && p.boundVariables.color.id;
        const dv = id && toDusk.get(id);
        if (!dv) return p; swapped++; return figma.variables.setBoundVariableForPaint(p, 'color', dv);
      });
      for (const n of frame.findAll(() => true)) {
        if ('fills' in n && Array.isArray(n.fills) && n.fills.length) n.fills = swapPaints(n.fills);
        if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length) n.strokes = swapPaints(n.strokes);
      }
      const right = compPage.children.filter((c) => c !== frame).reduce((a, c) => Math.max(a, c.x + c.width), 0);
      frame.x = right + 160; frame.y = 0;
      log.push(`Dusk frame (${swapped} colours switched)`);
    }

    // Tidy: keep grown sets from overlapping their neighbours; give dusk focus rings the dusk accent.
    await figma.setCurrentPageAsync(compPage);
    const below = (top, node) => { if (top && node && node.y < top.y + top.height + 40 && node.x < top.x + top.width && node.x + node.width > top.x) { node.y = top.y + top.height + 80; log.push(`Moved ${node.name}`); } };
    below(compPage.children.find((n) => n.name === 'Button'), compPage.children.find((n) => n.name === 'Card'));
    below(compPage.children.find((n) => n.name === 'Chat composer'), compPage.children.find((n) => n.name === 'Reply status'));
    const duskFrame = find(compPage, 'Dusk');
    if (duskFrame) {
      const all = await figma.variables.getLocalVariablesAsync('COLOR');
      const cs = await figma.variables.getLocalVariableCollectionsAsync();
      const duskC = cs.find((c) => c.name === 'Color (Dusk)');
      const dayIds = new Set(cs.filter((c) => c.name === 'Color' || c.name === 'Component').map((c) => c.id));
      const byName = new Map(all.filter((v) => duskC && v.variableCollectionId === duskC.id).map((v) => [v.name, v]));
      const twin = new Map(all.filter((v) => dayIds.has(v.variableCollectionId) && byName.has(v.name)).map((v) => [v.id, byName.get(v.name)]));
      let fx = 0;
      for (const n of duskFrame.findAll((x) => 'effects' in x && x.effects.length)) {
        n.effects = n.effects.map((e) => { const id = e.boundVariables && e.boundVariables.color && e.boundVariables.color.id; const d = id && twin.get(id); if (!d) return e; fx++; return figma.variables.setBoundVariableForEffect(e, 'color', d); });
      }
      if (fx) log.push(`Dusk focus rings (${fx})`);
    }

    figma.closePlugin(log.length ? `Added: ${log.join(', ')}` : 'Nothing to add. Everything is already there.');
  } catch (e) {
    figma.closePlugin(`Stopped: ${e.message}`);
  }
})();
