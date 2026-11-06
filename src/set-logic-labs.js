import { escapeHTML as esc, math } from './ui.js';
import { range, unique, sameSet, subsetOf, membership, regionName, expressionRegions, calculateSet, maskElements, implies } from './set-logic-math.js';

const fmt = n => Number.isFinite(Number(n)) ? Number(Number(n).toFixed(3)).toLocaleString('ko-KR') : '정의되지 않음';
const setText = values => values.length ? `{${unique(values).join(', ')}}` : '∅';
const button = (label, action, attrs = '', active = false) => `<button type="button" class="sl-button ${active ? 'selected' : ''}" data-action="inquiry-sl-${action}" ${attrs} aria-pressed="${active}">${label}</button>`;
const state = (q, record) => ({ ...q.widget.defaults, ...record.lab });
const metric = (label, value, good = false) => `<div class="sl-metric ${good ? 'positive' : ''}"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`;
const boolean = value => value ? '참' : '거짓';
const geometry = count => count === 1 ? [[300, 190, 132]] : count === 3 ? [[250, 150, 119], [350, 150, 119], [300, 240, 119]] : [[240, 190, 132], [360, 190, 132]];
const anchors = count => count === 1 ? [[80, 90], [300, 190]] : count === 3 ? [[65, 80], [180, 120], [420, 120], [300, 90], [300, 320], [220, 232], [380, 232], [300, 196]] : [[70, 80], [180, 190], [420, 190], [300, 190]];
export function vennDiagram({ count = 2, selected = [], labels = ['A', 'B', 'C'], counts = null, interactive = false, suffix = '' } = {}) {
  const circles = geometry(count), id = 'sl-venn-' + suffix;
  let defs = circles.map(([x, y, r], i) => `<clipPath id="${id}-clip${i}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath>`).join(''), regions = '';
  for (let mask = 0; mask < 1 << count; mask++) {
    const exclude = circles.map(([x, y, r], i) => mask & 1 << i ? '' : `<circle cx="${x}" cy="${y}" r="${r}" fill="black"/>`).join('');
    defs += `<mask id="${id}-mask${mask}"><rect width="600" height="380" fill="white"/>${exclude}</mask>`;
    let region = `<rect x="20" y="20" width="560" height="340" fill="${selected.includes(mask) ? '#86cfb4' : '#f6faf4'}" mask="url(#${id}-mask${mask})"/>`;
    circles.forEach((_, i) => { if (mask & 1 << i) region = `<g clip-path="url(#${id}-clip${i})">${region}</g>`; });
    regions += region;
  }
  return `<svg class="sl-venn" viewBox="0 0 600 380" ${interactive ? 'data-sl-venn' : ''} data-count="${count}" role="img" aria-label="전체집합 U 안의 ${count}개 집합. 아래 영역 버튼으로도 선택할 수 있습니다."><defs>${defs}</defs><rect x="20" y="20" width="560" height="340" rx="10" fill="#f6faf4"/>${regions}<rect x="20" y="20" width="560" height="340" rx="10" fill="none" stroke="#b7cbbb" stroke-width="2"/>${circles.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${['#5c9e88', '#9676b2', '#ba9762'][i]}" stroke-width="2.5"/><text x="${x + (i === 0 && count > 1 ? -45 : i === 1 ? 45 : 0)}" y="${y - r + 23}" text-anchor="middle" font-size="20" fill="#405d4b">${esc(labels[i])}</text>`).join('')}<text x="36" y="47" font-size="19" fill="#59725b">U</text>${counts ? anchors(count).map(([x, y], mask) => `<text x="${x}" y="${y}" font-size="18" fill="#355d48" text-anchor="middle">${esc(counts[mask] ?? '')}</text>`).join('') : ''}</svg>`;
}
function regionButtons(count, selected, action = 'region') {
  return `<div class="sl-region-buttons">${range(0, (1 << count) - 1).map(mask => button(`<b>${mask === 0 ? '바깥' : 'ABC'.split('').slice(0, count).filter((_, i) => mask & 1 << i).join('∩')}</b><span>${esc(regionName(mask, count))}</span>`, action, `data-mask="${mask}"`, selected.includes(mask))).join('')}</div>`;
}
function regionLists(universe, sets, count, labels = ['A', 'B', 'C'], placements = null) {
  return `<div class="sl-region-lists">${range(0, (1 << count) - 1).map(mask => {
    const values = unique(universe).filter(value => placements ? placements[value] === mask : membership(value, sets, ['A', 'B', 'C'].slice(0, count)) === mask);
    return `<div><b>${mask === 0 ? '전체집합 안 · 모든 원의 바깥' : labels.slice(0, count).map((label, i) => mask & 1 << i ? label : `${label} 제외`).join(' · ')}</b><span>${esc(setText(values))}</span></div>`;
  }).join('')}</div>`;
}
function boardStage(q, lab) {
  const w = q.widget, count = w.count || 2, sets = typeof w.sets === 'function' ? w.sets(lab) : w.sets, U = unique(w.universe || Object.values(sets).flat());
  const labels = [w.labelA || 'A', w.labelB || 'B', 'C'];
  const expr = ({ union: ['union', 'A', 'B'], intersect: ['intersect', 'A', 'B'], diff: ['diff', 'A', 'B'], reverse: ['diff', 'B', 'A'], complement: ['not', 'A'], none: 'empty' })[lab.operation || 'none'];
  const counts = range(0, (1 << count) - 1).map(mask => `${U.filter(value => membership(value, sets) === mask).length}개`);
  return `<div class="sl-operation-bar">${[['none', '원소 배치'], ['union', `${labels[0]}∪${labels[1]}`], ['intersect', `${labels[0]}∩${labels[1]}`], ['diff', `${labels[0]}−${labels[1]}`], ['reverse', `${labels[1]}−${labels[0]}`], ['complement', `${labels[0]}ᶜ`]].map(([value, label]) => button(esc(label), 'operation', `data-value="${value}"`, lab.operation === value)).join('')}</div>${vennDiagram({ count, selected: expressionRegions(expr, count), labels, counts })}${regionLists(U, sets, count, labels)}<div class="sl-current-set">${esc(lab.operation === 'none' ? '전체집합 U' : '지금 선택한 연산 결과')} <strong>${esc(setText(lab.operation === 'none' ? U : calculateSet(expr, U, sets)))}</strong></div>`;
}
function probeStage(q, lab) {
  const w = q.widget, min = w.min ?? -6, max = w.max ?? 6, px = x => 40 + (x - min) / (max - min) * 520;
  const rows = [[w.pLabel, w.p], ...(w.q ? [[w.qLabel, w.q]] : [])];
  let svg = '';
  rows.forEach(([label, fn], row) => {
    const y = 55 + row * 92;
    svg += `<text x="40" y="${y - 20}" font-size="17" fill="#41694f">${esc(label)}</text><line x1="40" y1="${y + 10}" x2="560" y2="${y + 10}" stroke="#dce7dd" stroke-width="12"/>`;
    for (let i = 0; i < 105; i++) { const x = min + i / 104 * (max - min); if (fn(x, lab)) svg += `<circle cx="${px(x)}" cy="${y + 10}" r="3" fill="#409c76"/>`; }
    // Exact slider steps also mark isolated solutions; sampling alone can miss x=2.
    for (let i = 0; i <= Math.round((max - min) / (w.step || .25)); i++) {
      const x = min + i * (w.step || .25);
      if (fn(x, lab)) svg += `<circle cx="${px(x)}" cy="${y + 10}" r="4" fill="#409c76"/>`;
    }
    for (let x = Math.ceil(min); x <= max; x++) svg += `<line x1="${px(x)}" x2="${px(x)}" y1="${y + 4}" y2="${y + 16}" stroke="#88a58f"/>${x % 2 === 0 ? `<text x="${px(x)}" y="${y + 37}" text-anchor="middle" font-size="14" fill="#57755b">${x}</text>` : ''}`;
    svg += `<circle cx="${px(lab.x)}" cy="${y + 10}" r="9" fill="${fn(Number(lab.x), lab) ? '#16765b' : '#ba6954'}" stroke="white" stroke-width="2"/>`;
  });
  const universe = w.universe || [];
  return `<svg class="sl-probe-svg" viewBox="0 0 600 ${rows.length * 92 + 35}" role="img" aria-label="조건이 참인 구간은 초록색, 움직이는 점은 현재 입력"><rect width="600" height="${rows.length * 92 + 35}" rx="12" fill="#f7faf4"/>${svg}</svg>${universe.length ? `<div class="sl-token-row">${universe.map(x => button(esc(x), 'value', `data-key="x" data-value="${x}"`, Number(lab.x) === x)).join('')}</div><div class="sl-current-set">현재 조건의 진리집합 <strong>${esc(setText(universe.filter(x => w.p(x, lab))))}</strong></div>` : ''}<p class="sl-exploration-note">눈금과 슬라이더는 구체적인 예를 탐색하는 도구예요. 실수 전체에서 참이라는 결론에는 식·정의에 근거한 설명이 필요해요.</p>`;
}
function subsetStage(q, lab) {
  const w = q.widget, selected = lab.selected || [], mask = selected.reduce((n, i) => n | 1 << i, 0), found = lab.found || [];
  return `<div class="sl-subset-station"><span class="sl-kicker">각 원소의 포함 스위치</span><div class="sl-token-row">${w.elements.map((value, i) => button(`${selected.includes(i) ? '○' : '×'} ${esc(value)}`, 'subset-toggle', `data-index="${i}"`, selected.includes(i))).join('')}</div><div class="sl-subset-preview"><small>지금 만든 집합</small><strong>${esc(setText(maskElements(w.elements, mask)))}</strong>${button('목록에 담기 ＋', 'subset-add')}</div><p class="sl-inline-message" role="status">${esc(lab.message || (w.proper ? '진부분집합에서는 집합 자기 자신을 제외해요.' : '공집합도 하나의 부분집합이에요.'))}</p></div><div class="sl-collected-heading"><b>내가 찾은 ${w.proper ? '진부분집합' : '부분집합'}</b><span>${found.length}개</span></div><div class="sl-subset-collection">${found.length ? [...found].sort((a, b) => a - b).map(value => `<span>${esc(setText(maskElements(w.elements, value)))}</span>`).join('') : '<p>스위치로 집합을 만들고 목록에 담아 보세요.</p>'}</div>`;
}
function proofStage(q, lab) {
  const order = lab.order || [], steps = q.widget.steps;
  const shuffled = steps.map((_, i) => i).slice(1).reverse().concat(0);
  return `<div class="sl-proof-prompt"><b>아래 증명 카드를 이어서 논리를 완성해요.</b><span>조건을 유지하는 변형인지, 결론으로 이어지는지 확인해요.</span></div><div class="sl-proof-chain">${order.map((index, i) => `<article><i>${i + 1}</i><span>${esc(steps[index])}</span></article>`).join('') || '<div class="sl-empty-slot">첫 번째 근거 카드를 골라 놓아요.</div>'}</div>${order.length ? button('마지막 카드 되돌리기 ↶', 'proof-undo') : ''}<div class="sl-proof-bank">${shuffled.map(index => `<button type="button" data-action="inquiry-sl-proof-add" data-index="${index}" ${order.includes(index) ? 'disabled' : ''}>${esc(steps[index])}</button>`).join('')}</div>`;
}
function transformStage(q, lab) {
  const w = q.widget, terms = lab.swap ? [w.qLabel, w.pLabel] : [w.pLabel, w.qLabel];
  return `<div class="sl-logic-machine"><div class="sl-logic-term">${lab.negate ? '<small>부정</small>' : ''}${esc(terms[0])}${lab.negate ? '가 아니다' : ''}</div><span>⇒</span><div class="sl-logic-term">${lab.negate ? '<small>부정</small>' : ''}${esc(terms[1])}${lab.negate ? '가 아니다' : ''}</div></div><div class="sl-operation-bar">${button('가정·결론 순서 바꾸기 ⇄', 'toggle', 'data-key="swap"', lab.swap)}${button('두 조건을 모두 부정 ¬', 'toggle', 'data-key="negate"', lab.negate)}</div><p class="sl-transform-label">현재: <strong>${lab.swap ? lab.negate ? '대우' : '역' : lab.negate ? '이 (원래 명제와 동치라고 할 수 없음)' : '원래 명제'}</strong></p>`;
}
export function inequalityValues(scenario, l) {
  const a = Number(l.a ?? 1), b = Number(l.b ?? 1), x = Number(l.x ?? 0), y = Number(l.y ?? 0), c = Number(l.c ?? 1);
  switch (scenario) {
    case 'squares': return [a * a + 5 * b * b, 4 * a * b];
    case 'amgm': case 'semicircle': return [(a + b) / 2, Math.sqrt(a * b)];
    case 'triangle': return [Math.abs(a) + Math.abs(b), Math.abs(a + b)];
    case 'reciprocal': return [b / a + a / b, 2];
    case 'four': return [4 * a + 1 / a, 4];
    case 'minimum': return [(a + b) * (1 / a + 9 / b), 16];
    case 'area': return [(a + b) ** 2, 4 * a * b];
    case 'multiply': return [a * c, b * c];
    case 'quadratic-a': return [x * x + 4 * x + a, 0];
    case 'quadratic': return [x * x + 6 * x + 10, 1];
    case 'cauchy': return [(a * a + b * b) * (x * x + y * y), (a * x + b * y) ** 2];
    case 'statements': return [x * x, y * y];
    default: return [0, 0];
  }
}
function inequalityStage(q, lab) {
  const w = q.widget, [left, right] = inequalityValues(w.scenario, lab), a = lab.a, b = lab.b;
  if (w.scenario === 'semicircle') {
    const split = 60 + 480 * a / (a + b), height = 480 * Math.sqrt(a * b) / (a + b);
    return `<svg class="sl-geometry" viewBox="0 0 600 320" role="img" aria-label="AB를 a,b로 나눈 반원. 반지름과 수선의 길이를 비교합니다."><path d="M60 265A240 240 0 0 1 540 265Z" fill="#e7f3e7" stroke="#86a889" stroke-width="2"/><path d="M300 265V25" stroke="#9073b4" stroke-width="4"/><path d="M${split} 265V${265 - height}" stroke="#218563" stroke-width="4"/><path d="M60 265L${split} ${265 - height}L540 265" stroke="#8cb8a5" stroke-width="2" fill="none"/><circle cx="${split}" cy="${265 - height}" r="6" fill="#218563"/><g font-size="17" fill="#3d614c"><text x="48" y="289">A</text><text x="540" y="289">B</text><text x="290" y="289">O</text><text x="${split + 8}" y="289">E</text><text x="${split + 10}" y="${252 - height}">D</text><text x="310" y="38">C</text><text x="${(60 + split) / 2}" y="312">a=${fmt(a)}</text><text x="${(540 + split) / 2}" y="312">b=${fmt(b)}</text></g></svg>`;
  }
  if (w.scenario === 'area') {
    const m = Math.min(a, b) / (a + b) * 300, M = 300 - m;
    return `<svg class="sl-geometry" viewBox="0 0 600 360" role="img" aria-label="큰 정사각형 안 네 직사각형과 남는 정사각형의 넓이"><g transform="translate(150 25)"><rect width="300" height="300" fill="#f1f6ea" stroke="#829e7c" stroke-width="2"/><rect width="${M}" height="${m}" fill="#a9d2b6"/><rect x="${M}" width="${m}" height="${M}" fill="#bbaed8"/><rect x="${m}" y="${M}" width="${M}" height="${m}" fill="#b8d7e6"/><rect y="${m}" width="${m}" height="${M}" fill="#e6c9a0"/><rect x="${m}" y="${m}" width="${M - m}" height="${M - m}" fill="#fff4c9" stroke="#c5b16b"/><text x="150" y="155" text-anchor="middle" fill="#6f714a" font-size="17">(a−b)²</text></g><text x="300" y="350" text-anchor="middle" fill="#4b7355" font-size="17">큰 정사각형 = (a+b)²</text></svg>`;
  }
  const max = Math.max(Math.abs(left), Math.abs(right), 1);
  return `<div class="sl-value-comparison"><div><span>왼쪽 값</span><b>${fmt(left)}</b><i style="width:${Math.min(100, Math.abs(left) / max * 100)}%"></i></div><strong>${Math.abs(left - right) < 1e-8 ? '=' : left > right ? '>' : '<'}</strong><div><span>오른쪽 값</span><b>${fmt(right)}</b><i style="width:${Math.min(100, Math.abs(right) / max * 100)}%"></i></div></div><div class="sl-difference">왼쪽 − 오른쪽 = <b>${fmt(left - right)}</b></div><p class="sl-exploration-note">바의 길이는 절댓값이며, 비교는 위의 수치와 부호를 기준으로 해요. 여러 예의 확인과 모든 경우의 증명을 구분해요.</p>`;
}
export function detectiveStatements(scenario, selected) {
  const [A, B, C, D] = ['A', 'B', 'C', 'D'].map(name => selected.includes(name));
  return scenario === 'president' ? [!A, C, D, !D] : [true, implies(B, A), implies(!C, !A), implies(!B, !D)];
}
function detectiveStage(q, lab) {
  const w = q.widget, selected = lab.suspects || [], statements = detectiveStatements(w.scenario, selected);
  const labels = w.scenario === 'president' ? ['A: 나는 회장이 아니에요.', 'B: C가 회장이에요.', 'C: D가 회장입니다.', 'D: C의 주장은 거짓입니다.'] : [`A: 범인은 ${w.count}명이에요.`, 'B: 내가 범인이라면 A도 범인입니다.', 'C: 내가 범인이 아니라면 A도 범인이 아니에요.', 'D: B가 범인이 아니라면 나도 범인이 아닙니다.'];
  if (w.scenario === 'museum') statements[0] = selected.length === w.count;
  return `<div class="sl-suspects">${['A', 'B', 'C', 'D'].map(name => button(`<span class="sl-person">${name}</span><b>${selected.includes(name) ? w.scenario === 'president' ? '회장으로 선택' : '범인으로 선택' : '선택하기'}</b>`, 'suspect', `data-value="${name}"`, selected.includes(name))).join('')}</div><div class="sl-testimonies">${labels.map((label, i) => `<div class="${statements[i] ? 'is-true' : 'is-false'}"><span>${esc(label)}</span><b>${boolean(statements[i])}</b></div>`).join('')}</div><p class="sl-exploration-note">${w.scenario === 'president' ? '회장은 한 명, 참인 진술도 정확히 한 개여야 해요.' : '범인 수와 네 증언이 모두 동시에 참이어야 해요. 가정이 거짓인 “이면” 명제는 참이라는 점도 확인해요.'}</p>`;
}
function truthStage(q, lab) {
  const w = q.widget, vars = ['p', 'q', ...('r' in w.defaults ? ['r'] : [])];
  return `<div class="sl-operation-bar">${vars.map(key => button(`${key}: ${boolean(lab[key])}`, 'toggle', `data-key="${key}"`, lab[key])).join('')}</div><div class="sl-table-scroll"><table class="sl-truth-table"><thead><tr>${vars.map(key => `<th>${key}</th>`).join('')}<th>전제</th>${w.labels.map(label => `<th>${esc(label)}</th>`).join('')}</tr></thead><tbody>${range(0, (1 << vars.length) - 1).map(mask => {
    const row = Object.fromEntries(vars.map((key, i) => [key, Boolean(mask & 1 << i)])), valid = w.premises(row), current = vars.every(key => Boolean(lab[key]) === row[key]);
    return `<tr class="${valid ? 'valid-row' : 'invalid-row'} ${current ? 'current-row' : ''}">${vars.map(key => `<td>${row[key] ? 'T' : 'F'}</td>`).join('')}<td>${valid ? '만족' : '제외'}</td>${w.statements.map(fn => `<td>${fn(row) ? 'T' : 'F'}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table></div><p class="sl-exploration-note">전제가 참인 행을 빠짐없이 확인해요. 그 행들에서 모두 T인 명제만 항상 참이에요.</p>`;
}
function setConditions(q, lab, onlySets = false) {
  const A = maskElements([1, 2, 3], lab.A), B = maskElements([1, 2, 3], lab.B), p = subsetOf(A, B), qValue = q.widget.scenario === 'equal-subset' ? subsetOf(A, B) : sameSet(A, B);
  return `<div class="sl-two-sets">${['A', 'B'].map(name => `<div><b>${name}=${esc(setText(name === 'A' ? A : B))}</b><div class="sl-token-row">${[1, 2, 3].map((value, i) => button(esc(value), 'mask-toggle', `data-key="${name}" data-index="${i}"`, Boolean(lab[name] & 1 << i))).join('')}</div></div>`).join('')}</div>${onlySets ? '' : `<div class="sl-metrics">${metric('조건 p', boolean(p), p)}${metric('조건 q', boolean(qValue), qValue)}</div>`}`;
}
function enumerationStage(q, lab) {
  const A = maskElements([1, 2, 3], lab.A), B = maskElements([1, 2, 3], lab.B), all = A.length > 0 && A.every(x => x * x - 3 * x < 0), some = B.some(x => A.includes(x));
  return `${setConditions({ widget: { scenario: 'subset-equality' } }, lab, true)}<div class="sl-metrics">${metric('A의 모든 x: x²−3x<0', boolean(all), all)}${metric('B의 어떤 x가 A에 속함', boolean(some), some)}</div>${button('이 순서쌍을 기록하기 ＋', 'pair-add')}<p class="sl-inline-message">${esc(lab.message || '')}</p><div class="sl-pair-collection"><b>발견한 순서쌍 ${(lab.found || []).length}개</b>${(lab.found || []).map(pair => { const [a, b] = pair.split(',').map(Number); return `<span>(${esc(setText(maskElements([1, 2, 3], a)))}, ${esc(setText(maskElements([1, 2, 3], b)))})</span>`; }).join('')}</div>`;
}
function stage(q, record) {
  const w = q.widget, lab = state(q, record);
  if (w.type === 'sl-board') return boardStage(q, lab);
  if (w.type === 'sl-probe') return probeStage(q, lab);
  if (w.type === 'sl-subset') return subsetStage(q, lab);
  if (w.type === 'sl-proof') return proofStage(q, lab);
  if (w.type === 'sl-transform') return transformStage(q, lab);
  if (w.type === 'sl-inequality') return inequalityStage(q, lab);
  if (w.type === 'sl-detective') return detectiveStage(q, lab);
  if (w.type === 'sl-truth') return truthStage(q, lab);
  if (w.type === 'sl-setconditions') return setConditions(q, lab);
  if (w.type === 'sl-enumerate') return enumerationStage(q, lab);
  if (w.type === 'sl-venn') return `<div class="sl-venn-comparison"><div>${vennDiagram({ count: w.count, selected: lab.regions || [], interactive: true, suffix: 'student' })}<p>내가 색칠한 영역</p></div>${lab.compare && w.equivalent ? `<div>${vennDiagram({ count: w.count, selected: expressionRegions(w.equivalent, w.count), suffix: 'comparison' })}<p>오른쪽 식의 영역</p></div>` : ''}</div>${regionButtons(w.count, lab.regions || [])}<div class="sl-operation-bar">${button('빈 영역으로 확인 (∅)', 'empty-regions', '', lab.emptyConfirmed)}${w.equivalent ? button(lab.compare ? '비교 영역 접기' : '오른쪽 식과 비교', 'toggle', 'data-key="compare"', lab.compare) : ''}</div>`;
  if (w.type === 'sl-place') {
    const count = w.count || 2, placements = lab.placements || {}, labels = [w.labelA || 'A', w.labelB || 'B'];
    const counts = range(0, (1 << count) - 1).map(mask => `${unique(w.universe).filter(value => placements[value] === mask).length}개`);
    return `<p class="sl-exploration-note">① 원소 카드 선택 → ② 놓을 영역 선택. 다이어그램을 직접 누르거나 아래 영역 버튼을 사용해요.</p><div class="sl-token-row">${unique(w.universe).map(value => button(esc(value) + (Object.hasOwn(placements, value) ? ' ✓' : ''), 'active-element', `data-value="${esc(value)}"`, lab.active === value)).join('')}</div>${vennDiagram({ count, labels, counts, interactive: true })}${regionButtons(count, [], 'place')}${regionLists(w.universe, w.sets, count, labels, placements)}<p class="sl-inline-message">${esc(lab.message || (lab.active ? `${lab.active}을 놓을 영역을 선택해요.` : '먼저 원소 카드를 골라요.'))}</p>`;
  }
  if (w.type === 'sl-parameters') {
    const sets = w.sets(lab), A = unique(sets.A), B = unique(sets.B);
    return `<div class="sl-two-sets"><div><span>A</span><strong>${esc(setText(A))}</strong></div><div><span>B</span><strong>${esc(setText(B))}</strong></div></div>${vennDiagram({ counts: range(0, 3).map(mask => unique([...A, ...B]).filter(v => membership(v, sets) === mask).length + '개') })}<div class="sl-metrics">${metric('A∩B', setText(A.filter(x => B.includes(x))))}${metric('A=B인가요?', boolean(sameSet(A, B)), sameSet(A, B))}</div>`;
  }
  if (w.type === 'sl-count') {
    const overlap = lab.overlap, counts = [w.U - w.A - w.B + overlap, w.A - overlap, w.B - overlap, overlap];
    return `${vennDiagram({ counts: counts.map(n => fmt(n) + '개'), selected: [3] })}<div class="sl-metrics">${metric('n(A∪B)', fmt(w.A + w.B - overlap))}${metric('n(U)', fmt(w.U))}${metric('공통 부분 n(A∩B)', fmt(overlap))}</div><p class="sl-exploration-note">A ${w.A}개, B ${w.B}개를 고정하고 공통 부분을 바꿔 보세요. 모든 영역의 개수는 0 이상이어야 해요.</p>`;
  }
  if (w.type === 'sl-distance') {
    const values = [3, 3.1, 3.14, 3.142, 22 / 7, 3.5];
    return `<div class="sl-distance-banner">π ≈ ${Math.PI.toFixed(6)}<span>가까움의 기준: 거리 &lt; ${fmt(lab.epsilon)}</span></div><div class="sl-metrics">${values.map(x => metric(fmt(x), Math.abs(x - Math.PI) < lab.epsilon ? '포함' : '제외', Math.abs(x - Math.PI) < lab.epsilon)).join('')}</div><p class="sl-exploration-note">표시된 유한소수와 22/7은 모두 유리수예요. 허용 거리를 정하면 같은 기준으로 포함 여부를 판단할 수 있어요.</p>`;
  }
  return `<div class="sl-thought-cards">${(w.cards || []).map((text, i) => button(`<small>생각 카드 ${i + 1}</small><span>${esc(text)}</span>`, 'thought', `data-index="${i}"`, (lab.thoughts || []).includes(i))).join('')}</div><p class="sl-exploration-note">생각의 근거가 되는 카드를 눌러 표시하고, 아래에서 나의 판단을 확인해요.</p>`;
}
function control(key, label, value, min, max, step) {
  return `<label class="sl-control"><span>${esc(label)}<output data-sl-output="${key}">${fmt(value)}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-role="activity-parameter" data-param="${key}" aria-label="${esc(label)}"/><span class="sl-exact">직접 입력<input class="field" type="text" value="${value}" data-role="activity-exact" data-param="${key}" data-min="${min}" data-max="${max}" aria-label="${esc(label)} 정확한 값"/></span></label>`;
}
function controls(q, record) {
  const w = q.widget, lab = state(q, record);
  if (w.type === 'sl-probe') return control('x', '실험할 입력 x', lab.x, w.min ?? -6, w.max ?? 6, w.step ?? .25) + (w.parameters || []).map(key => control(key, '상수 ' + key, lab[key], -6, 8, .25)).join('');
  if (w.type === 'sl-distance') return control('epsilon', '가까움의 허용 거리 ε', lab.epsilon, .01, 1, .01);
  if (w.type === 'sl-parameters') return ['a', 'b'].map(key => control(key, '상수 ' + key, lab[key], -5, 8, .5)).join('');
  if (w.type === 'sl-count') return control('overlap', '공통으로 속하는 개수', lab.overlap, Math.max(0, w.A + w.B - w.U), Math.min(w.A, w.B), 1);
  if (w.type === 'sl-inequality') return Object.keys(w.defaults).map(key => control(key, '바꾸어 볼 수 ' + key, lab[key], w.positive ? .25 : -6, 8, .25)).join('');
  return '';
}
function readout(q, record) {
  const w = q.widget, lab = state(q, record);
  if (w.type === 'sl-probe') {
    const p = w.p(Number(lab.x), lab), qValue = w.q?.(Number(lab.x), lab);
    return `<div class="sl-metrics">${metric(`x=${fmt(lab.x)}에서 p`, boolean(p), p)}${w.q ? metric('같은 x에서 q', boolean(qValue), qValue) + metric('p→q', boolean(implies(p, qValue)), implies(p, qValue)) : ''}</div>${w.q && p && !qValue ? '<p class="sl-counterexample">반례 발견! 가정은 참인데 결론은 거짓이에요.</p>' : ''}`;
  }
  if (w.type === 'sl-inequality') { const [left, right] = inequalityValues(w.scenario, lab); return `<div class="sl-metrics">${metric('왼쪽', fmt(left))}${metric('오른쪽', fmt(right))}${metric('차', fmt(left - right), left >= right)}</div>`; }
  return '';
}
export function renderSetLogicLab(q, record) {
  return `<section class="activity-lab sl-lab" aria-labelledby="lab-heading"><div class="activity-section-title"><span>01</span><div><h3 id="lab-heading">직접 움직이며 발견하기</h3><p>선택·배치·색칠·실험으로 조건을 확인하고, 근거를 만들어 보세요.</p></div></div><div id="activity-lab-stage">${stage(q, record)}</div><div class="sl-controls">${controls(q, record)}</div><div id="activity-lab-readout" aria-live="polite">${readout(q, record)}</div></section>`;
}
export function refreshSetLogicLab(q, record) {
  const visual = document.getElementById('activity-lab-stage'), metrics = document.getElementById('activity-lab-readout'), lab = state(q, record);
  if (visual) visual.innerHTML = stage(q, record);
  if (metrics) metrics.innerHTML = readout(q, record);
  document.querySelectorAll('[data-sl-output]').forEach(el => { el.textContent = fmt(lab[el.dataset.slOutput]); });
  document.querySelectorAll('[data-role="activity-parameter"],[data-role="activity-exact"]').forEach(el => { if (el !== document.activeElement) el.value = lab[el.dataset.param]; });
}
export function renderSetLogicAnswers(q, record) {
  return q.fields.map(field => {
    const answer = record.responses?.[field.key];
    if (field.type === 'set' || field.type === 'multi') {
      const options = field.type === 'set' ? field.options.map(value => ({ value, label: value })) : field.options;
      return `<fieldset class="inquiry-choice-field sl-answer-group"><legend>${esc(field.label)} <small>해당하는 것을 모두 선택</small></legend><div class="inquiry-choices">${options.map(option => button(option.tex ? math(option.tex) : esc(option.label), 'answer', `data-field="${field.key}" data-value="${esc(option.value)}"`, Array.isArray(answer) && answer.includes(option.value))).join('')}${field.type === 'set' ? button('∅ 공집합', 'empty-answer', `data-field="${field.key}"`, Array.isArray(answer) && answer.length === 0) : ''}</div></fieldset>`;
    }
    if (field.type === 'text') return `<label class="field-label sl-writing">${esc(field.label)}<textarea class="field" rows="3" data-role="activity-answer" data-field="${field.key}" aria-label="${esc(field.label)}">${esc(answer || '')}</textarea><small>자유 서술의 수학적 타당성은 자동 채점하지 않고 교사가 확인해요.</small></label>`;
    if (field.type === 'number' || field.type === 'witness') return `<label class="inquiry-number-field"><span>${esc(field.label)}</span><input class="field" type="text" data-role="activity-answer" data-field="${field.key}" value="${esc(answer ?? '')}" aria-label="${esc(field.label)}" placeholder="수 또는 분수 (예: −3/2)" autocomplete="off"/></label>`;
    return `<fieldset class="inquiry-choice-field"><legend>${esc(field.label)}</legend><div class="inquiry-choices">${field.options.map(option => `<button type="button" class="inquiry-choice ${answer === option.value ? 'selected' : ''}" data-action="inquiry-choice" data-field="${field.key}" data-value="${esc(option.value)}" aria-pressed="${answer === option.value}">${option.tex ? math(option.tex) : esc(option.label)}</button>`).join('')}</div></fieldset>`;
  }).join('');
}
function placeElement(q, lab, mask) {
  if (lab.active === null || lab.active === undefined) { lab.message = '먼저 놓을 원소 카드를 선택해요.'; return; }
  lab.placements = { ...lab.placements, [lab.active]: mask }; lab.message = `${lab.active}을 배치했어요. 다른 카드도 확인해요.`; lab.active = null;
}
export function handleSetLogicAction(action, element, q, record) {
  if (!action.startsWith('inquiry-sl-')) return false;
  const name = action.slice('inquiry-sl-'.length), lab = state(q, record), w = q.widget;
  record.lab = lab;
  if (name === 'answer') {
    const key = element.dataset.field, value = element.dataset.value, values = record.responses?.[key] || [];
    record.responses = { ...record.responses, [key]: values.includes(value) ? values.filter(v => v !== value) : [...values, value] };
  }
  if (name === 'empty-answer') record.responses = { ...record.responses, [element.dataset.field]: [] };
  if (name === 'region') { const mask = Number(element.dataset.mask); lab.regions = (lab.regions || []).includes(mask) ? lab.regions.filter(v => v !== mask) : [...lab.regions || [], mask]; lab.emptyConfirmed = false; }
  if (name === 'empty-regions') { lab.regions = []; lab.emptyConfirmed = true; }
  if (name === 'operation') lab.operation = element.dataset.value;
  if (name === 'value') lab[element.dataset.key] = Number(element.dataset.value);
  if (name === 'toggle') lab[element.dataset.key] = !lab[element.dataset.key];
  if (name === 'active-element') { lab.active = element.dataset.value; lab.message = ''; }
  if (name === 'place') placeElement(q, lab, Number(element.dataset.mask));
  if (name === 'subset-toggle') { const i = Number(element.dataset.index); lab.selected = (lab.selected || []).includes(i) ? lab.selected.filter(v => v !== i) : [...lab.selected || [], i]; lab.message = ''; }
  if (name === 'subset-add') {
    const mask = (lab.selected || []).reduce((n, i) => n | 1 << i, 0);
    if (w.proper && mask === (1 << w.elements.length) - 1) lab.message = '자기 자신은 진부분집합이 아니에요. 원소를 적어도 하나 제외해요.';
    else if ((lab.found || []).includes(mask)) lab.message = '이미 목록에 있는 집합이에요. 순서를 바꾸어도 같은 집합이에요.';
    else { lab.found = [...lab.found || [], mask]; lab.message = '새로운 집합을 모았어요! 다른 조합도 찾아봐요.'; }
  }
  if (name === 'proof-add') { const i = Number(element.dataset.index); if (!(lab.order || []).includes(i)) lab.order = [...lab.order || [], i]; }
  if (name === 'proof-undo') lab.order = (lab.order || []).slice(0, -1);
  if (name === 'suspect') { const value = element.dataset.value; lab.suspects = (lab.suspects || []).includes(value) ? lab.suspects.filter(v => v !== value) : [...lab.suspects || [], value]; }
  if (name === 'mask-toggle') lab[element.dataset.key] ^= 1 << Number(element.dataset.index);
  if (name === 'thought') { const i = Number(element.dataset.index); lab.thoughts = (lab.thoughts || []).includes(i) ? lab.thoughts.filter(v => v !== i) : [...lab.thoughts || [], i]; }
  if (name === 'pair-add') {
    const A = maskElements([1, 2, 3], lab.A), B = maskElements([1, 2, 3], lab.B), value = `${lab.A},${lab.B}`;
    if (!A.length || !B.length || A.some(x => x * x - 3 * x >= 0) || !B.some(x => A.includes(x))) lab.message = '공집합이 아닌지, 두 조건이 모두 참인지 확인해요.';
    else if ((lab.found || []).includes(value)) lab.message = '이미 기록한 순서쌍이에요.';
    else { lab.found = [...lab.found || [], value]; lab.message = '새로운 순서쌍을 기록했어요.'; }
  }
  record.trials = [...record.trials || [], { signature: `${name}:${element.dataset.value ?? element.dataset.index ?? element.dataset.mask ?? ''}`, key: name, value: element.dataset.value || '' }].slice(-80);
  return true;
}
export function handleSetLogicPointer(event, q, record) {
  const svg = event.target.closest('[data-sl-venn]'); if (!svg || !['sl-venn', 'sl-place'].includes(q.widget.type)) return false;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
  if (point.x < 20 || point.x > 580 || point.y < 20 || point.y > 360) return false;
  const count = q.widget.count || 2, lab = state(q, record);
  const mask = geometry(count).reduce((mask, [x, y, r], i) => mask | (Math.hypot(point.x - x, point.y - y) <= r ? 1 << i : 0), 0);
  if (q.widget.type === 'sl-place') placeElement(q, lab, mask);
  else { lab.regions = (lab.regions || []).includes(mask) ? lab.regions.filter(v => v !== mask) : [...lab.regions || [], mask]; lab.emptyConfirmed = false; }
  record.lab = lab; record.trials = [...record.trials || [], { signature: 'region:' + mask, key: 'region', value: mask }].slice(-80);
  event.preventDefault(); return true;
}
export function renderSetLogicEvidence(q, record) {
  if (!q.widget.type.startsWith('sl-') || !record.lab) return '';
  const w = q.widget, lab = state(q, record), lines = [];
  if (lab.placements) lines.push(...Object.entries(lab.placements).map(([value, mask]) => `${value} → ${regionName(mask, w.count || 2)}`));
  if (lab.regions) lines.push('색칠한 영역: ' + lab.regions.map(mask => regionName(mask, w.count || 2)).join(' / '));
  if (w.type === 'sl-subset') lines.push('찾은 부분집합: ' + (lab.found || []).map(mask => setText(maskElements(w.elements, mask))).join(', '));
  if (w.type === 'sl-proof') lines.push(...(lab.order || []).map((index, i) => `${i + 1}. ${w.steps[index]}`));
  if (lab.suspects) lines.push('선택한 사람: ' + lab.suspects.join(', '));
  return lines.length ? `<details class="sl-record-details"><summary>조작·추론 과정 보기</summary>${lines.map(line => `<p>${esc(line)}</p>`).join('')}</details>` : '';
}
