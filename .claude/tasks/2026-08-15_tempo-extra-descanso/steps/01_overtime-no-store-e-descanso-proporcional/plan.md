# Plano — step 01: overtime-no-store-e-descanso-proporcional

Base: branch `main`, commit `47278d8`. Fonte: `plan-simplified.md` deste step + `recon.md` +
`../../memoria-da-task.md` (§2 mapa, §3 matemática, §7 traps, §8 técnica de teste).
Os três arquivos-alvo foram relidos por inteiro neste turno — as âncoras abaixo são do código real.

## Premissas assumidas

Nenhuma pergunta ao usuário. P1-P13 já foram fixadas pelo meta-planner e são vinculantes. O que este
plano DECIDIU (e que o reviewer e o tester devem tratar como contrato):

- **A1 — Zero campo novo em `CountdownTimerState`.** O flag "já alertou neste ciclo" vira uma ref de
  módulo (`hasAlertedRef`), no molde de `intervalRef`/`endTimeRef` (`countdownTimer.ts:44-47`).
  Motivo: memória §3.2 (acumulador conta em dobro) + trap N1 (`setState:66-85` enumera campo a campo).
- **A2 — Encerrar o intervalo em `goToRest`/`addExtraTime` via chamada a `stop()`**, não via clear
  inline. `stop()` já é chamado de dentro do store (tick, `:116`), limpa `intervalRef` + `endTimeRef`
  E deixa `isRunning: false` coerente caso o `start()` seguinte caia num guard — o clear inline de
  `reset:153-158` deixaria `isRunning: true` sem intervalo (estado zumbi). React agrupa o
  `stop()`+`start()` do mesmo handler, então não há piscada de UI.
- **A3 — O guard relaxado de `start()` é condicionado à FASE, não ao valor.** Vira
  `if (store.state.isResting && store.state.currentTimeInSeconds <= 0) return;`. Isso libera retomar o
  overtime (N7) e libera o `addExtraTime` que resulta em saldo ainda negativo (ex.: `-8:00` + 5 min),
  mantendo P5 (descanso nunca parte de ≤ 0).
- **A4 — `goToRest` mantém a invariante `currentTimeInSeconds === initialMinutes * 60`.** O descanso é
  calculado em SEGUNDOS (P10) e `initialMinutes` recebe `restSeconds / 60` (fracionário, como já
  acontece hoje com `restMinutes = 5` para 25 min @ 20%). Se `initialMinutes` fosse arredondado para
  minuto inteiro, `hasTimerStarted` (`IndexTimer.tsx:35-36`) ficaria `true` no primeiro frame do
  descanso e o total do anel sairia errado.
- **A5 — Sem clamp em `restSeconds`.** `worked_s = initialMinutes*60 - currentTimeInSeconds` nunca é
  negativo (memória §3.1: `addExtraTime` sobe `initialMinutes` e `currentTimeInSeconds` na mesma
  medida) e o percentual mínimo do slider é 20 (`UpdateTimerDialog.tsx:7`), logo `restSeconds > 0`
  sempre. Não adicionar guarda defensiva que nunca dispara.
- **A6 — Pausar/retomar no overtime (P4) é um botão de largura cheia no TOPO do painel de ações**,
  acima de "Rest": `Stop` (`variant="danger"`, espelho de `IndexTimer.tsx:55-62`) quando `isRunning`,
  `Resume` (`variant="primary"`, `onClick={start}`) quando parado. Não reaproveitar a linha do Skip
  (já tem Skip + engrenagem em `w-64`).
- **A7 — O ramo `isFinished && !isResting` de `IndexTimer.tsx:82-130` deixa de existir como ramo
  próprio**: ele é subsumido pelo novo ramo de overtime (`current === 0 && !isResting` ⇒ overtime).
  O markup do painel é MOVIDO, não duplicado — tem de continuar existindo uma única cópia dos botões
  Rest/+5/+10/Skip.
- **A8 — O anel (`getPercentage`/`getCircleDashoffset`) NÃO é tocado neste step.** Durante o overtime
  o arco vai desenhar lixo (trap N2.2: percentual negativo ⇒ `strokeDashoffset > C`). Isso é
  **esperado e não é FAIL do step 01** — o clamp é do step 02. O tester deve registrar e seguir.

## Escopos de implementação

Adotada a partição recomendada pela recon: **2 escopos, paralelizáveis**.

| # | Escopo | Arquivos que POSSUI | Prompt |
|---|---|---|---|
| 1 | `store-overtime-e-painel` | `src/pages/index/states/countdownTimer.ts`, `src/pages/index/components/IndexTimer.tsx` | `prompts/store-overtime-e-painel.md` |
| 2 | `timer-formatacao-negativa` | `src/layout/components/common/Timer/index.tsx` | `prompts/timer-formatacao-negativa.md` |

