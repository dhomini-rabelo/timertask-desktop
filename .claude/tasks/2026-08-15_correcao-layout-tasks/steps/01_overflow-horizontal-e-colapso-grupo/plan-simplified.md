# Step 01 — overflow-horizontal-e-colapso-grupo

> Leia `../../memoria-da-task.md` ANTES deste arquivo — em especial §1 (o que os prints mostram, você
> não vai vê-los), §2.1 (causa-raiz do overflow), §2.3 (o que se sabe e o que NÃO se sabe do colapso)
> e §6 (traps de teste). Este plano não repete o que está lá.

## Objetivo

Duas correções dentro do card da lista de tasks ativas:

1. **Overflow horizontal (BUG A).** A linha de ações do `IndexTaskItem` é mais larga que o container e
   produz uma barra de rolagem horizontal + o card branco cortado (prints `test-1.png`/`test-2.png`,
   descritos em memória §1.1 e §1.2). Depois deste step não pode existir scroll horizontal na lista de
   tasks ativas, em nenhum estado do item.
2. **Colapsar grupo ativo (BUG C).** O usuário relata que não consegue minimizar um card de grupo que
   está ativo. Depois deste step, clicar no chevron do cabeçalho do grupo tem de colapsar/expandir,
   inclusive com uma task filha com o cronômetro rodando.

## IN

- Corrigir a largura do `IndexAlertSelect` (o `w-full` herdado do átomo `Select.Trigger` — memória §2.1),
  **no call site** `IndexAlertSelect.tsx:22`.
- Fazer a linha de ações do `IndexTaskItem` (`IndexTaskItem.tsx:246-286`) caber em **552px úteis** nos
  DOIS estados: (a) debug nunca iniciado, (b) debug já rodado — que acrescenta o botão Check de reset
  (`IndexDebugTimer.tsx:102-110`) e é o caso mais largo. `min-w-0`/`flex-1` nos ancestrais certos e/ou
  `flex-wrap`; a escolha é sua (P7).
- Verificar o mesmo tipo de transbordo no card de **grupo** (`IndexTaskGroup.tsx:85-131`) e no
  `IndexCompletedTaskItem` se aparecer — mas só se transbordarem de fato; não mexer por precaução.
- **Reproduzir o BUG C antes de qualquer edição**, com o fixture da memória §2.3, e reportar o mecanismo
  real encontrado. Se o colapso passar a funcionar só por causa da correção do BUG A (hipótese H0, a mais
  provável), **essa é a correção**: registre com evidência (screenshot antes/depois + valor de `collapsed`
  no store) e NÃO invente um fix adicional. Se falhar por outro motivo, corrija a causa encontrada.

## OUT

- Não tocar em `IndexTasks.tsx:30`, `page.tsx`, `global.css` nem `IndexFooter.tsx` — é o step 02.
  Nesta rodada, a barra de rolagem VERTICAL da lista de ativas **continua existindo** e isso está certo.
- Não editar `src/layout/components/atoms/Select/trigger.tsx` (P8): há outro call site
  (`IndexWorkflowSelector.tsx:28`) que depende do `w-full`.
- Não "resolver" o overflow com `overflow-x-hidden` no container (trap N1) — isso esconde o sintoma e
  torna o Debug timer inalcançável.
- Nada de indicador novo de "Running" no cabeçalho do grupo colapsado (P6). Nada de refatorar DnD,
  `IndexScore`/`scoreUtils`, ou limpar os derivados órfãos de `useListingTasks.ts` (P9).
- Não gravar evento `stop` ao colapsar um grupo (P5) — o tempo é derivado de `timeEvents` e se recompõe
  sozinho ao reexpandir.

## Respostas/premissas que valem para ESTE step

- **P5** — colapsar não para os cronômetros dos filhos; ao reexpandir, `initialSeconds` +
  `shouldAutoStart` recolocam o cronômetro no ponto certo.
- **P6** — sem elementos visuais novos.
- **P7** — a correção do overflow é CSS/layout: nada de remover botão nem esconder o Debug atrás de menu.
- **P8** — corrigir no call site, não no átomo.
- **P9** — escopo fechado nos 3 bugs relatados.

## Arquivos / âncoras sugeridos

- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexAlertSelect.tsx:22`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx:246-286`
  (com atenção a `:247`, `:265`, `:276`)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexDebugTimer.tsx:76,93,99-110`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx:51-64,102-159`
- Ler (não editar): `src/layout/components/atoms/Select/trigger.tsx:15`,
  `src/pages/index/components/IndexHeader/components/IndexWorkflowSelector.tsx:28`
- Orçamento de largura: `page.tsx:70` (`max-w-2xl`) → `IndexTasks.tsx:14` (`max-w-[600px] p-6`) = 552px.

## Dependências de steps anteriores

Nenhuma — é o primeiro step.

## Modo de teste de sistema

**Docker+browser only.** Os dois defeitos são visuais/interativos e não há suíte de testes nem Docker no
repo (trap T9): na prática, `npm run dev` (Vite, porta fixa **1420**) + Playwright MCP, com os contornos
de notificação/`browser_click`/fixture no localStorage da memória §6. `.test` não se aplica: não existe
runner instalado.

Casos mínimos: (1) item com debug nunca iniciado — sem scroll horizontal; (2) item com debug já rodado
(Check de reset visível) — sem scroll horizontal; (3) card branco não fica cortado ao tentar rolar na
horizontal; (4) grupo com task filha RODANDO colapsa e reexpande pelo chevron; (5) ao reexpandir, o
cronômetro da filha continua coerente (não zerou, não perdeu tempo).

## CLASSE

**`julgamento`.** Metade do step (o BUG C) tem mecanismo desconhecido — nenhum guard foi encontrado na
leitura estática, então o planner precisa desenhar uma investigação empírica e decidir o que fazer com o
resultado. E a correção do overflow exige escolher entre encolher e quebrar linha contra um orçamento de
largura que muda de estado (debug ativo vs. não), sem molde 1:1 no código. Não passa em nenhum dos quatro
critérios de `mecânica`.
