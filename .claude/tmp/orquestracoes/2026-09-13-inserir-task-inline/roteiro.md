# Roteiro de comprovação — inserir task inline (aprovado pelo dev, 13/09)

ambiente: `npm run dev` (Vite, porta fixa 1420)
estado: nenhum comando automatizado — montar dirigindo a UI, na ordem da seção Fixtures acima:
abrir a app com o shim de notificação; criar "Task A" e "Task B" pelo campo fixo do topo; criar um
grupo ">Group X" com subtasks "Sub 1" e "Sub 2" pelo campo fixo do card do grupo; iniciar o
Pomodoro global ("Start" no painel do timer); criar "Task Ativa" e dar Play nela; criar "Task
Pausada", dar Play e depois Stop nela; dar Play em "Sub 1" dentro de "Group X".
url: http://localhost:1420/ — seção Active da raiz com "Task Ativa" contando tempo; seção Paused
com "Task Pausada"; seção Pending com "Task A" e "Task B"; grupo "Group X" expandido mostrando a
seção Active com "Sub 1" contando tempo e a seção Pending com "Sub 2"

S01 (RT-004) [final] passar o mouse na fresta entre "Task A" e "Task B" (seção Pending da raiz) → aparece o ponto de inserção com o rótulo "+ adicionar task"
S02 (RT-004) [final] mover o mouse para fora de qualquer fresta da lista → nenhum ponto de inserção fica visível
S03 (RT-005) [final] passar o mouse na fresta acima de "Task A" (a primeira da seção Pending) → aparece o mesmo ponto de inserção ali
S04 (RT-005) [final] passar o mouse logo abaixo da última task da seção Pending da raiz → nenhum ponto de inserção aparece
S05 (RT-006) [final] comparar a fresta entre "Task A" e "Task B" sem hover e com hover → as duas tasks se deslocam, no máximo, a altura do próprio ponto de inserção
S06 (RT-007) [final] clicar no ponto de inserção entre "Task A" e "Task B" → ele vira um input de criação na mesma posição, com o cursor já piscando dentro do campo, sem nenhum clique extra
S07 (RT-008, RT-020) [final] digitar "Task Nova" no input aberto entre "Task A" e "Task B" e apertar Enter → "Task Nova" aparece exatamente entre "Task A" e "Task B", nessa ordem, nenhuma outra task muda de posição, e ela nasce na seção Pending (sem cronômetro rodando e sem o ícone de pausada), do mesmo jeito que uma task criada pelo campo fixo
S08 (RT-009) [final] com o input aberto e vazio, apertar Enter → nada é criado e o input continua aberto
S09 (RT-010) [final] depois de criar "Task Nova" (S07), digitar "Task Nova 2" no input que reabriu logo abaixo dela e apertar Enter → "Task Nova 2" aparece logo abaixo de "Task Nova", e o input reabre vazio e focado abaixo da segunda
S10 (RT-011) [final] passar o mouse na fresta entre "Sub 1" e "Sub 2", dentro da seção Pending do card "Group X" → aparece o ponto de inserção sob o cabeçalho "Pending" do grupo; clicar nele abre o input ali, com o cursor já piscando; digitar "Sub Nova" e apertar Enter → "Sub Nova" aparece exatamente entre "Sub 1" e "Sub 2", ainda dentro da seção Pending daquele grupo, e nenhum item de outra seção do grupo muda de posição
S11 (RT-012) [final] abrir um input vazio numa fresta e não interagir com nada por mais de 20 segundos → o input desaparece sozinho e a fresta volta a mostrar só o hover normal
S12 (RT-013) [final] abrir um input, digitar um texto e não interagir com nada por mais de 20 segundos → o input continua aberto com o texto digitado
S13 (RT-014) [final] abrir um input vazio, esperar cerca de 15 segundos, apertar uma tecla (reiniciando a contagem) e esperar mais 15 segundos → o input ainda está aberto (teria sumido aos 20s se a contagem não tivesse reiniciado)
S14 (RT-015) [final] com um input aberto e vazio, apertar Esc → o input fecha e nenhuma task nova aparece
S15 (RT-015) [final] com um input aberto e com um texto digitado, apertar Esc → o input fecha do mesmo jeito, sem criar nada e sem pedir confirmação
S16 (RT-016) [final] abrir um input vazio e clicar fora dele → o input fecha na hora
S17 (RT-016) [final] abrir um input, digitar um texto e clicar fora dele → o input continua aberto com o texto
S18 (RT-017) [final] com um input aberto numa fresta, clicar no ponto de inserção de outra fresta → o input da fresta antiga some e um novo input abre na fresta clicada, nunca os dois ao mesmo tempo
S19 (RT-018) [final] usar o campo fixo "Add a task..." do topo para criar "Task Final" → ela aparece no fim da lista, como hoje, sem nenhuma mudança de comportamento
S20 (RT-019) [final] criar uma task pelo ponto de inserção (repetir S07) e recarregar a página inteira → a task recém-criada continua na mesma posição
S21 (RT-020) [final] com o Pomodoro rodando e "Task Ativa" já contando tempo na seção Active da raiz, passar o mouse na fresta abaixo de "Task Ativa", clicar no ponto de inserção, digitar "Task Nova Ativa" e apertar Enter → "Task Nova Ativa" aparece na seção Active, exatamente na posição clicada, já contando tempo, sem precisar clicar em Play
S22 (RT-020) [final] com "Task Pausada" já pausada na seção Paused da raiz, passar o mouse na fresta abaixo dela, clicar no ponto de inserção, digitar "Task Nova Pausada" e apertar Enter → "Task Nova Pausada" aparece na seção Paused, exatamente na posição clicada, sem o cronômetro rodando, com a mesma aparência de uma task pausada manualmente (Play disponível, sem Square/Stop ativo)
S23 (RT-022) [final] depois de S21, observar a seção Active da raiz com "Task Ativa" e "Task Nova Ativa" lado a lado → as duas continuam contando tempo ao mesmo tempo, sem nenhuma interrupção no cronômetro de "Task Ativa" causada pela criação da nova
S24 (RT-023) [final] abrir o card "Group X" expandido, com "Sub 1" ativa e "Sub 2" pendente → o card mostra os cabeçalhos "Active" e "Pending" (na mesma ordem e com o mesmo estilo da listagem geral), cada um com sua subtask, sem nenhum cabeçalho "Paused" visível (nenhuma subtask está pausada)
S25 (RT-023) [final] clicar em Play em "Sub 2" (que estava Pending) → "Sub 2" migra para a seção Active do card, o card passa a mostrar só o cabeçalho "Active" com as duas subtasks, e o cabeçalho "Pending" some por a seção ter ficado vazia
S26 (RT-020, RT-011) [final] com o card "Group X" mostrando a seção Active, passar o mouse na fresta abaixo de "Sub 1" (dentro da seção Active do grupo), clicar no ponto de inserção, digitar "Sub Ativa Nova" e apertar Enter → "Sub Ativa Nova" aparece dentro da seção Active daquele grupo, exatamente na posição clicada, já contando tempo, sem precisar clicar em Play
S27 (RT-025) [final] com "Group X" tendo ao menos duas subtasks na seção Active (S26), arrastar uma delas para cima da outra dentro da mesma seção Active do grupo → as duas trocam de posição, e a ordem da seção Pending do mesmo grupo não muda
S28 (RT-025) [final] tentar arrastar uma subtask da seção Active do grupo para dentro da seção Pending do mesmo grupo → o drop é recusado: a subtask permanece na seção Active, na mesma posição de antes
S29 (RT-026) [final] com o card "Group X" aberto, usar o campo fixo "Add a task..." do próprio card para criar "Sub Final" → ela aparece no fim da seção Pending daquele grupo, como uma subtask recém-nascida (sem cronômetro), abaixo de qualquer outra subtask pendente já existente

comando: nenhum (comando de teste: nenhum — lane `teste` indisponível neste projeto)
T01 n/a

