# Plano — layout-melhorias-ui (7 melhorias de UI)

Branch `feat/layout-task-card` | commit-base `bd5df02` | frontend puro (React 19 + Tailwind v4, sem tailwind.config, tokens em `src/layout/styles/global.css`).

Escopos de implementação: **2 paralelos** (footprints disjuntos — ver § Footprints)
- `escopo-a-header-timer-stats` → item 7 (+ item 1 e 6 dentro desses arquivos)
- `escopo-b-tasks-cards-listagem` → itens 1 (token global + atoms `Input`/`Select`/**`Button`**/**`ProgressBar`** + reparo de par `dark:`), 2, 3, 4, 5, 6

## § Footprints (revisado na r2 — bloqueador 1)

O bloqueador 1 mostrou que dois nós que o item 1 **tem** de corrigir moram em `src/layout/components/**` (`Input` `placeholder:text-Black-400` = 2,58:1; chevron do `Select/trigger` `text-Black-100` = 1,74:1), e que dois arquivos com `text-Black-450`/`text-Black-400` órfãos (`UpdateTimerDialog.tsx`, `IndexNotificationRequest.tsx`) não pertenciam a escopo nenhum. Resolução: **esses 5 arquivos passam a ser do escopo B** (mudança de token/classe apenas, zero mudança estrutural).

- **Escopo A possui:** `src/pages/index/page.tsx`, `src/pages/index/components/IndexHeader/**`, `IndexTimer.tsx`, `IndexScore.tsx`.
- **Escopo B possui:** `src/layout/styles/global.css` (só a linha do token), `src/pages/index/components/IndexTasks/**`, `src/layout/components/atoms/Input/index.tsx`, `src/layout/components/atoms/Select/trigger.tsx`, `src/layout/components/atoms/Select/root.tsx`, **`src/layout/components/atoms/Button/index.tsx`** e **`src/layout/components/atoms/ProgressBar/index.tsx`** (os dois novos na r3 — bloqueador 2 da r2: `text-White` sobre `bg-Green-400`/`bg-Blue-400` e o `dark:text-Black-300` do ProgressBar reprovam e são **corrigidos**, não allowlistados), `src/pages/index/components/UpdateTimerDialog.tsx`, `src/pages/index/components/IndexNotificationRequest.tsx`.
- **Continuam disjuntos**: o escopo A consome `Box`/`Button`/`Timer` só via `className` e nunca abre `src/layout/components/**` nem os dois arquivos órfãos. Os escopos seguem **paralelos**.
- **Invariante compartilhado (não é arquivo comum, é contrato de classe):** o escopo B baixa o fundo do `Button` primary para `bg-Green-500` (branco = **3,77:1**) e do danger fica `bg-Red-500` (**3,82:1**); os dois só atingem o mínimo de **3:1**, que a WCAG concede a texto grande. Logo **todo `Button` primary/danger renderizado tem de manter `font-bold` (o default do atom) e `font-size ≥ 14px`** — proibido sobrescrever com `font-medium`/`font-semibold`/`text-xs`. Isso vincula o escopo A (os 4 branches de `IndexTimer.tsx`, hoje `text-base font-medium`, passam a `text-sm font-bold`) sem que ele abra o atom. `variant="secondary"` (`bg-Blue-600`, 5,75:1) passa em qualquer tamanho.

---

## § Resposta aos bloqueadores da review r1 (rastreabilidade)

| # | onde foi resolvido | como |
|---|---|---|
| 1 | § Footprints + § Política (A)(B)(C) + Item 1 | conjunto medido `M` por predicado (todo nó com texto direto, `<svg>` ou `::placeholder`, de fato visível, no estado de repouso) + **uma única** isenção fechada (`<svg>` de cor de acento, com tabela de justificativa nó a nó) + os atoms `Input`/`Select`/`Button`/`ProgressBar` passaram para o escopo B e são corrigidos de fato. **Divergência técnica declarada, agora restrita a ÍCONES:** não mudo os *valores* dos tokens de acento nem a cor dos ícones de ação — não existe amarelo conforme na palheta e criar token é fora de escopo; a exceção fica amarrada à pergunta J4 do gate visual. Texto e fundo de botão **não** divergem mais: foram corrigidos (r3). |
| 2 | § Política (D) | `effBg()` reescrito: empilha camadas até o primeiro ancestral **opaco** e compõe de fora para dentro a partir dele. Conferido: `Black-800/40` sobre `Black-700` = rgb(29,37,51) e `Black-400` sobre ele = 6,04:1 (antes o auditor retornava rgb(163,166,170) e inventava violações no dark). |
| 3 | § Política (D2) e (E) | um gate objetivo só (`auditContrast() === []`, a isenção embutida no auditor, proibido justificar violação no verdict) **+** gate de julgamento visual explícito com 7 perguntas (J1..J7) obrigatoriamente respondidas por escrito. |
| 4 | Item 5 (aceite) + § Cenário passos 14-15 | Play numa subtask de **cada** um dos dois grupos ⇒ os dois viram "active" na mesma seção (`executeTask` não para as outras tasks). Estado final é **asserido** antes dos screenshots. |
| 5 | § Cenário passos 12-13, 15 e screenshots 03d/06 | `QA-Task-Solta-B` recebe Play→Check (task solta completada, sem badge) e `QA-Pau-1`/`QA-Task-Solta-A` recebem Play→Stop (seção **Paused** passa a existir e tem screenshot próprio). |
| 6 | Item 2 (hook + aceite) e Item 5 | novo atributo `data-tasks-section="active|paused|pending"` nos containers da lista ativa; o aceite do item 2 passa a usar `[data-tasks-section] *` (escopado, imune ao item 4 que apaga o `role="region"`, e não pega os `.group` do footer, que legitimamente mostram "Start …"). Inclui asserção de que o seletor não é vazio. |

Ressalvas da r1: 1024–1184px → **resolvida** (viewport de 1100px no roteiro); 8 subtasks apertado → **resolvida** (10 + salvaguarda até estourar); aceite ambíguo do item 3 → **resolvida** (borda nos 4 lados); `noUnusedLocals` → **respondida** (pega os órfãos) e o `GroupTitleContext.Provider` órfão → **resolvido** (Provider e arquivo apagados); conta dos 880px/220px por tile → **corrigida** (premissa 3); tiles órfãos em 768px → **não existem e nunca existiram**: o grid do `IndexScore` já é `grid-cols-2 md:grid-cols-4` (ressalva (d) da r2 — a "correção" anterior era no-op e foi removida); buraco vertical do `items-start` → **registrado como consequência aceita** da decisão Q1 do usuário, e explicitamente fora do gate visual.

## Premissas assumidas

1. **Item 1 muda o light e PRESERVA o dark — e é isso que obriga o par `dark:`.** Ratios medidos (sRGB/WCAG, recalculados na r2 com composição alpha correta): `Black-400 #9CA3AF` sobre branco = **2,54:1**; `Black-450 #79818e` sobre branco = **3,93:1**; `Black-400` sobre a superfície cinza do grupo (`bg-Black-100/40` = rgb(229,232,237)) = **2,06:1**. Todos reprovam. No dark, `Black-400` sobre `Black-700` = **5,78:1** e passa.
   **Consequência crítica descoberta na r2:** o novo `Black-450 #556070` sobre `Black-700` dá **2,30:1** — ou seja, trocar `text-Black-400`→`text-Black-450` numa classe **sem** par `dark:` *cria* uma violação de dark. Logo a regra do item 1 é sempre dupla: `text-Black-450 dark:text-Black-400`. Toda classe convertida precisa terminar com o par; das 20 ocorrências de `text-Black-400` sem `dark:text-Black-400`, **nenhuma** tem o par hoje.
2. **O lever do item 1 é o token `Black-450`**, que hoje é usado *exclusivamente* como cor de texto (**16** usos, zero como background — contado por `grep -rno "text-Black-450" src/ | wc -l`; ressalva (c) da r2). Ele passa a valer **`#556070`**: 6,38:1 sobre branco, 5,18:1 sobre `bg-Black-100/40` e 4,91:1 sobre `bg-Black-100/50`. Nenhum token novo é criado (criar token é fora de escopo); `Black-400` continua existindo e é o valor usado atrás de `dark:`.
3. **Item 7 mantém as 8 estatísticas.** Conta corrigida (ressalva da r1): container `max-w-6xl` = 1152px, menos a coluna do timer (200px) e o gap (24px) ⇒ card de stats = **928px**; menos `p-6` nos dois lados (48px) = **880px** para 4 colunas ⇒ **220px/tile**, que acomoda o maior rótulo ("TASKS COMPLETED", 10px bold uppercase ≈ 105px) com folga. Conclusão inalterada: nenhuma métrica é removida (o usuário só autorizou, não pediu).
   **Tiles órfãos:** o grid **já é** `grid-cols-2 md:grid-cols-4` e continua assim — nada a corrigir (ressalva (d) da r2). 8 tiles dividem exato por 2 e por 4 ⇒ nunca sobra tile órfão em nenhum breakpoint.
