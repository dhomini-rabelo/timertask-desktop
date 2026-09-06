# Escopo A — header + timer + estatísticas (item 7, e itens 1/6 nesses arquivos)

Você é o implementador do escopo A da task `layout-melhorias-ui`. Frontend puro (React 19 + Tailwind v4, sem `tailwind.config`). Branch `feat/layout-task-card`, commit-base `bd5df02`, tree limpo. NÃO rode `git status`/`git diff`.

## Arquivos que você POSSUI (ninguém mais toca)
- `src/pages/index/page.tsx`
- `src/pages/index/components/IndexHeader/IndexHeader.tsx`
- `src/pages/index/components/IndexTimer.tsx`
- `src/pages/index/components/IndexScore.tsx`

## Arquivos que você NÃO pode tocar (são do escopo B)
`src/layout/styles/global.css`, tudo sob `src/pages/index/components/IndexTasks/**`, qualquer atom em `src/layout/components/**` (`Box`, `Button`, `Timer`, `Input`, `Select`, `ProgressBar` são **consumidos como estão**, via `className` — atualizado na r3: `Button/index.tsx` e `ProgressBar/index.tsx` passaram para o escopo B, que baixa `primary` para `bg-Green-500`, `secondary` para `bg-Blue-600` e o `dark:` do ProgressBar para `Black-400`; você **não** abre esses arquivos) e — atualizado na r2 — `src/pages/index/components/UpdateTimerDialog.tsx` e `src/pages/index/components/IndexNotificationRequest.tsx`, que passaram para o escopo B para o reparo de token do item 1. Os footprints continuam **disjuntos**: você nunca abre nenhum desses arquivos.

## Requisito visual (obrigatório abrir a imagem)
`Read` em `.claude/prompts/header.png` — é o requisito, não ilustração. E `.claude/tasks/2026-08-23_task-grupo-done/tests-07/screenshots/01-grupo-vazio-desabilitado.png` para confirmar "logo/nav/timer sem card, card só nas estatísticas".

Leitura da imagem: o timer 25:00 vira um círculo pequeno **à esquerda**, com os botões (Start + engrenagem) pequenos logo abaixo dele; as estatísticas sobem para **o lado direito do timer, na mesma fileira**; o card branco que hoje envolve logo+timer+stats **desaparece** e o `Box` passa a existir só em volta das estatísticas.

## Contrato

### `page.tsx` (bloco atual nas linhas 67-75)
- Remover o `<Box>` que envolve `IndexHeader` + `IndexTimer` + `IndexScore` (e o import de `Box` se ficar órfão).
- Preservar o comentário das linhas 59-66 e a regra que ele documenta: `IndexHeader` continua montado num único ponto, para todos os estados de permissão, só mudando a prop `showOnlyLogo` (um remount resetaria `useStoredWorkflows`).
- Estrutura nova, dentro do `flex w-full max-w-6xl flex-col gap-6`:
  ```
  <IndexHeader showOnlyLogo={shouldBlockContent} />
  {hasInitializedPermissionStatus && !shouldBlockContent && (
    <div className="flex w-full flex-col lg:flex-row items-stretch gap-6">
      <IndexTimer />
      <IndexScore />
    </div>
  )}
  ```
- O gate de notificação (linhas 76-83) não muda.
- Container externo: `p-4` → `p-3 sm:p-4`.

### `IndexHeader.tsx`
- Sem card por trás. Linha 37: `flex w-full items-center justify-between pb-4 pt-2` → `flex w-full flex-wrap items-center justify-between gap-3 pb-2 pt-2`. O branch `showOnlyLogo` (l.30) só perde o `pb-4`.

### `IndexTimer.tsx`
- Raiz (l.43): `w-full` → `w-full lg:w-[200px] shrink-0 flex flex-col items-center gap-3`.
- `<Timer>` (l.45): `mx-auto h-56 w-56 text-4xl` → `h-32 w-32 text-2xl`. Todo o resto das props fica.
- Container dos botões (l.60): `pt-4 flex flex-col gap-4 px-4` → `w-full flex flex-col gap-2`.
- **Todos** os grupos de botões (os 4 branches: overtime l.61-123, running l.124-131, finished l.132-150, default l.151-187) passam a ser `flex flex-wrap gap-2 w-full`, com botões de texto em **`flex-1 min-w-[84px] py-1.5 text-sm font-bold`** (hoje `w-full py-2 text-base font-medium`) e botões só de ícone (`Settings`, `RotateCcw`) em `px-2 py-1.5 flex-none shrink-0`. Em overtime são 6 botões: com `flex-wrap` eles quebram em 2 colunas dentro dos 200px, em vez de empilhar 6 linhas.
- **`text-sm font-bold` é obrigatório e medido, não estética (invariante de contraste da r3).** O escopo B baixa o `Button` `primary` para `bg-Green-500` (branco = **3,77:1**) e o `danger` fica `bg-Red-500` (**3,82:1**): os dois não são conformes (ficam abaixo do mínimo de 4,5:1 para texto normal): não-conformidade aceita e registrada, da mesma classe da isenção dos ícones de acento — não existe verde/vermelho mais escuro na palheta (Green-500 já é o mais escuro) e criar token novo é proibido; aumentar a fonte contradiz o item 7 (botões menores). Mantidos `font-bold` + `text-sm` porque com `font-medium` o contraste cai para 2,54:1 / 3,30:1 — aí sim seria violação grosseira. O limiar do auditor fica como está de propósito; mexer nele torna o gate inatingível sem token novo. Se você deixar `font-medium`/`font-semibold` ou `text-xs` em qualquer `Button` `primary`/`danger` (Start, Resume, Stop, Rest, +5 min, +10 min, Skip, Back to Work), o mínimo salta para 4,5:1, o auditor de contraste reprova e o **item 1 falha por causa do item 7**. `variant="secondary"` (`bg-Blue-600` = 5,75:1) é seguro em qualquer tamanho, mas mantenha `font-bold` nele também, por consistência.
- `UpdateTimerDialog` e toda a lógica de estado ficam **intactos** — nenhum handler, condição ou hook muda.

