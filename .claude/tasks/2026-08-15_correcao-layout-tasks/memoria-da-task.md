# memoria-da-task.md — correcao-layout-tasks

Memória entre steps. Cada step é executado por agentes NOVOS que só têm este arquivo + o
`plan-simplified.md` do seu step. Tudo aqui é resultado de leitura real do código no commit `830b0f3`
e de leitura real dos 3 prints do usuário.

> **LEIA ISTO PRIMEIRO:** nenhum agente depois do meta-planner vê as imagens
> `test-1.png` / `test-2.png` / `3-active-tasks.png`. A §1 abaixo É a evidência visual.
> Não tente reabrir as imagens para "confirmar" — elas são PNGs na raiz do repo e a descrição
> abaixo já é byte-a-byte o que elas mostram, com coordenadas.

---

## 1. O que cada print mostra (diagnóstico visual escrito — insumo insubstituível)

Contexto comum aos 3: janela estreita (~620px de largura), tema claro, card "Tasks" com título,
descrição, input "Add a task... (use > to create a group)" + botão verde "Add".

### 1.1 `test-1.png` — BUG A: overflow horizontal na linha de ações do card de task

- Um item de task: card branco com cronômetro circular `00:06`, drag handle (grip) à esquerda,
  título "task 1", botão Play verde à direita. Card branco ocupa a largura toda (x≈40..590).
- Logo abaixo, dentro do wrapper cinza do item: o badge "Paused" (pílula branca + bolinha vermelha),
  alinhado à direita, borda direita colada em x≈588.
- Abaixo, a linha cinza de ações: lápis (amarelo), lixeira (vermelha), botão azul "Notes",
  e então um **select branco ENORME** mostrando sino + "5 min" + chevron, ocupando de x≈290 a x≈570
  — ~280px de largura para o texto "5 min". Depois dele, **cortado na borda direita**, aparece só uma
  fatia de uma caixa com borda azul (é o `IndexDebugTimer`).
- **Abaixo da lista há uma barra de rolagem HORIZONTAL** (trilho x≈48..582, polegar x≈58..460).
  Polegar ≈78% do trilho ⇒ o conteúdo é ~1,28× a largura do container.
- Rodapé normal: "0 of 1 completed", botão Reset, "Progress 0%".

### 1.2 `test-2.png` — mesma tela, rolada 100% para a DIREITA

- O card branco da task aparece **cortado**: mostra só ": 1" (cauda de "task 1") e o Play, e a borda
  direita do card branco termina em x≈435 — ou seja, o card branco tem a largura *visível* do
  container, não a largura do conteúdo rolável. Ao rolar, o fundo branco "acaba" e a linha de ações
  continua para além dele. É esse o artefato de "bloco branco flutuando / cortado" do print.
- A linha de ações agora mostra: fatia azul do "Notes" à esquerda, o select "5 min" (x≈135..415),
  a caixa azul do Debug com botão "Debug" (x≈430..525) e o tempo "00:00" (x≈550..585).
- O badge "Paused" também rolou junto (x≈335..438).
- **Conclusão do par test-1/test-2:** não é bug de z-index nem de posicionamento — é UM bug só,
  overflow horizontal do conteúdo da linha de ações, materializado como scrollbar horizontal pelo
  container pai que é `overflow-y-auto` (ver §2.1).

### 1.3 `3-active-tasks.png` — BUG B (scroll interno nas ativas) e BUG C (colapso de grupo)

- O container da lista de ativas tem **DUAS** barras de rolagem próprias:
  - **vertical**, na direita (seta ↑ em y≈220, seta ↓ em y≈690, polegar y≈265..500) — é ela que o
    usuário quer eliminar;
  - **horizontal**, no rodapé do container (y≈706) — é o BUG A de novo, com outro fixture.
