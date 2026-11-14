// Accounts: the site opens on an intro where you sign in or create an account. Each account has
// its own apps, tasks, notes, timer, grades and colour. There is no server: an account lives in
// this browser (move it with Export / Import), and a passphrase is a lock on this device, not
// encryption. Sam's account is built in and carries the class calendar and school links.
window.Profile = (() => {
  const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const OWN = ['dash-links-2', 'dash-tasks', 'dash-tasks-v', 'dash-notes', 'dash-timer', 'dash-focus-tally', 'dash-grades', 'dash-grades-at', 'hac-user'];
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
    } catch { note.textContent = 'That file isn’t an account exported from this site.'; }
  }

  // ---- intro: what the site is, then sign in or create an account ----
  function intro() {
    const icon = n => window.SiteIcons ? window.SiteIcons.svg(n) : '';
    const root = el('div', 'intro'), pitch = el('div', 'intro-pitch'), card = el('div', 'intro-card');
    pitch.append(el('p', 'intro-brand', 'my site'), el('h1', '', 'One page for your whole day.'), el('p', 'intro-sub', 'Your apps, tasks, calendar, focus timer and grades in one place, in the look you like. Practice and games are a tab away when you want them.'));
    const points = el('ul', 'intro-points');
    for (const [i, title, text] of [['grid', 'Everything you open, one tap away', 'Pick your apps and they sit at the top with their own icons.'], ['check', 'Tasks and a calendar that talk to each other', 'Give a task a date and it shows up on the month view.'], ['timer', 'Focus timer and grades', 'Timed focus sessions with breaks, and your class averages beside them.'], ['flask', 'Practice and games', 'Live practice problems, plus a few games for the break.']]) { const li = el('li'), b = el('span', 'intro-icon'); b.innerHTML = icon(i); const t = el('span'); t.append(el('strong', '', title), el('span', '', text)); li.append(b, t); points.append(li); }
    pitch.append(points);
    // Try the looks before signing in; the choice carries into a new account.
    const chosen = { accent: ACCENTS[look.accent] ? look.accent : 'amber', mode: MODES[look.mode] ? look.mode : 'auto' };
    const themes = el('div', 'intro-themes'), modes = el('div', 'seg'); themes.append(el('span', '', 'Try a look'));
    const repaint = () => { for (const x of [...pitch.querySelectorAll('.swatch'), ...card.querySelectorAll('.swatch')]) x.setAttribute('aria-pressed', String(x.dataset.id === chosen.accent)); for (const x of modes.children) x.setAttribute('aria-pressed', String(x.dataset.id === chosen.mode)); applyLook(chosen); write('intro-look', chosen); };
    for (const [id, label] of Object.entries(ACCENTS)) { const x = el('button', 'swatch avatar-' + id); x.type = 'button'; x.dataset.id = id; x.title = label; x.setAttribute('aria-label', label + ' colour'); x.addEventListener('click', () => { chosen.accent = id; repaint(); }); themes.append(x); }
    for (const [id, label] of Object.entries(MODES)) { const x = el('button', '', label); x.type = 'button'; x.dataset.id = id; x.addEventListener('click', () => { chosen.mode = id; repaint(); }); modes.append(x); }
    modes.setAttribute('role', 'group'); modes.setAttribute('aria-label', 'Light or dark'); themes.append(modes); pitch.append(themes); repaint();
    const tabs = el('div', 'seg intro-tabs'), inTab = el('button', '', 'Sign in'), newTab = el('button', '', 'Create account'), body = el('div', 'intro-body');
    inTab.type = newTab.type = 'button'; tabs.append(inTab, newTab); card.append(tabs, body);
    const keepRow = checked => { const l = el('label', 'profile-check'), c = el('input'); c.type = 'checkbox'; c.checked = checked; l.append(c, 'Keep me signed in on this device'); return [l, c]; };

    function showSignIn(chosen = me) {
      inTab.setAttribute('aria-pressed', 'true'); newTab.setAttribute('aria-pressed', 'false'); body.replaceChildren();
      const people = el('div', 'people');
      for (const p of list) { const b = el('button', 'person' + (p === chosen ? ' is-me' : '')); b.type = 'button'; b.append(avatar(p), el('span', '', p.name)); b.addEventListener('click', () => showSignIn(p)); people.append(b); }
      const importRow = el('p', 'small intro-import'), imp = el('button', 'linkish', 'Import an account file'), file = el('input'); imp.type = 'button'; file.type = 'file'; file.accept = 'application/json,.json'; file.hidden = true;
      imp.addEventListener('click', () => file.click()); importRow.append('Have an account on another device? ', imp, file);
      if (!list.length) { const none = el('p', 'muted', 'No accounts on this device yet.'), go = el('button', 'primary', 'Create account'); go.type = 'button'; go.addEventListener('click', showCreate); const msg = el('p', 'small lock-msg'); body.append(none, go, importRow, msg); file.addEventListener('change', () => importFile(file, msg, true)); return; }
      const fresh = !lockOf(chosen);
      const form = el('form', 'intro-form'), pass = field('password', fresh ? 'Choose a passphrase' : 'Passphrase', `Passphrase for ${chosen.name}`, fresh ? 'new-password' : 'current-password'), ok = el('button', 'primary', fresh ? `Protect ${chosen.name} and sign in` : `Sign in as ${chosen.name}`), msg = el('p', 'small lock-msg'), [keepLabel, keep] = keepRow(true);
      ok.type = 'submit'; msg.setAttribute('role', 'status'); pass.required = true;
      if (fresh) form.append(el('p', 'small muted', 'This account has no passphrase yet. Choose one now (6 characters or more); you’ll need it to sign in from here on.'));
      form.append(pass, keepLabel, ok, msg); body.append(el('p', 'intro-label', 'Accounts on this device'), people, form, importRow); pass.focus();
      file.addEventListener('change', () => importFile(file, msg, true));
      form.addEventListener('submit', async e => {
        e.preventDefault(); ok.disabled = true;
        if (fresh) { if (pass.value.length < 6) { ok.disabled = false; msg.textContent = 'Use at least 6 characters.'; return; } try { chosen.lock = await makeLock(pass.value); persist(); return enter(chosen, keep.checked); } catch { ok.disabled = false; msg.textContent = 'This browser can’t set a passphrase here.'; return; } }
        const lock = lockOf(chosen); let h = ''; try { h = await digest(pass.value, lock.salt); } catch {}
        if (h === lock.hash) enter(chosen, keep.checked); else { ok.disabled = false; msg.textContent = 'That passphrase doesn’t match.'; pass.select(); }
      });
    }
    function showCreate() {
      inTab.setAttribute('aria-pressed', 'false'); newTab.setAttribute('aria-pressed', 'true'); body.replaceChildren();
      const form = el('form', 'intro-form'), name = field('text', 'Your name', 'Your name', 'nickname'), pass = field('password', 'Passphrase (6 characters or more)', 'Passphrase', 'new-password'), ok = el('button', 'primary', 'Create my account'), msg = el('p', 'small lock-msg'), [keepLabel, keep] = keepRow(true);
      name.maxLength = 20; name.required = true; pass.required = true; ok.type = 'submit';
      const colours = el('div', 'swatches'); colours.setAttribute('role', 'group'); colours.setAttribute('aria-label', 'Colour');
      for (const [id, label] of Object.entries(ACCENTS)) { const x = el('button', 'swatch avatar-' + id); x.type = 'button'; x.dataset.id = id; x.title = label; x.setAttribute('aria-label', label); x.addEventListener('click', () => { chosen.accent = id; repaint(); }); colours.append(x); }
      const apps = el('div', 'intro-apps'); apps.setAttribute('role', 'group'); apps.setAttribute('aria-label', 'Starter apps');
      for (const [i, [n]] of STARTER_APPS.entries()) { const b = el('button', 'pill', n); b.type = 'button'; b.setAttribute('aria-pressed', String(i < 2 || [6, 9, 11].includes(i))); b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))); apps.append(b); }
      form.append(name, pass, el('p', 'intro-label', 'Colour'), colours, el('p', 'intro-label', 'Apps to start with (you can change these later)'), apps, keepLabel, ok, msg);
      body.append(form); repaint(); name.focus();
      form.addEventListener('submit', async e => {
        e.preventDefault(); const n = name.value.trim(); if (!n) return;
        if (list.some(p => p.name.toLowerCase() === n.toLowerCase())) { msg.textContent = 'That name is already an account on this device.'; return; }
        if (pass.value.length < 6) { msg.textContent = 'Use at least 6 characters for the passphrase.'; return; }
        const p = { id: Date.now().toString(36), name: n, accent: chosen.accent, mode: chosen.mode, classes: false }; ok.disabled = true;
        try { p.lock = await makeLock(pass.value); } catch { ok.disabled = false; msg.textContent = 'This browser can’t create accounts (it needs a secure https page).'; return; }
        const picked = STARTER_APPS.filter((_, i) => apps.children[i].getAttribute('aria-pressed') === 'true');
        if (picked.length) write(prefix(p) + 'dash-links-2', picked);
        list.push(p); persist(); enter(p, keep.checked);
      });
    }
    inTab.addEventListener('click', () => showSignIn()); newTab.addEventListener('click', showCreate);
    card.append(el('p', 'small muted intro-note', 'Accounts are saved in this browser only. Nothing is sent to a server.'));
    root.append(pitch, card); document.body.append(root); list.length ? showSignIn() : showCreate();
  }
  if (!signedIn) {
    document.documentElement.classList.add('locked');
    // Deferred scripts run before DOMContentLoaded; wait for it so the icon set has loaded.
    if (document.readyState === 'complete') intro(); else document.addEventListener('DOMContentLoaded', intro);
  }

  // ---- account menu: customize, move, sign out ----
  const chip = document.getElementById('profile-chip'), dialog = document.getElementById('profile-dialog');
  if (chip && dialog && signedIn) {
    chip.append(avatar(me), el('span', 'profile-name', me.name));
    chip.setAttribute('aria-label', `Account: ${me.name}. Customize or sign out`);
    const body = el('div', 'profile-body'); dialog.append(body);
    const draw = () => {
      body.replaceChildren();
      const head = el('div', 'profile-head'), who = el('div', 'profile-who'); who.append(avatar(me), el('h2', '', me.name)); const close = el('button', 'task-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', () => dialog.close()); head.append(who, close); body.append(head);
      const out = el('button', '', 'Sign out / switch account'); out.type = 'button'; out.className = 'profile-out'; out.addEventListener('click', signOut); body.append(out);

      body.append(el('h3', 'eyebrow', 'Customize'));
      const nameRow = el('label', 'profile-field'), nm = el('input'); nm.type = 'text'; nm.value = me.name; nm.maxLength = 20; nameRow.append('Name', nm); nm.addEventListener('change', () => { if (nm.value.trim()) { me.name = nm.value.trim(); persist(); } });
      const colours = el('div', 'swatches'); colours.setAttribute('role', 'group'); colours.setAttribute('aria-label', 'Colour');
      for (const [id, label] of Object.entries(ACCENTS)) { const s = el('button', 'swatch avatar-' + id); s.type = 'button'; s.title = label; s.setAttribute('aria-label', label); s.setAttribute('aria-pressed', String(me.accent === id)); s.addEventListener('click', () => { me.accent = id; persist(); document.documentElement.dataset.accent = id; draw(); }); colours.append(s); }
      const modeRow = el('div', 'mode-row'), modeSeg = el('div', 'seg'); modeSeg.setAttribute('role', 'group'); modeSeg.setAttribute('aria-label', 'Light or dark');
      for (const [id, label] of Object.entries(MODES)) { const b = el('button', '', label); b.type = 'button'; b.setAttribute('aria-pressed', String((me.mode || 'auto') === id)); b.addEventListener('click', () => { me.mode = id; persist(); applyLook(me); draw(); }); modeSeg.append(b); }
      modeRow.append('Mode', modeSeg);
      const cls = el('label', 'profile-check'), box = el('input'); box.type = 'checkbox'; box.checked = !!me.classes; cls.append(box, 'Show Sam’s class calendar on Home (week, tests, countdowns)'); box.addEventListener('change', () => { me.classes = box.checked; persist(); });
      const fixed = me.id === '' && OWNER_LOCK, has = !!lockOf(me);
      const lockRow = el('div', 'profile-lock'), lp = field('password', has ? 'New passphrase' : 'Passphrase', 'Passphrase', 'new-password'), lb = el('button', '', has ? 'Change' : 'Set passphrase'), lr = el('button', 'linkish', 'Remove'), ln = el('p', 'small muted', fixed ? 'This account’s passphrase is built into the site and is the same on every device.' : 'Signing in asks for this passphrase. There is no reset if you forget it.');
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
      const note = el('p', 'small muted', 'Accounts are saved in this browser only. Export makes a file you can import on another device; it signs in with the same passphrase.');
      tools.append(exp, imp, file, del); body.append(tools, note);
    };
    chip.addEventListener('click', () => { draw(); dialog.showModal(); });
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }
  return { me, key, isOwner: me.id === '', locked: !signedIn };
})();
