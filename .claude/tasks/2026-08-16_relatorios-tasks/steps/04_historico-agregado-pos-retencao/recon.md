# recon.md — step 04 · historico-agregado-pos-retencao

## Mapa de arquivos
- `src/pages/index/components/IndexTasks/IndexReportsDialog/IndexReportsDialog.tsx` | monta Dialog, abas, lê store, calcula weekTotals inline | 1-116 (Root/Content 51-115, tab switch 71-110, weekTotals reduce 42-49)
- `.../IndexReportsDialog/IndexReportsTabs.tsx` | tipo `IndexReportsTab` + array `TABS` + botões | 1-35 (tipo `"today"|"week"` linha 1, array `TABS` 8-11)
- `.../IndexReportsDialog/IndexReportsDaySection.tsx` | renderiza 1 dia: heading+totais+linhas OU 3 estados vazios (namesPurged/sem-conclusão/sem-atividade) | 1-59 (branch namesPurged 43-46 já é EXATAMENTE o que History precisa, sem edição)
- `.../IndexReportsDialog/IndexReportsTotals.tsx` | 3 tiles (Focused/Cycles/Completed) a partir de 3 números crus | 1-54 (reusável sem alteração)
- `.../IndexReportsDialog/IndexReportsEmptyState.tsx` | `<span>` centrado, texto custom | 1-12 (reusável sem alteração)
- `.../IndexReportsDialog/reportsViewUtils.ts` | `formatDuration`, `formatDayHeading`, `getCompletedTasks`, `hasAnyActivity`, `shouldShowWorkflowBadge` | 1-55 (nenhuma soma-de-totais aqui; não existe util compartilhado)
- `src/pages/index/states/reports/utils.ts` | `getDayKey`, `RETENTION_DAYS`, `getRetentionWindowStartKey`, `getEntriesInWindow` | 1-125 (`getEntriesInWindow` 114-125 é o molde a espelhar invertido)
- `src/pages/index/states/reports/index.ts` | tipos `DailyReportEntry`/`DailyReportTask`/store `useReportsState` | não lido linha-a-linha (contrato já fixado na memória §3, não muda)

## Molde a espelhar
`getEntriesInWindow` (`states/reports/utils.ts:114-125`) filtra por chave-string e ordena desc (`a.date<b.date?1:...`). Para History: mesma forma, filtro invertido (`entry.date < getRetentionWindowStartKey(today)`), SEM limite superior de dias — precisa varrer TODAS as entradas, não as N mais recentes. Não existe hoje; função nova `getEntriesOutsideWindow(entriesByDate, today)` no mesmo arquivo, mesmo estilo de ordenação.
Para a linha-por-dia: `IndexReportsDaySection` já é o componente exato — com `entry.tasks=[]` e `entry.namesPurged=true` (garantido pela retenção, ver `applyRetention` `utils.ts:86-112`) ele SEMPRE cai no branch 43-46 ("Task names are no longer retained…") e mostra heading+cycles+duration+completedCount sem nomes. Reuso direto, zero edição necessária no componente.

## Footprint
- `IndexReportsDialog.tsx:1-116` é o único consumidor de `IndexReportsTabs`, `IndexReportsDaySection`, `IndexReportsTotals`, `IndexReportsEmptyState`, `getEntriesInWindow` — nenhum outro arquivo do repo importa essas peças (não regrep necessário, footprint fechado no próprio dialog).
- `weekTotals` (reduce de 3 campos, `IndexReportsDialog.tsx:42-49`) NÃO é uma função exportada — é lógica inline duplicável. History precisa do mesmo reduce sobre `historyEntries` (todas, não só as da janela); ou extrai um `sumEntryTotals(entries)` em `reportsViewUtils.ts`, ou duplica o reduce a 3ª vez (padrão do repo é "copiar", visto no step 03 com `formatDuration`).

## Armadilhas
- `applyRetention` (`utils.ts:86-112`) já garante `tasks:[]`+`namesPurged:true` para todo dia fora da janela — History nunca precisa checar isso manualmente, só filtrar por data.
- `getEntriesInWindow`/futura `getEntriesOutsideWindow` comparam STRING `yyyy-MM-dd`, nunca `Date` (T8 da memória) — manter o mesmo estilo.
- `IndexReportsTabs.tsx:1` — o tipo `IndexReportsTab` é usado por `IndexReportsDialog.tsx` via `import type`; ampliar para `"today"|"week"|"history"` quebra exaustividade de switch se o dialog usar `if/else` (hoje usa ternário 2-vias, `:71-110` — precisa virar 3 ramos).
- Dark mode (T11): todo componente listado já tem `dark:` em toda classe; se History reusar 100% os componentes existentes, T11 já está coberto automaticamente — só precisa vigiar se algo novo (ex. copy de 1 linha) for adicionado sem `dark:`.

## Sinal de teste
Não encontrado nenhum automatizado (T9 da memória, confirmado: `find` de testes é vazio). Precisa Docker+browser com seed via `browser_evaluate` em `timertasks:reports` (dias antigos), igual ao roteiro do plan-simplified.md.

## Veredito de complexidade
1. Uma frente só? sim — só frontend (`IndexReportsDialog/*` + `states/reports/utils.ts`).
2. Footprint ≤6 arquivos? sim — no máximo 3 editados (`IndexReportsDialog.tsx`, `IndexReportsTabs.tsx`, `states/reports/utils.ts`) + talvez 1 util novo em `reportsViewUtils.ts`; `IndexReportsDaySection`/`Totals`/`EmptyState` são reusados sem edição.
3. Molde claro? sim — `IndexReportsDaySection` (reuso direto) e `getEntriesInWindow` (espelho invertido).
4. Zero decisão de arquitetura/produto em aberto? não — o próprio `plan-simplified.md` deixa aberto "3ª aba vs seção abaixo das abas… decida e justifique"; é decisão de produto/UX não resolvida no código.
5. Zero lógica nova não-trivial? sim — filtro+sort invertido e reduce de 3 campos são trivial (já existem 2x no mesmo arquivo).

veredito: complexa — item 4 (decisão de UX 3ª aba vs seção ainda aberta, explicitada pelo próprio plan-simplified.md).

## Sinal de partição
partição: não (nenhum módulo/serviço novo nem taxonomia nova — só 1 util espelhado + reuso de componentes existentes).
