// Study help: links to live practice sources, plus the key ideas for each Chem Olympiad section.
(() => {
  const notes = window.STUDY_NOTES, sources = window.STUDY_SOURCES, root = document.getElementById('study');
  if (!notes || !sources || !root) return;
  const $ = id => document.getElementById(id), el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  for (const [group, list] of Object.entries(sources)) {
    const box = $('sources-' + group); if (!box) continue;
    box.replaceChildren(...list.map(([name, url, blurb, icon, color]) => {
      const a = el('a', 'source'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
      const text = el('span', 'source-text'); text.append(el('strong', '', name), el('span', '', blurb)); a.append(window.SiteIcons.tile(name, icon, color, url), text); return a;
    }));
  }
  // Practice room: the sites that allow it load inside the page; one is picked per day and they can be shuffled.
  const EMBED = ['https://usnco-quizzes.web.app/', 'https://amctrivial.com/', 'https://chem.isodn.org/'];
  const rooms = Object.values(sources).flat().filter(s => EMBED.includes(s[1])).sort((a, b) => EMBED.indexOf(a[1]) - EMBED.indexOf(b[1]));
  const stage = $('room-stage'), poster = $('room-poster'), roomTabs = $('room-tabs');
  if (rooms.length && stage) {
    const d = new Date(), day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
    let room = rooms[day % 2 ? 0 : Math.min(1, rooms.length - 1)], frame = null;
    const pick = (r, start) => {
      room = r; for (const b of roomTabs.children) b.setAttribute('aria-pressed', String(b.textContent === r[0]));
      $('room-open').href = r[1]; $('room-name').textContent = r[0]; $('room-blurb').textContent = r[2]; $('room-icon').replaceChildren(window.SiteIcons.tile(r[0], r[3], r[4], r[1]));
      if (!start && !frame) return;
      if (navigator.onLine === false) { frame?.remove(); frame = null; poster.hidden = false; $('room-note').textContent = 'You’re offline. Practice sites need internet.'; return; }
      if (!frame) { frame = document.createElement('iframe'); frame.className = 'room-frame'; frame.loading = 'lazy'; frame.referrerPolicy = 'no-referrer'; frame.setAttribute('allow', 'clipboard-write; fullscreen'); stage.append(frame); }
      frame.title = r[0]; frame.src = r[1]; poster.hidden = true;
    };
    roomTabs.replaceChildren(...rooms.map(r => { const b = el('button', '', r[0]); b.type = 'button'; b.addEventListener('click', () => pick(r, true)); return b; }));
    $('room-start').addEventListener('click', () => pick(room, true));
    $('room-shuffle').addEventListener('click', () => { const others = rooms.filter(r => r !== room); pick(others[Math.floor(Math.random() * others.length)], true); });
    pick(room, false);
  }
  const sections = Object.keys(notes), tabs = $('study-sections'), list = $('study-topics'), title = $('study-section-name');
  let current = sections[0];
  try { const saved = localStorage.getItem('study-section'); if (notes[saved]) current = saved; } catch {}
  function show(name) {
    current = name; try { localStorage.setItem('study-section', name); } catch {}
    title.textContent = name; list.replaceChildren(...notes[name].map(t => el('li', '', t)));
    for (const b of tabs.children) b.setAttribute('aria-pressed', String(b.textContent === name));
  }
  tabs.replaceChildren(...sections.map(name => { const b = el('button', 'pill', name); b.type = 'button'; b.addEventListener('click', () => show(name)); return b; }));
  $('study-shuffle').addEventListener('click', () => { const others = sections.filter(s => s !== current); show(others[Math.floor(Math.random() * others.length)]); });
  show(current);
})();
