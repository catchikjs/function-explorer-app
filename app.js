/* 함수 탐구실: 외부 라이브러리·서버 없이 작동하는 교실용 정적 웹앱 */
'use strict';

const STORAGE_KEY = 'function-inquiry-workbook-v1';
const CONCEPTS = [
  {id:'c1',title:'대응을 눈으로 보기',subtitle:'입력 하나에 출력은 몇 개일까?',kind:'mapping-demo'},
  {id:'c2',title:'함수의 뜻과 정의',subtitle:'하나씩, 빠짐없이 연결되는 규칙',kind:'function-rule'},
  {id:'c3',title:'정의역·공역·치역',subtitle:'출발하는 집합과 실제 도착하는 집합',kind:'three-sets'},
  {id:'c4',title:'서로 같은 함수',subtitle:'식이 달라도 함수는 같을 수 있을까?',kind:'equal-demo'},
  {id:'c5',title:'그래프와 함수',subtitle:'세로선으로 대응을 확인하기',kind:'vertical-demo'},
  {id:'c6',title:'함수의 종류 살펴보기',subtitle:'일대일·일대일대응·항등·상수',kind:'types-demo'}
];

const MAPPING_X = ['1','2','3','4'];
const MAPPING_Y = ['a','b','c'];
const QUESTIONS = [
 {id:'q01',source:'교과서 111쪽 · 스스로 익히기 1 (1)',type:'대응 판별형',group:'대응과 함수',title:'대응이 함수인지 확인하기 (1)',prompt:'다음 대응이 함수인지 확인하세요. 함수라면 정의역·공역·치역도 구하세요.',kind:'mapping',pairs:[['1','a'],['2','b'],['4','c']],correct:'no',why:'missing',strategy:'각 입력이 빠짐없이, 정확히 하나의 출력으로 연결되는지 살펴보세요.',hints:['출력으로 가는 화살표가 없는 입력은 없나요?','입력 3에서 출발하는 화살표 개수를 확인해 보세요.','모든 입력에 출력이 하나씩 있어야 함수입니다.'],explanation:'3에서 출발하는 화살표가 없으므로 함수가 아닙니다.'},
 {id:'q02',source:'교과서 111쪽 · 스스로 익히기 1 (2)',type:'대응 판별·집합 분석형',group:'대응과 함수',title:'대응이 함수인지 확인하기 (2)',prompt:'다음 대응이 함수인지 확인하세요. 함수라면 정의역·공역·치역도 구하세요.',kind:'mapping',pairs:[['1','a'],['2','b'],['3','b'],['4','c']],correct:'yes',why:'one',strategy:'모든 입력에서 화살표가 정확히 하나인지 보고, 실제 도착한 원소를 모으세요.',hints:['입력 2와 입력 3이 같은 출력 b로 연결되어도 괜찮을까요?','함수는 서로 다른 입력이 같은 출력을 가져도 됩니다.','정의역은 {1,2,3,4}, 공역은 {a,b,c}, 치역은 {a,b,c}입니다.'],explanation:'모든 입력이 정확히 하나의 출력을 가집니다. 정의역 {1,2,3,4}, 공역 {a,b,c}, 치역 {a,b,c}입니다.'},
 {id:'q03',source:'교과서 111쪽 · 스스로 익히기 1 (3)',type:'대응 판별형',group:'대응과 함수',title:'대응이 함수인지 확인하기 (3)',prompt:'다음 대응이 함수인지 확인하세요. 함수라면 정의역·공역·치역도 구하세요.',kind:'mapping',pairs:[['1','a'],['2','b'],['3','b'],['3','c'],['4','c']],correct:'no',why:'multiple',strategy:'한 입력에서 서로 다른 두 출력으로 화살표가 향하는 경우를 찾아보세요.',hints:['입력 3에서 화살표가 몇 개 나가는지 세어 보세요.','입력 3은 b와 c로 연결됩니다.','하나의 입력에서 두 출력으로 연결되면 함수가 아닙니다.'],explanation:'3에서 b와 c로 두 화살표가 나가므로 함수가 아닙니다.'},
 {id:'q04',source:'교과서 111쪽 · 스스로 익히기 2 (1)',type:'이차식의 치역 추론형',group:'정의역과 치역',title:'정의역과 치역 찾기 (1)',prompt:'함수 y = −2x² 의 정의역과 치역을 구하세요.',kind:'range',graph:'negativeSquare',formula:'y = −2x²',correctDomain:'real',correctRange:'nonpos',strategy:'x에 대한 제한을 찾고, x² ≥ 0에 음수를 곱하면 y가 어떻게 되는지 살펴보세요.',hints:['다항식에서 x가 될 수 없는 실수는 있나요?','x²은 언제나 0 이상이고, −2x²은 0 이하입니다.','정의역은 실수 전체, 치역은 {y | y ≤ 0}입니다.'],explanation:'모든 실수를 대입할 수 있고, −2x² ≤ 0이며 x=0일 때 y=0이므로 치역은 y≤0입니다.'},
 {id:'q05',source:'교과서 111쪽 · 스스로 익히기 2 (2)',type:'분모가 있는 함수의 정의역형',group:'정의역과 치역',title:'정의역과 치역 찾기 (2)',prompt:'함수 y = 4/x 의 정의역과 치역을 구하세요.',kind:'range',graph:'hyperbola4',formula:'y = 4/x',correctDomain:'nonzero',correctRange:'nonzero',strategy:'분모가 0이 될 수 없다는 조건에서 출발하고, y=0을 만들 수 있는지도 확인하세요.',hints:['어떤 x를 대입하면 4/x가 계산되지 않나요?','분자 4는 0이 아니므로 4/x는 0이 될 수 없습니다.','정의역과 치역 모두 0을 제외한 실수 전체입니다.'],explanation:'x≠0이어야 계산할 수 있고 4/x=0인 x는 없으므로 정의역·치역 모두 0을 제외한 실수입니다.'},
 {id:'q06',source:'교과서 111쪽 · 스스로 익히기 3',type:'같은 함수의 조건·연립형',group:'서로 같은 함수',title:'서로 같은 두 함수의 조건',prompt:'정의역이 {1,3}인 두 함수 f(x)=x²+a, g(x)=bx−8에 대하여 f=g일 때, 상수 a, b를 구하세요.',kind:'params',strategy:'정의역의 각 원소에서 f(x)=g(x)가 성립한다는 식을 2개 세워 보세요.',hints:['정의역이 {1,3}이므로 f(1)=g(1), f(3)=g(3)이 성립합니다.','1+a=b−8, 9+a=3b−8을 연립합니다.','두 식을 빼면 8=2b, 따라서 b=4, a=−5입니다.'],explanation:'1+a=b−8, 9+a=3b−8을 풀면 b=4, a=−5입니다.'},
 {id:'q07',source:'교과서 111쪽 · 스스로 익히기 4 (1)',type:'세로선 판별형',group:'함수의 그래프',title:'그래프로 함수 판단하기 (1)',prompt:'제시된 직선이 함수의 그래프인지 판단하세요.',kind:'graph-function',graph:'line1',correct:'yes',strategy:'같은 x에서 그래프가 서로 다른 두 y를 갖는지 세로선으로 검사하세요.',hints:['세로선을 좌우로 움직여 보세요.','세로선은 그래프와 항상 한 번 만납니다.','하나의 x에 하나의 y가 대응하므로 함수의 그래프입니다.'],explanation:'어떤 x에서도 세로선과의 교점은 하나이므로 함수입니다.'},
 {id:'q08',source:'교과서 111쪽 · 스스로 익히기 4 (2)',type:'세로선 판별형',group:'함수의 그래프',title:'그래프로 함수 판단하기 (2)',prompt:'제시된 아래로 열린 포물선이 함수의 그래프인지 판단하세요.',kind:'graph-function',graph:'parabolaDown',correct:'yes',strategy:'포물선 모양이 아니라, 같은 x에 출력이 하나인지 확인하세요.',hints:['x를 하나 정하면 y를 몇 개 찾을 수 있나요?','세로선을 움직여도 포물선과의 교점은 하나입니다.','함수의 그래프입니다.'],explanation:'포물선은 같은 x에서 y가 하나로 결정되므로 함수의 그래프입니다.'},
 {id:'q09',source:'교과서 111쪽 · 스스로 익히기 4 (3)',type:'세로선 판별형',group:'함수의 그래프',title:'그래프로 함수 판단하기 (3)',prompt:'제시된 원이 함수의 그래프인지 판단하고 이유를 찾아보세요.',kind:'graph-function',graph:'circle1',correct:'no',strategy:'x=0처럼 가운데를 지나는 세로선이 원과 몇 번 만나는지 보세요.',hints:['세로선의 위치를 x=0에 맞춰 보세요.','x=0일 때 y=1, y=−1인 두 점을 지납니다.','하나의 x에 서로 다른 y가 두 개라서 함수가 아닙니다.'],explanation:'세로선 x=0은 원과 두 점에서 만나므로 함수의 그래프가 아닙니다.'},
 {id:'q10',source:'교과서 113쪽 · 스스로 익히기 1 (1)',type:'일대일대응 판별형',group:'일대일대응',title:'일대일대응 그래프 찾기 (1)',prompt:'실수 전체에서 실수 전체로의 대응일 때, y=½x+1이 일대일대응인지 판단하세요.',kind:'bijection',graph:'lineHalf',correct:'yes',strategy:'가로선이 한 점에서 만나고 모든 실숫값 y를 만들어 내는지 확인하세요.',hints:['서로 다른 x의 출력이 겹치는지 살펴보세요.','증가하는 직선은 모든 가로선과 정확히 한 번 만납니다.','출력이 겹치지 않고 공역 ℝ 전체를 채워 일대일대응입니다.'],explanation:'기울기가 0이 아닌 일차함수는 ℝ→ℝ에서 모든 y에 대해 정확히 하나의 x를 갖기 때문에 일대일대응입니다.'},
 {id:'q11',source:'교과서 113쪽 · 스스로 익히기 1 (2)',type:'일대일대응 판별형',group:'일대일대응',title:'일대일대응 그래프 찾기 (2)',prompt:'실수 전체에서 실수 전체로의 대응일 때, y=x²−1이 일대일대응인지 판단하세요.',kind:'bijection',graph:'parabolaUp',correct:'no',strategy:'같은 y를 만드는 x가 두 개 있는지, 또 모든 실숫값 y가 나타나는지 확인하세요.',hints:['가로선을 y=0으로 옮겨 보세요.','y=0일 때 x=−1과 x=1이 가능합니다.','서로 다른 입력의 출력이 겹치고 y<−1인 값은 나오지 않으므로 일대일대응이 아닙니다.'],explanation:'y=0을 만드는 x가 −1과 1 두 개이고, 치역이 [−1,∞)라서 실수 전체인 공역과 다릅니다.'},
 {id:'q12',source:'교과서 113쪽 · 스스로 익히기 1 (3)',type:'일대일대응 판별형',group:'일대일대응',title:'일대일대응 그래프 찾기 (3)',prompt:'실수 전체에서 실수 전체로의 대응일 때, y=2|x|가 일대일대응인지 판단하세요.',kind:'bijection',graph:'abs2',correct:'no',strategy:'x와 −x의 출력이 같은지 생각하고, 음수 y를 만들 수 있는지도 확인하세요.',hints:['x=1과 x=−1을 대입해 보세요.','두 입력 모두 y=2를 만듭니다.','치역이 [0,∞)이고 출력이 중복되므로 일대일대응이 아닙니다.'],explanation:'x와 −x의 출력이 같고 y<0인 값은 만들어지지 않으므로 일대일대응이 아닙니다.'},
 {id:'q13',source:'교과서 113쪽 · 스스로 익히기 2 (1)',type:'항등함수·상수함수 구별형',group:'특별한 함수',title:'그래프의 종류 구별하기 (1)',prompt:'제시된 y=x 그래프를 보고 항등함수·상수함수인지 분류하세요.',kind:'special',graph:'identity',correct:'identity',strategy:'입력한 x와 출력 y가 언제나 같은지 생각해 보세요.',hints:['직선 위의 (0,0), (1,1)을 확인해 보세요.','모든 x에 대해 f(x)=x입니다.','항등함수입니다.'],explanation:'모든 입력 x가 그대로 출력되는 f(x)=x이므로 항등함수입니다.'},
 {id:'q14',source:'교과서 113쪽 · 스스로 익히기 2 (2)',type:'그래프의 함수 여부 선판별형',group:'특별한 함수',title:'그래프의 종류 구별하기 (2)',prompt:'제시된 x=−1인 세로 직선이 함수인지 먼저 판별하세요.',kind:'special',graph:'vertical',correct:'notfunction',strategy:'항등함수나 상수함수를 찾기 전에 함수의 그래프인지 먼저 확인하세요.',hints:['x=−1이면 y가 한 개로 정해지나요?','세로 직선에서 x=−1인 점은 여러 개입니다.','함수가 아니므로 항등함수도 상수함수도 아닙니다.'],explanation:'하나의 입력 x=−1에 여러 y가 대응하므로 함수의 그래프가 아닙니다.'},
 {id:'q15',source:'교과서 113쪽 · 스스로 익히기 2 (3)',type:'항등함수·상수함수 구별형',group:'특별한 함수',title:'그래프의 종류 구별하기 (3)',prompt:'제시된 y=2 그래프를 보고 항등함수·상수함수인지 분류하세요.',kind:'special',graph:'constant2',correct:'constant',strategy:'x가 바뀌어도 y가 항상 같은지 확인하세요.',hints:['x=−2, x=0, x=2일 때 y를 비교하세요.','항상 y=2입니다.','상수함수입니다.'],explanation:'모든 입력에 대하여 같은 값 2가 출력되는 f(x)=2이므로 상수함수입니다.'},
 {id:'q16',source:'교과서 113쪽 · 스스로 익히기 3',type:'여러 함수 종합 분류형',group:'함수의 종류',title:'여러 함수의 성질 분류하기',prompt:'다음 함수들을 일대일함수, 일대일대응, 항등함수, 상수함수로 각각 분류하세요. (정의역·공역은 실수 전체)',kind:'classify',strategy:'출력 중복 → 공역 전체 사용 → 입력 그대로 → 출력 고정 순서로 확인하세요.',hints:['ㄱ은 기울기가 0이 아닌 일차함수, ㄴ은 상수함수입니다.','ㄷ은 y=x, ㄹ은 x<0에서 3x, x≥0에서 x²이며 두 부분의 치역이 겹치지 않습니다.','일대일함수·일대일대응: ㄱ ㄷ ㄹ / 항등함수: ㄷ / 상수함수: ㄴ'],explanation:'ㄱ y=5x+7, ㄷ y=x, ㄹ의 구간별 함수는 각각 모든 실수 y를 정확히 한 번 만들므로 일대일함수·일대일대응입니다. ㄷ은 항등함수, ㄴ y=−3은 상수함수입니다.'}
];

