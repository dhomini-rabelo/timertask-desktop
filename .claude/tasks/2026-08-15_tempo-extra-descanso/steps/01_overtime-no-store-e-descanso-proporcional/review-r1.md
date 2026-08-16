APPROVED_WITH_RESALVAS

# Review r1 — step 01 (overtime-no-store-e-descanso-proporcional)

Nonce: `S01-validate-tempo-extra-descanso-r1` · base `47278d8` · working tree (3 arquivos)
Revisados: `src/pages/index/states/countdownTimer.ts`, `src/pages/index/components/IndexTimer.tsx`,
`src/layout/components/common/Timer/index.tsx`.

## Veredito

Implementação **fiel ao plano em todos os pontos vinculantes**, incluindo as duas armadilhas de maior
risco (N6 e N8). O critério numérico do usuário fecha. Nenhum item do OUT foi tocado. Aprovado, com 5
ressalvas registradas abaixo — a R1 é a única com conteúdo técnico real e é uma **decisão do plano**,
não um desvio do implementador.

## Conferência item a item (todos ✓)

| Critério do plano | Estado | Evidência |
|---|---|---|
| Atividade não para no zero; segue negativa; `isRunning` continua `true` | ✓ | `countdownTimer.ts:118-137` — o ramo `millisecondsLeft <= 0` só chama `stop()` se `isResting`; no caso de atividade faz apenas `setState({currentTimeInSeconds})` + `return`, nada mexe em `isRunning` |
| Formatação com sinal explícito (`-01:23`, não `-2:-5`) | ✓ | `Timer/index.tsx:53-58` + `:90` — `Math.abs` + prefixo condicional; `-0 < 0` é `false` ⇒ nunca sai `-00:00` |
| Alarme UMA vez por ciclo, via ref de módulo (sem campo novo no state) | ✓ | `countdownTimer.ts:48` (`hasAlertedRef`), guardado em `:119-122`. `CountdownTimerState` (`:5-15`) e a enumeração de `setState` (`:67-86`) **inalteradas** — trap N1 evitada |
| Flag resetada em reset/goBackToWork/updateActivityMinutes/goToRest/addExtraTime, **não** em stop/start | ✓ | `:174`, `:195`, `:219`, `:248`, `:271`. `stop()` (`:148-164`) e `start()` (`:88-146`) não tocam a flag ⇒ pausar+retomar no overtime não retoca o alarme (endTimeRef é recalculado no passado, `millisecondsLeft<0`, mas `hasAlertedRef` continua `true`) |
| Fase de descanso inalterada (para no zero, alarme, "Back to Work") | ✓ | `:124-130` mantém `stop()` + `currentTimeInSeconds: 0`; `IndexTimer.tsx:127-145` só é alcançável com `isResting === true` (ver R5) |
| Guard de `start()` restrito ao descanso | ✓ | `:93` — `store.state.isResting && currentTimeInSeconds <= 0`. Mínimo do slider é 10 min (`UpdateTimerDialog.tsx:5`), então o estado ocioso nunca nasce em ≤ 0 |
| **N6** — `goToRest()` e `addExtraTime()` chamam `stop()` antes de `start()` | ✓ | `:247` e `:270`. Ordem exigida (`stop → flag → setState → start`) respeitada nos dois. `stop()` zera `intervalRef` e `endTimeRef`, então o guard `if (intervalRef.current) return` de `:90` não dispara e o `endTimeRef` é recalculado. Descanso e +5/+10 funcionam com o timer vivo |
| Fórmula do descanso proporcional | ✓ | `:253-256` — `initialMinutes*60 - currentTimeInSeconds`, `Math.round(worked * p/100)` |
| **Número de aceite: 25 min @ 20% + ~5 min de overtime ⇒ 06:00** | ✓ (refeito à mão) | `initialMinutes=25`, `currentTimeInSeconds ≈ -301` (ver R1), `p=20` ⇒ `worked = 1500 + 301 = 1801` ⇒ `1801*0.2 = 360.2` ⇒ `Math.round = 360` ⇒ `currentTimeInSeconds=360` = **06:00** ✓ (dentro do ±1s do critério 5). Caso `current === 0`: `worked=1500` ⇒ `300` = 05:00, idêntico a hoje ✓. Caso `+5` em `-03:00`: `addExtraTime` ⇒ `initialMinutes=30`, `current=+120`; ao zerar de novo, `worked=1800` ⇒ **06:00**, sem contagem dupla ✓ |
| `getRestMinutes` não apagada | ✓ | `:38-40`, ainda usada em `:221` e `:238` |
| `isOvertime` derivado e PRIMEIRO na cadeia | ✓ | `IndexTimer.tsx:40` e `:56`. `hasTimerStarted` (`:35-36`), `isFinished` (`:37`) e `shouldShowSettingsButton` (`:38-39`) inalterados |
| Painel de overtime reusa o markup (sem duplicar), + Stop/Resume | ✓ | `:57-118` — o bloco antigo `:84-128` foi **movido** (deletado da origem no diff), handlers, variants e classes idênticos, `setLastExtraAddedMinutes` preservado; Stop/Resume novo em `:58-74` com as classes prescritas |
| Sem código morto | ✓ | o sub-ramo `isResting ? … : …` sumiu; o ramo `isFinished` (`:127-145`) renderiza o conteúdo de descanso direto |
| Props do `<Timer>`, `strokeColor`, `<UpdateTimerDialog>` intocados | ✓ | `IndexTimer.tsx:44-54` e `:184-187` sem diff |
| `Timer/index.tsx` só mexeu na formatação | ✓ | `getPercentage` (`:11-21`), `getCircleDashoffset` (`:23-43`), `circleStrokeColor` (`:64`), container e classe do `<span>` (`z-10 tabular-nums`) **sem diff** |
| OUT respeitado | ✓ | 3 arquivos no working tree; nenhum campo novo no state, nenhum teto, descanso não vai a negativo, `playAlertSound` (`:50-63`) intocada, `IndexTaskItem`/`useCountUpTimer`/`states/tasks` intocados, sem persistência, sem rótulo novo no Rest, sem mexer no anel |

