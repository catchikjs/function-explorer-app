// Complete the opening concepts and worked examples in the supplied 39-page PDF.
// Stable identifiers keep existing radical-a01... answers attached to their questions.
const R = String.raw;
const number = (key, label, answer) => ({ key, label, answer, type: 'number' });
const choice = (key, label, options, answer) => ({ key, label, type: 'choice', answer: String(answer), options: options.map((tex, i) => ({ value: String(i), tex })) });
const root = (a, p = 0, q = 0, s = 1) => ({ kind: 'root', a, p, q, s });
const item = (page, source, title, prompt, formula, widget, fields, explanation, group = '무리함수의 출발', extra = {}) => ({
  sourcePage: page, source, title, prompt, formula, widget, fields, explanation, group,
  hints: ['근호 안이 실수 범위에서 계산되는지 먼저 살펴보세요.', '입력·계수·그래프의 점을 바꾸며 같은 규칙이 유지되는지 비교해요.', explanation], ...extra
});
const domain = (page, source, title, formula, model, boundary, direction, extra = {}) => item(page, source, title,
  '입력을 바꾸어 함숫값을 만들 수 있는 범위를 찾고, 경계값을 포함하는지 확인해요.', formula,
  { type: 'domain', model, defaults: { x: 0 }, ...extra },
  [number('boundary', '정의역의 경계', boundary), choice('direction', '경계와 입력의 관계', [R`x\ge\text{경계}`, R`x\le\text{경계}`, R`x>\text{경계}`, R`x<\text{경계}`], direction)],
  extra.strictRoot ? '분모의 제곱근은 존재하면서 0이 아니어야 하므로 근호 안이 0보다 커야 해요.' : '제곱근이 실수가 되려면 근호 안이 0 이상이어야 해요. 근호 안이 0인 경계도 포함해요.', '무리식과 정의역');
const graph = (page, source, title, formula, model, extra = {}) => item(page, source, title,
  '시작점과 뻗는 방향을 예측한 뒤 슬라이더·정확한 값 입력·기준점 끌기로 그래프를 맞춰요.', formula,
  { type: 'graph', family: 'root', target: model, defaults: { a: 1, p: 0, q: 0, s: 1 } }, [],
  '근호 안이 0인 점 (p,q)에서 출발해요. a의 부호는 좌우, 근호 밖 부호는 위아래 방향을 정해요.', '기본 그래프와 평행이동', extra);
const activities = [];

activities.push(item(2, '130쪽 · 생각 틔우기', '수심이 달라지면 파도의 속력은?',
  '학습지의 모형 h=v²/9.8에서 수심 x와 파도의 속력 v를 연결해요. 수심을 바꾸어 속력을 비교하고, 물리적으로 가능한 제곱근을 골라요.',
  R`x=\frac{v^2}{9.8},\quad v\ge0`, { type: 'context', scenario: 'wave', defaults: { x: 10 } },
  [choice('formula', '속력 v를 x의 식으로', [R`v=\sqrt{9.8x}`, R`v=-\sqrt{9.8x}`, R`v=9.8x^2`], 0), number('speedSquared', '수심 10m에서 속력의 제곱 v²', 98)],
  'v²=9.8x이고 속력은 음수가 아니므로 v=√(9.8x)예요. 수심 10m일 때 속력은 7√2≈9.899m/s예요.'));
activities.push(item(2, '130쪽 · 무리식의 뜻', '근호가 있다는 것만으로 무리식일까?',
  '근호 안에 문자가 있고, 유리식으로 나타낼 수 없는 식이라는 두 조건을 함께 확인해요. 아래 실험에서 음수와 양수 입력을 비교해요.',
  R`\sqrt{x},\quad\sqrt{x^2},\quad\sqrt4`, { type: 'rootABC', varying: 'a', defaults: { a: 1, b: 0, c: 0 } },
  [choice('definition', '무리식의 정의에 필요한 조건', [R`\text{근호 안에 문자, 유리식으로 나타낼 수 없음}`, R`\text{근호가 보이면 언제나 무리식}`, R`\text{무리수가 계수이면 모두 무리식}`], 0), choice('constant', '√4의 성질', [R`\text{상수 }2\text{이므로 무리식이 아님}`, R`\text{근호가 있어 무리식}`], 0)],
  '근호가 있어도 √4=2처럼 유리식으로 나타낼 수 있으면 무리식이 아니에요.'));
