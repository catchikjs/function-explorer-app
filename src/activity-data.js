import { RADICAL_FOUNDATIONS } from './radical-foundations.js';
// 원본의 문제 조건과 소문항 순서를 유지하고, 각 소문항을 독립적인 탐구 활동으로 구성한다.
const number = (key, label, answer, unit = '') => ({ key, label, answer, unit, type: 'number' });
const choice = (key, label, options, answer) => ({ key, label, options: options.map((option, i) => typeof option === 'string' ? { value: String(i), tex: option } : option), answer: String(answer), type: 'choice' });
const linear = (a, b) => ({ kind: 'linear', a, b });
const quadratic = (a, b, c) => ({ kind: 'quadratic', a, b, c });
const rational = (k, p = 0, q = 0) => ({ kind: 'rational', k, p, q });
const root = (a, p = 0, q = 0, s = 1) => ({ kind: 'root', a, p, q, s });
const base = (page, source, title, prompt, formula, widget, fields, explanation, extra = {}) => ({
  sourcePage: page, source, title, prompt, formula, widget, fields, explanation,
  hints: ['문제의 입력·출력과 조건을 먼저 구별해 보세요.', '탐구 도구에서 한 가지 조건만 바꿔 결과를 비교해 보세요.', '실험에서 찾은 규칙을 식이나 그래프로 확인해 보세요.'], ...extra
});
const inverse = (page, source, title, a, b, graphOnly = false) => base(page, source, title,
  graphOnly ? '원래 그래프의 점을 뒤집고, 역함수의 직선을 만들어 보세요.' : '입력과 출력을 바꾸어 역함수의 식을 완성하세요.',
  'f(x)=' + (a===1/3?'\\\\frac13':a===0.25?'\\\\frac14':a===-0.5?'-\\\\frac12':a) + 'x' + (b >= 0 ? '+' : '') + b,
  { type: 'inverse', original: linear(a, b), target: { a: 1 / a, b: -b / a }, defaults: { a: 1, b: 0 }, points: [0, 1, 2] }, [],
  '원래 점 (x, y)를 (y, x)로 옮기면 직선 y=x에 대하여 대칭입니다. 역함수는 f⁻¹(x)=(x-' + b + ')/(' + a + ')입니다.',
  { group: '역함수', hints: ['원래 함수의 점 하나를 선택해 좌표를 뒤집어 보세요.', 'y=' + a + 'x+' + b + '에서 x만 남도록 정리해 보세요.', '역함수의 기울기는 원래 기울기의 역수입니다. y절편도 함께 확인해 보세요.'] });
const graph = (page, source, title, formula, model, extra = {}) => base(page, source, title,
  '식의 조건을 읽고 슬라이더나 그래프 위 기준점을 움직여 그래프를 완성하세요.', formula,
  { type: 'graph', family: model.kind, target: model, defaults: { a: 1, p: 0, q: 0, k: 1, s: 1 }, ...extra }, [],
  model.kind === 'rational'
    ? '분모가 0이 되는 x=p와 가까워지는 높이 y=q가 점근선입니다. k의 부호와 크기는 두 곡선의 방향과 모양을 결정합니다.'
    : '근호 안이 0이 되는 점 (p,q)에서 출발합니다. 근호 안 a의 부호로 좌우 방향을, 근호 밖 부호로 위아래 방향을 결정합니다.',
  { group: model.kind === 'rational' ? '그래프와 점근선' : '그래프와 범위' });
const polynomial = (page, source, title, formula, coefficients, chain, extra = {}) => base(page, source, title,
  '함수 식 전체를 대입하고, 만들어진 식의 계수를 찾아보세요.', formula,
  { type: 'substitute', chain, degree: coefficients.length - 1, defaults: { x: 1, placed: false } },
  coefficients.map((answer, i) => number('c' + i, ['x²의 계수', 'x의 계수', '상수항'].slice(3 - coefficients.length)[i], answer)),
  '안쪽 식 전체를 괄호로 묶어 대입합니다. 서로 다른 입력에서 원래 두 단계의 계산과 내가 만든 식이 같은지도 확인하세요.',
  { group: '합성함수', ...extra });
const rationalCalc = (page, source, title, formula, stages, options, answer, excluded, probeModels) => base(page, source, title,
  '변형 카드를 골라 식을 정리하고, 약분 전의 정의역도 함께 확인하세요.', formula,
  { type: 'algebra', stages, probeModels, defaults: { x: 4, stage: 0 } },
  [choice('result', '간단히 한 식', options, answer), choice('excluded', '원래 식에서 제외되는 입력', excluded.options, excluded.answer)],
  '약분으로 사라진 인수도 원래 식의 분모를 0으로 만들었다면 계속 제외해야 합니다.',
  { group: '식의 계산', hints: ['각 분모를 인수분해하여 0이 되는 입력부터 찾아보세요.', '분모가 다르면 통분한 뒤 분자 전체를 계산하세요.', '약분 전후의 정의역이 달라지지 않았는지 확인하세요.'] });

const composition = [];
const valueF = { kind: 'absLinear', a: 2, b: -5 }, valueG = quadratic(1, -3, 0);
for (const [i, names, x, first, result] of [
  [1, ['f', 'g'], 2, 1, -2], [2, ['g', 'f'], 2, -2, 9],
  [3, ['f', 'f'], 3, 1, 3], [4, ['g', 'g'], 3, 0, 0]
]) composition.push(base(8, '116쪽 · 스스로 익히기 1 (' + i + ')', '함수 기계를 차례로 통과하기 (' + i + ')',
  '두 함수 f, g에 대하여 주어진 합성함수의 값을 구하세요.',
  'f(x)=|2x-5|,\\quad g(x)=x^2-3x,\\qquad (' + names[1] + '\\circ ' + names[0] + ')(' + x + ')',
  { type: 'machine', operations: names.map(name => ({ name, model: name === 'f' ? valueF : valueG })), defaults: { x: x + 1, step: 0 }, targetInput: x },
  [number('middle', '첫 번째 함수를 통과한 값', first), number('result', '최종 함숫값', result)],
  '오른쪽에 쓰인 ' + names[0] + '부터 적용합니다. 첫 출력 ' + first + '를 다음 함수의 입력으로 넣으면 ' + result + '입니다.',
  { group: '합성함수', hints: ['합성 기호에서 오른쪽 함수를 먼저 찾아보세요.', '첫 함수의 출력이 두 번째 함수의 입력이 됩니다.', '함수 기계의 입력을 ' + x + '로 바꾸고 한 단계씩 통과시켜 보세요.'] }));