- O conteúdo está rolado para baixo: o 1º item está **cortado no topo** (só se vê a linha cinza de
  ações dele + o badge "Running"). Depois vem "task 2" (card branco, cronômetro `01:46`, botão Square
  verde de parar + Check), com badge "Running" e sua linha de ações. Por último, o card de **grupo**
  "task 3": grip, título "task 3", **chevron para CIMA** (= expandido) em x≈533, e abaixo
  "0 of 2 completed" + "Progress 0%" + o input próprio "Add a task..." + botão "Add" — tudo isso
  **cortado na base** pelo container.
- Fora do container: "1 of 5 completed" com chevron-down (accordion de concluídas, FECHADO), botão
  Reset, "Progress 20%".
- No canto inferior esquerdo da JANELA há ainda uma barrinha de rolagem horizontal da página inteira
  (x≈10..70, y≈841) — a página também transborda na horizontal.
- Ou seja, o grupo "task 3" **tem** o botão de colapsar renderizado e visível no print; o relato do
  usuário é que **clicar nele não minimiza** quando o grupo está ativo. Ver §2.3.

---

## 2. Causa-raiz de cada bug (grep/leitura já feitos — NÃO refazer)

### 2.1 BUG A — overflow horizontal (step 01)

**Causa primária, encontrada estaticamente e com alta confiança:**

- `src/layout/components/atoms/Select/trigger.tsx:15` — as classes-base do `SelectTrigger` incluem
  **`w-full`**.
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexAlertSelect.tsx:22`
  passa `className="h-8 rounded-full px-2.5 py-0 text-Black-700 text-xs"` — **nenhuma classe de
  largura**, então `twMerge` NÃO remove o `w-full`.
- Resultado: como flex item dentro de `IndexTaskItem.tsx:265` (`flex items-center gap-2`),
  `width:100%` resolve para 100% da largura do container flex ⇒ o select "5 min" sozinho reivindica a
  linha inteira e empurra o `IndexDebugTimer` para fora. **É exatamente o select de ~280px dos prints.**

**Causas contribuintes (impedem a compressão):**

- `IndexTaskItem.tsx:247` — `<div class="flex items-center justify-between gap-2 ...">` com dois filhos
  flex, `:248` (lápis/lixeira/Notes) e `:265` (select + debug), **nenhum dos dois com `min-w-0`**.
  Flex item tem `min-width:auto` por default ⇒ nenhum dos dois encolhe abaixo do conteúdo.
- `IndexTaskItem.tsx:276` — o `flex-1 min-w-0` que envolve o `IndexDebugTimer` está DENTRO de `:265`,
  que por sua vez não pode encolher. Logo esse `min-w-0` é inerte hoje.
- `IndexDebugTimer.tsx:76` — `flex items-center gap-3` com Button "Debug" + barra de progresso + tempo
  + (Button de Check quando `isActive`), sem `min-w-0`; largura intrínseca mínima alta, e ela **cresce**
  quando o debug já rodou (o Check de reset aparece em `:102-110`).

**Orçamento de largura (calcular contra isto):** `page.tsx:70` `max-w-2xl` (672px) →
`IndexTasks.tsx:14` `Box className="w-full max-w-[600px] ml-auto p-6"` ⇒ **552px úteis** para a linha
de ações. Com o Check de reset visível, o conteúdo atual pede ~570px. Ou seja: só corrigir o `w-full`
resolve o caso dos prints, mas **não** garante o caso "debug já rodou". A correção precisa cobrir os
dois (P7 em `answers.md`).

**Onde NÃO mexer:** no átomo `Select` (P8). Só há 2 call sites de `Select.Trigger` no projeto —
`IndexAlertSelect.tsx:22` (o bugado) e `IndexHeader/components/IndexWorkflowSelector.tsx:28`
(`h-10 min-w-[50px] text-xs`, que provavelmente quer o `w-full`). Grep já rodado, é essa a lista completa.

### 2.2 BUG B — scroll interno nas ativas (step 02)

Footprint completo do travamento de altura (grep `overflow|h-screen` já rodado sobre `src/`):

- `src/pages/index/components/IndexTasks/IndexTasks.tsx:30` —
  `class="flex flex-col gap-3 max-h-[calc(100vh-400px)] min-h-[250px] overflow-y-auto"`.
  **É a linha do bug.** Envolve SÓ o `IndexActiveTasksList` (o `IndexFooter` está fora, em `:44`).
  Nota de CSS: `overflow-y:auto` com `overflow-x:visible` é computado como `overflow-x:auto` pela spec
  ⇒ é este elemento que transforma o BUG A em scrollbar horizontal.
- `src/pages/index/page.tsx:54` — `<div className="body-df min-h-screen max-h-screen flex flex-col">`.
  O `max-h-screen` trava a página na altura da viewport.
- `src/layout/styles/global.css:44-47` — `html, body, #root { height: 100%; ... }`.
- `src/layout/styles/global.css:67-71` — `.body-df { height: 100%; width: 100%; ... }`.

