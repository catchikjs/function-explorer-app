import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { SET_LOGIC_WORKBOOKS, SET_LOGIC_ACTIVITIES } from '../src/set-logic-data.js';
import { allSubsetMasks, calculateSet, expressionRegions, sameSet, regionValue, membership, evaluateSetLogicActivity, implies, maskElements } from '../src/set-logic-math.js';
import { COUNTER_ROUNDS, setupTerritory, closeTerritory, territoryProgress } from '../src/set-logic-arcade.js';
const questions=Object.values(SET_LOGIC_ACTIVITIES).flat();

test('all 7 source PDFs have ordered activities, valid formulas and supported labs',()=>{
 assert.equal(SET_LOGIC_WORKBOOKS.length,7);assert.equal(questions.length,163);assert.equal(new Set(questions.map(q=>q.id)).size,163);
 for(const w of SET_LOGIC_WORKBOOKS) for(const [i,q] of SET_LOGIC_ACTIVITIES[w.id].entries()){
  assert.equal(q.number,i+1);assert.equal(q.workbookId,w.id);assert.ok(q.sourcePage>=1&&q.sourcePage<=w.pages.length,q.id);assert.ok(q.widget.type.startsWith('sl-'),q.id);
  assert.doesNotThrow(()=>katex.renderToString(q.formula,{throwOnError:true,strict:'ignore'}),q.id);
  if(q.widget.type==='sl-probe')assert.ok(q.widget.defaults.x>=(q.widget.min??-6)&&q.widget.defaults.x<=(q.widget.max??6),q.id);
 }
});
test('no activity awards an untouched response, including empty sets and empty shaded areas',()=>{
 for(const q of questions){const result=evaluateSetLogicActivity(q,{});assert.equal(result.correct,false,q.id);assert.equal(result.reviewNeeded,false,q.id);}
});
test('every identity is valid for all 2-set or 3-set membership possibilities',()=>{
 for(const q of questions.filter(q=>q.widget.equivalent))for(let mask=0;mask<1<<(q.widget.count||2);mask++) assert.equal(regionValue(q.widget.expression,mask),regionValue(q.widget.equivalent,mask),q.id+' mask '+mask);
});
test('complements are relative to U and De Morgan handles disjoint and equal sets',()=>{
 const U=[1,2,3,4,5];
 for(const [A,B]of [[[1,2],[4,5]],[[1,2],[1,2]],[[1,2,3],[2,3,4]],[[],U]]){
  const sets={A,B};const expected=U.filter(x=>!A.includes(x)||!B.includes(x));
  assert.ok(sameSet(calculateSet(['union',['not','A'],['not','B']],U,sets),expected));
  assert.ok(sameSet(calculateSet(['not',['intersect','A','B']],U,sets),expected));
 }
 assert.deepEqual(expressionRegions(['intersect','A',['not','A']]),[]);
});
test('subset counts include empty set, distinguish equality, and grow by independent choices',()=>{
 for(let n=0;n<=7;n++){assert.equal(allSubsetMasks(n).length,2**n);assert.equal(allSubsetMasks(n,true).length,2**n-1);}
 const q=SET_LOGIC_ACTIVITIES.subsets.find(q=>q.widget.type==='sl-subset'&&q.widget.proper);
 assert.equal(evaluateSetLogicActivity(q,{lab:{found:allSubsetMasks(q.widget.elements.length)}}).correct,false);
});
test('source counting problems agree with independent enumeration',()=>{
 let pairs=0;for(let a=1;a<8;a++)for(let b=1;b<8;b++){const A=maskElements([1,2,3],a),B=maskElements([1,2,3],b);if(A.every(x=>x*x-3*x<0)&&B.some(x=>A.includes(x)))pairs++;}
 assert.equal(pairs,14);
 const parameters=[];for(let a=-20;a<=20;a++){const lo=Math.min(a,2*a),hi=Math.max(a,2*a);if(lo>-8&&hi<=12)parameters.push(a);}
 assert.deepEqual(parameters,[-3,-2,-1,0,1,2,3,4,5,6]);
 const q=questions.find(q=>q.source.startsWith('103쪽 · 대단원 13'));assert.equal(q.fields.find(f=>f.key==='count').answer,parameters.length);
});
test('counterexample missions each have exactly one legal target and never accept false assumptions',()=>{
 for(const round of COUNTER_ROUNDS){assert.deepEqual(round.choices.filter(x=>round.p(x)&&!round.q(x)),[round.answer]);assert.equal(implies(round.p(round.answer),round.q(round.answer)),false);}
 assert.equal(implies(false,false),true);assert.equal(implies(false,true),true);
});
test('free writing requires explicit teacher review; numeric witnesses accept alternatives',()=>{
 const q=SET_LOGIC_ACTIVITIES['sets-basics'].find(q=>q.fields.some(f=>f.type==='text'));
 const responses=Object.fromEntries(q.fields.map(f=>[f.key,f.type==='text'?'측정 연도와 기온 범위가 명확한 기준으로 집합을 정의합니다.':f.answer]));
 const result=evaluateSetLogicActivity(q,{responses});assert.equal(result.correct,false);assert.equal(result.reviewNeeded,true);
 const falseClaim=questions.find(q=>q.source.startsWith('85쪽 · 스스로 익히기 4 (1)'));
 for(const counterexample of [4,12,20,-4])assert.equal(evaluateSetLogicActivity(falseClaim,{responses:{truth:'1',counterexample:String(counterexample)}}).correct,true);
 for(const wrong of [3,8,16])assert.equal(evaluateSetLogicActivity(falseClaim,{responses:{truth:'1',counterexample:String(wrong)}}).correct,false);
});
test('territory capture closes a real path and owns only the requested mathematical region',()=>{
 const s={round:0,difficulty:'relaxed',phase:'playing',score:0,hearts:6};setupTerritory(s);
 s.trail=Array.from({length:10},(_,i)=>(i+1)*18+11);let cleared=false;
 closeTerritory(s,{loseLife:()=>s.hearts--,feedback:()=>{},stageClear:()=>{cleared=true},finish:()=>{}});
 assert.ok(s.land.some(c=>c.owned));assert.ok(s.land.every(c=>!c.owned||c.target));assert.ok(territoryProgress(s)>=.75);assert.equal(cleared,true);
});
