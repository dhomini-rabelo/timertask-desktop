# Plano — step 01 `overflow-horizontal-e-colapso-grupo`

Contrato de execução deste step. Fonte: `plan-simplified.md` (spec vinculante, P5–P9),
`recon.md` (mapa) e `../../memoria-da-task.md` (§1 evidência visual, §2.1, §2.3, §6 traps).
Nada aqui reabre P5–P9.

Git: branch `main`, base `3e3108a`. Working tree limpa exceto 3 PNGs não rastreados na raiz
(`test-1.png`, `test-2.png`, `3-active-tasks.png`) — **não tocar neles**.

---

## Premissas assumidas

Tudo abaixo foi decidido pelo planner (sem perguntar) e é **vinculante** para implementer,
revisor e testador.

- **PA1 — Existe UMA só frente de implementação neste step: o BUG A.**
  O BUG C **não** vira escopo de implementação. A leitura estática (memória §2.3, verificada
  linha a linha) provou que **não existe nenhum guard** bloqueando o colapso: o botão de `:118-127`
  é incondicional, `handleToggleCollapsed` (`:51-64`) não tem condição sobre task rodando e
  `setItemsState` é um `set` puro. Não há bug de lógica conhecido para corrigir, e tanto
  `plan-simplified.md` (§IN, último bullet) quanto a memória §2.3 (H0) proíbem explicitamente
  inventar um fix para um guard que não existe. Portanto o BUG C é **protocolo de reprodução
  empírica na etapa de teste de sistema** (seção "BUG C" abaixo), com tabela de decisão pronta.
  Só se a evidência refutar H0 é que um segundo escopo de implementação nasce — via plan-note,
  com o mecanismo real em mãos.
- **PA2 — A causa-raiz do BUG A é o `w-full` herdado; o fix mora no call site.**
  `IndexAlertSelect.tsx:22` passa `className` sem nenhuma classe de largura, então `twMerge`
  não derruba o `w-full` da base do átomo (`Select/trigger.tsx:15`). Trap N3 / P8: corrigir no
  call site, jamais no átomo (o outro consumidor, `IndexWorkflowSelector.tsx:28`, depende do `w-full`).
- **PA3 — `w-auto` (não `shrink-0` sozinho) é o que faz o `twMerge` derrubar o `w-full`.**
  `twMerge` só remove uma classe da base quando a `className` traz outra do **mesmo grupo** (`w-*`).
  `shrink-0` sozinho não resolve nada. A classe entra como `w-auto shrink-0`: `w-auto` mata o
  `w-full`, `shrink-0` impede que o select vire o "elástico" da linha em vez da barra de progresso.
- **PA4 — O fix mínimo é `w-auto` + cascata de `min-w-0`/`shrink-0`; `flex-wrap` fica como
  contingência pré-autorizada (A3), não entra de saída.** Justificativa em "Orçamento de largura".
- **PA5 — `IndexDebugTimer.tsx` NÃO é editado neste escopo.** O recon deixou em aberto se `:76`
  precisa de `min-w-0`. Decisão: **não precisa**. `IndexDebugTimer.tsx:76` é um `div` block-level
  (filho do wrapper `IndexTaskItem.tsx:276`, que é `flex-1 min-w-0`); ele **não é flex item**, logo
  `min-width:auto` não se aplica a ele e um `min-w-0` ali seria no-op. Quem absorve o encolhimento é
  a barra de progresso (`:93`, `flex-1`, conteúdo vazio ⇒ min-content 0). O botão "Debug", o tempo
  `00:00` e o Check de reset não têm ponto de quebra e permanecem no tamanho natural — que é
  exatamente o comportamento desejado (P7: nada de esconder/remover botão). Editar `IndexDebugTimer.tsx`
  neste escopo é **fora do contrato**.
- **PA6 — `flex-1` NÃO entra em `IndexTaskItem.tsx:265`.** Só `min-w-0`. Com `flex-1` o grupo da
  direita cresceria para preencher a linha e, no estado "debug nunca iniciado" (só o select dentro),
  o "5 min" sairia da direita e escorregaria para o meio da linha — regressão visual gratuita.
  `min-w-0` sozinho já destrava o encolhimento (o `flex-shrink:1` default já existe).
