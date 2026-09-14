# Teste — lane browser — rodada 2 — chips de projeto abaixo do input de adicionar task

## Veredito
PASS

## Ambiente
pré-requisito: nenhum (confirmado em projeto.md — `pré-requisito de ambiente: nenhum`)
ambiente: `npm run dev` — http://localhost:1420; porta 1420 não respondia antes (curl retornou erro de
conexão), então eu subi o processo (`nohup npm run dev`) e confirmei com curl 200 antes de navegar.
Derrubei ao final (`pkill -f vite`), confirmado por curl com conexão recusada.
url: http://localhost:1420 — a tela de Tasks, com o input principal de adicionar task
estado: nenhum. Antes de iniciar o roteiro, limpei `localStorage` (chave a chave, via UI) porque a
aba já trazia dados de uma rodada de teste anterior (grupo "grupo teste" e três tasks
remanescentes) — usei os próprios botões de excluir do produto para zerar o estado de tasks (as
demais chaves — workflows, settings, projects, reports — já estavam em default: `projectsEnabled:
true`, `projects: []`, 2 workflows padrão). Registrei essa observação porque não é fabricação de
estado por fixture (não existe mecanismo), é limpeza de sobra de execução anterior no mesmo
navegador compartilhado.
unidades: Vite dev server, http://localhost:1420, subida por mim.

## RT provados

### RT-003 (Geral) [MUST]
Requisito: Nada do comportamento atual do input principal muda: a sintaxe ">" continua criando
TaskGroup e o dropdown continua selecionando o workflow.
Como provei: com "projeto exemplo 1" selecionado, digitei "> grupo teste" e salvei.
Provas: S08
- S08 → screenshots/r2-s08-grupo-teste-sem-colchete.png — visível: grupo "grupo teste" criado sem
  nenhum colchete no título, chip "projeto exemplo 1" continua com destaque de selecionado.
Esperado: um grupo de tasks "grupo teste" é criado, sem nenhum colchete no título.
Observado: exatamente isso.
Resultado: PASS

### RT-004 (AC-001) [MUST]
Requisito: Com a função ativa, abaixo do input de adicionar task aparece uma fileira com um chip
por projeto do workflow selecionado, mais um chip de ícone de configuração no fim da fileira.
Como provei: abri o app com Work selecionado e nenhum projeto cadastrado (S01); depois, com dois
projetos cadastrados, religuei o switch "Projetos" e confirmei a fileira completa (S21).
Provas: S01, S21
- S01 → screenshots/r2-s01-fileira-so-config.png — visível: abaixo do input, só o chip de
  configuração (engrenagem), sem nenhum chip de projeto.
- S21 → screenshots/r2-s21-fileira-volta.png — visível: fileira com "projeto exemplo 1", "projeto
  exemplo 2" e o chip de configuração no fim.
Esperado: fileira de chips do workflow selecionado + chip de configuração no fim.
Observado: exatamente isso, nos dois cenários (vazio e com projetos).
Resultado: PASS

### RT-005 (AC-001) [MUST]
Requisito: Trocar o workflow no header troca os chips exibidos pelos projetos daquele workflow; um
workflow sem nenhum projeto mostra só o chip de configuração.
Como provei: S01 (Work sem projetos); S14 (troquei para Personal, que também não tinha projetos
ainda nesse ponto do roteiro).
Provas: S01, S14
- S01 → screenshots/r2-s01-fileira-so-config.png — visível: só chip de configuração.
- S14 → screenshots/r2-s14-personal-so-config.png — visível: header mostra "Personal", abaixo do
  input só o chip de configuração.
Esperado: workflow sem projeto mostra só o chip de configuração.
Observado: exatamente isso.
Resultado: PASS

### RT-006 (AC-002) [MUST]
Requisito: Clicar num chip o marca como selecionado, com destaque visual distinguível do não
selecionado; clicar no chip já selecionado o desmarca.
Como provei: cliquei em "projeto exemplo 1" (S07); depois, com "projeto exemplo 2" selecionado,
cliquei nele de novo (S12).
Provas: S07, S12
- S07 → screenshots/r2-s07-chip-selecionado.png — visível: chip "projeto exemplo 1" com fundo
  verde preenchido, distinto do chip "projeto exemplo 2" (contorno).
