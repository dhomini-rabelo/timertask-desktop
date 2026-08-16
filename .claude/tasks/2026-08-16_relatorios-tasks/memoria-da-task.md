# memoria-da-task.md — relatorios-tasks

Memória entre steps. Cada step é executado por agentes NOVOS que só têm este arquivo + o
`plan-simplified.md` do seu step. Tudo aqui é resultado de leitura real do código no commit `a0284a0`
(branch `main`, working tree limpa). Nenhum grep abaixo precisa ser refeito.

---

## 1. O pedido, em uma frase operacional

No canto superior direito do card de Tasks entra um botão **"Reports"**. Ele abre uma view onde se vê
as tasks concluídas **hoje** e **na semana** (com nome). Passados 7 dias, o **nome** das tarefas é
apagado do disco, mas **ciclos** e **horas trabalhadas** daquele dia continuam salvos e visíveis.

Consequência que define a arquitetura inteira: **isso não pode ser derivado do store de tasks**, porque
o botão "Reset" apaga tasks (ver §2.4) e não existe hoje nenhuma persistência de ciclos (ver §5).
Portanto: **store novo + chave nova de `localStorage` + hook de sync**.

---

## 2. Mapa do domínio (leitura real, não refazer)

### 2.1 Store de tasks — `src/pages/index/states/tasks/index.ts` (388 linhas)

Zustand no formato `{ state, actions }` (padrão de TODOS os stores do projeto).

| Símbolo | Linhas | O que importa |
|---|---|---|
| `TaskTimeEvent` | `5-8` | `{ type: "start" \| "stop" \| "complete"; createdAt: Date }` — `Date` vivo em memória, string no JSON |
| `BaseTaskItem` | `10-15` | `id`, `title`, `workflowId: string \| null`, `note?` |
| `Task` | `17-23` | `type:"task"`, `groupId: string \| null`, `completed`, `isRunning`, `timeEvents[]` |
| `TaskGroup` | `25-28` | `type:"group"`, `collapsed` |
| `isTask` / `isTaskGroup` | `32-38` | type guards — **usar sempre estes**, o array `items` é heterogêneo |
| `toggleTask` | `169-194` | ao COMPLETAR empurra um evento `{type:"complete"}`; ao DES-completar **não remove** o evento |
| `deleteItem` | `196-213` | remove o item e, se for grupo, as tasks filhas |
| `executeTask` / `stopTask` | `311-367` | empurram `start` / `stop` |
| `clearItems` | `295-309` | **apaga todos os itens do workflow selecionado** — o inimigo nº 1 do histórico |

Fatos que valem contrato:
- Não existe status "arquivado". O ciclo de vida da task é: existe → é deletada/limpa. Nada sobrevive.
- `timeEvents` é append-only na prática, **exceto** por `deleteItem` / `clearItems`, que levam o array
  inteiro embora.
- Um `complete` NÃO é removido ao desmarcar a task; por isso `calculateTasksCompleted`
  (`scoreUtils.ts:74-88`) conta tasks que já foram concluídas alguma vez, e não `completed === true`.

### 2.2 Cálculo de tempo — `src/pages/index/states/tasks/utils.ts` (75 linhas)

| Símbolo | Linhas | O que faz |
|---|---|---|
| `calculateTotalTimeInSeconds(events)` | `4-35` | soma `start→stop|complete`; se sobrou um `start` aberto, soma até `new Date()` |
| `getTimeRangeFromEvents(events)` | `37-70` | primeiro `start` e último `stop|complete` (`endTime = agora` se aberto) |
| `shouldAutoStart(timeEvents)` | `72-75` | último evento é `start` |

### 2.3 Agregados — `src/pages/index/states/tasks/scoreUtils.ts` (127 linhas)