4. **Item 7: o `Box` externo de `page.tsx` desaparece**, não é apenas "aliviado". Em `header.png` o card só sobra nas estatísticas; logo, nav e timer ficam direto sobre o fundo da página, como em `01-grupo-vazio-desabilitado.png`.
5. **Item 4 vale também para o scroll do footer.** O usuário disse "o scroll era só interno dentro do grupo" — então além do `max-h-[520px]` da seção Active, cai o `max-h-[calc(100vh-400px)] overflow-y-auto` de `IndexFooter.tsx`. Depois da mudança **o único scroll interno do app é o das subtasks do grupo**; o resto rola com a página.
6. **Item 5 vale para a lista ativa E para a lista de completadas do footer** (as duas são listas dentro do card largo de Tasks). Grupos abertos e completados também ficam em meia coluna (Q1 = (b)).
7. **A classe `group` continua na raiz de cada card** (`IndexTaskItem`, `IndexTaskGroup`, `IndexCompletedTaskItem`, `IndexCompletedTaskGroup`). Ela é usada pelos utilitários `group-hover:` e é o seletor que os scripts de QA usam (`page.locator(".group", { hasText: ... })`). Remover/renomear quebra o teste de sistema.
8. **Dark mode não é reescrito**, só acompanhado: toda classe alterada mantém seu par `dark:` equivalente.
9. **Nenhuma mudança de estado/lógica.** Nada de novo hook, store, persistência ou cálculo. `useCountdownTimerState` continua não persistido (irrelevante aqui, mas afeta o roteiro de teste: após `reload()` o timer volta a 25:00).
10. **Breakpoints são os defaults do Tailwind v4**: `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280. O plano usa apenas `sm`, `md` e `lg`.

### Decisões do usuário (VINCULANTES — respondidas, não reabrir)
- **Q1 — grid do item 5 → opção (b): TUDO em 2 colunas, card de grupo incluído.** Nenhum `col-span`. O aperto do interior do grupo em meia largura é resolvido, não contornado — ver **§ Meia coluna: como o interior se acomoda** e o item 5.
- **Q2 — alcance do item 2 → opção (a): Start/End/Duration sai de TODA task da lista ativa** (task solta inclusive). Só o footer "N of M completed" mostra tempos, com os tempos **abaixo** do nome e o nome do grupo **ao lado** do nome da task.

---

## § Meia coluna: como o interior se acomoda (consequência de Q1)

**Largura da meia coluna é constante e conhecida acima de ~1184px.** O container é `max-w-6xl` (1152px) e o `Box` de Tasks tem `p-6`: interior = 1152 − 48 = **1104px**; grid de 2 colunas com `gap-3` (12px) ⇒ cada coluna = (1104 − 12)/2 = **546px**, *idêntico em 1280px e em 1440px* (acima de ~1184px de viewport o `max-w-6xl` satura).

**Faixa 1024–1184px (ressalva da r1, resolvida).** Abaixo de ~1184px o `max-w-6xl` não satura e a meia coluna encolhe até **~466px** (em 1024px de viewport: 1024 − 24 de `p-3`×2 = 1000; −48 de `p-6` = 952; (952−12)/2 = **470px**). Como as regras abaixo são **incondicionais** (não dependem de breakpoint) e o pior caso da linha de ações já é resolvido por "Debug em linha própria", elas valem igual a 470px. Isso deixa de ser teoria: **o roteiro de teste inclui um viewport de 1100px** só para a prova de zero overflow (ver § Cenário, screenshot `03c`). Dentro do card de grupo (border 1px + `px-4`) o corpo mede ~512px; a lista de subtasks tem `pr-2` ⇒ o card da subtask mede ~504px e, com `p-3`, sobram **~478px** de conteúdo. É esse 478px o número de projeto — não há breakpoint de viewport que descreva isso (a `sm:` de 640px está *ativa* num container de 478px, por isso viewport-breakpoint é o instrumento errado aqui).

**Regras de acomodação (valem sempre, em qualquer largura — layout determinístico, sem breakpoint):**
1. **O widget de Debug ocupa sempre a linha inteira, sozinho.** Contas do pior caso na linha de ações a 478px: pencil 36 + trash 36 + Notes ~86 = 158 à esquerda; Alert Select ~86 + Debug ~230 = 316 à direita ⇒ 474px, sem folga para o `gap-2`. Em vez de depender de wrap sorteado, o wrapper do `IndexDebugTimer` é `w-full min-w-0` **incondicional** (some o `sm:w-auto sm:flex-1`): ele desce para a própria linha como uma barra de progresso da largura do card. Determinístico, sem overflow em nenhuma largura, e continua legível em coluna única.
2. **Todo título vira `truncate` com `title={...}`** — nunca `break-all`/`break-word` (o `break-all` é o que produziu o empilhamento letra-a-letra de `responsivo.png`). Vale para: título da subtask (`IndexTaskItem`), título do grupo (`IndexTaskGroup`), título e badge do item completado (`IndexCompletedTaskItem`, badge com `max-w-[45%] truncate shrink-0`) e título do grupo completado. Toda a cadeia de flex acima do texto ganha `min-w-0` (sem isso `truncate` não corta nada dentro de flex).
3. **Timer da subtask 64px → 56px** (`w-16 h-16` → `w-14 h-14 shrink-0`, texto `text-[11px]`): devolve 8px + o gap para o título e mantém a proporção do card em meia largura.
4. **Linha do input de add do grupo**: `Input` com `flex-1 min-w-0`, `Button` com `shrink-0 px-4` (era `px-6`).
5. **Header do grupo**: 4 botões de ícone (check/pencil/trash/chevron) = ~144px; bloco do título com `min-w-0 flex-1` e `truncate` ⇒ ~350px de título em 546px. Sem mudança estrutural.
6. **Nada de `@container`/container query**: a solução acima é incondicional, então não há variante que possa falhar silenciosamente. O estado "estreito" é o único estado.

**Consequência aceita e registrada (ressalva da r1): `items-start` deixa buraco vertical.** Com `items-start`, um card de grupo alto (ex.: `QA-Grupo-Scroll`, ~600px) ao lado de uma task simples (~110px) deixa ~490px de vazio na célula vizinha. Isso é **consequência direta da decisão vinculante do usuário** (Q1 = tudo em 2 colunas, sem `col-span`) e é preferível às alternativas: `items-stretch` esticaria o card curto (borda solta em volta de nada) e um masonry/`columns` quebraria o drag-and-drop do dnd-kit. Fica assim, **não** é bug, e o gate de julgamento visual não reprova por causa dele (está escrito no checklist do gate).

**Critério de aceite desta seção (verificável por screenshot + DOM, em 1280 e 1440, com o grupo lado a lado com outro card):**
- **Zero overflow horizontal interno**: para todo elemento dentro do card de Tasks, `scrollWidth <= clientWidth + 2`.
- **Zero texto cortado sem ellipsis**: nenhum elemento com `scrollWidth > clientWidth + 2` que não tenha `text-overflow: ellipsis` no `getComputedStyle`.
- **Zero controle sobreposto**: a interseção de bounding-rects, par a par, entre os botões/controles da linha de ações de uma mesma subtask é **0**.
- **Debug em linha própria**: `debug.getBoundingClientRect().top >= notesButton.getBoundingClientRect().bottom` no mesmo card.
- **Duas colunas de fato**: dois cards de grupo lado a lado têm `top` igual (±4px), `left` diferente e `width` entre 500 e 560px cada (em 1100px a faixa é 440–500px).

---

## Política objetiva de contraste (critério de aceite do item 1)

> **Bloqueadores 1, 2 e 3 da r1** viraram: **(A)** um conjunto medido definido por predicado, **(B)** as regras, **(C)** uma isenção única e justificada nó a nó, **(D)** um auditor com composição alpha correta, **(D2)** um único gate objetivo (`auditContrast() === []`) e **(E)** um gate de julgamento visual explícito.
>
> **Bloqueadores da r2, resolvidos aqui (r3):**
> 1. **Predicado de neutralidade** — o predicado de spread (`≤ 16`) era falso e inatingível: **medido**, a rampa neutra tem spread **18–27** e o menor spread de acento é **28** (`Red-100`). Ele foi **eliminado**; ficou **uma só** classificação de cor no plano e no código: a lista explícita de rgb dos 15 tokens de acento (`Set ACCENT`, agora de fato usado). Não existe mais "cor neutra por heurística".
> 2. **Nós que reprovavam fora da isenção** — `text-White` sobre `bg-Green-400` (2,54:1), `text-White` sobre `bg-Blue-400` (3,30:1), o disco de "completo" e o `text-Blue-500` do Debug foram **corrigidos de fato** (tabela em (C)), com o atom `Button` entrando no footprint do escopo B. Nada disso foi escondido em allowlist: a isenção continua valendo **só** para `<svg>` de acento (contrapartida J4).
> 3. **Parse de cor** — o `parse()` por regex de dígitos foi trocado por **normalização medida** (round-trip por `canvas` 1×1) com **auto-teste que lança**: verificado neste host que o Chrome serializa `bg-Black-100/40` como `oklab(0.821635 -0.00275022 -0.0182688 / 0.4)` e que o canvas devolve `[190, 198, 210, 0.4]`. A composição de `effBg()` **não mudou** (estava correta).

### (A) Conjunto medido `M` — definido por predicado, não por lista de arquivos

Um nó entra em `M` se e somente se **todas** as condições valem:
1. é um `Element` que tem **filho de texto direto** não vazio, **ou** é um `<svg>`, **ou** é um `<input>/<textarea>` com `placeholder` (nesse caso mede-se `getComputedStyle(el, "::placeholder").color`);
2. está **de fato visível**: `el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })` é `true` e o `getBoundingClientRect()` tem área > 0. (Isso é o que exclui os botões Check/Pencil/Trash do header do grupo, que vivem dentro de `opacity-0 group-hover:opacity-100` — sem esse teste o gate seria inatingível porque mediria nós invisíveis.);
3. está dentro do `#root` (exclui o `<html>`/`<body>`).

`M` é medido **no estado de repouso**: sem hover, sem foco, sem diálogo aberto, sem dropdown de `Select` aberto. Portanto `Dialog/content.tsx`, `IndexReportsDialog/**`, `UpdateTimerDialog`, o `<textarea>` do `IndexTaskNoteDialog` e o portal do `Select/root.tsx` **não** são medidos (não estão no DOM/visíveis nas 4 telas auditadas). Eles são corrigidos junto (mesmo bug de token, custo zero), mas o gate não depende deles — e isso está dito aqui de propósito, para não haver "regra declarada que ninguém mede".

**Telas auditadas** (as mesmas dos screenshots, para o auditor e o screenshot provarem o mesmo estado): `00-estado-vazio`, `02-tasks-simples`, `04-grupo-expandido`, `06-footer-expandido` — cada uma em **light e dark** × **1280px e 390px** = 16 execuções do auditor.

### (B) Regras — exatamente o que o auditor mede, nada mais

- **R1** — nó de `M` com texto normal (< 18px, e não `≥ 14px bold`) ≥ **4,5:1** contra o fundo efetivo. Vale para **qualquer** cor não-acento (`White`, rampa `Black-*`, herdada do UA, desconhecida).
- **R2** — nó de `M` com texto grande (≥ 18px, ou ≥ 14px bold) ou `<svg>` ≥ **3:1**. A **única** isenção do gate inteiro é a de (C): `<svg>` de cor de acento.
- **R3** — `::placeholder` de `<input>`/`<textarea>` é medido como texto normal (**≥ 4,5:1**), com a cor de `getComputedStyle(el, "::placeholder")` sobre o fundo efetivo do próprio campo. (É o que o código faz — a redação anterior prometia "em nenhum estado renderizado", que nenhum gate mede.)
- **R4** — em light mode, nenhum `color` de nó de `M` resolve para `#9CA3AF` (`Black-400`), `#BEC5D1` (`Black-100`) ou `#89909E` (`Black-200`). Esses três valores só são permitidos atrás do variant `dark:`.
- **R5** — **acento em texto não recebe o piso de texto grande**: se a cor **declarada** de um nó **não-`<svg>`** é um token de acento, o mínimo dele é **4,5:1 independentemente do tamanho da fonte** (não vale a concessão de 3:1 de R2). Existe texto de acento hoje — o rótulo "Debug", o relógio e o Check do reset em `IndexDebugTimer.tsx:80,99,106` usam `text-Blue-500` (4,50:1 sobre branco: 4,5018 — limítrofe). O item 1 os leva a `text-Blue-600` = **5,75:1**, e R5 impede que uma próxima "correção" seja só aumentar a fonte. *(A r2 desmentiu a frase "hoje nenhum texto usa acento nas telas auditadas", que era falsa e saiu.)*

**Definição única de cor — uma só, e é a que o código executa** (bloqueador 1 da r2): o auditor faz **uma** classificação, `isAccent(cor declarada)`. Ela é verdadeira quando a cor declarada do nó, arredondada para inteiros, casa **com tolerância de ±2 por canal** um dos **15** tokens de acento da palheta:

`Green-100 rgb(209,250,229)` · `Green-300 rgb(50,183,104)` · `Green-400 rgb(16,185,129)` · `Green-500 rgb(5,150,105)` · `Red-100 rgb(254,226,226)` · `Red-400 rgb(242,79,79)` · `Red-500 rgb(235,70,70)` · `Blue-100 rgb(224,242,254)` · `Blue-300 rgb(86,162,255)` · `Blue-400 rgb(44,141,255)` · `Blue-500 rgb(26,117,224)` · `Blue-600 rgb(21,101,192)` · `Yellow-100 rgb(254,243,199)` · `Yellow-400 rgb(251,191,36)` · `Yellow-500 rgb(245,158,11)`

