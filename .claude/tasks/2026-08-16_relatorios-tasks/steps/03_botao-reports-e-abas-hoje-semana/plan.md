# plan.md — step 03 · `botao-reports-e-abas-hoje-semana`

Classe: `julgamento`. Escopos de implementação: **1** (`reports-dialog`).
Git: branch `main`, base `0aa4e5b`, working tree limpa para esta feature.

---

## Premissas assumidas

Tudo aqui foi decidido pelo planner (nada volta ao usuário). Revisor e testador leem como VINCULANTE.

### D1 — Escopo do badge de workflow (P8): **por aba renderizada, a partir do snapshot**

O badge de workflow (`workflowTitle`) aparece numa linha **somente quando a aba atualmente
renderizada contém mais de um workflow distinto**, calculado sobre as tasks visíveis daquela aba:

```
distinctWorkflowKeys = new Set(visibleTasks.map((t) => t.workflowId ?? "__none__"))
showWorkflowBadge = distinctWorkflowKeys.size > 1
```

- **Today**: `visibleTasks` = as tasks concluídas de hoje.
- **Week**: `visibleTasks` = o **pool** de todas as tasks concluídas dos dias da janela
  (calculado UMA vez para a aba inteira, **não** por dia).

Razão (uma linha): o relatório é um snapshot autocontido — ele só tem `workflowTitle` gravado, nunca
consulta o store vivo de workflows (que pode ter renomeado/deletado o workflow), e uma flag calculada
por aba mantém o badge estável enquanto o usuário rola a lista, em vez de piscar entre as seções de
dia da mesma semana.

Detalhe de render: o badge só é emitido quando `showWorkflowBadge === true` **E**
`task.workflowTitle` é não-nulo/não-vazio (uma task com `workflowId === null` não tem título para
mostrar, mas ainda conta como uma chave distinta no `Set`).

**Proibido**: importar/ler `useWorkflowsState` (ou qualquer store de workflows) dentro do dialog.

### D2 — `formatDuration`: **cópia local no novo diretório**, não export do `IndexScore.tsx`

`formatDuration` (`IndexScore.tsx:12-23`) é copiada — corpo idêntico — para
`IndexReportsDialog/reportsViewUtils.ts`. Razão (uma linha): P10 e o OUT do step proíbem alterar
`IndexScore.tsx`, e a nova pasta já precisa de um módulo de formatação próprio (ela também espelha o
`formatClockTime` privado de `IndexCompletedTaskItem.tsx:16-22`), então a cópia mantém o footprint em
**um único arquivo existente editado** (`IndexTasks.tsx`). Memória §4 autoriza explicitamente
("pode ser copiado ou extraído"). **`IndexScore.tsx` NÃO é tocado, nem para adicionar `export`.**

### D3 — Formatações

- Totais (cabeçalho de recorte): `formatDuration(focusedSeconds)` → `"2h 15m"` (D2).
- Duração por linha de task: `formatTime(task.secondsToday)` de `src/code/utils/date.ts`
  (`HH:MM:SS`/`MM:SS`) — binding do `plan-simplified.md`.
- Horário de conclusão: `new Date(task.completedAt).toLocaleTimeString([], { hour: "2-digit",
  minute: "2-digit" })` — **sem segundos** (o mold `formatClockTime` tem segundos porque é a timeline
  de eventos; num relatório o minuto basta). Rótulo da coluna: `Done {hora}`.
- Cabeçalho de dia (aba Week): `format(parseISO(entry.date), "EEE, MMM d")` do `date-fns`
  (já é dependência, memória §5), com o sufixo `" · Today"` quando `entry.date === getDayKey(new Date())`.

### D4 — Fonte dos totais: campos PERSISTIDOS, nunca recomputados das tasks

`focusedSeconds` / `cycles` / `completedCount` vêm direto da `DailyReportEntry`. Nunca somar
`secondsToday` das linhas visíveis nem contar as linhas para produzir os totais — os campos
persistidos são exatamente os que sobrevivem à retenção (memória §3) e incluem tempo de tasks
**não concluídas** (P7).

