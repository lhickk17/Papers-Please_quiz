import './style.css';
import { createRound, campaignOutcome, scoreAnswer, classifyScore, applyScoreDelta } from './core.js';

const $ = (selector) => document.querySelector(selector);
const screenIds = ['opening', 'interview', 'registration', 'orientation', 'campaign', 'campaign-result', 'designation', 'menu', 'profile', 'quiz', 'report'];
const campaignKey = 'ppquiz.campaign.v3';
const campaignResultKey = 'ppquiz.campaign.result.v2';
const playerProfileKey = 'ppquiz.player.profile.v1';
const legacyProfileKey = 'ppquiz.inspector.profile.v1';
const audioSettingsKey = 'ppquiz.audio.settings.v1';
const reportSequenceKey = 'ppquiz.report.sequence.v1';
let interviewIndex = 0;
let interviewAnswers = [];
let playerProfile = null;
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
let filerCloseTimer = null;
let typingTimer = null;
let shiftIntroTimer = null;
let shiftIntroIndex = 0;
let shiftIntroCallback = null;
const audio = {};

const ministryBulletins = [
  { number: 'CIRCULAR 014/82', title: 'PONTUALIDADE É OBRIGAÇÃO', text: 'A administração recorda que o horário de apresentação ao posto deve ser rigorosamente observado. Justificativas pessoais não serão consideradas em caso de atraso.' },
  { number: 'AVISO 022/82', title: 'DOCUMENTOS EM ORDEM', text: 'Foram identificadas tentativas de ingresso com registros incompletos em postos da região. Reforce a conferência de nomes, cidades e países de emissão.' },
  { number: 'MEMORANDO 031/82', title: 'ECONOMIA DE RECURSOS', text: 'O consumo de papel, tinta e material de escritório será monitorado. Formulários inutilizados deverão ser justificados à supervisão.' },
  { number: 'CIRCULAR 037/82', title: 'LEALDADE INSTITUCIONAL', text: 'Funcionários devem comunicar à supervisão qualquer abordagem não autorizada que envolva documentos internos, rotas de serviço ou procedimentos de fronteira.' },
  { number: 'BOLETIM 041/82', title: 'RUMORES NA FRONTEIRA', text: 'Relatos não confirmados mencionam movimentações de grupos clandestinos nas proximidades. O Ministério solicita discrição e recomenda que nenhum funcionário conduza investigações por iniciativa própria.' },
  { number: 'AVISO 046/82', title: 'RECONHECIMENTO DE SERVIÇO', text: 'A Diretoria informa que sequências consistentes de inspeções corretas serão consideradas nos registros de desempenho. A excelência individual fortalece a República.' },
  { number: 'MEMORANDO 052/82', title: 'REVISÃO DE PROCEDIMENTOS', text: 'Inspetores devem consultar periodicamente o regulamento vigente. Alegar desconhecimento de uma instrução publicada não constitui justificativa administrativa.' },
  { number: 'CIRCULAR 058/82', title: 'REGISTRO DE IRREGULARIDADES', text: 'Toda divergência documental deverá ser registrada antes do encerramento do atendimento. A omissão de ocorrências será considerada falha funcional.' },
  { number: 'MEMORANDO 063/82', title: 'DEVER CÍVICO', text: 'O compromisso com a República não termina ao final do expediente. A vigilância constitui responsabilidade compartilhada por todos os cidadãos.' },
  { number: 'AVISO 067/82', title: 'CONSERVAÇÃO DO POSTO', text: 'Equipamentos, mobiliário e materiais de consulta devem permanecer em condições adequadas de uso. Danos deverão ser comunicados imediatamente à supervisão.' },
  { number: 'BOLETIM 071/82', title: 'SEGURANÇA INTERNA', text: 'Foram recebidos relatos de atividades não autorizadas nas proximidades da fronteira. Inspetores devem comunicar comportamentos suspeitos pelos canais oficiais.' },
  { number: 'CIRCULAR 076/82', title: 'RELAÇÕES EXTERIORES', text: 'A administração acompanha com atenção os recentes acontecimentos envolvendo nações vizinhas. Os procedimentos de inspeção permanecem inalterados até nova determinação.' },
  { number: 'MEMORANDO 082/82', title: 'PRODUTIVIDADE FUNCIONAL', text: 'O desempenho dos postos será submetido a revisão periódica. A eficiência individual contribui diretamente para a estabilidade nacional.' },
  { number: 'AVISO 089/82', title: 'IDENTIFICAÇÃO OBRIGATÓRIA', text: 'Todos os funcionários devem portar sua identificação funcional durante o expediente. O acesso a áreas administrativas poderá ser negado na ausência do registro.' },
  { number: 'CIRCULAR 094/82', title: 'COMUNICAÇÃO COM A SUPERVISÃO', text: 'Dúvidas sobre procedimentos devem ser encaminhadas ao superior responsável. Iniciativas individuais que contrariem as instruções vigentes poderão resultar em advertência.' },
  { number: 'BOLETIM 101/82', title: 'CONTROLE DE MOVIMENTAÇÃO', text: 'A circulação de pessoas nas áreas restritas do posto será acompanhada com maior rigor. Visitantes deverão apresentar autorização antes de ultrapassar os limites demarcados.' },
  { number: 'MEMORANDO 108/82', title: 'ARQUIVAMENTO DE DOCUMENTOS', text: 'Registros de inspeção devem ser organizados ao término de cada turno. Documentos extraviados ou armazenados incorretamente deverão ser comunicados.' },
  { number: 'AVISO 113/82', title: 'ATENÇÃO AOS PROCEDIMENTOS', text: 'A pressa não constitui justificativa para a conferência incompleta. Verifique todos os campos exigidos antes de concluir uma inspeção.' },
  { number: 'CIRCULAR 119/82', title: 'ESTABILIDADE NACIONAL', text: 'A manutenção da ordem nas fronteiras depende da cooperação entre os setores. O Ministério espera disciplina, discrição e cumprimento integral das determinações.' },
  { number: 'BOLETIM 124/82', title: 'INFORMAÇÕES NÃO CONFIRMADAS', text: 'A circulação de rumores sobre alterações nas regras de entrada tem provocado dúvidas entre funcionários. Somente comunicados oficiais possuem validade administrativa.' }
];;

