// Damage guess in the Showdown battle screen: the Champions worker builds a real position from
// the bot's team pool and returns its public battle log plus all 16 damage rolls of one move.
(() => {
  const $id = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const KEY = 'damage-guess-stats', LABEL = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
  const NATURE = { Adamant: ['atk', 'spa'], Bold: ['def', 'atk'], Brave: ['atk', 'spe'], Calm: ['spd', 'atk'], Careful: ['spd', 'spa'], Gentle: ['spd', 'def'], Hasty: ['spe', 'def'], Impish: ['def', 'spa'], Jolly: ['spe', 'spa'], Lax: ['def', 'spd'], Lonely: ['atk', 'def'], Mild: ['spa', 'def'], Modest: ['spa', 'atk'], Naive: ['spe', 'spd'], Naughty: ['atk', 'spd'], Quiet: ['spa', 'spe'], Rash: ['spa', 'spd'], Relaxed: ['def', 'spe'], Sassy: ['spd', 'spe'], Timid: ['spe', 'atk'] };
  let stats = { played: 0, total: 0, streak: 0 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Number.isFinite(s.played)) stats = s; } catch {}
  const saveStats = () => { try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch {} };
  const showStats = () => { $id('dg-played').textContent = stats.played; $id('dg-avg').textContent = stats.played ? Math.round(stats.total / stats.played) : '–'; $id('dg-streak').textContent = stats.streak; };
  try { const c = localStorage.getItem('damage-guess-crit'); if (c !== null) $id('dg-crit').checked = c === '1'; } catch {}
  $id('dg-crit').addEventListener('change', () => { try { localStorage.setItem('damage-guess-crit', $id('dg-crit').checked ? '1' : '0'); } catch {} });

  let worker = null, q = null, locked = false, battle = null;
  const natureText = n => NATURE[n] ? `${n} (+${LABEL[NATURE[n][0]]}, −${LABEL[NATURE[n][1]]})` : (n || 'Neutral');
  const boostText = b => Object.entries(b || {}).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${LABEL[k] || k}`).join(', ');

  const chip = (text, cls = '') => el('span', 'chip ' + cls, text);
  function setCard(m, role, keys) {
    const box = el('div', 'set'); box.append(el('div', 'role', role), el('h3', '', m.species + (m.mega && !/-Mega/.test(m.species) ? ' (Mega)' : '')));
    const types = el('div', 'chips'); for (const t of m.types) types.append(chip(t, 'type t-' + t)); box.append(types);
    box.append(el('p', '', `${m.item || 'No item'} · ${m.ability}`), el('p', '', natureText(m.nature)));
    const kv = el('div', 'kv'); for (const k of keys) { const x = el('span'); x.append(el('b', '', String(m.stats[k])), document.createTextNode(' ' + LABEL[k])); kv.append(x); } box.append(kv);
    if (boostText(m.boosts)) box.append(el('p', '', 'Boosts: ' + boostText(m.boosts)));
    return box;
  }

  function render() {
    battle = window.ShowdownScene ? window.ShowdownScene.show($id('dg-frame'), $id('dg-log'), q.log, { maxScale: 1.6 }) : null;
    const physical = q.move.category === 'Physical';
    $id('dg-what').replaceChildren(document.createTextNode(`How much does ${q.attacker.species}'s `), el('span', 'mv', q.move.name), document.createTextNode(` do to ${q.defender.species}?`));
    const tags = $id('dg-tags'); tags.replaceChildren(chip(q.move.type, 'type t-' + q.move.type), chip(q.move.category), chip(q.move.basePower + ' BP'));
    if (q.move.spread) tags.append(chip('Spread: hits both foes (×0.75)'));
    if (q.attacker.mega) tags.append(chip('Mega Evolved'));
    const WX = { RainDance: 'Rain', SunnyDay: 'Sun', Snowscape: 'Snow', DesolateLand: 'Harsh sun', PrimordialSea: 'Heavy rain' }; if (q.field.weather) tags.append(chip(WX[q.field.weather] || q.field.weather)); if (q.field.terrain) tags.append(chip(q.field.terrain));
    for (const c of q.field.defenderSide || []) tags.append(chip('Defender: ' + c));
    $id('dg-critbanner').hidden = !q.crit; $id('dg-critflag').hidden = !q.crit;
    $id('dg-sets').replaceChildren(setCard(q.attacker, 'Attacker', [physical ? 'atk' : 'spa', 'spe']), setCard(q.defender, 'Defender', ['hp', physical ? 'def' : 'spd']));
    $id('dg-guess').hidden = false; $id('dg-result').hidden = true; locked = false; setGuess(50);
  }
  const guessText = v => v === 150 ? '150%+' : v + '%';
  for (const v of [10, 25, 33, 50, 66, 75, 100, 125, 150]) { const b = el('button', '', guessText(v)); b.type = 'button'; b.addEventListener('click', () => setGuess(v)); $id('dg-quick').append(b); }

  // Match the scoring domain: the last bucket means 150% or more.
  function setGuess(v) {
    const n = Number(v);
    v = Number.isFinite(n) ? Math.max(0, Math.min(150, Math.round(n))) : 0;
    $id('dg-range').value = v; $id('dg-num').value = v; $id('dg-out').textContent = guessText(v);
    $id('dg-range').setAttribute('aria-valuetext', guessText(v));
  }
  $id('dg-range').addEventListener('input', e => setGuess(e.target.value));
  $id('dg-num').addEventListener('input', e => setGuess(e.target.value));
  $id('dg-num').addEventListener('keydown', e => { if (e.key === 'Enter') lock(); });
  $id('dg-lock').addEventListener('click', () => lock());

  // The move as Showdown would show it, using the median damage roll.
  function revealLines() {
    const dmg = q.rolls[8], left = Math.max(0, q.hp - dmg), pct = Math.ceil(left / q.maxhp * 100);
    const lines = [`|move|${q.attackerIdent}|${q.move.name}|${q.defenderIdent}${q.move.spread ? '|[spread] ' + [q.defenderIdent, q.otherFoe].filter(Boolean).map(x => x.slice(0, 3)).join(',') : ''}`];
    if (q.crit) lines.push(`|-crit|${q.defenderIdent}`);
    if (q.effectiveness > 1) lines.push(`|-supereffective|${q.defenderIdent}`); else if (q.effectiveness > 0 && q.effectiveness < 1) lines.push(`|-resisted|${q.defenderIdent}`);
    lines.push(`|-damage|${q.defenderIdent}|${left ? pct + '/100' : '0 fnt'}`);
    if (!left) lines.push(`|faint|${q.defenderIdent}`);
    lines.push('|');
    return lines;
  }

  function lock() {
    if (!q || locked) return; locked = true;
    setGuess($id('dg-num').value);
    const guess = Number($id('dg-num').value), min = Math.min(150, q.min), max = Math.min(150, q.max);
    const off = guess < min ? min - guess : guess > max ? guess - max : 0, score = Math.max(0, Math.round(100 - 5 * off));
    stats.played++; stats.total += score; stats.streak = off === 0 ? stats.streak + 1 : 0; saveStats(); showStats();
    $id('dg-guess').hidden = true;
    if (battle) window.ShowdownScene.play(battle, revealLines());
    const box = $id('dg-result'); box.replaceChildren(); box.hidden = false; box.className = 'result ' + (off === 0 ? 'good' : off > 10 ? 'bad' : 'ok');
    box.append(el('h2', '', off === 0 ? `Inside the range! +${score}` : `${Math.round(off * 10) / 10}% off · +${score}`));
    box.append(el('div', 'range', `${q.min}% – ${q.max}%`), el('p', '', `${q.move.name}${q.crit ? ' (critical hit)' : ''}: ${q.rolls[0]}–${q.rolls[15]} of ${q.maxhp} HP. You guessed ${guessText(guess)}.`));
    if (q.max >= 150) box.append(el('p', 'small', 'For scoring, damage above 150% counts as 150%. The full calculated range is shown above.'));
    const top = Math.max(110, Math.ceil((Math.max(q.max, guess) + 10) / 10) * 10), pos = v => `${Math.min(100, v / top * 100)}%`;
    const bar = el('div', 'bar'), r = el('div', 'r'), ko = el('div', 'ko'), y = el('div', 'y');
    r.style.left = pos(q.min); r.style.width = `calc(${pos(q.max)} - ${pos(q.min)} + 2px)`; ko.style.left = pos(100); y.style.left = pos(guess); bar.append(r, ko, y); box.append(bar);
    box.append(el('p', 'small', 'Blue: the real range · red line: 100% · dark line: your guess.' + (guess === 150 ? ' The dark line marks the start of your 150%+ bucket.' : '')));
    box.append(el('p', '', q.koRolls === 16 ? 'Guaranteed KO from full HP.' : q.koRolls ? `KOs from full HP on ${q.koRolls}/16 rolls.` : `${Math.ceil(100 / q.max)}HKO or worse from full HP.`));
    box.append(el('p', 'small rolls', 'Rolls (HP): ' + q.rolls.join(', ')));
    const next = el('button', 'btn go', 'Next question'); next.type = 'button'; next.addEventListener('click', ask); box.append(next); next.focus({ preventScroll: true });
  }

  function ask() { if (!worker) return; $id('dg-guess').hidden = true; $id('dg-result').hidden = true; $id('dg-what').textContent = 'Setting up…'; $id('dg-tags').replaceChildren(); $id('dg-critbanner').hidden = true; $id('dg-critflag').hidden = true; worker.postMessage({ type: 'calc', seed: crypto.getRandomValues(new Uint32Array(1))[0] || 1, crit: $id('dg-crit').checked }); }

  showStats();
  try {
    worker = new Worker(new URL('./champions.worker.js', location.href), { type: 'module' });
    worker.onerror = e => { $id('dg-what').textContent = 'The simulator could not load: ' + (e.message || 'unknown error') + '.'; };
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') ask();
      else if (data.type === 'calc') { q = data.question; try { render(); } catch (e) { $id('dg-what').textContent = 'Could not draw the battle: ' + e.message; } }
      else if (data.type === 'error') $id('dg-what').textContent = 'Something went wrong: ' + data.message + '. Try reloading.';
    };
  } catch { $id('dg-what').textContent = 'This browser cannot run the simulator here.'; }
  Object.defineProperty(window, 'damageGuess', { value: { question: () => q, lock, setGuess } });
})();
