APPROVED_WITH_RESALVAS

# Review r1 — step 01 `store-de-relatorios-e-retencao`

Base `880cb24`, branch `main`. Reviewed exactly 4 files:
`src/pages/index/states/reports/index.ts` (new, 73 l), `src/pages/index/states/reports/utils.ts` (new, 126 l),
`src/pages/index/hooks/useStoredReports.ts` (new, 55 l), `src/pages/index/components/IndexTasks/IndexTasks.tsx` (+2).
Type-check result taken from the prompt (exit=0), not re-run.

## Veredito

Ships. Every binding criterion is met literally. Four ressalvas below — one of them is substantive
(the deliberate extra lines of criterion 6 are neutralized by the effect that follows them), the other
three are notes to record for the next steps.

## Checklist das criterios vinculantes

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | `npm run build` limpo | OK (dado no prompt) | nao re-executado |
| 2 | Tipos `DailyReportTask` / `DailyReportEntry` / `ReportsState` identicos ao contrato | OK | `index.ts:3-24` — campos, ordem e tipos batem 1:1; so foram acrescentados 3 comentarios de linha (ver R4) |
| 3 | Store zustand `{state, actions}` no molde `workflows/index.ts:37-79`, todo `set()` devolvendo `actions` (trap T2) | OK | existe exatamente UM `set()` (`index.ts:38-43`) e ele devolve `actions: store.actions`. Wrapper `setState(partial)` copiado do molde |
| 4 | `setEntriesState` substitui o mapa inteiro; `upsertDailyEntry` le via `get()` e devolve objeto NOVO `{...current, [date]: {...entry, date}}` sem merge por task id | OK | `index.ts:46-61`. `setState` usa `??`, entao `setEntriesState({})` de fato zera o mapa (nao cai no fallback) |
| 5 | `utils.ts` puro | OK | `utils.ts` importa so `date-fns` + `type` do `./index`; zero `create`/`set`/`get`/React/`localStorage` |
| 5 | `RETENTION_DAYS = 7`, `getDayKey` com `format(date,"yyyy-MM-dd")`, nunca `toISOString` (trap T8) | OK | `utils.ts:4-8`; `grep toISOString src` so acusa `scoreUtils.ts` (pre-existente, fora do escopo) |
| 5 | `getRetentionWindowStartKey = getDayKey(startOfDay(subDays(today, RETENTION_DAYS - 1)))` | OK | `utils.ts:10-12`, literal |
| 5 | Hidratacao defensiva sem `||` (trap T3 — 0 e false sao validos) | OK | `utils.ts:14-84`. Nao usa `??` nem `||`: usa guardas `typeof` + `Number.isFinite` e `entry.namesPurged === true`. E mais estrito que `??` e preserva `0`/`false` corretamente — intencao do criterio atendida |
| 5 | Descarta tasks sem `id` string | OK | `utils.ts:18` (`return null`) + filtro em `utils.ts:47-48` |
| 5 | `applyRetention` zera `tasks` e marca `namesPurged` fora da janela, preservando `cycles`/`focusedSeconds`/`completedCount`/`date` | OK | `utils.ts:101` — spread `{...entry, tasks: [], namesPurged: true}` |
| 5 | `applyRetention` idempotente | OK | 2a passada: `tasks.length > 0` falso e `namesPurged !== true` falso ⇒ `needsPurge` falso ⇒ `changed:false` e mesma referencia |
| 5 | Estabilidade de referencia (trap T13 / React Compiler) | OK | `utils.ts:107-109` devolve o proprio `entriesByDate` quando nada muda; dias nao alterados mantem a referencia original (`utils.ts:103`) |
| 5 | Comparacao de dia por string `yyyy-MM-dd`, sem `Date`/`parseISO` no caminho de comparacao | OK | `utils.ts:96` e `utils.ts:123` — comparacao lexicografica pura |
| 5 | `getEntriesInWindow` so dias presentes, mais recente primeiro, `>= startKey` e `<= getDayKey(today)`, `days = RETENTION_DAYS` | OK | `utils.ts:114-125`; comparador `utils.ts:124` ordena decrescente (verificado: a="…-16", b="…-15" ⇒ -1) |
| 6 | Molde de 3 efeitos de `useStoredWorkflows.ts:10-56`, chave `timertasks:reports`, sem `beforeunload`, sem versionamento (P12/T14) | OK | `useStoredReports.ts:5,15-51`; a familia de chaves `timertasks:*` bate com `useStoredTasks`/`useStoredWorkflows` e nao colide |
| 6 | `entriesRef.current` setado nos TRES ramos antes do `return` | OK como escrito (mas inerte — ver R1) | `useStoredReports.ts:21`, `:32`, `:36` |
| 7 | `IndexTasks.tsx` = exatamente 2 linhas | OK | `git diff` = `+import { useStoredReports }` e `+  useStoredReports();` logo apos `useStoredTasks()`. Zero mudanca de JSX |
| 8 | Nada fora de escopo no diff | OK | `grep` por `useTasksState|useCountdownTimerState|useWorkflowsState` nos 3 arquivos novos: nenhum hit. Sem UI, sem `*.test.ts`, `package.json` intocado (`date-fns` ja era dependencia), `useStoredTasks.ts`/`IndexScore.tsx`/`countdownTimer.ts`/`scoreUtils.ts` intocados |