| Símbolo | Linhas | Observação |
|---|---|---|
| `calculateTaskTimeToday(events)` | `10-56` | **peça-chave do step 02**: soma só a interseção dos intervalos com `[startOfDay(hoje), agora]`; trata intervalo aberto (`46-53`) |
| `calculateTotalFocusedTime(items)` | `58-64` | soma tudo, sem recorte de dia |
| `calculateTodayFocusedTime(items)` | `66-72` | **CÓDIGO MORTO HOJE** — definido e nunca importado (grep completo em §6). É exatamente "horas trabalhadas hoje"; o step 02 deve REUSAR, não reescrever |
| `calculateTasksCompleted(items)` | `74-88` | conta quem tem qualquer evento `complete` (apesar do nome interno `hasCompletedToday`, **não** filtra por dia — drift pré-existente, não corrigir aqui) |
| `calculateCurrentStreak(items)` | `90-127` | usa `startOfDay(...).toISOString()` como chave de dia |

### 2.4 O que destrói dado hoje

- `clearItems` (`states/tasks/index.ts:295-309`), acionado pelo botão **Reset** em
  `IndexFooter.tsx:31-33` + `:67-76`. Apaga as tasks do workflow selecionado.
- `deleteItem` (`states/tasks/index.ts:196-213`).
- `deleteWorkflow` em `states/workflows/index.ts` (tasks órfãs deixam de aparecer em
  `useListingTasks`, que exige `item.workflowId === selectedWorkflowId`).

### 2.5 Listagem/derivação — `src/pages/index/hooks/useListingTasks.ts` (37 linhas)

Deriva `groups`, `tasks`, `completedTasks`, `activeListItems`… **sempre filtrando pelo workflow
selecionado** (`:6-12`). Por isso o relatório (P8: global) **não** deve passar por ele — deve ler
`useTasksState((store) => store.state.items)` direto, como o `IndexScore` já faz.

---

## 3. O contrato de dados que o step 01 cria (VINCULANTE para 02, 03 e 04)

Nomes e formato são fixos. Steps posteriores consomem exatamente isto.

```ts
// src/pages/index/states/reports/index.ts
export interface DailyReportTask {
  id: string;                    // id da task de origem (chave da mesclagem — P11)
  title: string;                 // apagado pela retenção junto com o item inteiro
  workflowId: string | null;
  workflowTitle: string | null;  // snapshot do título no dia (workflow pode ser renomeado/deletado)
  groupTitle: string | null;     // snapshot, mesma razão
  secondsToday: number;          // tempo rastreado NAQUELE dia (recorte de dia, não total da task)
  completedAt: string | null;    // ISO do evento `complete` daquele dia; null = teve tempo mas não concluiu
}

export interface DailyReportEntry {
  date: string;                  // "yyyy-MM-dd" LOCAL (P3)
  cycles: number;                // acumulado por delta (P9)
  focusedSeconds: number;        // soma de secondsToday das entradas do dia (P7)
  completedCount: number;        // quantas foram concluídas — SOBREVIVE à retenção
  tasks: DailyReportTask[];      // [] depois da retenção
  namesPurged: boolean;          // true = nomes já foram apagados do disco
}

export interface ReportsState {
  entriesByDate: Record<string, DailyReportEntry>; // chave = date
}
```

Por que uma estrutura só serve às duas leituras do §P6/P7: a **lista** de "tasks feitas" filtra
`completedAt != null`; o **total de horas** soma `secondsToday` de TODAS as entradas. Não criar duas
listas paralelas.

`focusedSeconds` e `completedCount` são campos DERIVADOS, mas persistidos de propósito: são eles que
sobrevivem à retenção quando `tasks` vira `[]`.

---

## 4. Molde a espelhar, por step (concreto)