composition.push(base(9, '116쪽 · 스스로 익히기 2', '대응 경로를 세 번 따라가기',
  'f(2)+(f∘f)(2)+(f∘f∘f)(2)의 값을 구하세요.', 'f:1\\mapsto3,\\ 2\\mapsto4,\\ 3\\mapsto2,\\ 4\\mapsto3',
  { type: 'mapping', mapping: { 1: '3', 2: '4', 3: '2', 4: '3' }, repeat: 3, defaults: { input: '1', step: 0 } },
  [number('one', 'f(2)', 4), number('two', '(f∘f)(2)', 3), number('three', '(f∘f∘f)(2)', 2), number('sum', '세 값의 합', 9)],
  '2 → 4 → 3 → 2의 경로이므로 합은 4+3+2=9입니다.', { group: '합성함수' }));
composition.push(polynomial(10, '116쪽 · 스스로 익히기 3 (1)', '식을 통째로 끼워 넣기 · g∘f', 'f(x)=3x+1,\\quad g(x)=x^2-2x,\\quad (g\\circ f)(x)', [9, 0, -1],
  [{ name: 'f', model: linear(3, 1), tex: '3x+1' }, { name: 'g', model: quadratic(1, -2, 0), tex: 'x^2-2x' }]));
composition.push(polynomial(10, '116쪽 · 스스로 익히기 3 (2)', '합성 순서를 바꾸면?', 'f(x)=3x+1,\\quad g(x)=x^2-2x,\\quad (f\\circ g)(x)', [3, -6, 1],
  [{ name: 'g', model: quadratic(1, -2, 0), tex: 'x^2-2x' }, { name: 'f', model: linear(3, 1), tex: '3x+1' }]));
composition.push(polynomial(11, '116쪽 · 스스로 익히기 4', '이미 묶인 합성함수 사용하기', '(g\\circ f)(x)=4x-3,\\quad h(x)=x^2+x,\\quad ((h\\circ g)\\circ f)(x)', [16, -20, 6],
  [{ name: 'g∘f', model: linear(4, -3), tex: '4x-3' }, { name: 'h', model: quadratic(1, 1, 0), tex: 'x^2+x' }]));
const inverseMapping = { 1: 'c', 2: 'a', 3: 'b' };
for (const [i, formula, input, reverse, result] of [
  [1, 'f^{-1}(b)', 'b', true, '3'], [2, '(f^{-1}\\circ f)(2)', '2', false, '2'], [3, '(f\\circ f^{-1})(c)', 'c', true, 'c']
]) composition.push(base(18, '119쪽 · 스스로 익히기 1 (' + i + ')', '대응을 거꾸로 읽기 (' + i + ')', '주어진 대응에서 다음 값을 구하세요.',
  'f:1\\mapsto c,\\ 2\\mapsto a,\\ 3\\mapsto b,\\qquad ' + formula,
  { type: 'mapping', mapping: inverseMapping, reverse, roundTrip: i > 1, defaults: { input, step: 0 } },
  [choice('result', '원래 입력과 출력을 따라 찾은 값', ['1', '2', '3', 'a', 'b', 'c'], ['1', '2', '3', 'a', 'b', 'c'].indexOf(result))],
  i === 1 ? 'b로 도착하는 원래 입력은 3이므로 f⁻¹(b)=3입니다.' : '함수와 역함수를 차례로 적용하면 처음 출발한 값으로 돌아옵니다.', { group: '역함수' }));
composition.push(base(19, '119쪽 · 스스로 익히기 2 (1)', '출력에서 원래 입력 찾기', 'f⁻¹(−2)의 값을 구하세요.', 'f(x)=3x+4',
  { type: 'reverse', model: linear(3, 4), defaults: { x: 0 }, targetOutput: -2 }, [number('result', '출력이 −2가 되는 입력', -2)],
  '3x+4=−2를 풀면 x=−2입니다.', { group: '역함수' }));
composition.push(base(19, '119쪽 · 스스로 익히기 2 (2)', '정방향 다음 역방향', '(g⁻¹∘f)(3)의 값을 구하세요.', 'f(x)=3x+4,\\quad g(x)=2x-3',
  { type: 'machine', operations: [{ name: 'f', model: linear(3, 4) }, { name: 'g⁻¹', model: linear(0.5, 1.5) }], defaults: { x: 1, step: 0 }, targetInput: 3 },
  [number('middle', '먼저 f(3)', 13), number('result', '그다음 g⁻¹(f(3))', 8)], 'f(3)=13이고 2x−3=13을 만족하는 입력은 8입니다.', { group: '역함수' }));
