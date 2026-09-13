# Spec — inserir task inline, na posição certa

[Personas]
  P1  Dono das listas (o próprio usuário do app)

[Familiaridade com o sistema]
  P1  Alta. Usa o app todo dia e conhece cada campo de criação que existe.

[Estado atual]
  Uma task nova só entra de duas formas: pelo campo fixo no topo da lista geral, que
  cria a task no fim de tudo, ou pelo campo fixo dentro do card do grupo/subtask, que
  cria no fim daquele grupo. Não existe ponto de criação no meio da lista, e
  reposicionar depois é só arrastando. A ordem de uma task é a posição dela na lista,
  sem campo de posição explícito.
  (confirmado no código)

[Ideia]
  Inserir uma task já na posição certa: o hover na fresta entre dois itens revela um
  "+ adicionar task", o clique abre o input de criação ali mesmo, e o input vazio some
  sozinho depois de um tempo ocioso.

[Fora de escopo]
  Mexer no campo fixo de criação — ele continua criando no fim da lista / do grupo.
  Mexer no drag-and-drop além do que o seccionamento do grupo obriga (RT-025).
  Ponto de inserção abaixo da última task de cada seção: o campo fixo já cobre isso.
  Mudar a regra de quando uma task é ativa, pausada ou pendente. A inserção só herda o
  estado da seção, pelo caminho que já existe.
  Criar grupo/subtask pelo ponto de inserção. Ele cria task.

[Specs]
  ### P1 — Dono das listas
  AC-001  Espera que passar o mouse em qualquer fresta entre duas tasks — e também
          acima da primeira task de cada seção — revele um ponto de inserção
          "+ adicionar task".
  AC-002  Espera que clicar nele abra o input de criação ali mesmo, já com o foco no
          campo, e que a task criada nasça exatamente naquela posição.
  AC-003  Espera que, depois de criar, o input continue aberto logo abaixo da task
          recém-criada, para enfileirar várias sem reabrir nada.
  AC-004  Espera o mesmo comportamento dentro de uma lista aninhada, entre as tasks de
          um grupo/subtask.
  AC-008  (rn) Espera que a lista de dentro de um grupo passe a ser dividida nas mesmas
          seções da listagem geral — ativas, pausadas, pendentes —, com os mesmos
          cabeçalhos e a mesma ordem, para que a fresta dentro do grupo herde estado do
          mesmo jeito que a de fora.
  AC-005  (rn) Espera que um input aberto e vazio suma sozinho depois de 20 segundos
          sem interação, e que um input com texto digitado nunca suma por tempo.
  AC-006  Espera continuar criando pelo campo fixo de sempre, sem nenhuma mudança nele.
  AC-007  (rn) Espera que a task inserida numa fresta nasça no mesmo estado de atividade
          da seção onde a fresta está: pendente na seção das pendentes, pausada na das
          pausadas, e contando tempo na das ativas — sem que isso invente estado novo
          nem quebre a forma como os dados de uma task são guardados hoje.