**Consequência que o step 02 NÃO pode ignorar:** remover só o `overflow-y-auto` de `IndexTasks.tsx:30`
faz a lista crescer dentro de um shell de altura fixa **sem nenhum scroll** ⇒ conteúdo simplesmente
some abaixo da dobra, sem como alcançá-lo. Destravar o shell (P3) é parte da correção, não opcional.

**Lista de inativas (onde o scroll DEVE passar a existir):**
- `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx:80-92` — o bloco
  `{state.showCompleted && completedTasks.length > 0 && (<div className="flex flex-col gap-3">...)}`.
  Hoje **não tem** `max-h-*` nem `overflow-*`. Em produção o usuário tem 151 concluídas (trap T10 da
  task anterior), então sem scroll interno esse accordion vira uma parede de itens.
- Gatilho do accordion: `IndexFooter.tsx:35-40` (`handleToggleShowCompleted`) + `:44-65` (a linha
  "X of Y completed" clicável, com chevron em `:59-64`).

**Outros `overflow` no projeto (não confundir, não mexer):**
`IndexTaskNoteDialog.tsx:92,94` (modal de nota, `max-h-[80vh]`/`max-h-[60vh]`),
`IndexDebugTimer.tsx:93` (`overflow-hidden` da barra de progresso),
`Select/root.tsx:28` (`overflow-hidden` do popover do Radix).

### 2.3 BUG C — não dá para minimizar grupo ativo (step 01)

**Leitura estática NÃO encontrou nenhum guard bloqueando o colapso.** Isto é um fato, não uma
suposição — foi verificado linha a linha:

- `IndexTaskGroup.tsx:118-127` — o `<button onClick={handleToggleCollapsed}>` com `ChevronDown`/
  `ChevronUp` é renderizado **incondicionalmente** (só depende de `!isEditing`, guard em `:86`).
  Não está dentro do `opacity-0 group-hover:opacity-100` de `:103` (esse só cobre lápis e lixeira).
- `IndexTaskGroup.tsx:51-64` — `handleToggleCollapsed` lê `useTasksState.getState()`, mapeia e chama
  `setItemsState`. **Sem nenhuma condição** sobre tasks rodando.
- `IndexTaskGroup.tsx:142` — `{!isEditing && !group.collapsed && (...)}` esconde input + lista.
- `states/tasks/index.ts:68-75` — `setItemsState` é um `set` puro, sem validação.
- `dragHandleProps` (listeners do dnd-kit) vão SÓ no grip (`IndexTaskGroup.tsx:91-96`), nunca no
  chevron. Descartado como causa.
- Grep `collapsed` sobre `src/` (lista completa): `states/tasks/index.ts:27,163`,
  `IndexTaskGroup.tsx:60,122,142`, `useStoredTasks.ts:29,49,78`. Não há mais nada lendo/escrevendo o campo.

**Portanto, o step 01 tem de REPRODUZIR ANTES de "consertar".** Hipóteses, em ordem de probabilidade:

- **H0 (mais provável) — o BUG C é sintoma dos bugs A+B.** Com scroll interno vertical + scroll
  horizontal no mesmo container, o cabeçalho do grupo (e o chevron, que fica no extremo direito da
  linha, x≈533 de 552px) sai facilmente da área visível: basta a lista estar rolada, ou rolada na
  horizontal. O usuário então "não consegue minimizar" porque não alcança o botão. Se após a correção
  do BUG A (e depois do BUG B, no step 02) o colapso passar a funcionar, **isso é a correção** —
  registre com evidência (screenshot antes/depois + estado de `collapsed` no store), não invente
  um fix adicional.