- **PA7 — Verificação de overflow é medida, não olhômetro.** O critério objetivo é
  `scrollWidth <= clientWidth + 1` no container de scroll da lista de ativas
  (`IndexTasks.tsx:30`, o `div.overflow-y-auto`) **e** em `document.documentElement`, nos 4 estados
  da matriz. Screenshot é evidência complementar, não o critério.
- **PA8 — Largura de janela do teste: 620×900**, para reproduzir a janela estreita dos prints
  (memória §1, "~620px de largura"). Não alargar a janela para "fazer caber" (verdict do recon).

---

## Orçamento de largura (por que A1+A2 basta e A3 é só rede de segurança)

`page.tsx:70` `max-w-2xl` → `IndexTasks.tsx:14` `max-w-[600px] p-6` ⇒ **552px úteis**.

- Task **na raiz**: 552 − `px-3` da linha de ações (24) = **528px** de conteúdo.
- Task **dentro de grupo**: 552 − `px-4` de `IndexTaskGroup.tsx:143` (32) = 520 − 24 = **496px**.
  É o caso mais apertado e **precisa** estar na matriz de teste.

Somas mínimas estimadas da linha de ações no pior estado (debug já rodado, Check visível):
grupo esquerdo (lápis 36 + lixeira 36 + Notes ≈70 + gaps) ≈ **150px**; select após o fix ≈ **100px**;
`IndexDebugTimer` no mínimo (px-3+border ≈26 + botão Debug ≈88 + tempo ≈45 + Check ≈40 + 3 gaps de 12,
barra de progresso comprimida a ~0) ≈ **235px**. Total ≈ **501px**.

⇒ Cabe em 528 (raiz) com folga pequena; em 496 (dentro de grupo) fica **no limite**. Por isso:
A1+A2 é o fix esperado, e **A3 (`flex-wrap`) é a contingência já escrita e pré-aprovada** para o
caso de o teste medir overflow residual no caso "task em grupo + debug já rodado". A3 **não** é
decisão nova a tomar depois — está especificada abaixo, literal.

---

## Escopo de implementação (ÚNICO): `overflow-linha-de-acoes`

Prompt pronto: `prompts/overflow-linha-de-acoes.md`.

Footprint: **2 arquivos, 3 linhas**.

### A1 — `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexAlertSelect.tsx:22`

`Select.Trigger` ganha classe de largura + `shrink-0` na `className` existente (mantendo
`h-8 rounded-full px-2.5 py-0 text-Black-700 text-xs` como está). Resultado esperado:
o trigger passa a ter largura de conteúdo (~100px: sino + "5 min" + chevron) em vez de 100% da linha.

### A2 — `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx`

- `:248` (grupo esquerdo, `flex items-center gap-1 transition-all`) ganha **`shrink-0`** —
  lápis/lixeira/Notes nunca são esmagados.
- `:265` (grupo direito, `flex items-center gap-2`) ganha **`min-w-0`** (e só isso, ver PA6) —
  destrava o encolhimento que hoje torna inerte o `flex-1 min-w-0` de `:276`.
- `:247` **não muda** nesta rodada (só em A3).

### A3 — contingência pré-autorizada (NÃO aplicar de saída)

Gatilho: o teste de sistema medir `scrollWidth > clientWidth + 1` em **qualquer** um dos 4 estados
depois de A1+A2. Ação, literal: adicionar **`flex-wrap`** a `IndexTaskItem.tsx:247`
(`flex items-center justify-between gap-2 …` → `flex flex-wrap items-center justify-between gap-2 …`).
Com `flex-wrap`, o grupo da direita quebra para a própria linha quando não cabe ao lado do esquerdo,
e lá (já com `min-w-0` de A2) ainda pode encolher. Nada além disso; nenhuma outra classe.

### Proibido neste escopo

- Editar `src/layout/components/atoms/Select/trigger.tsx` (P8) — **ler é permitido, editar não**.
- Editar `IndexDebugTimer.tsx` (PA5), `IndexTaskGroup.tsx`, `IndexCompletedTaskItem.tsx`.
- Editar `IndexTasks.tsx`, `page.tsx`, `global.css`, `IndexFooter.tsx` — é o step 02.
- Qualquer `overflow-x-hidden`/`overflow-hidden` como "solução" (trap N1).
- Remover botão, esconder o Debug atrás de menu, criar indicador novo (P6, P7).
- Tocar em DnD, `IndexScore`/`scoreUtils`, derivados órfãos de `useListingTasks.ts` (P9).

