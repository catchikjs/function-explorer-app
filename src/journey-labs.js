import {escapeHTML as esc,math} from './ui.js';
export function labDefaults(type){return ({mapping:{mode:'valid'},sets:{rule:'square',codomain:'wide'},types:{mode:'one'},composition:{price:10000},inverse:{x:2},rational:{a:2,h:1,k:1},radical:{a:1,h:0,k:0,sign:1}})[type];}
const option=(key,label,values,value)=>`<label class="jl-control">${label}<select class="field" data-journey-lab="${key}">${values.map(([v,l])=>`<option value="${v}" ${String(value)===String(v)?'selected':''}>${l}</option>`).join('')}</select></label>`;
const slider=(key,label,min,max,step,value)=>`<label class="jl-control"><span>${label} <b>${value}</b></span><input type="range" data-journey-lab="${key}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label}"/></label>`;
function graph(type,p){
 const W=540,H=300,S=29,X=x=>W/2+x*S,Y=y=>H/2-y*S;
 let grid='';for(let i=-9;i<=9;i++)grid+=`<path d="M${X(i)} 0V${H} M0 ${Y(i)}H${W}" stroke="${i===0?'#8094b1':'#e5ebf3'}"/>${i&&i%2===0?`<text x="${X(i)}" y="${Y(0)+17}" text-anchor="middle">${i}</text>`:''}`;
 function line(fn,color,dash=''){let path='',prev;for(let x=-10;x<=10;x+=.025){const y=fn(x);if(!Number.isFinite(y)||Math.abs(y)>12){prev=undefined;continue;}path+=`${prev!==undefined&&Math.abs(prev-y)<4?'L':'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)} `;prev=y;}return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="6 6"':''}/>`;}
 let plots='';
 if(type==='rational')plots=`<path d="M${X(p.h)} 0V${H} M0 ${Y(p.k)}H${W}" stroke="#e79644" stroke-width="2" stroke-dasharray="6 5"/>`+line(x=>Math.abs(x-p.h)<.02?NaN:p.a/(x-p.h)+p.k,'#6952d9');
 if(type==='radical')plots=line(x=>p.a*(x-p.h)<0?NaN:p.sign*Math.sqrt(p.a*(x-p.h))+p.k,'#6952d9')+`<circle cx="${X(p.h)}" cy="${Y(p.k)}" r="5" fill="#e79644"/>`;
 if(type==='inverse')plots=line(x=>2*x+3,'#a899e2')+line(x=>(x-3)/2,'#6952d9')+line(x=>x,'#e79644','dash')+`<circle cx="${X(p.x)}" cy="${Y(2*p.x+3)}" r="6" fill="#16a38b"/><circle cx="${X(2*p.x+3)}" cy="${Y(p.x)}" r="6" fill="#6952d9"/>`;
 return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${type==='rational'?'유리함수와 두 점근선':type==='radical'?'무리함수의 시작점과 진행 방향':'함수와 역함수의 y=x 대칭 그래프'}"><defs><clipPath id="jl-clip"><rect width="${W}" height="${H}" rx="15"/></clipPath></defs><g clip-path="url(#jl-clip)"><rect width="${W}" height="${H}" fill="#fafbff"/>${grid}${plots}</g><text x="520" y="140">x</text><text x="280" y="16">y</text></svg>`;
}
export function renderJourneyLab(type,values){
 const p={...labDefaults(type),...values};
 if(type==='mapping'||type==='types'){
  const mode=type==='mapping'?p.mode:p.mode==='one'?'valid':p.mode==='same'?'same':'unused';
  const pairs=mode==='missing'?[[0,0],[1,1]]:mode==='double'?[[0,0],[1,1],[1,2],[2,2]]:mode==='same'?[[0,0],[1,0],[2,2]]:[[0,0],[1,1],[2,2]];
  const controls=type==='mapping'?option('mode','자판기 연결 규칙',[['valid','모두 하나씩'],['same','같은 음료에 연결'],['missing','출력 없는 버튼'],['double','한 버튼, 두 음료']],p.mode):option('mode','대응의 구조',[['one','일대일대응'],['same','출력이 겹치는 함수'],['unused','공역에 남는 출력']],p.mode);
  const ok=!['missing','double'].includes(mode),right=['🧃 주스','🥛 우유','💧 물',...(mode==='unused'?['🍵 차']:[])];
  return `<div class="jl-layout"><div>${controls}<div class="jl-readout"><b>${ok?'함수의 약속 충족':'함수의 약속 확인 필요'}</b><p>${mode==='missing'?'버튼 C에 출력이 없어요.':mode==='double'?'버튼 B의 출력이 둘이에요.':mode==='same'?'A와 B의 출력은 같아도 각 버튼의 출력은 하나예요.':mode==='unused'?'모든 입력의 출력이 다르지만 공역의 차는 사용하지 않아요.':'각 버튼에 출력이 하나씩, 모든 음료도 정확히 한 번씩 쓰여요.'}</p></div></div><svg viewBox="0 0 500 270" role="img" aria-label="세 입력과 음료 사이의 대응 그림"><defs><marker id="jl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10" fill="#7660d9"/></marker></defs><rect x="30" y="15" width="140" height="240" rx="55" fill="#eeeafa"/><rect x="320" y="15" width="150" height="240" rx="55" fill="#e7f7f1"/>${['A','B','C'].map((a,i)=>`<text x="100" y="${65+i*70}" text-anchor="middle">버튼 ${a}</text>`).join('')}${right.map((a,i)=>`<text x="395" y="${50+i*(right.length===4?56:70)}" text-anchor="middle">${a}</text>`).join('')}${pairs.map(([a,b])=>`<path d="M140 ${60+a*70} C220 ${60+a*70},250 ${45+b*(right.length===4?56:70)},335 ${45+b*(right.length===4?56:70)}" fill="none" stroke="#7660d9" stroke-width="2.5" marker-end="url(#jl-arrow)"/>`).join('')}</svg></div>`;
 }
 if(type==='sets'){
  const xs=[-2,-1,0,1,2],ys=xs.map(x=>p.rule==='square'?x*x:x+2),range=[...new Set(ys)].sort((a,b)=>a-b);
  return `<div class="jl-controls">${option('rule','대응 규칙',[['square','f(x)=x²'],['linear','f(x)=x+2']],p.rule)}${option('codomain','공역',[['wide','{0,1,2,3,4,5}'],['tight','{0,1,2,3,4}']],p.codomain)}</div><div class="jl-set-cards"><div><small>정의역 · 출발</small><b>{−2,−1,0,1,2}</b></div><div><small>공역 · 출력 후보</small><b>${p.codomain==='wide'?'{0,1,2,3,4,5}':'{0,1,2,3,4}'}</b></div><div><small>치역 · 실제 도착</small><b>{${range.join(',')}}</b></div></div><div class="jl-table" role="table" aria-label="입력과 출력 표"><div role="row"><b role="columnheader">x</b>${xs.map(x=>`<span role="cell">${x}</span>`).join('')}</div><div role="row"><b role="rowheader">f(x)</b>${ys.map(y=>`<span role="cell">${y}</span>`).join('')}</div></div><p class="jl-readout">입력은 그대로 두고 공역을 바꿔 보세요. 실제 출력인 치역은 바뀌었나요?</p>`;
 }
 if(type==='composition'){
  return `${slider('price','원래 가격 (원)',2000,20000,1000,p.price)}<div class="jl-pipelines"><div><span>할인 먼저</span><b>${p.price.toLocaleString()}원</b><i>→ 10% 할인</i><b>${(p.price*.9).toLocaleString()}원</b><i>→ 1,000원 쿠폰</i><strong>${(p.price*.9-1000).toLocaleString()}원</strong></div><div><span>쿠폰 먼저</span><b>${p.price.toLocaleString()}원</b><i>→ 1,000원 쿠폰</i><b>${(p.price-1000).toLocaleString()}원</b><i>→ 10% 할인</i><strong>${((p.price-1000)*.9).toLocaleString()}원</strong></div></div><p class="jl-readout">지금 차이는 <b>100원</b>이에요. 가격을 바꾸어도 같을까요? 두 식 0.9x−1000, 0.9(x−1000)을 비교해 보세요.</p>`;
 }
 if(type==='inverse')return `<div class="jl-layout"><div>${slider('x','원래 입력 x',-3,2,.5,p.x)}<div class="jl-readout">${math('f(x)=2x+3')}<p>${p.x} → ${2*p.x+3} → ${p.x}</p>${math('f^{-1}(x)=\\frac{x-3}{2}')}<p>두 점 (${p.x}, ${2*p.x+3})와 (${2*p.x+3}, ${p.x})의 좌표를 비교하세요.</p></div></div>${graph(type,p)}</div>`;
 const rational=type==='rational',tex=rational?`y=\\frac{${p.a}}{x-(${p.h})}+(${p.k})`:`y=${p.sign<0?'-':''}\\sqrt{${p.a}(x-(${p.h}))}+(${p.k})`;
 return `<div class="jl-layout"><div><div class="jl-formula">${math(tex)}</div>${slider('a',rational?'분자의 계수 k':'근호 안 계수 a',-3,3,1,p.a)}${slider('h',rational?'가로 이동 p':'시작 x좌표 p',-3,3,1,p.h)}${slider('k',rational?'세로 이동 q':'시작 y좌표 q',-3,3,1,p.k)}${!rational?option('sign','근호 밖의 부호',[['1','양수 +√'],['-1','음수 −√']],p.sign):''}<div class="jl-readout">${rational?`정의역 x≠${p.h} · 치역 y≠${p.k}<br>점근선 x=${p.h}, y=${p.k}`:`정의역 x${p.a>0?'≥':'≤'}${p.h} · 치역 y${p.sign>0?'≥':'≤'}${p.k}<br>시작점 (${p.h}, ${p.k})`}</div></div>${graph(type,p)}</div>`;
}

// Retain slider DOM nodes while dragging, so touch/pointer capture stays intact.
export function updateLabSurface(target,type,values,key){
 if(!target)return;
 const fragment=document.createElement('div');fragment.innerHTML=renderJourneyLab(type,values);
 const active=target.querySelector(`[data-journey-lab="${key}"]`);
 if(active?.type!=='range'){target.innerHTML=fragment.innerHTML;target.querySelector(`[data-journey-lab="${key}"]`)?.focus();return;}
 for(const selector of ['.jl-layout>svg','.jl-readout','.jl-pipelines','.jl-formula']){const next=fragment.querySelector(selector),old=target.querySelector(selector);if(next&&old)old.replaceWith(next);}
 const label=active.closest('label'),nextLabel=fragment.querySelector(`[data-journey-lab="${key}"]`)?.closest('label');
 if(label?.querySelector('b')&&nextLabel?.querySelector('b'))label.querySelector('b').textContent=nextLabel.querySelector('b').textContent;
 active.value=values[key];
}