const DEFAULT_STATE = {
  view:'welcome',studentName:'',conceptIndex:0,questionIndex:0,
  completedConcepts:[],conceptSelection:{},demoInput:'1',demoDomain:'small',demoX:0,
  answers:{},graphCoordinate:0
};
let state = loadState();
let root = document.getElementById('app');

function loadState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return s&&typeof s==='object'?{...structuredCloneSafe(DEFAULT_STATE),...s}:structuredCloneSafe(DEFAULT_STATE);}catch(e){return structuredCloneSafe(DEFAULT_STATE)}}
function structuredCloneSafe(obj){return JSON.parse(JSON.stringify(obj))}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){ /* 저장소 제한 시 현재 화면은 계속 이용 가능 */ }}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function responseFor(id){return state.answers[id]||(state.answers[id]={});}
function isConceptCompleted(id){return state.completedConcepts.includes(id)}
function correctCount(){return QUESTIONS.filter(q=>state.answers[q.id]?.correct).length}
function totalAttempts(){return QUESTIONS.reduce((sum,q)=>sum+(state.answers[q.id]?.attempts||0),0)}
function totalHints(){return QUESTIONS.reduce((sum,q)=>sum+(state.answers[q.id]?.hintsViewed||0),0)}
function unique(arr){return [...new Set(arr)]}
function sameArray(a,b){return JSON.stringify((a||[]).slice().sort())===JSON.stringify((b||[]).slice().sort())}
function chosen(field,value,selected){return `<button type="button" class="choice ${selected?'selected':''}" data-action="choose" data-field="${esc(field)}" data-value="${esc(value)}" aria-pressed="${selected?'true':'false'}">`}
function btn(label,action,classes='',attrs=''){return `<button type="button" class="btn ${classes}" data-action="${action}" ${attrs}>${label}</button>`}
function getQuestion(){return QUESTIONS[Math.max(0,Math.min(QUESTIONS.length-1,state.questionIndex))]}

