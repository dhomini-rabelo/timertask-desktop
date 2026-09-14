# Review — rodada 1 — chips de projeto abaixo do input de adicionar task

## Veredito
aprovado

## Escopo revisado
Diff contra a base da run (`a7519c3`), lote único (checkpoints 1 a 3):
- [src/pages/index/states/projects/index.ts](src/pages/index/states/projects/index.ts)
- [src/pages/index/hooks/useStoredProjects.ts](src/pages/index/hooks/useStoredProjects.ts)
- [src/pages/index/states/settings/index.ts](src/pages/index/states/settings/index.ts)
- [src/pages/index/hooks/useStoredSettings.ts](src/pages/index/hooks/useStoredSettings.ts)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectChips.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectChips.tsx)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsDialog.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsDialog.tsx)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsList.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsList.tsx)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsListItem.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsListItem.tsx)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsFooter.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsFooter.tsx)
- [src/pages/index/components/IndexTasks/IndexTasks.tsx](src/pages/index/components/IndexTasks/IndexTasks.tsx)
- [src/pages/index/components/IndexTasks/IndexAddInput.tsx](src/pages/index/components/IndexTasks/IndexAddInput.tsx)
- [src/pages/index/components/IndexHeader/IndexHeader.tsx](src/pages/index/components/IndexHeader/IndexHeader.tsx)
- [src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowDialog.tsx](src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowDialog.tsx)
- [src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexSettingsDialog.tsx](src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexSettingsDialog.tsx)
- [src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexProjectsSwitch.tsx](src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexProjectsSwitch.tsx)

Cartão diz `skills de contexto: nenhuma`; julguei por vizinhança, contra `reconhecimento.md` (`## Padrão da vizinhança`, `## Reuso disponível`, `## Armadilhas`) e comparando cada arquivo novo linha a linha com o par que ele copia (`states/workflows/index.ts`, `useStoredWorkflows.ts`, `IndexWorkflow{Dialog,List,ListItem,Footer}.tsx`).

## Blockers
nenhum.

## Nits
- [src/pages/index/components/IndexTasks/IndexAddInput.tsx:46](src/pages/index/components/IndexTasks/IndexAddInput.tsx#L46) — `composedTitle` concatena `title` sem novo `trim()` interno; um título digitado com espaço à esquerda gera `"[projeto]  task"` (dois espaços). Nenhum RT/roteiro cobre esse input, e `addTask` já trima o resultado inteiro nas pontas — cosmético. Conserto, se quiser: `` `[${selectedProject.title}] ${title.trim()}` ``.
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsDialog.tsx:2](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsDialog.tsx#L2) — importa `./IndexProjectsFooter`/`./IndexProjectsList` sem extensão, enquanto `IndexWorkflowDialog.tsx` (o par que este arquivo copia) importa `./IndexWorkflowFooter.tsx`/`./IndexWorkflowList.tsx` com `.tsx`. Inconsistência de estilo pré-existente na base (o resto do app já mistura os dois jeitos), não travei como blocker.

## Gates conferidos
comando de verificação: ok (`npx eslint .` sem `--fix` — 0 erros, 6 warnings pré-existentes de `react-hooks/exhaustive-deps` em arquivos fora do diff, não relacionados; `npx tsc --noEmit` — sem saída)
comando de teste: nenhum (cartão do projeto: `comando de teste: nenhum`)

## Blockers da rodada anterior
n/a — rodada 1, sem `review-0.md`.

## Novos nesta rodada
n/a — rodada 1.

## Plano em dúvida
nenhum. O ponto de tensão do próprio `plano.md` (RT-014 pedir "seguir o workflow, que não recusa duplicado" e ao mesmo tempo o roteiro S27 travar a recusa de duplicado) já foi resolvido pelo plano com justificativa explícita (roteiro é contrato fechado), e o código implementa exatamente essa resolução (`addProject`/`editProject` recusam duplicado exato pós-`trim()`, sem tocar `addWorkflow`/`editWorkflow`) — não é um desvio nem uma dúvida nova.

## Premissas
- Arquivos fora do recorte, deixados de fora desta review: `.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/implementacao.md` (modificado, é o próprio relatório do implementador, não produto) e `log-implementacao.md` / `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/` (não rastreados, não aparecem em `Arquivos alterados`).
- Conferi cada arquivo novo contra o par que o plano mandou copiar (`states/workflows`↔`states/projects`, `useStoredWorkflows`↔`useStoredProjects`/`useStoredSettings`, família `IndexWorkflow*`↔`IndexProjects*`) linha a linha; onde os dois divergem (sem guarda de "não apagar o último", sem `defaultProjects`, `!== undefined` em vez de `??` para permitir `null` explícito), a divergência está documentada em `implementacao.md` e bate com o passo do plano que a pediu.
- RT-001/RT-002 são lane `codigo` (tester próprio na Etapa 4) — não os provei como requisito; só observei de passagem que `package.json` não mudou e que as duas chaves novas de `localStorage` seguem `timertasks:<feature>`, sem contradizer o que vi.
