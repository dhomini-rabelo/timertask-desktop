# Orquestration — layout-melhorias-ui

Date: 2026-09-06

## Log

- bootstrap | branch feat/layout-task-card | base bd5df02 | 7 itens de UI + exigencia de juiz de qualidade
- recon | recon-layout-melhorias-ui | sonnet | janela 122k | veredito: complexa | particao: nao | ponteiro: recon.md
  - achado: a task anterior (layout-task-card) implementou justamente o padrao que o item 2 chama de errado; molde correto ja existe em IndexCompletedTaskItem.tsx
  - app: npm run dev (Vite :1420) | sem seed: dados de teste criados via UI no proprio script Playwright
- plan | plan-layout-melhorias-ui | opus (por veredito complexa) | lancado
- plan | plan-layout-melhorias-ui | opus | janela 139k (89k no checkpoint) | 2 perguntas -> usuario respondeu
  - decisoes do usuario: item 5 = TUDO em 2 colunas (grupo incluido, divergiu do default do planner); item 2 = tempos saem de toda task ativa, so footer mostra
  - entregaveis: plan.md + prompts/escopo-a-header-timer-stats.md + prompts/escopo-b-tasks-cards-listagem.md | 2 escopos paralelos, footprints disjuntos
  - modo de teste recomendado: browser (nao ha suite no repo, entrega 100% visual)
- juiz-plano | juiz-layout-melhorias-ui-plan-r1 | opus | lancado (exigencia do usuario: revisor do plano antes de implementar)

## Extrato da task

- Decisoes vinculantes:
  - Item 5: TUDO em 2 colunas, card de grupo incluido (sem largura cheia). Meia coluna = 546px fixos em 1280 e 1440 (max-w-6xl satura); interior da subtask ~478px, acomodado por 6 regras INCONDICIONAIS (Debug em linha propria com w-full min-w-0; truncate + title em todo titulo, nunca break-all; timer da subtask 64->56px; input de add flex-1 min-w-0 + Button shrink-0; header do grupo min-w-0 flex-1 truncate; proibido @container).
  - Item 2: start/end/duration sai de TODA task da lista ativa; so o footer "Testes completados" mostra tempos (tempos abaixo do nome, nome do grupo ao lado do nome).
  - Item 1: token Black-450 #79818e -> #556070; trocar text-Black-400 sem dark: por text-Black-450; corpo do grupo bg-Black-100/40. (Black-400 sobre cinza do grupo media 1,96:1.)
  - Item 3: uma superficie / uma borda / um raio por card, overflow-hidden na raiz, cinza vira o interior do card.
  - Item 4: unico scroll interno do app = subtasks, max-h 420->560 + mais padding; remover scroll externo (IndexActiveTasksList) e o do footer.
  - Item 7: Box externo de page.tsx removido; lg:flex-row com timer h-32 w-32 + botoes pequenos em flex-wrap numa coluna de 200px a esquerda; IndexScore vira o Box em flex-1; mantidas as 8 estatisticas.
  - Item 6: breakpoint lg=1024px — 1 coluna abaixo, 2 acima; fileira timer+stats empilha abaixo de lg; stats 2 -> 3 (sm) -> 4 (lg) colunas. rectSortingStrategy no DnD da lista ativa.
