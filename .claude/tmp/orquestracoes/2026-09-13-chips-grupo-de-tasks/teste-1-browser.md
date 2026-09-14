# Teste — lane browser — rodada 1 — chips de projeto abaixo do input de adicionar task

## Veredito
FAIL

## Ambiente
pré-requisito: nenhum (linha `ambiente` do plano de teste não lista pré-requisito de serviço externo; app roda direto sobre o Vite dev server). Confirmado com `timeout 5 curl -s -o /dev/null -w "%{http_code}\n" http://localhost:1420/` → sem resposta (porta livre) antes de subir.
ambiente: `npm run dev — http://localhost:1420` — subido por mim (não havia processo na porta 1420 antes desta rodada); confirmado com HTTP 200 em `http://localhost:1420/` logo após.
url: http://localhost:1420 — a tela de Tasks, com o input principal de adicionar task
estado: nenhum (linha `estado: nenhum` do plano; `localStorage` já estava limpo — `timertasks:projects` vazio, `timertasks:settings` com `{projectsEnabled:true}` padrão, `timertasks:tasks` vazio, `timertasks:workflows` com Work/Personal — conferido via `browser_evaluate` antes de S01, sem necessidade de reset manual)
unidades: Vite dev server (timertask-desktop-tree-1) — http://localhost:1420 — subida por mim

## RT provados

### RT-003 (AC-Geral) [MUST]
Requisito: Nada do comportamento atual do input principal muda: a sintaxe ">" continua criando TaskGroup e o dropdown continua selecionando o workflow.
Como provei: com "projeto exemplo 1" selecionado, digitei "> grupo teste" no input e salvei.
Provas: S08
- S08 → screenshots/r1-s08-grupo-teste-sem-colchete.png — visível: grupo "grupo teste" criado na seção Pending, sem nenhum colchete no título, chip "projeto exemplo 1" continua com destaque de selecionado.
Esperado: um grupo de tasks "grupo teste" é criado, sem nenhum colchete no título.
Observado: grupo criado exatamente como esperado, título intacto.
Resultado: PASS

### RT-004 (AC-001) [MUST]
Requisito: Com a função ativa, abaixo do input de adicionar task aparece uma fileira com um chip por projeto do workflow selecionado, mais um chip de ícone de configuração no fim da fileira.
Como provei: abri o app do zero (workflow Work, nenhum projeto) e, mais adiante, religuei o switch "Projetos" com dois projetos cadastrados.
Provas: S01, S21
- S01 → screenshots/r1-s01-so-chip-config.png — visível: abaixo do input, só o chip circular de engrenagem, sem chip de projeto.
- S21 → screenshots/r1-s21-chips-visiveis-switch-ligado.png — visível: chips "projeto exemplo 1 renomeado" (nesta captura já renomeado mais adiante, mas no momento de S21 aparecia como "projeto exemplo 1") e "projeto exemplo 2" mais o chip de configuração, todos abaixo do input.
Esperado: fileira com chip por projeto do workflow selecionado + chip de configuração no fim.
Observado: como esperado nos dois momentos.
Resultado: PASS
Observação: S21 partiu de uma premissa assumida — o roteiro descreve S21 como "o dev religa o switch Projetos", mas ao chegar em S21 o switch já estava ligado (efeito colateral do bug de RT-020, ver abaixo: o switch tinha voltado a `true` sozinho após o reload de S20, antes de qualquer ação minha em S21). Não cliquei no switch (clicar teria desligado, o oposto do roteiro); apenas fechei o modal e confirmei que os chips estão visíveis, que é o estado final que S21 pede.

### RT-005 (AC-001) [MUST]
Requisito: Trocar o workflow no header troca os chips exibidos pelos projetos daquele workflow; um workflow sem nenhum projeto mostra só o chip de configuração.
Como provei: criei projetos só em Work e troquei para Personal (sem projetos).
Provas: S01, S14
- S01 → screenshots/r1-s01-so-chip-config.png — visível: Work sem projetos, só chip de configuração.
- S14 → screenshots/r1-s14-personal-so-chip-config.png — visível: workflow Personal selecionado no header, abaixo do input só o chip de configuração (Work já tinha 2 projetos cadastrados, que não vazam para Personal).
Esperado: workflow sem projeto mostra só o chip de configuração.
Observado: confirmado.
Resultado: PASS

