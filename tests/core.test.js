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

test('correct answers always award 100 base points in every regime', () => {
  for (const difficulty of ['facil', 'normal', 'dificil']) {
    const result = scoreAnswer({ correct: true, difficulty });
    assert.equal(result.points, 100);
    assert.equal(result.streakBonus, 0);
    assert.equal(result.streak, 1);
  }
});

test('errors and timeouts apply the fixed penalty for each regime', () => {
  assert.equal(scoreAnswer({ correct: false, difficulty: 'facil' }).points, 0);
  assert.equal(scoreAnswer({ correct: false, difficulty: 'normal' }).points, -25);
  assert.equal(scoreAnswer({ correct: false, difficulty: 'dificil' }).points, -50);
  assert.equal(scoreAnswer({ correct: false, timedOut: true, difficulty: 'facil' }).points, 0);
  assert.equal(scoreAnswer({ correct: false, timedOut: true, difficulty: 'normal' }).points, -50);
  assert.equal(scoreAnswer({ correct: false, timedOut: true, difficulty: 'dificil' }).points, -75);
});

test('streak bonus increases by band and applies to every answer in that band', () => {
  const cases = [
    [0, 1, 0], [1, 2, 0],
    [2, 3, 10], [3, 4, 20], [4, 5, 20],
    [5, 6, 30], [6, 7, 30],
    [7, 8, 40], [8, 9, 40],
    [9, 10, 50], [10, 11, 50]
  ];

  for (const [previousStreak, expectedStreak, expectedBonus] of cases) {
    const result = scoreAnswer({ correct: true, streak: previousStreak, difficulty: 'normal' });
    assert.equal(result.streak, expectedStreak);
    assert.equal(result.streakBonus, expectedBonus);
    assert.equal(result.points, 100 + expectedBonus);
  }
});

test('training keeps the streak counter but does not award streak points', () => {
  const result = scoreAnswer({ correct: true, streak: 8, difficulty: 'facil' });
  assert.equal(result.streak, 9);
  assert.equal(result.streakBonus, 0);
  assert.equal(result.points, 100);
});

test('an error or timeout breaks the streak immediately', () => {
  const wrong = scoreAnswer({ correct: false, streak: 6, difficulty: 'normal' });
  const timeout = scoreAnswer({ correct: false, timedOut: true, streak: 6, difficulty: 'dificil' });
  assert.equal(wrong.streak, 0);
  assert.equal(timeout.streak, 0);
  assert.equal(wrong.streakBonus, 0);
  assert.equal(timeout.streakBonus, 0);
});
