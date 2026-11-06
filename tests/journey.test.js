import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,lessonQuestions} from '../src/journey-data.js';
import {journeyState,lessonRecord,recordAnswer,recordAssessment,completeLesson,courseSummary,reviewDue,makeCourseReport,parseCourseReport,mergeCourseReport} from '../src/journey-state.js';

test('eight lessons span all five standards and contain meaningful practice, assessment, challenge and transfer',()=>{
 assert.equal(LESSONS.length,8);assert.deepEqual(new Set(LESSONS.slice(0,7).map(l=>l.standard)),new Set(['01','02','03','04','05']));
 for(const l of LESSONS){assert.equal(l.concepts.length,3);assert.equal(l.prompts.length,3);assert.ok(l.transfer.length>30);assert.ok(l.misconception.length>20);assert.equal(l.challenge.length,2);
  for(const kind of ['practice','assessment','review','game'])for(let round=0;round<12;round++){
   const qs=lessonQuestions(l.id,kind,round);assert.equal(qs.length,kind==='review'?2:3);
   for(const q of qs){assert.equal(new Set(q.options).size,q.options.length,`duplicate choices ${q.id}`);assert.ok(q.answer>=0&&q.answer<q.options.length);assert.ok(q.why.length>10);assert.ok(q.skill);}
  }
 }
});
test('numeric composition, inverse, rational and radical variants obey independent calculations',()=>{
 for(let r=0;r<20;r++){
  const n=4+r,qs=lessonQuestions('composition','assessment',r);assert.equal(qs[0].options[qs[0].answer],String(2*(3+n)));assert.equal(qs[1].options[qs[1].answer],String(6+n));assert.equal(qs[2].options[qs[2].answer],`x≥${n}`);
  const inv=lessonQuestions('inverse','assessment',r);assert.equal(inv[0].options[inv[0].answer],'3');assert.equal(n*3+1,3*n+1);
  const rational=lessonQuestions('rational','assessment',r);assert.equal(rational[0].options[rational[0].answer],`x≠${n+1}`);
  const root=lessonQuestions('radical','assessment',r);assert.equal(root[0].options[root[0].answer],`x≥${n}`);assert.equal(root[2].options[root[2].answer],`y≤${n}`);
 }
});
test('assessment submits once per round, preserves first mistakes, and retries change numerical situations',()=>{
 const s={},r=lessonRecord(s,'composition'),first=lessonQuestions('composition','assessment',0);
 assert.throws(()=>recordAssessment(s,'composition',first));
 first.forEach((q,i)=>r.answers[q.id]={selected:i===0?(q.answer+1)%q.options.length:q.answer});
 const a=recordAssessment(s,'composition',first);assert.equal(a.score,2);assert.equal(r.attempts.length,3);assert.equal(recordAssessment(s,'composition',first).id,a.id);assert.equal(r.assessments.length,1);assert.equal(r.attempts.length,3);
 r.round++;const next=lessonQuestions('composition','assessment',r.round);assert.notEqual(first[0].prompt,next[0].prompt);next.forEach(q=>r.answers[q.id]={selected:q.answer});recordAssessment(s,'composition',next);
 assert.deepEqual(r.assessments.map(a=>a.score),[2,3]);assert.equal(r.attempts[0].correct,false);assert.equal(r.attempts.length,6);assert.equal(courseSummary(s).needs.length,0);
});
test('a completed quest requires evidence, not simply a quiz score; narrative is not automatically graded',()=>{
 const s={},r=lessonRecord(s,'function'),qs=lessonQuestions('function','assessment');qs.forEach(q=>r.answers[q.id]={selected:q.answer});recordAssessment(s,'function',qs);
 const reflection={explain:'각 입력에 출력이 정확히 하나여야 한다.',transfer:'학생과 출석번호는 대응으로 표현할 수 있다.'};
 assert.throws(()=>completeLesson(s,'function',reflection));r.drafts.prediction='입력이 다르면 출력도 달라야 할까?';r.drafts.observation='다른 두 버튼의 출력이 같아도 함수이다.';r.trials.push({values:{mode:'valid'}},{values:{mode:'same'}});
 completeLesson(s,'function',reflection);assert.ok(r.completedAt);assert.equal(r.reflections[0].teacherReviewed,false);assert.equal(courseSummary(s).completed,1);
});
test('hint-assisted retries preserve each choice and teacher help signals refer to latest assessment',()=>{
 const s={},r=lessonRecord(s,'domain'),q=lessonQuestions('domain')[0];r.hints.push(q.id);recordAnswer(s,'domain',q,(q.answer+1)%q.options.length,'practice');recordAnswer(s,'domain',q,q.answer,'practice');
 assert.equal(r.attempts.length,2);assert.equal(r.attempts[0].hintUsed,true);assert.equal(r.attempts[0].correct,false);assert.equal(r.attempts[1].correct,true);
});
test('portable reports retain all learner state, reject malformed input and merge idempotently without losing newer work',()=>{
 const s={studentName:'테스트',answers:{legacy:{correct:true}},playLab:{points:123}},r=lessonRecord(s,'rational');r.drafts.prediction='예상';
 const report=makeCourseReport(s,{name:'학생',className:'1학년 1반'}),parsed=parseCourseReport(JSON.stringify(report));assert.equal(parsed.state.answers.legacy.correct,true);assert.equal(parsed.state.playLab.points,123);
 const rows=[];assert.equal(mergeCourseReport(rows,parsed),true);assert.equal(mergeCourseReport(rows,parsed),false);const old=structuredClone(parsed);old.state.journey.updatedAt='2020-01-01T00:00:00.000Z';assert.equal(mergeCourseReport(rows,old),false);assert.equal(rows.length,1);
 const bad=structuredClone(report);bad.state.journey.lessons.rational.assessments=[{}];assert.throws(()=>parseCourseReport(JSON.stringify(bad)));assert.throws(()=>parseCourseReport('{bad'));assert.throws(()=>parseCourseReport('{}'));
});
test('spaced retrieval becomes due after one day and then three days after the next review',()=>{
 const start=Date.parse('2026-11-01T00:00:00Z'),r={completedAt:new Date(start).toISOString(),reviews:[]};assert.equal(reviewDue(r,start+86399000),false);assert.equal(reviewDue(r,start+86400000),true);r.reviews.push({at:new Date(start+86400000).toISOString()});assert.equal(reviewDue(r,start+3*86400000),false);assert.equal(reviewDue(r,start+4*86400000),true);
});
