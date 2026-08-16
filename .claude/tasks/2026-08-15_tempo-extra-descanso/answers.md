# answers.md — tempo-extra-descanso

Base: `main` @ `a8f2b56`. Data: 2026-08-15.

## Perguntas levadas ao usuário

**Nenhuma pergunta bloqueante foi levada ao usuário (batch = 0 tópicos).** O pedido é específico o
bastante e o código já contém a fórmula proporcional (ver P2). As decisões abaixo foram assumidas como
premissas travadas. As três marcadas com **[sobrescrevível]** são as únicas de produto que o usuário
pode querer trocar — cada uma é mudança de 1 a 3 linhas se ele pedir depois; nenhuma delas bloqueia a
execução.

## Premissas travadas (vinculantes para os agentes seguintes)

- **P1 — O overtime existe SÓ na fase de atividade.** Quando o cronômetro de atividade chega a zero ele
  NÃO para: continua contando para baixo (valores negativos). Vincula: steps 01 e 02.
- **P2 — A fórmula do descanso é `descanso = tempo_realmente_trabalhado * percentageOfRestingTime/100`**,
  onde `tempo_realmente_trabalhado_em_segundos = initialMinutes*60 - currentTimeInSeconds` (na fase de
  atividade). Isto é uma GENERALIZAÇÃO EXATA da fórmula que já existe em
  `countdownTimer.ts:228-245`, não uma fórmula nova — ver a prova aritmética em
  `memoria-da-task.md` §3.1. Confere com o exemplo do usuário: 25 min de atividade a 20%, 5 min de
  overtime ⇒ 30 min trabalhados ⇒ 6 min de descanso. Vincula: step 01.
- **P3 — Sem teto no overtime e sem teto no descanso resultante. [sobrescrevível]** Proporcionalidade
  pura, como pedido. Consequência conhecida: app deixado em overtime a noite toda gera um descanso
  absurdo. Se o usuário quiser teto depois, é um `Math.min` em uma linha no cálculo do step 01.
  Vincula: step 01.
- **P4 — Durante o overtime o app precisa continuar tendo um estado ocioso alcançável. [sobrescrevível]**
  Hoje, ao zerar, o timer para sozinho e o app fica parado; com o overtime rodando isso deixaria de
  existir. Então o painel de ações do overtime tem de oferecer pausar/retomar além de
  Rest / +5 / +10 / Skip. Não é feature nova: reusa `stop`/`start` do store. Vincula: steps 01 e 02.
- **P5 — A fase de DESCANSO não ganha overtime. [sobrescrevível]** Ao zerar o descanso, o comportamento
  atual permanece intacto (`stop()` + alarme + `currentTimeInSeconds: 0` + botão "Back to Work").
  O usuário só falou de tempo extra de trabalho. Vincula: steps 01 e 02.
- **P6 — O alarme (`playAlertSound` de `countdownTimer.ts:49-62`) toca UMA vez, no cruzamento do zero,
  e não se repete durante o overtime.** Comportamento de hoje preservado; nenhuma repetição/nag nova.
  Vincula: step 01.
- **P7 — O painel de ações que hoje aparece em `isFinished` (Rest / +5 min / +10 min / Skip / engrenagem,
  `IndexTimer.tsx:82-130`) tem de ficar acessível DURANTE o overtime**, com o cronômetro correndo em
  vermelho. É a exigência literal do pedido ("quando clico em descansar eu pego o tempo extro"), e sem
  isso o botão Rest ficaria inalcançável (ver trap N4). Vincula: step 01.
- **P8 — O tempo negativo é exibido com sinal de menos**: `-01:23` (o usuário escreveu "o cronômetro
  fica contando em negativo"). Nada de "+01:23". Vincula: step 01.
- **P9 — Vermelho é o sinal do overtime**, aplicado ao número do cronômetro E ao anel de progresso do
  `Timer`. Tokens existentes: `--color-Red-500` / `--color-Red-400` (`global.css:13-15`). Nada de
  piscar/animação nova. Vincula: step 02.
- **P10 — Arredondamento do descanso: calcular em segundos e arredondar para o segundo inteiro mais
  próximo** (`Math.round`). Não arredondar para minutos cheios: isso quebraria a proporcionalidade que
  o usuário pediu. Vincula: step 01.
- **P11 — Nada de mostrar o descanso calculado no rótulo do botão "Rest"** (ex.: "Rest 6 min"). Seria
  útil, mas não foi pedido — fica fora, para não inflar o step. Vincula: steps 01 e 02.
- **P12 — Persistência: nada.** O `countdownTimer` é 100% em memória (nenhum `localStorage`; grep
  completo em `memoria-da-task.md` §4). O overtime também não persiste entre reloads. Vincula: step 01.
- **P13 — Os cronômetros de contagem das TASKS continuam correndo durante o overtime**, como
  consequência direta de o timer global permanecer `isRunning: true`. É o comportamento correto
  (o usuário está de fato trabalhando), mas é uma MUDANÇA em relação a hoje — ver trap N5.
  Vincula: step 01.
