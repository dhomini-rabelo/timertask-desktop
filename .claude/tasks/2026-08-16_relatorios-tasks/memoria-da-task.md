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
