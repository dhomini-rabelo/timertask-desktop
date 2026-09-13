# Inserção inline de task e seccionamento do card do grupo

Vale para a raiz (pacote único) — feature "inserir task na posição certa" (ponto de inserção entre
duas tasks, na listagem geral e dentro de um card de grupo/subtask).

- **Input inline vazio some por tempo, com texto nunca some.** Um input de criação aberto pelo
  ponto de inserção ("+ adicionar task") que fica 20 segundos sem nenhuma interação — nenhuma
  tecla, nenhum clique dentro dele — fecha sozinho e a fresta volta ao comportamento de hover. Um
  input com qualquer texto digitado nunca fecha por tempo, por mais que fique parado; só fecha por
  Esc, por clique fora (com o campo vazio) ou por outra fresta abrir no lugar dele. Onde o código
  aplica: `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx`
  (`idleCloseDelayInMilliseconds = 20000`, o `useEffect` do `setTimeout` guardado por
  `title.trim()`, e `interactionTick` reiniciando a contagem a cada tecla ou clique).

- **Task inserida herda o estado de atividade da seção da fresta.** Criar uma task pelo ponto de
  inserção na seção das ativas produz uma task já contando tempo; na seção das pausadas, uma task
  pausada; na das pendentes, uma task pendente — sem nenhum campo novo, nenhum valor novo e nenhuma
  combinação de campos que a task não admita hoje. A herança reusa o caminho de criação e de
  mudança de estado que já existe: a task nasce igual à criada pelo campo fixo (pendente) e, quando
  a seção é a das ativas, passa por `executeTask`; quando é a das pausadas, passa por `executeTask`
  seguido de `stopTask` — o mesmo efeito de criar a task e dar play nela, respeitando a regra de
  uma única task ativa por vez. Vale igual na listagem geral e dentro de um grupo/subtask. Onde o
  código aplica:
  `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx`
  (`handleSubmit`, o branch por `status` que chama `executeTask`/`stopTask`) e
  `src/pages/index/states/tasks/index.ts` (`insertTask`).

- **A lista de dentro de um grupo é seccionada como a listagem geral.** As subtasks de um
  grupo aparecem divididas nas mesmas três seções da listagem geral — ativas, pausadas, pendentes
  —, com os mesmos cabeçalhos, na mesma ordem, e uma seção sem nenhuma subtask não aparece. A
  divisão reusa a mesma função de agrupamento e o mesmo componente de seção da listagem geral, sem
  uma segunda cópia da regra. Arrastar uma subtask continua reordenando só dentro da mesma seção,
  igual à listagem geral. Onde o código aplica: `src/pages/index/states/tasks/utils.ts`
  (`bucketByActivityStatus`, usada por ambas as listas),
  `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexTasksSection.tsx`
  (o componente de seção compartilhado) e
  `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx`
  (o consumidor de dentro do grupo, com o mesmo guard de seção no `handleDragEnd`).
