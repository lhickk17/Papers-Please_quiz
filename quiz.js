let flat = []
let todosOsPaises = []
let pontos = 0
let streak = 0
let timerInterval = null
let tempoInicio = null
let tempoTotalInicio = null
let perguntaAtual = null
let modoAtual = 'facil'

let cidadesErradas = []
let streakMaximo = 0
let totalPenalidades = 0
let totalAcertos = 0

let flatCampanha = []
let acertosCampanha = 0
let perguntaAtualCampanha = null

const MINIMO_APROVACAO = 15
const TOTAL_QUESTOES = 21

const modos = {
  facil: {
    tempoPorPergunta: null,
    tempoTotal: false,
    streak: false,
    perderPontos: false,
    autoAvancar: false,
    bonusVelocidade: false,
    demeritoDemora: false
  },
  normal: {
    tempoPorPergunta: 8,
    tempoTotal: true,
    streak: true,
    perderPontos: false,
    autoAvancar: true,
    bonusVelocidade: true,
    demeritoDemora: false
  },
  dificil: {
    tempoPorPergunta: 5,
    tempoTotal: true,
    streak: true,
    perderPontos: true,
    autoAvancar: true,
    bonusVelocidade: true,
    demeritoDemora: true
  }
}

const textoAbertura = `Ministério da Admissão — Circular Interna Nº 7

Todo inspetor de fronteira deve demonstrar conhecimento geográfico básico antes de assumir o posto.

Você foi designado ao Posto Fronteiriço de Grestin. Sua participação é compulsória — você foi selecionado pela Loteria do Trabalho de Outubro de 1982 e não pode recusar esta designação.

Antes de assumir suas funções, deve provar noções aceitáveis dos países que fazem fronteira com Arstotzka.

Este teste é obrigatório. Resultados serão arquivados.

Glória a Arstotzka.`

// ── SONS ──
const sons = {
  tema:        new Audio('assets-sounds/01. Glory to Arstotzka (Main Theme).mp3'),
  foghorn:     new Audio('assets-sounds/09. Border Foghorn.mp3'),
  filerFechar: new Audio('assets-sounds/25. Filer Close.mp3'),
  filerAbrir:  new Audio('assets-sounds/26. Filer Open.mp3'),
  acerto:      new Audio('assets-sounds/31. Inspect Diagramon.mp3'),
  hover:       new Audio('assets-sounds/32. Inspect Highlight.mp3'),
  novaPergunta:new Audio('assets-sounds/34. Inspect Open.mp3'),
  papel:       new Audio('assets-sounds/45. Paper Dragstart0.mp3'),
  pagina: [
    new Audio('assets-sounds/52. Paper Turnpage0.mp3'),
    new Audio('assets-sounds/53. Paper Turnpage1.mp3'),
    new Audio('assets-sounds/54. Paper Turnpage2.mp3'),
  ],
  print:       new Audio('assets-sounds/55. Photo Print.mp3'),
  stamp:       new Audio('assets-sounds/70. Stamp Down.mp3'),
}

sons.tema.loop = true
sons.tema.volume = 0.25
sons.foghorn.volume = 0.5
sons.filerFechar.volume = 0.5
sons.filerAbrir.volume = 0.5
sons.acerto.volume = 0.5
sons.hover.volume = 0.15
sons.novaPergunta.volume = 0.4
sons.papel.volume = 0.4
sons.pagina.forEach(s => s.volume = 0.4)
sons.print.volume = 0.6
sons.stamp.volume = 0.7


Object.keys(sons).forEach(k => {
  const s = sons[k]
  if (Array.isArray(s)) s.forEach(a => a.preload = 'auto')
  else if (s && typeof s === 'object') s.preload = 'auto'
})

function tocar(som) {
  if (!som) return
  try {
    som.currentTime = 0
    const p = som.play()
    if (p && p.catch) p.catch(e => console.warn('Audio play failed:', som.src, e))
  } catch(e) {
    console.warn('Audio play exception:', som && som.src, e)
  }
}

function tocarPagina() {
  const i = Math.floor(Math.random() * sons.pagina.length)
  tocar(sons.pagina[i])
}

function iniciarTema() {
  sons.tema.currentTime = 0
  sons.tema.play().catch(() => {})
}

function pararTema() {
  sons.tema.pause()
  sons.tema.currentTime = 0
}

function adicionarHover(container) {
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', () => tocar(sons.hover))
  })
}

function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