composition.push(inverse(20, '119쪽 · 스스로 익히기 3 (1)', '역함수 직선 만들기 (1)', -4, 2));
composition.push(inverse(20, '119쪽 · 스스로 익히기 3 (2)', '역함수 직선 만들기 (2)', 1 / 3, -6));
composition.push(inverse(21, '119쪽 · 스스로 익히기 4 (1)', '점을 뒤집어 역함수 그리기 (1)', 3, -2, true));
composition.push(inverse(21, '119쪽 · 스스로 익히기 4 (2)', '점을 뒤집어 역함수 그리기 (2)', -0.5, 1, true));
const pieceA = { kind: 'piecewise', cut: 0, left: linear(3, 2), right: linear(0.5, 2), rightClosed: true };
const pieceB = { kind: 'piecewise', cut: 2, left: linear(-0.5, 0), right: linear(-3, 5), rightClosed: true };
for (const [page, source, title, model, cut, formOptions, answer] of [
  [23, '120쪽 · 활동 1', '구간별 그래프의 좌표 뒤집기', pieceA, 2, ['(a,b)\\mapsto(b,a)', '(a,b)\\mapsto(-a,b)', '(a,b)\\mapsto(a,-b)'], 0],
  [25, '120쪽 · 활동 2', '역함수의 새 구간 나누기', pieceA, 2, ['\\begin{cases}2x-4&x\\ge2\\\\(x-2)/3&x<2\\end{cases}', '\\begin{cases}2x-4&x\\ge0\\\\(x-2)/3&x<0\\end{cases}', '\\begin{cases}(x-2)/3&x\\ge2\\\\2x-4&x<2\\end{cases}'], 0],
  [25, '120쪽 · 적용·확장 활동 1', '감소하는 구간별 그래프 뒤집기', pieceB, -1, ['(2,-1)\\mapsto(-1,2)', '(2,-1)\\mapsto(1,-2)', '(2,-1)\\mapsto(2,1)'], 0],
  [25, '120쪽 · 적용·확장 활동 2', '경계점의 포함 조건까지 바꾸기', pieceB, -1, ['\\begin{cases}(5-x)/3&x\\le-1\\\\-2x&x>-1\\end{cases}', '\\begin{cases}(5-x)/3&x\\ge-1\\\\-2x&x<-1\\end{cases}', '\\begin{cases}(x-5)/3&x\\le-1\\\\-2x&x>-1\\end{cases}'], 0]
]) composition.push(base(page, source, title, '입력을 움직여 구간을 확인하고, 점을 y=x에 대하여 뒤집어 보세요.',
  model === pieceA ? 'f(x)=\\begin{cases}\\frac12x+2&x\\ge0\\\\3x+2&x<0\\end{cases}' : 'f(x)=\\begin{cases}-3x+5&x\\ge2\\\\-\\frac12x&x<2\\end{cases}',
  { type: 'piecewise', model, defaults: { x: 1, reflected: false } },
  [number('boundary', '역함수의 식이 나뉘는 입력 경계', cut), choice('result', source.endsWith('1') ? '좌표를 옮기는 방법' : '역함수의 식과 조건', formOptions, answer)],
  '원래 함수의 출력 범위가 역함수의 입력 조건이 됩니다. 경계점의 좌표와 포함 여부도 함께 바꾸어야 합니다.', { group: '구간별 함수와 적용' }));
const fuelFormula = 'v(t)=400t+60\\ (0\\le t\\le0.2),\\quad r(x)=-0.003x^2+0.48x+2.3';
composition.push(base(26, '121쪽 · 활동 1 (1)', '시간 → 속도 → 연비', 't시간 후의 연비를 합성함수의 식으로 나타내세요.', fuelFormula,
  { type: 'context', scenario: 'fuel', defaults: { x: 0 } },
  [number('c0', 't²의 계수', -480), number('c1', 't의 계수', 48), number('c2', '상수항', 20.3)],
  'r(v(t))=−0.003(400t+60)²+0.48(400t+60)+2.3=−480t²+48t+20.3입니다.', { group: '구간별 함수와 적용' }));
composition.push(base(26, '121쪽 · 활동 1 (2)', '연비 목표를 찾는 주행 실험', '검사를 시작한 지 몇 분 후에 연비가 21.5 km/L가 되나요?', fuelFormula,
  { type: 'context', scenario: 'fuel', defaults: { x: 0 } }, [number('minutes', '검사 시작 후 시간', 3, '분')],
  '−480t²+48t+20.3=21.5에서 (t−0.05)²=0입니다. 0.05시간은 3분입니다.', { group: '구간별 함수와 적용' }));
composition.push(base(26, '121쪽 · 활동 2 (1)', '온도계를 거꾸로 읽기', '화씨를 섭씨로 바꾸는 함수를 뒤집어 섭씨 x℃를 화씨 y℉로 바꾸는 식 y=mx+b를 만드세요.',
  'y=\\frac59(x-32)\\quad(\\text{화씨}\\to\\text{섭씨})',
  { type: 'context', scenario: 'temperature', defaults: { x: 20 } },
  [number('m', '섭씨 → 화씨 식의 m', 9 / 5), number('b', '상수항 b', 32), choice('relation', '두 함수의 관계', [{ value: 'inverse', label: '서로 역함수' }, { value: 'same', label: '서로 같은 함수' }], 'inverse')],
  '섭씨를 화씨로 바꾸면 y=(9/5)x+32입니다. 입력과 출력을 바꾸는 서로 역함수 관계입니다.', { group: '구간별 함수와 적용' }));
composition.push(base(26, '121쪽 · 활동 2 (2)', '55℃는 몇 ℉일까?', '섭씨 55℃를 화씨로 나타내세요.', 'F=\\frac95C+32',
  { type: 'context', scenario: 'temperature', defaults: { x: 20 } }, [number('result', '화씨온도', 131, '℉')],
  '(9/5)×55+32=131이므로 131℉입니다.', { group: '구간별 함수와 적용' }));
composition.push(polynomial(29, '122쪽 · 중단원 확인 01 (1)', '마이너스까지 통째로 대입', 'f(x)=5x-1,\\quad g(x)=-x+3,\\quad (g\\circ f)(x)', [-5, 4],
  [{ name: 'f', model: linear(5, -1), tex: '5x-1' }, { name: 'g', model: linear(-1, 3), tex: '-x+3' }], { group: '중단원 확인' }));
