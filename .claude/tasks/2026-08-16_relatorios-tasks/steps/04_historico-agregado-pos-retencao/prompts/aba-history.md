# Escopo único — aba **History** no dialog de Reports (step 04)

Git: branch `main`, commit-base `22e0f2f`, working tree limpa. Repo `/home/fael/so/code/saas/timertask-desktop`.
Você implementa TUDO abaixo. Não abra `plan-simplified.md`, `recon.md`, `process.md`. Este arquivo é o contrato.

## Objetivo

Terceira aba `History` no dialog já existente, listando os dias **fora da janela de 7 dias** (já sem
nomes de task, purgados pela retenção) com data, ciclos, horas e concluídas, mais totais do período,
copy da regra e estado vazio. **Só leitura do store — nenhuma escrita, nenhuma mudança de schema.**

## Arquivos que você OWNS (4 editados, 0 criados)

### 1. `src/pages/index/states/reports/utils.ts` — append no fim (arquivo tem 125 linhas)

```ts
export function getEntriesOutsideWindow(
  entriesByDate: Record<string, DailyReportEntry>,
  today: Date,
): DailyReportEntry[]
```
- Filtro: `entry.date < getRetentionWindowStartKey(today)` — **reusar** a função existente
  (`utils.ts:10-12`), não recalcular com `subDays` inline. Isso garante que o corte do History seja
  exatamente o mesmo de `getEntriesInWindow` e o mesmo de `applyRetention` (`:86-112`): sem
  sobreposição e sem buraco.
- Ordenação: comparador idêntico ao de `getEntriesInWindow` (`utils.ts:124`, mais recente primeiro).
- **Sem parâmetro `days`, sem limite de N dias** — varre TODAS as entradas do mapa (é a diferença
  para a Week, que é janela fixa).
- Comparação sempre de STRING `yyyy-MM-dd`; nunca `Date`/`parseISO` no meio (trap T8).
- Molde a espelhar invertido: `getEntriesInWindow`, `utils.ts:114-125`.

### 2. `.../IndexTasks/IndexReportsDialog/reportsViewUtils.ts` — nova função

```ts
export function sumEntryTotals(entries: DailyReportEntry[]): {
  focusedSeconds: number; cycles: number; completedCount: number;
}
```
`reduce` dos 3 campos PERSISTIDOS, seed zerado — mesma forma do reduce em
`IndexReportsDialog.tsx:42-49`. **Nunca** derivar totais de `tasks`/`.length`: é isso que mantém os
números certos quando `tasks: []` (retenção).
`formatDuration` já existe COPIADO neste arquivo (`:4-15`) — reuse; não importe de `IndexScore.tsx`,
não crie outra cópia.

### 3. `.../IndexReportsDialog/IndexReportsTabs.tsx`

- `:1` → `export type IndexReportsTab = "today" | "week" | "history";`
- `TABS` (`:8-11`) ganha `{ key: "history", label: "History" }` como TERCEIRO item.
- Zero mudança de estilo: o `.map` (`:19-32`) já cobre N abas.

### 4. `.../IndexReportsDialog/IndexReportsDialog.tsx`

1. Imports: `getEntriesOutsideWindow` junto de `getDayKey`/`getEntriesInWindow` (`:5`);
   `sumEntryTotals` no bloco de `./reportsViewUtils` (`:12-15`).
2. Depois de `weekTotals` (`:49`):
   ```ts
   const historyEntries = getEntriesOutsideWindow(entriesByDate, now);
   const historyTotals = sumEntryTotals(historyEntries);
   ```
3. O ternário de 2 vias em `:71-110` vira **três blocos irmãos** `{activeTab === "…" && (<>…</>)}`
   (today, week, history), com o JSX de Today e de Week **preservado byte-a-byte** dentro dos seus
   blocos. Ternário aninhado de 3 vias em JSX é proibido aqui.
4. Corpo do bloco `history`, nesta ordem exata:
   - `<p className="text-sm text-Black-300 dark:text-Black-400">Task names are kept for 7 days. After that, only cycles, focused time and the completed count remain.</p>`
     (molde de tom/classe: `IndexTasks.tsx:26-29`)
   - `<IndexReportsTotals focusedSeconds={historyTotals.focusedSeconds} cycles={historyTotals.cycles} completedCount={historyTotals.completedCount} />`
   - se `historyEntries.length > 0`: `historyEntries.map((entry) => <IndexReportsDaySection key={entry.date} entry={entry} showWorkflowBadge={false} isToday={false} />)`
   - senão: `<IndexReportsEmptyState text="No history yet. Days older than 7 days will appear here." />`
5. `handleOpenChange` (`:22-27`) continua resetando para `"today"` — não mexer.

## Decisões vinculantes (não reabrir)

