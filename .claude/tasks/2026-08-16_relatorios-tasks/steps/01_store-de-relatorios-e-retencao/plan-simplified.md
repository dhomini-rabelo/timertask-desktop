# plan-simplified.md — step 01 · `store-de-relatorios-e-retencao`

> Leia `../../memoria-da-task.md` ANTES de qualquer coisa. Este arquivo só carrega o recorte do step.

## Objetivo

Criar a camada de dados do relatório: o store zustand de relatórios, a persistência em
`localStorage` sob a chave `timertasks:reports`, e a **purga de nomes** dos dias fora da janela de
7 dias, aplicada na hidratação. Sem nenhuma UI, sem nenhum consumo do estado de tasks.

## IN

- `src/pages/index/states/reports/index.ts` — tipos do §3 da memória (`DailyReportTask`,
  `DailyReportEntry`, `ReportsState`) + store zustand `{ state, actions }` com, no mínimo:
  `setEntriesState(entriesByDate)` e `upsertDailyEntry(date, entry)` (nome livre, mas o step 02
  precisa de uma action que grave/atualize UM dia).
- `src/pages/index/states/reports/utils.ts` — funções PURAS:
  - `getDayKey(date: Date): string` — `format(date, "yyyy-MM-dd")` local (trap T8).
  - `getRetentionWindowStartKey(today: Date): string` — `getDayKey(startOfDay(subDays(today, 6)))`
    (7 dias corridos incluindo hoje — P4).
  - `applyRetention(entriesByDate, today): { entries, changed }` — para todo dia com
    `date < janela`: `tasks: []`, `namesPurged: true`; **preserva** `cycles`, `focusedSeconds`,
    `completedCount`. Idempotente. `changed` permite não regravar à toa.
  - `normalizeEntry(raw): DailyReportEntry` — hidratação defensiva (trap T3: `??`, não `||`).
  - `getEntriesInWindow(entriesByDate, today, days)` — dias ordenados do mais recente para o mais
    antigo, usado pelos steps 03/04. Deixe-a exportada e coberta pelo uso do próprio step.
- `src/pages/index/hooks/useStoredReports.ts` — molde direto de `hooks/useStoredWorkflows.ts:10-56`:
  hidratar no mount → `applyRetention` → `setEntriesState` → `hasHydratedRef` → efeito que grava a
  cada mudança lendo de uma `ref`. `try/catch` caindo para `{}` (P12).
- Montar o hook: chamar `useStoredReports()` ao lado de `useStoredTasks()` em
  `components/IndexTasks/IndexTasks.tsx:10`.

## OUT

- Qualquer leitura do store de tasks ou de `countdownTimer` (é o step 02).
- Qualquer componente, botão, dialog ou texto visível (steps 03/04).
- Migração de dados, versionamento de schema, `beforeunload` (P12; se surgir necessidade de flush,
  é assunto do step 02 — trap T14).
- Mexer em `useStoredTasks`, `IndexScore` ou `countdownTimer` (P10, P13).

## Respostas do usuário que valem para ESTE step

- **P1/P2** storage próprio, chave `timertasks:reports`.
- **P3** chave do dia `yyyy-MM-dd` em hora LOCAL.
- **P4** retenção = 7 dias corridos rolantes incluindo hoje; fora dela, nomes apagados **do disco**,
  agregados preservados.
- **P12** sem migração; ausência da chave ou JSON inválido ⇒ `{}`.
- **P13** a retenção **não** toca em `timertasks:tasks`.
- **P16** nenhuma dependência nova (`date-fns` já está no projeto).

## Arquivos / âncoras

- Molde do hook: `src/pages/index/hooks/useStoredWorkflows.ts:10-56` (curto) e
  `src/pages/index/hooks/useStoredTasks.ts:118-200` (variante com `beforeunload`).
- Molde do store: `src/pages/index/states/workflows/index.ts:37+`, `src/pages/index/states/tasks/index.ts:63-75`
  (**atenção à trap T2**: o retorno do `set` tem de devolver `actions` junto).
- Montagem do hook: `src/pages/index/components/IndexTasks/IndexTasks.tsx:10`.
- Chaves já ocupadas no `localStorage`: memória §5 (`timertasks:tasks`, `timertasks:workflows`, `theme`).
- Contrato de dados literal: memória §3 — **copie os tipos de lá, não invente nomes novos**; os steps
  02/03/04 já estão escritos contra eles.

## Dependências de steps anteriores

Nenhuma. É o primeiro step.

## Modo de teste de sistema

**Docker+browser only** (`npm run dev` + Playwright MCP, `.claude/docs/browser-instructions.md`).
Não existe suíte nem runner no repo (trap T9). Roteiro mínimo: abrir o app, conferir que
`timertasks:reports` passa a existir; depois, via `browser_evaluate`, semear a chave com um dia dentro
da janela e um dia com ~30 dias de idade (ambos com `tasks` nomeadas, `cycles` e `focusedSeconds`),
recarregar, e reler a chave — o dia antigo tem de ficar com `tasks: []`, `namesPurged: true` e
`cycles`/`focusedSeconds`/`completedCount` intactos; o dia recente, inalterado. Atenção à trap T5
(nada monta antes da permissão de notificação).

## CLASSE

**`julgamento`.** É módulo novo com contrato novo que os três steps seguintes consomem, e a regra de
retenção (o que é apagado x o que sobrevive) é decisão de modelagem, não espelhamento mecânico — apesar
de o hook de persistência ter molde pronto.