async function carregarDados() {
  const response = await fetch('dados.json')
  return await response.json()
}

function achatarDados(dados) {
  const resultado = []
  dados.forEach(pais => {
    pais.cidades.forEach(cidade => {
      resultado.push({
        nome: cidade.nome,
        curiosidade: cidade.curiosidade,
        pais: pais.pais
      })
    })
  })
  return resultado
}

function gerarOpcoes(correta) {
  const erradas = todosOsPaises.filter(p => p !== correta)
  const unicas = [...new Set(erradas)]
  return embaralhar([correta, ...unicas.slice(0, 3)])
}

function digitarTexto(texto, elemento, velocidade, callback) {
  let i = 0
  const interval = setInterval(() => {
    elemento.textContent += texto[i]
    i++
    if (i >= texto.length) {
      clearInterval(interval)
      if (callback) callback()
    }
  }, velocidade)
}

function mostrar(id) {
  document.getElementById(id).style.display = 'flex'
}

function esconder(id) {
  document.getElementById(id).style.display = 'none'
}

function dispararCarimbo(idImg, acertou) {
  const img = document.getElementById(idImg)
  if (!img) return
  img.src = acertou ? 'assets/InkApproved.png' : 'assets/InkDenied.png'
  img.classList.remove('visivel')
  void img.offsetWidth
  img.classList.add('visivel')

  tocar(sons.print)
  setTimeout(() => tocar(sons.stamp), 150)

  setTimeout(() => img.classList.remove('visivel'), 1500)
}

// ── FILER ──
function mostrarFiler() {
  const overlay = document.getElementById('filer-overlay')
  overlay.style.display = 'flex'

  const fechado = document.getElementById('filer-fechado')
  fechado.style.display = 'flex'
  fechado.style.animation = 'none'
  void fechado.offsetWidth
  fechado.style.animation = 'subirFiler 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'

  document.getElementById('filer-aberto').style.display = 'none'
  fechado.onclick = () => {
    tocar(sons.filerAbrir)
    abrirFiler()
  }
}

function abrirFiler() {
  document.getElementById('filer-fechado').style.display = 'none'
  const aberto = document.getElementById('filer-aberto')
  aberto.style.display = 'block'

  const lista = document.getElementById('bulletin-lista')
  lista.innerHTML = ''
  if (cidadesErradas.length === 0) {
    lista.innerHTML = '<p class="bulletin-vazio">Nenhum erro registrado.</p>'
  } else {
    cidadesErradas.forEach(item => {
      const div = document.createElement('div')
      div.className = 'bulletin-item'
      div.innerHTML = `${item.cidade} <span>→ ${item.pais}</span>`
      lista.appendChild(div)
    })
  }

  const statsLista = document.getElementById('stats-lista')
  statsLista.innerHTML = ''

  const segundos = tempoTotalInicio
    ? Math.floor((Date.now() - tempoTotalInicio) / 1000)
    : 0
  const min = Math.floor(segundos / 60)
  const seg = segundos % 60

  const stats = [
    { label: 'Modo', valor: modoAtual.toUpperCase() },
    { label: 'Acertos', valor: `${totalAcertos} / ${TOTAL_QUESTOES}` },
    { label: 'Erros', valor: cidadesErradas.length },
    { label: 'Streak máximo', valor: streakMaximo },
  ]

  if (modoAtual !== 'facil') {
    stats.push({ label: 'Pontuação final', valor: pontos })
    stats.push({ label: 'Tempo total', valor: `${min}m ${seg}s` })
  }

  if (modoAtual === 'dificil') {
    stats.push({ label: 'Penalidades', valor: `-${totalPenalidades} pts` })
  }

  stats.forEach(s => {
    const div = document.createElement('div')
    div.className = 'stat-item'
    div.innerHTML = `<span class="stat-label">${s.label}</span><span class="stat-valor">${s.valor}</span>`
    statsLista.appendChild(div)
  })

  document.getElementById('filer-fechar').onclick = () => {
    tocar(sons.filerFechar)
    document.getElementById('filer-aberto').style.display = 'none'
    const fechado = document.getElementById('filer-fechado')
    fechado.style.display = 'flex'
    fechado.style.animation = 'none'
    void fechado.offsetWidth
    fechado.style.animation = 'subirFiler 0.3s ease forwards'
    fechado.onclick = () => {
      tocar(sons.filerAbrir)
      abrirFiler()
    }
  }
}

