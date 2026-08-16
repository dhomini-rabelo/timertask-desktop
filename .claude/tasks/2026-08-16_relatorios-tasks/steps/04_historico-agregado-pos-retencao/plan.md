# plan.md — step 04 · `historico-agregado-pos-retencao`

Estado git: branch `main`, commit-base `22e0f2f`, working tree limpa.
Escopos de implementação: **1** (`prompts/aba-history.md`).
Perguntas ao usuário: **sem dúvidas** (todas as decisões abaixo foram fechadas por default previsível — ver Premissas).

---

## Premissas assumidas (VINCULANTES para implementer, reviewer e tester)

1. **History é uma 3ª ABA (`Today | Week | History`), não uma seção abaixo das abas.**
   Justificativa concreta (a decisão que o `plan-simplified.md` deixou aberta):
   - o `plan-simplified.md` já diz "preferir manter o padrão de abas";
   - o conteúdo do dialog já vive num scroll interno de `max-h-[60vh]`
     (`IndexReportsDialog.tsx:70`); uma seção abaixo empilharia histórico ilimitado (sem paginação,
     P15) no MESMO scroll da semana, e o usuário perderia a Week ao rolar;
   - P5 exige "sem sobreposição e sem buraco" entre Week e History — duas abas mutuamente exclusivas
     tornam essa disjunção visível; uma seção contígua sugere continuidade e convida a comparar
     números de janelas diferentes;
   - custo: 1 linha no tipo + 1 item no array `TABS`. O molde já existe.

2. **`IndexReportsDaySection` é reusado SEM NENHUMA edição.** Com `tasks: []` + `namesPurged: true`
   (garantidos por `applyRetention`, `states/reports/utils.ts:86-112`, cujo predicado de purga é
   EXATAMENTE `entry.date < windowStartKey` — o mesmo filtro do History) ele cai sempre no ramo
   `:43-46` e renderiza data + duração + ciclos + concluídas + a frase "Task names are no longer
   retained for this day.". Os 4 ramos de estado vazio por-dia (memória §step 03) continuam sendo
   responsabilidade DELE — o History **não** duplica nem reimplementa nenhum desses ramos.

3. **A view não filtra nem esconde nomes por conta própria.** Se um dia cruzar a fronteira da janela
   com o app aberto (retenção só roda na hidratação), ele pode aparecer no History com nomes até o
   próximo reload. É aceito e não é bug deste step: o step 04 **só lê** o store (OUT: qualquer
   escrita). Não adicionar purga defensiva na renderização.

4. **Totais do History = soma dos 3 campos persistidos** (`focusedSeconds`, `cycles`,
   `completedCount`) de cada `DailyReportEntry` retornada. **Nunca** derivar de `tasks`/`.length`
   (memória §step 03) — é justamente o que mantém o número certo com `tasks: []`.

5. **`weekTotals` (`IndexReportsDialog.tsx:42-49`) fica INTACTO.** O novo helper `sumEntryTotals`
   é usado só pelo History. Refatorar a Week para consumi-lo seria mexer em código do step 03, que é
   OUT. Duplicação aceita e documentada aqui de propósito.

6. **Estrutura da aba History espelha a da aba Week**: totais no topo, depois a lista, depois o
   estado vazio quando não há linhas — inclusive mostrando os tiles com zeros no caso vazio, igual à
   Week faz hoje. Uma linha de copy de retenção fica ACIMA dos totais e é sempre renderizada
   (ela explica a regra, e no estado vazio é ela que dá sentido à tela).

7. **`showWorkflowBadge={false}` e `isToday={false}` fixos** no History: dias fora da janela nunca
   têm tasks (logo nunca badge) e nunca são hoje. Não chamar `shouldShowWorkflowBadge` nem comparar
   com `todayKey` nesse ramo.

8. **Entradas com `date > hoje`** (relógio adiantado / lixo no disco) não aparecem nem na Week
   (`entry.date <= todayKey`, `utils.ts:123`) nem no History (`entry.date < windowStartKey`). É o
   comportamento desejado; não tratar.

9. `formatDuration` já está COPIADO em `IndexReportsDialog/reportsViewUtils.ts:4-15`. Reusar esse.
   **Não** importar de `IndexScore.tsx`, **não** criar uma terceira cópia.

---

## Decisões de contrato (o que construir)

### A. `getEntriesOutsideWindow` — `src/pages/index/states/reports/utils.ts`

Nova função exportada, logo abaixo de `getEntriesInWindow` (arquivo termina na linha 125):

```ts
export function getEntriesOutsideWindow(
  entriesByDate: Record<string, DailyReportEntry>,
  today: Date,
): DailyReportEntry[]
```

- Filtro: `entry.date < getRetentionWindowStartKey(today)` — reusar a função já existente
  (`utils.ts:10-12`), **não** recalcular com `subDays` inline. É isso que garante P5 (o corte do
  History é bit-a-bit o mesmo corte da Week e o mesmo de `applyRetention`).
- Ordenação: mesmo comparador de `getEntriesInWindow:124` (mais recente primeiro).
- **Sem parâmetro `days` e sem limite de quantidade**: varre TODAS as entradas do mapa.
- Comparação sempre de STRING `yyyy-MM-dd` (T8) — nada de `Date`/`parseISO` no meio.

### B. `sumEntryTotals` — `.../IndexReportsDialog/reportsViewUtils.ts`

