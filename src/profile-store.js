const INSPECTOR_FIRST_NAMES = [
  'Aleks', 'Boris', 'Dimitri', 'Emil', 'Gregor', 'Ilija', 'Marek', 'Milan',
  'Nikolai', 'Oskar', 'Pavel', 'Radek', 'Stefan', 'Viktor'
];

const INSPECTOR_LAST_NAMES = [
  'Bartos', 'Drazic', 'Kovac', 'Markovic', 'Novak', 'Petrov', 'Sokolov',
  'Varga', 'Volkov', 'Zoric', 'Keller', 'Orlov', 'Dragun'
];

function emptyInspectorStatistics() {
  return {
    campaignsCompleted: 0,
    turnsCompleted: 0,
    correctAnswers: 0,
    questionsAnswered: 0,
    totalPoints: 0,
    bestScore: 0,
    bestStreak: 0,
    lastPlayedAt: null
  };
}

function makeId(prefix, random) {
  return `${prefix}-${Math.floor(random() * Number.MAX_SAFE_INTEGER).toString(36)}`;
}

function makeInspectorCode(random) {
  const serial = Math.floor(random() * 900000) + 100000;
  return `AR-82-${serial}`;
}

export function generateInspectorName(random = Math.random) {
  const first = INSPECTOR_FIRST_NAMES[Math.floor(random() * INSPECTOR_FIRST_NAMES.length)];
  const last = INSPECTOR_LAST_NAMES[Math.floor(random() * INSPECTOR_LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function createInspectorDraft({
  interviewAnswers = [],
  createdAt = '1982-10-04',
  random = Math.random
} = {}) {
  return {
    id: makeId('inspector', random),
    name: generateInspectorName(random),
    code: makeInspectorCode(random),
    createdAt,
    interviewAnswers: [...interviewAnswers],
    status: 'active'
  };
}

export function createEmptyIdentityStore() {
  return {
    schemaVersion: 1,
    player: null,
    inspectors: [],
    activeInspectorId: null,
    statistics: { inspectorsCreated: 0 }
  };
}

export function normalizeIdentityStore(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createEmptyIdentityStore();

  const inspectors = Array.isArray(value.inspectors)
    ? value.inspectors.filter((inspector) => inspector && typeof inspector === 'object' && inspector.id && inspector.code)
    : [];
  const player = value.player && typeof value.player === 'object' && typeof value.player.name === 'string'
    ? value.player
    : null;
  const activeInspectorId = inspectors.some((inspector) => inspector.id === value.activeInspectorId)
    ? value.activeInspectorId
    : inspectors.find((inspector) => inspector.status === 'active')?.id ?? null;

  return {
    schemaVersion: 1,
    player,
    inspectors: inspectors.map((inspector) => ({
      ...inspector,
      interviewAnswers: Array.isArray(inspector.interviewAnswers) ? inspector.interviewAnswers : [],
      statistics: {
        ...emptyInspectorStatistics(),
        ...(inspector.statistics && typeof inspector.statistics === 'object' ? inspector.statistics : {})
      },
      status: inspector.id === activeInspectorId ? 'active' : 'archived'
    })),
    activeInspectorId,
    statistics: {
      inspectorsCreated: Math.max(
        inspectors.length,
        Number.isInteger(value.statistics?.inspectorsCreated) ? value.statistics.inspectorsCreated : 0
      )
    }
  };
}

export function createInitialIdentityStore({
  playerName,
  interviewAnswers = [],
  createdAt = '1982-10-04',
  random = Math.random,
  inspectorDraft = null
} = {}) {
  const normalizedName = String(playerName ?? '').trim().replace(/\s+/g, ' ');
  if (normalizedName.length < 2) throw new Error('O nome do jogador deve ter pelo menos dois caracteres.');

  const inspector = inspectorDraft
    ? { ...inspectorDraft, interviewAnswers: [...interviewAnswers], status: 'active' }
    : createInspectorDraft({ interviewAnswers, createdAt, random });

  return {
    schemaVersion: 1,
    player: {
      id: makeId('player', random),
      name: normalizedName,
      createdAt
    },
    inspectors: [inspector],
    activeInspectorId: inspector.id,
    statistics: { inspectorsCreated: 1 }
  };
}

export function registerNewInspector(store, {
  name,
  interviewAnswers = [],
  createdAt = '1982-10-04',
  random = Math.random,
  inspectorDraft = null
} = {}) {
  const current = normalizeIdentityStore(store);
  if (!current.player) throw new Error('Não existe um perfil de jogador registrado.');
  const normalizedName = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (normalizedName.length < 2) throw new Error('O nome do inspetor deve ter pelo menos dois caracteres.');

  const inspectors = current.inspectors.map((inspector) => ({ ...inspector, status: 'archived' }));
  const inspector = inspectorDraft
    ? { ...inspectorDraft, name: normalizedName, interviewAnswers: [...interviewAnswers], status: 'active' }
    : { ...createInspectorDraft({ interviewAnswers, createdAt, random }), name: normalizedName };

  inspectors.push(inspector);
  return {
    ...current,
    inspectors,
    activeInspectorId: inspector.id,
    statistics: { ...current.statistics, inspectorsCreated: current.statistics.inspectorsCreated + 1 }
  };
}

export function getActiveInspector(store) {
  if (!store?.activeInspectorId || !Array.isArray(store.inspectors)) return null;
  return store.inspectors.find((inspector) => inspector.id === store.activeInspectorId) ?? null;
}


export function recordInspectorPerformance(store, {
  inspectorId = store?.activeInspectorId,
  type = 'turn',
  correct = 0,
  questions = 10,
  points = 0,
  bestStreak = 0,
  recordedAt = new Date().toISOString()
} = {}) {
  const current = normalizeIdentityStore(store);
  const safeQuestions = Math.max(0, Number.isFinite(questions) ? Math.floor(questions) : 0);
  const safeCorrect = Math.max(0, Math.min(safeQuestions, Number.isFinite(correct) ? Math.floor(correct) : 0));
  const safePoints = Math.max(0, Number.isFinite(points) ? Math.floor(points) : 0);
  const safeBestStreak = Math.max(0, Number.isFinite(bestStreak) ? Math.floor(bestStreak) : 0);

  return {
    ...current,
    inspectors: current.inspectors.map((inspector) => {
      if (inspector.id !== inspectorId) return inspector;
      const statistics = { ...emptyInspectorStatistics(), ...inspector.statistics };
      return {
        ...inspector,
        statistics: {
          ...statistics,
          campaignsCompleted: statistics.campaignsCompleted + Number(type === 'campaign'),
          turnsCompleted: statistics.turnsCompleted + Number(type === 'turn'),
          correctAnswers: statistics.correctAnswers + safeCorrect,
          questionsAnswered: statistics.questionsAnswered + safeQuestions,
          totalPoints: statistics.totalPoints + (type === 'turn' ? safePoints : 0),
          bestScore: Math.max(statistics.bestScore, type === 'turn' ? safePoints : 0),
          bestStreak: Math.max(statistics.bestStreak, safeBestStreak),
          lastPlayedAt: recordedAt
        }
      };
    })
  };
}