[Requisitos técnicos]
  ### Geral
  RT-001 (Geral) [MUST] Não introduzir dependência nova por causa do ponto de inserção
         nem do temporizador, porque o comportamento é hover mais contagem de tempo e o
         projeto já tem tudo que isso precisa; dependência nova aqui paga custo de
         bundle sem trazer nada.
  RT-002 (Geral) [MUST] Não mudar a forma como a ordem das tasks é representada hoje,
         porque mexer nisso mexeria no drag-and-drop, que está fora de escopo.
  RT-003 (Geral) [MUST] A task criada pelo ponto de inserção é igual em tudo a uma
         criada pelo campo fixo, exceto pela posição e pelo estado de atividade herdado
         da seção (AC-007): mesmos campos, mesma persistência, nenhuma combinação de
         campos que hoje não exista. Task que nasce com formato diferente conforme o
         ponto de criação vira bug silencioso mais tarde.

  ### P1 — Dono das listas
  RT-004 (AC-001) [MUST] Com o mouse parado na fresta entre duas tasks, o ponto de
         inserção fica visível com o rótulo "+ adicionar task"; com o mouse fora de
         qualquer fresta, nenhum ponto de inserção está visível na lista.
  RT-005 (AC-001) [MUST] A fresta acima da primeira task de cada seção tem ponto de
         inserção; abaixo da última task de cada seção não tem nenhum.
  RT-006 (AC-001) [SHOULD] Aparecer o ponto de inserção não desloca nenhuma task na
         tela. Saída, nesta ordem: se reservar a altura o tempo todo deixar a lista
         visualmente frouxa, aceitar um deslocamento de no máximo a altura do próprio
         ponto de inserção, e nunca mais que isso.
  RT-007 (AC-002) [MUST] Clicar no ponto de inserção o troca por um input de criação na
         mesma posição, com o cursor já dentro do campo, sem nenhum clique extra.
  RT-008 (AC-002) [MUST] Digitar um título e apertar Enter cria a task exatamente entre
         as duas tasks daquela fresta, e a ordem das demais não muda.
  RT-009 (AC-002) [MUST] Enter com o campo vazio não cria nada e mantém o input aberto.
  RT-010 (AC-003) [MUST] Depois do Enter que cria, o input continua aberto e vazio,
         logo abaixo da task recém-criada e com o foco mantido; um segundo Enter cria a
         segunda task logo abaixo da primeira.
  RT-011 (AC-004) [MUST] Tudo de RT-004 a RT-010 vale igual entre as tasks de um
         grupo/subtask, e a task criada nasce dentro daquele grupo, na posição da fresta
         e na seção daquela fresta.
  RT-012 (AC-005) [MUST] Um input aberto e vazio, sem nenhuma interação, some sozinho
         20 segundos depois de abrir, e a fresta volta ao comportamento de hover.
  RT-013 (AC-005) [MUST] Um input com qualquer texto digitado não some por tempo, por
         mais que fique parado.
  RT-014 (AC-005) [MUST] Qualquer interação com o input vazio — uma tecla, um clique
         dentro dele — reinicia a contagem dos 20 segundos.
  RT-015 (AC-005) [MUST] Esc fecha o input, com ou sem texto, e nada é criado.
  RT-016 (AC-005) [MUST] Clicar fora do input: com o campo vazio ele fecha na hora; com
         texto digitado ele continua aberto.
  RT-017 (AC-005) [MUST] Clicar no ponto de inserção de outra fresta com um input já
         aberto move o input para a fresta nova, e nunca existe mais de um input inline
         aberto ao mesmo tempo.
  RT-018 (AC-006) [MUST] O campo fixo de criação continua criando no fim da lista e no
         fim do grupo, com o mesmo comportamento de hoje.
  RT-019 (AC-002) [MUST] A task criada pelo ponto de inserção sobrevive a recarregar a
         tela, na mesma posição.
  RT-020 (AC-007) [MUST] Criar numa fresta da seção das ativas produz uma task contando
         tempo, na posição clicada; numa fresta das pausadas, uma task pausada; numa
         fresta das pendentes, uma task pendente. Nos três casos a task fica visível
         exatamente onde o ponto de inserção estava. Vale na listagem geral e dentro de
         um grupo.
  RT-021 (AC-007) [MUST] A herança de estado usa o caminho de criação e de mudança de
         estado que o app já tem hoje: nenhum campo novo, nenhum valor novo e nenhuma
         combinação de campos inédita. Se o app hoje faz a task passar por um estado
         antes de ficar ativa, a inserção passa pelo mesmo caminho.
  RT-022 (AC-007) [MUST] Se o app hoje só admite uma task contando tempo por vez, criar
         na fresta das ativas tem exatamente o mesmo efeito que criar a task e dar play
         nela — e nada além disso.
  RT-023 (AC-008) [MUST] A lista de dentro de um grupo aparece dividida nas mesmas
         seções da listagem geral, com os mesmos cabeçalhos, na mesma ordem, e uma
         seção sem nenhuma subtask não aparece.
  RT-024 (AC-008) [MUST] A divisão em seções dentro do grupo reusa a mesma apresentação
         e a mesma regra de agrupamento da listagem geral, sem uma segunda cópia da
         regra, porque duas fontes de verdade para o mesmo agrupamento divergem na
         primeira mudança.
  RT-025 (AC-008) [MUST] Arrastar uma subtask dentro do grupo continua funcionando, com
         a mesma regra da listagem geral depois do seccionamento: reordena dentro da
         mesma seção.
  RT-026 (AC-008) [MUST] O campo fixo de criação de dentro do card do grupo continua
         criando a subtask pendente, que passa a aparecer no fim da seção das pendentes
         daquele grupo.
