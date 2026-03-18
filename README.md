# T.G.I.F. — Teste Geográfico para Inspetores de Fronteira

> *"Você foi selecionado pela Loteria do Trabalho de Outubro de 1982. Sua participação é compulsória."*

Fan project baseado no universo de **Papers, Please** (© 2013 Lucas Pope). Um quiz interativo que testa seu conhecimento sobre as cidades e países do jogo — desenvolvido como projeto de portfólio do zero, sem frameworks.

---

## Sobre o Projeto

Em Papers, Please, você é um inspetor de fronteira em Arstotzka. Documentos chegam com cidades de emissão que precisam corresponder ao país certo — errar significa deixar passar um impostor ou deter um cidadão inocente.

O T.G.I.F. transforma esse conhecimento geográfico num teste interativo fiel ao universo do jogo: visual burocrático, sons originais, carimbos de aprovação e negação, e uma narrativa que coloca você como recruta sendo avaliado antes de assumir o posto.

---

## Funcionalidades

### Modo Campanha
- Teste obrigatório no estilo do jogo — você foi designado, não pode recusar
- 21 questões no modo fácil com curiosidades sobre cada cidade
- Sistema de aprovação com três finais possíveis baseados nos acertos
- Avaliação do Supervisor M. Vonel com placa de reconhecimento ou demérito
- Link para o jogo original na Steam ao ser aprovado
- Progresso salvo via `localStorage` — não precisa refazer a campanha a cada visita

### Modo Livre
- Três dificuldades com mecânicas distintas:
  - **Fácil** — sem tempo, com curiosidades de lore, ideal para aprender
  - **Normal** — 8 segundos por pergunta, streak com bônus, tempo total registrado
  - **Difícil** — 5 segundos por pergunta, penalidades por erro e demora, pressão total
- Sistema de pontuação com bônus por velocidade e streak
- Carimbo animado de ENTRADA APROVADA / ENTRADA RECUSADA a cada resposta

### Relatório Final (Filer)
- Ao terminar uma run, uma pasta desliza da base da tela
- Ao abrir, exibe o boletim de erros registrados e estatísticas completas da sessão
- Streak máximo, penalidades, tempo total, acertos e erros

### Identidade Visual e Sonora
- Assets visuais originais do jogo (carimbos, emblemas, passaportes, placas)
- Trilha sonora e efeitos sonoros originais
- Fonte Share Tech Mono para fidelidade visual
- Mapa dos países como plano de fundo do menu
- Animação de texto digitado na tela de abertura

---

## Tecnologias

- HTML5, CSS3 e JavaScript puro — sem frameworks ou dependências externas
- `localStorage` para persistência de progresso
- Web Audio API nativa do navegador
- Assets visuais e sonoros: Papers, Please © 2013 Lucas Pope
- Mapa fan-made por u/Alpha_Stalin (Reddit)

---

## Como Jogar

Acesse diretamente pelo navegador — não requer instalação.

> 🔗 **[Jogar agora](#)** *(link do GitHub Pages em breve)*

Ou clone e rode localmente:

```bash
git clone https://github.com/lhickk17/Papers-Please_quiz.git
cd Papers-Please_quiz
```

Abra o `index.html` com qualquer servidor local (ex: Live Server no VSCode).

---

## Estrutura do Projeto

```
papers-please-quiz/
├── index.html
├── style.css
├── quiz.js
├── dados.json
├── assets/
│   ├── intro/
│   ├── papers/
│   └── ...
└── assets-sounds/
    └── *.mp3
```

---

## Aviso Legal

Este é um fan project não oficial, sem fins comerciais.
**Papers, Please** é propriedade de Lucas Pope / 3909 LLC.
Todos os assets visuais e sonoros pertencem aos seus respectivos criadores.

---

## Desenvolvimento

Projeto desenvolvido do zero como primeiro projeto pessoal, explorando:
- Manipulação de DOM com JavaScript puro
- Gerenciamento de estado sem framework
- Animações CSS e integração com Web Audio API
- Estruturação de dados em JSON
- Versionamento com Git e GitHub

---

*Glória a Arstotzka.*
