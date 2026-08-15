APPROVED

# Validação r1 — step 02 (item unificado / múltiplas tasks ativas)

Branch `main`, base `5430dcd`. Revisados apenas os arquivos declarados no escopo.
`tsc --noEmit` já rodou limpo (não re-executado, conforme instrução).

## Arquivos revisados

- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx` (rename + reescrita)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexAlertSelect.tsx` (rename puro, 0 linhas alteradas)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexDebugTimer.tsx` (rename puro, 0 linhas alteradas)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskItem.tsx` (6 linhas)

`git status --short` mostra `R`/`RM` nos três arquivos da pasta — rename real, não delete+create.
Fora do escopo nada foi tocado: `states/`, `hooks/useStoredTasks.ts`, `useCountUpTimer.ts`,
`IndexTaskNoteDialog.tsx`, `IndexActiveTasksList.tsx` estão intactos no diff.

## Decisões vinculantes — conferência

**A1 (rename e símbolos) — OK.** Pasta e arquivo renomeados via `git mv`; símbolos `IndexTaskItem`,
`IndexTaskItemProps` (:32), `IndexTaskItemState` (:28), `stopTask` (:44), `toggleTask` (:45),
`handleToggleTaskTimer` (:71). Profundidade dos imports `../../../../../../` inalterada (:12-14) e
`./IndexAlertSelect` / `./IndexDebugTimer` continuam válidos (:25-26). Nenhum `IndexTaskItem.tsx`
solto na raiz de `IndexActiveTasksList/`.

**A2 (fonte da verdade visual) — OK, verificado por grep exaustivo.** `isTimerActive =
timerState.isRunning` (:64). As únicas ocorrências de `isRunning` no arquivo são: store global
(:47), `task.isRunning` **apenas** dentro do `autoStart` (:55), `isTimerActive` (:64), e
`timerState.isRunning` em handler/efeitos/render (:73, :117, :124, :207, :279). **Zero** resíduo de
`task.isRunning` em condicional visual — borda/fundo (:157), título (:194), drag handle (:168),
lixeira (:255), botão concluir (:214), badge (:231/:240) todos ancorados em `isTimerActive`.
Isto corrige exatamente o cenário pós-reload do critério 8: com `isRunning: true` preso no store e
`shouldAutoStart` → `false`, o item renderiza Play, sem borda verde, com handle e lixeira presentes.

**A3 (sync bidirecional) — OK.** Efeito :115-129 reproduz o snippet do plano linha a linha
(`wasAutoPausedRef` como `useRef`, `stopTask` + `timerActions.stop()` na pausa, `executeTask` +
`timerActions.start()` no retorno, reset do ref no fim). Verifiquei o resume contra
`useCountUpTimer.ts:25-45`: `start()` refaz `startTimeRef = now − state.currentTimeInSeconds` do
render corrente, e o efeito só dispara no render em que `isGlobalActive` mudou — o tempo acumulado
não zera. `stop()` (:47-56) é no-op quando já parado, e no caminho de pausa o guard
`timerState.isRunning` garante estado coerente. No mount com global parado, `autoStart` é `false`
⇒ `timerState.isRunning` é `false` ⇒ o efeito não dispara `stopTask` espúrio e nada retoma sozinho
(T4 preservada). A memória é só em RAM, some no reload — como o plano exige.

**A4 (`isResting` = global parado) — OK.** `isGlobalActive = isGlobalTimerRunning && !isResting`
(:68), usado como única dependência do efeito. Coerente com `executeTask`
(`states/tasks/index.ts:311-314`), que aborta sob `isResting` — não há caminho de desync.

**A5 (progressive disclosure) — OK.** `hasBeenStarted` literal (:65-67). Gated: anel `Timer` (:177),
badge (:228), `IndexDebugTimer` (:275). Sempre visíveis: play/stop (:203), editar (:249),
`IndexTaskNoteDialog` (:263), `IndexAlertSelect` (:266); lixeira sob `!isTimerActive` (:255).
O `IndexAlertSelect` deixou de ser escondido durante a execução e deixou de trocar de lugar com o
debug timer, como P11 pede.

**A6 (badge) — OK.** Linha própria `flex items-center justify-end` entre header e barra de controles
(:228-244), sob `!isEditing && hasBeenStarted`. Diff classe a classe contra o molde
`git show 8185c5c:.../IndexTaskItem.tsx:166-180`: markup idêntico, só a variável trocou
(`isSubtaskTimerActive` → `isTimerActive`).

**A7 (nota) — OK.** `<IndexTaskNoteDialog taskId={task.id} label="Notes" />` (:263) no cluster
esquerdo, depois de editar/apagar, sempre visível. Componente não tocado; assinatura confere com
`IndexTaskNoteDialog.tsx:11-29`.

**A8 (IN 6/7 sem ação) — OK.** `grep -rn "listingMode|inExecutionTaskId|nonActiveExpandedTaskId|
getActiveTask|getTaskListingMode|IndexTaskAccordionSubtaskItem" src/` → zero resultados. Nenhum
desses arquivos aparece no diff.

**A9 (alarme byte a byte) — OK.** `playAlertSound` (:86-106) e o efeito de alerta (:131-151) são
idênticos ao original (`HEAD:.../IndexSubTaskItem.tsx:82-102` e `:118-138`), com `new Audio` por
disparo. Nenhum áudio/efeito compartilhado entre itens (T6).