function showMinistryBulletin() {
  const bulletin = $('#ministry-bulletin');
  if (!bulletin) return;
  let previous = -1;
  try { previous = Number(sessionStorage.getItem('ppquiz.last.bulletin') ?? -1); } catch {}
  let index = Math.floor(Math.random() * ministryBulletins.length);
  if (ministryBulletins.length > 1 && index === previous) index = (index + 1 + Math.floor(Math.random() * (ministryBulletins.length - 1))) % ministryBulletins.length;
  const item = ministryBulletins[index];
  try { sessionStorage.setItem('ppquiz.last.bulletin', String(index)); } catch {}
  $('#menu-bulletin-number').textContent = item.number;
  $('#menu-bulletin-title').textContent = item.title;
  $('#menu-bulletin-text').textContent = item.text;
}

const scoreRegimes = {
  facil: {
    kicker: '01 / ADAPTAÇÃO',
    title: 'Treinamento',
    overview: 'Pontuação sem limite de tempo.',
    rules: [
      'Acerto: +100 pontos.',
      'Acerto em até 5 segundos: +20 pontos adicionais.',
      'Erro: 0 ponto.',
      'Sequência de acertos: contabilizada, sem bônus.',
      'Não há timeout.'
    ],
    comparison: 'Diferenças: não há cronômetro nem penalidade por erro. O bônus de velocidade é o único bônus adicional.'
  },
  normal: {
    kicker: '02 / PROTOCOLO PADRÃO',
    title: 'Serviço Regular',
    overview: 'Limite de 8 segundos por questão.',
    rules: [
      'Acerto: +100 pontos.',
      'Acerto em até 4 segundos: +20 pontos adicionais.',
      'Bônus por sequência: 3º acerto +10; 4º–5º +20; 6º–7º +30; 8º–9º +40; a partir do 10º +50 por acerto.',
      'Erro: −25 pontos. Timeout: −50 pontos.',
      'Erro ou timeout zera a sequência.'
    ],
    comparison: 'Diferenças: em relação ao Treinamento, adiciona cronômetro, penalidades e bônus de sequência. Em relação ao Regime de Exceção, concede 3 segundos a mais e aplica descontos menores.'
  },
  dificil: {
    kicker: '03 / INSPEÇÃO RIGOROSA',
    title: 'Regime de Exceção',
    overview: 'Limite de 5 segundos por questão.',
    rules: [
      'Acerto: +100 pontos.',
      'Acerto em até 2,5 segundos: +20 pontos adicionais.',
      'Bônus por sequência: 3º acerto +10; 4º–5º +20; 6º–7º +30; 8º–9º +40; a partir do 10º +50 por acerto.',
      'Erro: −50 pontos. Timeout: −75 pontos.',
      'Erro ou timeout zera a sequência.'
    ],
    comparison: 'Diferenças: em relação ao Serviço Regular, reduz o limite em 3 segundos e dobra a penalidade por erro, além de elevar o desconto por timeout em 25 pontos.'
  }
};

function openScoreRegime(difficulty, trigger) {
  const regime = scoreRegimes[difficulty] ?? scoreRegimes.facil;
  const modal = $('#score-regulation-modal');
  $('#score-modal-kicker').textContent = regime.kicker;
  $('#score-modal-title').textContent = regime.title;
  $('#score-modal-overview').textContent = regime.overview;
  $('#score-modal-rules').replaceChildren();
  regime.rules.forEach((rule) => {
    const item = document.createElement('li');
    item.textContent = rule;
    $('#score-modal-rules').append(item);
  });
  $('#score-modal-comparison').textContent = regime.comparison;
  modal.hidden = false;
  document.body.classList.add('score-modal-open');
  modal.dataset.returnFocus = trigger?.dataset.scoreRegime ?? difficulty;
  $('#score-modal-close')?.focus();
  modal.querySelector('.score-modal-close').focus();
}

