# Escopo B — cards e listagem de tasks (itens 1, 2, 3, 4, 5, 6)

Você é o implementador do escopo B da task `layout-melhorias-ui`. Frontend puro (React 19 + Tailwind v4, sem `tailwind.config`). Branch `feat/layout-task-card`, commit-base `bd5df02`, tree limpo. NÃO rode `git status`/`git diff`.

## Arquivos que você POSSUI (footprint ampliado na r2 — bloqueador 1 da review)
- `src/layout/styles/global.css` (só a linha do token `--color-Black-450`)
- `src/pages/index/components/IndexTasks/**` (todos)
- **`src/layout/components/atoms/Input/index.tsx`** — só a classe do placeholder (item 1)
- **`src/layout/components/atoms/Select/trigger.tsx`** — só as classes de cor do placeholder e do chevron (item 1)
- **`src/layout/components/atoms/Select/root.tsx`** — só a cor dos 2 botões de scroll (item 1)
- **`src/layout/components/atoms/Button/index.tsx`** — **novo na r3** (bloqueador 2 da review r2): só o objeto `variantStyles`, dois fundos (item 1)
- **`src/layout/components/atoms/ProgressBar/index.tsx`** — **novo na r3**: só o literal do `dark:` da l.16 (item 1)
- **`src/pages/index/components/UpdateTimerDialog.tsx`** — só adicionar `dark:text-Black-400` em 2 linhas (item 1)
- **`src/pages/index/components/IndexNotificationRequest.tsx`** — só a troca de token em 1 linha (item 1)
- Nada mais. Nesses 6 arquivos novos você mexe **exclusivamente em classes de cor**: nada de altura, raio, borda, API, props ou comportamento.

## Arquivos que você NÃO pode tocar (escopo A)
`src/pages/index/page.tsx`, `IndexHeader/**`, `IndexTimer.tsx`, `IndexScore.tsx`, e qualquer outro atom em `src/layout/components/**` além dos 5 listados acima (`Box`, `Timer`, `Dialog`, `Select/option.tsx`, `Select/display-value.tsx` ficam intocados).

## Requisitos visuais (obrigatório abrir as imagens com `Read`)
- `.claude/prompts/grupo-0.png` — itens 2 e 3 (retângulos vermelhos = o que sai / bordas erradas nos cantos)
- `.claude/prompts/tasks-completadas.png` — molde do item 2 no footer (seta do badge subindo para a linha do título; caixa azul dos tempos descendo para a linha de baixo)
- `.claude/prompts/grupo-2.png` — item 4 (o scroll externo que não deveria existir)
- `.claude/prompts/responsivo.png` — item 6 (linha de ações estourando; tempos empilhando letra-a-letra)

## Decisão vinculante do usuário: TUDO em 2 colunas, card de grupo incluído
Não existe `col-span` para ninguém. A meia coluna mede **546px fixos** (container `max-w-6xl` 1152 − `p-6` 48 = 1104; (1104 − gap 12)/2 = 546 — idêntico em 1280px e 1440px), e dentro do card de grupo a subtask fica com **~478px** de conteúdo. Como `sm:` (640px de *viewport*) está ativa num container de 478px, **viewport-breakpoint é o instrumento errado aqui**: as regras abaixo são incondicionais (o estado "estreito" é o único estado) e resolvem meia coluna e mobile de uma vez.

