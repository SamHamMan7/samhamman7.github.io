import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
// Study notes and sources: structure only.
vm.runInNewContext(fs.readFileSync('web/study-notes.js','utf8'),context);
const notes=context.window.STUDY_NOTES,sources=context.window.STUDY_SOURCES;
assert.ok(Object.keys(notes).length>=4&&Object.values(notes).every(xs=>xs.length>=3&&xs.every(x=>typeof x==='string'&&x.length>10)));
for(const list of Object.values(sources))for(const [name,url,blurb] of list){assert.ok(name&&blurb);assert.equal(new URL(url).protocol,'https:');}
console.log('Checked study notes and sources.');
