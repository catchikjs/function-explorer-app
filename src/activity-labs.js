import { math, escapeHTML as esc } from './ui.js';
import { labState, modelValue, displayNumber as n, parseNumber, parameterModels } from './activity-math.js';
import { isSetLogic } from './set-logic-math.js';
import { renderSetLogicLab, renderSetLogicAnswers, refreshSetLogicLab } from './set-logic-labs.js';
const green = '#146c55', purple = '#80519c', blue = '#286da0';
const m = (tex, display = false) => math(tex, display);
const b = (label, action, attrs = '', cls = 'light small') => `<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const sign = value => value < 0 ? n(value) : '+' + n(value);
function texNumber(value) {
  if (Number.isInteger(value)) return String(value);
  for (const denominator of [2, 3, 4, 5, 6, 8, 10, 12]) {
    const numerator = Math.round(value * denominator);
    if (Math.abs(numerator / denominator - value) < 1e-8) return `${numerator < 0 ? '-' : ''}\\frac{${Math.abs(numerator)}}{${denominator}}`;
  }
  return String(Number(value.toFixed(4)));
}
export function modelTex(model) {
  if (!model) return '';
  if (model.kind === 'linear') return `${texNumber(model.a)}x${sign(model.b)}`;
  if (model.kind === 'quadratic') return `${texNumber(model.a)}x^2${sign(model.b)}x${sign(model.c)}`;
  if (model.kind === 'absLinear') return `|${model.a}x${sign(model.b)}|`;
  if (model.kind === 'rational') return `\\frac{${texNumber(model.k)}}{x${sign(-model.p)}}${sign(model.q)}`;
  if (model.kind === 'root') return `${model.s === -1 ? '-' : ''}\\sqrt{${texNumber(model.a)}(x${sign(-model.p)})}${sign(model.q)}`;
  if (model.kind === 'fractionLinear') return `\\frac{${texNumber(model.a)}x${sign(model.b)}}{${texNumber(model.c)}x${sign(model.d)}}`;
  if (model.kind === 'constant') return texNumber(model.value);
  return '';
}
const X = x => 320 + x * 28, Y = y => 216 - y * 28;
export const graphCoordinate = (x, y) => ({ x: (x - 320) / 28, y: (216 - y) / 28 });
function curve(model, flipped = false) {
  let path = '', previous = null;
  for (let i = 0; i <= 1100; i++) {
    const t = -24 + i * 48 / 1100, value = modelValue(model, t);
    const x = flipped ? value : t, y = flipped ? t : value;
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 28 || Math.abs(y) > 28) { previous = null; continue; }
    const move = !previous || Math.hypot(x - previous.x, y - previous.y) > 1.7;
    path += (move ? 'M' : 'L') + X(x).toFixed(2) + ',' + Y(y).toFixed(2);
    previous = { x, y };
  }
  return path;
}
export function plot(models, { points = [], diagonal = false, handle = null, vertical = null, extra = '' } = {}) {
  let grid = '';
  for (let x = -10; x <= 10; x++) grid += `<line x1="${X(x)}" x2="${X(x)}" y1="20" y2="412" stroke="${x === 0 ? '#79998b' : '#e1e9e1'}" stroke-width="${x === 0 ? 1.7 : 0.8}"/>${x && x % 2 === 0 && Math.abs(x) < 10 ? `<text x="${X(x)}" y="${Y(0) + 23}" text-anchor="middle">${x}</text>` : ''}`;
  for (let y = -7; y <= 7; y++) grid += `<line x1="40" x2="600" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? '#79998b' : '#e1e9e1'}" stroke-width="${y === 0 ? 1.7 : 0.8}"/>${y && y % 2 === 0 ? `<text x="${X(0) - 9}" y="${Y(y) + 5}" text-anchor="end">${y}</text>` : ''}`;
  let paths = diagonal ? `<path d="M${X(-10)},${Y(-10)}L${X(10)},${Y(10)}" stroke="#9b762f" stroke-width="2" stroke-dasharray="7 6" fill="none"/>` : '';
  for (const item of models) {
    const color = item.color || green;
    paths += `<path d="${curve(item.model, item.flipped)}" fill="none" stroke="${color}" stroke-width="${item.dashed ? 2.4 : 3.4}" ${item.dashed ? 'stroke-dasharray="8 5"' : ''} class="lab-curve"/>`;
    if (item.model.kind === 'rational' && !item.flipped && item.asymptotes !== false) paths += `<path d="M${X(item.model.p)},20V412M40,${Y(item.model.q)}H600" fill="none" stroke="${color}" opacity=".6" stroke-width="1.6" stroke-dasharray="4 6"/>`;
  }
  if (vertical !== null) paths += `<path d="M${X(vertical)},20V412" stroke="#b66b31" stroke-width="2" stroke-dasharray="6 4"/>`;
  for (const item of points) {
    if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) continue;
    paths += `<g class="lab-point"><circle cx="${X(item.x)}" cy="${Y(item.y)}" r="6" fill="${item.color || green}" stroke="white" stroke-width="2"/>${item.label ? `<text x="${X(item.x) + 10}" y="${Y(item.y) - 10}" fill="${item.color || green}">${esc(item.label)}</text>` : ''}</g>`;
  }
  if (handle) paths += `<circle cx="${X(handle.x)}" cy="${Y(handle.y)}" r="19" fill="#14735a22"/><circle class="lab-drag-handle" cx="${X(handle.x)}" cy="${Y(handle.y)}" r="10" fill="${green}" stroke="white" stroke-width="3" data-lab-handle tabindex="0" role="slider" aria-label="그래프 기준점 이동" aria-valuetext="(${n(handle.x)}, ${n(handle.y)})"/>`;
  return `<svg data-lab-svg viewBox="0 0 640 440" role="img" aria-label="조작한 조건에 따라 변하는 좌표평면. 범례와 아래 수치로도 결과를 확인할 수 있습니다."><defs><clipPath id="activity-chart-clip"><rect x="40" y="20" width="560" height="392" rx="8"/></clipPath></defs><rect x="40" y="20" width="560" height="392" rx="8" fill="#fff"/><g fill="#3d5747" font-family="sans-serif" font-size="19">${grid}</g><g clip-path="url(#activity-chart-clip)" font-size="19" font-family="sans-serif">${paths}${extra}</g><g fill="#344d3c" font-size="19"><text x="607" y="${Y(0) + 5}">x</text><text x="${X(0) + 10}" y="16">y</text></g></svg><div class="lab-legend">${models.map(item => `<span><i style="--curve-color:${item.color || green}" class="${item.dashed ? 'dashed' : ''}"></i>${esc(item.label || '나의 그래프')}</span>`).join('')}${diagonal ? '<span><i style="--curve-color:#9b762f" class="dashed"></i>y=x</span>' : ''}</div>`;
}
const metric = (label, value, cls = '') => `<div class="lab-metric ${cls}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
function slider(key, label, lab, min = -8, max = 8, step = 0.5, unit = '') {
  return `<label class="lab-control"><span>${esc(label)} <output data-lab-output="${key}">${n(lab[key])}${unit}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${lab[key]}" data-role="activity-parameter" data-param="${key}" aria-label="${esc(label)}"/><span class="lab-exact"><span>직접 입력</span><input type="text" value="${n(lab[key], 6).replaceAll(',', '')}" data-role="activity-exact" data-param="${key}" data-min="${min}" data-max="${max}" aria-label="${esc(label)} 정확한 값" autocomplete="off" spellcheck="false"/></span></label>`;
}
function actionButton(label, key, value, selected = false) {
  return b(label, 'inquiry-set', `data-key="${key}" data-value="${esc(value)}" aria-pressed="${selected}"`, selected ? 'teal small' : 'light small');
}
const currentGraph = (q, lab) => q.widget.family === 'rational' ? { kind: 'rational', k: lab.k, p: lab.p, q: lab.q } : { kind: 'root', a: lab.a, p: lab.p, q: lab.q, s: lab.s };
function graphReadout(model) {
  if (model.kind === 'rational') return metric('세로 점근선', 'x = ' + n(model.p)) + metric('가로 점근선', 'y = ' + n(model.q)) + metric('정의역 · 치역', 'x ≠ ' + n(model.p) + ', y ≠ ' + n(model.q));
  return metric('시작점', '(' + n(model.p) + ', ' + n(model.q) + ')') + metric('정의역', model.a === 0 ? 'a≠0을 확인해요' : 'x ' + (model.a > 0 ? '≥ ' : '≤ ') + n(model.p)) + metric('치역', 'y ' + (model.s === -1 ? '≤ ' : '≥ ') + n(model.q));
}
function machineStage(q, lab) {
  const values = [Number(lab.x)];
  for (const op of q.widget.operations) values.push(modelValue(op.model, values.at(-1)));
  return `<div class="machine-flow"><div class="machine-value"><small>입력</small><strong>${n(values[0])}</strong></div>${q.widget.operations.map((op, i) => `<span class="machine-arrow" aria-hidden="true">→</span><div class="function-machine ${lab.step > i ? 'machine-active' : ''}"><span>${esc(op.name)} 기계</span>${m('y=' + modelTex(op.model))}<strong class="machine-output">${lab.step > i ? n(values[i + 1]) : '?'}</strong><small>출력 → 다음 입력</small></div>`).join('')}</div><p class="lab-caption">오른쪽에 쓰인 함수부터 통과해요. 입력을 바꾸면 각 단계의 출력은 다시 가려져요.</p>`;
}
function mappingPath(q, lab) {
  const mapping = q.widget.mapping, reverse = lab.reverse ?? q.widget.reverse;
  const lookup = value => reverse ? Object.keys(mapping).find(key => mapping[key] === String(value)) : mapping[String(value)];
  let value = String(lab.input), path = [value];
  const count = q.widget.roundTrip ? 2 : q.widget.repeat || 1;
  for (let i = 0; i < Math.min(lab.step, count); i++) {
    value = q.widget.roundTrip && i === 1 ? reverse ? mapping[String(value)] : Object.keys(mapping).find(key => mapping[key] === String(value)) : lookup(value);
    if (value === undefined) break;
    path.push(String(value));
  }
  return path;
}
function mappingStage(q, lab) {
  const left = Object.keys(q.widget.mapping), right = [...new Set(Object.values(q.widget.mapping))], path = mappingPath(q, lab), y = (i, total) => 52 + i * 195 / Math.max(1, total - 1);
  return `<svg viewBox="0 0 620 300" role="img" aria-label="함수의 대응 그림. 입력을 선택하고 경로 따라가기를 누르세요."><ellipse cx="100" cy="150" rx="65" ry="139" fill="#eef5fa" stroke="#a7bfce"/><ellipse cx="510" cy="150" rx="65" ry="139" fill="#eff7ec" stroke="#a3b99b"/><defs><marker id="mapping-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${green}"/></marker></defs>${left.map((key, i) => `<path d="M130 ${y(i, left.length)}L478 ${y(right.indexOf(q.widget.mapping[key]), right.length)}" stroke="${path.includes(key) || path.includes(q.widget.mapping[key]) ? green : '#9cb1b8'}" stroke-width="${path.includes(key) ? 3.5 : 1.8}" marker-end="url(#mapping-arrow)"/>`).join('')}${left.map((key, i) => `<circle cx="100" cy="${y(i, left.length)}" r="19" fill="${path.includes(key) ? green : '#dae9f5'}"/><text x="100" y="${y(i, left.length) + 6}" text-anchor="middle" font-size="23" fill="${path.includes(key) ? 'white' : '#284b66'}">${esc(key)}</text>`).join('')}${right.map((key, i) => `<circle cx="510" cy="${y(i, right.length)}" r="19" fill="${path.includes(key) ? green : '#deecd6'}"/><text x="510" y="${y(i, right.length) + 6}" text-anchor="middle" font-size="23" fill="${path.includes(key) ? 'white' : '#35552f'}">${esc(key)}</text>`).join('')}</svg><div class="mapping-trace" aria-live="polite">${path.map((value, i) => `${i ? '<span aria-hidden="true">→</span>' : ''}<strong>${esc(value)}</strong>`).join('')}</div>`;
}
function numberLine(q, record, lab) {
  const valid = Number.isFinite(modelValue(q.widget.model, lab.x)), boundary = parseNumber(record.responses?.[q.widget.exclude ? 'excluded' : 'boundary']), mark = x => 320 + x * 35;
  const excludedBoundary = q.widget.exclude || q.widget.strictRoot;
  return `<svg viewBox="0 0 640 160" role="img" aria-label="정의역을 검사하는 수직선. 움직이는 점은 실험 중인 입력입니다."><line x1="40" x2="600" y1="75" y2="75" stroke="#68816c" stroke-width="3"/>${Array.from({ length: 17 }, (_, i) => i - 8).map(x => `<line x1="${mark(x)}" x2="${mark(x)}" y1="69" y2="82" stroke="#68816c"/>${x % 2 === 0 ? `<text x="${mark(x)}" y="114" text-anchor="middle" fill="#3b5340" font-size="22">${x}</text>` : ''}`).join('')}${Number.isFinite(boundary) ? `<circle cx="${mark(boundary)}" cy="75" r="10" fill="${excludedBoundary ? 'white' : purple}" stroke="${purple}" stroke-width="3"/><text x="${mark(boundary)}" y="38" text-anchor="middle" fill="#654282" font-size="20">내 경계 ${n(boundary)}</text>` : ''}<circle cx="${mark(lab.x)}" cy="75" r="9" fill="${valid ? green : '#a94a35'}" stroke="white" stroke-width="3"/></svg><div class="domain-signal ${valid ? 'valid' : 'invalid'}"><span aria-hidden="true">${valid ? '✓' : '×'}</span><div><strong>입력 ${n(lab.x)}: ${valid ? '실수인 함숫값을 만들 수 있어요' : '이 입력은 사용할 수 없어요'}</strong><p>${valid ? '현재 출력은 ' + n(modelValue(q.widget.model, lab.x)) + '입니다.' : q.widget.strictRoot ? '분모의 제곱근은 0일 수 없어요. 근호 안이 0보다 커야 해요.' : q.widget.exclude ? '분모가 0이 되는지 확인해 보세요.' : '근호 안이 음수가 되는지 확인해 보세요.'}</p></div></div>`;
}
function coefficientModel(q, record) {
  const values = q.fields.map(field => parseNumber(record.responses?.[field.key]));
  return values.some(value => !Number.isFinite(value)) ? null : values.length === 3 ? { kind: 'quadratic', a: values[0], b: values[1], c: values[2] } : { kind: 'linear', a: values[0], b: values[1] };
}
function substituteStage(q, record, lab) {
  const [inner, outer] = q.widget.chain, candidate = coefficientModel(q, record), combined = { kind: 'compose', inner: inner.model, outer: outer.model };
  const expression = lab.placed === 'full' ? inner.tex : lab.placed === 'outer' ? outer.tex : lab.placed === 'x' ? 'x' : '\\square';
  return `<div class="substitution-flow"><div class="function-tile"><small>먼저 ${esc(inner.name)}</small>${m(inner.tex)}</div><span aria-hidden="true">→</span><div class="substitution-slot"><small>${esc(outer.name)}의 모든 x 자리에</small>${m('\\boxed{' + expression + '}')}<strong>식 전체를 넣어요</strong></div></div><div class="lab-card-row">${actionButton(m(inner.tex), 'placed', 'full', lab.placed === 'full')}${actionButton(m('x'), 'placed', 'x', lab.placed === 'x')}${actionButton(m(outer.tex), 'placed', 'outer', lab.placed === 'outer')}</div>${plot([{ model: combined, color: purple, label: '원래 두 단계를 합성', dashed: true }, ...(candidate ? [{ model: candidate, color: green, label: '내가 만든 식' }] : [])], { points: [{ x: lab.x, y: modelValue(combined, lab.x), color: purple }], vertical: lab.x })}`;
}
function contextStage(q, lab) {
  const scenario = q.widget.scenario;
  if (scenario === 'wave') {
    const speed = Math.sqrt(9.8 * lab.x), depth = 50 + lab.x * 1.3;
    return `<svg class="root-wave" viewBox="0 0 640 300" role="img" aria-label="수심을 바꾸면 파도의 전파 속력이 변하는 학습지 모형"><defs><linearGradient id="root-water" x2="0" y2="1"><stop stop-color="#bde9e3"/><stop offset="1" stop-color="#dfedf8"/></linearGradient></defs><rect x="35" y="30" width="570" height="230" rx="12" fill="#f4f9fb"/><path d="M35 85Q70 55 105 85T175 85T245 85T315 85T385 85T455 85T525 85T605 85V${85 + depth}H35Z" fill="url(#root-water)"/><path d="M35 85Q70 55 105 85T175 85T245 85T315 85T385 85T455 85T525 85T605 85" stroke="#4eaaa2" stroke-width="3" fill="none"/><path d="M75 95V${75 + depth}" stroke="#579d9f" stroke-width="2"/><path d="M${120} 55H${120 + speed * 11}" stroke="#438baf" stroke-width="4"/><text x="100" y="${110 + depth / 2}" fill="#3c7c80" font-size="19">수심 ${n(lab.x)} m</text><text x="350" y="53" fill="#438baf" font-size="18">v = ${n(speed)} m/s</text><text x="320" y="287" text-anchor="middle" fill="#76968d" font-size="16">학습지의 모형: 수심 x ≥ 0, 속력 v ≥ 0</text></svg>`;
  }
  if (scenario === 'temperature') return `<div class="temperature-lab"><div class="thermometer"><div style="height:${Math.max(0, Math.min(100, (lab.x + 20) / 120 * 100))}%"></div></div><div class="context-flow">${metric('섭씨', n(lab.x) + ' ℃')}<span>⇄</span>${metric('화씨', n(lab.x * 9 / 5 + 32) + ' ℉')}</div></div><p class="lab-caption">입력·출력의 단위를 바꾸어도 같은 온도인지 비교해요.</p>`;
  if (scenario === 'currency') return `<div class="currency-rate">${m('10\\ \\mathrm{MAD}=1\\ \\mathrm{USD}=1200\\ \\mathrm{KRW}')}<span>문제에 주어진 환율</span></div><div class="context-flow currency-flow">${metric('디르함', n(lab.x) + ' MAD')}<span>÷ 10 →</span>${metric('달러', n(lab.x / 10) + ' USD')}<span>× 1,200 →</span>${metric('원화', n(lab.x * 120) + ' 원')}</div>`;
  if (scenario === 'fuel') {
    const speed = 400 * lab.x / 60 + 60, efficiency = -0.003 * speed * speed + 0.48 * speed + 2.3;
    return `<div class="car-track"><span class="car-token" style="left:${lab.x / 12 * 85}%">🚙</span></div><div class="context-flow">${metric('검사 시작 후', n(lab.x) + ' 분')}<span>→</span>${metric('속도', n(speed) + ' km/h')}<span>→</span>${metric('연비', n(efficiency) + ' km/L')}</div><div class="fuel-gauge"><span style="width:${Math.max(0, efficiency / 22 * 100)}%"></span><i style="left:${21.5 / 22 * 100}%"></i></div><p class="lab-caption">눈금은 목표 연비 21.5 km/L예요. 식에서 t는 시간, 슬라이더는 분 단위입니다.</p>`;
  }
  const focal = 2 * lab.x / (lab.x + 2), lensX = 260, imageX = Math.min(555, lensX + lab.x * 75), focalX = lensX + focal * 75;
  return `<svg viewBox="0 0 620 270" role="img" aria-label="렌즈 앞 물체와 상의 거리 모형. 물체 거리는 2미터로 고정되어 있습니다."><line x1="25" x2="600" y1="150" y2="150" stroke="#9cac9c" stroke-width="2"/><ellipse cx="260" cy="130" rx="16" ry="100" fill="#d9edf5" stroke="#3e7d9a" stroke-width="3"/><path d="M75 62H260L${imageX} 195M75 62L260 150L${imageX} 195" fill="none" stroke="#ac5f6b" stroke-width="2.5"/><text x="59" y="65" font-size="35">🍎</text><circle cx="${focalX}" cy="150" r="6" fill="${purple}"/><text x="${imageX - 14}" y="211" font-size="27">🍎</text><g fill="#344d3c" font-size="21"><text x="85" y="245">물체 2 m</text><text x="320" y="245">상 ${n(lab.x)} m</text><text x="${focalX - 20}" y="125">초점</text></g></svg><p class="lab-caption">거리 관계를 나타내는 모형이에요. 초점 거리와 도수는 아래 수치로도 확인해요.</p>`;
}
export function renderLabStage(q, record) {
  const lab = labState(q, record), w = q.widget;
  switch (w.type) {
    case 'machine': return machineStage(q, lab);
    case 'mapping': return mappingStage(q, lab);
    case 'substitute': return substituteStage(q, record, lab);
    case 'domain': return numberLine(q, record, lab);
    case 'reverse': return plot([{ model: w.model, label: '원래 함수', color: blue }], { points: [{ x: lab.x, y: modelValue(w.model, lab.x), label: '(' + n(lab.x) + ', ' + n(modelValue(w.model, lab.x)) + ')' }], extra: `<path d="M40 ${Y(w.targetOutput)}H600" stroke="${purple}" stroke-width="2" stroke-dasharray="7 5"/>` });
    case 'inverse': {
      const reflected = (record.reflectedPoints || []).map(index => ({ x: modelValue(w.original, w.points[index]), y: w.points[index], color: purple }));
      return plot([{ model: w.original, color: blue, label: '원래 함수' }, { model: { kind: 'linear', a: lab.a, b: lab.b }, color: green, label: '내 역함수 후보' }], { diagonal: true, points: [...w.points.map(x => ({ x, y: modelValue(w.original, x), color: blue })), ...reflected] }) + `<div class="lab-card-row">${w.points.map((x, i) => b('(' + n(x) + ', ' + n(modelValue(w.original, x)) + ') 뒤집기', 'inquiry-reflect', `data-index="${i}" aria-pressed="${(record.reflectedPoints || []).includes(i)}"`)).join('')}</div>`;
    }
    case 'rootInverse': {
      const original = w.model, inverse = { ...original, kind: 'rootInverse' };
      const reflected = (record.reflectedPoints || []).map(index => ({ x: modelValue(original, w.points[index]), y: w.points[index], color: purple }));
      return plot([{ model: original, color: blue, label: '원래 무리함수' }, ...(lab.reflected ? [{ model: inverse, color: purple, label: '정의역을 제한한 역함수', dashed: true }] : [])], { diagonal: true, points: [...w.points.map(x => ({ x, y: modelValue(original, x), color: blue })), ...reflected] }) + `<div class="lab-card-row">${w.points.map((x, i) => b('(' + n(x) + ', ' + n(modelValue(original, x)) + ') 뒤집기', 'inquiry-reflect', `data-index="${i}" aria-pressed="${(record.reflectedPoints || []).includes(i)}"`)).join('')}</div><p class="lab-caption">원함수의 출력 범위가 역함수의 입력 범위예요. 포물선 전체를 역함수로 그리지 않도록 확인해요.</p>`;
    }
    case 'graph': {
      const model = currentGraph(q, lab), models = [{ model, color: green, label: '내가 만든 그래프' }];
      if (w.showTarget) models.unshift({ model: w.target, color: purple, label: '문제의 그래프', dashed: true });
      return plot(models, { handle: { x: lab.p, y: lab.q }, points: (w.points || []).map(([x, y]) => ({ x, y, color: purple, label: '(' + x + ', ' + y + ')' })) }) + `<div class="lab-equation">${m('y=' + modelTex(model))}</div>`;
    }
    case 'readGraph': return plot([{ model: w.model, color: purple, label: '문제에서 주어진 그래프' }], { vertical: lab.x, points: [...w.points.map(([x, y]) => ({ x, y, label: '(' + x + ', ' + y + ')', color: blue })), { x: lab.x, y: modelValue(w.model, lab.x) }] });
    case 'piecewise': {
      const models = [{ model: w.model, color: blue, label: '원래 함수' }], value = modelValue(w.model, lab.x);
      if (lab.reflected) models.push({ model: w.model, flipped: true, color: purple, label: '좌표를 뒤집은 그래프', dashed: true });
      return plot(models, { diagonal: true, points: [{ x: lab.x, y: value, color: blue, label: '(' + n(lab.x) + ', ' + n(value) + ')' }, ...(lab.reflected ? [{ x: value, y: lab.x, color: purple }] : [])] });
    }
    case 'algebra': {
      const stage = Math.min(w.stages.length, lab.stage || 0);
      return `<div class="algebra-stage"><span class="tag">변형 ${stage} / ${w.stages.length}</span><div class="algebra-expression">${m(stage ? w.stages[stage - 1].tex : q.formula, true)}</div><div class="lab-card-row">${stage < w.stages.length ? [w.stages[stage].action, '분모만 약분하기', '분모끼리 더하기'].map(action => b(esc(action), 'inquiry-algebra', `data-value="${esc(action)}"`)).join('') : '<span class="lab-caption">마지막 계산은 아래에서 직접 완성해요.</span>'}</div>${record.algebraMessage ? `<p class="lab-caption" role="status">${esc(record.algebraMessage)}</p>` : ''}</div><div class="algebra-probe"><h4>숫자로도 확인하기</h4><div class="lab-metrics">${metric('실험 입력', n(lab.x))}${metric('원래 식의 값', n(modelValue(w.probeModels[0], lab.x)))}${w.probeModels[1] && record.responses?.result !== undefined && record.responses.result === q.fields[0].answer ? metric('내가 고른 식의 값', n(modelValue(w.probeModels[1], lab.x))) : ''}</div><p class="lab-caption">한 입력의 값만 같다고 같은 식은 아니에요. 변형 과정과 원래 정의역을 함께 확인해요.</p></div>`;
    }
    case 'parameter': {
      if (w.scenario === 'identity') {
        const g = x => x * x + lab.b * x + lab.b;
        return `<div class="identity-lab">${[1, 2].map(x => { const middle = lab.a * x - 2 * lab.a, final = g(middle); return `<div class="identity-row">${metric('원래 입력', String(x))}<span>→ f →</span>${metric('중간값', n(middle))}<span>→ g →</span>${metric('최종값', n(final), Math.abs(final - x) < 1e-6 ? 'matched' : '')}</div>`; }).join('')}</div>`;
      }
      const points = w.scenario === 'root-point' ? [{ x: -1, y: 7, color: purple, label: '(−1,7)' }] : w.scenario === 'root-two-points' ? [{ x: 2, y: 1, color: purple, label: '(2,1)' }, ...(lab.reflected ? [{ x: 1, y: 2, color: blue, label: '(1,2)' }] : [])] : w.scenario === 'symmetry' ? [{ x: -4, y: 3, color: blue, label: '중심 (−4,3)' }] : [];
      return plot(parameterModels(q, lab), { points, diagonal: w.scenario === 'self-inverse', vertical: ['commute', 'find-inner', 'find-outer'].includes(w.scenario) ? lab.x : null });
    }
    case 'intersection': return plot([{ model: w.original, color: blue, label: '원래 함수' }, { model: w.inverse, color: purple, label: '역함수' }], { diagonal: true, vertical: lab.x, points: [{ x: lab.x, y: modelValue(w.original, lab.x), color: blue }, { x: lab.x, y: modelValue(w.inverse, lab.x), color: purple }] });
    case 'rationalInverse': {
      const original = { kind: 'rational', k: lab.k, p: lab.p, q: lab.q }, inverse = { ...original, p: lab.q, q: lab.p };
      const model = w.translate ? { ...original, p: lab.p + lab.dx, q: lab.q + lab.dy } : original;
      return plot([{ model, color: green, label: w.translate ? '이동한 원함수' : '원래 함수' }, ...(lab.reflected ? [{ model: inverse, color: purple, label: '역함수', dashed: true }] : [])], { diagonal: !w.translate }) + `<div class="lab-equation">${m('f(x)=' + modelTex(original))}${lab.reflected ? m('f^{-1}(x)=' + modelTex(inverse)) : ''}</div>`;
    }
    case 'rootABC': return plot([{ model: { kind: 'rootRaw', a: lab.a, b: lab.b, c: lab.c }, color: green, label: '슬라이더로 만든 무리함수' }]) + `<div class="lab-equation">${m('y=\\sqrt{' + texNumber(lab.a) + 'x' + sign(lab.b) + '}' + sign(lab.c))}</div>`;
    case 'distance': {
      const x = lab.x, model = { kind: 'rational', k: 2, p: 1, q: -3 }, y = modelValue(model, x), radius = Math.hypot(x - 1, y + 3);
      return plot([{ model, color: green, label: 'P가 움직이는 그래프' }], { points: [{ x: 1, y: -3, color: blue, label: 'A' }, { x, y, color: purple, label: 'P' }], extra: Number.isFinite(radius) ? `<circle cx="${X(1)}" cy="${Y(-3)}" r="${radius * 28}" stroke="${purple}" stroke-width="2" fill="#80519c0a"/><path d="M${X(1)} ${Y(-3)}L${X(x)} ${Y(y)}" stroke="${purple}" stroke-width="2.5"/>` : '' });
    }
    case 'context': return contextStage(q, lab);
    default: return '';
  }
}
export function renderLabReadout(q, record) {
  const lab = labState(q, record), w = q.widget;
  if (w.type === 'graph') return graphReadout(currentGraph(q, lab));
  if (w.type === 'inverse') return metric('내 역함수의 기울기', n(lab.a)) + metric('내 역함수의 y절편', n(lab.b)) + metric('뒤집어 본 점', (record.reflectedPoints || []).length + '개');
  if (w.type === 'rootInverse') return metric('원함수 f(' + n(lab.x) + ')', n(modelValue(w.model, lab.x))) + metric('역함수 f⁻¹(' + n(lab.x) + ')', n(modelValue({ ...w.model, kind: 'rootInverse' }, lab.x))) + metric('역함수의 정의역', 'x ≥ ' + n(w.model.q));
  if (w.type === 'context' && w.scenario === 'wave') return metric('수심 x', n(lab.x) + ' m') + metric('속력의 제곱 v²', n(9.8 * lab.x)) + metric('속력 v', n(Math.sqrt(9.8 * lab.x)) + ' m/s');
  if (w.type === 'reverse') return metric('입력 후보', n(lab.x)) + metric('원래 함수의 출력', n(modelValue(w.model, lab.x))) + metric('찾아야 할 출력', n(w.targetOutput));
  if (w.type === 'substitute') {
    const combined = { kind: 'compose', inner: w.chain[0].model, outer: w.chain[1].model }, candidate = coefficientModel(q, record);
    return metric('입력', n(lab.x)) + metric('두 단계를 통과한 값', n(modelValue(combined, lab.x))) + (candidate ? metric('내가 만든 식의 값', n(modelValue(candidate, lab.x))) : '');
  }
  if (w.type === 'piecewise') {
    const value = modelValue(w.model, lab.x);
    return metric('현재 적용하는 구간', lab.x < w.model.cut ? '왼쪽 식' : '오른쪽 식') + metric('입력 → 출력', n(lab.x) + ' → ' + n(value)) + (lab.reflected ? metric('뒤집은 점', '(' + n(value) + ', ' + n(lab.x) + ')') : '');
  }
  if (w.type === 'rootABC') return metric('시작점', lab.a ? '(' + n(-lab.b / lab.a) + ', ' + n(lab.c) + ')' : 'a=0은 제외해요') + metric('뻗는 방향', lab.a > 0 ? '오른쪽 위' : lab.a < 0 ? '왼쪽 위' : 'a≠0을 확인해요') + metric('비교해 본 설정', new Set((record.trials || []).map(trial => trial.signature)).size + '가지');
  if (w.type === 'readGraph') return metric('현재 읽은 점', '(' + n(lab.x) + ', ' + n(modelValue(w.model, lab.x)) + ')');
  if (w.type === 'intersection') {
    const a = modelValue(w.original, lab.x), b = modelValue(w.inverse, lab.x);
    return metric('세로선의 x', n(lab.x)) + metric('원함수의 y', n(a)) + metric('역함수의 y', n(b)) + metric('두 높이의 차이', n(Math.abs(a - b)));
  }
  if (w.type === 'rationalInverse') return metric('원함수의 중심', '(' + n(lab.p) + ', ' + n(lab.q) + ')') + (lab.reflected ? metric('역함수의 중심', '(' + n(lab.q) + ', ' + n(lab.p) + ')') : '') + (w.translate ? metric('이동한 중심', '(' + n(lab.p + lab.dx) + ', ' + n(lab.q + lab.dy) + ')') : '');
  if (w.type === 'distance') {
    const t = lab.x - 1, r2 = t ? t * t + 4 / (t * t) : NaN;
    return metric('t = x−1', n(t)) + metric('반지름의 제곱', n(r2, 4)) + metric('원의 넓이', Number.isFinite(r2) ? n(r2, 4) + 'π' : '정의되지 않음');
  }
  if (w.type === 'context' && w.scenario === 'lens') return metric('초점 거리', n(2 * lab.x / (lab.x + 2)) + ' m') + metric('도수', n((lab.x + 2) / (2 * lab.x)) + ' D');
  if (w.type === 'parameter') {
    if (w.scenario === 'bijection') return metric('왼쪽 기울기', n(lab.a + 2)) + metric('오른쪽 기울기', n(4 - lab.a));
    if (['commute', 'find-inner', 'find-outer'].includes(w.scenario)) return parameterModels(q, lab).map(item => metric(item.label + ' · x=' + n(lab.x), n(modelValue(item.model, lab.x)))).join('');
    if (w.scenario === 'root-point') return metric('x=−1에서 내 그래프의 높이', n(Math.sqrt(Math.max(0, lab.a * 2)) + 1)) + metric('목표 높이', '7');
    if (w.scenario === 'self-inverse') return Math.abs(5 - 2 * lab.a) < 1e-8 ? metric('역함수 조건', '상수함수로 약분되면 역함수가 존재하지 않아요') : metric('원함수의 세로 점근선', 'x = ' + n(-lab.a)) + metric('역함수의 세로 점근선', 'x = 2');
    if (w.scenario === 'root-two-points') return metric('원함수 f(2)', n(modelValue({ kind: 'rootRaw', a: lab.a, b: lab.b, c: 0 }, 2))) + metric('원함수 f(1)', n(modelValue({ kind: 'rootRaw', a: lab.a, b: lab.b, c: 0 }, 1)));
  }
  return '';
}
function controls(q, record) {
  const lab = labState(q, record), w = q.widget;
  if (w.type === 'machine') return slider('x', '실험할 입력', lab, -4, 5, 0.5) + `<div class="lab-control-actions">${b('한 단계 통과시키기 →', 'inquiry-step', '', 'teal')}${b('처음부터', 'inquiry-rewind')}</div>`;
  if (w.type === 'mapping') {
    const values = (lab.reverse ?? w.reverse) ? [...new Set(Object.values(w.mapping))] : Object.keys(w.mapping);
    return `<div class="lab-control lab-mapping-control"><span>출발할 입력</span><div class="lab-card-row">${values.map(value => actionButton(esc(value), 'input', value, String(lab.input) === value)).join('')}</div></div><div class="lab-control-actions">${b('경로 한 번 따라가기 →', 'inquiry-step', '', 'teal')}${b('다시 출발', 'inquiry-rewind')}</div>`;
  }
  if (w.type === 'graph') return (w.family === 'rational' ? slider('k', '곡선의 계수 k', lab, -6, 6, 0.5) : slider('a', '근호 안의 계수 a', lab, -6, 6, 0.5)) + slider('p', w.family === 'rational' ? '세로 점근선 p' : '시작점의 x좌표 p', lab, -8, 8, 0.5) + slider('q', w.family === 'rational' ? '가로 점근선 q' : '시작점의 y좌표 q', lab, -6, 6, 0.5) + (w.family === 'root' ? `<div class="lab-control"><span>근호 밖의 부호</span><div class="lab-card-row">${actionButton('+√', 's', 1, lab.s === 1)}${actionButton('−√', 's', -1, lab.s === -1)}</div></div>` : '');
  if (w.type === 'inverse') return slider('a', '내 역함수의 기울기', lab, -6, 6, 0.25) + slider('b', '내 역함수의 y절편', lab, -10, 10, 0.5);
  if (w.type === 'rootInverse') return slider('x', '원함수와 역함수에 넣어 비교할 입력', lab, -8, 8, .5) + `<div class="lab-control-actions">${b(lab.reflected ? '역함수 그래프 숨기기' : '역함수 그래프 겹쳐 보기 ⇄', 'inquiry-reflect-graph', '', 'teal')}</div>`;
  if (w.type === 'piecewise') return slider('x', '현재 입력', lab, -5, 5, 0.5) + `<div class="lab-control-actions">${b(lab.reflected ? '뒤집은 그래프 숨기기' : '좌표를 뒤집어 보기 ⇄', 'inquiry-reflect-graph', '', 'teal')}</div>`;
  if (w.type === 'rootABC') return (w.varying === 'all' ? ['a', 'b', 'c'] : [w.varying]).map(key => slider(key, '상수 ' + key, lab, -5, 5, 0.5)).join('');
  if (w.type === 'rationalInverse') return (!w.fixed ? ['k', 'p', 'q'].map(key => slider(key, '상수 ' + key, lab, -5, 5, 0.5)).join('') : '') + (w.translate ? slider('dx', 'x방향으로 이동', lab, -8, 8, 0.5) + slider('dy', 'y방향으로 이동', lab, -8, 8, 0.5) : `<div class="lab-control-actions">${b(lab.reflected ? '원래 함수만 보기' : '역함수 겹쳐 보기 ⇄', 'inquiry-reflect-graph', '', 'teal')}</div>`);
  if (w.type === 'parameter') {
    const config = {
      commute: [['k', '상수 k', -8, 8], ['x', '검사할 입력 x', -3, 3]],
      bijection: [['a', '상수 a', -5, 6]],
      'find-inner': [['a', 'h(x)의 기울기 m', -4, 4], ['b', 'h(x)의 상수항 b', -5, 5], ['x', '검사할 입력 x', -3, 3]],
      'find-outer': [['a', 'h(x)의 기울기 m', -4, 4], ['b', 'h(x)의 상수항 b', -5, 5], ['x', '검사할 입력 x', -3, 3]],
      identity: [['a', '상수 a', -4, 4], ['b', '상수 b', -4, 4]],
      'root-point': [['a', '상수 a', 0.5, 24]], symmetry: [['k', '대칭축의 상수 k', -7, 7]],
      'self-inverse': [['a', '분모의 상수 a', -5, 5]],
      translation: [['a', '원래 식의 근호 밖 a', -2, 10], ['b', '이동 후 근호 안 b', -6, 10]],
      'root-two-points': [['a', '근호 안 x의 계수 a', -8, 8], ['b', '근호 안 상수 b', -8, 10]]
    };
    return config[w.scenario].map(([key, label, min, max]) => slider(key, label, lab, min, max, 0.5)).join('') + (w.scenario === 'root-two-points' ? `<div class="lab-control-actions">${b('역함수의 점 (2,1)을 뒤집기', 'inquiry-reflect-graph', '', 'teal')}</div>` : '');
  }
  if (w.type === 'context') {
    const ranges = { wave: [0, 100, 1, '수심', ' m'], temperature: [-20, 100, 1, '섭씨온도', ' ℃'], currency: [0, 1000, 10, '디르함', ' MAD'], fuel: [0, 12, 0.1, '검사 시작 후', ' 분'], lens: [0.25, 6, 0.25, '상이 맺히는 거리', ' m'] };
    const [min, max, step, label, unit] = ranges[w.scenario];
    return slider('x', label, lab, min, max, step, unit);
  }
  return slider('x', w.type === 'distance' ? '점 P의 x좌표' : w.type === 'algebra' && w.probeModels[0].id === 'root-review2' ? '실험할 a' : '실험할 입력 x', lab, w.type === 'algebra' && ['root1', 'root2', 'root-review2'].includes(w.probeModels[0].id) ? 0 : -7, 7, w.type === 'distance' ? 0.05 : 0.25);
}
export function renderLab(q, record) {
  if (isSetLogic(q)) return renderSetLogicLab(q, record);
  return `<section class="activity-lab" aria-labelledby="lab-heading"><div class="activity-section-title"><span>01</span><div><h3 id="lab-heading">직접 움직이며 발견하기</h3><p>${q.widget.type === 'graph' ? '슬라이더·정확한 값 입력·그래프의 초록 기준점 끌기 중 편한 방법을 사용해요.' : '한 번에 하나씩 바꿔 보고, 무엇이 달라지는지 비교해요.'}</p></div></div><div class="lab-stage" id="activity-lab-stage">${renderLabStage(q, record)}</div><div class="lab-controls">${controls(q, record)}</div><div class="lab-metrics" id="activity-lab-readout" aria-live="polite">${renderLabReadout(q, record)}</div></section>`;
}
export function renderAnswerFields(q, record) {
  if (isSetLogic(q)) return renderSetLogicAnswers(q, record);
  return q.fields.map(field => field.type === 'number'
    ? `<label class="inquiry-number-field"><span>${esc(field.label)}</span><span class="inquiry-number-input"><input class="field" type="text" data-role="activity-answer" data-field="${field.key}" value="${esc(record.responses?.[field.key] ?? '')}" autocomplete="off" spellcheck="false" placeholder="값 또는 분수 (예: 1/3)" aria-label="${esc(field.label)}"/>${field.unit ? `<b>${esc(field.unit)}</b>` : ''}</span></label>`
    : `<fieldset class="inquiry-choice-field"><legend>${esc(field.label)}</legend><div class="inquiry-choices">${field.options.map(option => `<button type="button" class="inquiry-choice ${record.responses?.[field.key] === option.value ? 'selected' : ''}" data-action="inquiry-choice" data-field="${field.key}" data-value="${esc(option.value)}" aria-pressed="${record.responses?.[field.key] === option.value}">${option.tex ? m(option.tex) : esc(option.label)}</button>`).join('')}</div></fieldset>`
  ).join('');
}
export function refreshLab(q, record) {
  if (isSetLogic(q)) return refreshSetLogicLab(q, record);
  const stage = document.getElementById('activity-lab-stage'), readout = document.getElementById('activity-lab-readout'), lab = labState(q, record);
  if (stage) stage.innerHTML = renderLabStage(q, record);
  if (readout) readout.innerHTML = renderLabReadout(q, record);
  for (const output of document.querySelectorAll('[data-lab-output]')) {
    const key = output.dataset.labOutput, units = { wave: ' m', temperature: ' ℃', currency: ' MAD', fuel: ' 분', lens: ' m' };
    output.textContent = n(lab[key]) + (key === 'x' && q.widget.type === 'context' ? units[q.widget.scenario] : '');
  }
  for (const control of document.querySelectorAll('[data-role="activity-parameter"],[data-role="activity-exact"]')) {
    if (control !== document.activeElement) control.value = Number(lab[control.dataset.param].toFixed(6));
  }
}
