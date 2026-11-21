// Draws a position in the real Pokémon Showdown battle screen (the pinned client's renderer),
// offline, with the site's static sprites and no sound. Used by Damage guess and Puzzles.
(() => {
  if (!window.Dex || !window.Battle) return;
  Dex.resourcePrefix = '/'; Dex.fxPrefix = '/fx/';
  const nativePrefs = Dex.prefs.bind(Dex);
  Dex.prefs = key => ['bwgfx', 'nogif'].includes(key) ? true : key === 'noanim' ? false : nativePrefs(key);
  const getSpriteData = Dex.getSpriteData.bind(Dex);
  Dex.getSpriteData = function (...args) {
    const data = getSpriteData(...args), fallback = window.OfflineResourceFallbacks || {};
    if (Object.hasOwn(fallback, data.url)) Object.assign(data, { url: fallback[data.url], w: 96, h: 96, pixelated: true });
    data.cryurl = '';
    return data;
  };
  const getTypeIcon = Dex.getTypeIcon.bind(Dex);
  Dex.getTypeIcon = (...args) => getTypeIcon(...args).replace(/%3f%3f%3f\.png/ig, 'unknown.png');
  try { window.Storage?.prefs?.('mute', true); } catch {}
  if (window.BattleSound) { window.BattleSound.setMute(true); window.BattleSound.getSound = () => undefined; }

  // Creates a battle view showing `lines` (a public Showdown protocol log) at its last turn.
  window.ShowdownScene = {
    show(frame, log, lines) {
      frame.replaceChildren(); log.replaceChildren();
      const battle = new Battle({ $frame: $(frame), $logFrame: $(log), id: 'scene', log: lines.slice(), paused: true, autoresize: false });
      // Scale the fixed 640x360 screen to whatever width its box has (phones included).
      const box = frame.parentElement, fit = () => { const k = Math.min(1, (box.clientWidth || 640) / 640); frame.style.transform = `scale(${k})`; frame.style.transformOrigin = 'top left'; box.style.height = Math.ceil(360 * k) + 'px'; };
      fit(); if (!frame._fit) { frame._fit = fit; addEventListener('resize', () => frame._fit()); } else frame._fit = fit;
      battle.seekTurn(Infinity, true);
      return battle;
    },
    // Appends protocol lines and plays them with animations.
    play(battle, lines, done) {
      battle.play();
      for (const l of lines) battle.add(l);
      if (done) { const t = setInterval(() => { if (battle.atQueueEnd) { clearInterval(t); done(); } }, 200); }
    },
  };
})();
