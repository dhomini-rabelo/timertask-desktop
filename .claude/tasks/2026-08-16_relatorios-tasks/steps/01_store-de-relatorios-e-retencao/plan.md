# plan.md — step 01 · `store-de-relatorios-e-retencao`

Task `relatorios-tasks`. Branch `main`, base commit `880cb24`, working tree limpa.
Batch de perguntas: **sem dúvidas** (0 tópicos) — P1..P16 já estão travadas em
`../../answers.md` e recortadas em `plan-simplified.md`.

Escopos de implementação: **1** (`store-de-relatorios`).
Modo de teste de sistema: **Docker+browser only** (não existe runner no repo — trap T9).

---

## Premissas assumidas

Tudo aqui foi decidido pelo planner em vez de perguntar. É **vinculante** para o implementador,
o revisor e o testador.

- **A1 — Comparação de dia é comparação de string.** `"yyyy-MM-dd"` é lexicograficamente igual a
  cronologicamente. Toda a retenção e toda a janela usam `>=` / `<` entre strings; **nenhum
  `parseISO`, nenhum `Date` intermediário** na comparação. Isso é o que torna `applyRetention`
  idempotente e imune a fuso (trap T8).
- **A2 — `RETENTION_DAYS = 7`, exportada de `utils.ts`.** `getRetentionWindowStartKey(today)` =
  `getDayKey(startOfDay(subDays(today, RETENTION_DAYS - 1)))` (P4: 7 dias corridos INCLUINDO hoje).
  `getEntriesInWindow` recebe `days` com **default `RETENTION_DAYS`**, para que P5 ("semana" da UI =
  janela da retenção) saia de graça no step 03.
- **A3 — `applyRetention` devolve a MESMA referência quando nada muda** (`changed: false`), e devolve
  objetos novos só para os dias efetivamente purgados (trap T13: React Compiler — nunca mutar). Um dia
  está "a purgar" quando `entry.date < janela` E (`entry.tasks.length > 0` OU `entry.namesPurged !== true`).
  Dias dentro da janela **não são tocados** — inclusive não se "despurga" quem já tem `namesPurged: true`.
- **A4 — A purga preserva os agregados.** `cycles`, `focusedSeconds`, `completedCount` e `date`
  sobrevivem; só `tasks` vira `[]` e `namesPurged` vira `true` (P4). Nada é deletado da chave do mapa —
  o dia continua existindo, só sem nomes.
- **A5 — `normalizeEntry` é defensiva por campo, com `??`/type-guard, NUNCA `||`** (trap T3): `0` e
  `false` são valores legítimos. Tasks sem `id` string são DESCARTADAS na normalização (o `id` é a
  chave de mesclagem do P11 — uma entrada sem ele é lixo). `completedAt` fica **string ISO ou `null`**;
  não vira `Date` em lugar nenhum (trap T1).
- **A6 — `upsertDailyEntry(date, entry)` SUBSTITUI o dia inteiro** e força `entry.date = date` (a chave
  do mapa é a fonte da verdade). A mesclagem por `id` do P11 é responsabilidade do **step 02**, que
  monta a entry final antes de chamar a action. O step 01 não implementa merge.
- **A7 — `utils.ts` importa os tipos de `./index` (import de tipo); `index.ts` NÃO importa `utils.ts`.**
  Direção única, sem ciclo. `index.ts` fica com tipos + store; `utils.ts` fica com funções puras
  (mesma divisão de `states/tasks/index.ts` x `states/tasks/utils.ts`).
- **A8 — O hook grava a `entriesRef` já no efeito de hidratação**, em todos os três ramos, antes de
  retornar. Isso é uma diferença deliberada (e de 1 linha) em relação ao molde
  `useStoredWorkflows.ts:18-43`: sem ela, o efeito de save do MESMO commit de mount grava o `{}`
  inicial por cima do que acabou de ser lido do disco, e só o commit seguinte corrige. Não é
  refatoração do molde — é o molde mais essa linha.
- **A9 — O hook usa só `entries` de `applyRetention` e ignora `changed`.** `changed` existe no contrato
  porque os steps 02/03 precisam dele (evitar regravação à toa); no step 01 ele é deliberadamente não
  consumido. **Não é código morto a ser removido pelo revisor.**
