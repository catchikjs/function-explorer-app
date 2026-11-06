import { range, prime } from './set-logic-math.js';
import { R, num, pick, multi, elements, writing, question as Q, probe, board, venn, finalize } from './set-logic-content.js';
import { PROPOSITION_ACTIVITIES } from './proposition-data.js';

export const SET_LOGIC_WORKBOOKS = [
  ['sets-basics', '집합의 뜻과 여러 가지 표현', 'S01', '65~67쪽', '집합2차시.pdf', 2, ['명확한 기준', '원소나열법·조건제시법', '벤다이어그램·원소의 수']],
  ['subsets', '부분집합과 진부분집합', 'S02', '68~69쪽', '02_2차시_부분집합과_진부분집합_학생용.pdf', 3, ['원소와 포함 관계', '부분집합 만들기', '부분집합의 개수']],
  ['set-union', '합집합과 교집합', 'S03', '70~71쪽', '03_3차시_합집합과_교집합_학생용_벤다이어그램추가.pdf', 3, ['원소 배치', '합집합·교집합·서로소', '중복을 고려한 원소 수']],
  ['set-laws', '집합의 연산 법칙', 'S04', '72~73쪽', '04_4차시_집합의_연산_법칙_학생용.pdf', 3, ['교환·결합법칙', '분배법칙', '영역을 비교하는 증명']],
  ['set-complement', '여집합과 차집합', 'S05', '74~75쪽', '05_5차시_여집합과_차집합_학생용.pdf', 2, ['전체집합', '여집합·차집합', '차집합과 교집합의 관계']],
  ['set-demorgan', '드모르간의 법칙', 'S06', '76~77쪽', '06_6차시_드모르간의_법칙_학생용.pdf', 2, ['연산과 부정', '드모르간 영역 퍼즐', '원소의 개수']],
  ['propositions', '명제 · 탐구와 연습', 'L01', '83~103쪽', '명제단원_학습지_학생용 (1).pdf', 23, ['진리집합·모든·어떤', '역·대우·필요충분조건', '증명·절대부등식·논리 탐정']]
].map(([id, title, chapter, textbook, originalFile, pageCount, topics]) => ({ id, title, chapter, textbook, originalFile, topics, subject: id === 'propositions' ? 'logic' : 'sets', color: id === 'propositions' ? 'purple' : 'peach', gameId: id === 'propositions' ? 'counter' : ['sets-basics','subsets'].includes(id) ? 'set-memory' : 'territory', pages: range(1, pageCount).map(page => ({ id: `${id}-p${String(page).padStart(2, '0')}`, page, title: `${title} · 원본 ${page}쪽`, description: '사용자가 제공한 학생용 원본 학습지' })) }));