Escopo 1 é único (não dois) porque store e UI são semanticamente acoplados: `IndexTimer` depende do
contrato `isRunning === true && isResting === false && currentTimeInSeconds < 0` que o store passa a
produzir, e os traps N4/N6/N7/N8 atravessam os dois arquivos sem gerar erro de compilação se
divergirem. Escopo 2 é função pura de formatação de string, sem leitura de store — independente.
Footprints disjuntos: nenhum arquivo aparece nos dois escopos.

## Escopo 1 — `countdownTimer.ts` + `IndexTimer.tsx`

### 1.1 `countdownTimer.ts` — ref do alarme (novo, ao lado de `:44-47`)

```
const hasAlertedRef: { current: boolean } = { current: false };
```

Regra de reset (trap N8), literal: resetar para `false` em `reset`, `goBackToWork`, `goToRest`,
`updateActivityMinutes` e `addExtraTime`. **NÃO** resetar em `stop` nem em `start` — senão pausar e
retomar no overtime toca o alarme de novo. `updatePercentageOfRestingTime` não troca de fase: não
reseta.

### 1.2 `countdownTimer.ts` — o tick (`:110-129`)

Estrutura nova do callback do `setInterval`, na ordem:

1. `if (!endTimeRef.current) return;` (inalterado)
2. calcular `millisecondsLeft` (inalterado)
3. ler a fase: `const store = get();` — o tick hoje não faz `get()`; passa a fazer, para ler
   `store.state.isResting` **ao vivo** (não capturar no fechamento do `start`).
4. `if (millisecondsLeft <= 0)`:
   - dispara o alarme **uma vez**: `if (!hasAlertedRef.current) { hasAlertedRef.current = true; playAlertSound(); }`
   - **fase de descanso** (`store.state.isResting`): comportamento de hoje INTACTO (P5) —
     `stop()` + `setState({ currentTimeInSeconds: 0 })` + `return`.
   - **fase de atividade**: NÃO chamar `stop()`. `setState({ currentTimeInSeconds: Math.floor(millisecondsLeft / millisecondsPerSecond) })`
     (memória §3.4 — `Math.floor` no ramo negativo; `Math.ceil` travaria o display) + `return`.
5. ramo positivo: `Math.ceil(...)` inalterado.

Sem teto (P3): o negativo cresce indefinidamente.

### 1.3 `countdownTimer.ts` — guard de `start()` (`:92-94`)

`if (store.state.currentTimeInSeconds <= 0) return;` ⇒
`if (store.state.isResting && store.state.currentTimeInSeconds <= 0) return;`

O guard `if (intervalRef.current) return` de `:89-91` fica como está. A matemática de retomada sai de
graça (memória §3.3: `addSeconds(new Date(), -180)` gera um instante no passado e o primeiro tick já
devolve `-180000 ms`).

### 1.4 `countdownTimer.ts` — `goToRest()` (`:228-245`)

Ordem obrigatória: **`stop()` → resetar `hasAlertedRef` → `setState` → `start()`** (trap N6 — sem o
`stop()`, `start()` cai no guard de `:89-91`, o `endTimeRef` não é recalculado e o descanso nunca
começa; este é o bug mais provável do step).

Cálculo que substitui `baseRest`/`extraRest` (`:232-234`):

```
workedSeconds = store.state.initialMinutes * secondsPerMinute - store.state.currentTimeInSeconds
restSeconds   = Math.round(workedSeconds * (percentage / 100))
```

`setState` passa a receber: `restMinutes: restSeconds / secondsPerMinute`,
`initialMinutes: restSeconds / secondsPerMinute`, `currentTimeInSeconds: restSeconds`,
`isResting: true`, `extraAddedMinutes: 0` (os três últimos como hoje, só muda a origem do número).

`getRestMinutes` (`:38-40`) continua sendo usada por `updateActivityMinutes` e
`updatePercentageOfRestingTime` — **não apagar**.

Conferência da fórmula (memória §3.1, não refazer): `current === 0` ⇒ idêntico a hoje;
`initialMinutes=25, current=-300, p=20` ⇒ `worked=1800s`, `rest=360s` = **06:00** (o critério de
aceite). Após `+5` em `-3:00`: `initialMinutes=30, current=0` ⇒ `worked=1800s` ⇒ 06:00, sem contagem
dupla.

### 1.5 `countdownTimer.ts` — `addExtraTime()` (`:247-262`)

Mesma ordem: **`stop()` → resetar `hasAlertedRef` → `setState` (aritmética inalterada) → `start()`**.
A aritmética de `:249-252` já está correta para saldo negativo (`-180 + 300 = +120`) e não muda.

### 1.6 `IndexTimer.tsx` — condições (`:35-39`)

- `hasTimerStarted` (`:35-36`) e `shouldShowSettingsButton` (`:38-39`): inalterados.
- `isFinished` (`:37`): **mantido como está** (`current === 0 && !isRunning`) — ele agora só governa o
  ramo de DESCANSO terminado.
- Novo derivado: `const isOvertime = !isResting && currentTimeInSeconds <= 0;`
  (na fase de atividade, `currentTimeInSeconds` só chega a ≤ 0 depois de cruzar o zero — o mínimo do
  slider é 10 min, `UpdateTimerDialog.tsx:5`).

