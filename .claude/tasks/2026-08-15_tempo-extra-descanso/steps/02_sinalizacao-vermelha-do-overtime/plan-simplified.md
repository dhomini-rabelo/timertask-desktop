# Step 02 — sinalizacao-vermelha-do-overtime

> Leia `../../memoria-da-task.md` ANTES deste arquivo — em especial §2.3 (mapa do componente `Timer`
> com linhas), §5 (moldes de cor que já existem no projeto), §6 (o que este step assume do 01) e as
> traps **N2.2** (o anel quebra com percentual negativo), **N3** (o `twMerge` mata o vermelho no dark
> mode) e **N10** (`lastExtraAddedMinutes` troca o total do anel). Este plano não repete o que está lá.
>
> **Releia `Timer/index.tsx` e `IndexTimer.tsx` no início do step**: o step 01 mexeu nos dois; as
> linhas citadas aqui são do commit-base `a8f2b56` e podem ter deslocado.

## Objetivo

Pedido literal do usuário: *"acho que a cor vermelha expressa bem a ideia de tempo extra"*.

Enquanto o cronômetro estiver em overtime (tempo negativo na fase de atividade), o número **e** o anel
de progresso do `Timer` ficam vermelhos, sem artefato visual no anel e corretos nos dois temas.

## IN

- `src/layout/components/common/Timer/index.tsx`:
  - Cor vermelha do número. **Aplicar no `<span>` de `:90`**, com o par `text-Red-500 dark:text-Red-400`
    (molde: `IndexErrorMessage.tsx:27`). Não aplicar via `className` do container — trap N3.
  - **Clampar o percentual do anel em [0,1]** (`getPercentage:11-21` / `getCircleDashoffset:23-44`) para
    matar o arco fantasma que o `strokeDashoffset > circumference` produz com valor negativo (trap N2.2).
  - Definir e implementar o comportamento do anel no overtime. Recomendação (o plano do step pode
    divergir, desde que justifique e que não haja artefato): o anel volta a encher, agora em vermelho,
    proporcionalmente ao overtime decorrido sobre o total do ciclo, saturando em cheio.
  - A prop nova (ex. `isOvertime?: boolean`) segue o padrão de props opcionais de `TimerProps:3-9`.
- `src/pages/index/components/IndexTimer.tsx`:
  - Passar o vermelho ao `Timer` pela expressão de `strokeColor` que JÁ alterna azul/verde
    (`:50-52`) → `var(--color-Red-400)` no overtime, e sinalizar o estado de overtime ao `Timer`.
  - Se o step 01 tiver criado um botão de pausar no painel de overtime, garantir que a paleta do painel
    continua coerente (nenhum redesenho — só não deixar dois "danger" competindo).

## OUT

- Nenhuma mudança de comportamento, de contagem ou de cálculo de descanso — isso foi o step 01.
- Não pintar de vermelho a fase de DESCANSO (P5: o descanso nem tem overtime) nem trocar o azul/verde
  existentes.
- Nada de animação, piscar, pulsar, som ou badge novo (P9).
- Não mostrar o descanso calculado no botão "Rest" (P11).
- Não mexer em `global.css` — os tokens `--color-Red-500/400/100` já existem em `:13-15`.
- Não tocar em `countdownTimer.ts`.

## Respostas/premissas que valem para ESTE step

P1 (overtime só na atividade), P4 (o painel de overtime tem botão de pausar — a cor dele é assunto
deste step), P5 (descanso não fica vermelho), P9 (vermelho no número e no anel, sem animação),
P11 (sem rótulo novo no Rest). Texto completo em `../../answers.md`.

## Arquivos / âncoras sugeridos

- `src/layout/components/common/Timer/index.tsx` — `3-9` (props), `11-21` (getPercentage),
  `23-44` (dashoffset), `64` (cor do anel), `66-72` (container — trap N3), `90` (o span)
- `src/pages/index/components/IndexTimer.tsx` — `43-53` (props passadas), `50-52` (a expressão de cor),
  `31-33` e `47-49` (`lastExtraAddedMinutes` — trap N10)
- Ler, não editar: `src/layout/styles/global.css:13-15`, `IndexErrorMessage.tsx:27` (o molde de par
  claro/escuro), `IndexScore.tsx:61-62` (outro uso de Red)

## Dependências do step 01

**Dura.** O step 01 é quem cria o estado de overtime (contagem negativa + painel acessível + formatação
`-01:23`). Sem ele não existe nada para pintar de vermelho nem como chegar ao estado no browser.
Confirme no início do step que o overtime já roda e já aparece formatado antes de mexer em cor.

## Modo de teste de sistema

**Docker+browser only.** `npx tsc --noEmit` + `npm run dev` (porta fixa **1420**) + Playwright MCP, com
os contornos da memória §7 e **a técnica de deslocamento de relógio da §8** para entrar em overtime sem
esperar 10 minutos.

Casos mínimos (screenshot por caso, em `tests-{MM}/screenshots/`):

1. **Atividade normal (regressão)**: contando para baixo, número na cor padrão e anel VERDE.
2. **Overtime, tema claro**: número e anel vermelhos, número legível (ex. `-02:14`).
3. **Overtime, tema escuro**: idem — o vermelho tem de sobreviver (trap N3); comparar com o caso 2.
4. **Anel sem artefato**: com o overtime passando de 1× o tempo do ciclo, o anel não desenha arco
   fantasma nem "salta" (trap N2.2). Screenshot em pelo menos dois instantes distintos do overtime.
5. **Anel depois de um "+5 min"** (trap N10): clicar +5, deixar zerar de novo, entrar em overtime; o
   anel continua coerente (sem inversão nem estouro).
6. **Descanso (regressão)**: ao clicar Rest, número volta ao padrão e o anel volta a AZUL — nada de
   vermelho residual.
7. **Regressão de comportamento**: os números do step 01 continuam certos (25 @ 20% + 5 min de overtime
   ⇒ descanso `06:00`). O step 02 não pode ter alterado o cálculo.

## CLASSE

**`julgamento`.** Não há molde de "anel de progresso em estado de overtime" no projeto: é preciso
DEFINIR a semântica do anel para tempo negativo e corrigir uma função de geometria SVG que hoje produz
artefato (trap N2.2), além de contornar uma armadilha real de `twMerge` + dark mode (trap N3) e a
interação com `lastExtraAddedMinutes` (N10). A parte "trocar a cor" é mecânica; o resto não é, e na
dúvida a classe é `julgamento`.