- Criterios de aceitacao: 7 asseroes de item + 5 criterios da secao "Meia coluna" (zero overflow interno via scrollWidth<=clientWidth+2, zero texto cortado sem ellipsis, zero sobreposicao de bounding-rects na linha de acoes, debug.top>=notes.bottom, dois grupos mesmo top/left diferente/width 500-560px) + auditContrast()===[] em light/dark x 1280/390.
- Arquivos no escopo: A = page/header/timer/IndexScore | B = global.css + IndexTasks/**
- Estado de git: branch feat/layout-task-card | commit-base bd5df02
- Armadilhas: sem seed no repo (dados de teste criados 100% via UI no script Playwright); gate de permissao de notificacao precisa de shim addInitScript; timer global nao persiste em reload; sm: e viewport-breakpoint e nao serve para container de 478px; break-all foi a causa do empilhamento letra-a-letra do responsivo.png.
- Cenario/preset de teste: browser (Node+Playwright, base em .claude/tasks/2026-09-06_layout-task-card/tests-01/run.js). Preset via UI com task de titulo longo (prova truncate) + DOIS grupos (prova dois grupos lado a lado) + task completada no footer + estado vazio. 13 grupos de screenshot cobrindo vazio, task simples pendente+ativa, 2 colunas @1280, 2 colunas @1440, grupo expandido, grupo colapsado, grupo com scroll, footer expandido — em light e dark x desktop e mobile 390, + 320px para overflow.

## Log (cont.)

- juiz-plano r1 | juiz-layout-melhorias-ui-plan-r1 | opus | janela 96k | REPROVADO (6 bloqueadores) | ponteiro: review-plan-r1.md
  - itens 3,4,6,7 OK | itens 1,2,5 FRACO | premissa dos 546px CONFIRMADA no codigo (page.tsx:58)
- plan r2 | plan-layout-melhorias-ui-p2 | opus FRESCO (planner r1 fechou em 139k > teto de reuso 80k) | lancado
- plan r2 | plan-layout-melhorias-ui-p2 | opus | janela 175k | 6 bloqueadores resolvidos + 6 ressalvas (5 resolvidas, 1 aceita/registrada) | footprints seguem DISJUNTOS (escopos paralelos)
  - achado novo: Black-450 sobre Black-700 = 2,30:1 -> regra do item 1 virou par obrigatorio `text-Black-450 dark:text-Black-400` (nenhuma das 20 ocorrencias tem o par hoje)
  - atoms Input/Select passaram para o footprint do escopo B; novo `data-tasks-section` nos containers da lista ativa; gate visual J1..J7 escrito no verdict.md
- juiz-plano r2 | juiz-layout-melhorias-ui-plan-r2 | opus FRESCO | lancado
- juiz-plano r2 | juiz-layout-melhorias-ui-plan-r2 | opus | janela 129k | REPROVADO — so a secao "Politica de contraste" do item 1 | ponteiro: review-plan-r2.md
  - itens 2..7 todos OK e prontos para implementar (bloqueador 4 da r1 confirmado fechado no codigo)
  - 3 bloqueadores locais: predicado de neutralidade errado (<=16 reprova todo cinza; correto <=27), nos neutros fora da allowlist (Button White sobre Green-400/Blue-400, texto Blue-500 do Debug), e parse de cor frágil (Tailwind v4.1 compila /40 como color-mix oklab)
- plan r3 | plan-layout-melhorias-ui-p3 | opus FRESCO (p2 fechou em 175k) | lancado — escopo cirurgico: SO a secao de contraste
- plan r3 | plan-layout-melhorias-ui-p3 | opus | janela 211k (fechou acima do teto; nao reusar) | 3 bloqueadores resolvidos + 4 ressalvas
  - b1: heuristica de spread ELIMINADA -> lista explicita de rgb (Set ACCENT de 15 tokens, tol +-2); R5 = prosa==codigo
  - b2: escolheu (b) CONSERTAR — Button e ProgressBar entraram no footprint do escopo B: primary Green-500 3,77 | secondary Blue-600 5,75 | Debug Blue-600 5,75 | ProgressBar dark:text-Black-400 5,78 (era 3,04 no dark, violacao real nao vista pela r2). Isencao fechada = so <svg> de acento.
  - b3: round-trip por canvas 1x1 + auto-teste que throw (verificado no host: Black-100/40 -> oklab -> [190,198,210,0.4])
  - invariante novo: Button primary/danger exige font-bold e >=14px -> escopo A troca text-base font-medium por text-sm font-bold nos 4 branches do IndexTimer
  - footprints seguem DISJUNTOS | desvio reportado pelo agente: rodou `git status --porcelain` 1x contra a instrucao, sem efeito colateral
- juiz-plano r3 | juiz-layout-melhorias-ui-plan-r3 | opus FRESCO | lancado
- juiz-plano r3 | juiz-layout-melhorias-ui-plan-r3 | opus | janela 126k | APROVADO_COM_RESSALVAS | ponteiro: review-plan-r3.md
  - bloqueadores: vazio | itens 2..7 reconferidos OK | todos os ratios da r3 recalculados e exatos
  - ressalva 1 e OBRIGATORIA antes de implementar: prosa do "texto grande" esta errada (WCAG bold = 18,66px, nao 14px) -> primary 3,77 e danger 3,82 sao NAO-CONFORMIDADE ACEITA e registrada, nao concessao da WCAG. Corrigir prosa em plan.md l.148 e escopo-a l.45; NAO mudar o limiar do auditor nem tirar font-bold/text-sm.
- fix-prosa | fix-prosa-contraste-layout-melhorias-ui | sonnet | lancado (correcao de 2 trechos de texto, ressalva 1)
- fix-prosa | fix-prosa-contraste-layout-melhorias-ui | sonnet | janela 47k | 2 trechos de prosa corrigidos, codigo/classes/auditor intocados
- ESTAGIO PLAN FECHADO — 3 rodadas de juiz, 3 planners (r1 139k, p2 175k, p3 211k), 0 linha de codigo escrita
- implement | 2 escopos em paralelo (footprints disjuntos confirmados nas 3 rodadas) | lancados
- impl escopo A | impl-escopo-a-layout-melhorias-ui | sonnet | janela 57k | tsc exit=0 | 4 arquivos (page.tsx, IndexHeader, IndexTimer, IndexScore)
- impl escopo B | impl-escopo-b-layout-melhorias-ui | sonnet | janela 134k | tsc exit=0 | ~20 arquivos (global.css, 5 atoms, IndexTasks/**, GroupTitleContext.ts apagado)
  - 2 ressalvas cosmeticas nos proprios greps de auto-checagem (falsos positivos por substring: dark:hover:bg-Green-400 e hover:text-Blue-500), a confirmar no validate
- type-check global: tsc exit=0 | NAO existe script de lint no projeto (npm error Missing script: "lint")
- validate r1 | validate-layout-melhorias-ui-r1 | opus | janela 90k | CHANGES_REQUIRED | ponteiro: review-r1.md
  - BLOQUEANTE: IndexTaskItem.tsx:152-158 — dark:border-Black-600 foi para a parte estatica e clobbera o border-Green-400 do branch ativo (dark usa :where(), especificidade 0, mas emitido depois da base) => dark + timer rodando = card ativo sem borda verde
  - deveria corrigir: IndexReportTaskRow.tsx:16 ainda com break-all (viola decisao 6)
  - OK confirmados: 9 botoes do IndexTimer com text-sm font-bold (o 5o ponto foi coberto); zero text-Black-450 sem par dark: no src/; itens 2,3,4,5,7 sem regressao; GroupTitleContext = zero ocorrencias
  - as 2 ressalvas do implementador B foram julgadas inofensivas, mas ambas "pelo motivo errado" — registradas, nao consertadas
  - nota: a base de diff que passei (4b6e0f6) estava errada; o validador identificou e usou e49f580..a986406
- fix r1 | impl-escopo-b-layout-melhorias-ui-fix1 | sonnet FRESCO | lancado (2 achados, escopo cirurgico)
- fix r1 | impl-escopo-b-layout-melhorias-ui-fix1 | sonnet | janela 49k | tsc exit=0
  - IndexTaskItem.tsx:157 — dark:border-Green-400 adicionado ao branch ativo (dark:border-Black-600 estatico mantido para o inativo)
  - IndexReportTaskRow.tsx:16-18 — break-all -> truncate min-w-0 + title={task.title} + min-w-0 no pai
  - ATENCAO para o teste: os dois dark:border-* tem especificidade 0, entao quem ganha depende da ordem de emissao do CSS. A prova empirica e o screenshot de dark + task ativa; o tester recebe assercao explicita de computed border-color.
  - decisao: NAO re-validar (fix de 2 linhas, dentro do que o validador ja sancionou) — a verificacao vai para o teste de browser
- test 01 | test-layout-melhorias-ui-browser-r01 | sonnet browser-tester | janela 203k | FAIL | ponteiro: tests-01/verdict.md + 34 screenshots
  - PASSA: as 7 assercoes de DOM dos itens; 16/16 auditContrast() = [] sem throw; borda do card ativo em dark = Green-400 rgb(16,185,129) (o fix do bloqueante esta PROVADO); J1..J7 todas PASS contra as imagens de referencia
  - FALHA 1 (real): item 6 em 320px — IndexCompletedTaskItem.tsx:37-70, linha titulo+badge e linha Start/End/Duration transbordam 9-13px sem ellipsis (390/768/1100 limpos)
  - FALHA 2 (provavel lacuna de criterio): regra formal do item 3 acusou 3 violacoes, todas no trigger dos atoms Select/Button (border border-Black-100 bg-White), nao costura de card-dentro-de-card
  - FALHA 3 (provavel folga de criterio): secao Meia coluna crit. 5 em 1100px — card de grupo mede 503px contra teto de 440-500px do plano (3px acima)
- juiz-teste r01 | juiz-layout-melhorias-ui-test-r01 | opus | janela 88k | BOA_COM_RESSALVAS | ponteiro: tests-01/juizo-evidencia.md
  - julgamento visual: a tela esta boa DE VERDADE (ampliou os pixels com cropper proprio); item 7 e salto real vs o "antes"; costura do grupo-0.png sumiu; footer bate com tasks-completadas.png
  - achado 1 = DEFEITO e MAIS grave que o reportado (em 320px o texto passa POR BAIXO do botao de nota) -> fix de 3 classes
  - achados 2 e 3 = LACUNA_DE_CRITERIO (regra do item 3 nao devia valer para trigger de controle; faixa de 1100px estava aritmeticamente errada no plano) -> emenda, nao codigo
  - achado 4 = criterio errado que o TESTER marcou OK sem numero (debug.top >= notes.bottom) -> emenda
- fix-320 + emenda-criterios | 2 agentes em paralelo (arquivos disjuntos: IndexCompletedTaskItem.tsx vs plan.md) | lancados
- fix-320 | impl-fix-320-layout-melhorias-ui | sonnet | janela 38k | tsc exit=0 | IndexCompletedTaskItem.tsx: gap-2 sm:gap-4 (l.37), hidden sm:block (l.38), shrink-0 (l.78)
- emenda-criterios | plan-notes-emenda-criterios-layout-melhorias-ui | sonnet | janela 55k | 3 criterios emendados no plan.md + bloco "Notes apos tests-01 (FAIL)" | nenhum codigo tocado
- test 02 | test-layout-melhorias-ui-browser-r02 | sonnet browser-tester FRESCO | lancado (re-teste focado: 320px + criterio 3 em 1440/1100 + J3 + criterios emendados)
- test 02 | test-layout-melhorias-ui-browser-r02 | sonnet browser-tester | janela 234k | **PASS** | ponteiro: tests-02/verdict.md + 36 screenshots (36 md5 distintos)
  - 320px consertado: overlapsActions=false, scrollWidth==clientWidth nas duas linhas; achado sub-pixel honesto mantido (QA-100-A trunca ~0.3px com ellipsis real + title=)
  - zero regressao de 390 a 1280 (overflowElsCount:0)
  - 3 lacunas de rigor fechadas: crit. 3 medido em 1280/1440/1100 (overlapPairsInActionRow=0); J3 julgada de fato contra os screenshots de estado vazio; 3 criterios emendados re-medidos e passando
  - 7 itens + 16/16 auditContrast()=[] + borda verde em dark re-confirmados NESTA rodada (nao herdados)
  - honestidade de screenshot corrigida: 36 arquivos, 36 md5 distintos, por crop de regiao real do DOM
- juiz-teste r02 | juiz-layout-melhorias-ui-test-r02 | opus FRESCO | lancado (aprovacao final da evidencia, exigencia do usuario)
- juiz-teste r02 | juiz-layout-melhorias-ui-test-r02 | opus | janela 76k | **APROVADO_COM_RESSALVAS** | ponteiro: tests-02/juizo-evidencia.md
  - 3 debitos da rodada anterior PAGOS; 10 estados confirmados nos pixels; 7 itens ATENDIDOS
  - achou 1 afirmacao falsa na secao de honestidade (3 de 36 ainda sao mesma captura com outro nome) -> corrigida
  - 3 ressalvas esteticas registradas (fade do scroll, buraco vertical do items-start, titulo colapsado em 320px) — nenhuma impede fechar
- fix-honestidade | fix-honestidade-verdict-tests-02 | sonnet | janela 42k | secao corrigida, PASS e medicoes intactos
- TASK FECHADA — 2 rodadas de teste, 5 rodadas de juiz (3 de plano + 2 de evidencia), 1 rodada de validate

## Melhoria pos-close (pedido do usuario, imagem .claude/prompts/debug.png)

- pedido: (1) Debug compacto colado no tempo no PC, como era antes (o w-full do plano tinha quebrado a fileira); (2) remover o texto "Notes" do lado do icone (redundante)
- impl | impl-debug-inline-notes-icon-layout-melhorias-ui | sonnet | janela 84k | tsc exit=0
  - IndexTaskItem.tsx: removido label="Notes"; wrapper do Debug w-full -> w-full sm:w-auto
  - IndexDebugTimer.tsx: raiz w-full -> w-full sm:w-auto
  - IndexTaskNoteDialog.tsx: aria-label + title = "Notes" (conserta tambem o uso ja icone-only do footer, que estava sem nome acessivel)
  - a remocao do rotulo "Notes" liberou ~68px, o que tornou a forma compacta viavel sem concessao (era 474px em 478px)
- test 03 | test-layout-melhorias-ui-browser-r03 | sonnet browser-tester | **PASS** | ponteiro: tests-03/verdict.md + 9 screenshots
  - 1280/1440/1100: fileira em linha unica (height=61px), overlapPairs=0, overflowOffenders=0, gap Debug<->tempo = 24px, pill compacto (ratio 0,355-0,387)
  - 390/320: sem regressao — Debug em linha propria (height=141px, ownLine=true), docScrollWidth==docClientWidth
  - Notes: 3 botoes com aria-label="Notes" e textContent vazio (lista ativa/inativa + footer) | consoleErrors=0
- juiz-teste r03 | juiz-layout-melhorias-ui-test-r03 | opus | janela 69k | **APROVADO_COM_RESSALVAS** | ponteiro: tests-03/juizo-evidencia.md
  - mediu os pixels ele mesmo (decodificou os PNGs): pill 176px vs 178px da referencia, vao Debug->tempo 40px identico ao debug.png
  - as 2 melhorias ATENDIDAS; a11y do Notes ficou melhor que antes (o footer estava sem nome acessivel)
  - folga real em 1100px = 74px (nao esta no limite); ressalva: 1024px e o caso mais apertado (~36px), e a variante de 3 botoes zera a folga la -> pill quebra para linha propria (degradacao benigna, sem overflow)