Padroes do repo tambem conferidos: `states/<dominio>/index.ts` + `utils.ts` (igual a `states/tasks`), `import type … from "./index"` (igual a `tasks/utils.ts:2` e `tasks/scoreUtils.ts:7`), selector nomeado `props` (igual ao molde). Nao ha `CLAUDE.md` no repo. Sem prettier configurado, entao formatacao nao e regra.

## Ressalvas

### R1 — `useStoredReports.ts:40-42` anula as 3 linhas deliberadas do criterio 6 (registrar; nao bloqueia)

O criterio 6 pediu `entriesRef.current = <valor aplicado>` nos tres ramos da hidratacao "para o efeito de save
do MESMO commit de mount nao sobrescrever o disco com o `{}` inicial". Escrito assim, o efeito de espelho que
vem DEPOIS desfaz isso no mesmo flush:

- render 1: `entriesByDate = {}` (estado inicial do store).
- flush de efeitos do mount, na ordem de declaracao:
  - E1 `:15-38` le o disco, chama `setEntriesState(entries)` e faz `entriesRef.current = entries` (valor do disco).
  - E2 `:40-42` faz `entriesRef.current = entriesByDate`, e `entriesByDate` aqui e a closure do render 1 = `{}`.
    **Sobrescreve o que E1 acabou de gravar.**
  - E3 `:44-51` ve `hasHydratedRef.current === true` e grava `localStorage["timertasks:reports"] = "{}"`.
- so depois React re-renderiza com o valor do disco, E2/E3 rodam de novo e o disco e restaurado.

Ou seja: o estado final e correto (auto-cura no commit seguinte), mas existe uma janela em que o arquivo em disco
fica `{}`, e as 3 linhas extras pedidas pelo criterio hoje sao codigo morto. O molde (`useStoredWorkflows.ts`,
`useStoredTasks.ts`) tem exatamente o mesmo comportamento (grava `[]`/defaults transitoriamente), entao isto nao e
uma regressao introduzida por este step — e por isso e ressalva e nao `CHANGES_REQUIRED`.

Correcao minima, se o orquestrador quiser que as 3 linhas passem a valer: mover o efeito de espelho (`:40-42`)
para ANTES do efeito de hidratacao. Na ordem E2 → E1 → E3 o mount fica: espelha `{}` (inofensivo), hidrata e
grava a referencia do disco, salva o disco. Nos renders seguintes a ordem e indiferente. Nenhum efeito e
adicionado ou removido, o molde de 3 efeitos continua intacto.

### R2 — `utils.ts:96` e `utils.ts:123` comparam `entry.date`, nao a chave do mapa

`normalizeEntry` (`utils.ts:52`) so cai no `fallbackDate` (a chave) quando `date` **nao** e string; qualquer string
sobrevive. Com um `localStorage` adulterado/corrompido tipo `{"2026-01-01": {date: "2099-01-01", …}}` o dia escapa
da purga em `applyRetention` e pode aparecer em `getEntriesInWindow`. Pelo caminho de escrita normal isso nao
acontece (`index.ts:58` forca `{...entry, date}` com a chave). Se quiserem fechar: em `normalizeEntriesByDate`
(`utils.ts:80`) gravar `{...normalizeEntry(value, key), date: key}`. Severidade baixa.

### R3 — retencao so roda na hidratacao (`useStoredReports.ts:28`)

`applyRetention` e chamado uma unica vez, no mount. Este e um app desktop (Tauri) que costuma ficar aberto por
dias: passando a meia-noite, os dias que saem da janela de 7 dias continuam com `tasks`/nomes ate o proximo
restart. Nenhum criterio deste step pediu purga periodica — fica registrado para os steps 02-04 decidirem
(por exemplo, reaplicar retencao no mesmo ponto em que o dia corrente e escrito).

Nota relacionada, sem acao: o `changed` devolvido por `applyRetention` e descartado em `useStoredReports.ts:28`.
Nao e bug (o efeito de save grava de qualquer jeito), so ainda nao tem consumidor.

### R4 — nits de estilo (nao acionar sozinhos)

- `index.ts:10,14,18`: comentarios em portugues (`// ISO string, NUNCA Date`, `// [] depois da retenção`). Os
  poucos comentarios que existem no repo (`scoreUtils.ts:30,119`, `useCountUpTimer.ts:28-29`) estao em ingles.
- `utils.ts:119` reimplementa o calculo de `getRetentionWindowStartKey` porque aquela funcao e fixa em
  `RETENTION_DAYS`. Se em algum step futuro for preciso outro tamanho de janela, vale parametrizar
  `getRetentionWindowStartKey(today, days = RETENTION_DAYS)` e reusar. Hoje e duplicacao de 1 linha.
