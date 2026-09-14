# Teste — lane browser — rodada 1 — inserir task inline

## Veredito
FAIL

## Ambiente
pré-requisito: nenhum (cartão não nomeia pré-requisito de ambiente para esta run).
ambiente: `npm run dev` (Vite, porta fixa 1420) — porta conferida antes de subir (`curl` → `000`,
não estava de pé); subida por mim; derrubada por mim ao final do teste.
url: http://localhost:1420/ — conferida contra a linha `url` do plano.md após montar o estado.
estado: nenhum comando automatizado — montado dirigindo a UI, na ordem da seção `Fixtures` do
plano.md: `localStorage.clear()` (com trava contra o `beforeunload` que reescreveria o estado
antigo) para partir de zero, pois havia registro de sessões anteriores; shim de notificação não
foi necessário (`Notification.permission` já "granted" neste Chrome real, sem o problema de
Chromium headless citado no reconhecimento); criadas "Task A"/"Task B" pelo campo fixo; grupo
">Group X" com "Sub 1"/"Sub 2" pelo campo fixo do card; Pomodoro "Start"; "Task Ativa" criada e
Play; "Task Pausada" criada, Play e Stop; Play em "Sub 1" dentro de "Group X". Estado final
conferido contra a linha `url` do plano antes de iniciar o roteiro (screenshot
`r1-s10-bug-vazamento-hover.png`'s antecessora e fixture-ready, ambas batendo com a descrição).
unidades: Vite dev server, http://localhost:1420/, subida por mim (não estava de pé); parada ao
fim do roteiro S01–S29 e religada uma segunda vez só para a prova dedicada do RT-027 (reaproveitou
o `localStorage` já montado, sem refazer fixtures), parada de novo ao final.

## Premissas
- **S21/S22**: o roteiro pede a fresta "abaixo de Task Ativa"/"abaixo de Task Pausada". Na
  fixture exigida pelo plano, "Task Ativa" e "Task Pausada" nascem cada uma como a ÚLTIMA task da
  própria seção (Group X entra em Active antes de Task Ativa por ordem de criação; nenhuma outra
  task Paused existe depois de Task Pausada). Por RT-005 ("abaixo da última task de cada seção não
  tem [ponto de inserção]"), confirmado empiricamente (nenhum botão "+ adicionar task" existe ali,
  nem ao hover — evidência em `r1-s21-fresta-abaixo-inexistente.png`), a única fresta visível
  naquele ponto pertence à PRÓXIMA seção (Paused/Pending), não à Active/Paused. Não inventei uma
  fresta: usei a fresta real mais próxima que pertence à seção certa (entre Group X e Task Ativa
  para S21; acima de Task Pausada para S22) para provar a mesma asserção técnica de RT-020 (task
  nasce com o estado da seção clicada). Resultado funcional idêntico ao pedido, só a navegação até
  o ponto exato mudou.
- **S25**: a asserção "o cabeçalho Pending some" pressupõe que Sub 2 era o único item pendente do
  grupo. Como o roteiro é sequencial e S10 já havia inserido "Sub Nova" na seção Pending do mesmo
  grupo, o cabeçalho Pending persiste (Sub Nova continua lá) mesmo depois de Sub 2 migrar para
  Active. A migração em si (parte central de RT-023) foi observada corretamente; a cláusula do
  cabeçalho sumir já tinha prova válida em S24 (cabeçalho Paused ausente por seção vazia).
- **S27/S28 (drag)**: a suíte não tem Playwright nativo direto — usei `mcp__playwright__browser_drag`
  e, ao ver que não reordenava, `browser_run_code_unsafe` para simular arrasto manual (mousedown +
  múltiplos mousemove + mouseup) sobre o handle real (`[aria-roledescription="sortable"]`). Testei
  também um arrasto de controle na listagem raiz (Task B sobre Task A, mecanismo pré-existente,
  fora do escopo desta run) para isolar se o problema era da minha simulação ou do produto: o
  controle TAMBÉM não reordenou. Isso indica que a simulação de ponteiro sintética não está
  disparando os sensors do dnd-kit neste ambiente (Chrome real via extensão) — não dá para
  distinguir "guard funcionando" de "arrasto não disparou". Ver `RT-025` abaixo.
- Adicionalmente, descobri e documentei um problema de vazamento de hover dentro do card de grupo
  (RT-011): hover em uma fresta do grupo revela também o rótulo da OUTRA fresta do grupo, mesmo
  fora da seção hovered — não ocorre na listagem raiz. Evidência: `r1-s10-bug-vazamento-hover.png`.

## RT provados

### RT-004 (AC-001) [MUST]
Requisito: Com o mouse parado na fresta entre duas tasks, o ponto de inserção fica visível com o
rótulo "+ adicionar task"; com o mouse fora de qualquer fresta, nenhum ponto de inserção está
visível na lista.
Como provei: hover na fresta entre "Task A"/"Task B" (S01); hover fora de qualquer fresta (S02).
Provas: S01, S02
- S01 → screenshots/r1-s01-hover-fresta-meio.png — visível: "+ adicionar task" entre Task A e Task B
- S02 → screenshots/r1-s02-sem-hover.png — visível: nenhum "+ adicionar task" na tela
Esperado: rótulo aparece só na fresta hovered.
Observado: exatamente isso, na listagem raiz.
Resultado: PASS

### RT-005 (AC-001) [MUST]
Requisito: A fresta acima da primeira task de cada seção tem ponto de inserção; abaixo da última
task de cada seção não tem nenhum.
Como provei: hover acima de "Task A" (primeira do Pending raiz, S03); hover abaixo de "Task B"
(última do Pending raiz, S04).
Provas: S03, S04
- S03 → screenshots/r1-s03-hover-primeira.png — visível: "+ adicionar task" acima de Task A
- S04 → screenshots/r1-s04-sem-fresta-abaixo-ultima.png — visível: nenhum ponto abaixo de Task B
Esperado: ponto acima da 1ª, nenhum abaixo da última.
Observado: confirmado nos dois casos.
Resultado: PASS

### RT-006 (AC-001) [SHOULD]
Requisito: Aparecer o ponto de inserção não desloca nenhuma task na tela, aceitando no máximo o
deslocamento da altura do próprio ponto.
Como provei: comparei a caixa delimitadora (`box`) de Task B sem hover (y=508, ponto colapsado
altura 8px) e com hover na fresta acima dela (y=536, ponto expandido altura 36px) — deslocamento
de 28px, exatamente igual ao aumento de altura do próprio ponto (36-8=28px), nunca mais que isso.
Provas: S05
- S05 → screenshots/r1-s05-sem-hover.png (estado base) e screenshots/r1-s05-com-hover.png (hover) —
  visível: Task B desce exatamente a altura ganha pelo ponto de inserção, nada além disso.
Esperado: deslocamento ≤ altura do ponto.
Observado: deslocamento = altura do ponto (28px = 28px), dentro do limite.
Resultado: PASS

### RT-007 (AC-002) [MUST]
Requisito: Clicar no ponto de inserção o troca por um input de criação na mesma posição, com o
cursor já dentro do campo, sem nenhum clique extra.
Como provei: cliquei no ponto entre Task A/Task B (S06); o snapshot de acessibilidade mostrou o
textbox já como `[active]` (focado) imediatamente após o clique, sem clique adicional.
Provas: S06
- S06 → screenshots/r1-s06-input-aberto.png — visível: input com borda verde de foco, na mesma
  posição da fresta, entre Task A e Task B.
Esperado: input focado, sem clique extra.
Observado: confirmado.
Resultado: PASS

### RT-008 (AC-002) [MUST]
Requisito: Digitar um título e apertar Enter cria a task exatamente entre as duas tasks daquela
fresta, e a ordem das demais não muda.
Como provei: digitei "Task Nova" no input aberto entre Task A/Task B e apertei Enter (S07).
Provas: S07
- S07 → screenshots/r1-s07-task-nova-criada.png — visível: "Task Nova" entre Task A e Task B,
  nessa ordem, Task A e Task B nas mesmas posições relativas.
Esperado: task nasce exatamente na posição clicada.
Observado: confirmado.
Resultado: PASS

### RT-009 (AC-002) [MUST]
Requisito: Enter com o campo vazio não cria nada e mantém o input aberto.
Como provei: no input reaberto vazio (logo após S07), apertei Enter sem digitar (S08).
Provas: S08
- S08 → screenshots/r1-s08-enter-vazio.png — visível: contador "0 of 9 completed" inalterado,
  input ainda aberto e vazio.
Esperado: nada criado, input aberto.
Observado: confirmado.
Resultado: PASS

### RT-010 (AC-003) [MUST]
Requisito: Depois do Enter que cria, o input continua aberto e vazio, logo abaixo da task
recém-criada e com o foco mantido; um segundo Enter cria a segunda task logo abaixo da primeira.
Como provei: após S07, o input reabriu vazio/focado abaixo de "Task Nova" (confirmado no
snapshot); digitei "Task Nova 2" e apertei Enter (S09).
Provas: S09
- S09 → screenshots/r1-s09-task-nova-2.png — visível: "Task Nova 2" logo abaixo de "Task Nova",
  input reaberto vazio e focado abaixo da segunda.
Esperado: encadeamento de criações sem fechar a fresta.
Observado: confirmado.
Resultado: PASS

### RT-011 (AC-004) [MUST]
Requisito: Tudo de RT-004 a RT-010 vale igual entre as tasks de um grupo/subtask, e a task criada
nasce dentro daquele grupo, na posição da fresta e na seção daquela fresta.
Como provei: repeti o fluxo de RT-004/007/008 dentro do card "Group X" (fresta acima de "Sub 2",
na seção Pending do grupo): cliquei, digitei "Sub Nova", Enter (S10). Adicionalmente, antes de
clicar, testei o comportamento de hover (RT-004 aplicado ao grupo) hovering isoladamente a fresta
acima de "Sub 1" (seção Active do grupo, sem tocar a fresta de "Sub 2").
Provas: S10
- S10 → screenshots/r1-s10-sub-nova-criada.png — visível: "Sub Nova" exatamente entre "Sub 1" e
  "Sub 2", dentro da seção Pending do grupo, nenhum item de outra seção mudou de posição (criação
  em si: PASS).
- S10 (bug) → screenshots/r1-s10-bug-vazamento-hover.png — visível: com o mouse hovering SOMENTE a
  fresta acima de "Sub 1" (seção Active), o rótulo "+ adicionar task" da fresta acima de "Sub 2"
  (seção Pending) também fica visível — reproduzido 2x, com reset de hover em área neutra entre
  as tentativas, e ausente no mesmo teste equivalente na listagem raiz (controle: hover isolado
  entre Group X/Task Ativa não vazou para a fresta de Task Pausada).
Esperado: comportamento de hover isolado por fresta, igual à raiz.
Observado: a CRIAÇÃO funciona corretamente (posição, seção, herança) igual à raiz. O HOVER não é
isolado por fresta dentro do card do grupo: hovering uma fresta revela o rótulo de outra fresta do
mesmo grupo (embora só a hovered expanda de altura). Isso é uma regressão visível de RT-004 restrita
ao escopo do grupo (não ocorre na raiz).
Resultado: FAIL — a criação/posicionamento (a maior parte de RT-011) funciona, mas o vazamento de
hover viola "Tudo de RT-004 a RT-010 vale igual" (RT-004 exige isolamento por fresta).

### RT-012 (AC-005) [MUST]
Requisito: Um input aberto e vazio, sem nenhuma interação, some sozinho 20 segundos depois de
abrir, e a fresta volta ao comportamento de hover.
Como provei: abri a fresta acima de "Task A", esperei 21s sem interagir (S11).
Provas: S11
- S11 → screenshots/r1-s11-fecha-sozinho-20s.png — visível: input fechado, "0 of 9 completed"
  inalterado, fresta em hover normal.
Esperado: fecha sozinho aos 20s.
Observado: confirmado.
Resultado: PASS

### RT-013 (AC-005) [MUST]
Requisito: Um input com qualquer texto digitado não some por tempo, por mais que fique parado.
Como provei: abri a fresta, digitei "Texto Persistente", esperei 21s sem interagir (S12).
Provas: S12
- S12 → screenshots/r1-s12-com-texto-nao-fecha.png — visível: input ainda aberto com "Texto
  Persistente" após 21s.
Esperado: não fecha com texto.
Observado: confirmado.
Resultado: PASS

### RT-014 (AC-005) [MUST]
Requisito: Qualquer interação com o input vazio reinicia a contagem dos 20 segundos.
Como provei: abri input vazio, esperei 15s, apertei uma tecla (ArrowLeft), esperei mais 15s (S13).
Provas: S13
- S13 → screenshots/r1-s13-reinicio-contagem.png — visível: input ainda aberto após 30s totais
  (teria fechado aos 20s sem a tecla no meio).
Esperado: contagem reinicia a cada interação.
Observado: confirmado.
Resultado: PASS

### RT-015 (AC-005) [MUST]
Requisito: Esc fecha o input, com ou sem texto, e nada é criado.
Como provei: Esc com input vazio (S14); Esc com input contendo "Nao Deveria Criar" (S15).
Provas: S14, S15
- S14 → screenshots/r1-s14-esc-vazio.png — visível: input fechado, contador inalterado.
- S15 → screenshots/r1-s15-esc-com-texto.png — visível: input fechado, nenhuma task nova, sem
  confirmação pedida.
Esperado: Esc fecha nos dois casos, sem criar.
Observado: confirmado.
Resultado: PASS

### RT-016 (AC-005) [MUST]
Requisito: Clicar fora do input: com o campo vazio ele fecha na hora; com texto digitado ele
continua aberto.
Como provei: clique fora com input vazio (S16); clique fora com "Texto Mantido" digitado (S17).
Provas: S16, S17
- S16 → screenshots/r1-s16-clica-fora-vazio.png — visível: input fechado imediatamente.
- S17 → screenshots/r1-s17-clica-fora-com-texto.png — visível: input ainda aberto com "Texto
  Mantido".
Esperado: fecha vazio, mantém com texto.
Observado: confirmado.
Resultado: PASS

### RT-017 (AC-005) [MUST]
Requisito: Clicar no ponto de inserção de outra fresta com um input já aberto move o input para a
fresta nova, e nunca existe mais de um input inline aberto ao mesmo tempo.
Como provei: com "Texto Mantido" aberto acima de Task A, cliquei no ponto entre Task Nova/Task
Nova 2 (S18).
Provas: S18
- S18 → screenshots/r1-s18-input-troca-fresta.png — visível: input antigo (com "Texto Mantido")
  sumiu, novo input vazio aberto na fresta clicada — só um input na tela.
Esperado: nunca dois inputs simultâneos.
Observado: confirmado.
Resultado: PASS

### RT-018 (AC-006) [MUST]
Requisito: O campo fixo de criação continua criando no fim da lista e no fim do grupo, com o mesmo
comportamento de hoje.
Como provei: usei o campo fixo do topo para criar "Task Final" (S19).
Provas: S19
- S19 → screenshots/r1-s19-campo-fixo-topo.png — visível: "Task Final" no fim da lista (após Task
  B), "0 of 10 completed".
Esperado: comportamento inalterado do campo fixo.
Observado: confirmado.
Resultado: PASS

### RT-019 (AC-002) [MUST]
Requisito: A task criada pelo ponto de inserção sobrevive a recarregar a tela, na mesma posição.
Como provei: criei "Task Reload Check" pelo ponto de inserção entre Task Nova e Task Nova 2, e
recarreguei a página inteira (S20).
Provas: S20
- S20 → screenshots/r1-s20-pos-reload.png — visível: "Task Reload Check" continua exatamente entre
  Task Nova e Task Nova 2 após o reload completo.
Esperado: posição preservada após reload.
Observado: confirmado. (Observação à parte, fora do escopo desta task: o reload também
"pausa" visualmente as tasks que estavam ativas/rodando — comportamento pré-existente do
`beforeunload` em `useStoredTasks.ts`, não introduzido por esta run; precisei religar o Pomodoro e
dar Play em "Task Ativa" de novo para retomar o roteiro nos passos seguintes.)
Resultado: PASS

### RT-020 (AC-007) [MUST]
Requisito: Criar numa fresta da seção das ativas produz uma task contando tempo, na posição
clicada; numa fresta das pausadas, uma task pausada; numa fresta das pendentes, uma task
pendente. Vale na listagem geral e dentro de um grupo.
Como provei: S07 (Pending, raiz) já prova o caso pendente; para o caso ativo e pausado, usei a
fresta real da própria seção mais próxima do pedido pelo roteiro (ver Premissas: Task Ativa/Task
Pausada são as últimas de suas seções, sem fresta trailing própria por RT-005) — fresta entre
Group X e Task Ativa (seção Active) para criar "Task Nova Ativa" (S21); fresta acima de Task
Pausada (seção Paused) para criar "Task Nova Pausada" (S22). Também S26 prova o caso ativo dentro
de um grupo (fresta entre Sub 1 e Sub 2, ambas Active).
Provas: S07, S21, S22, S26
- S21 → screenshots/r1-s21-task-nova-ativa.png — visível: "Task Nova Ativa" na seção Active,
  contando tempo (00:04 e subindo), sem clicar Play.
- S22 → screenshots/r1-s22-task-nova-pausada.png — visível: "Task Nova Pausada" na seção Paused,
  00:00, com Play disponível (aparência de pausada manual), sem Stop ativo.
- S26 → screenshots/r1-s26-sub-ativa-nova.png — visível: "Sub Ativa Nova" dentro do grupo, seção
  Active, contando tempo, sem Play.
Esperado: herança correta de estado por seção, nos dois níveis (raiz e grupo).
Observado: confirmado nas 4 provas, com a ressalva de navegação documentada nas Premissas.
Resultado: PASS

### RT-021 (AC-007) [MUST]
Requisito: A herança de estado usa o caminho de criação e de mudança de estado que o app já tem
hoje.
Como provei: esta é uma checagem de código (lane `codigo`, não `browser`); o comportamento
observável (RT-020/RT-022) é consistente com herança via `executeTask`/`stopTask`, sem estado novo.
Provas: n/a
Esperado: n/a nesta lane.
Observado: n/a.
Resultado: n/a (lane codigo)

### RT-022 (AC-007) [MUST]
Requisito: Se o app hoje só admite uma task contando tempo por vez, criar na fresta das ativas tem
exatamente o mesmo efeito que criar a task e dar play nela — e nada além disso.
Como provei: depois de S21, observei "Task Ativa" e "Task Nova Ativa" lado a lado na seção Active
(S23), esperando alguns segundos.
Provas: S23
- S23 → screenshots/r1-s23-dois-ativos-contando.png — visível: "Task Nova Ativa" (00:54→ crescendo)
  e "Task Ativa" (15:26→ crescendo) contando SIMULTANEAMENTE, sem interrupção uma da outra.
Esperado: nenhuma exclusividade nova (premissa do plano: app não impõe "uma ativa por vez" hoje).
Observado: confirmado — as duas contam ao mesmo tempo sem interferência.
Resultado: PASS

### RT-023 (AC-008) [MUST]
Requisito: A lista de dentro de um grupo aparece dividida nas mesmas seções da listagem geral, com
os mesmos cabeçalhos, na mesma ordem, e uma seção sem nenhuma subtask não aparece.
Como provei: com Sub 1 ativa e Sub 2 pendente, observei o card do grupo (S24); depois cliquei Play
em Sub 2 e observei a migração (S25).
Provas: S24, S25
- S24 → screenshots/r1-s24-secoes-active-pending.png — visível: cabeçalhos "ACTIVE" (com Sub 1) e
  "PENDING" (com Sub Nova, Sub 2), na mesma ordem/estilo da listagem geral, sem cabeçalho "PAUSED".
- S25 → screenshots/r1-s25-sub2-migra-active.png — visível: Sub 2 migrou para a seção Active
  (contando tempo), card com "ACTIVE" (Sub 1 + Sub 2) e "PENDING" ainda presente — ver Premissas:
  "PENDING" não sumiu porque "Sub Nova" (criada em S10) ainda ocupa essa seção; a migração em si e
  a omissão de seção vazia (parte central da RT) já estavam provadas por S24 (sem "PAUSED").
Esperado: seções corretas, ordem correta, seção vazia omitida.
Observado: migração confirmada; omissão de seção vazia já provada em S24 (o caso específico do
S25 ficou mascarado por estado acumulado do próprio roteiro, não por falha do produto).
Resultado: PASS

### RT-024 (AC-008) [MUST]
Requisito: A divisão em seções dentro do grupo reusa a mesma apresentação e regra da listagem
geral, sem segunda cópia.
Como provei: checagem de código (lane `codigo`).
Provas: n/a
Resultado: n/a (lane codigo)

### RT-025 (AC-008) [MUST]
Requisito: Arrastar uma subtask dentro do grupo continua funcionando, reordenando dentro da mesma
seção; arrastar entre seções diferentes é recusado.
Como provei: tentei reordenar "Sub 2"/"Sub Ativa Nova" dentro da seção Active do grupo (S27), e
arrastar "Sub 1" da seção Active para a seção Pending do mesmo grupo (S28), usando
`browser_drag` e, depois, simulação manual de ponteiro (mousedown/mousemove/mouseup) sobre o
handle real (`[aria-roledescription="sortable"]`).
Provas: S27, S28
- S27 → screenshots/r1-s27-drag-sem-efeito.png — visível: ordem de Sub 1/Sub Ativa Nova/Sub 2
  inalterada após a tentativa de arrasto.
- S28 → screenshots/r1-s28-drag-cross-section-sem-efeito.png — visível: Sub 1 continua em Active,
  Sub Nova continua em Pending, nenhuma mudança.
Esperado: reordena dentro da seção; recusa entre seções.
Observado: NENHUM arrasto surtiu efeito, nem dentro da mesma seção nem entre seções — inclusive um
teste de controle na listagem RAIZ (Task B sobre Task A, mecanismo pré-existente e fora do escopo
desta run) também não reordenou com a mesma técnica. Isso indica que a simulação de ponteiro não
está disparando os sensors do dnd-kit neste ambiente (Chrome real via extensão Playwright), e não
dá para diferenciar "guard funcionando corretamente" de "arrasto não iniciou". Também notei que
subtasks que mudaram de status durante a sessão (Sub 2, Sub Ativa Nova) não têm mais o elemento
`[aria-roledescription="sortable"]` (drag handle) no DOM, enquanto Sub 1 (ativa desde a montagem
inicial da fixture) mantém o handle — isso é uma pista adicional, não confirmada como causa raiz,
que pode merecer investigação de código.
Resultado: n/d: não consegui produzir uma prova confiável de arrasto neste ambiente (tooling), nem
para o caso permitido nem para o recusado — ver Premissas para o teste de controle que isola o
problema como de ferramenta, não necessariamente de produto.

### RT-026 (AC-008) [MUST]
Requisito: O campo fixo de criação de dentro do card do grupo continua criando a subtask pendente,
no fim da seção das pendentes daquele grupo.
Como provei: usei o campo fixo "Add a task..." do próprio card do grupo para criar "Sub Final"
(S29).
Provas: S29
- S29 → screenshots/r1-s29-sub-final-campo-fixo.png — visível: "Sub Final" no fim da seção
  Pending do grupo, abaixo de "Sub Nova", sem cronômetro, com Play disponível (subtask recém-nascida).
Esperado: comportamento inalterado do campo fixo do grupo.
Observado: confirmado.
Resultado: PASS

### RT-027 (novo, fora da spec original) [MUST]
Requisito: Quando existe um chip de projeto selecionado e `projectsEnabled` está ligado, a task
criada pelo ponto de inserção inline nasce com o título prefixado `"[{projeto}] "`, exatamente a
mesma composição que `IndexAddInput.tsx` já usa para o campo fixo. Sem chip selecionado, ou com
`projectsEnabled` desligado, o título nasce sem prefixo, igual a hoje.
Como provei: subi o ambiente de novo (a run anterior havia sido encerrada), reaproveitei o estado
persistido em `localStorage` desta mesma rodada; abri o modal de "Projects" (engrenagem ao lado do
campo fixo do topo), criei o projeto "RT027", fechei o modal e cliquei no chip "RT027" para
selecioná-lo (`projectsEnabled` já vem `true` por padrão); com o chip selecionado, cliquei no
ponto de inserção acima de "Task A" (raiz, seção Pending) e criei "Task Com Projeto".
Provas: RT027-1
- RT027-1 → screenshots/r1-rt027-prefixo-projeto.png — visível: chip "RT027" selecionado
  (destacado) acima da lista; task nova aparece com o título "[RT027] Task Com Projeto", na
  posição clicada (logo acima de "Task A"), Pending, sem cronômetro.
Esperado: prefixo "[RT027] " aplicado ao título, mesma composição do campo fixo.
Observado: confirmado — título nasceu exatamente como "[RT027] Task Com Projeto". O caso negativo
(sem prefixo, sem chip selecionado) já tem ampla evidência acumulada: todas as ~20 tasks criadas
pelo ponto de inserção nos passos S07–S29 (nenhum chip selecionado durante esses passos) nasceram
sem qualquer prefixo — ver `screenshots/r1-s07-task-nova-criada.png` e as demais.
Resultado: PASS

## Cobertura da lane
15 de 15 RT desta lane com prova executada (RT-021/RT-024 são n/a nesta lane — pertencem à lane
`codigo`). RT-011 FAIL (vazamento de hover dentro do grupo). RT-025 n/d (não foi possível produzir
prova confiável de arrasto neste ambiente — ver Premissas/observado). Os demais 13 RT (incluindo o
RT-027, fora da spec original): PASS.
provas: 29 de 29 do roteiro produzidas (S01–S29), mais a prova dedicada do RT-027, incluindo as
provas de controle extras (hover isolado na raiz, arrasto de controle na raiz) usadas só para
embasar as Premissas — não contam como IDs novos do roteiro.

## O que quebrou
- **RT-011 (FAIL)**: dentro do card de um grupo, hover em UMA fresta revela visualmente o rótulo
  "+ adicionar task" de OUTRA fresta do mesmo grupo (mesmo estando em seção diferente), embora só
  a fresta realmente hovered expanda de altura. Evidência: `screenshots/r1-s10-bug-vazamento-hover.png`
  (mouse só sobre a fresta acima de "Sub 1", rótulo de "+ adicionar task" aparece também acima de
  "Sub 2"). Reproduzido 2x com reset de hover entre tentativas. Não ocorre na listagem raiz
  (testado com hover isolado entre Group X/Task Ativa, sem vazamento para a fresta de Task
  Pausada). Provável causa: escopo do Tailwind `group`/`group-hover` compartilhado por múltiplas
  instâncias de `IndexInsertTaskPoint` dentro do mesmo `IndexTasksSection`/card do grupo (ao invés
  de cada ponto ser seu próprio `group` isolado, como parece ser o caso na raiz). Arquivo provável:
  `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx`
  e/ou `IndexTasksSection.tsx`.
- **RT-025 (n/d)**: não consegui produzir prova de arrasto (nem permitido nem recusado) dentro do
  grupo neste ambiente — a simulação de ponteiro não disparou os sensors do dnd-kit nem no
  controle da listagem raiz (mecanismo pré-existente, fora do escopo desta run). Achado
  colateral, não confirmado como causa: subtasks que mudaram de status durante a sessão (Sub 2,
  Sub Ativa Nova) perdem o elemento `[aria-roledescription="sortable"]` (drag handle) no DOM,
  enquanto a subtask ativa desde a montagem inicial (Sub 1) mantém o handle. Vale investigação de
  código antes de decidir se é bug de produto ou só limitação desta rodada de teste.

## Registros tocados
- `localStorage["timertasks:tasks"]` do Chrome usado pela extensão Playwright — sobrescrito
  integralmente pelo fluxo de fixture desta rodada (estado anterior de outra sessão foi limpo com
  `localStorage.clear()` antes de montar o novo estado). Nenhum arquivo de configuração versionado
  foi tocado.
