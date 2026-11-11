// Ported from shauna.dev/src/components/v2/Composer.astro (2026-11-11). Keep the two in step; DESIGN.md, Components has the spec.
import tokens from '../../tokens/tokens.json';
const voiceCfg = JSON.stringify({ voice: tokens.voice, sound: tokens.sound, haptic: tokens.haptic, motion: tokens.motion });
const I = {
  attach: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.5 11.5 12.4 19.6a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.7-7.7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>',
  send: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>',
  stop: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor"/></svg>',
  mic: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5.5 12.5 12 19l6.5-6.5"/></svg>',
};
const contexts = ['This page', 'Design tokens', 'Résumé', 'Case studies'];
const suggestions = ['How do the design tokens work?', 'What does X-ray mode show?', 'Which checks run on every build?'];

export function composerHTML(): string {
  return `<div class="cmp-demo">
  <div class="cmp" data-composer data-state="empty" data-voice='${voiceCfg}'>
    <div class="cmp-top">
      <span class="cmp-dot" aria-hidden="true"></span>
      <span class="meta">Composer</span>
      <span class="cmp-state meta" data-state-label>Empty</span>
    </div>

    <div class="cmp-thread" data-thread tabindex="0" aria-label="Conversation">
      <div class="cmp-empty" data-empty>
        <p class="cmp-empty-h">Ask about this site.</p>
        <p class="muted">Pick a question to fill the box, or write your own. Nothing sends until you do.</p>
        <div class="cmp-sugs">
          ${suggestions.map((s) => `<button type="button" class="cmp-sug" data-sug>${s}</button>`).join('')}
        </div>
      </div>
      <ol class="cmp-msgs" data-msgs></ol>
    </div>

    <button type="button" class="cmp-jump" data-jump hidden>${I.down}Jump to Latest</button>

    <form class="cmp-box" data-box novalidate>
      <div class="cmp-drop" aria-hidden="true">Drop to attach</div>
      <ul class="cmp-chips" data-chips aria-label="Attached files and context"></ul>
      <label for="cmp-input" class="sr-only">Message</label>
      <textarea id="cmp-input" class="cmp-input" data-input rows="1" placeholder="Ask about this site…" aria-describedby="cmp-hint"></textarea>
      <div class="cmp-bar">
        <div class="cmp-tools">
          <button type="button" class="cmp-icon" data-attach aria-label="Attach files">${I.attach}</button>
          <input type="file" multiple hidden data-file tabindex="-1" />
          <div class="cmp-ctx">
            <button type="button" class="cmp-ctx-btn" data-ctx aria-haspopup="menu" aria-expanded="false" aria-controls="cmp-menu">${I.plus}Context</button>
            <ul class="cmp-menu" id="cmp-menu" role="menu" aria-label="Add context" data-menu hidden>
              ${contexts.map((c) => `<li role="menuitemcheckbox" aria-checked="false" tabindex="-1" data-ctx-item="${c}"><span class="cmp-check" aria-hidden="true"></span>${c}</li>`).join('')}
            </ul>
          </div>
          <button type="button" class="cmp-icon cmp-mic" data-mic aria-pressed="false" aria-label="Speak a Message" hidden>${I.mic}</button>
        </div>
        <p id="cmp-hint" class="cmp-hint" data-hint>Enter to send · Shift+Enter for a new line</p>
        <button type="submit" class="cmp-send" data-send aria-label="Send message" disabled>
          <span class="i-send">${I.send}</span><span class="i-stop">${I.stop}</span>
        </button>
      </div>
    </form>
    <p class="sr-only" role="status" data-status></p>
  </div>

  <aside class="cmp-side" aria-label="Demo controls">
    <fieldset class="cmp-seg">
      <legend class="meta">Next reply</legend>
      <div class="cmp-seg-row">
        <label><input type="radio" name="cmp-mode" value="normal" checked /><span>Normal</span></label>
        <label><input type="radio" name="cmp-mode" value="slow" /><span>Slow</span></label>
        <label><input type="radio" name="cmp-mode" value="fail" /><span>Fails</span></label>
      </div>
      <p class="muted cmp-side-p">Slow gives you time to stop it. Fails cuts out partway, so you can see the error and retry.</p>
    </fieldset>
    <fieldset class="cmp-sw">
      <legend class="meta">Voice</legend>
      <label class="cmp-sw-row"><input type="checkbox" data-read /><span class="cmp-sw-t" aria-hidden="true"></span><span>Read Replies Aloud</span></label>
      <label class="cmp-sw-row"><input type="checkbox" data-sounds /><span class="cmp-sw-t" aria-hidden="true"></span><span>Sounds and Vibration</span></label>
      <p class="muted cmp-side-p" data-mic-note>Press the mic to speak a message. Captions fill the box as you talk, and nothing sends until you do.</p>
    </fieldset>
    <div class="cmp-kb">
      <p class="meta">Keyboard</p>
      <dl class="cmp-keys">
        <div><dt><kbd>Enter</kbd></dt><dd>Send</dd></div>
        <div><dt><kbd>Shift</kbd> + <kbd>Enter</kbd></dt><dd>New line</dd></div>
        <div><dt><kbd>Esc</kbd></dt><dd>Stop a reply, listening or reading aloud</dd></div>
        <div><dt><kbd>↑</kbd> <kbd>↓</kbd></dt><dd>Move through the context menu</dd></div>
      </dl>
    </div>
    <p class="muted cmp-side-p">Replies are scripted; no AI is connected. Files you attach never leave your browser.</p>
  </aside>
</div>`;
}