### D5 — Ordenação

- Semana: usar a ordem devolvida por `getEntriesInWindow` (**já vem mais-recente-primeiro**,
  `utils.ts:122-124`) — **não re-ordenar**.
- Tasks dentro de um dia: ordenar por `completedAt` **ascendente** (comparação de string ISO, sem
  `new Date()`), para o dia ler cronologicamente.

### D6 — Estado do dialog

Controlado (`useState<boolean>` + `onOpenChange`), molde `IndexTaskNoteDialog.tsx:77`. A aba volta a
`"today"` toda vez que o dialog ABRE (`if (open) setActiveTab("today")`).

### D7 — Ícone do gatilho

`BarChart3` do `lucide-react` (verificado: existe em `lucide-react@^0.555.0`,
`node_modules/lucide-react/dist/esm/icons/bar-chart-3.js`). Ícones dos totais: `Clock`, `Zap`,
`CheckCircle2` — os três já são usados em `IndexScore.tsx:1`.

### D8 — Sem `Dialog.Footer`

Não há ação a confirmar; o `Dialog.Content` já traz o botão de fechar (`content.tsx`). Não adicionar
footer nem botão "Close".

---

## Arquivos

### Editado (1)

| Arquivo | Âncora | Mudança |
|---|---|---|
| `src/pages/index/components/IndexTasks/IndexTasks.tsx` | `:20-28` | envolver o bloco de título num `<div className="flex items-start justify-between gap-4">`, manter o `<div className="flex flex-col gap-2">` interno intacto, e adicionar `<IndexReportsDialog />` como irmão à direita. Import novo em `:6-9` (bloco de imports relativos, ordem alfabética: `./IndexReportsDialog/IndexReportsDialog` entra depois de `./IndexFooter/IndexFooter`). **NÃO tocar em `:12-16`** (ordem de hooks load-bearing, trap do recon). |

### Novos — todos em `src/pages/index/components/IndexTasks/IndexReportsDialog/` (7)

| Arquivo | Papel | Teto |
|---|---|---|
| `IndexReportsDialog.tsx` | shell: gatilho + `Dialog.Root` controlado + estado da aba + leitura do store + montagem das duas views | ~110 linhas |
| `IndexReportsTabs.tsx` | segmented control Today/Week (dois `<button>`, sem lib) | ~40 |
| `IndexReportsTotals.tsx` | cabeçalho de totais do recorte (3 métricas) | ~50 |
| `IndexReportsDaySection.tsx` | uma seção de dia da aba Week: cabeçalho de data + métricas compactas + linhas/estado vazio | ~55 |
| `IndexReportTaskRow.tsx` | uma linha de task concluída (título, badges, Done, Duration) | ~55 |
| `IndexReportsEmptyState.tsx` | texto de estado vazio (3 usos distintos) | ~15 |
| `reportsViewUtils.ts` | `formatDuration` (cópia D2), `formatCompletedAt`, `formatDayHeading`, `getCompletedTasks`, `hasAnyActivity`, `shouldShowWorkflowBadge` — puro, zero React | ~60 |

### READ-ONLY (não editar em hipótese alguma)

`src/pages/index/states/reports/index.ts`, `states/reports/utils.ts`, `hooks/useStoredReports.ts`,
`hooks/useReportsSync.ts`, `components/IndexScore.tsx`, `IndexFooter/*`, `states/tasks/*`,
`states/countdownTimer.ts`, qualquer atom em `layout/components/atoms/`.

---

## Split de componentes e fluxo de dados

### `IndexReportsDialog.tsx` (shell)

```
const entriesByDate = useReportsState((store) => store.state.entriesByDate);
const [isOpen, setIsOpen] = useState(false);
const [activeTab, setActiveTab] = useState<"today" | "week">("today");

const now = new Date();                                   // recalculado a cada render, de propósito
const todayKey = getDayKey(now);                          // states/reports/utils
const todayEntry = entriesByDate[todayKey] ?? null;
const weekEntries = getEntriesInWindow(entriesByDate, now); // default days = RETENTION_DAYS = 7 (P5)
```

