import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('web/practice-problems.js','utf8'),context);
const problems=context.window.PRACTICE_PROBLEMS;
const answers=new Map();
answers.set('amc-01',3**2-2);
answers.set('amc-02',Array.from({length:36},(_,n)=>[1+Math.floor(n/6),1+n%6]).filter(([a,b])=>a+b===8).length/36);
answers.set('amc-03',(9+12-Math.hypot(9,12))/2);
let rectangles=0;
for(let x1=0;x1<=4;x1++)for(let x2=x1+1;x2<=4;x2++)for(let y1=0;y1<=3;y1++)for(let y2=y1+1;y2<=3;y2++)rectangles++;
answers.set('amc-04',rectangles);
answers.set('amc-05',Number(7n**2026n%10n));
const vertices=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
let hexRectangles=0;
for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)for(let c=b+1;c<6;c++)for(let d=c+1;d<6;d++){
 const [A,B,C,D]=[a,b,c,d].map(i=>vertices[i]);
 const dot=(P,Q,R)=>(P[0]-Q[0])*(R[0]-Q[0])+(P[1]-Q[1])*(R[1]-Q[1]);
 if(Math.abs(dot(A,B,C))<1e-10&&Math.abs(dot(B,C,D))<1e-10&&Math.abs(dot(C,D,A))<1e-10)hexRectangles++;
}
answers.set('amc-06',hexRectangles);
let triples=0;for(let x=1;x<12;x++)for(let y=x+1;y<12;y++)for(let z=y+1;z<12;z++)if(x+y+z===12)triples++;
answers.set('amc-07',triples);
const a=(5+Math.sqrt(13))/2,b=(5-Math.sqrt(13))/2;answers.set('amc-08',a**3+b**3);
answers.set('aime-01',Array.from({length:2025},(_,i)=>i+1).filter(d=>2025%d===0&&d%15===0).length);
answers.set('aime-02',Array.from({length:1024},(_,i)=>i.toString(2).padStart(10,'0')).filter(s=>!s.includes('11')&&[...s].filter(c=>c==='1').length===4).length);
let seq=[2,5];while(seq.length<6)seq.push(3*seq.at(-1)-seq.at(-2));answers.set('aime-03',seq.at(-1));
let pairs=0;for(let a=1;a<=156;a++)for(let b=1;b<=156;b++)if(a*b===12*(a+b))pairs++;answers.set('aime-04',pairs);
let factorial=1n;for(let n=1n;n<=100n;n++)factorial*=n;let zeros=0;while(factorial%12n===0n){zeros++;factorial/=12n;}answers.set('aime-05',zeros);
let lattice=0;for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++)if(x*x+y*y<=25)lattice++;answers.set('aime-06',lattice);
answers.set('aime-07',Array.from({length:99},(_,i)=>Math.floor((i+1)/7)).reduce((a,b)=>a+b,0));
answers.set('aime-08',8*13*14*15/(4*Math.sqrt(21*(21-13)*(21-14)*(21-15))));
assert.equal(problems.length,16);assert.equal(new Set(problems.map(p=>p.id)).size,16);
for(const p of problems){const raw=p.choices?.[p.answer];const value=p.set==='AIME'?p.answer:raw.includes('/')?raw.split('/').map(Number).reduce((a,b)=>a/b):Number(raw);assert.ok(Math.abs(value-answers.get(p.id))<1e-10,p.id);if(p.set==='AIME')assert.ok(Number.isInteger(p.answer)&&p.answer>=0&&p.answer<=999);}
console.log('Verified all 16 answer keys using independent calculations and enumeration.');

// Study help: structure only. Every numeric key is re-derived by build-study.py when the file is generated.
vm.runInNewContext(fs.readFileSync('web/study-problems.js','utf8'),context);
const study=context.window.STUDY_PROBLEMS,notes=context.window.STUDY_TOPICS;
assert.ok(study.length>=30);assert.equal(new Set(study.map(p=>p.id)).size,study.length);
for(const p of study){assert.ok(Number.isInteger(p.answer)&&p.answer>=0&&p.answer<4&&p.choices.length===4&&new Set(p.choices).size===4,p.id);assert.ok(notes[p.subject]?.length,p.id);for(const k of ['title','statement','hint','solution','topic'])assert.ok(p[k]&&p[k].length>3,p.id+' '+k);assert.ok(p.solution.endsWith('Answer: '+'ABCD'[p.answer]+'.'),p.id+' solution letter');}
console.log(`Checked ${study.length} study questions.`);
