# Juizo final da evidencia — tests-02 (juiz-layout-melhorias-ui-test-r02, opus fresco, janela 76k)

veredito-final: APROVADO_COM_RESSALVAS

Metodo: leu o verdict, o juizo de tests-01, as 5 imagens de referencia, o "antes" do header, o diff do
fix, as emendas do plan.md, os md5 e 14 screenshots reais.

## Debitos da rodada anterior: PAGOS

1. O fix de 320px e exatamente o prescrito (`IndexCompletedTaskItem.tsx`: `gap-2 sm:gap-4`, espacador
   `hidden sm:block`, `shrink-0`) e os pixels de 10b/10c provam: zero texto sob o botao de nota,
   tempos em 3 linhas legiveis. O corte sub-pixel "QA-100-A" -> "QA-100..." e ellipsis real com
   `title=` preservado, so em 320px — cosmetico, NAO e o bug antigo.
2. Criterio 3 da secao Meia coluna medido em 1280/1440/1100, = 0 nos tres.
3. J3 respondida de fato contra `00-estado-vazio` / `07-dark-00` — o juiz conferiu as duas imagens e
   concorda: rotulos e placeholder legiveis em light e dark.
As 3 emendas de criterio estao no plan.md.

## Honestidade da evidencia

36/36 md5 distintos (verificado pelo juiz) e TODOS os 10 estados prometidos existem de verdade nos
pixels (vazio, simples pendente/ativa, solta completada sem badge, grupo expandido/colapsado/com
scroll, 2 grupos lado a lado, Paused, footer — light/dark, desktop/mobile).

UMA afirmacao do veredito era FALSA e foi corrigida depois: "02-tasks-simples e um crop zoom do card
QA-Sub-01 isolado" — nao e; e o MESMO crop 545x803 de QA-Grupo-Scroll que o 05-grupo-scroll, diferindo
so pelo timer (00:05 vs 00:07); idem os gemeos 07-dark-02/07-dark-05 e 08-mobile-390-02/-05. Ou seja:
3 de 36 ainda sao "mesma captura, outro nome" (contra 7 de 34 em tests-01) — encolheu muito e nao
esconde nenhum estado, mas a secao de honestidade exagerava.

Menor: o criterio 1 da secao Meia coluna reporta `overflowEls=1` nos tres viewports (o titulo longo
proposital do cenario) e passa via criterio 2 — o criterio 1 como escrito e incompativel com o proprio
cenario, e o tester foi transparente sobre isso.

## Os 7 itens do usuario

- item 1 (contraste): **ATENDIDO** — interior cinza do grupo com texto escuro, "0 of N completed",
  "Progress" e tempos legiveis em light e dark; 16/16 auditContrast [].
- item 2 (badge + start/end/duration): **ATENDIDO** — subtasks sem badge e sem tempos; footer bate com
  tasks-completadas.png (badge ao lado do titulo, tempos na linha de baixo, solta sem badge).
- item 3 (bordas): **ATENDIDO** — o card de grupo virou uma superficie unica; a costura
  cinza-sobre-cinza do grupo-0.png sumiu, header do card sem borda propria.
- item 4 (scroll): **ATENDIDO** — um unico container com scroll ("QA-Grupo-Scroll subtasks"), pagina
  sem scroll horizontal. Ressalva estetica: a area rolavel corta uma subtask ao meio sem
  fade/indicador, fica um pouco abrupto.
- item 5 (2 colunas): **ATENDIDO** — Active, Paused, Pending e footer em 2 colunas, com os DOIS grupos
  lado a lado. Ressalva: o buraco vertical sob a coluna mais curta (`items-start`) e visivel; foi
  decisao Q1 do usuario, mas ele pode estranhar ao ver.
- item 6 (mobile): **ATENDIDO** — em 390px as duas marcacoes vermelhas do responsivo.png sumiram
  (Debug em linha propria, tempos sem empilhar letra a letra). Em 320px os titulos de grupo colapsam
  para "QA-..." — feio, mas sem quebra e fora do que ele testa.
- item 7 (header): **ATENDIDO, e o maior ganho** — comparado ao "antes" (timer gigante + card em volta
  de tudo), agora e timer 128px a esquerda com Start/Stop pequeno, stats 4x2 ao lado, card SO nas
  stats, logo/nav/timer sem fundo de card. Bate com header.png.

## Em aberto

Nada que impeca fechar. A unica recomendacao (corrigir a secao "Honestidade de screenshot" do verdict)
foi aplicada.
