import {escapeHTML as esc,actionButton as btn,toast,localDate} from './ui.js';
// Optional only: without public environment settings, no account/network requests run.
export function createClassroomCloud(api){
 const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
 const configured=!!(url&&key);let client=null,membership=null,session=null,status='',busy=false,remote=null,version=0,auto=false,dirty=false,timer=null,checking=false,rows=[];
 const ownProfile=()=>membership&&api.profile().id==='cloud:'+membership.user_id;
 async function sdk(){if(!client){const {createClient}=await import('@supabase/supabase-js');client=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});}return client;}
 function fail(error){status=error.message||'서버 연결을 확인해 주세요.';toast(status);api.render();}
 function payload(){return {state:structuredClone(api.state),classroom:api.classroomData(),schema:1};}
 async function loadRemote(){const {data,error}=await client.from('learning_records').select('payload,version,updated_at').eq('user_id',membership.user_id).maybeSingle();if(error)throw error;remote=data;version=data?.version||0;return data;}
 async function loadMembership(user){const {data,error}=await client.from('class_members').select('user_id,class_id,class_name,display_name,role').eq('user_id',user.id).single();if(error||!data)throw Error('계정의 학급 등록이 필요해요. 관리자에게 문의해 주세요.');membership=data;api.activate(data);auto=false;await loadRemote();status=remote?'서버 기록을 확인한 뒤 이어서 사용할 기록을 선택해 주세요.':'이 계정의 첫 기록을 서버에 저장할 수 있어요.';await refreshClass();}
 async function refreshClass(){
 if(!membership)return;
 if(membership.role==='teacher'){
  const [records,members]=await Promise.all([client.from('learning_records').select('user_id,payload,version,updated_at').eq('class_id',membership.class_id),client.from('class_members').select('user_id,display_name,class_name,role').eq('class_id',membership.class_id)]);
  if(records.error)throw records.error;if(members.error)throw members.error;
  rows=records.data.filter(r=>r.payload?.state).map(r=>({id:'cloud:'+r.user_id,name:members.data.find(m=>m.user_id===r.user_id)?.display_name||'학생',state:r.payload.state,className:membership.class_name,classroom:r.payload.classroom||{}}));
 }
 const messages=await client.from('teacher_messages').select('id,recipient_id,text,created_at').eq('recipient_id',membership.user_id).order('created_at',{ascending:false});if(messages.error)throw messages.error;
 if(messages.data?.length)api.receiveMessages(messages.data.map(m=>({...m,studentId:'cloud:'+m.recipient_id})));
 api.render();
 }
 async function upload(){
 if(!membership||!ownProfile())throw Error('로그인한 계정의 학습 프로필로 전환해 주세요.');
 if(remote?.payload&&!auto)throw Error('서버 기록을 확인한 뒤 이 기기에서 이어갈 기록을 선택해 주세요.');
 const snapshot=payload();dirty=false;
 const {data,error}=await client.rpc('save_learning_record',{p_payload:snapshot,p_expected_version:version});
 if(error){auto=false;dirty=true;if(error.message?.includes('VERSION_CONFLICT')){await loadRemote();throw Error('다른 기기에서 저장한 기록이 있어요. 서버 기록을 다시 확인해 주세요.');}throw error;}
 version=data;remote={payload:snapshot,version,updated_at:new Date().toISOString()};status='서버에 저장했어요 · '+localDate();
 }
 async function sendFeedback(id,text){
 if(!configured||!membership||!id.startsWith('cloud:'))return false;
 if(membership.role!=='teacher')throw Error('교사 권한이 필요해요.');
 const {error}=await client.from('teacher_messages').insert({recipient_id:id.slice(6),class_id:membership.class_id,teacher_id:membership.user_id,text});if(error)throw error;return true;
 }
 function view(){
 return `<section class="jj-panel"><span class="jj-eyebrow">SAVE · CONNECT</span><h1>학습 기록 보관과 연결</h1>${!configured?`<h2>지금은 기기 저장 모드예요</h2><p>8차시 탐구, 선택한 답, 재평가, 성찰과 게임 기록은 이 브라우저에 보관됩니다. 학생은 ‘나의 전체 기록 저장’으로 파일을 전달하고, 교사는 대시보드에서 ‘학생 전체 기록 가져오기’로 모을 수 있어요. 피드백 파일도 학생 홈에서 받을 수 있습니다.</p><div class="jj-button-row">${btn('나의 전체 기록 저장','jj-export','jj-primary')}${btn('나의 학습 홈','space-nav','jj-soft','data-view="welcome"')}</div><h3>학교 계정으로 연결하려면</h3><p>관리자가 Supabase 프로젝트에 제공된 학급·권한·저장 스키마를 적용하고 앱의 공개 연결 설정을 추가하면 아래 계정 기능이 활성화됩니다.</p><p class="jj-muted">관리자 안내: README의 ‘학교 서버 연결’ · .env.example · supabase/schema.sql</p>`:!membership?`<h2>등록된 학교 계정으로 로그인</h2><p>학교 관리자가 계정과 학급을 먼저 등록해야 해요. 로그인한 계정의 기록은 별도의 학습 프로필에 보관됩니다.</p><form id="cloud-login-form"><label class="jj-writing"><span>이메일</span><input class="field" type="email" name="email" autocomplete="username" required></label><label class="jj-writing"><span>비밀번호</span><input class="field" type="password" name="password" autocomplete="current-password" required></label><button class="btn jj-primary" type="submit" ${busy?'disabled':''}>${busy?'로그인 중…':'로그인'}</button></form>`:`<h2>${esc(membership.display_name)} · ${esc(membership.class_name)}</h2><p>계정 역할: ${membership.role==='teacher'?'교사':'학생'} · ${auto?'자동 저장 켜짐 (다른 기기의 변경이 있으면 충돌 확인)':'기록 선택 대기'}</p>${remote?.payload&&!auto?`<div class="jj-library-note">서버 기록 ${remote.payload.state?.journey?.updatedAt?esc(new Date(remote.payload.state.journey.updatedAt).toLocaleString('ko-KR')):'있음'} · 버전 ${version}<br>이 기기의 기록은 그대로 보관되어 있어요. 어느 기록으로 이어갈지 선택해 주세요.</div><div class="jj-button-row">${btn('서버 기록으로 이어서 학습','cloud-use-remote','jj-primary')}${btn('이 기기 기록을 서버에 반영','cloud-keep-local','jj-soft')}</div>`:`<div class="jj-button-row">${btn(auto?'지금 서버에 저장':'이 기기 기록 저장·자동 저장 시작','cloud-save','jj-primary')}${btn('서버 기록 새로 확인','cloud-refresh','jj-soft')}</div>`}<div class="jj-button-row">${btn('학급 기록·메시지 새로고침','cloud-class-refresh','jj-soft')}${btn('로그아웃','cloud-signout','jj-text')}</div><p class="jj-muted">학생 기록과 메시지는 학급 권한으로 보호됩니다. 파일 자료함은 현재 기기 보관이며, 원본 파일 공유는 별도로 전달해 주세요.</p>`}<p role="status" class="jj-muted">${esc(status)}</p></section>`;
 }
 async function run(fn,silent=false){if(busy)return;busy=true;if(!silent)api.render();try{await fn();}catch(e){fail(e);}finally{busy=false;if(!silent)api.render();}}
 function action(action){
 if(!action.startsWith('cloud-'))return false;
 void run(async()=>{
 switch(action){
 case 'cloud-use-remote':if(remote?.payload){api.apply(remote.payload);auto=true;status='서버 기록을 불러왔어요. 변경 사항을 자동 저장합니다.';}break;
 case 'cloud-keep-local':auto=true;await upload();break;
 case 'cloud-save':if(!remote?.payload)auto=true;await upload();break;
 case 'cloud-refresh':auto=false;await loadRemote();status='서버의 최신 기록을 확인했어요.';break;
 case 'cloud-class-refresh':await refreshClass();status='학급 기록과 메시지를 확인했어요.';break;
 case 'cloud-signout':{await client.auth.signOut();membership=null;session=null;rows=[];remote=null;auto=false;api.deactivate();status='로그아웃했어요. 이 기기의 학습 기록은 보관되어 있습니다.';break;}
 }
 });return true;
 }
 document.addEventListener('submit',e=>{if(e.target.id!=='cloud-login-form')return;e.preventDefault();const fd=new FormData(e.target);void run(async()=>{const c=await sdk(),{data,error}=await c.auth.signInWithPassword({email:String(fd.get('email')),password:String(fd.get('password'))});if(error)throw Error('로그인 정보를 확인해 주세요.');session=data.session;await loadMembership(data.user);});});
 window.addEventListener('goodssaem-saved',()=>{if(!auto||!ownProfile())return;dirty=true;clearTimeout(timer);timer=setTimeout(()=>{if(!busy)void run(upload,true);},1500);});
 window.addEventListener('online',()=>{if(dirty&&auto)void run(upload,true);});
 const poll=setInterval(()=>{if(membership&&!document.hidden&&!busy&&!checking&&!document.activeElement?.closest('input,textarea,select')){checking=true;void refreshClass().catch(e=>{status=e.message;}).finally(()=>{checking=false;});}},30000);
 window.addEventListener('pagehide',()=>{clearInterval(poll);clearTimeout(timer);});
 if(configured)void (async()=>{try{const c=await sdk(),{data}=await c.auth.getSession();if(data.session){session=data.session;await loadMembership(session.user);api.render();}}catch(e){fail(e);}})();
 return {configured,view,action,sendFeedback,get membership(){return membership;},get rows(){return rows;},isTeacher:()=>membership?.role==='teacher'};
}
