# T.G.I.F. — Teste Geográfico para Inspetores de Fronteira

Fan game independente inspirado no universo de **Papers, Please**, de Lucas Pope. O projeto transforma a geografia dos países e cidades desse universo em uma experiência de inspeção de documentos, com campanha narrativa de admissão, modos livres, pontuação, relatórios e perfil funcional.

> **Aviso:** T.G.I.F. não é um produto oficial, não possui vínculo com Lucas Pope ou 3909 LLC e não é endossado por seus criadores. *Papers, Please* e seus elementos pertencem aos respectivos titulares.

## Visão geral

A experiência se passa em **Grestin, em 1982**. O jogador é selecionado pela Loteria do Trabalho de Outubro de 1982 e convocado para uma vaga no posto fronteiriço. Antes de assumir as funções, passa por um processo administrativo que inclui entrevista, registro funcional e avaliação geográfica.

Depois da admissão, o posto fica disponível para turnos de inspeção em três regimes de dificuldade. Cada turno gera um relatório arquivado pelo Filer e atualiza as estatísticas do perfil.

O projeto é desenvolvido com **JavaScript ES modules, Vite, HTML e CSS**, sem framework de interface.

## Funcionalidades

### Campanha de admissão

A primeira experiência do jogador é uma sequência narrativa e administrativa:

1. **Comunicado de convocação:** apresenta a seleção pela Loteria do Trabalho e as obrigações do processo.
2. **Entrevista com M. Vonel:** quatro perguntas sobre motivação, hierarquia, discrição e designação. As respostas são registradas e utilizadas na observação comportamental do parecer.
3. **Cadastro funcional:** coleta os dados pessoais necessários, gera um código funcional e registra o vínculo do candidato.
4. **Boletim e orientação:** contextualizam a situação regional e explicam o procedimento da avaliação.
5. **Avaliação geográfica:** dez questões sobre países e cidades da região, com quatro alternativas por questão.
6. **Parecer admissional:** apresenta a pontuação geográfica e a avaliação das respostas da entrevista.
7. **Ordem de designação:** formaliza a admissão e a lotação no Posto Fronteiriço de Grestin.
8. **Menu do posto:** libera os regimes de inspeção, o perfil funcional e a revisão da admissão.

A avaliação geográfica gera uma classificação administrativa:
- **0 a 6 acertos:** avaliação insatisfatória;
- **7 a 8 acertos:** aprovação com ressalvas;
- **9 a 10 acertos:** distinção.

A classificação é registrada no processo, mas não impede a designação: a ordem oficial formaliza a admissão independentemente do resultado da avaliação.

### Revisão da admissão

A opção **Rever admissão**, disponível no menu, reapresenta o processo original para consulta.

- A abertura, a entrevista, o cadastro e a orientação são exibidos novamente.
- As respostas originais da entrevista são apresentadas em modo somente leitura.
- O cadastro existente é recuperado, sem solicitar uma nova identificação.
- A avaliação geográfica e o parecer são consultados a partir do resultado já registrado.
- A revisão não cria outro perfil, não duplica a admissão e não sobrescreve as respostas ou os resultados originais.

A revisão é uma consulta ao processo arquivado, não uma segunda tentativa de admissão.

### Modos livres de inspeção

Após a campanha, o jogador pode realizar turnos independentes de dez documentos. Cada rodada seleciona cidades do banco de dados e apresenta quatro alternativas de países.

| Regime | Nome no menu | Tempo por documento | Penalidade por erro | Penalidade por tempo esgotado |
|---|---|---:|---:|---:|
| Treinamento | Adaptação | Sem limite | 0 | 0 |
| Serviço regular | Protocolo padrão | 8 segundos | -25 | -50 |
| Regime de exceção | Inspeção rigorosa | 5 segundos | -50 | -75 |

Os regimes também diferenciam a bonificação por velocidade e por sequência de acertos.

### Pontuação

- Cada resposta correta concede **100 pontos-base**.
- Um acerto dentro da janela de velocidade concede **+20 pontos**: até 5 segundos no Treinamento, 4 segundos no Serviço regular e 2,5 segundos no Regime de exceção.
- No Serviço regular e no Regime de exceção, a sequência de acertos concede bônus progressivos: 3º acerto consecutivo = +10; 4º e 5º = +20; 6º e 7º = +30; 8º e 9º = +40; a partir do 10º = +50 por acerto.
- O Treinamento registra sequências, mas não concede bônus por sequência.
- Erros e tempos esgotados interrompem a sequência e não concedem bônus de velocidade.
- A pontuação acumulada nunca fica negativa.
- O Filer discrimina pontos-base, bônus, penalidades e estatísticas da rodada.