function closeScoreRegulation() {
  const modal = $('#score-regulation-modal');
  if (modal.hidden) return;
  const previousRegime = modal.dataset.returnFocus;
  modal.hidden = true;
  document.body.classList.remove('score-modal-open');
  document.querySelector(`[data-score-regime="${previousRegime}"]`)?.focus();
}

function navigate(id) {
  const target = document.getElementById(id);
  if (!target) return;
  if (id === 'menu') showMinistryBulletin();

  document.body.classList.toggle('is-opening', id === 'opening');

  screenIds.forEach((key) => {
    const screen = document.getElementById(key);
    const active = key === id;
    screen.classList.toggle('is-active', active);
    screen.setAttribute('aria-hidden', String(!active));
    screen.inert = !active;
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const shiftIntroStages = [
  { status: 'ETAPA 01 / 04', title: 'Preparação do posto', detail: 'Verificando equipamentos, iluminação e canais de comunicação.', duration: 2000 },
  { status: 'ETAPA 02 / 04', title: 'Identificação confirmada', detail: 'Posto fronteiriço de Grestin · República de Arstotzka · 04 OUT 1982.', duration: 2000 },
  { status: 'ETAPA 03 / 04', title: 'Primeiro documento recebido', detail: 'Um novo registro foi encaminhado à mesa de inspeção.', duration: 2000 },
  { status: 'ETAPA 04 / 04', title: 'Posto em operação', detail: 'Estação pronta. A inspeção será iniciada.', duration: 2000 }
];

function renderShiftIntroStage() {
  const stage = shiftIntroStages[shiftIntroIndex];
  const intro = $('#shift-intro');
  intro.dataset.step = String(shiftIntroIndex + 1);
  $('#shift-intro-status').textContent = stage.status;
  $('#shift-intro-title').textContent = stage.title;
  $('#shift-intro-detail').textContent = stage.detail;
  [...$('#shift-intro-progress').children].forEach((item, index) => {
    item.classList.toggle('is-complete', index < shiftIntroIndex);
    item.classList.toggle('is-current', index === shiftIntroIndex);
  });
}

function finishShiftIntro() {
  window.clearTimeout(shiftIntroTimer);
  const intro = $('#shift-intro');
  if (intro.hidden || intro.classList.contains('is-closing')) return;
  intro.classList.add('is-closing');
  shiftIntroTimer = window.setTimeout(() => {
    shiftIntroTimer = null;
    intro.hidden = true;
    intro.classList.remove('is-closing');
    intro.removeAttribute('data-step');
    document.body.classList.remove('is-shift-intro');
    $('main').inert = false;
    $('header').inert = false;
    $('footer').inert = false;
    const callback = shiftIntroCallback;
    shiftIntroCallback = null;
    if (callback) callback();
  }, 320);
}

function scheduleShiftIntroStage() {
  const stage = shiftIntroStages[shiftIntroIndex];
  shiftIntroTimer = window.setTimeout(() => {
    if (shiftIntroIndex >= shiftIntroStages.length - 1) {
      finishShiftIntro();
      return;
    }
    shiftIntroIndex += 1;
    renderShiftIntroStage();
    scheduleShiftIntroStage();
  }, stage.duration);
}

function startShiftIntro(onComplete) {
  window.clearTimeout(shiftIntroTimer);
  shiftIntroCallback = onComplete;
  shiftIntroIndex = 0;
  $('main').inert = true;
  $('header').inert = true;
  $('footer').inert = true;
  document.body.classList.add('is-shift-intro');
  $('#shift-intro').classList.remove('is-closing');
  $('#shift-intro').hidden = false;
  renderShiftIntroStage();
  $('#shift-intro-skip').focus();
  scheduleShiftIntroStage();
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
    if (key !== 'theme' && !audioSettings.effectsEnabled) sound.pause();
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

function createPlayerProfile() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(playerProfileKey) || localStorage.getItem(legacyProfileKey) || 'null'); } catch {}
  const serial = Math.floor(100000 + Math.random() * 900000);
  const defaults = {
    name: '', code: `AR-82-${serial}`, createdAt: '1982-10-04', interview: [],
    sex: '', nationality: '', maritalStatus: '', dependents: '0',
    previousOccupation: '', stats: { rounds: 0, correct: 0, questions: 0, bestScore: 0, bestStreak: 0 },
    history: []
  };
  if (!saved || typeof saved !== 'object' || !saved.code) return defaults;
  try { if (!localStorage.getItem(playerProfileKey)) localStorage.setItem(playerProfileKey, JSON.stringify(saved)); } catch {}
  return {
    ...defaults, ...saved,
    stats: { ...defaults.stats, ...(saved.stats || {}) },
    history: Array.isArray(saved.history) ? saved.history : [],
    interview: Array.isArray(saved.interview) ? saved.interview : []
  };
}

function persistPlayerProfile() {
  try { localStorage.setItem(playerProfileKey, JSON.stringify(playerProfile)); } catch {}
}

function prepareRegistration() {
  playerProfile = createPlayerProfile();
  $('#candidate-code').textContent = playerProfile.code;
  $('#candidate-name').value = playerProfile.name || '';
  $('#candidate-sex').value = playerProfile.sex || '';
  $('#candidate-nationality').value = playerProfile.nationality || '';
  $('#candidate-marital-status').value = playerProfile.maritalStatus || '';
  $('#candidate-dependents').value = playerProfile.dependents ?? '0';
  $('#candidate-occupation').value = playerProfile.previousOccupation || '';
  $('#registration-submit').textContent = playerProfile.name ? 'Confirmar registro →' : 'Assinar e registrar →';
  $('#registration-feedback').textContent = '';
  $('#registration-feedback').className = 'feedback-row';
  navigate('registration');
}

function saveRegistration() {
  const name = $('#candidate-name').value.trim().replace(/\s+/g, ' ');
  const requiredFields = [
    ['candidate-sex', 'SELECIONE O SEXO DECLARADO.'],
    ['candidate-nationality', 'SELECIONE A NACIONALIDADE.'],
    ['candidate-marital-status', 'INFORME O ESTADO CIVIL.']
  ];
  if (name.length < 2) {
    $('#registration-feedback').textContent = 'INFORME UM NOME COM PELO MENOS DOIS CARACTERES.';
    $('#registration-feedback').className = 'feedback-row is-error';
    $('#candidate-name').focus();
    return;
  }
  for (const [id, message] of requiredFields) {
    if (!$('#' + id).value) {
      $('#registration-feedback').textContent = message;
      $('#registration-feedback').className = 'feedback-row is-error';
      $('#' + id).focus();
      return;
    }
  }
  playerProfile = {
    ...createPlayerProfile(), ...playerProfile, name,
    sex: $('#candidate-sex').value,
    nationality: $('#candidate-nationality').value,
    maritalStatus: $('#candidate-marital-status').value,
    dependents: $('#candidate-dependents').value,
    previousOccupation: $('#candidate-occupation').value,
    interview: interviewAnswers.length ? interviewAnswers : (playerProfile?.interview || [])
  };
  persistPlayerProfile();
  $('#registration-feedback').textContent = 'DECLARAÇÕES REGISTRADAS. O MINISTÉRIO AGRADECE A COLABORAÇÃO.';
  $('#registration-feedback').className = 'feedback-row is-success';
  $('#designation-name').textContent = name;
  $('#designation-code').textContent = playerProfile.code;
  window.setTimeout(() => navigate('orientation'), 350);
}

function showDesignation() {
  try { playerProfile = JSON.parse(localStorage.getItem(playerProfileKey) || localStorage.getItem(legacyProfileKey) || 'null'); } catch {}
  $('#designation-name').textContent = playerProfile?.name || 'Servidor não identificado';
  $('#designation-code').textContent = playerProfile?.code || 'AR-82-PENDENTE';
  navigate('designation');
}

function beginCampaign() {
  campaign = createRound(10);
  campaignIndex = 0;
  campaignCorrect = 0;
  navigate('campaign');
  startShiftIntro(() => renderCampaignQuestion());
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
  game = {
    difficulty, questions: createRound(10), index: 0, correct: 0, points: 0,
    streak: 0, bestStreak: 0, errors: [], timeouts: 0,
    totalPenalties: 0, streakBonusTotal: 0, speedBonusTotal: 0,
    answered: false
  };
  navigate('quiz');
  startShiftIntro(() => {
    roundStartedAt = performance.now();
    renderGameQuestion();
  });
}

function renderGameQuestion() {
  clearInterval(timerId);
  if (!game || game.index >= game.questions.length) return finishQuiz();
  const question = game.questions[game.index];
  questionStarted = performance.now();
  const limit = game.difficulty === 'normal' ? 8 : game.difficulty === 'dificil' ? 5 : 0;
  $('#game-count').textContent = `DOCUMENTO ${String(game.index + 1).padStart(2, '0')} / 10`;
  $('#game-score').textContent = String(game.points).padStart(8, '0');
  $('#game-streak').textContent = String(game.streak);
  $('#game-timer').textContent = limit ? `${limit.toFixed(1)}s` : 'SEM LIMITE';
  $('#game-feedback').textContent = '';
  $('#game-score-popups').replaceChildren();
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

function showScoreBreakdown(scored, correct, timedOut) {
  const container = $('#game-score-popups');
  container.replaceChildren();
  const entries = correct
    ? [
        { points: 100, label: 'ACERTO', kind: 'positive' },
        ...(scored.speedBonus ? [{ points: scored.speedBonus, label: 'RESPOSTA RÁPIDA', kind: 'positive' }] : []),
        ...(scored.streakBonus ? [{ points: scored.streakBonus, label: `SEQUÊNCIA · ${scored.streak}º ACERTO`, kind: 'positive' }] : [])
      ]
    : [{
        points: scored.penalty,
        label: timedOut ? 'TEMPO ESGOTADO' : 'ERRO',
        kind: scored.penalty < 0 ? 'negative' : 'neutral'
      }];

  entries.forEach((entry, index) => {
    const popup = document.createElement('div');
    popup.className = `score-popup is-${entry.kind}`;
    popup.style.animationDelay = `${index * 90}ms`;
    const amount = document.createElement('strong');
    amount.textContent = `${entry.points > 0 ? '+' : entry.points < 0 ? '−' : ''}${Math.abs(entry.points)} PTS`;
    const reason = document.createElement('span');
    reason.textContent = entry.label;
    popup.append(amount, reason);
    popup.addEventListener('animationend', () => popup.remove(), { once: true });
    container.append(popup);
  });
}

function answerGame(answer) {
  if (!game || game.answered) return;
  clearInterval(timerId);
  const question = game.questions[game.index];
  const timedOut = answer === null;
  const correct = !timedOut && answer === question.country;
  const responseTimeMs = Math.max(0, performance.now() - questionStarted);
  const scored = scoreAnswer({ correct, timedOut, streak: game.streak, difficulty: game.difficulty, responseTimeMs });
  game.answered = true;
  game.correct += Number(correct);
  const previousPoints = game.points;
  game.points = applyScoreDelta(game.points, scored.points);
  game.streak = scored.streak;
  game.bestStreak = Math.max(game.bestStreak, game.streak);
  game.timeouts += Number(timedOut);
  const appliedPenalty = scored.penalty < 0 ? Math.min(previousPoints, Math.abs(scored.penalty)) : 0;
  game.totalPenalties += appliedPenalty;
  game.streakBonusTotal += scored.streakBonus;
  game.speedBonusTotal += scored.speedBonus;
  showScoreBreakdown({ ...scored, penalty: -appliedPenalty }, correct, timedOut);
  if (!correct) game.errors.push({
    city: question.city, expected: question.country,
    answered: timedOut ? 'tempo esgotado' : answer,
    type: timedOut ? 'timeout' : 'error'
  });
  renderOptions($('#game-options'), question, () => {}, answer ?? '__TIMEOUT__');
  keyboardOptions = null;
  $('#game-feedback').textContent = correct ? 'ENTRADA APROVADA' : `ENTRADA RECUSADA · ${question.country.toUpperCase()}`;
  $('#game-feedback').className = `feedback-row ${correct ? 'is-success' : 'is-error'}`;
  $('#game-curiosity').textContent = question.curiosity;
  $('#game-score').textContent = String(game.points).padStart(8, '0');
  $('#game-streak').textContent = String(game.streak);
  $('#game-next').hidden = false;
  $('#game-next').textContent = game.index === 9 ? 'Abrir relatório →' : 'Próximo documento →';
  play('stamp');
}

function populateReportIdentification() {
  let sequence = 1;
  try {
    sequence = Number(localStorage.getItem(reportSequenceKey) || 0) + 1;
    localStorage.setItem(reportSequenceKey, String(sequence));
  } catch {
    sequence = Math.floor(Date.now() / 1000) % 999999 + 1;
  }

  let profile = null;
  try { profile = JSON.parse(localStorage.getItem(playerProfileKey) || localStorage.getItem(legacyProfileKey) || 'null'); } catch {}
  const serial = String(sequence).padStart(6, '0');
  const inspector = profile?.name
    ? `${profile.name} · ${profile.code || 'SEM MATRÍCULA'}`
    : profile?.code || 'NÃO IDENTIFICADO';

  $('#report-protocol').textContent = `GRE-821004-${serial}`;
  $('#report-date').textContent = '04 OUT 1982';
  $('#report-shift').textContent = serial;
  $('#report-inspector').textContent = inspector;
}

function finishQuiz() {
  clearInterval(timerId);
  if (game && !game.profileRecorded) {
    playerProfile = createPlayerProfile();
    const stats = playerProfile.stats;
    stats.rounds += 1;
    stats.correct += game.correct;
    stats.questions += game.questions.length;
    stats.bestScore = Math.max(stats.bestScore, game.points);
    stats.bestStreak = Math.max(stats.bestStreak, game.bestStreak);
    playerProfile.history.unshift({
      date: new Date().toISOString(),
      difficulty: game.difficulty,
      correct: game.correct,
      score: game.points,
      bestStreak: game.bestStreak
    });
    playerProfile.history = playerProfile.history.slice(0, 30);
    game.profileRecorded = true;
    persistPlayerProfile();
  }
  populateReportIdentification();
  const elapsedSeconds = Math.max(0, Math.floor((performance.now() - roundStartedAt) / 1000));
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedRemainder = elapsedSeconds % 60;
  $('#report-score').textContent = `${game.points} PTS`;
  $('#report-summary').textContent = `${game.correct} acertos em 10 documentos · melhor sequência: ${game.bestStreak}`;
  const filerErrors = $('#report-filer-errors');
  filerErrors.replaceChildren();
  if (!game.errors.length) {
    const item = document.createElement('li');
    item.textContent = 'Nenhuma discrepância registrada. O Ministério agradece sua precisão.';
    filerErrors.append(item);
  } else {
    game.errors.forEach((error) => {
      const item = document.createElement('li');
      item.textContent = error.city + ': ' + (error.type === 'timeout' ? 'TEMPO ESGOTADO' : error.answered) + ' · correto: ' + error.expected;
      filerErrors.append(item);
    });
  }

  const assessmentByLevel = [
    {
      stamp: 'DISTINÇÃO', className: 'is-distinction',
      messages: [
        'A pontuação do turno alcançou nível de excelência. A supervisão registra o resultado como referência operacional. Mantenha o padrão.',
        'Resultado excepcional no sistema de avaliação. O Ministério reconhece o desempenho e espera que não tenha sido um acidente.',
        'A pontuação obtida demonstra domínio dos procedimentos e das exigências do posto. O reconhecimento foi devidamente registrado.'
      ]
    },
    {
      stamp: 'CONFORME', className: 'is-approved',
      messages: [
        'A pontuação atende ao padrão operacional esperado. A supervisão registra o resultado e recomenda manter a regularidade.',
        'Desempenho considerado adequado pelo sistema de avaliação. O Ministério espera a manutenção dos resultados nos próximos turnos.',
        'O resultado está dentro dos parâmetros administrativos. Há margem para melhorar, mas o serviço foi considerado conforme.'
      ]
    },
    {
      stamp: 'RESSALVAS', className: 'is-warning',
      messages: [
        'A pontuação ficou abaixo do padrão desejado. A supervisão recomenda revisar os procedimentos e melhorar a execução no próximo turno.',
        'O resultado exige acompanhamento. A administração espera uma recuperação imediata do desempenho operacional.',
        'A pontuação registrada não passou despercebida. Revise os procedimentos antes de assumir o próximo turno.'
      ]
    },
    {
      stamp: 'INSATISFATÓRIO', className: 'is-rejected',
      messages: [
        'A pontuação ficou abaixo do mínimo operacional. A supervisão recomenda revisão imediata dos procedimentos.',
        'O resultado é incompatível com o padrão exigido em Grestin. Sua permanência no posto poderá ser reavaliada.',
        'O Ministério considera o desempenho insatisfatório. A próxima avaliação não será tratada como mera formalidade.'
      ]
    }
  ];
  const scoreAssessment = classifyScore(game.points, game.difficulty);
  const assessmentLevel = assessmentByLevel.find((level) => level.stamp === scoreAssessment.stamp);
  const assessment = assessmentLevel.messages[Math.floor(Math.random() * assessmentLevel.messages.length)];
  $('#report-assessment').textContent = assessment;
  const classification = $('#report-classification');
  classification.textContent = scoreAssessment.stamp;
  classification.className = `classification-stamp ${scoreAssessment.className}`;

  const stats = [
    ['Modo', game.difficulty.toUpperCase()],
    ['Acertos', game.correct + ' / 10'],
    ['Erros', game.errors.length - game.timeouts],
    ['Timeouts', game.timeouts],
    ['Precisão', Math.round((game.correct / game.questions.length) * 100) + '%'],
    ['Melhor sequência', game.bestStreak],
    ['Pontuação final', game.points + ' pts'],
    ['Tempo total', elapsedMinutes + 'm ' + String(elapsedRemainder).padStart(2, '0') + 's'],
    ['Penalidades acumuladas', '-' + game.totalPenalties + ' pts'],
    ['Bônus de sequência', '+' + game.streakBonusTotal + ' pts'],
    ['Bônus de velocidade', '+' + game.speedBonusTotal + ' pts']
  ];
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

function renderPlayerProfile() {
  playerProfile = createPlayerProfile();
  const profile = playerProfile;
  $('#profile-name').textContent = profile.name || 'CANDIDATO NÃO IDENTIFICADO';
  $('#menu-player-name').textContent = profile.name || 'CANDIDATO NÃO IDENTIFICADO';
  $('#profile-code').textContent = profile.code || 'SEM IDENTIFICAÇÃO';
  $('#profile-sex').textContent = profile.sex || 'NÃO DECLARADO';
  $('#profile-nationality').textContent = profile.nationality || 'NÃO REGISTRADA';
  $('#profile-marital-status').textContent = profile.maritalStatus || 'NÃO REGISTRADO';
  $('#profile-dependents').textContent = profile.dependents ?? '0';
  $('#profile-occupation').textContent = profile.previousOccupation || 'NÃO INFORMADA';
  let admissionResult = null;
  try { admissionResult = JSON.parse(localStorage.getItem(campaignResultKey) || 'null'); } catch {}
  $('#profile-campaign-result').textContent = admissionResult && Number.isInteger(admissionResult.correct)
    ? `${admissionResult.correct}/10 · ${String(admissionResult.outcome || 'REGISTRADO').toUpperCase()}`
    : (localStorage.getItem(campaignKey) === 'true' ? 'RESULTADO ANTERIOR INDISPONÍVEL' : 'AVALIAÇÃO PENDENTE');
  const stats = profile.stats || {};
  const accuracy = stats.questions ? Math.round((stats.correct / stats.questions) * 100) : 0;
  $('#profile-stats').innerHTML = '';
  [
    ['Turnos realizados', stats.rounds || 0],
    ['Precisão acumulada', accuracy + '%'],
    ['Melhor pontuação', stats.bestScore || 0],
    ['Melhor sequência', stats.bestStreak || 0]
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'profile-stat';
    const name = document.createElement('span');
    name.textContent = label;
    const result = document.createElement('strong');
    result.textContent = String(value);
    item.append(name, result);
    $('#profile-stats').append(item);
  });
  const history = $('#profile-history');
  history.replaceChildren();
  if (!profile.history.length) {
    const empty = document.createElement('p');
    empty.className = 'body-copy';
    empty.textContent = 'Nenhum turno registrado. O histórico será atualizado após suas primeiras inspeções.';
    history.append(empty);
  } else {
    profile.history.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'profile-history-item';
      const date = document.createElement('span');
      date.textContent = new Date(entry.date).toLocaleDateString('pt-BR');
      const mode = document.createElement('span');
      mode.textContent = String(entry.difficulty || '').toUpperCase();
      const result = document.createElement('strong');
      result.textContent = `${entry.correct}/10 · ${entry.score} PTS`;
      item.append(date, mode, result);
      history.append(item);
    });
  }
}