const sets = [];
const basicU = range(1, 20);
sets.push(Q(1, '67쪽 · 스스로 익히기 1 (1)', '소수의 모임은 집합일까요?', '15보다 작은 소수의 모임이 집합인지 판단하고 원소를 모두 골라요.', R`A=\{x\mid x<15,\ x\text{는 소수}\}`, probe('x는 15보다 작은 소수', x => x < 15 && prime(x), '', null, { min: 1, max: 15, step: 1 }), [pick('kind', '이 모임은?', ['집합이다', '집합이 아니다'], 0), elements('members', '모든 원소', range(1, 15), [2, 3, 5, 7, 11, 13])], '소수라는 기준이 명확하므로 집합이고 원소는 2, 3, 5, 7, 11, 13이에요.'));
const cities = ['부산', '대구', '인천', '광주', '대전', '울산'];
sets.push(Q(1, '67쪽 · 스스로 익히기 1 (2)', '광역시라는 명확한 기준', '대한민국 광역시의 모임을 판단하고 원소를 골라요.', R`A=\{x\mid x\text{는 대한민국의 광역시}\}`, board([...cities, '서울', '세종', '수원'], { A: cities, B: [] }), [pick('kind', '이 모임은?', ['집합이다', '집합이 아니다'], 0), elements('members', '광역시', [...cities, '서울', '세종', '수원'], cities)], '광역시라는 행정 구분은 명확해요. 서울은 특별시, 세종은 특별자치시이므로 이 집합에 포함되지 않아요.'));
sets.push(Q(1, '67쪽 · 스스로 익히기 1 (3)', 'π와 가깝다는 기준은?', '원주율 π와 가까운 유리수의 모임을 판단해요. 가까움의 허용 범위를 바꾸면 어떤 일이 생기나요?', R`|x-\pi|<\varepsilon`, { type: 'sl-distance', defaults: { epsilon: .2 }, min: .01, max: 1 }, [pick('kind', '원문의 모임은?', ['집합이다', '집합이 아니다'], 1)], '원문에는 얼마나 가까워야 하는지 기준이 없어요. 예를 들어 |x−π|<0.1처럼 허용 범위를 정하면 집합으로 표현할 수 있어요.'));
sets.push(Q(1, '67쪽 · 스스로 익히기 2 (1)', '조건을 원소로 바꾸기', '10 이상 20 이하의 짝수를 모두 골라 원소나열법으로 나타내요.', R`\{x\mid 10\le x\le20,\ x\text{는 짝수}\}`, probe('10 이상 20 이하의 짝수', x => Number.isInteger(x) && x >= 10 && x <= 20 && x % 2 === 0, '', null, { min: 8, max: 22, step: 1 }), [elements('members', '원소나열법', range(9, 21), [10, 12, 14, 16, 18, 20])], '양 끝값을 포함하므로 {10,12,14,16,18,20}이에요.'));
sets.push(Q(1, '67쪽 · 스스로 익히기 2 (2)', '끝없이 이어지는 규칙', '{5,10,15,…}를 조건제시법으로 표현해요.', R`A=\{5,10,15,\ldots\}`, probe('양의 5의 배수', x => Number.isInteger(x) && x > 0 && x % 5 === 0, '', null, { min: 0, max: 30, step: 1 }), [pick('condition', '알맞은 조건', ['x는 자연수인 5의 배수', 'x는 5 이상 15 이하인 수', 'x는 0 이상인 5의 배수'], 0)], '…는 같은 규칙이 계속된다는 뜻이에요. 자연수인 5의 배수 전체이며 0은 포함하지 않아요.'));
for (const [label, title, formula, universe, answer] of [
  ['3 (1)', '16의 약수를 원 안에 배치', R`A=\{x\mid x\text{는 }16\text{의 약수}\}`, range(1, 16), [1, 2, 4, 8, 16]],
  ['3 (2)', '방정식의 해를 원 안에 배치', R`B=\{x\mid x^2-3x+2=0\}`, range(-1, 5), [1, 2]]
]) sets.push(Q(1, `67쪽 · 스스로 익히기 ${label}`, title, '원소 카드를 선택한 뒤, 속하는 영역을 눌러 벤다이어그램에 배치하세요.', formula, { type: 'sl-place', universe, sets: { A: answer, B: [] }, names: ['A'], labelA: label.endsWith('(2)') ? 'B' : 'A', count: 1, defaults: { placements: {}, active: null } }, [], `원 안에는 {${answer.join(',')}}가 들어가요. 나머지 카드는 전체집합에서 원 밖에 놓아요.`));
sets.push(Q(1, '67쪽 · 스스로 익히기 4 (1)', '35의 약수는 몇 개?', '약수를 찾아 원소의 수 n(A)를 구해요.', R`A=\{x\mid x\text{는 }35\text{의 약수}\}`, board([1, 2, 3, 5, 7, 10, 15, 35], { A: [1, 5, 7, 35], B: [] }), [num('count', 'n(A)', 4)], '35의 약수는 1, 5, 7, 35이므로 n(A)=4예요.'));
sets.push(Q(1, '67쪽 · 스스로 익히기 4 (2)', '원소가 없는 집합', '실수 x 중에서 x²+1≤0을 만족하는 수가 있는지 탐색해요.', R`A=\{x\in\mathbb R\mid x^2+1\le0\}`, probe('x²+1≤0', x => x * x + 1 <= 0), [num('count', 'n(A)', 0), pick('reason', '모든 실수에서 성립하는 근거', ['x²≥0이므로 x²+1≥1', '몇 개를 대입하니 없었다', 'x가 음수이면 x²도 음수이다'], 0)], '실수의 제곱은 0 이상이므로 x²+1≥1이에요. A는 공집합이고 n(A)=0이에요.'));
for (const [page, label, title, original, options, correct] of [
  [1, '①', '아름다운 산을 명확한 기준으로', '아시아에서 아름다운 산의 모임', ['아시아에서 해발 3,000 m 이상인 산의 모임', '아시아에서 정말 아름다운 산의 모임', '아시아에서 꽤 높은 산의 모임'], 0],
  [2, '②', '인기의 측정 기준 정하기', '인기가 많은 스포츠 종목의 모임', ['최근에 재미있다고 느낀 스포츠', '조사일과 대상 학급을 정하고 선호 응답이 10명 이상인 종목', '누구나 좋아할 것 같은 종목'], 1],
  [2, '③', '추운 나라의 측정 기준 정하기', '날씨가 추운 나라의 모임', ['그냥 추운 나라', '여행했을 때 추웠던 나라', '측정 연도와 자료를 정하고 연평균 기온이 0℃ 미만인 나라'], 2]
]) sets.push(Q(page, `67쪽 · 역량 키우기 ${label}`, title, `“${original}”을 집합이 되도록 바꾸고, 무엇을 측정할지 설명해요.`, R`\text{누가 판단해도 같은 결과가 되는 기준}`, { type: 'sl-open', cards: options }, [pick('standard', '명확한 기준', options, correct), writing('myRule', '내가 정한 기준과 그 이유')], '판단 대상, 측정 기준, 자료의 범위가 명확해야 해요.', { group: '표현하고 설명하기' }));
sets.push(Q(2, '67쪽 · 확장', '원소 3개의 생활 속 집합', '생활 속 집합을 하나 정하고 원소 3개, 공통 조건을 자신의 말로 적어 보세요.', R`n(A)=3`, { type: 'sl-subset', elements: ['첫 원소', '둘째 원소', '셋째 원소'], exploratory: true, defaults: { selected: [] , found: [] } }, [writing('members', '서로 다른 원소 3개'), writing('condition', '세 원소를 묶는 명확한 조건')], '원소가 서로 다르고, 명확한 조건을 만족하는 원소가 정확히 세 개인지 함께 점검해요.', { group: '표현하고 설명하기' }));

