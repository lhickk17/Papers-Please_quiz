import sourceCountries from '../dados.json' with { type: 'json' };

export const CITIES = sourceCountries.flatMap(({ pais, cidades }) =>
  cidades.map(({ nome, curiosidade }) => ({ city: nome, country: pais, curiosity: curiosidade }))
);
export const COUNTRIES = [...new Set(CITIES.map(({ country }) => country))];
export const CAMPAIGN_SIZE = 10;

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createQuestion(city, random = Math.random) {
  const alternatives = shuffle(COUNTRIES.filter((country) => country !== city.country), random).slice(0, 3);
  return { ...city, options: shuffle([city.country, ...alternatives], random) };
}

export function createRound(count = CAMPAIGN_SIZE, random = Math.random) {
  return shuffle(CITIES, random).slice(0, Math.min(count, CITIES.length)).map((city) => createQuestion(city, random));
}

export function campaignOutcome(correct) {
  if (correct >= 9) return 'distinction';
  if (correct >= 7) return 'pass';
  return 'retry';
}

export function scoreAnswer({
  correct,
  timedOut = false,
  streak = 0,
  difficulty = 'facil',
  responseTimeMs = Number.POSITIVE_INFINITY
}) {
  const penalties = {
    facil: { error: 0, timeout: 0 },
    normal: { error: -25, timeout: -50 },
    dificil: { error: -50, timeout: -75 }
  };
  const speedThresholds = { facil: 5000, normal: 4000, dificil: 2500 };
  const isCorrect = Boolean(correct) && !timedOut;

  if (!isCorrect) {
    const penalty = penalties[difficulty]?.[timedOut ? 'timeout' : 'error'] ?? 0;
    return {
      points: penalty,
      streak: 0,
      streakBonus: 0,
      speedBonus: 0,
      penalty,
      timedOut
    };
  }

  const nextStreak = streak + 1;
  const streakBonus = difficulty === 'facil'
    ? 0
    : nextStreak >= 10 ? 50
      : nextStreak >= 8 ? 40
        : nextStreak >= 6 ? 30
          : nextStreak >= 4 ? 20
            : nextStreak >= 3 ? 10
              : 0;
  const speedBonus = responseTimeMs <= speedThresholds[difficulty] ? 20 : 0;

  return {
    points: 100 + streakBonus + speedBonus,
    streak: nextStreak,
    streakBonus,
    speedBonus,
    penalty: 0,
    timedOut: false
  };
}

export function classifyScore(points, difficulty = 'facil') {
  const maximumScores = { facil: 1200, normal: 1440, dificil: 1440 };
  const maximum = maximumScores[difficulty] ?? maximumScores.facil;
  const normalizedScore = Math.max(0, Math.min(100, (points / maximum) * 100));
  const scoreRate = Math.round(normalizedScore);
  const levels = [
    { min: 95, stamp: 'DISTINÇÃO', className: 'is-distinction' },
    { min: 80, stamp: 'CONFORME', className: 'is-approved' },
    { min: 60, stamp: 'RESSALVAS', className: 'is-warning' },
    { min: 0, stamp: 'INSATISFATÓRIO', className: 'is-rejected' }
  ];
  const level = levels.find(({ min }) => scoreRate >= min);
  return { ...level, scoreRate, maximum };
}


export function applyScoreDelta(currentPoints, pointsDelta) {
  return Math.max(0, currentPoints + pointsDelta);
}