activities.push(item(3, '그림으로 정리 · 제곱근과 절댓값', '음수를 제곱한 뒤 루트를 씌우면?',
  '음수와 양수를 대입하고 변형 카드를 사용해 √(x²)를 정리해요. x가 음수인 경우도 성립해야 해요.',
  R`\sqrt{x^2}`, { type: 'algebra', requireStages: true, stages: [{ action: '절댓값으로 정리하기', tex: R`\sqrt{x^2}=|x|` }], probeModels: [{ kind: 'absLinear', a: 1, b: 0 }], defaults: { x: -3, stage: 0 } },
  [choice('result', '모든 실수에서 같은 식', ['x', '-x', '|x|'], 2), number('negative', 'x=−3일 때 값', 3)],
  '제곱근의 값은 0 이상이므로 √(x²)=|x|예요. x=−3이면 √9=3으로 x와 달라요.', '무리식과 정의역'));
activities.push(item(4, '130쪽 · 예제 1 (1)', '합과 차의 곱을 움직여 정리',
  'A=√(x+3), B=√x로 보고 (A+B)(A−B)를 변형한 뒤 계산해요.',
  R`(\sqrt{x+3}+\sqrt x)(\sqrt{x+3}-\sqrt x)`,
  { type: 'algebra', requireStages: true, stages: [{ action: '합차공식 적용', tex: R`(\sqrt{x+3})^2-(\sqrt x)^2` }, { action: '제곱근의 제곱 정리', tex: R`(x+3)-x=3` }], probeModels: [{ kind: 'rootExpression', id: 'sum-difference' }], defaults: { x: 2, stage: 0 } },
  [number('result', '간단히 한 결과', 3), choice('domain', '원래 식의 정의역', [R`x\ge0`, R`x\ge-3`, R`x\in\mathbb R`], 0)],
  '합차공식을 적용하면 (x+3)−x=3. 원래 두 제곱근을 계산하려면 x≥0이어야 해요.', '무리식과 정의역'));
activities.push(item(4, '130쪽 · 예제 1 (2)', '유리화에서 빠뜨리기 쉬운 입력',
  '분자·분모에 켤레식을 곱해 정리해요. 중간에 x로 나누었다면 x=0을 원래 식에 따로 넣어 확인해요.',
  R`\frac{x}{\sqrt{x+4}+2}`, { type: 'algebra', requireStages: true, stages: [{ action: '켤레식을 곱하기', tex: R`\frac{x(\sqrt{x+4}-2)}{(x+4)-4}` }, { action: 'x≠0에서 약분하고 x=0 따로 확인', tex: R`\sqrt{x+4}-2\quad(x\ge-4)` }], probeModels: [{ kind: 'rootExpression', id: 'rationalize' }, { kind: 'rootRaw', a: 1, b: 4, c: -2 }], defaults: { x: 1, stage: 0 } },
  [choice('result', '간단히 한 식', [R`\sqrt{x+4}-2`, R`\sqrt{x+4}+2`, R`\frac1{\sqrt{x+4}-2}`], 0), choice('zero', 'x=0도 원래 식에서 가능한가요?', [R`\text{가능하며 양쪽 값은 }0`, R`\text{약분했으므로 반드시 제외}`], 0)],
  'x≠0에서 약분해 √(x+4)−2를 얻어요. x=0에서도 원래 식과 정리한 식이 모두 0이므로 원래 정의역 x≥−4 전체에서 같아요.', '무리식과 정의역'));
