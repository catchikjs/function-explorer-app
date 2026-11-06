import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { WORKBOOKS } from '../src/workbook-data.js';
import { ACTIVITY_SETS } from '../src/activity-data.js';
import { RADICAL_FOUNDATIONS } from '../src/radical-foundations.js';
import { modelValue, evaluateActivity, labTargets } from '../src/activity-math.js';
import { ensureBundledWorksheets, resolveWorkbookActivity } from '../src/workbook-state.js';
import { ROOT_MARBLE_LEVELS, ROOT_DOMAIN_LEVELS, tileNumber } from '../src/root-arcade-data.js';
import { compileFormula, createDomainMaze } from '../src/arcade-math.js';
const radical={...WORKBOOKS.find(w=>w.id==='radical'),activities:ACTIVITY_SETS.radical};

test('radical starts with the PDF introduction, covers worked examples, and preserves all legacy IDs',()=>{
 assert.equal(radical.subject,'function');
 assert.equal(radical.pages.length,39);assert.equal(radical.activities.length,56);assert.equal(RADICAL_FOUNDATIONS.length,25);
 assert.equal(radical.activities[0].sourcePage,2);assert.equal(radical.activities.find(q=>q.id==='radical-a01').sourcePage,15);
 for(let i=1;i<=31;i++)assert.ok(radical.activities.some(q=>q.id==='radical-a'+String(i).padStart(2,'0')));
 assert.equal(new Set(radical.activities.map(q=>q.id)).size,56);
 assert.ok(radical.activities.some(q=>q.sourcePage===4&&q.widget.requireStages));
 assert.ok(radical.activities.some(q=>q.sourcePage===14&&q.widget.type==='graph'));
 for(const q of radical.activities)assert.doesNotThrow(()=>katex.renderToString(q.formula,{throwOnError:true,strict:'ignore'}),q.id);
});
test('missing and stale assignments recover without replacing custom settings or student answers',()=>{
 const data={profiles:[{className:'1학년 1반'},{className:'1학년 2반'}],worksheets:[{id:'legacy-id',contentId:'unknown',title:'무리함수',className:'1학년 1반',note:'기존 안내',due:'2026-11-30'}],answers:{'radical-a01':{correct:true,drawing:'기존 필기'}}};
 const before=JSON.stringify(data.answers);ensureBundledWorksheets(data,WORKBOOKS);
 for(const className of ['1학년 1반','1학년 2반'])assert.equal(data.worksheets.filter(w=>w.className===className&&w.contentId==='radical').length,1);
 const original=data.worksheets.find(w=>w.id==='legacy-id');assert.equal(original.contentId,'radical');assert.equal(original.note,'기존 안내');assert.equal(original.due,'2026-11-30');assert.equal(JSON.stringify(data.answers),before);
 const count=data.worksheets.length;ensureBundledWorksheets(data,WORKBOOKS);assert.equal(data.worksheets.length,count);
});
test('old saved question positions keep their original question after prepending concepts',()=>{
 assert.equal(resolveWorkbookActivity(radical,{workbookActivityIndices:{radical:0}}).id,'radical-a01');
 assert.equal(resolveWorkbookActivity(radical,{workbookActivityIndices:{radical:30}}).id,'radical-a31');
 assert.equal(resolveWorkbookActivity(radical,{}).id,'radical-foundation-01');
 assert.equal(resolveWorkbookActivity(radical,{workbookActivityIndices:{radical:0},workbookActivityVersions:{radical:2}}).id,'radical-foundation-01');
 assert.equal(resolveWorkbookActivity(radical,{workbookActivityIds:{radical:'radical-a08'},workbookActivityIndices:{radical:1}}).id,'radical-a08');
});
test('roots in denominators exclude zero; polynomial roots include both endpoints',()=>{
 const reciprocal={kind:'rootReciprocal',a:1,b:-2};assert.ok(Number.isNaN(modelValue(reciprocal,2)));assert.equal(modelValue(reciprocal,3),1);assert.ok(Number.isNaN(modelValue(reciprocal,1)));
 const circle={kind:'rootPolynomial',a:-1,b:0,c:4};assert.equal(modelValue(circle,-2),0);assert.equal(modelValue(circle,2),0);assert.equal(modelValue(circle,0),2);assert.ok(Number.isNaN(modelValue(circle,3)));
});
test('rationalizing the worked example keeps the removable intermediate x=0 case',()=>{
 for(const x of [-4,-3,0,1,8])assert.ok(Math.abs(modelValue({kind:'rootExpression',id:'rationalize'},x)-(Math.sqrt(x+4)-2))<1e-10);
 assert.equal(modelValue({kind:'rootExpression',id:'rationalize'},0),0);
});
test('root inverse is a restricted half parabola and composes back to the original input',()=>{
 for(const a of [2,-2]){const original={kind:'root',a,p:0,q:0,s:1},inverse={...original,kind:'rootInverse'};assert.ok(Number.isNaN(modelValue(inverse,-1)));
 for(const x of a>0?[0,2,8]:[0,-2,-8])assert.ok(Math.abs(modelValue(inverse,modelValue(original,x))-x)<1e-9);}
});
test('opening activities require answers and assessed manipulation, including algebra steps and reflected points',()=>{
 for(const q of RADICAL_FOUNDATIONS){assert.equal(evaluateActivity(q,{}).correct,false,q.id);const r={responses:Object.fromEntries(q.fields.map(f=>[f.key,String(f.answer)])),lab:{...q.widget.defaults,...labTargets(q)},reflectedPoints:[0],trials:[{signature:'one'},{signature:'two'}]};if(q.widget.requireStages)r.lab.stage=q.widget.stages.length;assert.equal(evaluateActivity(q,r).correct,true,q.id);}
 const q=RADICAL_FOUNDATIONS.find(q=>q.widget.requireStages);const r={responses:Object.fromEntries(q.fields.map(f=>[f.key,String(f.answer)])),lab:q.widget.defaults};assert.equal(evaluateActivity(q,r).correct,false);
});
test('dedicated root rail solutions pass all checkpoints and descend throughout the course',()=>{
 const answers=[['a*sqrt(x)+c',{a:-1.5,b:0,c:6}],['a*sqrt(x-b)+c',{a:-1.4,b:-1,c:7.4}],['a*sqrt(12-x)+c',{a:1.5,b:0,c:1}]];
 for(const [i,[source,params]]of answers.entries()){const f=compileFormula(source);for(let x=0;x<=11;x+=.1)assert.ok(Math.abs(f(x,params)-ROOT_MARBLE_LEVELS[i].fn(x))<1e-9);assert.ok(Math.abs(f(0,params)-ROOT_MARBLE_LEVELS[i].start)<1e-9);for(let x=.1;x<11;x+=.1)assert.ok(f(x,params)<f(x-.1,params));}
});
test('each root maze has a safe path through every key and teaches exact boundary inclusion',()=>{
 assert.equal(ROOT_DOMAIN_LEVELS[0].valid(3.5),true);assert.equal(ROOT_DOMAIN_LEVELS[1].valid(-2/3),true);assert.equal(ROOT_DOMAIN_LEVELS[1].valid(-.5),false);assert.equal(ROOT_DOMAIN_LEVELS[2].valid(2),false);assert.equal(tileNumber(-2/3),'−2/3');
 for(const domain of ROOT_DOMAIN_LEVELS)for(let trial=0;trial<30;trial++){const cells=createDomainMaze(domain),visited=new Set([46]),queue=[46];while(queue.length){const i=queue.shift();for(const next of [i-9,i-1,i+1,i+9]){const cell=cells[next];if(cell&&!cell.wall&&domain.valid(cell.value)&&!visited.has(next)){visited.add(next);queue.push(next);}}}for(const key of [10,31,52,16])assert.ok(visited.has(key));}
});
