# Verdict — layout-melhorias-ui, tests-01

## VEREDITO: FAIL

Motivo em uma frase: os 7 itens do usuário, os 16 `auditContrast()` e o gate visual J1..J7 passam
integralmente e o check pontual da borda verde em dark mode confirma o fix — mas o levantamento
formal e objetivo do próprio plano encontrou 3 violações reais (não maquiadas, não relaxadas):
overflow horizontal em 320px numa linha do footer, um card-dentro-de-card residual nos atoms
`Select`/`Button` (item 3, critério 3) e a meia-coluna em 1100px 3px acima do teto especificado.
Nenhuma delas está escondida do usuário — estão descritas abaixo com número medido e
screenshot/`file:line`.

Metodologia: Node + Playwright standalone (`chromium-1243`), não MCP — conforme o próprio plano
determina ("MCP quebrado nas 2 rodadas anteriores"). Script em
`/tmp/claude-1000/-root-so-repos-timertasks-timertask-desktop-tree-1/598a76e0-5839-4063-8096-6e0528e6ed91/scratchpad/run.js`.
Alternância de tema feita via `document.documentElement.classList.toggle("dark")` diretamente (efeito
idêntico ao clique no toggle real: `useDarkMode.ts:25-33` só faz isso) — mais determinístico que
achar o botão do toggle a cada rodada, sem qualquer diferença de resultado CSS.

---

## Cenário — asserção do passo 15 (obrigatória antes dos screenshots)

```
active: ["QA-Grupo-Scroll ...", "QA-Grupo-Par ..."]   → 2 cards ✅ (esperado: Scroll, Par)
paused: ["QA-Task-Solta-A ...", "QA-Grupo-Pausado ..."] → 2 cards ✅ (esperado: Pausado, Solta-A)
pending: ["QA-Task-Solta-C ...", "QA-Task-Titulo-Muito-Comprido..."] → 2 cards ✅
footer: { hasGrupo100: true, hasSoltaB: true } ✅ (grupo completo + task solta completada, footer expandido)
scrollSubtaskCount: 10 (não precisou do teto de 16 — 10 subtasks já estouram o scroll)
```
Todas batem com o script do § Cenário. **PASS** do cenário — nenhuma FAIL aqui vira "problema do
produto".

---

## Itens 1–7 (uma linha cada, com evidência)

**1. Contraste** — `auditContrast()` retornou `[]`, sem lançar, nas 16 execuções (ver tabela abaixo).
J3/J4 escritas. **PASS.**

**2. Start/End/Duration e badge de grupo** — DOM: `badStartEndDurCount: 0` em
`[data-tasks-section] *` (3 seções, `sectionsCount: 3`, seletor não-vazio). Footer:
`QA-100-A` mostra badge `QA-Grupo-100` **na mesma linha** do título e `Start/End/Duration` **na
linha de baixo** (confirmado visualmente em `06-footer-expandido.png`); `QA-Task-Solta-B`
(completada, sem grupo) **não** tem badge, mesmo layout de tempos abaixo. **PASS.**

**3. Bordas do card** — geometria: `overflow: hidden`, `border-radius: 12px` na raiz;
`border-radius: 0px`, `border-width: 0px` no header — **PASS** nesse sub-critério.
Terceiro critério formal (nenhum descendente com borda nos 4 lados + mesmo `effBg` do pai): rodei o
`effBg()` do próprio auditor contra os descendentes do card `QA-Grupo-Par` e do card de task
`QA-Sub-01`. Resultado: **3 violações** — todas são o mesmo padrão, o botão-trigger do atom
`Select`/`Button` (`class="border border-Black-100 bg-White outline-none transition-all"`, 2 no
card de grupo, 1 no card de task). Não é o "card dentro de card" que o item 3 diagnosticou
(sem halo/costura visível — comparar com `04-grupo-expandido.png`, sem os artefatos marcados em
`grupo-0.png`/`grupo-2.png`); é um controle de formulário legítimo com borda de affordance nos 4
lados, cuja cor de fundo (`bg-White`) coincide com o fundo branco da linha de ações (que o próprio
item 3 tornou branca). O texto do plano só abre exceção explícita para `border-t` de 1 lado (linha
de ações / corpo do grupo) — não para atoms `Select`/`Button`. Pela letra do critério: **FAIL**
(3 ocorrências, arquivo: `src/layout/components/atoms/Select` / `Button` — a classe é gerada por
esses atoms, usados em `IndexAlertSelect`/`Add` do grupo). Lead para o próximo round: ou o plano
precisa nomear essa exceção adicional, ou o critério formal precisa de um `:not(button):not(select)`.