- Imports do store: `useReportsState` de `../../../states/reports`; `getDayKey`/`getEntriesInWindow`
  de `../../../states/reports/utils`. (Profundidade a partir de
  `components/IndexTasks/IndexReportsDialog/` → `../../../states/...`; para atoms →
  `../../../../../layout/components/atoms/Dialog`. Conferir contra os imports de
  `IndexActiveTasksList/IndexTaskNoteDialog.tsx`, que está na mesma profundidade.)
- **Só leitura.** Nenhuma action, nenhum `useStoredReports`/`useReportsSync` aqui (já montados em
  `IndexTasks.tsx:12-15`).
- Gatilho: `<Dialog.Trigger>` com um `<button type="button">` **cru** (não o atom `Button`, trap T10),
  classes espelhando `IndexDarkModeToggle.tsx:11` + label:
  `"flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl border border-Black-100 bg-White text-Black-500 text-sm font-medium transition-colors hover:bg-Black-100 dark:border-Black-600 dark:bg-Black-700 dark:text-White dark:hover:bg-Black-600"`
  com `<BarChart3 className="w-4 h-4" />` + `Reports`. O `shrink-0` é obrigatório (memória §6:
  card `max-w-[600px]`).
- `<Dialog.Content title="Reports" description="Completed tasks, focused time and cycles."
  className="w-[640px] max-h-[80vh] overflow-auto">` (largura binding do `plan-simplified.md`).
- Corpo: `<div className="flex flex-col gap-4">` com `<IndexReportsTabs />`, depois a view da aba
  ativa dentro de `<div className="flex flex-col gap-3 max-h-[60vh] overflow-auto pr-1">`
  (scroll interno, molde `IndexTaskNoteDialog.tsx:94`).

**View Today**
```
todayCompleted = getCompletedTasks(todayEntry)              // [] se todayEntry === null
showWorkflowBadge = shouldShowWorkflowBadge(todayCompleted)
<IndexReportsTotals focusedSeconds={todayEntry?.focusedSeconds ?? 0}
                    cycles={todayEntry?.cycles ?? 0}
                    completedCount={todayEntry?.completedCount ?? 0} />
todayCompleted.length > 0
  ? todayCompleted.map((task) => <IndexReportTaskRow key={task.id} ... />)
  : <IndexReportsEmptyState text="No tasks completed today yet." />
```

**View Week**
```
weekTotals = weekEntries.reduce(...)   // soma focusedSeconds / cycles / completedCount (D4)
weekPool   = weekEntries.flatMap(getCompletedTasks)
showWorkflowBadge = shouldShowWorkflowBadge(weekPool)   // UMA flag para a aba inteira (D1)
<IndexReportsTotals {...weekTotals} />
weekEntries.length > 0
  ? weekEntries.map((entry) => <IndexReportsDaySection key={entry.date} entry={entry}
                                 showWorkflowBadge={showWorkflowBadge} isToday={entry.date === todayKey} />)
  : <IndexReportsEmptyState text="No activity in the last 7 days." />
```

### `IndexReportsTabs.tsx`

Props: `{ activeTab: "today" | "week"; onChange: (tab: "today" | "week") => void }`.
Sem lib de tabs (não existe atom Tabs no repo — recon). Dois `<button type="button">` num container:

- container: `"inline-flex items-center gap-1 p-1 rounded-xl bg-Black-100/50 dark:bg-Black-700 w-fit"`
- ativo: `"px-3 py-1.5 rounded-lg text-sm font-medium bg-White text-Black-700 dark:bg-Black-600 dark:text-White"`
- inativo: `"px-3 py-1.5 rounded-lg text-sm font-medium text-Black-400 transition-colors hover:text-Black-500 dark:text-Black-400 dark:hover:text-White"`

Usar `twMerge` (já é dependência, ver `IndexScore.tsx:2`) ou um ternário simples — indiferente.

### `IndexReportsTotals.tsx`