### § Meia coluna — regras incondicionais (aplicam-se sempre)
1. **O wrapper do `IndexDebugTimer` é `w-full min-w-0`, sem `sm:`** — o Debug ocupa sempre a linha inteira, sozinho. Conta do pior caso a 478px: pencil 36 + trash 36 + Notes 86 = 158 à esquerda, Alert Select 86 + Debug 230 = 316 à direita ⇒ 474px sem folga para o `gap-2`. Linha própria é determinístico; wrap sorteado não é.
2. **Todo título é `truncate` + `title={...}`, nunca `break-all`/`break-words`** (o `break-all` é o que produziu o empilhamento letra-a-letra de `responsivo.png`): título da subtask, título do grupo, título e badge do item completado (badge `shrink-0 max-w-[45%] truncate`), título do grupo completado. **Toda a cadeia de flex acima do texto precisa de `min-w-0`** — sem isso `truncate` não corta nada dentro de flex.
3. **Timer da subtask `w-16 h-16` → `w-14 h-14 shrink-0`** com `text-[11px]`.
4. **Linha do input de add do grupo**: `Input` com `flex-1 min-w-0`, `Button` com `shrink-0 px-4` (era `px-6`).
5. **Header do grupo**: bloco do título com `min-w-0 flex-1`, título com `truncate`.
6. **Proibido `@container`/container query** — a solução acima não tem variante que possa falhar silenciosamente.

**Faixa 1024–1184px:** acima de ~1184px o `max-w-6xl` satura e a meia coluna é 546px fixos; abaixo dela a coluna encolhe até ~470px (em 1024px). Nada a fazer — as regras acima são incondicionais —, mas o teste **mede em 1100px também**, então não introduza nenhuma variante `sm:`/`md:`/`lg:` na acomodação interna do card.

Aceite desta seção (medido em 1280px, 1440px **e 1100px**, com dois grupos lado a lado): (i) todo elemento dentro do card de Tasks com `scrollWidth <= clientWidth + 2`; (ii) nenhum elemento cortado (`scrollWidth > clientWidth + 2`) sem `text-overflow: ellipsis`; (iii) interseção de bounding-rects par a par entre os controles da linha de ações = 0; (iv) `debug.top >= notesButton.bottom` no mesmo card; (v) dois cards de grupo com `top` igual (±4px), `left` diferente e `width` entre 500 e 560px (440–500px em 1100).

## Regra de ouro que não pode quebrar
A classe `group` continua na **raiz** de cada card (`IndexTaskItem`, `IndexTaskGroup`, `IndexCompletedTaskItem`, `IndexCompletedTaskGroup`): ela alimenta os utilitários `group-hover:` e é o seletor usado pelos scripts de QA (`page.locator(".group", { hasText: ... })`).

---

## Item 1 — contraste

**Token (o único):** `src/layout/styles/global.css`, bloco `@theme` l.31: **`--color-Black-450: #79818e` → `#556070`**. `Black-450` hoje só é usado como cor de texto (verificado), então a troca é segura. Nenhum token novo.

### Regra mecânica (aplique sem julgar)
Toda ocorrência do literal `text-Black-400` (e dos `text-Black-100` de cor de ícone) que **não** esteja precedida de `dark:` vira `text-Black-450`, **e a mesma `className` tem de terminar carregando `dark:text-Black-400`** — adicione o par se não existir. Com prefixo, o prefixo é preservado nos dois: `placeholder:text-Black-400` → `placeholder:text-Black-450` + `dark:placeholder:text-Black-400`; `data-placeholder:text-Black-400` → `data-placeholder:text-Black-450` + `dark:data-placeholder:text-Black-400`.

**Por que o par é obrigatório (não é zelo, é correção):** o novo `#556070` sobre `Black-700` dá **2,30:1**. Trocar o token sem o par `dark:` conserta o light e **quebra o dark**.

**Conta exata (medida no commit-base — não é estimativa):** o comando certo é

```bash
grep -rnoP '[-\w:\[\]]*\btext-Black-(100|200|400)\b' src/ | grep -v 'dark:'
```

(o `grep -rn … | grep -v "dark:"` é **line-based** e descarta a linha inteira quando há qualquer `dark:` nela — foi assim que `IndexReportsTabs.tsx:28` passou batido nas rodadas anteriores). Ele devolve **24** ocorrências: 18 `text-Black-400`, 2 `placeholder:text-Black-400`, 1 `data-placeholder:text-Black-400`, 3 `text-Black-100`, 0 `text-Black-200`. Dessas 24: **1** desaparece com o bloco que o item 2 remove (`IndexTaskItem.tsx:240`); **5** já têm o par `dark:` na mesma `className` e só precisam da troca do literal (`IndexReportsTabs.tsx:28`, `Input/index.tsx:12`, `Select/trigger.tsx:21`, `Select/root.tsx:29,42`); as outras **18** precisam da troca **e** do par `dark:`.