| Step | Molde que JÁ EXISTE | Onde |
|---|---|---|
| 01 (store) | store zustand `{ state, actions }` com `setXState` | `states/workflows/index.ts:37-...`, `states/tasks/index.ts:63-75` |
| 01 (hook de persistência) | hidratar no mount → `hasHydratedRef` → gravar em efeito no change → `try/catch` que cai para o default | `hooks/useStoredWorkflows.ts:10-56` (o mais curto/limpo) e `hooks/useStoredTasks.ts:118-200` (tem também o `beforeunload`) |
| 01 (montagem do hook) | `useStoredTasks()` chamado no topo do componente que precisa | `components/IndexTasks/IndexTasks.tsx:10` |
| 02 (recorte de dia) | `calculateTaskTimeToday` | `states/tasks/scoreUtils.ts:10-56` |
| 02 (ref de valor anterior) | `itemsRef` + efeito de espelho | `hooks/useStoredTasks.ts:122`, `:145-147` |
| 03 (botão no header do card) | botão com ícone `lucide-react`, `rounded-xl`, borda + dark variants | `IndexDarkModeToggle.tsx:8-20` (neutro/outline) e `IndexWorkflowDialog.tsx:10-15` (azul sólido) |
| 03 (dialog largo + scroll interno) | `Dialog.Root` controlado + `Dialog.Content className="w-[550px] max-h-[80vh] overflow-auto"` | `IndexTaskNoteDialog.tsx:75-117` |
| 03 (dialog simples com lista) | `Dialog.Root` não controlado + `Dialog.Footer` | `IndexWorkflowDialog.tsx:7-27` |
| 03/04 (linha de task com horários e badge) | badge de grupo + `Start/End/Duration` com `formatTime` | `IndexFooter/IndexCompletedTaskItem.tsx:44-92` |
| 03/04 (formatação `Xh Ym`) | `formatDuration(seconds)` | `IndexScore.tsx:12-23` (privado ao arquivo — pode ser copiado ou extraído) |
| 03/04 (linha de métrica com ícone + rótulo) | grid de score | `IndexScore.tsx:66-94` |
| 04 (estado vazio) | texto centrado `text-base text-Black-400` | `IndexTasks.tsx:31-38` |

### 4.1 Atoms disponíveis (`src/layout/components/atoms/`)

- `Dialog` — `index.tsx` exporta `{ Root, Trigger, Content, Footer }`. `Root` aceita
  `isOpen`/`onOpenChange` (controlado) ou nada (não controlado) — `Dialog/root.tsx:12-16`.
  `Content` recebe `title`, `description?`, `className?`; já traz overlay, título, descrição e botão X
  (`Dialog/content.tsx:14-58`). Largura padrão `w-[420px] max-w-[90vw]` (`:30`) — **sobrescrever via
  `className` para o relatório**, como o `IndexTaskNoteDialog` faz.
- `Box` — card branco `rounded-[24px]` + sombra + dark (`Box/index.tsx:9-16`).
- `Button` — variantes `primary` (verde) / `danger` (vermelho) / `secondary` (azul). **Padding padrão
  gigante `px-16 py-4`** (`Button/index.tsx:26`); todo uso pequeno sobrescreve via `className`
  (ex.: `IndexFooter.tsx:71`, `IndexTaskNoteDialog.tsx:82`).
- `Input`, `Select`, `ProgressBar`, `Logo` — não são necessários nesta task.

### 4.2 Tokens de cor (`src/layout/styles/global.css:6-33`)

`White`, `Green-100/300/400/500`, `Red-100/400/500`, `Blue-100/300/400/500/600`,
`Yellow-100/400/500`, `Black-100/200/300/400/450/500/600/700/800/900`.
Dark mode é classe `.dark` na raiz (`@custom-variant dark`, `global.css:4`; toggle em
`layout/hooks/useDarkMode.ts`, chave `theme`). **Toda cor nova precisa do par `dark:`** — é o erro de
revisão mais comum neste repo.

---

## 5. FOOTPRINT — greps já executados (não refazer)

