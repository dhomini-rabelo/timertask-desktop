# answers.md — decisões do usuário (BINDING)

Rodada única de perguntas feita pelo meta-planner. Tudo abaixo é vinculante para todos os steps.

## Decisões respondidas pelo usuário

1. **Multi-ativa = cronômetros em paralelo.** Cada task ativa tem play/stop independente e conta tempo
   simultaneamente com as outras. Não existe mais "só uma task ativa por vez". — binda steps **01, 02**.
2. **Prefixo `>` cria um GRUPO com filhos explícitos.** O grupo tem o seu próprio input "Add a task..."
   e as tasks são adicionadas explicitamente dentro dele; os filhos ficam SEMPRE visíveis no nível 1
   (nada de navegar para outra página). — binda steps **01, 03**.
3. **Migração preserva a hierarquia atual como grupo.** Cada grupo atual (`Task` legado) vira um
   `TaskGroup` e cada `subtask` dele vira uma task de nível 1 com `groupId` apontando para esse grupo;
   TODOS os `timeEvents` são preservados. — binda step **01**.
4. **Progresso aparece em dois lugares.** O rodapé geral conta todas as tasks de nível 1 do workflow
   selecionado; ALÉM disso cada grupo mostra a sua própria contagem "X of Y completed" + barra de
   progresso. — binda steps **03, 04**.

## Premissas assumidas pelo meta-planner e APROVADAS pelo usuário

- P1. A "página 2" (tela de subtasks) deixa de existir. `inExecutionTaskId`, `TaskListingMode`,
  `getTaskListingMode` e `getActiveTask` são removidos do código. — steps 01, 02.
- P2. Toda task de nível 1 ganha o que hoje só a `SubTask` tem: cronômetro (`Timer`), seletor de alerta
  (`IndexAlertSelect`), debug timer (`IndexDebugTimer`), botão de concluir, nota. — step 02.
- P3. **Grupos não têm cronômetro** e não têm `completed` próprio (o "progresso" do grupo é derivado dos
  filhos). — steps 01, 03.
- P4. Guards atuais permanecem: não é possível iniciar uma task durante o descanso (`isResting`) e é
  exigido que o timer global (`countdownTimer`) esteja rodando; caso contrário dispara
  `errorMessageAtom` = "Global timer is not running". — steps 01, 02.
- P5. Tasks concluídas continuam saindo da lista principal e aparecendo no accordion "X of Y completed"
  do rodapé. — step 04.
- P6. O título da página vira **"Tasks"** (era "Task Groups"). — step 02.
- P7. O placeholder do input principal menciona o prefixo, ex.: `Add a task... (use > para criar um grupo)`.
  — step 03.
- P8. Drag-and-drop: reordenação de tasks dentro do seu grupo (ou dentro da raiz) e reordenação dos
  grupos entre si. Não é requisito mover uma task de um grupo para outro via drag. — steps 01, 03.
- P9. Modo de teste de sistema de TODOS os steps = **browser** (`npm run dev`, Vite em
  `http://localhost:1420`). O repo **não tem** suíte de testes, nem vitest/jest, nem Dockerfile.
  Validação estática = `npx tsc --noEmit` (o script `npm run build` roda `tsc && vite build`).
  — todos os steps.

## Premissas derivadas (decorrência lógica das respostas, também vinculantes)

- P10. Como todos os cronômetros são independentes (resposta 1), a prop `isActive` que hoje distingue
  "a task ativa" das demais **deixa de existir**. Toda task não concluída renderiza os controles
  completos. O destaque verde da borda passa a significar `task.isRunning` (task rodando), não
  "primeira não concluída". — step 02.
- P11. O anel de cronômetro (`Timer`) e o `IndexDebugTimer` só aparecem depois que a task foi iniciada
  pelo menos uma vez (`timeEvents.some(e => e.type === "start")`), espelhando a lógica atual de
  `hasSubtaskBeenStarted` em `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx:39`.
  Play/stop e seletor de alerta aparecem sempre. — step 02.
- P12. Quando o timer global pausa/retoma, **todas** as tasks com `isRunning === true` pausam/retomam
  (hoje só a única task ativa fazia isso). — step 02.
- P13. O botão "Finish" do rodapé (`canFinishTask` / `handleFinishTask` em `IndexFooter.tsx:43-56`) é
  removido: ele existia para concluir o grupo a partir da página 2, e grupos não têm mais `completed`.
  — step 04.
- P14. `clearTasks` + `clearSubtasks` viram uma única ação de reset do workflow selecionado. — step 04.
