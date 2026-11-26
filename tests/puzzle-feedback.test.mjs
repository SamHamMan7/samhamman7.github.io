import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackEntry, loadFeedback, loadPuzzleProgress, puzzleProgressText, recordPuzzleGrade, saveFeedback} from '../web/puzzle-feedback.js';

const position = {turn:4,record:{seed:[1,2,3,4],p1:'team A',p2:'team B',choices:[['p1','team 1234'],['p2','team 4321']]}};
const result = {step:{turn:4,yours:{command:'move 1 1, move 2 2',chance:20},bot:{command:'move 2, move 1 1',chance:40},rows:[{label:'A'}]},
  foe:'move 1 1, move 2 2',lines:['|move|p1a: A|Protect','|t:|1','|faint|p2a: B']};

test('graded feedback preserves the replayable prefix and the actual choices separately',()=>{
  const item=feedbackEntry(position,result);
  assert.deepEqual(item.record,position.record);
  assert.notEqual(item.record,position.record);
  assert.equal(item.foeReply,result.foe);
  assert.equal(item.you.command,result.step.yours.command);
  assert.equal(item.discharge.command,result.step.bot.command);
  assert.deepEqual(item.outcome,[result.lines[0],result.lines[2]]);
  assert.equal(feedbackEntry(position,{...result,step:{...result.step,turn:5}}),null);
});

test('local feedback shares the previous storage key and keeps previously saved rows',()=>{
  const data=new Map([['puzzle-feedback','[{"verdict":"both"}]']]);
  const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const saved=feedbackEntry(position,result);
  assert.equal(saveFeedback(storage,saved,'mine','  switch first  '),true);
  const rows=loadFeedback(storage);
  assert.deepEqual(rows.map(x=>x.verdict),['both','mine']);
  assert.equal(rows[1].comment,'switch first');
  assert.equal(saveFeedback(storage,saved,null,'   '),false);
});

test('puzzle progress displays existing scores and persists new grades locally',()=>{
  const data = new Map([['puzzle-stats','{"played":2,"best":1,"loss":4}']]);
  const storage = {getItem: key => data.get(key), setItem: (key, value) => data.set(key, value)};
  const progress = loadPuzzleProgress(storage);
  assert.equal(puzzleProgressText(progress), '2 graded · 1 within 1 pt · avg gap 2.0 pts');
  recordPuzzleGrade(storage, progress, {same: false, loss: 0.5});
  assert.deepEqual(loadPuzzleProgress(storage), {played: 3, best: 2, loss: 4.5});
  assert.equal(puzzleProgressText(progress), '3 graded · 2 within 1 pt · avg gap 1.5 pts');
});

test('empty or corrupt puzzle progress starts fresh and blocked storage still allows in-session progress',()=>{
  const storage = {getItem: () => '{"played":0,"best":1,"loss":0}', setItem: () => { throw Error('blocked'); }};
  const progress = loadPuzzleProgress(storage);
  assert.equal(puzzleProgressText(progress), '');
  recordPuzzleGrade(storage, progress, {same: true, loss: 0});
  assert.equal(puzzleProgressText(progress), '1 graded · 1 within 1 pt · avg gap 0.0 pts');
});