**`localStorage` (todas as ocorrências do `src/`):**
- `hooks/useStoredWorkflows.ts:8` `timertasks:workflows`, `:20`, `:52`
- `hooks/useStoredTasks.ts:4` `timertasks:tasks`, `:126`, `:180-183`, `:196`
- `layout/hooks/useDarkMode.ts:18`, `:65`, `:67` — chave `theme`

⇒ **`timertasks:reports` é livre.** Nenhuma outra persistência existe no app.

**`totalCycles` (todas):** `states/countdownTimer.ts:11` (tipo), `:77` (no `setState` campo-a-campo),
`:205` (`goBackToWork` → `+1`, **único incremento do app**), `:296` (inicial `0`);
`components/IndexScore.tsx:26-27`, `:38` (leitura).
⇒ **`countdownTimer` é 100% memória**: nenhum `localStorage`, nenhum hook `useStored*`. Reload zera.

**`scoreUtils` (importadores):** só `components/IndexScore.tsx:8-10` importa
`calculateTasksCompleted`, `calculateTotalFocusedTime` e `calculateCurrentStreak`.
⇒ `calculateTodayFocusedTime` (`scoreUtils.ts:66-72`) e `calculateTaskTimeToday` (`:10-56`, usada
internamente) estão **livres para reuso**, e a primeira é código morto hoje.

**`date-fns` (importadores):** `states/countdownTimer.ts:2`, `states/tasks/utils.ts:1`,
`states/tasks/scoreUtils.ts:1-6`, `layout/components/common/Timer/hooks/useCountUpTimer.ts:1`.
⇒ `format`, `startOfDay`, `subDays`, `isSameDay`, `parseISO` estão disponíveis sem instalar nada.

**Árvore de render (`pages/index/page.tsx:56-84`):** `IndexHeader` → coluna esquerda
(`IndexTimer` + `IndexScore`) → coluna direita (`IndexTasks`). Tudo é montado **só depois** de
`permissionStatus === "granted"` (`:63-66`) — ver trap T5.

**Testes:** `find src -name "*.test.*" -o -name "*.spec.*"` ⇒ **vazio**. `package.json` tem apenas
`dev`, `build`, `preview`, `tauri` — **não existe runner nem suíte**. Ver trap T9.

---

## 6. Onde exatamente a UI entra (step 03)

`src/pages/index/components/IndexTasks/IndexTasks.tsx` (48 linhas), header do card:

```
:14  <Box className="w-full max-w-[600px] ml-auto p-6 flex flex-col gap-8">
:15    <div className="flex flex-col gap-2">          ← título + descrição
:16-18   <h2 …>Tasks</h2>
:19-22   <p …>Manage your daily tasks…</p>
:23    </div>
```

O "canto superior direito do card" = uma linha `flex items-start justify-between` envolvendo o bloco
`:15-23` e o novo gatilho. O bloco de texto deve continuar `flex-col`; o botão vai como irmão à
direita, alinhado ao topo (`shrink-0`).

Cuidado de layout (herdado da task `correcao-layout-tasks`): o card tem `max-w-[600px]` e títulos de
task usam `break-all`. Qualquer coisa nova no header precisa de `shrink-0` para não empurrar o `<h2>`.

---

## 7. Dependências e ordem entre steps

- **01 → 02**: o step 02 só escreve através das actions e dos utilitários puros criados no 01.
  Ele **não** redefine os tipos do §3 nem toca no arquivo de retenção.
- **02 → 03**: quando o 03 começa, a chave `timertasks:reports` já existe e já é alimentada com o dia
  corrente. O 03 **só lê** o store — nenhuma escrita, nenhum cálculo de agregação novo.
- **03 → 04**: o 04 acrescenta uma seção DENTRO do dialog que o 03 criou; não cria dialog novo, não
  mexe no botão, não mexe nas abas Today/Week.
- Nenhum step depende de mudanças no `countdownTimer.ts` além de LER `totalCycles` (P10: o store do
  timer não é modificado em nenhum step).

