# Step 01 — overtime-no-store-e-descanso-proporcional

> Leia `../../memoria-da-task.md` ANTES deste arquivo — em especial §2 (mapa do store e da UI com
> linhas), §3 (a matemática já derivada, incl. por que NÃO criar acumulador de overtime), §7 (traps
> N1-N10, sobretudo **N6**, **N7** e **N8**, que são os três jeitos de este step falhar em silêncio) e
> §8 (como testar overtime sem esperar 10 minutos). Este plano não repete o que está lá.

## Objetivo

Pedido literal do usuário: *"quando terminar o timer, devemos pegar o tempo extra trabalhado e
incrementar no tempo de descanso. […] se trabalhei 30 min ao invés de 25 min devo descansar 6 min ao
invés de 5"*.

1. Ao zerar o cronômetro de ATIVIDADE, ele não para: continua contando em negativo.
2. Durante esse overtime, o painel com **Rest / +5 min / +10 min / Skip** continua acessível, e existe
   como pausar/retomar.
3. Ao clicar em **Rest**, o descanso é o tempo REALMENTE trabalhado vezes o percentual configurado.

**Critério de aceite numérico (é o do usuário, não negociável):** atividade 25 min, percentual 20%,
overtime de 5 min ⇒ o descanso inicia em **06:00**, não em 05:00.

## IN

- `src/pages/index/states/countdownTimer.ts`:
  - O tick (`:110-129`) deixa de parar o timer ao cruzar o zero **na fase de atividade** e passa a
    produzir `currentTimeInSeconds` negativo (`Math.floor` no ramo negativo — memória §3.4).
    **Na fase de descanso o comportamento de hoje é preservado** (P5): `stop()` + alarme + zero.
  - Alarme uma única vez por ciclo (trap N8) — flag em ref de módulo, no molde de `:44-47`, resetada
    nas ações que trocam de fase e **não** em `stop`/`start`.
  - Relaxar o guard `if (currentTimeInSeconds <= 0) return` de `start():92-94` para permitir retomar
    o overtime (trap N7); a matemática de retomada já funciona sozinha (memória §3.3).
  - **`goToRest():228-245` e `addExtraTime():247-262` têm de encerrar o intervalo antes de chamar
    `start()`** (trap N6) — sem isso o descanso não começa e o "+5" não tem efeito.
  - `goToRest` passa a calcular o descanso por `worked_s = initialMinutes*60 - currentTimeInSeconds`
    e `rest_s = worked_s * percentageOfRestingTime/100`, arredondando para segundo inteiro (P2, P10).
    É generalização exata da fórmula que já está lá — a prova está na memória §3.1.
- `src/pages/index/components/IndexTimer.tsx`:
  - A condição que exibe o painel de ações (`isFinished`, `:37`) passa a considerar o overtime, para
    que **Rest / +5 / +10 / Skip** continuem alcançáveis com o cronômetro correndo negativo (P7, N4).
  - Oferecer pausar (e retomar) durante o overtime (P4), reusando `stop`/`start` e o botão
    `variant="danger"` de `:55-62`. Colocação exata do botão fica a critério do plano do step —
    o requisito é só que o estado ocioso continue alcançável.
- `src/layout/components/common/Timer/index.tsx`:
  - **Só a formatação do número negativo** (`:53-58`): `-83s` tem de virar `-01:23`, não `-2:-37`
    (trap N2.1). Nada de cor e nada de anel neste step.

## OUT

- **Cor vermelha, anel de progresso e qualquer coisa visual além da formatação do número** — é o
  step 02. Não antecipe.
- Não criar campo novo em `CountdownTimerState` para acumular overtime (memória §3.2 mostra que conta
  em dobro; e trap N1 mostra o custo de campo novo).
- Não pôr teto em overtime nem em descanso (P3).
- Não fazer o DESCANSO contar negativo (P5).
- Não repetir/alterar o alarme nem a notificação (P6).
- Não mexer em `IndexTaskItem`, `useCountUpTimer`, `states/tasks` — a mudança de comportamento dos
  cronômetros das tasks (N5) é consequência esperada, não algo a implementar ou a neutralizar.
- Não persistir nada (P12). Não "corrigir" o `restMinutes` exibido no `UpdateTimerDialog` (N9).
- Não mostrar o descanso calculado no rótulo do botão Rest (P11).