composition.push(polynomial(29, '122쪽 · 중단원 확인 01 (2)', '두 순서의 결과 비교하기', 'f(x)=5x-1,\\quad g(x)=-x+3,\\quad (f\\circ g)(x)', [-5, 14],
  [{ name: 'g', model: linear(-1, 3), tex: '-x+3' }, { name: 'f', model: linear(5, -1), tex: '5x-1' }], { group: '중단원 확인' }));
composition.push({ ...inverse(30, '122쪽 · 중단원 확인 02', '역함수로 원래 입력 되찾기', 0.25, 2), group: '중단원 확인' });
composition.push(base(31, '123쪽 · 중단원 확인 03', '기울기를 바꾸어 일대일대응 만들기', '실수 전체에서 정의된 다음 함수가 일대일대응이 되는 a의 범위를 구하세요.',
  'f(x)=\\begin{cases}(4-a)x+3&x\\ge0\\\\(a+2)x+3&x<0\\end{cases}',
  { type: 'parameter', scenario: 'bijection', defaults: { a: 1, x: 1 } },
  [number('lower', 'a의 범위 · 왼쪽 경계', -2), number('upper', '오른쪽 경계', 4), choice('ends', '두 경계를 포함할까요?', [{ value: 'open', label: '둘 다 포함하지 않음' }, { value: 'closed', label: '둘 다 포함' }], 'open')],
  '두 기울기가 모두 양수여야 출력이 겹치지 않고 실수 전체를 덮습니다. 4−a>0, a+2>0이므로 −2<a<4입니다.', { group: '중단원 확인' }));
composition.push(base(32, '123쪽 · 중단원 확인 04', '두 합성 기계의 출력 맞추기', 'g∘f=f∘g가 성립하도록 하는 k를 구하세요.', 'f(x)=2x+k,\\quad g(x)=3x-4',
  { type: 'parameter', scenario: 'commute', defaults: { k: 0, x: 1 }, target: { k: -2 } }, [],
  'g(f(x))=6x+3k−4, f(g(x))=6x+k−8입니다. 3k−4=k−8에서 k=−2입니다.', { group: '중단원 확인' }));
for (const [i, scenario, a, b] of [[1, 'find-inner', -2 / 3, 1], [2, 'find-outer', -2 / 3, -1 / 3]]) composition.push(base(33, '123쪽 · 중단원 확인 05 (' + i + ')',
  i === 1 ? '안쪽의 모르는 함수 만들기' : '바깥쪽의 모르는 함수 만들기', '주어진 조건을 만족하는 일차함수 h(x)=mx+b를 구하세요.',
  'f(x)=3x-2,\\quad g(x)=-2x+1,\\quad ' + (i === 1 ? 'f\\circ h=g' : 'h\\circ f=g'),
  { type: 'parameter', scenario, defaults: { a: 1, b: 0, x: 1 }, target: { a, b } }, [],
  i === 1 ? '3h(x)−2=−2x+1이므로 h(x)=−(2/3)x+1입니다.' : 'h(x)=mx+b라 두면 3mx−2m+b=−2x+1입니다. m=−2/3, b=−1/3입니다.', { group: '중단원 확인' }));
composition.push(base(34, '123쪽 · 중단원 확인 06', '원함수와 역함수의 교점 찾기', '두 그래프의 교점 좌표를 구하세요.', 'f(x)=\\frac13x+2',
  { type: 'intersection', original: linear(1 / 3, 2), inverse: linear(3, -6), defaults: { x: 0 } },
  [number('x', '교점의 x좌표', 3), number('y', '교점의 y좌표', 3)],
  'x/3+2=3x−6을 풀면 x=3이고 y=3입니다. 두 그래프 모두 점 (3,3)을 지납니다.', { group: '중단원 확인' }));
composition.push(base(35, '123쪽 · 중단원 확인 07', '1과 2가 자기 자리로 돌아오게 하기', 'g∘f가 X={1,2}의 항등함수일 때 a+b를 구하세요.',
  'f(x)=ax-2a,\\quad g(x)=x^2+bx+b',
  { type: 'parameter', scenario: 'identity', defaults: { a: 2, b: 1, x: 1 } }, [number('sum', 'a+b', 3)],
  'f(2)=0이므로 g(0)=b=2입니다. g(f(1))=g(−a)=1에서 (a−1)²=0이므로 a=1, a+b=3입니다.', { group: '중단원 확인' }));
composition.push(base(36, '123쪽 · 중단원 확인 08', '다음 입력에서 구간 다시 고르기', '(f∘f)(−1)+f⁻¹(1)의 값을 구하세요.',
  'f(x)=\\begin{cases}4x+5&x\\ge0\\\\-x^2+5&x<0\\end{cases}',
  { type: 'piecewise', model: { kind: 'piecewise', cut: 0, left: quadratic(-1, 0, 5), right: linear(4, 5), rightClosed: true }, defaults: { x: -1, reflected: false } },
  [number('middle', '첫 번째 출력 f(−1)', 4), number('two', '다시 적용한 f(f(−1))', 21), number('inverse', 'f⁻¹(1)', -2), number('sum', '두 값의 합', 19)],
  'f(−1)=4는 0 이상이므로 두 번째에는 4x+5를 사용하여 21을 얻습니다. f⁻¹(1)=−2이므로 합은 19입니다.', { group: '중단원 확인' }));