/* SVG로 원본 학습지의 대응/그래프를 새롭게 그린다. */
function mapDiagram(pairs, ids='diagram'){
  const xPos=87,yPos=350,X=[53,92,131,170],Y=[67,112,157],links=pairs.map(([a,b])=>{
    let xi=MAPPING_X.indexOf(a),yi=MAPPING_Y.indexOf(b);if(xi<0||yi<0)return '';
    return `<path d="M 110 ${X[xi]} Q 221 ${(X[xi]+Y[yi])/2} 314 ${Y[yi]}" fill="none" stroke="#67949b" stroke-width="2.6" marker-end="url(#arrow-${ids})"/>`;
  }).join('');
  return `<svg role="img" aria-label="왼쪽 X는 1,2,3,4이고 오른쪽 Y는 a,b,c인 대응 관계" viewBox="0 0 440 225" xmlns="http://www.w3.org/2000/svg"><defs><marker id="arrow-${ids}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#67949b"/></marker></defs><rect width="440" height="225" fill="#fff" rx="14"/><text x="86" y="20" text-anchor="middle" font-size="15" fill="#3c6088" font-weight="700">X</text><text x="347" y="20" text-anchor="middle" font-size="15" fill="#297e68" font-weight="700">Y</text><ellipse cx="86" cy="114" rx="40" ry="96" fill="#edf5fc" stroke="#bad3e8"/><ellipse cx="347" cy="114" rx="40" ry="96" fill="#eaf8f3" stroke="#bedfd2"/>${links}${MAPPING_X.map((v,i)=>`<circle cx="${xPos}" cy="${X[i]}" r="17" fill="#d7e7f9"/><text x="${xPos}" y="${X[i]+5}" text-anchor="middle" font-size="16" font-weight="700" fill="#2a5a85">${v}</text>`).join('')}${MAPPING_Y.map((v,i)=>`<circle cx="${yPos}" cy="${Y[i]}" r="17" fill="#d9f2e8"/><text x="${yPos}" y="${Y[i]+5}" text-anchor="middle" font-size="16" font-weight="700" fill="#177b63">${v}</text>`).join('')}</svg>`;
}

const graphFunctions={
 negativeSquare:x=>-2*x*x, hyperbola4:x=>Math.abs(x)<.04?NaN:4/x,
 line1:x=>x+1,parabolaDown:x=>1-x*x,circle1:x=>Math.abs(x)>1?NaN:Math.sqrt(Math.max(0,1-x*x)),
 lineHalf:x=>.5*x+1,parabolaUp:x=>x*x-1,abs2:x=>2*Math.abs(x),
 identity:x=>x,constant2:x=>2,vertical:x=>NaN
};
function graphYLabel(graph){return ({negativeSquare:'y = −2x²',hyperbola4:'y = 4/x',line1:'직선',parabolaDown:'포물선',circle1:'x²+y² = 1',lineHalf:'y = ½x+1',parabolaUp:'y = x²−1',abs2:'y = 2|x|',identity:'y = x',constant2:'y = 2',vertical:'x = −1'})[graph]||''}
function pointsToPath(fn,left,right,mapX,mapY,step=.025){
 let path='',drawing=false;
 for(let x=left;x<=right+step/2;x+=step){
  const y=fn(x);
  if(!Number.isFinite(y)||y>4||y< -4){drawing=false;continue}
  path+=(drawing?' L':' M')+mapX(x).toFixed(2)+','+mapY(y).toFixed(2);drawing=true;
 }
 return path.trim();
}
function intersectionCount(graph,axis,val){const eps=1e-7;if(axis==='x'){
 if(graph==='vertical')return Math.abs(val+1)<.01?'많음':0;
 if(graph==='circle1')return Math.abs(val)<1-eps?2:Math.abs(val-1)<eps||Math.abs(val+1)<eps?1:0;
 const y=graphFunctions[graph]?.(val);return Number.isFinite(y)?1:0;
 }
 switch(graph){
 case 'lineHalf':case 'line1':case 'identity':return 1;
 case 'parabolaUp':return val< -1?0:Math.abs(val+1)<.001?1:2;
 case 'parabolaDown':return val>1?0:Math.abs(val-1)<.001?1:2;
 case 'abs2':return val<0?0:Math.abs(val)<.001?1:2;
 case 'constant2':return Math.abs(val-2)<.001?'많음':0;
 default:return null;
 }
}
function graphSvg(graph,axis='x',pos=0){
 const xMin=-5.5,xMax=5.5,yMin=-3,yMax=3;
 const X=x=>42+(x-xMin)/(xMax-xMin)*416;const Y=y=>250-(y-yMin)/(yMax-yMin)*215;
 let paths='';
 if(graph==='vertical'){paths=`<line x1="${X(-1)}" x2="${X(-1)}" y1="${Y(3)}" y2="${Y(-3)}" stroke="#327bb1" stroke-width="3.5"/>`;}
 else if(graph==='circle1'){paths=`<ellipse cx="${X(0)}" cy="${Y(0)}" rx="${X(1)-X(0)}" ry="${Y(0)-Y(1)}" fill="none" stroke="#267e97" stroke-width="3.6"/>`;}
 else if(graph==='hyperbola4'){
 const fn=graphFunctions[graph]; for(const [a,b] of [[-5.5,-.05],[.05,5.5]]){
 const path=pointsToPath(fn,a,b,X,Y);paths+=`<path d="${path}" fill="none" stroke="#267e97" stroke-width="3.2" vector-effect="non-scaling-stroke"/>`;
 }
 }else{
 const path=pointsToPath(graphFunctions[graph],xMin,xMax,X,Y);
 paths=`<path d="${path}" fill="none" stroke="#267e97" stroke-width="3.2" vector-effect="non-scaling-stroke"/>`;
 }
 const selectedVal=Number(pos);
 const selector=axis==='x'?`<line x1="${X(selectedVal)}" x2="${X(selectedVal)}" y1="28" y2="257" stroke="#de8d47" stroke-width="2.6" stroke-dasharray="6 5"/>`:`<line x1="35" x2="463" y1="${Y(selectedVal)}" y2="${Y(selectedVal)}" stroke="#de8d47" stroke-width="2.6" stroke-dasharray="6 5"/>`;
 const grid=[]; for(let i=-3;i<=3;i++){
 grid.push(`<line x1="${X(i)}" x2="${X(i)}" y1="25" y2="256" stroke="#edf3f7"/><line x1="35" x2="462" y1="${Y(i)}" y2="${Y(i)}" stroke="#edf3f7"/>`)
 }
 return `<svg viewBox="0 0 490 279" role="img" aria-label="${esc(graphYLabel(graph))} 그래프. 주황색 ${axis==='x'?'세로선':'가로선'}을 움직이며 교점 개수를 조사합니다." xmlns="http://www.w3.org/2000/svg"><rect width="490" height="279" rx="15" fill="white"/>${grid.join('')}<line x1="35" x2="464" y1="${Y(0)}" y2="${Y(0)}" stroke="#6e8493" stroke-width="1.5"/><line x1="${X(0)}" x2="${X(0)}" y1="25" y2="259" stroke="#6e8493" stroke-width="1.5"/><text x="469" y="${Y(0)-7}" font-size="15" fill="#647784">x</text><text x="${X(0)+7}" y="22" font-size="15" fill="#647784">y</text><text x="${X(0)-13}" y="${Y(0)+18}" font-size="12" fill="#8998a4">0</text><defs><clipPath id="plotArea"><rect x="35" y="25" width="428" height="232"/></clipPath></defs><g clip-path="url(#plotArea)">${paths}${selector}</g><text x="35" y="272" font-size="12" fill="#7d909e">${esc(graphYLabel(graph))}</text></svg>`;
}

