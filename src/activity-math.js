import { isSetLogic, evaluateSetLogicActivity } from './set-logic-math.js';
export function parseNumber(value) {
  const text = String(value ?? '').trim().replaceAll('−', '-').replaceAll(',', '').replace(/\s+/g, '');
  if (!text) return NaN;
  const parts = text.split('/');
  const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  if (parts.length > 2 || parts.some(part => !numeric.test(part))) return NaN;
  const result = parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(parts[0]);
  return Number.isFinite(result) ? result : NaN;
}
export const closeTo = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
export function displayNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return '정의되지 않음';
  return Number(value.toFixed(digits)).toLocaleString('ko-KR', { maximumFractionDigits: digits });
}
export function modelValue(model, x) {
  if (!model || !Number.isFinite(x)) return NaN;
  switch (model.kind) {
    case 'linear': return model.a * x + model.b;
    case 'quadratic': return model.a * x * x + model.b * x + model.c;
    case 'constant': return model.value;
    case 'absLinear': return Math.abs(model.a * x + model.b);
    case 'rational': return Math.abs(x - model.p) < 1e-10 ? NaN : model.k / (x - model.p) + model.q;
    case 'fractionLinear': return Math.abs(model.c * x + model.d) < 1e-10 ? NaN : (model.a * x + model.b) / (model.c * x + model.d);
    case 'root': {
      const inside = model.a * (x - model.p);
      return inside < -1e-10 ? NaN : (model.s ?? 1) * Math.sqrt(Math.max(0, inside)) + model.q;
    }
    case 'rootRaw': {
      const inside = model.a * x + model.b;
      return inside < -1e-10 ? NaN : Math.sqrt(Math.max(0, inside)) + model.c;
    }
    case 'rootPolynomial': {
      const inside = model.a * x * x + model.b * x + model.c;
      return inside < 0 ? NaN : Math.sqrt(inside);
    }
    case 'rootReciprocal': {
      const inside = model.a * x + model.b;
      return inside <= 0 ? NaN : 1 / Math.sqrt(inside);
    }
    case 'rootInverse': {
      if (!model.a || (model.s ?? 1) * (x - model.q) < 0) return NaN;
      return (x - model.q) ** 2 / model.a + model.p;
    }
    case 'rootExpression': {
      if (model.id === 'sum-difference') return x < 0 ? NaN : (Math.sqrt(x + 3) + Math.sqrt(x)) * (Math.sqrt(x + 3) - Math.sqrt(x));
      if (model.id === 'rationalize') return x < -4 ? NaN : x / (Math.sqrt(x + 4) + 2);
      return NaN;
    }
    case 'piecewise': return modelValue(x < model.cut || (x === model.cut && !model.rightClosed) ? model.left : model.right, x);
    case 'compose': return modelValue(model.outer, modelValue(model.inner, x));
    case 'rationalExpression': {
      switch (model.id) {
        case 'rat1': return closeTo(x, 3) ? NaN : 6 / (x - 3) - 2 * x / (x - 3);
        case 'rat2': return closeTo(x, 1) ? NaN : 4 + 3 / (x - 1);
        case 'rat3': return closeTo(x, -2) || closeTo(x, 2) ? NaN : x / (x + 2) + (x - 6) / (x * x - 4);
        case 'rat4': return closeTo(x, -1) || closeTo(x, 3) ? NaN : (x - 1) / (x - 3) - (x + 5) / (x * x - 2 * x - 3);
        case 'root1': return x < 0.5 ? NaN : (Math.sqrt(2 * x + 1) + Math.sqrt(2 * x - 1)) * (Math.sqrt(2 * x + 1) - Math.sqrt(2 * x - 1));
        case 'root2': return x < 0 ? NaN : 2 / (Math.sqrt(x + 2) - Math.sqrt(x));
        case 'root-review1': return closeTo(x, -1) || closeTo(x, 2) ? NaN : 2 / (x - 2) - 6 / (x * x - x - 2);
        case 'root-review2': return x < 0 ? NaN : 1 / (Math.sqrt(x + 1) + Math.sqrt(x)) - 1 / (Math.sqrt(x + 1) - Math.sqrt(x));
      }
      return NaN;
    }
    default: return NaN;
  }
}
export const labState = (question, record) => ({ ...question.widget.defaults, ...record.lab });
export function labTargets(question) {
  if (isSetLogic(question)) return {};
  if (question.widget.type === 'graph') {
    const target = question.widget.target;
    return target.kind === 'rational' ? { k: target.k, p: target.p, q: target.q } : { a: target.a, p: target.p, q: target.q, s: target.s };
  }
  return question.widget.target || {};
}
export function evaluateActivity(question, record) {
  if (isSetLogic(question)) return evaluateSetLogicActivity(question, record);
  const values = record.responses || {}, lab = labState(question, record), issues = [];
  if (question.widget.type === 'substitute' && lab.placed !== 'full') {
    issues.push('대입 카드에서 안쪽 함수의 식 전체를 골라 빈칸에 넣어주세요.');
  }
  if (question.widget.requireStages && (lab.stage || 0) < question.widget.stages.length) issues.push('변형 카드를 눌러 원래 식을 정리하는 과정을 먼저 완성해요.');
  if (question.widget.type === 'rootInverse' && question.widget.requireReflection && !(record.reflectedPoints || []).length) issues.push('원함수의 점을 하나 이상 눌러 좌표를 뒤집어 보세요.');
  if (question.widget.type === 'rootABC' && Math.abs(lab.a) < 1e-10) issues.push('이 활동은 a≠0인 무리함수예요. a를 0이 아닌 값으로 바꾸어요.');
  for (const field of question.fields) {
    const answer = values[field.key];
    if (answer === undefined || answer === '') issues.push(field.label + '을(를) 완성해 주세요.');
    else if (field.type === 'number' && !closeTo(parseNumber(answer), field.answer)) issues.push(field.label + '을(를) 다시 확인해 보세요.');
    else if (field.type === 'choice' && String(answer) !== field.answer) issues.push(field.label + '에서 조건이나 부호를 다시 살펴보세요.');
  }
  const labels = { a: '계수 a', b: '상수 b', k: 'k', p: 'x방향 위치 p', q: 'y방향 위치 q', s: '근호 밖 부호' };
  for (const [key, expected] of Object.entries(labTargets(question))) {
    if (!closeTo(Number(lab[key]), expected)) issues.push((labels[key] || key) + '를 바꾸어 식의 조건과 그래프를 맞춰보세요.');
  }
  if (question.requireTrials && new Set((record.trials || []).map(trial => trial.signature)).size < question.requireTrials) {
    issues.push('슬라이더를 서로 다른 ' + question.requireTrials + '가지 값 이상으로 바꾸어 직접 비교해 주세요.');
  }
  return {
    correct: issues.length === 0,
    message: issues.length ? issues.slice(0, 2).join(' ') : '발견한 규칙과 답이 맞아요! ' + question.explanation,
    issues
  };
}
export function rememberTrial(record, key, value) {
  record.trials = record.trials || [];
  const signature = key + ':' + value;
  if (!record.trials.some(trial => trial.signature === signature)) {
    record.trials.push({ key, value, signature });
    if (record.trials.length > 40) record.trials.shift();
  }
}
export function parameterModels(question, lab) {
  const linear = (a, b) => ({ kind: 'linear', a, b });
  switch (question.widget.scenario) {
    case 'commute': return [{ model: linear(6, 3 * lab.k - 4), label: 'g(f(x))', color: '#146c55' }, { model: linear(6, lab.k - 8), label: 'f(g(x))', color: '#8658a6', dashed: true }];
    case 'bijection': return [{ model: { kind: 'piecewise', cut: 0, left: linear(lab.a + 2, 3), right: linear(4 - lab.a, 3), rightClosed: true }, label: 'f(x)', color: '#146c55' }];
    case 'find-inner': return [{ model: linear(3 * lab.a, 3 * lab.b - 2), label: 'f(h(x))', color: '#146c55' }, { model: linear(-2, 1), label: '목표 g(x)', color: '#8658a6', dashed: true }];
    case 'find-outer': return [{ model: linear(3 * lab.a, -2 * lab.a + lab.b), label: 'h(f(x))', color: '#146c55' }, { model: linear(-2, 1), label: '목표 g(x)', color: '#8658a6', dashed: true }];
    case 'root-point': return [{ model: { kind: 'root', a: lab.a, p: -3, q: 1, s: 1 }, label: '이동한 그래프', color: '#146c55' }];
    case 'symmetry': return [{ model: { kind: 'rational', k: -14, p: -4, q: 3 }, label: '주어진 함수', color: '#146c55' }, { model: linear(-1, lab.k), label: '대칭축 후보', color: '#8658a6', dashed: true }];
    case 'self-inverse': {
      const model = { kind: 'rational', k: 5 - 2 * lab.a, p: -lab.a, q: 2 };
      return [{ model, color: '#146c55', label: 'f(x)' }, ...(Math.abs(model.k) < 1e-8 ? [] : [{ model: { ...model, p: 2, q: -lab.a }, color: '#8658a6', label: 'f⁻¹(x)', dashed: true }])];
    }
    case 'translation': return [{ model: { kind: 'root', a: -2, p: 3, q: lab.a - 4, s: 1 }, color: '#146c55', label: '오른쪽 3, 아래 4 이동 후' }, { model: { kind: 'root', a: -2, p: lab.b / 2, q: 3, s: 1 }, color: '#8658a6', label: '두 번째 식', dashed: true }];
    case 'root-two-points': return [{ model: { kind: 'rootRaw', a: lab.a, b: lab.b, c: 0 }, color: '#146c55', label: '원함수' }];
    default: return [];
  }
}
