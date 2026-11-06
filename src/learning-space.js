import { escapeHTML as esc, icon, math, actionButton as button, toast, localDate, saveDownload } from './ui.js';
import { explorerHTML, updateExplorer, graphTypes } from './explorer.js';
import { WORKBOOKS, getWorkbook, workbookPDF, workbookProgress } from './workbooks.js';
import { renderSetLogicEvidence } from './set-logic-labs.js';
import { ensureBundledWorksheets } from './workbook-state.js';
import { createVariantPicker } from './practice-random.js';
import { QUIZ_TOPICS as quizItems } from './quiz-generator.js';
import { QUIZ_LEVELS, createLevelQuiz, levelVariantIds } from './quiz-levels.js';
import { playProgress, unlockedQuizLevel, recordQuizOpen, recordQuizAttempt, rankLearners, createPlayReport, parsePlayReport, mergePlayReports } from './play-progress.js';
import { rankCard, quizSteps, quizCelebration, certificate, teacherPlayDashboard } from './play-lab-views.js';
import { createArcadeAudio, ARCADE_AUDIO_KEY } from './arcade-audio.js';
import mathPlayFriends from './assets/math-play-friends.svg';
import { createJourney } from './journey.js';
import { createClassroomCloud } from './classroom-cloud.js';
import { createQuizTimer, quizTimeLabel } from './quiz-timer.js';
import { quizTopicPicker, timedQuizView } from './quiz-views.js';

const SPACE_KEY='goodssaem-classroom-v1';
const LEARN_KEY='function-inquiry-workbook-v1';
const defaults=()=>({profiles:[{id:'me',name:'나의 학습',className:'1학년 1반'}],activeId:'me',questions:[],reflections:[],observations:[],feedback:[],submissions:[],playReports:[],worksheets:[{id:'first',title:'함수의 뜻과 그래프',className:'1학년 1반',subject:'공통수학2',createdAt:new Date().toISOString()}],locks:{}});
function loadSpace(){
 let data;try{const saved=JSON.parse(localStorage.getItem(SPACE_KEY));data=saved&&Array.isArray(saved.profiles)&&saved.profiles.length?{...defaults(),...saved}:defaults();}catch{data=defaults();}
 const before=JSON.stringify(data.worksheets);
 ensureBundledWorksheets(data,[{id:'first',title:'함수의 뜻과 그래프'},...WORKBOOKS]);
 if(JSON.stringify(data.worksheets)!==before){try{localStorage.setItem(SPACE_KEY,JSON.stringify(data));}catch{/* Learning remains available when storage is full. */}}
 return data;
}
export const studentStorageKey=id=>id==='me'?LEARN_KEY:`${LEARN_KEY}:${id}`;
export const activeStudentId=()=>loadSpace().activeId;