for (const [i, fields] of [[1, [number('rate', 'y=kx에서 k', 120)]], [2, [number('usd', '500디르함을 달러로', 50, 'USD'), number('krw', '필요한 원화', 60000, '원')]]]) composition.push(base(37,
  '123쪽 · 중단원 확인 09 (' + i + ')', i === 1 ? '환전 경로를 함수로 연결하기' : '500디르함을 준비하려면?',
  i === 1 ? 'x디르함이 y원일 때 y=kx의 k를 구하세요.' : '500디르함이 필요할 때 얼마의 원화를 환전해야 하나요? 수수료는 없습니다.',
  '1\\mathrm{USD}=10\\mathrm{MAD}=1200\\mathrm{KRW}',
  { type: 'context', scenario: 'currency', defaults: { x: 100 } }, fields,
  '디르함을 10으로 나누면 달러이고, 여기에 1200을 곱하면 원화입니다. y=120x이며 500디르함은 60,000원입니다.', { group: '중단원 확인' }));

const rationalActivities = [
  rationalCalc(9, '126쪽 · 스스로 익히기 1 (1)', '약분해도 사라지지 않는 조건', '\\frac6{x-3}-\\frac{2x}{x-3}',
    [{ action: '분자끼리 빼기', tex: '\\frac{6-2x}{x-3}' }, { action: '분자 인수분해', tex: '\\frac{-2(x-3)}{x-3}' }],
    ['2', '-2', '\\frac{-2}{x-3}', '\\frac{6-2x}{2x-6}'], 1, { options: ['x\\ne0', 'x\\ne-3', 'x\\ne3'], answer: 2 },
    [{ kind: 'rationalExpression', id: 'rat1' }, { kind: 'constant', value: -2 }]),
  rationalCalc(9, '126쪽 · 스스로 익히기 1 (2)', '상수 4도 통분하기', '4+\\frac3{x-1}',
    [{ action: '공통분모로 통분', tex: '\\frac{4(x-1)+3}{x-1}' }],
    ['\\frac{4x+3}{x-1}', '\\frac{7}{x-1}', '\\frac{4x-1}{x-1}', '\\frac{4x-4}{x-1}'], 2, { options: ['x\\ne1', 'x\\ne-1', 'x\\ne0'], answer: 0 },
    [{ kind: 'rationalExpression', id: 'rat2' }, { kind: 'fractionLinear', a: 4, b: -1, c: 1, d: -1 }]),
  rationalCalc(9, '126쪽 · 스스로 익히기 1 (3)', '통분 → 인수분해 → 약분', '\\frac{x}{x+2}+\\frac{x-6}{x^2-4}',
    [{ action: '분모 인수분해', tex: 'x^2-4=(x-2)(x+2)' }, { action: '공통분모로 통분', tex: '\\frac{x(x-2)+(x-6)}{(x-2)(x+2)}' }],
    ['\\frac{x-3}{x-2}', '\\frac{x+3}{x+2}', '\\frac{2x-6}{x^2-4}', '\\frac{x-6}{x-2}'], 0, { options: ['x\\ne2', 'x\\ne-2', 'x\\ne-2,\\ 2'], answer: 2 },
    [{ kind: 'rationalExpression', id: 'rat3' }, { kind: 'fractionLinear', a: 1, b: -3, c: 1, d: -2 }]),
  rationalCalc(9, '126쪽 · 스스로 익히기 1 (4)', '괄호 전체에 마이너스 적용', '\\frac{x-1}{x-3}-\\frac{x+5}{x^2-2x-3}',
    [{ action: '분모 인수분해', tex: 'x^2-2x-3=(x-3)(x+1)' }, { action: '공통분모로 통분', tex: '\\frac{(x-1)(x+1)-(x+5)}{(x-3)(x+1)}' }],
    ['\\frac{x+2}{x-1}', '\\frac{x-2}{x+1}', '\\frac{x+2}{x+1}', '\\frac{x-6}{x+1}'], 2, { options: ['x\\ne-1,\\ 3', 'x\\ne-1', 'x\\ne3'], answer: 0 },
    [{ kind: 'rationalExpression', id: 'rat4' }, { kind: 'fractionLinear', a: 1, b: 2, c: 1, d: 1 }])
];
for (const [i, formula, model, excluded] of [
  [1, '-\\frac2{x+5}', rational(-2, -5, 0), -5],
  [2, '\\frac{x+4}{3x-2}', { kind: 'fractionLinear', a: 1, b: 4, c: 3, d: -2 }, 2 / 3],
  [3, '\\frac{x-1}{x-4}', rational(3, 4, 1), 4]
]) rationalActivities.push(base(10, '126쪽 · 스스로 익히기 2 (' + i + ')', '입력 검사기로 정의역 찾기 (' + i + ')',
  '값을 대입할 수 없는 입력을 찾아 실수 전체에서 제외하세요.', 'y=' + formula,
  { type: 'domain', model, defaults: { x: 0 }, exclude: true },
  [number('excluded', '정의역에서 제외되는 x', excluded)],
  '분모가 0이 되는 입력은 사용할 수 없습니다. 분자가 0이 되는 입력과 구별하세요.', { group: '정의역' }));
for (const [i, formula, model] of [
  [1, '\\frac2x', rational(2)], [2, '-\\frac3x', rational(-3)],
  [3, '\\frac3{x+2}-3', rational(3, -2, -3)], [4, '-\\frac2{x+4}-1', rational(-2, -4, -1)]
]) rationalActivities.push(graph(20, '129쪽 · 스스로 익히기 1 (' + i + ')', '점근선을 먼저 놓고 그래프 만들기 (' + i + ')', 'y=' + formula, model));
rationalActivities.push(graph(22, '129쪽 · 스스로 익히기 2 (1)', '나눗셈으로 그래프 자리 찾기 (1)', 'y=\\frac{-2x+5}{x-2}', rational(1, 2, -2)));
rationalActivities.push(graph(22, '129쪽 · 스스로 익히기 2 (2)', '나눗셈으로 그래프 자리 찾기 (2)', 'y=\\frac{-3x-8}{x+2}', rational(-2, -2, -3)));
rationalActivities.push(base(24, '129쪽 · 스스로 익히기 3', '그래프에서 세 상수 복원하기',
  '점근선 x=1, y=2와 점 (0,1)을 지나는 원본 그래프를 보고 a,b,c를 구하세요.', 'y=\\frac{ax+b}{x+c}',
  { type: 'readGraph', model: rational(1, 1, 2), points: [[0, 1]], defaults: { x: 0 } },
  [number('a', '분자의 x계수 a', 2), number('b', '분자의 상수항 b', -1), number('c', '분모의 상수항 c', -1)],
  '가로 점근선에서 a=2, 세로 점근선에서 c=−1입니다. (0,1)을 대입하면 b/c=1이므로 b=−1입니다.', { group: '그래프와 점근선' }));

