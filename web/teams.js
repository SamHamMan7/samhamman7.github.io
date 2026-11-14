// My teams: shows the teams saved in the Pokémon Showdown teambuilder on this site (same browser
// storage), lets you add one from pasted export text, and backs them up to a file.
(() => {
  const list = document.getElementById('team-list'); if (!list) return;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const KEY = 'showdown_teams', toID = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const read = () => { let raw = ''; try { raw = localStorage.getItem(KEY) || ''; } catch {} return raw.split('\n').filter(Boolean).map(line => { const bar = line.indexOf('|'), head = line.slice(0, bar), b = head.indexOf(']'); let format = b >= 0 ? head.slice(0, b) : '', name = b >= 0 ? head.slice(b + 1) : head, folder = ''; const slash = name.lastIndexOf('/'); if (slash >= 0) { folder = name.slice(0, slash); name = name.slice(slash + 1); } return { format, folder, name, packed: line.slice(bar + 1), line }; }); };
  const write = teams => { try { localStorage.setItem(KEY, teams.map(t => t.line).join('\n')); return true; } catch { return false; } };
  const species = packed => packed.split(']').map(set => { const f = set.split('|'); return f[1] || f[0]; }).filter(Boolean);
  const STATS = { hp: 0, atk: 1, def: 2, spa: 3, spd: 4, spe: 5 };

  // Showdown export text -> the packed form the teambuilder stores.
  function pack(text) {
    const sets = []; let cur = null;
    for (let line of text.replace(/\r/g, '').split('\n')) {
      line = line.trim();
      if (!line || line.startsWith('===')) { if (!line) cur = null; continue; }
      if (!cur) {
        cur = { name: '', species: '', item: '', ability: '', moves: [], nature: '', evs: ['', '', '', '', '', ''], ivs: ['', '', '', '', '', ''], gender: '', shiny: '', level: '', happiness: '', tera: '' }; sets.push(cur);
        let head = line; const at = head.lastIndexOf(' @ '); if (at >= 0) { cur.item = head.slice(at + 3).trim(); head = head.slice(0, at).trim(); }
        const g = head.match(/ \((M|F)\)$/); if (g) { cur.gender = g[1]; head = head.slice(0, -4).trim(); }
        const m = head.match(/^(.*) \(([^()]+)\)$/); if (m) { cur.name = m[1].trim(); cur.species = m[2].trim(); } else { cur.name = head; cur.species = head; }
        continue;
      }
      let m;
      if ((m = line.match(/^(?:Ability|Trait):\s*(.*)$/i))) cur.ability = m[1].trim();
      else if ((m = line.match(/^Level:\s*(\d+)/i))) cur.level = m[1] === '100' ? '' : m[1];
      else if (/^Shiny:\s*Yes/i.test(line)) cur.shiny = 'S';
      else if ((m = line.match(/^(?:Happiness|Friendship):\s*(\d+)/i))) cur.happiness = m[1] === '255' ? '' : m[1];
      else if ((m = line.match(/^Tera Type:\s*(.*)$/i))) cur.tera = m[1].trim();
      else if ((m = line.match(/^(EVs|IVs):\s*(.*)$/i))) { const into = /^E/i.test(m[1]) ? cur.evs : cur.ivs; for (const part of m[2].split('/')) { const p = part.trim().match(/^(\d+)\s*(\w+)/); if (p && STATS[p[2].toLowerCase()] !== undefined) into[STATS[p[2].toLowerCase()]] = p[1]; } }
      else if ((m = line.match(/^(\w+)\s+Nature/i))) cur.nature = m[1];
      else if (/^[-~]/.test(line)) { let mv = line.replace(/^[-~]\s*/, '').trim(); const hp = mv.match(/^Hidden Power \[?(\w+)\]?$/i); if (hp) mv = 'Hidden Power ' + hp[1]; if (mv) cur.moves.push(mv); }
    }
    const good = sets.filter(s => s.species && s.moves.length);
    if (!good.length) return null;
    return good.map(s => {
      const evs = s.evs.some(Boolean) ? s.evs.map(v => v === '0' ? '' : v).join(',') : '';
      const ivs = s.ivs.some(Boolean) ? s.ivs.map(v => v === '31' ? '' : v).join(',') : '';
      let out = [s.name, toID(s.name) === toID(s.species) ? '' : toID(s.species), toID(s.item), toID(s.ability), s.moves.map(toID).join(','), s.nature, evs, s.gender, ivs, s.shiny, s.level, s.happiness].join('|');
      if (s.tera) out += ',,,,,' + s.tera;
      return out;
    }).join(']');
  }

  const msg = $('team-msg'), say = t => { msg.textContent = t; };
  function draw() {
    const teams = read();
    $('team-count').textContent = teams.length ? `${teams.length} saved` : '';
    list.replaceChildren(...teams.map((t, i) => {
      const li = el('li', 'team'), main = el('div', 'team-main'), x = el('button', 'task-x', '×');
      main.append(el('strong', '', t.name || 'Untitled'), el('span', 'team-format', t.format || 'any format'), el('span', 'team-mons', species(t.packed).join(' · ')));
      x.type = 'button'; x.setAttribute('aria-label', 'Delete team ' + t.name);
      x.addEventListener('click', () => { if (x.dataset.sure !== '1') { x.dataset.sure = '1'; x.textContent = 'Delete?'; x.classList.add('sure'); return; } const all = read(); all.splice(i, 1); write(all); draw(); say('Team deleted.'); });
      li.append(main, x); return li;
    }));
    if (!teams.length) list.append(el('li', 'muted', 'No teams yet. Paste one below, or build one in the Teambuilder.'));
    $('team-backup').hidden = !teams.length;
  }
  $('team-form').addEventListener('submit', e => {
    e.preventDefault(); const name = $('team-name').value.trim() || 'Untitled', format = $('team-format').value, packed = pack($('team-paste').value);
    if (!packed) return say('That doesn’t look like a Showdown team. Paste the text from Import/Export.');
    const teams = read(); teams.push({ line: `${format}]${name.replace(/[|\]\n\/]/g, ' ')}|${packed}` });
    if (!write(teams)) return say('This browser wouldn’t save it.');
    e.target.reset(); draw(); say(`Saved “${name}”. It’s in the Teambuilder now.`);
  });
  $('team-backup').addEventListener('click', () => { const a = el('a'); a.href = URL.createObjectURL(new Blob([read().map(t => t.line).join('\n')], { type: 'text/plain' })); a.download = 'my-showdown-teams.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
  $('team-restore').addEventListener('click', () => $('team-file').click());
  $('team-file').addEventListener('change', async () => {
    const file = $('team-file').files[0]; if (!file) return; const text = await file.text(); $('team-file').value = '';
    const lines = text.replace(/\r/g, '').split('\n').filter(l => /^[^|\n]*\|[^|]*\|/.test(l) && l.split('|').length >= 12);
    if (!lines.length) return say('That file isn’t a team backup from this site.');
    const teams = read(), have = new Set(teams.map(t => t.line)); let added = 0;
    for (const line of lines) if (!have.has(line)) { teams.push({ line }); have.add(line); added++; }
    write(teams); draw(); say(added ? `Restored ${added} ${added === 1 ? 'team' : 'teams'}.` : 'Those teams were already here.');
  });
  window.addEventListener('storage', e => { if (e.key === KEY) draw(); });
  window.addEventListener('hashchange', draw);
  // Rated play: the bot keeps a per-format rating in this browser; show it on the Games tab.
  const NAMES = { gen9championsvgc2026regmc: 'Champions VGC', gen9ou: 'OU', gen9randombattle: 'Random Battle', gen9randomdoublesbattle: 'Random Doubles' };
  const drawRatings = () => {
    const box = $('rating-list'); if (!box) return; let store = {}; try { store = JSON.parse(localStorage.getItem('offline-showdown-rating') || '{}') || {}; } catch {}
    const rows = Object.entries(store).filter(([, r]) => r && Number.isFinite(r.rating));
    box.replaceChildren(...rows.map(([f, r]) => { const li = el('li', 'rating'); li.append(el('strong', 'rating-n', String(r.rating)), el('span', 'rating-name', NAMES[f] || f), el('span', 'rating-sub', `${r.wins}W ${r.losses}L · peak ${r.peak || r.rating} · next: ${r.rating < 1125 ? 'Medium' : r.rating < 1375 ? 'Strong' : 'Very Strong'}`)); return li; }));
    if (!rows.length) box.append(el('li', 'muted', 'No rated games yet. Play the bot to get a rating.'));
  };
  window.addEventListener('storage', e => { if (e.key === 'offline-showdown-rating') drawRatings(); });
  window.addEventListener('hashchange', drawRatings); drawRatings();
  window.SiteTeams = { pack, read };
  draw();
})();