function exportPlayerBackup() {
  playerProfile = createPlayerProfile();
  const backup = {
    format: 'tgif-player-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: playerProfile,
    campaignCompleted: localStorage.getItem(campaignKey) === 'true',
    campaignResult: (() => { try { return JSON.parse(localStorage.getItem(campaignResultKey) || 'null'); } catch { return null; } })(),
    reportSequence: Number(localStorage.getItem(reportSequenceKey) || 0)
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tgif-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importPlayerBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (backup?.format !== 'tgif-player-backup' || backup.version !== 1 ||
        !backup.profile || typeof backup.profile !== 'object' ||
        typeof backup.profile.code !== 'string' || typeof backup.profile.name !== 'string') {
      throw new Error('Formato de backup inválido.');
    }
    if (!window.confirm('A importação substituirá o perfil e o progresso local deste navegador. Deseja continuar?')) return;
    localStorage.setItem(playerProfileKey, JSON.stringify(backup.profile));
    localStorage.setItem(campaignKey, backup.campaignCompleted ? 'true' : 'false');
    if (backup.campaignResult) localStorage.setItem(campaignResultKey, JSON.stringify(backup.campaignResult));
    else localStorage.removeItem(campaignResultKey);
    localStorage.setItem(reportSequenceKey, String(Number(backup.reportSequence) || 0));
    playerProfile = createPlayerProfile();
    renderPlayerProfile();
    $('#profile-backup-feedback').textContent = 'BACKUP IMPORTADO E VALIDADO.';
    $('#profile-backup-feedback').className = 'feedback-row is-success';
  } catch (error) {
    $('#profile-backup-feedback').textContent = error.message || 'NÃO FOI POSSÍVEL IMPORTAR O BACKUP.';
    $('#profile-backup-feedback').className = 'feedback-row is-error';
  }
}