- S12 → screenshots/r2-s12-nenhum-selecionado.png — visível: nenhum chip com o destaque verde
  (confirmei via classe CSS que ambos os chips tinham a classe de não-selecionado, o cinza do
  screenshot era só hover do cursor no momento da captura).
Esperado: destaque visual distinguível ao selecionar; clique no já selecionado desmarca.
Observado: exatamente isso.
Resultado: PASS

### RT-007 (AC-002) [MUST]
Requisito: Selecionar um chip com outro já selecionado transfere a seleção: no máximo um projeto
fica selecionado por vez.
Como provei: com "projeto exemplo 1" selecionado, cliquei em "projeto exemplo 2".
Provas: S11
- S11 → screenshots/r2-s11-transferencia-selecao.png — visível: só "projeto exemplo 2" com o
  destaque verde; "projeto exemplo 1" voltou ao estado não selecionado.
Esperado: só o novo chip fica selecionado.
Observado: exatamente isso.
Resultado: PASS

### RT-008 (AC-003) [MUST]
Requisito: Com o projeto "projeto exemplo 1" selecionado, digitar "task 1" e salvar cria a task com
o título "[projeto exemplo 1] task 1".
Como provei: com "projeto exemplo 1" selecionado, digitei "task 1" e salvei.
Provas: S09
- S09 → screenshots/r2-s09-task-com-prefixo.png — visível: task "[projeto exemplo 1] task 1" na
  lista.
Esperado: título "[projeto exemplo 1] task 1".
Observado: exatamente isso.
Resultado: PASS

### RT-009 (AC-003) [MUST]
Requisito: Sem nenhum chip selecionado, salvar cria a task com o título exatamente como digitado,
sem colchete nenhum.
Como provei: sem seleção, digitei "task sem projeto" e salvei.
Provas: S13
- S13 → screenshots/r2-s13-task-sem-projeto.png — visível: task "task sem projeto" na lista, sem
  colchete.
Esperado: título exatamente como digitado.
Observado: exatamente isso.
Resultado: PASS

### RT-010 (AC-004) [MUST]
Requisito: Depois de salvar a task, o chip selecionado continua selecionado e o input fica vazio.
Como provei: logo após salvar "task 1" com "projeto exemplo 1" selecionado (mesma tela do S09/S10).
Provas: S10
- S10 → screenshots/r2-s10-chip-e-input-apos-salvar.png — visível: chip "projeto exemplo 1" ainda
  com destaque verde, input com o placeholder (vazio).
Esperado: chip continua selecionado, input vazio.
Observado: exatamente isso.
Resultado: PASS

### RT-011 (AC-005) [MUST]
Requisito: Clicar no chip de configuração da fileira abre o modal de projetos.
Como provei: cliquei no chip de configuração com nenhum projeto cadastrado.
Provas: S02
- S02 → screenshots/r2-s02-modal-projetos-vazio.png — visível: modal "Projects" aberto, lista
  vazia, campo "New project" e botão "Add".
Esperado: modal de projetos abre, com a lista vazia.
Observado: exatamente isso.
Resultado: PASS

### RT-012 (AC-006) [MUST]
Requisito: No modal de projetos dá para criar um projeto, renomear um existente e excluir um, e a
fileira de chips reflete cada uma das três operações.
Como provei: criei "projeto exemplo 1" (S03), criei "projeto exemplo 2" (S04), fechei o modal e
conferi a fileira (S06); renomeação e exclusão são cobertas por RT-022 (S24/S25) com a mesma
mecânica de modal.
Provas: S03, S04, S06
- S03 → screenshots/r2-s03-projeto-exemplo-1-criado.png — visível: "projeto exemplo 1" na lista do
  modal.
- S04 → screenshots/r2-s04-projeto-exemplo-2-criado.png — visível: "projeto exemplo 1" e "projeto
  exemplo 2" na lista.