A classificação dos turnos livres considera a pontuação final normalizada pelo máximo teórico do regime: **1.200 pontos no Treinamento** e **1.440 pontos** nos outros dois regimes.

| Classificação | Índice normalizado |
|---|---:|
| Distinção | 95–100 |
| Conforme | 80–94 |
| Ressalvas | 60–79 |
| Insatisfatório | Abaixo de 60 |

A precisão percentual é exibida como estatística descritiva, mas não interfere na classificação.

### Relatórios e Filer

Ao terminar um turno livre, o jogo gera um relatório com:

- protocolo sequencial e data diegética;
- número do turno, nome do inspetor e unidade de serviço;
- classificação e pontuação final;
- acertos, erros, tempos esgotados e melhor sequência;
- discriminação de bônus e penalidades;
- relação de documentos respondidos incorretamente ou fora do tempo;
- observações variáveis da supervisão.

O relatório principal permanece na tela. O Filer pode ser aberto para consultar os documentos e as estatísticas arquivadas, e fechado sem substituir o relatório. A gaveta possui transição e efeitos sonoros próprios.

### Perfil funcional e histórico

A área **Perfil funcional** reúne os dados do jogador e seu vínculo com o posto em um único registro local.

Inclui:
- nome e código de identificação funcional;
- situação da admissão;
- documentos e registros emitidos durante a campanha;
- quantidade de turnos realizados;
- precisão acumulada;
- melhor pontuação;
- melhor sequência;
- histórico dos turnos recentes, com regime, acertos e pontuação.

O sistema reconhece a chave de perfil usada por versões anteriores e migra os dados legados para o perfil atual quando necessário.

### Backup e gerenciamento de progresso

O perfil oferece ferramentas para preservar ou reiniciar os dados:

- **Exportar backup:** gera um arquivo JSON versionado com o perfil, o histórico, o estado da campanha, o resultado admissional e a sequência dos relatórios.
- **Importar backup:** valida o formato do arquivo e solicita confirmação antes de substituir o progresso local atual.
- **Excluir todo o progresso:** apaga o cadastro, a admissão, os resultados, as estatísticas e o histórico armazenados naquele navegador. Após a confirmação, o jogo retorna à abertura inicial.

As confirmações de importação e exclusão são exibidas em janelas dentro do próprio jogo, sem depender dos alertas nativos do navegador.

**Importante:** os dados são armazenados localmente no navegador. O backup JSON permite transferir manualmente o progresso para outro navegador ou dispositivo, mas não existe sincronização automática em nuvem, conta de usuário, autenticação ou recuperação remota. Limpar os dados do navegador pode apagar o progresso; exporte e guarde um backup antes de fazer isso.

### Interface, áudio e acessibilidade

- Interface responsiva, com identidade visual inspirada em documentos administrativos, papel envelhecido, carimbos e elementos institucionais de Arstotzka.
- Abertura narrativa com texto digitado, efeitos sonoros e avanço por clique, Enter ou Espaço.
- Apresentação de início de turno, que pode ser pulada. O cronômetro só começa quando a inspeção é liberada.
- Alternativas selecionáveis por mouse ou teclado: teclas **1 a 4** selecionam as opções e **Enter** confirma ou avança após o feedback.
- Painel de áudio com controles separados para música e efeitos, volumes individuais e opção de silenciar. As preferências são salvas no navegador.
- Reprodução de áudio iniciada após interação do jogador, respeitando as políticas de autoplay dos navegadores.
- Foco visível, regiões de feedback com `aria-live`, controles nativos e suporte a `prefers-reduced-motion`.

### Comunicados do Ministério

O menu apresenta uma central rotativa com **20 comunicados**: circulares, avisos operacionais e mensagens sobre disciplina, procedimentos, propaganda institucional, segurança de fronteira, administração e relações exteriores. A seleção evita repetir imediatamente o comunicado anterior durante a mesma sessão.

## Tecnologias

- **JavaScript ES modules** — lógica da campanha, navegação, perfil, pontuação e interação.
- **Vite 7** — servidor de desenvolvimento e build de produção.
- **HTML5 e CSS3** — estrutura, layout, responsividade e animações.
- **Node.js test runner** — testes automatizados das regras centrais.
- **localStorage** — persistência local de perfil, progresso e preferências.

