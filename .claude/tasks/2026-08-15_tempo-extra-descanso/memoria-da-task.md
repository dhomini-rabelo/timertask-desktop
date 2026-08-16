# memoria-da-task.md — tempo-extra-descanso

Memória entre steps. Cada step é executado por agentes NOVOS que só têm este arquivo + o
`plan-simplified.md` do seu step. Tudo aqui é resultado de leitura real do código no commit `a8f2b56`.

---

## 1. O pedido, em uma frase operacional

Quando o cronômetro de ATIVIDADE chega a zero, ele não para: passa a contar em negativo (tempo extra),
em vermelho. Ao clicar em "Rest", o descanso é escalado na mesma proporção
atividade→descanso já configurada. Exemplo do usuário, que é o critério de aceite numérico:
**25 min de atividade / 20% de descanso; trabalhou 30 min ⇒ descansa 6 min** (em vez de 5).

---

## 2. Mapa do domínio (leitura real, não refazer)

### 2.1 O store do cronômetro global — `src/pages/index/states/countdownTimer.ts` (289 linhas)

Zustand, formato `{ state, actions }`. **É o único arquivo de lógica desta task.**

| Símbolo | Linhas | O que importa |
|---|---|---|
| `CountdownTimerState` (interface) | `5-15` | campos: `activityMinutes`, `initialMinutes`, `restMinutes`, `currentTimeInSeconds`, `isRunning`, `totalCycles`, `isResting`, `extraAddedMinutes`, `percentageOfRestingTime` |
| `getRestMinutes(activityMinutes, percentage)` | `38-40` | `activityMinutes * (percentage/100)` |
| `intervalRef` / `endTimeRef` | `44-47` | refs de módulo, FORA do zustand. `endTimeRef` é a fonte da verdade do tempo restante |
| `playAlertSound()` | `49-62` | `/car-alarm.mp3` + `sendNotification` do Tauri |
| `setState(partial)` | `66-85` | **enumera campo a campo com `??`** — ver trap N1 |
| `start()` | `87-131` | guard `if (intervalRef.current) return` (`89-91`), guard `if (currentTimeInSeconds <= 0) return` (`92-94`), `endTimeRef = addSeconds(now, currentTimeInSeconds)` (`96-99`), o `setInterval` (`105-130`) |
| — o tick | `110-129` | `millisecondsLeft <= 0` ⇒ `stop()` + `playAlertSound()` + `currentTimeInSeconds: 0` (`115-123`); senão `Math.ceil(ms/1000)` (`125-129`) |
| `stop()` | `133-149` | limpa intervalo, `endTimeRef = null`, `isRunning: false` |
| `reset()` | `151-169` | limpa intervalo; volta para `activityMinutes`; zera `extraAddedMinutes`, `isResting` |
| `goBackToWork()` | `171-192` | igual ao `reset` + `totalCycles + 1` + `start()` |
| `updateActivityMinutes(min)` | `194-215` | limpa intervalo, recalcula `restMinutes`, zera tudo |
| `updatePercentageOfRestingTime(pct)` | `217-226` | só recalcula `restMinutes` |
| **`goToRest()`** | `228-245` | **O MOLDE DA TASK.** `baseRest = getRestMinutes(activityMinutes, pct)`, `extraRest = extraAddedMinutes * (pct/100)`, `restMinutes = baseRest + extraRest`; seta `initialMinutes = restMinutes`, `currentTimeInSeconds = restMinutes*60`, `isResting: true`, `extraAddedMinutes: 0`; chama `start()` |
| `addExtraTime(minutes)` | `247-262` | soma em `extraAddedMinutes`, `initialMinutes` e `currentTimeInSeconds`; chama `start()` |
| estado inicial | `264-275` | 25 min, 20%, `isRunning: false` |

### 2.2 A UI do cronômetro — `src/pages/index/components/IndexTimer.tsx` (176 linhas)