- S06 → screenshots/r2-s06-fileira-chips-fechado.png — visível: fileira com os dois chips + chip
  de configuração.
Esperado: criar reflete na fileira.
Observado: exatamente isso.
Resultado: PASS

### RT-013 (AC-006) [MUST]
Requisito: O modal de projetos opera sobre os projetos do workflow selecionado no momento, e não
sobre os dos outros workflows.
Como provei: criei "projeto exemplo 1"/"2" em Work (S03); troquei para Personal e criei "projeto
pessoal 1" (S22); voltei a Work e abri o modal (S23).
Provas: S03, S22, S23
- S03 → screenshots/r2-s03-projeto-exemplo-1-criado.png — visível: projeto criado em Work.
- S22 → screenshots/r2-s22-projeto-pessoal-1.png — visível: modal do workflow Personal mostrando
  só "projeto pessoal 1".
- S23 → screenshots/r2-s23-modal-so-work-projects.png — visível: modal do workflow Work mostrando
  só "projeto exemplo 1" e "projeto exemplo 2", sem "projeto pessoal 1".
Esperado: cada workflow só vê seus próprios projetos.
Observado: exatamente isso.
Resultado: PASS

### RT-014 (AC-006) [SHOULD]
Requisito: Nome de projeto vazio ou só com espaços é recusado, e nome repetido dentro do mesmo
workflow é recusado.
Como provei: tentei cadastrar "   " (só espaços) no modal (S05); tentei cadastrar "projeto exemplo
2" (já existente) no modal (S27).
Provas: S05, S27
- S05 → screenshots/r2-s05-espacos-recusado.png — visível: lista continua só com os dois projetos
  anteriores, o nome de espaços não foi adicionado.
- S27 → screenshots/r2-s27-duplicado-recusado.png — visível: lista continua com um projeto só
  ("projeto exemplo 2"), a tentativa de duplicar foi recusada.
Esperado: ambos os casos recusados.
Observado: exatamente isso.
Resultado: PASS

### RT-015 (AC-007) [MUST]
Requisito: O select de workflows do header tem, como última opção, "Manage", que abre o modal de
workflows já existente, sem alterar o que ele faz nem as outras opções, e é o único caminho para
esse modal.
Como provei: abri o dropdown de workflows e escolhi "Manage".
Provas: S15
- S15 → screenshots/r2-s15-manage-abre-workflows.png — visível: modal "Workflows" aberto (com
  "Work" e "Personal" listados, CRUD de workflow), e o select do header continua mostrando "Work"
  como valor selecionado.
Esperado: modal de workflows abre; select mantém "Work".
Observado: exatamente isso.
Resultado: PASS

### RT-016 (AC-007) [MUST]
Requisito: Escolher "Manage" no select não muda o workflow selecionado.
Como provei: mesma ação do S15 — o select mostrava "Work" antes e depois de escolher "Manage".
Provas: S15
- S15 → screenshots/r2-s15-manage-abre-workflows.png — visível: select do header com "Work".
Esperado: workflow não muda.
Observado: exatamente isso.
Resultado: PASS

### RT-017 (AC-010) [MUST]
Requisito: A engrenagem que já existe no header passa a abrir o modal de configurações, e não mais
o modal de workflows.
Como provei: fechei o modal de workflows e cliquei na engrenagem do header.
Provas: S16
- S16 → screenshots/r2-s16-modal-config-abre.png — visível: modal "Settings" aberto, com o switch
  "Projetos", não o modal de workflows.
Esperado: engrenagem abre o modal de configurações.
Observado: exatamente isso.
Resultado: PASS

### RT-018 (AC-008) [MUST]
Requisito: O modal de configurações traz o switch "Projetos", ativo na primeira vez que o app abre.
Como provei: primeira abertura do modal de configurações nesta sessão (mesma tela do S16).
Provas: S17
- S17 → screenshots/r2-s17-switch-ativo.png — visível: switch "Projetos" com o track verde
  (ligado).
Esperado: switch ativo por padrão.
Observado: exatamente isso.
Resultado: PASS

