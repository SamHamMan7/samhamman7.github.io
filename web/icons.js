// Small line icons drawn for this site, plus tiles for links. A link tile shows the site's own icon
// (loaded from the web when online) and falls back to a drawn glyph or letter offline.
window.SiteIcons = (() => {
  const P = {
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    chat: '<path d="M4 5h16v11h-9l-5 4v-4H4z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>',
    prompt: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7.5 9.5l3 2.5-3 2.5M13 15h3.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
    gamepad: '<path d="M7 8h10a5 5 0 0 1 5 5v0a3.5 3.5 0 0 1-6.3 2.1L15 14H9l-.7 1.1A3.5 3.5 0 0 1 2 13v0a5 5 0 0 1 5-5z"/><path d="M7 10.5v3M5.5 12h3M16 11.5h.01M18 13h.01"/>',
    sigma: '<path d="M18 6V4.5H6l6.5 7.5L6 19.5h12V18"/>',
    flask: '<path d="M9 3h6M10 3v6.5L5 18a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-8.5V3"/><path d="M7.5 15h9"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    atom: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.8"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 3h5M12 3v3"/>',
    note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4"/>',
    flag: '<path d="M6 21V4M6 5h11l-2 3.5 2 3.5H6"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 3.5M16 6h3a3 3 0 0 1-3 3.5M12 13v4M8.5 20h7M10 17h4"/>',
  };
  const svg = name => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
  // Known destinations get a fitting glyph and colour; anything else gets its first letter.
  const KNOWN = [[/schoology/i, 'book', '#2f6fd0'], [/classlink/i, 'grid', '#0f9d8a'], [/claude/i, 'chat', '#e0562b'], [/chatgpt|openai/i, 'prompt', '#1f9d63'], [/aniko|sat/i, 'target', '#d9891a'], [/desmos|math/i, 'sigma', '#7a4fd6'], [/calendar/i, 'calendar', '#c2410c']];
  const PALETTE = ['#2f6fd0', '#0f9d8a', '#e0562b', '#7a4fd6', '#d9891a', '#c23a6b', '#1f9d63'];
  const ICON_HOST = { 'app.schoology.com': 'schoology.com' };
  const logoUrl = host => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  function tile(name, icon, color, url) {
    const span = document.createElement('span'); span.className = 'tile-icon';
    let glyph = icon, c = color;
    if (!glyph) { const k = KNOWN.find(([re]) => re.test(name)); if (k) { glyph = k[1]; c = c || k[2]; } }
    if (!c) { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; c = PALETTE[h % PALETTE.length]; }
    span.style.setProperty('--c', c);
    if (glyph) span.innerHTML = svg(glyph); else { span.textContent = (name.trim()[0] || '?').toUpperCase(); span.classList.add('tile-letter'); }
    let host = null; try { host = new URL(url).hostname; } catch {}
    if (host && navigator.onLine !== false) {
      const tries = [ICON_HOST[host] || host]; const parts = host.split('.'); if (parts.length > 2 && !ICON_HOST[host]) tries.push(parts.slice(1).join('.'));
      const img = new Image(); img.alt = ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
      const next = () => { const h = tries.shift(); if (h) img.src = logoUrl(h); };
      img.onload = () => { if (img.naturalWidth < 32) return next(); span.replaceChildren(img); span.classList.remove('tile-letter'); span.classList.add('tile-logo'); };
      img.onerror = next; next();
    }
    return span;
  }
  // Fill in any <span data-icon="name"> placeholders in the page.
  for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = svg(el.dataset.icon);
  return { svg, tile };
})();