function esconderFiler() {
  document.getElementById('filer-overlay').style.display = 'none'
}

function iniciarAbertura() {
  const textoEl = document.getElementById('texto-abertura')
  const instrucaoEl = document.getElementById('instrucao-abertura')
  const abertura = document.getElementById('abertura')

  setTimeout(() => {
    tocar(sons.foghorn)
    setTimeout(() => {
      digitarTexto(textoAbertura, textoEl, 30, () => {
        instrucaoEl.textContent = '[ clique para continuar ]'
      })
    }, 1200)
  }, 1000)

  abertura.onclick = () => {
    tocar(sons.papel)
    esconder('abertura')
    verificarCampanha()
  }
}

function reiniciarTudo() {
  pararTimer()
  pararTema()
  esconderFiler()
  removerBotaoCampanha()
  localStorage.removeItem('campanhaCompleta')

  esconder('menu')
  esconder('quiz')
  esconder('campanha')
  esconder('resultado-campanha')

  const textoEl = document.getElementById('texto-abertura')
  const instrucaoEl = document.getElementById('instrucao-abertura')
  textoEl.textContent = ''
  instrucaoEl.textContent = ''

  const abertura = document.getElementById('abertura')
  abertura.style.display = 'flex'

  setTimeout(() => {
    tocar(sons.foghorn)
    setTimeout(() => {
      digitarTexto(textoAbertura, textoEl, 30, () => {
        instrucaoEl.textContent = '[ clique para continuar ]'
      })
    }, 1200)
  }, 1000)
}

function verificarCampanha() {
  if (localStorage.getItem('campanhaCompleta') === 'true') {
    iniciarTema()
    mostrar('menu')
    mostrarBotaoCampanha()
    adicionarHover(document.getElementById('menu'))
  } else {
    iniciarCampanha()
  }
}

function mostrarBotaoCampanha() {
  if (document.getElementById('btn-rever-campanha')) return
  const btn = document.createElement('button')
  btn.id = 'btn-rever-campanha'
  btn.textContent = '↩ Rever Campanha'
  btn.addEventListener('mouseenter', () => {
    tocar(sons.hover)
    btn.style.color = '#c8b89a'
    btn.style.borderColor = '#8b1a1a'
  })
  btn.addEventListener('mouseleave', () => {
    btn.style.color = '#6a5a3a'
    btn.style.borderColor = '#4a3a2a'
  })
  btn.addEventListener('click', () => {
    btn.remove()
    reiniciarTudo()
  })
  document.body.appendChild(btn)
}

function removerBotaoCampanha() {
  const btn = document.getElementById('btn-rever-campanha')
  if (btn) btn.remove()
}

// ── CAMPANHA ──
async function iniciarCampanha() {
  mostrar('campanha')
  acertosCampanha = 0

  const dados = await carregarDados()
  todosOsPaises = dados.map(item => item.pais)
  flatCampanha = embaralhar(achatarDados(dados))

  exibirPerguntaCampanha()

  document.getElementById('campanha-proxima').onclick = () => {
    tocar(sons.pagina[Math.floor(Math.random() * sons.pagina.length)])
    flatCampanha.shift()
    if (flatCampanha.length === 0) {
      mostrarResultadoCampanha()
    } else {
      exibirPerguntaCampanha()
    }
  }
}

function exibirPerguntaCampanha() {
  const sorteada = flatCampanha[0]
  perguntaAtualCampanha = {
    nome: sorteada.nome,
    curiosidade: sorteada.curiosidade,
    correta: sorteada.pais,
    opcoes: gerarOpcoes(sorteada.pais)
  }

  tocar(sons.novaPergunta)

  const respondidas = TOTAL_QUESTOES - flatCampanha.length
  document.getElementById('campanha-pergunta').textContent =
    `A qual país corresponde a cidade: ${perguntaAtualCampanha.nome}?`
  document.getElementById('campanha-feedback').textContent = ''
  document.getElementById('campanha-curiosidade').textContent = ''
  document.getElementById('campanha-progresso').textContent =
    `Questão ${respondidas + 1} de ${TOTAL_QUESTOES}`
  document.getElementById('campanha-proxima').style.display = 'none'

  const opcoesEl = document.getElementById('campanha-opcoes')
  opcoesEl.innerHTML = ''
  perguntaAtualCampanha.opcoes.forEach(pais => {
    const botao = document.createElement('button')
    botao.textContent = pais
    botao.addEventListener('mouseenter', () => tocar(sons.hover))
    botao.addEventListener('click', () => verificarRespostaCampanha(pais))
    opcoesEl.appendChild(botao)
  })
}