### RT-019 (AC-008) [MUST]
Requisito: Com o switch desligado, nem os chips nem o chip de configuração aparecem abaixo do
input, e o espaço deles não fica reservado em branco.
Como provei: desliguei o switch "Projetos" e fechei o modal.
Provas: S18
- S18 → screenshots/r2-s18-sem-fileira-chips.png — visível: abaixo do input, a lista de tasks
  ("PENDING") começa imediatamente, sem fileira de chips nem espaço em branco no lugar dela.
Esperado: nem chips nem espaço reservado.
Observado: exatamente isso.
Resultado: PASS

### RT-020 (AC-008) [MUST]
Requisito: O estado do switch sobrevive ao fechar e reabrir o app.
Como provei: com o switch desligado (`localStorage["timertasks:settings"]` = `{"projectsEnabled":
false}` confirmado via `browser_evaluate` antes do reload), recarreguei a página duas vezes
seguidas (`browser_navigate` para a mesma URL) e reabri o modal de configurações em cada uma.
Provas: S20
- S20 → screenshots/r2-s20-switch-continua-desligado.png — visível: modal "Settings" com o switch
  "Projetos" desligado (track cinza), após reload.
Esperado: switch continua desligado após reload.
Observado: exatamente isso, em dois reloads consecutivos — confirmei também que
`localStorage["timertasks:settings"]` permaneceu `{"projectsEnabled":false}` em ambos. Este é o RT
que reprovou na rodada 1 (race entre hidratação e persistência em `useStoredSettings.ts`); o
conserto do commit `503d5c1` resolveu o problema.
Resultado: PASS

### RT-021 (AC-009) [MUST]
Requisito: Desligar o switch não altera o título de nenhuma task já salva.
Como provei: com o switch desligado, olhei a lista de tasks (mesma tela do S18).
Provas: S19
- S19 → screenshots/r2-s19-task-mantem-prefixo.png — visível: task "[projeto exemplo 1] task 1"
  continua com o mesmo título, prefixo intacto.
Esperado: título da task não muda.
Observado: exatamente isso.
Resultado: PASS

### RT-022 (AC-009) [MUST]
Requisito: Renomear ou excluir um projeto não altera o título de nenhuma task já salva. Se o
projeto excluído estava selecionado, a seleção fica vazia e a próxima task salva sai sem prefixo.
Como provei: renomeei "projeto exemplo 1" para "projeto exemplo 1 renomeado" (S24); selecionei o
chip renomeado e excluí esse projeto no modal (S25); digitei e salvei uma nova task (S26).
Provas: S24, S25, S26
- S24 → screenshots/r2-s24-renomeado-task-intacta.png — visível: modal com "projeto exemplo 1
  renomeado"; task "[projeto exemplo 1] task 1" continua com o título antigo.
- S25 → screenshots/r2-s25-nenhum-selecionado-apos-exclusao.png — visível: nenhum chip com destaque
  de selecionado (só "projeto exemplo 2", sem seleção); task antiga intacta.
- S26 → screenshots/r2-s26-task-depois-de-excluir.png — visível: task "task depois de excluir" sem
  colchete nenhum.
Esperado: renomear/excluir não muda tasks salvas; seleção esvazia ao excluir o projeto selecionado.
Observado: exatamente isso.
Resultado: PASS

## Cobertura da lane
19 de 19 RT desta lane exercitados (RT-003 a RT-022, todos [final]).
provas: 27 de 27 do roteiro produzidas (S01–S27).

## O que quebrou
Nada. Todos os RT da lane browser fecharam PASS nesta rodada, incluindo o RT-020 que havia
reprovado na rodada 1 — o conserto do commit `503d5c1` (troca de `hasHydratedRef`/`settingsRef` por
`useState` em `useStoredSettings.ts`) se sustentou em dois reloads consecutivos.

## Registros tocados
`localStorage` do navegador local, chaves `timertasks:tasks`, `timertasks:settings`,
`timertasks:workflows`, `timertasks:projects`, `timertasks:reports` (estado de teste da sessão,
recriado e depois manipulado pelo roteiro). Nenhum arquivo de configuração versionado editado.
