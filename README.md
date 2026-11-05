# T.G.I.F. — Teste Geográfico para Inspetores de Fronteira

Fan project inspirado no universo de **Papers, Please** (© 2013 Lucas Pope), transformando a geografia dos países e cidades do jogo em um quiz com campanha, modo livre, pontuação e relatórios.

## Reconstrução 2.0

A branch `rebuild/vite-architecture` inicia uma reconstrução estrutural sem apagar os protótipos anteriores. A implementação usa JavaScript modular com Vite e mantém HTML/CSS próprios, sem framework de interface.

### Decisões implementadas nesta primeira fatia

- **Vite + JavaScript ES modules:** servidor de desenvolvimento e build de produção.
- **Campanha de 10 questões:** mensagem institucional, dez documentos e parecer final.
- **Progressão sem bloqueio:** nota baixa não impede o acesso ao menu. A campanha fica concluída após a primeira avaliação, independentemente da nota, e pode ser revista no menu.
- **Faixas da campanha:** 0–6 acertos = avaliação insatisfatória; 7–8 = aprovação com ressalvas; 9–10 = distinção.
- **Modo livre:** três dificuldades, pontuação, bônus, cronômetro e relatório de erros.
- **Acessibilidade básica:** foco visível, regiões de feedback com `aria-live`, controles nativos e suporte a `prefers-reduced-motion`.
- **Testes automatizados:** geração de perguntas, opções, cidades únicas e limites da campanha.

## Direção visual

A identidade continua inspirada no jogo original: paleta verde-escura, papel envelhecido, vermelho de carimbo, fonte Share Tech Mono, mapa e brasão. A composição foi ampliada para aproveitar telas largas, criar hierarquia entre conteúdo e indicadores e adaptar a interface a dispositivos menores.

## Como executar

Requer Node.js 20.19+ ou 22.12+ conforme a versão atual do Vite.

```bash
npm install
npm run dev
```

Para validar build e testes:

```bash
npm test
npm run build
npm run preview
```

O servidor de desenvolvimento exibirá o endereço local no terminal. O build de produção é gerado em `dist/`.

## Estrutura

```
index.html
package.json
vite.config.js
dados.json                 # Banco de cidades existente, preservado
assets/                    # Assets visuais existentes, preservados
assets-sounds/             # Áudios existentes, preservados
src/
  core.js                  # Banco, geração de perguntas e pontuação
  main.js                  # Campanha, modo livre e navegação
  style.css                # Layout, componentes e animações
tests/
  core.test.js              # Testes de regras e geração de perguntas
quiz.js                    # Protótipo anterior preservado
style.css                  # Estilos anteriores preservados
```

## Inventário e ideias futuras para assets

Nenhum asset existente deve ser removido apenas por não estar em uso na versão atual. A pasta visual contém materiais para expandir o projeto:

- **Passaportes:** identificar país, brasão ou tipo de documento.
- **Mapa e emblemas:** modo de localização por país/cidade.
- **Páginas do manual:** guia de regras com abas.
- **Jornais e boletins:** manchetes e relatórios variáveis ao fim de cada turno.
- **Citações, vistos e fichas:** registro visual de erros e histórico do inspetor.
- **Placas e upgrades:** progressão, conquistas e modificadores desbloqueáveis.
- **Carimbos:** decisões de aprovar/negar com feedback visual.
- **Retratos e reações:** respostas contextuais do supervisor.
- **Persianas e telas de dia:** transições diegéticas entre telas.
- **Fotografias, desenhos e canções:** colecionáveis narrativos.
- **Loc.csv e Text.xml**, quando disponíveis no acervo, podem ajudar a revisar nomes e conteúdo.

Ideias futuras não são consideradas concluídas até serem implementadas e verificadas.

## Estado de validação

Validação local realizada em 4 de novembro de 2026: `npm test` concluiu com **4/4 testes aprovados** e `npm run build` concluiu com sucesso usando Vite 7.3.7. O build gera os arquivos de produção em `dist/`, pasta ignorada pelo Git. Essa validação cobre as regras automatizadas e a compilação; não substitui testes manuais adicionais do fluxo completo em diferentes navegadores. Os assets e arquivos do protótipo original permanecem preservados na branch.