| Trecho | Linhas | O que importa |
|---|---|---|
| `lastExtraAddedMinutes` (useState local) | `31-33` | setado só nos cliques de +5/+10; passado ao `Timer` em `47-49` **apenas se `extraAddedMinutes > 0`** |
| `hasTimerStarted` | `35-36` | `currentTimeInSeconds !== initialMinutes*60` |
| **`isFinished`** | `37` | `currentTimeInSeconds === 0 && !isRunning` — **a condição que precisa virar consciente de overtime** |
| `shouldShowSettingsButton` | `38-39` | `!isRunning && !isResting && !hasTimerStarted && !isFinished` |
| `<Timer>` | `43-53` | recebe `timerDisplayInSeconds` como **string**, `initialTimeInMinutes`, `lastExtraAddedMinutes`, `strokeColor` (azul se `isResting`, senão verde — `50-52`) |
| ramo A: `isRunning` | `55-62` | só o botão "Stop" (`variant="danger"`) |
| ramo B: `isFinished` | `63-131` | `65-81` = descansando ⇒ "Back to Work" + engrenagem; `82-130` = trabalho terminado ⇒ **Rest (`86-91`), +5 (`92-101`), +10 (`102-111`), linha Skip+engrenagem (`112-127`)** |
| ramo C: parado e não terminado | `132-168` | "Start"/"Resume"/"Rest" + engrenagem condicional + botão de reset (`158-166`) |
| `<UpdateTimerDialog>` | `170-173` | modal de configuração |

### 2.3 O componente visual — `src/layout/components/common/Timer/index.tsx` (93 linhas)

| Trecho | Linhas | O que importa |
|---|---|---|
| `TimerProps` | `3-9` | `className`, `timerDisplayInSeconds: string`, `initialTimeInMinutes`, `lastExtraAddedMinutes?`, `strokeColor?` |
| `getPercentage` | `11-21` | 0 se total 0; `cur/total` se menor; 1 se igual; `(cur % total)/total` se maior. **Não trata negativo** — trap N2 |
| `getCircleDashoffset` | `23-44` | raio 45, `circumference = 2πr`; usa `lastExtraAddedMinutes` como total quando > 0 (`30-33`); `strokeDashoffset = C - pct*C` |
| formatação do número | `53-58` | `Math.floor(s/60)` e `s % 60`, cada um com `padStart(2,'0')` — **quebra com negativo**, trap N2 |
| `circleStrokeColor` | `64` | `strokeColor ?? var(--color-Green-400)` |
| container | `66-72` | classes fixas incl. `text-Black-700 ... dark:text-White` + `twMerge(className)` — trap N3 |
| `<circle>` | `77-88` | `stroke={circleStrokeColor}`, `strokeDasharray={circumference}`, `strokeDashoffset`, `transition-all duration-1000` |
| `<span>` do número | `90` | `className="z-10 tabular-nums"` — **é aqui que a cor vermelha deve entrar** (trap N3) |

### 2.4 Quem mais lê o store (footprint completo — grep `useCountdownTimerState` já rodado)

```
src/pages/index/states/countdownTimer.ts          (definição)
src/pages/index/components/IndexTimer.tsx         (a UI principal — §2.2)
src/pages/index/components/UpdateTimerDialog.tsx  (activityMinutes, restMinutes, percentageOfRestingTime + as 2 actions de update)
src/pages/index/components/IndexScore.tsx:26-28   (só `totalCycles`)
src/pages/index/states/tasks/index.ts:312-314     (`executeTask` retorna cedo se `isResting`)
src/pages/index/components/IndexTasks/.../IndexTaskItem/IndexTaskItem.tsx:46-49, 52-57, 68, 115-129
```

O acoplamento perigoso é o último — ver trap N5.

---

## 3. A matemática (já derivada e conferida — NÃO redescobrir)

### 3.1 Prova de que P2 generaliza a fórmula existente

Na fase de atividade vale sempre `initialMinutes = activityMinutes + extraAddedMinutes`
(`reset:163`, `goBackToWork:183`, `updateActivityMinutes:209` setam `initialMinutes = activityMinutes`;
`addExtraTime:250` soma nos dois). Logo, a fórmula de hoje em `goToRest:232-234`:

```
rest = activityMinutes*(p/100) + extraAddedMinutes*(p/100) = initialMinutes * (p/100)
```

