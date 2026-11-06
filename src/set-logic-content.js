export const R = String.raw;
export const num = (key, label, answer) => ({ key, label, answer, type: 'number' });
export const pick = (key, label, options, answer) => ({ key, label, type: 'choice', options: options.map((option, i) => typeof option === 'string' ? { value: String(i), label: option } : option), answer: String(answer) });
export const multi = (key, label, options, answer) => ({ ...pick(key, label, options, 0), type: 'multi', answer: answer.map(String) });
export const elements = (key, label, universe, answer) => ({ key, label, type: 'set', options: universe.map(String), answer: answer.map(String) });
export const witness = (key, label, validate) => ({ key, label, type: 'witness', validate });
export const writing = (key, label) => ({ key, label, type: 'text', minLength: 15 });
export const question = (page, source, title, prompt, formula, widget, fields, explanation, extra = {}) => ({
  sourcePage: page, source, title, prompt, formula, widget: { defaults: {}, ...widget }, fields, explanation,
  hints: ['주어진 전체집합과 조건을 먼저 확인해요.', '원소·영역·구체적인 수를 바꾸어 한 가지씩 비교해요.', explanation], ...extra
});
export const probe = (pLabel, p, qLabel = '', q = null, extra = {}) => ({ type: 'sl-probe', pLabel, p, qLabel, q, defaults: { x: Math.max(extra.min ?? -6, Math.min(extra.max ?? 6, 0)) }, ...extra });
export const board = (universe, sets, extra = {}) => ({ type: 'sl-board', universe, sets, defaults: { operation: 'union' }, ...extra });
export const venn = (expression, count = 2, extra = {}) => ({ type: 'sl-venn', expression, count, checkRegions: true, defaults: { regions: [] }, ...extra });
export const proof = steps => ({ type: 'sl-proof', steps, defaults: { order: [] } });
export const relation = answer => pick('relation', 'p는 q이기 위한 어떤 조건인가요?', ['충분하지만 필요하지 않다', '필요하지만 충분하지 않다', '필요충분조건이다', '충분조건도 필요조건도 아니다'], answer);
export const truth = answer => pick('truth', '명제의 참·거짓', ['참', '거짓'], answer ? 0 : 1);
export const finalize = (id, items, subject) => items.map((q, i) => ({ ...q, id: `${id}-a${String(i + 1).padStart(3, '0')}`, number: i + 1, workbookId: id, subject, group: q.group || (subject === 'sets' ? '집합의 탐구' : '명제의 탐구'), source: `${q.source} · PDF ${q.sourcePage}쪽` }));
