## Extrato do step

Task `correcao-layout-tasks`, step 01 `overflow-horizontal-e-colapso-grupo`. Git: branch `main`,
base `3e3108a`. Working tree limpa exceto 3 PNGs não versionados na raiz (test-1.png, test-2.png,
3-active-tasks.png) — evidência do usuário, não tocar.

**Escopo de implementação (único, PA1): `overflow-linha-de-acoes`.**
- A1 `IndexAlertSelect.tsx:22` — `Select.Trigger` className ganha `w-auto shrink-0` (mantém
  `h-8 rounded-full px-2.5 py-0 text-Black-700 text-xs`).
- A2 `IndexTaskItem.tsx:248` ganha `shrink-0`; `:265` ganha `min-w-0` (só isso, sem `flex-1` — PA6).
  `:247` NÃO muda nesta rodada.
- A3 (contingência pré-autorizada, só se teste medir overflow residual): `flex-wrap` em `:247`.

**Proibido:** editar `Select/trigger.tsx` (P8), `IndexDebugTimer.tsx` (PA5), `IndexTaskGroup.tsx`,
`IndexCompletedTaskItem.tsx`, `IndexTasks.tsx`, `page.tsx`, `global.css`, `IndexFooter.tsx` (step 02).
Nenhum `overflow-x-hidden`/`overflow-hidden` como solução (trap N1).

**BUG C — zero código de saída.** Protocolo de reprodução empírica na etapa de TESTE (não
implementação): fixture com 1 task solta + 1 grupo de 2 filhas (uma rodando), localizar chevron via
`:scope > button` do container `:102`, medir `getBoundingClientRect()` antes/depois do fix A,
comparar com tabela de decisão H0/H1/H2/H3 do plan.md. Só H1 (exception real) abre um 2º escopo via
plan-note. H0 confirmado (chevron inalcançável pré-fix, ok pós-fix) fecha o BUG C só com evidência,
sem linha de código adicional.

**Critérios de aceitação (plan.md tem a versão completa):**
1. `npx tsc --noEmit` sem erro novo.
2. Matriz de overflow, 4 estados (raiz×grupo × debug-nunca-iniciado×debug-já-rodado):
   `scrollWidth <= clientWidth + 1` no `div.overflow-y-auto` (`IndexTasks.tsx:30`) e em
   `document.documentElement`.
3. Sem scrollbar horizontal visível; card branco não cortado.
4. `Select.Trigger` de alerta com `width` ≤140px nos 4 estados.
5. Diff toca só `IndexAlertSelect.tsx` + `IndexTaskItem.tsx`.
6. BUG C: grupo com filha rodando colapsa/reexpande por clique real; `collapsed` alterna;
   cronômetro da filha coerente ao reexpandir. Veredito conforme tabela de decisão.
7. Scroll VERTICAL da lista de ativas continua existindo (sumir aqui é regressão de escopo).

**Teste:** Docker+browser only (T9: sem suíte/Docker no repo). `npm run dev` porta fixa 1420,
janela 620×900. Fixture completa e roteiro DOM em `plan.md` §"BUG C — protocolo de reprodução".
Traps: permissão de notificação (override via `browser_evaluate`), `browser_click`/Enter não
funcionam (native value-setter + `dispatchEvent` + `element.click()`), fixture antes da hidratação
(`localStorage["timertasks:tasks"]`), DnD não testável.

**Recon:** verdict `complexa`. **Plan:** Opus (agentId a2d6b49ac522e619d). Prompt de implementação:
`prompts/overflow-linha-de-acoes.md`.