E a proposta (P2), com `worked_s = initialMinutes*60 - currentTimeInSeconds`:

```
rest_s = worked_s * (p/100)
```

- Com `currentTimeInSeconds === 0` (caso de hoje): `worked_s = initialMinutes*60` ⇒ **idêntico**.
- Exemplo do usuário: `initialMinutes=25`, `current=-300` ⇒ `worked_s = 1500+300 = 1800` (30 min),
  `p=20` ⇒ `rest_s = 360` = **6 min** ✓.

### 3.2 Por que NÃO criar um acumulador separado de overtime

Um campo tipo `overtimeSeconds` somado a `extraAddedMinutes` **conta em dobro**: se o usuário está em
`-3:00` e clica "+5", `addExtraTime` já converte os 3 minutos vencidos em saldo positivo
(`current: -180+300 = +120`, `initialMinutes: 25→30`). Com acumulador, os mesmos 3 minutos entrariam
de novo no cálculo do descanso. A fórmula de §3.1 é imune a isso porque só lê `initialMinutes` e
`currentTimeInSeconds` — os dois já corretos após o `addExtraTime`. Conferência:
`-3:00`, clica +5, deixa zerar ⇒ `initialMinutes=30`, `current=0` ⇒ worked = 30 min ⇒ rest 6 min ✓.

### 3.3 Retomar do negativo sai de graça

`start():96-99` faz `endTimeRef = addSeconds(new Date(), currentTimeInSeconds)`. Com
`currentTimeInSeconds = -180`, isso resulta num instante 3 minutos NO PASSADO, e o primeiro tick já
devolve `millisecondsLeft ≈ -180000`. Ou seja: pausar e retomar durante o overtime funciona sem
nenhuma matemática adicional — basta relaxar o guard de `92-94`.

### 3.4 Sinal na conversão do tick

`Math.ceil(ms/1000)` está certo para o lado positivo e ERRADO para o negativo
(`Math.ceil(-1500/1000) = -1`, esconde meio segundo e faz o display travar). No ramo negativo use
`Math.floor(ms/1000)`.

---

## 4. FOOTPRINT — arquivos que esta task toca

| Arquivo | Linhas de interesse | Step |
|---|---|---|
| `src/pages/index/states/countdownTimer.ts` | `44-47` (refs), `66-85` (setState), `87-131` (`start` + tick), `133-149` (`stop`), `151-192` (`reset`/`goBackToWork`), `228-245` (`goToRest` — o alvo), `247-262` (`addExtraTime`) | 01 |
| `src/pages/index/components/IndexTimer.tsx` | `35-39` (condições), `43-53` (props do Timer), `55-62` (Stop), `63-131` (painel de ações), `82-130` (o ramo de trabalho terminado) | 01 (lógica/painel) e 02 (cor) |
| `src/layout/components/common/Timer/index.tsx` | `3-9` (props), `11-21` (getPercentage), `23-44` (dashoffset), `53-58` (formatação), `64` (cor do anel), `66-72` (container), `90` (span do número) | 01 (formatação do negativo) e 02 (cor/anel) |
| `src/layout/styles/global.css` | `13-15` (`--color-Red-500/400/100`) — **ler, não editar** | 02 |
| `src/code/utils/date.ts` | `1` (`SECONDS_PER_MINUTE`), `3-12` (`formatTime`, usado só pelo alerta de task) | contexto |

**Persistência: nenhuma.** Grep `localStorage` sobre `src/` (lista completa): `useStoredWorkflows.ts:8,20,52`,
`useStoredTasks.ts:4,126,180-181,196`, `useDarkMode.ts:18,65,67`. O `countdownTimer` **não** aparece —
é 100% memória (P12).

---

## 5. Moldes a espelhar