**A10 (`useCountUpTimer` por item) — OK.** Uma instância (:50), sem centralização; a lista continua
com `key={task.id}` (`IndexActiveTasksList.tsx:47`), sem remount espúrio (T7).

**A11 / A12 — OK.** Nada foi mexido em `states/tasks/index.ts` nem em `states/countdownTimer.ts`;
os riscos aceitos continuam intactos, como decidido.

**T8 (imutabilidade sob React Compiler) — OK.** Único `setState` do componente usa spread
(:269-272); `setIndexTasksPageState` usa updater imutável (:109-112). `wasAutoPausedRef` e
`debuggingTimerRef` são `useRef`, escritos apenas em efeito/handler, nunca durante o render. Nenhum
`push`/mutação em `task.timeEvents` (`some` é leitura pura). Ordem dos hooks estável, sem chamada
condicional.

**`IndexSortableTaskItem.tsx` — OK.** Import novo (:4), `isActive` fora da interface, prop morta
`dragHandleProps` removida de `IndexSortableTaskItemProps` (:6-8) mas ainda **passada** ao filho
(:31) a partir do `useSortable` local — que é o comportamento correto e o que o plano descreve.

## Critérios de aceite 1-9

| # | Situação |
| --- | --- |
| 1 | tsc limpo (dado). Grep: ver ressalva R1 — os 2 hits restantes são falso-positivo. |
| 2 | OK — `R`/`RM` no `git status --short`. |
| 3 | Código sustenta: `executeTask`/`stopTask` (`states/tasks/index.ts:311-367`) só mapeiam o `id` alvo; nenhum item para outro. Confirmar no browser. |
| 4 | Código sustenta (A3 acima, com o resume validado contra `useCountUpTimer`). Confirmar no browser. |
| 5 | Código sustenta: `key={task.id}` estável ⇒ o vizinho não remonta. Confirmar no browser. |
| 6 | OK — guard preservado em `handleToggleTaskTimer` (:74-79), mensagem intacta. |
| 7 | OK por A5. |
| 8 | OK por A2 + T4 (análise acima). Confirmar no browser. |
| 9 | Editar (:249), apagar (:256), nota (:263) presentes; nenhum dos componentes envolvidos foi alterado. |

## Ressalvas (não bloqueantes, para registro)

**R1 — critério 1, grep literal, falso-positivo.**
`grep -rn "IndexSubTaskItem\|isActive" src/pages/index/components/IndexTasks/` ainda retorna 2 hits:
`.../IndexTaskItem/IndexDebugTimer.tsx:36` e `:102`. É uma variável **local** (`const isActive =
timerState.currentTimeInSeconds > 0`) de um arquivo que A1 manda mover sem alterar conteúdo (e o
diff confirma 0 linhas alteradas). Não é a prop `isActive` que P10 elimina. O critério deve ser lido
como satisfeito; nada a corrigir.

**R2 — `wasAutoPausedRef.current = false` em `IndexTaskItem.tsx:72` é uma adição fora do snippet de
A3.** Efeito prático: se o timer global pausa (auto-pause, `ref = true`) e o usuário clica em Play
nessa task, o clique cai no ramo de erro "Global timer is not running" mas mesmo assim zera a
memória — quando o global for retomado, essa task **não** volta sozinha, enquanto as vizinhas
voltam. É um canto estreito (o único caminho em que o handler roda com `ref === true`), não é
coberto por nenhum dos 9 critérios e é defensável como "usuário interveio manualmente". Registro
para decisão futura; se se quiser fidelidade literal a A3, basta remover a linha :72.

**R3 — layout do cluster direito da barra de controles (:265-284) mudou de forma.** O
`IndexDebugTimer` saiu de `w-full pl-2` para um wrapper `flex-1 min-w-0` dentro de um cluster
`flex items-center gap-2` que agora divide espaço com o `IndexAlertSelect` (antes os dois nunca
coexistiam). O componente é `flex ... px-3 py-2` sem largura própria
(`IndexDebugTimer.tsx:76`), então ele estica/encolhe pelo wrapper — deve ficar correto, mas é a
única mudança de layout sem molde anterior. Vale um olhar do testador em item estreito / janela
pequena, para garantir que a linha não estoura.

**R4 — `timerState.isRunning` direto em `IndexTaskItem.tsx:207` e `:279`, onde o resto do arquivo usa
`isTimerActive`.** Valor idêntico (`isTimerActive` é alias de `timerState.isRunning`), sem impacto
funcional; só uma inconsistência estilística com A2. Opcional.

**R5 — `group` no wrapper externo (:154) ficou sem consumidor.** Os `group-hover:` que existiam no
cluster de hover do header antigo (`HEAD:.../IndexSubTaskItem.tsx:192`) desapareceram junto com o
bloco. O plano manda manter o wrapper como está, então isso é o esperado; fica registrado como
classe morta para uma limpeza futura, não para este step.

## Conclusão

APPROVED. As 12 decisões (A1-A12) e as traps T4/T6/T7/T8 estão implementadas fielmente; nenhum
critério foi silenciosamente descartado; nenhum arquivo fora do escopo foi tocado. Os critérios
3-5 e 8 dependem do teste de browser, e o código os sustenta. As ressalvas R1-R5 são de registro,
não exigem rodada de correção.
