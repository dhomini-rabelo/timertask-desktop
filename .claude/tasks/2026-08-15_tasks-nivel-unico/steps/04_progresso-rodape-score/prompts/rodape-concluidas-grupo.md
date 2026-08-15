# Prompt — implementador: indicação de grupo nas concluídas + limpeza do órfão

Você é o IMPLEMENTADOR (escopo único) do step 04 da task `tasks-nivel-unico`. Este prompt é auto-contido:
**não abra `plan.md`, `plan-simplified.md`, `recon.md` nem `memoria-da-task.md`** — tudo que você precisa
está aqui. **NÃO PERGUNTE NADA AO USUÁRIO**; todas as decisões já foram tomadas. Se achar um bloqueio real,
implemente o que der e devolva `blocked: {motivo}`.

Repo: `/home/fael/so/code/saas/timertask-desktop`. Branch `main`, commit-base `2877767`.

## Contexto em uma linha

A migração para "tasks de nível único + grupos" já está feita (steps 01-03). O rodapé (`IndexFooter.tsx`)
já está correto: já não tem botão "Finish", já conta todas as tasks de nível 1 do workflow (soltas +
dentro de grupos, grupos fora do denominador), e o `Reset` já é escopado ao workflow. **Não reescreva nada
disso.** Faltam só três coisas.

## O que fazer — exatamente isto, nada além

### 1. `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx` — badge do grupo

- `:11-13` a interface vira `{ task: Task; groupTitle?: string }`; `:31` a função desestrutura
  `{ task, groupTitle }`. A prop é **opcional** (task solta e grupo inexistente caem no mesmo caminho
  "sem badge"; não use `?? ""`).
- Insira o badge como **primeiro filho** da linha de metadados que já existe em `:54`
  (`<div className="flex items-center gap-2 text-xs text-Black-400">`), **antes** do ternário
  `hasTrackedTime ? (...) : (...)` — assim ele aparece nos dois ramos com uma inserção só:

```tsx
{groupTitle && (
  <span className="px-2 py-0.5 rounded-full font-medium bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400 break-all">
    {groupTitle}
  </span>
)}
```

- Só o título do grupo: **sem** prefixo "Grupo:"/"in", **sem** ícone. Espelha
  `IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx:98-100`, que mostra `group.title` cru.
- Não repita `text-xs` (herdado do `<div>` pai). As classes acima já existem no projeto:
  `bg-Black-100/50` (`IndexTaskGroup.tsx:84`), `text-Black-450 dark:text-Black-400`
  (`IndexCompletedTaskItem.tsx:51`), pílula `rounded-full px-2 py-0.5` (`IndexAlertSelect.tsx:22`).
  `dark:bg-Black-600` (e não `/50`) porque o card já é `dark:bg-Black-700` e o /50 sumiria.
- **Não** mude mais nada no arquivo: nem os cálculos de tempo (`:33-40`), nem o `IndexTaskNoteDialog`
  (`:9,74`), nem o bloco expandido (`:89-105`).

### 2. `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` — resolver o título uma vez

Três edições, nada mais:

- `:20` → `const { tasks, completedTasks, groups } = useListingTasks();`
  (`useListingTasks` já expõe `groups`, `hooks/useListingTasks.ts:13`.)
- logo após o cálculo de `progressPercentage` (`:24-26`), adicionar:
  `const groupTitleById = new Map(groups.map((group) => [group.id, group.title]));`
  (`new Map` por render é ok e é imutável; **não** use `useMemo` — o React Compiler está ligado e o
  arquivo não usa `useMemo` em lugar nenhum.)
- `:80`, o call site, passa a prop já resolvida:

```tsx
<IndexCompletedTaskItem
  key={task.id}
  task={task}
  groupTitle={task.groupId ? groupTitleById.get(task.groupId) : undefined}
/>
```

O lookup acontece **aqui**, uma vez por item na render do footer — **não** passe o array `groups` para o
item e **não** chame `useListingTasks()` dentro de `IndexCompletedTaskItem` (o accordion pode ter 150+
itens em produção).