### Lista exata (24 ocorrências)
- `IndexTasks.tsx:42` — empty state "No tasks yet. Add one above!"
- `IndexFooter/IndexCompletedTaskItem.tsx:46` — linha de tempos (o item 2 reescreve o bloco; cor final `text-Black-450 dark:text-Black-400`)
- `IndexFooter/IndexCompletedTaskGroup.tsx:34`
- `IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx:47` — "No tasks yet."
- `IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx:176` (drag handle `GripVertical`), `:198` (título riscado de completada). A `:240` **não** entra: o item 2 remove aquele bloco inteiro.
- `IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx:99` (drag handle), `:143` (chevron de collapse)
- `IndexActiveTasksList/IndexTaskNoteDialog.tsx:101` — `placeholder:text-Black-400` do `<textarea>`
- `IndexReportsDialog/IndexReportsTotals.tsx:43`, `IndexReportsEmptyState.tsx:8`, `IndexReportsDaySection.tsx:29,44,48,52`, `IndexReportTaskRow.tsx:19`
- `IndexReportsDialog/IndexReportsTabs.tsx:28` — **novo na r3**: a aba inativa é `text-Black-400 … dark:text-Black-400` na **mesma** `className`. Troque **só** o literal de light por `text-Black-450`; o par `dark:` já está lá. (É violação real de light — 2,54:1 — que o grep line-based escondia.)
- `src/pages/index/components/IndexNotificationRequest.tsx:49`
- **Atoms (novos no seu footprint):**
  - `src/layout/components/atoms/Input/index.tsx:12` — `placeholder:text-Black-400` → `placeholder:text-Black-450` (o `dark:placeholder:text-Black-400` **já existe** na mesma string). É o placeholder "Add a task..." das telas auditadas: 2,54:1 → 6,38:1.
  - `src/layout/components/atoms/Select/trigger.tsx` — l.15 `data-placeholder:text-Black-400` → `data-placeholder:text-Black-450` **e adicione `dark:data-placeholder:text-Black-400`** (essa `className` não tem par `dark:` hoje; sem ele o placeholder do trigger cai para 2,30:1 no dark); l.21 chevron `text-Black-100 dark:text-Black-400` → `text-Black-450 dark:text-Black-400` (1,74:1 → 6,38:1). É o chevron do `IndexAlertSelect`, visível na linha de ações de toda task iniciada.
  - `src/layout/components/atoms/Select/root.tsx:29,42` — `text-Black-100` → `text-Black-450` nos 2 botões de scroll do portal. **Decisão fechada: sim, corrige** (mesmo bug de token, custo 2 palavras), mesmo que o auditor não meça o portal fechado.
- **Reparo de `text-Black-450` pré-existente sem par `dark:`:** `src/pages/index/components/UpdateTimerDialog.tsx:61,80` → adicionar `dark:text-Black-400`. São os únicos dois do repo sem par: o token tem **16** usos no total (não 17) e os outros **14** já têm o par.

### Correções de fundo e de acento (bloqueador 2 da review r2 — reprovavam e **não** foram allowlistadas)
O usuário disse "os contrastes das cores brancas não estão legais". `text-White` sobre `bg-Green-400` = **2,54:1** (botão `Start` do timer, `Add` do grupo) é exatamente isso, então é **corrigido**, não justificado. Existe token conforme na palheta para os 3 casos, então nenhum token novo é criado e nenhum *valor* de token muda:

