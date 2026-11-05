import './style.css';
import { createRound, campaignOutcome, scoreAnswer } from './core.js';

const $ = (selector) => document.querySelector(selector);
const screenIds = ['opening', 'interview', 'registration', 'orientation', 'campaign', 'campaign-result', 'designation', 'menu', 'quiz', 'report'];
const campaignKey = 'ppquiz.campaign.v3';
const campaignResultKey = 'ppquiz.campaign.result.v2';
const profileKey = 'ppquiz.inspector.profile.v1';
const audioSettingsKey = 'ppquiz.audio.settings.v1';
let interviewIndex = 0;
let interviewAnswers = [];
let inspectorProfile = null;
let roundStartedAt = 0;
let campaign = [];
let campaignIndex = 0;
let campaignCorrect = 0;
let game = null;
let questionStarted = 0;
let timerId = null;
const defaultAudioSettings = { muted: false, musicEnabled: true, effectsEnabled: true, musicVolume: 0.8, effectsVolume: 1 };
let audioSettings = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(audioSettingsKey) || 'null');
    return saved && typeof saved === 'object' ? { ...defaultAudioSettings, ...saved } : { ...defaultAudioSettings };
  } catch {
    return { ...defaultAudioSettings };
  }
})();
let keyboardOptions = null;
let keyboardSelection = -1;
let openingReady = false;
let reviewingCampaign = false;
let openingTimer = null;
let typingTimer = null;
const audio = {};

function navigate(id) {
  const previous = document.querySelector('.screen.is-active');
  document.body.classList.toggle('is-opening', id === 'opening');
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

function persistAudioSettings() {
  try { localStorage.setItem(audioSettingsKey, JSON.stringify(audioSettings)); } catch {}
}

function updateAudioSettingsUI() {
  $('#sound-toggle').textContent = audioSettings.muted ? 'ÁUDIO: MUDO' : 'ÁUDIO: ATIVO';
  $('#sound-toggle').setAttribute('aria-pressed', String(audioSettings.muted));
  $('#music-enabled').checked = audioSettings.musicEnabled;
  $('#effects-enabled').checked = audioSettings.effectsEnabled;
  $('#music-volume').value = String(audioSettings.musicVolume);
  $('#effects-volume').value = String(audioSettings.effectsVolume);
  Object.entries(audio).forEach(([key, sound]) => {
    sound.muted = audioSettings.muted;
    const factor = key === 'theme' ? audioSettings.musicVolume : audioSettings.effectsVolume;
    sound.volume = (sound.baseVolume ?? 0.35) * factor;
    if (key === 'theme' && !audioSettings.musicEnabled) sound.pause();
  });
}

function play(key, volume = 0.35) {
  if (audioSettings.muted) return;
  if (key === 'theme' ? !audioSettings.musicEnabled : !audioSettings.effectsEnabled) return;
  const sources = {
    theme: 'assets-sounds/01. Glory to Arstotzka (Main Theme).mp3',
    foghorn: 'assets-sounds/09. Border Foghorn.mp3',
    stamp: 'assets-sounds/70. Stamp Down.mp3',
    page: 'assets-sounds/52. Paper Turnpage0.mp3',
    hover: 'assets-sounds/32. Inspect Highlight.mp3',
    inspectOpen: 'assets-sounds/34. Inspect Open.mp3',
    filerOpen: 'assets-sounds/26. Filer Open.mp3',
    filerClose: 'assets-sounds/25. Filer Close.mp3'
  };
  if (!audio[key]) {
    if (!sources[key]) return;
    audio[key] = new Audio(sources[key]);
  }
  const sound = audio[key];
  sound.baseVolume = volume;
  const factor = key === 'theme' ? audioSettings.musicVolume : audioSettings.effectsVolume;
  sound.volume = volume * factor;
  sound.muted = false;
  sound.loop = key === 'theme';
  sound.currentTime = 0;
  sound.play().catch((error) => {
    console.warn(`[T.G.I.F. áudio] Falha ao reproduzir "${key}" (${sources[key]}).`, error);
  });
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

const interviewQuestions = [
  { question: 'Por que acredita estar apto a servir no posto de Grestin?', context: 'O Ministério procura candidatos capazes de seguir procedimentos sob pressão.', options: ['Tenho facilidade em seguir regulamentos.', 'Considero o serviço uma obrigação do Estado.', 'Preciso de estabilidade e moradia.'], feedback: ['Uma resposta objetiva. O cumprimento de normas será observado.', 'O dever cívico foi devidamente registrado.', 'O Ministério oferece alojamento funcional aos servidores designados.'] },
  { question: 'Como reagiria diante de um documento cuja procedência desconhece?', context: 'A fronteira exige atenção, disciplina e consulta aos registros oficiais.', options: ['Consultaria o manual e os registros disponíveis.', 'Decidiria com base na experiência pessoal.', 'Solicitaria orientação ao supervisor.'], feedback: ['Procedimento adequado. A consulta é preferível à suposição.', 'A experiência não substitui os regulamentos oficiais.', 'A supervisão está disponível para casos excepcionais.'] },
  { question: 'Compreende que a designação para Grestin é compulsória?', context: 'A loteria de trabalho determina a alocação inicial dos servidores.', options: ['Compreendo. Cumprirei a designação.', 'Tenho reservas, mas compreendo.', 'Solicito que a decisão seja reconsiderada.'], feedback: ['Declaração registrada. Prossigamos com o cadastro.', 'As reservas foram anotadas sem efeito sobre a designação.', 'O pedido será arquivado. A designação permanece vigente.'] }
];

function beginInterview() {
  interviewIndex = 0;
  interviewAnswers = [];
  renderInterviewQuestion();
  navigate('interview');
}

function renderInterviewQuestion() {
  const item = interviewQuestions[interviewIndex];
  $('#interview-question').textContent = item.question;
  $('#interview-context').textContent = item.context;
  $('#interview-feedback').textContent = '';
  $('#interview-next').hidden = true;
  const options = $('#interview-options');
  options.replaceChildren();
  item.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'interview-option';
    button.textContent = option;
    button.addEventListener('click', () => {
      [...options.children].forEach((entry) => { entry.disabled = true; });
      interviewAnswers.push(index);
      $('#interview-feedback').textContent = item.feedback[index];
      $('#interview-next').hidden = false;
      $('#interview-next').textContent = interviewIndex === interviewQuestions.length - 1 ? 'Concluir entrevista →' : 'Próxima pergunta →';
      play('inspectOpen', 0.18);
    });
    options.append(button);
  });
}

function createInspectorProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey) || 'null');
    if (saved?.code) return saved;
  } catch {}
  const serial = Math.floor(100000 + Math.random() * 900000);
  return { name: '', code: `AR-82-${serial}`, createdAt: '1982-10-04', interview: [] };
}

function prepareRegistration() {
  inspectorProfile = createInspectorProfile();
  $('#candidate-code').textContent = inspectorProfile.code;
  $('#candidate-name').value = inspectorProfile.name || '';
  $('#registration-feedback').textContent = '';
  navigate('registration');
}

function saveRegistration() {
  const name = $('#candidate-name').value.trim().replace(/\s+/g, ' ');
  if (name.length < 2) {
    $('#registration-feedback').textContent = 'INFORME UM NOME COM PELO MENOS DOIS CARACTERES.';
    $('#registration-feedback').className = 'feedback-row is-error';
    $('#candidate-name').focus();
    return;
  }
  inspectorProfile = { ...inspectorProfile, name, interview: interviewAnswers };
  try { localStorage.setItem(profileKey, JSON.stringify(inspectorProfile)); } catch {}
  $('#registration-feedback').textContent = 'REGISTRO ACEITO. IDENTIFICAÇÃO FUNCIONAL EMITIDA.';
  $('#registration-feedback').className = 'feedback-row is-success';
  $('#designation-name').textContent = name;
  $('#designation-code').textContent = inspectorProfile.code;
  window.setTimeout(() => navigate('orientation'), 350);
}