- **A10 — `getEntriesInWindow` devolve só os dias PRESENTES no mapa**, ordenados do mais recente para o
  mais antigo, com corte inferior `>= startKey` e superior `<= getDayKey(today)` (protege contra relógio
  adiantado). **Não sintetiza dias vazios** — preencher buraco é decisão de view, do step 03.
- **A11 — Nada de `beforeunload`, nada de versionamento, nada de migração** (P12, trap T14). O molde é
  `useStoredWorkflows.ts` inteiro e SÓ ele; as linhas 145-191 de `useStoredTasks.ts` são para ignorar.
- **A12 — Verificação local do implementador: `npm run build`** (`tsc && vite build`). Não existe lint
  nem test script (`package.json` só tem `dev`/`build`/`preview`/`tauri`).

---

## Escopo único: `store-de-relatorios`

Prompt pronto: `prompts/store-de-relatorios.md`.

### Arquivos que o escopo POSSUI

| Arquivo | Ação |
|---|---|
| `src/pages/index/states/reports/index.ts` | **criar** — tipos §3 da memória + store zustand |
| `src/pages/index/states/reports/utils.ts` | **criar** — funções puras (dia, janela, retenção, normalização) |
| `src/pages/index/hooks/useStoredReports.ts` | **criar** — hidratar/purgar/persistir `timertasks:reports` |
| `src/pages/index/components/IndexTasks/IndexTasks.tsx` | **editar** — 1 import + 1 chamada |

Nenhum outro arquivo é tocado. Total: 3 criados, 1 editado (dentro do teto de 6 do recon).

### `states/reports/index.ts`

Tipos **copiados literalmente** da memória §3 (`DailyReportTask`, `DailyReportEntry`, `ReportsState`),
todos `export`ados — os steps 02/03/04 já estão escritos contra esses nomes.

Store no molde `states/workflows/index.ts:37-79`:

- `useReportsState = create<ReportsStore>((set, get) => { ... })`, com `interface ReportsStore
  { state: ReportsState; actions: ReportsActions }`.
- `setState(partial: Partial<ReportsState>)` interno, com `entriesByDate: partial.entriesByDate ??
  store.state.entriesByDate` e **`actions: store.actions` no retorno do `set`** (trap T2 — omitir
  apaga todas as actions).
- Actions exportadas pelo store:
  - `setEntriesState(entriesByDate: Record<string, DailyReportEntry>): void` — substitui o mapa inteiro
    (usada pela hidratação).
  - `upsertDailyEntry(date: string, entry: DailyReportEntry): void` — lê `get().state.entriesByDate`,
    devolve objeto novo `{ ...atual, [date]: { ...entry, date } }` (A6).
- Estado inicial: `{ entriesByDate: {} }`.

### `states/reports/utils.ts`

Puras: sem `create`, sem `set`/`get`, sem React, sem `localStorage` — molde `states/tasks/utils.ts:1-4`.
Import: `import { format, startOfDay, subDays } from "date-fns"` (P16, nada novo instalado).

| Símbolo | Assinatura | Regra |
|---|---|---|
| `RETENTION_DAYS` | `const = 7` | A2 |
| `getDayKey` | `(date: Date) => string` | `format(date, "yyyy-MM-dd")` — **nunca** `toISOString().slice(0,10)` (trap T8) |
| `getRetentionWindowStartKey` | `(today: Date) => string` | `getDayKey(startOfDay(subDays(today, RETENTION_DAYS - 1)))` |
| `normalizeEntry` | `(raw: unknown, fallbackDate: string) => DailyReportEntry` | A5 |
| `normalizeEntriesByDate` | `(raw: unknown) => Record<string, DailyReportEntry>` | usa a chave do mapa como `fallbackDate`; descarta chaves cujo valor não é objeto |
| `applyRetention` | `(entriesByDate, today: Date) => { entries: Record<string, DailyReportEntry>; changed: boolean }` | A3 + A4, idempotente |
| `getEntriesInWindow` | `(entriesByDate, today: Date, days?: number) => DailyReportEntry[]` | A10, `days = RETENTION_DAYS` |

