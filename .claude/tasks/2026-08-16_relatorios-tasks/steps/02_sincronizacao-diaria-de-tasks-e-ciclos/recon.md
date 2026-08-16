# recon.md — step 02 · sincronizacao-diaria-de-tasks-e-ciclos

## Mapa de arquivos

- `src/pages/index/states/reports/index.ts:1-72` | store zustand `{state,actions}`, `upsertDailyEntry` SUBSTITUI o dia inteiro (não mescla) | 22-24 (tipos), 52-60 (upsert)
- `src/pages/index/states/reports/utils.ts:1-125` | `getDayKey` (yyyy-MM-dd local), `applyRetention` (idempotente, mesma ref se `changed:false`), `getEntriesInWindow` | 6-8, 86-112
- `src/pages/index/hooks/useStoredReports.ts:1-54` | hidrata + espelha `entriesByDate`→`entriesRef` + grava em `useEffect([hasHydratedRef, entriesByDate])` | 12-13 (refs), 40-51 (guarda de hidratação, NÃO compara payload)
- `src/pages/index/hooks/useStoredTasks.ts:118-200` | molde de ref-mirror: `itemsRef` espelha `items` (145-147); grava em `useEffect` gated só por `hasHydratedRef` (193-197) — **não** compara valor anterior, não é o guard do T4, só evita gravar pré-hidratação
- `src/pages/index/states/tasks/scoreUtils.ts:10-56` | `calculateTaskTimeToday(events)` — recorte `[startOfDay(hoje), agora]`, intervalo aberto em 46-53 usa `new Date()` no momento da chamada
- `src/pages/index/states/tasks/index.ts:1-38` | `Task.timeEvents: TaskTimeEvent[]` (`createdAt: Date` em memória), `isTask`/`isTaskGroup`, `groupId: string\|null`
- `src/pages/index/states/workflows/index.ts:1-172` | `useWorkflowsState`, `state.workflows: Workflow[]{id,title}` — sem seletor de "por id", precisa `.find`
- `src/pages/index/states/countdownTimer.ts:5-15,88-146,187-209` | `totalCycles` só cresce em `goBackToWork` (205, `+1`); é 100% memória, reload volta a `0` (296); `currentTimeInSeconds` tica a cada 1s via `setInterval` (106-145) — selecionar só `totalCycles` evita re-render por tick
- `src/pages/index/components/IndexScore.tsx:26-29` | seletor real em uso: `useCountdownTimerState((s)=>s.state.totalCycles)` e `useTasksState((s)=>s.state.items)` — copiar este padrão de seleção fina
- `src/pages/index/components/IndexTasks/IndexTasks.tsx:1-13` | `useStoredTasks()` (11) e `useStoredReports()` (12) já montados lado a lado — é aqui que entra o novo hook de sync, como 3ª linha

## Molde a espelhar

Nenhum molde COMPLETO — `useStoredTasks`/`useStoredReports` resolvem persistência (ref-mirror + gate de hidratação), não mesclagem por id nem delta de contador. Peças reaproveitáveis: ref-mirror (`useStoredTasks.ts:122,145-147`) e seletor fino de zustand (`IndexScore.tsx:26-29`).

## Footprint

- `IndexTasks.tsx:10-12` — único ponto de montagem de hooks do card; novo hook entra como 3ª chamada, depois de `useStoredTasks()`/`useStoredReports()` (ordem importa: sync só deve ler `items`/`entriesByDate` já hidratados)
- `states/reports/index.ts:52-60` (`upsertDailyEntry`) é o ÚNICO ponto de escrita que o sync pode chamar — contrato congelado, não editar
- `states/countdownTimer.ts` só é LIDO (`useCountdownTimerState((s)=>s.state.totalCycles)`), nenhum import de actions dele

## Onde entra o código novo (resposta direta)

- **Hook de sync**: arquivo NOVO `src/pages/index/hooks/useReportsSync.ts` (não estender `useStoredReports.ts`, que é só persistência — separar responsabilidades evita reintroduzir T4 num arquivo já revisado). Montado em `IndexTasks.tsx` logo após `useStoredTasks()`/`useStoredReports()`.
- **Função de projeção**: arquivo NOVO `src/pages/index/states/reports/sync.ts` (não `utils.ts` do step 01, que é só normalização/retenção). Assinatura:
  `buildTodayTasks(items: TaskItem[], workflows: Workflow[], today: Date): DailyReportTask[]`
  - `items` ← `useTasksState((s) => s.state.items)` (TODOS os workflows, não `useListingTasks`)
  - `workflows` ← `useWorkflowsState((s) => s.state.workflows)`
  - `today` ← `new Date()` calculado dentro do efeito a cada execução (não guardado em state)
  - por task: `secondsToday = calculateTaskTimeToday(task.timeEvents)`; `completedAt` = maior `createdAt` (ISO) entre eventos `type==="complete"` com `isSameDay(createdAt, today)`, senão `null`; descarta se `secondsToday===0 && completedAt===null`; `workflowTitle = workflows.find(w=>w.id===task.workflowId)?.title ?? null`; `groupTitle = items.find(i=>i.id===task.groupId && isTaskGroup(i))?.title ?? null`
  - mesclagem por id (P11) é uma 2ª função pura no mesmo arquivo, ex. `mergeDailyTasks(existingTasks, liveTasks): DailyReportTask[]` — nunca remove id que só existe no disco, sobrescreve campos dos ids em comum, preserva ORDEM estável (base = ordem existente + ids novos ao final) para não gerar diffs espúrios por reordenação de `items`