const subsets = [];
subsets.push(Q(1, '기억 깨우기 ①', '12의 약수 카드', '12를 나누어떨어지게 하는 자연수를 찾아요.', R`12\div x\in\mathbb N`, board(range(1, 12), { A: [1, 2, 3, 4, 6, 12], B: [] }), [elements('members', '12의 약수', range(1, 12), [1, 2, 3, 4, 6, 12])], '1, 2, 3, 4, 6, 12가 약수예요.'));
subsets.push(Q(1, '기억 깨우기 ②', '원소를 한 번씩 세기', '{1,2}의 원소는 몇 개인가요?', R`n(\{1,2\})`, board([1, 2], { A: [1, 2], B: [] }), [num('count', '원소의 수', 2)], '서로 다른 원소 1과 2를 한 번씩 세면 2개예요.'));
subsets.push(Q(1, '기억 깨우기 ③', '모두 들어가는 관계', 'A의 모든 원소가 B 안에 들어가는 경우에 알맞은 관계를 선택해요.', R`A\subseteq B`, board([1, 2, 3, 4], { A: [1, 2], B: [1, 2, 3, 4] }), [pick('relation', 'A와 B의 관계', ['A는 B의 부분집합', 'A와 B는 서로소', '반드시 A=B'], 0)], 'A의 원소가 빠짐없이 B에 속하면 A는 B의 부분집합이에요. 이 앱은 자기 자신도 포함하는 관계를 ⊆로 나타내요.'));
subsets.push(Q(1, '68쪽 · 준비하기', '20보다 작은 4의 배수', '준비하기의 집합을 원소나열법으로 나타내요.', R`\{x\in\mathbb N\mid x<20,\ 4\mid x\}`, probe('20보다 작은 자연수인 4의 배수', x => x > 0 && x < 20 && x % 4 === 0, '', null, { min: 1, max: 20, step: 1 }), [elements('members', '원소', [4, 8, 12, 16, 20, 24], [4, 8, 12, 16])], '20은 “보다 작은”에 포함되지 않으므로 {4,8,12,16}이에요.'));
const birds = ['딱새', '섬참새', '개똥지빠귀', '황조롱이'];
subsets.push(Q(1, '68쪽 · 생각 틔우기', '작은 새 집합을 큰 집합에', 'A={딱새,개똥지빠귀}, B={딱새,섬참새,개똥지빠귀,황조롱이}. A의 모든 원소가 B에 속하나요?', R`A\subseteq B\ ?`, board(birds, { A: ['딱새', '개똥지빠귀'], B: birds }), [pick('relation', '포함 관계', ['A⊆B이고 A≠B', 'A⊄B', 'A=B'], 0)], 'A의 두 원소가 모두 B에 있고 B에는 다른 원소도 있어요. A는 B의 진부분집합이에요.'));
for (const [page, source, elementsList] of [[1, '68쪽 · 예제 1', [1, 2]], [2, '69쪽 · 스스로 익히기 2', ['a', 'b', 'c']]]) for (const proper of [false, true]) subsets.push(Q(page, `${source} (${proper ? 2 : 1})`, proper ? '자기 자신을 뺀 진부분집합' : '부분집합을 빠짐없이 모으기', '원소의 스위치를 켜고 끄며 집합을 만들고, “목록에 담기”로 가능한 집합을 모두 모아요.', `A=\{${elementsList.join(',')}\}`, { type: 'sl-subset', elements: elementsList, proper, defaults: { selected: [], found: [] } }, [], `각 원소를 넣거나 빼는 두 가지 선택이 있어요. ${proper ? '전체 집합 자체만 빼면 돼요.' : '공집합과 자기 자신도 부분집합이에요.'}`));
for (const [index, title, formula, universe, A, B, answer] of [
  [1, '홀수 집합의 포함 관계', R`A=\{1,3,5\},\ B=\{x\mid x\text{는 7 이하의 홀수}\}`, [1, 3, 5, 7], [1, 3, 5], [1, 3, 5, 7], ['0', '3']],
  [2, '방정식의 해와 포함 관계', R`A=\{x\mid x^2-1=0\},\ B=\{0,1,2\}`, [-1, 0, 1, 2], [-1, 1], [0, 1, 2], ['1', '3']],
  [3, '표현이 다른 같은 집합', R`A=\{1,2,7,14\},\ B=\{x\mid x\text{는 }14\text{의 약수}\}`, [1, 2, 7, 14], [1, 2, 7, 14], [1, 2, 7, 14], ['0', '2']],
  [4, '한 점과 열린 구간', R`A=\{x\mid2x+3=0\},\ B=\{x\mid x^2-4x<0\}`, [-2, -1.5, 0, 1, 2, 3, 4], [-1.5], [1, 2, 3], ['1', '3']]
]) subsets.push(Q(2, `69쪽 · 스스로 익히기 1 (${index})`, title, '성립하는 기호를 모두 골라요. 원문의 ⊂는 자기 자신도 포함하는 부분집합 기호로 사용되며, 앱에서는 ⊆로 표시해요.', formula, index === 4 ? probe('2x+3=0', x => Math.abs(2 * x + 3) < 1e-8, 'x²−4x<0', x => x * x - 4 * x < 0) : board(universe, { A, B }), [multi('relations', '성립하는 관계 모두', ['A⊆B', 'A⊄B', 'A=B', 'A≠B'], answer)], index === 4 ? 'A={−3/2}, B={x | 0<x<4}. −3/2는 B에 속하지 않으므로 A⊄B, A≠B예요.' : `A의 모든 원소를 B와 비교해요. 선택한 관계가 원소 전체에서 성립해야 해요.`));
subsets.push(Q(2, '69쪽 · 스스로 익히기 3', '같은 집합의 숨은 수 찾기', 'A={4,6,2a}, B={10,a+1,2b}가 같아지도록 a,b를 찾아요. 순서는 달라도 원소는 모두 같아야 해요.', R`\{4,6,2a\}=\{10,a+1,2b\}`, { type: 'sl-parameters', defaults: { a: 1, b: 1 }, sets: l => ({ A: [4, 6, 2 * l.a], B: [10, l.a + 1, 2 * l.b] }) }, [num('a', 'a', 5), num('b', 'b', 2)], '10은 A의 2a와 같아야 하므로 a=5. 남은 원소 4=2b이므로 b=2예요.'));
subsets.push(Q(3, '69쪽 · 역량 키우기', '포함 스위치와 2의 거듭제곱', '각 원소의 포함 여부를 ○, ×로 정해요. 원소가 3개일 때와 k개일 때의 부분집합 수를 찾아요.', R`A=\{a,b,c\},\quad\{1,2,\ldots,k\}`, { type: 'sl-subset', elements: ['a', 'b', 'c'], exploratory: true, defaults: { selected: [], found: [] } }, [num('three', '원소 3개의 부분집합 수', 8), pick('general', '원소 k개의 부분집합 수', ['k²', '2k', '2ᵏ', 'k!'], 2)], '각 원소마다 포함·제외의 2가지 선택이 독립적으로 있으므로 2×2×…×2=2ᵏ예요.'));
subsets.push(Q(3, '69쪽 · 확장하기', '1을 빼고 만드는 부분집합', 'A={1,2,3,4}의 부분집합 중 원소 1을 포함하지 않는 것의 개수를 구해요.', R`1\notin S,\quad S\subseteq\{1,2,3,4\}`, { type: 'sl-subset', elements: [2, 3, 4], exploratory: true, defaults: { selected: [], found: [] } }, [num('count', '부분집합의 수', 8)], '1을 제외하기로 고정하면 2,3,4의 포함 여부만 고르면 되므로 2³=8개예요.'));