---

## BUG C — protocolo de reprodução (etapa de TESTE DE SISTEMA, zero código de saída)

Isto **não** é escopo de implementação (PA1). É roteiro para o agente de teste, executado
**depois** do fix A no mesmo teste de sistema, e com uma passagem **antes** do fix para comparação.

### Fixture (`localStorage["timertasks:tasks"]`, plantada ANTES da hidratação — trap do §6)

Precisa de: 1 task solta ativa (força a lista a rolar), 1 grupo com 2 filhas, **uma filha rodando**.
Formato aceito por `migrateEntry` (`useStoredTasks.ts:40-108`); workflow default = `workflow-work`.
Para o estado "debug já rodado" o item precisa de `hasBeenStarted` = existir evento
`{"type":"start"}` em `timeEvents` (`IndexTaskItem.tsx:65-67`) — a forma limpa de obter isso sem
deixar a task rodando é `timeEvents: [{"type":"start",…}, {"type":"stop",…}]`.

```json
[
  {"type":"task","id":"t0","title":"task solta","workflowId":"workflow-work","groupId":null,
   "completed":false,"isRunning":false,
   "timeEvents":[{"type":"start","createdAt":"2026-08-15T10:00:00.000Z"},
                 {"type":"stop","createdAt":"2026-08-15T10:02:00.000Z"}]},
  {"type":"group","id":"g1","title":"Grupo Teste","workflowId":"workflow-work","collapsed":false},
  {"type":"task","id":"t1","title":"filha rodando","workflowId":"workflow-work","groupId":"g1",
   "completed":false,"isRunning":false,
   "timeEvents":[{"type":"start","createdAt":"2026-08-15T10:00:00.000Z"},
                 {"type":"stop","createdAt":"2026-08-15T10:02:00.000Z"}]},
  {"type":"task","id":"t2","title":"filha parada","workflowId":"workflow-work","groupId":"g1",
   "completed":false,"isRunning":false,"timeEvents":[]}
]
```
A filha `t1` é posta a RODAR pela UI (timer global ligado + `element.click()` no Play), não pelo
fixture — `task.isRunning` não é fonte de verdade visual (trap T4).

### Passos

1. Contornar a permissão de notificação (`window.Notification.permission` getter → `'granted'`,
   `requestPermission` → resolve `'granted'`) via `browser_evaluate` ANTES de tudo, refazendo a
   cada reload. Plantar a fixture e recarregar.
2. Abrir/limpar o console do browser (H1: procurar exception no clique).
3. Localizar o chevron por DOM, sem `browser_click`: header do grupo é o `div` de
   `IndexTaskGroup.tsx:85`; o container de ações da direita é `div.flex.items-center.gap-1` (`:102`);
   o chevron é o único `<button>` filho DIRETO desse container —
   `container.querySelectorAll(':scope > button')`.
4. **Antes** do clique: registrar `getBoundingClientRect()` do chevron e comparar com o retângulo
   visível do container de scroll e do viewport. Se o botão estiver fora da área alcançável, é
   evidência direta de H0.
5. Clicar via `element.click()` em `browser_evaluate` e comparar o DOM antes/depois: o bloco
   `IndexTaskGroup.tsx:142-159` (input "Add a task..." + `IndexGroupTasksList`) some; a contagem +
   `ProgressBar` (`:133-140`) **permanece** — isso é comportamento existente, **não** é o bug.
   Ler `collapsed` no store como evidência numérica.
6. Reexpandir e conferir que o cronômetro da filha `t1` continua coerente (não zerou, não perdeu
   tempo) — P5: colapsar não para cronômetro e não grava evento `stop`.
7. Repetir 4–6 **antes** do fix A (build/branch pré-fix ou revertendo temporariamente) e **depois**,
   e comparar os rects. Se pré-fix o clique programático já funcionava mas o rect do chevron estava
   fora da área visível/alcançável, e pós-fix o clique **manual** funciona, H0 está confirmado.

### Tabela de decisão (o que fazer com cada resultado) — vinculante