### `IndexScore.tsx`
- Raiz (l.113): `<div className="w-full">` → `<Box className="w-full flex-1 p-4 sm:p-6">`, importando `Box` de `../../../layout/components/atoms/Box`.
- Grid (l.114): `grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6` → `grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5`. **Só o `gap-y` muda.** O grid **não tem** `sm:grid-cols-3` hoje e **não pode ganhar**: 8 tiles em 3 colunas deixariam 2 órfãos numa terceira linha; 8 divide exato por 2 e por 4.
- **Manter as 8 estatísticas.** Conta corrigida: 1152 − 200 (timer) − 24 (gap) = 928px de card; − 48 de `p-6` = **880px** para 4 colunas = **220px/tile**, e o maior rótulo ("TASKS COMPLETED", 10px bold uppercase) mede ~105px.
- Rótulos permanecem **`text-Black-450 dark:text-Black-400`** — o par `dark:` é **obrigatório** e não pode ser removido: o escopo B troca o token `Black-450` para `#556070`, que sobre `Black-700` dá **2,30:1**. Sem o par, o dark quebra. Valores continuam `text-Black-700 dark:text-White`.
- Não introduza nenhum `text-Black-400`, `text-Black-200` ou `text-Black-100` sem o prefixo `dark:` (regra de contraste da task).
- **Não mude a cor dos 8 ícones de chip** (`text-Yellow-400`/`Blue-400`/`Green-400`/`Red-400` sobre `bg-*-100`): eles são a isenção fechada da política de contraste (`<svg>` de acento — ícone decorativo com rótulo em texto ao lado), e a pergunta J4 do gate visual é a contrapartida. Mexer neles é fora de escopo.

## Critérios de aceite (o teste de sistema mede isso)
1. O elemento do timer **não** tem ancestral com `border-radius: 24px`; o grid de stats **tem**. Acima do card de Tasks existe exatamente **um** `Box` (o das stats).
2. `timer.getBoundingClientRect()`: `width` ≤ 160px, `right` < `statsCard.left`, `|timer.top − statsCard.top|` ≤ 24px (mesma fileira, timer à esquerda).
3. Botão `Start`: `width` ≤ 240px e `height` ≤ 40px.
4. Em 1280px: 8 tiles em 4 colunas × 2 linhas. Em 768px: 4 colunas × 2 linhas (**zero tile órfão**). Em 390px: fileira empilhada (timer acima, stats abaixo) e stats em 2 colunas × 4 linhas.
5. Em 320/390/768/**1100**px: `document.documentElement.scrollWidth <= clientWidth + 1` (zero scroll horizontal) na região do header.
6. O gate de notificação (permissão negada/pendente) continua renderizando só o logo, centralizado, sem card.
7. Nenhum nó do header/timer/stats aparece no relatório do auditor de contraste, em light e dark, 1280 e 390. O auditor mede **todo** nó visível com texto direto, `<svg>` ou `::placeholder` (texto normal ≥ 4,5:1; texto grande ou `<svg>` ≥ 3:1) e tem **uma única** isenção: `<svg>` cuja cor é um dos 15 tokens de acento da palheta. Não existe mais predicado de "cor neutra por spread" (era falso — corrigido na r3). O que isso exige de você, na prática:
   - rótulos das stats em `text-Black-450 dark:text-Black-400` (o par é obrigatório);
   - nenhum `text-Black-400/200/100` sem `dark:`;
   - `Button` `primary`/`danger` sempre `font-bold` e ≥ 14px (critério acima).

## Antes de devolver
`npx tsc --noEmit` com exit 0, sem import/variável órfã (a remoção do `Box` em `page.tsx` e do `mx-auto` deixa restos fáceis de esquecer). Não rode o dev server nem crie testes. Sua resposta final: no máximo 8 linhas, listando arquivo → o que mudou.