Não há framework de interface ou backend.

## Como executar localmente

Requisitos:
- Node.js **20.19+** ou **22.12+**;
- npm.

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local para abrir no navegador.

### Testes e build

Execute os testes automatizados:

```bash
npm test
```

Gere a versão de produção:

```bash
npm run build
```

Para visualizar localmente o build:

```bash
npm run preview
```

Os arquivos de produção são gerados em `dist/`, diretório que não deve ser versionado.

## Estrutura do projeto

```
.
├── index.html              # Estrutura da aplicação
├── package.json            # Scripts e dependências
├── package-lock.json       # Árvore de dependências travada
├── vite.config.js          # Configuração do Vite
├── dados.json              # Banco geográfico de países, cidades e curiosidades
├── assets/                 # Imagens, documentos, ícones e elementos visuais
├── assets-sounds/          # Música e efeitos sonoros
├── src/
│   ├── core.js             # Banco geográfico, perguntas e regras de pontuação
│   ├── main.js             # Fluxos do jogo, campanha, perfil e interface
│   └── style.css           # Layout, componentes e animações
├── tests/
│   └── core.test.js        # Testes automatizados das regras centrais
├── quiz.js                 # Protótipo anterior preservado
└── style.css               # Estilos do protótipo anterior preservados
```

Os arquivos do protótipo anterior permanecem no repositório como referência. A aplicação atual utiliza a estrutura modular em `src/`.

## Persistência local

As principais chaves utilizadas no navegador são:

| Chave | Finalidade |
|---|---|
| `ppquiz.campaign.v3` | Estado de conclusão da campanha |
| `ppquiz.campaign.result.v2` | Resultado da avaliação geográfica |
| `ppquiz.player.profile.v1` | Perfil funcional, registros, estatísticas e histórico |
| `ppquiz.inspector.profile.v1` | Chave legada reconhecida para migração |
| `ppquiz.audio.settings.v1` | Preferências de áudio |
| `ppquiz.report.sequence.v1` | Sequência dos protocolos de relatório |
| `ppquiz.last.bulletin` | Último comunicado exibido |

Esses dados pertencem à instalação local do navegador. Não são compartilhados entre dispositivos automaticamente.

## Validação e integração contínua

O projeto possui workflow de GitHub Actions para validar Pull Requests com:

1. instalação limpa das dependências usando `npm ci`;
2. execução de `npm test`;
3. compilação com `npm run build`.

A publicação do site pelo GitHub Pages é vinculada à branch `main`.

A aprovação dos testes e do build verifica as regras automatizadas e a compilação. Ela não substitui testes manuais do fluxo completo, especialmente em diferentes navegadores e dispositivos.

## Direção visual e conteúdo

A identidade visual procura reproduzir a atmosfera burocrática e opressiva de *Papers, Please*, sem apresentar o projeto como oficial. A interface utiliza tons verdes escuros, papel envelhecido, vermelho de carimbo, tipografia monoespaçada, documentos, brasões e elementos gráficos próprios.

O banco geográfico fica em `dados.json` e alimenta a geração de questões em `src/core.js`. Os assets existentes são preservados mesmo quando não utilizados diretamente pela versão atual, pois podem servir a futuras expansões.

## Ideias para expansão

Possíveis evoluções, ainda não consideradas implementadas:

- mapa interativo com regiões clicáveis e desafios temáticos;
- modos de localização geográfica;
- passaportes, emblemas e outros documentos colecionáveis;
- expansão dos eventos narrativos, boletins e reações de personagens;
- novas formas de progressão e objetivos de longo prazo;
- sincronização de perfil entre dispositivos, mediante definição de uma arquitetura de conta e backend.

## Créditos e aviso legal

T.G.I.F. é um projeto de fã, independente e sem fins comerciais, inspirado em **Papers, Please**.

*Papers, Please* foi criado por **Lucas Pope** e é publicado pela **3909 LLC**. O jogo original, suas marcas, personagens, elementos visuais e sonoros pertencem aos respectivos titulares. Este projeto não é afiliado, associado, autorizado ou endossado por Lucas Pope ou 3909 LLC.

Conheça o jogo original: [Papers, Please na Steam](https://store.steampowered.com/app/239030/Papers_Please/).