Toda outra cor — `White`, toda a rampa `Black-*`, o `rgb(0,0,0)` herdado do UA, qualquer cor desconhecida — é **não-acento** e é medida por R1/R2/R3/R4. O default é **medir**, nunca isentar: nenhuma cor consegue escapar do gate por não estar numa lista.

**Por que lista explícita e não heurística de spread** (medido, não estimado): a rampa neutra tem spread `Black-800` 18, `Black-100` 19, `Black-400` 19, `Black-200` 21, `Black-300` 21, `Black-900` 22, `Black-700` 24, `Black-500` 26, `Black-600` 27, `Black-450` novo (`#556070`) **27**; o menor spread de acento é `Red-100` **28**. Qualquer limiar viveria numa janela de **1 unidade** — e o `≤ 16` da r2 não classificava **nenhum** cinza como neutro, o que (com o antigo `if(!neutral && !isIcon) push R5`) transformava todo texto da app em violação. A lista não tem janela, e a tolerância de ±2 cobre exatamente o arredondamento do round-trip de cor de (D) (medido: `rgb(190,197,209)` volta como `190,198,210`). Colisão com neutro é impossível: o acento mais próximo de um cinza da rampa é `Red-100` a **29** de distância de `White`.

**O que NÃO é medido, e por quê (registrado, não silenciado):**
- **Bordas, rings e divisores.** WCAG 1.4.11 pediria 3:1 na borda de controle (`border-Black-100` = 1,74:1 sobre branco). Fora do gate porque (i) a queixa do usuário no item 1 é legibilidade de **texto** cinza; (ii) `border-Black-100` é a borda de *todos* os cards, e os itens 3 e 5 estão redesenhando exatamente essa borda nesta mesma task — mudar o valor dela aqui colidiria com o resultado visual que o item 3 persegue. **Consequência aceita e registrada:** 1.4.11 fica não atendido para bordas de card/controle.
- **Estados de hover/focus** (`hover:text-Black-300`, `hover:text-Green-500`): o repouso é o estado que o usuário vê 99% do tempo e é o único que um screenshot prova.
- **Nós que só existem fora do repouso**, medidos e registrados (não estão em `M`, § (A)): `IndexErrorMessage.tsx:27` (`text-Red-500` sobre `bg-White` = 3,82:1 em 14px normal — o componente retorna `null` sem erro e se auto-apaga em 3s) e o rótulo de overtime do `Timer` (`common/Timer/index.tsx:98`, `text-Red-500`, fonte grande ⇒ 3,82:1 ≥ 3). Nenhum dos dois está montado nas 4 telas auditadas; **consequência aceita e registrada**, não silenciada.

### (C) Isenção `A` — uma só, fechada, com justificativa por entrada

`A` tem **exatamente uma** regra, aplicada pelo próprio auditor (não é uma lista que o testador edita): **`<svg>` cuja cor declarada é um token de acento é isento de R2.** Nada mais é isento. Em particular, **texto de acento** (R5) e **texto/ícone neutro sobre fundo de acento** (R1/R2) **não** são isentos — os nós desse tipo que reprovavam foram **corrigidos** (segunda tabela abaixo), que é a resolução do bloqueador 2 da r2.

Nós isentos — levantamento completo das telas auditadas, ratio medido em light (todos `<svg>`, todos com cor de acento):

| nó | cor | fundo | ratio | por que é aceitável |
|---|---|---|---|---|
| `IndexScore` — 8 ícones de chip (Sun/Clock/Hourglass/Repeat/PlayCircle/CheckCircle2/Award/Zap) | Yellow-400 / Blue-400 / Green-400 / Red-400 | Yellow-100 / Blue-100 / Green-100 / Red-100 | 1,50–2,88 | **decorativo**: o rótulo em texto ("TODAY'S FOCUS"...) está ao lado e carrega 100% da informação. WCAG 1.4.11 exempta imagem decorativa. |
| `IndexTaskItem` / `IndexTaskGroup` — Play/Square/Check | Green-400 | branco | 2,54 | ícone-only de controle; ver a justificativa da isenção abaixo |
| `IndexTaskItem` / `IndexTaskGroup` — Pencil | Yellow-400 | branco | 1,67 | idem |
| `IndexTaskItem` / `IndexTaskGroup` — Trash2 | Red-400 | branco | 3,50 | já passa 3:1 |
| `IndexAlertSelect` — Bell | Yellow-400 | branco | 1,67 | idem |
| `IndexEditInput` — Check / X | Green-300 / Red-400 | branco | 2,59 / 3,50 | idem |
| `IndexCompletedTaskItem` / `IndexCompletedTaskGroup` — Chevron | Blue-400 | branco | 3,30 | já passa 3:1 |

**Justificativa da isenção (uma vez, vale para as linhas "idem") — e por que ela para nos ícones:** a isenção cobre **só a fileira de ícones de ação**, porque ali a correção é impossível *como conjunto*: `Green-400 → Green-500` passaria (3,77:1), mas **não existe amarelo conforme na palheta** (`Yellow-500` = 2,15:1, o mais escuro que existe) e "criar tokens novos" é fora de escopo declarado; corrigir só o verde deixaria a fileira inconsistente (verde escuro ao lado de amarelo claro) — pior visualmente, e o usuário colocou "ficar legal" acima da conformidade formal. Nenhuma informação depende só da cor: todos esses botões têm `title=` ou rótulo adjacente (WCAG 1.4.1 atendido). **Consequência aceita e registrada:** 1.4.11 fica não atendido para os ícones de acento. Em compensação, o **gate de julgamento visual (E) inclui a pergunta J4** sobre a distinguibilidade desses ícones — a isenção não é cheque em branco.

**Por que essa justificativa NÃO se estende a texto e a fundo de botão** (bloqueador 2 da r2): o usuário disse "os contrastes das cores brancas não estão legais" e `text-White` a **2,54:1** sobre o verde do botão `Start` é, literalmente, o contraste de cor branca ruim que ele pediu para consertar — no elemento mais visível da tela do item 7. Ali existe token conforme na palheta (`Green-500`, `Blue-600`), a correção é de **uma palavra por variante** e não cria inconsistência nenhuma (o botão fica do mesmo verde/azul, só mais escuro). Então esses nós são **corrigidos**, não isentos:

| nó | antes (medido, light) | depois | ratio depois | mínimo aplicável |
|---|---|---|---|---|
| `Button` `variant="primary"` `text-White` — `Start`/`Resume`/`Rest`/`+5 min`/`+10 min`/`Skip`/`Back to Work` (`IndexTimer.tsx`), `Add` do grupo (`IndexTaskGroup.tsx:175`) e do input principal (`IndexAddInput.tsx:49`) | `bg-Green-400` = **2,54:1** | `bg-Green-500` (`hover:bg-Green-400`) | **3,77:1** | 3 (texto ≥14px **bold** — ver invariante) |
| `Button` `variant="secondary"` `text-White` e seus `<svg>` — `Notes` (`IndexTaskNoteDialog.tsx:79`), `Reset` (`IndexFooter.tsx:68`), `Rest`/`Settings`/`RotateCcw` (`IndexTimer.tsx`) | `bg-Blue-400` = **3,30:1** (e 12px bold ⇒ exigia 4,5) | `bg-Blue-600` (`hover:bg-Blue-500`) | **5,75:1** | 4,5 |
| disco de "completo", `<Check className="text-White">` dentro de `bg-Green-400 border-Green-400` — `IndexCompletedTaskItem.tsx:39,93`, `IndexCompletedTaskGroup.tsx:27` | **2,54:1** (`White` é **não-acento** ⇒ nunca foi isento por A) | `bg-Green-500 border-Green-500` | **3,77:1** | 3 (`<svg>`) |
| "Progress" e "N%" do `ProgressBar` (12px, `font-medium`/`font-semibold` ⇒ texto normal) — `atoms/ProgressBar/index.tsx:16`, usado em `IndexTaskGroup.tsx:161` e `IndexFooter.tsx:97` | **dark**: `dark:text-Black-300` sobre `dark:bg-Black-700` = **3,04:1** (light já era `text-Black-500` = 10,31:1) | `dark:text-Black-400` | **5,78:1** (6,40 sobre o corpo do grupo no dark) | 4,5 |
| rótulo "Debug", relógio e Check do reset — `IndexDebugTimer.tsx:80,99,106` | `text-Blue-500` sobre `bg-White` = **4,50:1** (4,5018 — limítrofe, e R5 exige 4,5 sem concessão) | `text-Blue-600` | **5,75:1** | 4,5 (R5) |

**Invariante compartilhado entre os escopos (medido, e é por isso que o item 7 fixa `font-bold`):** `bg-Green-500` (primary, 3,77:1) e `bg-Red-500` (danger, 3,82:1) com `text-White` não são conformes (ficam abaixo do mínimo de 4,5:1 para texto normal): não-conformidade aceita e registrada, da mesma classe da isenção dos ícones de acento — não existe verde/vermelho mais escuro na palheta (Green-500 já é o mais escuro) e criar token novo é proibido; aumentar a fonte contradiz o item 7 (botões menores). Mantidos `font-bold` + `text-sm` porque com `font-medium` o contraste cai para 2,54:1 / 3,30:1 — aí sim seria violação grosseira. O limiar do auditor fica como está de propósito; mexer nele torna o gate inatingível sem token novo. Portanto **todo `Button` primary/danger tem de manter `font-bold` e `font-size ≥ 14px`** — o escopo A troca `text-base font-medium` por `text-sm font-bold` nos 4 branches de `IndexTimer.tsx` (§ Item 7), e o escopo B não introduz `Button` primary/danger menor que 14px. `secondary` (`bg-Blue-600`, 5,75:1) é seguro em qualquer tamanho. Não existe verde/vermelho mais escuro na palheta e criar token é fora de escopo — é essa a razão do invariante, e ele é **medido**, não preferência.

**Fora do gate, registrado e não silenciado:** `IndexWorkflowFooter.tsx:36` é um `Button` primary `text-xs` (12px bold ⇒ mínimo 4,5) que com `bg-Green-500` fica em 3,77:1. `IndexWorkflowDialog` é **fora de escopo declarado** (nem token) e não está montado em nenhuma das 4 telas auditadas, então não entra em `M` nem no gate. Consequência aceita e registrada — se um dia o diálogo entrar no escopo, ou o botão vira `text-sm` ou a variante vira `secondary`.

### (D) Auditor — composição alpha correta (bloqueador 2 da r1) + normalização de cor medida (bloqueador 3 da r2)