### RT-006 (AC-002) [MUST]
Requisito: Clicar num chip o marca como selecionado, com destaque visual distinguível; clicar no chip já selecionado o desmarca.
Como provei: cliquei em "projeto exemplo 1" (selecionar) e depois em "projeto exemplo 2" já selecionado (desmarcar).
Provas: S07, S12
- S07 → screenshots/r1-s07-chip1-selecionado.png — visível: chip "projeto exemplo 1" com fundo verde preenchido, distinto do chip 2 (borda branca/cinza).
- S12 → screenshots/r1-s12-nenhum-chip-selecionado.png — visível: nenhum chip com o destaque verde (confirmei via `browser_evaluate` que os dois chips têm a mesma className, sem classe de selecionado).
Esperado: destaque visual distinto ao selecionar; some ao clicar de novo no já selecionado.
Observado: confirmado nos dois momentos.
Resultado: PASS

### RT-007 (AC-002) [MUST]
Requisito: Selecionar um chip com outro já selecionado transfere a seleção: no máximo um projeto fica selecionado por vez.
Como provei: com "projeto exemplo 1" selecionado, cliquei em "projeto exemplo 2".
Provas: S11
- S11 → screenshots/r1-s11-chip2-selecionado-chip1-nao.png — visível: só "projeto exemplo 2" com destaque verde, "projeto exemplo 1" sem destaque.
Esperado: só um chip selecionado por vez, a seleção migra.
Observado: confirmado.
Resultado: PASS

### RT-008 (AC-003) [MUST]
Requisito: Com "projeto exemplo 1" selecionado, digitar "task 1" e salvar cria a task com o título "[projeto exemplo 1] task 1".
Como provei: digitei "task 1" com o chip selecionado e salvei.
Provas: S09
- S09 → screenshots/r1-s09-task1-com-prefixo.png — visível: task com título "[projeto exemplo 1] task 1" na lista.
Esperado: título com prefixo "[projeto exemplo 1] ".
Observado: confirmado, título exato.
Resultado: PASS

### RT-009 (AC-003) [MUST]
Requisito: Sem nenhum chip selecionado, salvar cria a task com o título exatamente como digitado, sem colchete nenhum.
Como provei: com nenhum chip selecionado, digitei "task sem projeto" e salvei.
Provas: S13
- S13 → screenshots/r1-s13-task-sem-projeto-sem-colchete.png — visível: task "task sem projeto" sem nenhum colchete.
Esperado: título sem prefixo.
Observado: confirmado.
Resultado: PASS

### RT-010 (AC-004) [MUST]
Requisito: Depois de salvar a task, o chip selecionado continua selecionado e o input fica vazio.
Como provei: logo após salvar "task 1" (S09), conferi o estado do chip e do input.
Provas: S10
- S10 → screenshots/r1-s10-chip-mantido-input-vazio.png — visível: chip "projeto exemplo 1" ainda com destaque verde, campo de input vazio (placeholder "Add a task...").
Esperado: chip continua selecionado, input vazio.
Observado: confirmado.
Resultado: PASS

### RT-011 (AC-005) [MUST]
Requisito: Clicar no chip de configuração da fileira abre o modal de projetos.
Como provei: cliquei no chip de engrenagem abaixo do input, com a lista de projetos ainda vazia.
Provas: S02
- S02 → screenshots/r1-s02-modal-projetos-vazio.png — visível: modal "Projects" aberto, com "Manage the projects of the current workflow" e lista vazia (só o campo "New project" + botão "Add").
Esperado: modal de projetos abre.
Observado: confirmado.
Resultado: PASS

