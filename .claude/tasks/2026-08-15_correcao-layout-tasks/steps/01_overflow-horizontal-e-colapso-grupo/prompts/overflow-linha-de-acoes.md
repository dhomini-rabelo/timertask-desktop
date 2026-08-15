# Escopo de implementação — `overflow-linha-de-acoes` (step 01)

Você implementa o **BUG A**: a linha de ações do card de task ativa é mais larga que o container e
produz barra de rolagem horizontal (o card branco aparece cortado ao rolar). Este arquivo é o
contrato completo — **não abra `plan.md`, `recon.md` nem a memória da task**.

Git: branch `main`, base `3e3108a`. Working tree limpa exceto 3 PNGs não rastreados na raiz
(`test-1.png`, `test-2.png`, `3-active-tasks.png`) — **não tocar neles**.

## Causa-raiz (já apurada, não reinvestigar)

`src/layout/components/atoms/Select/trigger.tsx:15` traz **`w-full`** nas classes-base e mescla com
`twMerge`. `IndexAlertSelect.tsx:22` passa uma `className` **sem nenhuma classe de largura**, então o
`w-full` sobrevive: o select "5 min" reivindica 100% da linha flex e empurra o `IndexDebugTimer`
para fora do card. Os ancestrais (`IndexTaskItem.tsx:247`, `:265`) não têm `min-w-0`, então nada
encolhe — o `flex-1 min-w-0` de `:276` é inerte hoje.

## Arquivos que você POSSUI (2 arquivos, 3 linhas)

### A1 — `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexAlertSelect.tsx:22`

Acrescente **`w-auto shrink-0`** à `className` já existente do `Select.Trigger`
(mantenha `h-8 rounded-full px-2.5 py-0 text-Black-700 text-xs` como está).

**Por que `w-auto` e não só `shrink-0`:** `twMerge` só derruba uma classe da base quando você passa
outra do **mesmo grupo Tailwind** (`w-*`). `shrink-0` sozinho **não** remove o `w-full` — o bug
continuaria de pé. `shrink-0` entra junto só para o select não virar o elástico da linha.

### A2 — `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx`

- `:248` — o `div` do grupo esquerdo (`flex items-center gap-1 transition-all`, com lápis/lixeira/
  `IndexTaskNoteDialog`) ganha **`shrink-0`**.
- `:265` — o `div` do grupo direito (`flex items-center gap-2`, com `IndexAlertSelect` +
  o wrapper do `IndexDebugTimer`) ganha **`min-w-0`** e **nada mais**.
- `:247` — **não mudar** (nem `flex-wrap`; ver "contingência" abaixo).

**Não adicione `flex-1` em `:265`.** Com `flex-1` o grupo da direita cresceria para preencher a
linha e, no estado "debug nunca iniciado" (só o select ali dentro), o "5 min" sairia da direita e
escorregaria para o meio — regressão visual. `min-w-0` sozinho já destrava o encolhimento
(`flex-shrink:1` já é o default).

## Molde a espelhar

Está no próprio arquivo, 8 linhas abaixo do bug: `IndexTaskItem.tsx:275-283` já envolve o
`IndexDebugTimer` em `<div className="flex-1 min-w-0">`. É a receita certa; A2 apenas a aplica nos
ancestrais que faltavam. Override de largura por `twMerge` no call site tem molde em
`src/pages/index/components/IndexHeader/components/IndexWorkflowSelector.tsx:28` (**ler, não editar**).

## Contingência A3 — NÃO aplicar agora

Se (e só se) o teste de sistema medir overflow residual depois de A1+A2, a correção já aprovada é
adicionar **`flex-wrap`** a `IndexTaskItem.tsx:247`. Isso virá por plan-note. Não antecipe.

## PROIBIDO

- Editar `src/layout/components/atoms/Select/trigger.tsx` (há outro call site,
  `IndexWorkflowSelector.tsx:28`, que depende do `w-full`) — ler pode, editar não.
- Editar `IndexDebugTimer.tsx`. Foi analisado: `:76` é um `div` block-level (não é flex item), então
  `min-w-0` ali seria no-op; quem absorve o encolhimento é a barra de progresso de `:93`
  (`flex-1`, conteúdo vazio ⇒ min-content 0). Botão "Debug", tempo `00:00` e Check de reset ficam no
  tamanho natural de propósito.
- Editar `IndexTaskGroup.tsx`, `IndexCompletedTaskItem.tsx`, `IndexTasks.tsx`, `page.tsx`,
  `global.css`, `IndexFooter.tsx` (esses quatro últimos são o step 02).
- Usar `overflow-x-hidden`/`overflow-hidden` para "resolver": esconde o sintoma e torna o Debug
  timer inalcançável.
- Remover botão, esconder o Debug atrás de menu, criar indicador visual novo.
- Mexer em DnD, `IndexScore`/`scoreUtils` ou nos derivados de `useListingTasks.ts`.
- Tocar no BUG C (colapso de grupo): **nenhuma linha de código**. A leitura estática provou que não
  há guard bloqueando o colapso; a hipótese principal é que ele é sintoma deste mesmo overflow
  (chevron fora da área alcançável). A investigação é da etapa de teste. Inventar um fix ali é
  violação de contrato.

## Footprint / cuidados

- `IndexTaskItem` é o mesmo componente usado na raiz (`IndexActiveTasksList.tsx:50-53`) e dentro de
  grupo (`IndexGroupTasksList.tsx:59-61`) — seu fix vale para os dois automaticamente.
- Orçamento: 552px úteis (`IndexTasks.tsx:14`), −24px do `px-3` da linha = **528px** na raiz;
  dentro de grupo há um `px-4` a mais ⇒ **496px**. O estado mais largo é "debug já rodado", quando
  aparece o botão Check de reset (`IndexDebugTimer.tsx:102-110`).
- React Compiler está ligado: mantenha tudo imutável. Aqui é só string de classe, não deve encostar
  em lógica.

## Aceitação da sua entrega

1. `npx tsc --noEmit` sem erro novo.
2. `git diff --stat` mostra **exatamente** `IndexAlertSelect.tsx` e `IndexTaskItem.tsx`, 3 linhas
   alteradas no total, zero linha adicionada de lógica.
3. Nenhuma classe `overflow-*` introduzida.
4. Não rode o browser nem a suíte (não existe suíte no repo, e não há Docker) — o teste visual dos
   4 estados (raiz/grupo × debug não iniciado/já rodado) é da etapa seguinte.

Ao terminar, responda em no máximo 8 linhas: as 3 linhas que mudou (com `path:line` e a classe
final), o resultado do `tsc` e qualquer coisa que tenha encontrado e que contradiga este contrato.
