import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { createQuizTimer, quizTimeLabel } from '../src/quiz-timer.js';
import { quizMathToTex, quizTextParts, renderQuizText } from '../src/quiz-math.js';
import { createLevelQuiz, levelVariantIds } from '../src/quiz-levels.js';
import { createVariantPicker } from '../src/practice-random.js';
import { recordQuizAttempt } from '../src/play-progress.js';

test('quiz timer excludes paused time and preserves elapsed time through repeated UI renders', () => {
  let now = 0; const timer = createQuizTimer(() => now);
  assert.equal(timer.seconds, 0); assert.equal(timer.running, false);
  timer.start(); now = 2500; assert.equal(timer.seconds, 2.5);
  timer.resume(); now = 4000; assert.equal(timer.seconds, 4);
  timer.pause(); timer.pause(); now = 20000; assert.equal(timer.seconds, 4);
  timer.resume(); now = 23000; assert.equal(timer.seconds, 7);
  timer.pause(); now = 24000; assert.equal(timer.seconds, 7);
  timer.reset(); assert.equal(timer.seconds, 0); assert.equal(timer.running, false);
  timer.start(); now = 25500; assert.equal(timer.seconds, 1.5);
});
test('timer labels are stable at minute boundaries and invalid inputs', () => {
  assert.equal(quizTimeLabel(0), '00:00'); assert.equal(quizTimeLabel(59.99), '00:59'); assert.equal(quizTimeLabel(60), '01:00'); assert.equal(quizTimeLabel(3661), '61:01'); assert.equal(quizTimeLabel(-10), '00:00'); assert.equal(quizTimeLabel(NaN), '00:00');
});
test('real radicals, fractions, inverse functions, sets and intervals render with correct grouping', () => {
  const cases = [
    ['√(2x+1)', String.raw`\sqrt{2x+1}`],
    ['y=1/sqrt(2x-3)', String.raw`y=\frac{1}{\sqrt{2x-3}}`],
    ['√(2(x−3))+1', String.raw`\sqrt{2\left(x-3\right)}+1`],
    ['f⁻¹(x)=(x−2)²/3+1', String.raw`f^{-1}\left(x\right)=\frac{\left(x-2\right)^{2}}{3}+1`],
    ['[0,∞)', String.raw`\left[0,\,\infty\right)`],
    ['{−2,0,2}', String.raw`\left\{-2,\,0,\,2\right\}`]
  ];
  for (const [input, expected] of cases) { const tex = quizMathToTex(input); assert.equal(tex, expected); assert.doesNotThrow(() => katex.renderToString(tex, { throwOnError: true, strict: 'ignore' })); }
  const html = renderQuizText('함수 y=1/sqrt(x−2)의 정의역은?'); assert.ok(html.includes('<msqrt>')); assert.ok(html.includes('<mfrac>')); assert.ok(!html.includes('katex-error'));
  assert.ok(!renderQuizText('주의 <img src=x onerror=alert(1)>').includes('<img'));
});
test('every generated question, answer and explanation can be typeset without raw notation fallbacks', () => {
  for (let level = 1; level <= 5; level++) for (let topic = 0; topic < 6; topic++) for (let variant = 0; variant < 120; variant++) {
    const q = createLevelQuiz(topic, variant, level);
    for (const text of [q.q, q.why, ...q.options]) {
      for (const part of quizTextParts(text)) { assert.ok(!part.unsupported, part.text); if (part.tex && [0, 1, 59, 119].includes(variant)) assert.doesNotThrow(() => katex.renderToString(part.tex, { throwOnError: true, strict: 'ignore' })); }
    }
  }
});
test('each five-level topic draws fresh random stems and each stage has only six assessed topics', () => {
  const next = createVariantPicker({ random: () => 0, storage: { getItem: () => null, setItem() {} } });
  for (let level = 1; level <= 5; level++) for (let topic = 0; topic < 6; topic++) {
    const pool = levelVariantIds(topic, level), key = `${level}:${topic}`;
    const first = createLevelQuiz(topic, pool[next(key, pool.length)], level);
    const second = createLevelQuiz(topic, pool[next(key, pool.length)], level); assert.notEqual(first.q, second.q);
  }
  const state = {};
  for (let level = 1; level <= 5; level++) { for (let topic = 0; topic < 6; topic++) recordQuizAttempt(state, { level, topic, correct: true, question: '문항', selected: '정답' }); assert.equal(Object.keys(state.playLab.quiz.stages[level].passed).length, 6); }
});
test('only active thinking time is added to teacher records after separate answer attempts', () => {
  let now = 0; const timer = createQuizTimer(() => now), state = {};
  timer.start(); now = 4000; timer.pause();
  recordQuizAttempt(state, { level: 1, topic: 0, correct: false, question: '문항', selected: '오답', seconds: timer.seconds });
  const recorded = timer.seconds; now = 40000; timer.resume(); now = 46000; timer.pause();
  recordQuizAttempt(state, { level: 1, topic: 0, correct: true, question: '문항', selected: '정답', seconds: timer.seconds - recorded });
  assert.equal(state.playLab.quiz.stages[1].seconds, 10); assert.deepEqual(state.playLab.events.map(e => e.seconds), [4, 6]);
});
