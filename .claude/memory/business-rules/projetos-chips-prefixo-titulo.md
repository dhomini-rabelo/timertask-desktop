# Projetos: chip, prefixo de título e switch global

Vale para a raiz (pacote único) — feature "chips de projeto abaixo do input de adicionar task".

- **Prefixo do título ao salvar.** Com um projeto selecionado no momento de salvar, o título da
  task nasce como `"[nome do projeto] título digitado"`; sem projeto selecionado, ou com a função
  desativada, o título sai exatamente como digitado, sem colchete nenhum. A composição acontece
  uma única vez, no instante do save — depois disso a task não guarda vínculo nenhum com o
  projeto, só o texto já colado no título. Onde o código aplica:
  `src/pages/index/components/IndexTasks/IndexAddInput.tsx` (`handleAdd`, no branch que não é o
  de grupo `>`).

- **Switch "Projetos", único e global.** O modal de configurações do header tem um switch
  "Projetos", ativo por padrão (`projectsEnabled: true`). É um switch só para o app inteiro — não
  existe por workflow nem por projeto. Desligado, nem a fileira de chips nem o chip de
  configuração aparecem abaixo do input de adicionar task, e o espaço deles não fica reservado em
  branco: o input volta a se comportar como antes da feature existir. O estado sobrevive a
  fechar e reabrir o app. Onde o código aplica: `src/pages/index/states/settings/index.ts`
  (default `projectsEnabled: true`), `src/pages/index/hooks/useStoredSettings.ts` (persistência em
  `localStorage["timertasks:settings"]`),
  `src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexProjectsSwitch.tsx`
  (o switch em si) e
  `src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectChips.tsx` (retorna `null`
  quando `projectsEnabled` é falso).

- **Task já salva nunca muda de nome.** Desativar a função, renomear ou excluir um projeto nunca
  altera o título de nenhuma task já salva. Isso vale porque a task não guarda referência ao
  projeto — o prefixo é só texto, gravado uma vez no título no momento do save — e `editProject`
  e `deleteProject` só tocam o array de projetos, nunca o estado de tasks. Quando o projeto
  excluído é o que estava selecionado, a seleção volta a vazia e a próxima task salva sai sem
  prefixo. Onde o código aplica: `src/pages/index/states/projects/index.ts` (`editProject`,
  `deleteProject` — nenhum dos dois toca `useTasksState`).