## Ressalvas

### R1 — `countdownTimer.ts:133` — `Math.floor` no ramo negativo deixa o overtime 1 s adiantado e pula o `00:00`

Não é desvio: o plano manda `Math.floor` (`plan.md:85-86`) apoiado na memória §3.4 (`Math.ceil` "faz o
display travar"). **Essa premissa não se sustenta neste código**, e o efeito colateral é real.

`endTimeRef` (`:97-100`) é sempre `now + inteiro de segundos` — em `start`, `goToRest`, `addExtraTime`
e `goBackToWork`, `currentTimeInSeconds` é inteiro. Logo `millisecondsLeft` no tick `k` vale sempre
`(S-k)*1000 - drift`, com `drift > 0` pequeno; nunca cai em meio segundo. Com isso:

- `k = S` (instante do zero): `millisecondsLeft = -drift` ⇒ `Math.floor(-0.004) = -1` ⇒ mostra
  **`-00:01`** já no primeiro tick pós-zero. O `00:00` **nunca aparece** na fase de atividade
  (a positiva usa `Math.ceil` e vai de `00:01` direto para `-00:01`), embora apareça no descanso
  (`:127` seta `0` explicitamente) — as duas fases ficam inconsistentes.
- `k = S+m`: `Math.floor(-(m + drift)) = -(m+1)` ⇒ **todo valor de overtime fica 1 s maior** que o
  tempo realmente decorrido. Aos 5 min reais de overtime o display lê `-05:01`.

Correto seria `Math.ceil` também no ramo negativo (`= -floor(elapsed)`, simétrico do positivo):
`ceil(-0.004) = -0` ⇒ `00:00` (o `Timer` já trata `-0`, `plan.md:176`), `ceil(-1.004) = -1`, etc.
Nenhum valor se repete, então não há travamento. Verifiquei que `-0` é inofensivo em todos os
consumidores: `Timer` (`isNegative` `false`, `Math.abs(-0)=0` ⇒ `00:00`), `isOvertime` (`-0 <= 0`),
`isFinished` (`-0 === 0`, mas o ramo `isOvertime` vem antes), `goToRest` (`1500 - (-0) = 1500`),
`addExtraTime` (`-0 + 300 = 300`), `getPercentage` (`-0/1500 = -0`).

**Não bloqueia o step**: o critério de aceite 5 continua fechando em 06:00 (o `Math.round` absorve os
0,2 s de erro) e nenhum critério escrito fala do `00:00`. Fica registrado como decisão a revisitar
(ideal: no step 02, junto do clamp do anel, trocando `:133` para `Math.ceil` e corrigindo a memória
§3.4). Se o teste de sistema medir "N segundos de overtime ⇒ `-00:0N`", vai bater 1 a mais.

### R2 — anel fantasma no overtime (esperado, step 02)

Com `currentSeconds < 0`, `getPercentage` (`Timer/index.tsx:11-21`) devolve percentual negativo e
`strokeDashoffset = C - (neg)*C > C`, desenhando arco invertido. É exatamente o N2.2, **explicitamente
adiado para o step 02** pelo plano (seção OUT). Registrado só para o teste de sistema não confundir
com regressão.

### R3 — `restMinutes` fracionário no modal

`:259-260` grava `restSeconds / 60`, que pode ser fracionário (ex.: `361/60 = 6.017`); o
`UpdateTimerDialog:102` exibe via `formatMinutes` ⇒ "6.0 min". É o drift pré-existente N9, aceito pelo
plano ("não corrigir nesta task"). Sem ação.

### R4 — `+5` com overtime maior que 5 min retoca o alarme

`addExtraTime` reseta `hasAlertedRef` (`:271`, exigido pelo plano/N8). Se o saldo continuar negativo
depois da soma (ex.: `+5` em `-06:00` ⇒ `newCurrent = -60`), o próximo tick cai em
`millisecondsLeft <= 0` com a flag limpa e **o alarme toca de novo** ~1 s depois. É consequência
direta da regra vinculante, não um bug de implementação; anotado porque um testador pode topar com
isso e reportar como falha do critério 3.

### R5 — observações menores, sem ação

- `countdownTimer.ts:116` — o `const store = get()` do tick sombreia o `store` de `:89`. É
  intencional (precisa do estado fresco) e inócuo: o `store` externo só é lido em `:93` e `:99`, antes
  do `setInterval`. Não há script de lint em `package.json`, então não há gate a violar.
- `IndexTimer.tsx:128-145` — o ramo `isFinished` ficou com um `<div className="flex flex-col gap-2 w-full">`
  envolvendo um único filho. O wrapper já existia antes; manter é fiel ao original. Cosmético.
- Confirmado que o ramo `isFinished` só é alcançável com `isResting === true`: `currentTimeInSeconds === 0`
  implica `<= 0`, então com `!isResting` o ramo `isOvertime` captura antes. A remoção do lado `else` do
  antigo `isResting ? … : …` é segura, sem estado órfão.
- Nenhum outro consumidor de `currentTimeInSeconds` do store de countdown existe fora dos 3 arquivos
  (os hits em `IndexTaskItem`/`IndexDebugTimer`/`useCountUpTimer` são do count-up das tasks, store
  diferente) — nada mais quebra com valores negativos.