O erro da r1: `effBg()` compunha **cada** camada alpha sobre `[255,255,255]` e descartava o acumulado; no dark, `dark:bg-Black-800/40` sobre `dark:bg-Black-700` retornava rgb(163,166,170) (um cinza claro inexistente) e todo texto claro virava violação falsa. A correção: **coletar as camadas subindo até o primeiro ancestral opaco e compor de fora para dentro, começando nesse ancestral opaco.** Em light o ancestral opaco é `#root`/`body` (`background-color: var(--color-White)`); em dark é o mesmo nó via `.dark #root { background-color: var(--color-Black-900) }` (o `dark` é uma classe em `document.documentElement`, confirmado em `useDarkMode.ts:29`). Conferência do resultado: `Black-800/40` sobre `Black-700` = rgb(29,37,51), e `Black-400` sobre ele = **6,04:1** (passa), como tem de ser. **A composição de `effBg()` não muda na r3** — a r2 conferiu e está correta.

**O que muda na r3: a leitura da cor.** Tailwind v4.1 compila `bg-Black-100/40` como `color-mix(in oklab, var(--color-Black-100) 40%, transparent)`, e o Chrome **não** serializa isso como `rgb()`. Medido neste host (Chromium 1243 de `/opt/ms-playwright`, `HeadlessChrome/153`): `getComputedStyle(el).backgroundColor` devolve **`oklab(0.821635 -0.00275022 -0.0182688 / 0.4)`** — o `parse()` por regex de dígitos leria `[0.821635, -0.00275022, -0.0182688, 0.4]` e envenenaria silenciosamente todo o `effBg()`. Substituído por **round-trip medido em `canvas` 1×1**: `fillStyle = <string computada>` + `fillRect` + `getImageData` devolve sRGB 0–255 com alpha não-premultiplicado. Medido no mesmo host: aquele `oklab(...)` volta como **`[190, 198, 210, 0.4]`** (o token é `rgb(190,197,209)` — daí a tolerância de ±2 da classificação de cor), `oklab(0.5 0.1 -0.1)` volta como `[129, 69, 154, 1]`, `rgb(31, 41, 55)` volta **exato**, e uma string inválida volta `[0, 0, 0, 0]`. Como isso depende do host, o auditor traz um **auto-teste que `throw`** nesses 5 casos (os 4 acima + `"transparent"`): se o normalizador não servir, o gate **lança** em vez de "passar".

```js
// retorna [] quando conforme; senão [{sel, text, ratio, min, color, bg, fontPx, bold, rule}]
// LANÇA se o normalizador de cor não passar no auto-teste — nesse caso o gate é FAIL, não "passou".
function auditContrast() {
  // --- normalização de cor MEDIDA (bloqueador 3 da r2): o Chrome serializa o computado de
  // `/40` como `oklab(L a b / alpha)`; round-trip por canvas 1x1 devolve sRGB 0-255 + alpha 0-1.
  const _cv = document.createElement("canvas"); _cv.width = _cv.height = 1;
  const _cx = _cv.getContext("2d", { willReadFrequently: true });
  const parse = (s) => {
    if (!s) return [0, 0, 0, 0];
    _cx.clearRect(0, 0, 1, 1);
    _cx.fillStyle = "rgba(0, 0, 0, 0)";   // sentinela: string inválida não altera fillStyle
    _cx.fillStyle = s;
    _cx.fillRect(0, 0, 1, 1);
    const d = _cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  // --- auto-teste obrigatório do normalizador (valores medidos em Chromium 1243 / HeadlessChrome 153)
  const _near = (a, b, tol) => [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= tol);
  const _t1 = parse("rgb(31, 41, 55)");
  const _t2 = parse("rgba(0, 128, 255, 0.4)");
  const _t3 = parse("color-mix(in oklab, rgb(190, 197, 209) 40%, transparent)");
  const _t4 = parse("oklab(0.5 0.1 -0.1)");
  const _t5 = parse("transparent");
  if (!_near(_t1, [31, 41, 55], 0) || Math.abs(_t1[3] - 1) > 0.01 ||
      !_near(_t2, [0, 128, 255], 1) || Math.abs(_t2[3] - 0.4) > 0.01 ||
      !_near(_t3, [190, 197, 209], 2) || Math.abs(_t3[3] - 0.4) > 0.02 ||
      !_near(_t4, [129, 69, 154], 3) || _t5[3] !== 0) {
    throw new Error("auditContrast: normalizador de cor reprovou o auto-teste " +
                    JSON.stringify([_t1, _t2, _t3, _t4, _t5]));
  }
  // --- ÚNICA classificação de cor do auditor: os 15 tokens de acento, por rgb, tolerância +-2.
  // Toda outra cor (White, rampa Black-*, rgb(0,0,0) herdado do UA, desconhecidas) é medida.
  const ACCENT = [
    [209, 250, 229], [50, 183, 104], [16, 185, 129], [5, 150, 105],                  // Green-100/300/400/500
    [254, 226, 226], [242, 79, 79], [235, 70, 70],                                   // Red-100/400/500
    [224, 242, 254], [86, 162, 255], [44, 141, 255], [26, 117, 224], [21, 101, 192], // Blue-100/300/400/500/600
    [254, 243, 199], [251, 191, 36], [245, 158, 11],                                 // Yellow-100/400/500
  ];
  const isAccent = (c) => ACCENT.some((t) => _near(c.map(Math.round), t, 2));
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
  // compõe fg (com alpha) SOBRE bg (opaco) — Porter-Duff "over"
  const over = (fg, bg) => {
    const a = fg.length > 3 ? fg[3] : 1;
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };
  const ratioOf = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  // CORRIGIDO: empilha as camadas até o primeiro ancestral OPACO e compõe
  // de fora (ancestral opaco) para dentro (o próprio elemento).
  function effBg(el) {
    const layers = [];
    let opaqueFound = false;
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.length < 3) continue;
      const a = c.length > 3 ? c[3] : 1;
      if (a === 0) continue;
      layers.push([c[0], c[1], c[2], a]);
      if (a === 1) { opaqueFound = true; break; }
    }
    // base só é usada se nenhum ancestral opaco existir (não acontece neste app:
    // html/body/#root sempre têm background opaco) — ainda assim, por tema.
    let acc = opaqueFound
      ? [0, 0, 0]
      : document.documentElement.classList.contains("dark") ? [17, 24, 39] : [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  }

  const out = [];
  const push = (el, fgRaw, bg, fontPx, bold, isIcon, rule, textHint) => {
    const fg = over(fgRaw, bg);
    const ratio = ratioOf(fg, bg);
    const accent = isAccent(fgRaw);              // classificação pela cor DECLARADA (= o token)
    if (isIcon && accent) return;                // isenção A (§ C): única do gate, fechada
    const large = isIcon || fontPx >= 18 || (fontPx >= 14 && bold);
    // R5: acento em texto não recebe o piso de 3:1 de texto grande — sempre 4,5:1
    const min = accent ? 4.5 : large ? 3 : 4.5;
    if (ratio + 0.005 < min) {
      out.push({ rule: accent ? "R5" : rule, sel: sel(el), text: textHint, ratio: +ratio.toFixed(2), min,
                 color: `rgb(${fg.map(Math.round)})`, bg: `rgb(${bg.map(Math.round)})`, fontPx, bold });
    }
  };
  const sel = (el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ").slice(0, 3).join(".")}`;

  const root = document.getElementById("root") || document.body;
  root.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return;
    const st = getComputedStyle(el);
    const bg = effBg(el);
    const fontPx = parseFloat(st.fontSize);
    const bold = parseInt(st.fontWeight, 10) >= 700;
    const isIcon = el.tagName.toLowerCase() === "svg";
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText || isIcon) {
      push(el, parse(st.color), bg, fontPx, bold, isIcon,
           isIcon ? "R2" : (fontPx >= 18 || (fontPx >= 14 && bold)) ? "R2" : "R1",
           (el.textContent || "").trim().slice(0, 40) || (isIcon ? "<svg>" : ""));
    }
    if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.placeholder) {
      const ph = getComputedStyle(el, "::placeholder");
      push(el, parse(ph.color), bg, parseFloat(ph.fontSize) || fontPx, false, false, "R3", `::placeholder "${el.placeholder}"`);
    }
    // R4: valores proibidos em light
    if (!document.documentElement.classList.contains("dark") && (hasText || isIcon)) {
      const c = parse(st.color).slice(0, 3).map(Math.round);
      const BANNED = [[156, 163, 175], [190, 197, 209], [137, 144, 158]]; // Black-400/100/200
      if (BANNED.some((t) => _near(c, t, 1))) {
        out.push({ rule: "R4", sel: sel(el), text: (el.textContent || "").trim().slice(0, 40),
                   ratio: null, min: null, color: `rgb(${c})`, bg: `rgb(${bg.map(Math.round)})`, fontPx, bold });
      }
    }
  });
  return out;
}
```

### (D2) Gate objetivo — um só, sem contradição (bloqueador 3)

**`auditContrast()` retorna `[]` nas 16 execuções (4 telas × light/dark × 1280/390), sem lançar. Ponto.** Se ele **lançar** (auto-teste do normalizador reprovado), o resultado é **FAIL** — nunca "passou"; o testador conserta o normalizador e roda de novo. Não existe "violação restante justificada no verdict": a isenção é *parte do auditor* (um `if` — `<svg>` de acento) e está declarada e fechada em (C). Consequência operacional: se o teste de sistema encontrar uma violação, ela **não pode** ser silenciada no verdict — o retorno é FAIL com nota de correção, e mudar a isenção exige mudar **este plano**. Isso substitui, e revoga, a redação contraditória da r1.

### (E) Gate de julgamento visual — obrigatório, com checklist (bloqueador 3)

O usuário disse "tente até ficar legal para o user": o gate objetivo é **necessário e não suficiente**. Depois de ele passar, o agente de teste **abre com `Read`** as imagens de referência e os screenshots produzidos e responde, **por escrito no `verdict.md`, uma linha PASS/FAIL + uma frase de motivo para cada pergunta**:

| # | comparação | pergunta (resposta PASS/FAIL + motivo) |
|---|---|---|
| J1 | `04-grupo-expandido` (light) × `.claude/prompts/grupo-0.png` | Os dois pontos marcados em vermelho na referência desapareceram? (a) o badge de grupo e a linha Start/End/Duration não existem mais na subtask; (b) o canto inferior do card da subtask não tem mais costura cinza-sobre-cinza. |
| J2 | `06-footer-expandido` (light) × `.claude/prompts/tasks-completadas.png` | O badge do grupo está **na mesma linha** do nome e os tempos **na linha de baixo**, como a seta e a caixa azul da referência mandam? A task solta completada aparece **sem** badge? |
| J3 | `04` e `06` (light) | Todo texto cinza (o "N of M completed", "Progress", "0%", "No tasks yet.", os tempos do footer, o placeholder "Add a task...") é **confortavelmente legível** — não "tecnicamente 4,5:1 mas ainda apagado"? |
| J4 | `04`/`02` (light e dark) | Os ícones de ação (Play verde, Pencil amarelo, Trash vermelho, Bell amarelo) continuam **claramente distinguíveis do fundo branco** a olho? (esta é a contrapartida da isenção de § (C): se a resposta for FAIL, a isenção dos ícones cai e o plano tem de mudar) |
| J5 | `01-header-desktop` × `.claude/prompts/header.png` | O timer é um círculo **pequeno à esquerda** com botões pequenos abaixo, as estatísticas estão **à direita, na mesma fileira**, e o card branco existe **só** em volta das estatísticas? |
| J6 | `03-lista-2-colunas` / `03b-1440` | Duas colunas de verdade, incluindo **dois cards de grupo lado a lado**, e o interior do grupo em meia coluna parece **respirado** (nada colado, nada estourando)? O buraco vertical do `items-start` **não** conta como FAIL (consequência aceita — § Meia coluna). |
| J7 | `08-mobile-390-*` × `.claude/prompts/responsivo.png` | As duas marcações vermelhas da referência desapareceram: a linha de ações não estoura e nenhum tempo empilha letra-a-letra? |

**Regra do gate (E):** qualquer `FAIL` em J1..J7 ⇒ o teste de sistema é **FAIL** e volta para o loop de correção com uma nota-de-plano descrevendo o ajuste visual. `PASS` exige as 7 linhas escritas no `verdict.md` — a ausência de qualquer uma delas também é FAIL (não vale "achei bom").

---

## Item 1 — contraste

**Regra mecânica (é assim que o implementador aplica, sem julgamento):** toda ocorrência do literal `text-Black-400` (ou `text-Black-100`/`text-Black-200`) que **não** esteja precedida de `dark:` vira `text-Black-450`, e a mesma `className` precisa **terminar carregando `dark:text-Black-400`** (adicionar se não houver). Idem com o prefixo preservado: `placeholder:text-Black-400` → `placeholder:text-Black-450` + `dark:placeholder:text-Black-400`; `data-placeholder:text-Black-400` → `data-placeholder:text-Black-450` + `dark:data-placeholder:text-Black-400`. Motivo: `Black-450 #556070` sobre `Black-700` = 2,30:1 (premissa 1) — sem o par, o item 1 corrigiria o light e quebraria o dark.

