import test from 'node:test';
import assert from 'node:assert/strict';
import { CITIES, COUNTRIES, createRound, campaignOutcome, scoreAnswer } from '../src/core.js';

test('source question bank has seven countries and unique cities', () => {
  assert.equal(COUNTRIES.length, 7);
  assert.equal(new Set(CITIES.map((city) => city.city)).size, CITIES.length);
});

test('round has ten unique cities and four distinct options per question', () => {
  const round = createRound(10, () => 0.42);
  assert.equal(round.length, 10);
  assert.equal(new Set(round.map((question) => question.city)).size, 10);
  for (const question of round) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.ok(question.options.includes(question.country));
  }
});

test('campaign score thresholds are 7 for pass and 9 for distinction', () => {
  assert.equal(campaignOutcome(6), 'retry');
  assert.equal(campaignOutcome(7), 'pass');
  assert.equal(campaignOutcome(8), 'pass');
  assert.equal(campaignOutcome(9), 'distinction');
  assert.equal(campaignOutcome(10), 'distinction');
});

test('scoring applies the approved error and timeout penalties by regime', () => {
  assert.equal(scoreAnswer({ correct: false, difficulty: 'facil' }).points, 0);
  assert.equal(scoreAnswer({ correct: false, difficulty: 'normal' }).points, -25);
  assert.equal(scoreAnswer({ correct: false, difficulty: 'dificil' }).points, -50);
  assert.equal(scoreAnswer({ correct: false, timedOut: true, difficulty: 'facil' }).points, 0);
  assert.equal(scoreAnswer({ correct: false, timedOut: true, difficulty: 'normal' }).points, -50);
  assert.equal(scoreAnswer({ correct: false, timedOut: true, difficulty: 'dificil' }).points, -75);
});

test('speed bonus decreases continuously and linearly within each timed regime', () => {
  assert.equal(scoreAnswer({ correct: true, elapsed: 0, difficulty: 'normal' }).speedBonus, 40);
  assert.equal(scoreAnswer({ correct: true, elapsed: 2, difficulty: 'normal' }).speedBonus, 30);
  assert.equal(scoreAnswer({ correct: true, elapsed: 1, difficulty: 'dificil' }).speedBonus, 32);
  assert.equal(scoreAnswer({ correct: true, elapsed: 5, difficulty: 'dificil' }).speedBonus, 0);
  assert.equal(scoreAnswer({ correct: true, elapsed: 1, difficulty: 'facil' }).speedBonus, 0);
});

test('speed bonus and question score are rounded to two decimal places', () => {
  const result = scoreAnswer({ correct: true, elapsed: 1, difficulty: 'normal' });
  assert.equal(result.speedBonus, 35);
  assert.equal(result.points, 135);
  const fractional = scoreAnswer({ correct: true, elapsed: 1.111, difficulty: 'normal' });
  assert.equal(fractional.speedBonus, 34.45);
  assert.equal(fractional.points, 134.45);
});

test('streak bonus applies to every correct answer within its reached band', () => {
  assert.equal(scoreAnswer({ correct: true, streak: 1, difficulty: 'normal' }).streakBonus, 0);
  assert.equal(scoreAnswer({ correct: true, streak: 2, difficulty: 'normal' }).streakBonus, 10);
  assert.equal(scoreAnswer({ correct: true, streak: 3, difficulty: 'normal' }).streakBonus, 20);
  assert.equal(scoreAnswer({ correct: true, streak: 5, difficulty: 'normal' }).streakBonus, 30);
  assert.equal(scoreAnswer({ correct: true, streak: 7, difficulty: 'normal' }).streakBonus, 40);
  assert.equal(scoreAnswer({ correct: true, streak: 9, difficulty: 'normal' }).streakBonus, 50);
  assert.equal(scoreAnswer({ correct: true, streak: 9, difficulty: 'facil' }).streakBonus, 0);
});

test('wrong answers and timeouts reset the streak and never receive bonuses', () => {
  const wrong = scoreAnswer({ correct: false, streak: 5, difficulty: 'normal' });
  const timeout = scoreAnswer({ correct: false, timedOut: true, streak: 5, difficulty: 'dificil' });
  assert.equal(wrong.streak, 0);
  assert.equal(wrong.speedBonus, 0);
  assert.equal(wrong.streakBonus, 0);
  assert.equal(timeout.streak, 0);
  assert.equal(timeout.speedBonus, 0);
  assert.equal(timeout.streakBonus, 0);
});
