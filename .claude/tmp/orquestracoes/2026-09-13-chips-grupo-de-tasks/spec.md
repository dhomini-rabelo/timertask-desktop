# Spec — chips de projeto abaixo do input de adicionar task

[Personas]
  P1  O dev/fundador, usuário único do app no dia a dia.

[Familiaridade com o sistema]
  P1  Alta. Usa o app todo dia e trabalha em 2 projetos dentro do workflow Work.

[Estado atual]
  O input principal de adicionar task convive com dois conceitos de agrupamento: um TaskGroup
  visual criado digitando ">" no próprio input, e um Workflow (Work/Personal) selecionado em
  dropdown no header, que escopa a lista inteira e tem CRUD próprio, persistido localmente.
  Nenhum dos dois é chip por task nem gera prefixo no título — o título é salvo exatamente como
  digitado. Não existe nenhuma tela ou modal de configurações do app, nem nenhuma flag de
  habilitar/desabilitar funcionalidade, nem componente de chip/pill/tag reutilizável.
  (confirmado no código)

[Ideia]
  Projetos dentro de um workflow, escolhidos por chip abaixo do input principal, que prefixam o
  título da task ao salvar, com o cadastro deles num modal próprio e a função inteira ligada ou
  desligada por um switch num modal de configurações do header.

[Fora de escopo]
  Vincular a task ao projeto: o prefixo é só texto no título, e a task não guarda vínculo nenhum.
  Filtrar ou agrupar a lista de tasks por projeto.
  Tirar o CRUD de workflow de onde ele está hoje.
  Estado ativo/inativo por projeto individual.
  Mexer no TaskGroup criado pela sintaxe ">", que continua como está.
  Selecionar mais de um projeto ao mesmo tempo.

[Specs]
  ### P1 — O dev/fundador

  AC-001  Espera ver, logo abaixo do input de adicionar task, uma fileira de chips com os
          projetos do workflow selecionado no momento, e um chip de ícone de configuração no
          fim da fileira.
  AC-002  Espera clicar num chip para selecioná-lo e clicar de novo no mesmo para desmarcá-lo,
          um projeto de cada vez, com o estado selecionado visível de relance.
          (agente) seleção única.
  AC-003  (rn) Espera que, com um projeto selecionado, a task salva nasça com o nome
          "[nome do projeto] título digitado"; sem nenhum selecionado, o nome sai exatamente
          como digitado, como hoje.
  AC-004  Espera que o projeto selecionado continue selecionado depois de salvar, para adicionar
          várias tasks seguidas do mesmo projeto sem reclicar. (agente)
  AC-005  Espera abrir, pelo chip de configuração da fileira, um modal dedicado aos projetos.
  AC-006  Espera cadastrar, renomear e excluir projetos do workflow corrente nesse modal.
  AC-007  Espera que o select de workflows do header ganhe uma última opção "Manage", que abre
          o modal de workflows que já existe, sem mudar o que ele faz.
  AC-008  (rn) Espera um switch "Projetos" no modal de configurações do header, ativo por
          padrão: desativado, nem os chips nem o chip de configuração aparecem abaixo do input,
          e o input volta a se comportar como hoje. (agente) o switch é global, um só para o app.
  AC-009  (rn) Espera que desativar a função, renomear ou excluir um projeto não mude o nome de
          nenhuma task já salva.
  AC-010  Espera alcançar o modal de configurações pela engrenagem que já existe no header,
          que passa a abrir esse modal em vez do de workflows, e que está lá com a função ativa
          ou desativada.