## Aviso legal

Projeto de fã não oficial e sem fins comerciais. **Papers, Please** pertence a Lucas Pope / 3909 LLC. Os assets visuais e sonoros pertencem aos respectivos titulares.


## Ajustes registrados após o primeiro teste local

- Corrigido o mapeamento de placas da campanha para seguir a correspondência do protótipo original: 9–10 acertos = `PlaqueOneInner` (distinção); 7–8 = `PlaqueTwoInner` (aprovação); 0–6 = `CitationInner` (resultado insatisfatório).
- Restaurada a abertura narrativa com texto digitado, atraso inicial, efeito sonoro de buzina e instrução para continuar por clique ou Enter.
- Adicionado controle de alternativas por teclado: teclas `1` a `4` selecionam a opção correspondente e `Enter` confirma.
- **Ideia de UI registrada para etapa futura:** permitir recolher o menu principal e revelar o mapa de fundo como área interativa. Países/áreas clicáveis poderão abrir informações, iniciar desafios temáticos e servir de hub para modos futuros (passaportes, emblemas, localização de cidades e outros). A mecânica ainda não foi implementada: primeiro será necessário definir pontos clicáveis com precisão sobre a imagem do mapa e o comportamento de cada região.


## Correções após a rodada de testes de navegação

- **Rever campanha:** agora reapresenta o comunicado institucional e, em seguida, abre o parecer já registrado, sem iniciar novamente as dez perguntas. A pontuação da campanha passa a ser salva localmente para permitir a revisão; instalações antigas que só possuem a marca de conclusão exibem um aviso de que a nota anterior não foi armazenada.
- **Avaliação individual:** o botão dedicado inicia um turno livre de dez documentos no modo fácil; os cartões Fácil, Normal e Difícil continuam disponíveis para escolher a dificuldade.
- **Teclado:** as teclas 1 a 4 selecionam uma alternativa; Enter confirma a resposta e, depois do feedback, um segundo Enter aciona o botão de próxima questão/relatório. Os botões continuam clicáveis com o mouse.
- **Pasta de arquivo (Filer):** restaurada no fim dos turnos livres, com boletim de erros e estatísticas do modo, acertos, erros, sequência máxima e, conforme a dificuldade, pontuação, tempo e penalidades. A pasta abre e fecha sem substituir o relatório principal.


## Campanha — revisão da abertura e progressão

- A abertura institucional fica isolada do posto principal, com o mapa, a barra superior e o rodapé ocultos.
- A imagem de fundo ampliada e o retrato da imigração obristana foram retirados da abertura. O símbolo do Ministério foi reduzido a um selo tipográfico discreto; o fundo agora é uma composição própria em CSS.
- O comunicado mantém o texto digitado e os efeitos sonoros; durante a digitação, clique, Enter ou Espaço revelam o texto completo. Uma nova interação avança para a próxima etapa.
- A campanha completa agora inclui entrevista com M. Vonel, registro funcional, boletim político, orientação, avaliação geográfica, parecer e ordem de designação.
- O retrato de M. Vonel é representado por um monograma visual porque o repositório não contém um asset de retrato identificável do supervisor.


## Campanha de admissão — fluxo expandido

A campanha inicial agora segue uma sequência de integração antes de liberar o menu do posto:

1. **Comunicado institucional:** abertura limpa, sem retrato da imigração obristana e sem imagem de fundo ampliada. O símbolo de Arstotzka foi reduzido a um selo tipográfico discreto; o fundo usa composição própria em tons escuros.
2. **Entrevista com M. Vonel:** três perguntas narrativas de admissão. As respostas ficam associadas à ficha local e não alteram a pontuação geográfica.
3. **Registro funcional:** formulário em formato de contrato. O único campo preenchido pelo jogador é o nome; o sistema emite um código fictício individual e apresenta cargo, posto, moradia funcional, endereço e data de admissão.
4. **Boletim político e orientação:** notícia contextual sobre a situação regional e instruções para a avaliação.
5. **Avaliação geográfica inicial:** dez questões, com o parecer calculado pelas faixas de desempenho já existentes.
6. **Parecer e ordem de designação:** registro do resultado, identificação do supervisor e documento de lotação em Grestin.
7. **Menu do posto:** acesso aos modos livres depois da conclusão da integração.

