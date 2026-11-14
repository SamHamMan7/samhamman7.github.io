// Profiles: each person using this browser gets their own apps, tasks, notes, timer and colour.
// Nothing is sent anywhere; a profile lives in this browser and can be moved with Export / Import.
window.Profile = (() => {
  const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const OWN = ['dash-links-2', 'dash-tasks', 'dash-tasks-v', 'dash-notes', 'dash-timer', 'dash-focus-tally', 'dash-grades', 'dash-grades-at', 'hac-user'];
  const ACCENTS = { amber: 'Amber', coral: 'Coral', mint: 'Mint', sky: 'Sky', violet: 'Violet' };
  let list = read('profiles', null);
  if (!Array.isArray(list) || !list.length) list = [{ id: '', name: 'Sam', accent: 'amber', classes: true }];
  let me = list.find(p => p.id === read('profile-active', '')) || list[0];
  const prefix = p => p.id ? `p:${p.id}:` : '';
  // Passphrase: a screen lock for this profile. Until it is entered (once per browser session)
  // nothing of the profile is read or shown. It is not encryption: the data stays in this browser.
  let unlocked = true; try { unlocked = !me.lock || sessionStorage.getItem('unlocked:' + me.id) === me.lock.hash; } catch {}
  const key = k => (unlocked ? prefix(me) : 'locked:') + k;
  const digest = async (pass, salt) => { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 150000 }, k, 256); return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join(''); };
  const persist = () => write('profiles', list);
  const go = id => { write('profile-active', id); location.reload(); };
  document.documentElement.dataset.accent = ACCENTS[me.accent] ? me.accent : 'amber';
  if (!me.classes) document.documentElement.classList.add('no-classes');

  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  if (!unlocked) {
    document.documentElement.classList.add('locked');
    const gate = el('form', 'lock'), box = el('div', 'lock-box'), pass = el('input'), ok = el('button', 'primary', 'Unlock'), msg = el('p', 'small lock-msg');
    pass.type = 'password'; pass.placeholder = 'Passphrase'; pass.autocomplete = 'current-password'; pass.setAttribute('aria-label', `Passphrase for ${me.name}`); ok.type = 'submit'; msg.setAttribute('role', 'status');
    const who = el('span', 'avatar avatar-' + (ACCENTS[me.accent] ? me.accent : 'amber'), (me.name.trim()[0] || '?').toUpperCase());
    box.append(who, el('h2', '', me.name), el('p', 'muted', 'This profile is locked.'), pass, ok, msg);
    const others = list.filter(p => p !== me);
    if (others.length) { const row = el('p', 'small lock-others'); row.append('Not you? '); for (const p of others) { const b = el('button', 'linkish', p.name); b.type = 'button'; b.addEventListener('click', () => go(p.id)); row.append(b, ' '); } box.append(row); }
    gate.append(box); document.body.append(gate); pass.focus();
    gate.addEventListener('submit', async e => { e.preventDefault(); ok.disabled = true; let h = ''; try { h = await digest(pass.value, me.lock.salt); } catch {} if (h === me.lock.hash) { try { sessionStorage.setItem('unlocked:' + me.id, h); } catch {} location.reload(); } else { ok.disabled = false; msg.textContent = 'That passphrase doesn’t match.'; pass.select(); } });
  }
  const chip = document.getElementById('profile-chip'), dialog = document.getElementById('profile-dialog');
  if (chip && dialog && unlocked) {
    const avatar = p => el('span', 'avatar avatar-' + (ACCENTS[p.accent] ? p.accent : 'amber'), (p.name.trim()[0] || '?').toUpperCase());
    chip.append(avatar(me), el('span', 'profile-name', me.name));
    chip.setAttribute('aria-label', `Profile: ${me.name}. Switch or customize`);
    const body = el('div', 'profile-body'); dialog.append(body);
    const draw = () => {
      body.replaceChildren();
      const head = el('div', 'profile-head'); head.append(el('h2', '', 'Who’s using this?')); const close = el('button', 'task-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', () => dialog.close()); head.append(close); body.append(head);
      const people = el('div', 'people');
      for (const p of list) { const b = el('button', 'person' + (p === me ? ' is-me' : '')); b.type = 'button'; b.append(avatar(p), el('span', '', p.name)); if (p !== me) b.addEventListener('click', () => go(p.id)); else b.setAttribute('aria-current', 'true'); people.append(b); }
      body.append(people);
      const add = el('form', 'profile-new'), name = el('input'), ok = el('button', 'primary', 'Add profile'); name.type = 'text'; name.placeholder = 'New profile name'; name.maxLength = 20; name.required = true; name.setAttribute('aria-label', 'New profile name'); ok.type = 'submit'; add.append(name, ok);
      add.addEventListener('submit', e => { e.preventDefault(); const n = name.value.trim(); if (!n) return; const id = Date.now().toString(36); list.push({ id, name: n, accent: Object.keys(ACCENTS)[list.length % 5], classes: false }); persist(); go(id); });
      body.append(add);

      body.append(el('h3', 'eyebrow', `Customize ${me.name}`));
      const nameRow = el('label', 'profile-field'), nm = el('input'); nm.type = 'text'; nm.value = me.name; nm.maxLength = 20; nameRow.append('Name', nm); nm.addEventListener('change', () => { if (nm.value.trim()) { me.name = nm.value.trim(); persist(); } });
      const colours = el('div', 'swatches'); colours.setAttribute('role', 'group'); colours.setAttribute('aria-label', 'Colour');
      for (const [id, label] of Object.entries(ACCENTS)) { const s = el('button', 'swatch avatar-' + id); s.type = 'button'; s.title = label; s.setAttribute('aria-label', label); s.setAttribute('aria-pressed', String(me.accent === id)); s.addEventListener('click', () => { me.accent = id; persist(); document.documentElement.dataset.accent = id; draw(); }); colours.append(s); }
      const cls = el('label', 'profile-check'), box = el('input'); box.type = 'checkbox'; box.checked = !!me.classes; cls.append(box, 'Show Sam’s class calendar on Home (week, tests, countdowns)'); box.addEventListener('change', () => { me.classes = box.checked; persist(); });
      const lockRow = el('div', 'profile-lock'), lp = el('input'), lb = el('button', '', me.lock ? 'Change' : 'Set passphrase'), lr = el('button', 'linkish', 'Remove'), ln = el('p', 'small muted', me.lock ? 'This profile asks for its passphrase when the browser is reopened.' : 'Optional. Keeps other people on this device out of this profile. There is no reset if you forget it.');
      lp.type = 'password'; lp.placeholder = me.lock ? 'New passphrase' : 'Passphrase'; lp.autocomplete = 'new-password'; lp.setAttribute('aria-label', 'Passphrase'); lb.type = lr.type = 'button'; lr.hidden = !me.lock;
      lb.addEventListener('click', async () => { if (lp.value.length < 4) { ln.textContent = 'Use at least 4 characters.'; return; } const salt = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join(''); try { const hash = await digest(lp.value, salt); me.lock = { salt, hash }; persist(); sessionStorage.setItem('unlocked:' + me.id, hash); draw(); } catch { ln.textContent = 'This browser can’t set a passphrase here.'; } });
      lr.addEventListener('click', () => { delete me.lock; persist(); draw(); });
      lockRow.append(lp, lb, lr);
      const done = el('button', 'primary', 'Save and reload'); done.type = 'button'; done.addEventListener('click', () => location.reload());
      body.append(nameRow, colours, cls, lockRow, ln, done);

      body.append(el('h3', 'eyebrow', 'Move or remove'));
      const tools = el('div', 'profile-tools'), exp = el('button', '', 'Export'), imp = el('button', '', 'Import'), file = el('input'), del = el('button', 'linkish', 'Delete this profile');
      exp.type = imp.type = del.type = 'button'; file.type = 'file'; file.accept = 'application/json,.json'; file.hidden = true;
      exp.addEventListener('click', () => { const data = { kind: 'my-site-profile', profile: { name: me.name, accent: me.accent, classes: !!me.classes }, data: Object.fromEntries(OWN.map(k => [k, read(key(k), null)]).filter(([, v]) => v !== null)) }; const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })); a.download = `my-site-${me.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'profile'}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
      imp.addEventListener('click', () => file.click());
      file.addEventListener('change', async () => { try { const d = JSON.parse(await file.files[0].text()); if (d.kind !== 'my-site-profile' || !d.profile || typeof d.data !== 'object') throw 0; const id = Date.now().toString(36), p = { id, name: String(d.profile.name || 'Imported').slice(0, 20), accent: ACCENTS[d.profile.accent] ? d.profile.accent : 'amber', classes: !!d.profile.classes }; list.push(p); for (const k of OWN) if (d.data[k] !== undefined) write(prefix(p) + k, d.data[k]); persist(); go(id); } catch { note.textContent = 'That file isn’t a profile exported from this site.'; } });
      del.hidden = list.length < 2 || me.id === '';
      del.addEventListener('click', () => { if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Really delete? Click again'; return; } for (const k of OWN) try { localStorage.removeItem(key(k)); } catch {} list = list.filter(p => p !== me); persist(); go(list[0].id); });
      const note = el('p', 'small muted', 'Profiles are saved in this browser only, with no password. Export makes a file you can import on another device.');
      tools.append(exp, imp, file, del); body.append(tools, note);
    };
    chip.addEventListener('click', () => { draw(); dialog.showModal(); });
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }
  return { me, key, isOwner: me.id === '', locked: !unlocked };
})();