function renderShell(inner){
 const progress=correctCount();
 root.innerHTML=`<div class="app-shell">
 <aside class="sidebar" aria-label="학습 메뉴">
  <div class="brand"><span class="brand-mark">ƒ</span><span>함수 탐구실</span></div>
  <div class="side-caption">LEARNING JOURNEY</div>
  <div class="side-menu">
   <button type="button" class="side-item ${state.view==='welcome'?'active':''}" data-action="go-welcome"><span class="num">00</span> 시작하기</button>
   <button type="button" class="side-item ${state.view==='concept'?'active':''}" data-action="go-concept"><span class="num">01</span> 개념 탐구 <span style="margin-left:auto;font-size:.7rem;">${state.completedConcepts.length}/6</span></button>
   <button type="button" class="side-item ${state.view==='practice'?'active':''}" data-action="go-practice" ${state.completedConcepts.length<CONCEPTS.length?'disabled title="개념을 모두 탐구한 뒤 열립니다"':''}><span class="num">02</span> 문제 해결 <span style="margin-left:auto;font-size:.7rem;">${progress}/16</span></button>
   <button type="button" class="side-item ${state.view==='summary'?'active':''}" data-action="go-summary"><span class="num">03</span> 성장 기록</button>
  </div>
  <div class="side-note">✦ 한 문제씩, 나의 속도로<br/>관찰하고 → 설명하고 → 수정하는 수학 학습</div>
  <div class="side-foot">교과서 109~113쪽 학습지 재구성<br/>학생용 · 태블릿/PC 지원<br/>기록은 현재 브라우저에만 저장</div>
 </aside>
 <main class="content">
  <div class="topline"><span class="eyebrow">GOOD MATH LAB · DIGITAL WORKSHEET</span><span class="user-chip">${state.studentName?esc(state.studentName)+'의 탐구 기록':'나의 수학 탐구'}</span></div>
  ${inner}
  <div class="foot-line">스스로 발견한 가능성과 자신감 · 함수의 뜻과 그래프</div>
 </main></div>`;
 setupDrawingCanvas();
}

function renderWelcome(){
 renderShell(`<section class="hero"><span class="eyebrow">DISCOVER · CONNECT · EXPLAIN</span><h1>함수, 외우지 말고<br/>직접 발견해 보자.</h1><p>그림의 연결을 살펴보고, 그래프를 움직이고, 힌트를 스스로 선택하며 배워요. 모든 문제는 화면에 하나씩 나타납니다.</p>
 <div class="row mt-3">${btn('개념 탐구 시작하기 →','start-concept','teal')}${state.completedConcepts.length===CONCEPTS.length?btn('이어서 문제 풀기','go-practice','light'):''}</div></section>
 <div class="overview-grid"><div class="overview-card"><strong>6단계</strong><span>상호작용 개념 학습</span></div><div class="overview-card"><strong>16문제</strong><span>교과서 기반 탐구 활동</span></div><div class="overview-card"><strong>3단계</strong><span>관찰 → 적용 → 설명</span></div></div>
 <section class="panel"><h2 class="section-title">오늘의 탐구는 이렇게 진행돼요</h2><div class="steps"><div class="step"><span class="step-number">01 · UNDERSTAND</span><strong>연결을 직접 확인</strong><p>함수와 세 집합의 뜻을 그림으로 이해하고 개념 퀴즈에 답해요.</p></div><div class="step"><span class="step-number">02 · INVESTIGATE</span><strong>유형을 알고 도전</strong><p>문제마다 접근 전략과 선택형 힌트가 제시돼요.</p></div><div class="step"><span class="step-number">03 · REFLECT</span><strong>내 풀이를 고쳐 쓰기</strong><p>판단한 이유를 기록하고 결과와 학습 과정을 확인해요.</p></div></div>
 <div class="separator"></div><label for="student-name" class="field-label">기록에 표시할 이름 또는 별명 (선택)</label><input id="student-name" class="field" maxlength="24" value="${esc(state.studentName)}" data-role="student-name" placeholder="예: 수학 탐험가" style="max-width:350px"/><p class="source-note mt-1">이름과 풀이 기록은 현재 기기의 브라우저에 저장됩니다. 교사에게 자동 전송되지 않으며, 결과 파일은 직접 내려받을 수 있습니다.</p></section>`);
}