**Levantamento exato, com comando à prova de "tudo na mesma linha" (ressalva (b) da r2 — o grep line-based anterior perdia `text-Black-400 … dark:text-Black-400` na MESMA `className`, que é o caso de `IndexReportsTabs.tsx:28`, violação de light a 2,54:1):**

```bash
grep -rnoP '[-\w:\[\]]*\btext-Black-(100|200|400)\b' src/ | grep -v 'dark:'
```

Ele casa a cadeia de variantes junto com o utilitário, então `dark:placeholder:text-Black-400` é filtrado e `text-Black-450 … dark:text-Black-400` (par correto) não aparece. Resultado medido no commit-base: **24** ocorrências — **18** `text-Black-400`, **2** `placeholder:text-Black-400`, **1** `data-placeholder:text-Black-400`, **3** `text-Black-100` (cor de ícone), **0** `text-Black-200`. Dessas 24:
- **1** desaparece com o código: o bloco de `IndexTaskItem.tsx:240`, removido pelo item 2 — não há troca a fazer;
- **5** já carregam o par `dark:` na mesma `className` e só precisam da troca do literal: `IndexReportsTabs.tsx:28`, `Input/index.tsx:12` (par `dark:placeholder:`), `Select/trigger.tsx:21`, `Select/root.tsx:29,42`;
- as outras **18** precisam da troca **e** do par `dark:` adicionado.

**Token (o único):**
- `src/layout/styles/global.css`, bloco `@theme`, l.31 — **`--color-Black-450: #79818e` → `#556070`**.

**Escopo B — arquivos e linhas (as 24 ocorrências do levantamento acima; `:240` sai com o item 2):**
- `IndexTasks/IndexTasks.tsx:42` (empty state "No tasks yet. Add one above!")
- `IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx:46` (linha de tempos — o item 2 reescreve esse bloco; a cor final é `text-Black-450 dark:text-Black-400`)
- `IndexTasks/IndexFooter/IndexCompletedTaskGroup.tsx:34`
- `IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx:47` ("No tasks yet.")
- `IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx:176` (drag handle `GripVertical`), `:198` (título riscado de task completada), `:240` (bloco que o item 2 **remove** — não há troca a fazer, o bloco sai)
- `IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx:99` (drag handle), `:143` (chevron de collapse)
- `IndexTasks/IndexActiveTasksList/IndexTaskNoteDialog.tsx:101` (`placeholder:text-Black-400` do `<textarea>`)
- `IndexTasks/IndexReportsDialog/IndexReportsTotals.tsx:43`, `IndexReportsEmptyState.tsx:8`, `IndexReportsDaySection.tsx:29,44,48,52`, `IndexReportTaskRow.tsx:19`
- `IndexTasks/IndexReportsDialog/IndexReportsTabs.tsx:28` (**novo na r3, ressalva (b) da r2**) — a aba inativa é `text-Black-400 … dark:text-Black-400` na mesma `className`: só o literal de light vira `text-Black-450` (o par `dark:` **já existe** e fica). Fora do gate (diálogo fechado), mas é violação real de light a 2,54:1 e não estava em nenhuma lista.
- `src/pages/index/components/IndexNotificationRequest.tsx:49`
- **Atoms (bloqueador 1 — passaram para o escopo B):**
  - `src/layout/components/atoms/Input/index.tsx:12` — `placeholder:text-Black-400` → `placeholder:text-Black-450` (o `dark:placeholder:text-Black-400` **já existe** na mesma classe). É o placeholder "Add a task..." das duas telas auditadas: 2,54:1 → 6,38:1.
  - `src/layout/components/atoms/Select/trigger.tsx:15,21` — l.15 `data-placeholder:text-Black-400` → `data-placeholder:text-Black-450` **e adicionar `dark:data-placeholder:text-Black-400`** (essa `className` **não** tem par `dark:` hoje, e sem ele o placeholder do trigger fica 2,30:1 no dark); l.21 chevron `text-Black-100 dark:text-Black-400` → `text-Black-450 dark:text-Black-400` (1,74:1 → 6,38:1). É o chevron do `IndexAlertSelect`, visível na linha de ações de toda task iniciada.
  - `src/layout/components/atoms/Select/root.tsx:29,42` — `text-Black-100` → `text-Black-450` nos dois botões de scroll do portal. **Fora do gate** (o portal não está montado nas telas auditadas — § (A)); corrigido junto porque é o mesmo bug de token e custa 2 palavras. Decisão fechada: **sim, corrige**.
- **Reparo de par `dark:` em `text-Black-450` pré-existente sem par** (a troca do token os afeta): `src/pages/index/components/UpdateTimerDialog.tsx:61,80` → adicionar `dark:text-Black-400`. São os únicos dois `text-Black-450` do repo sem par — dos **16** usos do token (ressalva (c) da r2: são 16, não 17), os outros **14** já têm. **Fora do gate** (diálogo fechado nas telas auditadas), corrigido para não deixar regressão plantada.

**Escopo A (mesma regra, dentro dos arquivos dele):** não introduzir `text-Black-400/200/100` sem `dark:`; `IndexScore.tsx:128` já é `text-Black-450 dark:text-Black-400` e **o par tem de ser preservado**.

**Correções de fundo e de cor de acento (bloqueador 2 da r2 — os nós que reprovavam e NÃO foram allowlistados; ratios e mínimos na 2ª tabela de § Política (C)):**
- `src/layout/components/atoms/Button/index.tsx` (novo no footprint do escopo B) — **só o objeto `variantStyles`**, nada de API/props/tamanho:
  - `primary`: `bg-Green-400 hover:bg-Green-300 text-White dark:bg-Green-500 dark:hover:bg-Green-400` → **`bg-Green-500 hover:bg-Green-400 text-White dark:bg-Green-500 dark:hover:bg-Green-400`** (2,54 → **3,77:1**).
  - `secondary`: `bg-Blue-400 hover:bg-Blue-300 text-White dark:bg-Blue-600 dark:hover:bg-Blue-500` → **`bg-Blue-600 hover:bg-Blue-500 text-White dark:bg-Blue-600 dark:hover:bg-Blue-500`** (3,30 → **5,75:1**).
  - `danger` **não muda** (`bg-Red-500` = 3,82:1, já passa o piso de 3).
  - **As declarações `dark:bg-*` têm de continuar existindo** mesmo iguais às de light: `IndexDebugTimer.tsx:80,106` sobrescreve o fundo com `bg-White` (sem variante), e é só o `dark:bg-Blue-600` do atom — que o `twMerge` **não** remove, por ser outra variante — que impede o botão Debug de ficar branco-sobre-branco no dark. Não "simplifique" isso.
- `IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexDebugTimer.tsx:80,99,106` — `text-Blue-500` → **`text-Blue-600`** nos três nós (rótulo "Debug", relógio `font-mono`, Check do reset): 4,50:1 (limítrofe) → **5,75:1**. Os `dark:text-white` ficam. `border-Blue-400`/`bg-Blue-300/10` não mudam (borda está fora do gate).
- `IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx:39,93` e `IndexCompletedTaskGroup.tsx:27` — o disco de "completo" `border-Green-400 bg-Green-400` → **`border-Green-500 bg-Green-500`**: o `<Check className="text-White">` dentro dele é **não-acento** (nunca foi isento pela isenção A) e sobe de 2,54 para **3,77:1**.
- `src/layout/components/atoms/ProgressBar/index.tsx:16` (novo no footprint do escopo B) — `text-xs text-Black-500 dark:text-Black-300` → **`text-xs text-Black-500 dark:text-Black-400`**. Só o literal do `dark:`: em dark, `Black-300` sobre `Black-700` dá **3,04:1** com 12px não-bold (mínimo 4,5) — é violação real nas telas `04` e `06` em dark, e o atom não estava em footprint nenhum. `Black-400` dá 5,78:1 (e 6,40:1 sobre o corpo do grupo). O light (`text-Black-500` = 10,31:1) não muda; a barra `bg-Black-100/50 dark:bg-Black-600` e o `bg-Green-400` do preenchimento não mudam (não têm texto).
- **Não muda mais nada de acento**: os ícones de ação (Play/Square/Check/Pencil/Trash2/Bell/Chevron) e os 8 chips do `IndexScore` ficam **exatamente** como estão — são a isenção fechada de § Política (C), com a J4 como contrapartida.

**Superfície cinza do corpo do grupo:** `bg-Black-100/50` → `bg-Black-100/40` (em `IndexTaskGroup.tsx`, ver item 3): rgb(229,232,237), sobe `Black-450` de 4,91:1 para 5,18:1.

**`opacity-95` sai** de `IndexCompletedTaskItem.tsx:35`. Dois motivos: (i) opacidade de ancestral não é modelável por composição de background, então ela introduz erro no auditor; (ii) o item 3 manda "uma superfície, uma borda, um raio" e um card 5% translúcido não é uma superfície. Sem ela o auditor é exato.

**Aceite:** o gate (D2) — `auditContrast()` sem lançar e `=== []` nas 16 execuções — mais as perguntas **J3** e **J4** do gate visual (E). Nada além disso é aceite do item 1.

## Item 2 — Start/End/Duration e badge de grupo