const union = [], careersA = ['경제학자', '인공지능 전문가', '수학 연구원', '빅 데이터 분석가'], careersB = ['웹 개발자', '인공지능 전문가', '수학 연구원', '공학 엔지니어'];
for (const [operation, title, answer] of [['intersect', '두 집합의 공통 원소', [2, 3]], ['union', '두 집합의 원소 모두 모으기', [1, 2, 3, 4]]]) union.push(Q(1, `기억 깨우기 ${operation === 'intersect' ? '①' : '②'}`, title, 'A={1,2,3}, B={2,3,4}를 비교해요.', R`A=\{1,2,3\},\quad B=\{2,3,4\}`, board([1, 2, 3, 4], { A: [1, 2, 3], B: [2, 3, 4] }), [elements('members', title, [1, 2, 3, 4], answer)], operation === 'union' ? '같은 원소는 한 번씩만 모아요.' : 'A와 B에 동시에 들어 있는 원소를 찾아요.'));
union.push(Q(1, '70쪽 · 준비하기', '10의 약수 모으기', '10의 약수의 집합을 구해요.', R`A=\{x\mid x\text{는 }10\text{의 약수}\}`, board(range(1, 10), { A: [1, 2, 5, 10], B: [] }), [elements('members', '10의 약수', range(1, 10), [1, 2, 5, 10])], '10=1×10=2×5이므로 {1,2,5,10}이에요.'));
for (const common of [false, true]) union.push(Q(1, `70쪽 · 생각 틔우기 ${common ? '②' : '①'}`, common ? '두 동아리가 함께 꿈꾸는 진로' : '두 동아리의 꿈을 한곳에', `A={${careersA.join(', ')}}, B={${careersB.join(', ')}}. ${common ? '공통' : '어느 한쪽에라도 속하는'} 진로를 골라요.`, common ? R`A\cap B` : R`A\cup B`, board([...new Set([...careersA, ...careersB])], { A: careersA, B: careersB }), [elements('members', '진로 집합', [...new Set([...careersA, ...careersB])], common ? ['인공지능 전문가', '수학 연구원'] : [...new Set([...careersA, ...careersB])])], common ? '두 동아리에 공통인 진로는 인공지능 전문가, 수학 연구원이에요.' : '합집합에서는 두 집합의 진로를 중복 없이 모두 모아요.'));
const odd = [1, 3, 5, 7, 9], triple = [3, 6, 9, 12, 15], bothU = [...new Set([...odd, ...triple])].sort((a, b) => a - b);
union.push(Q(2, '71쪽 · 스스로 익히기 1 · 벤다이어그램', '홀수와 3의 배수 배치하기', 'A={1,3,5,7,9}, B는 18 미만의 자연수인 3의 배수 집합이에요. 모든 원소를 배치해요.', R`A=\{1,3,5,7,9\},\quad B=\{3,6,9,12,15\}`, { type: 'sl-place', universe: bothU, sets: { A: odd, B: triple }, defaults: { placements: {}, active: null } }, [], '3과 9는 겹친 곳, 1·5·7은 A만, 6·12·15는 B만에 놓아요.'));
for (const common of [false, true]) union.push(Q(2, `71쪽 · 스스로 익히기 1 · ${common ? '교집합' : '합집합'}`, common ? '겹친 원소만 골라요' : '두 원에 있는 원소 모두', '벤다이어그램에서 원소를 확인해 집합을 구해요.', common ? R`A\cap B` : R`A\cup B`, board(bothU, { A: odd, B: triple }), [elements('members', common ? 'A∩B' : 'A∪B', bothU, common ? [3, 9] : bothU)], common ? 'A∩B={3,9}예요.' : 'A∪B={1,3,5,6,7,9,12,15}예요.'));
union.push(Q(2, '71쪽 · 스스로 익히기 2', '서로소인 짝 집합 복원하기', 'A={2,3,7}, A∩B=∅이고 A∪B={1,2,3,4,5,6,7}일 때 B를 구해요.', R`A\cap B=\varnothing`, board(range(1, 7), { A: [2, 3, 7], B: [1, 4, 5, 6] }), [elements('members', '집합 B', range(1, 7), [1, 4, 5, 6])], '겹칠 수 없으므로 합집합에서 A의 원소를 제외하면 B={1,4,5,6}이에요.'));
union.push(Q(2, '71쪽 · 스스로 익히기 3', '교집합이 같아지는 상수', 'A={1,2,2a+5}, B={3,a,3b−1}, A∩B={2,3}일 때 a,b를 구해요.', R`A\cap B=\{2,3\}`, { type: 'sl-parameters', defaults: { a: 0, b: 0 }, sets: l => ({ A: [1, 2, 2 * l.a + 5], B: [3, l.a, 3 * l.b - 1] }) }, [num('a', 'a', -1), num('b', 'b', 1)], '3∈A에서 2a+5=3이므로 a=−1. 2∈B에서 3b−1=2이므로 b=1이에요.'));
union.push(Q(3, '71쪽 · 역량 키우기', 'OTT를 둘 다 이용하는 가구', 'A 이용 14가구, B 이용 8가구, A 또는 B 이용 20가구예요. 두 서비스를 모두 이용하는 가구는?', R`n(A\cup B)=n(A)+n(B)-n(A\cap B)`, { type: 'sl-count', A: 14, B: 8, U: 30, defaults: { overlap: 0 } }, [num('overlap', '두 플랫폼을 모두 이용', 2)], '14+8−20=2가구예요. 공통 부분을 두 번 더했으므로 한 번 빼야 해요.'));

