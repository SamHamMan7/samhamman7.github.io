// Combined class calendar: one school week at a time, filterable by class.
(() => {
  const data = window.SCHOOL_CALENDAR, root = document.getElementById('calendar');
  if (!data || !root) return;
  const DAY = 86400000, names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const monday = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const w = x.getDay(); x.setDate(x.getDate() + (w === 0 ? 1 : w === 6 ? 2 : 1 - w)); return x; };
  const add = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dates = Object.keys(data.days).sort(), first = monday(parse(dates[0])), last = monday(parse(dates[dates.length - 1]));
  const today = new Date(), todayKey = key(today);
  const clamp = d => d < first ? first : d > last ? last : d;
  const important = /\b(tests?|quiz(zes)?|exams?|due|essays?|dbq|timed|final|presentations?|psat|sat day|act day)\b/i;
  const off = /holiday|no school|break\b/i;
  const slug = c => c.toLowerCase().replace(/[^a-z]+/g, '-');
  const month = d => d.toLocaleDateString(undefined, { month: 'short' });
  let week = clamp(monday(today));
  let hidden = new Set();
  try { hidden = new Set(JSON.parse(localStorage.getItem('calendar-hidden') || '[]')); } catch {}
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };

  const title = document.getElementById('calendar-week'), grid = document.getElementById('calendar-grid'), filters = document.getElementById('calendar-filters'), upcoming = document.getElementById('calendar-upcoming');
  const prev = document.getElementById('calendar-prev'), next = document.getElementById('calendar-next'), now = document.getElementById('calendar-today');

  for (const c of data.classes) {
    const label = el('label', 'cal-filter'), box = el('input');
    box.type = 'checkbox'; box.checked = !hidden.has(c);
    box.addEventListener('change', () => { box.checked ? hidden.delete(c) : hidden.add(c); try { localStorage.setItem('calendar-hidden', JSON.stringify([...hidden])); } catch {} render(); });
    label.append(box, el('span', 'cal-dot cal-' + slug(c)), document.createTextNode(c)); filters.append(label);
  }

  function render() {
    const friday = add(week, 4);
    title.textContent = `${month(week)} ${week.getDate()} – ${month(friday) === month(week) ? '' : month(friday) + ' '}${friday.getDate()}, ${friday.getFullYear()}`;
    prev.disabled = week <= first; next.disabled = week >= last;
    grid.replaceChildren();
    for (let i = 0; i < 5; i++) {
      const date = add(week, i), k = key(date), day = data.days[k] || {}, shown = data.classes.filter(c => day[c] && !hidden.has(c));
      const cell = el('section', 'cal-day' + (k === todayKey ? ' cal-is-today' : ''));
      const all = data.classes.filter(c => day[c]);
      if (all.length && all.every(c => day[c].every(x => off.test(x)))) cell.classList.add('cal-off');
      const head = el('h3', 'cal-date'); head.append(el('span', 'cal-weekday', names[i]), document.createTextNode(' ' + date.getDate()));
      if (k === todayKey) head.append(el('span', 'cal-today-tag', 'today'));
      cell.append(head);
      if (!shown.length) cell.append(el('p', 'cal-empty', all.length ? 'Hidden by filter' : 'Nothing listed'));
      for (const c of shown) {
        const block = el('div', 'cal-class'), list = el('ul');
        block.append(el('p', 'cal-class-name cal-' + slug(c), c));
        for (const item of day[c]) list.append(el('li', important.test(item) && !off.test(item) ? 'cal-important' : '', item));
        block.append(list); cell.append(block);
      }
      grid.append(cell);
    }
    upcoming.replaceChildren();
    const start = todayKey < dates[0] ? dates[0] : todayKey; let count = 0;
    for (const k of dates) {
      if (k < start || count >= 20) continue;
      for (const c of data.classes) for (const item of (!hidden.has(c) && data.days[k][c]) || []) {
        if (!important.test(item) || off.test(item) || count >= 20) continue;
        const d = parse(k), li = el('li');
        li.append(el('span', 'cal-up-date', `${names[d.getDay() - 1]} ${month(d)} ${d.getDate()}`), el('span', 'cal-class-name cal-' + slug(c), c), document.createTextNode(' ' + item));
        upcoming.append(li); count++;
      }
    }
    if (!count) upcoming.append(el('li', 'muted', 'Nothing coming up in the listed calendars.'));
  }
  prev.addEventListener('click', () => { week = clamp(add(week, -7)); render(); });
  next.addEventListener('click', () => { week = clamp(add(week, 7)); render(); });
  now.addEventListener('click', () => { week = clamp(monday(new Date())); render(); });
  const range = c => { const [a, b] = data.coverage[c].map(parse); return `${c}: ${month(a)} ${a.getDate()} – ${month(b)} ${b.getDate()}`; };
  document.getElementById('calendar-coverage').textContent = 'Listed so far — ' + data.classes.map(range).join(' · ') + '.';
  render();
})();
