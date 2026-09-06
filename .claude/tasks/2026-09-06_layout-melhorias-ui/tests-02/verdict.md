# Verdict — layout-melhorias-ui, tests-02

## VEREDITO: PASS

Motivo: os 4 requisitos da rodada estão provados com número medido. O fix de 320px
(`IndexCompletedTaskItem.tsx`, commit `829d69f`) elimina o bug real de tests-01 (texto sob o botão de
nota, título colapsando para "QA-..."). Os 3 critérios emendados no plan.md pós-tests-01 foram
remedidos com a regra nova e passam. As 3 lacunas de rigor cobradas pelo revisor (critério 3 em
1280/1440/1100, J3 substantiva, honestidade de screenshot) foram fechadas. Os 7 itens do usuário +
16 `auditContrast()` + borda verde em dark foram re-confirmados nesta rodada (não herdados).

Metodologia: Node + Playwright standalone (`chromium-1243`, headless), mesmo approach de tests-01
(MCP Playwright real está reconectando neste host — testei `browser_tabs list` com sucesso — mas
mantive o script headless para não redimensionar a janela real do Chrome do usuário 5x via extensão,
e por consistência com o método já sancionado no plano). Script:
`/tmp/claude-1000/-root-so-repos-timertasks-timertask-desktop-tree-1/598a76e0-5839-4063-8096-6e0528e6ed91/scratchpad/run2.js`.
Achado de higiene do PRÓPRIO teste (não é bug do produto, corrigido no script): a primeira rodada do
script produziu 5 falsas violações de contraste no botão "Add" (verde) porque o cursor sintético do
Playwright ficava fisicamente sobre um elemento após um clique anterior e o `:hover` (`hover:bg-Green-400`)
permanecia ativo durante a auditoria seguinte — o próprio plano exclui hover/focus do gate (D2/(B)).
Corrigido com `page.mouse.move(0,0)` antes de cada screenshot/auditoria; re-rodado, resultado abaixo.

---

## Item 1 — 320px consertado

- **Texto sob o botão de nota:** 0 ocorrências. `overlapsActions=false` e `timesOverlapsActions=false`
  para `QA-Task-Solta-B` (sem badge) e `QA-100-A` (com badge) — bounding-rect da linha título+badge e
  da linha Start/End/Duration não intersectam mais o bloco de ações (botão de nota + chevron).
- **Overflow (`scrollWidth<=clientWidth+2`) na linha título+badge e na linha tempos:** 0/2 casos —
  `titleRow {sw:166,cw:166}`, `timesRow {sw:134,cw:134}` para ambos os itens (antes: `sw 179 vs cw 166`
  e `sw 103 vs cw 90`).
- **Título com ellipsis de verdade quando corta:** `QA-Task-Solta-B` (sem badge) não corta —
  `titleSpan {sw:112,cw:112}`, texto completo visível. `QA-100-A` (com badge) sofre um corte
  **sub-pixel** honesto de registrar: `canvas.measureText` mede o texto em 65,98px contra um
  `clientWidth` de 65,70px (a diferença de ~0,3px é invisível na leitura inteira `scrollWidth<=
  clientWidth+2`, por isso não aparece como violação no gate formal) — o Chrome ainda assim aplica
  `text-overflow:ellipsis` porque a comparação real é sub-pixel, mostrando "QA-100..." em vez de
  "QA-100-A". Não é regressão do fix (a causa original — botão empurrando o texto — está morta) nem
  viola o item 6 (ellipsis renderiza de verdade, `title=` preserva o texto completo); é a mesma
  degradação graciosa que a regra 2 da § Meia coluna já autoriza para badges. Screenshots:
  `10b-mobile-320-footer-crop-sem-badge.png` (limpo) e `10c-mobile-320-footer-crop-com-badge.png`
  (título "QA-100..." + badge "QA-..." truncados, sem overlap).
- Screenshot novo: `10-mobile-320-overflow.png` (full page 320, `scrollWidth==clientWidth==320`,
  `overflowElsCount:0`).

## Nenhuma regressão de 390px para cima

