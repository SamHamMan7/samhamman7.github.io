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

// Study help (Chem Olympiad / AI Olympiad): independent re-derivation of every numeric key.
vm.runInNewContext(fs.readFileSync('web/study-problems.js','utf8'),context);
const study=context.window.STUDY_PROBLEMS,expect=new Map([
 ['chem-01',Math.min(5.40/26.98/2,10.65/70.90/3)*2*133.33],['chem-03',2*-393.5+3*-285.8+277.7],['chem-04',100*0.5**3],['chem-05',2*(-0.2+Math.sqrt(0.04+3.2))/8],
 ['chem-06',-Math.log10(Math.sqrt(1.8e-5*0.10))],['chem-07',-Math.log10(1.8e-5)],['chem-08',-2*96485*1.10/1000],['chem-10',1.8e-10/0.10],['chem-12',-3*1.86*0.100],
 ['ai-01',0-0.1*2*(0-3)],['ai-02',0.25],['ai-03',3/(1+3)],['ai-05',100*10+10],['ai-06',2*0.75*0.6/(0.75+0.6)],['ai-09',Math.log(2)]]);
const text=new Map([['chem-02','CO₂'],['chem-09','SF₄'],['chem-11','4'],['ai-04','28×28'],['ai-07','Add regularization or more training data'],['ai-08','(3, 4)'],['ai-10','B, with 2 of 3'],['ai-11','O(n²)'],['ai-12','1 and 3']]);
const superscripts='⁰¹²³⁴⁵⁶⁷⁸⁹',number=raw=>{let t=raw.replace(/\s/g,'').replace(/−/g,'-').replace('×10','e').replace(/⁻/g,'-');for(const [i,c] of [...superscripts].entries())t=t.replaceAll(c,String(i));return Number(t.match(/^[+-]?[\d.]+(e-?\d+)?/)[0]);};
assert.equal(study.length,24);assert.equal(new Set(study.map(p=>p.id)).size,24);assert.equal(expect.size+text.size,24);
assert.ok(Math.abs(1.96*0.08206*273.15-44.01)<0.3);
for(const p of study){assert.ok(p.answer>=0&&p.answer<p.choices.length&&new Set(p.choices).size===p.choices.length,p.id);const raw=p.choices[p.answer];
 if(text.has(p.id)){assert.equal(raw,text.get(p.id),p.id);continue;}
 const want=expect.get(p.id),error=x=>Math.abs(number(x)-want);assert.ok(error(raw)<=Math.max(0.012*Math.abs(want),0.006),p.id);
 for(const [i,c] of p.choices.entries())if(i!==p.answer)assert.ok(error(c)>error(raw),p.id);}
console.log('Verified all 24 study answer keys.');