- **É aba, não seção abaixo das abas.** O conteúdo já vive num scroll `max-h-[60vh]`
  (`IndexReportsDialog.tsx:70`); histórico ilimitado empurraria a Week para fora do scroll, e P5 pede
  disjunção visível entre janela e pós-janela.
- **`IndexReportsDaySection` é reusado SEM NENHUMA EDIÇÃO.** Com `tasks: []` + `namesPurged: true`
  (garantidos por `applyRetention`, cujo predicado é o mesmo `date < windowStartKey` do seu filtro)
  ele cai sempre no ramo `:43-46` e mostra heading + duração + ciclos + concluídas + "Task names are
  no longer retained for this day.". Os 4 ramos de vazio POR-DIA são dele — não duplicar no History.
- **`showWorkflowBadge={false}` e `isToday={false}` fixos** — não chamar `shouldShowWorkflowBadge`
  nem comparar com `todayKey` nesse ramo.
- **`weekTotals` (`:42-49`) fica INTACTO** — não refatorar para usar `sumEntryTotals`; a Week é do
  step 03 e está fechada. Duplicação aceita de propósito.
- **A view não esconde nomes por conta própria.** Se um dia cruzar a fronteira com o app aberto (a
  retenção só roda na hidratação), ele pode aparecer com nomes até o próximo reload — aceito, o step
  04 só lê. Nada de purga defensiva na renderização.
- Estrutura da aba espelha a da Week, inclusive mostrando os tiles zerados no caso vazio.
- Trap **T11**: toda classe de cor nova precisa do par `dark:` (a copy acima já tem). Trap **T13**
  (React Compiler): nunca mutar objeto vindo do store — só criar novos.

## Footprint que você NÃO pode quebrar

`IndexReportsDialog.tsx` é o ÚNICO consumidor de `IndexReportsTabs`, `IndexReportsDaySection`,
`IndexReportsTotals`, `IndexReportsEmptyState` e `getEntriesInWindow` — nenhum outro arquivo do repo
importa essas peças. **Não tocar**: `IndexReportsDaySection.tsx`, `IndexReportsTotals.tsx`,
`IndexReportsEmptyState.tsx`, `IndexReportTaskRow.tsx`, `states/reports/index.ts`,
`useStoredReports.ts`, `useReportsSync.ts`, `IndexScore.tsx`, store de tasks, `IndexTasks.tsx`.

## Fora de escopo

Retenção/janela/schema (step 01); abas Today/Week, botão, gatilho (step 03); qualquer escrita no
store; export, gráfico, paginação, filtro de período, "apagar histórico"; `IndexScore`; criar testes
automatizados (T9: o repo não tem runner — `package.json` só tem `dev/build/preview/tauri`).

## Critérios de aceitação

1. `npx tsc --noEmit` limpo (único gate automatizado — não rodar lint/test, não existem).
2. Aba History ao lado de Today/Week; o dialog continua abrindo em Today.
3. Dois dias semeados fora da janela aparecem no History, mais recente primeiro, com
   data + `Xh Ym` + `N cycles` + `M done` + "Task names are no longer retained for this day.",
   e **nenhum título de task** no DOM.
4. Totais do topo do History = soma exata de `cycles`/`focusedSeconds`/`completedCount` desses dias,
   conferida contra `localStorage["timertasks:reports"]` (diff, não "a tela parece certa").
5. A Week não inclui esses dias e seus totais não mudam.
6. Estado vazio aparece com a chave limpa; copy da retenção sempre visível na aba.
7. Dark mode OK (screenshots claro + escuro).
8. Abrir a aba não dispara nenhuma escrita no store / `setItem`.

## Teste de sistema (Docker+browser only, porta 1420 — NUNCA 5173)

`npm run dev` + Playwright MCP, tester SEMPRE em foreground (`run_in_background: false`).
Semeadura via `browser_evaluate`: `timertasks:reports` guarda o `entriesByDate` **DIRETO** no JSON,
sem wrapper (`JSON.parse(...)["yyyy-MM-dd"]`, e não `...["entriesByDate"][...]`).
Calcular as chaves DENTRO do browser a partir de `new Date()` (−20 e −40 dias) formatando em hora
LOCAL (`yyyy-MM-dd` montado à mão), nunca `toISOString().slice(0,10)` (T8).
Cada dia antigo semeado com `tasks` NOMEADAS, `namesPurged: false`, `cycles`/`focusedSeconds`/
`completedCount` > 0 (inclua um dia com `completedCount > 0` e `tasks: []` para provar o caso de
borda). Semear também o dia de hoje para checar que a Week não muda. Depois: **reload** (a purga roda
na hidratação) → abrir Reports → aba History → conferir tela × `localStorage` → conferir Week →
limpar a chave + reload para o estado vazio → screenshots claro e escuro.
Gate de permissão de notificação (T5) pode já vir `granted`; cliques reais de mouse travaram neste
ambiente em steps anteriores — `element.click()` via JS é o workaround conhecido.