| Step | O que fazer | Molde que JÁ existe |
|---|---|---|
| 01 | escalar o descanso proporcionalmente | `countdownTimer.ts:228-245` (`goToRest`) — a fórmula já está lá com `extraAddedMinutes`; é generalizar, não inventar (§3.1) |
| 01 | ref de módulo para estado que não é de render (flag "já alertou neste ciclo") | `countdownTimer.ts:44-47` (`intervalRef` / `endTimeRef`) |
| 01 | painel de ações do overtime | `IndexTimer.tsx:82-130` — o painel de `isFinished` já existe; muda a CONDIÇÃO que o exibe, não o conteúdo |
| 01/02 | pausar/retomar | `stop` (`countdownTimer.ts:133-149`) + botão `variant="danger"` de `IndexTimer.tsx:55-62`; retomar é `start` (§3.3) |
| 02 | cor do anel por estado | `IndexTimer.tsx:50-52` — já alterna azul (`var(--color-Blue-400)`) / verde (`var(--color-Green-400)`) pela prop `strokeColor`; vermelho entra na mesma expressão |
| 02 | texto vermelho com dark mode | `IndexErrorMessage.tsx:27` (`text-Red-500 ... dark:text-Red-400`) — é o par de tokens que o projeto usa |

Átomos reutilizáveis (não recriar): `src/layout/components/atoms/{Box,Button,Input,ProgressBar,Select,Dialog}`.

---

## 6. Ordem e o que o step 02 assume do step 01

- **02 assume de 01**: o store já conta negativo, o `Timer` já FORMATA o negativo corretamente
  (`-01:23`) e o painel de ações já é alcançável durante o overtime. O step 02 só acrescenta a
  SINALIZAÇÃO (cor do número + cor e geometria do anel).
- **Ordem obrigatória**: sem 01, não existe estado de overtime para pintar de vermelho, e não há como
  testar a cor no browser.
- **Os dois steps tocam `Timer/index.tsx` e `IndexTimer.tsx`** — são sequenciais, sem paralelismo,
  sem conflito de merge. O step 02 deve reler os dois arquivos (o 01 os terá mudado).

---

## 7. TRAPS

### Novas desta task (achadas por leitura do código, alto valor)

- **N1 — `setState` do store enumera campo a campo (`countdownTimer.ts:66-85`).** Qualquer campo NOVO
  em `CountdownTimerState` precisa ser adicionado ali à mão, senão ele nunca é atualizado e o bug é
  silencioso. Prefira NÃO criar campo novo (§3.2 mostra que não é preciso).
- **N2 — o `Timer` quebra com valores negativos, em dois lugares:**
  1. `index.tsx:53-58` — `-65s` vira `Math.floor(-65/60) = -2` e `-65 % 60 = -5` ⇒ renderiza `-2:-5`.
     Precisa de tratamento explícito de sinal (formatar `Math.abs` e prefixar `-`).
  2. `index.tsx:11-21` + `36-37` — `getPercentage` com `currentSeconds` negativo devolve percentual
     negativo ⇒ `strokeDashoffset = C - (neg)*C > C`, o que faz o tracejado dar a volta e desenhar um
     arco fantasma. **Clampar o percentual em [0,1]** é obrigatório no step 02.
- **N3 — a cor do texto do `Timer` tem armadilha de `twMerge` + dark mode.** O container
  (`index.tsx:69`) traz `text-Black-700 ... dark:text-White`. Passar `text-Red-500` pelo `className`
  derruba o `text-Black-700` (mesmo grupo), mas **NÃO** derruba o `dark:text-White` (variante
  diferente) ⇒ no modo escuro o vermelho some. Solução limpa: pôr a cor no `<span>` de `index.tsx:90`
  (que é filho e vence por especificidade de cascata do próprio elemento), com o par
  `text-Red-500 dark:text-Red-400`. Esta armadilha do `twMerge` já mordeu a task anterior
  (`correcao-layout-tasks`, step 01) — é padrão do projeto, não coincidência.
- **N4 — hoje, com o timer rodando, `IndexTimer` só mostra "Stop" (`:55-62`).** Se o step 01 mudar só
  o store, o overtime roda com `isRunning: true`, `isFinished` (`:37`) fica `false` e o painel com o
  botão **Rest fica inalcançável** — o pedido do usuário deixa de ser executável. A mudança de
  condição em `IndexTimer.tsx` é parte do step 01, não do 02.