### 3. Apagar o órfão

`git rm src/pages/index/components/IndexTasks/IndexFooter/IndexTaskNote.tsx`

Órfão confirmado: `grep -rn "IndexTaskNote\b" src/` só encontra a própria `export function` na `:22`, e a
pasta `IndexFooter/` não tem barrel/`index.ts`. Era o painel de nota da navegação de 2 níveis, que não
existe mais.

**ARMADILHA:** não confunda com `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskNoteDialog.tsx`
— esse é o dialog por-task, **segue em uso** (`IndexCompletedTaskItem.tsx:9,74`) e **NÃO PODE SER TOCADO**.
O arquivo que você está apagando importa esse dialog (`IndexTaskNote.tsx:6`); apagar um não pode arrastar
o outro. Use `git rm` (não `rm`) para o delete entrar no índice.

### 4. Varredura de resíduos (só conferir, e reportar a saída)

```
grep -rn --include='*.ts' --include='*.tsx' -E "subtasks|SubTask|inExecutionTaskId|nonActiveExpandedTaskId|TaskListingMode|getTaskListingMode|getActiveTask" src/
```

Esperado: **apenas** hits em `src/pages/index/hooks/useStoredTasks.ts` (`LegacySubTask` na `:11`,
`entry.subtasks` em `:30,70,71,81`). Esses são **INTENCIONAIS** — é a leitura do formato antigo dentro de
`migrateEntry`, exigida pela migração idempotente. **NÃO OS REMOVA.** Qualquer hit fora desse arquivo é
resíduo real: reporte no seu retorno (não saia consertando por conta própria se estiver fora dos 3
arquivos deste escopo).

## Fora de escopo — NÃO FAÇA

- **Não** toque em `IndexScore.tsx` nem em `states/tasks/scoreUtils.ts`. Duas esquisitices são conhecidas e
  **pré-existentes** (confirmadas em `git show eec34ca^`), e ficam de fora de propósito: (a) o score soma
  todos os workflows, ignorando o selecionado; (b) uma task marcada e depois desmarcada continua contando
  como concluída, porque `toggleTask` só adiciona o evento `"complete"`. **Não são bugs deste step e não
  devem ser "corrigidos".**
- **Não** toque em `states/tasks/index.ts`, `hooks/useListingTasks.ts`, `hooks/useStoredTasks.ts`,
  `IndexTaskNoteDialog.tsx`, nem em nada dentro de `src-tauri/`.
- **Não** crie arquivos novos, ações de store novas, métricas novas, testes novos, Dockerfile ou
  documentação. **Não** limpe `activeTasks`/`activeRootTasks` de `useListingTasks.ts` (dívida conhecida,
  fora de escopo).

## Arquivos que você OWNS

- `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx` (editar)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` (editar)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexTaskNote.tsx` (apagar)

## Gate e critérios de aceite

1. `npx tsc --noEmit` **limpo** — é o único gate estático. **Não rode `npm test`** (não existe suíte no
   repo), não rode Docker, não suba o Vite (o teste de sistema é de outro agente).
2. `IndexFooter/IndexTaskNote.tsx` não existe mais; `IndexTaskNoteDialog.tsx` continua existindo e
   continua importado por `IndexCompletedTaskItem.tsx`.
3. Uma concluída com `groupId` mostra o badge com o título do grupo; uma concluída solta
   (`groupId === null`) não mostra badge e fica visualmente idêntica ao que era antes.
4. O badge aparece também no ramo "No time tracked".
5. Diff mínimo: 3 arquivos, nada além do descrito acima.

## Commit

Um commit ao final, na branch `main`:

```
claude-step-loop(tasks-nivel-unico): step 04 — indicação de grupo nas concluídas e limpeza de órfão
```

## Retorno

Até 8 linhas: os arquivos tocados, a saída da varredura do item 4, o resultado do `tsc --noEmit`, e
qualquer desvio que você tenha precisado fazer (com a razão).