### RT-012 (AC-006) [MUST]
Requisito: No modal de projetos dá para criar, renomear e excluir um projeto, e a fileira de chips reflete cada operação.
Como provei: criei "projeto exemplo 1" e "projeto exemplo 2" (S03, S04, refletido em S06), renomeei "projeto exemplo 1" para "projeto exemplo 1 renomeado" (S24, refletido no chip) e excluí esse mesmo projeto (S25, refletido no sumiço do chip).
Provas: S03, S04, S06, S24, S25
- S03 → screenshots/r1-s03-projeto-exemplo-1-criado.png — visível: "projeto exemplo 1" na lista do modal.
- S04 → screenshots/r1-s04-dois-projetos-lista.png — visível: "projeto exemplo 1" e "projeto exemplo 2" na lista, e já refletidos como chips atrás do modal.
- S06 → screenshots/r1-s06-fileira-chips-fechado.png — visível: fileira com os dois chips + chip de configuração, modal fechado.
- S24 → screenshots/r1-s24-renomeado-task-antiga-intacta.png — visível: chip e item da lista renomeados para "projeto exemplo 1 renomeado".
- S25 → screenshots/r1-s25-nenhum-chip-selecionado-apos-exclusao.png — visível: só resta o chip "projeto exemplo 2"; o projeto excluído sumiu da fileira.
Esperado: criar/renomear/excluir refletidos na fileira.
Observado: confirmado nas três operações.
Resultado: PASS

### RT-013 (AC-006) [MUST]
Requisito: O modal de projetos opera sobre os projetos do workflow selecionado no momento, e não sobre os dos outros workflows.
Como provei: criei "projeto pessoal 1" em Personal (S22) e depois abri o modal em Work (S23), conferindo que cada workflow só vê os seus.
Provas: S03, S22, S23
- S03 → screenshots/r1-s03-projeto-exemplo-1-criado.png — visível: projeto criado com Work selecionado.
- S22 → screenshots/r1-s22-projeto-pessoal-1-sozinho.png — visível: workflow Personal no header, modal mostra só "projeto pessoal 1".
- S23 → screenshots/r1-s23-work-so-exemplo1-exemplo2.png — visível: de volta a Work, modal mostra só "projeto exemplo 1" e "projeto exemplo 2", sem "projeto pessoal 1".
Esperado: escopo por workflow.
Observado: confirmado, sem vazamento entre workflows.
Resultado: PASS

### RT-014 (AC-006) [SHOULD]
Requisito: Nome de projeto vazio/só espaços é recusado; nome repetido dentro do mesmo workflow é recusado.
Como provei: tentei cadastrar "   " (só espaços, S05) e "projeto exemplo 2" já existente (S27).
Provas: S05, S27
- S05 → screenshots/r1-s05-nome-so-espacos-recusado.png — visível: lista continua com só os dois projetos anteriores, nada criado.
- S27 → screenshots/r1-s27-duplicado-recusado.png — visível: lista continua com um projeto só ("projeto exemplo 2"), duplicata não criada.
Esperado: as duas recusas.
Observado: as duas recusas ocorreram (o plano documentou a decisão de implementar a recusa de duplicado mesmo o modal de workflows não recusando, por causa do S27 aprovado — bate com o observado).
Resultado: PASS

### RT-015 (AC-007) [MUST]
Requisito: O select de workflows do header tem, como última opção, "Manage" que abre o modal de workflows, sem alterar as outras opções, e é o único caminho para esse modal.
Como provei: abri o select, vi "Work"/"Personal"/"Manage" e cliquei em "Manage".
Provas: S15
- S15 → screenshots/r1-s15-manage-abre-modal-workflows.png — visível: modal "Workflows" aberto (mesma lista Work/Personal + campo de criação), select do header no canto superior direito ainda mostrando "Work".
Esperado: modal de workflows abre.
Observado: confirmado.
Resultado: PASS

