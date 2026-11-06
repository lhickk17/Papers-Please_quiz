import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyIdentityStore,
  createInitialIdentityStore,
  createInspectorDraft,
  getActiveInspector,
  normalizeIdentityStore,
  registerNewInspector
} from '../src/profile-store.js';

const sequence = (...values) => {
  let index = 0;
  return () => values[index++ % values.length];
};

test('empty identity store has no player or inspector', () => {
  const store = createEmptyIdentityStore();
  assert.equal(store.player, null);
  assert.deepEqual(store.inspectors, []);
  assert.equal(store.activeInspectorId, null);
  assert.equal(store.statistics.inspectorsCreated, 0);
});

test('first admission creates one permanent player and one active inspector', () => {
  const store = createInitialIdentityStore({
    playerName: '  Luiz   Henrique ',
    interviewAnswers: [0, 2, 1],
    random: sequence(0.1, 0.2, 0.3, 0.4)
  });
  const inspector = getActiveInspector(store);

  assert.equal(store.player.name, 'Luiz Henrique');
  assert.equal(store.inspectors.length, 1);
  assert.equal(store.statistics.inspectorsCreated, 1);
  assert.equal(inspector.status, 'active');
  assert.deepEqual(inspector.interviewAnswers, [0, 2, 1]);
  assert.match(inspector.code, /^AR-82-\\d{6}$/);
  assert.notEqual(inspector.name, store.player.name);
});

test('a later admission archives the previous inspector without changing the player', () => {
  const first = createInitialIdentityStore({
    playerName: 'Henrique',
    interviewAnswers: [1, 1, 0],
    random: sequence(0.11, 0.22, 0.33, 0.44)
  });
  const playerBefore = { ...first.player };
  const previousInspector = getActiveInspector(first);
  const draft = createInspectorDraft({ random: sequence(0.55, 0.66, 0.77, 0.88) });

  const second = registerNewInspector(first, {
    name: 'Marek Varga',
    interviewAnswers: [2, 0, 1],
    inspectorDraft: draft
  });

  assert.deepEqual(second.player, playerBefore);
  assert.equal(second.inspectors.length, 2);
  assert.equal(second.statistics.inspectorsCreated, 2);
  assert.equal(second.inspectors.find((item) => item.id === previousInspector.id).status, 'archived');
  assert.equal(getActiveInspector(second).name, 'Marek Varga');
  assert.equal(getActiveInspector(second).status, 'active');
  assert.deepEqual(getActiveInspector(second).interviewAnswers, [2, 0, 1]);
});

test('normalization keeps exactly one active inspector', () => {
  const store = createInitialIdentityStore({ playerName: 'Henrique' });
  const normalized = normalizeIdentityStore({
    ...store,
    inspectors: store.inspectors.map((item) => ({ ...item, status: 'archived' }))
  });
  assert.equal(getActiveInspector(normalized).status, 'active');
});

test('registration rejects missing player identity and invalid names', () => {
  assert.throws(() => createInitialIdentityStore({ playerName: 'A' }), /dois caracteres/);
  assert.throws(() => registerNewInspector(createEmptyIdentityStore(), { name: 'Novo' }), /perfil de jogador/);
  const store = createInitialIdentityStore({ playerName: 'Henrique' });
  assert.throws(() => registerNewInspector(store, { name: ' ' }), /dois caracteres/);
});