---

## 8. Traps encontradas no código (ler antes de implementar)

- **T1 — `Date` vira `string` no `localStorage`.** `useStoredTasks.ts:33-38` (`reviveEvents`) existe
  exatamente por isso. No store de reports, `completedAt` já nasce **string ISO** (§3) justamente para
  não precisar de revive; **não** transformar em `Date` no tipo persistido.
- **T2 — `setState` campo-a-campo.** `countdownTimer.ts:66-85` enumera todos os campos com `??`;
  o store de tasks usa spread. Ao criar o store de reports, seguir o padrão de `tasks`/`workflows`
  (spread/objeto novo), não o de `countdownTimer`. E lembrar: em zustand aqui o retorno do `set`
  **precisa devolver `actions` junto** (`states/tasks/index.ts:69-74`) — omitir `actions` apaga as
  actions do store.
- **T3 — `?? ` com `0` e `false`.** Vários campos numéricos vindos do JSON são `0` legítimo;
  usar `??` (não `||`) ao normalizar entradas hidratadas.
- **T4 — Loop de gravação.** O padrão dos hooks existentes grava num `useEffect` dependente do estado
  e lê de uma `ref` (`useStoredTasks.ts:193-197`). Se o sync do step 02 gravar no store a cada render
  sem comparar o valor anterior, entra em loop infinito de re-render. **Só escrever quando o payload
  calculado diferir do que já está no store** (comparação por campos, não por identidade de objeto).
- **T5 — Nada monta antes da permissão de notificação.** `page.tsx:63-66` bloqueia todo o conteúdo
  enquanto `permissionStatus !== "granted"`. Consequência para o teste de browser: se a tela mostrar
  o pedido de permissão, o hook de reports **não montou** — não é bug do step.
- **T6 — `clearItems` / Reset é o caso de teste obrigatório.** Depois do Reset, o relatório de hoje
  tem de continuar mostrando as tasks e as horas (P11). É o critério que prova que o store novo não é
  só um espelho do store de tasks.
- **T7 — `calculateTasksCompleted` (`scoreUtils.ts:74-88`) NÃO filtra por dia**, apesar do nome da
  variável interna `hasCompletedToday`. Drift pré-existente do `IndexScore`. **Não corrigir nesta
  task** (P10) e **não reusar** essa função para o relatório — o step 02 precisa do evento `complete`
  com `createdAt` DENTRO do dia.
- **T8 — Fuso/virada de dia.** O app raciocina em dia local (`startOfDay(new Date())`). Formatar a
  chave do dia com `format(date, "yyyy-MM-dd")` do date-fns (local), **nunca** `toISOString().slice(0,10)`
  (que é UTC e erra o dia à noite em GMT-3).
- **T9 — Não existe suíte de testes nem runner** (§5). Todo step é validado no browser com
  `npm run dev` + Playwright MCP, seguindo `.claude/docs/browser-instructions.md`. Não tentar
  `npm test`, não instalar vitest, não criar `*.test.ts` — foi assim nas 3 tasks anteriores deste
  repo.
- **T10 — `Button` tem padding gigante por padrão** (`Button/index.tsx:26`, `px-16 py-4`). Qualquer
  botão pequeno precisa sobrescrever via `className` (ex.: `IndexFooter.tsx:71`).
- **T11 — Dark mode obrigatório em toda classe de cor nova** (§4.2). Screenshot nos dois temas é
  parte do teste de UI (precedente: task `tempo-extra-descanso`, step 02).
- **T12 — `user-select: none` global** (`global.css:36-39`). Texto do relatório não será selecionável;
  é intencional no app, não reportar como bug nem alterar.
- **T13 — React Compiler ligado** (`babel-plugin-react-compiler` no `package.json`; ver
  `vite.config.ts`). Evitar mutação de objetos vindos do store; sempre criar objetos novos.
