import './style.css';
import { createRound, campaignOutcome, scoreAnswer } from './core.js';

const $ = (selector) => document.querySelector(selector);
const screenIds = ['opening', 'campaign', 'campaign-result', 'menu', 'quiz', 'report'];
const campaignKey = 'ppquiz.campaign.v2';
const campaignResultKey = 'ppquiz.campaign.result.v1';
let roundStartedAt = 0;
let campaign = [];
let campaignIndex = 0;
let campaignCorrect = 0;
let game = null;
let questionStarted = 0;
let timerId = null;
let muted = false;
let keyboardOptions = null;
let keyboardSelection = -1;
let openingReady = false;
let openingTimer = null;
let typingTimer = null;
const audio = {};

function navigate(id) {
  const previous = document.querySelector('.screen.is-active');
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
      previous?.classList.remove('is-leaving');
    }, 80);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function play(key, volume = 0.35) {
  if (muted) return;
  const sources = {
    theme: 'assets-sounds/01. Glory to Arstotzka (Main Theme).mp3',
    foghorn: 'assets-sounds/09. Border Foghorn.mp3',
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
  keyboardOptions = container;
  keyboardSelection = -1;
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-option';
    button.dataset.optionIndex = String(index);
    button.setAttribute('aria-pressed', 'false');
    const key = document.createElement('span');
    key.className = 'option-key';
    key.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span');
    label.className = 'option-label';
    label.textContent = option;
    button.append(key, label);
    button.addEventListener('click', () => {
      keyboardSelection = -1;
      onAnswer(option);
    });
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
  panel.querySelector('.question-curiosity, #campaign-curiosity').textContent = question.curiosity || 'Registro complementar indisponível.';
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
    keyboardOptions = null;
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
  showCampaignResult(campaignCorrect, true);
}

function showCampaignResult(correct, persist = false) {
  const outcome = campaignOutcome(correct);
  if (persist) {
    try {
      localStorage.setItem(campaignKey, 'true');
      localStorage.setItem(campaignResultKey, JSON.stringify({ correct, outcome }));
    } catch {}
  }
  const plaqueByOutcome = {
    distinction: 'assets/papers/PlaqueOneInner.png',
    pass: 'assets/papers/PlaqueTwoInner.png',
    retry: 'assets/papers/CitationInner.png'
  };
  const plaque = plaqueByOutcome[outcome];
  $('#result-plaque').src = plaque;
  $('#result-plaque').alt = outcome === 'distinction' ? 'Placa de distinção' : outcome === 'pass' ? 'Placa de aprovação' : 'Citação por desempenho insatisfatório';
  $('#result-score').textContent = `${correct} / 10 ACERTOS`;
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
  roundStartedAt = performance.now();
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
  renderOptions($('#game-options'), question, () => {}, answer ?? '__TIMEOUT__');
  keyboardOptions = null;
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
  const elapsedSeconds = Math.max(0, Math.floor((performance.now() - roundStartedAt) / 1000));
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedRemainder = elapsedSeconds % 60;
  $('#report-score').textContent = `${game.points} PTS`;
  $('#report-summary').textContent = `${game.correct} acertos em 10 documentos · melhor sequência: ${game.bestStreak}`;
  const list = $('#report-errors');
  list.replaceChildren();
  const filerErrors = $('#report-filer-errors');
  [list, filerErrors].forEach((target) => {
    target.replaceChildren();
    if (!game.errors.length) {
      const item = document.createElement('li');
      item.textContent = 'Nenhuma discrepância registrada. O Ministério agradece sua precisão.';
      target.append(item);
    } else {
      game.errors.forEach((error) => {
        const item = document.createElement('li');
        item.textContent = error.city + ': ' + error.answered + ' · correto: ' + error.expected;
        target.append(item);
      });
    }
  });

  const stats = [
    ['Modo', game.difficulty.toUpperCase()],
    ['Acertos', game.correct + ' / 10'],
    ['Erros', game.errors.length],
    ['Streak máximo', game.bestStreak]
  ];
  if (game.difficulty !== 'facil') {
    stats.push(['Pontuação final', game.points]);
    stats.push(['Tempo total', elapsedMinutes + 'm ' + String(elapsedRemainder).padStart(2, '0') + 's']);
  }
  if (game.difficulty === 'dificil') stats.push(['Penalidades', '-' + (game.errors.length * 50) + ' pts']);
  const statsList = $('#report-filer-stats');
  statsList.replaceChildren();
  stats.forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'filer-stat';
    const name = document.createElement('span');
    name.className = 'filer-stat-label';
    name.textContent = label;
    const result = document.createElement('strong');
    result.className = 'filer-stat-value';
    result.textContent = String(value);
    item.append(name, result);
    statsList.append(item);
  });
  $('#filer-open').hidden = false;
  $('#filer-expanded').hidden = true;
  navigate('report');
}

const openingText = `Ministério da Admissão — Circular Interna Nº 7

Todo inspetor de fronteira deve demonstrar conhecimento geográfico básico antes de assumir o posto.

Você foi designado ao Posto Fronteiriço de Grestin. Sua participação é compulsória — você foi selecionado pela Loteria do Trabalho de Outubro de 1982 e não pode recusar esta designação.

Antes de assumir suas funções, deve provar noções aceitáveis dos países que fazem fronteira com Arstotzka.

Este teste é obrigatório. Resultados serão arquivados.

Glória a Arstotzka.`;

