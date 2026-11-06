import { WORKBOOKS as SOURCE_WORKBOOKS } from './workbook-data.js';
import { ACTIVITY_SETS } from './activity-data.js';
import { escapeHTML as esc, icon, math, actionButton as button } from './ui.js';
import { renderLab, renderAnswerFields, refreshLab, graphCoordinate } from './activity-labs.js';
import { labState, labTargets, parseNumber, evaluateActivity, rememberTrial } from './activity-math.js';
import { SET_LOGIC_WORKBOOKS, SET_LOGIC_ACTIVITIES } from './set-logic-data.js';
import { isSetLogic } from './set-logic-math.js';
import { handleSetLogicAction, handleSetLogicPointer } from './set-logic-labs.js';
import { resolveWorkbookActivity } from './workbook-state.js';

export const WORKBOOKS = [...SOURCE_WORKBOOKS.map(book => ({ ...book, subject: 'function' })), ...SET_LOGIC_WORKBOOKS].map(workbook => ({ ...workbook, activities: ACTIVITY_SETS[workbook.id] || SET_LOGIC_ACTIVITIES[workbook.id] }));
export const getWorkbook = id => WORKBOOKS.find(workbook => workbook.id === id);
const assetRoot = `${import.meta.env.BASE_URL}worksheets/`;
export const workbookPDF = workbook => `${assetRoot}${workbook.id}.pdf`;
export const workbookProgress = (workbook, state) => workbook.activities.filter(q => state.answers?.[q.id]?.correct).length;
export const currentWorkbookActivity = resolveWorkbookActivity;
function activityMap(workbook, state, current) {
  const groups = [...new Set(workbook.activities.map(q => q.group))];
  return `<details class="activity-map"><summary>${icon('sheet')} 문항 지도 · ${workbook.activities.length}개의 탐구 <span>원하는 문제로 이동하기</span></summary>${groups.map(group => `<div class="activity-map-group"><h3>${esc(group)}</h3><div>${workbook.activities.filter(q => q.group === group).map(q => `<button type="button" data-action="inquiry-open" data-index="${q.number - 1}" class="activity-map-item ${q.id === current.id ? 'current' : ''} ${state.answers[q.id]?.correct ? 'solved' : ''}" ${q.id === current.id ? 'aria-current="step"' : ''}><span>${state.answers[q.id]?.correct ? '✓' : String(q.number).padStart(2, '0')}</span><b>${esc(q.title)}</b><small>${esc(q.source.split(' · PDF')[0])}</small></button>`).join('')}</div></div>`).join('')}</details>`;
}
function archivedNotes(workbook, state, q) {
  const record = state.answers[`${workbook.id}-p${String(q.sourcePage).padStart(2, '0')}`];
  if (!record || ![record.observation, record.explanation, record.mathDraft, record.drawing].some(Boolean)) return '';
  return `<details class="activity-archive"><summary>이전에 PDF ${q.sourcePage}쪽에 남긴 기록</summary><p>${esc(record.observation || '')}</p><p>${esc(record.explanation || '')}</p>${record.mathDraft ? math(record.mathDraft) : ''}${record.drawing ? `<img src="${esc(record.drawing)}" alt="이전에 남긴 풀이 필기"/>` : ''}</details>`;
}
export function renderWorkbook(workbook, state, space) {
  const q = currentWorkbookActivity(workbook, state), record = state.answers[q.id] || {}, completed = workbookProgress(workbook, state);
  return `${space.worksheetTools()}
    <div class="screen-heading inquiry-heading"><div><span class="eyeline">CHAPTER ${workbook.chapter} · 움직이며 발견하는 학습지</span><h2>${esc(workbook.title)}</h2><p class="subtext">한 문제씩 실험하고, 추측하고, 나의 답을 확인해요.</p></div><span class="tag" data-workbook-progress>해결 ${completed} / ${workbook.activities.length}문항</span></div>
    <div class="progress-track"><div class="progress-bar" data-inquiry-progress style="width:${completed / workbook.activities.length * 100}%"></div></div>
    ${activityMap(workbook, state, q)}
    <section class="panel inquiry-workbook"><div class="inquiry-question-heading"><span class="inquiry-number">${String(q.number).padStart(2, '0')}</span><div><div class="row"><span class="tag">${esc(q.group)}</span><span class="source-ref">${esc(q.source)}</span><span data-activity-status class="tag ${record.correct ? '' : 'gold'}">${record.correct ? '해결했어요' : record.reviewRequested ? '서술 확인 대기' : record.attempts ? '다시 탐구 중' : '새로운 도전'}</span></div><h2>${esc(q.title)}</h2><p>${esc(q.prompt)}</p></div></div><div class="inquiry-formula">${math(q.formula, true)}</div>
    <div class="inquiry-layout"><div class="inquiry-main">${renderLab(q, record)}
    <section class="inquiry-answer-section"><div class="activity-section-title"><span>02</span><div><h3>나의 발견으로 답 만들기</h3><p>${q.fields.length ? '실험에서 찾은 규칙을 적용해 완성해요. 분수는 1/3처럼 입력할 수 있어요.' : isSetLogic(q) ? '완성한 배치·영역·부분집합·증명 카드가 문제의 조건을 만족하는지 확인해요.' : '지금 만든 그래프와 수치가 위 문제의 조건을 만족하는지 확인해요.'}</p></div></div><div class="inquiry-answer-fields">${renderAnswerFields(q, record)}</div><div class="row">${button('내 발견 확인하기', 'inquiry-check', 'teal')}${button('실험 초기화', 'inquiry-reset', 'light')}</div><div class="activity-feedback ${record.checked ? record.reviewRequested ? 'review' : record.correct ? 'success' : 'retry' : ''}" role="status">${record.checked ? `<strong>${record.reviewRequested ? '✎ 자유 서술 확인 대기' : record.correct ? '✓ 발견했어요!' : '↻ 조금 더 살펴볼까요?'}</strong><p>${esc(record.feedback)}</p>` : ''}</div></section>
    <details class="inquiry-notes"><summary>${icon('note')} 나의 풀이·수식·펜 필기 남기기</summary><div><label class="field-label" for="observation">무엇을 바꾸고, 무엇을 발견했나요?</label><textarea class="field" id="observation" rows="3" data-role="note" data-field="observation" placeholder="처음에는 …라고 예상했는데, …를 움직여 보니 …였어요.">${esc(record.observation || '')}</textarea><div class="drawing-section"><div class="row space-between"><span class="eyeline">직접 계산하고 그래프 그리기</span>${button('지우기', 'clear-canvas', 'light xsmall')}</div><canvas class="drawing" width="960" height="480" data-drawing="${q.id}" aria-label="${esc(q.title)} 풀이 필기"></canvas></div><label class="field-label" for="explanation">내 답의 근거 또는 수정한 생각</label><textarea class="field" id="explanation" rows="3" data-role="note" data-field="explanation">${esc(record.explanation || '')}</textarea>${space.mathPad(record)}</div></details>${archivedNotes(workbook, state, q)}</div>
    <aside class="inquiry-guide"><div class="inquiry-guide-card"><span class="eyeline">생각을 여는 질문</span><h3>움직이기 전에 예측해요</h3><p>어떤 값이 나올까요?<br/>왜 그렇게 생각했나요?</p><h3>한 가지만 바꿔봐요</h3><p>바뀐 것과 그대로인 것을 찾아요. 다른 입력에서도 같은 규칙이 성립하나요?</p></div><div class="inquiry-guide-card"><h3>막힐 때 한 걸음씩</h3>${q.hints.slice(0, record.hintsViewed || 0).map((hint, i) => `<div class="inquiry-hint"><b>힌트 ${i + 1}</b><p>${esc(hint)}</p></div>`).join('')}${button(record.hintsViewed ? '다음 힌트' : '첫 힌트 열기', 'inquiry-hint', 'light small', record.hintsViewed >= q.hints.length ? 'disabled' : '')}</div><details class="inquiry-guide-card original-reference"><summary>원본 자료 참고</summary><p>제공해 주신 원본 학습지의 조건과 수식을 바탕으로 문항별 탐구를 구성했어요.</p><a href="${workbookPDF(workbook)}#page=${q.sourcePage}" target="_blank" rel="noopener">원본 PDF ${q.sourcePage}쪽 보기 ↗</a></details></aside></div>
    ${workbook.gameId ? `<div class="sl-linked-game"><span>지금 배운 개념을 게임에서 사용해 볼까요?</span><div class="row">${(workbook.gameLinks||[{id:workbook.gameId,label:'이 단원 게임 열기'}]).map(link=>button(icon('target')+' '+esc(link.label),'workbook-game','soft small',`data-game="${link.id}"`)).join('')}</div></div>` : ''}<div class="sticky-actions inquiry-navigation">${button('← 이전 탐구', 'inquiry-prev', 'light', q.number === 1 ? 'disabled' : '')}<span>${q.number} / ${workbook.activities.length} 탐구 · 자동 저장</span>${button(q.number === workbook.activities.length ? '학습지 목록으로 →' : '다음 탐구 →', 'inquiry-next', 'teal')}</div></section>`;
}
export function workbookSummary(state) {
  return `<section class="panel"><div class="section-row"><div><h3>문항별 체험 학습 기록</h3><p class="source-note">실험한 조건·답 확인·풀이와 필기를 함께 저장해요.</p></div></div><div class="result-list">${WORKBOOKS.map(workbook => `<div class="result-row"><div><b>${esc(workbook.title)}</b><br/><span class="source-note">해결 ${workbookProgress(workbook, state)} / ${workbook.activities.length}문항</span></div>${button('이어서 탐구', 'open-content', 'light small', `data-workbook="${workbook.id}"`)}</div>`).join('')}</div></section>`;
}