- **N5 — parar o timer global hoje PAUSA todos os cronômetros das tasks.**
  `IndexTaskItem.tsx:68` (`isGlobalActive = isGlobalTimerRunning && !isResting`) +
  `:115-129` (`useEffect([isGlobalActive])`) param o count-up da task e gravam evento `stop`
  (`stopTask`). Como o overtime mantém `isRunning: true`, os cronômetros das tasks **passam a continuar
  correndo depois do zero** — é o comportamento desejado (P13), mas é mudança de comportamento
  observável e tem de aparecer no teste de sistema como caso explícito.
- **N6 — `goToRest` (`:228-245`) e `addExtraTime` (`:247-262`) NÃO limpam o intervalo antes de chamar
  `start()`.** Hoje isso é inofensivo porque o timer já está parado quando esses botões aparecem. Com
  o overtime rodando, `start()` cai no guard `if (intervalRef.current) return` (`:89-91`), o
  `endTimeRef` NÃO é recalculado e o próximo tick sobrescreve `currentTimeInSeconds` com o valor
  antigo — **o descanso nunca começa e o "+5" não tem efeito.** Este é o bug mais provável desta task.
  Correção: chamar `stop()` (ou limpar `intervalRef`/`endTimeRef` como fazem `reset:153-158` e
  `goBackToWork:173-178`) ANTES do `setState`+`start()`. `reset`, `goBackToWork` e
  `updateActivityMinutes` já limpam — só esses dois é que não.
- **N7 — o guard `if (currentTimeInSeconds <= 0) return` de `start():92-94` bloqueia retomar o
  overtime.** Precisa passar a permitir valores ≤ 0 na fase de atividade (mantendo o bloqueio no
  descanso, que continua parando no zero por P5).
- **N8 — o alarme não pode virar metralhadora.** Hoje ele toca dentro do tick porque o tick para o
  timer em seguida (`:115-122`). Se o tick continuar rodando, `playAlertSound()` dispararia a cada
  segundo. Precisa de flag "já alertou neste ciclo" (molde: ref de módulo, §5), **resetada nas ações
  que trocam de fase** (`reset`, `goBackToWork`, `goToRest`, `updateActivityMinutes`, `addExtraTime`)
  e **NÃO** resetada em `stop`/`start` (senão pausar e retomar no overtime toca o alarme de novo).
- **N9 — `restMinutes` no store é sobrescrito por `goToRest` com o valor JÁ escalado**, e o
  `UpdateTimerDialog` (`:102`) exibe esse campo como "Resting time". Isso já acontece hoje com o
  `extraAddedMinutes`; com overtime o número exibido no modal fica maior até a próxima mudança de
  slider. **Drift pré-existente, aceito — não "corrigir" nesta task.**
- **N10 — `lastExtraAddedMinutes` (`IndexTimer.tsx:31-33, 47-49`) troca o TOTAL usado pelo anel** por
  `lastExtraAddedMinutes` quando `extraAddedMinutes > 0`. Ou seja, depois de um "+5" o anel passa a
  medir 5 min, não 30. O step 02 precisa decidir o comportamento do anel no overtime **considerando
  este caminho**, não só o caminho limpo.

### Herdadas das tasks anteriores (revalidadas neste commit)

- **T9 — sem testes e sem Docker.** Nenhum `*.test.*`, nenhum runner, nenhum Dockerfile.
  **Não rodar `npm test`** (o script nem existe em `package.json`). Validação = `npx tsc --noEmit`
  + `npm run dev` (Vite, **porta fixa 1420**, `vite.config.ts`) + Playwright MCP.
- **Tela de permissão de notificação do Tauri bloqueia tudo em browser puro.** Contorno já validado
  4x: sobrescrever `window.Notification.permission` (getter → `'granted'`) e `.requestPermission`
  (→ resolve `'granted'`) via `browser_evaluate` ANTES de clicar "Allow notifications", refazendo a
  cada reload. Ver `page.tsx:11-52` e `IndexNotificationRequest`.