**Remover (arquivo `IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx`):**
- linhas **206-210**: o `<span>` do badge `{groupTitle}` ao lado do título.
- linhas **238-252**: o bloco `{!isEditing && hasBeenStarted && (...)}` com Start/End/Duration. Com ele saem `formatClockValue`, `taskTimeRange` (`getTimeRangeFromEvents`) e `totalTimeInSeconds` — mas **atenção**: `calculateTotalTimeInSeconds` continua em uso na l.53 (`useCountUpTimer({ initialSeconds })`) e `formatTime` continua em uso em `playAlertSound`. Só saem de fato: `formatClockValue`, `getTimeRangeFromEvents` e as duas variáveis derivadas.
- **`GroupTitleContext` morre inteiro** (ressalva da r1): o `useContext` da l.65 era o **único** consumidor. Então remover também o `<GroupTitleContext.Provider>` de `IndexGroupTasksList.tsx:51,73` + o import da l.18, e **apagar o arquivo** `IndexTasks/IndexActiveTasksList/IndexTaskGroup/GroupTitleContext.ts`. Sem isso sobra um Provider sem consumidor — código morto que o `tsc` **não** pega (`noUnusedLocals` não vê um Provider usado no JSX).

**Reestruturar (arquivo `IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx`, molde de `tasks-completadas.png`):**
- Linha 1 do item: **título + badge do grupo na mesma linha** (`flex items-center gap-2 min-w-0`), título `truncate min-w-0` com `title={task.title}`, badge `shrink-0 max-w-[45%] truncate` com `title={groupTitle}`.
- Linha 2, abaixo do título: **Start / End / Duration** (ou "No time tracked"), em `flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-Black-450 dark:text-Black-400`, cada `<span className="whitespace-nowrap">` — o `whitespace-nowrap` é o que impede o empilhamento vertical de letras visto em `responsivo.png`.
- Remover o `break-all` do título (l.43) — é ele que quebra "Duration" no meio; a regra 2 da **§ Meia coluna** manda `truncate` + `title`.
- O badge continua **condicional a `groupTitle`**: task solta completada aparece **sem** badge (é o que `tasks-completadas.png` mostra, e é o que o screenshot 06 tem de provar — ver cenário).

**Hook de DOM novo (resolve o bloqueador 6):** o aceite da r1 usava `[role="region"], .group`, que estava errado duas vezes — o item 4 apaga o `role="region"` da lista ativa, e os `.group` do **footer** legitimamente exibem "Start ...". `IndexActiveTasksList.tsx` passa a marcar os três containers de seção com **`data-tasks-section="active" | "paused" | "pending"`** (atributo puro, sem custo, sem lógica). O footer **não** recebe o atributo. Assim existe um seletor estável e escopado à lista ativa, imune às mudanças dos itens 4 e 5.

**Aceite (DOM + screenshot):**
- **Lista ativa:** `[...document.querySelectorAll('[data-tasks-section] *')]` — nenhum nó cujo `textContent` case `/^\s*Start \d/`, `/^\s*End \d/` ou `/^\s*Duration \d/`; e `document.querySelectorAll('[data-tasks-section]').length >= 1` (garante que o seletor não é vazio por engano — um seletor que não casa nada passaria trivialmente).
- **Badge fora da lista ativa:** para todo grupo expandido, nenhum descendente de `[data-tasks-section]` tem `textContent` exatamente igual ao título de um grupo existente **exceto** o próprio `<span>` do título do card de grupo (comparação por título dos grupos criados no cenário: `QA-Grupo-Scroll`, `QA-Grupo-Par`, `QA-Grupo-Pausado`).
- **Footer:** o badge do grupo tem `getBoundingClientRect().top` igual (±2px) ao do título, e a linha de tempos tem `top >= bottom` do título; a task solta completada (`QA-Task-Solta-B`) **não** tem badge. Screenshot `06-footer-expandido` + pergunta **J2** do gate visual.

## Item 3 — bordas do card (grupo e task)

Diagnóstico: hoje o wrapper e o header são **dois cards empilhados sem offset** — wrapper `bg-Black-100/50 border border-Black-300/15 rounded-xl` (IndexTaskGroup.tsx:90, IndexTaskItem.tsx:159) com primeiro filho `rounded-xl bg-white border shadow-sm` (IndexTaskGroup.tsx:91, IndexTaskItem.tsx:161-165). Os dois raios de 12px coincidem, então a borda + o cinza do wrapper aparecem como halo/costura nos cantos de cima, e nos cantos de baixo o wrapper cinza encosta em outro cinza (a subtask fica com wrapper cinza dentro do corpo cinza do grupo, contraste 1:1 — é o canto marcado em vermelho em `grupo-0.png`).

**Regra nova: cada card é UMA superfície com UMA borda e UM raio.**

`IndexTaskGroup.tsx`
- raiz (l.90): `group rounded-xl border border-Black-100 bg-White shadow-sm hover:shadow-md transition-all overflow-hidden dark:bg-Black-700 dark:border-Black-600` — o `overflow-hidden` é obrigatório: é ele que faz o corpo interno de cantos retos ser recortado pelo raio do card.
- header (l.91): perde `rounded-xl`, `bg-white`, `border*` e `shadow*`; fica só `flex items-center justify-between p-4`.
- corpo (l.156-182, progress + input + lista): passa a ser **um único** `<div className="bg-Black-100/40 border-t border-Black-100 px-4 py-3 flex flex-col gap-3 dark:bg-Black-800/40 dark:border-Black-600">`, envolvendo o "N of M completed" + ProgressBar + (se não colapsado) input de add + `IndexGroupTasksList`. Assim o cinza é o *interior* do card, nunca uma moldura em volta dele.
- Meia coluna (regras 4 e 5 da § Meia coluna): bloco do título do header com `min-w-0 flex-1` e `<span>` do título `truncate` + `title={group.title}` (sai o `break-all` da l.104); linha do input de add com `Input` em `flex-1 min-w-0` e `Button` em `shrink-0 px-4`.

`IndexTaskItem.tsx`
- raiz (l.159): `group rounded-xl border bg-White shadow-sm hover:shadow-md transition-all overflow-hidden dark:bg-Black-700 dark:border-Black-600`, e a cor da borda passa a carregar o estado: `isTimerActive ? "border-Green-400" : "border-Black-100 hover:border-Green-400/50"`.
- header (l.160-166): perde `rounded-xl`/`bg-white`/`border`/`shadow`; o realce de ativo vira `bg-Green-400/5 dark:bg-Green-400/10` só no header.
- linha de ações (l.254-294): perde o `rounded-xl`, ganha `border-t border-Black-100/60 dark:border-Black-600` e fica **branca** (era cinza herdado do wrapper) — resolve item 1 dentro da subtask.

**Aceite:** em `getComputedStyle` do card raiz, `overflow` = `hidden` e `borderRadius` = `12px`; no primeiro filho (header) `borderRadius` = `0px` e `borderWidth` = `0px`.

**Terceiro critério, reescrito (ressalva da r1 — o antigo era ambíguo para a linha de ações):** *nenhum elemento dentro de um card tem borda visível **nos 4 lados** com background igual ao do pai.* Formalmente: para cada descendente do card raiz, se `effBg(el) == effBg(el.parentElement)` (mesmos 3 canais, ±1), então **não** pode ter `border-width > 0` **simultaneamente nos 4 lados** com `border-style != none` e cor de alpha > 0. Isso reprova o "card dentro de card" que o item 3 mata e **libera** explicitamente o `border-t` da linha de ações e o `border-t` do corpo do grupo, que são **divisores de 1 lado, intencionais**. Screenshot `04-grupo-expandido` sem costura nos 4 cantos + pergunta **J1(b)** do gate visual (comparação com `grupo-0.png`).

## Item 4 — só o scroll interno do grupo

- `IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx:77-82` — **remover** `max-h-[520px] overflow-y-auto pr-1` e, com eles, `tabIndex={0}`/`role="region"`/`aria-label="Active tasks"` (a região só era focável porque rolava; sem scroll, um `tabIndex=0` sem função é ruído de a11y). O container vira o mesmo grid das outras duas seções (item 5).
- `IndexTasks/IndexFooter/IndexFooter.tsx` (container da lista de completadas) — remover `max-h-[calc(100vh-400px)] overflow-y-auto`.
- `IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx:61-66` — **fica** como o único scroll, com mais espaço: `max-h-[420px]` → `max-h-[560px]`, `pr-1` → `pr-2`, e `py-1` para o card de topo/base não colar na borda do scroll. Mantém `tabIndex={0}`, `role="region"`, `aria-label` (esse continua sendo scroll de verdade).

**Aceite (DOM, com 10 subtasks no grupo — ressalva da r1):** exatamente **um** elemento na página com `scrollHeight > clientHeight + 2` e `overflow-y` in (`auto`,`scroll`), e o `aria-label` dele é `"<título do grupo> subtasks"`.

Por que **10** e não 8: um card de subtask *não iniciada* mede ~110px (header `p-3` ≈ 44px + linha de ações com o `Select` `h-[48px]` ≈ 64px) e o `gap-3` soma 12px ⇒ 10 cards ≈ **1210px** contra `max-h-[560px]`. Com 8 já passaria de 560, mas a r1 mostrou que a conta de 8 ficava perto demais da folga (~530px na estimativa antiga) e **dependia de uma subtask estar ativa** para estourar. Com 10 o scroll aparece **sem** depender de nenhuma subtask ativa. Salvaguarda determinística no script: depois de criar as 10, asserta `scrollHeight > clientHeight + 2`; se (por qualquer diferença de fonte) não estourar, adiciona subtasks uma a uma (`QA-Sub-11`, `QA-Sub-12`, …) até estourar, com teto de 16 — se chegar a 16 sem estourar, é FAIL do próprio cenário e o teste reporta isso, não improvisa.

Screenshot `05-grupo-scroll` mostra um único trilho de scroll.

## Item 5 — listagem em 2 colunas  *(Q1 = opção (b): TUDO em 2 colunas)*

`IndexActiveTasksList.tsx`
- Os três containers de seção (Active l.77-89, Paused l.98-104, Pending l.112-118) usam o **mesmo** container: `<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start" data-tasks-section="active|paused|pending">`. Paused/Pending hoje não têm div própria (o `SortableContext` não renderiza DOM) — passam a ter. O `data-tasks-section` é o hook de DOM do item 2 (bloqueador 6) e vive **nesta** div.
- **Sem `col-span` para ninguém**: card de grupo e task simples ocupam uma célula cada, meia coluna (546px). O interior do grupo se acomoda pelas regras da **§ Meia coluna** — que são incondicionais, então valem também na coluna única de mobile.
- `renderSectionItems` não muda (nenhum wrapper de span é necessário).
- **`verticalListSortingStrategy` → `rectSortingStrategy`** nas três `SortableContext` da lista ativa (import de `@dnd-kit/sortable`). Em grid a estratégia vertical calcula os deslocamentos errados. `IndexGroupTasksList.tsx` **continua** com `verticalListSortingStrategy` (a lista de subtasks segue em coluna única dentro do card).

`IndexFooter.tsx` — o container das completadas também vira `grid grid-cols-1 lg:grid-cols-2 gap-3 items-start`, igualmente **sem** `col-span` para `IndexCompletedTaskGroup`.

