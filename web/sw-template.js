const VERSION = '__VERSION__';
const CACHE = 'math-play-' + VERSION;
const CORE = ['/index.html', '/site.css', '/site.js', '/site-icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', '/offline-manifest.json'];
let manifestPromise, downloading;
const blobs = new Map();
async function manifest() {
  if (!manifestPromise) manifestPromise = (async () => {
    const cache = await caches.open(CACHE);
    const response = await cache.match('/offline-manifest.json');
    if (!response) throw new Error('Offline file list is missing. Reload while online.');
    return response.json();
  })();
  return manifestPromise;
}
async function ready() {
  const m = await manifest(), cache = await caches.open(CACHE);
  return (await Promise.all(m.packs.map(p => cache.match(p.url)))).every(Boolean);
}
async function broadcast(data) {
  for (const client of await self.clients.matchAll({includeUncontrolled:true,type:'window'})) client.postMessage(data);
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(CORE);
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
async function download() {
  const m = await manifest(), cache = await caches.open(CACHE);
  let completed = 0;
  for (const pack of m.packs) {
    if (await cache.match(pack.url)) { completed += pack.bytes; await broadcast({type:'download-progress',loaded:completed,total:m.totalBytes}); continue; }
    const response = await fetch(pack.url, {cache:'no-store'});
    if (!response.ok || !response.body) throw new Error('A game download failed.');
    const reader = response.body.getReader(), chunks = [];
    let count = 0, previous = 0;
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      count += value.length; chunks.push(value);
      if (Date.now() - previous > 180) { await broadcast({type:'download-progress',loaded:completed+count,total:m.totalBytes}); previous=Date.now(); }
    }
    if (count !== pack.bytes) throw new Error('The game download was incomplete.');
    const bytes = new Uint8Array(count); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    if (hash !== pack.sha256) throw new Error('A downloaded file could not be verified.');
    await cache.put(pack.url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));
    completed += count;
    await broadcast({type:'download-progress',loaded:completed,total:m.totalBytes});
  }
  if (!await ready()) throw new Error('Your browser did not keep all the files. Check available storage.');
  // Remove only caches owned by this website, after a complete replacement exists.
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('math-play-')&&k!==CACHE).map(k=>caches.delete(k)));
  await broadcast({type:'download-complete'});
}
self.addEventListener('message', event => {
  if (event.data?.type === 'status') event.waitUntil(ready().then(isReady => event.ports[0]?.postMessage({ready:isReady,downloading:!!downloading})).catch(e=>event.ports[0]?.postMessage({error:e.message})));
  if (event.data?.type === 'download') {
    if (!downloading) downloading = download().catch(e=>broadcast({type:'download-error',error:e.name==='QuotaExceededError'?'There is not enough browser storage.':e.message})).finally(()=>{downloading=null;});
    event.waitUntil(downloading);
  }
});
async function fromPack(path) {
  const m = await manifest(), entry = m.files[path];
  if (!entry) return;
  const pack = m.packs[entry.pack], cache = await caches.open(CACHE);
  if (!blobs.has(pack.url)) {
    const response = await cache.match(pack.url); if (!response) return;
    if (blobs.size >= 2) blobs.delete(blobs.keys().next().value);
    blobs.set(pack.url, await response.blob());
  }
  return new Response(blobs.get(pack.url).slice(entry.offset,entry.offset+entry.bytes,entry.type), {headers:{'Content-Type':entry.type,'Content-Length':String(entry.bytes)}});
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const path = url.pathname === '/' ? '/index.html' : decodeURI(url.pathname);
    const cached = await cache.match(path); if (cached) return cached;
    const packed = await fromPack(path); if (packed) return packed;
    try {
      const response = await fetch(event.request);
      // Source archives are intentionally excluded from the offline game download.
      if (response.ok && !path.startsWith('/downloads/') && !path.startsWith('/offline-packs/')) {
        const clone = response.clone(); event.waitUntil(cache.put(path,clone).catch(()=>{}));
      }
      return response;
    } catch {
      if (event.request.mode === 'navigate') return new Response('This page has not been saved. Open the home page while online and download the game first.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      return new Response('File not saved for offline use',{status:504});
    }
  })());
});
