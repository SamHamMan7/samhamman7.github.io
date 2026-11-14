// Home dashboard: apps, today's classes, tasks, what's coming up, a mini calendar,
// countdowns, a focus timer, the day's study focus and a scratch pad.
// Everything personal (apps, tasks, notes) is saved only in this browser.
(() => {
  const home = document.getElementById('home'); if (!home) return;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const P = window.Profile || { me: { name: '', classes: true }, key: k => k, isOwner: true };
  const load = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(P.key(key))); return v ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(P.key(key), JSON.stringify(value)); } catch {} };
  const now = new Date(), hour = now.getHours();
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayKey = key(now), names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysTo = k => Math.round((parse(k) - parse(todayKey)) / 86400000);
  const pretty = d => `${names[d.getDay()]} ${d.toLocaleDateString(undefined, { month: 'short' })} ${d.getDate()}`;
  const when = n => n === 0 ? 'today' : n === 1 ? 'tomorrow' : n < 0 ? `${-n}d late` : `in ${n} days`;
  $('dash-greeting').textContent = (hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening') + (P.me.name ? ', ' + P.me.name : '') + '.';
  if (!P.isOwner) { const sub = home.querySelector('.hero-sub'); if (sub) sub.textContent = 'Your own apps, tasks, timer and notes on Sam’s site.'; }
  $('dash-date').textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  // ---- apps ----
  const ALL_LINKS = [['Schoology', 'https://csisd.schoology.com/'], ['ClassLink', 'https://launchpad.classlink.com/csisd'], ['HAC', 'https://hac.csisd.org/homeaccess'], ['Claude', 'https://claude.ai/'], ['ChatGPT', 'https://chatgpt.com/'], ['Aniko', 'https://www.aniko.ai/'], ['AMC Trivial', 'https://amctrivial.com/'], ['USNCO quizzes', 'https://usnco-quizzes.web.app/'], ['Desmos', 'https://www.desmos.com/calculator'], ['Showdown', 'https://play.pokemonshowdown.com/'], ['GitHub', 'https://github.com/']];
  const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; } };
  const DEFAULT_LINKS = P.isOwner ? ALL_LINKS : ALL_LINKS.slice(3);
  let links = load('dash-links-2', null); if (!Array.isArray(links) || !links.length) links = DEFAULT_LINKS;
  if (P.isOwner && !load('dash-links-hac', false)) { if (!links.some(([, u]) => /hac\.csisd\.org/.test(u))) { links = [...links]; links.splice(2, 0, ALL_LINKS[2]); } save('dash-links-hac', true); if (links !== DEFAULT_LINKS) save('dash-links-2', links); }
  // College Station ISD addresses replace the generic login pages in lists saved earlier.
  links = links.map(([n, u]) => u === 'https://app.schoology.com/login' ? [n, 'https://csisd.schoology.com/'] : u === 'https://launchpad.classlink.com/' ? [n, 'https://launchpad.classlink.com/csisd'] : [n, u]);
  const bar = $('dash-links'), editor = $('dash-editor'), rows = $('dash-rows');
  function drawLinks() {
    bar.replaceChildren(...links.filter(([n, u]) => n && safeUrl(u)).map(([name, url]) => { const a = el('a', 'app'); a.href = safeUrl(url); a.target = '_blank'; a.rel = 'noopener'; a.append(window.SiteIcons.tile(name, null, null, url), el('span', 'app-name', name)); return a; }));
  }
  function row(name = '', url = '') {
    const r = el('div', 'dash-row'), n = el('input'), u = el('input'), x = el('button', 'linkish', 'Remove');
    n.type = 'text'; n.placeholder = 'Name'; n.value = name; n.setAttribute('aria-label', 'App name'); n.maxLength = 30;
    u.type = 'url'; u.placeholder = 'https://…'; u.value = url; u.setAttribute('aria-label', 'App address');
    x.type = 'button'; x.addEventListener('click', () => r.remove()); r.append(n, u, x); return r;
  }
  $('dash-edit').addEventListener('click', () => { editor.hidden = !editor.hidden; if (!editor.hidden) rows.replaceChildren(...links.map(([n, u]) => row(n, u))); });
  $('dash-add').addEventListener('click', () => rows.append(row()));
  $('dash-reset').addEventListener('click', () => rows.replaceChildren(...DEFAULT_LINKS.map(([n, u]) => row(n, u))));
  editor.addEventListener('submit', event => {
    event.preventDefault();
    const next = [...rows.children].map(r => { const [n, u] = r.querySelectorAll('input'); return [n.value.trim(), u.value.trim()]; }).filter(([n, u]) => n && safeUrl(u));
    links = next.length ? next : DEFAULT_LINKS; save('dash-links-2', links); editor.hidden = true; drawLinks();
  });
  drawLinks();

  // ---- class calendar: every dated item from today on ----
  const cal = P.me.classes ? window.SCHOOL_CALENDAR : null;
  const important = /\b(tests?|quiz(zes)?|exams?|due|essays?|dbq|timed|final|presentations?|psat|sat day|act day)\b/i, off = /holiday|no school|break\b/i, exam = /\b(tests?|exams?|final|dbq|timed|psat)\b/i;
  const slug = c => c.toLowerCase().replace(/[^a-z]+/g, '-');
  const dates = cal ? Object.keys(cal.days).sort() : [], ahead = [];
  for (const k of dates) if (k >= todayKey) for (const c of cal.classes) for (const item of cal.days[k][c] || []) if (important.test(item) && !off.test(item)) ahead.push({ k, c, item });
  const goCalendar = k => { window.dispatchEvent(new CustomEvent('calendar-goto', { detail: k })); location.hash = '#calendar'; };

  // ---- tasks ----
  const SEED = [
    'Run the bot’s neural training overnight (keep the PC awake)',
    'Chem Olympiad: one USNCO practice quiz',
    'Download the site again on my phone for offline',
    'Battlecode bot: run another improve-and-test loop',
    'Ask for the AP Lang spring calendar',
  ];
  let tasks = load('dash-tasks', null);
  if (!Array.isArray(tasks) && !P.isOwner) tasks = [{ id: 'hello', text: 'Make this yours: edit My apps and add a task', due: '', done: false }];
  if (!Array.isArray(tasks)) { tasks = SEED.map((text, i) => ({ id: 'seed' + i, text, due: '', done: false })); const t = ahead.find(a => exam.test(a.item)); if (t) tasks.unshift({ id: 'seed-test', text: `Study for ${t.c}: ${t.item}`, due: t.k, done: false }); }
  if (P.isOwner && load('dash-tasks-v', 1) < 2) { tasks = tasks.filter(t => t.id !== 'seed3' || !/district/.test(t.text)); if (!tasks.some(t => /battlecode/i.test(t.text))) tasks.push({ id: 'seed-bc', text: 'Battlecode bot: run another improve-and-test loop', due: '', done: false }); save('dash-tasks-v', 2); save('dash-tasks', tasks); }
  const taskList = $('task-list'), taskForm = $('task-form'), taskCount = $('task-count');
  const commit = () => { save('dash-tasks', tasks); drawTasks(); drawStats(); drawMini(); window.dispatchEvent(new Event('tasks-changed')); };
  const addTask = (text, due = '') => { tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: text.slice(0, 140), due, done: false }); commit(); };
  function drawTasks() {
    const order = [...tasks].sort((a, b) => a.done - b.done || (a.due || '9').localeCompare(b.due || '9'));
    taskList.replaceChildren(...order.map(t => {
      const li = el('li', 'task' + (t.done ? ' task-done' : '')), label = el('label'), box = el('input'), x = el('button', 'task-x', '×');
      box.type = 'checkbox'; box.checked = t.done; box.addEventListener('change', () => { t.done = box.checked; commit(); });
      label.append(box, el('span', 'task-text', t.text)); li.append(label);
      if (t.due) { const n = daysTo(t.due); li.append(el('span', 'task-due' + (!t.done && n < 0 ? ' late' : !t.done && n <= 1 ? ' soon' : ''), n >= -30 && n <= 1 ? when(n) : pretty(parse(t.due)))); }
      x.type = 'button'; x.setAttribute('aria-label', 'Delete task: ' + t.text); x.addEventListener('click', () => { tasks = tasks.filter(o => o !== t); commit(); });
      li.append(x); return li;
    }));
    if (!tasks.length) taskList.append(el('li', 'muted task-empty', 'Nothing to do. Add something below.'));
    taskCount.textContent = tasks.length ? `${tasks.filter(t => !t.done).length} left` : '';
    $('task-clear').hidden = !tasks.some(t => t.done);
  }
  taskForm.addEventListener('submit', event => { event.preventDefault(); const text = $('task-text').value.trim(); if (!text) return; addTask(text, $('task-due').value || ''); taskForm.reset(); $('task-text').focus(); });
  $('task-clear').addEventListener('click', () => { tasks = tasks.filter(t => !t.done); commit(); });

  // ---- today ----
  const today = $('dash-today'), upcoming = $('dash-upcoming');
  const target = dates.find(k => k >= todayKey);
  if (cal) {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate()); base.setDate(base.getDate() - ((base.getDay() + 6) % 7) + (base.getDay() === 6 || base.getDay() === 0 ? 7 : 0));
    const drawWeek = () => {
      const due = {}; for (const t of tasks) if (t.due && !t.done) (due[t.due] ||= []).push(t.text);
      $('dash-today-title').textContent = key(base) > todayKey ? 'Next week' : 'This week';
      today.replaceChildren(...[0, 1, 2, 3, 4].map(i => {
        const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i), k = key(d), day = cal.days[k] || {}, items = Object.values(day).flat();
        const col = el('div', 'week-day' + (k === todayKey ? ' week-today' : k < todayKey ? ' week-past' : '') + (items.length && items.every(x => off.test(x)) ? ' week-off' : ''));
        const head = el('button', 'week-head'); head.type = 'button'; head.append(el('span', 'week-name', names[d.getDay()]), el('span', 'week-num', String(d.getDate()))); if (k === todayKey) head.append(el('span', 'week-tag', 'today'));
        head.setAttribute('aria-label', 'Open ' + d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + ' in the calendar'); head.addEventListener('click', () => goCalendar(k)); col.append(head);
        for (const c of cal.classes) {
          if (!day[c]) continue;
          const block = el('div', 'cal-class'), list = el('ul'); block.append(el('p', 'cal-class-name cal-' + slug(c), c));
          for (const item of day[c]) list.append(el('li', important.test(item) && !off.test(item) ? 'cal-important' : '', item));
          block.append(list); col.append(block);
        }
        for (const t of due[k] || []) col.append(el('p', 'cal-chip cal-chip-task', t));
        if (col.children.length === 1) col.append(el('p', 'cal-empty', 'Nothing listed'));
        return col;
      }));
    };
    drawWeek(); window.addEventListener('tasks-changed', drawWeek);
    // ---- coming up, each with a button that turns it into a task ----
    const soon = ahead.slice(0, 7);
    for (const a of soon) {
      const li = el('li'), plus = el('button', 'up-add', '+'); plus.type = 'button'; plus.title = 'Add to my tasks'; plus.setAttribute('aria-label', `Add to my tasks: ${a.c} ${a.item}`);
      plus.addEventListener('click', () => { addTask(`${a.c}: ${a.item}`, a.k); plus.textContent = '✓'; plus.disabled = true; });
      const text = el('span', 'up-text'); text.append(el('span', 'cal-up-date', pretty(parse(a.k))), el('span', 'cal-class-name cal-' + slug(a.c), a.c), document.createTextNode(' ' + a.item));
      li.append(text, plus); upcoming.append(li);
    }
    if (!soon.length) upcoming.append(el('li', 'muted', 'Nothing coming up.'));
  }

  // ---- hero numbers ----
  function drawStats() {
    const box = $('dash-stats'); if (!box) return; const stats = [];
    const t = ahead.find(a => exam.test(a.item)); if (t) stats.push([String(daysTo(t.k)), daysTo(t.k) === 1 ? 'day to next test' : 'days to next test', `${t.c}: ${t.item}`]);
    stats.push([String(tasks.filter(x => !x.done).length), 'tasks left', '']);
    if (dates.length && dates[dates.length - 1] >= todayKey) { const left = dates.filter(k => k >= todayKey && !Object.values(cal.days[k]).flat().every(x => off.test(x))).length; stats.push([String(left), 'school days left', 'this semester']); }
    box.replaceChildren(...stats.map(([n, label, sub]) => { const s = el('div', 'stat'); s.append(el('strong', '', n), el('span', '', label)); if (sub) s.title = sub; return s; }));
  }

  // ---- mini month ----
  const mini = $('dash-mini'); let miniMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  function drawMini() {
    if (!mini) return;
    $('mini-title').textContent = miniMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const due = new Set(tasks.filter(t => t.due && !t.done).map(t => t.due));
    mini.replaceChildren(...['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(n => el('span', 'mini-head', n)));
    const start = new Date(miniMonth); start.setDate(1 - ((start.getDay() + 6) % 7));
    const end = new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 0);
    for (let d = start; d <= end || d.getDay() !== 1; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      const k = key(d), day = cal?.days[k] || {}, b = el('button', 'mini-day', String(d.getDate())); b.type = 'button';
      if (d.getMonth() !== miniMonth.getMonth()) b.classList.add('mini-out');
      if (k === todayKey) b.classList.add('mini-today');
      const items = Object.values(day).flat();
      if (items.length && items.every(x => off.test(x))) b.classList.add('mini-off');
      else if (items.some(x => exam.test(x) && !off.test(x))) b.classList.add('mini-test');
      else if (items.some(x => important.test(x) && !off.test(x))) b.classList.add('mini-due');
      if (due.has(k)) b.classList.add('mini-task');
      b.setAttribute('aria-label', d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));
      b.addEventListener('click', () => goCalendar(k)); mini.append(b);
    }
  }
  $('mini-prev')?.addEventListener('click', () => { miniMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1, 1); drawMini(); });
  $('mini-next')?.addEventListener('click', () => { miniMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 1); drawMini(); });

  // ---- countdowns: the next tests, then the end of the semester ----
  const counts = $('dash-counts');
  if (counts) {
    const seen = new Set(), list = [];
    for (const a of ahead) { if (!exam.test(a.item) || seen.has(a.k + a.c) || list.length >= 4) continue; seen.add(a.k + a.c); list.push([a.k, a.item, a.c]); }
    if (dates.length && dates[dates.length - 1] >= todayKey) list.push([dates[dates.length - 1], 'Last day before winter break', '']);
    counts.replaceChildren(...list.map(([k, name, c]) => {
      const li = el('li', 'count'), n = daysTo(k), text = el('span', 'count-text'), num = el('span', 'count-num');
      num.append(el('strong', 'count-n', String(n)), el('span', 'count-unit', n === 1 ? 'day' : 'days'));
      text.append(el('span', 'count-name', name)); const sub = el('span', 'count-sub'); if (c) sub.append(el('span', 'cal-class-name cal-' + slug(c), c)); sub.append(document.createTextNode(' ' + pretty(parse(k)))); text.append(sub);
      li.append(num, text); li.addEventListener('click', () => goCalendar(k)); return li;
    }));
    if (!list.length) counts.append(el('li', 'muted', 'No tests listed.'));
  }

  // ---- focus timer: editable focus and break lengths, optional auto-switch, a label for what you're doing ----
  const clock = $('timer-clock'), ring = $('timer-ring'), go = $('timer-go');
  if (clock) {
    const cfg = Object.assign({ focus: 25, rest: 5, auto: true, what: '' }, load('dash-timer', {}));
    const tally = load('dash-focus-tally', {}), baseTitle = document.title;
    const fIn = $('timer-focus'), rIn = $('timer-rest'), auto = $('timer-auto'), what = $('timer-what'), modes = $('timer-modes'), presets = $('timer-presets');
    let mode = 'focus', total = cfg.focus * 60, left = total, endAt = 0, tick = null;
    const clampMin = (v, max) => Math.min(max, Math.max(1, Math.round(+v) || 1));
    const keep = () => save('dash-timer', cfg);
    const show = () => {
      clock.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      ring.style.setProperty('--p', String(1 - left / total)); ring.classList.toggle('is-rest', mode === 'rest'); ring.classList.toggle('is-running', !!tick);
      go.textContent = tick ? 'Pause' : left < total && left > 0 ? 'Resume' : 'Start';
      $('timer-label').textContent = mode === 'rest' ? 'Break' : cfg.what.trim() || 'Focus';
      for (const b of modes.children) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
      for (const b of presets.children) b.setAttribute('aria-pressed', String(+b.dataset.min === cfg.focus));
      const n = tally[todayKey] || 0, mins = tally[todayKey + 'm'] || 0;
      $('timer-dots').replaceChildren(...Array.from({ length: Math.max(4, Math.min(n, 12)) }, (_, i) => el('span', 'dot' + (i < n ? ' on' : ''))));
      $('timer-tally').textContent = n ? `${n} ${n === 1 ? 'session' : 'sessions'} · ${mins} min focused today` : 'No sessions yet today';
      document.title = tick ? `${clock.textContent} ${mode === 'rest' ? 'break' : 'focus'} · ${baseTitle}` : baseTitle;
    };
    const stop = () => { clearInterval(tick); tick = null; };
    const beep = () => { try { const a = new (window.AudioContext || window.webkitAudioContext)(); [660, 880].forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = f; const t = a.currentTime + i * .28; g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + .5); o.start(t); o.stop(t + .5); }); } catch {} };
    const setMode = m => { stop(); mode = m; total = left = (m === 'rest' ? cfg.rest : cfg.focus) * 60; show(); };
    const start = () => {
      if (left <= 0) left = total;
      endAt = Date.now() + left * 1000;
      tick = setInterval(() => {
        left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        if (left === 0) {
          stop(); beep(); const was = mode;
          if (was === 'focus') { tally[todayKey] = (tally[todayKey] || 0) + 1; tally[todayKey + 'm'] = (tally[todayKey + 'm'] || 0) + Math.round(total / 60); save('dash-focus-tally', { [todayKey]: tally[todayKey], [todayKey + 'm']: tally[todayKey + 'm'] }); }
          setMode(was === 'focus' ? 'rest' : 'focus'); if (cfg.auto) start(); return;
        }
        show();
      }, 250); show();
    };
    fIn.value = cfg.focus; rIn.value = cfg.rest; auto.checked = cfg.auto; what.value = cfg.what;
    fIn.addEventListener('change', () => { cfg.focus = clampMin(fIn.value, 180); fIn.value = cfg.focus; keep(); if (mode === 'focus') setMode('focus'); else show(); });
    rIn.addEventListener('change', () => { cfg.rest = clampMin(rIn.value, 60); rIn.value = cfg.rest; keep(); if (mode === 'rest') setMode('rest'); });
    auto.addEventListener('change', () => { cfg.auto = auto.checked; keep(); });
    what.addEventListener('input', () => { cfg.what = what.value.slice(0, 60); keep(); show(); });
    for (const b of modes.children) b.addEventListener('click', () => setMode(b.dataset.mode));
    for (const b of presets.children) b.addEventListener('click', () => { cfg.focus = +b.dataset.min; fIn.value = cfg.focus; keep(); setMode('focus'); });
    go.addEventListener('click', () => { if (tick) { stop(); show(); } else start(); });
    $('timer-reset').addEventListener('click', () => { stop(); left = total; show(); });
    $('timer-plus').addEventListener('click', () => { left += 300; total = Math.max(total, left); if (tick) endAt += 300000; show(); });
    $('timer-skip').addEventListener('click', () => setMode(mode === 'focus' ? 'rest' : 'focus'));
    show();
  }

  // ---- grades: typed in by hand (HAC has no way for a public site to read them) ----
  const gradeList = $('grade-list');
  if (gradeList) {
    let grades = load('dash-grades', null); if (!Array.isArray(grades)) grades = P.isOwner ? [['AP Chem', ''], ['AP Lang', ''], ['AP World', '']] : [['', '']];
    const letter = n => n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : 'F';
    const sum = () => { const ns = grades.map(g => parseFloat(g[1])).filter(n => isFinite(n)); $('grade-avg').textContent = ns.length ? `avg ${(ns.reduce((a, b) => a + b, 0) / ns.length).toFixed(1)}` : ''; };
    const drawGrades = () => {
      gradeList.replaceChildren(...grades.map(g => {
        const li = el('li', 'grade'), name = el('input'), num = el('input'), tag = el('span', 'grade-tag'), x = el('button', 'task-x', '×');
        name.type = 'text'; name.value = g[0]; name.placeholder = 'Class'; name.maxLength = 30; name.setAttribute('aria-label', 'Class name');
        num.type = 'number'; num.value = g[1]; num.placeholder = '–'; num.min = 0; num.max = 120; num.step = 'any'; num.inputMode = 'decimal'; num.setAttribute('aria-label', 'Grade for ' + (g[0] || 'class'));
        const paint = () => { const n = parseFloat(num.value); tag.textContent = isFinite(n) ? letter(n) : ''; tag.className = 'grade-tag' + (isFinite(n) ? ' g-' + letter(n) : ''); };
        name.addEventListener('input', () => { g[0] = name.value; save('dash-grades', grades); });
        num.addEventListener('input', () => { g[1] = num.value; save('dash-grades', grades); paint(); sum(); });
        x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + (g[0] || 'class')); x.addEventListener('click', () => { grades = grades.filter(o => o !== g); save('dash-grades', grades); drawGrades(); });
        paint(); li.append(name, num, tag, x); return li;
      })); sum();
    };
    $('grade-add').addEventListener('click', () => { grades.push(['', '']); save('dash-grades', grades); drawGrades(); gradeList.lastChild?.querySelector('input')?.focus(); });
    drawGrades();
  }

  // ---- scratch pad ----
  const pad = $('dash-notes');
  if (pad) { pad.value = load('dash-notes', ''); let t; pad.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => save('dash-notes', pad.value), 300); }); }

  // ---- today's focus: one Chem Olympiad section a day, in rotation ----
  const notes = window.STUDY_NOTES || {}, sections = Object.keys(notes), focus = $('dash-focus');
  if (sections.length && focus) {
    const day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000), name = sections[day % sections.length];
    focus.append(el('p', 'focus-name', name)); const list = el('ul', 'focus-list');
    for (const idea of notes[name].slice(0, 4)) list.append(el('li', '', idea));
    const start = el('a', 'button primary', 'Practice it'); start.href = (window.STUDY_SOURCES?.chem?.[0] || [])[1] || '#study'; start.target = '_blank'; start.rel = 'noopener';
    const more = el('a', '', 'All key ideas'); more.href = '#study'; const actions = el('p', 'focus-actions'); actions.append(start, more); focus.append(list, actions);
  }

  drawTasks(); drawStats(); drawMini();
})();