function showDesignation() {
  try { inspectorProfile = JSON.parse(localStorage.getItem(profileKey) || 'null'); } catch {}
  $('#designation-name').textContent = inspectorProfile?.name || 'Servidor não identificado';
  $('#designation-code').textContent = inspectorProfile?.code || 'AR-82-PENDENTE';
  navigate('designation');
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
  $('#result-plaque').hidden = false;
  $('.result-layout').classList.remove('is-legacy');
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
      : 'Seu desempenho ficou abaixo do padrão. A supervisão registrou ressalvas. Consulte o manual e aguarde as instruções de M. Vonel.';
  $('#result-retry').hidden = true;
  $('#result-menu').textContent = 'Consultar ordem de designação →';
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

Antes de assumir suas funções, deve demonstrar conhecimentos geográficos básicos sobre os países e as cidades da região.

Este teste é obrigatório. Resultados serão arquivados.

Glória a Arstotzka.`

function startOpeningSequence() {
  const text = $('#opening-text');
  const instruction = $('#opening-instruction');
  text.textContent = '';
  instruction.textContent = '';
  openingReady = false;
  window.clearTimeout(openingTimer);
  window.clearInterval(typingTimer);
  openingTimer = window.setTimeout(() => {
    // A abertura aguarda a primeira interação para evitar bloqueios de autoplay.
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
  play('page', 0.24);
  play('theme', 0.14);
  if (reviewingCampaign) {
    reviewingCampaign = false;
    showSavedCampaignResult();
    return;
  }
  let completed = false;
  try { completed = localStorage.getItem(campaignKey) === 'true'; } catch {}
  completed ? navigate('menu') : beginInterview();
}

$('#opening').addEventListener('click', continueFromOpening);
$('#interview-next').addEventListener('click', () => { interviewIndex += 1; if (interviewIndex < interviewQuestions.length) renderInterviewQuestion(); else prepareRegistration(); });
$('#registration-submit').addEventListener('click', saveRegistration);
$('#candidate-name').addEventListener('keydown', (event) => { if (event.key === 'Enter') saveRegistration(); });
$('#orientation-start').addEventListener('click', beginCampaign);
$('#designation-enter').addEventListener('click', () => navigate('menu'));
$('#campaign-next').addEventListener('click', () => { campaignIndex += 1; renderCampaignQuestion(); });
$('#result-menu').addEventListener('click', () => showDesignation());
$('#result-retry').addEventListener('click', beginCampaign);
function showSavedCampaignResult() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(campaignResultKey) || 'null'); } catch {}
  if (saved && Number.isInteger(saved.correct)) {
    showCampaignResult(saved.correct, false);
    return;
  }
  $('#result-plaque').hidden = true;
  $('.result-layout').classList.add('is-legacy');
  $('#result-score').textContent = 'RESULTADO ANTERIOR NÃO DISPONÍVEL';
  $('#result-heading').textContent = 'CAMPANHA CONCLUÍDA';
  $('#result-message').textContent = 'Esta instalação registra que a campanha foi concluída, mas a versão anterior não salvava a pontuação. O histórico detalhado não pode ser recuperado.';
  $('#result-retry').hidden = true;
  navigate('campaign-result');
}

function reviewCampaign() {
  reviewingCampaign = true;
  navigate('opening');
  document.body.classList.add('is-opening');
startOpeningSequence();
}
$('#menu-review').addEventListener('click', reviewCampaign);
$('#menu-reset').addEventListener('click', () => beginQuiz('facil'));
document.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click', () => beginQuiz(button.dataset.difficulty)));
$('#game-next').addEventListener('click', () => { game.index += 1; game.answered = false; renderGameQuestion(); });
$('#game-report').addEventListener('click', finishQuiz);
$('#game-menu').addEventListener('click', () => { clearInterval(timerId); navigate('menu'); });
$('#report-menu').addEventListener('click', () => navigate('menu'));
$('#report-again').addEventListener('click', () => beginQuiz(game?.difficulty ?? 'facil'));
$('#filer-open').addEventListener('click', () => {
  $('#filer-open').hidden = true;
  $('#filer-expanded').hidden = false;
  play('filerOpen', 0.32);
});
$('#filer-close').addEventListener('click', () => {
  $('#filer-expanded').hidden = true;
  $('#filer-open').hidden = false;
  play('filerClose', 0.32);
});
$('#sound-toggle').addEventListener('click', () => {
  audioSettings.muted = !audioSettings.muted;
  persistAudioSettings();
  updateAudioSettingsUI();
});
$('#music-enabled').addEventListener('change', (event) => {
  audioSettings.musicEnabled = event.target.checked;
  persistAudioSettings();
  updateAudioSettingsUI();
  if (audioSettings.musicEnabled && audio.theme?.paused && !audioSettings.muted) {
    play('theme', audio.theme.baseVolume ?? 0.14);
  }
});
$('#effects-enabled').addEventListener('change', (event) => {
  audioSettings.effectsEnabled = event.target.checked;
  persistAudioSettings();
});
$('#music-volume').addEventListener('input', (event) => {
  audioSettings.musicVolume = Number(event.target.value);
  persistAudioSettings();
  updateAudioSettingsUI();
});
$('#effects-volume').addEventListener('input', (event) => {
  audioSettings.effectsVolume = Number(event.target.value);
  persistAudioSettings();
  updateAudioSettingsUI();
});
updateAudioSettingsUI();
startOpeningSequence();

window.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.key === 'Enter' && $('#opening').classList.contains('is-active')) {
    event.preventDefault();
    continueFromOpening();
    return;
  }
  if (event.key === 'Enter' && $('#interview').classList.contains('is-active')) { const next = $('#interview-next'); if (!next.hidden) next.click(); return; }
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