Props: `{ focusedSeconds: number; cycles: number; completedCount: number }`.
Grid de 3 tiles (`"grid grid-cols-3 gap-3"`), cada tile:
`"flex flex-col gap-1 p-3 rounded-xl bg-Black-100/30 dark:bg-Black-700"`, com
`<span className="text-xs text-Black-400 flex items-center gap-1.5">` (ícone `w-3.5 h-3.5` + rótulo) e
`<span className="text-lg font-bold text-Black-700 dark:text-White">` (valor).

| Tile | Ícone | Rótulo | Valor |
|---|---|---|---|
| 1 | `Clock` | `Focused` | `formatDuration(focusedSeconds)` |
| 2 | `Zap` | `Cycles` | `String(cycles)` |
| 3 | `CheckCircle2` | `Completed` | `String(completedCount)` |

### `IndexReportsDaySection.tsx`

Props: `{ entry: DailyReportEntry; showWorkflowBadge: boolean; isToday: boolean }`.

```
<div className="flex flex-col gap-2">
  <div className="flex items-center justify-between gap-2">
    <span className="text-sm font-semibold text-Black-700 dark:text-White">
      {formatDayHeading(entry.date, isToday)}
    </span>
    <span className="text-xs text-Black-400">
      {formatDuration(entry.focusedSeconds)} · {entry.cycles} cycles · {entry.completedCount} done
    </span>
  </div>
  {corpo}
</div>
```

Corpo (cobre a armadilha da retenção — `tasks: []` com totais preservados):

```
completed = getCompletedTasks(entry)
completed.length > 0            -> completed.map(<IndexReportTaskRow />)
entry.namesPurged               -> <IndexReportsEmptyState text="Task names are no longer retained for this day." />
hasAnyActivity(entry)           -> <IndexReportsEmptyState text="No tasks completed on this day." />
caso contrário                  -> <IndexReportsEmptyState text="No activity on this day." />
```
(a ordem dos ramos é exatamente essa)

### `IndexReportTaskRow.tsx`

Props: `{ task: DailyReportTask; showWorkflowBadge: boolean }`.
Espelhar o ESTILO de `IndexFooter/IndexCompletedTaskItem.tsx:47-79` — **sem importar o componente**
(ele exige `Task`/`timeEvents`, que o relatório não tem):

- card: `"flex flex-col gap-1 p-4 rounded-xl bg-white border border-Black-100/30 dark:bg-Black-700 dark:border-Black-600"`
- título: `<span className="text-sm font-medium text-Black-450 dark:text-Black-400 break-all">{task.title}</span>`
  (`break-all` é obrigatório — memória §6)
- linha meta: `<div className="flex items-center flex-wrap gap-2 text-xs text-Black-400">` contendo,
  nesta ordem:
  1. badge de grupo, se `task.groupTitle`:
     `"px-2 py-0.5 rounded-full font-medium bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400 break-all"`
  2. badge de workflow, **apenas se `showWorkflowBadge && task.workflowTitle`** (D1): mesmas classes
     do badge de grupo
  3. `<span className="font-medium">Done {formatCompletedAt(task.completedAt)}</span>`
  4. `<span className="font-medium">Duration {formatTime(task.secondsToday)}</span>`
     (`formatTime` de `src/code/utils/date.ts`)

Sem checkbox/chevron/nota — a linha do relatório não é interativa.

### `IndexReportsEmptyState.tsx`

Props: `{ text: string }`. Molde `IndexTasks.tsx:37-42`:
`<div className="py-6 flex items-center justify-center"><span className="text-base text-Black-400">{text}</span></div>`.

### `reportsViewUtils.ts` (puro, sem React)