function startOpeningSequence() {
  const text = $('#opening-text');
  const instruction = $('#opening-instruction');
  text.textContent = '';
  instruction.textContent = '';
  openingReady = false;
  window.clearTimeout(openingTimer);
  window.clearInterval(typingTimer);
  openingTimer = window.setTimeout(() => {
    play('foghorn', 0.3);
    let index = 0;
    typingTimer = window.setInterval(() => {
      text.textContent += openingText[index] ?? '';
      index += 1;
      if (index >= openingText.length) {
        window.clearInterval(typingTimer);
        openingReady = true;
        instruction.textContent = '[ clique ou pressione ENTER para continuar ]';
      }
    }, 30);
  }, 1000);
}

function continueFromOpening() {
  if (!openingReady) return;
  window.clearInterval(typingTimer);
  play('page', 0.3);
  play('theme', 0.2);
  let completed = false;
  try { completed = localStorage.getItem(campaignKey) === 'true'; } catch {}
  completed ? navigate('menu') : beginCampaign();
}

$('#opening').addEventListener('click', continueFromOpening);
$('#campaign-next').addEventListener('click', () => { campaignIndex += 1; renderCampaignQuestion(); });
$('#result-menu').addEventListener('click', () => navigate('menu'));
$('#result-retry').addEventListener('click', beginCampaign);
function reviewCampaign() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(campaignResultKey) || 'null'); } catch {}
  if (saved && Number.isInteger(saved.correct)) {
    showCampaignResult(saved.correct, false);
    return;
  }
  $('#result-plaque').src = 'assets/papers/CitationInner.png';
  $('#result-plaque').alt = 'Registro de campanha concluída';
  $('#result-score').textContent = 'RESULTADO ANTERIOR NÃO DISPONÍVEL';
  $('#result-heading').textContent = 'CAMPANHA CONCLUÍDA';
  $('#result-message').textContent = 'Esta instalação registra que a campanha foi concluída, mas a versão anterior não salvava a pontuação. O histórico detalhado não pode ser recuperado.';
  $('#result-retry').hidden = true;
  navigate('campaign-result');
}
$('#menu-review').addEventListener('click', reviewCampaign);
$('#menu-reset').addEventListener('click', () => {
  try { localStorage.removeItem(campaignKey); localStorage.removeItem(campaignResultKey); } catch {}
  beginCampaign();
});
document.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click', () => beginQuiz(button.dataset.difficulty)));
$('#game-next').addEventListener('click', () => { game.index += 1; game.answered = false; renderGameQuestion(); });
$('#game-report').addEventListener('click', finishQuiz);
$('#game-menu').addEventListener('click', () => { clearInterval(timerId); navigate('menu'); });
$('#report-menu').addEventListener('click', () => navigate('menu'));
$('#report-again').addEventListener('click', () => beginQuiz(game?.difficulty ?? 'facil'));
$('#filer-open').addEventListener('click', () => {
  $('#filer-open').hidden = true;
  $('#filer-expanded').hidden = false;
  play('page', 0.25);
});
$('#filer-close').addEventListener('click', () => {
  $('#filer-expanded').hidden = true;
  $('#filer-open').hidden = false;
  play('page', 0.25);
});
$('#sound-toggle').addEventListener('click', () => {
  muted = !muted;
  Object.values(audio).forEach((sound) => { sound.muted = muted; });
  $('#sound-toggle').textContent = muted ? 'ÁUDIO: MUDO' : 'ÁUDIO: ATIVO';
});
startOpeningSequence();

window.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.key === 'Enter' && $('#opening').classList.contains('is-active')) {
    event.preventDefault();
    continueFromOpening();
    return;
  }
  const campaignActive = $('#campaign').classList.contains('is-active');
  const quizActive = $('#quiz').classList.contains('is-active');
  if (!campaignActive && !quizActive) return;
  if (event.key === 'Enter' && !keyboardOptions) {
    const next = campaignActive ? $('#campaign-next') : $('#game-next');
    if (!next.hidden && !next.disabled) {
      event.preventDefault();
      next.click();
    }
    return;
  }
  if (!keyboardOptions) return;
  const buttons = [...keyboardOptions.querySelectorAll('.answer-option:not(:disabled)')];
  if (!buttons.length) return;
  if (/^[1-4]$/.test(event.key)) {
    const index = Number(event.key) - 1;
    if (!buttons[index]) return;
    event.preventDefault();
    keyboardSelection = index;
    keyboardOptions.querySelectorAll('.answer-option').forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.classList.toggle('is-keyboard-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  } else if (event.key === 'Enter' && keyboardSelection >= 0) {
    const selected = keyboardOptions.querySelector(`.answer-option[data-option-index="${keyboardSelection}"]`);
    if (selected && !selected.disabled) {
      event.preventDefault();
      selected.click();
    }
  }
});

window.addEventListener('beforeunload', () => {
  window.clearTimeout(openingTimer);
  window.clearInterval(typingTimer);
  clearInterval(timerId);
});
