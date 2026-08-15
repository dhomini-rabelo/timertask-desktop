## Extrato do step

- Branch `main`, base commit `91fd07b`. Working tree limpo exceto 3 PNGs untracked na raiz
  (`test-1.png`, `test-2.png`, `3-active-tasks.png`) — evidência do usuário, não tocar.
- Recon: **simples**, partição **não** (1 escopo). Classe hint era `julgamento` → discordância com
  recon → planner rodou em **Opus**.
- Binding: P1 (mover altura+scroll de ativas para concluídas), P2 (`max-h-[calc(100vh-400px)]` nas
  concluídas — mesmo valor que sai das ativas), P3 (scroll passa a ser da janela, sem container novo),
  P4 (`min-h-[250px]` permanece nas ativas). A1 `height:100%`→`min-height:100%` em global.css (não
  apaga). A2 `min-h-screen` fica em page.tsx:54, só `max-h-screen` sai. A3 nenhum `overflow` novo em
  html/body/#root/.body-df. A6 N4 (overflow horizontal de página) já resolvido pelo step 01 — só
  reverificar em runtime com ≥8 ativas, sem código preventivo.
- 5 edições em 4 arquivos:
  1. `src/pages/index/components/IndexTasks/IndexTasks.tsx:30` — remove `max-h-[calc(100vh-400px)] overflow-y-auto`, mantém `min-h-[250px]`.
  2. `src/pages/index/page.tsx:54` — remove `max-h-screen`, mantém `min-h-screen`.
  3. `src/layout/styles/global.css:44-47` (`html, body, #root`) — `height:100%` → `min-height:100%`.
  4. `src/layout/styles/global.css:67-71` (`.body-df`) — `height:100%` → `min-height:100%`; `width:100%` intacto.
  5. `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx:81` — soma `max-h-[calc(100vh-400px)] overflow-y-auto` ao `flex flex-col gap-3` existente.
- Pré-cheque duro obrigatório antes da edição 1: confirmar que o fix do step 01 está presente
  (`IndexAlertSelect.tsx:22` `w-auto shrink-0`; `IndexTaskItem.tsx:248` `shrink-0`; `:265` `min-w-0`).
  Recon já confirmou que estão lá.
- OUT: não sticky/fixed na coluna esquerda (P9); não mexer no card de task/grupo (step 01); não mexer
  em IndexScore/scoreUtils (N5); não mexer no átomo Select; não apagar/mover os PNGs.
- Critérios de aceite estruturais (7): zero `max-h-screen` em src/, zero `overflow` em IndexTasks.tsx,
  `:30` mantém `min-h-[250px]`+`flex flex-col gap-3`, zero `height: 100%` em global.css (vira
  `min-height: 100%`, `width:100%` e `.dark .body-df` intactos), `IndexFooter.tsx:81` com as duas
  classes novas e `ProgressBar` (`:94`) fora do bloco de scroll, `npx tsc --noEmit` limpo, `git diff --stat`
  toca exatamente 4 arquivos.
- Teste de sistema: **Docker+browser only** → na prática browser only (sem suíte/Docker, trap T9),
  `npm run dev` porta 1420 + Playwright MCP, pasta `tests-01/`. 6 casos mínimos: (1) ≥8 ativas sem
  scroll próprio + janela rola + reverificação de N4 em escala; (2) 0/1 ativa sem colapso, empty-state
  centralizado; (3) concluídas ≥15 itens com scroll próprio respeitando a altura máxima; (4)
  header/Timer/Score corretos ao rolar; (5) regressão zero scroll horizontal em todo lugar; (6)
  regressão colapsar/expandir grupo ativo com nova altura (só a mudança de altura/scroll, BUG C já
  refutado como overflow horizontal no step 01 — não relitigar).
- Fonte: `plan.md` (íntegro) e `recon.md` neste mesmo step_dir.
