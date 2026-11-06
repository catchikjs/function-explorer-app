import { LESSONS, lessonById } from './journey-data.js';
export const JOURNEY_VERSION=1;
export function journeyState(state){
 if(!state.journey||state.journey.version!==JOURNEY_VERSION)state.journey={version:1,learnerId:globalThis.crypto.randomUUID(),lessons:{},messages:[],updatedAt:new Date().toISOString()};
 return state.journey;
}
export function lessonRecord(state,id){
 const j=journeyState(state);
 return j.lessons[id]??=( {stage:'discover',drafts:{},lab:{},trials:[],answers:{},attempts:[],round:0,assessments:[],gameRounds:[],reviews:[],reflections:[],hints:[],startedAt:new Date().toISOString()} );
}
export function courseSummary(state){
 const j=state.journey,records=Object.values(j?.lessons||{});
 return {completed:records.filter(r=>r.completedAt).length,started:records.length,attempts:records.reduce((s,r)=>s+(r.attempts?.length||0),0),explanations:records.reduce((s,r)=>s+(r.reflections?.length||0),0),needs: [...new Set(records.flatMap(r=>r.assessments?.at(-1)?.items.filter(i=>!i.correct).map(i=>i.skill)||[]))]};
}
export function recordAnswer(state,id,question,selected,kind){
 const r=lessonRecord(state,id),ok=selected===question.answer;
 const event={id:crypto.randomUUID(),questionId:question.id,prompt:question.prompt,selected:question.options[selected],correct:ok,kind,skill:question.skill,at:new Date().toISOString(),hintUsed:r.hints.includes(question.id)};
 r.attempts.push(event);r.answers[question.id]={selected,checked:true,correct:ok};touch(state);return event;
}
export function recordAssessment(state,id,questions){
 const r=lessonRecord(state,id);
 if(questions.some(q=>!Number.isInteger(r.answers[q.id]?.selected)))throw Error('세 문항에 모두 답을 선택해 주세요.');
 if(r.assessments.some(a=>a.round===r.round))return r.assessments.find(a=>a.round===r.round);
 const items=questions.map(q=>recordAnswer(state,id,q,r.answers[q.id].selected,'assessment'));
 const result={id:crypto.randomUUID(),round:r.round,score:items.filter(i=>i.correct).length,total:questions.length,items,at:new Date().toISOString()};
 r.assessments.push(result);touch(state);return result;
}
export function completeLesson(state,id,reflection){
 const r=lessonRecord(state,id),latest=r.assessments.at(-1);
 if(!latest||latest.score<2)throw Error('형성평가에서 3문항 중 2문항 이상을 해결한 뒤 성찰을 제출해 주세요.');
 if(!reflection.explain?.trim()||!reflection.transfer?.trim())throw Error('나의 설명과 생활 속 연결을 모두 남겨 주세요.');
 if(r.trials.length<2||!r.drafts.prediction?.trim()||!r.drafts.observation?.trim())throw Error('탐구에서 예측과 관찰을 적고, 서로 다른 설정을 2개 이상 기록해 주세요.');
 r.reflections.push({...reflection,at:new Date().toISOString(),teacherReviewed:false});
 r.completedAt||=new Date().toISOString();r.stage='review';touch(state);
}
export function touch(state){journeyState(state).updatedAt=new Date().toISOString();}
export function nextLesson(state){return LESSONS.find(l=>!state.journey?.lessons[l.id]?.completedAt)||LESSONS[7];}
export function reviewDue(record,now=Date.now()){
 if(!record?.completedAt)return false;
 const interval=[1,3,7,14][Math.min(record.reviews?.length||0,3)];
 const from=record.reviews?.at(-1)?.at||record.completedAt;
 return now-new Date(from).getTime()>=interval*86400000;
}
export function makeCourseReport(state,profile,classroom={}){
 journeyState(state);
 return {app:'Goodssaem Journey',version:1,exportedAt:new Date().toISOString(),learner:{id:state.journey.learnerId,name:state.studentName||profile.name,className:profile.className},state:structuredClone(state),classroom:structuredClone(classroom)};
}
export function parseCourseReport(text){
 if(text.length>8000000)throw Error('학습 기록은 8MB 이하만 가져올 수 있어요.');
 let r;try{r=JSON.parse(text);}catch{throw Error('올바른 JSON 기록 파일이 아니에요.');}
 if(r?.app!=='Goodssaem Journey'||r.version!==1||!r.learner||typeof r.learner.id!=='string'||! /^[a-zA-Z0-9-]{1,80}$/.test(r.learner.id)||typeof r.learner.name!=='string'||typeof r.learner.className!=='string'||r.learner.name.length>80||r.learner.className.length>80||r.state?.journey?.version!==1||r.state.journey.learnerId!==r.learner.id||!Number.isFinite(Date.parse(r.state.journey.updatedAt)))throw Error('8차시 학습 기록 파일 형식을 확인해 주세요.');
 if(r.classroom&&Object.values(r.classroom).some(v=>!Array.isArray(v)))throw Error('학급 기록 형식이 올바르지 않아요.');
 const j=r.state.journey;
 if(!j.lessons||typeof j.lessons!=='object'||Array.isArray(j.lessons))throw Error('차시 기록이 올바르지 않아요.');
 for(const [id,v] of Object.entries(j.lessons)){
  if(!LESSONS.some(l=>l.id===id)||!v||!['trials','attempts','assessments','reflections','reviews','gameRounds','hints'].every(k=>Array.isArray(v[k]))||!v.drafts||typeof v.drafts!=='object'||!v.answers||typeof v.answers!=='object'||!v.lab||typeof v.lab!=='object')throw Error('차시별 학습 기록이 올바르지 않아요.');
  if(v.assessments.some(a=>!a||!Array.isArray(a.items)||!Number.isInteger(a.score)||a.score<0||a.score>3||a.items.some(i=>!i||typeof i.skill!=='string'))||v.attempts.some(a=>!a||typeof a.prompt!=='string'||typeof a.selected!=='string')||v.reflections.some(a=>!a||typeof a.explain!=='string'||typeof a.transfer!=='string'))throw Error('평가·성찰 기록을 확인해 주세요.');
 }
 return r;
}
export function mergeCourseReport(reports,report){
 const i=reports.findIndex(r=>r.learner.id===report.learner.id);
 if(i<0){reports.push(report);return true;}
 if(reports[i].state.journey.updatedAt>=report.state.journey.updatedAt)return false;
 reports[i]=report;return true;
}
export const rubric=[['개념 이해','정의와 조건을 정확히 말하고 예와 반례를 든다.'],['탐구 과정','예측을 세우고 두 가지 이상의 설정을 비교하여 설명을 수정한다.'],['표현과 연결','식·표·그래프를 연결하고 생활 맥락의 정의역을 설명한다.'],['성찰과 전이','오답의 이유와 달라진 생각을 기록하고 새 상황에 적용한다.']];
export {lessonById};
