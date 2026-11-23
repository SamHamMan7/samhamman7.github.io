// The dashboard unlocks a profile by its passphrase. Profiles and their data
// stay in this browser and can be moved with Export / Import.
window.Profile = (() => {
  const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const OWN = ['dash-links-2', 'dash-tasks', 'dash-tasks-v', 'dash-notes', 'dash-timer', 'dash-focus-tally', 'dash-grades', 'dash-grades-at', 'hac-user', 'hac-data', 'gpa-settings'];
  const ACCENTS = { amber: 'Amber', coral: 'Coral', rose: 'Rose', mint: 'Mint', sky: 'Sky', violet: 'Violet', slate: 'Slate' };
  const MODES = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  // Set to {salt, hash} to make Sam's passphrase the same on every device (see profile dialog).
  const OWNER_LOCK = null;
  const STARTER_APPS = [['Claude', 'https://claude.ai/'], ['ChatGPT', 'https://chatgpt.com/'], ['Gmail', 'https://mail.google.com/'], ['Google Drive', 'https://drive.google.com/'], ['Classroom', 'https://classroom.google.com/'], ['YouTube', 'https://www.youtube.com/'], ['Desmos', 'https://www.desmos.com/calculator'], ['Khan Academy', 'https://www.khanacademy.org/'], ['Quizlet', 'https://quizlet.com/'], ['AMC Trivial', 'https://amctrivial.com/'], ['USNCO quizzes', 'https://usnco-quizzes.web.app/'], ['Wikipedia', 'https://www.wikipedia.org/'], ['GitHub', 'https://github.com/'], ['Aniko', 'https://www.aniko.ai/']];
  let list = read('profiles', null); if (!Array.isArray(list)) list = [];
  // Sam's account is only offered in a browser that already holds it: one where it has a
  // passphrase, or where Sam's dashboard was used before accounts existed. Everywhere else it
  // does not appear at all; it reaches a new device only through an exported account file.
  const legacy = (() => { try { return ['dash-tasks', 'dash-links-2', 'dash-grades', 'dash-notes', 'signed-in:'].some(k => localStorage.getItem(k) !== null); } catch { return false; } })();
  const owner = list.find(p => p.id === '');
  if (owner && !owner.lock && !legacy) list = list.filter(p => p !== owner);
  if (!owner && legacy) list.unshift({ id: '', name: 'Sam', accent: 'amber', classes: true });
  const NOBODY = { id: '?', name: '', accent: 'amber', classes: false };
  let me = list.find(p => p.id === read('profile-active', '')) || list[0] || NOBODY;
  const prefix = p => p.id ? `p:${p.id}:` : '';
  const lockOf = p => (p.id === '' && OWNER_LOCK) || p.lock || null;
  const token = p => 'signed-in:' + p.id;
  const session = { get: k => { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k); } catch { return null; } }, set: (k, v, keep) => { try { sessionStorage.setItem(k, v); keep ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} }, drop: k => { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch {} }, kept: k => { try { return localStorage.getItem(k) !== null; } catch { return false; } } };
  const proof = p => lockOf(p) ? lockOf(p).hash : null;
  // Signed in means this browser holds the account's proof. Until then nothing of it is read or shown.
  // Every account needs a passphrase; one without it must set one at the next sign-in.
  const signedIn = me !== NOBODY && !!proof(me) && session.get(token(me)) === proof(me);
  const key = k => (signedIn ? prefix(me) : 'locked:') + k;
  const digest = async (pass, salt) => { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 150000 }, k, 256); return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join(''); };
  const makeLock = async pass => { const salt = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join(''); return { salt, hash: await digest(pass, salt) }; };
  const persist = () => write('profiles', list);
  const enter = (p, keep) => { session.set(token(p), proof(p), keep); write('profile-active', p.id); location.reload(); };
  const signOut = () => { session.drop(token(me)); location.reload(); };
  // Before sign-in the intro uses the look last picked on this device.
  const look = signedIn ? { accent: me.accent, mode: me.mode } : read('intro-look', {});
  const applyLook = l => { document.documentElement.dataset.accent = ACCENTS[l.accent] ? l.accent : 'amber'; if (MODES[l.mode] && l.mode !== 'auto') document.documentElement.dataset.mode = l.mode; else delete document.documentElement.dataset.mode; };
  applyLook(look);
  if (signedIn && !me.classes) document.documentElement.classList.add('no-classes');

  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const avatar = p => el('span', 'avatar avatar-' + (ACCENTS[p.accent] ? p.accent : 'amber'), (p.name.trim()[0] || '?').toUpperCase());
  const field = (type, placeholder, label, auto) => { const i = el('input'); i.type = type; i.placeholder = placeholder; i.setAttribute('aria-label', label); if (auto) i.autocomplete = auto; return i; };

  // An exported account file carries the account's settings, data and passphrase lock.
  async function importFile(file, note, keep) {
    try {
      const d = JSON.parse(await file.files[0].text()); if (d.kind !== 'my-site-profile' || !d.profile || typeof d.data !== 'object' || !d.profile.lock || !d.profile.lock.hash || !d.profile.lock.salt) throw 0;
      const isOwner = d.profile.owner === true, p = { id: isOwner ? '' : Date.now().toString(36), name: String(d.profile.name || 'Imported').slice(0, 20), accent: ACCENTS[d.profile.accent] ? d.profile.accent : 'amber', mode: MODES[d.profile.mode] ? d.profile.mode : 'auto', classes: !!d.profile.classes, lock: { salt: String(d.profile.lock.salt), hash: String(d.profile.lock.hash) } };
      if (isOwner) list = list.filter(x => x.id !== ''); list.push(p);
      for (const k of OWN) if (d.data[k] !== undefined) write(prefix(p) + k, d.data[k]);
      persist(); write('profile-active', p.id); session.drop(token(p)); location.reload();
    } catch { note.textContent = 'That file isn’t a profile exported from this site.'; }
  }

  function intro() {
    const root = el('div', 'intro');
    const card = el('div', 'intro-card');
    card.setAttribute('aria-labelledby', 'unlock-title');

    const heading = el('h1', '', 'Unlock dashboard');
    heading.id = 'unlock-title';
    const body = el('div', 'intro-body');
    const file = el('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.hidden = true;
    const imp = el('button', 'linkish', 'Import a profile');
    imp.type = 'button';
    imp.addEventListener('click', () => file.click());
    const message = el('p', 'small lock-msg');
    message.setAttribute('role', 'status');
    file.addEventListener('change', () => importFile(file, message, true));
    const note = el('p', 'small muted', 'This passphrase locks the dashboard in this browser.');

    function showForm(mode = 'unlock', profile = null) {
      const unlocking = mode === 'unlock';
      heading.textContent = unlocking ? 'Unlock dashboard' : 'Set a passphrase';
      message.textContent = '';
      const form = el('form', 'intro-form');
      const pass = field('password', 'Passphrase', 'Passphrase', unlocking ? 'current-password' : 'new-password');
      pass.required = true;
      if (!unlocking) pass.minLength = 6;
      const keepLabel = el('label', 'profile-check');
      const keep = el('input');
      keep.type = 'checkbox';
      keep.checked = true;
      keepLabel.append(keep, 'Keep unlocked on this device');
      const submit = el('button', 'primary', unlocking ? 'Unlock' : 'Set passphrase');
      submit.type = 'submit';
      form.append(pass, keepLabel, submit);
      body.replaceChildren(form);

      function link(label, action) {
        const button = el('button', 'linkish', label);
        button.type = 'button';
        button.addEventListener('click', action);
        body.append(button);
      }

      if (unlocking) {
        // Old local dashboards may still need an initial lock. Keeping their
        // profile id lets them keep the exact same storage keys.
        for (const p of list.filter(p => !lockOf(p))) {
          link('Set up ' + p.name, () => showForm('setup', p));
        }
        link('Add a local profile', () => showForm('setup'));
      } else if (list.some(p => lockOf(p))) {
        link('Back to unlock', () => showForm());
      }

      form.addEventListener('submit', async event => {
        event.preventDefault();
        submit.disabled = true;
        message.textContent = '';
        try {
          const candidates = list.filter(p => lockOf(p));
          const matches = [];
          for (const p of candidates) {
            const { salt, hash } = lockOf(p);
            if (await digest(pass.value, salt) === hash) matches.push(p);
          }
          if (body.firstElementChild !== form) return;

          if (unlocking) {
            if (matches.length === 1) return enter(matches[0], keep.checked);
            if (matches.length > 1) {
              // Legacy profiles can share a phrase. Reveal the chooser only
              // after successful verification and never guess which to open.
              heading.textContent = 'Choose a profile';
              body.replaceChildren();
              for (const p of matches) link(p.name, () => enter(p, keep.checked));
              link('Use a different passphrase', () => showForm());
              return;
            }
            message.textContent = 'That passphrase doesn’t match.';
            pass.select();
            return;
          }

          if (pass.value.length < 6) {
            message.textContent = 'Use at least 6 characters.';
            return;
          }
          if (matches.length) {
            message.textContent = 'Another profile uses that passphrase. Choose a different one.';
            return;
          }
          const p = profile || {
            id: crypto.randomUUID(), name: list.length ? 'Profile ' + (list.length + 1) : 'My dashboard',
            accent: ACCENTS[look.accent] ? look.accent : 'amber', mode: MODES[look.mode] ? look.mode : 'auto', classes: false,
          };
          p.lock = await makeLock(pass.value);
          if (!profile) {
            list.push(p);
            write(prefix(p) + 'dash-links-2', STARTER_APPS.filter((_, i) => i < 2 || [6, 9, 11].includes(i)));
          }
          persist();
          enter(p, keep.checked);
        } catch {
          message.textContent = 'This browser couldn’t verify the passphrase.';
        } finally {
          submit.disabled = false;
        }
      });
      pass.focus();
    }

    card.append(heading, body, message, imp, file, note);
    root.append(card);
    document.body.append(root);
    if (list.some(p => lockOf(p))) showForm();
    else showForm('setup', list.find(p => p === me) || null);
  }
  if (!signedIn) {
    document.documentElement.classList.add('locked');
    // Deferred scripts run before DOMContentLoaded; wait for it so the icon set has loaded.
    if (document.readyState === 'complete') intro(); else document.addEventListener('DOMContentLoaded', intro);
  }

  // Profile menu
  const chip = document.getElementById('profile-chip'), dialog = document.getElementById('profile-dialog');
  if (chip && dialog && signedIn) {
    chip.append(avatar(me), el('span', 'profile-name', me.name));
    chip.setAttribute('aria-label', `Profile ${me.name}. Customize or lock the dashboard`);
    const body = el('div', 'profile-body'); dialog.append(body);
    const draw = () => {
      body.replaceChildren();
      const head = el('div', 'profile-head'), who = el('div', 'profile-who'); who.append(avatar(me), el('h2', '', me.name)); const close = el('button', 'task-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', () => dialog.close()); head.append(who, close); body.append(head);
      const out = el('button', '', 'Lock dashboard'); out.type = 'button'; out.className = 'profile-out'; out.addEventListener('click', signOut); body.append(out);

      body.append(el('h3', 'eyebrow', 'Customize'));
      const nameRow = el('label', 'profile-field'), nm = el('input'); nm.type = 'text'; nm.value = me.name; nm.maxLength = 20; nameRow.append('Name', nm); nm.addEventListener('change', () => { if (nm.value.trim()) { me.name = nm.value.trim(); persist(); } });
      const colours = el('div', 'swatches'); colours.setAttribute('role', 'group'); colours.setAttribute('aria-label', 'Colour');
      for (const [id, label] of Object.entries(ACCENTS)) { const s = el('button', 'swatch avatar-' + id); s.type = 'button'; s.title = label; s.setAttribute('aria-label', label); s.setAttribute('aria-pressed', String(me.accent === id)); s.addEventListener('click', () => { me.accent = id; persist(); document.documentElement.dataset.accent = id; draw(); }); colours.append(s); }
      const modeRow = el('div', 'mode-row'), modeSeg = el('div', 'seg'); modeSeg.setAttribute('role', 'group'); modeSeg.setAttribute('aria-label', 'Light or dark');
      for (const [id, label] of Object.entries(MODES)) { const b = el('button', '', label); b.type = 'button'; b.setAttribute('aria-pressed', String((me.mode || 'auto') === id)); b.addEventListener('click', () => { me.mode = id; persist(); applyLook(me); draw(); }); modeSeg.append(b); }
      modeRow.append('Mode', modeSeg);
      const cls = el('label', 'profile-check'), box = el('input'); box.type = 'checkbox'; box.checked = !!me.classes; cls.append(box, 'Show Sam’s class calendar on Home (week, tests, countdowns)'); box.addEventListener('change', () => { me.classes = box.checked; persist(); });
      const fixed = me.id === '' && OWNER_LOCK, has = !!lockOf(me);
      const lockRow = el('div', 'profile-lock'), lp = field('password', has ? 'New passphrase' : 'Passphrase', 'Passphrase', 'new-password'), lb = el('button', '', has ? 'Change' : 'Set passphrase'), lr = el('button', 'linkish', 'Remove'), ln = el('p', 'small muted', fixed ? 'This account’s passphrase is built into the site and is the same on every device.' : 'Unlocking asks for this passphrase. There is no reset if you forget it.');
      lb.type = lr.type = 'button'; lr.hidden = true; lockRow.hidden = !!fixed;
      lb.addEventListener('click', async () => { if (lp.value.length < 6) { ln.textContent = 'Use at least 6 characters.'; return; } try { const keep = session.kept(token(me)); me.lock = await makeLock(lp.value); persist(); session.set(token(me), me.lock.hash, keep); draw(); } catch { ln.textContent = 'This browser can’t set a passphrase here.'; } });
      lr.addEventListener('click', () => { const keep = session.kept(token(me)); delete me.lock; persist(); session.set(token(me), 'yes', keep); draw(); });
      lockRow.append(lp, lb, lr);
      const done = el('button', 'primary', 'Save and reload'); done.type = 'button'; done.addEventListener('click', () => location.reload());
      body.append(nameRow, colours, modeRow, cls, lockRow, ln, done);

      body.append(el('h3', 'eyebrow', 'Move or remove'));
      const tools = el('div', 'profile-tools'), exp = el('button', '', 'Export'), imp = el('button', '', 'Import'), file = el('input'), del = el('button', 'linkish', 'Delete this account');
      exp.type = imp.type = del.type = 'button'; file.type = 'file'; file.accept = 'application/json,.json'; file.hidden = true;
      exp.addEventListener('click', () => { const data = { kind: 'my-site-profile', profile: { name: me.name, accent: me.accent, mode: me.mode, classes: !!me.classes, owner: me.id === '', lock: me.lock }, data: Object.fromEntries(OWN.map(k => [k, read(key(k), null)]).filter(([, v]) => v !== null)) }; const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })); a.download = `my-site-${me.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'account'}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
      imp.addEventListener('click', () => file.click());
      file.addEventListener('change', () => importFile(file, note));
      del.hidden = me.id === '';
      del.addEventListener('click', () => { if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Really delete? Click again'; return; } for (const k of OWN) try { localStorage.removeItem(key(k)); } catch {} session.drop(token(me)); list = list.filter(p => p !== me); persist(); write('profile-active', ''); location.reload(); });
      const note = el('p', 'small muted', 'Export saves a copy of this profile. Import it on another device and unlock it with the same passphrase.');
      tools.append(exp, imp, file, del); body.append(tools, note);
    };
    chip.addEventListener('click', () => { draw(); dialog.showModal(); });
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }
  return { me, key, isOwner: me.id === '', locked: !signedIn };
})();
