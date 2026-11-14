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