const laws = [];
for (const intersect of [false, true]) laws.push(Q(1, `72쪽 · 준비하기 · ${intersect ? '교집합' : '합집합'}`, '연산 법칙 전에 원소 비교', 'A={1,3,5}, B={1,3,9}에서 집합을 구해요.', intersect ? R`A\cap B` : R`A\cup B`, board([1, 3, 5, 9], { A: [1, 3, 5], B: [1, 3, 9] }), [elements('members', intersect ? '교집합' : '합집합', [1, 3, 5, 9], intersect ? [1, 3] : [1, 3, 5, 9])], intersect ? '공통 원소는 1과 3이에요.' : '모든 원소를 중복 없이 모으면 1,3,5,9예요.'));
for (const [page, source, title, expr, equivalent, formula, count] of [
  [1, '72쪽 · 함께 완성하기 ①', '합집합의 분배법칙', ['union', 'A', ['intersect', 'B', 'C']], ['intersect', ['union', 'A', 'B'], ['union', 'A', 'C']], R`A\cup(B\cap C)=(A\cup B)\cap(A\cup C)`, 3],
  [1, '72쪽 · 함께 완성하기 ②', '교집합의 분배법칙', ['intersect', 'A', ['union', 'B', 'C']], ['union', ['intersect', 'A', 'B'], ['intersect', 'A', 'C']], R`A\cap(B\cup C)=(A\cap B)\cup(A\cap C)`, 3],
  [2, '73쪽 · 스스로 익히기 1 (1)', '괄호를 옮겨도 같은 합집합', ['union', ['union', 'A', 'B'], 'C'], ['union', 'A', ['union', 'B', 'C']], R`(A\cup B)\cup C=A\cup(B\cup C)`, 3],
  [2, '73쪽 · 스스로 익히기 1 (2)', '괄호를 옮겨도 같은 교집합', ['intersect', ['intersect', 'A', 'B'], 'C'], ['intersect', 'A', ['intersect', 'B', 'C']], R`(A\cap B)\cap C=A\cap(B\cap C)`, 3],
  [2, '73쪽 · 스스로 익히기 3 (1)', 'A로 흡수되는 영역', ['union', 'A', ['intersect', 'A', 'B']], 'A', R`A\cup(A\cap B)=A`, 2],
  [3, '73쪽 · 스스로 익히기 3 (2)', 'B로 흡수되는 영역', ['intersect', 'B', ['union', 'A', 'B']], 'B', R`B\cap(A\cup B)=B`, 2]
]) laws.push(Q(page, source, title, '왼쪽 식에 해당하는 영역을 직접 색칠해요. “오른쪽 식과 비교”로 두 영역을 겹쳐 검증하세요.', formula, venn(expr, count, { equivalent }), [], '어떤 포함 영역에 원소를 놓아도 왼쪽과 오른쪽의 포함 여부가 같으므로 두 집합이 같아요.'));
laws.push(Q(2, '73쪽 · 스스로 익히기 2', '결합법칙으로 한 번에 모으기', 'A∪B={2,3,4}, C={1,3,9}일 때 A∪(B∪C)를 구해요.', R`A\cup(B\cup C)=(A\cup B)\cup C`, board([1, 2, 3, 4, 9], { A: [2, 3, 4], B: [1, 3, 9] }, { labelA: 'A∪B', labelB: 'C' }), [elements('members', 'A∪(B∪C)', [1, 2, 3, 4, 9], [1, 2, 3, 4, 9])], '괄호를 바꾸면 {2,3,4}∪{1,3,9}={1,2,3,4,9}예요.'));
laws.push(Q(3, '73쪽 · 스스로 익히기 4', '분배법칙으로 숨은 교집합 구하기', 'A∪B={a,b,c}, A∪C={b,c,d,e}일 때 A∪(B∩C)를 구해요.', R`A\cup(B\cap C)=(A\cup B)\cap(A\cup C)`, board(['a', 'b', 'c', 'd', 'e'], { A: ['a', 'b', 'c'], B: ['b', 'c', 'd', 'e'] }, { labelA: 'A∪B', labelB: 'A∪C' }), [elements('members', '결과 집합', ['a', 'b', 'c', 'd', 'e'], ['b', 'c'])], '두 주어진 집합의 교집합을 취하면 {b,c}예요.'));