function verificarRespostaCampanha(selecionada) {
  const correta = perguntaAtualCampanha.correta
  const acertou = selecionada === correta
  const botoes = document.querySelectorAll('#campanha-opcoes button')
  const feedback = document.getElementById('campanha-feedback')

  botoes.forEach(b => { b.disabled = true })
  dispararCarimbo('carimbo-img-campanha', acertou)

  if (acertou) {
    acertosCampanha++
    tocar(sons.acerto)
    feedback.textContent = 'Correto!'
    feedback.style.color = 'green'
  } else {
    tocar(sons.papel)
    feedback.textContent = `Incorreto. A resposta correta é ${correta}.`
    feedback.style.color = 'red'
  }

  document.getElementById('campanha-curiosidade').textContent =
    perguntaAtualCampanha.curiosidade
  document.getElementById('campanha-proxima').style.display = 'block'
}

function mostrarResultadoCampanha() {
  esconder('campanha')
  mostrar('resultado-campanha')

  const aprovado = acertosCampanha >= MINIMO_APROVACAO
  const distincao = acertosCampanha >= 19

  let placa, vonel

  if (distincao) {
    placa = 'assets/papers/PlaqueOneInner.png'
    vonel = `"Desempenho satisfatório. Você demonstrou conhecimento adequado das regiões fronteiriças. Sua designação ao Posto de Grestin está confirmada. Não decepcione o Ministério."

— M. Vonel, Supervisor Regional`
  } else if (aprovado) {
    placa = 'assets/papers/PlaqueTwoInner.png'
    vonel = `"Resultado dentro do aceitável. Seu conhecimento geográfico é básico, mas suficiente para o posto. Erros futuros serão registrados em sua ficha. Você pode assumir suas funções."

— M. Vonel, Supervisor Regional`
  } else {
    placa = 'assets/papers/CitationInner.png'
    vonel = `"Resultado insatisfatório. Você não demonstrou conhecimento mínimo exigido pelo Ministério da Admissão. Uma nova tentativa será permitida. Falhar novamente pode resultar em consequências para sua família."

— M. Vonel, Supervisor Regional`
  }

  document.getElementById('resultado-placa').src = placa
  document.getElementById('resultado-vonel').textContent = vonel
  document.getElementById('resultado-placar').textContent =
    `Acertos: ${acertosCampanha} de ${TOTAL_QUESTOES} — Mínimo exigido: ${MINIMO_APROVACAO}`

  const botoesEl = document.getElementById('resultado-botoes')
  botoesEl.innerHTML = ''

  if (aprovado) {
    localStorage.setItem('campanhaCompleta', 'true')

    const btnMenu = document.createElement('button')
    btnMenu.textContent = 'Acessar Modo Livre →'
    btnMenu.addEventListener('mouseenter', () => tocar(sons.hover))
    btnMenu.addEventListener('click', () => {
      tocar(sons.papel)
      esconder('resultado-campanha')
      iniciarTema()
      mostrar('menu')
      mostrarBotaoCampanha()
      adicionarHover(document.getElementById('menu'))
    })
    botoesEl.appendChild(btnMenu)

    const linkSteam = document.createElement('a')
    linkSteam.href = 'https://store.steampowered.com/app/239030/Papers_Please/'
    linkSteam.target = '_blank'
    linkSteam.textContent = 'Jogar Papers, Please na Steam →'
    botoesEl.appendChild(linkSteam)

    const creditos = document.createElement('p')
    creditos.style.cssText = 'font-size:10px;letter-spacing:0.1em;color:#3a2a1a;text-transform:uppercase;line-height:1.8;margin-top:1rem;'
    creditos.textContent = 'Este é um fan project não oficial. Papers, Please © 2013 Lucas Pope. Todos os direitos reservados.'
    botoesEl.appendChild(creditos)

  } else {
    const btnTentar = document.createElement('button')
    btnTentar.textContent = 'Tentar Novamente →'
    btnTentar.addEventListener('mouseenter', () => tocar(sons.hover))
    btnTentar.addEventListener('click', () => {
      tocar(sons.papel)
      esconder('resultado-campanha')
      reiniciarTudo()
    })
    botoesEl.appendChild(btnTentar)
  }
}