- **`src/layout/components/atoms/Button/index.tsx`** — só o objeto `variantStyles`:
  - `primary`: `bg-Green-400 hover:bg-Green-300 …` → **`bg-Green-500 hover:bg-Green-400 text-White dark:bg-Green-500 dark:hover:bg-Green-400`** (2,54 → **3,77:1**).
  - `secondary`: `bg-Blue-400 hover:bg-Blue-300 …` → **`bg-Blue-600 hover:bg-Blue-500 text-White dark:bg-Blue-600 dark:hover:bg-Blue-500`** (3,30 → **5,75:1**; os botões `Notes` e `Reset` são 12px bold, exigem 4,5).
  - `danger` **não muda** (`bg-Red-500` = 3,82:1).
  - **Mantenha as declarações `dark:bg-*`** mesmo iguais às de light: `IndexDebugTimer.tsx:80,106` sobrescreve o fundo com `bg-White` (sem variante) e é só o `dark:bg-Blue-600` do atom — que o `twMerge` **não** remove, por ser outra variante — que impede branco-sobre-branco no dark. Não simplifique.
  - Nada além de `variantStyles`: `px-16 py-4 rounded-xl font-bold text-sm`, props e API ficam idênticos. **O `font-bold` do atom é load-bearing:** `bg-Green-500`/`bg-Red-500` só passam o piso de 3:1 (texto grande), então nenhum `Button` primary/danger pode ficar abaixo de 14px bold — no seu escopo, os botões `Add` (`IndexTaskGroup.tsx:175` e `IndexAddInput.tsx:49`) já herdam 14px bold e você não os encolhe.
- **`src/layout/components/atoms/ProgressBar/index.tsx:16`** — `text-xs text-Black-500 dark:text-Black-300` → **`text-xs text-Black-500 dark:text-Black-400`**. Só o literal do `dark:`: em dark, `Black-300` sobre `Black-700` dá **3,04:1** em 12px não-bold (mínimo 4,5) — violação real do "Progress"/"N%" no card de grupo (`IndexTaskGroup.tsx:161`) e no footer (`IndexFooter.tsx:97`), nas telas `04` e `06` em dark. `Black-400` dá **5,78:1**. Não toque na barra (`bg-Black-100/50 dark:bg-Black-600`, preenchimento `bg-Green-400`): não tem texto e está fora do gate.
- **`IndexActiveTasksList/IndexTaskItem/IndexDebugTimer.tsx:80,99,106`** — `text-Blue-500` → **`text-Blue-600`** nos três nós (rótulo "Debug", relógio `font-mono`, Check do reset): 4,50:1 (limítrofe) → **5,75:1**. Os `dark:text-white` ficam; `border-Blue-400` e `bg-Blue-300/10` não mudam.
- **`IndexFooter/IndexCompletedTaskItem.tsx:39,93` e `IndexFooter/IndexCompletedTaskGroup.tsx:27`** — disco de "completo": `border-Green-400 bg-Green-400` → **`border-Green-500 bg-Green-500`**. O `<Check className="text-White">` de dentro **não** é cor de acento, logo nunca foi isento pelo auditor: sobe de 2,54 para **3,77:1**.

### Mais duas mudanças do item 1
- **Superfície cinza do corpo do grupo:** `bg-Black-100/50` → `bg-Black-100/40` no `IndexTaskGroup.tsx` (ver item 3): rgb(229,232,237); `Black-450` sobre ela sobe de 4,91:1 para 5,18:1.
- **`opacity-95` sai** de `IndexCompletedTaskItem.tsx:35`. Motivos: (i) opacidade de ancestral não é modelável por composição de background e introduz erro no auditor de contraste; (ii) o item 3 manda "uma superfície, uma borda, um raio" e um card 5% translúcido não é uma superfície.

### O que você NÃO muda (isenção fechada — não improvise)
**Não mude nenhum *valor* de token de acento em `global.css` e não crie token novo.** Fora dos 3 pontos medidos da seção acima (`Button`, disco de completo, `text-Blue-500` do Debug), **a cor de acento não se toca**: os ícones Play/Square/Check/Pencil/Trash2/Bell/Chevron dos cards ficam **exatamente** como estão, e os `bg-*-100`/`text-*-400` dos chips do `IndexScore` também (esses são do escopo A, você nem abre). Justificativa fechada do plano: são `<svg>` de acento, a única isenção do auditor; não existe amarelo conforme na palheta (`Yellow-500` = 2,15:1) e corrigir só o verde deixaria a fileira inconsistente. Nenhuma informação depende só da cor (todos têm `title=` ou rótulo ao lado), e a pergunta J4 do gate visual é a contrapartida.
**Não toque em cor de borda/ring** (`border-Black-100`, `border-Black-300/15`, `ring-black/5`) por motivo de contraste — os itens 3 e 5 estão redesenhando essas bordas e o contraste de borda está fora do gate por decisão registrada no plano.

