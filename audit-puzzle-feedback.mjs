// Rerun only the disagreements from a local puzzle-feedback export.
import fs from 'node:fs/promises';

const file = process.argv[2];
if (!file) throw Error('Usage: node audit-puzzle-feedback.mjs path/to/puzzle-feedback.json');
const data = JSON.parse(await fs.readFile(file,'utf8'));
if (data.kind !== 'puzzle-feedback' || !Array.isArray(data.items)) throw Error('Expected a puzzle feedback export');

globalThis.self = globalThis;
let handle = () => {};
globalThis.postMessage = message => handle(message);
await import('./web/champions.worker.js');

async function replay(item) {
  if (!item.record || typeof item.you?.command !== 'string' || !Number.isInteger(item.turn)) return {status:'missing-record'};
  const record = structuredClone(item.record);
  record.choices.push(['p1',item.you.command]);
  if (typeof item.foeReply === 'string') record.choices.push(['p2',item.foeReply]);
  const step = await new Promise((resolve,reject)=>{
    const timer = setTimeout(()=>reject(Error('Replay timed out')),90000);
    handle = message=>{
      if (message.type==='review-step' && message.step.turn===item.turn && message.step.yours.command===item.you.command) {
        clearTimeout(timer);
        resolve(message.step);
      } else if (['review-done','error','review-error'].includes(message.type)) {
        clearTimeout(timer);
        reject(Error(message.message ?? 'Saved choice was not reached'));
      }
    };
    void self.onmessage({data:{type:'review',record}});
  }).finally(()=>self.onmessage({data:{type:'review-stop'}}));
  if (!Number.isFinite(step.yours.chance) || !Number.isFinite(step.bot?.chance)) return {status:'ungraded',reason:step.error};
  return {status:step.bot.chance>step.yours.chance?'still-disagrees':'agrees-or-ties',
    turn:item.turn,player:step.yours,discharge:step.bot,priorScore:item.you.chance};
}

const results = [];
for (const [index,item] of data.items.entries()) {
  if (item.verdict !== 'mine') continue;
  try { results.push({index,...await replay(item)}); }
  catch (error) { results.push({index,status:'unreplayable',reason:error.message}); }
}
console.log(JSON.stringify({markedDisagreements:results.length,stillDisagrees:results.filter(r=>r.status==='still-disagrees').length,results},null,2));
process.exit(0);
