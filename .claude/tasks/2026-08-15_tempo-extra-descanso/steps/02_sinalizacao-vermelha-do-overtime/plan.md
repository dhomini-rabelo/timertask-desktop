# plan.md — STEP 02 · sinalizacao-vermelha-do-overtime

Base: branch `main`, commit `5c1282d` (step 01 fechado). Escopo único, 2 arquivos.
Linhas citadas abaixo foram RELIDAS no commit atual (não são as do `a8f2b56`).

## Premissas assumidas

Nenhuma pergunta ao usuário (run autônomo; P1/P4/P5/P9/P11 já travadas em `../../answers.md`).
As decisões abaixo são vinculantes para o implementador, o revisor e o testador.

- **A1 — Semântica do anel no overtime: recarregar proporcional, saturando em cheio.**
  Adoto a recomendação do `plan-simplified.md`. Com `currentSeconds <= 0`, o percentual passa a ser
  `min(-currentSeconds / totalSeconds, 1)`. Justificativa: (a) é contínuo — em `currentSeconds === 0`
  dá exatamente `0`, o mesmo valor que o ramo de contagem regressiva entrega no zero, então não há
  salto no instante da virada; (b) é monotônico e satura, então nunca reentra em `> 1` (é o próprio
  clamp exigido pela trap N2.2); (c) dá leitura de progresso ao overtime ("já estourei metade do
  ciclo") em vez de um anel morto. Anel vazio-travado foi descartado: mata o clamp de graça, mas
  deixa o overtime sem qualquer informação de magnitude.
- **A2 — O clamp mora em `getPercentage`, ponto único.** `getCircleDashoffset` já resolve
  `totalSeconds` (via `initialTimeInMinutes` OU via `lastExtraAddedMinutes`, `:30-34`) ANTES de
  chamar `getPercentage(totalSeconds, currentSeconds)` (`:36`). Logo um clamp dentro de
  `getPercentage` cobre os DOIS caminhos da trap N10 automaticamente, sem duplicar lógica. NÃO
  adicionar um segundo clamp em `getCircleDashoffset` — seria código morto.
- **A3 — O overtime chega ao `Timer` por prop nova `isOvertime?: boolean`, não é derivado dentro do
  componente.** O `Timer` sozinho não consegue decidir: o limiar correto é
  `!isResting && currentTimeInSeconds <= 0` e o `Timer` não conhece `isResting`. Derivar de
  `totalSeconds < 0` pintaria de vermelho tarde demais (só a partir de `-00:01`) e derivar de
  `<= 0` pintaria também o fim do descanso, violando P5. A prop entra como opcional, seguindo o
  padrão de `TimerProps:3-9`.
- **A4 — Limiar único, o mesmo do step 01.** A cor liga em `isOvertime`
  (`IndexTimer.tsx:40`), ou seja já em `00:00` na fase de atividade — exatamente o instante em que o
  painel de overtime aparece. Não inventar um segundo limiar (`< 0`) só para a cor: o número e o
  painel virariam vermelhos em segundos diferentes.
- **A5 — A GEOMETRIA do anel não recebe `isOvertime`; só a COR recebe.** O recarregamento de A1 é
  função pura de `currentSeconds <= 0` e é inofensivo no descanso (que para em `0`, nunca fica
  negativo — P1/P5): em `0` o percentual é `0` nos dois regimes. Isso mantém a assinatura de
  `getCircleDashoffset` intacta e o diff mínimo.
- **A6 — O botão "Stop" do painel de overtime CONTINUA `variant="danger"`.** O
  `plan-simplified.md` pede só "não deixar dois danger competindo"; o Stop do overtime
  (`IndexTimer.tsx:59-65`) é a MESMA affordance do Stop do ramo normal (`:120-126`), que é
  `danger` desde antes da task. Trocar a variante seria redesenho não pedido e quebraria a
  consistência entre estados. O vermelho de texto/anel (`Red-500/400`, sem fundo) e o vermelho
  sólido do botão (`bg-Red-500`) são visualmente distintos e coexistem por desenho. **Nada muda no
  painel.**
- **A7 — Sem variante `dark:` para o anel.** `global.css:13-14` define `--color-Red-500: #EB4646` e
  `--color-Red-400: #F24F4F` fora de qualquer bloco `.dark` (recon confirmou: não há override
  escuro para Red/Green/Blue). `var(--color-Red-400)` já é correto nos dois temas, igual ao azul e
  ao verde de hoje. O par `dark:` é necessário SÓ no número, porque ali a cor é utility Tailwind e
  precisa vencer o `dark:text-White` herdado (trap N3).

## Escopo único: `sinalizacao-vermelha-do-overtime`

Prompt pronto: `prompts/sinalizacao-vermelha-do-overtime.md`. Um agente só — os dois arquivos são
entrelaçados (a cor do anel é decidida em `IndexTimer.tsx`, a geometria em `Timer/index.tsx`), não
paralelizar.

### Arquivo 1 — `src/layout/components/common/Timer/index.tsx` (94 linhas hoje)

1. **`TimerProps` (`:3-9`)** — acrescentar `isOvertime?: boolean;` depois de `strokeColor?`.
2. **`getPercentage` (`:11-21`)** — inserir, ANTES dos ramos existentes e depois do guard de total,
   o ramo de overtime de A1: quando `currentSeconds <= 0`, retornar
   `Math.min(-currentSeconds / totalSeconds, 1)`. Endurecer o guard de `totalSeconds === 0` para
   `totalSeconds <= 0` (evita divisão por total negativo; não muda comportamento real, pois
   `totalMinutes*60 >= 0` sempre). Os três ramos positivos existentes (`<`, `===`, `%`) ficam
   INTACTOS. Resultado: a função nunca mais devolve valor fora de `[0,1]`.
3. **`getCircleDashoffset` (`:23-44`)** — **não mexer**. Ver A2/A5.
4. **Assinatura do componente (`:46-52`)** — desestruturar `isOvertime` junto com as outras props.
5. **`<span>` do número (`:91`)** — trocar a string fixa por
   `twMerge("z-10 tabular-nums", isOvertime ? "text-Red-500 dark:text-Red-400" : undefined)`.
   `twMerge` já está importado (`:1`) e é v3 (`package.json:26`), que aceita `undefined`.
   **NUNCA** pôr a cor no `className` do container (`:69-72`) — trap N3, o `dark:text-White` de
   `:70` sobrevive e o vermelho some no tema escuro. No `<span>` a declaração própria vence a
   herança nos dois temas.
6. Formatação do negativo (`:53-59`, `:91`) — **não mexer**, já entregue pelo step 01.

### Arquivo 2 — `src/pages/index/components/IndexTimer.tsx` (191 linhas hoje)

1. **`strokeColor` do `<Timer>` (`:51-53`)** — o ternário azul/verde vira encadeado de três, com
   `isOvertime` PRIMEIRO (mesma ordem da cadeia de ramos do step 01, memória §9):
   `isOvertime ? "var(--color-Red-400)" : isResting ? "var(--color-Blue-400)" : "var(--color-Green-400)"`.
2. **Passar `isOvertime={isOvertime}`** ao `<Timer>` (bloco `:44-54`), reusando o derivado que já
   existe em `:40`. **Não** recriar a condição.
3. Todo o resto do arquivo (`:55-190`, painel de overtime, botões, `lastExtraAddedMinutes`)
   permanece byte a byte igual. Ver A6.

### Fora de escopo (não tocar)

`countdownTimer.ts`, `global.css`, `Button/index.tsx`, qualquer cálculo/contagem/store, pintar o
descanso de vermelho, animação/piscar/som/badge, rótulo novo no botão Rest, os 3 PNGs untracked da
raiz. A ressalva `Math.floor` vs `Math.ceil` do tick (memória §9): **NÃO reavaliar aqui** — este
step não abre `countdownTimer.ts`, então a condição "quando o step 02 mexer no mesmo tick" não se
realiza; segue registrada como aceita com ressalva.

## Critérios de aceite

1. `npx tsc --noEmit` limpo.
2. `git diff --stat` mostra exatamente 2 arquivos alterados.
3. Atividade contando normalmente: número na cor padrão (preto/branco por tema), anel VERDE,
   drenando como antes.
4. Em overtime (atividade, `currentTimeInSeconds <= 0`): número `-MM:SS` em `text-Red-500`
   (claro) / `text-Red-400` (escuro) e anel `var(--color-Red-400)`.
5. Anel em overtime recarrega proporcionalmente ao tempo excedido sobre o total do ciclo e
   **satura em cheio** — nunca ultrapassa a volta, nunca desenha arco fantasma nem "salta"
   (trap N2.2), inclusive depois de um "+5 min" (trap N10).
6. Descanso: número padrão e anel AZUL, zero vermelho residual (P5).
7. O cálculo do descanso do step 01 continua exato: 25 min @ 20% + 5 min de overtime ⇒ `06:00`.

## Teste de sistema (o testador segue isto)

**Docker+browser only.** `npx tsc --noEmit` + `npm run dev` (porta fixa **1420**) + Playwright MCP.
Contornos obrigatórios da memória §7: patch de `window.Notification` antes de "Allow notifications";
`element.click()` via `browser_evaluate` (o `browser_click` dá timeout neste app); nada de `npm test`
(script inexistente). Para entrar em overtime sem esperar, usar o deslocamento de `window.Date` da
memória §8. Um screenshot por caso em `tests-{MM}/screenshots/`.

1. **Regressão atividade** — contando para baixo: cor padrão + anel verde.
2. **Overtime, tema claro** — número e anel vermelhos, número legível (ex. `-02:14`).
3. **Overtime, tema escuro** — idem; o vermelho tem de sobreviver (trap N3). Comparar com o caso 2:
   se no escuro o número aparecer branco, a cor foi parar no container.
4. **Anel sem artefato** — avançar o relógio além de 1× o total do ciclo; dois instantes distintos
   do overtime (ex. ~50% do ciclo excedido e ~150%): no primeiro o anel está parcial, no segundo
   cheio e ESTÁVEL. Nenhum arco fantasma do lado oposto.
5. **Anel depois de "+5 min"** (trap N10) — clicar +5 em overtime, deixar zerar de novo, reentrar em
   overtime: o anel recarrega na escala de 5 min, sem inversão nem estouro.
6. **Regressão descanso** — clicar Rest: número padrão, anel AZUL.
7. **Regressão numérica do step 01** — 25 @ 20% + 5 min de overtime ⇒ descanso `06:00`. Usar a
   comparação "same-tick" da memória §9 (ler `currentTimeInSeconds` e clicar Rest no mesmo instante)
   em vez de perseguir um valor exato de overtime.