function conceptQuiz(id, question,options){
 const val=state.conceptSelection[id]||'';const f=state.conceptFeedback?.[id];
 return `<section class="concept-check" aria-label="개념 확인 문제"><div class="eyeline">✓ 내 생각 확인하기</div><h3 class="mt-1">${question}</h3><div class="choice-grid">${options.map(o=>`${chosen('concept',o.value,val===o.value)}${o.label}</button>`).join('')}</div>${btn('개념 확인','check-concept','teal')}${f?`<div class="mini-result ${f.ok?'ok':'bad'}" role="status">${esc(f.message)}</div>`:''}</section>`;
}
function conceptBody(c){
 switch(c.kind){
  case 'mapping-demo':{
   const matches={'1':'a','2':'a','3':'c','4':'c'};
   return `<div class="concept-grid"><div class="study-card"><h3>연결 그림을 눌러 생각해 보세요</h3><p>입력은 X에서 출발하고, 출력은 Y에 도착합니다. <b>하나의 입력</b>에서 몇 개의 화살표가 출발하는지가 중요해요.</p><div class="svg-frame">${mapDiagram([['1','a'],['2','a'],['3','c'],['4','c']],'demo')}</div><div class="note mt-2">서로 다른 두 입력이 같은 출력에 도착해도 함수가 될 수 있습니다.</div></div>
   <div class="study-card"><h3>입력을 하나 눌러 출력 관찰하기</h3><div class="choice-grid">${Object.keys(matches).map(k=>`${chosen('demo-input',k,state.demoInput===k)}입력 ${k}</button>`).join('')}</div><div class="formula-strip">${esc(state.demoInput)} → ${esc(matches[state.demoInput]||'a')}</div><p class="subtext mt-2">입력 하나에는 반드시 출력이 정확히 하나여야 합니다.</p></div></div>
   ${conceptQuiz(c.id,'한 입력에서 서로 다른 출력 두 개가 나오면 함수일까요?',[{value:'yes',label:'네, 함수예요'},{value:'no',label:'아니요, 함수가 아니에요'}])}`;
  }
  case 'function-rule':
   return `<div class="concept-grid"><div class="study-card"><h3>함수의 정의</h3><p>두 집합 X, Y에 대하여 <b>X의 각 원소에 Y의 원소가 오직 하나씩 대응</b>하면 이 대응을 X에서 Y로의 함수라고 합니다.</p><div class="note">중요! 함수는 '모든 입력에서 출발'해야 하고, '한 입력의 출력은 하나'여야 합니다.</div></div><div class="study-card"><h3>세 가지 대응 비교</h3><div class="mini-grid"><div class="mini-box"><b>A</b>1→a<br/>2→a</div><div class="mini-box"><b>B</b>1→a<br/>2→없음</div><div class="mini-box"><b>C</b>1→a,b<br/>2→b</div></div><p class="subtext mt-2">다른 입력이 같은 출력을 만드는 것과 한 입력이 두 출력을 만드는 것은 달라요.</p></div></div>
   ${conceptQuiz(c.id,'A, B, C 중 함수인 대응은 무엇인가요?',[{value:'A',label:'A'},{value:'B',label:'B'},{value:'C',label:'C'}])}`;
  case 'three-sets':
   return `<div class="concept-grid"><div class="study-card"><h3>세 집합을 구별해요</h3><div class="svg-frame">${mapDiagram([['1','a'],['2','a'],['3','b'],['4','b']],'threesets')}</div><p class="subtext mt-2">c는 공역에는 있지만, 실제 도착한 화살표는 없어요.</p></div><div class="study-card"><div class="mini-box"><b>정의역</b>X = {1, 2, 3, 4}</div><div class="mini-box mt-1"><b>공역</b>Y = {a, b, c}</div><div class="mini-box mt-1"><b>치역</b>실제로 도착한 원소들의 집합</div><div class="note mt-2">치역은 공역의 부분집합이에요. 공역에 있다고 모두 치역에 들어가지는 않습니다.</div></div></div>
   ${conceptQuiz(c.id,'위 그림의 치역은 어느 집합인가요?',[{value:'abc',label:'{a, b, c}'},{value:'ab',label:'{a, b}'},{value:'1234',label:'{1, 2, 3, 4}'}])}`;
  case 'equal-demo':{
   const isSmall=state.demoDomain==='small',xs=isSmall?[-1,1]:[-1,1,2];
   return `<div class="concept-grid"><div class="study-card"><h3>식이 다르지만 같은 함수?</h3><p><b>f(x)=x</b>와 <b>g(x)=x³</b>, 공역은 둘 다 실수 전체라고 생각해 봅시다.</p><div class="choice-grid">${chosen('demo-domain','small',isSmall)}정의역 {−1, 1}</button>${chosen('demo-domain','big',!isSmall)}정의역 {−1, 1, 2}</button></div><div class="formula-strip small">${xs.map(x=>`x=${x} : f(x)=${x}, g(x)=${x**3}`).join('<br/>')}</div></div><div class="study-card"><h3>서로 같은 함수의 3가지 조건</h3><p>① <b>정의역</b>이 같아야 합니다.<br/>② <b>공역</b>이 같아야 합니다.<br/>③ 정의역의 <b>모든 입력에서 출력</b>이 같아야 합니다.</p><div class="note">식의 모양만 보고 판단하면 안 됩니다. 정의역이 무엇인지에 따라 결론이 달라져요.</div></div></div>
   ${conceptQuiz(c.id,'현재 선택한 정의역에서 f와 g는 서로 같은 함수인가요?',[{value:'equal',label:'네, 같아요'},{value:'different',label:'아니요, 달라요'}])}`;
  }
  case 'vertical-demo':{
   const n=intersectionCount('circle1','x',state.demoX);
   return `<div class="concept-grid"><div class="study-card"><h3>세로선을 움직여 보기</h3><div class="svg-frame" id="concept-graph">${graphSvg('circle1','x',state.demoX)}</div><div class="graph-control"><label class="field-label" for="demo-x">세로선의 x값: <span id="concept-coordinate">${state.demoX}</span></label><input id="demo-x" type="range" min="-1.5" max="1.5" step="0.5" value="${state.demoX}" data-role="demo-x"/><p class="mb-0">현재 만나는 점의 개수: <b id="concept-crossings">${n}개</b></p></div></div><div class="study-card"><h3>세로선 판별법</h3><p>함수의 그래프라면 같은 x에서 출력 y가 여러 개일 수 없습니다.</p><p>세로선을 그었을 때 그래프와 두 점 이상 만나는 위치가 하나라도 있으면 함수의 그래프가 아니에요.</p><div class="note">x=0에 세로선을 놓고 원과 만나는 점을 세어 보세요.</div></div></div>
   ${conceptQuiz(c.id,'위 원 전체는 y를 x의 함수로 나타낸 그래프인가요?',[{value:'yes',label:'네'},{value:'no',label:'아니요'}])}`;
  }
  case 'types-demo':
   return `<div class="study-card"><h3>함수의 종류를 비교해요</h3><div class="two-column-prompt"><div class="mini-box"><b>일대일함수</b>서로 다른 입력은 서로 다른 출력</div><div class="mini-box"><b>일대일대응</b>일대일함수이면서 치역=공역</div><div class="mini-box"><b>항등함수</b>모든 x에서 f(x)=x</div><div class="mini-box"><b>상수함수</b>모든 x에서 f(x)=c (일정)</div></div><div class="note mt-2">일대일대응은 <b>출력이 겹치지 않는지</b>와 <b>공역의 모든 원소가 사용되는지</b> 두 가지를 확인합니다.</div></div>
   ${conceptQuiz(c.id,'f(x)=2에서 x를 바꿔도 출력이 계속 2라면 어떤 함수인가요?',[{value:'identity',label:'항등함수'},{value:'constant',label:'상수함수'},{value:'none',label:'함수가 아님'}])}`;
 }
 return '';
}
function conceptAnswerCheck(id){
 const a=state.conceptSelection[id];const answers={c1:'no',c2:'A',c3:'ab',c4:state.demoDomain==='small'?'equal':'different',c5:'no',c6:'constant'};
 if(!a)return {ok:false,message:'선택지를 하나 고른 뒤 확인해 보세요.'};
 if(a===answers[id])return {ok:true,message:'좋아요! 관찰한 규칙이 정확해요. 다음 단계로 이동할 수 있습니다.'};
 const gentle={c1:'한 입력에 출력이 여러 개여도 괜찮은지 다시 생각해 보세요.',c2:'모든 입력이 정확히 한 출력을 가져야 합니다.',c3:'공역의 원소 중 실제 화살표가 도착한 것만 모아 보세요.',c4:'선택한 정의역의 모든 원소를 함수식에 각각 대입해 보세요.',c5:'x=0을 지나도록 세로선을 움직여 보세요.',c6:'x가 달라지는데도 같은 값만 나오나요?'};
 return {ok:false,message:gentle[id]||'다시 관찰해 보세요.'};
}
function renderConcept(){
 const c=CONCEPTS[Math.max(0,Math.min(CONCEPTS.length-1,state.conceptIndex))];
 renderShell(`<div class="screen-heading"><div><span class="eyeline">STEP 01 · INTERACTIVE CONCEPT</span><h2>${esc(c.title)}</h2><p class="subtext mb-0">${esc(c.subtitle)}</p></div><span class="tag">${state.conceptIndex+1} / ${CONCEPTS.length} 단계</span></div>
 <div class="progress-track" role="progressbar" aria-label="개념 학습 진행률" aria-valuenow="${state.completedConcepts.length}" aria-valuemin="0" aria-valuemax="${CONCEPTS.length}"><div class="progress-bar" style="width:${state.completedConcepts.length/CONCEPTS.length*100}%"></div></div>
 <section class="panel mt-2">${conceptBody(c)}<div class="sticky-actions">${btn('← 이전 단계','concept-prev','light',state.conceptIndex===0?'disabled':'')}
 ${state.conceptIndex===CONCEPTS.length-1?btn('교과서 문제 탐구 시작 →','concept-next','teal',isConceptCompleted(c.id)?'':'disabled'):btn('다음 개념 →','concept-next','teal',isConceptCompleted(c.id)?'':'disabled')}</div>
 <p class="source-note mt-1">개념 설명은 첨부 학습지 109~113쪽의 내용을 바탕으로 재구성했습니다. 개념 확인 문항은 앱을 위해 새롭게 구성했습니다.</p></section>`);
}