**4. Só o scroll interno do grupo** — exatamente **1** elemento com `scrollHeight > clientHeight+2`
e `overflow-y` auto/scroll na página inteira, `aria-label = "QA-Grupo-Scroll subtasks"`. **PASS.**

**5. Listagem em 2 colunas** — `QA-Grupo-Scroll` e `QA-Grupo-Par` na seção `active`: `top` 358≈358
(1280) / 415≈415 (1440, 1100), `left` 89≠646 (1280), largura 545px (1280) e 545px (1440) — dentro de
500–560px. Em **1100px: largura 503px** (esperado 440–500px pelo plano) — **3px acima do teto**.
Ver "§ Meia coluna" abaixo. Nenhum card > 600px em 1280/1440 (max medido 545px). Drag-and-drop não
testado neste round (fora do escopo visual dos 7 itens; ver Handoff se necessário). **PASS com
ressalva** (o desvio de 3px em 1100 é o mesmo achado do item da § Meia coluna).

**6. Responsividade mobile** — 390/768/1100: `scrollWidth == clientWidth` e **zero** elementos com
overflow sem ellipsis dentro do card de Tasks. Em **320px**: `document.documentElement.scrollWidth
(320) == clientWidth (320)` (nível de página, OK), **mas 9 elementos** dentro do footer (linha
completada) têm `scrollWidth > clientWidth+2` **sem** `text-overflow: ellipsis` — ex.:
`div.flex.items-center.gap-4` (título+badge) `sw=179 cw=166`, `div.flex.flex-wrap.items-center`
(linha Start/End/Duration) `sw=103 cw=90`, nos itens `QA-Task-Solta-B` e `QA-100-A`. **FAIL** em
320px — lead: `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx:37-70`
(o bloco `flex items-center gap-4 flex-1 min-w-0` com ícone+badge+coluna de textos aperta demais em
320px mesmo com `flex-wrap`/`whitespace-nowrap`, porque um único `<span>` como "Start 04:15:02 PM"
é mais largo que o espaço restante do container quando badge+título já consumiram a linha).
Nenhum tempo empilhado letra-a-letra em 390 (`timeSpansBad: 0`). Screenshot `10-mobile-320-overflow.png`
mostra o rodapé; a olho o overflow de ~13px é sutil (não visualmente óbvio no fullPage), mas é real
pela medição do DOM. **FAIL** (only at 320px; 390/768/1100 limpos).

**7. Header** — `boxCount: 2` (stats + card de Tasks, nenhum outro `rounded-[24px]` acima da dobra);
timer (`.h-32.w-32`) sem ancestral `rounded-[…]`; `timerRect.width=128px` (≤160 ✓), `timerRect.right
(228) < statsRect.left (288)` ✓, `|timerRect.top − statsRect.top| = 0` (≤24 ✓); botão do timer
(`Stop`, rótulo variável por estado) `width=200px height=32px` (≤240/≤40 ✓); 8 estatísticas em 4×2
confirmadas visualmente (`01-header-desktop.png`). **PASS.**

---

## § Meia coluna — 5 critérios (1280 / 1440 / 1100)

| # | critério | 1280 | 1440 | 1100 |
|---|---|---|---|---|
| 1 | zero overflow horizontal interno (`scrollWidth<=clientWidth+2`) | `overflowElsCount=1` (com ellipsis, ok) | `overflowElsCount=1` (com ellipsis, ok) | `overflowElsCount=1` (com ellipsis, ok) |
| 2 | zero texto cortado sem ellipsis | `overflowElsWithoutEllipsisCount=0` ✅ | `=0` ✅ | `=0` ✅ |
| 3 | zero sobreposição de controles na linha de ações (Sub-01) | `overlapPairsInActionRow=0` ✅ | não medido (mesmo estado) | não medido |
| 4 | Debug em linha própria | confirmado visualmente em `02`/`04` (barra cheia abaixo do Select) ✅ | idem | idem |
| 5 | 2 grupos lado a lado: `top` igual, `left` diferente, `width` na faixa | `top 358/358, left 89/646, width 545/545` (faixa 500–560) ✅ | `top 415/415, left 169/726, width 545/545` ✅ | `top 415/415, left 41/556, width 503/503` — **faixa esperada 440–500, medido 503 (+3px)** ⚠️ FAIL por 3px |

Critério 5 em 1100 é o único fora do intervalo declarado no plano — por margem pequena (3px), mas
"NEVER WEAKEN THE TEST": reporto como está, não arredondo a favor do PASS.