export function createWorkbookInteractions(api) {
  let dragging = null;
  const current = () => api.state.view === 'practice' && getWorkbook(api.state.workbookId) ? api.getQuestion() : null;
  const recordFor = q => api.state.answers[q.id] || (api.state.answers[q.id] = {});
  function updateStatus(q, record) {
    const workbook = getWorkbook(q.workbookId), solved = workbookProgress(workbook, api.state);
    const progress = document.querySelector('[data-workbook-progress]'), bar = document.querySelector('[data-inquiry-progress]'), status = document.querySelector('[data-activity-status]');
    if (progress) progress.textContent = '해결 ' + solved + ' / ' + workbook.activities.length + '문항';
    if (bar) bar.style.width = solved / workbook.activities.length * 100 + '%';
    if (status) { status.textContent = record.correct ? '해결했어요' : record.attempts ? '다시 탐구 중' : '새로운 도전'; status.classList.toggle('gold', !record.correct); }
    const feedback = document.querySelector('.activity-feedback');
    if (feedback && !record.checked) { feedback.innerHTML = ''; feedback.className = 'activity-feedback'; }
  }
  function invalidate(q, record) { record.correct = false; record.checked = false; record.reviewRequested = false; record.feedback = ''; updateStatus(q, record); }
  function setLab(q, key, value) {
    const record = recordFor(q);
    record.lab = labState(q, record);
    if (record.lab[key] === value) return;
    record.lab[key] = value;
    if (key === 'x' || key === 'input') record.lab.step = 0;
    rememberTrial(record, key, value);
    if (Object.hasOwn(labTargets(q), key) || key === 'placed' || isSetLogic(q)) invalidate(q, record);
    api.save(); refreshLab(q, record);
  }
  function navigate(index) {
    const workbook = getWorkbook(api.state.workbookId);
    api.state.workbookActivityIndices = api.state.workbookActivityIndices || {};
    api.state.workbookActivityIndices[workbook.id] = Math.max(0, Math.min(workbook.activities.length - 1, index));
    api.state.workbookActivityIds = { ...api.state.workbookActivityIds, [workbook.id]: workbook.activities[api.state.workbookActivityIndices[workbook.id]].id };
    api.state.workbookActivityVersions = { ...api.state.workbookActivityVersions, [workbook.id]: workbook.activityRevision || 1 };
    api.save(); api.render(); document.querySelector('.inquiry-question-heading')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function action(action, element) {
    if (!action.startsWith('inquiry-')) return false;
    const q = current(); if (!q) return false;
    const record = recordFor(q), lab = labState(q, record), w = q.widget;
    if (isSetLogic(q) && handleSetLogicAction(action, element, q, record)) { invalidate(q, record); api.save(); api.render(); return true; }
    if (action === 'inquiry-open') { navigate(Number(element.dataset.index)); return true; }
    if (action === 'inquiry-prev') { navigate(q.number - 2); return true; }
    if (action === 'inquiry-next') {
      if (q.number < getWorkbook(q.workbookId).activities.length) navigate(q.number);
      else { api.state.view = 'worksheets'; api.save(); api.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      return true;
    }
    if (action === 'inquiry-set') {
      const key = element.dataset.key, raw = element.dataset.value;
      setLab(q, key, key === 's' ? Number(raw) : raw);
      return true;
    }
    if (action === 'inquiry-choice') {
      record.responses = { ...record.responses, [element.dataset.field]: element.dataset.value };
      invalidate(q, record);
      for (const choice of element.closest('fieldset').querySelectorAll('.inquiry-choice')) { const selected = choice === element; choice.classList.toggle('selected', selected); choice.setAttribute('aria-pressed', selected); }
      api.save(); refreshLab(q, record); return true;
    }
    if (action === 'inquiry-step' || action === 'inquiry-rewind') {
      record.lab = { ...lab, step: action === 'inquiry-rewind' ? 0 : Math.min(w.type === 'machine' ? w.operations.length : w.roundTrip ? 2 : w.repeat || 1, (lab.step || 0) + 1) };
      rememberTrial(record, 'step', record.lab.step); api.save(); refreshLab(q, record); return true;
    }
    if (action === 'inquiry-reflect') {
      const index = Number(element.dataset.index), points = record.reflectedPoints || [];
      record.reflectedPoints = points.includes(index) ? points.filter(p => p !== index) : [...points, index];
      rememberTrial(record, 'reflected-point', index); api.save(); refreshLab(q, record); return true;
    }
    if (action === 'inquiry-reflect-graph') {
      record.lab = { ...lab, reflected: !lab.reflected }; rememberTrial(record, 'reflection', record.lab.reflected); api.save(); api.render(); return true;
    }
    if (action === 'inquiry-algebra') {
      const expected = w.stages[lab.stage || 0];
      if (expected?.action === element.dataset.value) {
        record.lab = { ...lab, stage: (lab.stage || 0) + 1 }; record.algebraMessage = '좋아요. 등식이 유지되는 변형이에요.'; rememberTrial(record, 'algebra', record.lab.stage);
      } else record.algebraMessage = '분자·분모의 관계가 유지되어야 해요. 지금 할 수 있는 변형을 다시 골라보세요.';
      api.save(); refreshLab(q, record); return true;
    }
    if (action === 'inquiry-reset') {
      record.lab = { ...w.defaults }; record.reflectedPoints = []; record.algebraMessage = '';
      if (Object.keys(labTargets(q)).length || w.type === 'substitute' || w.requireStages || isSetLogic(q)) invalidate(q, record);
      api.save(); api.render(); return true;
    }
    if (action === 'inquiry-hint') { record.hintsViewed = Math.min(q.hints.length, (record.hintsViewed || 0) + 1); api.save(); api.render(); return true; }
    if (action === 'inquiry-check') {
      const result = evaluateActivity(q, record);
      record.attempts = (record.attempts || 0) + 1; record.checked = true; record.correct = result.correct; record.feedback = result.message; record.lastSubmittedAt = new Date().toISOString();
      record.reviewRequested = Boolean(result.reviewNeeded);
      api.space.saveObservation('탐구 풀이', [record.observation, record.explanation].filter(Boolean).join(' / '), q.workbookId + ' · ' + q.source);
      api.save(); api.render(); document.querySelector('.activity-feedback')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return true;
    }
    return false;
  }
  function input(element) {
    const role = element.dataset.role;
    if (!['activity-parameter', 'activity-exact', 'activity-answer'].includes(role)) return false;
    const q = current(); if (!q) return false;
    if (role === 'activity-answer') {
      const record = recordFor(q);
      record.responses = { ...record.responses, [element.dataset.field]: element.value }; invalidate(q, record); api.save(); refreshLab(q, record);
    } else {
      const value = parseNumber(element.value), min = Number(role === 'activity-exact' ? element.dataset.min : element.min), max = Number(role === 'activity-exact' ? element.dataset.max : element.max);
      const valid = Number.isFinite(value) && value >= min && value <= max;
      element.setAttribute('aria-invalid', !valid);
      if (valid) setLab(q, element.dataset.param, value);
    }
    return true;
  }
  document.addEventListener('pointerdown', event => {
    const slQuestion = current();
    if (slQuestion && isSetLogic(slQuestion) && handleSetLogicPointer(event, slQuestion, recordFor(slQuestion))) { const record = recordFor(slQuestion); invalidate(slQuestion, record); api.save(); refreshLab(slQuestion, record); return; }
    const handle = event.target.closest('[data-lab-handle]'), q = current();
    if (!handle || !q || q.widget.type !== 'graph') return;
    const container = handle.closest('.activity-lab');
    dragging = { questionId: q.id, container, pointerId: event.pointerId };
    container.setPointerCapture(event.pointerId); event.preventDefault();
  });
  document.addEventListener('pointermove', event => {
    if (!dragging || dragging.pointerId !== event.pointerId) return;
    const q = current(), svg = dragging.container.querySelector('[data-lab-svg]');
    if (!q || q.id !== dragging.questionId || !svg?.getScreenCTM()) { dragging = null; return; }
    const screen = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse()), point = graphCoordinate(screen.x, screen.y);
    setLab(q, 'p', Math.max(-8, Math.min(8, Math.round(point.x * 2) / 2)));
    setLab(q, 'q', Math.max(-6, Math.min(6, Math.round(point.y * 2) / 2)));
    event.preventDefault();
  });
  const finish = () => { dragging = null; };
  document.addEventListener('pointerup', finish); document.addEventListener('pointercancel', finish);
  document.addEventListener('keydown', event => {
    if (!event.target.matches('[data-lab-handle]') || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const q = current(); if (!q) return;
    const lab = labState(q, recordFor(q)), horizontal = ['ArrowLeft', 'ArrowRight'].includes(event.key), key = horizontal ? 'p' : 'q', delta = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 0.5 : -0.5;
    setLab(q, key, Math.max(horizontal ? -8 : -6, Math.min(horizontal ? 8 : 6, lab[key] + delta)));
    document.querySelector('[data-lab-handle]')?.focus(); event.preventDefault();
  });
  return { action, input };
}