| Resultado | Veredito | Ação |
|---|---|---|
| Chevron inalcançável pré-fix, alcançável e clicável pós-fix A; `collapsed` alterna; sem exception | **H0 confirmado** | **Nenhuma linha de código além do fix A.** Fechar o BUG C com evidência: screenshot antes/depois, os dois `getBoundingClientRect()` e o valor de `collapsed` no store. Registrar no `verdict.md`. |
| Exception no console ao clicar | **H1** | NÃO improvisar. Reportar a stack no `verdict.md` e abrir plan-note: aí sim nasce um segundo escopo de implementação, com o mecanismo real. |
| `collapsed` alterna e o DOM muda, mas a contagem/ProgressBar seguem visíveis e o usuário "não vê" colapso | **H2** | **Não corrigir.** É decisão de produto (o que esconder ao colapsar) e P6 proíbe elemento novo. Registrar como observação no `verdict.md` e seguir. |
| O roteiro só reproduz "o chevron do rodapé não colapsa o grupo" | **H3** | Repro inválida (é o accordion de `IndexFooter.tsx:59-64`, outro mecanismo). Refazer o roteiro no chevron certo. |
| Chevron alcançável e clicável **pré-fix** também, sem nada quebrado | H0 refutado sem mecanismo | Não inventar fix. Registrar "não reproduzido" com toda a evidência e escalar no `verdict.md`. |

---

## Critérios de aceitação do step

Objetivos, medidos, na janela 620×900 (PA8), com `npm run dev` (Vite, **porta fixa 1420**;
não existe suíte nem Docker — trap T9):

1. `npx tsc --noEmit` sem erro novo.
2. **Matriz de overflow — os 4 estados**, todos com
   `scrollWidth <= clientWidth + 1` no `div.overflow-y-auto` de `IndexTasks.tsx:30` **e** em
   `document.documentElement`:
   (a) task na raiz, debug nunca iniciado; (b) task na raiz, debug já rodado (Check de reset visível);
   (c) task dentro de grupo, debug nunca iniciado; (d) task dentro de grupo, debug já rodado.
   Para chegar em (b)/(d): com `hasBeenStarted` já true pela fixture, clicar em "Debug" via
   `element.click()` e esperar ~2s (`isActive` = `currentTimeInSeconds > 0`, `IndexDebugTimer.tsx:102`).
3. Nenhuma barra de rolagem horizontal visível e card branco não cortado ao tentar rolar na
   horizontal (evidência: screenshot de (b) e (d)).
4. `getBoundingClientRect().width` do `Select.Trigger` de alerta ≤ **140px** nos 4 estados
   (prova objetiva de que o `w-full` morreu; nos prints ele tinha ~280px).
5. Diff toca **apenas** `IndexAlertSelect.tsx` e `IndexTaskItem.tsx` (+ nada mais). `git diff --stat`
   como evidência. `trigger.tsx`, `IndexTasks.tsx`, `page.tsx`, `global.css`, `IndexFooter.tsx`,
   `IndexDebugTimer.tsx`, `IndexTaskGroup.tsx` intocados. Nenhum `overflow-x-hidden` introduzido.
6. **BUG C**: grupo com filha RODANDO colapsa e reexpande pelo chevron (clique real, não só
   programático), `collapsed` alterna no store, e ao reexpandir o cronômetro da filha segue coerente.
   Veredito do BUG C preenchido segundo a tabela de decisão acima, com evidência.
7. A barra de rolagem **vertical** da lista de ativas **continua existindo** — isso está certo neste
   step (é o step 02 que a remove). Sumiço dela aqui é regressão de escopo, não sucesso.

## Modo de teste de sistema

**Docker+browser only** — na prática `npm run dev` + Playwright MCP (não há Dockerfile nem runner
no repo, T9). Traps obrigatórias: contorno da permissão de notificação; `browser_click`/Enter não
funcionam (usar native value-setter + `dispatchEvent('input')` e `element.click()`); fixture plantada
antes da hidratação; DnD não é testável — se algo encostar em drag, registrar `## Not run`.

## Fora de escopo (repetido de propósito)

Step 02: `IndexTasks.tsx:30`, `page.tsx:54`, `global.css:44-47/67-71`, `IndexFooter.tsx` (scroll das
concluídas) e o transbordo horizontal da página inteira (N4) **se ele sobreviver** a este step.
Nada de indicador "Running" no header do grupo (P6). Nada de evento `stop` ao colapsar (P5).
`IndexScore`/`scoreUtils` seguem como estão (N5).
