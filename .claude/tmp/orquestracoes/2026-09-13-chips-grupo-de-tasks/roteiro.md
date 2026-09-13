# Roteiro de comprovação — chips de projeto abaixo do input de adicionar task

ambiente: npm run dev — http://localhost:1420
estado: nenhum
url: http://localhost:1420 — a tela de Tasks, com o input principal de adicionar task

S01 (RT-004, RT-005) [final] o dev abre o app com o workflow "Work" selecionado e nenhum
    projeto cadastrado → abaixo do input aparece só o chip de ícone de configuração, sem
    nenhum chip de projeto
S02 (RT-011) [final] o dev clica no chip de ícone de configuração → o modal de projetos abre,
    com a lista vazia
S03 (RT-012, RT-013) [final] o dev digita "projeto exemplo 1" no campo do modal de projetos e
    confirma → "projeto exemplo 1" aparece na lista do modal
S04 (RT-012) [final] o dev cria um segundo projeto, "projeto exemplo 2", no mesmo modal → a
    lista do modal mostra "projeto exemplo 1" e "projeto exemplo 2"
S05 (RT-014) [final] o dev tenta cadastrar um projeto com nome só de espaços → o modal recusa
    e a lista continua com só os dois projetos de antes
S06 (RT-012) [final] o dev fecha o modal de projetos → a fileira abaixo do input mostra o chip
    "projeto exemplo 1", o chip "projeto exemplo 2" e o chip de configuração no fim
S07 (RT-006) [final] o dev clica no chip "projeto exemplo 1" → o chip fica com o destaque
    visual de selecionado, distinto dos outros
S08 (RT-003) [final] com "projeto exemplo 1" selecionado, o dev digita "> grupo teste" no input
    e salva → um grupo de tasks "grupo teste" é criado, sem nenhum colchete no título
S09 (RT-008) [final] com "projeto exemplo 1" ainda selecionado, o dev digita "task 1" e salva →
    a lista de tasks mostra a task com o título "[projeto exemplo 1] task 1"
S10 (RT-010) [final] logo depois de salvar a task acima → o chip "projeto exemplo 1" continua
    com o destaque de selecionado, e o input está vazio
S11 (RT-007) [final] o dev clica no chip "projeto exemplo 2", com "projeto exemplo 1" ainda
    selecionado → só o chip "projeto exemplo 2" fica com o destaque de selecionado
S12 (RT-006) [final] o dev clica de novo no chip "projeto exemplo 2", já selecionado → nenhum
    chip fica com o destaque de selecionado
S13 (RT-009) [final] sem nenhum chip selecionado, o dev digita "task sem projeto" e salva → a
    lista de tasks mostra o título "task sem projeto", sem colchete nenhum
S14 (RT-005) [final] o dev troca o workflow do header de "Work" para "Personal", que não tem
    projeto cadastrado → a fileira abaixo do input mostra só o chip de configuração
S15 (RT-015, RT-016) [final] o dev volta o workflow para "Work" e escolhe "Manage" no select de
    workflows do header → o modal de workflows já existente abre, e o select continua mostrando
    "Work" como valor selecionado
S16 (RT-017) [final] o dev fecha o modal de workflows e clica na engrenagem do header → o modal
    de configurações abre, mostrando o switch "Projetos"
S17 (RT-018) [final] nesta primeira abertura do modal de configurações → o switch "Projetos"
    aparece ativo (ligado)
S18 (RT-019) [final] o dev desliga o switch "Projetos" e fecha o modal → abaixo do input não
    aparece nem a fileira de chips nem espaço em branco no lugar dela
S19 (RT-021) [final] com o switch desligado, o dev olha a lista de tasks → a task
    "[projeto exemplo 1] task 1" salva antes continua com o mesmo título, com o prefixo
S20 (RT-020) [final] o dev recarrega a página do app → o modal de configurações mostra o switch
    "Projetos" ainda desligado
S21 (RT-004) [final] o dev religa o switch "Projetos" e fecha o modal → a fileira de chips volta
    a aparecer abaixo do input, com "projeto exemplo 1", "projeto exemplo 2" e o chip de
    configuração
S22 (RT-013) [final] o dev troca o workflow para "Personal", abre o modal de projetos e cria
    "projeto pessoal 1" → "projeto pessoal 1" aparece sozinho na lista do modal
S23 (RT-013) [final] o dev volta o workflow para "Work" e abre o modal de projetos → a lista
    mostra só "projeto exemplo 1" e "projeto exemplo 2", sem "projeto pessoal 1"
S24 (RT-022) [final] o dev renomeia "projeto exemplo 1" para "projeto exemplo 1 renomeado" no
    modal → a task salva antes continua na lista com o título antigo,
    "[projeto exemplo 1] task 1", sem mudar
S25 (RT-022) [final] o dev seleciona o chip "projeto exemplo 1 renomeado" e, no modal de
    projetos, exclui esse mesmo projeto → depois de fechar o modal, nenhum chip da fileira
    aparece selecionado
S26 (RT-022) [final] o dev digita "task depois de excluir" e salva → a lista de tasks mostra o
    título "task depois de excluir", sem colchete nenhum
S27 (RT-014) [final] o dev abre o modal de projetos e tenta cadastrar "projeto exemplo 2", que
    já existe na lista → o modal recusa e a lista continua com um projeto só

comando: nenhum