Detalhe de `normalizeEntry` (A5): `date` → string ou `fallbackDate`; `cycles`/`focusedSeconds`/
`completedCount` → número finito ou `0`; `tasks` → `Array.isArray(...)` mapeado por um
`normalizeTask` (interno ao arquivo, pode não ser exportado) que descarta o que não tem `id: string`
e cai para `""`/`null`/`0` campo a campo; `namesPurged` → `raw.namesPurged === true`.

### `hooks/useStoredReports.ts`

Molde direto de `hooks/useStoredWorkflows.ts:10-56` — mesma estrutura de 3 efeitos, mesmo `typeof
window === "undefined"` guard, mesmo `hasHydratedRef`.

- `const localStorageKey = "timertasks:reports";` (P2 — chave livre, memória §5).
- Efeito 1 (hidratar): `getItem` → sem valor ⇒ `{}`; com valor ⇒ `JSON.parse` →
  `normalizeEntriesByDate` → `applyRetention(normalized, new Date())` → `setEntriesState(entries)`;
  `catch` ⇒ `{}` (P12). **`hasHydratedRef.current = true` e `entriesRef.current = <valor aplicado>` nos
  TRÊS ramos** (trap do recon + A8).
- Efeito 2 (espelho): `entriesRef.current = entriesByDate` com dep `[entriesByDate]`.
- Efeito 3 (gravar): sai se `!hasHydratedRef.current`; `localStorage.setItem(localStorageKey,
  JSON.stringify(entriesRef.current))`, dep `[hasHydratedRef, entriesByDate]` — lê do **ref**, nunca da
  variável do closure.
- Retorna `entriesByDate` (simetria com o molde).

### `components/IndexTasks/IndexTasks.tsx`

Exatamente duas linhas: o import ao lado de `useStoredTasks` (`:3`) e `useStoredReports();` logo abaixo
de `useStoredTasks();` (`:10`). Nada mais no arquivo muda — JSX, `useListingTasks` e header ficam
intactos (o header é do step 03).

---

## Critérios de aceite

1. `npm run build` passa (tsc + vite), sem `any` implícito e sem import não usado.
2. Abrir o app e conceder a permissão de notificação (trap T5) faz `localStorage["timertasks:reports"]`
   existir, valendo `{}` numa instalação limpa.
3. Semeando a chave com dois dias — um de hoje e um de ~30 dias atrás, ambos com `tasks` nomeadas,
   `cycles`, `focusedSeconds` e `completedCount` — e recarregando: o dia antigo fica com `tasks: []` e
   `namesPurged: true`, com `cycles`/`focusedSeconds`/`completedCount`/`date` **iguais aos semeados**;
   o dia de hoje fica **byte-a-byte igual** ao semeado.
4. Recarregar uma segunda vez não muda mais nada (idempotência de `applyRetention`).
5. Um valor inválido na chave (ex.: `"{{{"`) vira `{}` após reload, sem erro no console e sem quebrar a
   tela (P12).
6. O fluxo de tasks existente continua funcionando: criar, iniciar, concluir e recarregar mantém
   `timertasks:tasks` e `timertasks:workflows` intactos (P13 — a retenção não toca neles).
7. `useReportsState.getState().actions` continua com as duas actions depois de um `setEntriesState`
   (prova da trap T2).

## Fora de escopo (explícito)

- Qualquer leitura de `useTasksState`, `useCountdownTimerState` ou `useWorkflowsState` — step 02.
- Qualquer UI: botão, dialog, texto, ícone — steps 03/04.
- `beforeunload`, migração, versão de schema, flush no unload (P12, trap T14).
- Alterar `useStoredTasks`, `IndexScore`, `countdownTimer.ts`, `scoreUtils.ts` (P10, P13).
- Instalar dependência, criar `*.test.ts`, instalar runner (P16, trap T9).

## Teste de sistema recomendado

**Docker+browser only**, roteiro = critérios 2→6 acima, com `browser_evaluate` para semear e reler
`localStorage`. Não há tela nova para clicar neste step; a prova é a chave no disco.
