# Juizo da evidencia — tests-01 (juiz-layout-melhorias-ui-test-r01, opus, janela 88k)

veredito-evidencia: BOA_COM_RESSALVAS

Metodo: leu o verdict, as secoes relevantes do plano, as 5 imagens de referencia e o "antes" do
header, e ampliou os pixels reais (escreveu um cropper de PNG em Python puro, pois nao ha
ImageMagick/PIL no host) do card de grupo em light+dark, do footer em light, das 2 colunas em 1100px,
do 390px e do footer em 320px.

## Cobertura

Completa vs a tabela do plano (34 = 11@1280 + 9 dark + 9 mob390 + 3 mob-dark + 320 + border-check).
Todos os tipos de task presentes: vazio, simples pendente/ativa/pausada, grupo
expandido/colapsado/scroll, grupo pausado, DOIS grupos lado a lado, Paused em 2 colunas, completada
de grupo com badge, solta completada sem badge, grupo completado.
Ressalva: 01/02/03/03d/04/05/06 sao a MESMA captura fullPage (1280x2425, md5 difere so pelo timer
correndo) — nao faltou estado, mas sao ~3 estados reais em 7 nomes.

## Julgamento visual (itens 1 e 7)

A tela esta boa de verdade, nao e "numeros verdes com tela feia".
- Item 7 e um salto real vs o "antes" (timer gigante + card em volta de tudo): agora e timer 128px a
  esquerda, Start/Stop + gear pequenos, card SO nas stats 4x2 ao lado — bate com header.png.
- Itens 3 e 1: o card de grupo virou UMA superficie (raio unico, header sem borda, cinza como
  interior) e a costura cinza-sobre-cinza do grupo-0.png sumiu; rotulos "0 of 10 completed",
  "Progress" e os tempos estao legiveis em light e dark.
- Footer bate com tasks-completadas.png (badge ao lado do titulo, tempos na linha de baixo, solta sem
  badge).
- Unica feiura real: 320px (achado 1).

## Achados

- achado 1: **DEFEITO**, e MAIS grave do que o verdict diz (o "sutil, nao visualmente obvio" esta
  errado): em 320px o texto "Start 04:15:02 PM" passa POR BAIXO do botao azul de nota, e titulo/badge
  truncam para "QA-..." / "Q...".
  Conserto minimo em `IndexCompletedTaskItem.tsx:36-37,74`: o `<div className="w-5 h-5" />` morto vira
  `hidden sm:block w-5 h-5`, `gap-4` vira `gap-2 sm:gap-4`, e o bloco de acoes (l.74) ganha
  `shrink-0`. Devolve ~36px: a coluna de texto sai de 90px para ~126px (> os 103px do span) e nada
  muda a partir de 390px.
- achado 2: **LACUNA_DE_CRITERIO** — o usuario reclamou de costura de card-dentro-de-card, nunca de
  borda em trigger de Select/Button; visualmente "5 min" e "Add" estao corretos.
  Emenda: no 3o criterio do item 3, aplicar a regra apenas a descendentes que NAO sejam controle
  interativo — `:not(button):not(input):not(select):not(textarea):not([role="combobox"])` — com a
  nota "borda de affordance em controle de formulario nao conta como card-dentro-de-card".
- achado 3: **LACUNA_DE_CRITERIO** — a faixa 440-500 em 1100px esta aritmeticamente errada no proprio
  plano (foi calculada para 1024px, nao 1100): pela formula do plano,
  (1100 - 24 de p-3 - ~8 de scrollbar - 48 de p-6 - 12 de gap)/2 ~= 504, exatamente o medido.
  Emenda: trocar "em 1100px a faixa e 440-500px" por "480-520px" (ou expressar como
  (interior - gap)/2 +- 8px). Em 1100 a tela esta visivelmente limpa e em 2 colunas.
- achado 4 (**NAO reportado pelo tester**, encontrado nos pixels): o criterio 4 da secao Meia coluna
  ("debug.top >= notesButton.bottom") foi marcado OK como "confirmado visualmente abaixo do Select" —
  criterio errado e sem numero. A 1280/1100 o Debug divide a linha com lapis+Notes (o `w-full` e full
  do bloco DIREITO, nao da linha); so em 390px ele fica em linha propria. Nao ha overlap nem
  overflow (visualmente aceitavel), mas o criterio como escrito reprova.
  Emenda: medir `debug.left == actionRow.left`, OU reescrever como "Debug ocupa linha propria dentro
  do seu bloco flex, sem sobreposicao com Notes".

## Ressalvas de rigor

- Criterio 3 da secao Meia coluna (sobreposicao) so foi medido em 1280 — "nao medido" em 1440 e 1100,
  e o plano exige os tres.
- J3 foi respondida por formalidade na parte do placeholder ("nao aplicavel neste cenario populado")
  quando 00-estado-vazio e 07-dark-00 existiam para julga-la.
- J1, J2, J4, J5, J6, J7 sao substantivas e conferem com os pixels; J4 e honesta ao declarar que os
  icones ficam formalmente abaixo de 3:1.

## Proximo passo

1. Aplicar SO o conserto do achado 1 (3 classes em IndexCompletedTaskItem.tsx).
2. Emendar no plan.md os criterios dos achados 2, 3 e 4.
3. Re-rodar apenas 320px (footer sem texto sob o botao) + criterio 3 da secao Meia coluna em
   1440/1100 + J3, e recapturar 10-mobile-320-overflow.

Com isso a task fecha — nada mais dos 7 itens do usuario esta em aberto.