const openingText = `Ministério da Admissão — Circular Interna Nº 7

Todo inspetor de fronteira deve demonstrar conhecimento geográfico básico antes de assumir o posto.

Você foi designado ao Posto Fronteiriço de Grestin. Sua participação é compulsória — você foi selecionado pela Loteria do Trabalho de Outubro de 1982 e não pode recusar esta designação.

Antes de assumir suas funções, deve demonstrar conhecimentos geográficos básicos sobre os países e as cidades da região.

Este teste é obrigatório. Resultados serão arquivados.

Glória a Arstotzka.`

function revealOpeningText() {
  if (openingReady) return;
  window.clearTimeout(openingTimer);
  window.clearInterval(typingTimer);
  $('#opening-text').textContent = openingText;
  openingReady = true;
  $('#opening-instruction').textContent = '[ clique ou pressione ENTER / ESPAÇO para continuar ]';
}

function startOpeningSequence() {
  const text = $('#opening-text');
  const instruction = $('#opening-instruction');
  text.textContent = '';
  instruction.textContent = '[ clique para revelar o comunicado ]';
  openingReady = false;
  window.clearTimeout(openingTimer);
  window.clearInterval(typingTimer);
  openingTimer = window.setTimeout(() => {
    // A abertura aguarda a primeira interação para evitar bloqueios de autoplay.
    let index = 0;
    typingTimer = window.setInterval(() => {
      text.textContent += openingText[index] ?? '';
      index += 1;
      if (index >= openingText.length) revealOpeningText();
    }, 30);
  }, 1000);
}