activities.push(domain(4, '130쪽 · 보기', '5x+3이 허용하는 입력', R`y=\sqrt{5x+3}`, root(5, -3 / 5), -3 / 5, 0));
for (const [label, title, formula, model, boundary, direction, extra] of [
  ['무리식 예 ①', '제곱근의 가장 기본적인 정의역', R`y=\sqrt x`, root(1), 0, 0, {}],
  ['무리식 예 ②', '시작 입력이 0이 아닐 때', R`y=\sqrt{2x-3}`, root(2, 1.5), 1.5, 0, {}],
  ['무리식 예 ④', '루트가 분모이면 경계도 확인', R`y=\frac1{\sqrt{x-2}}`, { kind: 'rootReciprocal', a: 1, b: -2 }, 2, 2, { strictRoot: true }],
  ['무리함수 예 ②', '상수항이 바꾸는 시작 입력', R`y=\sqrt{2x+1}`, root(2, -.5), -.5, 0, {}],
  ['무리함수 예 ③', '근호 밖 −7은 정의역을 바꿀까?', R`y=\sqrt{3x-1}-7`, root(3, 1 / 3, -7), 1 / 3, 0, {}]
]) activities.push(domain(5, `130쪽 · ${label}`, title, formula, model, boundary, direction, extra));
activities.splice(8, 0, item(5, '130쪽 · 무리식 예 ③', '근호 안이 이차식이면 두 경계',
  '√(4−x²)가 실수가 되는 입력을 그래프와 수직선으로 살펴보고, 양쪽 경계의 포함 여부를 확인해요.', R`y=\sqrt{4-x^2}`, { type: 'readGraph', model: { kind: 'rootPolynomial', a: -1, b: 0, c: 4 }, points: [[-2, 0], [0, 2], [2, 0]], defaults: { x: 0 } },
  [number('left', '왼쪽 경계', -2), number('right', '오른쪽 경계', 2), choice('boundary', '경계 포함 여부', [R`-2\le x\le2`, R`-2<x<2`, R`x\le-2\text{ 또는 }x\ge2`], 0)],
  '4−x²≥0이면 x²≤4이므로 −2≤x≤2예요. x=±2에서도 제곱근 0을 계산할 수 있어요.', '무리식과 정의역'));

activities.push(item(6, '131쪽 · 역함수 식 구하기', '루트 함수를 뒤집으면 반쪽 포물선',
  'y=√(2x)의 점을 뒤집어 역함수 그래프를 켜 보세요. 식뿐 아니라 입력 범위도 함께 정해요.', R`f(x)=\sqrt{2x}`, { type: 'rootInverse', model: root(2), points: [0, 2, 8], requireReflection: true, defaults: { x: 2, reflected: false } },
  [choice('form', '역함수의 식', [R`\frac{x^2}{2}`, R`2x^2`, R`\sqrt{x/2}`], 0), choice('domain', '역함수의 정의역', [R`x\ge0`, R`x\in\mathbb R`, R`x\le0`], 0)],
  '원함수의 출력이 0 이상이므로 역함수의 입력도 0 이상이에요. 역함수는 f⁻¹(x)=x²/2 (x≥0)예요.', '무리함수와 역함수'));
activities.push(item(7, '그림으로 정리 · 역함수의 좌표', '좌표를 뒤집어 길을 이어요',
  '원함수 y=√(2x) 위의 (8,4)를 뒤집고 대응하는 역함수의 점을 골라요.', R`(8,4)\ \longmapsto\ (?,?)`, { type: 'rootInverse', model: root(2), points: [0, 2, 8], requireReflection: true, defaults: { x: 8, reflected: true } },
  [number('x', '뒤집은 점의 x좌표', 4), number('y', '뒤집은 점의 y좌표', 8), choice('symmetry', '대칭의 기준', ['y=x', 'x=0', 'y=0'], 0)],
  '(x,y)를 (y,x)로 옮기면 직선 y=x에 대한 대칭이에요. (8,4)는 (4,8)로 옮겨져요.', '무리함수와 역함수'));
activities.push(item(8, '131쪽 · a<0일 때 역함수', '왼쪽 루트의 역함수도 입력은 0 이상',
  'y=√(−2x)의 원함수와 역함수를 비교해요. 원함수의 정의역과 역함수의 정의역을 구별해요.', R`f(x)=\sqrt{-2x}`, { type: 'rootInverse', model: root(-2), points: [0, -2, -8], requireReflection: true, defaults: { x: -2, reflected: false } },
  [choice('originalDomain', '원함수의 정의역', [R`x\le0`, R`x\ge0`], 0), choice('inverse', '역함수와 그 정의역', [R`y=-\frac{x^2}{2},\ x\ge0`, R`y=-\frac{x^2}{2},\ x\le0`, R`y=\frac{x^2}{2},\ x\ge0`], 0)],
  '원함수의 입력은 x≤0이지만 출력은 y≥0이에요. 따라서 역함수는 −x²/2 (x≥0)예요.', '무리함수와 역함수'));
