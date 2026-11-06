import { math, icon, escapeHTML as esc, actionButton as button } from './ui.js';

export const graphTypes = {
 square:{label:'이차함수',formula:p=>`y=${p.a}(x${sign(-p.h)})^2${sign(p.k)}`,fn:(x,p)=>p.a*(x-p.h)**2+p.k},
 linear:{label:'일차함수',formula:p=>`y=${p.a}(x${sign(-p.h)})${sign(p.k)}`,fn:(x,p)=>p.a*(x-p.h)+p.k},
 rational:{label:'유리함수',formula:p=>`y=\\frac{${p.a}}{x${sign(-p.h)}}${sign(p.k)}`,fn:(x,p)=>Math.abs(x-p.h)<.015?NaN:p.a/(x-p.h)+p.k},
 radical:{label:'무리함수',formula:p=>`y=${p.a}\\sqrt{x${sign(-p.h)}}${sign(p.k)}`,fn:(x,p)=>x<p.h?NaN:p.a*Math.sqrt(x-p.h)+p.k},
 compose:{label:'합성함수',formula:p=>`(g\\circ f)(x)=\\left[${p.a}(x${sign(-p.h)})${sign(p.k)}\\right]^2`,fn:(x,p)=>(p.a*(x-p.h)+p.k)**2},
 inverse:{label:'역함수',formula:p=>`f(x)=${p.a}x${sign(p.k)},\\quad f^{-1}(x)=\\frac{x${sign(-p.k)}}{${p.a}}`,fn:(x,p)=>(x-p.k)/p.a}
};
function sign(n){return n===0?'':n>0?`+${n}`:`${n}`;}
export function plotSVG(p, compact=false){
 const W=680,H=compact?260:390, scale=compact?31:39,cx=W/2,cy=H/2;
 const X=x=>cx+x*scale,Y=y=>cy-y*scale;
 const grid=[];
 for(let x=-10;x<=10;x++)grid.push(`<line x1="${X(x)}" x2="${X(x)}" y1="0" y2="${H}" stroke="${x===0?'#a7bdba':'#e5efed'}" stroke-width="${x===0?1.3:1}"/>${x&&x%2===0?`<text x="${X(x)}" y="${cy+17}" text-anchor="middle">${x}</text>`:''}`);
 for(let y=-7;y<=7;y++)grid.push(`<line x1="0" x2="${W}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y===0?'#a7bdba':'#e5efed'}" stroke-width="${y===0?1.3:1}"/>${y&&y%2===0?`<text x="${cx-12}" y="${Y(y)+4}" text-anchor="end">${y}</text>`:''}`);
 function path(fn,color,dashed=false){let d='',prev=null;for(let x=-10;x<=10;x+=.025){const y=fn(x);if(!Number.isFinite(y)||Math.abs(y)>15){prev=null;continue;}d+=`${prev!==null&&Math.abs(y-prev)<5?'L':'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)} `;prev=y;}return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${dashed?2:3.3}" ${dashed?'stroke-dasharray="6 6"':''}/>`;}
 let extra='';
 if(p.original && !['compose','inverse'].includes(p.type))extra=path(x=>graphTypes[p.type].fn(x,{a:1,h:0,k:0}),'#bac8c5',true);
 if(p.type==='inverse')extra=path(x=>p.a*x+p.k,'#a1bab6',true)+path(x=>x,'#d5b684',true);
 if(p.type==='rational')extra+=`<path d="M${X(p.h)},0V${H}M0,${Y(p.k)}H${W}" stroke="#c4aaa4" stroke-dasharray="5 5" fill="none"/>`;
 const offset=p.type==='rational'?1:0; const hx=p.h+offset,hy=p.k+(p.type==='rational'?p.a:0);
 return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(graphTypes[p.type].label)} 탐구 그래프. 아래 슬라이더 또는 그래프 위 점을 움직이세요."><defs><clipPath id="explore-clip"><rect width="${W}" height="${H}" rx="14"/></clipPath></defs><g clip-path="url(#explore-clip)"><rect width="${W}" height="${H}" fill="#fbfdfc"/>${grid.join('')}${extra}${path(x=>graphTypes[p.type].fn(x,p),'#159d89')}${!['compose','inverse'].includes(p.type)?`<circle cx="${X(hx)}" cy="${Y(hy)}" r="13" fill="#159d891a"/><circle cx="${X(hx)}" cy="${Y(hy)}" r="6" fill="#159d89" stroke="white" stroke-width="2"/>`:''}</g><g fill="#859994" font-family="sans-serif" font-size="11"><text x="${W-15}" y="${cy-9}">x</text><text x="${cx+10}" y="17">y</text><text x="${cx-12}" y="${cy+17}">O</text></g></svg>`;
}
export function explorerHTML(p, compact=false){
 return `<section class="panel explorer-panel ${compact?'compact-explorer':''}"><div class="section-row"><div><span class="eyeline">${icon('graph')} 직접 움직이는 수학</span><h3>그래프가 들려주는 이야기</h3></div><span class="live-label"><i></i> 인터랙티브 탐구</span></div><div class="graph-type-tabs" role="group" aria-label="탐구할 함수">${Object.entries(graphTypes).map(([key,t])=>button(t.label,'graph-type',p.type===key?'selected':'',`data-type="${key}" aria-pressed="${p.type===key}"`)).join('')}</div><div class="graph-equation" id="explore-equation">${math(graphTypes[p.type].formula(p))}</div><div id="explore-plot" class="explore-plot" data-compact="${compact}">${plotSVG(p,compact)}</div><div class="graph-legend"><span><i></i> 나의 그래프</span><label><input type="checkbox" data-role="original-graph" ${p.original?'checked':''}/> 기본 그래프 함께 보기</label><button type="button" class="text-button" data-action="reset-graph">${icon('reset')} 초기화</button></div><div class="slider-grid">${['a','h','k'].map(key=>`<label class="slider-card"><span>${math(key)} <b id="param-value-${key}">${p[key]}</b></span><input aria-label="그래프 변수 ${key}" type="range" min="-4" max="4" step="0.5" value="${p[key]}" data-role="explore-param" data-param="${key}"/><small>${key==='a'?'기울기 · 모양':key==='h'?'좌우 이동':'위아래 이동'}</small></label>`).join('')}</div><div class="explore-prompt">${icon('spark')} <span id="explore-insight">${insight(p)}</span></div>${compact?button(`탐구실에서 더 알아보기 ${icon('arrow')}`,'go-explore','text-button explore-more'):''}</section>`;
}
export function insight(p){
 if(p.type==='rational')return `x = ${p.h}에서는 분모가 0이에요. 두 점근선 x = ${p.h}, y = ${p.k}를 관찰해 보세요.`;
 if(p.type==='radical')return `루트 안이 0 이상이어야 해요. 현재 정의역은 x ≥ ${p.h}입니다.`;
 if(p.type==='compose')return 'f의 출력을 g의 입력에 넣어요. f(x)=a(x−h)+k, g(x)=x²의 합성 순서를 살펴보세요.';
 if(p.type==='inverse')return '입력과 출력을 바꾸면 어떤 일이 생길까요? 두 그래프는 직선 y=x에 대해 대칭이에요.';
 return `h를 바꾸면 좌우로, k를 바꾸면 위아래로! 점을 드래그하거나 슬라이더를 움직여 보세요.`;
}
export function updateExplorer(p){
 const target=document.getElementById('explore-plot');if(!target)return;
 target.innerHTML=plotSVG(p,target.dataset.compact==='true');
 document.getElementById('explore-equation').innerHTML=math(graphTypes[p.type].formula(p));
 document.getElementById('explore-insight').textContent=insight(p);
 for(const key of ['a','h','k']){document.getElementById(`param-value-${key}`).textContent=p[key];const slider=document.querySelector(`[data-param="${key}"]`);if(slider)slider.value=p[key];}
}
