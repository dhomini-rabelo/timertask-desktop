## Mapa de arquivos
- `src/pages/index/components/IndexTimer.tsx` | consome `Timer`, decide `isOvertime` e `strokeColor` | 40 (isOvertime), 44-54 (uso do Timer/strokeColor), 31-33 e 47-50 (lastExtraAddedMinutes)
- `src/layout/components/common/Timer/index.tsx` | componente puro: número + anel SVG | 11-21 (getPercentage), 23-44 (getCircleDashoffset), 54-59 (formatação do número negativo), 65 (fallback strokeColor), 67-93 (render, span linha 91)
- `src/layout/components/atoms/Button/index.tsx` | define variant "danger" = bg sólido, não texto | 3, 18-19
- `src/pages/index/components/IndexTasks/IndexErrorMessage.tsx` | único mold de par claro/escuro para texto vermelho no repo | 27
- `src/layout/styles/global.css` | tokens de cor, sem override dark para Red/Green/Blue | 8-21 (não editar)
- `src/pages/index/states/countdownTimer.ts` | produz `currentTimeInSeconds` negativo durante overtime de atividade | 106-145 (loop do interval), 118-137 (ramo overtime não windows/reseta ao passar de 0)

## Molde a espelhar
`src/pages/index/components/IndexTasks/IndexErrorMessage.tsx:27` é o único par claro/escuro de vermelho em uso no repo:
```
className="... text-Red-500 ... dark:text-Red-400"
```
É texto (Tailwind utility), aplicável direto ao `<span>` do Timer (linha 91). Para o ANEL, a cor não passa por classe Tailwind: é a prop `stroke={circleStrokeColor}` recebendo uma CSS var (`var(--color-Green-400)` / `var(--color-Blue-400)`, já usado assim em `IndexTimer.tsx:51-53`). Achado importante: `global.css` (linhas 8-21) NÃO define override de Red-400/Green-400/Blue-400 sob `.dark` — são o mesmo valor hex nos dois temas. Logo, para o anel, um único `var(--color-Red-400)` já funciona correto em claro e escuro sem variante `dark:`; só o número (texto Tailwind) precisa do par `text-Red-500 dark:text-Red-400`.

## Footprint
- `IndexTimer.tsx:44-54` | único consumidor de `<Timer>`; é aqui que `strokeColor` é decidido e teria que virar um terceiro caso (vermelho quando `isOvertime`).
- `IndexTimer.tsx:56-118` | painel de ações do overtime; já usa `variant="danger"` no botão Stop (linha 59-65), que é um preenchimento sólido `bg-Red-500` (ver Button abaixo), não texto — visualmente distinto do vermelho de texto/anel que este step vai introduzir, mas mesma cor-base (Red-500). Coexistem na tela ao mesmo tempo (número/anel vermelho no topo + botão Stop vermelho abaixo) quando `isOvertime && isRunning`.
- `Button/index.tsx:18` | `danger: "bg-Red-500 hover:bg-Red-400 text-White"` — sem variante dark, sólido. Não há classe "danger" de texto para reaproveitar; o mold de texto vem de `IndexErrorMessage.tsx`, não de `Button`.
- Nenhum outro arquivo importa `Timer/index.tsx` além de `IndexTimer.tsx` (busca `from ".*Timer"` restrita a `src/pages` e `src/layout` não achou outro consumidor).