// ── QUIZ LIVRE ──
function pararTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function iniciarTimer() {
  const modo = modos[modoAtual]
  if (!modo.tempoPorPergunta) return

  let tempo = modo.tempoPorPergunta
  tempoInicio = Date.now()
  const timerEl = document.getElementById('timer')
  if (timerEl) timerEl.textContent = `${tempo}s`

  timerInterval = setInterval(() => {
    tempo--
    if (timerEl) timerEl.textContent = `${tempo}s`
    if (tempo <= 0) {
      clearInterval(timerInterval)
      verificarResposta(null, perguntaAtual.correta)
    }
  }, 1000)
}

function restaurarQuizHTML() {
  document.getElementById('quiz').innerHTML = `
    <h1>Verificação Geográfica — Modo Livre</h1>
    <p id="pergunta">Carregando...</p>
    <div id="opcoes"></div>
    <div id="carimbo-container">
      <img id="carimbo-img" src="" alt="" />
    </div>
    <p id="feedback"></p>
    <button id="proxima">Próxima →</button>
    <p id="pontos">Pontos: 0</p>
    <p id="timer"></p>
    <p id="streak"></p>
    <p id="curiosidade"></p>
  `
  const proxima = document.getElementById('proxima')
  proxima.addEventListener('mouseenter', () => tocar(sons.hover))
  proxima.addEventListener('click', () => {
    tocarPagina()
    avancarPergunta()
  })
}

function exibirPergunta(pergunta) {
  perguntaAtual = pergunta
  const modo = modos[modoAtual]

  tocar(sons.novaPergunta)

  document.getElementById('pergunta').textContent =
    `A qual país corresponde a cidade: ${pergunta.nome}?`

  const opcoesEl = document.getElementById('opcoes')
  opcoesEl.innerHTML = ''
  pergunta.opcoes.forEach(pais => {
    const botao = document.createElement('button')
    botao.textContent = pais
    botao.addEventListener('mouseenter', () => tocar(sons.hover))
    botao.addEventListener('click', () => verificarResposta(pais, pergunta.correta))
    opcoesEl.appendChild(botao)
  })

  document.getElementById('feedback').textContent = ''

  const curiosEl = document.getElementById('curiosidade')
  if (curiosEl) curiosEl.textContent = ''

  const pontosEl = document.getElementById('pontos')
  if (pontosEl) pontosEl.style.display = modoAtual === 'facil' ? 'none' : 'block'

  const streakEl = document.getElementById('streak')
  if (streakEl) streakEl.style.display = modo.streak ? 'block' : 'none'

  const timerEl = document.getElementById('timer')
  if (timerEl) timerEl.style.display = modo.tempoPorPergunta ? 'block' : 'none'

  document.getElementById('proxima').style.display = 'none'

  pararTimer()
  iniciarTimer()
}

function verificarResposta(selecionada, correta) {
  pararTimer()

  const modo = modos[modoAtual]
  const tempoResposta = tempoInicio ? (Date.now() - tempoInicio) / 1000 : 999
  const feedback = document.getElementById('feedback')
  const botoes = document.querySelectorAll('#opcoes button')
  const acertou = selecionada === correta

  botoes.forEach(b => { b.disabled = true })
  dispararCarimbo('carimbo-img', acertou)

  if (modoAtual === 'facil') {
    if (acertou) {
      totalAcertos++
      tocar(sons.acerto)
      feedback.textContent = 'Correto!'
      feedback.style.color = 'green'
    } else {
      cidadesErradas.push({ cidade: perguntaAtual.nome, pais: perguntaAtual.correta })
      tocar(sons.papel)
      feedback.textContent = selecionada
        ? `Incorreto. A resposta correta é ${correta}.`
        : `Tempo esgotado. A resposta correta é ${correta}.`
      feedback.style.color = 'red'
    }
    const curiosEl = document.getElementById('curiosidade')
    if (curiosEl) curiosEl.textContent = perguntaAtual.curiosidade
    document.getElementById('proxima').style.display = 'block'
  } else {
    botoes.forEach(b => {
      if (b.textContent === correta) {
        b.style.background = '#1D9E75'
        b.style.color = 'white'
      } else if (b.textContent === selecionada && !acertou) {
        b.style.background = '#E24B4A'
        b.style.color = 'white'
      }
    })

    if (acertou) {
      totalAcertos++
      streak++
      if (streak > streakMaximo) streakMaximo = streak
      tocar(sons.acerto)
      let bonus = 100
      if (modo.streak && streak > 3) bonus += 50
      if (modo.bonusVelocidade && tempoResposta < 2) bonus += 25
      pontos += bonus
      feedback.textContent = streak > 3 ? `+${bonus} — streak x${streak}` : `+${bonus}`
      feedback.style.color = 'green'
    } else {
      cidadesErradas.push({ cidade: perguntaAtual.nome, pais: perguntaAtual.correta })
      streak = 0
      tocar(sons.papel)
      let deducao = 0
      if (!selecionada) deducao = modo.perderPontos ? 50 : 0
      else {
        if (modo.perderPontos) deducao += 50
        if (modo.demeritoDemora && tempoResposta > 3) deducao += 25
      }
      if (deducao > 0) {
        pontos -= deducao
        totalPenalidades += deducao
        feedback.textContent = `-${deducao}`
        feedback.style.color = 'red'
      }
    }

    const pontosEl = document.getElementById('pontos')
    if (pontosEl) pontosEl.textContent = `Pontos: ${pontos}`

    const streakEl = document.getElementById('streak')
    if (streakEl) streakEl.textContent = streak > 0 ? `Streak: ${streak}` : ''

    setTimeout(() => avancarPergunta(), 1500)
  }
}