const radical = [];
radical.push(base(15, '133쪽 · 스스로 익히기 1 (1)', '두 제곱근을 덩어리로 보기',
  '합과 차의 곱으로 식을 간단히 하세요.', '(\\sqrt{2x+1}+\\sqrt{2x-1})(\\sqrt{2x+1}-\\sqrt{2x-1})',
  { type: 'algebra', stages: [{ action: '합차공식 적용', tex: '(\\sqrt{2x+1})^2-(\\sqrt{2x-1})^2' }], probeModels: [{ kind: 'rationalExpression', id: 'root1' }], defaults: { x: 2, stage: 0 } },
  [number('result', '계산 결과', 2), choice('domain', '원래 식이 정해지는 범위', ['x\\ge-\\frac12', 'x\\ge\\frac12', 'x>0'], 1)],
  '(2x+1)−(2x−1)=2입니다. 두 근호가 모두 정해지려면 x≥1/2이어야 합니다.', { group: '무리식의 계산' }));
radical.push(base(15, '133쪽 · 스스로 익히기 1 (2)', '켤레식으로 분모의 근호 없애기', '분모와 분자에 같은 켤레식을 곱해 간단히 하세요.', '\\frac2{\\sqrt{x+2}-\\sqrt x}',
  { type: 'algebra', stages: [{ action: '켤레식을 곱하기', tex: '\\frac{2(\\sqrt{x+2}+\\sqrt x)}{(x+2)-x}' }], probeModels: [{ kind: 'rationalExpression', id: 'root2' }], defaults: { x: 2, stage: 0 } },
  [choice('result', '간단히 한 식', ['\\sqrt{x+2}-\\sqrt x', '2\\sqrt{x+2}+2\\sqrt x', '\\sqrt{x+2}+\\sqrt x'], 2)],
  '분모는 (x+2)−x=2가 되고 분자의 2와 약분되어 √(x+2)+√x입니다. 원래 범위는 x≥0입니다.', { group: '무리식의 계산' }));
for (const [i, formula, model, boundary, direction] of [
  [1, '\\sqrt{2x-7}', root(2, 3.5), 3.5, 'ge'],
  [2, '\\sqrt{-3x-2}+1', root(-3, -2 / 3, 1), -2 / 3, 'le']
]) radical.push(base(16, '133쪽 · 스스로 익히기 2 (' + i + ')', '근호 안의 신호등 (' + i + ')',
  '입력을 움직여 실수인 함숫값이 나오는 범위를 찾으세요.', 'y=' + formula,
  { type: 'domain', model, defaults: { x: 0 } },
  [number('boundary', '정의역의 경계', boundary), choice('direction', '경계와 부등호를 연결하세요', ['x\\ge\\text{경계}', 'x\\le\\text{경계}', 'x>\\text{경계}', 'x<\\text{경계}'], direction === 'ge' ? 0 : 1)],
  '근호 안이 0 이상이어야 하며 0도 허용합니다. 음수로 나누면 부등호 방향이 바뀝니다.', { group: '정의역' }));
for (const [i, formula, a, s] of [[1, '\\sqrt{2x}', 2, 1], [2, '\\sqrt{-2x}', -2, 1], [3, '-\\sqrt{2x}', 2, -1], [4, '-\\sqrt{-2x}', -2, -1]]) radical.push(graph(17, '133쪽 · 스스로 익히기 3 (' + i + ')',
  '네 방향의 제곱근 그래프 (' + i + ')', 'y=' + formula, root(a, 0, 0, s)));
radical.push(graph(19, '133쪽 · 스스로 익히기 4 (1)', '시작점과 범위를 함께 만들기 (1)', 'y=\\sqrt{3x-9}-1', root(3, 3, -1)));
radical.push(graph(19, '133쪽 · 스스로 익히기 4 (2)', '시작점과 범위를 함께 만들기 (2)', 'y=\\sqrt{-2x+8}+3', root(-2, 4, 3)));
radical.push(base(21, '133쪽 · 스스로 익히기 5', '이동한 곡선이 점을 지나게 하기',
  'y=√(ax)를 왼쪽으로 3, 위로 1만큼 옮긴 그래프가 (−1,7)을 지날 때 a를 구하세요.', 'y=\\sqrt{a(x+3)}+1',
  { type: 'parameter', scenario: 'root-point', defaults: { a: 2 }, target: { a: 18 } }, [],
  '(−1,7)을 대입하면 7=√(2a)+1입니다. √(2a)=6에서 a=18입니다.', { group: '그래프와 범위' }));
radical.push(base(22, '134쪽 · 활동 1', '역함수가 되면 점근선은 어디로?',
  'k≠0인 유리함수의 역함수 식과 점근선을 완성하세요.', 'f(x)=\\frac{k}{x-p}+q',
  { type: 'rationalInverse', defaults: { k: 3, p: 2, q: -1, reflected: false } },
  [choice('form', '역함수의 식', ['\\frac{k}{x-p}+q', '\\frac{k}{x-q}+p', '\\frac{1/k}{x-q}+p'], 1)],
  'x와 y를 바꾸고 정리하면 f⁻¹(x)=k/(x−q)+p입니다. 새 점근선은 x=q, y=p입니다.', { group: '역함수와 공학 탐구' }));