O nome e o código são armazenados no navegador com `localStorage`. O código é fictício e serve como identificador local de referência para uma possível estrutura futura de placares. Ainda não existe autenticação, sincronização entre dispositivos ou placar online.

### Áudio do arquivo

A abertura e o fechamento do Filer agora usam, respectivamente, `26. Filer Open.mp3` e `25. Filer Close.mp3`. O efeito de virar página permanece reservado às transições de papel, não à gaveta de arquivo.

### Observação de compatibilidade

A campanha expandida utiliza novas chaves de armazenamento (`ppquiz.campaign.v3` e `ppquiz.campaign.result.v2`) para que instalações que já concluíram a versão anterior recebam o novo fluxo de admissão uma vez. O registro pessoal é salvo separadamente em `ppquiz.inspector.profile.v1`.


## Divulgação e aviso de fan game

- O menu mantém um aviso de que T.G.I.F. é um projeto independente de fãs, inspirado em *Papers, Please*, sem vínculo oficial com Lucas Pope ou 3909 LLC.
- O rodapé inclui um direcionamento para a página oficial de *Papers, Please* na Steam.
- A tela de encerramento da campanha oferece um atalho para conhecer/comprar o jogo original.
- A ordem de designação também contém o aviso de caráter não oficial do projeto.
- O projeto não utiliza a marcação de produto oficial nem sugere endosso dos titulares.


## Revisão de estabilidade 2.0

- O favicon do navegador utiliza a arte `assets/intro/Intro1.png`, associada à Loteria do Trabalho.
- O painel de áudio permite ativar/desativar música e efeitos separadamente, ajustar os dois volumes e silenciar o conjunto. As preferências são persistidas no navegador em `ppquiz.audio.settings.v1`.
- A música e os efeitos da abertura aguardam uma interação do jogador para respeitar as políticas de reprodução automática dos navegadores. Falhas de reprodução passam a ser registradas no console com a identificação do efeito e do arquivo.
- O comunicado inicial descreve a avaliação como um exame de geografia dos países e cidades da região, compatível com o banco de questões atual.
- A validação automatizada em Pull Requests executa `npm ci`, `npm test` e `npm run build`. A publicação no GitHub Pages continua restrita à branch `main`.

- Os relatórios dos modos livres recebem protocolo sequencial persistido no navegador, data diegética (04 OUT 1982), número do turno, identificação do inspetor e unidade de serviço.

- Os relatórios de desempenho recebem carimbos de classificação por faixa de acertos e mensagens variáveis da supervisão, selecionadas conforme o resultado.

- O menu apresenta comunicados rotativos do Ministério, com circulares, avisos operacionais e referências discretas a movimentações clandestinas. A seleção evita repetir o comunicado imediatamente anterior durante a mesma sessão.


## Menu do posto — revisão editorial

- A orientação do menu apresenta os três regimes de inspeção e informa que os resultados serão acompanhados pela administração.
- Os modos foram renomeados para **Adaptação**, **Protocolo padrão** e **Inspeção rigorosa**, mantendo os identificadores de treinamento, serviço regular e regime de exceção.
- A central de comunicados do Ministério conta agora com 20 mensagens rotativas sobre disciplina, procedimentos, propaganda institucional, segurança de fronteira, administração e relações exteriores.
- O texto do Arquivo pessoal foi mantido nesta revisão para preservar espaço destinado a avisos e orientações futuras.

## Preparação de início de turno

- A campanha obrigatória e os turnos do modo livre apresentam uma sequência institucional curta antes do primeiro documento.
- A sequência percorre preparação do posto, identificação de Grestin, recebimento do primeiro documento e liberação da estação.
- A apresentação pode ser pulada a qualquer momento; o cronômetro do modo livre só começa quando a inspeção é liberada.
- A preferência de movimento reduzido desativa as animações decorativas da apresentação.

