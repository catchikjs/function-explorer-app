import {LESSONS,lessonById,lessonQuestions} from './journey-data.js';
import {renderJourneyLab,labDefaults,updateLabSurface} from './journey-labs.js';
import {escapeHTML as esc,actionButton as btn,icon,toast,saveDownload,localDate} from './ui.js';
const DB='goodssaem-lesson-studio-v1';
export function openStudioDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore('materials',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('파일 저장소를 열 수 없어요. 브라우저 저장 권한을 확인해 주세요.'));});}
async function dbOperation(mode,operation){const db=await openStudioDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('materials',mode),request=operation(tx.objectStore('materials'));let result;request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(Error('파일 저장 공간을 확인해 주세요.'));tx.onabort=()=>reject(Error('파일 저장을 완료하지 못했어요.'));});}finally{db.close();}}
export const saveMaterial=material=>dbOperation('readwrite',s=>s.put(material));
export const getMaterials=()=>dbOperation('readonly',s=>s.getAll());
export function buildLessonDeck({title,lessonId,pages=[],filename,note=''}){
 const l=lessonById(lessonId);
 return {version:1,title,lessonId:l.id,createdAt:new Date().toISOString(),sourceName:filename,slides:[
 {kind:'cover',eyebrow:'오늘의 수업 · '+l.short,title,body:l.question,note:'원본 학습자료와 아래 공통수학2 보충 활동을 연결해 진행하세요.'},
 ...pages.map((p,i)=>({kind:'source',eyebrow:'업로드 원문 · '+(p.page?'PDF '+p.page+'쪽':'구간 '+(i+1)),title:p.heading||'학습지 함께 읽기',body:p.text,page:p.page||null,note:'원문에서 근거를 찾아 말하게 하세요. 수식과 표는 원본 페이지도 함께 확인하세요.'})),
 ...(note.trim()?[{kind:'source',eyebrow:'교사 보충 설명',title:'오늘 함께 살펴볼 내용',body:note,note:'업로드할 때 교사가 작성한 보충 설명입니다.'}]:[]),
 {kind:'concept',eyebrow:'교육과정 보충 · 개념 연결',title:l.title,body:l.concepts.map(([h,p])=>h+'\n'+p).join('\n\n'),note:'원문에서 추출한 요약이 아닌, 선택한 차시의 보충 개념입니다.'},
 {kind:'lab',eyebrow:'교육과정 보충 · 함께 탐구',title:'예상하고, 움직여 확인해요',body:l.prompts.join('\n'),note:'값을 바꾸기 전에 학생이 예상하게 하고 서로 다른 설정 두 가지를 비교하세요.'},
 {kind:'question',eyebrow:'교육과정 보충 · 마무리 질문',title:'오늘의 이해를 확인해요',body:lessonQuestions(l.id,'assessment')[0].prompt+'\n\n'+lessonQuestions(l.id,'assessment')[0].options.map((o,i)=>String.fromCharCode(65+i)+'. '+o).join('\n'),note:lessonQuestions(l.id,'assessment')[0].why},
 {kind:'reflect',eyebrow:'성찰과 생활 연결',title:'교실 밖에서도 떠올려 보세요',body:l.home+'\n\n오늘 알게 된 것, 바뀐 생각, 아직 남은 질문을 한 문장씩 남겨요.',note:'학생 앱의 8차시 탐구에서 형성평가와 성찰을 마무리하도록 안내하세요.'}
 ]};
}
export async function extractPDFPages(file){
 const pdfjs=await import('pdfjs-dist');
 pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;
 const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
 try{
  if(doc.numPages>80)throw Error('80쪽 이하의 PDF로 나누어 올려 주세요. 원본은 보관되어 있어요.');
  const pages=[];for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),content=await page.getTextContent();let text='';for(const item of content.items){if('str'in item)text+=item.str+(item.hasEOL?'\n':' ');}pages.push({page:i,text:text.trim().slice(0,12000)});page.cleanup();}return pages;
 }finally{await doc.loadingTask.destroy();}
}
function textPages(text){const chunks=text.match(/[\s\S]{1,1600}/g)||[text];return chunks.filter(s=>s.trim()).slice(0,80).map(t=>({text:t.trim()}));}
export function exportDeckHTML(deck){
 const slides=deck.slides.map((s,i)=>`<section><small>${esc(s.eyebrow)} · ${i+1}/${deck.slides.length}</small><h1>${esc(s.title)}</h1><p>${esc(s.body||'원본 자료를 함께 확인해 주세요.')}</p><footer>출처: ${esc(deck.sourceName)}${s.page?' · '+s.page+'쪽':''}</footer><details><summary>교사 메모</summary>${esc(s.note)}</details></section>`).join('');
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(deck.title)}</title><style>body{margin:0;background:#f0eef9;color:#27233f;font-family:system-ui,sans-serif}section{box-sizing:border-box;min-height:100vh;padding:6vw 8vw;display:flex;flex-direction:column;justify-content:center;border-bottom:8px solid #7255d9}h1{font-size:clamp(30px,4vw,64px);line-height:1.3}p{font-size:clamp(20px,2.1vw,34px);line-height:1.8;white-space:pre-wrap}small,footer{color:#675e86}footer{margin-top:30px}details{margin-top:20px;white-space:pre-wrap}@media print{section{min-height:100vh;break-after:page}details{display:none}}</style></head><body>${slides}</body></html>`;
}
export function createLessonStudio(api){
 let materials=[],loaded=false,loading=false,error='',busy=false,status='',deckId=null,slideIndex=0,editing=false,showNotes=false,pdfDocument=null,pdfId=null,pdfTask=null,mountToken=0;
 let objectURLs=[];
 async function reload(){try{materials=await getMaterials();loaded=true;error='';}catch(e){error=e.message;loaded=true;}api.render();}
 function ensure(){if(!loaded&&!loading){loading=true;void reload().finally(()=>{loading=false;});}}
 const visible=()=>materials.filter(m=>m.className===api.profile().className).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const chosen=()=>visible().find(m=>m.id===deckId);
 function resources(){ensure();return `<div class="jj-section-title"><div><span class="jj-eyebrow">CLASSROOM LIBRARY</span><h1>수업 학습자료</h1><p>선생님의 원본 학습지를 그대로 만나고, 8차시 탐구와 연결해요.</p></div>${api.isTeacher()?btn('오늘의 수업 열기','ls-today','jj-primary'):''}</div><div class="jj-library-note">${icon('folder')} 원본 파일은 이 기기의 파일 저장소에 보관합니다. 파일을 내려받아 다른 기기로 옮길 수 있어요.</div>${api.isTeacher()?uploadForm():''}${error?`<p role="alert">${esc(error)}</p>`:''}<div class="jj-material-grid">${visible().map(m=>`<article class="jj-panel jj-material-card"><span class="jj-material-icon">${m.type==='application/pdf'?'📕':m.type.startsWith('image/')?'🖼️':'📄'}</span><span class="jj-tag">${esc(lessonById(m.lessonId).short)}</span><h2>${esc(m.title)}</h2><p>${esc(m.filename)}</p><small>${localDate(m.createdAt)} · ${(m.size/1024/1024).toFixed(1)}MB · ${esc(m.className)}</small><div class="jj-button-row">${btn('원본 내려받기','ls-original','jj-soft',`data-id="${m.id}"`)}${m.type==='application/pdf'||m.type.startsWith('image/')?btn('원본 보기','ls-preview','jj-text',`data-id="${m.id}"`):''}</div>${m.deck?`<small class="jj-muted">전자칠판용 수업 ${m.deck.slides.length}장 자동 구성 완료</small>`:`<small class="jj-muted">${esc(m.extractionError||'원본 보관 완료')}</small>`}</article>`).join('')||`<section class="jj-panel jj-empty"><span>📚</span><h2>${loaded?'우리 반 자료를 기다리고 있어요':'자료함을 여는 중이에요'}</h2><p>교사 대시보드의 ‘수업 학습자료’에서 원본을 올릴 수 있어요.</p>${btn('기존 디지털 학습지 둘러보기','space-nav','jj-soft','data-view="worksheets"')}</section>`}</div>`;}
 function uploadForm(){if(!loaded)return `<section class="jj-panel" role="status">학습자료 보관함을 여는 중이에요…</section>`;return `<section class="jj-panel jj-upload"><div><h2>원본 한 번 업로드, 수업까지 이어지게</h2><p>PDF·TXT·MD는 원문을 읽어 발표 초안을 구성해요. 이미지와 다른 형식은 원본을 보관하고 선택한 차시의 보충 활동을 연결합니다.</p></div><form id="lesson-upload-form"><div class="jj-upload-fields"><label class="jj-writing"><span>수업 제목</span><input class="field" name="title" required maxlength="100" placeholder="예: 자판기에서 발견한 함수"></label><label class="jj-writing"><span>연결할 차시</span><select class="field" name="lessonId">${LESSONS.map((l,i)=>`<option value="${l.id}">${i+1}차시 · ${l.short}</option>`).join('')}</select></label></div><label class="jj-drop-zone">${icon('folder')}<b>학습지 파일 선택</b><span>원본 형식 유지 · 파일당 20MB · PDF 최대 80쪽</span><input name="file" type="file" required ${busy?'disabled':''}></label><label class="jj-writing"><span>보충 설명 (선택 · 스캔본의 내용을 붙여 넣을 수 있어요)</span><textarea class="field" name="note" rows="3" maxlength="15000" placeholder="이미지나 한글 파일은 자동으로 읽지 못할 수 있어요. 핵심 내용을 적으면 수업에 함께 반영합니다."></textarea></label><button class="btn jj-primary" type="submit" ${busy?'disabled':''}>${busy?'원본을 보관하고 수업을 구성하는 중…':'원본 보관 + 오늘의 수업 자동 만들기'}</button><p role="status" class="jj-upload-status">${esc(status)}</p></form></section>`;}
 function today(){ensure();if(!api.isTeacher())return `<section class="jj-panel"><h2>교사용 오늘의 수업</h2><p>교사 대시보드에서 수업자료를 관리할 수 있어요.</p>${btn('학생 학습 지도로','space-nav','jj-soft','data-view="welcome"')}</section>`;
 const m=chosen();if(m?.deck)return presentation(m);
 return `<div class="jj-section-title"><div><span class="jj-eyebrow">TEACHER STUDIO · READY TO TEACH</span><h1>오늘의 수업</h1><p>업로드한 원문과 개념 탐구가 연결된 전자칠판용 수업 초안입니다.</p></div>${btn('학습지 올리고 수업 만들기','ls-library','jj-primary')}</div><div class="jj-library-note">자동 구성한 초안을 수업 전에 검토하고 수정하세요. 출처 원문과 교육과정 보충 내용은 각 장에 표시됩니다. AI 요약·OCR 기능은 연결되어 있지 않습니다.</div>${error?`<p role="alert">${esc(error)}</p>`:''}<div class="jj-material-grid">${visible().filter(m=>m.deck).map(m=>`<article class="jj-panel jj-deck-card"><div class="jj-deck-cover"><span>${lessonById(m.lessonId).emoji}</span><b>${esc(m.title)}</b><small>${m.deck.slides.length} SLIDES · ${esc(lessonById(m.lessonId).short)}</small></div><p>도입 → 원문 → 개념 → 함께 탐구 → 평가 → 성찰</p><small>${esc(m.filename)} · ${localDate(m.createdAt)}</small><div class="jj-button-row">${btn('수업 시작','ls-open','jj-primary',`data-id="${m.id}"`)}${btn('발표 HTML 저장','ls-download','jj-soft',`data-id="${m.id}"`)}</div></article>`).join('')||'<section class="jj-panel jj-empty"><span>🎬</span><h2>첫 수업을 준비해 볼까요?</h2><p>학습자료를 업로드하면 이곳에 수업 초안이 자동으로 생성됩니다.</p></section>'}</div>`;
 }
 function presentation(m){
 const deck=m.deck,s=deck.slides[slideIndex]||deck.slides[0],l=lessonById(m.lessonId);
 return `<div class="jj-presenter" id="lesson-presenter"><div class="jj-presenter-toolbar">${btn('수업 목록','ls-back','jj-soft small')}<span>${slideIndex+1} / ${deck.slides.length}장</span><div class="jj-button-row">${btn('메모','ls-notes','jj-text small',`aria-pressed="${showNotes}"`)}${btn(editing?'수정 닫기':'내용 수정','ls-edit','jj-text small')}${btn('전체 화면','ls-fullscreen','jj-soft small')}</div></div><div class="jj-slide ${s.kind}" aria-live="polite"><span class="jj-eyebrow">${esc(s.eyebrow)}</span><h2>${esc(s.title)}</h2>${s.kind==='concept'?`<div class="jj-slide-concepts">${s.body.split('\n\n').map(block=>{const [title,...body]=block.split('\n');return `<article><h3>${esc(title)}</h3><p>${esc(body.join('\n'))}</p></article>`;}).join('')}</div>`:s.kind==='lab'?`<p>${esc(s.body)}</p><div class="jj-slide-lab" id="studio-lab">${renderJourneyLab(l.lab,m.lab||labDefaults(l.lab))}</div>`:s.kind==='source'&&s.page?`<div class="jj-pdf-slide"><canvas id="lesson-pdf-canvas" aria-label="원본 학습지 ${s.page}쪽"></canvas><p class="jj-muted" id="lesson-pdf-status">원본 페이지를 준비하고 있어요.</p></div><details class="jj-pdf-text"><summary>추출한 원문 텍스트</summary><p>${esc(s.body||'추출 가능한 텍스트가 없어요. 원본 이미지를 확인하세요.')}</p></details>`:`<p class="jj-slide-body">${esc(s.body||'원본을 열어 함께 읽어 주세요.')}</p>${s.kind==='cover'?`<span class="jj-slide-emoji" aria-hidden="true">${l.emoji}</span>`:''}`}<footer>출처: ${esc(m.filename)}${s.page?' · '+s.page+'쪽':''}${s.kind!=='source'?' + 선택 차시의 교육과정 보충 활동':''}</footer></div>${showNotes?`<div class="jj-teacher-notes"><b>교사 메모</b><p>${esc(s.note)}</p></div>`:''}${editing?`<form id="lesson-slide-edit"><label class="jj-writing"><span>슬라이드 제목</span><input class="field" name="title" value="${esc(s.title)}" maxlength="150" required></label><label class="jj-writing"><span>본문 (원본 PDF 파일은 변경하지 않아요)</span><textarea class="field" name="body" rows="5" maxlength="15000">${esc(s.body)}</textarea></label><label class="jj-writing"><span>교사 메모</span><textarea class="field" name="note" rows="2" maxlength="3000">${esc(s.note)}</textarea></label><button class="btn jj-primary" type="submit">이 장 수정 저장</button></form>`:''}<div class="jj-presenter-nav">${btn('← 이전','ls-prev','jj-soft',slideIndex===0?'disabled':'')}<div class="jj-slide-dots">${deck.slides.map((_,i)=>`<button data-action="ls-jump" data-index="${i}" class="${i===slideIndex?'active':''}" aria-label="${i+1}장으로" ${i===slideIndex?'aria-current="true"':''}></button>`).join('')}</div>${btn('다음 →','ls-next','jj-primary',slideIndex===deck.slides.length-1?'disabled':'')}</div><small class="jj-muted">키보드 ← → 로 이동 · HTML 저장본에는 텍스트와 출처가 포함되며 원본 파일은 따로 보관하세요.</small></div>`;
 }
 async function mount(){
 const token=++mountToken,m=chosen(),s=m?.deck?.slides[slideIndex];
 if(!api.isTeacher()||!document.getElementById('lesson-presenter')||!s?.page||!document.getElementById('lesson-pdf-canvas'))return;
 try{
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;
  if(pdfId!==m.id){if(pdfDocument)await pdfDocument.loadingTask.destroy();pdfDocument=null;pdfId=m.id;pdfDocument=await pdfjs.getDocument({data:new Uint8Array(await m.blob.arrayBuffer()),isEvalSupported:false}).promise;}
  if(token!==mountToken)return;
  pdfTask?.cancel();const page=await pdfDocument.getPage(s.page);if(token!==mountToken)return;
  const canvas=document.getElementById('lesson-pdf-canvas');if(!canvas)return;const viewport=page.getViewport({scale:1.25});canvas.width=viewport.width;canvas.height=viewport.height;pdfTask=page.render({canvasContext:canvas.getContext('2d'),viewport});await pdfTask.promise;if(token===mountToken)document.getElementById('lesson-pdf-status')?.remove();
 }catch(e){if(e.name==='RenderingCancelledException')return;const status=document.getElementById('lesson-pdf-status');if(status)status.textContent='원본 페이지를 표시하지 못했어요. 학습자료에서 원본 파일을 내려받아 확인하세요.';}
 }
 function move(index){const m=chosen();if(!m?.deck)return;slideIndex=Math.max(0,Math.min(m.deck.slides.length-1,index));editing=false;pdfTask?.cancel();api.render();}
 function downloadOriginal(m){const a=document.createElement('a'),url=URL.createObjectURL(m.blob);a.href=url;a.download=m.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 function action(action,el){
 if(!action.startsWith('ls-'))return false;
 switch(action){
 case 'ls-today':api.render('today');break;
 case 'ls-library':api.render('resources');break;
 case 'ls-open':if(api.isTeacher()){deckId=el.dataset.id;slideIndex=0;api.render('today');}break;
 case 'ls-original':{const m=visible().find(m=>m.id===el.dataset.id);if(m)downloadOriginal(m);break;}
 case 'ls-preview':{const m=visible().find(m=>m.id===el.dataset.id);if(m){const url=URL.createObjectURL(m.blob);objectURLs.push(url);window.open(url,'_blank','noopener');}break;}
 case 'ls-download':{const m=visible().find(m=>m.id===el.dataset.id);if(m?.deck)saveDownload(exportDeckHTML(m.deck),m.title+'_수업.html','text/html;charset=utf-8');break;}
 case 'ls-back':deckId=null;pdfTask?.cancel();api.render();break;
 case 'ls-prev':move(slideIndex-1);break;
 case 'ls-next':move(slideIndex+1);break;
 case 'ls-jump':move(Number(el.dataset.index));break;
 case 'ls-notes':showNotes=!showNotes;api.render();break;
 case 'ls-edit':editing=!editing;api.render();break;
 case 'ls-fullscreen':{const el=document.documentElement;if(!document.fullscreenElement){document.body.classList.add('jj-presentation-fullscreen');el?.requestFullscreen?.().catch(()=>toast('이 브라우저에서는 전체 화면을 지원하지 않아요.'));}else document.exitFullscreen?.();break;}
 default:return false;
 }return true;
 }
 document.addEventListener('submit',async e=>{
 const form=e.target;if(!['lesson-upload-form','lesson-slide-edit'].includes(form.id))return;e.preventDefault();if(!api.isTeacher())return;
 if(form.id==='lesson-slide-edit'){
  const m=chosen();if(!m)return;const fd=new FormData(form);Object.assign(m.deck.slides[slideIndex],{title:String(fd.get('title')).trim(),body:String(fd.get('body')),note:String(fd.get('note'))});
  try{await saveMaterial(m);editing=false;api.render();toast('수업 슬라이드를 저장했어요.');}catch(err){toast(err.message);}return;
 }
 if(busy)return;const fd=new FormData(form),file=fd.get('file');if(!file?.size){toast('학습자료를 선택해 주세요.');return;}if(file.size>20*1024*1024){toast('20MB 이하의 파일을 선택해 주세요.');return;}
 if(/\.(html?|svg|js|mjs)$/i.test(file.name)){toast('실행형 웹 파일 대신 PDF·텍스트·이미지 등 학습자료를 선택해 주세요.');return;}
 const m={id:crypto.randomUUID(),title:String(fd.get('title')).trim(),lessonId:String(fd.get('lessonId')),className:api.profile().className,filename:file.name,type:file.type||'application/octet-stream',size:file.size,blob:file,createdAt:new Date().toISOString()};
 busy=true;status='원본을 저장하고 발표 초안을 구성하고 있어요.';api.render();
 try{
  await saveMaterial(m);let pages=[];
  try{if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){m.type='application/pdf';pages=await extractPDFPages(file);if(pages.every(p=>!p.text.trim()))m.extractionError='이미지형 PDF: 원본 페이지를 표시합니다. OCR은 적용하지 않았어요.';}else if(/\.(txt|md)$/i.test(file.name)||file.type==='text/plain'){pages=textPages(await file.text());}else m.extractionError='이 파일은 자동 텍스트 분석을 지원하지 않아 원본 보관과 차시 보충 활동으로 구성했어요.';}catch(err){m.extractionError=err.message||'텍스트를 읽지 못해 원본과 차시 보충 활동을 연결했어요.';}
  m.deck=buildLessonDeck({title:m.title,lessonId:m.lessonId,pages,filename:m.filename,note:String(fd.get('note'))});
  if(m.extractionError)m.deck.slides.splice(1,0,{kind:'source',eyebrow:'원본 확인 안내',title:'원본 자료를 함께 확인해 주세요',body:m.extractionError,note:'학습자료에서 원본을 내려받아 확인하거나 보충 설명을 추가하세요.'});
  await saveMaterial(m);status='원본 보관과 오늘의 수업 생성이 완료되었어요.';materials=await getMaterials();loaded=true;toast('원본과 발표 초안을 보관했어요. 오늘의 수업에서 확인해 주세요.');
 }catch(err){status=err.message;toast(err.message);}finally{busy=false;api.render();}
 });
 document.addEventListener('keydown',e=>{if(!document.getElementById('lesson-presenter')||e.target.closest('input,textarea,select,button'))return;if(e.key==='ArrowRight'){e.preventDefault();move(slideIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();move(slideIndex-1);}});
 document.addEventListener('input',e=>{if(!e.target.closest('#studio-lab')||!e.target.dataset.journeyLab)return;const m=chosen(),l=lessonById(m.lessonId),key=e.target.dataset.journeyLab;let value=e.target.type==='range'||key==='sign'?Number(e.target.value):e.target.value;m.lab={...labDefaults(l.lab),...m.lab};if(key==='a'&&value===0)value=m.lab.a>0?-1:1;m.lab[key]=value;updateLabSurface(document.getElementById('studio-lab'),l.lab,m.lab,key);});
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('jj-presentation-fullscreen');});
 window.addEventListener('pagehide',()=>{objectURLs.forEach(url=>URL.revokeObjectURL(url));objectURLs=[];});
 return {resources,today,action,mount};
}