[Requisitos técnicos]
  ### Geral
  RT-001 (Geral) [MUST] Os projetos e o estado do switch são persistidos no mesmo mecanismo de
         armazenamento local que os workflows já usam, porque o app não tem backend nem schema e
         um segundo mecanismo criaria duas fontes de estado do usuário.
  RT-002 (Geral) [SHOULD] Não introduzir dependência nova de UI para as chips, o switch e os
         modais. Se o app não tiver um primitivo de modal reutilizável, seguir o desenho do modal
         de workflows que já existe, nesta ordem.
  RT-003 (Geral) [MUST] Nada do comportamento atual do input principal muda: a sintaxe ">"
         continua criando TaskGroup e o dropdown continua selecionando o workflow, porque essa é
         a via que o dev usa todo dia.

  ### P1 — O dev/fundador
  RT-004 (AC-001) [MUST] Com a função ativa, abaixo do input de adicionar task aparece uma
         fileira com um chip por projeto do workflow selecionado, mais um chip de ícone de
         configuração no fim da fileira.
  RT-005 (AC-001) [MUST] Trocar o workflow no header troca os chips exibidos pelos projetos
         daquele workflow; um workflow sem nenhum projeto mostra só o chip de configuração.
  RT-006 (AC-002) [MUST] Clicar num chip o marca como selecionado, com destaque visual
         distinguível do não selecionado; clicar no chip já selecionado o desmarca.
  RT-007 (AC-002) [MUST] Selecionar um chip com outro já selecionado transfere a seleção: no
         máximo um projeto fica selecionado por vez.
  RT-008 (AC-003) [MUST] Com o projeto "projeto exemplo 1" selecionado, digitar "task 1" e salvar
         cria a task com o título "[projeto exemplo 1] task 1".
  RT-009 (AC-003) [MUST] Sem nenhum chip selecionado, salvar cria a task com o título exatamente
         como digitado, sem colchete nenhum.
  RT-010 (AC-004) [MUST] Depois de salvar a task, o chip selecionado continua selecionado e o
         input fica vazio, pronto para a próxima task do mesmo projeto.
  RT-011 (AC-005) [MUST] Clicar no chip de configuração da fileira abre o modal de projetos.
  RT-012 (AC-006) [MUST] No modal de projetos dá para criar um projeto, renomear um existente e
         excluir um, e a fileira de chips reflete cada uma das três operações.
  RT-013 (AC-006) [MUST] O modal de projetos opera sobre os projetos do workflow selecionado no
         momento, e não sobre os dos outros workflows.
  RT-014 (AC-006) [SHOULD] Nome de projeto vazio ou só com espaços é recusado, e nome repetido
         dentro do mesmo workflow é recusado. Se o modal de workflows que já existe não recusa
         nome repetido, seguir o que ele faz, para não ficarem duas regras diferentes no mesmo
         app.
  RT-015 (AC-007) [MUST] O select de workflows do header tem, como última opção, uma entrada
         "Manage" que abre o modal de workflows que já existe, sem alterar o que ele faz nem as
         outras opções do select, e essa entrada passa a ser o único caminho para esse modal.
  RT-016 (AC-007) [MUST] Escolher "Manage" no select não muda o workflow selecionado.
  RT-017 (AC-010) [MUST] A engrenagem que já existe no header passa a abrir o modal de
         configurações, e não mais o modal de workflows; ela continua no header tanto com a
         função ativa quanto com ela desativada.
  RT-018 (AC-008) [MUST] O modal de configurações traz o switch "Projetos", ativo na primeira vez
         que o app abre.
  RT-019 (AC-008) [MUST] Com o switch desligado, nem os chips nem o chip de configuração
         aparecem abaixo do input, e o espaço deles não fica reservado em branco.
  RT-020 (AC-008) [MUST] O estado do switch sobrevive ao fechar e reabrir o app.
  RT-021 (AC-009) [MUST] Desligar o switch não altera o título de nenhuma task já salva: as que
         nasceram com o prefixo continuam com ele.
  RT-022 (AC-009) [MUST] Renomear ou excluir um projeto não altera o título de nenhuma task já
         salva. Se o projeto excluído estava selecionado, a seleção fica vazia e a próxima task
         salva sai sem prefixo.
