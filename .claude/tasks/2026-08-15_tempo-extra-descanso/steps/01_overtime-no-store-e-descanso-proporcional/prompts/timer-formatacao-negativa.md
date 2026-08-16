# Escopo: timer-formatacao-negativa — step 01_overtime-no-store-e-descanso-proporcional

## Contrato

O cronômetro global passa a receber `timerDisplayInSeconds` NEGATIVO (tempo extra). Hoje o componente
formata errado: `-65` vira `Math.floor(-65/60) = -2` e `-65 % 60 = -5` ⇒ renderiza `-2:-5`.
Corrigir **apenas a formatação do número**, com sinal explícito: `-83` ⇒ `-01:23`.

- Arquivo que você POSSUI: `src/layout/components/common/Timer/index.tsx` — **e só ele**.
  Outro agente está mexendo em `countdownTimer.ts` e `IndexTimer.tsx` em paralelo; não abra para
  editar, não "ajude".

## Decisões vinculantes

- Trocar `:53-58` por formatação com sinal:
  ```
  const totalSeconds = Number(timerDisplayInSeconds);
  const isNegative = totalSeconds < 0;
  const absoluteSeconds = Math.abs(totalSeconds);
  minutesLeft = Math.floor(absoluteSeconds / 60).toString().padStart(2, "0")
  secondsLeft = (absoluteSeconds % 60).toString().padStart(2, "0")
  ```
  e no `<span>` de `:90`: `` `${isNegative ? "-" : ""}${minutesLeft}:${secondsLeft}` ``.
  `0` e `-0` continuam saindo `00:00` (`-0 < 0` é `false`).
- **NÃO** tocar em `getPercentage` (`:11-21`) nem em `getCircleDashoffset` (`:23-44`). Sim, com
  segundos negativos o percentual fica negativo e o anel desenha um arco fantasma — **o clamp é do
  step 02, deliberadamente fora deste escopo.**
- **NÃO** tocar em `circleStrokeColor` (`:64`), no container (`:66-72`) nem nas classes do `<span>`
  (`z-10 tabular-nums`). Nada de cor vermelha — step 02.
- Não mudar a interface `TimerProps` (`:3-9`): `timerDisplayInSeconds` continua `string`.
- Não criar helper em outro arquivo, não extrair util: a mudança mora dentro deste componente.

## Molde a espelhar

- `Timer/index.tsx:53-58` — o próprio trecho: mesma forma (`Math.floor` + `%` + `padStart(2, "0")`),
  só que aplicada ao valor absoluto, com o sinal prefixado na string final de `:90`.

## Footprint (não quebrar)

- `src/pages/index/components/IndexTimer.tsx:43-53` é o único consumidor relevante do `Timer` e passa
  `currentTimeInSeconds.toString()`. O contrato de props não pode mudar.
- Grep antes de assumir exclusividade: se houver outro consumidor de `<Timer>`, ele tem de continuar
  renderizando exatamente igual para valores ≥ 0 (`0` ⇒ `00:00`, `1500` ⇒ `25:00`, `59` ⇒ `00:59`).
- React Compiler está ligado: nada de mutação, mantenha o cálculo puro no corpo do componente.
- Não existe suíte de testes nem `npm test` neste repo — não tente rodar.

## Estado de git

- Branch: `main` | commit-base: `47278d8` | working tree limpa (à parte PNGs soltos na raiz,
  não relacionados — ignore).

## Critérios de aceitação

1. `npx tsc --noEmit` sem erro novo — rodar **uma única vez, no fim**, com a saída em arquivo:
   `npx tsc --noEmit > /tmp/tsc-step01-timer.txt 2>&1; echo "exit=$?"`.
2. `-83` ⇒ `-01:23`; `-65` ⇒ `-01:05`; `-3600` ⇒ `-60:00`; `0` ⇒ `00:00`; `1500` ⇒ `25:00`;
   `59` ⇒ `00:59` (verificar por leitura/raciocínio; não há runner de testes).
3. Nenhuma alteração em `getPercentage`, `getCircleDashoffset`, cores, classes ou `TimerProps`.
4. Nenhum arquivo além de `src/layout/components/common/Timer/index.tsx` tocado.
