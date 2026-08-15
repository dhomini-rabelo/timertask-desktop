## Extrato do step

Step 04 (último) `progresso-rodape-score`, classe `julgamento`. Branch `main`, base `2877767`.
Recon: veredito `simples`, sem partição. Plan escalado para Opus (divergência classe×veredito).

**Achado central**: step 01 já reescreveu `IndexFooter.tsx` inteiro para compilar contra o novo store —
isso já entregou ~90% do IN nominal (sem Finish, contagem já plana sobre todas as tasks de nível 1,
`handleReset`→`clearItems()` escopado, sem `listingMode==="subtasks"`, `IndexCompletedTaskItem` já lê
`task.timeEvents` direto). Restam só 3 entregas reais:

1. Badge de grupo no accordion de concluídas (`IndexCompletedTaskItem.tsx`).
2. Apagar arquivo órfão `IndexFooter/IndexTaskNote.tsx` (zero consumidores; NÃO confundir com
   `IndexActiveTasksList/IndexTaskNoteDialog.tsx`, que segue em uso e não pode ser tocado).
3. Confirmar varredura de resíduos (já limpa, só `LegacySubTask`/`entry.subtasks` intencionais em
   `useStoredTasks.ts`).

**Decisão de desenho vinculante**: prop `groupTitle?: string` (título já resolvido, não `groups[]`) —
lookup via `Map` construído uma vez em `IndexFooter.tsx` (`groupTitleById`), passado no call site `:80`.
Badge = `<span>` pílula, primeiro filho da linha de metadados em `IndexCompletedTaskItem.tsx:54`, ANTES
do ternário `hasTrackedTime` (cobre os dois ramos). Classes: `bg-Black-100/50 text-Black-450 dark:bg-Black-600
dark:text-Black-400 rounded-full px-2 py-0.5 font-medium break-all`. Só `group.title` cru, sem prefixo/ícone.

**Arquivos tocados**: `IndexFooter.tsx` (editar, 3 linhas), `IndexCompletedTaskItem.tsx` (editar, prop +
badge), `IndexFooter/IndexTaskNote.tsx` (`git rm`). NÃO tocar: `IndexScore.tsx`, `scoreUtils.ts`,
`states/tasks/index.ts`, `hooks/useListingTasks.ts`, `hooks/useStoredTasks.ts`, `IndexTaskNoteDialog.tsx`,
`src-tauri/`.

**Fora de escopo, registrar não corrigir**: `IndexScore` soma todos os workflows (ignora
`selectedWorkflowId`); `calculateTasksCompleted` conta task já `complete` mesmo se desmarcada depois.
Ambas pré-existentes (confirmado `git show eec34ca^`), não regressão, fora do IN.

**Critérios de aceite**: `tsc --noEmit` limpo; `IndexTaskNote.tsx` some, `IndexTaskNoteDialog.tsx` sobrevive;
badge aparece só p/ tasks de grupo (inclusive sem tempo registrado); rodapé `X of Y` com grupos fora do
denominador; Reset escopado ao workflow; grep de resíduos zero (fora dos hits intencionais).

**Teste de sistema**: browser (`npm run dev` :1420), 12 passos em `plan.md` fechando a régua INTEIRA do
pedido original (nível único, `>` cria grupo, título "Tasks", progresso rodapé+grupo, accordion+badge,
Reset escopado, IndexScore com as 2 esquisitices pré-existentes anotadas, persistência). DnD = `## Not run`
(3x confirmado não-automatizável). Contornos: notification permission override, `element.click()` real via
`browser_evaluate` em vez de `browser_click`/Enter, plantar fixture antes da hidratação.

Plan completo: `plan.md`. Prompt do implementador: `prompts/rodape-concluidas-grupo.md`.

## Fechamento

Implementação: commit `b4b36c7`. Validação (Opus r1): APPROVED, `validation-r1.md`. Docs de plano/recon/
validação: commit `a45e46a`. Teste de sistema (browser, tests-01): **PASS 12/12**, `tests-01/verdict.md`,
commit `bfb14fc`. DnD `## Not run` (4ª confirmação). Step fechado sem escalação nem handoff. Este é o
último step da task — ver `process.md` para o fechamento da régua inteira do pedido do usuário.
