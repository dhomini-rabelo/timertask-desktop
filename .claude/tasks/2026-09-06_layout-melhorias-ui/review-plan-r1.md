# Review do plano — r1 (juiz-layout-melhorias-ui-plan-r1, opus, janela 96k)

veredito: REPROVADO

- item 1: FRACO — politica/token concretos e medidos, mas o gate `auditContrast()===[]` e inatingivel e o auditor mede errado no dark.
- item 2: FRACO — remocao/reestruturacao certas e fieis a tasks-completadas.png, mas a assercao de aceite esta mal escopada (pega o footer).
- item 3: OK — diagnostico confirmado no codigo (rounded-xl aninhado + wrapper cinza), classes exatas, aceite por computed style.
- item 4: OK — linhas confirmadas, resta um unico scroll (subtasks) com aria-label verificavel.
- item 5: FRACO — premissa dos 546px CONFIRMADA (page.tsx:58 `max-w-6xl` + Box `p-6`), decisao "tudo em 2 colunas" respeitada, mas o cenario de teste nao consegue provar dois grupos lado a lado.
- item 6: OK — regras incondicionais batem com responsivo.png; aceite `scrollWidth` em 320/390/768.
- item 7: OK — leitura de header.png e do "antes" confere; Box removido do page.tsx, Box so no IndexScore, aceite geometrico correto (Box=24px confirmado).

## Bloqueadores (precisam virar mudanca no plano para aprovar)

1. Item 1: `auditContrast()===[]` e inatingivel — icones `text-Yellow-400` (#FBBF24 = 1,67:1) e `text-Green-400` (2,54:1) reprovam a regra de 3:1 e nao estao na lista de mudancas; e `Input` (`placeholder:text-Black-400` 2,58:1) e `Select/trigger` (chevron `text-Black-100` 1,72:1) estao em `src/layout/components/**`, que os dois escopos tem proibido tocar. Defina o conjunto medido (texto/icone neutro) + allowlist justificada, ou de esses atoms ao escopo B.
2. Item 1: `effBg()` compoe cada camada alpha sobre `[255,255,255]` e perde o alpha do acumulador — em dark, `dark:bg-Black-800/40` sobre `dark:bg-Black-700` retorna rgb(163,166,170) e todo texto claro vira violacao falsa. Compor o filho sobre o pai acumulado, partindo do ancestral opaco (`body-df` = Black-900 no dark).
3. Item 1: aceite se contradiz — "PASS somente se auditContrast() voltar []" vs "violacao restante precisa estar listada e justificada". Escolher uma; e acrescentar o gate subjetivo explicito (comparar 04/06 com grupo-0.png/tasks-completadas.png e julgar legibilidade/estetica), que hoje e so uma frase solta.
4. Item 5 / cenario: o passo 8 (Play em QA-Sub-1) torna QA-Grupo-Scroll "active" (`useListingTasks` classifica o grupo pela atividade dos filhos), entao os 2 unicos grupos abertos caem em secoes diferentes e o screenshot 03 + o criterio (v) da secao Meia coluna ("dois cards de grupo lado a lado") ficam improvaveis. Criar um 3o grupo, ativar subtask no 2o grupo, ou fixar a ordem screenshot x dados.
5. Cobertura de screenshots: nenhum passo completa uma task solta, mas o 06 exige "task solta completada" — e o caso que prova que o badge so aparece quando ha grupo (tasks-completadas.png). Adicionar Play->Check em QA-Task-Solta-2. Nenhum cenario produz a secao "Paused", que o item 5 tambem altera.
6. Item 2: trocar o seletor do aceite (`[role="region"], .group`) por um escopado ao container da lista ativa — os `.group` do footer legitimamente mostram "Start ...", e o item 4 apaga o `role="region"`.

## Ressalvas (nao travam, mas registrar/resolver)

- 546px so vale de ~1184px para cima; entre 1024 e 1184 a meia coluna e ~466px (as regras incondicionais aguentam, mas 1024-1100 nao e testado).
- Item 4: 8 subtasks ~= 530px contra `max-h-[560px]` — o scroll so aparece porque uma subtask fica ativa; usar 10 subtasks ou "adicionar ate scrollHeight > clientHeight".
- Item 3: o aceite "background igual ao do pai E borda visivel" e ambiguo para a nova linha de acoes (o `border-t` e divisor intencional) — reescrever como borda nos 4 lados.
- `noUnusedLocals: true` (tsconfig.json:19) responde a duvida da l.129 do plano: tsc pega os orfaos. Mas o `GroupTitleContext.Provider` em IndexGroupTasksList fica sem consumidor (codigo morto, sem erro).
- Premissa 3: a conta certa e 1152-200-24=928, -48 de padding = 880 -> 220px/tile (o plano diz 1120/896/848); conclusao (manter 8 metricas) nao muda. Em 768px o grid `sm:grid-cols-3` deixa 2 tiles orfaos.
- Item 5: `items-start` deixa buraco vertical grande ao lado de um grupo alto — consequencia aceita da decisao do usuario, mas nao registrada no plano.
