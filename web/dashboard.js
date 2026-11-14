// Home dashboard: today's classes, what's coming up, quick links and study progress.
// Everything personal (links, Discord server) is saved only in this browser.
(() => {
  const home = document.getElementById('home'); if (!home) return;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const load = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const now = new Date(), hour = now.getHours();
  $('dash-greeting').textContent = hour < 5 ? 'Up late.' : hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';
  $('dash-date').textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  // ---- quick links ----
  const DEFAULT_LINKS = [['Schoology', 'https://app.schoology.com/login'], ['ClassLink', 'https://launchpad.classlink.com/'], ['Claude', 'https://claude.ai/'], ['ChatGPT', 'https://chatgpt.com/'], ['Discord', 'https://discord.com/app'], ['Aniko', 'https://www.aniko.ai/']];
  const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; } };
  let links = load('dash-links', null); if (!Array.isArray(links) || !links.length) links = DEFAULT_LINKS;
  const bar = $('dash-links'), editor = $('dash-editor'), rows = $('dash-rows'), serverInput = $('dash-discord-id');
  function drawLinks() {
    bar.replaceChildren(...links.filter(([n, u]) => n && safeUrl(u)).map(([name, url]) => { const a = el('a', 'chip', name); a.href = safeUrl(url); a.target = '_blank'; a.rel = 'noopener'; return a; }));
  }
  function row(name = '', url = '') {
    const r = el('div', 'dash-row'), n = el('input'), u = el('input'), x = el('button', 'linkish', 'Remove');
    n.type = 'text'; n.placeholder = 'Name'; n.value = name; n.setAttribute('aria-label', 'Link name'); n.maxLength = 30;
    u.type = 'url'; u.placeholder = 'https://…'; u.value = url; u.setAttribute('aria-label', 'Link address');
    x.type = 'button'; x.addEventListener('click', () => r.remove()); r.append(n, u, x); return r;
  }
  $('dash-edit').addEventListener('click', () => {
    editor.hidden = !editor.hidden; if (editor.hidden) return;
    rows.replaceChildren(...links.map(([n, u]) => row(n, u))); serverInput.value = load('dash-discord', '') || '';
  });
  $('dash-add').addEventListener('click', () => rows.append(row()));
  $('dash-reset').addEventListener('click', () => { rows.replaceChildren(...DEFAULT_LINKS.map(([n, u]) => row(n, u))); });
  editor.addEventListener('submit', event => {
    event.preventDefault();
    const next = [...rows.children].map(r => { const [n, u] = r.querySelectorAll('input'); return [n.value.trim(), u.value.trim()]; }).filter(([n, u]) => n && safeUrl(u));
    links = next.length ? next : DEFAULT_LINKS; save('dash-links', links);
    const id = serverInput.value.trim(); save('dash-discord', /^\d{17,20}$/.test(id) ? id : '');
    editor.hidden = true; drawLinks(); drawDiscord();
  });
  drawLinks();

  // ---- today and coming up, from the class calendar ----
  const cal = window.SCHOOL_CALENDAR, names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const important = /\b(tests?|quiz(zes)?|exams?|due|essays?|dbq|timed|final|presentations?|psat|sat day|act day)\b/i, off = /holiday|no school|break\b/i;
  const slug = c => c.toLowerCase().replace(/[^a-z]+/g, '-');
  const pretty = d => `${names[d.getDay()]} ${d.toLocaleDateString(undefined, { month: 'short' })} ${d.getDate()}`;
  const today = $('dash-today'), upcoming = $('dash-upcoming');
  if (cal) {
    const dates = Object.keys(cal.days).sort(), todayKey = key(now), target = dates.find(k => k >= todayKey);
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
    let count = 0;
    for (const k of dates) {
      if (k <= (target || todayKey) && k === todayKey) continue;
      if (k < todayKey) continue;
      for (const c of cal.classes) for (const item of cal.days[k][c] || []) {
        if (count >= 6 || !important.test(item) || off.test(item) || k === target) continue;
        const li = el('li'); li.append(el('span', 'cal-up-date', pretty(parse(k))), el('span', 'cal-class-name cal-' + slug(c), c), document.createTextNode(' ' + item)); upcoming.append(li); count++;
      }
    }
    if (!count) upcoming.append(el('li', 'muted', 'Nothing coming up.'));
  }

  // ---- study progress ----
  const problems = window.STUDY_PROBLEMS || [], bars = $('dash-study');
  function drawStudy() {
    const solved = new Set(load('study-solved', []));
    bars.replaceChildren(...[...new Set(problems.map(p => p.subject))].map(section => {
      const all = problems.filter(p => p.subject === section), done = all.filter(p => solved.has(p.id)).length, r = el('div', 'dash-bar'), meter = el('progress');
      meter.max = all.length; meter.value = done; meter.setAttribute('aria-label', section + ' solved');
      r.append(el('span', 'dash-bar-name', section), meter, el('span', 'small muted', `${done}/${all.length}`)); return r;
    }));
  }
  drawStudy(); window.addEventListener('hashchange', drawStudy);

  // ---- Discord: the official server widget is the only part of Discord that can be embedded ----
  function drawDiscord() {
    const box = $('dash-discord'), id = load('dash-discord', ''); box.replaceChildren();
    if (/^\d{17,20}$/.test(id)) {
      const frame = el('iframe', 'dash-discord-frame'); frame.title = 'Discord server';
      frame.src = `https://discord.com/widget?id=${id}&theme=${matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}`;
      frame.setAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts'); frame.loading = 'lazy'; box.append(frame);
    } else {
      const p = el('p', 'small muted'); p.append('Discord itself can’t run inside another page, but a server’s widget can. Turn on the widget in Server Settings, then add the server ID under ');
      const b = el('button', 'linkish', 'Edit links'); b.type = 'button'; b.addEventListener('click', () => $('dash-edit').click()); p.append(b, ' to see who’s online here.');
      const a = el('a', 'chip', 'Open Discord'); a.href = 'https://discord.com/app'; a.target = '_blank'; a.rel = 'noopener'; box.append(a, p);
    }
  }
  drawDiscord();
})();