---

## `auditContrast()` — 16 execuções (gate D2)

Nenhuma lançou (auto-teste do normalizador de cor passou em todas). Todas retornaram `[]`.

| # | tela | tema | viewport | resultado |
|---|---|---|---|---|
| 1 | 00-estado-vazio | light | 1280 | `[]` |
| 2 | 00-estado-vazio | dark | 1280 | `[]` |
| 3 | 00-estado-vazio | dark | 390 | `[]` |
| 4 | 00-estado-vazio | light | 390 | `[]` |
| 5 | 02-tasks-simples | light | 1280 | `[]` |
| 6 | 02-tasks-simples | dark | 1280 | `[]` |
| 7 | 02-tasks-simples | light | 390 | `[]` |
| 8 | 02-tasks-simples | dark | 390 | `[]` |
| 9 | 04-grupo-expandido | light | 1280 | `[]` |
| 10 | 04-grupo-expandido | dark | 1280 | `[]` |
| 11 | 04-grupo-expandido | light | 390 | `[]` |
| 12 | 04-grupo-expandido | dark | 390 | `[]` |
| 13 | 06-footer-expandido | light | 1280 | `[]` |
| 14 | 06-footer-expandido | dark | 1280 | `[]` |
| 15 | 06-footer-expandido | light | 390 | `[]` |
| 16 | 06-footer-expandido | dark | 390 | `[]` |

16/16 `[]`, 0 lançamentos. **Gate (D2): PASS.**

---

## Verificação pontual — borda do card ativo em dark mode (Green-400 vs Black-600)

Medido em dark mode com `QA-Sub-01` rodando (Play, nunca parado) vs `QA-Sub-02` (irmã, parada):

```
activeBorderColor:   rgb(16, 185, 129)   ← Green-400 (#10B981), CORRETO
activeClassName:      "... dark:border-Black-600 ... border-Green-400 dark:border-Green-400"
inactiveBorderColor: rgb(45, 55, 72)     ← Black-600 (#2D3748), CORRETO
inactiveClassName:    "... dark:border-Black-600 ... border-Black-100 hover:border-Green-400/50"
```

Confirma exatamente o que o prompt pediu para verificar: com os dois `dark:border-*` de
especificidade igual (`dark:border-Black-600` da base e `dark:border-Green-400` da condicional),
a ordem de emissão do CSS favorece `dark:border-Green-400` quando ambas as classes estão presentes
(task ativa) — o card ativo fica verde, o inativo continua com a borda escura padrão. **PASS.**
Screenshot: `border-check-dark-active-vs-inactive.png`.

---

## Gate de julgamento visual (E) — J1..J7

**J1** — `04-grupo-expandido.png` (light) × `grupo-0.png`: **PASS.** O badge de grupo ao lado do
título da subtask sumiu, a linha Start/End/Duration sumiu, e os cantos do card (inferior e
superior) não mostram mais o halo/costura cinza-sobre-cinza da referência — a subtask `QA-Sub-01`
tem borda verde limpa de canto a canto, sem moldura cinza em volta.

**J2** — `06-footer-expandido.png` (light) × `tasks-completadas.png`: **PASS.** O badge
`QA-Grupo-100` fica na mesma linha do título de `QA-100-A`/`QA-100-B`, os tempos (Start/End/
Duration) ficam na linha de baixo, sem o empilhamento/wrap que a referência marca em vermelho.
`QA-Task-Solta-B` (completada, sem grupo) aparece **sem** badge, confirmando a condicionalidade.

**J3** — `04`/`06` (light): **PASS.** "N of M completed", "Progress", "0%", "No tasks yet." (não
aplicável neste cenário populado, mas o tom de cinza dos rótulos e do placeholder "Add a task..." é
o mesmo `text-Black-450`/`dark:text-Black-400` medido em 0 violações), os tempos do footer e o
placeholder são confortavelmente legíveis a olho nas capturas — não "tecnicamente passa mas
apagado".

**J4** — `04`/`02` (light e dark): **PASS.** Play (verde), Pencil (amarelo), Trash (vermelho), Bell
(amarelo, dentro do Select "5 min") continuam claramente distinguíveis do fundo branco/escuro nas
capturas — nenhum ícone se confunde com o fundo a olho, mesmo sabendo que a isenção (C) os deixa
abaixo de 3:1 formalmente.