### RT-016 (AC-007) [MUST]
Requisito: Escolher "Manage" no select não muda o workflow selecionado.
Como provei: mesma ação de S15; conferi via snapshot de acessibilidade que a option "Work" seguia `[selected]` no listbox subjacente e o valor exibido no combobox continuava "Work".
Provas: S15
- S15 → screenshots/r1-s15-manage-abre-modal-workflows.png — visível: combobox do header mostrando "Work" com o modal de Workflows aberto por cima.
Esperado: select continua em "Work".
Observado: confirmado (também confirmado na snapshot de acessibilidade, não só na imagem).
Resultado: PASS

### RT-017 (AC-010) [MUST]
Requisito: A engrenagem do header passa a abrir o modal de configurações, não mais o de workflows; continua no header com a função ativa ou desativada.
Como provei: fechei o modal de Workflows e cliquei na engrenagem do header.
Provas: S16
- S16 → screenshots/r1-s16-engrenagem-abre-settings.png — visível: modal "Settings" / "App-wide preferences" com o switch "Projects", engrenagem ainda visível no header.
Esperado: engrenagem abre modal de configurações.
Observado: confirmado. (A engrenagem continuar visível com a função desativada foi observada de passagem em S18/S20/S21 — ela nunca some do header nessas capturas.)
Resultado: PASS

### RT-018 (AC-008) [MUST]
Requisito: O modal de configurações traz o switch "Projetos", ativo na primeira vez que o app abre.
Como provei: primeira abertura do modal de Settings nesta sessão (logo após S16, antes de qualquer alteração do switch).
Provas: S17
- S17 → screenshots/r1-s17-switch-ativo-por-padrao.png — visível: switch "Projects" com o círculo à direita e trilho verde (ligado).
Esperado: switch ativo por padrão.
Observado: confirmado.
Resultado: PASS

### RT-019 (AC-008) [MUST]
Requisito: Com o switch desligado, nem os chips nem o chip de configuração aparecem abaixo do input, sem espaço reservado em branco.
Como provei: desliguei o switch e fechei o modal.
Provas: S18
- S18 → screenshots/r1-s18-switch-off-sem-chips-sem-espaco.png — visível: abaixo do input de adicionar task, a seção "Pending" começa imediatamente, sem fileira de chips e sem espaço em branco reservado.
Esperado: fileira inteira some, sem espaço reservado.
Observado: confirmado.
Resultado: PASS

### RT-020 (AC-008) [MUST]
Requisito: O estado do switch sobrevive ao fechar e reabrir o app.
Como provei: desliguei o switch (confirmei `localStorage["timertasks:settings"]` = `{"projectsEnabled":false}` via `browser_evaluate` antes de recarregar), fechei o modal (localStorage ainda `false`) e recarreguei a página com `browser_navigate` para a mesma URL.
Provas: S20
- S20 → screenshots/r1-s20-switch-voltou-ligado-apos-reload-FAIL.png — visível: após o reload, o modal de Settings mostra o switch "Projects" LIGADO (verde), e a fileira de chips reaparece abaixo do input — o oposto do estado salvo.
Esperado: switch continua desligado após reload.
Observado: switch volta a ligado sozinho. Reproduzi a checagem duas vezes (uma no fluxo natural do roteiro S18→S20, outra isolada logo em seguida) com o mesmo resultado: `localStorage` é lido corretamente como `false` na hidratação, mas é sobrescrito de volta para `true` no mesmo ciclo de render, antes que eu interaja com qualquer coisa. Achado de código (não exigido para o teste, mas registrado para acelerar o conserto): `useStoredSettings()` é chamado por dois componentes montados ao mesmo tempo na página de Tasks (`IndexAddInput.tsx` e `IndexProjectChips.tsx`, grep em `src/pages/index/`), cada um com seu próprio `hasHydratedRef`/`settingsRef`; o efeito de hidratação de uma instância marca `hasHydratedRef.current = true` de forma síncrona antes do próximo render propagar o novo `projectsEnabled`, e o efeito de persistência dessa mesma instância roda ainda nesse ciclo com o valor antigo (`true`) capturado em `settingsRef.current`, regravando `true` por cima do `false` recém-lido — mesmo padrão existe em `useStoredWorkflows.ts`, mas lá é inofensivo porque o default e o valor hidratado tendem a coincidir.
Resultado: FAIL