```ts
formatDuration(seconds: number): string              // cópia literal de IndexScore.tsx:12-23 (D2)
formatCompletedAt(completedAt: string | null): string // "--:--" quando null; senão toLocaleTimeString hour/minute 2-digit (D3)
formatDayHeading(date: string, isToday: boolean): string // format(parseISO(date), "EEE, MMM d") + (isToday ? " · Today" : "")
getCompletedTasks(entry: DailyReportEntry | null): DailyReportTask[]
  // entry?.tasks.filter((t) => t.completedAt !== null) ?? [], ordenado ASC por completedAt (string) — D5
  // NUNCA mutar entry.tasks: copiar antes de ordenar ([...].sort) — trap T13 (React Compiler)
hasAnyActivity(entry: DailyReportEntry): boolean
  // entry.focusedSeconds > 0 || entry.cycles > 0 || entry.completedCount > 0
shouldShowWorkflowBadge(tasks: DailyReportTask[]): boolean
  // new Set(tasks.map((t) => t.workflowId ?? "__none__")).size > 1
```

Tipos importados como `import type { DailyReportEntry, DailyReportTask } from "../../../states/reports";`

---

## Como Today e Week leem o store

| | Today | Week |
|---|---|---|
| Fonte | `entriesByDate[getDayKey(new Date())]` | `getEntriesInWindow(entriesByDate, new Date())` (default 7 dias = P5) |
| Ausência | `undefined` → tratar como `null` → totais zerados + empty state | array vazio → empty state |
| Ordem | n/a | **já vem mais-recente-primeiro; não re-ordenar** (D5) |
| Totais | campos da própria entry (D4) | soma dos campos das entries da janela (D4) |
| Lista | `tasks.filter(completedAt != null)` (P6) | por dia, mesma regra, dentro de `IndexReportsDaySection` |
| Retenção | irrelevante (hoje nunca é purgado) | `tasks: []` + `namesPurged` → mostra totais + linha explicativa |

---

## Critérios de aceite

1. `npx tsc --noEmit` limpo (único gate automatizado do repo — memória §8 T9). Nada de `npm test`,
   nada de criar `*.test.*`.
2. Botão "Reports" (ícone + rótulo) visível no canto superior direito do card de Tasks, alinhado ao
   topo, sem empurrar/quebrar o `<h2>Tasks</h2>` com o card em `max-w-[600px]`.
3. Clique abre o dialog "Reports" com a aba **Today** ativa; alternar para **Week** e voltar funciona
   e não perde estado do resto do app.
4. Aba Today: 3 totais (Focused / Cycles / Completed) vindos da entry de hoje + uma linha por task
   concluída hoje com título, `Done HH:MM` e `Duration`.
5. Aba Week: os mesmos 3 totais somados na janela de 7 dias + uma seção por dia presente,
   mais recente primeiro, com cabeçalho de data e métricas compactas do dia.
6. Estados vazios cobertos: sem entry hoje; janela sem entries; dia com totais e `tasks: []`
   (`namesPurged`) mostrando os totais + a linha explicativa.
7. Badge de workflow segue D1 (some quando todas as tasks visíveis da aba são do mesmo workflow).
8. Toda classe de cor nova tem par `dark:` (trap T11) — screenshots claro e escuro no teste.
9. Nenhum arquivo fora da tabela "Editado/Novos" foi modificado
   (`git status` do implementador deve mostrar exatamente 1 arquivo modificado + 7 novos).

## Fora de escopo (explícito)

- Histórico agregado de dias fora da janela de 7 dias → **step 04**.
- Qualquer escrita no store de reports; qualquer action; qualquer hook novo de sync/persistência.
- Export CSV/JSON, gráficos, seletor de data, edição/remoção de registro (P15).
- Alterar `IndexScore.tsx` (nem para exportar `formatDuration` — D2), `IndexFooter/*`, os stores de
  tasks/reports/timer, ou qualquer atom (P10).
- Rota/página nova, lib de tabs, lib de datas nova.

## Modo de teste de sistema

**Docker+browser only** (`npm run dev` em `http://localhost:1420` + Playwright MCP,
`.claude/docs/browser-instructions.md`). Não existe runner de testes no repo (memória §8 T9), e este
step é 100% UI de leitura: o único sinal possível é abrir o app, concluir uma task, abrir o dialog e
conferir as duas abas nos dois temas.

## Escopos de implementação

Um só: `prompts/reports-dialog.md`. O footprint é uma pasta nova + uma edição de 4 linhas no mesmo
arquivo que a consome — não há duas frentes disjuntas para separar.