function rangeChoices(field,value){
 const items=field==='domain'?[
  {value:'real',label:'실수 전체 (ℝ)'},{value:'nonzero',label:'0을 제외한 실수'},{value:'nonnegative',label:'0 이상의 실수'}
 ]:[
  {value:'nonpos',label:'0 이하의 실수 (y≤0)'},{value:'nonzero',label:'0을 제외한 실수'},{value:'nonnegative',label:'0 이상의 실수 (y≥0)'},{value:'real',label:'실수 전체 (ℝ)'}
 ];
 return items.map(o=>`${chosen(field,o.value,value===o.value)}${o.label}</button>`).join('');
}
function renderVisual(q){
 if(q.kind==='mapping')return `<div class="svg-frame mt-2">${mapDiagram(q.pairs,'map-'+q.id)}</div><p class="source-note mt-1">왼쪽 X의 각 원소에서 출발하는 화살표를 직접 세어 보세요.</p>`;
 if(q.kind==='params')return `<div class="formula-strip small mt-2"><span class="math">X={1,3}</span><br/><span class="math">f(x)=x²+a &nbsp;&nbsp; g(x)=bx−8</span><br/><b>f=g</b></div>`;
 if(q.kind==='classify')return `<div class="formula-strip small mt-2" style="text-align:left"><b>보기</b><div class="two-column-prompt mt-2"><div>ㄱ. <span class="math">y=5x+7</span></div><div>ㄴ. <span class="math">y=−3</span></div><div>ㄷ. <span class="math">y=x</span></div><div>ㄹ. <span class="math">y={x² (x≥0), 3x (x&lt;0)}</span></div></div></div><p class="source-note mt-1">ㄹ의 함수는 x가 0 이상일 때 x², 0 미만일 때 3x를 사용합니다.</p>`;
 if(q.graph){
   const axis=q.kind==='bijection'?'y':'x';const coord=Number(state.graphCoordinate)||0;const n=intersectionCount(q.graph,axis,coord);
   const val=q.kind==='range'?(Math.abs(coord)<.01&&q.graph==='hyperbola4'?'정의되지 않음':(Math.round(graphFunctions[q.graph](coord)*100)/100)) :null;
   return `<div class="svg-frame mt-2" id="active-graph">${graphSvg(q.graph,axis,coord)}</div><div class="graph-control"><label class="field-label" for="graph-scanner">${axis==='x'?'세로선 x':'가로선 y'} = <span id="graph-coordinate">${coord}</span></label><input id="graph-scanner" type="range" min="-3" max="3" step="0.5" value="${coord}" data-role="graph-slider"/>
   <div class="row space-between"><span class="source-note">${q.kind==='range'?'이때 함수값:':'이 선과 그래프가 만나는 점의 개수:'}</span><span class="floating-marker" id="graph-readout">${q.kind==='range'?val:(n===null?'?':n+'개')}</span></div></div>`;
 }
 return '';
}
function singleChoices(field,value,opts){return `<div class="choice-grid">${opts.map(o=>`${chosen(field,o.value,value===o.value)}${o.label}</button>`).join('')}</div>`;}
function renderAnswerForm(q,r){
 switch(q.kind){
 case 'mapping':return `<div class="answer-section"><div class="field-label">1. 각 입력이 정확히 하나의 출력과 대응하나요?</div>${singleChoices('answer',r.answer,[{value:'yes',label:'네 · 함수입니다'},{value:'no',label:'아니요 · 함수가 아닙니다'}])}
 <div class="field-label">2. 그렇게 판단한 근거를 선택하세요.</div>${singleChoices('why',r.why,[{value:'one',label:'모든 입력의 출력이 하나씩'}, {value:'missing',label:'출력이 없는 입력이 있음'},{value:'multiple',label:'두 출력으로 이어지는 입력이 있음'}])}
 ${r.answer==='yes'?`<div class="answer-section"><div class="field-label">3. 함수라면 세 집합을 구별해 보세요.</div><div class="field-label">정의역</div>${singleChoices('domain',r.domain,[{value:'1234',label:'{1,2,3,4}'},{value:'124',label:'{1,2,4}'},{value:'abc',label:'{a,b,c}'}])}<div class="field-label">공역</div>${singleChoices('codomain',r.codomain,[{value:'abc',label:'{a,b,c}'},{value:'ab',label:'{a,b}'},{value:'1234',label:'{1,2,3,4}'}])}<div class="field-label">치역</div>${singleChoices('range',r.range,[{value:'abc',label:'{a,b,c}'},{value:'ab',label:'{a,b}'},{value:'bc',label:'{b,c}'}])}</div>`:''}</div>`;
 case 'range':return `<div class="answer-section"><div class="field-label">1. x가 될 수 있는 수의 범위는? (정의역)</div><div class="choice-grid">${rangeChoices('domain',r.domain)}</div><div class="field-label">2. y가 실제로 나오는 범위는? (치역)</div><div class="choice-grid">${rangeChoices('range',r.range)}</div></div>`;
 case 'params':return `<div class="answer-section"><div class="field-label">정의역의 두 입력을 대입해 식을 만든 후 답을 입력하세요.</div><div class="inline-fields"><div><label class="field-label" for="param-a">a의 값</label><input class="field" type="number" step="any" id="param-a" data-role="param" data-field="a" value="${esc(r.a??'')}" placeholder="a = ?"/></div><div><label class="field-label" for="param-b">b의 값</label><input class="field" type="number" step="any" id="param-b" data-role="param" data-field="b" value="${esc(r.b??'')}" placeholder="b = ?"/></div></div></div>`;
 case 'graph-function':return `<div class="answer-section"><div class="field-label">1. 함수의 그래프인가요?</div>${singleChoices('answer',r.answer,[{value:'yes',label:'함수의 그래프입니다'},{value:'no',label:'함수의 그래프가 아닙니다'}])}<div class="field-label">2. 세로선으로 확인한 근거는?</div>${singleChoices('why',r.why,[{value:'single',label:'각 세로선과 한 점에서 만남'},{value:'two',label:'어떤 세로선과 두 점에서 만남'}])}</div>`;
 case 'bijection':return `<div class="answer-section"><div class="field-label">1. 일대일대응의 그래프인가요?</div>${singleChoices('answer',r.answer,[{value:'yes',label:'네 · 일대일대응'}, {value:'no',label:'아니요 · 일대일대응 아님'}])}<div class="field-label">2. 이유를 선택하세요.</div>${singleChoices('why',r.why,[{value:'unique-all',label:'출력 중복이 없고 모든 실수 출력 가능'},{value:'repeat-or-miss',label:'출력이 겹치거나 나오지 않는 값이 있음'}])}</div>`;
 case 'special':return `<div class="answer-section"><div class="field-label">그래프가 나타내는 대상을 분류해 보세요.</div>${singleChoices('answer',r.answer,[{value:'identity',label:'항등함수'},{value:'constant',label:'상수함수'},{value:'notfunction',label:'함수가 아님'},{value:'other',label:'그 외의 함수'}])}</div>`;
 case 'classify':{
   const groups=[{field:'one',label:'① 일대일함수'},{field:'bijective',label:'② 일대일대응'},{field:'identity',label:'③ 항등함수'},{field:'constant',label:'④ 상수함수'}];
   return groups.map(g=>`<div class="answer-section"><div class="field-label">${g.label}에 해당하는 것을 모두 고르세요.</div><div class="choice-grid">${['ㄱ','ㄴ','ㄷ','ㄹ'].map(item=>`${chosen('group-'+g.field,item,(r[g.field]||[]).includes(item))}${item}</button>`).join('')}</div></div>`).join('');
 }
 }
 return '';
}
function renderHintBox(q,r){
 const opened=r.hintsViewed||0;
 return `<div class="eyeline">도움말은 필요할 때만</div><h3 class="mt-1">스스로 탐구하는 힌트</h3><p class="subtext">먼저 고민해 보고, 막히면 힌트를 하나씩 열어 보세요.</p>${q.hints.slice(0,opened).map((h,i)=>`<div class="hint-card"><b>힌트 ${i+1}</b><br/>${esc(h)}</div>`).join('')}
 ${opened<q.hints.length?btn(`힌트 ${opened+1} 열어 보기`,'show-hint','soft small'): '<div class="mini-result">힌트를 모두 확인했어요. 이제 나의 말로 설명해 보세요.</div>'}
 <div class="separator"></div><h3>문제 접근 유형</h3><span class="tag purple">${esc(q.type)}</span><p class="mt-2 mb-0 explainer">${esc(q.strategy)}</p>`;
}
function renderFeedback(r){
 if(!r.checked||!r.feedback)return '';
 return `<section class="feedback ${r.correct?'ok':''}" role="status"><strong>${r.correct?'✓ 탐구 성공!':'↻ 다시 관찰해 볼까요?'}</strong><p>${esc(r.feedback)}</p></section>`;
}
function renderPractice(){
 if(state.completedConcepts.length<CONCEPTS.length){state.view='concept';save();renderConcept();return}
 const q=getQuestion(),r=responseFor(q.id);
 renderShell(`<div class="screen-heading"><div><span class="eyeline">STEP 02 · ONE QUESTION AT A TIME</span><h2>${esc(q.title)}</h2><div class="row"><span class="tag">${esc(q.group)}</span><span class="tag purple">${esc(q.type)}</span><span class="source-ref">${esc(q.source)}</span></div></div><span class="tag gold">${state.questionIndex+1} / ${QUESTIONS.length} 문제</span></div>
 <div class="row space-between"><span class="progress-title">맞혀서 해결한 문제 ${correctCount()} / ${QUESTIONS.length}</span><span class="source-ref">${Math.round(correctCount()/QUESTIONS.length*100)}%</span></div><div class="progress-track mt-1"><div class="progress-bar" style="width:${correctCount()/QUESTIONS.length*100}%"></div></div>
 <section class="panel mt-2"><div class="question-surface"><div class="eyeline">문제 읽기 · 조건 표시하기</div><div class="question-text mt-1">${esc(q.prompt)}</div>${renderVisual(q)}</div><div class="strategy-line mt-2"><b>이 문제에 접근하는 방법</b><br/>${esc(q.strategy)}</div>
 <div class="exercise-layout"><div class="question-panel"><div class="row space-between"><h3>나의 탐구와 답</h3><span class="floating-marker">관찰 → 적용 → 설명</span></div>
 <label class="field-label" for="observation">① 발견한 조건을 내 말로 적기 (선택)</label><textarea class="field" rows="2" id="observation" data-role="note" data-field="observation" placeholder="예: 입력 3에는 화살표가 없어서...">${esc(r.observation||'')}</textarea>
 <div class="problem-form">${renderAnswerForm(q,r)}</div>
 <div class="drawing-section"><div class="row space-between"><span class="eyeline">✎ 손으로 직접 풀어 보기</span>${btn('지우기','clear-canvas','light xsmall')}</div><canvas class="drawing" width="960" height="240" aria-label="손글씨로 풀이를 그리는 캔버스" data-drawing="${esc(q.id)}"></canvas><span class="drawing-caption">마우스·손가락·애플펜슬로 그릴 수 있어요. 그림은 현재 브라우저에만 저장됩니다.</span></div>
 <label class="field-label mt-2" for="explanation">② 나의 풀이 이유 또는 수정한 생각 (선택)</label><textarea class="field" rows="3" id="explanation" data-role="note" data-field="explanation" placeholder="처음에는 ...라고 생각했지만 ...라는 이유로 수정했어요.">${esc(r.explanation||'')}</textarea>
 <div class="row mt-2">${btn('내 답 확인하기','check-question','teal')}</div>${renderFeedback(r)}</div>
 <aside class="tool-panel">${renderHintBox(q,r)}<div class="separator"></div><h3>학습 메모</h3><p class="source-note">틀려도 괜찮아요. 힌트를 확인하고 답을 바꿔 다시 제출하면 수정 과정이 기록됩니다.</p><p class="source-note">답을 맞히면 풀이 근거가 표시됩니다. 학습 기록은 자동으로 이 기기에 저장됩니다.</p></aside></div>
 <div class="sticky-actions"><div class="row">${btn('← 이전 문제','question-prev','light',state.questionIndex===0?'disabled':'')}${btn('문제 목록 · 결과','go-summary','ghost')}</div>${btn(state.questionIndex===QUESTIONS.length-1?'결과 확인하기 →':'다음 문제 →','question-next','teal',!(r.attempts>0)?'disabled title="답을 한 번 제출하면 이동할 수 있습니다"':'')}</div>
 <p class="source-note">※ 교과서 113쪽의 그래프 분류 문제는 정의역과 공역을 실수 전체로 설정하여 탐구합니다. 해당 설정은 디지털 학습을 위한 명시적 조건입니다.</p></section>`);
}

