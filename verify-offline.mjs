import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve('dist'),hash=b=>createHash('sha256').update(b).digest('hex');
const file=url=>{const p=path.resolve(root,'.'+url);assert(p.startsWith(root+path.sep),'Pack path escaped dist');return fs.readFileSync(p)};
const manifest=JSON.parse(file('/offline-manifest.json'));
const packs=manifest.packs.map(p=>{const bytes=file(p.url);assert.equal(bytes.length,p.bytes);assert.equal(hash(bytes),p.sha256);return bytes});
for(const [url,e]of Object.entries(manifest.files)){
 assert(Number.isInteger(e.pack)&&e.pack>=0&&e.pack<packs.length);assert(Number.isInteger(e.offset)&&e.offset>=0&&Number.isInteger(e.bytes)&&e.bytes>=0);assert(e.offset+e.bytes<=packs[e.pack].length);
 assert(file(url).equals(packs[e.pack].subarray(e.offset,e.offset+e.bytes)),url+': offline bytes differ');
}
const release=JSON.parse(fs.readFileSync('bot-updates/current.json'));
for(const [name,expected]of Object.entries(release.expectedWorkers))assert.equal(hash(file('/'+name)),expected);
const aliases=JSON.parse(file('/static-sprite-aliases.json'));
for(const e of aliases.entries){assert(file(e.path).equals(file(e.source)));assert.equal(hash(file(e.path)),e.sha256)}
console.log(JSON.stringify({version:manifest.version,verifiedFiles:Object.keys(manifest.files).length,packs:packs.length,bytes:manifest.totalBytes,workerFingerprints:2,staticSpriteAliases:aliases.entries.length}));