## Armadilhas
1. **Trap do twMerge confirmado**: container do `Timer` (linha 69-72) tem `text-Black-700 ... dark:text-White` fixo. Passar cor pelo `className` do componente mata só o utility de MESMA propriedade-base do Tailwind (twMerge dedup por grupo) que vier depois na string, mas `text-Black-700` e `dark:text-White` são utilities INDEPENDENTES (uma sem prefixo, outra com `dark:`) — twMerge só resolve conflito dentro do mesmo variant bucket. Se a cor entrar como `text-Red-500` solto (sem `dark:`) via className do container, ela vence sobre `text-Black-700` (mesmo bucket, "light") mas o `dark:text-White` (bucket "dark") permanece intocado e o vermelho some no tema escuro. Confirma a instrução do delta: a cor tem que entrar no `<span>` filho (linha 91), com os DOIS utilities (`text-Red-500 dark:text-Red-400`), nunca só um.
2. **Arco fantasma — mecanismo exato**: `getPercentage(totalSeconds, currentSeconds)` (linhas 11-21) não trata `currentSeconds < 0`. Cai no `else` (linha 18-19, pois `currentSeconds < totalSeconds` já é verdade para negativo) e retorna `currentSeconds / totalSeconds`, uma fração NEGATIVA (ex. `currentTimeInSeconds=-30`, `totalSeconds=1500` → `-0.02`). Em `getCircleDashoffset` (linha 37): `strokeDashoffset = circumference - percentage * circumference` → com percentage negativo, `strokeDashoffset = circumference + |percentage|*circumference`, ou seja, MAIOR que `circumference`. Como o `strokeDasharray` do `<circle>` (linha 85) usa um único valor (`circumference`), um `strokeDashoffset` > `circumference` desloca o padrão para além de um período do dash e faz reaparecer um arco extra do lado oposto do início do traço (o "salta"/artefato). O fix tem que clampar em algum ponto do range 0..1 (percentage) ou 0..circumference (dashoffset) — decisão do planner, mas tem que acontecer DENTRO de `Timer/index.tsx`, sem tocar `countdownTimer.ts`.
3. **Trap `lastExtraAddedMinutes` reconfirmada e agravada**: quando `extraAddedMinutes > 0` (após clique em "+5"/"+10" durante overtime), `getCircleDashoffset` troca `totalMinutes` para `lastExtraAddedMinutes` (5 ou 10) em vez de `initialTimeInMinutes` (linhas 30-33). Se depois desse clique `currentTimeInSeconds` ainda ficar negativo (overtime maior que o extra adicionado), o mesmo bug do item 2 se repete, mas com `totalSeconds` pequeno (5 ou 10 min) — a fração fica ainda mais deslocada, potencialmente tornando o artefato mais visível. Qualquer clamp de anel tem que valer nos DOIS caminhos de `totalMinutes` (via `initialTimeInMinutes` OU via `lastExtraAddedMinutes`), não só no caminho "normal".
4. **`isFinished` e `isOvertime` podem ser simultaneamente true no instante exato `currentTimeInSeconds === 0 && !isRunning`** (`IndexTimer.tsx:37,40`): a ordem do ternário (`isOvertime` checado primeiro, linha 56, antes de `isFinished`, linha 127) já resolve isso a favor do overtime — comportamento herdado do step 01, não é para redesenhar aqui, só ter em mente ao decidir a partir de que valor a cor vermelha liga (`currentTimeInSeconds <= 0`, mesmo limiar de `isOvertime`, não um novo).
5. **Formatação do número já suporta negativo** (`Timer/index.tsx:54-59`): `isNegative`, `absoluteSeconds`, `minutesLeft`, `secondsLeft` já produzem `"-MM:SS"` corretamente (linha 91). Nenhuma mudança de formatação é necessária — só cor.
6. Nenhum arquivo de estilo (`global.css`) precisa ser editado: os tokens `--color-Red-500/400/100` (linhas 13-15) já existem com os valores certos (`#EB4646` / `#F24F4F` / `#FEE2E2`).

## Sinal de teste
Não encontrado nenhum teste automatizado no repo (sem `*.test.*`/`*.spec.*`, sem script `test` ou `vitest`/`jest` em `package.json`). O step 01 (irmão mais próximo) validou via stack rodando + browser, com screenshots salvos em `steps/01_.../tests-01/screenshots/` e veredito em `steps/01_.../tests-01/verdict.md`. Este step 02 precisa do mesmo caminho: UI rodando (Tauri/dev server) + captura visual em claro E escuro, no mínimo 3 estados (running em overtime, parado em overtime, depois de um clique em "+5"/"+10" em overtime) para confirmar ausência do arco fantasma e cor correta nos dois temas.

## Veredito de complexidade
1. Uma frente só? `sim` — só frontend, um componente puro (`Timer/index.tsx`) e um consumidor (`IndexTimer.tsx`), confirmado nos dois arquivos lidos inteiros.
2. Footprint de no máximo 6 arquivos a criar/editar? `sim` — só 2 arquivos precisam mudar (`Timer/index.tsx`, `IndexTimer.tsx`); `global.css` e `Button/index.tsx` são só leitura/confirmação.
3. Existe molde/irmão claro para espelhar? `sim` — `IndexErrorMessage.tsx:27` para o par de texto claro/escuro; o próprio `strokeColor` ternário em `IndexTimer.tsx:51-53` é o molde para o terceiro caso do anel.
4. Zero decisão de arquitetura/produto em aberto? `não` — falta decidir a SEMÂNTICA do anel durante overtime (travar vazio/saturado vs. encher de novo proporcional ao tempo excedido); é uma decisão de produto explícita ainda aberta (ver pergunta do delta), não só de código.
5. Zero lógica/algoritmo novo não-trivial? `não` — clampar `getPercentage`/`getCircleDashoffset` para eliminar o arco fantasma sem quebrar o caminho `lastExtraAddedMinutes` é lógica nova (não é só espelhar um padrão existente), precisa ser desenhada com cuidado nos dois caminhos de `totalMinutes` (item 3 das armadilhas).

veredito: complexa — falha os itens 4 (semântica do anel em overtime ainda em aberto) e 5 (clamp do dashoffset é lógica nova não-trivial, com dois caminhos a cobrir).

## Sinal de partição
partição: não (é um ajuste visual localizado em 2 arquivos existentes, não um módulo novo nem uma suíte de testes nova).