### Aceite do item 1
O auditor de contraste do plano roda em 4 telas × light/dark × 1280/390 = **16 execuções**, **sem lançar**, e precisa voltar **`[]`** em todas. Ele mede **todo** nó de fato visível (`checkVisibility`) com texto direto, `<svg>` ou `::placeholder`, no estado de repouso, compondo `rgba`/`/40` sobre o ancestral opaco acumulado: texto normal ≥ 4,5:1, texto grande (≥18px, ou ≥14px bold) e `<svg>` ≥ 3:1, texto de cor de acento ≥ 4,5:1 sempre, e nenhum `#9CA3AF`/`#BEC5D1`/`#89909E` como cor de texto em light. **Não existe mais o predicado de "cor neutra por spread ≤ 16"** — ele era falso (a rampa de cinza tem spread 18–27) e reprovava tudo; a única classificação de cor do auditor agora é a lista dos 15 rgb de acento, e a **única isenção** é `<svg>` de cor de acento. Depois do gate objetivo há o gate de julgamento visual (perguntas J3 e J4 do plano).

**Auto-checagem antes de devolver (comando à prova de linha):**
```bash
grep -rnoP '[-\w:\[\]]*\btext-Black-(100|200|400)\b' src/ | grep -v 'dark:'   # tem de sair VAZIO
grep -rnoP '[-\w:\[\]]*\btext-Black-450\b' src/                                # toda linha tem de ter o par dark: na mesma className
grep -rn 'bg-Green-400\|bg-Blue-400' src/layout/components/atoms/Button/index.tsx  # VAZIO
grep -rn 'text-Blue-500' src/pages/index/components/IndexTasks/                     # VAZIO
grep -rn 'bg-Green-400' src/pages/index/components/IndexTasks/IndexFooter/          # VAZIO
grep -rn 'dark:text-Black-300' src/layout/components/atoms/ProgressBar/index.tsx    # VAZIO
```
`border-Black-100`/`bg-Black-100` não casam o primeiro padrão e continuam como estão.

## Item 2 — Start/End/Duration e badge de grupo

`IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx`
- **Remover** as linhas 206-210 (o `<span>` do badge `{groupTitle}` ao lado do título).
- **Remover** o bloco das linhas 238-252 (`{!isEditing && hasBeenStarted && (...)}` com Start/End/Duration).
- Limpar o que ficar órfão: `groupTitle`/`useContext(GroupTitleContext)` (l.65), `taskTimeRange`, `totalTimeInSeconds`, `formatClockValue`, `getTimeRangeFromEvents` e o import de `useContext`. **Atenção ao que NÃO sai:** `calculateTotalTimeInSeconds` continua em uso na l.53 (`useCountUpTimer({ initialSeconds })`) e `formatTime` continua em uso em `playAlertSound`.
- **`GroupTitleContext` morre inteiro:** o `useContext` da l.65 era o **único** consumidor. Remova também o `<GroupTitleContext.Provider>` de `IndexGroupTasksList.tsx` (l.51 e 73) + o import da l.18, e **apague o arquivo** `IndexActiveTasksList/IndexTaskGroup/GroupTitleContext.ts`. O `tsc` **não** pega esse caso (um Provider usado no JSX não é "unused local"), então é obrigação sua.

