# Review do plano — r2 (juiz-layout-melhorias-ui-plan-r2, opus fresco, janela 129k)

veredito: REPROVADO — porem SO a secao "Politica de contraste" do item 1. Itens 2..7 estao prontos
para um Sonnet implementar sem decisao em aberto (linhas, classes e aceites conferidos contra o
codigo e contra as 5 imagens de referencia).

- item 1: FRACO — mudancas concretas e corretas (token #556070, par dark: obrigatorio, atoms Input/Select), mas o gate `auditContrast()===[]` continua INATINGIVEL (bloqueadores 1 e 2).
- item 2: OK — remocoes (206-210, 238-252) e morte do GroupTitleContext confirmadas; footer igual a tasks-completadas.png; aceite escopado por `[data-tasks-section] *` + assercao de seletor nao-vazio.
- item 3: OK — IndexTaskItem:159/161 e IndexTaskGroup:90/91 = 2 cards de raio 12px sobrepostos; aceite por computed style + regra dos "4 lados" liberando os `border-t` intencionais.
- item 4: OK — `max-h-[520px]` (ActiveList:78) e `max-h-[calc(100vh-400px)]` (IndexFooter:81) confirmados; sobra 1 scroll com `aria-label="<grupo> subtasks"`; 10 subtasks + salvaguarda.
- item 5: OK — bloqueador 4 da r1 REALMENTE fechado: `executeTask` (states/tasks/index.ts:339) so muta a task alvo e `getGroupActivityStatus` (utils.ts:118) marca "active" por filho ativo => Play em QA-Sub-01 + QA-Par-1 da 2 grupos na MESMA secao; `rectSortingStrategy` e larguras (546px/470px) conferem.
- item 6: OK — as duas marcacoes de responsivo.png viram regras incondicionais (Debug `w-full`, truncate+whitespace-nowrap); aceite em 320/390/768/1100.
- item 7: OK — header.png confere (circulo pequeno a esquerda, botoes pequenos abaixo, stats na mesma fileira, Box so nas stats); Box=24px e `max-w-6xl` confirmados; grid 2/4 sem tile orfao.

## Bloqueadores (todos dentro da secao "Politica de contraste" do item 1)

1. O predicado de "neutro" esta FACTUALMENTE ERRADO: o spread real da rampa e 18-27 (Black-100=19,
   Black-700=24, Black-450 novo=27), nao "<=15". Com `<=16` NENHUM cinza e neutro, e o codigo faz
   `if(!neutral && !isIcon) push R5` => TODO texto da app vira violacao R5. Tambem e falso que "o
   menor spread de acento e 211": Red-100=28, Blue-100=30, Yellow-100=55 (a janela segura e
   exatamente <=27). E o `Set ACCENT` e declarado e nunca usado — a prosa da R5 ("cor de acento") e o
   codigo (`!neutral`) divergem, deixando duas definicoes contraditorias para quem implementa/mede.
   Conserto: limiar <=27, OU lista explicita de rgb dos tokens White/Black-*.
2. Mesmo com o limiar corrigido, sobram nos NEUTROS reprovando fora da allowlist (que so exempta
   `<svg>`), todos nas telas auditadas:
   - `text-White` em `Button` primary `bg-Green-400` = 2,54:1 (Start do timer global; "Add" do grupo,
     IndexTaskGroup:175; 14px bold => min 3);
   - `text-White` em `variant="secondary"` `bg-Blue-400` = 3,30:1 nos botoes "Notes" e "Reset"
     (12px bold => min 4,5);
   - a R5 mata texto de acento que EXISTE hoje (`text-Blue-500` do rotulo "Debug" e do relogio,
     IndexDebugTimer:80,99) — o plano afirma "hoje nenhum texto usa acento nas telas auditadas", o
     que e falso.
   Nenhum escopo pode consertar: `Button` esta fora do footprint de A e de B, e a palheta de acento e
   "fora de escopo" => gate impossivel por construcao. Conserto: estender a allowlist FECHADA (rotulo
   neutro sobre fundo de acento + texto Blue-500 do Debug, com a mesma justificativa de palheta e J4
   como contrapartida), OU dar o `Button` a um escopo.
3. `effBg()` esta CORRETA na composicao (conferido: Black-800/40 sobre Black-700 = rgb(29,37,51) e
   Black-400 sobre ele = 6,04:1; Black-450 novo sobre Black-700 = 2,30:1 => o par
   `text-Black-450 dark:text-Black-400` esta certo e nao quebra nenhum outro par: 6,38 no branco,
   5,18 em Black-100/40, 4,90 no badge Black-100/50, e o dark do badge Black-400 sobre Black-600 =
   4,72). O que falta e robustez de PARSE: Tailwind v4.1 compila `/40` como
   `color-mix(in oklab, ...)` e o `parse()` por regex de digitos nao le o valor computado do Chrome
   (oklab()/color(srgb) com canais 0-1). Exigir normalizacao medida (ex.: round-trip por
   `canvas.fillStyle` ou leitura de pixel) antes de usar o auditor como gate.

## Ressalvas

- (a) A divergencia da palheta de acento e ACEITAVEL para o usuario ("ate ficar legal") porque J4 e a
  contrapartida escrita e os icones ficam sobre chips coloridos — mantenha J4.
- (b) O grep do plano e line-based e perde `text-Black-400 ... dark:text-Black-400` na MESMA linha:
  IndexReportsTabs.tsx:28 e violacao de light (2,54:1) e nao esta em nenhuma lista; a auto-checagem
  final (`| grep -v "dark:"`) tambem a ignora.
- (c) Sao 16 usos de `text-Black-450`, nao 17.
- (d) IndexScore ja nao tem `sm:grid-cols-3` (a correcao da ressalva da r1 e no-op, inofensiva).
- (e) J1..J7 cobrem bem o lado subjetivo dos itens 1 e 7 — mantenha a obrigacao das 7 linhas escritas.