- **H1** — exceção em runtime no clique. Checar o console do browser no momento do clique.
- **H2** — o colapso acontece mas o usuário não percebe: `IndexTaskGroup.tsx:133-140` mantém
  "X of Y completed" + `ProgressBar` visíveis MESMO colapsado (estão fora do guard `!group.collapsed`).
  Só o input "Add a task..." + a lista de filhos somem. Se for isso, a correção é de percepção
  (o que esconder ao colapsar), e aí vale registrar como decisão e não como bug de lógica.
- **H3** — confusão com o chevron do rodapé ("1 of 5 completed", `IndexFooter.tsx:59-64`), que é outro
  accordion. Descartar cedo com um roteiro de reprodução explícito.

**Reprodução obrigatória (fixture mínimo):** um workflow com 1 grupo contendo 2 tasks, **uma delas com
o cronômetro RODANDO** (timer global ligado + Play na task filha), e pelo menos 1 task solta ativa acima
para forçar a lista a rolar. Então clicar no chevron do cabeçalho do grupo.

---

## 3. FOOTPRINT — arquivos que esta task toca (greps já rodados)

| Arquivo | Linhas de interesse | Step |
|---|---|---|
| `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexAlertSelect.tsx` | `22` (o `className` sem largura) | 01 |
| `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx` | `154` (wrapper), `156-160` (card branco), `202-223` (play/check), `228-244` (badge Running/Paused), `246-286` (linha de ações — o alvo), `265` e `276` (os dois flex sem `min-w-0`) | 01 |
| `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexDebugTimer.tsx` | `76` (row), `93` (barra), `99-101` (tempo), `102-110` (Check só quando `isActive` — é o que faz a largura crescer) | 01 |
| `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx` | `51-64` (toggle), `85` (header), `102-128` (ações + chevron), `133-140` (contagem sempre visível), `142-159` (bloco escondido ao colapsar) | 01 |
| `src/pages/index/components/IndexTasks/IndexTasks.tsx` | `14` (Box `max-w-[600px] p-6`), `30` (a linha do scroll interno), `44` (footer fora do container) | 02 |
| `src/pages/index/page.tsx` | `54` (`min-h-screen max-h-screen`), `70` (coluna `max-w-2xl`) | 02 |
| `src/layout/styles/global.css` | `44-47` (`html, body, #root { height:100% }`), `67-71` (`.body-df { height:100% }`) | 02 |
| `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` | `44-65` (linha clicável + chevron), `80-92` (lista de concluídas — ganha `max-h` + `overflow-y-auto`), `94` (ProgressBar) | 02 |
| `src/layout/components/atoms/Select/trigger.tsx` | `15` (o `w-full` de origem) — **ler, NÃO editar** (P8) | 01 |

Estrutura da árvore da lista (para não remontar): `IndexTasks` → container `:30` → `IndexActiveTasksList`
(`DndContext`+`SortableContext`) → por item, `IndexSortableTaskGroup` → `IndexTaskGroup` →
`IndexGroupTasksList` (DndContext PRÓPRIO) → `IndexSortableTaskItem` → `IndexTaskItem`; ou
`IndexSortableTaskItem` → `IndexTaskItem` direto para task de raiz.
Fonte da lista de nível 1: `hooks/useListingTasks.ts:19-23` (`activeListItems`).

---

## 4. Moldes a espelhar

