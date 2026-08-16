# Recon — step 01 (overtime-no-store-e-descanso-proporcional)

Base: commit `47278d818` (branch `main`, working tree clean à parte 3 PNGs soltos na raiz,
não relacionados). Todos os três arquivos-alvo foram relidos por inteiro nesta sessão.

## Confirmação do mapa da memória

Contagem de linhas bate exatamente com a memória (pequena folga de 1 linha em `countdownTimer.ts`,
por convenção de newline final, irrelevante):

| Arquivo | Memória | Real (`wc -l`) |
|---|---|---|
| `src/pages/index/states/countdownTimer.ts` | 289 | 288 |
| `src/pages/index/components/IndexTimer.tsx` | 176 | 176 |
| `src/layout/components/common/Timer/index.tsx` | 93 | 93 |

Todas as âncoras de linha citadas na memória (§2.1, §2.2, §2.3) foram conferidas contra o conteúdo
atual e **não sofreram deslocamento**: `CountdownTimerState:5-15`, `getRestMinutes:38-40`,
`intervalRef/endTimeRef:44-47`, `setState:66-85`, `start:87-131` (guards em `89-91` e `92-94`, tick
em `110-129`, `Math.ceil` em `126-128`), `stop:133-149`, `reset:151-169`, `goBackToWork:171-192`,
`updateActivityMinutes:194-215`, `updatePercentageOfRestingTime:217-226`, `goToRest:228-245`
(fórmula exatamente como descrita: `baseRest`/`extraRest`/`restMinutes`, depois `start()` sem
limpar intervalo antes — **N6 confirmado presente no código atual**), `addExtraTime:247-262`
(mesmo problema de N6 confirmado — também chama `start()` sem limpar o intervalo).

`IndexTimer.tsx`: `hasTimerStarted:35-36`, `isFinished:37` (`currentTimeInSeconds === 0 && !isRunning`,
confirmado), `shouldShowSettingsButton:38-39`, `<Timer>` props `43-53`, ramo `isRunning` (só Stop)
`55-62`, ramo `isFinished` `63-131`, ramo C `132-168`. **N4 confirmado**: hoje o ramo `isRunning`
(linha 55) É EXCLUSIVO do ramo `isFinished` (é um `if/else if`), então com overtime rodando
(`isRunning: true`) o painel Rest/+5/+10/Skip fica de fato inalcançável sem mudar essa estrutura.

`Timer/index.tsx`: `getPercentage:11-21` (não trata negativo, confirmado — cai no ramo `else` e
devolve percentual negativo), formatação `53-58` (`Math.floor`/`%` sem tratamento de sinal,
confirmado que `-65` produziria `"-2:-5"` pois `Math.floor(-65/60) = -2` e `-65 % 60 = -5` em JS).

Nenhuma divergência relevante entre a memória e o código atual. Nada a corrigir no mapa.

## Partição de escopos de implementação

Três arquivos no IN, mas o acoplamento real não é 1-para-1 com "3 escopos paralelos":

- **`countdownTimer.ts` (store) e `IndexTimer.tsx` (condição/painel) são semanticamente acoplados**,
  não apenas arquivos distintos. `IndexTimer.tsx` precisa saber o contrato exato que o store passa a
  produzir durante overtime — que `isRunning` permanece `true`, `isResting` permanece `false` e
  `currentTimeInSeconds` vai negativo — para decidir a nova condição que substitui o `if/else if`
  mutuamente exclusivo de `55-63`. Esse contrato está bem especificado no plano/memória (não é
  descoberta, é leitura de spec), mas o risco de drift silencioso é real: os traps N6/N7/N8 são todos
  DENTRO do store, e qualquer desvio de implementação ali (ex.: `isRunning` cair para `false` num
  caminho não previsto) quebra a condição do painel sem erro de compilação. Tratar como **um único
  escopo de implementação** (mesmo agente/turno, sequencial: store primeiro, painel depois, contra o
  código real e não só a spec) é mais seguro que paralelizar.
- **`Timer/index.tsx` (formatação) é genuinamente independente.** Ele só consome
  `timerDisplayInSeconds` como string — não importa por que/como o valor é negativo, nem o estado de
  `isRunning`/`isResting` que o produziu. É uma função pura de formatação (`getPercentage` +
  `minutesLeft`/`secondsLeft`) sem qualquer leitura do store ou do `IndexTimer`. Pode ser
  implementado e testado (unicamente com `npx tsc --noEmit` + inspeção) em paralelo ao escopo acima,
  sem qualquer dependência de sequência.

**Partição recomendada: 2 escopos**, não 3:
1. `countdownTimer.ts` + `IndexTimer.tsx` (lógica de overtime + condição/painel/pausar-retomar) —
   escopo único, sequencial internamente, por causa do acoplamento semântico acima e dos traps
   N4/N6/N7/N8 que atravessam os dois arquivos.
2. `Timer/index.tsx` (só formatação do negativo) — escopo independente, paralelizável com o escopo 1.

Footprint pequeno (≈40 linhas de mudança real no total), então o ganho de paralelizar 2 vs. 1 escopo
é modesto; a divisão em 2 é defensável mas não obrigatória — se o orquestrador do step preferir rodar
tudo em um único agente de implementação, o risco de coordenação é baixo dado o tamanho.

## Veredito

O próprio plano já classifica CLASSE=`julgamento` (reescrita de ciclo de vida do intervalo em 3
pontos, máquina de estados da UI, decisão de modelo de contabilidade) — a recon confirma que essa
classificação é correta: há acoplamento semântico real entre store e UI (não mecânico), e três modos
de falha silenciosa (N6/N7/N8) que exigem verificação cruzada, não cópia de molde.