### 1.7 `IndexTimer.tsx` — a cadeia de ramos (`:55-168`)

Nova ordem, com `isOvertime` PRIMEIRO (é o que resolve N4: hoje `isRunning` no `:55` é exclusivo de
`isFinished` no `:63` e o painel fica inalcançável com o overtime rodando):

```
isOvertime  ? <painel de overtime>            // roda ou parado, com Stop/Resume no topo
: isRunning ? <Stop de :55-62>                // inalterado
: isFinished? <ramo de descanso de :65-81>    // "Back to Work" + engrenagem, inalterado
:             <ramo ocioso de :132-168>       // inalterado
```

Painel de overtime = o markup de `:84-128` MOVIDO (Rest `:85-91`, +5 `:92-101`, +10 `:102-111`, linha
Skip+engrenagem `:112-127` — conteúdo, handlers e classes idênticos, incluindo
`setLastExtraAddedMinutes`), com UMA adição no topo (A6): `Stop` (`variant="danger"`, `onClick={stop}`)
se `isRunning`, senão `Resume` (`variant="primary"`, `onClick={start}`), ambos
`className="w-full py-2 text-base font-medium"`.

O sub-ramo `isResting ? ... : ...` de `:65-130` deixa de precisar do lado `else`: o ramo `isFinished`
passa a renderizar direto o conteúdo de descanso. Não deixar código morto nem duplicar os botões.

Props do `<Timer>` (`:43-53`), `strokeColor` (`:50-52`) e `<UpdateTimerDialog>` (`:170-173`):
**não tocar** (cor/anel são step 02).

## Escopo 2 — `Timer/index.tsx` (só a formatação)

Trocar `:53-58` por formatação com sinal explícito (trap N2.1):

```
const totalSeconds = Number(timerDisplayInSeconds);
const isNegative = totalSeconds < 0;
const absoluteSeconds = Math.abs(totalSeconds);
minutesLeft = Math.floor(absoluteSeconds / 60).toString().padStart(2, "0")
secondsLeft = (absoluteSeconds % 60).toString().padStart(2, "0")
```

e no `<span>` de `:90`: `` `${isNegative ? "-" : ""}${minutesLeft}:${secondsLeft}` ``.
`-83` ⇒ `-01:23`; `0` e `-0` ⇒ `00:00` (`-0 < 0` é `false`, então não sai `-00:00`).

`getPercentage` (`:11-21`), `getCircleDashoffset` (`:23-44`), `circleStrokeColor` (`:64`), o container
(`:66-72`) e a classe do `<span>` (`z-10 tabular-nums`) ficam **intactos** (A8 — clamp e cor são o
step 02).

## OUT (explícito)

Cor vermelha, clamp do anel, qualquer coisa visual além do número · campo novo em
`CountdownTimerState` · teto em overtime ou descanso (P3) · descanso negativo (P5) · alterar
`playAlertSound`/notificação (P6) · `IndexTaskItem`, `useCountUpTimer`, `states/tasks` (N5 é
consequência esperada, não implementação) · persistência (P12) · "corrigir" o `restMinutes` exibido no
`UpdateTimerDialog` (N9) · rótulo novo no botão Rest (P11) · botão de reset no painel de overtime
(o Skip já cobre, e hoje o painel de terminado também não tem).

## Critérios de aceitação (do step)

1. `npx tsc --noEmit` sem erro novo (cada escopo roda UMA vez, no fim, com saída para arquivo).
2. Atividade zera ⇒ o número segue decrescendo em negativo, bem formatado (`-01:23`), `isRunning`
   continua `true`.
3. O alarme toca UMA vez por ciclo; não repete a cada segundo do overtime nem ao retomar após pausa.
4. Rest / +5 / +10 / Skip visíveis e clicáveis DURANTE o overtime, com Stop/Resume disponível.
5. **Critério numérico do usuário:** 25 min @ 20% + ~5 min de overtime + clicar Rest ⇒ descanso inicia
   em **06:00** (±1s) e **decresce de verdade** (se congelar, é N6 ⇒ FAIL).
6. `+5 min` em `-03:00` ⇒ vai para ~`+02:00` e volta a correr; zerando de novo, Rest dá ~06:00.
7. Descanso continua PARANDO em `00:00` com alarme e "Back to Work" (P5, regressão).
8. `Skip`/`Back to Work` zeram o overtime, voltam para a atividade cheia e incrementam
   `totalCycles` (`IndexScore.tsx:26-28`).
9. Cronômetros das tasks continuam correndo no overtime (N5/P13) — mudança observável esperada.

## Modo de teste de sistema

**Docker+browser only** (trap T9: não há suíte nem Docker). `npx tsc --noEmit` + `npm run dev`
(Vite, porta fixa **1420**) + Playwright MCP, com os contornos de notificação e de `browser_click` da
memória §7 e **obrigatoriamente** a técnica de deslocamento de relógio da memória §8 (o mínimo do
slider é 10 min; esperar não é opção).