function evaluate(q,r){
 let correct=false,missing='';
 switch(q.kind){
  case 'mapping':
   if(!r.answer||!r.why)missing='함수 여부와 판단 근거를 모두 선택하세요.';
   else if(r.answer==='yes'&&(!r.domain||!r.codomain||!r.range))missing='함수라고 판단했다면 정의역·공역·치역도 선택하세요.';
   else correct=r.answer===q.correct && r.why===q.why && (q.correct!=='yes'||(r.domain==='1234'&&r.codomain==='abc'&&r.range==='abc'));
   break;
  case 'range':
   if(!r.domain||!r.range)missing='정의역과 치역을 모두 선택하세요.';
   else correct=r.domain===q.correctDomain&&r.range===q.correctRange;
   break;
  case 'params':
   if(r.a===undefined||r.a===''||r.b===undefined||r.b==='')missing='a와 b의 값을 각각 입력하세요.';
   else correct=Number(r.a)===-5&&Number(r.b)===4;
   break;
  case 'graph-function':
   if(!r.answer||!r.why)missing='함수 여부와 세로선 판별 근거를 선택하세요.';
   else correct=r.answer===q.correct&&r.why===(q.correct==='yes'?'single':'two');
   break;
  case 'bijection':
   if(!r.answer||!r.why)missing='일대일대응 여부와 근거를 모두 선택하세요.';
   else correct=r.answer===q.correct&&r.why===(q.correct==='yes'?'unique-all':'repeat-or-miss');
   break;
  case 'special':
   if(!r.answer)missing='그래프가 나타내는 종류를 하나 선택하세요.';
   else correct=r.answer===q.correct;
   break;
  case 'classify':
   if(['one','bijective','identity','constant'].some(k=>!Array.isArray(r[k])||r[k].length===0))missing='네 가지 분류의 답을 각각 하나 이상 선택하세요.';
   else correct=sameArray(r.one,['ㄱ','ㄷ','ㄹ'])&&sameArray(r.bijective,['ㄱ','ㄷ','ㄹ'])&&sameArray(r.identity,['ㄷ'])&&sameArray(r.constant,['ㄴ']);
   break;
 }
 if(missing)return {ready:false,correct:false,message:missing};
 if(correct)return {ready:true,correct:true,message:q.explanation};
 return {ready:true,correct:false,message:`답을 바꾸기 전에 생각해 보세요. ${q.strategy} 필요하다면 오른쪽 힌트를 열어 보고 다시 제출하세요.`};
}

function renderSummary(){
 const count=correctCount();
 renderShell(`<div class="screen-heading"><div><span class="eyeline">STEP 03 · MY GROWTH RECORD</span><h2>나의 탐구 성장 기록</h2><p class="subtext">어떤 유형을 이해했고, 어떤 문제에 다시 도전할지 살펴보세요.</p></div><span class="tag">현재 기기 저장</span></div>
 <section class="panel"><div class="stat-grid"><div class="stat-box"><b>${state.completedConcepts.length}/6</b><span>완료한 개념</span></div><div class="stat-box"><b>${count}/16</b><span>해결한 문제</span></div><div class="stat-box"><b>${totalAttempts()}</b><span>답 제출 횟수</span></div><div class="stat-box"><b>${totalHints()}</b><span>사용한 힌트</span></div></div>
 <div class="row mt-3">${btn('학습기록 JSON 저장','export-json','teal small')}${btn('학습기록 CSV 저장','export-csv','light small')}${btn('결과 인쇄','print','light small')}</div><p class="source-note mt-2">기록은 서버로 전송되지 않습니다. 다른 기기로 옮기려면 파일로 저장하세요. 손글씨 이미지는 JSON 결과에 포함되며 CSV에는 포함되지 않습니다.</p></section>
 <section class="panel"><h3>문제별 학습 현황</h3><div class="result-list">${QUESTIONS.map((q,i)=>{const r=state.answers[q.id]||{};const status=r.correct?'해결':r.attempts?'재도전':'시작 전';return `<div class="result-row"><div><span class="icon-dot">${String(i+1).padStart(2,'0')}</span> <b>${esc(q.title)}</b><br/><span class="source-note">${esc(q.type)} · ${esc(q.source)}</span></div><div class="row"><span class="${r.correct?'status-ok':'status-wait'}">${status}</span>${btn('열기','open-question','light xsmall',`data-question-index="${i}" ${state.completedConcepts.length<CONCEPTS.length?'disabled':''}`)}</div></div>`}).join('')}</div>
 <div class="sticky-actions">${btn('개념 다시 보기','go-concept','light')}${btn('학습지 계속 풀기','go-practice','teal',state.completedConcepts.length<CONCEPTS.length?'disabled':'')}</div></section>`);
}

