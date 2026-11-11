// Ported from shauna.dev/src/components/v2/AppShell.astro (2026-11-11). Keep the two in step; DESIGN.md, Components has the spec.
const chats = [
  { id: 'c1', title: 'Plan the foster schedule for December' },
  { id: 'c2', title: 'Rewrite the adoption form intro' },
  { id: 'c3', title: 'Token names for the dusk theme' },
  { id: 'c4', title: 'Grant report, first draft' },
  { id: 'c5', title: 'Vet visit checklist' },
];
const I = {
  plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>',
  more: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false"><path d="M15 3l6 6-3 1-4 4 1 5-2 2-4-5-5 5-1-1 5-5-5-4 2-2 5 1 4-4z"/></svg>',
  chats: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
};

export function appShellHTML(): string {
  return `<div class="as" data-as>
  <div class="as-top">
    <button type="button" class="as-toggle" data-as-toggle aria-expanded="false" aria-controls="as-side">${I.chats}Chats</button>
  </div>
  <nav class="as-side" id="as-side" aria-label="Chats" data-as-side>
    <button type="button" class="btn btn--fill as-new" data-as-new>${I.plus}New Chat</button>
    <p class="as-label" data-as-pinned-label hidden>Pinned</p>
    <ul class="as-list" data-as-pinned></ul>
    <p class="as-label">Recent</p>
    <ul class="as-list" data-as-list>
      ${chats.map((c, i) => `<li class="as-row" data-id="${c.id}">
          <a href="#${c.id}" class="as-link" ${i === 0 ? 'aria-current="page"' : ''} data-as-link><span class="as-pin" aria-hidden="true" hidden>${I.pin}</span><span class="as-title" data-user-content>${c.title}</span></a>
          <button type="button" class="as-more" aria-haspopup="menu" aria-expanded="false" aria-label="More for ${c.title}" data-as-more>${I.more}</button>
        </li>`).join('')}
    </ul>
    <button type="button" class="btn btn--text as-restore" data-as-restore hidden>Restore Chats</button>
  </nav>
  <section class="as-main" aria-live="polite" aria-labelledby="as-main-h">
    <h3 class="as-main-h t-item" id="as-main-h" data-as-heading data-user-content>${chats[0].title}</h3>
    <p class="as-main-p">Open a chat’s menu with the three dots, or press Enter on them. Rename and Delete open a dialog; Pin moves the chat to the top.</p>
  </section>

  <ul class="as-menu" role="menu" aria-label="Chat actions" data-as-menu hidden>
    <li role="menuitem" tabindex="-1" data-act="rename">Rename</li>
    <li role="menuitem" tabindex="-1" data-act="pin">Pin</li>
    <li role="separator" class="as-sep"></li>
    <li role="menuitem" tabindex="-1" data-act="delete">Delete</li>
  </ul>

  <dialog class="as-dlg" aria-labelledby="as-dlg-h" aria-describedby="as-dlg-p" data-as-dlg>
    <form method="dialog" data-as-form>
      <h3 class="t-item as-dlg-h" id="as-dlg-h" data-as-dlg-h>Rename Chat</h3>
      <p class="as-dlg-p" id="as-dlg-p" data-as-dlg-p></p>
      <div class="as-field" data-as-field>
        <label class="as-field-l" for="as-name">Name</label>
        <input class="as-input" id="as-name" name="name" maxlength="80" autocomplete="off" data-as-input />
      </div>
      <div class="as-actions">
        <button type="button" class="btn btn--text" data-as-cancel>Cancel</button>
        <button type="submit" class="btn btn--fill" value="ok" data-as-ok>Save</button>
      </div>
    </form>
  </dialog>
  <p class="sr-only" aria-live="polite" data-as-live></p>
</div>`;
}