- **T14 — `beforeunload` grava tasks com um `stop` sintético** (`useStoredTasks.ts:149-191`). Se o
  step 02 quiser um "flush" no unload, seguir esse mesmo molde — e lembrar que a ordem entre os dois
  handlers não é garantida, então o sync de reports não pode depender do que o handler de tasks
  gravou.

---

## Padrões capturados no step 01 (FECHADO — commits `a9817e6`, `e292440`)

- **Contrato final, sem mudanças em relação à memória §3.** `src/pages/index/states/reports/index.ts`
  exporta `DailyReportTask`, `DailyReportEntry`, `ReportsState` exatamente como especificado, mais o
  store `useReportsState` com `actions.setEntriesState(entriesByDate)` e
  `actions.upsertDailyEntry(date, entry)`. `upsertDailyEntry` **substitui o dia inteiro** (não faz
  merge por `id` de task) — a mesclagem por `id` (P11) é 100% responsabilidade do step 02.
- **`states/reports/utils.ts` pronto para uso pelo step 02**: `getDayKey(date: Date): string`,
  `RETENTION_DAYS = 7` (exportada), `getRetentionWindowStartKey(today)`, `getEntriesInWindow(entriesByDate,
  today, days = RETENTION_DAYS)` (só dias presentes no mapa, mais recente primeiro). Todas usam
  comparação de STRING `yyyy-MM-dd`, nunca `Date`/`parseISO` no meio.
- **Hook `useStoredReports()` já está montado** em `IndexTasks.tsx` ao lado de `useStoredTasks()` e
  hidrata/persiste `timertasks:reports` sozinho. O step 02 **não precisa (e não deve) criar outro
  hook de persistência** — ele só chama as actions do store já existente para gravar o dia corrente;
  a gravação em disco já acontece via este hook.
- **Ressalva conhecida, não-bloqueante (`review-r1.md`)**: em `useStoredReports.ts` o efeito-espelho
  (linhas 40-42) roda DEPOIS do efeito de hidratação no mesmo commit de mount e sobrescreve
  `entriesRef.current` com o valor stale (`{}`) antes do efeito de gravação rodar — o valor correto só
  vai para o disco no commit seguinte (mesmo comportamento do molde `useStoredWorkflows.ts`, não é
  regressão deste step). Resultado final no disco está correto (comprovado no teste), mas se o step 02
  precisar depurar por que o primeiro `setItem` grava `{}`, a causa é essa, não um bug novo.
- **`applyRetention` é idempotente e devolve a MESMA referência quando nada muda** — o step 02 pode
  chamar `applyRetention` de novo sem medo de disparar re-render/gravação à toa (React Compiler, trap
  T13), desde que compare por `changed`.
- **Teste de sistema deste tipo de step (data-layer sem UI) usa `browser_evaluate` sobre
  `localStorage`, não cliques.** Vite roda em `http://localhost:1420` neste projeto (não 5173 — Tauri
  usa porta fixa, ver `vite.config.ts` se precisar confirmar de novo). O gate de permissão de
  notificação (trap T5) às vezes já vem `granted` no contexto do Playwright entre execuções — não
  assumir que vai sempre aparecer o prompt.

---

## Padrões capturados no step 02 (FECHADO — commits `7359665`, `f415558`)

- **`timertasks:reports` no disco é `entriesByDate` DIRETO, sem wrapper.** `useStoredReports.ts`
  persiste `JSON.stringify(entriesRef.current)` onde `entriesRef` é o `Record<string, DailyReportEntry>`
  já — a chave `"entriesByDate"` só existe no tipo `ReportsState` em memória (zustand), não no JSON.
  Ao ler no browser: `JSON.parse(localStorage.getItem("timertasks:reports"))["yyyy-MM-dd"]`, e não
  `...["entriesByDate"]["yyyy-MM-dd"]`. Steps 03/04, ao ler o store React normalmente
  (`useReportsState((s) => s.state.entriesByDate)`), não são afetados — isso só importa para quem lê o
  `localStorage` cru (testes de browser).
