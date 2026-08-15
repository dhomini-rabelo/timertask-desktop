# Implementer — escopo único: `scroll-vertical-ativas-e-concluidas`

Task `correcao-layout-tasks`, step 02 (último). Este arquivo é seu contrato completo — **não abra
`plan.md`, `recon.md`, `memoria-da-task.md` nem `plan-simplified.md`**, tudo que você precisa está aqui.

## Objetivo

Pedido literal do usuário: *"não devemos ter um scroll interno das tasks ativas — somente das tasks
inativas — as tasks ativas podem esticar as páginas"*. Ou seja: a lista de **ativas** perde altura
máxima e scroll interno e passa a esticar a página (scroll vira o da **janela**); a lista de
**concluídas** ganha altura máxima e scroll próprio.

## Estado de git

Branch `main`, base commit `91fd07b`. Working tree limpa **exceto** 3 PNGs untracked na raiz
(`test-1.png`, `test-2.png`, `3-active-tasks.png`) — são evidência do usuário: **não apagar, não
mover, não commitar, não abrir**.

---

## PASSO 0 — pré-cheque duro, antes de qualquer edição

O step 01 corrigiu o overflow horizontal do card. Se ele não estiver no código, remover o
`overflow-y-auto` do container faria o conteúdo **vazar por cima** do layout (pior que o bug
original), porque `overflow-y:auto` implica `overflow-x:auto`. Confirme os 3 anchors:

- `src/pages/.../IndexTaskItem/IndexAlertSelect.tsx:22` → className contém `w-auto shrink-0`
- `src/pages/.../IndexTaskItem/IndexTaskItem.tsx:248` → contém `shrink-0`
- `src/pages/.../IndexTaskItem/IndexTaskItem.tsx:265` → contém `min-w-0`

Os três já foram verificados presentes. Se **algum** faltar: **PARE e reporte**, não siga.

---

## PASSO 1 — as 5 edições (4 arquivos). Ordem: ativas → shell → concluídas

**1. `src/pages/index/components/IndexTasks/IndexTasks.tsx:30`** — tira o teto e o scroll interno,
mantém o piso:

- de: `"flex flex-col gap-3 max-h-[calc(100vh-400px)] min-h-[250px] overflow-y-auto"`
- para: `"flex flex-col gap-3 min-h-[250px]"`

**2. `src/pages/index/page.tsx:54`** — destrava o shell, mantém o piso de viewport:

- de: `"body-df min-h-screen max-h-screen flex flex-col"`
- para: `"body-df min-h-screen flex flex-col"`

**3. `src/layout/styles/global.css:45`** (regra `html, body, #root`, linhas 44-47):
`height: 100%;` → `min-height: 100%;`. A linha `background-color` da regra fica intacta.

**4. `src/layout/styles/global.css:68`** (regra `.body-df`, linhas 67-71):
`height: 100%;` → `min-height: 100%;`. O `width: 100%;` (`:69`) e o `background-color` (`:70`)
**ficam**. A regra `.dark .body-df` (`:73-75`) fica **intocada**.

**5. `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx:81`** — o `div` que já
existe dentro de `{state.showCompleted && completedTasks.length > 0 && (...)}` ganha as duas
classes que saíram do item 1:

- de: `"flex flex-col gap-3"`
- para: `"flex flex-col gap-3 max-h-[calc(100vh-400px)] overflow-y-auto"`

Não crie `div` novo, não mova o `ProgressBar` (`:94`) para dentro dele, e **não** mexa na
linha-gatilho do accordion (`:44-65`) — ela fica fora do scroll para continuar sempre clicável.

---

## Decisões binding (não reabrir, não "melhorar")

- **`height` vira `min-height`, não é apagado.** Aquelas linhas entregam *piso* de altura para o
  fundo pintar a viewport; `min-height` preserva o piso e remove só o teto, que é o que trava o
  scroll.
- **`min-h-screen` fica em `page.tsx:54`;** só `max-h-screen` sai. Ele é o piso de viewport de fato.
- **Zero `overflow` novo em `html`, `body`, `#root` ou `.body-df`.** O scroll da janela funciona por
  *ausência* de restrição. Qualquer `overflow` ali reintroduz o bug por outra porta.
- **O valor da altura máxima das concluídas é exatamente `max-h-[calc(100vh-400px)]`** — o mesmo
  que sai das ativas. Não invente outro valor.
- **`min-h-[250px]` permanece nas ativas.**
- O empty-state de `IndexTasks.tsx:32` (`grow flex items-center justify-center`) **não muda**:
  com o piso de 250px preservado, o `grow` continua preenchendo.
- `page.tsx:55-74` **não muda** (o `flex-1` de `:55` e o layout de 2 colunas de `:66-74` funcionam
  igual com o shell destravado).
- O modal de nota (`IndexTaskNoteDialog`, usado em `IndexCompletedTaskItem.tsx:83`) **não é
  clipado** pelo novo `overflow-y-auto`: `Dialog/content.tsx:20,52` usa `RadixDialog.Portal`.
  Nenhum ajuste necessário.

## OUT — não faça

- Não reintroduza scroll interno nas ativas em nenhuma forma (nem `max-h` "generoso", nem
  `overflow-auto` num ancestral intermediário, nem `h-[...]` calculado).
- Não torne a coluna esquerda (`IndexTimer` + `IndexScore`, `page.tsx:66-73`) `sticky`/`fixed`.
- Não toque em `IndexTaskItem`, `IndexTaskGroup`, `IndexAlertSelect`, `IndexDebugTimer` (step 01,
  já fechado no commit `e521536`), nem em `IndexScore`/`scoreUtils`, nem no átomo `Select`.
- Não toque nos outros `overflow` do projeto: `IndexTaskNoteDialog.tsx:92,94`,
  `IndexDebugTimer.tsx:93`, `Select/root.tsx:28`.
- Não corrija preventivamente overflow horizontal de página: ele já foi eliminado no step 01
  (medido: `scrollWidth == clientWidth == 605`). A re-verificação em escala é do teste de sistema.
- Não rode `npm test` (não existe suíte nem Docker no repo).

---

## Arquivos que você OWNS

1. `src/pages/index/components/IndexTasks/IndexTasks.tsx`
2. `src/pages/index/page.tsx`
3. `src/layout/styles/global.css`
4. `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx`

Nenhum outro arquivo pode aparecer no `git diff`.

## Critérios de aceite (verifique você mesmo antes de retornar)

1. `grep -rn "max-h-screen" src/` → **zero** hits.
2. `grep -n "overflow" src/pages/index/components/IndexTasks/IndexTasks.tsx` → **zero** hits.
3. `IndexTasks.tsx:30` contém `min-h-[250px]` e `flex flex-col gap-3`.
4. `grep -n "height: 100%" src/layout/styles/global.css` → **zero** hits (só `min-height: 100%`);
   `width: 100%` de `.body-df` intacto; regra `.dark .body-df` intacta.
5. `IndexFooter.tsx:81` contém `flex flex-col gap-3 max-h-[calc(100vh-400px)] overflow-y-auto`;
   `ProgressBar` (`:94`) continua fora do bloco.
6. `npx tsc --noEmit` passa sem erro novo.
7. `git diff --stat` toca exatamente os 4 arquivos acima.

## Retorno

Máximo 10 linhas: os 4 arquivos com as linhas alteradas, o resultado dos 7 critérios, e qualquer
desvio (com motivo). Não commite — a orquestração commita.
