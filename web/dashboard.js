// Home dashboard: apps, today's classes, tasks, what's coming up, a mini calendar,
// countdowns, a focus timer, the day's study focus and a scratch pad.
// Everything personal (apps, tasks, notes) is saved only in this browser.
(() => {
  const home = document.getElementById('home'); if (!home) return;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const load = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const now = new Date(), hour = now.getHours();
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayKey = key(now), names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysTo = k => Math.round((parse(k) - parse(todayKey)) / 86400000);
  const pretty = d => `${names[d.getDay()]} ${d.toLocaleDateString(undefined, { month: 'short' })} ${d.getDate()}`;
  const when = n => n === 0 ? 'today' : n === 1 ? 'tomorrow' : n < 0 ? `${-n}d late` : `in ${n} days`;
  $('dash-greeting').textContent = hour < 5 ? 'Up late.' : hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';
  $('dash-date').textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  // ---- apps ----
  const DEFAULT_LINKS = [['Schoology', 'https://app.schoology.com/login'], ['ClassLink', 'https://launchpad.classlink.com/'], ['Claude', 'https://claude.ai/'], ['ChatGPT', 'https://chatgpt.com/'], ['Aniko', 'https://www.aniko.ai/'], ['AMC Trivial', 'https://amctrivial.com/'], ['USNCO quizzes', 'https://usnco-quizzes.web.app/'], ['Desmos', 'https://www.desmos.com/calculator'], ['Showdown', 'https://play.pokemonshowdown.com/'], ['GitHub', 'https://github.com/']];
  const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; } };
  let links = load('dash-links-2', null); if (!Array.isArray(links) || !links.length) links = DEFAULT_LINKS;
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
  const cal = window.SCHOOL_CALENDAR;
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
    'Put my district’s Schoology and ClassLink links in My apps',
    'Ask for the AP Lang spring calendar',
  ];
  let tasks = load('dash-tasks', null);
  if (!Array.isArray(tasks)) { tasks = SEED.map((text, i) => ({ id: 'seed' + i, text, due: '', done: false })); const t = ahead.find(a => exam.test(a.item)); if (t) tasks.unshift({ id: 'seed-test', text: `Study for ${t.c}: ${t.item}`, due: t.k, done: false }); }
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
    if (!target) today.append(el('p', 'muted', 'Nothing more is listed in the class calendars.'));
    else {
      $('dash-today-title').textContent = target === todayKey ? 'Today' : 'Next school day · ' + pretty(parse(target));
      for (const c of cal.classes) {
        const items = cal.days[target][c]; if (!items) continue;
        const block = el('div', 'cal-class'), list = el('ul'); block.append(el('p', 'cal-class-name cal-' + slug(c), c));
        for (const item of items) list.append(el('li', important.test(item) && !off.test(item) ? 'cal-important' : '', item));
        block.append(list); today.append(block);
      }
    }
    // ---- coming up, each with a button that turns it into a task ----
    const soon = ahead.filter(a => a.k !== target).slice(0, 7);
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
    if (!mini || !cal) return;
    $('mini-title').textContent = miniMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const due = new Set(tasks.filter(t => t.due && !t.done).map(t => t.due));
    mini.replaceChildren(...['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(n => el('span', 'mini-head', n)));
    const start = new Date(miniMonth); start.setDate(1 - ((start.getDay() + 6) % 7));
    const end = new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 0);
    for (let d = start; d <= end || d.getDay() !== 1; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      const k = key(d), day = cal.days[k] || {}, b = el('button', 'mini-day', String(d.getDate())); b.type = 'button';
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

  // ---- focus timer ----
  const clock = $('timer-clock'), ring = $('timer-ring'), go = $('timer-go'), modes = $('timer-modes');
  if (clock) {
    let total = 25 * 60, left = total, endAt = 0, tick = null;
    const tally = load('dash-focus-tally', {}), baseTitle = document.title;
    const show = () => {
      clock.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      ring.style.setProperty('--p', String(1 - left / total)); go.textContent = tick ? 'Pause' : left < total && left > 0 ? 'Resume' : 'Start';
      const n = tally[todayKey] || 0; $('timer-tally').textContent = `${n} focus ${n === 1 ? 'session' : 'sessions'} today`;
      document.title = tick ? `${clock.textContent} · ${baseTitle}` : baseTitle;
    };
    const stop = () => { clearInterval(tick); tick = null; };
    const beep = () => { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 660; g.gain.setValueAtTime(.15, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .9); o.start(); o.stop(a.currentTime + .9); } catch {} };
    const setMode = minutes => { stop(); total = left = minutes * 60; for (const b of modes.children) b.setAttribute('aria-pressed', String(+b.dataset.min === minutes)); show(); };
    for (const b of modes.children) b.addEventListener('click', () => setMode(+b.dataset.min));
    go.addEventListener('click', () => {
      if (tick) { stop(); return show(); }
      if (left <= 0) left = total;
      endAt = Date.now() + left * 1000;
      tick = setInterval(() => {
        left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        if (left === 0) { stop(); beep(); if (total >= 20 * 60) { tally[todayKey] = (tally[todayKey] || 0) + 1; save('dash-focus-tally', { [todayKey]: tally[todayKey] }); } }
        show();
      }, 250); show();
    });
    $('timer-reset').addEventListener('click', () => { stop(); left = total; show(); });
    show();
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
