## Mapa de arquivos
- `src/pages/index/states/workflows/index.ts` | mold zustand store `{state, actions}` | 1-172 (core pattern: 19-37, 58-67, 159-172)
- `src/pages/index/states/tasks/index.ts` | 2º mold zustand store, `setItemsState` simples | 40-75, 369-388
- `src/pages/index/states/tasks/utils.ts` | pure-functions mold (sem `create`, sem set/get) | 1-4, 37-71
- `src/pages/index/states/tasks/scoreUtils.ts` | único uso real de `startOfDay`/`subDays` no repo | 1-6, 90-124
- `src/pages/index/hooks/useStoredWorkflows.ts` | mold do hook de persistência (curto, sem beforeunload) | 1-56 inteiro
- `src/pages/index/hooks/useStoredTasks.ts` | mold 2, tem variante beforeunload — NÃO necessária aqui | 118-143, 193-200 (ignorar 145-191, é beforeunload)
- `src/pages/index/components/IndexTasks/IndexTasks.tsx` | ponto de montagem, `useStoredTasks()` já chamado aqui | 1-10
- `src/pages/index/states/countdownTimer.ts` | existe, NÃO deve ser lido/importado neste step (isso é step 02) | 5-28 (só confirmado que existe `isResting`)
- `package.json` | confirma date-fns como dependência já instalada, sem test runner | não lido linha a linha, só confirmado via grep

## Molde a espelhar
Store: `src/pages/index/states/workflows/index.ts:37-172` é o molde mais limpo (mais simples que `tasks/index.ts`, que tem dependência cruzada com `countdownTimer`/`workflows` que este step não deve replicar). Trecho que carrega o padrão:
```ts
interface WorkflowsStore {
  state: WorkflowsState;
  actions: WorkflowsActions;
}

export const useWorkflowsState = create<WorkflowsStore>((set, get) => {
  function setState(partial: Partial<WorkflowsState>) {
    set((store) => ({
      state: { workflows: partial.workflows ?? store.state.workflows, ... },
      actions: store.actions,   // <-- OBRIGATÓRIO: sem isso, `set` apaga as actions
    }));
  }
  ...
  return { state: {...}, actions: {...} };
});
```
`get()` é usado sempre que uma action precisa ler o estado atual antes de decidir o novo valor (ex.: `resolveSelectedWorkflowId` em `addWorkflow`, linha 106-110). Para este step, `upsertDailyEntry` provavelmente precisa de `get()` para achar/mesclar a entry existente antes de aplicar retenção.

Hook de persistência: `src/pages/index/hooks/useStoredWorkflows.ts:10-56` inteiro é o molde — 3 `useEffect`:
1. mount-time hydrate (18-43): lê localStorage, `JSON.parse`, valida/filtra, `try/catch` cai para default (aqui seria `{}` conforme a task), seta `hasHydratedRef.current = true` em TODOS os caminhos (sucesso, vazio, catch).
2. sync ref (45-47): `workflowsRef.current = workflows` a cada mudança de state.
3. save-on-change (49-53): só grava se `hasHydratedRef.current`, lê do ref (não do state direto, evita closure stale), `localStorage.setItem`.

## Footprint
- `src/pages/index/components/IndexTasks/IndexTasks.tsx:10` | `useStoredTasks()` chamado no topo do componente — `useStoredReports()` deve ser adicionado ao lado, mesma linha/bloco
- `src/pages/index/components/IndexTasks/IndexTasks.tsx:3` | import de `useStoredTasks` — replicar import de `useStoredReports`
- Nenhum outro arquivo hoje importa `states/tasks` ou `states/workflows` fora de `hooks/` e `components/IndexTasks` — footprint de consumo é mínimo, novo store não é consumido por ninguém ainda (é o objetivo do step 02/03/04)

