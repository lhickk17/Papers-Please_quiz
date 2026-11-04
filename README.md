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
- **Transições:** animações curtas com View Transitions API quando disponível e fallback CSS.
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

Esta é a primeira fatia da reconstrução. Os testes e o build precisam ser executados depois de instalar as dependências; não se deve considerar qualquer validação aprovada antes de executá-la. Os assets e arquivos do protótipo original permanecem preservados na branch.

## Aviso legal

Projeto de fã não oficial e sem fins comerciais. **Papers, Please** pertence a Lucas Pope / 3909 LLC. Os assets visuais e sonoros pertencem aos respectivos titulares.


## Ajustes registrados após o primeiro teste local

- Corrigido o mapeamento de placas da campanha para seguir a correspondência do protótipo original: 9–10 acertos = `PlaqueOneInner` (distinção); 7–8 = `PlaqueTwoInner` (aprovação); 0–6 = `CitationInner` (resultado insatisfatório).
- Restaurada a abertura narrativa com texto digitado, atraso inicial, efeito sonoro de buzina e instrução para continuar por clique ou Enter.
- Adicionado controle de alternativas por teclado: teclas `1` a `4` selecionam a opção correspondente e `Enter` confirma.
- **Ideia de UI registrada para etapa futura:** permitir recolher o menu principal e revelar o mapa de fundo como área interativa. Países/áreas clicáveis poderão abrir informações, iniciar desafios temáticos e servir de hub para modos futuros (passaportes, emblemas, localização de cidades e outros). A mecânica ainda não foi implementada: primeiro será necessário definir pontos clicáveis com precisão sobre a imagem do mapa e o comportamento de cada região.


## Correções após a rodada de testes de navegação

- **Rever campanha:** agora abre o parecer já registrado, sem iniciar novamente as dez perguntas. A pontuação da campanha passa a ser salva localmente para permitir a revisão; instalações antigas que só possuem a marca de conclusão exibem um aviso de que a nota anterior não foi armazenada.
- **Avaliação individual:** o botão dedicado inicia um turno livre de dez documentos no modo fácil; os cartões Fácil, Normal e Difícil continuam disponíveis para escolher a dificuldade.
- **Teclado:** as teclas 1 a 4 selecionam uma alternativa; Enter confirma a resposta e, depois do feedback, um segundo Enter aciona o botão de próxima questão/relatório. Os botões continuam clicáveis com o mouse.
- **Pasta de arquivo (Filer):** restaurada no fim dos turnos livres, com boletim de erros e estatísticas do modo, acertos, erros, sequência máxima e, conforme a dificuldade, pontuação, tempo e penalidades. A pasta abre e fecha sem substituir o relatório principal.