- **`browser_click` e a tecla Enter não funcionam neste app** (timeout de "stable" por causa dos
  cronômetros re-renderizando). Contorno validado: `element.click()` real e set de valor via native
  DOM value-setter + `dispatchEvent('input')`, tudo por `browser_evaluate`.
- **`useStoredTasks` grava no `beforeunload`** (chave `timertasks:tasks`). Se plantar fixture de
  tasks, monkey-patch `Storage.prototype.setItem` para engolir escritas nessa chave antes de recarregar.
- **DnD (dnd-kit) não é testável por automação neste ambiente.** Irrelevante aqui, mas não tente.
- **React Compiler ligado** (`babel-plugin-react-compiler` em `vite.config.ts`): código imutável,
  sem mutação de props/estado. Mantenha.
- **`sendNotification` do Tauri falha silenciosamente no browser puro** — o `.catch(() => {})` de
  `countdownTimer.ts:55` engole. Não é sinal de erro no teste.

---

## 8. Como testar overtime sem esperar 10+ minutos (LEIA ANTES DE TESTAR)

O mínimo do slider de atividade é **10 minutos** (`UpdateTimerDialog.tsx:5`) e não há atalho de debug
para o cronômetro GLOBAL (o `IndexDebugTimer` é dos cards de task, não do timer global). Esperar não é
opção.

**Técnica: deslocar o relógio da página.** Todo o cronômetro é derivado de `new Date()`
(`countdownTimer.ts:96-99` e `:110-113` via `date-fns`), então basta injetar por `browser_evaluate`,
ANTES ou DEPOIS de dar Start (funciona nos dois casos, porque `endTimeRef` já foi calculado com o
relógio real):

```js
(() => {
  const RealDate = Date;
  let offset = 0;
  window.__setClockOffset = (ms) => { offset = ms; };
  const Patched = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) { super(RealDate.now() + offset); } else { super(...args); }
    }
    static now() { return RealDate.now() + offset; }
  };
  Patched.parse = RealDate.parse; Patched.UTC = RealDate.UTC;
  window.Date = Patched;
})();
```

Depois: `window.__setClockOffset(11 * 60 * 1000)` avança 11 minutos ⇒ um timer de 10 min entra em
overtime de ~1 min no próximo tick. Avançar mais para ver o overtime crescer.
Cuidado: isso também acelera os count-up das tasks (`useCountUpTimer.ts:30,36-38`) — o que é bom,
porque é justamente o que o caso do trap N5 precisa observar.

Alternativa de baixa fidelidade, só como plano B: aceitar 10 min de relógio real em um único caso.
Não faça disso o caminho principal.

---

## 9. Padrões capturados no step 01

- **Contrato store→UI confirmado em produção**: durante overtime o store mantém
  `isRunning: true`, `isResting: false`, `currentTimeInSeconds < 0`. `IndexTimer.tsx` deriva
  `isOvertime = !isResting && currentTimeInSeconds <= 0` e o checa **primeiro** na cadeia de
  ramos (antes de `isRunning`/`isFinished`) — é isso que resolve N4. Step 02 deve ler esse
  derivado ao decidir a cor do anel/número, não reinventar a condição.
- **`hasAlertedRef` (ref de módulo) é o padrão para "estado de UI que não é de render" neste
  projeto** — reseta nas ações que trocam de fase (`reset`, `goBackToWork`, `goToRest`,
  `updateActivityMinutes`, `addExtraTime`), nunca em `stop`/`start`. Qualquer nova flag desse
  tipo deve seguir o mesmo molde, não um campo no zustand (trap N1).
- **`stop()` antes de `start()` é obrigatório em qualquer ação que precise recalcular
  `endTimeRef` enquanto o intervalo pode estar vivo** (trap N6, confirmado como o bug mais
  provável e agora corrigido em `goToRest`/`addExtraTime`). Step 02 não mexe nisso, mas
  qualquer novo caller de `start()` deve checar essa mesma armadilha.