`IndexFooter/IndexCompletedTaskItem.tsx` — reestruturar conforme `tasks-completadas.png`:
- Linha 1: **título + badge do grupo juntos** (`flex items-center gap-2 min-w-0`), título `truncate min-w-0` + `title={task.title}`, badge `shrink-0 max-w-[45%] truncate` + `title={groupTitle}`.
- Linha 2 (abaixo do título): **Start / End / Duration** (ou "No time tracked") em `flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-Black-450 dark:text-Black-400`, cada `<span className="whitespace-nowrap">` — é o `whitespace-nowrap` que impede o empilhamento vertical de letras de `responsivo.png`.
- Remover o `break-all` do título (l.43) — regra 2 da § Meia coluna manda `truncate`.
- O badge continua **condicional a `groupTitle`**: task solta completada aparece **sem** badge. Isso é requisito, não detalhe — o teste tira screenshot exatamente desse caso.

**Hook de DOM novo (obrigatório, é o que o teste usa):** em `IndexActiveTasksList.tsx`, cada um dos três containers de seção recebe **`data-tasks-section="active"`**, `"paused"` e `"pending"` respectivamente (atributo puro, zero lógica). O footer **não** recebe o atributo. Motivo: o aceite antigo usava `[role="region"], .group`, que o item 4 apaga (o `role="region"` sai) e que pegava indevidamente os `.group` do footer — onde "Start …" é **legítimo**.

Aceite:
- Nenhum descendente de `[data-tasks-section]` tem `textContent` casando `/^\s*Start \d/`, `/^\s*End \d/` ou `/^\s*Duration \d/`; e `document.querySelectorAll('[data-tasks-section]').length >= 1` (um seletor vazio passaria trivialmente).
- Nenhuma subtask dentro de `[data-tasks-section]` exibe o nome de um grupo.
- No footer: o badge tem o mesmo `top` do título (±2px) e a linha de tempos fica abaixo do `bottom` do título; a task solta completada não tem badge.

## Item 3 — bordas do card: uma superfície, uma borda, um raio
Hoje wrapper e header são dois cards empilhados sem offset (`IndexTaskGroup.tsx:90-91`, `IndexTaskItem.tsx:159-165`): raios de 12px coincidentes ⇒ halo/costura nos cantos, e a subtask fica com wrapper cinza dentro do corpo cinza do grupo (contraste ~1:1 — o canto marcado em vermelho).

`IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx`
- Raiz (l.90): `group rounded-xl border border-Black-100 bg-White shadow-sm hover:shadow-md transition-all overflow-hidden dark:bg-Black-700 dark:border-Black-600`. O `overflow-hidden` é obrigatório (é ele que recorta o corpo de cantos retos).
- Header (l.91): perde `rounded-xl`, `bg-white`, `border*`, `shadow*` → fica `flex items-center justify-between p-4`.
- Corpo: unificar os blocos das linhas 156-163 e 165-182 em **um** `<div className="bg-Black-100/40 border-t border-Black-100 px-4 py-3 flex flex-col gap-3 dark:bg-Black-800/40 dark:border-Black-600">` com "N of M completed" + `ProgressBar` + (se não colapsado) input de add + `IndexGroupTasksList`. O cinza passa a ser o *interior* do card, nunca uma moldura em volta.
- Meia coluna (regras 4 e 5): bloco do título do header com `min-w-0 flex-1` e título `truncate` + `title={group.title}` (sai o `break-all` da l.104); linha do input de add com `Input` em `flex-1 min-w-0` e `Button` em `shrink-0 px-4`.

`IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx`
- Raiz (l.159): `group rounded-xl border bg-White shadow-sm hover:shadow-md transition-all overflow-hidden dark:bg-Black-700 dark:border-Black-600`, com o estado na borda do card: `isTimerActive ? "border-Green-400" : "border-Black-100 hover:border-Green-400/50"`.
- Header (l.160-166): perde `rounded-xl`/`bg-white`/`border`/`shadow`; realce de ativo vira só `bg-Green-400/5 dark:bg-Green-400/10` no header.
- Linha de ações (l.254-294): perde `rounded-xl`, ganha `border-t border-Black-100/60 dark:border-Black-600` e fica branca (era cinza herdado do wrapper).