function render(){
 if(state.view==='concept')renderConcept();
 else if(state.view==='practice')renderPractice();
 else if(state.view==='summary')renderSummary();
 else renderWelcome();
}

function invalidate(r){r.checked=false;r.correct=false;r.feedback='';}
function setConceptFeedback(id,feedback){state.conceptFeedback=state.conceptFeedback||{};state.conceptFeedback[id]=feedback}
function updateAnswer(field,value){
 const q=getQuestion(),r=responseFor(q.id);
 if(field.startsWith('group-')){
  const key=field.slice(6),a=r[key]||[];r[key]=a.includes(value)?a.filter(x=>x!==value):[...a,value];
 }else r[field]=value;
 invalidate(r);save();render();
}
function downloadFile(content,filename,type){
 const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function exportJSON(){
 const payload={app:'함수 탐구실',version:'1.0',exportedAt:new Date().toISOString(),studentName:state.studentName,concepts:CONCEPTS.map(c=>({id:c.id,title:c.title,completed:isConceptCompleted(c.id)})),questions:QUESTIONS.map(q=>({id:q.id,source:q.source,title:q.title,type:q.type,...(state.answers[q.id]||{})}))};
 downloadFile(JSON.stringify(payload,null,2),'함수탐구_학습기록.json','application/json;charset=utf-8');
}
function csvCell(x){return '"'+String(x??'').replace(/"/g,'""')+'"'}
function exportCSV(){
 const header=['이름','문항','출처','유형','해결','제출횟수','힌트사용','조건관찰','풀이설명'];
 const rows=QUESTIONS.map(q=>{const r=state.answers[q.id]||{};return [state.studentName,q.title,q.source,q.type,r.correct?'해결':r.attempts?'재도전':'미시도',r.attempts||0,r.hintsViewed||0,r.observation||'',r.explanation||''].map(csvCell).join(',')});
 downloadFile('\uFEFF'+[header.map(csvCell).join(','),...rows].join('\r\n'),'함수탐구_학습기록.csv','text/csv;charset=utf-8');
}
function setupDrawingCanvas(){
 const canvas=document.querySelector('canvas[data-drawing]');if(!canvas)return;
 const qid=canvas.dataset.drawing;const r=responseFor(qid);const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#174f79';ctx.lineWidth=3.2;
 if(r.drawing){const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0,canvas.width,canvas.height)};img.src=r.drawing;}
 let drawing=false,last=null;
 function point(ev){const rect=canvas.getBoundingClientRect();return {x:(ev.clientX-rect.left)*canvas.width/rect.width,y:(ev.clientY-rect.top)*canvas.height/rect.height}}
 canvas.addEventListener('pointerdown',ev=>{
  if(ev.button!==0&&ev.pointerType==='mouse')return;
  drawing=true;last=point(ev);try{canvas.setPointerCapture(ev.pointerId)}catch(e){}
  ctx.beginPath();ctx.arc(last.x,last.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();ev.preventDefault();
 });
 canvas.addEventListener('pointermove',ev=>{if(!drawing)return;const now=point(ev);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(now.x,now.y);ctx.stroke();last=now;ev.preventDefault()});
 function finish(){if(!drawing)return;drawing=false;r.drawing=canvas.toDataURL('image/png');save()}
 canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);canvas.addEventListener('lostpointercapture',finish);
}

document.addEventListener('click',ev=>{
 const trigger=ev.target.closest('[data-action]');if(!trigger||trigger.disabled)return;
 const action=trigger.dataset.action;let rerender=true;
 switch(action){
  case 'go-welcome':state.view='welcome';break;
  case 'start-concept':case 'go-concept':state.view='concept';break;
  case 'go-practice':if(state.completedConcepts.length===CONCEPTS.length)state.view='practice';break;
  case 'go-summary':state.view='summary';break;
  case 'concept-prev':state.conceptIndex=Math.max(0,state.conceptIndex-1);break;
  case 'concept-next':{
   const c=CONCEPTS[state.conceptIndex];if(!isConceptCompleted(c.id))return;
   if(state.conceptIndex===CONCEPTS.length-1){state.view='practice';state.questionIndex=0;state.graphCoordinate=0}
   else state.conceptIndex++;
   break;
  }
  case 'choose':{
   const field=trigger.dataset.field,value=trigger.dataset.value;
   if(field==='demo-input'){state.demoInput=value}
   else if(field==='demo-domain'){state.demoDomain=value;state.conceptSelection.c4='';setConceptFeedback('c4',null)}
   else if(field==='concept'){const id=CONCEPTS[state.conceptIndex].id;state.conceptSelection[id]=value;setConceptFeedback(id,null)}
   else{updateAnswer(field,value);return;}
   break;
  }
  case 'check-concept':{
   const id=CONCEPTS[state.conceptIndex].id;
   const result=conceptAnswerCheck(id);setConceptFeedback(id,result);
   if(result.ok&&!isConceptCompleted(id))state.completedConcepts.push(id);
   break;
  }
  case 'show-hint':{
   const r=responseFor(getQuestion().id);r.hintsViewed=Math.min(3,(r.hintsViewed||0)+1);break;
  }
  case 'check-question':{
   const q=getQuestion(),r=responseFor(q.id),result=evaluate(q,r);
   r.checked=true;r.feedback=result.message;
   if(result.ready){r.attempts=(r.attempts||0)+1;r.correct=result.correct;r.lastSubmittedAt=new Date().toISOString();}
   else r.checked=true;
   break;
  }
  case 'question-prev':state.questionIndex=Math.max(0,state.questionIndex-1);state.graphCoordinate=0;break;
  case 'question-next':{
   const r=responseFor(getQuestion().id);if(!r.attempts)return;
   if(state.questionIndex===QUESTIONS.length-1)state.view='summary';
   else {state.questionIndex++;state.graphCoordinate=0;}
   break;
  }
  case 'open-question':state.questionIndex=Number(trigger.dataset.questionIndex)||0;state.view='practice';state.graphCoordinate=0;break;
  case 'clear-canvas':{
   const r=responseFor(getQuestion().id);r.drawing='';break;
  }
  case 'export-json':exportJSON();rerender=false;break;
  case 'export-csv':exportCSV();rerender=false;break;
  case 'print':window.print();rerender=false;break;
  default:rerender=false;
 }
 if(rerender){save();render()}
});

document.addEventListener('input',ev=>{
 const field=ev.target.dataset.role;if(!field)return;
 if(field==='student-name')state.studentName=ev.target.value;
 else if(field==='note'){
   const r=responseFor(getQuestion().id);r[ev.target.dataset.field]=ev.target.value;
 }else if(field==='param'){
   const r=responseFor(getQuestion().id);r[ev.target.dataset.field]=ev.target.value;invalidate(r);
 }else if(field==='graph-slider'){
   state.graphCoordinate=Number(ev.target.value);
   const q=getQuestion(),axis=q.kind==='bijection'?'y':'x';
   const target=document.getElementById('active-graph');
   if(target)target.innerHTML=graphSvg(q.graph,axis,state.graphCoordinate);
   const coord=document.getElementById('graph-coordinate');if(coord)coord.textContent=state.graphCoordinate;
   const out=document.getElementById('graph-readout');
   if(out){if(q.kind==='range'){const y=graphFunctions[q.graph](state.graphCoordinate);out.textContent=Number.isFinite(y)?Math.round(y*100)/100:'정의되지 않음';}
     else {const n=intersectionCount(q.graph,axis,state.graphCoordinate);out.textContent=n===null?'?':n+'개';}}
   save();return;
 }else if(field==='demo-x'){
   state.demoX=Number(ev.target.value);
   const box=document.getElementById('concept-graph');if(box)box.innerHTML=graphSvg('circle1','x',state.demoX);
   const label=document.getElementById('concept-coordinate');if(label)label.textContent=state.demoX;
   const count=document.getElementById('concept-crossings');if(count)count.textContent=intersectionCount('circle1','x',state.demoX)+'개';
   save();return;
 }
 save();
});

render();