**Aceite (o cenário foi reescrito para conseguir produzir este estado — bloqueador 4):**
- **Dois grupos lado a lado, na MESMA seção:** em `[data-tasks-section="active"]`, os cards de `QA-Grupo-Scroll` e `QA-Grupo-Par` têm `top` igual (±4px), `left` diferente e `width` entre 500 e 560px (1280/1440) ou 440–500px (1100). Os dois estão na seção `active` **por construção**: o cenário dá Play numa subtask de **cada** um, e `getGroupActivityStatus` classifica o grupo pela atividade dos filhos (`states/tasks/utils.ts:118-134`) — dois filhos rodando ⇒ dois grupos "active". `executeTask` **não** para as outras tasks (`states/tasks/index.ts:338-366`), então rodar duas ao mesmo tempo é possível e determinístico.
- **Duas tasks simples lado a lado:** em `[data-tasks-section="pending"]`, `QA-Task-Solta-C` e `QA-Task-Titulo-Muito-Comprido-…` (nenhuma das duas recebe Play ⇒ ambas "pending").
- **Seção Paused existe e também é 2 colunas** (bloqueador 5): `[data-tasks-section="paused"]` contém `QA-Grupo-Pausado` e `QA-Task-Solta-A` lado a lado (Play→Stop em cada ⇒ tem evento `start` e `isRunning=false` ⇒ "paused").
- **Footer:** o grid das completadas também tem 2 colunas, com `QA-Grupo-100` (grupo completado) e `QA-Task-Solta-B` (task solta completada) lado a lado.
- Nenhum card com `width` > 600px em 1280/1440. Em 390px todos os cards têm o mesmo `left` e `width` cheia.
- Drag-and-drop continua reordenando dentro da mesma seção (arrastar `QA-Task-Solta-C` sobre `QA-Task-Titulo-…` troca a ordem; arrastar entre seções diferentes não faz nada, como hoje).
- Screenshots `03-lista-2-colunas` (1280), `03b-1440-2-colunas`, `03c-1100-2-colunas` e `03d-paused-2-colunas`. Somam-se os 5 critérios da **§ Meia coluna** e a pergunta **J6** do gate visual.

## Item 6 — responsividade mobile

Alvos vindos de `responsivo.png` (as duas marcações vermelhas). **As mesmas regras da § Meia coluna resolvem mobile e meia coluna de uma vez** — são incondicionais, sem breakpoint:
1. **Linha de ações da task ativa** — `IndexTaskItem.tsx:254-294`: container `flex items-center justify-between gap-2` → `flex flex-wrap items-center justify-between gap-2`; o bloco da direita (l.273) `flex items-center gap-2 min-w-0` → `flex flex-wrap items-center justify-end gap-2 min-w-0 grow`; o wrapper do `IndexDebugTimer` (l.284) `flex-1 min-w-0` → **`w-full min-w-0`** (linha própria sempre, regra 1 da § Meia coluna).
2. **Tempos do item completado** — já coberto pelo item 2 (`flex-wrap` + `whitespace-nowrap` + `truncate` no título).
3. Header do card de task (l.160-193): `p-4` → `p-3 sm:p-4`; bloco do título `flex items-center gap-4 flex-1` → `flex items-center gap-3 flex-1 min-w-0`; `<span>` do título com `min-w-0 truncate` + `title={task.title}` (sai o `break-all`); `<Timer>` da subtask (l.184-186) `w-16 h-16` → `w-14 h-14 shrink-0` com `text-[11px]`.
4. `IndexDebugTimer.tsx:76` — `px-3 py-2` → `px-2 py-1.5 sm:px-3 sm:py-2` e o container ganha `w-full min-w-0` (acompanha a regra 1; o trilho de progresso `flex-1` passa a ter espaço garantido).
5. `IndexTasks.tsx` — `Box` `p-6` → `p-4 sm:p-6`; cabeçalho `flex items-start justify-between gap-4` → `flex flex-wrap items-start justify-between gap-4`.
6. `page.tsx` — `p-4` → `p-3 sm:p-4` no container externo.
7. Escopo A: ver item 7 (a fileira timer+stats empilha abaixo de `lg`).

**Aceite:** em 320px, 390px, 768px **e 1100px**, `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1` (zero scroll horizontal) **e** nenhum elemento com `scrollWidth > clientWidth + 2` dentro do card de Tasks; nenhum texto de tempo quebrado caractere-a-caractere (cada span de Start/End/Duration do footer com `height` ≤ 2×`lineHeight`). Screenshots `08-mobile-390-*`, `10-mobile-320-overflow` e `03c-1100-2-colunas`, mais a pergunta **J7** do gate visual.

## Item 7 — header (timer pequeno à esquerda, stats do lado, card só nas stats)

Leitura de `header.png`: o retângulo azul de cima (fileira do timer) e o de baixo (stats) são as duas regiões em discussão; o círculo vermelho pequeno à esquerda + os dois retângulos pequenos abaixo dele são o destino do timer 25:00 e do par de botões (Start + engrenagem); a seta que sai do bloco de estatísticas aponta para dentro da área vermelha grande à direita da fileira do timer = **as stats sobem para o lado do timer**. O card branco que hoje envolve tudo desaparece (confirmado por `01-grupo-vazio-desabilitado.png`, onde logo/nav e timer estão sem card e o card existe só nas estatísticas).

`src/pages/index/page.tsx` (l.67-75)
- **Remover o `<Box>`** que envolve `IndexHeader` + `IndexTimer` + `IndexScore` (e o import de `Box` se ficar órfão).
- Nova estrutura, preservando o comentário de l.59-66 e a regra de `IndexHeader` nunca desmontar:
  ```
  <IndexHeader showOnlyLogo={shouldBlockContent} />
  {hasInitializedPermissionStatus && !shouldBlockContent && (
    <div className="flex w-full flex-col lg:flex-row items-stretch gap-6">
      <IndexTimer />            // shrink-0, coluna estreita
      <IndexScore />            // flex-1, é quem carrega o Box
    </div>
  )}
  ```
- O gate de notificação (l.76-83) não muda.

`IndexHeader.tsx` — sem card por trás; ajustar só o padding (`pb-4 pt-2` → `pb-2 pt-2`) e permitir quebra em mobile: `flex w-full flex-wrap items-center justify-between gap-3`.

`IndexTimer.tsx`
- Raiz: `w-full` → `w-full lg:w-[200px] shrink-0 flex flex-col items-center gap-3`.
- Timer: `mx-auto h-56 w-56 text-4xl` → `h-32 w-32 text-2xl` (128px; em `header.png` o círculo pequeno mede ~⅗ do atual).
- Container dos botões: `pt-4 flex flex-col gap-4 px-4` → `w-full flex flex-col gap-2`; **todo** grupo de botões passa a ser `flex flex-wrap gap-2 w-full` com botões `flex-1 min-w-[84px] py-1.5 text-sm font-bold` (hoje são `w-full py-2 text-base font-medium`) — **`font-bold` e `text-sm` (14px) são obrigatórios**, não estética: é o invariante compartilhado da § Footprints (primary `bg-Green-500` = 3,77:1 só passa como texto grande) — em overtime são 6 botões, que assim quebram em 2 colunas dentro dos 200px em vez de empilhar 6 linhas. Botões só de ícone (`Settings`, `RotateCcw`) ficam `px-2 py-1.5 shrink-0 flex-none`.
- `UpdateTimerDialog` não muda.

`IndexScore.tsx`
- Passa a ser **o** card: raiz `<div className="w-full">` → `<Box className="w-full flex-1 p-4 sm:p-6">` (importar `Box` de `../../../layout/components/atoms/Box`).
- Grid: `grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6` → `grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5`. **Só o `gap-y` muda**: o grid não tem `sm:grid-cols-3` e não pode ganhar (8 tiles em 3 colunas deixariam 2 órfãos numa terceira linha). Em 768px são 4 colunas de ~180px, que ainda acomodam "TASKS COMPLETED" (~105px).
- Rótulos continuam `text-Black-450 dark:text-Black-400` — **o par `dark:` é obrigatório** (premissa 1: `Black-450` novo dá 2,30:1 sobre `Black-700`); valores continuam `text-Black-700 dark:text-White`.
- Os 8 ícones de chip (`text-Yellow-400`/`Blue-400`/`Green-400`/`Red-400` sobre `bg-*-100`) **não mudam de cor**: estão na isenção fechada de § Política de contraste (C), como ícone decorativo com rótulo em texto ao lado.

**Aceite (geometria + DOM, viewport 1280):**
- O elemento do timer **não** tem nenhum ancestral com `border-radius: 24px` (o `Box`); o grid de stats **tem**. Só existe **um** `Box` acima da dobra (o das stats) além do card de Tasks.
- `timer.getBoundingClientRect()`: `width` ≤ 160px e `right` < `statsCard.left` (timer à esquerda das stats, mesma fileira: `|timer.top − statsCard.top|` ≤ 24px).
- Botão `Start`: `width` ≤ 240px e `height` ≤ 40px (era largura total do card).
- As 8 estatísticas continuam presentes e em 4 colunas × 2 linhas.
- Em 390px a fileira empilha (timer acima, stats abaixo) e as stats ficam em 2 colunas × 4 linhas; em 768px, 4 colunas × 2 linhas, sem tile órfão.
- Screenshots `01-header-desktop` (comparar com `header.png`) e `08-mobile-390-header`.

---

## Fora de escopo (não mexer)

- Qualquer coisa em `src/pages/index/components/IndexTasks/IndexReportsDialog/**` além da troca de token do item 1.
- `IndexWorkflowDialog` (nem token — não tem `text-Black-400` sem `dark:`).
- `UpdateTimerDialog` e `IndexNotificationRequest`: **só** a troca/reparo de token do item 1 (agora são do escopo B, § Footprints); nenhuma mudança estrutural.
- Atoms `Input`/`Select`/`Button`/`ProgressBar`: **só** as classes de cor listadas no item 1 (no `Button`, só o objeto `variantStyles`; no `ProgressBar`, só o literal do `dark:` da l.16). Nada de mudar altura, raio, borda, padding, API ou comportamento.
- Persistir o timer global; qualquer mudança em stores, hooks, tipos ou cálculo de score.
- Criar tokens novos, `tailwind.config.*`, biblioteca de UI, testes automatizados no repo.
- Remover métricas de estatística (premissa 3) e mexer no dark mode além dos pares `dark:` das classes já tocadas.
- **Mudar os *valores* dos tokens de acento** em `global.css` (`--color-Green-400`, `--color-Yellow-*`, `--color-Red-*`, `--color-Blue-*`) e **criar token novo** — proibido. O que é **permitido e exigido** pelo item 1 é *trocar qual token existente uma classe referencia* nos 3 pontos medidos (`Button` primary/secondary, disco de completo, `text-Blue-500` do Debug). Fora desses 3 pontos, a palheta de acento e a cor dos ícones **não** se tocam — justificativa fechada em § Política de contraste (C).
- **Mudar cor de borda/ring** (`border-Black-100` etc.) por motivo de contraste — consequência aceita e registrada em § Política de contraste (B).

## Verificação obrigatória antes de fechar a implementação

