# Review do plano — r3 (juiz-layout-melhorias-ui-plan-r3, opus fresco, janela 126k)

veredito: APROVADO_COM_RESSALVAS

- item 1: FRACO — as 5 afirmacoes da r3 sao verdadeiras e verificadas; sobra UM erro factual: o auditor usa "texto grande = >=14px bold", que a WCAG nao concede (e 14pt bold = 18,66px). O invariante NAO torna primary/danger conformes — mas o gate segue atingivel e o codigo produzido e o mesmo.
- itens 2..7: OK — todos reconferidos linha a linha no codigo e contra as imagens (ver detalhe abaixo).

bloqueadores: (vazio)

## Ressalvas

1. **OBRIGATORIA antes de implementar — piso de texto grande errado.**
   `large = fontPx>=18 || (fontPx>=14 && bold)` (auditor, plan.md secao D) e mais leniente que a WCAG
   (24px normal / 18,66px bold — o que axe/WebAIM usam). Consequencia real: `text-White` em
   `bg-Green-500` = 3,77 e `bg-Red-500` = 3,82 com `text-sm font-bold` (14px) ficam ABAIXO de 4,5, e
   o gate volta `[]` de qualquer forma.
   Corrija a PROSA, nao o codigo: em plan.md l.148 e em escopo-a l.45, trocar "a WCAG concede a texto
   grande" por "nao-conformidade aceita e registrada, da mesma classe da isencao dos icones — nao
   existe verde/vermelho mais escuro na palheta (Green-500 e o mais escuro) e criar token e proibido;
   aumentar a fonte contradiz o item 7".
   Manter o limiar do auditor como esta (mudar torna o gate inatingivel sem token novo) e manter
   `font-bold`+`text-sm` obrigatorios (com `font-medium` cai para 2,54/3,30 — ai sim e violacao
   grosseira). O unico no que pega carona nessa leniencia sao esses botoes; todo `text-lg..4xl` do
   repo e `text-Black-700`, entao a metade "18px normal" nao esconde nada.
2. Gate atingivel — nos em repouso que ninguem possui, todos conferidos: trigger do
   `IndexWorkflowDialog` (`<svg>` White sobre `bg-Blue-400` = 3,30 >= 3, passa), chips do `IndexScore`
   (`item.color` num div SEM texto direto, so o `<svg>` — exempto), `IndexTasks.tsx:26`
   `text-Black-300` = 4,83, e existe so 1 `dark:text-Black-300` no repo (o ProgressBar que o plano
   corrige). Nada mais reprova.
3. Numeros da r3 conferidos e exatos: 2,54->3,77 / 3,30->5,75 / 3,04->5,78 / 4,5018->5,75; disco
   2,54->3,77; effBg dark = rgb(29,37,51) com Black-400 = 6,04. Nos existem onde o plano diz
   (Button:19/22, ProgressBar:16, DebugTimer:80/99/106, CompletedTaskItem:39/93, CompletedTaskGroup:27,
   ReportsTabs:28, WorkflowFooter:36). Spreads (neutro 18-27, Red-100=28) corretos. `grep -rnoP`
   devolve 24 (21 + 3 `text-Black-100`) e `text-Black-450` = 16. Os 3 "fora do gate" sao legitimos:
   WorkflowFooter (dialogo fechado, fora de escopo), IndexErrorMessage:27 (`return null` sem erro),
   overtime do Timer (nao existe em repouso) — nenhum e violacao escondida.
4. Micro-imprecisao inofensiva: o "6,40 sobre o corpo do grupo no dark" (secao C, ProgressBar) e 6,43
   sobre o `Box` (Black-800); sobre o corpo do grupo e 6,04. Ambos >= 4,5.
5. `escopo-a` lista so `IndexHeader/IndexHeader.tsx` enquanto plan.md diz `IndexHeader/**` — sem
   efeito pratico (o `IndexWorkflowDialog` esta em "Fora de escopo" nas duas).
6. Se o auto-teste do normalizador `throw` no host (o `_t2` usa tolerancia 1 num round-trip com
   pre-multiplicacao), o conserto e subir a tolerancia — o plano ja manda tratar como FAIL e
   consertar, nao silenciar.

## Detalhe dos itens 2..7 (reconferidos, nao herdados)

- item 2: 206-210 e 238-252 confirmados; GroupTitleContext morre; footer = tasks-completadas.png; hook data-tasks-section intacto.
- item 3: IndexTaskGroup:90/91 e IndexTaskItem:159/161 seguem 2 cards de raio 12px sobrepostos; regra 1 superficie/1 borda/1 raio + critério dos 4 lados intactos.
- item 4: max-h-[520px] (ActiveList:78) e max-h-[calc(100vh-400px)] (IndexFooter:81) confirmados; sobra o scroll de IndexGroupTasksList:62 com aria-label; 10 subtasks + salvaguarda.
- item 5: grid lg:grid-cols-2 nas 3 secoes + footer, rectSortingStrategy, sem col-span; aceite de 2 grupos lado a lado inalterado.
- item 6: regras incondicionais + w-full do Debug + truncate/whitespace-nowrap; aceite 320/390/768/1100.
- item 7: escopo A confere com header.png; os "4 branches" do IndexTimer existem (l.61/124/132/151) e a instrucao cobre tambem o `text-sm font-medium` da l.136 (senao o gate falharia).