activities.push(item(8, '131쪽 · 기본 성질 · 계수의 크기', 'a의 크기와 곡선의 모양',
  'a=1,2,3 등을 비교해요. 같은 y에서 x가 어떻게 달라지는지 생각해 보세요.', R`y=\sqrt{ax},\quad a\ne0`, { type: 'rootABC', varying: 'a', defaults: { a: 1, b: 0, c: 0 } },
  [choice('shape', 'a>0에서 |a|가 커지면', [R`\text{같은 }x>0\text{에서 높이가 커짐}`, R`\text{시작점의 높이만 이동}`, R`\text{모든 점이 왼쪽으로만 이동}`], 0)],
  'a>0에서 a가 커지면 같은 양수 x에서 √(ax)가 커져요. 같은 높이 y에서는 x=y²/a가 0에 가까워져 곡선이 y축 쪽으로 모여요.', '기본 그래프와 평행이동', { requireTrials: 2 }));
activities.push(graph(9, '131쪽 · 근호 밖의 마이너스', '근호 밖 부호로 x축 대칭', R`y=-\sqrt{2x}`, root(2, 0, 0, -1)));
activities.push(graph(10, '그림으로 정리 · 기본 그래프 ①', '왼쪽으로 뻗는 루트 만들기', R`y=\sqrt{-2x}`, root(-2)));
activities.push(graph(10, '그림으로 정리 · 기본 그래프 ②', '두 부호를 함께 바꾸면?', R`y=-\sqrt{-2x}`, root(-2, 0, 0, -1)));
activities.push(graph(11, '132쪽 · 평행이동 · a>0', '시작점을 오른쪽 위로 옮겨요', R`y=\sqrt{2(x-2)}+1`, root(2, 2, 1)));
activities.push(graph(11, '132쪽 · 평행이동 · a<0', '시작점을 옮기고 왼쪽으로', R`y=\sqrt{-2(x-2)}+1`, root(-2, 2, 1)));
activities.push(item(12, '132쪽 · 시작점과 범위', '세 상수에서 시작점 읽기',
  'a,b,c를 바꾸어 근호 안이 0인 점의 x좌표와 시작 높이를 찾아요.', R`y=\sqrt{ax+b}+c,\quad a\ne0`, { type: 'rootABC', varying: 'all', defaults: { a: 1, b: 0, c: 0 } },
  [choice('start', '시작점', [R`(-b/a,c)`, '(b,c)', '(a,b)'], 0), choice('range', '치역의 조건', [R`y\ge c`, R`y\le c`, R`y\in\mathbb R`], 0)],
  'ax+b=a(x+b/a)이므로 시작점은 (−b/a,c)예요. 제곱근은 0 이상이므로 치역은 y≥c예요.', '기본 그래프와 평행이동', { requireTrials: 2 }));
activities.push(item(13, '그림으로 정리 · 평행이동 꼴', '근호 안에서 이동량 찾기',
  '2x+6을 2(x−p)로 묶고, 근호 밖 상수에서 q를 찾아요.', R`y=\sqrt{2x+6}-2=\sqrt{2(x-p)}+q`, { type: 'rootABC', varying: 'all', defaults: { a: 2, b: 0, c: 0 } },
  [number('p', 'p', -3), number('q', 'q', -2)],
  '2x+6=2(x+3)=2(x−(−3))이므로 p=−3, q=−2예요.', '기본 그래프와 평행이동'));
activities.push(graph(14, '132쪽 · 예제 2 · 그래프', '예제의 그래프를 직접 완성', R`y=\sqrt{2x+6}-2`, root(2, -3, -2)));
activities.push(item(14, '132쪽 · 예제 2 · 정의역과 치역', '완성한 그래프와 범위를 연결',
  '시작점과 그래프의 뻗는 방향을 확인하고 정의역·치역을 함께 나타내요.', R`y=\sqrt{2x+6}-2`, { type: 'readGraph', model: root(2, -3, -2), points: [[-3, -2], [-1, 0]], defaults: { x: 0 } },
  [choice('domain', '정의역', [R`x\ge-3`, R`x\le-3`, R`x\ge3`], 0), choice('range', '치역', [R`y\ge-2`, R`y\le-2`, R`y\ge2`], 0)],
  '시작점은 (−3,−2)이고 오른쪽 위로 뻗어요. 정의역은 x≥−3, 치역은 y≥−2예요.', '기본 그래프와 평행이동'));

export const RADICAL_FOUNDATIONS = activities.map((q, i) => ({ ...q, id: `radical-foundation-${String(i + 1).padStart(2, '0')}` }));
