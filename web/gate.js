// Passphrase gate for the whole site. Loaded first in every page's <head>.
// A static site can't really keep people out (the files are public); this just keeps
// casual visitors from using it. Only a salted SHA-256 of the passphrase is stored here.
(() => {
  const KEY = 'site-gate-v1', HASH = '0a5bb3a094f6f3d2c22baa9bd9be9099deba6d92a614705cc1db582505cb062a', SALT = 'samhamman7-site-gate:';
  let ok = false; try { ok = localStorage.getItem(KEY) === HASH; } catch {}
  if (ok) return;
  const root = document.documentElement; root.style.visibility = 'hidden';
  const hex = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const show = () => {
    if (document.getElementById('site-gate')) return;
    const box = document.createElement('div'); box.id = 'site-gate';
    box.innerHTML = '<form><h1>Locked</h1><p>Enter the passphrase to use this site.</p><input type="password" autocomplete="current-password" aria-label="Passphrase" required><button type="submit">Unlock</button><p class="err" role="alert"></p></form>';
    const st = document.createElement('style');
    st.textContent = '#site-gate{visibility:visible;position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#111214;color:#f1f2f4;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}#site-gate form{display:grid;gap:12px;width:min(340px,100%)}#site-gate h1{margin:0!important;font:800 26px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif!important;color:#f1f2f4!important}#site-gate p{font:inherit}#site-gate p{margin:0;color:#a3a8b3}#site-gate input{font:18px system-ui,sans-serif;padding:12px;border-radius:10px;border:1px solid #3a3d45;background:#1c1d21;color:#f1f2f4}#site-gate button{font:700 17px system-ui,sans-serif;padding:12px;border-radius:10px;border:0;background:#4f8df7;color:#fff;cursor:pointer}#site-gate .err{color:#ff7a6b;min-height:1.5em}';
    box.prepend(st); document.body.append(box);
    const form = box.querySelector('form'), input = box.querySelector('input'), err = box.querySelector('.err');
    input.focus();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let h = ''; try { h = await hex(SALT + input.value); } catch { err.textContent = 'This browser cannot check the passphrase here.'; return; }
      if (h !== HASH) { err.textContent = 'Wrong passphrase.'; input.select(); return; }
      try { localStorage.setItem(KEY, HASH); } catch {}
      box.remove(); root.style.visibility = '';
    });
  };
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
