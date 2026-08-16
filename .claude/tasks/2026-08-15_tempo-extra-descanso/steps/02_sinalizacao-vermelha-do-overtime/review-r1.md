APPROVED_WITH_RESALVAS

# Review r1 — STEP 02 "sinalizacao-vermelha-do-overtime"

Task: `tempo-extra-descanso` · branch `main` · base `5c1282d` · round 1 · validador fresh (Opus)

Diff revisado (e só ele):
- `src/layout/components/common/Timer/index.tsx`
- `src/pages/index/components/IndexTimer.tsx`

Type-check e `git diff --stat` já haviam rodado (exit=0 / exatamente 2 arquivos) — não re-executados, conforme instrução.

---

## 1. Aderência às decisões vinculantes

### A1 — anel proporcional em overtime, saturando em cheio — OK

`src/layout/components/common/Timer/index.tsx:15-16`

```ts
} else if (currentSeconds <= 0) {
  return Math.min(-currentSeconds / totalSeconds, 1);
```

Matemática conferida linha a linha:
- O ramo só é alcançado com `totalSeconds > 0` (o guard `totalSeconds <= 0` acima já retornou), então a divisão nunca é por zero nem por negativo.
- Dentro do ramo `currentSeconds <= 0`, logo `-currentSeconds >= 0` → o quociente é `>= 0`. Sinal correto, **não** invertido.
- `Math.min(..., 1)` satura no cheio. Saída garantida em `[0, 1]`.
- **Continuidade na virada**: em `currentSeconds === 0` o novo ramo devolve `-0/total = -0`, numericamente igual (`-0 === 0`) ao que o ramo positivo `currentSeconds < totalSeconds` entregava antes (`0/total = 0`). Sem salto no zero. `strokeDashoffset = circumference - (-0)*circumference = circumference` → anel vazio, exatamente como antes.

### A2 — clamp mora só em `getPercentage`; guard endurecido — OK

`src/layout/components/common/Timer/index.tsx:13` — `if (totalSeconds === 0)` virou `if (totalSeconds <= 0)`. Nenhum outro ramo divide por `totalSeconds` sem passar por esse guard.

`getCircleDashoffset` (`:26-47`) **não foi tocado** — nenhum hunk do diff cai nele. Não há clamp duplicado / código morto. A trap está evitada.

### A3 — prop opcional — OK

`src/layout/components/common/Timer/index.tsx:9` — `isOvertime?: boolean;` declarada no fim de `TimerProps`, no mesmo padrão de `lastExtraAddedMinutes?` / `strokeColor?`. Desestruturada em `:55`.

### A4 — limiar único — OK

Nenhum segundo limiar foi inventado. A cor (número e anel) liga exclusivamente pelo `isOvertime` já derivado em `IndexTimer.tsx:40`:

```ts
const isOvertime = !isResting && currentTimeInSeconds <= 0;
```

Confirmado que essa derivação está **antes** da cadeia `isRunning`/`isFinished` no JSX (linha 40 vs. uso em 52/58/61) e que não há `< 0` nem `!== 0` paralelo em lugar nenhum dos dois arquivos.

### A5 — só a cor recebe `isOvertime`; geometria intacta — OK

A assinatura de `getCircleDashoffset` continua `(initialTimeInMinutes, timerDisplayInSeconds, lastExtraAddedMinutes?)` e a chamada em `:64-68` passa os mesmos 3 argumentos. `isOvertime` não entra na geometria em ponto algum.

### A6 — botão "Stop" do painel de overtime — OK

`src/pages/index/components/IndexTimer.tsx:64-70` continua `variant="danger"`. Não há hunk do diff dentro do painel de ações — o único hunk em `IndexTimer.tsx` é o `strokeColor` + `isOvertime` no `<Timer>` (`:51-58`).

### A7 — dark mode: anel sem variante, número com o par completo — OK, trap N3 evitada

`src/layout/components/common/Timer/index.tsx:95-100`:

```tsx
<span
  className={twMerge(
    "z-10 tabular-nums",
    isOvertime ? "text-Red-500 dark:text-Red-400" : undefined,
  )}
>{`${isNegative ? "-" : ""}${minutesLeft}:${secondsLeft}`}</span>
```

- O vermelho está no `<span>` **filho**, não no `className` do container (`:73-76`, que mantém `text-Black-700 ... dark:text-White` intactos). O `twMerge` do container não foi tocado. A trap N3 (vermelho sumindo no dark porque `dark:text-White` sobrevive ao merge) **não** ocorre: são elementos diferentes, e o filho declara os dois lados do par.
- Par completo `text-Red-500 dark:text-Red-400` presente.
- `z-10 tabular-nums` preservado como base do merge.
- Anel sem `dark:` — verificado por leitura real de `src/layout/styles/global.css`: `--color-Red-500` / `--color-Red-400` estão em `:13-14` e os únicos blocos `.dark` do arquivo são `:49-51` e `:73-75`, ambos só de `background-color`. Nenhum override de token Red. A decisão A7 se confirma no CSS atual.

---

## 2. Critérios de aceitação

| # | Critério | Situação |
|---|---|---|
| 1 | `tsc --noEmit` limpo | OK (já confirmado, exit=0) |
| 2 | Exatamente 2 arquivos alterados | OK (já confirmado) |
| 3 | `getPercentage` sempre em `[0,1]` | OK — ver análise abaixo |
| 4 | Vermelho no `<span>`, par completo, condicionado, sem quebrar `z-10 tabular-nums` | OK (`Timer/index.tsx:95-100`) |
| 5 | `strokeColor` = ternário de 3 ramos, `isOvertime` primeiro | OK (`IndexTimer.tsx:51-57`) |
| 6 | `isOvertime` reusa o derivado existente | OK (`IndexTimer.tsx:58` passa a var de `:40`; zero duplicação da condição) |
| 7 | Painel de ações do overtime inalterado | OK (nenhum hunk em `IndexTimer.tsx:60-188`) |
| 8 | `countdownTimer.ts`, `global.css`, `Button/index.tsx` intocados | OK (decorre do critério 2; nenhum aparece na lista de arquivos alterados) |

