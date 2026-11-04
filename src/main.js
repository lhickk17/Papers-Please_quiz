import './style.css';
import { createRound, campaignOutcome, scoreAnswer } from './core.js';

const $ = (selector) => document.querySelector(selector);
const screenIds = ['opening', 'campaign', 'campaign-result', 'menu', 'quiz', 'report'];
const campaignKey = 'ppquiz.campaign.v2';
let campaign = [];
let campaignIndex = 0;
let campaignCorrect = 0;
let game = null;
let questionStarted = 0;
let timerId = null;
let muted = false;
const audio = {};

function navigate(id) {
  const show = () => screenIds.forEach((key) => {
    const screen = document.getElementById(key);
    const active = key === id;
    screen.classList.toggle('is-active', active);
    screen.setAttribute('aria-hidden', String(!active));
    screen.inert = !active;
  });
  if (document.startViewTransition) document.startViewTransition(show);
  else {
    document.querySelector('.screen.is-active')?.classList.add('is-leaving');
    window.setTimeout(() => {
      show();
      document.querySelector('.screen.is-active')?.classList.remove('is-leaving');
    }, 80);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function play(key, volume = 0.35) {
  if (muted) return;
  const sources = {
    theme: 'assets-sounds/01. Glory to Arstotzka (Main Theme).mp3',
    stamp: 'assets-sounds/70. Stamp Down.mp3',
    page: 'assets-sounds/52. Paper Turnpage0.mp3',
    hover: 'assets-sounds/32. Inspect Highlight.mp3'
  };
  if (!audio[key]) {
    if (!sources[key]) return;
    audio[key] = new Audio(sources[key]);
  }
  const sound = audio[key];
  sound.volume = volume;
  sound.loop = key === 'theme';
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function renderOptions(container, question, onAnswer, answered = null) {
  container.replaceChildren();
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-option';
    const key = document.createElement('span');
    key.className = 'option-key';
    key.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span');
    label.className = 'option-label';
    label.textContent = option;
    button.append(key, label);
    button.addEventListener('click', () => onAnswer(option));
    if (answered !== null) {
      button.disabled = true;
      if (option === question.country) button.classList.add('is-correct');
      if (option === answered && answered !== question.country) button.classList.add('is-wrong');
    }
    container.append(button);
  });
}

function renderQuestion(panel, question, options, callback) {
  panel.querySelector('.question-city').textContent = question.city;
  panel.querySelector('.question-prompt').textContent = 'Identifique o país de emissão deste documento.';
  panel.querySelector('.question-curiosity').textContent = question.curiosity || 'Registro complementar indisponível.';
  renderOptions(options, question, callback);
}

function beginCampaign() {
  campaign = createRound(10);
  campaignIndex = 0;
  campaignCorrect = 0;
  renderCampaignQuestion();
  navigate('campaign');
}

function renderCampaignQuestion() {
  const question = campaign[campaignIndex];
  if (!question) return finishCampaign();
  $('#campaign-count').textContent = `AVALIAÇÃO ${String(campaignIndex + 1).padStart(2, '0')} / 10`;
  $('#campaign-progress-label').textContent = `${campaignIndex + 1} de 10 documentos verificados`;
  $('#campaign-progress').style.setProperty('--progress', `${((campaignIndex + 1) / 10) * 100}%`);
  $('#campaign-feedback').textContent = '';
  $('#campaign-feedback').className = 'feedback-row';
  $('#campaign-next').hidden = true;
  renderQuestion($('#campaign-panel'), question, $('#campaign-options'), (answer) => {
    const correct = answer === question.country;
    campaignCorrect += Number(correct);
    renderOptions($('#campaign-options'), question, () => {}, answer);
    $('#campaign-feedback').textContent = correct
      ? 'DOCUMENTO CONFERIDO. PROCEDIMENTO CORRETO.'
      : `DISCREPÂNCIA REGISTRADA. PAÍS CORRETO: ${question.country.toUpperCase()}.`;
    $('#campaign-feedback').className = `feedback-row ${correct ? 'is-success' : 'is-error'}`;
    $('#campaign-curiosity').textContent = question.curiosity;
    $('#campaign-next').hidden = false;
    $('#campaign-next').textContent = campaignIndex === 9 ? 'Emitir parecer final →' : 'Próximo documento →';
    play(correct ? 'stamp' : 'page');
  });
}

function finishCampaign() {
  const outcome = campaignOutcome(campaignCorrect);
  try { localStorage.setItem(campaignKey, 'true'); } catch {}
  const plaque = outcome === 'distinction' ? 'assets/papers/PlaqueTwoInner.png' : 'assets/papers/PlaqueOneInner.png';
  $('#result-plaque').src = plaque;
  $('#result-plaque').alt = outcome === 'distinction' ? 'Placa de distinção' : 'Placa de avaliação';
  $('#result-score').textContent = `${campaignCorrect} / 10 ACERTOS`;
  $('#result-heading').textContent = outcome === 'distinction' ? 'DISTINÇÃO CONCEDIDA' : outcome === 'pass' ? 'APROVADO COM RESSALVAS' : 'AVALIAÇÃO INSATISFATÓRIA';
  $('#result-message').textContent = outcome === 'distinction'
    ? 'O supervisor Vonel reconhece seu desempenho excepcional. Mantenha esse padrão de conformidade.'
    : outcome === 'pass'
      ? 'Sua avaliação atende ao mínimo exigido. O Ministério espera maior precisão no próximo turno.'
      : 'Seu desempenho ficou abaixo do padrão. A designação permanece válida. Consulte o manual e tente novamente quando desejar.';
  $('#result-retry').hidden = outcome !== 'retry';
  navigate('campaign-result');
}

function beginQuiz(difficulty) {
  clearInterval(timerId);
  game = { difficulty, questions: createRound(10), index: 0, correct: 0, points: 0, streak: 0, bestStreak: 0, errors: [], answered: false };
  renderGameQuestion();
  navigate('quiz');
}

function renderGameQuestion() {
  clearInterval(timerId);
  if (!game || game.index >= game.questions.length) return finishQuiz();
  const question = game.questions[game.index];
  questionStarted = performance.now();
  const limit = game.difficulty === 'normal' ? 8 : game.difficulty === 'dificil' ? 5 : 0;
  $('#game-count').textContent = `DOCUMENTO ${String(game.index + 1).padStart(2, '0')} / 10`;
  $('#game-score').textContent = String(game.points).padStart(5, '0');
  $('#game-streak').textContent = String(game.streak);
  $('#game-timer').textContent = limit ? `${limit.toFixed(1)}s` : 'SEM LIMITE';
  $('#game-feedback').textContent = '';
  $('#game-next').hidden = true;
  renderQuestion($('#game-panel'), question, $('#game-options'), answerGame);
  if (limit) {
    timerId = window.setInterval(() => {
      if (!game || game.answered) return;
      const remaining = Math.max(0, limit - (performance.now() - questionStarted) / 1000);
      $('#game-timer').textContent = `${remaining.toFixed(1)}s`;
      if (remaining <= 0) answerGame(null);
    }, 100);
  }
}

function answerGame(answer) {
  if (!game || game.answered) return;
  clearInterval(timerId);
  const question = game.questions[game.index];
  const elapsed = (performance.now() - questionStarted) / 1000;
  const correct = answer === question.country;
  const scored = scoreAnswer({ correct, elapsed, streak: game.streak, difficulty: game.difficulty });
  game.answered = true;
  game.correct += Number(correct);
  game.points += scored.points;
  game.streak = scored.streak;
  game.bestStreak = Math.max(game.bestStreak, game.streak);
  if (!correct) game.errors.push({ city: question.city, expected: question.country, answered: answer ?? 'tempo esgotado' });
  renderOptions($('#game-options'), question, () => {}, answer);
  $('#game-feedback').textContent = correct ? 'ENTRADA APROVADA' : `ENTRADA RECUSADA · ${question.country.toUpperCase()}`;
  $('#game-feedback').className = `feedback-row ${correct ? 'is-success' : 'is-error'}`;
  $('#game-curiosity').textContent = question.curiosity;
  $('#game-score').textContent = String(game.points).padStart(5, '0');
  $('#game-streak').textContent = String(game.streak);
  $('#game-next').hidden = false;
  $('#game-next').textContent = game.index === 9 ? 'Abrir relatório →' : 'Próximo documento →';
  play('stamp');
}

function finishQuiz() {
  clearInterval(timerId);
  $('#report-score').textContent = `${game.points} PTS`;
  $('#report-summary').textContent = `${game.correct} acertos em 10 documentos · melhor sequência: ${game.bestStreak}`;
  const list = $('#report-errors');
  list.replaceChildren();
  if (!game.errors.length) {
    const item = document.createElement('li');
    item.textContent = 'Nenhuma discrepância registrada. O Ministério agradece sua precisão.';
    list.append(item);
  } else {
    game.errors.forEach((error) => {
      const item = document.createElement('li');
      item.textContent = `${error.city}: ${error.answered} · correto: ${error.expected}`;
      list.append(item);
    });
  }
  navigate('report');
}

$('#opening-enter').addEventListener('click', () => {
  play('theme', 0.2);
  let completed = false;
  try { completed = localStorage.getItem(campaignKey) === 'true'; } catch {}
  completed ? navigate('menu') : beginCampaign();
});
$('#campaign-next').addEventListener('click', () => { campaignIndex += 1; renderCampaignQuestion(); });
$('#result-menu').addEventListener('click', () => navigate('menu'));
$('#result-retry').addEventListener('click', beginCampaign);
$('#menu-review').addEventListener('click', beginCampaign);
$('#menu-reset').addEventListener('click', () => {
  try { localStorage.removeItem(campaignKey); } catch {}
  beginCampaign();
});
document.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click', () => beginQuiz(button.dataset.difficulty)));
$('#game-next').addEventListener('click', () => { game.index += 1; game.answered = false; renderGameQuestion(); });
$('#game-report').addEventListener('click', finishQuiz);
$('#game-menu').addEventListener('click', () => { clearInterval(timerId); navigate('menu'); });
$('#report-menu').addEventListener('click', () => navigate('menu'));
$('#report-again').addEventListener('click', () => beginQuiz(game?.difficulty ?? 'facil'));
$('#sound-toggle').addEventListener('click', () => {
  muted = !muted;
  Object.values(audio).forEach((sound) => { sound.muted = muted; });
  $('#sound-toggle').textContent = muted ? 'ÁUDIO: MUDO' : 'ÁUDIO: ATIVO';
});
$('#opening-status').textContent = (() => {
  try { return localStorage.getItem(campaignKey) === 'true' ? 'REGISTRO LOCAL ENCONTRADO · CAMPANHA JÁ CONCLUÍDA' : 'CIRCULAR INTERNA Nº 7 · LEITURA OBRIGATÓRIA'; }
  catch { return 'CIRCULAR INTERNA Nº 7 · LEITURA OBRIGATÓRIA'; }
})();