- **Ressalva do validador, herdada para o step 02**: o tick usa `Math.floor` no ramo negativo
  (per plano/memória §3.4), mas o validador (review-r1.md) argumenta que isso deixa o overtime
  1s adiantado e pula `00:00` — sugestão registrada (não aplicada neste step) de trocar para
  `Math.ceil` quando o step 02 mexer no mesmo tick para o clamp do anel. Reavaliar lá, não
  aqui — não é regressão deste step (aceito com ressalva).
- **Arco fantasma do anel e ausência de cor vermelha durante overtime são comportamento atual
  aceito e confirmado por teste** — é exatamente o que o step 02 resolve (clamp de
  `getPercentage` em `[0,1]` + cor vermelha no `<span>` via `text-Red-500 dark:text-Red-400`,
  não no container, por causa do `twMerge` — trap N3).
- **Técnica de teste validada de novo**: deslocamento de `window.Date` funciona tanto antes
  quanto depois do Start; para o critério numérico exato, prefira comparar a fórmula
  "same-tick" (ler `currentTimeInSeconds` e clicar Rest no mesmo instante) em vez de tentar
  acertar um valor de overtime exato — o round-trip do Playwright MCP introduz drift real de
  segundos entre a leitura e o clique, que não é coberto pelo offset do relógio (que desloca
  apenas o `now()` computado, não acelera o `setInterval` real).

## 9.1 Padrões capturados no step 02

- **Clamp de `getPercentage` em ponto único resolve os dois caminhos de total.**
  `getCircleDashoffset` já resolvia `totalSeconds` (via `initialTimeInMinutes` OU
  `lastExtraAddedMinutes`) ANTES de chamar `getPercentage`; colocar o clamp `Math.min(-cur/total, 1)`
  só dentro de `getPercentage` cobriu a trap N10 de graça, sem duplicar lógica em
  `getCircleDashoffset`. Qualquer geometria nova neste componente deve manter esse único ponto de
  clamp, não espalhar.
- **A cor de estado do texto entra sempre no elemento FILHO mais interno, nunca no container com
  `twMerge`.** Confirmado de novo (já valia para `correcao-layout-tasks`): o container de
  `Timer/index.tsx` tem `dark:text-White` fixo que sobrevive ao `twMerge` de uma nova cor no
  `className` do container; o par `text-Red-500 dark:text-Red-400` só vence de forma confiável
  aplicado no `<span>` que renderiza o texto.
- **Tokens de cor deste projeto (`--color-Red/Green/Blue-400/500`) não têm override `.dark` em
  `global.css`** — um valor usado via CSS var (como `stroke`) é correto nos dois temas sem par
  `dark:`; só quando a cor é aplicada via utility Tailwind (`text-*`) é que o par claro/escuro é
  necessário, por causa de outras classes Tailwind que MUDAM entre temas (`dark:text-White`).
- **Geometria e cor podem ser propriedades independentes na mesma condição de estado.** A prop
  `isOvertime` mudou só a cor (`strokeColor`, `text-Red-*`); a geometria (`getCircleDashoffset`)
  ficou intocada porque o recarregamento proporcional já é função pura do sinal de
  `currentSeconds`, sem precisar saber que está em overtime. Nem toda prop de estado precisa
  atravessar todas as funções — só as que realmente mudam de comportamento nela.
- **Teste "same-tick" via `browser_evaluate` único (leitura + clique atômicos) é o único jeito
  confiável de validar fórmulas por segundo neste app com Playwright MCP** — duas chamadas MCP
  separadas (ler, depois clicar) sempre têm drift de alguns segundos porque o countdown real
  continua rodando entre elas. Uma tentativa de leitura via duplo `requestAnimationFrame` dentro da
  mesma chamada estourou o timeout de 300s do MCP nesta configuração — não vale a pena tentar de
  novo, o same-tick simples (ler texto + calcular + clicar, tudo num único `browser_evaluate`) já é
  suficiente para confirmar a fórmula sem cravar o segundo exato.

## 10. Medição de janela do meta-planner

Nonce `meta-tempo-extra-descanso`. Comando:
`TETO=150000 PASSO=20 .claude/skills/claude-step-loop/scripts/medir-janela.sh "meta-tempo-extra-descanso"`
Último checkpoint registrado em `steps.md`.