## Armadilhas
- `set((store) => ({ ..., actions: store.actions }))` — se esquecer de devolver `actions`, zustand substitui o objeto inteiro e todas as actions somem silenciosamente (ver every `set` call nos dois moldes, sem exceção, ex. `workflows/index.ts:58-67`, `tasks/index.ts:68-75`).
- `hasHydratedRef.current = true` deve ser setado em TODOS os ramos do effect de hydrate (sucesso, "não existe no localStorage", e no `catch`) — `useStoredWorkflows.ts:23`, `:38`, `:41` — senão o save-on-change nunca dispara e a primeira gravação real do usuário nunca persiste.
- O save-on-change effect lê de um `ref` (`workflowsRef.current`), não da variável de state capturada no closure do effect — `useStoredWorkflows.ts:52` usa `workflowsRef.current`, não `workflows` — isso evita re-registrar o listener a cada mudança e evita stale closure.
- `useStoredTasks.ts` tem uma 4ª responsabilidade (`beforeunload`, linhas 149-191) que a task explicitamente disse NÃO copiar — o molde correto e completo para este step é só `useStoredWorkflows.ts`.
- `date-fns` `format` NÃO tem nenhum uso real no repo hoje (grep confirmou zero ocorrências) — só `startOfDay`/`subDays` (`scoreUtils.ts:4-5`) e `differenceInSeconds`/`addSeconds`/`differenceInMilliseconds` alhures. Se `getDayKey` usar `format(date, "yyyy-MM-dd")`, será o primeiro uso de `format` no projeto — não é um problema, só não é "espelhado" de lugar nenhum, é decisão nova do planner.
- Este step NÃO deve importar `useTasksState`, `useCountdownTimerState` nem `useWorkflowsState` — o novo store/hook é isolado, mesmo que pareça natural puxar dados reais (isso é step 02, conforme escopo).
- `TaskItem`/`Task`/`TaskGroup` já existem em `states/tasks/index.ts:10-30` — o novo tipo `DailyReportTask` é deliberadamente um tipo PRÓPRIO e não deve reusar/estender esses (task diz "sem leitura do store de tasks").

## Sinal de teste
Não encontrado (nenhum arquivo `.test`/`.spec` no repo; `package.json` só tem scripts `dev`/`build`/`preview`/`tauri`). Como este step não tem UI nem consumidor visível (store + utils + hook isolados, sem leitura de outro store), a prova de sistema é indireta: precisa de app rodando (Docker+browser) só para confirmar que a chave `timertasks:reports` aparece no localStorage após montar `IndexTasks` e que nada quebrou no fluxo de tasks existente — não há uma tela nova para clicar.

## Veredito de complexidade
1. Uma frente só? `sim` — só frontend/state, um arquivo de store + um de utils + um hook, sem backend (confirmado: projeto é Tauri+React, sem servidor separado nesta área).
2. Footprint de no máximo 6 arquivos a criar/editar? `sim` — 3 novos (`states/reports/index.ts`, `states/reports/utils.ts`, `hooks/useStoredReports.ts`) + 1 editado (`IndexTasks.tsx`) = 4 arquivos, dentro do limite.
3. Existe molde/irmão claro para espelhar? `sim` — `states/workflows/index.ts:37-172` (store) e `hooks/useStoredWorkflows.ts:1-56` (hook) são molde quase 1:1.
4. Zero decisão de arquitetura/produto em aberto? `sim` — task_dir já fixou nomes de tipos, funções, chave de localStorage e local de montagem; nada em aberto.
5. Zero lógica/algoritmo novo não-trivial? `não` — `applyRetention`/`getRetentionWindowStartKey`/`getEntriesInWindow` são regra de janela de retenção por data, lógica nova que não espelha nada existente no repo (não é só copiar o shape de um sibling).

veredito: complexa — item 5 falhou (retenção por janela de datas é lógica nova, não espelha nenhum utilitário existente)

## Sinal de partição
partição: não (é um único módulo de estado + seu hook de persistência, mesmo shape dos pares existentes `workflows`/`tasks`+`useStoredWorkflows`/`useStoredTasks`; não há suíte de teste própria sendo pedida, e não é uma nova taxonomia consumida por outros lugares neste step — os consumidores vêm nos steps 02-04).