**J5** — `01-header-desktop.png` × `header.png`: **PASS.** Timer é um círculo pequeno (128px) à
esquerda com o botão (Start/Stop) pequeno abaixo dele; as estatísticas ficam à direita, na mesma
fileira (mesmo `top`); o card branco (`Box`, `rounded-[24px]`) existe só em volta das estatísticas
— logo, nav e timer não têm fundo de card.

**J6** — `03-lista-2-colunas.png` / `03b-1440-2-colunas.png`: **PASS, com a ressalva já aceita no
plano.** Duas colunas de verdade, com dois cards de grupo (`QA-Grupo-Scroll`, `QA-Grupo-Par`) lado a
lado; o interior de cada grupo em meia coluna parece respirado — inputs, botões e o widget Debug têm
espaço, nada colado ou estourando visualmente (a única falha object medida, em 1100, é 3px de
largura acima do teto declarado — não visível a olho). O buraco vertical abaixo de `QA-Grupo-Par`
(mais curto que `QA-Grupo-Scroll`) é o comportamento aceito do `items-start`, conforme o plano.

**J7** — `08-mobile-390-*` × `responsivo.png`: **PASS.** As duas marcações vermelhas da referência
não se repetem: o widget Debug ocupa a linha inteira sozinho (sem cramping com o Select), e nenhum
span de tempo (`Start`/`End`/`Duration`) empilha letra-a-letra (`timeSpansBad: 0` em 390px, e as
capturas mostram as três linhas de tempo bem formadas). **Nota:** a 320px (fora do que J7 pede, que
é 390px) existe uma sobra de ~13px sem ellipsis no rodapé (ver item 6) — não invalida J7, que é
especificamente sobre 390px, mas é um FAIL separado já registrado no item 6.

**Regra do gate (E):** nenhum FAIL em J1..J7 → mas dois achados objetivos (itens 3 e 6, e o desvio
de 3px da § Meia coluna) mantêm o veredito geral em FAIL mesmo com J1..J7 todas PASS — o gate visual
não é o único critério de aceite.

---

## Screenshots (todos em `tests-01/screenshots/`, cópia local; fullPage)

```
00-estado-vazio.png                 01-header-desktop.png              02-tasks-simples.png
03-lista-2-colunas.png              03b-1440-2-colunas.png             03c-1100-2-colunas.png
03d-paused-2-colunas.png            04-grupo-expandido.png             04b-grupo-colapsado.png
05-grupo-scroll.png                 06-footer-expandido.png
07-dark-00.png  07-dark-01.png  07-dark-02.png  07-dark-03.png  07-dark-03d.png
07-dark-04.png  07-dark-04b.png  07-dark-05.png  07-dark-06.png
08-mobile-390-00.png  08-mobile-390-01.png  08-mobile-390-02.png  08-mobile-390-03.png
08-mobile-390-03d.png  08-mobile-390-04.png  08-mobile-390-04b.png  08-mobile-390-05.png
08-mobile-390-06.png
09-mobile-390-dark-00.png  09-mobile-390-dark-04.png  09-mobile-390-dark-06.png
10-mobile-320-overflow.png
border-check-dark-active-vs-inactive.png
```
34 arquivos, cobrindo: estado vazio, task simples (pendente/ativa/pausada), grupo expandido/
colapsado/com scroll, grupo pausado, task completada de grupo (com badge), task solta completada
(sem badge) e grupo completado — cada um em light/dark × desktop/mobile, conforme exigido.

Console do browser: **0 erros** (filtrado ruído de DevTools/source-map) nas 34 capturas + interações.

---

## Console de erros / bloqueadores não relacionados ao produto

Nenhum. Script rodou do início ao fim sem exceção (`exit=0`), sem overlay de erro do Vite.

---

## Resumo para o próximo round (se for aberto)

1. `IndexCompletedTaskItem.tsx:37-70` — em 320px, a linha título+badge (`sw 179 vs cw 166`) e a
   linha Start/End/Duration (`sw 103 vs cw 90`) do item completado ainda excedem o container em
   ~9-13px sem ellipsis. 390px já está limpo; o problema é específico de 320px.
2. Item 3, terceiro critério formal — decidir se os atoms `Select`/`Button` (borda-de-affordance nos
   4 lados) ganham exceção explícita no plano, ou se o componente precisa de ajuste (ex.: remover a
   borda quando o fundo já é branco). Sem essa decisão, o critério formal como escrito continua
   reprovando 3 nós que visualmente não são "card dentro de card".
3. § Meia coluna, critério 5 em 1100px — card de grupo mede 503px contra o teto de 500px do plano
   (3px). Ou o plano ajusta o teto para ~505px, ou o padding/gap do layout em 1100px precisa de um
   ajuste mínimo.