### Critério 3 — varredura de domínio de `getPercentage`

Com `totalSeconds = totalMinutes * 60` e `totalMinutes` vindo de `lastExtraAddedMinutes` (quando `> 0`) ou de `initialTimeInMinutes` — sempre `>= 0` no domínio real:

| Caso | Ramo | Resultado |
|---|---|---|
| `totalSeconds <= 0` (qualquer `currentSeconds`) | `:13` | `0` — sem divisão |
| `currentSeconds < 0`, `\|currentSeconds\| < totalSeconds` | `:15` | `(0, 1)` |
| `currentSeconds < 0`, `\|currentSeconds\| >= totalSeconds` | `:15` | `1` (saturado) |
| `currentSeconds === 0` | `:15` | `-0` ≡ `0` |
| `0 < currentSeconds < totalSeconds` | `:17` | `(0, 1)` |
| `currentSeconds === totalSeconds` | `:19` | `1` |
| `currentSeconds > totalSeconds` | `:21` | `(módulo)/total` ∈ `[0, 1)` |

Nenhuma combinação escapa de `[0, 1]`. Nenhuma divisão por zero ou por negativo sobrou.

### Ramos positivos pré-existentes — bit a bit intactos

Confirmado no diff: os três ramos positivos (`currentSeconds < totalSeconds` → razão; `=== totalSeconds` → `1`; `else` → módulo) aparecem como linhas de **contexto** no hunk, sem uma única alteração de caractere. A única mudança semântica para eles é que `currentSeconds === 0` deixou de cair no primeiro ramo positivo e passou a cair no novo ramo — mas ambos devolvem `0`, então não há regressão na atividade normal nem no "recomeçar o ciclo".

### Ordem do ternário — intenção, não coincidência

`IndexTimer.tsx:51-57` escreve `isOvertime ? vermelho : isResting ? azul : verde`, com `isOvertime` primeiro, como A4 exige. Confirmado que a ordem é semanticamente segura e não apenas acidental: `isOvertime` já embute `!isResting` na própria derivação (`:40`), então os dois estados são mutuamente exclusivos por construção — a ordem escrita expressa a prioridade pretendida e continuaria correta ainda que a exclusividade mudasse no futuro em favor de `isResting`. Os dois casos existentes (azul no descanso, verde na atividade) permanecem alcançáveis e inalterados.

---

## 3. Padrões do repo

- `twMerge` como mecanismo de composição de classe: consistente com `Box`, `Logo`, `Button`, `Input`, `Dialog/content`, `IndexFooter`.
- Tokens `Red-500` / `Red-400` via classe Tailwind: consistente com o uso existente em `IndexErrorMessage.tsx:27` (que usa exatamente o par `text-Red-500 dark:text-Red-400`), `IndexEditInput.tsx:64`, `IndexTaskGroup.tsx:113`.
- `strokeColor` como string CSS-var: mantém o contrato já existente da prop (`"var(--color-Green-400)"` era o default em `Timer/index.tsx:69`); `var(--color-Red-400)` segue o mesmo formato.
- Prop booleana opcional sem default explícito, lida como truthy: coerente com o restante do componente.

Nada de padrão inventado que contradiga um existente.

---

## 4. Ressalvas (registrar, **não** corrigir)

**R1 — `: undefined` como ramo falso do `twMerge`** · `src/layout/components/common/Timer/index.tsx:98`
O único precedente equivalente no repo (`IndexFooter.tsx:48-50`) usa `: ""` no lugar de `: undefined`. Funcionalmente idênticos para `twMerge` (ambos são ignorados), então não há bug nem risco — é só um desvio micro-estilístico de um precedente único. Não vale uma rodada de fix; registrado para consistência futura.

**R2 — segundo consumidor de `<Timer>` herda a correção de `getPercentage`** · `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx:180-184`
O mini-timer do item de tarefa usa o mesmo `Timer` e **não** recebe `isOvertime` (prop opcional → segue sem vermelho, correto para o escopo deste step). Porém ele herda a mudança de `getPercentage`: antes, com `currentTimeInSeconds < 0`, recebia percentual **negativo** → `strokeDashoffset > circumference` → anel renderizado errado; agora recarrega proporcionalmente e satura. É uma melhoria consistente com A1, não uma regressão — mas é uma mudança visual fora do alvo declarado do step, e deve ser olhada de passagem no teste de sistema para não virar surpresa.

Nenhuma das duas ressalvas bloqueia o teste de sistema.

---

## 5. O que está faltando

Nada. Não há caller a atualizar (o outro consumidor de `<Timer>` funciona com a prop opcional ausente), não há tipo a exportar, não há guard removido, não há migração implicada. `getPercentage` e `getCircleDashoffset` são locais ao módulo (`grep` confirmou: nenhum uso fora de `Timer/index.tsx`), então a mudança de comportamento não vaza para outro ponto do código além do já analisado em R2.

---

## Veredito

**APPROVED_WITH_RESALVAS** — as 8 decisões vinculantes (A1–A7) e os 8 critérios de aceitação estão atendidos; a matemática do clamp e a continuidade em zero foram verificadas caso a caso; a trap N3 do dark mode foi evitada corretamente. As duas ressalvas são de registro, não de correção. Segue para o teste de sistema.
