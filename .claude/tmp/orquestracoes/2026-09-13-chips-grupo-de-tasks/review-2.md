# Review — rodada 2 — chips de projeto abaixo do input de adicionar task

## Veredito
aprovado

## Escopo revisado
Commit isolado `503d5c1` (`fix(projects): corrige race de hidratacao no useStoredSettings (RT-020)`),
diff contra `804386022158b8317658a736657830a203def11f` (`8043860`, commit anterior). Único arquivo de
produto tocado: `src/pages/index/hooks/useStoredSettings.ts` (mais a própria `implementacao.md`,
que é documentação da run, não código). `git status --short` não mostra nenhum arquivo de produto
não commitado fora desse commit.

Skills de contexto: nenhuma skill de unidade (cartão diz `skills de contexto: nenhuma`); julgado
por vizinhança contra `## Padrão da vizinhança` do `reconhecimento.md` e contra o par
`src/pages/index/hooks/useStoredWorkflows.ts`, que é o modelo citado pelo plano para este hook.

## Blockers
nenhum.

Rastreei a causa raiz que o `implementacao.md` descreve (efeito de hidratação e efeito de
persistência rodando no mesmo commit inicial, com `hasHydratedRef`/`settingsRef` como refs mutados
de forma síncrona antes do React propagar o `projectsEnabled` hidratado num re-render) e ela bate
com o código anterior (`8043860`): `settingsRef.current` era sincronizado por um efeito separado
que ainda não tinha rodado com o valor novo quando o efeito de persistência disparava, e
`hasHydratedRef.current` já estava `true` (mutação de ref é síncrona, não espera re-render) —
resultado: grava `{projectsEnabled: true}` (o default do closure velho) por cima do `false` recém-lido
do disco.

A troca por `useState` (`hasHydrated`) resolve porque `setSettingsState` (zustand) e
`setHasHydrated` são chamados na mesma passada do efeito de hidratação; React 19 faz batching
automático dessas duas atualizações, então o próximo render já carrega `projectsEnabled` hidratado
e `hasHydrated === true` juntos — o efeito de persistência só dispara depois, com o valor certo no
closure. Sem `settingsRef` intermediário, o efeito de persistência agora serializa `projectsEnabled`
direto do closure, eliminando a segunda fonte de defasagem. Não achei caminho de borda que reabra a
race (localStorage ausente, JSON inválido, `projectsEnabled` não booleano — os três ramos continuam
chamando `setHasHydrated(true)` corretamente, igual ao comportamento anterior para `hasHydratedRef`).

Não há regressão visível para as outras duas instâncias do hook (`IndexAddInput.tsx`,
`IndexProjectChips.tsx`) nem para o fluxo de toggle manual do switch (`hasHydrated` já é `true`
nesse ponto, efeito de persistência dispara normalmente a cada mudança de `projectsEnabled`).

## Nits
nenhum.

## Gates conferidos
comando de verificação: ok (`npx eslint .` sem `--fix` — 0 erros, 6 warnings pré-existentes e não
relacionados ao diff, mesmos que o `implementacao.md` já citava; `npx tsc --noEmit` — sem saída)

## Blockers da rodada anterior
n/a — esta rodada não é resubmissão do lote de `review-1.md` (checkpoints 1-3, já aprovados e não
reabertos, conforme orientação recebida). Ela revisa um commit de correção novo, disparado pela
Etapa 4 (teste), sem blocker prévio meu para reconferir.

## Novos nesta rodada
nenhum blocker introduzido pelo conserto.

## Plano em dúvida
nenhum.

## Premissas
- O padrão da vizinhança (`## Padrão da vizinhança` do `reconhecimento.md`) descreve hidratação
  guardada por `hasHydratedRef` (ref), e é o desenho que `useStoredWorkflows.ts` e
  `useStoredProjects.ts` ainda usam hoje. Este commit troca esse desenho por `useState` só em
  `useStoredSettings.ts`, criando uma inconsistência de forma entre os três hooks `useStored*`. Não
  tratei isso como blocker porque a troca é o que corrige a race (o desenho por ref tem o mesmo
  problema estrutural, só não observável nesses outros dois hooks nas condições testadas até
  agora) e o arquivo tocado é só este; `useStoredWorkflows.ts`/`useStoredProjects.ts` não fazem
  parte do diff desta run e não foram quebrados por ele. Registro para o nível 0 avaliar se vale
  abrir uma task futura de alinhar os três hooks no mesmo desenho (o corrigido).
