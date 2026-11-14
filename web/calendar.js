// Combined class calendar: a month grid (or one detailed week), filterable by class,
// with the selected day's full detail beside it. Tasks with a due date show up too.
(() => {
  const data = window.SCHOOL_CALENDAR, root = document.getElementById('calendar');
  if (!data || !root) return;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const add = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  const monday = d => add(d, -((d.getDay() + 6) % 7));
  const dates = Object.keys(data.days).sort(), firstDay = parse(dates[0]), lastDay = parse(dates[dates.length - 1]);
  const todayKey = key(new Date());
  const important = /\b(tests?|quiz(zes)?|exams?|due|essays?|dbq|timed|final|presentations?|psat|sat day|act day)\b/i;
  const off = /holiday|no school|break\b/i;
  const slug = c => c.toLowerCase().replace(/[^a-z]+/g, '-');
  const short = d => d.toLocaleDateString(undefined, { month: 'short' });
  const clampDay = d => d < firstDay ? firstDay : d > lastDay ? lastDay : d;
  const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  let hidden = new Set(read('calendar-hidden', []));
  let view = read('calendar-view', 'month') === 'week' ? 'week' : 'month';
  let selected = clampDay(new Date());
  let cursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const tasksByDay = () => { const map = {}; for (const t of read((window.Profile?.key || (k => k))('dash-tasks'), []) || []) if (t && t.due && !t.done) (map[t.due] ||= []).push(t.text); return map; };

  const title = $('calendar-title'), grid = $('calendar-grid'), filters = $('calendar-filters'), upcoming = $('calendar-upcoming');
  const prev = $('calendar-prev'), next = $('calendar-next'), dayTitle = $('calendar-day-title'), dayBody = $('calendar-day-body');

  for (const c of data.classes) {
    const label = el('label', 'cal-filter'), box = el('input');
    box.type = 'checkbox'; box.checked = !hidden.has(c);
    box.addEventListener('change', () => { box.checked ? hidden.delete(c) : hidden.add(c); write('calendar-hidden', [...hidden]); render(); });
    label.append(box, el('span', 'cal-dot cal-' + slug(c)), document.createTextNode(c)); filters.append(label);
  }
  for (const b of $('calendar-view').children) b.addEventListener('click', () => { view = b.dataset.view; write('calendar-view', view); render(); });

  const isOff = day => { const all = data.classes.filter(c => day[c]); return all.length > 0 && all.every(c => day[c].every(x => off.test(x))); };
  function classBlocks(day, into) {
    for (const c of data.classes) {
      if (!day[c] || hidden.has(c)) continue;
      const block = el('div', 'cal-class'), list = el('ul'); block.append(el('p', 'cal-class-name cal-' + slug(c), c));
      for (const item of day[c]) list.append(el('li', important.test(item) && !off.test(item) ? 'cal-important' : '', item));
      block.append(list); into.append(block);
    }
  }
  function select(d) { selected = d; cursor = new Date(d.getFullYear(), d.getMonth(), 1); render(); }

  function renderMonth(tasks) {
    title.textContent = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    prev.disabled = cursor <= new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
    next.disabled = cursor >= new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);
    grid.className = 'cal-month';
    for (const [i, n] of WEEK.entries()) grid.append(el('div', 'cal-head' + (i > 4 ? ' cal-weekend' : ''), n));
    const start = monday(cursor), end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    for (let d = start; d <= end || d.getDay() !== 1; d = add(d, 1)) {
      const k = key(d), day = data.days[k] || {}, cell = el('button', 'cal-cell'); cell.type = 'button';
      if (d.getMonth() !== cursor.getMonth()) cell.classList.add('cal-out');
      if (d.getDay() === 0 || d.getDay() === 6) cell.classList.add('cal-weekend');
      if (k === todayKey) cell.classList.add('cal-is-today');
      if (k === key(selected)) cell.classList.add('cal-selected');
      if (isOff(day)) cell.classList.add('cal-off');
      cell.append(el('span', 'cal-num', String(d.getDate())));
      const chips = el('span', 'cal-chips');
      if (isOff(day)) chips.append(el('span', 'cal-chip cal-chip-off', Object.values(day)[0][0]));
      else for (const c of data.classes) {
        if (!day[c] || hidden.has(c)) continue;
        const big = day[c].find(x => important.test(x) && !off.test(x));
        chips.append(el('span', 'cal-chip cal-' + slug(c) + (big ? ' cal-chip-big' : ''), big || day[c][0]));
      }
      for (const t of tasks[k] || []) chips.append(el('span', 'cal-chip cal-chip-task', t));
      cell.append(chips);
      const label = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      cell.setAttribute('aria-label', label + (chips.children.length ? `, ${chips.children.length} entries` : ''));
      cell.addEventListener('click', () => select(d));
      grid.append(cell);
    }
  }
  function renderWeek(tasks) {
    const start = monday(selected), friday = add(start, 4);
    title.textContent = `${short(start)} ${start.getDate()} – ${short(friday) === short(start) ? '' : short(friday) + ' '}${friday.getDate()}, ${friday.getFullYear()}`;
    prev.disabled = start <= monday(firstDay); next.disabled = start >= monday(lastDay);
    grid.className = 'cal-grid';
    for (let i = 0; i < 5; i++) {
      const d = add(start, i), k = key(d), day = data.days[k] || {};
      const cell = el('section', 'cal-day' + (k === todayKey ? ' cal-is-today' : '') + (isOff(day) ? ' cal-off' : ''));
      const head = el('h3', 'cal-date'); head.append(el('span', 'cal-weekday', WEEK[i]), document.createTextNode(' ' + d.getDate()));
      if (k === todayKey) head.append(el('span', 'cal-today-tag', 'today'));
      cell.append(head); classBlocks(day, cell);
      for (const t of tasks[k] || []) cell.append(el('p', 'cal-chip cal-chip-task', t));
      if (cell.children.length === 1) cell.append(el('p', 'cal-empty', Object.keys(day).length ? 'Hidden by filter' : 'Nothing listed'));
      grid.append(cell);
    }
  }
  function renderDay(tasks) {
    const k = key(selected), day = data.days[k] || {};
    dayTitle.textContent = (k === todayKey ? 'Today · ' : '') + selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    dayBody.replaceChildren(); classBlocks(day, dayBody);
    if (tasks[k]) { const block = el('div', 'cal-class'), list = el('ul'); block.append(el('p', 'cal-class-name cal-task-name', 'My tasks')); for (const t of tasks[k]) list.append(el('li', '', t)); block.append(list); dayBody.append(block); }
    if (!dayBody.children.length) dayBody.append(el('p', 'cal-empty', Object.keys(day).length ? 'Hidden by filter.' : 'Nothing listed for this day.'));
  }
  function renderUpcoming() {
    upcoming.replaceChildren(); let count = 0;
    for (const k of dates) {
      if (k < todayKey || count >= 12) continue;
      for (const c of data.classes) for (const item of (!hidden.has(c) && data.days[k][c]) || []) {
        if (!important.test(item) || off.test(item) || count >= 12) continue;
        const d = parse(k), li = el('li');
        li.append(el('span', 'cal-up-date', `${WEEK[(d.getDay() + 6) % 7]} ${short(d)} ${d.getDate()}`), el('span', 'cal-class-name cal-' + slug(c), c), document.createTextNode(' ' + item));
        li.addEventListener('click', () => select(d)); upcoming.append(li); count++;
      }
    }
    if (!count) upcoming.append(el('li', 'muted', 'Nothing coming up in the listed calendars.'));
  }
  function render() {
    const tasks = tasksByDay(); grid.replaceChildren();
    for (const b of $('calendar-view').children) b.setAttribute('aria-pressed', String(b.dataset.view === view));
    prev.setAttribute('aria-label', 'Previous ' + view); next.setAttribute('aria-label', 'Next ' + view);
    view === 'month' ? renderMonth(tasks) : renderWeek(tasks);
    renderDay(tasks); renderUpcoming();
  }
  const step = n => {
    if (view === 'month') { const m = new Date(cursor.getFullYear(), cursor.getMonth() + n, 1); select(clampDay(key(m).slice(0, 7) === todayKey.slice(0, 7) ? new Date() : m)); }
    else select(clampDay(add(selected, 7 * n)));
  };
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  $('calendar-today').addEventListener('click', () => select(clampDay(new Date())));
  window.addEventListener('calendar-goto', e => { const d = parse(e.detail); if (!isNaN(d)) select(d); });
  window.addEventListener('tasks-changed', render);
  const range = c => { const [a, b] = data.coverage[c].map(parse); return `${c}: ${short(a)} ${a.getDate()} – ${short(b)} ${b.getDate()}`; };
  $('calendar-coverage').textContent = 'Listed so far — ' + data.classes.map(range).join(' · ') + '.';
  render();
})();