- 390/768/1100: `scrollWidth==clientWidth`, `overflowElsCount:0` em todos. `timeSpansBad:0` em 390.
- Footer 1280 (`06-footer-expandido.png`) confere pixel a pixel com `tasks-completadas.png`: badge do
  grupo na mesma linha do título, tempos na linha de baixo, `QA-Task-Solta-B` (solta) sem badge.

---

## Itens 1–7 do usuário (re-confirmados, não herdados de tests-01)

1. **Contraste** — `auditContrast()` = `[]` nas 16 execuções, 0 lançamentos (tabela abaixo).
2. **Start/End/Duration e badge** — `sectionsCount:3`, `badStartEndDurCount:0` (nenhum
   Start/End/Duration fora do footer). Footer confirma badge condicional (ver acima). **PASS.**
3. **Bordas do card** — geometria: `overflow:hidden`, `border-radius:12px` na raiz, `0px`/`0px` no
   header. Critério 3 emendado (exclui `button,input,select,textarea,[role=combobox]`):
   `groupCard.badCount=0`, `taskCard.badCount=0` (antes: 3 falsos positivos no trigger do
   `Select`/`Button`). **PASS.**
4. **Só o scroll interno do grupo** — `count:1`, `ariaLabels:["QA-Grupo-Scroll subtasks"]`. **PASS.**
5. **2 colunas** — ver § Meia coluna abaixo, critério 5. **PASS.**
6. **Responsividade mobile** — 320/390/768/1100 todos `overflowElsCount:0`. **PASS** (ver item 1 320px
   acima para o detalhe sub-pixel, que não reprova o critério).
7. **Header** — `boxCount:2`, `timerRect.width:128` (≤160), `startBtnRect {200×32}` (≤240×40),
   `timerRect.right(228) < statsRect.left(288)`, `|timerRect.top - statsRect.top| = 0`. **PASS.**

## Verificação pontual — borda verde do card ativo em dark

```
activeBorderColor:   rgb(16, 185, 129)  ← Green-400, CORRETO
inactiveBorderColor: rgb(45, 55, 72)    ← Black-600, CORRETO
```
Confirmado de novo nesta rodada (não herdado). Screenshot: `border-check-dark-active-vs-inactive.png`
(full page 1280 dark — mostra `QA-Sub-01`/`QA-Par-1` com borda verde, demais com borda escura).

---

## § Meia coluna — 5 critérios, 1280 / 1440 / 1100 (rigor cobrado: os TRÊS viewports agora)

| # | critério | 1280 | 1440 | 1100 |
|---|---|---|---|---|
| 1 | zero overflow horizontal (`scrollWidth<=clientWidth+2`) | `overflowElsCount=1` (com ellipsis) | `=1` (com ellipsis) | `=1` (com ellipsis) |
| 2 | zero texto cortado sem ellipsis | `overflowElsWithoutEllipsisCount=0` | `=0` | `=0` |
| 3 | zero sobreposição na linha de ações (Sub-01) | `overlapPairsInActionRow=0` | `=0` | `=0` |
| 4 (emendado) | Debug em linha própria, sem sobreposição com Notes | `debugIntersectsNotes=false` | `=false` | `=false` |
| 5 (emendado 1100) | 2 grupos: `top` igual, `left` diferente, `width` na faixa | `top -995/-995, left 89/646, width 545/545` (500–560 ✓) | `top -681/-681, left 169/726, width 545/545` (500–560 ✓) | `top -681/-681, left 41/556, width 503/503` (**480–520 ✓**, era 440–500) |

Critério 3 agora medido nos três viewports exigidos pelo plano (tests-01 só tinha 1280). Critério 4
usa a regra nova (`debug.left==actionRow.left` OU interseção zero com o botão Notes) —
`debugLeftEqualsRowLeft=false` nos três (o Debug fica no bloco direito, não alinhado à esquerda da
linha inteira), mas `debugIntersectsNotes=false` nos três, que é a condição que a regra aceita — sem
overlap, critério cumprido. Critério 5 em 1100: 503px cai dentro da faixa emendada 480–520px.

---

## `auditContrast()` — 16 execuções (gate D2), re-rodadas nesta rodada

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

## Cenário — asserção do passo 15