function avancarPergunta() {
  flat.shift()
  if (flat.length === 0) {
    mostrarResultadoLivre()
    return
  }
  exibirPergunta({
    nome: flat[0].nome,
    curiosidade: flat[0].curiosidade,
    correta: flat[0].pais,
    opcoes: gerarOpcoes(flat[0].pais)
  })
}

function mostrarResultadoLivre() {
  const modo = modos[modoAtual]
  let tempoTotal = ''

  if (modo.tempoTotal && tempoTotalInicio) {
    const segundos = Math.floor((Date.now() - tempoTotalInicio) / 1000)
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    tempoTotal = `<p style="font-size:11px;letter-spacing:0.1em;color:#5a4a2a;text-transform:uppercase;margin-top:0.5rem;">Tempo total: ${min}m ${seg}s</p>`
  }

  const conteudo = modoAtual === 'facil'
    ? `<h2 style="font-size:13px;letter-spacing:0.2em;color:#5a4a2a;text-transform:uppercase;">Teste concluído</h2><button onmouseenter="tocar(sons.hover)" onclick="reiniciar()" style="margin-top:2rem;width:100%;padding:1rem;background:#1a1a0e;border:none;color:#c8b89a;font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;">Voltar ao menu →</button>`
    : `<h2 style="font-size:13px;letter-spacing:0.2em;color:#5a4a2a;text-transform:uppercase;">Teste concluído</h2><p style="font-size:22px;font-weight:bold;margin:1rem 0;color:#1a1a0e;">Pontuação: ${pontos}</p>${tempoTotal}<button onmouseenter="tocar(sons.hover)" onclick="reiniciar()" style="margin-top:2rem;width:100%;padding:1rem;background:#1a1a0e;border:none;color:#c8b89a;font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;">Voltar ao menu →</button>`

  document.getElementById('quiz').innerHTML = conteudo
  mostrarFiler()
}

async function iniciar() {
  streak = 0
  pontos = 0
  totalAcertos = 0
  cidadesErradas = []
  streakMaximo = 0
  totalPenalidades = 0
  tempoTotalInicio = Date.now()

  pararTema()
  esconderFiler()
  restaurarQuizHTML()

  const dados = await carregarDados()
  todosOsPaises = dados.map(item => item.pais)
  flat = embaralhar(achatarDados(dados))
  exibirPergunta({
    nome: flat[0].nome,
    curiosidade: flat[0].curiosidade,
    correta: flat[0].pais,
    opcoes: gerarOpcoes(flat[0].pais)
  })
}

function reiniciar() {
  pararTimer()
  pontos = 0
  streak = 0
  esconderFiler()
  esconder('quiz')
  iniciarTema()
  mostrar('menu')
  adicionarHover(document.getElementById('menu'))
}

document.querySelectorAll('.btn-modo').forEach(botao => {
  botao.addEventListener('mouseenter', () => tocar(sons.hover))
  botao.addEventListener('click', () => {
    tocar(sons.papel)
    modoAtual = botao.dataset.modo
    removerBotaoCampanha()
    pararTema()
    esconder('menu')
    mostrar('quiz')
    iniciar()
  })
})

iniciarAbertura()