```ts
export function sumEntryTotals(entries: DailyReportEntry[]): {
  focusedSeconds: number; cycles: number; completedCount: number;
}
```
`reduce` dos 3 campos persistidos, seed `{ focusedSeconds: 0, cycles: 0, completedCount: 0 }` —
mesma forma do reduce em `IndexReportsDialog.tsx:42-49`.

### C. `IndexReportsTabs.tsx`

- `export type IndexReportsTab = "today" | "week" | "history";` (linha 1).
- `TABS` (`:8-11`) ganha `{ key: "history", label: "History" }` como **terceiro** item.
- Nenhuma mudança de estilo/classe — o `.map` já cobre N abas.

### D. `IndexReportsDialog.tsx`

1. Importar `getEntriesOutsideWindow` (junto de `getDayKey`, `getEntriesInWindow`, `:5`) e
   `sumEntryTotals` (`:12-15`).
2. Após `weekTotals` (`:49`):
   ```ts
   const historyEntries = getEntriesOutsideWindow(entriesByDate, now);
   const historyTotals = sumEntryTotals(historyEntries);
   ```
3. O ternário de 2 vias (`:71-110`) vira **três blocos irmãos** `{activeTab === "…" && (<>…</>)}`
   (today, week, history), com o JSX de Today e de Week **preservado byte-a-byte** dentro dos seus
   blocos. Ternário aninhado de 3 vias em JSX é proibido aqui.
4. Corpo do bloco `history`, nesta ordem:
   - copy da regra, em `<p className="text-sm text-Black-300 dark:text-Black-400">`
     (molde exato de `IndexTasks.tsx:26-29`), texto:
     `Task names are kept for 7 days. After that, only cycles, focused time and the completed count remain.`
   - `<IndexReportsTotals focusedSeconds={historyTotals.focusedSeconds} cycles={historyTotals.cycles} completedCount={historyTotals.completedCount} />`
   - `historyEntries.length > 0` → `historyEntries.map(entry => <IndexReportsDaySection key={entry.date} entry={entry} showWorkflowBadge={false} isToday={false} />)`
   - senão → `<IndexReportsEmptyState text="No history yet. Days older than 7 days will appear here." />`
5. `handleOpenChange` (`:22-27`) continua resetando para `"today"` ao abrir — não mexer.

Nenhum componente novo. Nenhum arquivo criado.

---

## Footprint (4 arquivos editados, 0 criados)

| Arquivo | Mudança |
|---|---|
| `src/pages/index/states/reports/utils.ts` | + `getEntriesOutsideWindow` (append no fim) |
| `src/pages/index/components/IndexTasks/IndexReportsDialog/reportsViewUtils.ts` | + `sumEntryTotals` |
| `.../IndexReportsDialog/IndexReportsTabs.tsx` | tipo + 3º item de `TABS` |
| `.../IndexReportsDialog/IndexReportsDialog.tsx` | imports, `historyEntries`/`historyTotals`, 3º ramo |

**Não tocar**: `IndexReportsDaySection.tsx`, `IndexReportsTotals.tsx`, `IndexReportsEmptyState.tsx`,
`IndexReportTaskRow.tsx`, `states/reports/index.ts`, `useStoredReports.ts`, `useReportsSync.ts`,
`IndexScore.tsx`, store de tasks, `IndexTasks.tsx`.

---

## Fora de escopo (OUT)

Mudar retenção / janela de 7 dias / schema (step 01); mudar abas Today/Week, botão ou gatilho
(step 03); QUALQUER escrita no store; export, gráfico, paginação, filtro por período, "apagar
histórico" (P15); alterar `IndexScore` (P10) ou o store de tasks (P13); criar suíte de testes
(T9 — o repo não tem runner).

---

## Critérios de aceitação

1. `npx tsc --noEmit` limpo (único gate automatizado do repo).
2. Aba **History** visível ao lado de Today/Week; abrir o dialog continua caindo em Today.
3. Com dois dias semeados fora da janela (ex.: −20 e −40 dias), a aba History lista os DOIS,
   **mais recente primeiro**, cada um com data + `Xh Ym` + `N cycles` + `M done` + a frase
   "Task names are no longer retained for this day." — e **nenhum título de task** no DOM.
4. Totais no topo do History = soma exata de `cycles`/`focusedSeconds`/`completedCount` dos dias
   listados (conferido contra `localStorage["timertasks:reports"]`, não só contra a tela).
5. A aba **Week não inclui** nenhum desses dias antigos, e os totais da Week não mudam.
6. Copy da retenção presente e legível; estado vazio aparece com a chave limpa.
7. Dark mode: screenshots claro e escuro; toda classe de cor nova tem par `dark:` (T11).
8. Nenhum `setItem`/action de escrita disparado por abrir a aba History (step só lê).

---

## Modo de teste de sistema

**Docker+browser only** (`npm run dev` → `http://localhost:1420`, NUNCA 5173). Não há runner de
testes (T9) e o dado antigo precisa ser semeado — não dá para esperar 8 dias.
Tester **sempre em foreground** (`run_in_background: false`, precedente do step 03).

Roteiro mínimo (detalhado no prompt do escopo): semear via `browser_evaluate` em
`timertasks:reports` (formato: `entriesByDate` DIRETO no JSON, sem wrapper — memória §step 02)
dois dias antigos COM tasks nomeadas + o dia de hoje; reload (a retenção roda na hidratação);
abrir Reports → History; diff tela × `localStorage`; conferir a Week; limpar a chave e conferir o
estado vazio; screenshots claro + escuro.
