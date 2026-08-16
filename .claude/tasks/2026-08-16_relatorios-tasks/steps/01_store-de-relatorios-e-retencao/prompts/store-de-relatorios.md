# Escopo `store-de-relatorios` — step 01 da task `relatorios-tasks`

Você implementa a camada de dados do relatório: store zustand novo, funções puras de retenção,
hook de persistência e uma montagem de 2 linhas. **Sem nenhuma UI e sem ler nenhum outro store.**

Git: branch `main`, base `880cb24`, working tree limpa. Verificação local: `npm run build`
(`tsc && vite build`). **Não existe lint nem test script neste repo — não invente, não instale nada.**

## Arquivos que você POSSUI (e só eles)

| Arquivo | Ação |
|---|---|
| `src/pages/index/states/reports/index.ts` | criar |
| `src/pages/index/states/reports/utils.ts` | criar |
| `src/pages/index/hooks/useStoredReports.ts` | criar |
| `src/pages/index/components/IndexTasks/IndexTasks.tsx` | editar (1 import + 1 chamada) |

## Moldes a espelhar (leia nas âncoras, não varra o projeto)

- Store: `src/pages/index/states/workflows/index.ts:32-79` — `interface XStore { state; actions }`,
  `create<XStore>((set, get) => { function setState(partial) {...} ... return { state, actions } })`.
- Hook de persistência: `src/pages/index/hooks/useStoredWorkflows.ts:10-56` — o arquivo INTEIRO é o
  molde (3 efeitos: hidratar / espelhar ref / gravar).
- Funções puras: `src/pages/index/states/tasks/utils.ts:1-4` (sem `create`, sem `set`/`get`, sem React).
- Montagem: `src/pages/index/components/IndexTasks/IndexTasks.tsx:3` (import) e `:10` (`useStoredTasks()`).

**NÃO use `src/pages/index/hooks/useStoredTasks.ts:145-191` como molde** — é o `beforeunload`, que está
explicitamente fora deste step.

## 1. `states/reports/index.ts`

Copie os tipos LITERALMENTE (nomes fixos; os steps 02/03/04 já estão escritos contra eles), todos
exportados:

```ts
export interface DailyReportTask {
  id: string;
  title: string;
  workflowId: string | null;
  workflowTitle: string | null;
  groupTitle: string | null;
  secondsToday: number;
  completedAt: string | null;   // ISO string, NUNCA Date
}

export interface DailyReportEntry {
  date: string;                 // "yyyy-MM-dd" LOCAL
  cycles: number;
  focusedSeconds: number;
  completedCount: number;
  tasks: DailyReportTask[];     // [] depois da retenção
  namesPurged: boolean;
}

export interface ReportsState {
  entriesByDate: Record<string, DailyReportEntry>;
}
```

Store `useReportsState` no molde acima, estado inicial `{ entriesByDate: {} }`, com duas actions:

- `setEntriesState(entriesByDate)` — substitui o mapa inteiro.
- `upsertDailyEntry(date, entry)` — lê `get().state.entriesByDate` e devolve objeto NOVO
  `{ ...atual, [date]: { ...entry, date } }` (a chave do mapa é a fonte da verdade do campo `date`).
  **Substitui o dia inteiro**; a mesclagem por `id` de task é do step 02, não sua.

⚠️ **Trap T2:** todo retorno de `set` tem de incluir `actions: store.actions`. Sem isso o zustand
substitui o objeto inteiro e as actions somem em silêncio.
`index.ts` **não** importa `utils.ts` (direção única, sem ciclo).

## 2. `states/reports/utils.ts`

`import { format, startOfDay, subDays } from "date-fns";` (já é dependência do projeto) e os tipos de
`./index` como import de tipo.

| Símbolo | Assinatura | Regra |
|---|---|---|
| `RETENTION_DAYS` | `= 7` | exportada |
| `getDayKey` | `(date: Date) => string` | `format(date, "yyyy-MM-dd")`. **Nunca `toISOString().slice(0,10)`** — é UTC e erra o dia à noite em GMT-3 |
| `getRetentionWindowStartKey` | `(today: Date) => string` | `getDayKey(startOfDay(subDays(today, RETENTION_DAYS - 1)))` — 7 dias corridos INCLUINDO hoje |
| `normalizeEntry` | `(raw: unknown, fallbackDate: string) => DailyReportEntry` | ver abaixo |
| `normalizeEntriesByDate` | `(raw: unknown) => Record<string, DailyReportEntry>` | itera as chaves do objeto, chama `normalizeEntry(valor, chave)`; descarta chave cujo valor não é objeto |
| `applyRetention` | `(entriesByDate: Record<string, DailyReportEntry>, today: Date) => { entries: Record<string, DailyReportEntry>; changed: boolean }` | ver abaixo |
| `getEntriesInWindow` | `(entriesByDate: Record<string, DailyReportEntry>, today: Date, days?: number) => DailyReportEntry[]` | `days` default `RETENTION_DAYS` |

**Comparação de dia é comparação de STRING.** `"yyyy-MM-dd"` ordena lexicograficamente igual a
cronologicamente — use `<` / `>=` direto entre as strings. Nada de `parseISO`, nada de `Date`
intermediário na comparação.

`applyRetention`: para cada dia com `entry.date < getRetentionWindowStartKey(today)` **e** que ainda
tenha `tasks.length > 0` ou `namesPurged !== true`, produza um objeto NOVO
`{ ...entry, tasks: [], namesPurged: true }` — `date`, `cycles`, `focusedSeconds` e `completedCount`
são PRESERVADOS. Dias dentro da janela ficam intocados (não "despurgue" quem já tem
`namesPurged: true`). Se nada mudou, devolva **a mesma referência** de `entriesByDate` e
`changed: false`. Tem de ser idempotente: rodar duas vezes seguidas dá o mesmo resultado e
`changed: false` na segunda. Nunca mutar o objeto de entrada (React Compiler está ligado).