- Remover também o `opacity-95` de `IndexFooter/IndexCompletedTaskItem.tsx:35` (item 1): um card 5% translúcido não é "uma superfície".

Aceite: no card raiz `overflow: hidden` e `border-radius: 12px`; no header `border-radius: 0px` e `border-width: 0px`. Terceiro critério **reescrito** (o antigo era ambíguo): *nenhum descendente do card com o **mesmo fundo efetivo do pai** tem borda visível nos **4 lados**.* Divisores de **um** lado (o `border-t` do corpo do grupo e o `border-t` da linha de ações) são **intencionais e liberados** — não os remova.

## Item 4 — só o scroll interno do grupo
- `IndexActiveTasksList/IndexActiveTasksList.tsx:77-82`: remover `max-h-[520px] overflow-y-auto pr-1` **e** o `tabIndex={0}`/`role="region"`/`aria-label="Active tasks"` que só existiam por causa do scroll. O container vira o grid do item 5.
- `IndexFooter/IndexFooter.tsx`: remover `max-h-[calc(100vh-400px)] overflow-y-auto` do container das completadas.
- `IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx:61-66`: **único scroll que sobra**, com mais folga — `max-h-[420px]` → `max-h-[560px]`, `pr-1` → `pr-2`, adicionar `py-1`. Mantém `tabIndex`, `role="region"` e `aria-label`.

Aceite: com **10** subtasks (era 8 — a r1 mostrou que 8 ficava perto demais da folga e dependia de uma subtask estar ativa), existe **exatamente um** elemento na página com `scrollHeight > clientHeight + 2` e `overflow-y` auto/scroll, e o `aria-label` dele é `"<título do grupo> subtasks"`. Conta: card de subtask não iniciada ≈ 110px (header `p-3` ≈ 44 + linha de ações com o `Select` `h-[48px]` ≈ 64) + `gap-3` ⇒ 10 cards ≈ 1210px contra `max-h-[560px]`.

## Item 5 — listagem em 2 colunas (tudo, grupo incluído)
`IndexActiveTasksList.tsx`
- Os três containers de seção (Active l.77-89, Paused l.98-104, Pending l.112-118) usam o mesmo container: `<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start" data-tasks-section="active">` (e `"paused"`/`"pending"`). Paused/Pending hoje não têm div própria (o `SortableContext` não renderiza DOM) — passam a ter. O `data-tasks-section` é o hook do item 2 e vive **nesta** div.
- **Sem `col-span` para ninguém**: grupo e task simples ocupam uma célula cada. `renderSectionItems` não muda.
- **Trocar `verticalListSortingStrategy` por `rectSortingStrategy`** nas três `SortableContext` deste arquivo (import de `@dnd-kit/sortable`): em grid a estratégia vertical calcula deslocamento errado no drag. `IndexGroupTasksList.tsx` **continua** com `verticalListSortingStrategy` (a lista de subtasks segue em coluna única dentro do card).

`IndexFooter/IndexFooter.tsx` — container das completadas também vira `grid grid-cols-1 lg:grid-cols-2 gap-3 items-start`, igualmente **sem** `col-span` para `IndexCompletedTaskGroup`.

Aceite: em **1280px, 1440px e 1100px** — o cenário de teste coloca **dois grupos** na seção `active`, **um grupo + uma task solta** na `paused` e **duas tasks simples** na `pending`, então cada seção prova as 2 colunas:
- os dois primeiros cards de cada seção têm `top` igual (±4px), `left` diferente e `width` entre 500 e 560px (440–500px em 1100); nenhum card com `width` > 600px;
- o grid das completadas no footer também fica em 2 colunas (grupo completado + task solta completada lado a lado);
- em 390px todos os cards têm o mesmo `left` e largura cheia;
- o drag-and-drop continua reordenando dentro da mesma seção;
- somam-se os 5 critérios da § Meia coluna.

