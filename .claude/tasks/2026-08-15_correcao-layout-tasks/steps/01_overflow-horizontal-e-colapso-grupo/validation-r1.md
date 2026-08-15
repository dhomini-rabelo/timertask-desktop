# Validação — step 01 `overflow-horizontal-e-colapso-grupo`, rodada r1

APPROVED
Resultado para o orquestrador: **PASS** (nenhum item de `CHANGES_REQUIRED`).

Revisão estática (sem browser). Type-check já rodado pelo implementer (`npx tsc --noEmit`, exit=0) — não re-executado.
Git: branch `main`, HEAD = base = `3e3108a`; o diff está na working tree.

---

## 1. Diff × contrato (footprint: 2 arquivos, 3 linhas) — CONFORME

`git diff --stat` contra `3e3108a`:

```
IndexAlertSelect.tsx | 2 +-
IndexTaskItem.tsx    | 4 ++--
2 files changed, 3 insertions(+), 3 deletions(-)
```

- `IndexAlertSelect.tsx:22` — `className="h-8 rounded-full px-2.5 py-0 text-Black-700 text-xs w-auto shrink-0"` (A1). As classes pré-existentes foram mantidas literalmente; só `w-auto shrink-0` foram acrescentadas.
- `IndexTaskItem.tsx:248` — `"flex items-center gap-1 transition-all shrink-0"` (A2, grupo esquerdo).
- `IndexTaskItem.tsx:265` — `"flex items-center gap-2 min-w-0"` (A2, grupo direito).
- `IndexTaskItem.tsx:247` **não** foi alterado — correto, A3 é contingência e não entra de saída.

Arquivos proibidos: `git status --porcelain` lista **apenas** os 2 arquivos como `M`. `Select/trigger.tsx`, `IndexDebugTimer.tsx`, `IndexTaskGroup.tsx`, `IndexCompletedTaskItem.tsx`, `IndexTasks.tsx`, `page.tsx`, `global.css`, `IndexFooter.tsx` estão **intocados**. Os únicos outros itens no working tree são os 4 arquivos de documentação da própria task (`plan.md`, `recon.md`, `orquestration.md`, `prompts/`) e os 3 PNGs de evidência na raiz — fora do diff de produto, ignorados por instrução.

Critério de aceitação 5 (parte estática) satisfeito.

## 2. Nenhum `overflow-x-hidden` / `overflow-hidden` introduzido — CONFORME

`grep -n overflow` nos dois arquivos alterados: **zero ocorrências**. Trap N1 respeitada.
Observação factual (não é finding): existe um `overflow-hidden` pré-existente em `IndexDebugTimer.tsx:93`, na barra de progresso. É anterior ao step, não foi tocado e não é "solução de overflow" — é o clip do preenchimento da barra.

## 3. O raciocínio de CSS se sustenta — VERIFICADO EMPIRICAMENTE

Não confiei na leitura: executei `twMerge` (tailwind-merge `^3.4.0`, instalado) com a string base real de `src/layout/components/atoms/Select/trigger.tsx:15` e as duas `className` de call site.

- Call site do alerta (pós-fix): a saída **não contém `w-full`**; contém `w-auto shrink-0`. PA3 confirmado — `w-auto` é de fato o que derruba o `w-full` da base (mesmo grupo `w-*`); `shrink-0` sozinho não teria removido nada. A posição das classes no final da string é irrelevante para o twMerge (vence a `className` do call site, não a ordem interna).
- Call site do workflow (`IndexWorkflowSelector.tsx:28`, `"h-10 min-w-[50px] text-xs"`): a saída **mantém `w-full`**. O outro consumidor do átomo segue intacto — confirma que o fix no call site foi a escolha certa e que editar `trigger.tsx` (P8/trap N3) teria quebrado o header.
- `Select.Trigger` são exatamente 2 consumidores no repo (`grep -rn "Select.Trigger" src`): o de alerta e o de workflow. Não há terceiro afetado.
- `:265` recebeu **só** `min-w-0`, sem `flex-1` — PA6 respeitado. No estado "debug nunca iniciado" o grupo direito contém apenas o select e permanece com largura de conteúdo, colado à direita pelo `justify-between` de `:247`; nenhuma regressão do "5 min" escorregando para o meio.
- `:248` com `shrink-0` protege lápis/lixeira/Notes; combinado com `min-w-0` em `:265`, quem passa a absorver o aperto é o `flex-1 min-w-0` de `:276` → barra de progresso `flex-1` de `IndexDebugTimer.tsx:93` (conteúdo vazio ⇒ min-content 0, encolhe até 0). A cascata pretendida está fechada e coerente.
- PA5 confere: `IndexDebugTimer.tsx:76` é `div` block-level filho do wrapper `flex-1 min-w-0` — não é flex item, `min-width:auto` não se aplica, um `min-w-0` ali seria no-op. Corretamente não editado.

## 4. Nada quebrado ou inconsistente no entorno — CONFORME

- `IndexAlertSelect.tsx` inteiro lido: única alteração é a `className`; props, opções e `Select.DisplayValue` intactos.
- `IndexTaskItem.tsx:238-289` lido: estrutura JSX preservada, nenhum handler, condicional (`isTimerActive`, `hasBeenStarted`) ou prop tocada; sem alteração de lógica, de DnD, de `IndexScore`/`scoreUtils` ou de derivados de `useListingTasks.ts` (P9 respeitado).
- Card raiz (`:154`) é `div` block-level e continua limitando a largura da linha `:247` — o novo `min-w-0` não abre caminho para o conteúdo transbordar o card por cima.
- Nenhum callback, tipo, import ou export exigia atualização por causa desta mudança (é puramente de classes utilitárias). Nada ficou pela metade.

## Observações registradas (não bloqueiam, não exigem ação)

1. **Ordem das classes.** Em `IndexAlertSelect.tsx:22` o `w-auto shrink-0` foi anexado ao final, enquanto no repo largura costuma vir antes. É puramente cosmético — o twMerge resolve por grupo, não por ordem, e o resultado foi verificado acima. Não vale uma rodada de fix.
2. **`text-Black-700` redundante** na mesma `className` (já existe na base do átomo). É pré-existente ao step e está fora do footprint autorizado; não deve ser "limpo" aqui.
3. **Risco residual de A3 permanece aberto por medição, não por código.** O orçamento de largura do plano deixa o caso (d) "task dentro de grupo + debug já rodado" (≈496px úteis vs ≈501px estimados) no limite. A revisão estática não pode decidir isso; é exatamente o que a matriz de 4 estados do teste de sistema mede, com A3 (`flex-wrap` em `:247`) já pré-autorizado. Nada a fazer agora.
4. **Fora do alcance desta revisão** (explicitamente, para não gerar falsa cobertura): critérios 2, 3, 4, 6 e 7 são medidos no browser (620×900, `scrollWidth <= clientWidth + 1`, largura do trigger ≤140px, protocolo do BUG C, permanência do scroll vertical). Este documento não os afirma nem os nega.