- `npx tsc --noEmit` com exit 0. `tsconfig.json:19` tem `noUnusedLocals: true` (ressalva da r1 respondida: **o tsc pega** import/variável órfã dos blocos removidos nos itens 2, 4 e 7).
- O que o tsc **não** pega e por isso é obrigação explícita do escopo B: o `GroupTitleContext.Provider` sem consumidor. O item 2 manda remover o Provider **e apagar** `GroupTitleContext.ts`.
- `grep -rnoP '[-\w:\[\]]*\btext-Black-(100|200|400)\b' src/ | grep -v 'dark:'` **tem de sair vazio** (ressalva (b) da r2: o `grep -rn … | grep -v "dark:"` anterior era line-based e ignorava a linha inteira quando havia qualquer `dark:` nela — foi assim que `IndexReportsTabs.tsx:28` passou batido). Bordas/backgrounds (`border-Black-100`, `bg-Black-100`) não casam o padrão e continuam como estão.
- `grep -rnoP '[-\w:\[\]]*\btext-Black-450\b' src/` — **toda** linha de resultado tem de ter também `dark:text-Black-400`/`dark:placeholder:text-Black-400`/`dark:data-placeholder:text-Black-400` na mesma `className` (o par é obrigatório; `#556070` sobre `Black-700` = 2,30:1).
- `grep -rn 'bg-Green-400\|bg-Blue-400' src/layout/components/atoms/Button/index.tsx` vazio, `grep -rn 'text-Blue-500' src/pages/index/components/IndexTasks/` vazio e `grep -rn 'dark:text-Black-300' src/layout/components/atoms/ProgressBar/index.tsx` vazio (as correções do bloqueador 2 da r2 realmente aplicadas).

---

## Cenário / preset do teste de sistema

Não existe seed nem fixture no repo: **todos os dados são criados via UI real** pelo script. Base pronta para reaproveitar: `.claude/tasks/2026-09-06_layout-task-card/tests-01/run.js` (301 linhas) — já tem o shim de permissão, os helpers e o fluxo de completar task.

Setup:
- `npm run dev` (Vite, porta fixa **1420**, `strictPort`), aguardar o placeholder `"Add a task... (use > to create a group)"`.
- MCP `mcp__playwright__browser_*` estava quebrado neste host nas 2 rodadas anteriores → usar Node + Playwright standalone (`npm i --no-save --prefix /tmp/pw playwright@1.63.0`, `executablePath: "/opt/ms-playwright/chromium-1243/chrome-linux64/chrome"`).
- **Obrigatório antes do `goto`:** `context.addInitScript(() => Object.defineProperty(window.Notification, "permission", { value: "granted" }))`, senão a UI fica atrás do gate de notificação.
- Viewports usados: **1280×900** (principal), **1440×900**, **1100×900** (faixa não-saturada do `max-w-6xl`), **390×844** (mobile) e **320×844** (só prova de overflow). Dark mode = clicar o toggle do header (`document.documentElement.classList` recebe `dark`, `useDarkMode.ts:29`).

### Mecânica que o script tem de respeitar (verificada no código, não suposta)
1. **Play de task exige o timer global rodando**: `handleToggleTaskTimer` só chama `executeTask` se `isGlobalTimerRunning && !isResting` (`IndexTaskItem.tsx:76-88`); senão dispara "Global timer is not running". ⇒ **clicar `Start` do timer global ANTES de qualquer Play.**
2. **Botão Check da task só existe enquanto o timer da task está rodando** (`IndexTaskItem.tsx:222-232`, dentro de `{isTimerActive && ...}`). ⇒ completar uma task é sempre **Play → Check**, nessa ordem, sem Stop no meio.
3. **Check/Pencil/Trash do card de GRUPO estão dentro de `opacity-0 group-hover:opacity-100`** (`IndexTaskGroup.tsx:108`) e o Check é `disabled` até `canCompleteGroup` (todos os filhos completos). ⇒ para completar o grupo: **`hover()` no card do grupo** e só então clicar o Check.
4. **Várias tasks podem rodar ao mesmo tempo**: `executeTask` não para as outras (`states/tasks/index.ts:338-366`). É isso que permite ter dois grupos "active" simultâneos.
5. **Classificação de seção** (`useListingTasks.ts:36-48` + `states/tasks/utils.ts:106-134`): task com `isRunning` ⇒ `active`; task com evento `start` e parada ⇒ `paused`; task sem evento ⇒ `pending`. Grupo herda pelo filho **mais ativo**.

### Criação dos dados, via UI (ordem obrigatória)
1. **Screenshots `00`** (light/dark × 1280/390) — app recém-aberto, zero tasks.
2. Input principal: `QA-Task-Solta-A` + Enter.
3. `QA-Task-Solta-B` + Enter.
4. `QA-Task-Solta-C` + Enter.
5. `QA-Task-Titulo-Muito-Comprido-Para-Provar-Truncate-Com-Ellipsis-No-Card` + Enter (prova a regra 2 da § Meia coluna).
6. `>QA-Grupo-Scroll` + Enter; dentro dele, input "Add a task..." × **10** (`QA-Sub-01..10`), com a salvaguarda do item 4 (adicionar até `scrollHeight > clientHeight + 2`, teto 16).
7. `>QA-Grupo-Par` + Enter; 2 subtasks (`QA-Par-1`, `QA-Par-2`).
8. `>QA-Grupo-Pausado` + Enter; 2 subtasks (`QA-Pau-1`, `QA-Pau-2`).
9. `>QA-Grupo-100` + Enter; 2 subtasks (`QA-100-A`, `QA-100-B`).
10. **`Start` do timer global** (mecânica 1).
11. **Grupo completado:** em `QA-100-A`: Play → Check. Em `QA-100-B`: Play → Check. Depois `hover()` no card `QA-Grupo-100` → clicar o Check do grupo (mecânica 3) ⇒ grupo completo, vai para o footer com as 2 subtasks completadas (que **têm** badge de grupo).
12. **Task solta completada (bloqueador 5):** em `QA-Task-Solta-B`: **Play → Check** ⇒ vai para o footer **sem** badge. É o caso que prova que o badge só aparece quando há grupo (`tasks-completadas.png`).
13. **Seção Paused (bloqueador 5):** em `QA-Pau-1`: **Play → Stop** (`svg.lucide-square`). Em `QA-Task-Solta-A`: **Play → Stop**. ⇒ `QA-Grupo-Pausado` e `QA-Task-Solta-A` caem na seção **Paused**, dois cards, lado a lado.
14. **Seção Active com DOIS grupos (bloqueador 4):** Play em `QA-Sub-01` (dentro de `QA-Grupo-Scroll`) **e** Play em `QA-Par-1` (dentro de `QA-Grupo-Par`) ⇒ os dois grupos ficam "active" na **mesma** seção (mecânicas 4 e 5) e o critério (v) da § Meia coluna é produzível. *(Era exatamente isso que faltava na r1: com Play só em `QA-Sub-01`, o outro grupo ficava em "pending" e nunca havia dois grupos lado a lado.)*
15. **Estado final esperado, verificado por asserção antes dos screenshots** (se não bater, FAIL do cenário, não do produto):
    - `[data-tasks-section="active"]` ⇒ 2 cards: `QA-Grupo-Scroll`, `QA-Grupo-Par`.
    - `[data-tasks-section="paused"]` ⇒ 2 cards: `QA-Grupo-Pausado`, `QA-Task-Solta-A`.
    - `[data-tasks-section="pending"]` ⇒ 2 cards: `QA-Task-Solta-C`, `QA-Task-Titulo-Muito-Comprido-…`.
    - footer ⇒ 2 cards: `QA-Grupo-100` (grupo completado) + `QA-Task-Solta-B` (task solta completada).
16. Expandir o footer clicando em "N of M completed".

### Screenshots obrigatórios (todos `fullPage`, em `tests-{NN}/screenshots/`)
Cobertura de **todos os tipos de task**: estado vazio, task simples (pendente, ativa e **pausada**), grupo com subtasks (colapsado, expandido e com scroll), **grupo pausado**, task completada de grupo (com badge), **task solta completada (sem badge)** e grupo completado — cada um em **light e dark** e em **desktop e mobile**.

| # | nome | o que precisa aparecer |
|---|---|---|
| 00 | `00-estado-vazio` | app recém-aberto, zero tasks — header novo + card de Tasks com "No tasks yet. Add one above!" |
| 01 | `01-header-desktop` | timer pequeno à esquerda + botões pequenos + card de stats ao lado; nav e timer sem card (J5) |
| 02 | `02-tasks-simples` | seção Pending com 2 tasks simples + seção Active com task rodando (linha de ações + Debug em linha própria) |
| 03 | `03-lista-2-colunas` @1280 | duas tasks simples lado a lado (Pending) **e** dois cards de grupo lado a lado (Active), cada um em meia coluna |
| 03b | `03b-1440-2-colunas` @1440 | idem em 1440px (meia coluna continua 546px por causa do `max-w-6xl`) |
| 03c | `03c-1100-2-colunas` @1100 | idem em 1100px, faixa em que o `max-w-6xl` **não** satura (meia coluna ~490px) — prova de zero overflow |
| 03d | `03d-paused-2-colunas` | **seção Paused** com `QA-Grupo-Pausado` e `QA-Task-Solta-A` lado a lado (item 5 também altera essa seção) |
| 04 | `04-grupo-expandido` | grupo em meia coluna: sem badge de grupo na subtask, sem Start/End/Duration, cantos/bordas corretos, título truncado com ellipsis, Debug em linha própria (J1, J3) |
| 04b | `04b-grupo-colapsado` | mesmo grupo colapsado (só header + progresso), bordas corretas |
| 05 | `05-grupo-scroll` | `QA-Grupo-Scroll` com 10 subtasks: um único scroll, interno, com folga |
| 06 | `06-footer-expandido` | footer aberto, em 2 colunas: grupo completado `QA-Grupo-100`, subtasks completadas com **badge ao lado do nome** e **tempos na linha de baixo**, e `QA-Task-Solta-B` completada **sem badge** (J2) |
| 07 | `07-dark-{00,01,02,03,03d,04,04b,05,06}` | **os nove estados acima** repetidos em dark mode (toggle do header) |
| 08 | `08-mobile-390-{00,01,02,03,03d,04,04b,05,06}` | os nove estados em 390×844 (coluna única), sem overflow horizontal (J7) |
| 09 | `09-mobile-390-dark-{00,04,06}` | dark + mobile: estado vazio, grupo expandido e footer expandido |
| 10 | `10-mobile-320-overflow` | 320px, prova de `scrollWidth == clientWidth` |

### Condição de PASS do teste de sistema (tudo, sem exceção)
1. Uma linha por item 1..7 no `verdict.md`, com o resultado da asserção de DOM do "Aceite" daquele item.
2. Uma linha por cada um dos 5 critérios da **§ Meia coluna** (medidos em 1280, 1440 e 1100).
3. `auditContrast()` **não lança** e retorna `[]` nas **16** execuções (4 telas × light/dark × 1280/390) — gate (D2). Uma exceção do auto-teste do normalizador de cor é **FAIL**, nunca "passou"; o `verdict.md` registra as 16 execuções com o retorno literal.
4. As **7 linhas J1..J7** do gate de julgamento visual (E), cada uma com PASS/FAIL + motivo, escritas no `verdict.md`. Qualquer FAIL, ou qualquer linha ausente, ⇒ FAIL do teste.
5. As asserções de estado do passo 15 do cenário (se elas falharem, o problema é o script; conserta o script e roda de novo, não relaxe o critério).

Modo de teste recomendado: **browser** (Docker/`.test` não se aplica — não há suíte no repo e a entrega é 100% visual).
