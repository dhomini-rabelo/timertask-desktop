# Recon — step 01 overflow-horizontal-e-colapso-grupo

## Mapa de arquivos

- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx` (289L) | item de task ativa, linha de ações no rodapé do card | 246-286 (bloco da ação: `justify-between` 247, grupo esquerdo 248-264, grupo direito 265-284), 276 (`flex-1 min-w-0` já correto, molde a copiar)
- `.../IndexTaskItem/IndexAlertSelect.tsx` (29L) | wrapper fino do Select p/ minutos de alerta | 15-27 (`Select.Trigger` linha 22 sem classe de largura)
- `.../IndexTaskItem/IndexDebugTimer.tsx` (113L) | timer de debug com progress bar + botão Check condicional | 76 (row raiz sem `min-w-0`), 93-98 (progress bar já `flex-1`, ela quem absorveria o shrink), 102-110 (botão Check só aparece com `isActive`, é o que alarga o card já rodado)
- `src/layout/components/atoms/Select/trigger.tsx` (26L) | trigger genérico do Select (Radix), usado por 2 call sites | 14-17 (`twMerge("w-full ...", props.className)` — raiz confirmada; NÃO editar, `IndexWorkflowSelector.tsx:28` quer o `w-full`)
- `.../IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx` (162L) | header do grupo + progresso + lista de filhos | 51-64 (`handleToggleCollapsed`, incondicional), 90 (`flex-1` sem `min-w-0`, mas sem Select/DebugTimer no header — risco de overflow baixo), 118-127 (botão chevron, incondicional), 133-140 (contagem+ProgressBar FORA do guard `!group.collapsed` de 142 — H2), 142-159 (conteúdo colapsável: input+Add+`IndexGroupTasksList`)
- `.../IndexTaskGroup/IndexGroupTasksList.tsx` (65L) | lista de filhos do grupo, reusa `IndexSortableTaskItem`→`IndexTaskItem` | 59-61 (mesmo componente de item, logo mesmo BUG A dentro do grupo, com budget de largura MENOR — ver Armadilhas)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx` (117L) | card de task concluída no accordion | 48-97 (header sem Select/DebugTimer, título com `break-all`; risco de overflow baixo)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` (97L) | accordion de concluídas (chevron NÃO relacionado ao de grupo) | 59-64 (chevron do accordion — H3, mecanismo totalmente separado de `IndexTaskGroup`)
- `src/pages/index/components/IndexTasks/IndexTasks.tsx` (48L) | card raiz da lista | 14 (`max-w-[600px] p-6` → 552px de conteúdo, fora de escopo mudar), 30 (`overflow-y-auto` — fora de escopo, step 02)
- `src/pages/index/hooks/useStoredTasks.ts` (200L) | hidratação de `localStorage["timertasks:tasks"]` antes do mount | 118-143 (lê síncrono no primeiro `useEffect`; fixture deve ser plantada ANTES do load da página)
- `src/pages/index/states/tasks/index.ts` | tipos `Task`/`TaskGroup` (17-30), `isTaskGroup` (36-38)
- `src/pages/index/states/workflows/index.ts` | `defaultWorkflows` (8-17): `workflow-work` é o primeiro → `selectedWorkflowId` default se não houver fixture de workflows

## Molde a espelhar

Para BUG A: o próprio arquivo já tem o padrão certo ao lado do bug — `IndexTaskItem.tsx:275-283` envolve `IndexDebugTimer` em `<div className="flex-1 min-w-0">`. O `IndexAlertSelect` (linha 266-274, mesmo pai `flex items-center gap-2` da linha 265) é o único filho da mesma row SEM esse tratamento. É o molde mais direto possível: mesmo arquivo, mesma row, 8 linhas de distância.

Para BUG C: nenhum molde aplicável — é investigação, não implementação por espelhamento.

## Footprint

- `Select.Trigger` (`layout/components/atoms/Select/trigger.tsx:11-25`) tem 2 consumidores: `IndexAlertSelect.tsx:22` (className sem largura → herda `w-full`) e `IndexWorkflowSelector.tsx:28` (`className="h-10 min-w-[50px] text-xs"` → também sem largura explícita, mas está fora da lista ativa, no header, com espaço próprio; não tocar).
- `IndexTaskItem` é usado tanto direto na lista raiz (`IndexActiveTasksList.tsx:50-53` via `IndexSortableTaskItem`) quanto dentro de grupo (`IndexGroupTasksList.tsx:59-61`) — qualquer fix em `IndexTaskItem.tsx`/`IndexAlertSelect.tsx` vale para os dois casos automaticamente (mesmo componente).
- `handleToggleCollapsed` (`IndexTaskGroup.tsx:51-64`) é chamado só pelo botão de 118-127; nenhum outro call site.

## Armadilhas

- `twMerge` só remove a classe `w-full` se a `className` passada tiver OUTRA classe do grupo `w-*` (mesmo prefixo Tailwind). Passar algo como `"shrink-0"` sozinho em `IndexAlertSelect.tsx:22` NÃO basta — precisa de uma classe de largura (`w-auto`, `w-fit`, `w-[Npx]`) para o merge realmente substituir o `w-full` da base.
- Budget de 552px vale para task NA RAIZ. Dentro de um grupo o budget é menor: `IndexTaskGroup.tsx:143` tem `px-4` (32px) e o filho renderizado é o MESMO `IndexTaskItem` com seu próprio `px-3`/`p-4` interno — ou seja, a fixture de reprodução deve incluir pelo menos 1 task solta E 1 task dentro de grupo, para cobrir o caso de budget mais apertado.
- `IndexDebugTimer.tsx:76` (row raiz) não tem `min-w-0`, mas ele já está dentro do wrapper `flex-1 min-w-0` de `IndexTaskItem.tsx:276` — o `min-w-0` do PAI já é o que importa para permitir o encolhimento da progress bar (`:93`, já `flex-1`); não fica claro sem teste se falta `min-w-0` também no próprio `:76` (ele é container, não item, do fluxo pai) — decisão de implementação, não travar aqui.
- Botão Check de reset (`IndexDebugTimer.tsx:102-110`) só existe quando `isActive` (`:36`, `currentTimeInSeconds > 0`) — a fixture de reprodução PRECISA ter `timeEvents` de debug fictícios OU o teste precisa clicar em "Debug" e esperar >0s para cobrir o estado "mais largo" citado no pedido.
- `Select/trigger.tsx` é compartilhado — qualquer fix tem que ficar 100% dentro de `IndexAlertSelect.tsx` (call site), nunca em `trigger.tsx`.

## BUG A — espaço de decisão do fix (não implementar agora)

1. **Override de largura no call site** (mais local): `IndexAlertSelect.tsx:22` ganha uma classe de largura (`w-auto`/`w-fit`) + possivelmente `shrink-0`, deixando o twMerge derrubar o `w-full` da base. Não toca `IndexTaskItem.tsx` nem `trigger.tsx`.
2. **min-w-0 em cascata**: adicionar `min-w-0` em `IndexTaskItem.tsx:247` e `:265` (hoje sem), para permitir que a row encolha em vez de empurrar o card. Resolve o sintoma de overflow do CONTAINER, mas sozinho não resolve o `Select.Trigger` insistir em ser 100% da row.
3. **flex-wrap como rede de segurança**: se mesmo com (1)+(2) a soma dos mínimos de conteúdo (Select ~70-90px + Debug button + progress bar mínima + timer mono + botão Check) ainda exceder ~552px (raiz) ou menos (dentro de grupo), a row de `:265` pode precisar de `flex-wrap` para o Select quebrar para a própria linha em vez de espremer o Debug Timer a zero. Isso é decisão do planner: (1)+(2) societário é o fix mínimo esperado pela causa-raiz já mapeada; (3) só entra se o teste de sistema mostrar que ainda sobra overflow no caso "grupo + debug já rodado".

**Verdict de "pronto"**: nenhuma scrollbar horizontal em `IndexTasks.tsx` nem no `body` em nenhum dos 4 estados — (task solta, debug não iniciado) / (task solta, debug rodado) / (task em grupo, debug não iniciado) / (task em grupo, debug rodado) — testado na largura real do app (sem redimensionar a janela para "caber à força").

## BUG C — plano de reprodução empírica (para a etapa de teste, não para o recon)

Fixture (`localStorage["timertasks:tasks"]`, plantada ANTES do load, formato aceito por `migrateEntry` em `useStoredTasks.ts:40-108`, workflow `workflow-work` = default):
```json
[
  {"type":"group","id":"g1","title":"Grupo Teste","workflowId":"workflow-work","collapsed":false},
  {"type":"task","id":"t1","title":"Task do grupo","workflowId":"workflow-work","groupId":"g1","completed":false,"isRunning":false,"timeEvents":[]}
]
```
Passos:
1. `browser_evaluate`: setar `window.Notification.permission`/`requestPermission` (trap conhecida) ANTES de navegar, plantar a fixture acima, então recarregar.
2. Abrir console do browser ativo (H1: procurar exception no clique).
3. Localizar o botão-chevron via DOM (evitar `browser_click` flaky): o header do grupo é `div.flex.items-center.justify-between.p-4...` (`IndexTaskGroup.tsx:85`); dentro dele, o container de botões da direita é `div.flex.items-center.gap-1` (`:102`); o botão editar/deletar fica num `div` FILHO desse (`:103-117`, `opacity-0 group-hover`), enquanto o chevron é um `<button>` filho DIRETO do mesmo container (`:118-127`). Selecionar com `container.querySelectorAll(':scope > button')` → único match = chevron. Disparar com `element.click()` via `browser_evaluate` (dispensa o value-setter, é só um clique, sem input).
4. Antes do clique: capturar `getBoundingClientRect()` do botão chevron e comparar com a largura visível do container/viewport — se o botão estiver fora da área clicável/visível (H0), registrar as coordenadas como evidência.
5. Clicar (programático) e comparar o DOM antes/depois: o bloco `142-159` (input Add + `IndexGroupTasksList`) deve desaparecer; a contagem/ProgressBar (`133-140`) deve PERMANECER (isso é comportamento existente, não é o bug — só citar como H2 se o usuário achar confuso, não corrigir sem pedido explícito).
6. Repetir o mesmo clique programático com a viewport/app no tamanho real (sem BUG A corrigido) e comparar com o resultado após um fix experimental de BUG A (min-w-0/w-auto) — se o clique programático já funciva ANTES do fix de A mas o usuário não conseguia alcançar o botão visualmente (rect fora da área visível/atrás de overflow), H0 confirmado: BUG C não precisa de código próprio, é 100% sintoma de A.

**Verdict de "pronto"**: (a) nenhuma exception no console ao clicar (descarta H1); (b) `group.collapsed` alterna e o DOM reflete (`142-159` some/volta) — se isso já era verdade mesmo pré-fix de A, o bug era só alcançar o botão; (c) se pós-fix de A o chevron fica dentro da área visível e o clique manual (não programático) funciona, H0 fechado sem nenhuma linha de código extra além do fix de A.

## Sinal de teste

Sem cobertura automatizada (`find src -name "*.test.*"`: não encontrado). Sinal = browser (Docker + `npm run dev`, porta fixa 1420) com a fixture acima; DnD não é testável (trap conhecida, pular). tsc/lint podem rodar mas não substituem o teste visual de overflow.

## Veredito de complexidade

1. Uma frente só? **sim** — só frontend (CSS/layout + 1 handler de clique já existente), sem backend.
2. Footprint ≤ 6 arquivos? **sim** — BUG A toca no máximo `IndexAlertSelect.tsx` + `IndexTaskItem.tsx` (+ eventualmente `IndexDebugTimer.tsx` se `:76` precisar de `min-w-0`); BUG C, se H0 se confirmar, toca ZERO arquivos extra (herda o fix de A); no pior caso (H2) mais `IndexTaskGroup.tsx`. Total ≤ 4.
3. Existe molde claro? **parcial** — sim para BUG A (`IndexTaskItem.tsx:276`, mesmo arquivo); **não** para BUG C — "nenhum molde claro", o mecanismo depende do resultado do teste empírico.
4. Zero decisão de arquitetura/produto em aberto? **não** — BUG A tem decisão em aberto real (min-w-0 cascata vs. override direto vs. flex-wrap de segurança, ver seção acima) e BUG C tem 4 hipóteses concorrentes (H0-H3) sem confirmação empírica ainda; só a leitura estática foi feita.
5. Zero lógica nova não-trivial? **sim para A** (é CSS); **incerto para C** — se H0 se confirmar, zero lógica nova; se H1/H2 se confirmarem, pode exigir lógica nova (guard, correção de estado).

veredito: complexa — itens 3 e 4 falham (sem molde para C, decisão de arquitetura em aberto tanto no espaço min-w-0/w-full/flex-wrap de A quanto na causa raiz ainda não confirmada de C); nenhuma evidência empírica (browser) foi coletada neste recon — só leitura estática, então H0 não pode ser tratado como certo.

## Sinal de partição

partição: 2 frentes independentes — (1) BUG A, fix CSS localizado em `IndexAlertSelect.tsx`/`IndexTaskItem.tsx` (baixo risco, molde claro, pode implementar direto); (2) BUG C, reprodução empírica primeiro (script acima) e SÓ DEPOIS decisão de fix — se H0 confirmado, a frente 2 não produz código próprio (fecha junto com 1); se H1/H2/H3 confirmado, produz um fix pequeno adicional em `IndexTaskGroup.tsx`. As duas frentes podem ser implementadas na mesma leva (2 é bloqueada por 1 só para o teste final, não para o código).