function continueFromOpening() {
  if (!openingReady) {
    revealOpeningText();
    return;
  }
  window.clearInterval(typingTimer);
  play('foghorn', 0.3);
  play('page', 0.24);
  play('theme', 0.14);
  if (reviewingCampaign) {
    reviewingCampaign = false;
    beginInterview();
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
$('#shift-intro-skip').addEventListener('click', finishShiftIntro);
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
  $('#admission-review-modal').hidden = false;
  document.body.classList.add('review-modal-open');
  $('#review-confirm').focus();
}
function closeAdmissionReview() {
  $('#admission-review-modal').hidden = true;
  document.body.classList.remove('review-modal-open');
  $('#menu-review').focus();
}
$('#menu-review').addEventListener('click', reviewCampaign);
$('#review-cancel').addEventListener('click', closeAdmissionReview);
$('#review-confirm').addEventListener('click', () => {
  closeAdmissionReview();
  reviewingCampaign = true;
  navigate('opening');
  document.body.classList.add('is-opening');
  startOpeningSequence();
});
$('#menu-profile').addEventListener('click', () => {
  renderPlayerProfile();
  navigate('profile');
});
$('#profile-back').addEventListener('click', () => navigate('menu'));
$('#profile-export').addEventListener('click', exportPlayerBackup);
$('#profile-import-button').addEventListener('click', () => $('#profile-import').click());
$('#profile-import').addEventListener('change', importPlayerBackup);

document.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click', () => beginQuiz(button.dataset.difficulty)));
document.querySelectorAll('[data-score-regime]').forEach((button) => button.addEventListener('click', () => openScoreRegime(button.dataset.scoreRegime, button)));
document.querySelectorAll('[data-score-modal-close]').forEach((element) => element.addEventListener('click', closeScoreRegulation));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#score-regulation-modal').hidden) closeScoreRegulation();
});
$('#game-next').addEventListener('click', () => { game.index += 1; game.answered = false; renderGameQuestion(); });
$('#game-report').addEventListener('click', finishQuiz);
$('#game-menu').addEventListener('click', () => { clearInterval(timerId); navigate('menu'); });
$('#report-menu').addEventListener('click', () => navigate('menu'));
$('#report-again').addEventListener('click', () => beginQuiz(game?.difficulty ?? 'facil'));
$('#filer-open').addEventListener('click', () => {
  const expanded = $('#filer-expanded');
  const content = expanded.querySelector('.filer-content');
  window.clearTimeout(filerCloseTimer);
  content.classList.remove('is-closing');
  $('#filer-open').hidden = true;
  expanded.hidden = false;
  play('filerOpen', 0.32);
});
$('#filer-close').addEventListener('click', () => {
  const expanded = $('#filer-expanded');
  const content = expanded.querySelector('.filer-content');
  if (expanded.hidden || filerCloseTimer !== null) return;
  content.classList.add('is-closing');
  play('filerClose', 0.32);
  filerCloseTimer = window.setTimeout(() => {
    expanded.hidden = true;
    content.classList.remove('is-closing');
    $('#filer-open').hidden = false;
    filerCloseTimer = null;
  }, 280);
});
$('#sound-toggle').addEventListener('click', () => {
  audioSettings.muted = !audioSettings.muted;
  persistAudioSettings();
  updateAudioSettingsUI();
  if (!audioSettings.muted && audioSettings.musicEnabled && !audio.theme && !$('#opening').classList.contains('is-active')) {
    play('theme', 0.14);
  }
});
$('#music-enabled').addEventListener('change', (event) => {
  audioSettings.musicEnabled = event.target.checked;
  persistAudioSettings();
  updateAudioSettingsUI();
  if (audioSettings.musicEnabled && !audioSettings.muted && !$('#opening').classList.contains('is-active')) {
    play('theme', audio.theme?.baseVolume ?? 0.14);
  }
});
$('#effects-enabled').addEventListener('change', (event) => {
  audioSettings.effectsEnabled = event.target.checked;
  persistAudioSettings();
  updateAudioSettingsUI();
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
playerProfile = createPlayerProfile();
$('#menu-player-name').textContent = playerProfile.name || 'CANDIDATO NÃO IDENTIFICADO';
updateAudioSettingsUI();
startOpeningSequence();

window.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if ((event.key === 'Enter' || event.code === 'Space') && $('#opening').classList.contains('is-active')) {
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