| Step | O que fazer | Molde que JÁ existe |
|---|---|---|
| 01 | override de largura em `Select.Trigger` no call site | `IndexHeader/components/IndexWorkflowSelector.tsx:28` — `className="h-10 min-w-[50px] text-xs"` é o único outro call site e mostra o padrão de override por `twMerge` |
| 01 | linha flex que encolhe sem transbordar | `IndexTaskItem.tsx:276` (`flex-1 min-w-0`) e `IndexDebugTimer.tsx:93` (`w-full ... flex-1`) já usam a receita certa — falta aplicá-la nos ancestrais |
| 02 | container com altura máxima + scroll interno | a própria linha que sai de `IndexTasks.tsx:30` (`max-h-[calc(100vh-400px)] overflow-y-auto`) é o molde do que entra em `IndexFooter.tsx:81` |
| 02 | accordion de concluídas | `IndexFooter.tsx:80-92` já existe; só ganha o wrapper de scroll |

Átomos reutilizáveis (não recriar): `src/layout/components/atoms/{Box,Button,Input,ProgressBar,Select,Dialog}`,
`src/layout/components/common/Timer`.

---

## 5. Ordem e o que o step 02 assume do step 01

- **02 assume de 01**: a linha de ações do `IndexTaskItem` já cabe em 552px (com e sem o Check de reset
  do debug), então **nenhum** conteúdo da lista transborda na horizontal. Isso é pré-requisito duro:
  o step 02 remove o `overflow-y-auto` do container, e com ele some o `overflow-x:auto` implícito —
  se o BUG A ainda existisse, o conteúdo passaria a **vazar por cima** do layout em vez de rolar.
- **02 deve re-testar o BUG C como regressão**, porque mudar a altura/scroll do container muda a
  alcançabilidade do chevron do grupo (ver H0 em §2.3).

---

## 6. TRAPS (herdadas da task `tasks-nivel-unico` e novas)

Herdadas (revalidadas neste commit, continuam valendo):

- **T9 — sem testes e sem Docker.** Nenhum `*.test.*`, nenhum runner, nenhum Dockerfile no repo.
  Não rodar `npm test`. Validação = `npx tsc --noEmit` + `npm run dev` (Vite, **porta fixa 1420**,
  `vite.config.ts:18` — falha se a porta estiver ocupada) + browser.
- **Tela de permissão de notificação Tauri bloqueia tudo em browser puro.** Contorno já validado 3x:
  sobrescrever `window.Notification.permission` (getter → `'granted'`) e `.requestPermission`
  (→ resolve `'granted'`) via `browser_evaluate` ANTES de clicar "Allow notifications", refazendo a cada
  reload. Ver `page.tsx:11-52` e `IndexNotificationRequest`.
- **`browser_click` / tecla Enter não funcionam neste app** (timeout de "stable" por causa dos
  cronômetros re-renderizando; o Enter se perde nos re-renders). Contorno validado: setar valor via
  native DOM value-setter + `dispatchEvent('input')`, e `element.click()` real via `browser_evaluate`.
- **`useStoredTasks` grava no `beforeunload`**: ao plantar fixture no localStorage
  (chave **`timertasks:tasks`**), plantar ANTES da hidratação (ex.: enquanto a tela de permissão ainda
  bloqueia), senão o próximo `beforeunload` sobrescreve o fixture.
- **DnD (dnd-kit) não é testável por automação neste ambiente** (4 steps confirmaram). Se um teste
  encostar em drag, registrar `## Not run`, não tentar automação nova.
- **T8 — React Compiler ligado** (`babel-plugin-react-compiler`, ver `vite.config.ts`). Código todo
  imutável; manter.
- **T4 — `isRunning:true` + último evento `stop` é INTENCIONAL** no `beforeunload`
  (`useStoredTasks.ts:149-191`). A fonte da verdade visual do item é `isTimerActive = timerState.isRunning`
  (estado local do cronômetro), **nunca** `task.isRunning`. Qualquer condicional visual novo segue essa regra.
- **T10 — dados reais em produção** (151 concluídas, 46h de foco no localStorage do usuário). É a razão
  de a lista de inativas precisar de scroll interno (§2.2).

Novas desta task:

- **N1 — `overflow-y:auto` implica `overflow-x:auto`.** É por isso que um bug de largura (A) aparece
  como scrollbar horizontal e por isso a ordem 01→02 é obrigatória. Não "resolver" o BUG A pondo
  `overflow-x-hidden` no container: isso esconde o sintoma e torna o Debug timer inalcançável.