- **Gate de hidratação = ORDEM de hooks, não um `hasHydrated` exposto.** `useReportsSync()` é montado
  DEPOIS de `useStoredTasks()`/`useStoredReports()` em `IndexTasks.tsx` e lê o estado de forma
  IMPERATIVA (`useXState.getState()`, nunca um seletor reativo) no mesmo commit de mount — não depende
  de re-render. Qualquer novo hook que precise ler "o disco já hidratado" segue o mesmo molde: ordem de
  declaração + leitura imperativa, em vez de inventar uma flag de hidratação cruzando hooks.
- **Guarda anti-loop para efeitos que escrevem no PRÓPRIO domínio que outro pedaço do app lê**: nunca
  assinar reativamente o slice que a escrita target atualiza (aqui, `entriesByDate` dentro de
  `useReportsSync`) — ler esse slice só via `getState()` — E comparar o próximo valor por CONTEÚDO
  (campo a campo, nunca `JSON.stringify` como comparador nem comparação por referência) antes de
  chamar a action de escrita. As duas metades são obrigatórias sempre que a action de escrita retorna
  objeto novo por spread (padrão de todo store deste repo — T2).
- **Delta de um contador que zera sozinho** (aqui `totalCycles`, 100% em memória): usar 3 refs —
  "último valor visto", "acumulado persistido" e "chave do período corrente" (aqui, o dia). Somar ao
  acumulado só quando o valor vivo CRESCE; ao cair, apenas realinhar (`Math.max(acumulado, disco)`),
  nunca subtrair/zerar. Vira o dia (ou o período): reseedar as refs a partir do que já está gravado no
  novo período, não a partir de zero puro — protege contra o efeito rodar de novo com o dia trocado
  antes do reseed. Esse molde serve para qualquer contador futuro que só existe em memória.
- **Mesclagem "hoje" que sobrevive a uma ação destrutiva no store de origem** (aqui, Reset/`clearItems`
  apagando tasks): a base da mesclagem é sempre o que já está no disco, iterado na SUA própria ordem;
  ids ausentes no snapshot vivo são mantidos INTACTOS (nunca removidos); ids presentes recebem os
  campos do vivo exceto os que são monotônicos por natureza (aqui `secondsToday`/`completedAt`, via
  `Math.max`/`?? `) — isso garante que nenhuma leitura do sync possa fazer o dado persistido regredir.
  O teste que prova esse padrão é sempre "disparar a ação destrutiva e reler a chave persistida".
- **Testando um contador de ciclos que depende de tempo real de UI (Pomodoro) sem mexer no código**:
  Playwright tem relógio virtual (`page.clock.install()` + `fastForward()` via
  `browser_run_code_unsafe`) que avança o timer do app sem esperar minutos reais e sem precisar de
  nenhum hook de "modo debug/rápido" no app (não existe um, e não deve ser criado só para teste — T9).
  Cliques reais de mouse do Playwright travaram neste ambiente; `element.click()` via JS foi o
  workaround usado.
- **`npx tsc --noEmit` é o único gate de qualidade automatizado do repo** (sem lint script, sem
  runner) — confirma T9: `package.json` só tem `dev/build/preview/tauri`.

---

## Padrões capturados no step 03 (FECHADO — commits `9e40c3a`, `c8b0a4a`)

- **Badge de workflow é decidido por-ABA, não por-dia.** `showWorkflowBadge` é calculado uma vez sobre
  o pool de tasks visível na aba inteira (Today = as concluídas hoje; Week = `flatMap` de todos os dias
  da janela) e o mesmo booleano é repassado a todas as seções de dia dentro daquela aba — nunca
  recalculado por dia individual. Fórmula: `new Set(tasks.map(t => t.workflowId ?? "__none__")).size > 1`.
  Qualquer view futura que leia o relatório e precise decidir "mostrar badge de workflow" segue este
  mesmo escopo (por-view-inteira, não por-subseção).
