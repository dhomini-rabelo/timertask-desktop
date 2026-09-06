CHANGES_REQUIRED

# Review r1 — layout-melhorias-ui

Diff revisado: `e49f580..a986406` (o `4b6e0f6` do prompt nao existe neste repo; `e49f580` e o commit de plan e produz exatamente os 30 arquivos / 238+/236- descritos). Type-checker nao rodado (exit=0 informado). Navegador nao aberto.

## Veredito

`CHANGES_REQUIRED` por **1 item bloqueante** (regressao real de dark mode introduzida por este diff). Os 7 itens de escopo estao, no resto, implementados. Ha 4 ressalvas.

---

## 1. BLOQUEANTE — o card da task ativa perde a borda verde no dark mode

`src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx:152-158`

```
className={`group rounded-xl border ... dark:bg-Black-700 dark:border-Black-600 ${
  isTimerActive ? "border-Green-400" : "border-Black-100 hover:border-Green-400/50"
}`}
```

O que esta errado: `dark:border-Black-600` foi movido para a parte ESTATICA da raiz. Antes do diff ele vivia **dentro do branch inativo** (`"border-Black-100/30 hover:border-Green-400/50 dark:border-Black-600"`), portanto nao competia com o estado ativo.

Por que quebra: o dark aqui e `@custom-variant dark (&:where(.dark, .dark *))` (`global.css:4`). `:where()` tem especificidade ZERO, logo `dark:border-Black-600` e `border-Green-400` empatam em (0,1,0) e quem vence e a ordem de emissao — e o Tailwind sempre emite as utilities com variante DEPOIS das utilities base (e por isso que `class="text-black dark:text-white"` funciona em qualquer ordem no atributo). Resultado: **dark + timer rodando -> a borda renderiza `Black-600`, nao `Green-400`**. Nao e teorico: e o mesmo mecanismo que faz o `border-Black-100` do branch inativo virar `Black-600` no dark — comportamento em que o proprio autor se apoiou.

Nao e invisivel de todo (o div interno mantem `dark:bg-Green-400/10`, um tinte verde fraco), mas a afordancia mais forte do estado ativo — a borda — desaparece no dark. `hover:border-Green-400/50` NAO e afetado (pseudo-classe -> (0,2,0), ganha do dark).

Correto seria: `isTimerActive ? "border-Green-400 dark:border-Green-400" : ...`, ou devolver `dark:border-Black-600` para dentro do branch inativo. Uma linha, sem efeito colateral em nenhum outro item do escopo.

## 2. Deveria ser corrigido — item 6 incompleto: titulo com `break-all` sobrevivendo

`src/pages/index/components/IndexTasks/IndexReportsDialog/IndexReportTaskRow.tsx:16`

`<span className="text-sm font-medium text-Black-450 dark:text-Black-400 break-all">{task.title}</span>` — arquivo TOCADO por este diff (linha 19 mudou), titulo sem `truncate`+`title`, com o `break-all` que a decisao 6 proibiu explicitamente ("NUNCA `break-all` — foi a causa do empilhamento letra-a-letra"). Severidade baixa porque a linha vive num dialog de 640px full-width, onde `break-all` quebra no fim da linha em vez de empilhar letra por letra — mas a regra vinculante diz "todo titulo". Correto: `truncate min-w-0` + `title={task.title}`, e o mesmo tratamento nos dois badges de grupo (`:21`, `:26`).

---

## Itens de escopo — conferidos

| # | Item | Status |
|---|---|---|
| 1 | `Black-450` = `#556070` (`global.css:31`); Button primary `bg-Green-500` (3,77), secondary `bg-Blue-600` (5,75); `ProgressBar` `dark:text-Black-300` -> `dark:text-Black-400`; Debug `text-Blue-500` -> `text-Blue-600` (3 ocorrencias) | OK |
| 1b | **Par `dark:` em TODA troca** — varri `text-Black-400`/`text-Black-450` no `src/` inteiro: nenhuma ocorrencia de `text-Black-450` sem par. `IndexReportsTabs.tsx:28` (o caso "facil de perder") tem `text-Black-450 ... dark:text-Black-400` na mesma linha: OK. Os 3 unicos `Black-450` sem `dark:text-Black-400` sao variantes `placeholder:`/`data-placeholder:` que carregam o par na propria variante (`Input:12`, `Select/trigger.tsx:15`, `IndexTaskNoteDialog:101`): OK | OK |
| 1c | **5o botao do IndexTimer** — confirmado: os 9 botoes com texto do `IndexTimer.tsx` (l.65,73,81,88,98,108,125,135,152) estao TODOS `text-sm font-bold`. O `text-sm font-medium` da antiga l.136 ("Back to Work") virou `font-bold` na l.125. Os 3 restantes sao icon-only (Settings/reset) e herdam `font-bold text-sm` do base do `Button`. O acoplamento entre escopos foi honrado | OK |
| 2 | Start/End/Duration removido de `IndexTaskItem` (bloco antigo apagado; `getTimeRangeFromEvents`/`formatClockValue` removidos dos imports, nenhum import morto sobrou — `formatTime` e `calculateTotalTimeInSeconds` seguem em uso em `:99` e `:51`). `grep` por `formatClockValue|getTimeRangeFromEvents|Start ` em `IndexActiveTasksList/**`: zero hits. Footer: nome do grupo AO LADO do nome (`IndexCompletedTaskItem.tsx:44-57`, badge `shrink-0 max-w-[45%] truncate`) e os tempos ABAIXO (`:59-73`) | OK |
| 3 | Uma superficie/borda/raio + `overflow-hidden` na raiz: `IndexTaskGroup.tsx:90` e `IndexTaskItem.tsx:154`. Os dois `rounded-xl` empilhados sumiram (o filho perdeu borda/raio/sombra e virou `p-4` puro). Divisores de 1 lado: `IndexTaskGroup:161` (`border-t`) e `IndexTaskItem:231` (`border-t`) — legitimos | OK |
| 4 | Unico scroll interno da pagina = `IndexGroupTasksList.tsx:64` (`max-h-[560px] overflow-y-auto pr-2 py-1`, `aria-label={`${group.title} subtasks`}`). O `max-h-[520px]` da lista ativa e o `max-h-[calc(100vh-400px)]` do footer sairam. Os unicos `overflow-*` restantes no `src/` sao os dois dialogs (`IndexTaskNoteDialog`, `IndexReportsDialog`), fora do escopo do item | OK |
| 5 | `lg:grid-cols-2 gap-3 items-start` nas 3 secoes (`IndexActiveTasksList.tsx:82,101,120`) e no footer (`IndexFooter.tsx:81`); card de grupo dentro do grid; `grep -rn col-span src/` = zero; `rectSortingStrategy` nas 3 `SortableContext` | OK |
| 6 | Regras incondicionais: Debug em `w-full min-w-0` (`IndexTaskItem:261`, forca linha propria no `flex-wrap` do pai `:250`); `truncate`+`title` em `IndexTaskGroup:103-108`, `IndexTaskItem:193-202`, `IndexCompletedTaskGroup:31-35`, `IndexCompletedTaskItem:44-57`; `min-w-0` na cadeia flex; timer da subtask `w-14 h-14` (56px) `shrink-0`; input `flex-1 min-w-0` + Button `shrink-0` (`IndexTaskGroup:180-192`). Excecao: ver ressalva 2 acima | OK (1 pendencia) |
| 7 | `Box` externo removido de `page.tsx` (import inclusive); `IndexScore` e o unico `Box` do header (`IndexScore.tsx:114`, `flex-1 p-4 sm:p-6`); `lg:flex-row items-stretch` em `page.tsx:68`; timer em `lg:w-[200px] shrink-0` com circulo `h-32 w-32 text-2xl`; botoes `py-1.5 text-sm` | OK |
| morto | `GroupTitleContext.ts` apagado; `grep -rn GroupTitleContext src/` = **zero** (nem import, nem Provider, nem `useContext`) | OK |