### RT-021 (AC-009) [MUST]
Requisito: Desligar o switch não altera o título de nenhuma task já salva.
Como provei: com o switch desligado (S18), olhei a task "[projeto exemplo 1] task 1" na lista.
Provas: S19
- S19 → screenshots/r1-s19-task-mantem-prefixo-switch-off.png — visível: task "[projeto exemplo 1] task 1" com o prefixo intacto, switch desligado (chips somem, mas o título da task não muda).
Esperado: título da task não muda.
Observado: confirmado — este RT é sobre o título não mudar, não sobre a persistência do switch (RT-020), e passa independentemente do bug acima.
Resultado: PASS

### RT-022 (AC-009) [MUST]
Requisito: Renomear ou excluir um projeto não altera o título de task já salva; se o projeto excluído estava selecionado, a seleção fica vazia e a próxima task sai sem prefixo.
Como provei: renomeei "projeto exemplo 1" (S24), depois selecionei o chip renomeado e excluí esse projeto no modal (S25), depois salvei uma task nova (S26).
Provas: S24, S25, S26
- S24 → screenshots/r1-s24-renomeado-task-antiga-intacta.png — visível: projeto renomeado para "projeto exemplo 1 renomeado", mas a task "[projeto exemplo 1] task 1" continua com o nome antigo entre colchetes.
- S25 → screenshots/r1-s25-nenhum-chip-selecionado-apos-exclusao.png — visível: após excluir o projeto selecionado, nenhum chip fica com destaque (só resta "projeto exemplo 2", sem seleção).
- S26 → screenshots/r1-s26-task-depois-de-excluir-sem-colchete.png — visível: task "task depois de excluir" sem nenhum colchete.
Esperado: título antigo intacto; seleção esvaziada; próxima task sem prefixo.
Observado: confirmado nas três frentes.
Resultado: PASS

## Cobertura da lane
20 de 20 RT desta lane exercitados (RT-003 a RT-022; RT-001 e RT-002 são da lane codigo, fora deste relatório). Nenhum `n/d`.
provas: 27 de 27 do roteiro (S01–S27) produzidas, nenhuma faltou.

## O que quebrou
- **RT-020 (AC-008) [MUST] — FAIL.** Esperado: o switch "Projetos" desligado sobrevive a um reload da página. Observado: após desligar o switch (confirmado `localStorage["timertasks:settings"]` = `{"projectsEnabled":false}` antes do reload) e recarregar `http://localhost:1420`, o switch volta a aparecer LIGADO e a fileira de chips reaparece — evidência em `screenshots/r1-s20-switch-voltou-ligado-apos-reload-FAIL.png`. Causa provável (não confirmada por debugger, só por leitura do código e do comportamento observado): `useStoredSettings()` é montado em duas instâncias simultâneas (`IndexAddInput.tsx` e `IndexProjectChips.tsx`), e a corrida entre o efeito de hidratação e o efeito de persistência de uma dessas instâncias sobrescreve o valor recém-lido do `localStorage` com o valor antigo antes da hidratação assentar. Ver `src/pages/index/hooks/useStoredSettings.ts:20-57`.

## Registros tocados
- `localStorage` do navegador conectado (via Playwright extension): `timertasks:projects` (3 criados, 1 excluído, 1 renomeado — restou "projeto exemplo 2" em Work e "projeto pessoal 1" em Personal), `timertasks:tasks` (4 tasks + 1 grupo criados: "grupo teste", "[projeto exemplo 1] task 1", "task sem projeto", "task depois de excluir"), `timertasks:settings` (ficou em `{"projectsEnabled":true}` ao final, por causa do bug de RT-020 — a última tentativa de desligar não persistiu).
- Nenhum arquivo de configuração versionado do repositório foi editado.
