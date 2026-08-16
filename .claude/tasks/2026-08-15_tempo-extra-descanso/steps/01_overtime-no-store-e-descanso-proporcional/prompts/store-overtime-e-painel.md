# Escopo: store-overtime-e-painel — step 01_overtime-no-store-e-descanso-proporcional

## Contrato

Fazer o cronômetro de ATIVIDADE seguir contando em negativo depois do zero (overtime), manter o painel
de ações alcançável durante o overtime e escalar o descanso pelo tempo REALMENTE trabalhado.

- Arquivos que você POSSUI (só estes; qualquer outro é de outro agente ou é OUT):
  - `src/pages/index/states/countdownTimer.ts`
  - `src/pages/index/components/IndexTimer.tsx`
- **Não** edite `src/layout/components/common/Timer/index.tsx` (outro agente está formatando o número
  negativo lá, em paralelo). Enquanto ele não termina, o display mostrará `-2:-5` para `-65s` — isso é
  esperado e não é problema seu.

Ordem interna: **store primeiro, depois a UI**, conferindo a UI contra o store real que você acabou de
escrever (não só contra esta spec).

## Decisões vinculantes

- **Nenhum campo novo em `CountdownTimerState`.** `setState` (`countdownTimer.ts:66-85`) enumera campo
  a campo com `??`; campo novo esquecido ali é bug silencioso. Nada de acumulador de overtime (ele
  contaria em dobro).
- **Sem teto** em overtime nem em descanso. **Sem persistência.** Não altere `playAlertSound` nem a
  notificação. Não mexa em `IndexTaskItem`, `useCountUpTimer` nem `states/tasks` (os cronômetros das
  tasks passarem a correr no overtime é consequência DESEJADA).
- **A fase de descanso não muda** (continua parando em `00:00` com alarme).
- Sem rótulo novo no botão Rest (nada de "Rest (6 min)"). Nada de cor/anel — é o step 02.

### Store — `countdownTimer.ts`

1. **Ref do alarme** (nova, ao lado de `:44-47`): `const hasAlertedRef: { current: boolean } = { current: false };`
   Resetar para `false` em `reset`, `goBackToWork`, `goToRest`, `updateActivityMinutes`, `addExtraTime`.
   **NÃO** resetar em `stop` nem em `start` (senão pausar/retomar no overtime toca o alarme de novo).
2. **Tick** (`:110-129`) — nova ordem do callback:
   - `if (!endTimeRef.current) return;` e o cálculo de `millisecondsLeft`: inalterados.
   - passa a fazer `const store = get();` DENTRO do tick, para ler `store.state.isResting` ao vivo.
   - `if (millisecondsLeft <= 0)`:
     - `if (!hasAlertedRef.current) { hasAlertedRef.current = true; playAlertSound(); }`
     - se `isResting`: `stop()` + `setState({ currentTimeInSeconds: 0 })` + `return` (comportamento de
       hoje, intacto).
     - senão (atividade): **não** chamar `stop()`;
       `setState({ currentTimeInSeconds: Math.floor(millisecondsLeft / millisecondsPerSecond) })` + `return`.
       `Math.floor`, não `Math.ceil` — com `Math.ceil(-1500/1000) = -1` o display trava.
   - ramo positivo `Math.ceil(...)`: inalterado.
3. **Guard de `start()`** (`:92-94`): `if (store.state.currentTimeInSeconds <= 0) return;` vira
   `if (store.state.isResting && store.state.currentTimeInSeconds <= 0) return;`.
   O guard `if (intervalRef.current) return` (`:89-91`) fica como está.
   Retomar do negativo não precisa de matemática nova: `addSeconds(new Date(), -180)` (`:96-99`) já dá
   um instante no passado e o primeiro tick devolve `-180000 ms`.
4. **`goToRest()`** (`:228-245`) — ordem obrigatória: `stop()` → `hasAlertedRef.current = false` →
   `setState` → `start()`. Cálculo novo, substituindo `baseRest`/`extraRest` (`:232-234`):
   `workedSeconds = store.state.initialMinutes * secondsPerMinute - store.state.currentTimeInSeconds`
   e `restSeconds = Math.round(workedSeconds * (percentage / 100))`.
   `setState` recebe `restMinutes: restSeconds / secondsPerMinute`,
   `initialMinutes: restSeconds / secondsPerMinute`, `currentTimeInSeconds: restSeconds`,
   `isResting: true`, `extraAddedMinutes: 0`.
   `initialMinutes` **fracionário é correto e obrigatório**: a invariante
   `currentTimeInSeconds === initialMinutes * 60` é o que mantém `hasTimerStarted` falso no início do
   descanso. Não arredonde para minuto inteiro. Não adicione clamp em `restSeconds` (o percentual
   mínimo é 20 e `workedSeconds` nunca é negativo). **Não apague `getRestMinutes` (`:38-40`)** —
   `updateActivityMinutes` e `updatePercentageOfRestingTime` ainda a usam.
5. **`addExtraTime()`** (`:247-262`) — mesma ordem: `stop()` → `hasAlertedRef.current = false` →
   `setState` (aritmética de `:249-252` **inalterada**) → `start()`.

Por que o `stop()` de (4) e (5) é o ponto mais importante do step: hoje esses dois chamam `start()`
sem encerrar o intervalo. Com o overtime rodando, `start()` cai no guard de `:89-91`, `endTimeRef` não
é recalculado e o próximo tick sobrescreve `currentTimeInSeconds` com o valor antigo — **o descanso
nunca começa e o "+5" não tem efeito.** Use `stop()` (não o clear inline de `reset:153-158`): ele
deixa `isRunning` coerente caso o `start()` seguinte caia num guard.