## Delta de `totalCycles` como ref (sobrevive a render, não a reload)

- `previousTotalCyclesRef = useRef<number | null>(null)` dentro de `useReportsSync` — semeado com o `totalCycles` ATUAL no primeiro efeito (não com `0` nem com o `cycles` já persistido), então o primeiro delta observado nesta sessão é sempre `0`
- `cyclesAccumulatedRef = useRef<number>(0)` — semeado, na troca de dia (`dateKey` mudou) ou no mount, com `existingEntry?.cycles ?? 0` (lido 1x via `useReportsState.getState()`, imperativo — nunca reativo, ver guarda abaixo)
- a cada execução do efeito: se `totalCycles > previousTotalCyclesRef.current` soma a diferença em `cyclesAccumulatedRef.current` e atualiza `previousTotalCyclesRef.current = totalCycles`; se `totalCycles <= previousTotalCyclesRef.current` (reload ou reset do countdown) só realinha a ref, nunca subtrai — reload NÃO decrementa `cyclesAccumulatedRef`, que é a peça que "sobrevive" ao contador zerar
- ao virar o dia (`dateKey` muda), os dois refs são re-semeados (delta zero + base = entry do NOVO dia, tipicamente `0`) — dia anterior fica imutável (P11)

## Guarda anti-loop (T4) — superfície exata

O efeito de `useReportsSync` deve depender SÓ de `[items, workflows, totalCycles]` (mais o `dateKey` derivado) — **nunca** de `entriesByDate` via seletor reativo (`useReportsState((s)=>...)`). Ler o valor atual do dia via `useReportsState.getState().state.entriesByDate[dateKey]` (imperativo, sem assinatura) evita que a própria escrita do efeito reative o efeito. Além disso: computar a entrada mesclada completa e comparar campo a campo (`cycles`, `focusedSeconds`, `completedCount`, e a lista `tasks` — por id/valor, não por referência, já que T13/React Compiler proíbe mutação e todo objeto é recriado) contra o snapshot lido; chamar `actions.upsertDailyEntry` só quando algum campo difere. Sem essa dupla guarda (deps não-reativas + comparação de conteúdo) o T4 se repete mesmo com refs, porque `upsertDailyEntry` sempre retorna objeto novo (`index.ts:58`, spread).

## Armadilhas

- T4 (acima) é a crítica; a 2ª mais provável é a ORDEM dos hooks em `IndexTasks.tsx` — sync não pode rodar antes de `hasHydratedRef` do `useStoredReports` virar `true`, senão sobrescreve o histórico com base vazia (mesma classe de bug do próprio T4, mas na hidratação, não no loop)
- T7 (`scoreUtils.ts:74-88`) não filtra por dia — não reusar para `completedAt`, usar `isSameDay` direto nos `timeEvents`
- T13 (React Compiler) — `mergeDailyTasks` deve sempre retornar arrays/objetos novos, nunca mutar `existingEntry.tasks`

## Sinal de teste

Não encontrado (sem suíte/runner, T9). Docker+browser only, roteiro já fixado no `plan-simplified.md` (`npm run dev` porta 1420 + Playwright MCP + `browser_evaluate` sobre `localStorage["timertasks:reports"]`).

## Veredito de complexidade

1. Uma frente só? `sim` — só estado/hooks React, sem UI nem backend (`IndexTasks.tsx:10-12` é o único ponto de montagem).
2. Footprint ≤6 arquivos? `sim` — 2 novos (`states/reports/sync.ts`, `hooks/useReportsSync.ts`) + 1 editado (`IndexTasks.tsx`).
3. Molde claro? `não` — ref-mirror (`useStoredTasks.ts:122,145-147`) só cobre metade do problema; mesclagem por id e delta de contador não têm precedente no repo.
4. Zero decisão de arquitetura/produto em aberto? `sim` — P6-P13 já fechados na `memoria-da-task.md:46-54`; falta só desenho técnico, não decisão de produto.
5. Zero lógica/algoritmo novo não-trivial? `não` — recorte de dia + merge idempotente + delta que não subtrai no reload + guarda anti-loop é algoritmo novo (`plan-simplified.md:88-89` já classifica como `julgamento`).

veredito: complexa — falham os itens 3 e 5 (sem molde completo; algoritmo genuinamente novo de merge/delta/anti-loop).

## Sinal de partição

partição: não — um módulo novo (`states/reports/sync.ts` + `hooks/useReportsSync.ts`) mas sem suíte de testes própria (T9: só teste de browser, mesmo roteiro de todo o repo) e sem taxonomia nova exportada para outros consumirem (o contrato exportado já é o do step 01, congelado). Escopo único de implementação.
