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

test('hard mode deducts 50 points for a wrong answer', () => {
  assert.equal(scoreAnswer({ correct: false, difficulty: 'dificil' }).points, -50);
});
