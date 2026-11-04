import sourceCountries from '../dados.json';

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

export function scoreAnswer({ correct, elapsed = 99, streak = 0, difficulty = 'facil' }) {
  if (!correct) return { points: difficulty === 'dificil' ? -50 : 0, streak: 0 };
  const speedBonus = difficulty !== 'facil' && elapsed < 2 ? 25 : 0;
  const streakBonus = difficulty !== 'facil' && streak >= 3 ? 50 : 0;
  return { points: 100 + speedBonus + streakBonus, streak: streak + 1 };
}