const complement = [];
complement.push(Q(1, '74쪽 · 준비하기', '홀수가 아닌 소수', '홀수가 아닌 소수로 이루어진 집합을 찾아요.', R`\{x\mid x\text{는 짝수인 소수}\}`, probe('짝수인 소수', x => x % 2 === 0 && prime(x), '', null, { min: 1, max: 20, step: 1 }), [elements('members', '해당하는 소수', [2, 3, 5, 7, 11], [2])], '짝수인 소수는 2 하나뿐이에요.'));
for (const [page, source, title, expr, equivalent, formula] of [
  [1, '74쪽 · 예제 1', '차집합은 한쪽만 남기기', ['diff', 'A', 'B'], ['intersect', 'A', ['not', 'B']], R`A-B=A\cap B^c`],
  [2, '75쪽 · 스스로 익히기 1 (1)', '여집합을 두 번 취하면?', ['not', ['not', 'A']], 'A', R`(A^c)^c=A`],
  [2, '75쪽 · 스스로 익히기 1 (2)', 'A와 나머지를 모두 모으면', ['union', 'A', ['not', 'A']], 'U', R`A\cup A^c=U`],
  [2, '75쪽 · 스스로 익히기 1 (3)', 'A와 A가 아닌 곳의 공통', ['intersect', 'A', ['not', 'A']], 'empty', R`A\cap A^c=\varnothing`]
]) complement.push(Q(page, source, title, '전체집합 U 안에서 식을 만족하는 영역을 색칠해요. 공집합이면 “빈 영역으로 확인”을 눌러요.', formula, venn(expr, 2, { equivalent }), [], '같은 전체집합 U를 기준으로 원소가 포함되는지 하나씩 확인하면 오른쪽과 같은 영역이 나와요.'));
for (const [part, A, formula] of [[1, [2, 3, 5, 7], R`A=\{2,3,5,7\}`], [2, [1, 2, 5, 10], R`A=\{x\mid x\text{는 }10\text{의 약수}\}`]]) complement.push(Q(2, `75쪽 · 스스로 익히기 2 (${part})`, '전체집합에서 A를 제외해요', 'U는 10 이하의 자연수 집합이에요. A의 여집합을 구해요.', R`U=\{1,\ldots,10\},\quad ` + formula, board(range(1, 10), { A, B: [] }), [elements('members', 'Aᶜ', range(1, 10), range(1, 10).filter(x => !A.includes(x)))], '여집합은 U의 원소 중 A에 속하지 않는 것들이에요.'));
for (const [part, A, B, formula] of [[1, [1, 4, 5, 7, 8], [1, 2, 3, 4, 6, 12], R`A=\{1,4,5,7,8\},\quad B=\{x\mid x\text{는 }12\text{의 약수}\}`], [2, [1, 2, 3, 4], [2, 3], R`A=\{x\in\mathbb N\mid x<5\},\quad B=\{x\mid x^2-5x+6=0\}`]]) complement.push(Q(2, `75쪽 · 스스로 익히기 3 (${part})`, 'A에는 있고 B에는 없는 원소', 'A−B를 구해요. B−A와 순서를 바꾸면 어떻게 달라지는지도 실험해요.', formula, board([...new Set([...A, ...B])], { A, B }), [elements('members', 'A−B', [...new Set([...A, ...B])], A.filter(x => !B.includes(x)))], `A에서 B와 공통인 원소를 제외하면 {${A.filter(x => !B.includes(x)).join(',')}}예요.`));