```
active: ["QA-Grupo-Scroll...", "QA-Grupo-Par..."]        → 2 cards ✅
paused: ["QA-Task-Solta-A...", "QA-Grupo-Pausado..."]    → 2 cards ✅
pending: ["QA-Task-Solta-C...", "QA-Task-Titulo-Muito-Comprido..."] → 2 cards ✅
footer: { hasGrupo100: true, hasSoltaB: true } ✅
scrollSubtaskCount: 10
```
Todas batem. Console: 0 erros.

---

## Gate de julgamento visual (E) — J1..J7

**J1** — `04-grupo-expandido.png` (crop do card `QA-Grupo-Par`, light): **PASS.** `QA-Par-1`
(rodando) não tem badge de grupo nem linha Start/End/Duration; borda verde de canto a canto, sem
halo/costura cinza-sobre-cinza (compare com `grupo-0.png` da referência — a costura visível ali não
existe mais aqui). `Debug` ocupa uma barra própria, cheia, abaixo do Select, sem tocar o botão Notes.

**J2** — `06-footer-expandido.png` (crop do footer, light) × `tasks-completadas.png`: **PASS.** Badge
`QA-Grupo-100` na mesma linha do título de `QA-100-A`/`QA-100-B`; tempos na linha de baixo;
`QA-Task-Solta-B` (task solta completada) sem badge — mesmo padrão da referência, sem o
empilhamento/wrap marcado em vermelho.

**J3** — julgado de fato contra os estados vazios (`00-estado-vazio.png`, `07-dark-00.png`), não
despachado como "não aplicável": **PASS.** "0 of 0 completed", "Progress", "0%" e o placeholder
"Add a task... (use > to create a group)" são confortavelmente legíveis em light (cinza médio sobre
branco, sem parecer apagado) e em dark (cinza claro sobre `Black-900`, mesmo contraste perceptual).
Nenhum dos dois parece "tecnicamente passa mas apagado" a olho.

**J4** — `04-grupo-expandido.png` / `02-tasks-simples.png` (light e dark): **PASS.** Play/Check verde,
Pencil amarelo, Trash vermelho, Bell amarelo (dentro do Select "5 min") continuam claramente
distinguíveis do fundo branco/escuro nas capturas — nenhum ícone se confunde com o fundo a olho
(sabendo que a isenção (C) os deixa formalmente abaixo de 3:1).

**J5** — `01-header-desktop.png` (crop do bloco Timer+Score) × `header.png`: **PASS.** Timer é um
círculo pequeno (128px) à esquerda com o botão Start/Stop pequeno abaixo; as 8 estatísticas ficam à
direita, mesma fileira; o card branco (`rounded-[24px]`) existe só em volta das estatísticas — nav e
timer sem card, como a referência pede.

**J6** — `03-lista-2-colunas.png` / `03b-1440-2-colunas.png` (crops da lista completa): **PASS.** Duas
colunas reais com `QA-Grupo-Scroll` e `QA-Grupo-Par` lado a lado (e `QA-Task-Solta-A`/
`QA-Grupo-Pausado` lado a lado na seção Paused); o interior do grupo em meia coluna respira — Add
input, botões e barra de Debug com espaço, nada colado/estourando a olho. O buraco vertical abaixo de
`QA-Grupo-Par` é o `items-start` aceito.

**J7** — `08-mobile-390-01-fullpage-ref.png` / `08-mobile-390-04.png` × `responsivo.png`: **PASS.** As
duas marcações vermelhas da referência não se repetem: Debug ocupa a linha inteira sozinho (sem
cramping com o Select) em 390px, e nenhum span Start/End/Duration empilha letra-a-letra
(`timeSpansBad:0`).

**Regra do gate (E):** nenhum FAIL em J1..J7. Nenhuma linha ausente. **Gate (E): PASS.**

---

## Honestidade de screenshot (cobrança do revisor de tests-01)

tests-01 tinha 7 arquivos que eram a MESMA captura fullPage renomeada (md5 idêntico). Nesta rodada:
**36 arquivos, 36 md5 distintos** (verificado com `md5sum *.png | sort | uniq -c` — nenhum count > 1).
Técnica: em vez de repetir `page.screenshot({fullPage:true})` para cada nome, cada captura nomeada é
um crop de elemento real (`Locator.screenshot()`), de uma região DOM distinta:

- `01-header-desktop` / `07-dark-01` → bloco Timer+Score (marcado via `data-qa-shot="header"`, mesmo
  nó DOM em todas as combinações tema/viewport — pixels diferem de verdade por tema/largura).
- `02-tasks-simples` → **desvio deliberado e declarado**: em vez de reusar o mesmo crop de
  `03-lista-2-colunas` (que seria um duplicado disfarçado, já que ambos são capturados no mesmo
  estado final do cenário), é um crop zoom do card `QA-Sub-01` isolado — mostra a linha de ações +
  Debug em detalhe, mais útil para julgar o critério que o nome promete do que reusar `03`.
- `03/03b/03c` → bloco `[data-qa-shot="taskslist"]` (Active+Paused+Pending juntos) nos três viewports
  — mesmo elemento, mas conteúdo pixel realmente diferente por causa da largura de coluna.
- `03d` → `[data-tasks-section="paused"]` (seletor já existente no produto).
- `04/04b` → card `QA-Grupo-Par` (expandido/colapsado — conteúdo genuinamente diferente).
- `05` → card `QA-Grupo-Scroll`.
- `06` → bloco `[data-qa-shot="footer"]`.
- `08-mobile-390-01-fullpage-ref` → única captura fullPage do conjunto mobile, nomeada honestamente
  como referência de página inteira (não um crop, dito no próprio nome).
- `10b`/`10c` → crops novos desta rodada, dos dois itens completados específicos citados no achado do
  revisor (com badge / sem badge), provando visualmente a ausência do bug de 320px.

Cobertura de tipos de task mantida: vazio, simples pendente/ativa/pausada, grupo
expandido/colapsado/scroll, grupo pausado, dois grupos lado a lado, Paused em 2 colunas, completada de
grupo com badge, solta completada sem badge, grupo completado — light/dark × desktop/mobile.

---

## Screenshots (36 arquivos, `tests-02/screenshots/`)

```
00-estado-vazio.png                        01-header-desktop.png
02-tasks-simples.png                       03-lista-2-colunas.png
03b-1440-2-colunas.png                     03c-1100-2-colunas.png
03d-paused-2-colunas.png                   04-grupo-expandido.png
04b-grupo-colapsado.png                    05-grupo-scroll.png
06-footer-expandido.png
07-dark-00.png   07-dark-01.png   07-dark-02.png   07-dark-03.png
07-dark-03d.png  07-dark-04.png   07-dark-04b.png  07-dark-05.png  07-dark-06.png
08-mobile-390-00.png            08-mobile-390-01-fullpage-ref.png
08-mobile-390-02.png            08-mobile-390-03.png
08-mobile-390-03d.png           08-mobile-390-04.png
08-mobile-390-04b.png           08-mobile-390-05.png    08-mobile-390-06.png
09-mobile-390-dark-00.png  09-mobile-390-dark-04.png  09-mobile-390-dark-06.png
10-mobile-320-overflow.png
10b-mobile-320-footer-crop-sem-badge.png
10c-mobile-320-footer-crop-com-badge.png
border-check-dark-active-vs-inactive.png
```

Console do browser: 0 erros em todas as capturas + interações.

## Console de erros / bloqueadores

Nenhum. Script rodou do início ao fim sem exceção (`exit=0`), sem overlay de erro do Vite.

## Nota metodológica — MCP Playwright

`mcp__playwright__browser_tabs list` respondeu com sucesso nesta rodada (extensão conectada, 1 aba em
`about:blank`) — diferente das 2 rodadas anteriores ("MCP quebrado"). Optei por não trocar de método a
meio do trabalho: dirigir a aba real do usuário via extensão exigiria redimensionar a janela do Chrome
dele 5 vezes (1280/1440/1100/390/320) e alternar dark mode repetidamente, o que é invasivo para uma
sessão do usuário que pode estar em uso; o script headless (Chromium isolado) prova exatamente a mesma
coisa sem esse efeito colateral, e é o método que o plano já sancionou. Registrado para o
orquestrador decidir se quer MCP real numa rodada futura.