`normalizeEntry` (hidratação defensiva): `date` → string ou `fallbackDate`; `cycles`,
`focusedSeconds`, `completedCount` → número finito ou `0`; `namesPurged` → `raw.namesPurged === true`;
`tasks` → `Array.isArray(...)` mapeado por um helper interno de task (não precisa exportar) que
**descarta entradas sem `id: string`** e cai para `""` / `null` / `0` campo a campo, com `completedAt`
sendo string ISO ou `null` (nunca `Date`).
⚠️ **Trap T3: use `??` / type-guard, NUNCA `||`** — `0` e `false` são valores legítimos aqui.

`getEntriesInWindow`: filtra `date >= getDayKey(startOfDay(subDays(today, days - 1)))` e
`date <= getDayKey(today)`, ordena do **mais recente para o mais antigo**, devolve só os dias
presentes no mapa (não sintetize dias vazios — isso é decisão de view do step 03). Ela é consumida
pelos steps 03/04; exporte-a mesmo sem consumidor hoje.

## 3. `hooks/useStoredReports.ts`

Molde `useStoredWorkflows.ts:10-56`, mesma forma, mesmos guards `typeof window === "undefined"`.

- `const localStorageKey = "timertasks:reports";` (chave livre, nenhuma outra persistência do app é tocada).
- Refs: `hasHydratedRef` (`false`) e `entriesRef` (inicializada com o valor do store).
- **Efeito 1 — hidratar** (dep `[setEntriesState]`): `getItem`; sem valor ⇒ `setEntriesState({})`;
  com valor ⇒ `JSON.parse` → `normalizeEntriesByDate` → `applyRetention(normalizado, new Date())` →
  `setEntriesState(entries)`; `catch` ⇒ `setEntriesState({})`. Sem migração, sem versão de schema.
  ⚠️ Nos **TRÊS** ramos, antes de retornar, faça `hasHydratedRef.current = true` **e**
  `entriesRef.current = <o mesmo valor que você passou para setEntriesState>`. Sem o primeiro, o save
  nunca dispara; sem o segundo, o efeito 3 do mesmo commit grava `{}` por cima do que veio do disco.
  (Essa segunda linha é uma adição deliberada ao molde — mantenha-a.)
- **Efeito 2 — espelho** (dep `[entriesByDate]`): `entriesRef.current = entriesByDate;`
- **Efeito 3 — gravar** (dep `[hasHydratedRef, entriesByDate]`): sai se `!hasHydratedRef.current`;
  `localStorage.setItem(localStorageKey, JSON.stringify(entriesRef.current))` — lê do **ref**, nunca da
  variável do closure.
- Retorna `entriesByDate`.

O hook usa só `entries` de `applyRetention` e **ignora `changed` de propósito** (o campo existe para os
steps 02/03). Não remova `changed` do retorno da função.

## 4. `IndexTasks.tsx`

Duas linhas, nada mais: o import ao lado do de `useStoredTasks` (`:3`) e `useStoredReports();`
imediatamente abaixo de `useStoredTasks();` (`:10`). JSX, header e `useListingTasks` ficam intactos.

## Decisões vinculantes (não reabra, não pergunte)

- **P1/P2** storage próprio, chave `timertasks:reports` — o relatório NÃO é derivado do store de tasks
  (o botão Reset apagaria o histórico).
- **P3** chave do dia `"yyyy-MM-dd"` em hora **local**.
- **P4** retenção = 7 dias corridos rolantes incluindo hoje; fora dela os NOMES somem do disco e
  `cycles`/`focusedSeconds`/`completedCount` permanecem.
- **P12** sem migração e sem versionamento; chave ausente ou JSON inválido ⇒ `{}`.
- **P13** a retenção **não** toca em `timertasks:tasks` nem em `timertasks:workflows`.
- **P16** zero dependência nova.

## FORA DE ESCOPO — não faça

- Importar/ler `useTasksState`, `useCountdownTimerState`, `useWorkflowsState`, `scoreUtils` (é o step 02).
- Qualquer componente, botão, dialog, ícone ou texto visível (steps 03/04).
- `beforeunload`, flush no unload, migração, versão de schema.
- Editar `useStoredTasks.ts`, `IndexScore.tsx`, `countdownTimer.ts`, `states/tasks/*`.
- Criar `*.test.ts`, instalar vitest/jest, rodar `npm test`.
- Reusar/estender `Task`, `TaskItem` ou `TaskGroup` — `DailyReportTask` é um tipo próprio.

## Critérios de aceite

1. `npm run build` passa, sem `any` implícito e sem import não usado.
2. Numa instalação limpa, após montar o app, `localStorage["timertasks:reports"]` existe e vale `{}`.
3. Semeando dois dias (um de hoje, um de ~30 dias atrás, ambos com `tasks` nomeadas, `cycles`,
   `focusedSeconds`, `completedCount`) e recarregando: o dia antigo fica `tasks: []`,
   `namesPurged: true`, com `date`/`cycles`/`focusedSeconds`/`completedCount` idênticos aos semeados;
   o dia de hoje fica idêntico ao semeado.
4. Um segundo reload não altera mais nada (idempotência).
5. Valor inválido na chave (ex.: `"{{{"`) vira `{}` após reload, sem erro no console.
6. Criar/iniciar/concluir task e recarregar continua funcionando; `timertasks:tasks` e
   `timertasks:workflows` intactos.
7. Depois de um `setEntriesState`, `useReportsState.getState().actions` ainda tem as duas actions
   (prova da trap T2).