const demorgan = [];
demorgan.push(Q(1, '76쪽 · 준비하기', 'U를 기준으로 뒤집기', '전체집합 U 안에서 A에 속하지 않는 모든 영역을 색칠해요.', R`A^c`, venn(['not', 'A'], 1), [], '원 바깥이면서 전체집합 U 안인 영역이 여집합이에요.'));
demorgan.push(Q(1, '76쪽 · 예제 1', '둘 다 아닌 것과 적어도 하나 아닌 것', 'n(U)=50, n(A)=7, n(B)=16, n(A∪B)=21일 때 n(Aᶜ∪Bᶜ)을 구해요.', R`A^c\cup B^c=(A\cap B)^c`, { type: 'sl-count', U: 50, A: 7, B: 16, defaults: { overlap: 0 } }, [num('intersection', 'n(A∩B)', 2), num('result', 'n(Aᶜ∪Bᶜ)', 48)], '교집합은 7+16−21=2. 그 여집합이므로 50−2=48이에요.'));
demorgan.push(Q(2, '77쪽 · 스스로 익히기 1', '드모르간의 영역 퍼즐', 'A∩B의 바깥을 직접 색칠하고, Aᶜ∪Bᶜ와 비교해요.', R`(A\cap B)^c=A^c\cup B^c`, venn(['not', ['intersect', 'A', 'B']], 2, { equivalent: ['union', ['not', 'A'], ['not', 'B']] }), [], '둘 다 속하는 경우가 아니라는 말은 적어도 하나에는 속하지 않는다는 뜻이에요.'));
demorgan.push(Q(2, '77쪽 · 스스로 익히기 2', '여집합의 합집합 구하기', 'U={1,…,18}, A는 3의 배수, B는 10의 약수예요. Aᶜ∪Bᶜ를 구해요.', R`A^c\cup B^c=(A\cap B)^c`, board(range(1, 18), { A: [3, 6, 9, 12, 15, 18], B: [1, 2, 5, 10] }), [elements('members', 'Aᶜ∪Bᶜ', range(1, 18), range(1, 18))], 'A∩B=∅이므로 그 여집합은 전체집합 U예요.'));
demorgan.push(Q(2, '77쪽 · 스스로 익히기 3', '어느 쪽에도 없는 원소 수', 'n(U)=45, n(A)=15, n(B)=12, n(A∩B)=5일 때 n(Aᶜ∩Bᶜ)을 구해요.', R`A^c\cap B^c=(A\cup B)^c`, { type: 'sl-count', U: 45, A: 15, B: 12, defaults: { overlap: 5 } }, [num('union', 'n(A∪B)', 22), num('result', 'n(Aᶜ∩Bᶜ)', 23)], '합집합은 15+12−5=22. 어느 쪽에도 없는 원소 수는 45−22=23이에요.'));

const sourceRank = q => q.source.includes('기억') ? 0 : q.source.includes('준비') ? 1 : q.source.includes('생각 틔우기') ? 2 : q.source.includes('예제') ? 3 : q.source.includes('스스로 익히기 1') ? 4 : q.source.includes('스스로 익히기 2') ? 5 : q.source.includes('스스로 익히기 3') ? 6 : q.source.includes('역량') ? 7 : 8;
subsets.sort((a,b)=>sourceRank(a)-sourceRank(b));
laws.sort((a,b)=>a.sourcePage-b.sourcePage || sourceRank(a)-sourceRank(b));
export const SET_LOGIC_ACTIVITIES = {
  'sets-basics': finalize('sets-basics', sets, 'sets'), subsets: finalize('subsets', subsets, 'sets'),
  'set-union': finalize('set-union', union, 'sets'), 'set-laws': finalize('set-laws', laws, 'sets'),
  'set-complement': finalize('set-complement', complement, 'sets'), 'set-demorgan': finalize('set-demorgan', demorgan, 'sets'),
  propositions: PROPOSITION_ACTIVITIES
};