**Consequência aceita (não é bug, não tente consertar):** com `items-start`, um card de grupo alto ao lado de uma task simples deixa um buraco vertical na célula vizinha. É consequência direta da decisão do usuário (tudo em 2 colunas, sem `col-span`) e está registrada no plano. **Não** use `items-stretch`, `columns`, masonry ou `col-span` para "arrumar" isso.

## Item 6 — responsividade mobile (mesmas regras da § Meia coluna)
1. `IndexTaskItem.tsx:254-294`: container → `flex flex-wrap items-center justify-between gap-2`; bloco da direita (l.273) → `flex flex-wrap items-center justify-end gap-2 min-w-0 grow`; wrapper do `IndexDebugTimer` (l.284) → **`w-full min-w-0`** (regra 1: linha própria sempre, sem `sm:`).
2. `IndexTaskItem.tsx:160-193`: header `p-4` → `p-3 sm:p-4`; bloco do título → `flex items-center gap-3 flex-1 min-w-0`; `<span>` do título com `min-w-0 truncate` + `title={task.title}` (sai o `break-all`); `<Timer>` (l.184-186) `w-16 h-16` → `w-14 h-14 shrink-0` com `text-[11px]` (regra 3).
3. `IndexTaskItem/IndexDebugTimer.tsx:76`: `px-3 py-2` → `px-2 py-1.5 sm:px-3 sm:py-2`, e adicionar `w-full min-w-0`.
4. `IndexTasks.tsx`: `Box` `p-6` → `p-4 sm:p-6`; cabeçalho `flex items-start justify-between gap-4` → `flex flex-wrap items-start justify-between gap-4`.
5. Tempos do footer: já coberto no item 2.

Aceite: em 320px, 390px, 768px **e 1100px**, `document.documentElement.scrollWidth <= clientWidth + 1` e nenhum elemento dentro do card de Tasks com `scrollWidth > clientWidth + 2`; nenhum span de tempo do footer com altura > 2×`lineHeight`.

---

## Fora de escopo
- Stores, hooks, tipos, cálculo de score, persistência do timer, tokens **novos**, `tailwind.config`, testes automatizados, remoção de métricas.
- Reescrever o dark mode. Você só (a) mantém os pares `dark:` das classes tocadas e (b) **adiciona** o par `dark:text-Black-400` onde o item 1 obriga.
- **Valores dos tokens de acento** em `global.css`, **criar token novo**, e **cor de borda/ring** — decisão fechada do item 1. A cor dos **ícones** de acento também não muda; as únicas trocas de acento permitidas são as 3 listadas em "Correções de fundo e de acento" (`Button`, disco de completo, `text-Blue-500` do Debug).
- Nos 7 arquivos novos do footprint (`Input`, `Select/trigger`, `Select/root`, **`Button`**, **`ProgressBar`**, `UpdateTimerDialog`, `IndexNotificationRequest`): qualquer coisa que não seja classe de cor. No `Button`, especificamente: só o objeto `variantStyles` — a string base (`px-16 py-4 rounded-xl font-bold text-sm …`), as props e o `twMerge` ficam idênticos.
- `IndexWorkflowDialog`, `Dialog/**`, `Select/option.tsx`, `Select/display-value.tsx`.

## Antes de devolver
- `npx tsc --noEmit` com exit 0. O `tsconfig.json:19` tem `noUnusedLocals: true`, então o tsc **pega** import/variável órfã dos itens 2 e 4 (`formatClockValue`, `getTimeRangeFromEvents`, `useContext`).
- O que o tsc **não** pega e é obrigação sua: o `GroupTitleContext.Provider` sem consumidor. Provider removido **e** `GroupTitleContext.ts` apagado.
- `grep -rn "text-Black-400\|text-Black-200\|text-Black-100" src/ | grep -v "dark:"` — nenhuma linha restante pode ser **cor de texto/ícone** (`border-Black-100`/`bg-Black-100` continuam e não contam).
- `grep -rn "break-all" src/pages/index/components/IndexTasks` — vazio nos títulos que a § Meia coluna cobre.
- Não rode o dev server nem crie testes. Resposta final: no máximo 10 linhas, arquivo → o que mudou.