export function createLearningSpace(api){
 let data=loadSpace();
 let cloud=null;
 let teacher=false,menuOpen=false,modal=null,teacherTab='journey',classFilter='1학년 1반',selectedStudent='me',boardFilter='all',worksheetFilter='all';
 let quizIndex=0,quizSelected=null,quizResult=null,game=false,quizQuestion=null;
 let quizLevel=1,quizOwner=null,quizNotice=null,showCertificate=false,quizAudio=null,playStudentId=null;
 const nextVariant=createVariantPicker();
 const quizClock=createQuizTimer();
 let quizTimerInterval=null,quizRecordedSeconds=0,quizWindowFocused=true;
 function quizSoundSettings(){
  quizAudio??=createArcadeAudio();
  try{const settings=JSON.parse(localStorage.getItem(ARCADE_AUDIO_KEY));if(settings)quizAudio.updateSettings(settings);}catch{}
  return quizAudio.settings;
 }
 function stopQuizTimer(){quizClock.pause();if(quizTimerInterval!==null){clearInterval(quizTimerInterval);quizTimerInterval=null;}}
 function syncQuizTimer(){
  const active=api.state.view==='quiz'&&!game&&!teacher&&!modal&&!quizNotice&&!showCertificate&&!!quizQuestion&&quizOwner===api.state&&!quizResult&&!document.hidden&&quizWindowFocused&&!data.locks[profile().className];
  const update=()=>{const value=document.getElementById('quiz-timer-value');if(value)value.textContent=quizTimeLabel(quizClock.seconds);const status=document.getElementById('quiz-timer-state');if(status)status.textContent=quizResult?'제출 완료':quizClock.running?'진행 중':'일시정지';};
  if(active){quizClock.resume();if(quizTimerInterval===null)quizTimerInterval=setInterval(update,250);}else stopQuizTimer();
  update();
 }
 function showQuizTopics(level=quizLevel){
  if(quizOwner!==api.state){quizOwner=api.state;level=unlockedQuizLevel(api.state);}
  if(!Number.isInteger(level)||level<1||level>unlockedQuizLevel(api.state))return;
  stopQuizTimer();quizClock.reset();quizRecordedSeconds=0;quizLevel=level;quizQuestion=null;quizSelected=null;quizResult=null;quizNotice=null;showCertificate=false;quizAudio?.stop();
 }
 function quizFeedbackSound(correct){
  quizSoundSettings();const current=quizQuestion,owner=api.state;
  quizAudio.setScene('memory','quiz-feedback');
  void quizAudio.unlock().then(ok=>{if(ok&&quizOwner===owner&&api.state===owner&&quizQuestion===current&&quizResult?.ok===correct&&!quizNotice&&!showCertificate)quizAudio.cue(correct?'match':'miss');});
 }

 function openQuiz(index=quizIndex,level=quizLevel){
  if(quizOwner!==api.state){quizOwner=api.state;level=unlockedQuizLevel(api.state);}
  if(!Number.isInteger(level)||level<1||level>unlockedQuizLevel(api.state)||!Number.isInteger(index)||index<0||index>5)return;
  quizLevel=level;quizIndex=index;quizSelected=null;quizResult=null;quizNotice=null;showCertificate=false;quizAudio?.stop();
  const variants=levelVariantIds(index,level);
  quizQuestion=createLevelQuiz(index,variants[nextVariant(`quiz:${level}:${index}`,variants.length)],level);
  quizQuestion.review=!!playProgress(api.state).quiz.stages[level]?.passed[index];
  quizClock.start();quizRecordedSeconds=0;recordQuizOpen(api.state,level,index);api.save();
 }
 function playEntries(className=profile().className){
  const entries=data.profiles.filter(p=>p.className===className).map(p=>({id:p.id,name:snapshot(p.id).studentName||p.name,state:snapshot(p.id)}));
  for(const report of data.playReports||[]){
   if(report.learner.className!==className)continue;
   const existing=entries.find(e=>e.state.playLab?.learnerId===report.learner.id);
   const row={id:existing?.id||`report:${report.learner.id}`,name:report.learner.name,state:{playLab:report.playLab}};
   if(existing){if((existing.state.playLab.updatedAt||'')<report.playLab.updatedAt)Object.assign(existing,row);}else entries.push(row);
  }
  return entries;
 }
 function rankingHTML(){return rankCard(playEntries(),data.activeId);}
 function rankSummary(){const row=rankLearners(playEntries()).find(e=>e.id===data.activeId);return {rank:row?.rank||1,points:row?.points||0};}
 function fanfare(master=false){
  quizAudio??=createArcadeAudio();
  try{const settings=JSON.parse(localStorage.getItem(ARCADE_AUDIO_KEY));if(settings)quizAudio.updateSettings(settings);}catch{}
  quizAudio.setScene('memory','celebration');
  if(!quizAudio.settings.effects){toast('효과음을 켜면 팡파레를 들을 수 있어요.');return;}
  void quizAudio.unlock().then(ok=>{if(ok&&(quizNotice||showCertificate))quizAudio.cue(master?'win':'stage');});
 }

 let arcade=null,arcadeLoading=false,arcadeError=false,pendingGame=null;
 function loadArcade(){
  if(arcade||arcadeLoading)return;
  arcadeLoading=true;arcadeError=false;
  import('./math-arcade.js').then(({createMathArcade})=>{arcade=createMathArcade({get state(){return api.state;},save:api.save,rankHTML:rankingHTML,rankSummary});if(pendingGame){arcade.open(pendingGame);pendingGame=null;}}).catch(()=>{arcadeError=true;}).finally(()=>{arcadeLoading=false;if(game&&api.state.view==='quiz')refresh();});
 }
 let graph={type:'square',a:1,h:1,k:-1,original:true,...api.state.explorer};
 const profile=()=>data.profiles.find(p=>p.id===data.activeId)||data.profiles[0];
 const persist=()=>{try{localStorage.setItem(SPACE_KEY,JSON.stringify(data));window.dispatchEvent(new Event('goodssaem-saved'));return true;}catch{toast('저장 공간이 부족해요. 성장 기록을 파일로 보관해 주세요.');return false;}};
 const refresh=()=>api.render();
 const nav=(view)=>{if(view==='quiz'&&!game)showQuizTopics();if(view==='concept'){api.state.workbookId='first';api.state.worksheetId=data.worksheets.find(w=>w.className===profile().className&&(w.contentId||w.id)==='first')?.id||'first';}api.state.view=view;menuOpen=false;api.save();refresh();window.scrollTo({top:0,behavior:'smooth'});};
 function snapshot(id){if(id===data.activeId)return api.state;const remote=cloud?.rows.find(r=>r.id===id);if(remote)return remote.state;try{return JSON.parse(localStorage.getItem(studentStorageKey(id)))||{};}catch{return {};}}
 function baseCorrect(s=api.state){return Object.entries(s.answers||{}).filter(([id,a])=>/^q\d+$/.test(id)&&a.correct).length;}
 function totals(s=api.state){return {concepts:(s.completedConcepts||[]).length,correct:Object.values(s.answers||{}).filter(a=>a.correct).length,attempts:Object.values(s.answers||{}).reduce((n,a)=>n+(a.attempts||0),0)};}
 function getFeedback(){return data.feedback.filter(f=>f.studentId===data.activeId||(f.learnerId&&f.learnerId===api.state.journey?.learnerId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 function saveObservation(kind,text,source){
  if(!text?.trim())return; const found=data.observations.find(o=>o.studentId===data.activeId&&o.source===source&&o.kind===kind);
  if(found){found.text=text;found.updatedAt=new Date().toISOString();}else data.observations.push({id:crypto.randomUUID(),studentId:data.activeId,kind,text,source,createdAt:new Date().toISOString()});
  persist();
 }
 const journey=createJourney({
  get state(){return api.state;},save:api.save,
  render(view){if(view){if(teacher)teacherTab=view;else{api.state.view=view;api.save();}}refresh();},
  navigate(view){teacher=false;nav(view);},profile,classroomData:()=>Object.fromEntries(['reflections','questions','observations','submissions','feedback'].map(k=>[k,data[k].filter(r=>r.studentId===data.activeId)])),isTeacher:()=>teacher&&(!cloud?.configured||cloud.isTeacher()),
  entries(){
   const rows=data.profiles.filter(p=>p.className===classFilter).map(p=>({id:p.id,name:snapshot(p.id).studentName||p.name,state:snapshot(p.id)}));
   for(const report of data.courseReports||[]){if(report.learner.className!==classFilter)continue;const existing=rows.find(e=>e.state.journey?.learnerId===report.learner.id);if(existing){if((existing.state.journey.updatedAt||'')<report.state.journey.updatedAt)existing.state=report.state;}else rows.push({id:'course:'+report.learner.id,name:report.learner.name,state:report.state});}for(const remote of cloud?.rows||[]){if(remote.className!==classFilter)continue;const existing=rows.find(e=>e.id===remote.id);if(existing&&existing.id!==data.activeId)Object.assign(existing,remote);else if(!existing)rows.push(remote);}return rows;
  },feedback:getFeedback,feedbackFor:id=>data.feedback.filter(f=>f.studentId===id),
  async sendFeedback(id,text,observation){const report=(data.courseReports||[]).find(r=>'course:'+r.learner.id===id);const learnerId=report?.learner.id||snapshot(id).journey?.learnerId;if(id.startsWith('cloud:')){try{await cloud.sendFeedback(id,text);}catch(e){toast(e.message||'메시지를 보내지 못했어요.');throw e;}}data.feedback.push({id:crypto.randomUUID(),studentId:id,learnerId,text,observation,createdAt:new Date().toISOString()});persist();},
  receiveFeedback(messages){for(const f of messages)if(!data.feedback.some(m=>m.id===f.id))data.feedback.push({...f,studentId:data.activeId});persist();},
  importReport(report,merge){data.courseReports||=[];const updated=merge(data.courseReports,report);if(updated&&!persist())throw Error('저장 공간이 부족해요. 일부 기록을 별도 보관해 주세요.');return updated;},
  restore(report){for(const key of ['reflections','questions','observations','submissions','feedback'])if(Array.isArray(report.classroom?.[key]))data[key]=[...data[key].filter(r=>r.studentId!==data.activeId),...report.classroom[key].map(r=>({...r,studentId:data.activeId}))];api.restoreState(report.state);Object.assign(profile(),{name:report.learner.name,className:report.learner.className});api.save();persist();}
 });
 cloud=createClassroomCloud({
  get state(){return api.state;},profile,render:refresh,
  classroomData(){return Object.fromEntries(['reflections','questions','observations','submissions'].map(k=>[k,data[k].filter(r=>r.studentId===data.activeId)]));},
  activate(m){api.save();const id='cloud:'+m.user_id;let p=data.profiles.find(p=>p.id===id);if(!p){p={id,name:m.display_name,className:m.class_name};data.profiles.push(p);}else Object.assign(p,{name:m.display_name,className:m.class_name});data.activeId=id;classFilter=m.class_name;persist();api.switchStudent(id);api.state.studentName=m.display_name;api.state.view='connection';teacher=false;api.save();},
  deactivate(){teacher=false;api.state.view='connection';api.save();},
  apply(payload){api.restoreState(payload.state);api.state.view='connection';for(const key of ['reflections','questions','observations','submissions']){if(Array.isArray(payload.classroom?.[key])){data[key]=[...data[key].filter(r=>r.studentId!==data.activeId),...payload.classroom[key].map(r=>({...r,studentId:data.activeId}))];}}persist();api.save();},
  receiveMessages(messages){let changed=false;for(const m of messages)if(!data.feedback.some(f=>f.id===m.id)){data.feedback.push(m);changed=true;}if(changed)persist();}
 });
 function shell(inner){
 arcade?.unmount();
 if(api.state.view!=='quiz'||game||teacher)quizAudio?.stop();
 const p=profile();const t=totals();const view=api.state.view;
 const links=[['welcome','home','나의 학습 홈'],['journey','target','8차시 함수 퀘스트'],['resources','folder','수업 학습자료'],['concept','book','개념 탐구'],['worksheets','sheet','디지털 학습지'],['quiz','quiz','개념 퀴즈'],['reflection','note','수다노트'],['board','chat','질문 게시판'],['summary','growth','나의 성장 기록'],['connection','settings','저장·학교 계정 연결']];
 const current=teacher?'교사 대시보드':links.find(l=>l[0]===view)?.[2]||(view==='explore'?'함수 탐구실':view==='practice'?'디지털 학습지':'나의 학습 홈');
 document.getElementById('app').innerHTML=`<div class="app-shell ${menuOpen?'menu-open':''}"><aside class="sidebar"><a class="brand" href="#" data-action="go-welcome"><span class="brand-symbol">g<span>✦</span></span><span>Good<span class="brand-ko">쌤</span><small>함께 발견하는 수학</small></span></a><div class="class-badge">${icon('book')} 공통수학2 <span>고1</span></div><div class="side-caption">MY LEARNING</div><nav class="side-menu" aria-label="주 메뉴">${links.map(([key,i,label])=>`<button type="button" class="side-item ${!teacher&&(view===key||(key==='worksheets'&&view==='practice'))?'active':''}" data-action="space-nav" data-view="${key}">${icon(i)}<span>${label}</span>${key==='board'&&data.questions.some(q=>q.studentId===data.activeId&&q.reply)?'<i class="nav-dot"></i>':''}</button>`).join('')}</nav><div class="side-encouragement"><span class="tiny-spark">✦</span><strong>조금씩, 나의 속도로</strong><p>정답보다 빛나는 건<br/>너의 생각하는 과정이야.</p><div class="mini-path"><i></i><i></i><i></i><span>↗</span></div></div><div class="sidebar-bottom"><button class="side-item ${teacher?'active':''}" data-action="toggle-teacher">${icon('teacher')}<span>${teacher?'학생 화면으로':'교사 대시보드'}</span>${icon('chevron')}</button><span class="local-indicator"><i></i> 이 브라우저에 자동 저장</span></div></aside><div class="workspace"><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" data-action="mobile-menu" aria-label="메뉴 열기">${icon('menu')}</button><span>나의 클래스</span>${icon('chevron')}<strong>${esc(current)}</strong></div><div class="topbar-actions"><span class="class-label">${esc(p.className)}</span><button class="icon-button notification-button" data-action="notifications" aria-label="Good쌤 피드백 알림">${icon('bell')}${getFeedback().length?'<i></i>':''}</button><span class="topbar-divider"></span><button class="user-button" data-action="profile"><span class="avatar">${esc((api.state.studentName||p.name==='나의 학습'?'나':p.name).slice(0,1))}</span><span>${esc(api.state.studentName||p.name)} <small>${teacher?'교사 미리보기':'학생'}</small></span>${icon('chevron')}</button></div></header><main class="content ${teacher?'teacher-content':''}">${teacher?teacherHTML():inner}</main><footer class="app-footer"><span><b>Good쌤</b>과 함께, 오늘도 한 걸음 성장했어요.</span><span>공통수학2 · 집합·명제·함수 <i>·</i> 특성화고 1학년</span></footer></div></div>${!teacher&&data.locks[p.className]?`<div class="focus-overlay" role="dialog" aria-modal="true" aria-label="수업 집중 모드"><div>${icon('lock')}<span class="eyeline">잠깐, Good쌤에게 집중해요</span><h2>지금은 함께 생각하는 시간</h2><p>선생님의 설명을 듣고 탐구를 이어가요.<br/>선생님이 집중 모드를 해제하면 다시 사용할 수 있어요.</p><span class="tag">이 브라우저의 수업 화면 잠금</span>${button('교사 미리보기 열기','unlock-preview','light small')}</div></div>`:''}${modal?modalHTML():''}`;
 arcade?.mount();
 api.setupDrawing();
 document.querySelectorAll('textarea[data-autofocus]')[0]?.focus();
 syncQuizTimer();
 void journey.studioMount();
 }
 function heading(kicker,title,description,extra=''){return `<div class="page-heading"><div><div class="page-eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${extra}</div>`;}
 function reflection(){
 const drafts=api.state.reflectionDraft||{};const entries=data.reflections.filter(r=>r.studentId===data.activeId).reverse();
 return heading('THINK · TALK · GROW','나의 생각이 자라는 수다노트','무엇을 이해했고, 어떻게 생각했는지. 정답이 없는 나만의 이야기를 적어봐요.')+`<div class="two-col-layout"><section class="panel"><span class="eyeline">${icon('note')} 오늘의 성찰</span><h2>오늘, 수학에서 무엇을 발견했나요?</h2><form id="reflection-form">${[['understood','01','이제 이해했어요','오늘 새롭게 이해한 개념이나 발견한 규칙은 무엇인가요?'],['thinking','02','이렇게 생각했어요','어떤 방법으로 풀었나요? 처음 생각과 달라진 점이 있나요?'],['difficult','03','아직 궁금해요','어려웠던 부분이나 Good쌤과 함께 알아보고 싶은 점을 적어주세요.']].map(([id,n,label,placeholder])=>`<label class="reflection-field"><span><i>${n}</i> ${label}</span><textarea class="field" name="${id}" data-role="reflection-draft" data-field="${id}" rows="3" placeholder="${placeholder}" ${id==='understood'?'required':''}>${esc(drafts[id]||'')}</textarea></label>`).join('')}<div class="row space-between mt-3"><span class="source-note">${icon('lock')} 나와 Good쌤이 함께 보는 기록</span><button class="btn teal" type="submit">${icon('check')} 오늘의 생각 남기기</button></div></form></section><aside><section class="panel writing-guide"><span class="tiny-spark">✦</span><h3>멋진 문장보다<br/>솔직한 생각 한 줄.</h3><p>“처음에는 …라고 생각했는데,<br/>그래프를 움직여 보니 …였어요.”</p><p>“아직 …가 헷갈리지만,<br/>다음에는 …를 해 보고 싶어요.”</p><small>네가 발견한 작은 변화도 충분해.</small></section><section class="panel mt-2"><h3>차곡차곡, ${entries.length}편의 생각</h3>${entries.length?entries.map(r=>`<article class="reflection-entry"><small>${localDate(r.createdAt)} · 함수 탐구</small><h4>${esc(r.understood)}</h4>${r.thinking?`<p><b>나의 생각</b> ${esc(r.thinking)}</p>`:''}${r.difficult?`<p><b>궁금한 점</b> ${esc(r.difficult)}</p>`:''}</article>`).join(''):'<div class="empty-state">아직 첫 페이지가 비어 있어요.<br/>오늘의 발견으로 채워볼까요?</div>'}</section></aside></div>`;
 }
 function board(){
 const questions=data.questions.filter(q=>q.studentId===data.activeId&&(boardFilter==='all'||(boardFilter==='answered'?!!q.reply:!q.reply))).reverse();
 return heading('ASK · CONNECT · DISCOVER','질문에서 시작되는 배움','잘 모르겠다는 말도 좋은 시작이에요. 어디에서 막혔는지 함께 살펴봐요.',button(`${icon('chat')} 질문 남기기`,'new-question','teal'))+`<div class="info-banner">${icon('heart')} 풀이 중에도 ‘이 문제 질문하기’를 누르면 문항 번호와 내 필기를 함께 첨부할 수 있어요.</div><div class="section-row mt-3"><div class="segmented">${[['all','전체 질문'],['waiting','답변 기다리는 중'],['answered','답변 완료']].map(([id,label])=>button(label,'board-filter',boardFilter===id?'selected':'',`data-filter="${id}"`)).join('')}</div><span class="source-note">나의 질문 ${questions.length}개</span></div><section class="panel mt-2">${questions.length?questions.map(q=>`<article class="question-entry"><div class="section-row"><span class="tag ${q.reply?'':'gold'}">${q.reply?'답변 완료':'함께 생각하는 중'}</span><small>${localDate(q.createdAt)} · ${esc(q.number||'개념 질문')}</small></div><h3>${esc(q.title)}</h3><p>${esc(q.body)}</p>${q.drawing?`<details><summary>첨부한 풀이 필기 보기</summary><img class="question-drawing" src="${esc(q.drawing)}" alt="질문에 첨부한 나의 풀이"/></details>`:''}${q.reply?`<div class="reply-box"><b>Good쌤의 답변</b><p>${esc(q.reply)}</p></div>`:''}</article>`).join(''):`<div class="large-empty">${icon('chat')}<h3>${boardFilter==='all'?'첫 번째 궁금증을 들려주세요':'아직 해당하는 질문이 없어요'}</h3><p>질문을 남기면 Good쌤의 답변을 여기에서 확인할 수 있어요.</p>${button('질문 남기기','new-question','soft')}</div>`}</section>`;
 }
 function quiz(){
 if(!game&&quizOwner!==api.state)showQuizTopics(unlockedQuizLevel(api.state));
 const current=quizQuestion;const progress=playProgress(api.state);const record=progress.quiz.stages[quizLevel]?.passed||{};const count=Object.keys(record).length;
 const intro=`<section class="math-play-header" aria-labelledby="math-play-title"><div class="math-play-copy"><span class="math-play-eyebrow">QUIZ · PLAY · DISCOVER</span><h1 id="math-play-title">MATH <span>PLAY</span> LAB</h1><p>퀴즈로 발견하고, 게임으로 익히는 수학.<br/>작은 호기심으로, 오늘도 즐겁게 탐구해요.</p></div><img class="math-play-friends" src="${mathPlayFriends}" width="440" height="250" alt="좌표평면 위의 원, 삼각형, 정육면체 수학 친구들"/><div class="segmented math-play-tabs" role="group" aria-label="학습 방식 선택">${button(`${icon('quiz')} 단계별 개념 퀴즈`,'quiz-mode',!game?'selected':'',`data-mode="quiz" aria-pressed="${!game}"`)}${button(`${icon('target')} 게임으로 배우기`,'quiz-mode',game?'selected':'',`data-mode="game" aria-pressed="${game}"`)}</div></section>`;
 if(game){
  if(arcade)return intro+arcade.html();
  if(!arcadeError)loadArcade();
  return intro+`<section class="panel arc-loading" role="status"><h2>${arcadeError?'게임을 불러오지 못했어요':'수학 플레이 랩을 준비하고 있어요'}</h2><p>${arcadeError?'연결을 확인하고 다시 불러와 주세요.':'곧 함수·집합·명제 아케이드 미니게임이 열려요.'}</p>${arcadeError?button('다시 불러오기','reload-arcade','teal'):''}</section>`;
 }
 const quizIntro=intro+rankingHTML()+quizSteps(api.state,quizLevel);
 if(showCertificate)return quizIntro+certificate(api.state,api.state.studentName||profile().name);
 if(quizNotice)return quizIntro+quizCelebration(quizNotice,api.state,api.state.studentName||profile().name);
 if(!current)return quizIntro+quizTopicPicker(api.state,quizLevel,quizSoundSettings().effects);
 return quizIntro+timedQuizView({question:current,level:quizLevel,topic:quizIndex,selected:quizSelected,result:quizResult,passed:record,seconds:quizClock.seconds,soundEnabled:quizSoundSettings().effects,mastered:!!progress.quiz.masteredAt});
 }
 function teacherHTML(){
 const profiles=data.profiles.filter(p=>p.className===classFilter),student=data.profiles.find(p=>p.id===selectedStudent)||profiles[0]||profile();
 const submitted=profiles.filter(p=>data.submissions.some(s=>s.studentId===p.id)).length;
 const waiting=data.questions.filter(q=>!q.reply&&profiles.some(p=>p.id===q.studentId));
 return heading('GOOD쌤 · TEACHER STUDIO','한눈에 보는 우리 반의 성장','학생의 답 너머, 생각의 과정과 마음을 함께 살펴봐요.',`<select class="field class-select" data-role="class-filter" aria-label="학급 선택">${[...new Set([...data.profiles.map(p=>p.className),...(data.playReports||[]).map(r=>r.learner.className),...(data.courseReports||[]).map(r=>r.learner.className)])].map(c=>`<option ${c===classFilter?'selected':''}>${esc(c)}</option>`).join('')}</select>`)+`<div class="info-banner">${icon('eye')} 교사 미리보기 · ${cloud.configured&&cloud.membership?'로그인한 계정의 학급 기록과 이 기기에 보관한 자료입니다. 저장·학교 계정 연결에서 새로고침할 수 있어요.':'이 브라우저에 등록하거나 가져온 학생 자료가 표시돼요. 기기 간 자동 공유는 학교 계정 연결이 필요합니다.'}</div><div class="teacher-stats"><article class="panel"><span>학급 인원</span><b>${profiles.length}<small>명</small></b></article><article class="panel"><span>학습지 제출</span><b>${submitted}<small> / ${profiles.length}명</small></b></article><article class="panel"><span>답변할 질문</span><b>${waiting.length}<small>개</small></b></article><article class="panel"><span>마음을 살필 학생</span><b>${profiles.filter(p=>snapshot(p.id).mood==='hard').length}<small>명</small></b></article></div><div class="section-row teacher-toolbar"><div class="segmented">${[['journey','8차시 학습 과정'],['resources','수업 학습자료'],['today','오늘의 수업'],['overview','학급 현황'],['records','학생별 자료함'],['questions','질문·피드백'],['play','게임·퀴즈 분석']].map(([id,label])=>button(label,'teacher-tab',teacherTab===id?'selected':'',`data-tab="${id}"`)).join('')}</div><div class="row">${button(`${icon('lock')} ${data.locks[classFilter]?'집중 모드 해제':'수업 집중 모드'}`,'toggle-lock',data.locks[classFilter]?'teal':'light')}${button(`${icon('sheet')} 학습지 배포`,'distribute','teal')}</div></div>${teacherTab==='journey'?journey.teacher():teacherTab==='resources'?journey.resources():teacherTab==='today'?journey.today():teacherTab==='play'?teacherPlayDashboard(playEntries(classFilter),playStudentId):teacherTab==='overview'?`<section class="panel"><div class="section-row"><h3>학생별 진도와 제출 현황</h3>${button(`${icon('download')} 현황 CSV`,'teacher-export','light small')}</div><div class="table-scroll"><table class="student-table"><thead><tr><th>학생</th><th>개념 탐구</th><th>문제 해결</th><th>제출 상태</th><th>오늘의 마음</th><th>자료</th></tr></thead><tbody>${profiles.map(p=>{const s=snapshot(p.id),t=totals(s);return `<tr><td><span class="avatar small-avatar">${esc((s.studentName||p.name).slice(0,1))}</span> ${esc(s.studentName||p.name)}</td><td><span class="table-progress"><i style="width:${t.concepts/6*100}%"></i></span>${t.concepts}/6</td><td>${t.correct}/${api.totalQuestionCount}</td><td><span class="tag ${data.submissions.some(sub=>sub.studentId===p.id)?'':'gold'}">${data.submissions.some(sub=>sub.studentId===p.id)?'제출 완료':'미제출'}</span></td><td>${({great:'😆 신나요',good:'🙂 좋아요',okay:'😐 보통',hard:'😔 살펴주세요'})[s.mood]||'아직 확인 전'}</td><td>${button('살펴보기','student-record','light small',`data-student="${p.id}"`)}</td></tr>`;}).join('')}</tbody></table></div><p class="source-note mt-2">미제출: ${profiles.filter(p=>!data.submissions.some(s=>s.studentId===p.id)).map(p=>esc(snapshot(p.id).studentName||p.name)).join(', ')||'모두 제출했어요'}</p></section><section class="panel mt-2"><div class="section-row"><h3>학급에 배포한 학습지</h3><span class="source-note">${esc(classFilter)} · 공통수학2</span></div>${data.worksheets.filter(w=>w.className===classFilter).map(w=>`<div class="assignment-row"><span class="stat-icon mint">${icon('sheet')}</span><div><b>${esc(w.title)}</b><small>${esc(w.subject)} · ${localDate(w.createdAt)} 배포</small></div><span class="tag">학습 중</span></div>`).join('')||'<p>배포된 학습지가 없어요.</p>'}</section>`:teacherTab==='records'?studentRecords(student):`<div class="two-col-layout"><section class="panel"><h3>답변을 기다리는 질문</h3>${waiting.length?waiting.map(q=>`<article class="question-entry"><small>${esc(snapshot(q.studentId).studentName||data.profiles.find(p=>p.id===q.studentId)?.name)} · ${esc(q.number||'개념 질문')}</small><h3>${esc(q.title)}</h3><p>${esc(q.body)}</p>${q.drawing?`<img class="question-drawing" src="${esc(q.drawing)}" alt="학생이 첨부한 풀이 필기"/>`:''}<form class="reply-form" data-question="${q.id}"><label class="field-label" for="reply-${q.id}">Good쌤의 답변</label><textarea class="field" id="reply-${q.id}" name="reply" required placeholder="학생이 다음 생각을 이어갈 수 있도록 도와주세요."></textarea><button class="btn teal small mt-1" type="submit">답변 남기기</button></form></article>`).join(''):'<div class="empty-state">기다리는 질문이 없어요.</div>'}</section><section class="panel"><h3>격려와 피드백 전하기</h3><form id="feedback-form"><label class="field-label" for="feedback-student">학생</label><select class="field" id="feedback-student" name="student">${profiles.map(p=>`<option value="${p.id}">${esc(snapshot(p.id).studentName||p.name)}</option>`).join('')}</select><label class="field-label mt-2" for="feedback-text">학습 피드백과 응원</label><textarea class="field" id="feedback-text" name="text" rows="5" required placeholder="관찰한 풀이 과정, 다시 생각할 점, 따뜻한 격려를 함께 적어주세요."></textarea><button class="btn teal mt-2" type="submit">학생 홈에 피드백 남기기</button></form><p class="source-note mt-2">학생 홈의 ‘Good쌤의 한마디’에 바로 표시됩니다.</p></section></div>`}`;
 }
 function activityEvidence(id,record){
 const q=api.allQuestions.find(item=>item.id===id);if(!q?.widget)return '';
 const responses=q.fields.filter(field=>record.responses?.[field.key]!==undefined).map(field=>{const value=record.responses[field.key];const show=v=>{const option=field.options?.find(option=>(typeof option==='string'?option:option.value)===v);return typeof option==='object'?(option.tex?math(option.tex):esc(option.label)):esc(v);};return `<p><b>${esc(field.label)}</b> · ${Array.isArray(value)?value.length?value.map(show).join(', '):'∅':show(value)}</p>`;}).join('');
 const settings=Object.entries(record.lab||{}).filter(([key,value])=>typeof value==='number'&&key!=='step'&&key!=='stage').map(([key,value])=>`${esc(key)}=${Math.round(value*1000)/1000}`).join(' · ');
 return `<div class="teacher-activity-evidence"><span class="tag">${record.reviewRequested?'서술 확인 대기':record.correct?'해결':'탐구 중'}</span> ${esc(q.source)}${responses}${renderSetLogicEvidence(q,record)}${settings?`<p>탐구한 설정 · ${settings}</p>`:''}<small>서로 다른 설정 ${record.trials?.length||0}가지 · 답 확인 ${record.attempts||0}회</small></div>`;
 }
 function studentRecords(p){
 const s=snapshot(p.id),records=data.observations.filter(o=>o.studentId===p.id),reflections=data.reflections.filter(r=>r.studentId===p.id),questions=data.questions.filter(q=>q.studentId===p.id),answers=Object.entries(s.answers||{}).filter(([,a])=>a.observation||a.explanation||a.drawing||a.mathDraft||a.attempts||a.lab||a.responses);
 return `<section class="panel"><div class="section-row"><div><span class="eyeline">${icon('folder')} 학생별 자료함</span><h2>${esc(s.studentName||p.name)}의 생각과 성장</h2></div><select class="field class-select" data-role="record-student" aria-label="자료를 볼 학생">${data.profiles.filter(p=>p.className===classFilter).map(other=>`<option value="${other.id}" ${p.id===other.id?'selected':''}>${esc(snapshot(other.id).studentName||other.name)}</option>`).join('')}</select></div><div class="evidence-grid"><div><h3>풀이 과정 · ${answers.length}개</h3>${answers.length?answers.map(([id,a])=>`<article class="evidence-item"><b>${esc(api.allQuestions.find(q=>q.id===id)?.title||'함수 탐구')}</b><p>${esc(a.observation||'')}</p><p>${esc(a.explanation||'')}</p>${activityEvidence(id,a)}${a.reviewRequested?button('서술 검토 완료','approve-written-answer','soft small',`data-student="${p.id}" data-question="${id}"`):''}${a.mathDraft?`<div class="record-math">${math(a.mathDraft)}</div>`:''}${a.drawing?`<img class="question-drawing" src="${esc(a.drawing)}" alt="학생의 풀이 필기"/>`:''}<small>${id.includes('-p')?(a.reviewed?'학습 완료':'학습 중'):`${a.attempts||0}회 시도 · 힌트 ${a.hintsViewed||0}단계`}</small></article>`).join(''):'<p class="empty-state">아직 기록된 풀이가 없어요.</p>'}<h3 class="mt-3">관찰기록</h3>${records.map(o=>`<article class="evidence-item"><span class="tag">${esc(o.kind)}</span><p>${esc(o.text)}</p><small>${esc(o.source)}</small></article>`).join('')||'<p class="empty-state">학습 과정이 여기에 모여요.</p>'}<form id="observation-form" data-student="${p.id}"><label class="field-label" for="observation-teacher">교사 관찰 추가</label><textarea class="field" id="observation-teacher" name="text" required placeholder="수업 중 관찰한 구체적인 행동을 적어주세요."></textarea><button class="btn light small mt-1" type="submit">관찰 저장</button></form></div><div><h3>수다노트 · ${reflections.length}편</h3>${reflections.map(r=>`<article class="evidence-item"><small>${localDate(r.createdAt)}</small><p><b>이해</b> ${esc(r.understood)}</p><p><b>사고</b> ${esc(r.thinking)}</p><p><b>어려움</b> ${esc(r.difficult)}</p></article>`).join('')||'<p class="empty-state">아직 수다노트가 없어요.</p>'}<h3 class="mt-3">질문 기록 · ${questions.length}개</h3>${questions.map(q=>`<article class="evidence-item"><b>${esc(q.title)}</b><p>${esc(q.body)}</p></article>`).join('')||'<p class="empty-state">아직 질문이 없어요.</p>'}</div></div><div class="record-generator"><div class="section-row"><div><span class="eyeline">${icon('spark')} 생기부 생성기</span><h3>기록에 근거한 세특 초안</h3></div>${button('자료로 초안 만들기','generate-record','teal',`data-student="${p.id}"`)}</div><p class="source-note">학생이 남긴 실제 기록을 정리합니다. 교사가 내용을 검토하고 수정한 뒤 사용해 주세요.</p><label class="sr-only" for="record-draft">세특 초안</label><textarea class="field" id="record-draft" rows="5" placeholder="학생의 풀이·성찰·질문이 쌓이면 근거를 담은 초안을 만들 수 있어요.">${esc(s.reportDraft||'')}</textarea>${button(`${icon('download')} 초안 내려받기`,'download-record','light small mt-1')}</div></section>`;
 }
 function worksheets(){
 const allItems=data.worksheets.filter(w=>w.className===profile().className);
 const items=allItems.filter(w=>worksheetFilter==='all'||(getWorkbook(w.contentId||w.id)?.subject||'function')===worksheetFilter);
 return heading('WRITE · EXPLAIN · REFLECT','나만의 디지털 학습지','단원을 선택하고, 개념부터 문제 풀이까지 나의 생각을 남겨요.')+`<div class="worksheet-filters">${[['all','전체'],['function','함수'],['sets','집합'],['logic','명제']].map(([id,label])=>button(label,'worksheet-filter',worksheetFilter===id?'soft small':'light small',`data-filter="${id}"`)).join('')}</div><div class="worksheet-list">${items.map(w=>{
 const workbook=getWorkbook(w.contentId||w.id),submitted=data.submissions.find(s=>s.studentId===data.activeId&&s.worksheetId===w.id),completed=workbook?workbookProgress(workbook,api.state):baseCorrect();
 const description=workbook?`${workbook.activities.length}개 문항별 탐구 · 직접 조작 · 즉시 피드백 · 교과서 ${workbook.textbook}`:'16개 탐구 문항 · 단계별 힌트 · 수식 키패드 · 펜 필기';
 return `<section class="panel worksheet-card"><span class="stat-icon ${workbook?.color||'mint'}">${icon('sheet')}</span><div class="worksheet-card-body"><div class="row"><span class="tag ${submitted?'':'gold'}">${submitted?'제출 완료':completed?'학습 중':'학습 전'}</span><small>${esc(w.subject)} · ${esc(w.className)}</small></div><h2>${esc(w.title)}</h2><p>${description}</p>${workbook?`<p class="worksheet-topics">${workbook.topics.map(esc).join(' · ')}</p>`:''}${w.note?`<p>${esc(w.note)}</p>`:''}<small>${workbook?`해결 ${completed} / ${workbook.activities.length}문항`:`해결한 문제 ${completed} / 16문제`}${w.due?` · ${esc(w.due)}까지`:''}</small></div><div class="worksheet-card-actions">${button(`${submitted?'다시 살펴보기':'학습지 열기'} ${icon('arrow')}`,'open-workbook','teal',`data-id="${esc(w.id)}"`)}${workbook?.gameId?(workbook.gameLinks||[{id:workbook.gameId,label:'단원 게임'}]).map(link=>button(icon('target')+' '+esc(link.label),'workbook-game','soft small',`data-game="${link.id}"`)).join(''):''}${workbook?`<a class="text-button" href="${workbookPDF(workbook)}" target="_blank" rel="noopener">${icon('eye')} 원본 PDF</a>`:''}</div></section>`;
 }).join('')||'<section class="panel empty-state">아직 배포된 학습지가 없어요. 개념 탐구부터 시작해 볼까요?</section>'}</div>`;
 }
 function openContent(contentId,view='practice'){const assignment=data.worksheets.find(w=>w.className===profile().className&&(w.contentId||w.id)===contentId);api.state.workbookId=contentId;api.state.worksheetId=assignment?.id||contentId;nav(view);}
 function modalHTML(){
 let title='',body='';
 if(modal.type==='question'){
 const q=modal.question;title='궁금한 점을 들려주세요';body=`<form id="question-form"><label class="field-label" for="question-number">관련 문항</label><select class="field" name="number" id="question-number"><option value="">함수 개념 질문</option>${api.questions.map((item,i)=>`<option value="${item.id}" ${q?.id===item.id?'selected':''}>${i+1}번 · ${esc(item.title)}</option>`).join('')}</select><label class="field-label mt-2" for="question-title">질문 제목</label><input class="field" name="title" id="question-title" required maxlength="100" placeholder="예: 공역과 치역은 어떻게 다른가요?"/><label class="field-label mt-2" for="question-body">어디까지 생각해 보았나요?</label><textarea class="field" name="body" id="question-body" required rows="5" placeholder="내가 생각한 방법과 막힌 부분을 함께 적어주세요.">${esc(q?api.state.answers[q.id]?.observation||'':'')}</textarea>${q&&api.state.answers[q.id]?.drawing?`<label class="row mt-2"><input type="checkbox" name="drawing" checked/> 이 문항의 풀이 필기 함께 첨부</label>`:''}<p class="source-note mt-2">질문은 이 브라우저의 교사 미리보기에서 확인할 수 있어요.</p><button type="submit" class="btn teal block mt-2">질문 게시판에 남기기</button></form>`;
 }else if(modal.type==='profile'||modal.type==='add-student'){
 title=modal.type==='profile'?'나의 학습 프로필':'새 학생 등록';body=`${modal.type==='profile'?`<label class="field-label" for="profile-switch">이 브라우저의 학습 프로필</label><select class="field mb-3" id="profile-switch" data-role="switch-student">${data.profiles.map(p=>`<option value="${p.id}" ${p.id===data.activeId?'selected':''}>${esc(p.name)} · ${esc(p.className)}</option>`).join('')}</select>`:''}<form id="profile-form" data-new="${modal.type==='add-student'}"><label class="field-label" for="profile-name">이름 또는 별명</label><input class="field" id="profile-name" name="name" required maxlength="24" value="${modal.type==='profile'?esc(api.state.studentName||profile().name):''}" placeholder="예: 김하늘"/><label class="field-label mt-2" for="profile-class">학급</label><input class="field" id="profile-class" name="className" required maxlength="30" value="${esc(profile().className)}"/><p class="source-note mt-2">기록은 기기에 저장됩니다. 프로필 전환은 로그인 기능이 아니에요.</p><button class="btn teal block mt-2" type="submit">${modal.type==='profile'?'프로필 저장':'학생 등록하고 시작'}</button></form>${modal.type==='profile'?button('새 학생 추가','add-student','light block mt-1'):''}`;
 }else if(modal.type==='feedback'){
 title='Good쌤이 전하는 이야기';const items=getFeedback();body=items.length?items.map(f=>`<article class="evidence-item"><small>${localDate(f.createdAt)} · Good쌤</small><p>${esc(f.text)}</p></article>`).join(''):`<div class="empty-state">아직 도착한 피드백이 없어요.<br/>오늘의 발견을 학습지에 남겨볼까요?</div>`;
 }else if(modal.type==='distribute'){
 title='우리 반에 학습지 배포하기';body=`<form id="distribute-form"><label class="field-label" for="dist-content">학습 내용</label><select class="field" name="contentId" id="dist-content" data-role="distribute-content"><option value="first">함수의 뜻과 그래프 · 16문항</option>${WORKBOOKS.map(workbook=>`<option value="${workbook.id}">${workbook.title} · ${workbook.activities.length}문항</option>`).join('')}</select><label class="field-label mt-2" for="dist-title">학습지 제목</label><input class="field" name="title" id="dist-title" value="함수의 뜻과 그래프 · 탐구 학습지" required maxlength="100"/><label class="field-label mt-2" for="dist-class">배포 학급</label><select class="field" name="className" id="dist-class">${[...new Set([...data.profiles.map(p=>p.className),...(data.playReports||[]).map(r=>r.learner.className),...(data.courseReports||[]).map(r=>r.learner.className)])].map(c=>`<option ${c===classFilter?'selected':''}>${esc(c)}</option>`).join('')}</select><label class="field-label mt-2" for="dist-due">제출일 (선택)</label><input class="field" type="date" name="due" id="dist-due"/><label class="field-label mt-2" for="dist-note">학생에게 안내</label><textarea class="field" id="dist-note" name="note" placeholder="풀이 이유를 꼭 기록해 주세요."></textarea><p class="source-note mt-2">선택한 단원의 학습 내용을 활용합니다. 배포하면 이 브라우저에 등록한 해당 학급 학생의 학습지 목록에 표시됩니다.</p><button class="btn teal block" type="submit">학습지 배포</button></form>`;
 }else if(modal.type==='submit'){
 title='오늘의 생각을 제출할까요?';const t=totals(),workbook=getWorkbook(api.state.workbookId);body=`<p>${workbook?`${esc(workbook.title)} · 해결 ${workbookProgress(workbook,api.state)} / ${workbook.activities.length}문항`:`개념 ${t.concepts}/6개 · 해결한 문제 ${t.correct}/${api.totalQuestionCount}개`}</p><p>풀이 과정과 필기까지 Good쌤의 학생별 자료함에 남겨요. 제출 후에도 다시 살펴보고 수정할 수 있어요.</p><form id="submit-form"><label class="field-label" for="submit-message">Good쌤에게 한마디 (선택)</label><textarea class="field" name="message" id="submit-message" placeholder="더 알고 싶은 것이나 노력한 점을 적어주세요."></textarea><button class="btn teal block mt-2" type="submit">학습지 제출하기</button></form>`;
 }
 return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="section-row"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="닫기">${icon('close')}</button></div>${body}</section></div>`;
 }
 function openModal(value){modal=value;refresh();requestAnimationFrame(()=>document.querySelector('.modal input:not([type=checkbox]),.modal select,.modal button')?.focus());}
 function generateRecord(id){
 const s=snapshot(id),name=s.studentName||data.profiles.find(p=>p.id===id)?.name||'학생';
 const answers=Object.entries(s.answers||{}).filter(([,a])=>a.observation?.trim()||a.explanation?.trim()),refs=data.reflections.filter(r=>r.studentId===id),qs=data.questions.filter(q=>q.studentId===id),obs=data.observations.filter(o=>o.studentId===id&&o.kind==='교사 관찰');
 if(!answers.length&&!refs.length&&!qs.length&&!obs.length){toast('초안을 만들기 위한 풀이·성찰·질문 기록을 먼저 남겨주세요.');return;}
 const parts=[];
 for(const [qid,a] of answers.slice(-3)){const title=api.allQuestions.find(q=>q.id===qid)?.title||'함수 탐구';parts.push(`${title} 활동에서 “${(a.explanation||a.observation).trim()}”라고 자신의 사고 과정을 기록함.`);}
 for(const ref of refs.slice(-2)){parts.push(`학습 후 “${ref.understood.trim()}”라고 이해한 내용을 정리함.`);if(ref.difficult?.trim())parts.push(`“${ref.difficult.trim()}”를 추가 탐구할 질문으로 남김.`);}
 for(const q of qs.slice(-2))parts.push(`“${q.title}”라는 질문을 남기고 “${q.body}”라고 자신이 막힌 지점을 설명함.`);
 for(const o of obs.slice(-2))parts.push(`교사 관찰: ${o.text}`);
 const draft=`${name}은/는 공통수학2에서 다음과 같은 학습 과정을 보임. ${parts.join(' ')}`;
 document.getElementById('record-draft').value=draft;storeStudentDraft(id,draft);toast('실제 기록을 바탕으로 초안을 만들었어요. 문장을 검토해 주세요.');
 }
 function storeStudentDraft(id,text){if(id===data.activeId){api.state.reportDraft=text;api.save();}else{const s=snapshot(id);s.reportDraft=text;try{localStorage.setItem(studentStorageKey(id),JSON.stringify(s));}catch{toast('초안을 저장하지 못했어요. 내려받기를 이용해 주세요.');}}}
 function action(action,el){
 if(cloud.action(action,el))return true;
 if(journey.action(action,el))return true;
 if(arcade?.action(action,el))return true;
 switch(action){
 case 'space-nav':teacher=false;nav(el.dataset.view);return true;
 case 'start-concept':case 'go-concept':teacher=false;openContent('first','concept');return true;
 case 'go-explore':teacher=false;nav('explore');return true;
 case 'go-welcome':teacher=false;return false;
 case 'mobile-menu':menuOpen=!menuOpen;refresh();return true;
 case 'toggle-teacher':if(cloud.configured&&!cloud.isTeacher()){teacher=false;nav('connection');toast('등록된 교사 계정으로 로그인해 주세요.');return true;}teacher=!teacher;menuOpen=false;classFilter=profile().className;refresh();return true;
 case 'unlock-preview':if(cloud.configured&&!cloud.isTeacher()){nav('connection');return true;}teacher=true;refresh();return true;
 case 'profile':openModal({type:'profile'});return true;
 case 'add-student':openModal({type:'add-student'});return true;
 case 'close-modal':modal=null;refresh();return true;
 case 'notifications':if(getFeedback().length)openModal({type:'feedback'});else nav('summary');return true;
 case 'set-mood':api.state.mood=el.dataset.mood;api.state.moodAt=new Date().toISOString();api.save();refresh();return true;
 case 'open-course':{const contentId=({concept:'first',compose:'composition',rational:'rational',radical:'radical',sets:'sets-basics',logic:'propositions'})[el.dataset.type]||'first';openContent(contentId,contentId==='first'?'concept':'practice');return true;}
 case 'graph-type':graph.type=el.dataset.type;if(['rational','inverse'].includes(graph.type)&&!graph.a)graph.a=1;api.state.explorer={...graph};api.save();refresh();return true;
 case 'reset-graph':graph={...graph,a:1,h:0,k:0};api.state.explorer={...graph};api.save();updateExplorer(graph);return true;
 case 'new-question':openModal({type:'question',question:api.state.view==='practice'?api.getQuestion():null});return true;
 case 'board-filter':boardFilter=el.dataset.filter;refresh();return true;
 case 'worksheet-filter':worksheetFilter=el.dataset.filter;refresh();return true;
 case 'workbook-game':teacher=false;game=true;pendingGame=el.dataset.game;if(arcade){arcade.open(pendingGame);pendingGame=null;}nav('quiz');return true;
 case 'approve-written-answer':{if(!teacher)return true;const id=el.dataset.student,s=snapshot(id),r=s.answers?.[el.dataset.question];if(!r?.reviewRequested)return true;r.correct=true;r.reviewRequested=false;r.feedback='Good쌤이 서술 내용을 확인했어요.';r.teacherReviewedAt=new Date().toISOString();if(id===data.activeId)api.save();else localStorage.setItem(studentStorageKey(id),JSON.stringify(s));refresh();return true;}
 case 'reload-arcade':loadArcade();refresh();return true;
 case 'quiz-mode':stopQuizTimer();game=el.dataset.mode==='game';if(!game)showQuizTopics();refresh();return true;
 case 'quiz-topics':showQuizTopics();refresh();return true;
 case 'quiz-toggle-sound':{const settings=quizSoundSettings();quizAudio.updateSettings({effects:!settings.effects});refresh();return true;}
 case 'quiz-open':game=false;openQuiz(Number(el.dataset.index));refresh();return true;
 case 'quiz-new':openQuiz();refresh();return true;
 case 'quiz-select':quizSelected=Number(el.dataset.index);quizResult=null;refresh();return true;
 case 'quiz-retry':quizSelected=null;quizResult=null;refresh();return true;
 case 'quiz-check':{
 if(!quizQuestion||quizSelected===null||quizResult)return true;stopQuizTimer();const current=quizQuestion;const ok=quizSelected===current.answer;
 const outcome=recordQuizAttempt(api.state,{level:quizLevel,topic:quizIndex,question:current.q,selected:current.options[quizSelected],correct:ok,seconds:Math.max(0,quizClock.seconds-quizRecordedSeconds)});quizRecordedSeconds=quizClock.seconds;
 if(outcome.completed){quizNotice={level:quizLevel,mastered:outcome.mastered,points:outcome.points};}
 quizResult={ok,message:ok?current.why:'한 번 더 생각해 봐요. '+current.why};
 if(ok){api.state.quizAnswers={...api.state.quizAnswers,[quizIndex]:{correct:true,at:new Date().toISOString(),question:current.q,selected:current.options[quizSelected]}};}api.save();refresh();if(outcome.completed)fanfare(outcome.mastered);else quizFeedbackSound(ok);return true;}
 case 'quiz-next':{const passed=playProgress(api.state).quiz.stages[quizLevel]?.passed||{};const remaining=quizItems.map((_,i)=>i).filter(i=>!passed[i]);if(remaining.length)openQuiz(remaining[Math.floor(Math.random()*remaining.length)]);else showQuizTopics();refresh();return true;}
 case 'quiz-level':showQuizTopics(Number(el.dataset.level));refresh();return true;
 case 'quiz-advance':showQuizTopics(Number(el.dataset.level));refresh();return true;
 case 'quiz-certificate':if(playProgress(api.state).quiz.masteredAt){showCertificate=true;quizNotice=null;refresh();}return true;
 case 'quiz-review-master':showQuizTopics(5);refresh();return true;
 case 'quiz-fanfare':fanfare(quizNotice?.mastered||showCertificate);return true;
 case 'play-export':{const report=createPlayReport(api.state,profile());api.save();saveDownload(JSON.stringify(report,null,2),'MATH_PLAY_LAB_학습기록.json','application/json');return true;}
 case 'play-student':playStudentId=el.dataset.id;teacherTab='play';refresh();return true;
 case 'play-teacher-refresh':data=loadSpace();refresh();return true;
 case 'play-teacher-csv':{const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[['학급','학생','순위','LP','참여상태','현재활동','퀴즈완료단계','잘하는부분','지원신호'],...rankLearners(playEntries(classFilter)).map(r=>[classFilter,r.name,r.rank,r.points,r.summary.status,r.summary.current,r.summary.stages,r.summary.strengths.map(([t])=>t).join('·'),r.summary.needsHelp.map(([t])=>t).join('·')])];saveDownload('\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n'),'MATH_PLAY_LAB_학급현황.csv','text/csv;charset=utf-8');return true;}
 case 'teacher-tab':teacherTab=el.dataset.tab;refresh();return true;
 case 'student-record':selectedStudent=el.dataset.student;teacherTab='records';refresh();return true;
 case 'toggle-lock':data.locks[classFilter]=!data.locks[classFilter];persist();refresh();toast(data.locks[classFilter]?'이 브라우저의 해당 학급 학습 화면을 잠갔어요.':'집중 모드를 해제했어요.');return true;
 case 'distribute':openModal({type:'distribute'});return true;
 case 'generate-record':generateRecord(el.dataset.student);return true;
 case 'download-record':saveDownload(document.getElementById('record-draft').value,'Good쌤_세특초안.txt','text/plain;charset=utf-8');return true;
 case 'teacher-export':{
 const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[['학급','이름','완료개념','해결문항','제출상태','기분'],...data.profiles.filter(p=>p.className===classFilter).map(p=>{const s=snapshot(p.id),t=totals(s);return [p.className,s.studentName||p.name,t.concepts,t.correct,data.submissions.some(sub=>sub.studentId===p.id)?'제출':'미제출',s.mood||'미확인'];})];saveDownload('\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n'),'Good쌤_학급현황.csv','text/csv;charset=utf-8');return true;}
 case 'submit-worksheet':openModal({type:'submit'});return true;
 case 'open-workbook':{const assignment=data.worksheets.find(w=>w.id===el.dataset.id);if(assignment){api.state.worksheetId=assignment.id;api.state.workbookId=assignment.contentId||getWorkbook(assignment.id)?.id||'first';nav('practice');}return true;}
 case 'open-content':openContent(el.dataset.workbook);return true;
 case 'math-key':{
 const input=document.getElementById('math-input');if(!input)return true;const start=input.selectionStart,end=input.selectionEnd,value=el.dataset.value;input.setRangeText(value,start,end,'end');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();return true;}
 default:return false;
 }
 }
 document.addEventListener('submit',event=>{
 const form=event.target,fd=new FormData(form);if(!['reflection-form','question-form','profile-form','feedback-form','distribute-form','observation-form','submit-form'].includes(form.id)&&!form.classList.contains('reply-form'))return;
 event.preventDefault();const now=new Date().toISOString();data=loadSpace();
 if(form.id==='reflection-form'){
 const understood=String(fd.get('understood')).trim();if(!understood){toast('오늘 이해한 내용을 한 줄 남겨주세요.');return;}
 data.reflections.push({id:crypto.randomUUID(),studentId:data.activeId,createdAt:now,understood,thinking:String(fd.get('thinking')).trim(),difficult:String(fd.get('difficult')).trim()});api.state.reflectionDraft={};api.save();persist();toast('오늘의 발견을 소중히 남겼어요.');
 }else if(form.id==='question-form'){
 const q=api.questions.find(item=>item.id===fd.get('number'));const selected=modal.question;
 data.questions.push({id:crypto.randomUUID(),studentId:data.activeId,title:String(fd.get('title')).trim(),body:String(fd.get('body')).trim(),number:q?`${getWorkbook(api.state.workbookId)?.title||'함수의 뜻과 그래프'} · ${q.title}`:'',drawing:fd.get('drawing')&&selected?api.state.answers[selected.id]?.drawing:'',createdAt:now});modal=null;persist();api.state.view='board';api.save();toast('궁금한 점을 질문 게시판에 남겼어요.');
 }else if(form.id==='profile-form'){
 const name=String(fd.get('name')).trim(),className=String(fd.get('className')).trim();if(!name||!className){toast('이름과 학급을 입력해 주세요.');return;}
 if(form.dataset.new==='true'){const id=crypto.randomUUID();data.profiles.push({id,name,className});data.activeId=id;persist();api.switchStudent(id);api.state.studentName=name;}else{Object.assign(profile(),{name,className});api.state.studentName=name;}
 api.save();persist();data=loadSpace();modal=null;toast('프로필을 저장했어요.');
 }else if(form.id==='feedback-form'){
 data.feedback.push({id:crypto.randomUUID(),studentId:String(fd.get('student')),text:String(fd.get('text')).trim(),createdAt:now});persist();toast('학생 홈에 피드백을 남겼어요.');
 }else if(form.classList.contains('reply-form')){
 const q=data.questions.find(q=>q.id===form.dataset.question);if(q){q.reply=String(fd.get('reply')).trim();q.repliedAt=now;}persist();toast('답변을 남겼어요.');
 }else if(form.id==='distribute-form'){
 data.worksheets.push({id:crypto.randomUUID(),contentId:String(fd.get('contentId')||'first'),title:String(fd.get('title')).trim(),className:String(fd.get('className')),subject:'공통수학2',due:String(fd.get('due')),note:String(fd.get('note')).trim(),createdAt:now});modal=null;persist();toast('학급의 디지털 학습지 목록에 배포했어요.');
 }else if(form.id==='observation-form'){
 data.observations.push({id:crypto.randomUUID(),studentId:form.dataset.student,kind:'교사 관찰',source:'수업 관찰',text:String(fd.get('text')).trim(),createdAt:now});persist();toast('관찰기록을 저장했어요.');
 }else if(form.id==='submit-form'){
 const worksheetId=api.state.worksheetId||data.worksheets.find(w=>w.className===profile().className)?.id||'first';
 const old=data.submissions.find(s=>s.studentId===data.activeId&&s.worksheetId===worksheetId);const submission={studentId:data.activeId,worksheetId,createdAt:now,message:String(fd.get('message')).trim(),snapshot:structuredClone(api.state)};if(old)Object.assign(old,submission);else data.submissions.push(submission);
 if(submission.message)data.observations.push({id:crypto.randomUUID(),studentId:data.activeId,kind:'학생의 한마디',source:'학습지 제출',text:submission.message,createdAt:now});modal=null;persist();toast('풀이와 생각을 학습지에 담아 제출했어요.');
 }
 refresh();
 });
 document.addEventListener('input',event=>{
 const el=event.target,role=el.dataset.role;
 if(role==='reflection-draft'){api.state.reflectionDraft={...api.state.reflectionDraft,[el.dataset.field]:el.value};api.save();}
 if(role==='explore-param'){
 let value=Number(el.value);if(el.dataset.param==='a'&&!value&&['rational','inverse'].includes(graph.type))value=graph.a>0?-.5:.5;graph[el.dataset.param]=value;api.state.explorer={...graph};api.save();updateExplorer(graph);
 }
 if(role==='math-answer'){const r=api.state.answers[api.getQuestion().id]||(api.state.answers[api.getQuestion().id]={});r.mathDraft=el.value;api.save();document.getElementById('math-preview').innerHTML=el.value?math(el.value):'<span class="source-note">수식을 누르면 여기에 보여요</span>';}
 if(el.id==='record-draft')storeStudentDraft(selectedStudent,el.value);
 });
 document.addEventListener('change',async event=>{
 const el=event.target,role=el.dataset.role;
 if(role==='play-import'&&teacher){let added=0;try{for(const file of el.files){if(file.size>2000000)throw Error('2MB 이하의 파일을 선택해 주세요.');const report=parsePlayReport(await file.text());data.playReports||=[];if(mergePlayReports(data.playReports,report))added++;}persist();toast(`${added}개의 새 학습 기록을 반영했어요.`);}catch(error){toast(error.message||'기록 파일을 확인해 주세요.');}refresh();return;}
 if(role==='distribute-content')document.getElementById('dist-title').value=`${getWorkbook(el.value)?.title||'함수의 뜻과 그래프'} · 탐구 학습지`;
 if(role==='original-graph'){graph.original=el.checked;api.state.explorer={...graph};api.save();updateExplorer(graph);}
 if(role==='class-filter'){classFilter=el.value;selectedStudent=data.profiles.find(p=>p.className===classFilter)?.id;refresh();}
 if(role==='record-student'){selectedStudent=el.value;refresh();}
 if(role==='switch-student'){if(cloud.configured&&cloud.membership&&el.value!=='cloud:'+cloud.membership.user_id){toast('학교 계정 모드에서는 로그인한 계정의 프로필을 사용해 주세요.');return;}api.save();data.activeId=el.value;persist();api.switchStudent(el.value);modal=null;teacher=false;graph={type:'square',a:1,h:1,k:-1,original:true,...api.state.explorer};refresh();}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopQuizTimer();quizAudio?.stop();}syncQuizTimer();});
 window.addEventListener('blur',()=>{quizWindowFocused=false;stopQuizTimer();quizAudio?.stop();syncQuizTimer();});
 window.addEventListener('focus',()=>{quizWindowFocused=true;syncQuizTimer();});
 window.addEventListener('pagehide',()=>{stopQuizTimer();quizAudio?.stop();});
 let drag=null;
 document.addEventListener('pointerdown',event=>{
 const plot=event.target.closest('#explore-plot');if(!plot||['compose','inverse'].includes(graph.type))return;
 // A graph can be moved from anywhere in its plot; sliders provide a keyboard alternative.
 drag=plot;plot.setPointerCapture(event.pointerId);moveGraph(event);event.preventDefault();
 });
 function moveGraph(event){if(!drag)return;const rect=drag.getBoundingClientRect();const compact=drag.dataset.compact==='true',H=compact?260:390,scale=compact?31:39;const x=((event.clientX-rect.left)/rect.width*680-340)/scale,y=(H/2-(event.clientY-rect.top)/rect.height*H)/scale;graph.h=Math.max(-4,Math.min(4,Math.round((x-(graph.type==='rational'?1:0))*2)/2));graph.k=Math.max(-4,Math.min(4,Math.round((y-(graph.type==='rational'?graph.a:0))*2)/2));updateExplorer(graph);}
 document.addEventListener('pointermove',moveGraph);
 const finishDrag=()=>{if(drag){api.state.explorer={...graph};api.save();drag=null;}};
 document.addEventListener('pointerup',finishDrag);document.addEventListener('pointercancel',finishDrag);
 document.addEventListener('keydown',event=>{
 if(!modal)return;if(event.key==='Escape'){modal=null;refresh();return;}
 if(event.key==='Tab'){const nodes=[...document.querySelectorAll('.modal button,.modal input,.modal select,.modal textarea')].filter(e=>!e.disabled);const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 });
 window.addEventListener('storage',event=>{if(event.key===SPACE_KEY){data=loadSpace();refresh();}else if(event.key?.startsWith(LEARN_KEY)){if(event.key===studentStorageKey(data.activeId))api.reloadStudent();if(teacher)refresh();}});
 return {shell,home:journey.home,journey:journey.lesson,resources:journey.resources,today:journey.today,connection:cloud.view,action,reflection,board,quiz,worksheets,explore:()=>heading('MOVE · NOTICE · UNDERSTAND','함수, 손끝으로 발견하기','슬라이더와 점을 움직여 변화를 관찰하고, 발견한 규칙을 내 언어로 설명해요.')+explorerHTML(graph)+`<section class="panel mt-2"><h3>Good쌤의 탐구 질문</h3><p>같은 함수에서 a의 부호를 바꾸면 그래프는 어떻게 변하나요? h와 k를 바꾸었을 때의 차이도 비교해 보세요.</p><div class="row">${button('발견한 규칙 수다노트에 남기기','space-nav','teal','data-view="reflection"')}${button('관련 개념 퀴즈 풀기','space-nav','light','data-view="quiz"')}</div></section>`,saveObservation,exportData:()=>({journey:journey.exportState(),playLab:playProgress(api.state),arcadeRecords:api.state.arcadeRecords||{},reflections:data.reflections.filter(r=>r.studentId===data.activeId),questions:data.questions.filter(q=>q.studentId===data.activeId),feedback:getFeedback()}),worksheetTools:()=>`<div class="worksheet-toolbar"><button class="text-button" data-action="space-nav" data-view="worksheets">${icon('sheet')} 나의 학습지 목록</button><div class="row">${button(`${icon('chat')} 이 문제 질문하기`,'new-question','light small')}${button(`${icon('check')} 학습지 제출`,'submit-worksheet','teal small')}</div></div>`,mathPad:r=>`<div class="math-pad"><label class="field-label" for="math-input">③ 수식으로 생각 표현하기 (선택)</label><div class="math-keyboard">${[['x','x'],['x²','x^{2}'],['분수','\\frac{1}{2}'],['루트','\\sqrt{x}'],['로그','\\log_{2}{x}'],['지수','2^{x}'],['≤','\\le '],['∠','\\angle '],['합성','(g\\circ f)(x)'],['역함수','f^{-1}(x)']].map(([label,value])=>button(label,'math-key','',`data-value="${esc(value)}"`)).join('')}</div><input class="field" id="math-input" data-role="math-answer" value="${esc(r.mathDraft||'')}" placeholder="키패드를 누르거나 LaTeX 수식을 입력하세요"/><div id="math-preview" class="math-preview">${r.mathDraft?math(r.mathDraft):'<span class="source-note">수식을 누르면 여기에 보여요</span>'}</div></div>`};
}
