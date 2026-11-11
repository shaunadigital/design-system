// Ported from shauna.dev/src/components/v2/Composer.astro (2026-11-11). Keep the two in step; DESIGN.md, Components has the spec.
type State = 'empty' | 'ready' | 'streaming' | 'stopped' | 'error' | 'done' | 'listening' | 'speaking' | 'interrupted';
type FileChip = { kind: 'file'; id: number; name: string; size: number; tooBig: boolean };
type CtxChip = { kind: 'ctx'; id: number; name: string };
type Chip = FileChip | CtxChip;

/** Wires up one composer inside `container` (the element holding composerHTML()). */
export function mountComposer(container: HTMLElement): void {

  const MAX_FILES = 5;
  const MAX_BYTES = 10 * 1024 * 1024;
  const LABELS: Record<State, string> = { empty: 'Empty', ready: 'Ready', streaming: 'Streaming', stopped: 'Stopped', error: 'Error', done: 'Finished', listening: 'Listening', speaking: 'Speaking', interrupted: 'Interrupted' };

  // Each reply has a screen version and a spoken version written to the voice rules (DESIGN.md, Voice and sound).
  const REPLIES: [RegExp, string, string][] = [
    [/token|colou?r|type scale|spacing/i, 'Every colour, size, space and motion value on this site comes from one file, tokens/tokens.json. A script turns it into CSS variables, and a check fails the build if a page uses a raw hex value or a font size that is not on the type scale. This composer follows the same rules, so switch on X-ray mode and its parts get labelled too.', 'Every colour, size and space on this site comes from one file, the tokens file. A script turns it into styles. The build fails if a page types a raw colour or a size that is off the scale. Want to hear how the checks work?'],
    [/x-?ray/i, 'X-ray mode draws a box around each part of the page and labels it with its font, size, line height, colour token and contrast ratio, all measured live in your browser. It is the switch in the header. Turn it on here and the composer shows its own tokens.', 'X-ray mode outlines each part of the page and labels its font, size, colour and contrast, measured live. It is the eye button in the header. Turn it on here and the composer labels its own parts.'],
    [/check|rule|build/i, 'Nine rules are checked: text contrast, tokens only, the serif only for headlines, button language, alt text and labels, motion, hover, phone frames and 44px touch targets. Every Netlify build checks the code and styles, and if a page breaks a rule, the site does not build, whoever wrote the code. GitHub Actions also opens the pages in a browser on every push and measures them. The case study Testing a design system on Claude shows what happened across 240 page builds.', 'Nine rules are checked. They cover contrast, tokens, the serif, button wording, labels, motion, hover, phone frames and touch targets. Every Netlify build checks the code and styles. A browser test also runs on every push. Want the test results?'],
    [/r[ée]sum[ée]|hire|experience|nike|apple/i, 'Shauna is a product designer who builds the system and ships the product on top of it: retail brand work at Nike and Apple, then design systems and production apps for small businesses and nonprofits. The full résumé is one click away in the header.', 'Shauna is a product designer who builds the system and ships the product on it. She did retail brand work at Nike and Apple, then design systems and apps for small businesses and nonprofits. Her résumé is in the header.'],
  ];
  const FALLBACK = 'This reply is scripted, so I cannot really answer that. What you are testing is the composer itself: streaming, stopping, attachments, context and errors. Try stopping a reply halfway, or set the next reply to fail and see how it recovers.';
  const FALLBACK_SPOKEN = 'These replies are scripted, so I cannot really answer that. Try stopping a reply halfway, or set the next one to fail.';

  const root = container.querySelector<HTMLElement>('[data-composer]');
  if (root) {
    const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
    const thread = $('[data-thread]'), msgs = $<HTMLOListElement>('[data-msgs]'), empty = $('[data-empty]');
    const input = $<HTMLTextAreaElement>('[data-input]'), box = $<HTMLFormElement>('[data-box]');
    const send = $<HTMLButtonElement>('[data-send]'), chipsEl = $<HTMLUListElement>('[data-chips]');
    const fileIn = $<HTMLInputElement>('[data-file]'), attachBtn = $<HTMLButtonElement>('[data-attach]');
    const ctxBtn = $<HTMLButtonElement>('[data-ctx]'), menu = $<HTMLUListElement>('[data-menu]');
    const status = $('[data-status]'), label = $('[data-state-label]'), jump = $<HTMLButtonElement>('[data-jump]');
    const hint = $('[data-hint]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    let state: State = 'empty';
    let chips: Chip[] = [];
    let uid = 0;
    let timer = 0;
    let follow = true;
    let lastPrompt: { text: string; files: FileChip[]; ctx: CtxChip[] } | null = null;

    const setState = (s: State) => {
      state = s; root.dataset.state = s; label.textContent = LABELS[s];
      const streaming = s === 'streaming';
      send.setAttribute('aria-label', streaming ? 'Stop reply' : 'Send message');
      hint.textContent = streaming ? 'Esc or the button to stop · keep typing your next message' : s === 'listening' ? 'Listening · Esc or the mic to stop' : s === 'speaking' ? 'Reading aloud · Esc or start typing to stop' : 'Enter to send · Shift+Enter for a new line';
      updateSend();
    };
    const sendable = () => input.value.trim().length > 0 || chips.some((c) => c.kind === 'file' && !c.tooBig);
    const updateSend = () => {
      send.disabled = state !== 'streaming' && !sendable();
      if (!['streaming', 'listening', 'speaking'].includes(state) && !msgs.children.length) { root.dataset.state = sendable() ? 'ready' : 'empty'; label.textContent = LABELS[sendable() ? 'ready' : 'empty']; }
    };

    // Textarea grows with its content up to a cap, then scrolls.
    const grow = () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 200)}px`; };
    input.addEventListener('input', () => { grow(); updateSend(); });

    // Thread follows new text only while you are at the bottom. Scroll up and it lets go.
    const atBottom = () => thread.scrollHeight - thread.scrollTop - thread.clientHeight < 40;
    const toBottom = (smooth = false) => thread.scrollTo({ top: thread.scrollHeight, behavior: smooth && !reduced.matches ? 'smooth' : 'auto' });
    thread.addEventListener('scroll', () => { follow = atBottom(); if (follow) jump.hidden = true; });
    jump.addEventListener('click', () => { follow = true; jump.hidden = true; toBottom(true); input.focus(); });
    const keepUp = () => { if (follow) toBottom(); else jump.hidden = false; };

    // Chips: attachments and context share one row, each removable.
    const fmt = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);
    const renderChips = () => {
      chipsEl.replaceChildren(...chips.map((c) => {
        const li = document.createElement('li');
        li.className = `cmp-chip cmp-chip--${c.kind}${c.kind === 'file' && c.tooBig ? ' is-bad' : ''}`;
        const name = document.createElement('span'); name.className = 'cmp-chip-n'; name.textContent = c.name;
        li.append(name);
        if (c.kind === 'file') { const m = document.createElement('span'); m.className = 'cmp-chip-m'; m.textContent = c.tooBig ? 'Too large' : fmt(c.size); li.append(m); }
        const x = document.createElement('button'); x.type = 'button'; x.className = 'cmp-chip-x';
        x.setAttribute('aria-label', `Remove ${c.name}`); x.textContent = '×';
        x.addEventListener('click', () => {
          const i = chips.indexOf(c); chips = chips.filter((d) => d !== c);
          if (c.kind === 'ctx') syncMenu();
          renderChips(); updateSend();
          const next = chipsEl.querySelectorAll<HTMLButtonElement>('.cmp-chip-x')[Math.min(i, chips.length - 1)];
          (next ?? input).focus();
          say(`${c.name} removed`);
        });
        li.append(x); return li;
      }));
      chipsEl.hidden = !chips.length;
    };

    const addFiles = (list: FileList | File[]) => {
      const files = [...list];
      const room = MAX_FILES - chips.filter((c) => c.kind === 'file').length;
      files.slice(0, Math.max(room, 0)).forEach((f) => chips.push({ kind: 'file', id: ++uid, name: f.name, size: f.size, tooBig: f.size > MAX_BYTES }));
      renderChips(); updateSend();
      const big = files.slice(0, room).filter((f) => f.size > MAX_BYTES).length;
      const over = files.length - Math.max(room, 0);
      say([files.length && `${Math.min(files.length, Math.max(room, 0))} file${files.length === 1 ? '' : 's'} attached`, big && `${big} over 10 MB and will not send`, over > 0 && `${over} not added, the limit is ${MAX_FILES}`].filter(Boolean).join('. '));
    };
    attachBtn.addEventListener('click', () => fileIn.click());
    fileIn.addEventListener('change', () => { if (fileIn.files) addFiles(fileIn.files); fileIn.value = ''; input.focus(); });
    let depth = 0;
    box.addEventListener('dragenter', (e) => { if (!e.dataTransfer?.types.includes('Files')) return; e.preventDefault(); depth++; box.classList.add('is-drop'); });
    box.addEventListener('dragover', (e) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); });
    box.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; box.classList.remove('is-drop'); } });
    box.addEventListener('drop', (e) => { e.preventDefault(); depth = 0; box.classList.remove('is-drop'); if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files); });

    // Context menu: a real menu, arrow keys and all.
    const items = [...menu.querySelectorAll<HTMLLIElement>('[data-ctx-item]')];
    const syncMenu = () => items.forEach((it) => it.setAttribute('aria-checked', String(chips.some((c) => c.kind === 'ctx' && c.name === it.dataset.ctxItem))));
    const openMenu = (focusIdx = 0) => { menu.hidden = false; ctxBtn.setAttribute('aria-expanded', 'true'); syncMenu(); items[focusIdx]?.focus(); };
    const closeMenu = (refocus = true) => { if (menu.hidden) return; menu.hidden = true; ctxBtn.setAttribute('aria-expanded', 'false'); if (refocus) ctxBtn.focus(); };
    const toggleCtx = (it: HTMLLIElement) => {
      const name = it.dataset.ctxItem!;
      const had = chips.find((c) => c.kind === 'ctx' && c.name === name);
      chips = had ? chips.filter((c) => c !== had) : [...chips, { kind: 'ctx', id: ++uid, name }];
      syncMenu(); renderChips(); updateSend();
      say(`${name} ${had ? 'removed' : 'added'} as context`);
    };
    ctxBtn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
    ctxBtn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(e.key === 'ArrowUp' ? items.length - 1 : 0); } });
    items.forEach((it, i) => {
      it.addEventListener('click', () => toggleCtx(it));
      it.addEventListener('keydown', (e) => {
        const go = (n: number) => { e.preventDefault(); items[(n + items.length) % items.length].focus(); };
        if (e.key === 'ArrowDown') go(i + 1); else if (e.key === 'ArrowUp') go(i - 1);
        else if (e.key === 'Home') go(0); else if (e.key === 'End') go(items.length - 1);
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCtx(it); }
        else if (e.key === 'Escape' || e.key === 'Tab') { if (e.key === 'Escape') e.preventDefault(); closeMenu(e.key === 'Escape'); }
      });
    });
    document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !(e.target as Element).closest('.cmp-ctx')) closeMenu(false); });

    // Messages
    const say = (t: string) => { status.textContent = ''; requestAnimationFrame(() => (status.textContent = t)); };
    const bubble = (who: 'you' | 'reply') => {
      const li = document.createElement('li'); li.className = `cmp-msg cmp-msg--${who}`;
      const body = document.createElement('div'); body.className = 'cmp-body'; li.append(body);
      msgs.append(li); empty.hidden = true; return { li, body };
    };
    const addUser = (text: string, files: FileChip[], ctx: CtxChip[]) => {
      const { li, body } = bubble('you');
      if (text) body.textContent = text;
      if (files.length || ctx.length) {
        const tags = document.createElement('ul'); tags.className = 'cmp-tags'; tags.setAttribute('aria-label', 'Sent with');
        [...ctx.map((c) => [c.name, 'ctx']), ...files.map((f) => [`${f.name} · ${fmt(f.size)}`, 'file'])].forEach(([t, k]) => {
          const t2 = document.createElement('li'); t2.className = `cmp-tag cmp-tag--${k}`; t2.textContent = t; tags.append(t2);
        });
        li.append(tags);
      }
      follow = true; toBottom();
    };

    const compose = (p: NonNullable<typeof lastPrompt>) => {
      const hit = REPLIES.find(([re]) => re.test(p.text)) ?? REPLIES.find(([re]) => p.ctx.some((c) => re.test(c.name)));
      const lead: string[] = [], leadSpoken: string[] = [];
      if (p.ctx.length) { lead.push(`Using ${p.ctx.map((c) => c.name).join(', ')} as context.`); leadSpoken.push(`Using ${p.ctx.map((c) => c.name.toLowerCase()).join(' and ')} as context.`); }
      if (p.files.length) {
        lead.push(`You attached ${p.files.length === 1 ? p.files[0].name : `${p.files.length} files`}. I can see the name and size only; nothing was uploaded.`);
        leadSpoken.push(p.files.length === 1 ? 'I can see your file name, nothing more.' : `I can see the names of ${p.files.length} files, nothing more.`);
      }
      return { screen: [...lead, hit ? hit[1] : FALLBACK].join(' '), spoken: [...leadSpoken, hit ? hit[2] : FALLBACK_SPOKEN].join(' ') };
    };

    const actions = (li: HTMLLIElement, kind: 'done' | 'stopped' | 'error', text: string) => {
      li.querySelector('.cmp-acts')?.remove();
      const row = document.createElement('div'); row.className = 'cmp-acts';
      if (kind !== 'done') {
        const note = document.createElement('p'); note.className = `cmp-note${kind === 'error' ? ' is-err' : ''}`;
        note.textContent = kind === 'error' ? 'The reply was interrupted. Your message is safe.' : 'You stopped this reply.';
        row.append(note);
      }
      const mk = (t: string, fn: () => void) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'cmp-act'; b.textContent = t; b.addEventListener('click', fn); row.append(b); return b; };
      if (kind === 'done') {
        const c = mk('Copy', async () => {
          try { await navigator.clipboard.writeText(text); c.textContent = 'Copied'; say('Reply copied'); } catch { c.textContent = 'Copy failed'; }
          setTimeout(() => (c.textContent = 'Copy'), 1600);
        });
      } else {
        mk(kind === 'error' ? 'Try Again' : 'Regenerate', () => { li.remove(); reply(); });
      }
      li.append(row);
    };

    const reply = () => {
      if (!lastPrompt) return;
      const mode = (container.querySelector<HTMLInputElement>('input[name="cmp-mode"]:checked')?.value ?? 'normal') as 'normal' | 'slow' | 'fail';
      const { screen: full, spoken } = compose(lastPrompt);
      const words = full.match(/\S+\s*/g) ?? [];
      const failAt = mode === 'fail' ? Math.floor(words.length * 0.45) : Infinity;
      const step = reduced.matches ? 8 : 1;
      const delay = mode === 'slow' ? 140 : 38;
      const { li, body } = bubble('reply');
      li.setAttribute('aria-busy', 'true');
      const textNode = document.createTextNode(''); const caret = document.createElement('span'); caret.className = 'cmp-caret'; caret.setAttribute('aria-hidden', 'true');
      body.append(textNode, caret);
      let i = 0;
      setState('streaming'); say('Reply started'); keepUp();
      const finish = (kind: 'done' | 'stopped' | 'error') => {
        clearTimeout(timer); caret.remove(); li.removeAttribute('aria-busy');
        li.classList.toggle('is-err', kind === 'error');
        actions(li, kind, textNode.data);
        setState(kind); keepUp();
        say(kind === 'done' ? `Reply: ${textNode.data}` : kind === 'stopped' ? 'Reply stopped' : 'Reply interrupted. Try Again is available.');
        stopReply = null;
        if (kind === 'done') { if (!speak(li, spoken)) cue('done'); } else if (kind === 'error') cue('error');
      };
      stopReply = () => finish('stopped');
      const tick = () => {
        if (i >= failAt) return finish('error');
        textNode.data += words.slice(i, i + step).join(''); i += step;
        keepUp();
        if (i >= words.length) return finish('done');
        timer = window.setTimeout(tick, delay + Math.random() * delay * 0.6);
      };
      timer = window.setTimeout(tick, mode === 'slow' ? 700 : 320);
    };
    let stopReply: null | (() => void) = null;


    // Voice and sound (DESIGN.md, Voice and sound). Values come from tokens.json via data-voice.
    const cfg = JSON.parse(root.dataset.voice || '{}');
    const micBtn = $<HTMLButtonElement>('[data-mic]');
    const readBox = container.querySelector<HTMLInputElement>('[data-read]');
    const soundBox = container.querySelector<HTMLInputElement>('[data-sounds]');
    const micNote = container.querySelector<HTMLElement>('[data-mic-note]');
    const ms = (speed: string) => parseInt(cfg.motion?.[speed] ?? '180', 10);
    let actx: AudioContext | null = null;
    const cue = (kind: 'start' | 'done' | 'error') => {
      if (!soundBox?.checked) return;
      const sd = cfg.sound?.[kind];
      if (sd) {
        try {
          actx ??= new AudioContext();
          const len = ms(sd.speed) / 1000 / sd.notes.length;
          let t = actx.currentTime;
          for (const f of sd.notes) {
            const o = actx.createOscillator(), g = actx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(cfg.sound.gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
            o.connect(g).connect(actx.destination); o.start(t); o.stop(t + len + 0.02); t += len;
          }
        } catch { /* no audio: the screen already says it */ }
      }
      const h = cfg.haptic?.[kind];
      if (h && 'vibrate' in navigator) navigator.vibrate(h);
    };

    // Reading aloud: the spoken version, one sentence at a time, with the sentence shown as a caption.
    const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    if (!synth && readBox) { readBox.disabled = true; readBox.closest('label')?.classList.add('is-off'); }
    let speakingLi: HTMLLIElement | null = null;
    const stopSpeaking = (interrupted = true) => {
      if (!speakingLi) return;
      const li = speakingLi; speakingLi = null; synth?.cancel();
      li.querySelector('.cmp-cap')?.remove();
      setState(interrupted ? 'interrupted' : 'done');
      if (interrupted) say('Stopped reading aloud');
    };
    function speak(li: HTMLLIElement, text: string) {
      if (!synth || !readBox?.checked) return false;
      const parts = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
      const cap = document.createElement('p'); cap.className = 'cmp-cap'; cap.setAttribute('aria-hidden', 'true');
      li.append(cap); speakingLi = li; setState('speaking'); keepUp();
      let i = 0;
      const next = () => {
        if (speakingLi !== li) return;
        if (i >= parts.length) { speakingLi = null; cap.remove(); setState('done'); cue('done'); return; }
        const line = parts[i++].trim(); cap.textContent = line;
        const u = new SpeechSynthesisUtterance(line);
        u.lang = cfg.voice?.lang ?? 'en-US'; u.rate = cfg.voice?.rate ?? 1;
        // Some browsers never fire onend; move on after a generous time per word so the state can't stick.
        let moved = false;
        const go = () => { if (moved) return; moved = true; clearTimeout(guard); next(); };
        const guard = window.setTimeout(go, 1500 + line.split(/\s+/).length * 600);
        u.onend = go;
        u.onerror = () => { if (speakingLi === li) { speakingLi = null; cap.remove(); setState('done'); } };
        synth.speak(u);
      };
      synth.cancel(); next();
      return true;
    }
    readBox?.addEventListener('change', () => { if (!readBox.checked) stopSpeaking(false); });

    // Voice input: live captions in the text box; nothing sends until the person presses send.
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let rec: any = null;
    let before: State = 'empty';
    if (SR) micBtn.hidden = false;
    else if (micNote) micNote.textContent = 'Voice input needs Chrome, Edge or Safari. Read Replies Aloud still works here.';
    const stopListening = () => rec?.stop();
    micBtn.addEventListener('click', () => {
      if (rec) { stopListening(); return; }
      if (state === 'streaming') return;
      stopSpeaking(false);
      before = state;
      const start = input.value ? input.value.replace(/\s*$/, ' ') : '';
      let heard = false;
      rec = new SR(); rec.lang = cfg.voice?.lang ?? 'en-US'; rec.interimResults = true; rec.continuous = false;
      rec.onstart = () => { setState('listening'); micBtn.setAttribute('aria-pressed', 'true'); micBtn.setAttribute('aria-label', 'Stop Listening'); input.classList.add('is-interim'); cue('start'); say('Listening'); };
      rec.onresult = (e: any) => { let t = ''; for (const r of e.results) t += r[0].transcript; input.value = start + t; heard = true; grow(); };
      rec.onerror = (e: any) => { cue('error'); say(e.error === 'not-allowed' ? 'Microphone access was blocked. You can type instead.' : e.error === 'no-speech' ? 'I did not hear anything. Try again, or type.' : 'Voice input stopped. You can type instead.'); };
      rec.onend = () => {
        rec = null; micBtn.setAttribute('aria-pressed', 'false'); micBtn.setAttribute('aria-label', 'Speak a Message'); input.classList.remove('is-interim');
        setState(msgs.children.length ? (before === 'empty' || before === 'ready' ? 'done' : before) : 'empty'); updateSend(); input.focus();
        if (heard) { cue('done'); say('Your words are in the message box. Press send when they are right.'); }
      };
      try { rec.start(); } catch { rec = null; }
    });
    input.addEventListener('input', () => stopSpeaking());

    const submit = () => {
      if (state === 'streaming') { stopReply?.(); return; }
      if (!sendable()) return;
      stopSpeaking(false); if (rec) stopListening();
      const text = input.value.trim();
      const files = chips.filter((c): c is FileChip => c.kind === 'file' && !c.tooBig);
      const ctx = chips.filter((c): c is CtxChip => c.kind === 'ctx');
      lastPrompt = { text, files, ctx };
      addUser(text, files, ctx);
      input.value = ''; grow();
      chips = chips.filter((c) => c.kind === 'ctx'); // context stays for the next message, files are spent
      renderChips();
      reply();
      input.focus();
    };
    box.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    send.addEventListener('click', (e) => { if (state === 'streaming') { e.preventDefault(); stopReply?.(); input.focus(); } });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (state !== 'streaming') submit(); }
      else if (e.key === 'Escape' && state === 'streaming') { e.preventDefault(); stopReply?.(); }
      else if (e.key === 'Escape' && rec) { e.preventDefault(); stopListening(); }
      else if (e.key === 'Escape' && speakingLi) { e.preventDefault(); stopSpeaking(); }
    });
    root.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || e.target === input) return; if (state === 'streaming') stopReply?.(); else if (rec) stopListening(); else if (speakingLi) stopSpeaking(); });

    root.querySelectorAll<HTMLButtonElement>('[data-sug]').forEach((b) => b.addEventListener('click', () => {
      input.value = b.textContent ?? ''; grow(); updateSend(); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    }));

    renderChips(); updateSend();
  }
}
