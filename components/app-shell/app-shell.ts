// Ported from shauna.dev/src/components/v2/AppShell.astro (2026-11-11). Keep the two in step; DESIGN.md, Components has the spec.
/** Wires up every app shell inside `container` (elements holding appShellHTML()). */
export function mountAppShell(container: HTMLElement): void {
  for (const root of container.querySelectorAll<HTMLElement>('[data-as]')) {
    const $ = <T extends Element>(s: string) => root.querySelector(s) as T;
    const side = $<HTMLElement>('[data-as-side]'), toggle = $<HTMLButtonElement>('[data-as-toggle]');
    const list = $<HTMLUListElement>('[data-as-list]'), pinned = $<HTMLUListElement>('[data-as-pinned]'), pinnedLabel = $<HTMLElement>('[data-as-pinned-label]');
    const menu = $<HTMLUListElement>('[data-as-menu]'), items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const dlg = $<HTMLDialogElement>('[data-as-dlg]'), dlgH = $<HTMLElement>('[data-as-dlg-h]'), dlgP = $<HTMLElement>('[data-as-dlg-p]');
    const field = $<HTMLElement>('[data-as-field]'), input = $<HTMLInputElement>('[data-as-input]'), ok = $<HTMLButtonElement>('[data-as-ok]');
    const heading = $<HTMLElement>('[data-as-heading]'), live = $<HTMLElement>('[data-as-live]'), restore = $<HTMLButtonElement>('[data-as-restore]');
    const original = list.innerHTML;
    let trigger: HTMLButtonElement | null = null, mode: 'rename' | 'delete' = 'rename', n = 0;

    const say = (t: string) => { live.textContent = ''; setTimeout(() => (live.textContent = t), 30); };
    const rowOf = (el: Element | null) => el?.closest<HTMLLIElement>('.as-row') ?? null;
    const titleOf = (row: HTMLLIElement) => row.querySelector('.as-title')!.textContent!.trim();
    const rows = () => [...root.querySelectorAll<HTMLLIElement>('.as-row')];
    const sync = () => { pinnedLabel.hidden = !pinned.children.length; restore.hidden = list.innerHTML === original && !pinned.children.length; };

    // Sidebar: on narrow screens it folds behind the Chats button.
    toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); root.classList.toggle('as--open', open); });

    const select = (row: HTMLLIElement) => {
      root.querySelectorAll('[data-as-link]').forEach((a) => a.removeAttribute('aria-current'));
      row.querySelector('[data-as-link]')!.setAttribute('aria-current', 'page');
      heading.textContent = titleOf(row);
    };
    root.addEventListener('click', (e) => {
      const a = (e.target as Element).closest('[data-as-link]');
      if (a) { e.preventDefault(); select(rowOf(a)!); }
    });

    // New Chat: a new row at the top of Recent, selected.
    $<HTMLButtonElement>('[data-as-new]').addEventListener('click', () => {
      const tpl = list.querySelector('.as-row') ?? new DOMParser().parseFromString(`<ul>${original}</ul>`, 'text/html').querySelector('.as-row')!;
      const row = tpl.cloneNode(true) as HTMLLIElement;
      row.dataset.id = `new${++n}`; row.querySelector('.as-title')!.textContent = 'New chat';
      row.querySelector('.as-pin')!.setAttribute('hidden', '');
      row.querySelector('[data-as-more]')!.setAttribute('aria-label', 'More for New chat');
      list.prepend(row); select(row); sync(); say('New chat started');
      row.querySelector<HTMLElement>('[data-as-link]')!.focus();
    });

    // Menu: opens 8px below its button, right edges lined up. Arrows, Home, End, type a letter, Esc.
    const openMenu = (btn: HTMLButtonElement, at = 0) => {
      closeMenu(false); trigger = btn;
      const pinnedNow = !!btn.closest('[data-as-pinned]');
      items.find((i) => i.dataset.act === 'pin')!.textContent = pinnedNow ? 'Unpin' : 'Pin';
      const r = btn.getBoundingClientRect(), base = root.getBoundingClientRect();
      menu.hidden = false;
      const below = r.bottom - base.top + 8, fitsBelow = r.bottom + 8 + menu.offsetHeight < innerHeight;
      menu.style.top = `${fitsBelow ? below : r.top - base.top - 8 - menu.offsetHeight}px`;
      menu.style.left = `${Math.max(8, r.right - base.left - menu.offsetWidth)}px`;
      btn.setAttribute('aria-expanded', 'true');
      items.at(at)!.focus();
    };
    const closeMenu = (refocus = true) => {
      if (menu.hidden) return;
      menu.hidden = true; trigger?.setAttribute('aria-expanded', 'false');
      if (refocus) trigger?.focus();
    };
    root.addEventListener('click', (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('[data-as-more]');
      if (btn) { e.stopPropagation(); btn === trigger && !menu.hidden ? closeMenu() : openMenu(btn); }
    });
    root.addEventListener('keydown', (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('[data-as-more]');
      if (btn && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); openMenu(btn, e.key === 'ArrowUp' ? -1 : 0); }
    });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target as Node)) closeMenu(false); });
    menu.addEventListener('keydown', (e) => {
      const i = items.indexOf(document.activeElement as HTMLElement), go = (k: number) => items.at(k % items.length)!.focus();
      if (e.key === 'ArrowDown') { e.preventDefault(); go(i + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); go(i - 1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(-1); }
      else if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
      else if (e.key === 'Tab') closeMenu(false);
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(items[i]); }
      else if (/^[a-z]$/i.test(e.key)) { const hit = items.find((it) => it.textContent!.toLowerCase().startsWith(e.key.toLowerCase())); hit?.focus(); }
    });
    menu.addEventListener('click', (e) => { const it = (e.target as Element).closest<HTMLElement>('[role="menuitem"]'); if (it) act(it); });

    const act = (it: HTMLElement) => {
      const row = rowOf(trigger)!;
      if (it.dataset.act === 'pin') {
        const toPin = !row.closest('[data-as-pinned]');
        (toPin ? pinned : list).prepend(row);
        row.querySelector('.as-pin')!.toggleAttribute('hidden', !toPin);
        sync(); closeMenu(); say(toPin ? `Pinned ${titleOf(row)}` : `Unpinned ${titleOf(row)}`);
        return;
      }
      closeMenu(false); openDialog(it.dataset.act as 'rename' | 'delete', row);
    };

    // Dialog: a native modal, so focus stays inside and Esc closes it. Focus goes back to the menu's button,
    // or to the next chat when the row is gone.
    let target: HTMLLIElement | null = null;
    const openDialog = (m: 'rename' | 'delete', row: HTMLLIElement) => {
      mode = m; target = row; const t = titleOf(row);
      field.hidden = m === 'delete';
      if (m === 'rename') {
        dlgH.textContent = 'Rename chat'; dlgP.textContent = 'Give it a name you’ll find later.';
        input.value = t; ok.textContent = 'Save'; ok.disabled = true;
      } else {
        dlgH.textContent = 'Delete this chat?'; dlgP.textContent = `“${t}” and its messages will be deleted. You can’t undo this.`;
        ok.textContent = 'Delete Chat'; ok.disabled = false;
      }
      dlg.showModal();
      if (m === 'rename') { input.focus(); input.select(); } else ok.focus();
    };
    input.addEventListener('input', () => { const v = input.value.trim(); ok.disabled = !v || v === titleOf(target!); });
    $<HTMLButtonElement>('[data-as-cancel]').addEventListener('click', () => dlg.close('cancel'));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close('cancel'); });
    dlg.addEventListener('close', () => {
      const row = target!; let focusTo: HTMLElement | null = row.querySelector('[data-as-more]');
      if (dlg.returnValue === 'ok' && mode === 'rename') {
        const v = input.value.trim();
        row.querySelector('.as-title')!.textContent = v;
        row.querySelector('[data-as-more]')!.setAttribute('aria-label', `More for ${v}`);
        if (row.querySelector('[aria-current]')) heading.textContent = v;
        say(`Renamed to ${v}`);
      } else if (dlg.returnValue === 'ok' && mode === 'delete') {
        const all = rows(), i = all.indexOf(row), next = all[i + 1] ?? all[i - 1];
        const wasOpen = !!row.querySelector('[aria-current]'), t = titleOf(row);
        row.remove(); sync(); say(`Deleted ${t}`);
        if (next) { if (wasOpen) select(next); focusTo = next.querySelector('[data-as-link]'); }
        else { heading.textContent = 'No chats'; focusTo = $('[data-as-new]'); }
      }
      dlg.returnValue = ''; trigger = null; focusTo?.focus();
    });

    restore.addEventListener('click', () => { pinned.innerHTML = ''; list.innerHTML = original; heading.textContent = titleOf(list.querySelector('.as-row')!); sync(); say('Chats restored'); list.querySelector<HTMLElement>('[data-as-link]')!.focus(); });
  }
}