- **`formatDuration` não foi exportado de `IndexScore.tsx` — foi COPIADO** para um util próprio da
  nova pasta (`reportsViewUtils.ts`). Padrão do repo confirmado: view nova que precisa de uma função
  "privada ao arquivo" de outra view copia, não refatora a origem para exportar (evita acoplar duas
  telas por um util incidental). Vale para o step 04 se precisar da mesma formatação.
  `formatCompletedAt`/tempo "Done HH:MM" (sem segundos, `"--:--"` quando `null`) segue o mesmo molde de
  cópia, espelhando `IndexCompletedTaskItem.tsx`.
- **Totais de cabeçalho (Today/Week/por-dia) são SEMPRE os campos persistidos do contrato**
  (`focusedSeconds`/`cycles`/`completedCount`), nunca recomputados a partir das linhas de task
  filtradas/visíveis. Isso é o que faz o cabeçalho continuar correto mesmo quando `tasks` já foi
  purgado pela retenção (`namesPurged: true`, `tasks: []`) — um dia purgado ainda mostra números certos
  no cabeçalho e só perde as linhas. Qualquer seção nova (step 04) que agregue por período deve somar
  estes três campos de cada `DailyReportEntry`, nunca `.length` de uma lista já filtrada.
  Ordenação: a ordem de `getEntriesInWindow` (mais-recente-primeiro) NUNCA é re-ordenada; dentro de um
  dia, as tasks são copiadas (`[...entry.tasks]`, trap T13) antes de `.sort()` por `completedAt` ASC.
- **`<button>` cru dentro de `Dialog.Trigger asChild`, nunca o atom `Button`**, para gatilhos pequenos
  com ícone — confirma T10 na prática: nenhum uso pequeno de botão neste repo usa o atom `Button` sem
  overrides pesados de `className`; o molde `IndexWorkflowDialog.tsx` é o caminho de menor fricção.
- **Estado vazio de relatório tem 4 ramos, não 2**: (1) tem tasks concluídas → linhas; (2)
  `namesPurged === true` → texto "nomes não retidos" MAS ainda mostra os totais do cabeçalho; (3) tem
  atividade (cycles/focusedSeconds > 0) mas 0 concluídas → "No tasks completed on this day."; (4)
  nenhuma atividade → "No activity on this day." O erro fácil é colapsar (2) e (3)/(4) num só "vazio"
  — são estados semanticamente diferentes e o teste de sistema deste step provou que (3) ocorre na
  prática (dia com ciclos rodados mas nenhuma task concluída).
- **Teste de sistema deste tipo de step (UI de leitura sobre um store já povoado) prova corretude por
  DIFF contra `localStorage`, não só lendo a tela**: ler `localStorage.getItem("timertasks:reports")`
  via `browser_evaluate` nos mesmos instantes em que a UI é lida, e comparar campo a campo — nunca só
  "a tela parece certa". O caso de aceite mais importante de todos é sempre o mesmo desta task inteira:
  disparar o Reset (que apaga o board de tasks) e confirmar que a entrada do dia no relatório
  (horas/ciclos/concluídas/linhas) sobrevive inalterada — não é opcional, é o motivo de existir do
  store separado (memória §1).
- **Cuidado operacional para o step 04 (ou qualquer step futuro deste loop): nunca lançar o tester em
  `run_in_background: true`.** Neste step um tester em background ficou "solto" sem produzir
  `verdict.md` de forma tempestiva; um segundo tester em foreground (`run_in_background: false`) foi
  quem efetivamente fechou o step, e por coincidência os dois chegaram a escrever no mesmo
  `tests-01/screenshots/` ao mesmo tempo. Testers deste loop sempre em foreground, uma tentativa por
  vez.
