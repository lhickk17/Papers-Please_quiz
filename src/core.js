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

export function scoreAnswer({ correct, timedOut = false, elapsed = 0, streak = 0, difficulty = 'facil' }) {
  const limits = { facil: 0, normal: 8, dificil: 5 };
  const penalties = {
    facil: { error: 0, timeout: 0 },
    normal: { error: -25, timeout: -50 },
    dificil: { error: -50, timeout: -75 }
  };
  const limit = limits[difficulty] ?? 0;
  const isCorrect = Boolean(correct) && !timedOut;

  if (!isCorrect) {
    const penalty = penalties[difficulty]?.[timedOut ? 'timeout' : 'error'] ?? 0;
    return {
      points: penalty,
      basePoints: 0,
      speedBonus: 0,
      streakBonus: 0,
      penalty,
      streak: 0,
      timedOut
    };
  }

  const safeElapsed = Math.max(0, Number(elapsed) || 0);
  const rawSpeedBonus = limit
    ? 40 * Math.max(0, Math.min(1, 1 - safeElapsed / limit))
    : 0;
  // Mantém a fórmula linear, mas limita a pontuação a duas casas decimais.
  const speedBonus = Math.round((rawSpeedBonus + Number.EPSILON) * 100) / 100;
  const nextStreak = streak + 1;
  const streakBonus = difficulty === 'facil'
    ? 0
    : nextStreak >= 10 ? 50
      : nextStreak >= 8 ? 40
        : nextStreak >= 6 ? 30
          : nextStreak >= 4 ? 20
            : nextStreak >= 3 ? 10
              : 0;

  return {
    points: Math.round((100 + speedBonus + streakBonus + Number.EPSILON) * 100) / 100,
    basePoints: 100,
    speedBonus,
    streakBonus,
    penalty: 0,
    streak: nextStreak,
    timedOut: false
  };
}