radical.push(base(22, '134쪽 · 활동 2', '점근선의 역할 교환하기',
  '원함수와 역함수의 점근선 사이의 관계를 관찰하세요.', 'f(x)=\\frac{k}{x-p}+q',
  { type: 'rationalInverse', defaults: { k: 3, p: 2, q: -1, reflected: false } },
  [choice('vertical', '역함수의 세로 점근선', ['x=p', 'x=q', 'x=k'], 1), choice('horizontal', '역함수의 가로 점근선', ['y=p', 'y=q', 'y=k'], 0)],
  '입력과 출력이 바뀌므로 원함수의 가로 점근선 y=q가 역함수의 세로 점근선 x=q가 됩니다. 반대쪽도 마찬가지입니다.', { group: '역함수와 공학 탐구' }));
radical.push(base(22, '134쪽 · 활동 3', '평행이동으로 역함수와 포개기',
  '원함수를 어느 방향으로 이동하면 역함수와 겹칠까요?', 'f(x)=\\frac{k}{x-p}+q,\\quad f^{-1}(x)=\\frac{k}{x-q}+p',
  { type: 'rationalInverse', translate: true, defaults: { k: 3, p: 2, q: -1, dx: 0, dy: 0, reflected: true } },
  [choice('translation', '(x방향 이동량, y방향 이동량)', ['(p-q,q-p)', '(q-p,p-q)', '(q,p)'], 1)],
  '중심을 (p,q)에서 (q,p)로 옮기면 됩니다. x방향 q−p, y방향 p−q만큼 이동합니다.', { group: '역함수와 공학 탐구' }));
radical.push(base(24, '134쪽 · 적용·확장', '두 방법으로 같은 역함수 찾기', '문자를 바꾸는 방법과 점근선을 바꾸는 방법으로 같은 역함수를 구하세요.',
  'f(x)=\\frac{3x-1}{x-2}',
  { type: 'rationalInverse', fixed: true, defaults: { k: 5, p: 2, q: 3, reflected: false } },
  [choice('result', '역함수의 식', ['\\frac{2x-1}{x-3}', '\\frac{3x-1}{x-2}', '\\frac{2x+1}{x+3}'], 0)],
  'f(x)=5/(x−2)+3이므로 f⁻¹(x)=5/(x−3)+2=(2x−1)/(x−3)입니다.', { group: '역함수와 공학 탐구' }));
for (const [i, source, title, varying, defaults, options, answer] of [
  [0, '135쪽 · 활동 1', '세 상수를 직접 움직여 보기', 'all', { a: 1, b: 0, c: 0 }, ['(-b/a,c)', '(b,c)', '(a,b)'], 0],
  [1, '135쪽 · 활동 2 (1)', 'a의 부호와 크기를 바꾸면?', 'a', { a: 1, b: 0, c: 0 }, [{ value: 'direction', label: '좌우 방향과 곡선의 모양이 변함' }, { value: 'height', label: '시작 높이만 변함' }], 'direction'],
  [2, '135쪽 · 활동 2 (2)', 'b만 바꾸는 실험', 'b', { a: 1, b: 0, c: 1 }, [{ value: 'horizontal', label: '시작점은 (−b,1), 좌우로 이동함' }, { value: 'vertical', label: '시작점이 위아래로만 이동함' }], 'horizontal'],
  [3, '135쪽 · 활동 2 (3)', 'c만 바꾸는 실험', 'c', { a: 1, b: 1, c: 0 }, [{ value: 'horizontal', label: '시작점의 x좌표만 바뀜' }, { value: 'vertical', label: '시작점은 (−1,c), 위아래로 이동함' }], 'vertical']
]) radical.push(base(i === 0 ? 25 : 26, source, title, '슬라이더를 서로 다른 두 값 이상으로 움직인 뒤 관찰 결과를 고르세요.', 'y=\\sqrt{ax+b}+c\\quad(a\\ne0)',
  { type: 'rootABC', varying, defaults }, [choice('observation', i === 0 ? '그래프의 시작점' : '관찰한 변화', options, answer)],
  '근호 안이 0일 때 x=−b/a이고 높이는 c입니다. a의 부호는 뻗는 방향, b는 좌우 위치, c는 위아래 위치에 영향을 줍니다.',
  { group: '역함수와 공학 탐구', requireTrials: 2 }));
radical.push(graph(26, '135쪽 · 적용·확장', '대칭이동과 평행이동 조합하기', 'y=\\sqrt{-x+2}+1', root(-1, 2, 1)));
radical.push(rationalCalc(29, '136쪽 · 중단원 확인 01 (1)', '분모를 인수분해해 계산하기', '\\frac2{x-2}-\\frac6{x^2-x-2}',
  [{ action: '분모 인수분해', tex: 'x^2-x-2=(x-2)(x+1)' }, { action: '공통분모로 통분', tex: '\\frac{2(x+1)-6}{(x-2)(x+1)}' }],
  ['\\frac2{x-2}', '\\frac2{x+1}', '\\frac{-4}{x^2-x-2}'], 1, { options: ['x\\ne-1', 'x\\ne2', 'x\\ne-1,\\ 2'], answer: 2 },
  [{ kind: 'rationalExpression', id: 'root-review1' }, { kind: 'fractionLinear', a: 0, b: 2, c: 1, d: 1 }]));
radical.at(-1).group = '중단원 확인';
radical.push(base(29, '136쪽 · 중단원 확인 01 (2)', '두 켤레 분수의 차', 'a≥0에서 다음 식을 간단히 하세요.',
  '\\frac1{\\sqrt{a+1}+\\sqrt a}-\\frac1{\\sqrt{a+1}-\\sqrt a}',
  { type: 'algebra', stages: [{ action: '켤레 분모를 곱하기', tex: '(\\sqrt{a+1}+\\sqrt a)(\\sqrt{a+1}-\\sqrt a)=1' }], probeModels: [{ kind: 'rationalExpression', id: 'root-review2' }], defaults: { x: 2, stage: 0 } },
  [number('coefficient', '간단히 한 식 c√a의 c', -2)],
  '공통분모는 1이고 분자는 (√(a+1)−√a)−(√(a+1)+√a)=−2√a입니다.', { group: '중단원 확인' }));
