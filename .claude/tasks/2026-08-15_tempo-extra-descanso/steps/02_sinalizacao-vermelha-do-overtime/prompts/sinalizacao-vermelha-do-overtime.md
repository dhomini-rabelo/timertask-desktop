# Escopo único — sinalizacao-vermelha-do-overtime (STEP 02)

Git: branch `main`, base `5c1282d`. Você é o ÚNICO implementador deste step.
**Arquivos que você possui (só estes dois podem mudar):**
- `src/layout/components/common/Timer/index.tsx` (94 linhas)
- `src/pages/index/components/IndexTimer.tsx` (191 linhas)

O step 01 já entregou o overtime funcionando (store conta negativo, `Timer` já formata `-01:23`,
painel Stop/Resume + Rest/+5/+10/Skip acessível, fórmula proporcional do descanso). **Nada disso
muda.** Este step é só SINALIZAÇÃO: cor vermelha + geometria do anel.

## Contrato

### `src/layout/components/common/Timer/index.tsx`

1. `TimerProps` (`:3-9`): acrescentar `isOvertime?: boolean;` após `strokeColor?`.
2. `getPercentage` (`:11-21`): trocar o guard `totalSeconds === 0` por `totalSeconds <= 0` e inserir
   logo depois o ramo de overtime — quando `currentSeconds <= 0`, retornar
   `Math.min(-currentSeconds / totalSeconds, 1)`. Os três ramos positivos existentes (`<`, `===`,
   `%`) ficam intactos. Depois disso a função nunca devolve valor fora de `[0,1]`.
3. `getCircleDashoffset` (`:23-44`): **não tocar.** Ele já resolve `totalSeconds` (via
   `initialTimeInMinutes` OU `lastExtraAddedMinutes`, `:30-34`) antes de chamar `getPercentage`
   (`:36`), então o clamp do item 2 cobre os dois caminhos sozinho. **Não** adicione um segundo
   clamp aqui — seria código morto e o revisor vai marcar.
4. Assinatura do componente (`:46-52`): desestruturar `isOvertime`.
5. `<span>` do número (`:91`): trocar `className="z-10 tabular-nums"` por
   `className={twMerge("z-10 tabular-nums", isOvertime ? "text-Red-500 dark:text-Red-400" : undefined)}`.
   `twMerge` já está importado em `:1`.
6. Não mexer na formatação do negativo (`:53-59`) nem no container (`:69-72`).

### `src/pages/index/components/IndexTimer.tsx`

1. `strokeColor` do `<Timer>` (`:51-53`): virar ternário de três com `isOvertime` PRIMEIRO —
   `isOvertime ? "var(--color-Red-400)" : isResting ? "var(--color-Blue-400)" : "var(--color-Green-400)"`.
2. Passar `isOvertime={isOvertime}` ao `<Timer>` (bloco `:44-54`), reusando o derivado que já existe
   em `:40` (`const isOvertime = !isResting && currentTimeInSeconds <= 0`). **Não recrie a condição.**
3. Nada mais muda: `:55-190` (painel de overtime, botões, `lastExtraAddedMinutes`) fica byte a byte
   igual.

## Decisões vinculantes (não reabrir)

- **Semântica do anel no overtime**: recarrega em vermelho, proporcional ao tempo excedido sobre o
  total do ciclo, saturando em cheio. Em `currentSeconds === 0` dá `0`, exatamente o valor que a
  contagem regressiva entrega no zero ⇒ virada contínua, sem salto.
- **A cor vai no `<span>`, NUNCA no `className` do container.** O container (`:70`) tem
  `text-Black-700 ... dark:text-White`; `twMerge` derruba o `text-Black-700` mas NÃO o
  `dark:text-White` (variant bucket diferente) e o vermelho sumiria no tema escuro. Sempre o PAR
  `text-Red-500 dark:text-Red-400`.
- **O anel não precisa de variante `dark:`**: `global.css:13-14` define `--color-Red-500/400` fora de
  qualquer bloco `.dark`, igual ao verde e ao azul de hoje.
- **A geometria não recebe `isOvertime`** — só a cor. O recarregamento é função pura de
  `currentSeconds <= 0` e é inofensivo no descanso, que para em `0` e nunca fica negativo.
- **Limiar único**: a cor liga em `isOvertime` (já em `00:00` na atividade), o mesmo instante em que
  o painel de overtime aparece. Não invente um limiar `< 0` só para a cor.
- **O botão "Stop" do painel de overtime continua `variant="danger"`** (`:59-65`). É a mesma
  affordance do Stop normal (`:120-126`) e mudar seria redesenho não pedido.

## Footprint que você não pode quebrar

- `IndexTimer.tsx:40` — `isOvertime` é checado ANTES de `isRunning`/`isFinished` na cadeia de ramos
  (`:56`, `:119`, `:127`). Essa ordem resolve a trap N4 do step 01; preserve-a.
- `IndexTimer.tsx:48-50` — `lastExtraAddedMinutes` só é passado quando `extraAddedMinutes > 0`.
  Não altere.
- `Timer/index.tsx:53-59` — formatação `isNegative`/`absoluteSeconds` é entrega do step 01.
- `Timer/index.tsx:88` — a classe `transition-all duration-1000 ease-linear` do `<circle>` fica;
  ela é a transição pré-existente, não é "animação nova" (que está fora de escopo).
- React Compiler está ligado: código imutável, sem mutar props/estado.

## Fora de escopo (não abrir, não editar)

`src/pages/index/states/countdownTimer.ts`, `src/layout/styles/global.css`,
`src/layout/components/atoms/Button/index.tsx`, qualquer cálculo/contagem/store, pintar o descanso de
vermelho, animação/piscar/som/badge novo, rótulo novo no botão Rest. Ignore os 3 PNGs untracked na
raiz do projeto (não são desta task). Não rode `npm test` — o script não existe.

## Critérios de aceite

1. `npx tsc --noEmit` limpo.
2. `git diff --stat`: exatamente 2 arquivos alterados.
3. Overtime na atividade ⇒ número `text-Red-500` (claro) / `text-Red-400` (escuro) e anel
   `var(--color-Red-400)`.
4. Anel em overtime recarrega proporcional e satura em cheio; nunca ultrapassa a volta nem desenha
   arco fantasma — inclusive no caminho `lastExtraAddedMinutes` (depois de "+5"/"+10").
5. Regressões: atividade normal = anel verde + cor padrão; descanso = anel azul + cor padrão, zero
   vermelho residual; o cálculo do descanso do step 01 (25 @ 20% + 5 min de overtime ⇒ `06:00`)
   continua idêntico.