Conferência numérica (já provada, não refazer): `current === 0` ⇒ resultado idêntico ao de hoje;
`initialMinutes=25, current=-300, p=20` ⇒ `worked=1800s` ⇒ `rest=360s` = **06:00**;
`+5` em `-3:00` ⇒ `initialMinutes=30, current=0` ⇒ 06:00 (sem contagem dupla).

### UI — `IndexTimer.tsx`

6. Derivado novo, junto de `:35-39`: `const isOvertime = !isResting && currentTimeInSeconds <= 0;`
   `hasTimerStarted` (`:35-36`), `isFinished` (`:37`) e `shouldShowSettingsButton` (`:38-39`) ficam
   **como estão** — `isFinished` passa a governar só o descanso terminado.
7. Cadeia de ramos de `:55-168`, com `isOvertime` PRIMEIRO:
   `isOvertime ? <painel de overtime> : isRunning ? <Stop de :55-62> : isFinished ? <conteúdo de descanso de :65-81> : <ramo ocioso de :132-168>`.
   O sub-ramo `isResting ? … : …` de `:65-130` perde o lado `else` (vira o conteúdo de descanso
   direto). **Mover** o markup, não duplicar: só pode existir uma cópia dos botões Rest/+5/+10/Skip.
8. Painel de overtime = markup de `:84-128` (Rest `:85-91`, +5 `:92-101`, +10 `:102-111`, linha
   Skip+engrenagem `:112-127`) com handlers, classes e `setLastExtraAddedMinutes` **idênticos**, mais
   UMA linha nova no topo, acima do Rest: se `isRunning`, `Stop` (`variant="danger"`, `onClick={stop}`);
   senão `Resume` (`variant="primary"`, `onClick={start}`) — ambos
   `className="w-full py-2 text-base font-medium"`.
9. Props do `<Timer>` (`:43-53`), `strokeColor` (`:50-52`) e `<UpdateTimerDialog>` (`:170-173`):
   **não tocar**.

## Molde a espelhar

- `countdownTimer.ts:44-47` — `intervalRef`/`endTimeRef`: o molde exato do `hasAlertedRef` (ref de
  módulo fora do zustand, para estado que não é de render).
- `countdownTimer.ts:171-192` (`goBackToWork`) — molde de "encerrar o intervalo antes de `start()`";
  você fará o equivalente via `stop()` em `goToRest`/`addExtraTime`.
- `countdownTimer.ts:228-245` (`goToRest`) — a fórmula proporcional JÁ está lá com
  `extraAddedMinutes`; você está generalizando, não inventando.
- `IndexTimer.tsx:55-62` — o botão `Stop` `variant="danger"`: espelho literal do Stop do painel de
  overtime.
- `IndexTimer.tsx:82-130` — o painel de ações já existe pronto; muda a CONDIÇÃO que o exibe, não o
  conteúdo.

## Footprint (não quebrar)

- `src/pages/index/components/UpdateTimerDialog.tsx` — lê `activityMinutes`, `restMinutes`,
  `percentageOfRestingTime` e chama as duas actions de update. `restMinutes` exibido lá vai ficar
  maior depois de um overtime: **drift pré-existente e aceito, não corrigir**.
- `src/pages/index/components/IndexScore.tsx:26-28` — só `totalCycles`; `goBackToWork` tem de
  continuar incrementando.
- `src/pages/index/states/tasks/index.ts:312-314` — `executeTask` retorna cedo se `isResting`.
- `src/pages/index/components/IndexTasks/.../IndexTaskItem/IndexTaskItem.tsx:46-49, 68, 115-129` —
  `isGlobalActive = isGlobalTimerRunning && !isResting`. Como o overtime mantém `isRunning: true`, os
  cronômetros das tasks passam a NÃO pausar no zero. **É o comportamento desejado — não neutralize.**
- React Compiler está ligado (`babel-plugin-react-compiler`): código imutável, sem mutar props/estado.
- Não existe suíte de testes nem `npm test` neste repo — não tente rodar.

## Estado de git

- Branch: `main` | commit-base: `47278d8` | working tree limpa (à parte PNGs soltos na raiz,
  não relacionados — ignore).

## Critérios de aceitação

1. `npx tsc --noEmit` sem erro novo — rodar **uma única vez, no fim**, com a saída em arquivo:
   `npx tsc --noEmit > /tmp/tsc-step01-store.txt 2>&1; echo "exit=$?"`.
2. Na atividade, ao cruzar o zero o timer NÃO para: `isRunning` segue `true`, `isResting` segue
   `false` e `currentTimeInSeconds` fica negativo, decrescendo 1 por segundo.
3. `playAlertSound()` dispara UMA vez por ciclo — não a cada segundo do overtime, e não de novo ao
   retomar depois de uma pausa.
4. Durante o overtime (rodando OU pausado) o painel Rest/+5/+10/Skip está renderizado, com
   Stop/Resume no topo.
5. `goToRest` com `initialMinutes=25`, `currentTimeInSeconds=-300`, `percentageOfRestingTime=20`
   produz `currentTimeInSeconds === 360` e um descanso que efetivamente ANDA (intervalo novo criado).
6. `addExtraTime(5)` a partir de `-180` leva a `+120` e o timer volta a correr.
7. Descanso ao chegar a zero continua parando em `00:00` com alarme e "Back to Work".
8. `reset`, `goBackToWork` e `updateActivityMinutes` continuam limpando tudo e agora também zeram
   `hasAlertedRef`.
9. Nenhum campo novo em `CountdownTimerState`; nenhum arquivo fora dos dois que você possui foi
   tocado.