---

## Ressalvas (registrar, nao bloqueiam)

1. **Ressalva (a) do implementador B — o raciocinio esta errado, a conclusao se sustenta.** `Button/index.tsx:19` TEM um `hover:bg-Green-400` de light mode (nao apenas o `dark:hover:bg-Green-400` que ele alegou): `bg-Green-500 hover:bg-Green-400 text-White`. Com `text-White` sobre `Green-400` (#10B981) o hover cai para **2,56:1**. Nao e regressao: o hover anterior era `Green-300` (#32B768) = **2,61:1**, ou seja praticamente identico, e a decisao 1 so fixou o estado de repouso. Mas e uma falha WCAG 1.4.3 real e viva (o criterio vale para todos os estados). `secondary` melhorou de verdade (hover `Blue-300` 2,61 -> `Blue-500` 4,55). Se quiser fechar: `hover:bg-Green-600` (token nao existe) ou manter `Green-500` no hover e variar so o brilho/sombra.
2. **Ressalva (b) do implementador B — correta, mas pelo motivo errado.** Os `text-Blue-400 hover:text-Blue-500` de `IndexCompletedTaskGroup.tsx:46` e `IndexCompletedTaskItem.tsx:83` sao botoes **icon-only** (`RotateCcw`, `ChevronUp/Down`, `w-5 h-5`), nao texto: caem em 1.4.11 (3:1), e `Blue-400` sobre branco da **3,30:1** — passa; no dark, sobre `Black-700`, da 4,45:1. E o `hover:` AUMENTA o contraste (4,55), nao diminui. Logo inofensivo — mas a justificativa nao e "esta fora do escopo", e "e icone, o limite e 3:1".
3. `IndexCompletedTaskGroup.tsx:23` mantem `opacity-95`, que o irmao `IndexCompletedTaskItem.tsx:35` perdeu neste mesmo diff. Dois cards lado a lado no mesmo grid do footer com opacidade diferente. Contraste ainda passa (`Black-450` a 95% sobre branco ~5,7:1), e so inconsistencia visual.
4. `IndexCompletedTaskItem.tsx:104` mantem `break-all`, mas o conteudo e `{event.type} {hh:mm}` — strings curtas, sem token longo. Inofensivo; removivel por higiene junto com o item 2.

## Observacoes sem acao

- `border-Green-400 bg-Green-400` -> `Green-500` nos check-marks do footer (`IndexCompletedTaskGroup:29`, `IndexCompletedTaskItem:42,101`) nao estava nas decisoes, mas segue o espirito do item 1 (o `Check` branco ganha 3,77:1 em vez de 2,56:1). Mantenha.
- O botao de expandir de `IndexCompletedTaskItem.tsx:83` nao tem `title`/`aria-label` (o irmao de `IndexCompletedTaskGroup:45` tem `title="Reopen group"`). Pre-existente, linha nao tocada pelo diff.
- Meia coluna real: `max-w-6xl` (1152) - `p-4` (32) - `Box p-6` (48) - `gap-3` (12) / 2 = **~530px**, interior do card ~498px. O plano estimou 546/478. A diferenca nao muda nenhuma decisao (todas as regras do item 6 sao incondicionais).
- O `Debug` Button sobrevive ao `twMerge` em ambos os temas: o `bg-White` do className derruba o `bg-Blue-600` do variant, mas `dark:bg-Blue-600` (grupo diferente para o twMerge) sobrevive e pareia com `dark:text-white` — 5,75:1 no dark, 5,75:1 no light. Sem bug.