## Respostas/premissas que valem para ESTE step

P1 (overtime só na atividade), P2 (a fórmula), P3 (sem teto), P4 (tem de dar para pausar), P5 (descanso
sem overtime), P6 (alarme uma vez), P7 (painel acessível no overtime), P8 (exibir com sinal de menos),
P10 (arredondar em segundos), P11 (sem rótulo novo no Rest), P12 (sem persistência), P13 (cronômetros
das tasks seguem correndo). Texto completo em `../../answers.md`.

## Arquivos / âncoras sugeridos

- `src/pages/index/states/countdownTimer.ts` — `44-47`, `66-85`, `87-131`, `133-149`, `151-192`,
  `228-245`, `247-262`
- `src/pages/index/components/IndexTimer.tsx` — `35-39`, `55-62`, `63-131`, `82-130`
- `src/layout/components/common/Timer/index.tsx` — `53-58`
- Contexto (ler, não editar): `IndexTaskItem.tsx:46-49, 68, 115-129` (trap N5),
  `UpdateTimerDialog.tsx:5-8` (limites dos sliders)

## Dependências de steps anteriores

Nenhuma. É o primeiro step.

## Modo de teste de sistema

**Docker+browser only.** Não há suíte nem Docker no repo (trap T9): na prática `npx tsc --noEmit` +
`npm run dev` (Vite, **porta fixa 1420**) + Playwright MCP, com os contornos de notificação e de
`browser_click` da memória §7. **Use a técnica de deslocamento de relógio da memória §8** — sem ela o
teste esbarra no mínimo de 10 minutos do slider.

Casos mínimos:

1. **Overtime acontece**: iniciar a atividade, avançar o relógio além do fim; o cronômetro exibe tempo
   negativo bem formatado (ex. `-01:23`) e continua decrescendo a cada segundo.
2. **Alarme uma vez só**: o alerta dispara no cruzamento do zero e **não** volta a disparar a cada
   segundo do overtime (checar `browser_console_messages` e o número de reproduções).
3. **Painel alcançável**: durante o overtime, Rest / +5 min / +10 min / Skip estão visíveis e clicáveis
   (trap N4).
4. **CRITÉRIO DE ACEITE**: atividade 25 min @ 20%, ~5 min de overtime, clicar **Rest** ⇒ o descanso
   começa em **06:00** (±1s) e o cronômetro volta a decrescer de verdade (trap N6 — se o descanso
   congelar ou não iniciar, é FAIL).
5. **+5 durante o overtime**: em ~`-03:00`, clicar "+5 min" ⇒ o cronômetro vai para ~`+02:00` e volta a
   correr (trap N6); deixando zerar de novo e clicando Rest, o descanso é ~`06:00` (memória §3.2 —
   nada de contagem dupla).
6. **Pausar/retomar no overtime**: pausar em ~`-02:00`, conferir que o número congela e que existe como
   retomar; ao retomar, ele continua de ~`-02:00` (trap N7) e **o alarme não toca de novo** (N8).
7. **Regressão do descanso (P5)**: com o descanso rodando, deixar chegar a zero ⇒ ele PARA em `00:00`,
   toca o alarme e mostra "Back to Work" (comportamento de hoje, intocado).
8. **Regressão dos ciclos**: "Skip"/"Back to Work" (`goBackToWork`) continua zerando o overtime,
   voltando para a atividade cheia e incrementando o contador de ciclos do `IndexScore`.
9. **Comportamento novo esperado (N5/P13)**: com uma task com o cronômetro rodando, ao entrar em
   overtime o cronômetro DA TASK continua correndo (não pausa como antes). Registrar com screenshot —
   é mudança observável, e o teste tem de afirmá-la, não estranhá-la.

## CLASSE

**`julgamento`.** Não é espelho mecânico: exige decidir o modelo de contabilidade do tempo (a memória
§3 dá a derivação, mas o plano ainda precisa escolher onde e como aplicá-la), reescrever o ciclo de
vida do intervalo em 3 pontos que hoje dependem do timer estar parado (traps N6/N7/N8), e alterar a
máquina de estados da UI do cronômetro. Tem ainda um efeito colateral deliberado sobre os cronômetros
das tasks (N5). Nada disso é mecânico.