radical.push({ ...graph(30, '136쪽 · 중단원 확인 02 (1)', '유리함수의 그래프와 범위', 'y=\\frac{3x-4}{x-2}', rational(2, 2, 3)), group: '중단원 확인' });
radical.push({ ...graph(30, '136쪽 · 중단원 확인 02 (2)', '무리함수의 그래프와 범위', 'y=\\sqrt{2-x}+1', root(-1, 2, 1)), group: '중단원 확인' });
radical.push(base(32, '137쪽 · 중단원 확인 03', '대칭축을 중심에 통과시키기', '그래프가 직선 y=−x+k에 대하여 대칭일 때 k를 구하세요.',
  'y=\\frac{3x-2}{x+4}',
  { type: 'parameter', scenario: 'symmetry', defaults: { k: 0 }, target: { k: -1 } }, [],
  'y=−14/(x+4)+3의 중심은 (−4,3)입니다. 3=−(−4)+k이므로 k=−1입니다.', { group: '중단원 확인' }));
radical.push(base(34, '137쪽 · 중단원 확인 04', '원함수와 역함수가 겹치게 하기', 'f=f⁻¹이 되도록 하는 a를 구하세요.', 'f(x)=\\frac{2x+5}{x+a}',
  { type: 'parameter', scenario: 'self-inverse', defaults: { a: 0 }, target: { a: -2 } }, [],
  '원함수의 세로 점근선 x=−a와 가로 점근선 y=2가 뒤집혀도 같아야 합니다. −a=2이므로 a=−2입니다.', { group: '중단원 확인' }));
radical.push(base(35, '137쪽 · 중단원 확인 05', '시작점과 한 점으로 곡선 복원하기',
  '시작점 (−3,−1)과 점 (0,2)를 지나는 그래프에서 a,p,q를 구하세요.', 'y=\\sqrt{a(x-p)}+q',
  { type: 'graph', family: 'root', target: root(3, -3, -1), showTarget: true, points: [[0, 2]], defaults: { a: 1, p: 0, q: 0, s: 1 } }, [],
  '시작점에서 p=−3, q=−1입니다. (0,2)를 대입하면 3=√(3a)이므로 a=3입니다.', { group: '중단원 확인' }));
radical.push(base(36, '137쪽 · 중단원 확인 06', '이동하기 전과 후의 식 맞추기',
  '원래 그래프를 오른쪽 3, 아래 4만큼 옮기면 두 번째 그래프와 일치합니다. a,b를 구하세요.',
  'y=\\sqrt{-2x}+a\\quad\\longrightarrow\\quad y=\\sqrt{-2x+b}+3',
  { type: 'parameter', scenario: 'translation', defaults: { a: 1, b: 0 }, target: { a: 7, b: 6 } }, [],
  '이동하면 y=√(−2(x−3))+a−4=√(−2x+6)+a−4입니다. b=6, a−4=3에서 a=7입니다.', { group: '중단원 확인' }));
radical.push(base(37, '137쪽 · 중단원 확인 07', '움직이는 점과 가장 작은 원',
  'A(1,−3)을 중심으로 그래프 위 P를 지나는 원의 넓이의 최솟값을 구하세요.', 'y=\\frac{-3x+5}{x-1}',
  { type: 'distance', defaults: { x: 2 } }, [number('area', '최소 넓이가 cπ일 때 c', 4)],
  't=x−1이면 y+3=2/t입니다. 반지름의 제곱은 t²+4/t²≥4이므로 원의 넓이의 최솟값은 4π입니다.', { group: '중단원 확인' }));
radical.push(base(38, '137쪽 · 중단원 확인 08', '뒤집은 점으로 두 조건 세우기',
  '원함수와 역함수의 그래프가 모두 (2,1)을 지날 때 a,b를 구하세요.', 'f(x)=\\sqrt{ax+b}',
  { type: 'parameter', scenario: 'root-two-points', defaults: { a: 1, b: 1 }, target: { a: -3, b: 7 } }, [],
  '(2,1)이 역함수 위에 있으면 (1,2)는 원함수 위에 있습니다. 2a+b=1, a+b=4에서 a=−3, b=7입니다.', { group: '중단원 확인' }));
radical.push(base(39, '137쪽 · 중단원 확인 09', '렌즈 거리와 도수 실험',
  '렌즈 앞 2m의 물체에 대하여 상이 맺히는 거리가 x=1m일 때 초점 거리와 도수를 구하세요.', 'y=\\frac{2x}{x+2},\\quad D=\\frac1y',
  { type: 'context', scenario: 'lens', defaults: { x: 2 } },
  [number('focal', '초점 거리 y', 2 / 3, 'm'), number('power', '렌즈의 도수 D', 3 / 2, 'D')],
  'x=1을 대입하면 초점 거리는 2/3m입니다. 도수는 그 역수인 3/2D입니다.', { group: '중단원 확인' }));

const completeRadical = [...RADICAL_FOUNDATIONS, ...radical.map((q, i) => ({ ...q, id: 'radical-a' + String(i + 1).padStart(2, '0') }))];
export const ACTIVITY_SETS = Object.fromEntries(Object.entries({ composition, rational: rationalActivities, radical: completeRadical }).map(([id, items]) => [
  id, items.map((item, index) => ({ ...item, id: item.id || id + '-a' + String(index + 1).padStart(2, '0'), number: index + 1, workbookId: id, source: item.source + ' · PDF ' + item.sourcePage + '쪽' }))
]));