- **N2 — o shell da página é de altura fixa em 3 lugares** (`page.tsx:54`, `global.css:44-47`,
  `global.css:67-71`). Mexer em um só não destrava o scroll da página.
- **N3 — `Select.Trigger` traz `w-full` embutido** e `twMerge` só remove o que conflita: um `className`
  sem classe de largura NÃO tira o `w-full`. Vale para qualquer novo uso do átomo.
- **N4 — a página também transborda na horizontal** (barrinha no rodapé da janela em
  `3-active-tasks.png`). Pode ser consequência do BUG A ou do layout de 2 colunas
  (`page.tsx:66-74`, `gap-24`) em janela estreita. Se sobreviver ao step 01, é escopo do step 02.
- **N5 — as 2 esquisitices do `IndexScore`/`scoreUtils`** (soma todos os workflows; conta task
  "completed" mesmo desmarcada) são pré-existentes e **aceitas**. Não são regressão, não corrigir aqui (P9).

---

## Padrões capturados no step 01

- **Fix aplicado (para step 02 não reabrir):** `IndexAlertSelect.tsx:22` className ganhou
  `w-auto shrink-0`; `IndexTaskItem.tsx:248` ganhou `shrink-0`; `:265` ganhou `min-w-0` (sem
  `flex-1` — evita o "5 min" escorregar para o meio quando o debug não rodou). `:247` intocado,
  `flex-wrap` (A3) não foi necessário — medido 472px vs 508px de container no pior caso (grupo +
  debug rodado). Commit `e521536`.
- **`twMerge` só derruba uma classe da base do átomo se a nova className trouxer OUTRA do mesmo
  grupo** (`w-*` derruba `w-*`; `shrink-0` sozinho não deslocaria `w-full`). Qualquer novo override
  de `Select.Trigger` (ou outro átomo com classe de largura na base) precisa lembrar disso — não é
  intuitivo por leitura, foi confirmado rodando `twMerge` de verdade no validator.
- **BUG C não tinha mecanismo — confirmado dinamicamente, não só estaticamente.** Teste em browser
  reproduziu o chevron do grupo em posição IDÊNTICA pré e pós-fix do BUG A (mesmo com
  `scrollWidth`/`clientWidth` estourando pré-fix): num layout flex-column com ancestral de largura
  fixa (`max-w-[600px]`), uma linha-irmã que transborda na horizontal NÃO desloca nem esconde as
  outras linhas-irmãs (cada uma mantém sua própria caixa). **Step 02 não precisa re-testar BUG C
  como regressão de layout horizontal** — já está provado que overflow horizontal de uma linha não
  afeta a alcançabilidade de elementos em linhas vizinhas. (A ressalva de §5 sobre re-testar BUG C
  no step 02 continua valendo, mas por causa da mudança de ALTURA/scroll vertical do container, não
  por overflow horizontal — motivo diferente do que se temia.)
- **`IndexDebugTimer` só renderiza com `hasBeenStarted=true`** (task com evento `start` em
  `timeEvents`). Para chegar no estado "Check de reset visível" via fixture: plantar
  start+stop em `timeEvents`, então clicar o Play da task (ativa `isTimerActive`) e clicar "Debug"
  — sem o timer local da task ativo, o botão "Debug" só dispara aviso, não inicia.
- **Contorno de fixture mais robusto que "plantar antes do reload":** monkey-patch
  `Storage.prototype.setItem` para engolir escritas na chave `timertasks:tasks` na página que está
  saindo, logo após plantar o fixture, e então recarregar — o novo documento tem contexto JS limpo
  (patch some) e hidrata do fixture intocado. Mais confiável que só torcer para o `beforeunload`
  não disparar antes do reload.

## 7. Medição de janela do meta-planner

Nonce `meta-correcao-layout-tasks`. Registro do último checkpoint em `steps.md`. Comando:
`TETO=150000 PASSO=20 .claude/skills/claude-step-loop/scripts/medir-janela.sh "meta-correcao-layout-tasks"`
