---
name: task-especificar-e-planejar
description: >-
  Writes the spec of a task together with the developer, then the plan, in any
  repository — project commands, layout and conventions are discovered at
  runtime into a project card, never hardcoded. The spec stage turns the request
  into user expectations with ids (AC-00N) and technical requirements someone
  proves later (RT-00N), through a question grid that only asks what the
  developer would not answer without thinking. The plan stage dispatches
  reconnaissance (sonnet) and a planner (sonnet or opus by the difficulty
  verdict), and produces a plan where every step cites the RT it implements and
  every RT has a check in one of four proof lanes (curl, browser, teste,
  codigo). Before the plan is written, the reconnaissance proposes the proof
  script and the developer closes it proof by proof at a gate: each screenshot
  with the action and what must be visible, each automated-suite case with the
  file and the assertion, plus the command that brings the environment up.
  Level 0 never reads code. A prompt carrying more than one independent subject
  is cut at Stage 0 into one run folder per subject. A task judged complex gets
  validation milestones. A plan whose remainder could only be written against
  code that does not exist yet covers one wave and declares the next as pending.
  Two subjects with an approved spec can be planned in parallel, at most two
  runs in flight. The deliverable is the run folder under
  .claude/tmp/orquestracoes/ with an approved spec.md and plano.md, handed to
  the project's implementation skill. No line of code is written and no commit
  is made. Use when the user asks for task-especificar-e-planejar,
  /task-especificar-e-planejar, to write the spec of a task, or to plan a task
  before implementing it.
disable-model-invocation: true
---

# Especificar e planejar uma task

## Overview

A causa mais comum de entrega que não é o que o dev esperava está na **entrada**, não na
implementação. "Exportar o relatório em CSV" entra como está, ninguém aperta, e cada agente da
cadeia preenche o vazio com o que achou razoável. O resultado cumpre o pedido e decepciona.

Esta skill aperta a entrada antes de gastar qualquer plano. Ela tem duas etapas:

- **Spec** (Etapas 0 a 5) — traduz o pedido em `[Specs]`, que é o que o usuário espera, e
  `[Requisitos técnicos]`, que é o que alguém prova depois. Cada expectativa ganha um id, cada
  requisito aponta a expectativa que atende.
- **Plano** (Etapas 6 a 10) — consome a spec aprovada e produz os passos. Cada passo cita o `RT`
  que implementa, e cada `RT` ganha uma checagem que a implementação vai executar.

O corte com a metade autônoma continua o mesmo: aqui a atenção do dev rende, porque uma frase de
correção custa nada e salva a task. Depois do plano aprovado, interrupção só atrasa, e **a skill de
implementação do projeto** roda sem fazer pergunta nenhuma.

Esta skill **não sabe nada do repositório em que está rodando**: os comandos, o layout das unidades
e as convenções saem de um levantamento feito em runtime e escritos no **cartão do projeto**, que a
seção homônima descreve. Nenhum nome de app, de script ou de pacote está escrito aqui.

Ela também **só dispara por pedido explícito** (`disable-model-invocation: true`): coexiste com o
pipeline de spec e de plano que o repo já tiver, e deixar o roteador escolher entre os dois por
inferência é o modo de falha mais provável dessa coexistência.

Os quatro contratos desta skill estão em `formats/`, e cada um é lido antes da etapa que o usa:

- [`formats/spec.md`](formats/spec.md) — os sete blocos, o formato do `RT`, as marcas de
  prioridade e os seis critérios de fechamento. Leia antes da Etapa 0.
- [`formats/roteiro.md`](formats/roteiro.md) — a anatomia de cada prova, as linhas `ambiente` e
  `estado`, e o que o planejador pode ou não mudar no roteiro aprovado. Leia antes da Etapa 7.
- [`formats/plano.md`](formats/plano.md) — a regra de citação, as quatro lanes de prova, os marcos
  de validação, as ondas, o template do `plano.md` e os doze critérios de fechamento. Leia antes da
  Etapa 8.
- [`formats/log-planejamento.md`](formats/log-planejamento.md) — o ledger da etapa de plano. Leia
  antes da Etapa 6.

### O que o nível 0 faz

Na etapa de spec:

1. Escreve o **rascunho** da ideia a partir do prompt do dev, e **corta** o prompt em assuntos
   quando ele traz mais de um.
2. Dispara o subagente que confirma o **estado atual** no código e levanta o **cartão do projeto**,
   e escreve o `projeto.md` com o cartão que voltou.
3. **Grelha** o dev, com as regras da seção abaixo.
4. Escreve `spec.md` e para nos gates.

Na etapa de plano:

5. Dispara o **reconhecimento** e o **planejador**, um por etapa, e anota o veredito de cada um no
   ledger.
6. Filtra as **dúvidas técnicas** que o reconhecimento levantou e leva ao dev só as que sobram, no
   mesmo gate em que fecha com ele o **roteiro de comprovação**, e escreve o `roteiro.md`.
7. Repassa o **resumo do plano** que o planejador escreveu, e espera resposta.
8. Entrega o caminho da pasta da run e a linha que inicia a implementação.

### O que o nível 0 nunca faz

- Ler arquivo de código. Quem lê são os filhos.
- Ler `reconhecimento.md` ou `plano.md`. O que ele precisa saber chega no retorno do filho.
- Editar arquivo do projeto, rodar o **comando de verificação** do projeto, build, teste ou comando
  `git`.
- Chamar `Grep`, `Glob` ou `Explore` direto para "dar uma olhada rápida".

Ele escreve `spec.md`, o `projeto.md` com o cartão do projeto que a Etapa 1 devolveu, o `roteiro.md`
aprovado no gate da Etapa 7 e o ledger, mais o `corte.md` quando houve corte e o `ondas.md` quando o
plano declarou onda pendente, e nunca relê nenhum deles. Os seis são ponteiros e contratos, não
trabalho. **Ler o `spec.md` tem uma exceção só**: quando o dev inicia a skill direto na etapa de plano, apontando uma pasta de
run que já existe, a spec não está no contexto dele e ele a lê uma vez. É um arquivo de sessenta
linhas e é o contrato da task inteira.

Nenhum arquivo do projeto é editado aqui, então não há nada para comitar. A pasta da run vive em
`.claude/tmp/`, que já está no `.gitignore`.

---

## A grelha

Grelhar é o que transforma "bom, funcional e agradável" em `RT` checável. Feito errado vira
questionário chato de vinte minutos, e o dev passa a responder no automático, que é pior que não
ter perguntado. Seis regras mantêm a grelha curta e afiada.

**1. Rascunhe primeiro, depois ataque o próprio rascunho.** Escreva a `[Ideia]` e as `AC` que você
deduziu do prompt, e só então procure o buraco. Sem rascunho na mesa as perguntas saem genéricas
("quem é o usuário?", "qual o objetivo?") e o dev responde para o seu benefício. Com o rascunho,
a pergunta fica específica: *"você disse exportar com filtro de período. Se o período escolhido não
tem nenhuma linha, o arquivo sai só com o cabeçalho ou a exportação é recusada?"*.

**2. Pergunte só quando as duas melhores opções são as duas defensáveis.** Se a opção que você
recomendaria é a que o dev escolheria sem pensar, isso não é pergunta, é premissa: escreva direto
na spec, marcada com `(agente)`, e o dev a vê no gate. É essa regra que mata a pergunta óbvia na
origem, e é ela que mantém a grelha curta.

**3. Toda pergunta vem com as respostas candidatas**, via `AskUserQuestion`, com a recomendada na
frente e `(recomendado)` no label. Pergunta aberta cobra um parágrafo do dev; pergunta com opções
cobra um clique, e de quebra mostra o que você teria assumido sozinho.

**4. Teto de cinco perguntas na etapa inteira.** Agrupe as independentes numa chamada só, até
quatro. Deixe em sequência apenas as que mudam a pergunta seguinte.

**5. Pare quando a próxima pergunta não mudaria nenhuma `AC` nem nenhum `RT`.** Esse é o critério,
o teto de cinco é só o freio. Detalhe que não move a spec não é assunto da grelha.

**6. Discorde quando for o caso, e nunca decida por cima.** Apontar que duas `AC` brigam entre si,
ou propor uma solução melhor para o problema que o dev descreveu, é metade do valor da grelha. A
palavra final é sempre do dev: você apresenta a contradição ou a proposta e ele escolhe.

**Quando o dev responde "não sei, decide você"**, decida com o que a spec já tem: a persona, a
familiaridade dela com o sistema e o estado atual. Marque a linha com `(agente)` e siga. A marca é
o que deixa o dev bater o olho, no gate, em tudo que decidiram por ele.

**Todo "não, isso não" do dev vira uma linha em `[Fora de escopo]`.**

---

## O corte: um assunto, uma task

Um prompt pode trazer mais de um assunto. "Arruma o retry do webhook de pagamento e põe um limite
de tamanho no upload de mídia" são duas tasks que chegaram na mesma frase, e tratá-las como uma
estraga as duas.

Três coisas quebram quando assuntos independentes dividem uma spec:

- **A grelha.** O teto é de cinco perguntas na etapa inteira. Dois assuntos disputando cinco
  perguntas produzem grelha rasa nos dois, que é justamente o modo de falha que a grelha existe
  para evitar.
- **A cobertura.** `10/10 RT` não diz nada quando os `RT` de um assunto passaram e os do outro
  não. Você não entrega meio plano, e a linha de cobertura deixa de dizer qual metade está pronta.
- **O estado atual.** A Etapa 1 recebe *um* recorte e *uma* unidade do projeto. Dois assuntos em
  fluxos diferentes produzem um `Explore` que responde mal sobre os dois, e a grelha sai de um
  estado errado.

**O critério de corte é seco: dois assuntos são tasks separadas quando nenhuma `AC` é
compartilhada e nenhum `RT` de um precisa do código do outro existir.** Se o assunto B consome um
módulo que o assunto A cria, é uma task só, com checkpoints — e isso o método já resolve sem corte
nenhum. Lido ao contrário, o critério mata o corte de fachada: "criar o endpoint e testá-lo" não são
dois assuntos, é um assunto e a prova dele.

Cortar produz **uma pasta de run por assunto**, cada uma com `spec.md`, `plano.md` e numeração de
`AC`/`RT` própria começando em `001`. O dev escolhe a ordem no gate da Etapa 0.5, e a skill roda a
grelha e o plano de **um assunto por vez**: a atenção do dev é o recurso escasso desta metade, e
dividi-la entre três specs abertas é a maneira mais rápida de gastá-la mal.

Cada pasta recebe um `corte.md` de poucas linhas, listando todos os assuntos e marcando qual deles
é o dela. Ele é redundante de propósito — uma pasta de run tem que bastar para reconstruir o
contexto, e o dev pode voltar ao assunto 3 numa sessão que nunca viu o 1.

```md
# Corte — {o prompt original em uma frase}

Este assunto: {i} de {N} — {slug}

| # | Assunto | Pasta |
|---|---|---|
| 1 | {uma linha} | {caminho} |
| N | {uma linha} | {caminho} |

Ordem escolhida pelo dev: {1, 3, 2 — ou "não definida"}
```

---

## Ondas: um assunto, mais de um plano

O corte parte o **prompt**. A onda parte o **plano**. São coisas diferentes, com critérios
diferentes, e confundir as duas é a maneira mais fácil de fatiar uma task que era uma só.

Assunto que depende de outro é checkpoint, e o método já resolve isso. Existe um caso em que nem o
checkpoint resolve: quando os passos da segunda metade dependem do formato de um código que a
primeira metade ainda vai criar. Aí o planejador não tem contra o que planejar, e o que ele
escrever é chute que a implementação descobre no meio.

Nesse caso o plano cobre uma **onda** e declara a próxima como pendente. O critério e o formato
estão em [`formats/plano.md`](formats/plano.md), e quem declara é o planejador, na Etapa 8, porque
é ele quem leu o código. O nível 0 não decide onda, pela mesma razão de não decidir dificuldade.

O que o nível 0 faz com isso:

- Escreve o `ondas.md` da pasta da run, quando o planejador declarou onda pendente.
- Entrega a onda corrente na Etapa 10, dizendo quais `RT` ficaram para a próxima.
- Quando o dev volta com a pasta, depois de a onda estar implementada, começa na **Etapa 6**: um
  reconhecimento novo, contra o código que a onda anterior deixou pronto. Esse relançamento é o
  que a onda compra.

**Uma onda por vez, sempre.** A onda 2 só é planejada depois de a onda 1 estar implementada e
validada, porque planejá-la antes é a adivinhação que a onda existe para evitar. Isso vale mesmo
quando duas runs de assuntos diferentes rodam em paralelo: o paralelismo é entre assuntos, nunca
entre ondas do mesmo assunto.

O `ondas.md` cabe em poucas linhas:

```md
# Ondas — {a task em uma frase}

| # | Onda | RT | Plano | Estado |
|---|---|---|---|---|
| 1 | {título} | RT-001, RT-002 | plano.md | implementada |
| 2 | {título} | RT-003, RT-005 | plano-o2.md | planejada |
| 3 | {sem título ainda} | RT-004 | — | pendente |
```

São três estados e nenhum outro: **`pendente`** é onda sem plano, **`planejada`** é onda com plano
esperando implementação, e **`implementada`** é onda que passou na validação. Quem escreve
`planejada` é a Etapa 8 daqui; quem escreve `implementada` é a Etapa 7 da skill de implementação, e
é a única linha que ela edita fora do ledger dela.

**Os arquivos da onda `k > 1` levam o sufixo `-o{k}`**: `reconhecimento-o2.md`, `plano-o2.md`, e do
lado da implementação `log-implementacao-o2.md`, `implementacao-o2.md`, `review-o2-{n}.md`. A onda
1 usa os nomes de sempre e o `spec.md` é um só para todas as ondas. Sem sufixo, a onda 2
sobrescreve a prova da onda 1.

---

## A pasta da run

```text
.claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug-da-task}/
├── corte.md               ← Etapa 0.5, só quando o prompt tinha mais de um assunto
├── ondas.md               ← Etapa 8, só quando o plano declarou onda pendente
├── projeto.md             ← Etapa 1, o cartão do projeto; um por pasta, sem sufixo de onda
├── spec.md                ← Etapa 4, um só para todas as ondas
├── log-planejamento.md    ← o ledger da etapa de plano; só o nível 0 escreve
├── reconhecimento.md      ← Etapa 6
├── roteiro.md             ← Etapa 7, o roteiro de comprovação aprovado pelo dev
└── plano.md               ← Etapa 8
```

Numa run com ondas, os arquivos da onda `k > 1` repetem essa lista com o sufixo `-o{k}`:
`reconhecimento-o2.md`, `roteiro-o2.md`, `plano-o2.md`, `log-planejamento-o2.md`. **O `projeto.md`
não leva sufixo** e é um só para todas as ondas: ele descreve o repositório, não a onda.

A skill de implementação abre essa mesma pasta e acrescenta os arquivos dela
(`log-implementacao.md`, `implementacao.md`, `review-{n}.md`, `teste-{n}.md`, `contexto.md`).

Crie em uma chamada, no começo — uma pasta por assunto, quando houve corte:

```bash
mkdir -p ".claude/tmp/orquestracoes/$(date +%Y-%m-%d)-{slug}"
```

O `{slug}` é kebab-case e curto, tirado da task: `export-csv-relatorio`, `paginacao-listagem`. É
o nome que a etapa de plano recebe depois, então escolha um que ainda faça sentido daqui a uma
hora.

**A spec morre com a task.** O que precisa sobreviver tem saída própria: regra de negócio vira
**registro durável** na doc de contexto do projeto, e é para isso que serve a marca `(rn)` na `AC`.
Pegadinha de ambiente vira registro durável na memória do projeto. Os dois destinos vêm dos campos
`docs de contexto` e `memória do projeto` do cartão; o repo que não tem nenhum dos dois recebe a
regra de negócio como uma linha da entrega da Etapa 10, e o dev decide onde ela mora.

### Disco é o canal de entrega, e você passa caminhos

**Todo filho escreve o arquivo da etapa antes de retornar**, e o retorno dele é um ponteiro:
caminho do arquivo, veredito, no máximo 12 linhas. Retorno de filho já chegou no agente errado em
execução real, e quando isso acontece a pasta da run tem que bastar para reconstruir tudo.

Quatro blocos furam o teto de linhas. Três deles porque chegam ao dev sem passar por edição: o
reconhecimento devolve `## Dúvidas` e `## Roteiro de comprovação`, e o planejador devolve
`## Resumo do plano`. O quarto é o `## Cartão do projeto`, que a Etapa 1 devolve, e ele fura por
outro motivo: é o nível 0 que escreve o `projeto.md` a partir dele, porque `Explore` não tem
`Write`.

**Nunca cole conteúdo de arquivo no prompt de um disparo**, nem o corpo do prompt de `prompts/`,
nem a spec, nem o reconhecimento. Passe o caminho; o filho abre. Um `@caminho` dentro do parâmetro
`prompt` da tool `Agent` não é expandido, porque a expansão de `@` acontece na entrada do usuário
no CLI, não em parâmetro de tool. Se fosse expandido seria pior: o arquivo inteiro entraria no
**seu** contexto ao montar a chamada, que é o custo que esta skill existe para evitar.

---

## Modelos por papel

| Papel | Modelo |
|---|---|
| Estado atual (E1) | `sonnet` |
| Reconhecimento (E6) | `sonnet` |
| Plano (E8) — veredito `simples` | `sonnet` |
| Plano (E8) — veredito `complexa` | `opus` |

Duas regras não-negociáveis:

1. **Todo disparo leva `model` explícito.** Disparo sem `model` herda o modelo do pai, que aqui é
   Opus. Um reconhecimento rodando em Opus por esquecimento custa várias vezes o orçamento da
   etapa e não entrega nada a mais.

2. **Quem decide a dificuldade é o reconhecimento, não você.** O nível 0 não leu o código, então
   não tem base para chamar a task de complexa. O veredito vem da Etapa 6, por escrito, e é ele
   que escolhe o modelo da Etapa 8.

**Por que reconhecimento e plano são dois agentes.** Para escolher o modelo pela dificuldade, a
dificuldade precisa ser conhecida antes do disparo. Um agente único teria que ser Opus por
precaução em toda task, inclusive nas triviais. Dividindo, o mapeamento sai barato em Sonnet e só o
raciocínio de plano, quando é mesmo difícil, paga Opus.

---

## Dois tetos por filho: ~150k de janela e 60 turns

Cada subagente mede a **própria** ocupação e para antes de virar problema. O primeiro teto que
estourar manda. Eles medem riscos diferentes:

- **O teto de janela é segurança.** Previne o filho morrer no meio do trabalho. Dispara em quem tem
  `taxa` alta, como um reconhecimento que abre arquivo grande e enche 150k em 20 turns.
- **O teto de turns é custo.** O gasto de um filho é a integral do contexto ao longo dos turns, e
  como a janela cresce quase linear, o custo cresce com o **quadrado** dos turns. Um filho de 226
  turns medido numa run real consumiu 37,3M de tokens, 49% da run inteira, e 82% disso era
  releitura de contexto. Partido em 4 sucessores de ~56 turns, o mesmo trabalho custaria 12,7M.

O teto de janela não cobre o caso do outro: um filho em laço de baixo rendimento (`taxa` ~300)
precisa de **430 turns** para tocar 150k, o que dá ~28M de tokens sem a janela piscar uma vez.

O script está em `scripts/medir-janela.sh` e lê o transcript ao vivo do agente. Todo prompt de
filho carrega o bloco de medição — os três arquivos em `prompts/` já o trazem inline, não remova.

- **`status=ok`** — siga trabalhando, e meça de novo no turn indicado por `proxima`.
- **`status=handoff`** — pare de abrir frente nova, feche o que está na mão, escreva o estado no
  arquivo da etapa e retorne. O gatilho de janela dispara pela **projeção**, não pelo estouro:
  medir só o valor instantâneo já deixou agente passar de 250k sem nunca pedir socorro.
- **`status=preso`** — 60 turns ou mais com `taxa` abaixo de 400, que é assinatura de laço. O filho
  para e reporta, sem fingir conclusão.

`preso` não é sinônimo de `handoff`, e é por isso que são dois status. Um sucessor que herda o
estado de um laço repete o laço, e o custo é pago duas vezes. O discriminador é a `taxa`, não a
janela: nos 15 filhos medidos, a `taxa` de quem produzia ficou entre 684 e 7.779 tokens por turn, e
laço de baixo rendimento gira em 200–300.

**Quando você recebe `handoff`**, dispare um filho **fresco** da mesma etapa, passando o caminho do
arquivo que o anterior deixou em disco. Não tente continuar o agente estourado por `SendMessage`:
a janela dele é o problema.

**Quando o retorno vem com `preso`**, não relance por reflexo. Leia o motivo no retorno, não o
arquivo, e decida:

- **Progresso real, só longo** — dispare o sucessor fresco como num `handoff`.
- **Laço de verdade** (busca que não acha, seção que não fecha) — a etapa está bloqueada, e aqui
  você tem uma saída que a implementação não tem: **leve ao dev**. Um reconhecimento que não achou
  o código quase sempre morre por falta de uma informação que o dev dá em uma linha.

Se o `--self` errar o alvo (o `desc=` impresso não é o filho), meça com o `description` do spawn
como nonce. Por isso **o `description` de todo disparo deve ser único e estável**: ele é o endereço
da medição.

---

## Disparo: síncrono, sem sondagem, sem agente de espera

Todo disparo usa `run_in_background: false`. Isso **não** trava a chamada: a tool `Agent` retorna na
hora com um id e o filho roda em background. O padrão correto é **encerrar o turn**, porque a
notificação de conclusão chega sozinha.

Daí saem três proibições:

1. **Não sonde.** Nada de `TaskOutput` ou `Monitor` em loop esperando o filho.
2. **Não durma.** Nada de `sleep`, `true`, `echo .`, `date` ou um `ls` repetido "para passar o
   tempo". Cada um é um turn pago que não produz nada.
3. **Não crie agente de espera.** Nenhum fork, placeholder ou subagente cujo propósito seja
   aguardar outro. Um fork herda o contexto inteiro do pai e roda no modelo do pai, que é a forma
   mais cara possível de não fazer nada.

**Profundidade máxima é 3** (nível 0 → etapa → nada). Nenhum agente de trabalho sub-delega.

---

## O cartão do projeto

Esta skill não sabe nada do repositório onde está rodando: nem o nome das unidades, nem o comando
que roda a suíte, nem o que sobe o ambiente. Ela **descobre** isso uma vez por run e grava num
arquivo só, `{pasta-da-run}/projeto.md` — o **cartão do projeto**. Todas as etapas seguintes leem
esse arquivo em vez de saber o nome de um app, de um script ou de um pacote.

Ele é um **reconhecimento barato, não uma auditoria**: um punhado de `ls` e de leitura de manifesto,
teto de ~10 chamadas de tool, e nenhum arquivo de código-fonte aberto por causa dele. Campo que não
fecha em duas tentativas vira `desconhecido` e a run segue.

**O cartão não é uma etapa nova.** Ele pega carona na etapa que já ia abrir o repo:

- **Entrada pela metade de spec, que é o caso comum** — a **Etapa 1** faz a descoberta junto do
  estado atual. Ela **não escreve** o arquivo: devolve o bloco `## Cartão do projeto` literal no
  retorno, e **o nível 0 escreve o `projeto.md`**.
- **Entrada direta na metade de plano** — quando o `ls` da pasta apontada não acha `projeto.md`, a
  **Etapa 6** faz a descoberta como item 0 do trabalho dela e escreve o arquivo ela mesma, porque
  ela tem `Write`. Quando acha, ela lê e não redescobre.
- **Numa onda `k > 1`** — o cartão não é refeito e **não leva sufixo**. A Etapa 6 da onda `k` só
  atualiza um campo do `projeto.md` existente se a onda anterior mudou um fato do projeto (um script
  novo, uma unidade nova, um mecanismo de fixtures que passou a existir), e diz isso em uma linha do
  retorno.
- **Num corte** — um cartão por pasta de run. O texto sai quase igual entre elas e isso é aceitável,
  pelo mesmo argumento do `corte.md`: uma pasta de run tem que bastar sozinha.

**O que ele lê**, nesta ordem, parando em cada passo que já responde o campo: a **doc de contexto da
raiz** (`CLAUDE.md`, senão `AGENTS.md`, senão `README.md`; os dois primeiros quando existirem os
dois), que é de longe a fonte mais densa; o **manifesto da raiz**, só o bloco de scripts/tasks e o
de workspaces, que é de onde sai o **nome real** de cada comando — quando a doc e o manifesto
divergem, manda o manifesto; o **layout das unidades**, com um `ls` nos diretórios que o manifesto
declara como workspace; a **doc de contexto da unidade afetada**, e só dela; `ls .claude/skills/` e,
se existir, `ls .claude/agents/`; e um `ls` de convenção de teste e um de fixtures. A ordem por
extenso está em [`prompts/estado-atual.md`](prompts/estado-atual.md), e é ela que a Etapa 6 segue
quando é ela que levanta o cartão.

**O que ele grava.** Este template é o contrato:

```md
# Cartão do projeto — {repo}

docs de contexto: {caminho da doc da raiz} · {caminho da doc da unidade afetada, ou "nenhuma"}
unidades do projeto: {nome — uma linha do que é, por unidade; "raiz" quando não é monorepo}
unidade afetada: {a unidade que esta task encosta; "mais de uma" e a lista, quando cruza}
comando de teste: {o comando que roda a suíte automatizada; e a forma de rodar um arquivo só, se
houver. "nenhum" quando o projeto não tem suíte}
comando de verificação: {o comando que é o gate de correção estática — typecheck, lint, build —
na ordem em que se roda. "nenhum" quando não há}
comando de ambiente: {o comando que sobe o ambiente onde uma prova de tela roda, e o endereço em
que ele sobe. "nenhum" quando nada abre navegador}
pré-requisito de ambiente: {serviço que precisa estar de pé para a suíte ou o ambiente rodar —
banco, fila, storage — e o comando que o sobe. "nenhum" quando não há}
mecanismo de fixtures: {o contrato de fabricação de estado de teste que o projeto tem — o comando,
o arquivo que o descreve, e onde ele mora. "nenhum" quando o projeto não tem}
convenção de teste: {onde as suítes vivem e como se chamam. "n/a" quando não há suíte}
skills de contexto: {as skills de .claude/skills/ que se aplicam a esta unidade, e a skill de
implementação do projeto, se houver. "nenhuma" quando não há}
memória do projeto: {os índices de memória que existem, um por linha. "nenhuma" quando não há}
fluxo de dados persistentes: {como o projeto muda schema/modelo persistente — o arquivo do schema
e o comando de migração. "nenhum" quando não há esse conceito}
convenções que o plano tem que respeitar: {no máximo três linhas, tiradas da doc de contexto —
as que um plano violaria sem saber}
```

**Como ele degrada.** Nenhum destes casos é erro, e nenhum para a run. Cada um é um valor de campo:

| O repo não tem | O cartão diz | Consequência declarada |
|---|---|---|
| doc de contexto | `docs de contexto: nenhuma` | o manifesto e o layout viram a única fonte; a Etapa 6 confia mais no `## Padrão da vizinhança` |
| monorepo | `unidades do projeto: raiz` | a unidade afetada é sempre `raiz`; o critério de dificuldade perde a metade "cruza unidades" e fica com as outras |
| suíte de teste | `comando de teste: nenhum` | a lane `teste` fica indisponível: o `RT` que pediria suíte cai em `curl` ou `codigo`, e o reconhecimento diz isso na linha da lane. `T0n` não existe no roteiro |
| linter/typecheck | `comando de verificação: nenhum` | a fronteira de checkpoint passa a ser "o lote é julgável sozinho e nada que ele deixou está pela metade" |
| ambiente que sobe (lib, CLI) | `comando de ambiente: nenhum` | a lane `browser` fica indisponível e o roteiro sai só com `T0n`, ou `n/a` nas duas |
| mecanismo de fixtures | `mecanismo de fixtures: nenhum` | o veredito de fixtures é `sem mecanismo`, a linha `estado` do roteiro diz `nenhum`, e a prova monta o estado no próprio passo |
| memória | `memória do projeto: nenhuma` | o item 3 do reconhecimento é dispensado sem comentário |
| fluxo de migração | `fluxo de dados persistentes: nenhum` | o passo 11 do planejador é dispensado com uma linha |

**O nível 0 nunca lê o `projeto.md`.** O que ele precisa — o comando de ambiente para a Etapa 10, o
veredito de fixtures para o ledger — chega no retorno dos filhos, como todo o resto.

---

## Fixtures: o estado de partida das provas

Uma prova precisa de um sistema em algum estado: a conta que já existe, o registro que já está numa
fase, o arquivo que já foi importado. Quem fabrica esse estado é o **mecanismo de fixtures** do
projeto — um comando de seed, um pacote de factories, um script de cenário —, e o campo
`mecanismo de fixtures` do cartão do projeto diz qual é o daqui e onde está o contrato dele.

Daí sai uma pergunta que todo plano responde, com uma de quatro respostas: **`sincronizar`** quando
a task muda algo que o mecanismo fabrica, **`estender`** quando o cenário da prova não sai de nenhuma
combinação do que ele já oferece, **`sem mudança`** quando o que existe alcança o cenário, e
**`sem mecanismo`** quando o projeto não tem nenhum — e aí o estado de partida é montado no próprio
passo do plano, e a linha `estado` do roteiro diz `nenhum`.

Quem responde é o reconhecimento, lendo o contrato que o cartão apontou. O planejador executa a
resposta. Você não abre nenhum dos dois arquivos: o veredito chega no retorno do filho e vai para o
ledger.

Tocar o mecanismo de fixtures não torna a task `complexa` por si só.

---

## Workflow — etapa de spec (E0 a E5)

### Etapa 0 — rascunho da ideia e corte (nível 0)

Sem ler código e sem perguntar nada ainda. Do prompt do dev, escreva:

- **`[Personas]`** e a familiaridade de cada uma com o sistema.
- **`[Ideia]`**, em uma frase.
- **A hipótese do estado atual**, se o dev deu uma.
- **Qual unidade do projeto** a task encosta. Se o prompt não disser, deixe em aberto: a Etapa 1
  descobre as unidades do projeto e diz qual é — isso não é pergunta de grelha.

Então aplique o critério de corte. O teste é a `[Ideia]`: se ela não cabe em uma frase sem virar
lista de coisas sem relação entre si, o prompt tem mais de um assunto. Rascunhe uma linha para cada
um e vá para a Etapa 0.5.

**Um assunto é o caso comum.** Aí não há corte, não há `corte.md` e não há Etapa 0.5: crie a pasta
da run e siga para a Etapa 1.

### Etapa 0.5 — gate do corte (nível 0, condicional)

Só existe quando a Etapa 0 achou mais de um assunto. Leve ao dev, e encerre o turn:

- **Os assuntos**, um por linha, como você os cortou.
- **Por que estão separados**: a frase que diz que nenhum compartilha `AC` e nenhum depende do
  código do outro existir.
- **A pergunta**, via `AskUserQuestion`: qual assunto especificar primeiro. As opções são os
  assuntos, mais a opção de tratar tudo como uma task só.

Quando o dev responde:

- **Confirmou o corte** — crie uma pasta por assunto, escreva o `corte.md` em cada uma, e rode a
  Etapa 1 em diante **só para o assunto escolhido**. Não dispare a Etapa 1 dos outros: um
  `Explore` por assunto que o dev talvez nunca implemente é orçamento gasto adiantado.
- **Recusou o corte** — é uma task só. Descarte o corte, crie uma pasta e siga para a Etapa 1 com
  a `[Ideia]` unificada. O dev conhece dependência que o prompt não disse, e aqui ele tem a palavra
  final como em toda pergunta da grelha.
- **Corrigiu o corte** (juntou dois, partiu um em dois) — refaça a lista e volte a este gate.

Este gate não conta contra o teto de cinco perguntas. Ele é anterior à grelha, e o que ele pergunta
não é sobre o produto: é sobre quantas tasks existem.

### Etapa 1 — estado atual e cartão do projeto (Explore, sonnet)

```text
subagent_type: 'Explore'
model: 'sonnet'
description: 'estado-{slug}'
```

Passe o **caminho** de `prompts/estado-atual.md` mais um delta curto: a task como o dev a
descreveu, a hipótese dele sobre o estado atual e a unidade do projeto, quando ele soube dizer qual
é. Nunca cole conteúdo de arquivo no prompt do disparo. **Num corte, "a task" é o assunto
corrente**, não o prompt inteiro: mandar os três assuntos no delta devolve o recorte ambíguo que o
corte acabou de resolver.

Esta etapa entrega **duas coisas**: o estado atual do recorte e o **cartão do projeto**. As duas
saem do mesmo disparo porque ele já vai abrir o repo, e este é o disparo mais barato da skill — é a
única vez que alguém paga pela descoberta nesta run.

`Explore` é o agente certo aqui porque a etapa é só leitura: o retorno é a entrega, não há arquivo
para escrever, e um agente sem `Write` não tem como editar o projeto por acidente.

Ele volta com o estado atual, o que já funciona, o que não existe, o veredito sobre a hipótese do
dev — `confirma` ou `contradiz` — e o bloco `## Cartão do projeto` literal. **Escreva
`{pasta-da-run}/projeto.md` com esse bloco**, sem editar nada dele e sem sufixo de onda; é o único
arquivo que o nível 0 escreve e nunca lê.

Esta etapa roda **antes da grelha**. Pergunta feita em cima de estado errado é pior que pergunta
nenhuma.

### Etapa 2 — gate da ideia (nível 0)

Repasse ao dev, e encerre o turn:

- O **estado atual** como o subagente o escreveu, literalmente. Se ele contradiz a hipótese do
  dev, diga isso na primeira linha: é a informação mais importante do gate.
- A **`[Ideia]`** do seu rascunho.

Quando o dev responde:

- **Aprovou** — vá para a Etapa 3.
- **Corrigiu a ideia** — reescreva o rascunho e siga.
- **A correção muda o recorte** (outra unidade do projeto, outro fluxo) — redispare a Etapa 1 e
  volte aqui.
- **Abortou** — pare.

### Etapa 3 — specs, com a grelha (nível 0)

Escreva as `AC` que você deduziu, agrupadas por persona. Então grelhe, seguindo as seis regras.

Fecha quando cada expectativa do dev tem uma `AC`, e a próxima pergunta não mudaria nenhuma delas.

Repasse ao dev a lista de `AC` e o `[Fora de escopo]` que a grelha produziu, e encerre o turn.
Correção aqui é barata: o dev risca, junta ou reescreve `AC`, e ids cortados não renumeram.

### Etapa 4 — requisitos técnicos (nível 0)

Traduza cada `AC` em `RT`, mais os `RT (Geral)` que a task pedir. Aplique os seis critérios de
fechamento de [`formats/spec.md`](formats/spec.md), um por um. O critério 3 é o que dá trabalho:
antes de escrever cada linha, diga para você mesmo em qual das quatro lanes ela se prova (`curl`,
`browser`, `teste` ou `codigo`). `RT` sem lane é `AC` que ainda não foi traduzida.

Os números que faltarem (o timeout, o limite de linhas) são decisão de produto: ou saem da grelha,
ou você os escolhe pela persona e marca com `(agente)`.

Escreva o `spec.md` completo. Repasse ao dev a lista de `RT` e as linhas marcadas com `(agente)`,
mais o caminho do `spec.md` em link markdown, e encerre o turn.

### Colapso dos gates em task pequena

Três paradas para "corrige o rótulo errado na coluna de data" é atrito puro. Quando **a ideia cabe em uma
frase e nenhuma `AC` precisa de número**, escreva os sete blocos de uma vez e peça **uma**
aprovação só. Os blocos são sempre os mesmos; o que colapsa são os gates.

O teste é seco de propósito. Achar que a task é simples não é critério.

### Etapa 5 — spec fechada, e a passagem (nível 0)

Diga ao dev, em poucas linhas:

- **Contagem**: quantas `AC`, quantos `RT`, quantos `[SHOULD]`.
- **Decisões do agente**: as linhas `(agente)` que ele não contestou.
- **Regras de negócio**: as `AC` marcadas com `(rn)`, que a implementação vai registrar.
- **Caminho do `spec.md`**, em link markdown.

**Não pare aqui.** O dev acabou de aprovar no gate da Etapa 4, e parar de novo uma linha depois é
gate sem pergunta. Dispare a Etapa 6 no mesmo turn, junto desse resumo. Se ele quiser interromper,
ele interrompe.

A exceção é o dev ter abortado no gate da Etapa 4. Aí a resposta é `abortado`, com o motivo, e a
skill termina.

---

## Workflow — etapa de plano (E6 a E10)

A etapa de plano roda de duas maneiras. **Emendada na spec**, quando o dev aprovou na Etapa 4 e a
spec inteira está no contexto do nível 0. **Sozinha**, quando o dev inicia a skill apontando uma
pasta de run que já existe:

```text
/task-especificar-e-planejar .claude/tmp/orquestracoes/2026-05-14-export-csv-relatorio/
```

**Uma pasta apontada pode estar em três estados, e quem decide são os arquivos que ela tem:**

- **Tem só `corte.md`** — é um assunto de um corte que o dev ainda não especificou. Leia o
  `corte.md`, comece na **Etapa 0** usando a linha daquele assunto como prompt, e não refaça o
  corte: ele já passou pelo gate da Etapa 0.5.
- **Tem `spec.md` e `ondas.md`** — é uma task em ondas. Leia o `ondas.md`, ache a primeira onda que
  não está `implementada` e comece na **Etapa 6** para ela. Se essa onda já está `planejada`, pare
  e diga ao dev: o plano dela existe e o caminho é a **skill de implementação do projeto**, não
  planejar de novo.
- **Tem `spec.md`** — a spec está fechada e é onda única. Comece na Etapa 6.

O `ls` que resolve os três está na primeira chamada, e ele é a única leitura de disco que você faz
antes do primeiro disparo:

```bash
ls {pasta-da-run}/
```

Esse mesmo `ls` responde uma quarta pergunta: **tem `projeto.md`?** Se tem, o cartão do projeto já
existe e a Etapa 6 só o lê. Se não tem — pasta criada por uma versão anterior, ou entrada direta
numa pasta que nunca rodou a Etapa 1 —, diga isso no delta da Etapa 6: ela levanta o cartão e
escreve o arquivo ela mesma, como item 0 do trabalho dela.

No modo sozinha, o nível 0 lê o `spec.md` uma vez, mais o `corte.md` ou o `ondas.md` quando a pasta
os tiver. São os três arquivos de ponteiro da run, e ele lê esses três porque sem a spec no contexto
não tem como filtrar dúvida técnica nem julgar o resumo do plano, e sem o `ondas.md` não sabe em qual
onda a task parou. Nenhum outro arquivo da pasta ele abre em toda a skill, o `projeto.md` inclusive,
que é dos filhos. O `reconhecimento.md` e o `plano.md` continuam
fechados para ele nos dois modos.

### Duas runs de assuntos diferentes, em paralelo

A metade da spec roda um assunto por vez, e isso não muda: o gargalo dela é a atenção do dev, e
grelha dividida entre duas specs abertas sai rasa nas duas.

A metade do plano é outra história. E6 e E8 são dois subagentes em sequência com o dev fora do
caminho, então **dois assuntos que já têm `spec.md` aprovado podem ser planejados ao mesmo tempo**:

```text
/task-especificar-e-planejar {pasta-A}/ {pasta-B}/
```

Quatro regras seguram isso de pé:

1. **Só entra pasta com `spec.md`.** Pasta que só tem `corte.md` precisa de grelha, e grelha é
   serial. Diga isso ao dev e planeje as que já têm spec.
2. **Teto de duas runs.** O seu contexto passa a segurar duas specs, dois vereditos de dificuldade
   e dois resumos de plano, e cada um deles é relido a cada turn seu.
3. **Os gates são barreiras.** Dispare as duas E6 na mesma mensagem e só abra o gate quando as duas
   voltarem. Um gate por vez, com as duas runs dentro dele: é isso que impede um segundo
   `AskUserQuestion` de abrir enquanto o primeiro está na tela.
4. **Toda linha de gate abre com o slug do assunto**, e todo `header` de `AskUserQuestion` também.
   Sem endereço, o "aprovado" do dev cai na run errada. Resposta que não nomeia o assunto, com duas
   runs no gate, é ambígua: pergunte de qual é, com `AskUserQuestion` de duas opções.

Se as duas desencontrarem no gate da Etapa 9, uma aprovada e a outra com ajuste pedido, entregue a
aprovada na Etapa 10 e siga com a outra sozinha. Barreira serve para juntar o que chega junto, não
para segurar o que já está pronto.

Cada run tem o ledger da própria pasta, então nada se mistura em disco. O que se mistura é o seu
contexto, e é por isso que o teto é dois.

**Ondas do mesmo assunto nunca rodam em paralelo.** A onda seguinte precisa do código da anterior
para ser planejada, e é essa dependência que a define.

### Etapa 6 — reconhecimento (general-purpose, sonnet)

Leia [`formats/log-planejamento.md`](formats/log-planejamento.md) e escreva o cabeçalho do ledger.
Então dispare:

```text
subagent_type: 'general-purpose'
model: 'sonnet'
description: 'recon-{slug}'
```

Passe os caminhos de `prompts/reconhecimento.md`, da pasta da run, do `spec.md`, do `projeto.md` e
de [`formats/roteiro.md`](formats/roteiro.md), mais um delta curto com a task em uma frase. **Quando
o `ls` não achou `projeto.md`**, o delta diz isso em uma linha, e a etapa levanta o cartão antes de
qualquer outra coisa.

**Numa onda `k > 1`**, o delta diz qual onda é, nomeia os `RT` dela, passa os caminhos do plano e
do `implementacao.md` da onda anterior e o nome do arquivo de saída, `reconhecimento-o{k}.md`. O
mapa que interessa agora é o do código que a onda anterior deixou pronto, e é ele que a onda
comprou.

**Em paralelo**, dispare os dois reconhecimentos na mesma mensagem, cada um com o `description` do
seu slug, e espere os dois voltarem antes de abrir o gate seguinte.

> **Por que não `Explore` aqui.** `Explore` foi o agente certo na Etapa 1, onde o retorno era a
> entrega inteira. Aqui o mapa vai para disco, e o toolset do `Explore` não tem
> `Write`. Mesma razão para não usar `Plan` na Etapa 8.

Ele devolve o veredito do `[Estado atual]`, a lane de cada `RT`, o veredito de fixtures, os
blocos `## Dúvidas` e `## Roteiro de comprovação` literais, e o veredito de dificuldade.

**Se o veredito do estado atual for `contradiz`, pare a etapa de plano.** Leve a contradição ao dev
como primeira linha, junto das `AC` que ela põe em dúvida, e volte ao gate da Etapa 3. Planejar em
cima de uma spec cujo ponto de partida está errado é gastar o plano duas vezes, e a segunda é a
cara.

Anote no ledger: veredito de dificuldade, estado atual, fixtures, contagem de `RT` por lane, e
quantas provas o roteiro proposto tem.

### Etapa 7 — dúvidas técnicas e roteiro de comprovação (nível 0)

Este gate faz duas coisas na mesma parada, e a segunda é a que decide o que a validação vai cobrar.
Leia [`formats/roteiro.md`](formats/roteiro.md) antes de abrir a boca: é lá que está a anatomia de
cada prova, e é contra ela que você julga o que o reconhecimento propôs.

#### As dúvidas, que se filtram

O reconhecimento levantou de zero a quatro dúvidas, cada uma com candidatas e uma recomendação.
**Filtre pela regra 2 da grelha**: pergunte só o que o dev não responderia sem pensar.

- **Dúvida cuja resposta é óbvia** — assuma a candidata recomendada, registre no ledger em
  `Assumidas`, e mande no delta do planejador. Ela vai aparecer no `## Resumo do plano` como
  decisão travada, e o dev a contesta no gate da Etapa 9 se quiser.
- **Dúvida em que as duas melhores candidatas são as duas defensáveis** — vai para o dev, numa
  chamada `AskUserQuestion` só, com até quatro perguntas, a recomendada na frente e
  `(recomendado)` no label.

Sobrar zero dúvida é o caso comum: a grelha da etapa de spec já limpou o que era decisão de
produto, e o que resta para o reconhecimento levantar é decisão técnica que quase sempre tem uma
resposta certa.

#### O roteiro, que se fecha

O bloco `## Roteiro de comprovação` chegou literal no retorno do reconhecimento. **Repasse-o ao dev
como está**, sem resumir asserção nenhuma: ele vai aprovar a lista de PNG que a implementação vai
produzir, e resumo aqui é o dev aprovando algo diferente do que vai ser cobrado.

A lista sai plana e na ordem de execução. **A separação por rodada de validação ainda não existe
aqui**: quem declara marco é o planejador, na Etapa 8, e é no gate seguinte que o dev vê quais
provas saem no meio da implementação e quais no fim.

```text
ambiente: {comando de ambiente}
estado: {comando de estado}
url: {url} — a listagem com o filtro de período aberto

S01 (RT-003) o analista escolhe o período do mês passado e clica em Exportar → o
    download começa e a listagem mostra "Gerando o arquivo…"
S02 (RT-004) o arquivo baixado abre com uma linha de cabeçalho e uma linha por
    registro do período, na ordem da listagem
S03 (RT-005) um registro cujo texto contém o separador → o campo sai entre aspas e
    o CSV continua com o mesmo número de colunas
S04 (RT-006) o analista escolhe um período sem nenhum registro → a listagem recusa
    a exportação com "Nenhum registro no período" e nada é baixado
S05 (RT-007) o analista escolhe um período acima do teto de linhas → a listagem
    recusa e diz o teto, sem começar o download
T01 (RT-005) {arquivo da suíte} — texto com o separador dentro do campo → o campo
    sai escapado e o número de colunas não muda
```

Antes de mostrar, confira as quatro coisas que o dev não tem como conferir sozinho:

1. **As linhas `ambiente` e `url` existem**, e o comando da primeira é o que o cartão do projeto
   achou, não um parecido. Sem elas o tester sobe a variante mais curta que enxergar e navega para
   onde achou.
2. **Todo `RT` de lane `browser` tem prova, e todo `RT` de lane `teste` também.** A contagem por
   lane veio no retorno do reconhecimento, então essa conta você fecha sem abrir arquivo.
3. **Todo caminho de erro da spec tem prova própria.** Você escreveu os `RT`, então sabe quais
   bordas existem. Borda sem prova é o defeito mais comum do roteiro proposto, e é o que este gate
   existe para pegar.
4. **Nenhuma asserção diz só "a tela abriu".** Prova sem sujeito visível não reprova nada.

O que o dev faz aqui é corrigir texto, acrescentar a borda que faltou e cortar o que não interessa.
Peça isso em prosa, não por `AskUserQuestion`: a resposta dele é uma frase por prova, e opção de
múltipla escolha não cabe numa lista de nove linhas.

**Quando ele fecha, escreva `{pasta-da-run}/roteiro.md`** com o texto aprovado, e é esse arquivo
que o planejador recebe. Numa onda `k > 1` o nome é `roteiro-o{k}.md`.

#### Quando este gate não para

**Task sem nenhum `RT` de lane `browser` nem `teste` e sem dúvida sobrevivente não tem gate**:
dispare a Etapa 8 no mesmo turn, como antes. Sem prova para fechar e sem pergunta para fazer, a
parada é atrito puro.

Fora disso o gate para sempre, mesmo com zero dúvida. O roteiro é o único momento em que o dev
decide como a entrega dele vai ser provada, e depois da Etapa 9 ninguém mais pergunta nada.

Com duas runs, as dúvidas das duas entram na mesma chamada `AskUserQuestion` e o `header` de cada
pergunta abre com o slug do assunto. Os dois roteiros vão no mesmo gate, cada um sob o seu slug, e
o teto de quatro perguntas vale para a soma.

Anote no ledger: dúvidas levantadas, perguntadas com a resposta, assumidas com a decisão; e no
roteiro, quantas provas foram propostas, o ambiente, e o que o dev corrigiu, acrescentou ou cortou.

### Etapa 8 — plano (general-purpose, sonnet ou opus)

```text
subagent_type: 'general-purpose'
model: 'sonnet' se veredito=simples | 'opus' se veredito=complexa
description: 'plano-{slug}'
```

Passe os caminhos de `prompts/planejador.md`, do `spec.md`, do `projeto.md`, do
`reconhecimento.md`, do `roteiro.md` e de `formats/plano.md`, mais o delta com as respostas às
dúvidas da Etapa 7, quando houve.

O `roteiro.md` vai como **contrato fechado**, e o delta diz isso em uma linha: as provas entram no
plano com o texto que o dev aprovou, o planejador só marca a rodada de cada uma, e prova
acrescentada ou dispensada tem que aparecer no resumo.

**Numa onda `k > 1`**, o delta acrescenta os caminhos do `ondas.md` e do plano da onda anterior, os
`RT` que sobraram para esta onda, e o nome do arquivo de saída, `plano-o{k}.md`.

Ele devolve o plano e, no retorno, o número de passos e de checkpoints, as lanes, a cobertura
(`{N}/{N} RT`), a **onda** que ele cobre e os `RT` que ficaram pendentes, os **marcos de
validação** (o checkpoint de cada um e os `RT` que ele prova, ou
`nenhum`), o veredito de fixtures com o comando de estado, a linha `ambiente`, as provas do
roteiro que ele acrescentou ou dispensou, e o bloco `## Resumo do plano`.

Anote no ledger: passos, checkpoints, cobertura, lanes, marcos, ondas, provas acrescentadas ou
dispensadas, ambiente e comando de estado.

**Se o planejador declarou onda pendente**, escreva o `ondas.md` da pasta da run agora, com a onda
corrente marcada `planejada` e a próxima `pendente`. Numa onda `k > 1` o arquivo já existe:
acrescente a linha nova e marque a sua como `planejada`, sem mexer nas ondas `implementada`. Ele é
o que faz a próxima sessão saber onde a task parou, e a pasta da run precisa bastar para
reconstruir isso.

### Etapa 9 — gate do plano (nível 0)

Repasse ao dev, **sempre**, e encerre o turn:

1. O bloco `## Resumo do plano`, literalmente, sem reescrever, resumir nem acrescentar seção. A
   parte "Decisões que travei sozinho" é onde ele descobre o que decidiram por ele.
2. A linha de **cobertura**, `{N}/{N} RT`, e os `## Desvios da spec`, se houve algum. Cobertura
   abaixo de `N/N` sem desvio declarado e sem onda pendente é plano incompleto: mande de volta
   antes de mostrar.
3. **O roteiro, em duas linhas curtas.** A primeira é a separação por rodada, só com os ids: quais
   provas saem em cada marco e quais na rodada final. É a leitura que não existia no gate anterior,
   porque os marcos nasceram agora. A segunda é o delta: as provas que o planejador acrescentou,
   com o motivo, e as que ele dispensou por `## Desvios da spec`.

   Não repita as asserções. O dev as fechou uma etapa atrás, e relê-las aqui é gate sem decisão.
4. **A onda**, quando o plano declarou uma pendente: os `RT` que esta onda entrega, os que ficam
   para a próxima e a frase do planejador dizendo por que planejá-los hoje seria chute. O dev está
   aprovando meio contrato, e ele precisa ver a outra metade sendo adiada, não sumindo.
5. O caminho do plano em link markdown.

Quando o dev responde:

- **Aprovou** — vá para a Etapa 10.
- **Pediu ajuste no plano** — dispare um planejador **fresco** com o mesmo `description` mais
  `-r{n}`, passando os caminhos de sempre mais o do `plano.md` atual e o ajuste como delta. Volte a
  esta etapa. **Se o ajuste mexe em prova** — uma que falta, uma que ele quer diferente —, edite o
  `roteiro.md` antes de disparar: o arquivo é o contrato, e contrato que fica atrás do plano deixa
  de servir de conferência. Um planejador fresco por rodada, e não `SendMessage` no anterior: a janela dele já
  tem o plano velho inteiro, e é justo o plano velho que está sendo trocado.
- **Contestou um `RT` ou uma `AC`** — isso é mudança de spec, não de plano. Volte ao gate da Etapa
  3 ou 4, corrija o `spec.md` e redispare a Etapa 6.
- **A correção invalida o mapa** (unidade errada, fluxo errado) — volte à Etapa 6 com a correção no
  delta.
- **Abortou** — feche o ledger com `abortado` e pare.

Não há limite de rodadas. O que limita é o julgamento do dev: se o plano precisa de uma terceira
reescrita, o problema provavelmente está no mapa ou na spec, e voltar sai mais barato.

### Etapa 10 — entrega (nível 0)

Feche o ledger e responda ao dev com:

- **Veredito**: `plano aprovado` ou `abortado`, com o motivo.
- **O que o plano faz**: uma frase.
- **Cobertura**: `{N}/{N} RT`, as lanes que aparecem e quantos checkpoints o plano tem. Numa onda,
  a conta é `{cobertos nesta onda}/{N}` mais os pendentes.
- **Onda**, quando há mais de uma: qual onda o plano cobre, o que ela entrega na língua das `AC`, e
  quais `RT` ficaram para a próxima. Diga também que a próxima só é planejada depois de esta estar
  implementada e validada, e que a linha que a planeja é a mesma de sempre, apontando a mesma
  pasta:

  ```text
  /task-especificar-e-planejar .claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/
  ```
- **Comprovação**: quantas provas o roteiro tem, quantas são screenshot e quantas são caso de
  suíte, mais o **comando de ambiente** da linha `ambiente`. Diga também o que o planejador
  acrescentou ou dispensou, se houve.
- **Fixtures**: `sincronizar`, `estender`, `sem mudança` ou `sem mecanismo`, e o comando de estado.
  Se o plano estende o mecanismo de fixtures, diga o que a próxima task ganha de cenário novo.
- **Arquivos que a implementação vai tocar**: em links markdown clicáveis, como o plano os listou.
- **Decisões que ninguém contestou**: as linhas `(agente)` da spec mais as premissas dos filhos.
- **Regras de negócio**: as `AC` marcadas com `(rn)`, que a implementação vira **registro durável**
  na doc de contexto do projeto antes de fechar. Quando o cartão não achou doc de contexto nem
  memória, a regra de negócio sai aqui como uma linha e o dev decide onde ela mora.
- **Marcos de validação**, quando o plano declarou algum: em qual checkpoint cada um cai e quais
  `RT` ele prova antes de a implementação seguir. Plano sem marco entrega a validação inteira no
  fim, que é o caso comum.
- **Caminho da pasta da run**, em link markdown.
- **Como implementar**: entregue a pasta da run à **skill de implementação do projeto** — a que lê
  um plano fechado e o executa. O campo `skills de contexto` do cartão do projeto diz se o repo tem
  uma; se tem, dê a linha exata que a invoca, apontando esta pasta:

  ```text
  /{skill-de-implementacao-do-projeto} .claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/
  ```

  Se o cartão não achou nenhuma, diga isso em uma linha e entregue o caminho do `plano.md` como o
  contrato a seguir: os passos na ordem, um checkpoint por parada, o `## Plano de teste` como a
  prova, e a linha `## Cobertura` como o critério de aceite. Quem implementa — outro agente, outra
  skill ou o próprio dev — não precisa de mais nada além desta pasta.

- **Assuntos que sobraram do corte**, quando houve corte: um por linha com a pasta em link
  markdown. Só o assunto desta pasta tem spec e plano; os outros ainda não têm nada além do
  `corte.md`. Diga qual linha especifica o próximo.

  ```text
  /task-especificar-e-planejar .claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug-do-proximo}/
  ```

Diga também, em uma linha, que daquele ponto em diante a orquestração não faz mais perguntas: a
implementação roda sozinha até o fim, e ambiguidade que aparecer lá vira premissa registrada no
relatório final.

---

## Requirements

- O nível 0 não lê código, não edita arquivo do projeto e não roda comando de projeto. As exceções
  são o `mkdir` da pasta da run, o `ls` que identifica o estado de uma pasta apontada, a escrita do
  `spec.md`, do `projeto.md`, do ledger, do `corte.md` e do `ondas.md`, e a leitura única do
  `spec.md` e do `ondas.md` quando a skill começa direto na etapa de plano. Nenhum comando `git`
  roda aqui.
- **Nenhum fato do repositório está escrito nesta skill.** Comandos, unidades, convenção de teste,
  mecanismo de fixtures, memória e fluxo de dados persistentes saem do **cartão do projeto**,
  levantado uma vez por run em `{pasta-da-run}/projeto.md`: a Etapa 1 o devolve literal e o nível 0
  o escreve; na entrada direta pela metade de plano sem `projeto.md`, quem o levanta e escreve é a
  Etapa 6. Ele não leva sufixo de onda, e o nível 0 nunca o lê.
- **Quatro blocos viajam literais no retorno de um filho**, e são os únicos que furam o teto de doze
  linhas: `## Dúvidas` e `## Roteiro de comprovação` do reconhecimento, `## Resumo do plano` do
  planejador, e `## Cartão do projeto` da Etapa 1. Todo outro retorno é ponteiro.
- Todo disparo leva `model` explícito e `description` único. Opus só no plano de task `complexa`, e
  quem classifica é o reconhecimento.
- O prompt do subagente vai como **caminho**, com um delta curto. Ninguém cola corpo de prompt nem
  conteúdo de arquivo na chamada.
- Nenhum filho chama `AskUserQuestion`. Quem pergunta é o nível 0, na grelha e na Etapa 7.
- O estado atual é confirmado no código antes da grelha, e a visão do dev entra como hipótese. O
  reconhecimento o julga de novo, e um `contradiz` devolve a task ao gate da spec.
- **Prompt com mais de um assunto é cortado na Etapa 0**, pelo critério de `AC` não compartilhada
  e `RT` que não depende do código do outro. O corte passa pelo gate da Etapa 0.5, produz uma pasta
  por assunto com `corte.md`, e a skill roda a grelha de um assunto por vez. Assunto dependente de
  outro é checkpoint, não corte.
- **Plano cujo resto seria chute declara onda pendente**, pelo critério de
  [`formats/plano.md`](formats/plano.md): os passos da próxima onda dependem do formato de um
  código que esta vai criar. Quem declara é o planejador; o nível 0 escreve o `ondas.md`, entrega
  a onda corrente e relança a Etapa 6 quando o dev voltar com a onda anterior implementada. Uma
  onda por vez, e no máximo a próxima é declarada.
- **A metade do plano roda até duas runs em paralelo**, e só para pastas que já têm `spec.md`. Os
  gates são barreiras, com um gate por vez e o slug do assunto em toda linha e em todo `header`. A
  metade da spec continua serial, e ondas do mesmo assunto nunca são paralelas.
- A grelha respeita as seis regras: rascunho primeiro, pergunta só o disputável, opções com
  `(recomendado)`, teto de cinco, parada por critério, e o dev com a palavra final. A Etapa 7 usa a
  regra 2 para filtrar as dúvidas do reconhecimento.
- **O roteiro de comprovação é fechado com o dev na Etapa 7**, antes de existir plano: uma prova
  por `RT` de lane `browser` ou `teste`, com a ação, o que precisa estar visível, a linha
  `ambiente` e prova própria para cada caminho de erro da spec. Quem propõe é o reconhecimento,
  quem fecha é o dev, e o nível 0 escreve o `roteiro.md`. O planejador acrescenta prova com id
  novo e dispensa prova só por `## Desvios da spec`; reescrever asserção aprovada, não.
- A Etapa 7 para sempre que a task tem `RT` de lane `browser` ou `teste`, mesmo sem nenhuma dúvida
  técnica. Sem prova para fechar e sem dúvida sobrevivente, ela não para.
- A spec fecha pelos seis critérios de [`formats/spec.md`](formats/spec.md), o roteiro pelos sete
  de [`formats/roteiro.md`](formats/roteiro.md) e o plano pelos doze de
  [`formats/plano.md`](formats/plano.md). Verifique um por um.
- **Task `complexa` declara 1 ou 2 marcos de validação**, em checkpoint que não é o último. Task
  `simples` escreve `nenhum` e valida uma vez, no fim.
- **Todo `RT` da spec aparece na seção `## Cobertura` do plano**, apontando uma checagem, o desvio
  que o dispensa ou a onda pendente que vai cobri-lo. Cobertura abaixo de `N/N` sem uma das duas
  saídas declarada não passa do gate.
- **As linhas `ambiente` e `estado` existem no plano de teste**, mesmo dizendo `nenhum`. O tester
  não escolhe o comando que sobe o ambiente nem inventa estado.
- **O veredito de fixtures está respondido em todo plano**, com um de quatro valores:
  `sincronizar`, `estender`, `sem mudança` ou `sem mecanismo`. Quem responde é o reconhecimento,
  lendo o contrato que o campo `mecanismo de fixtures` do cartão apontou; quem o executa é o
  planejador. Tocar o mecanismo não pesa no veredito de dificuldade.
- O gate do plano para sempre, em qualquer dificuldade de task. O `## Resumo do plano` vai ao dev
  literalmente, como o planejador o escreveu.
- Filho com `handoff` vira sucessor fresco. Filho `preso` que o nível 0 julgou laço vai ao dev, que
  quase sempre resolve com uma linha de informação.
- Nada de fork, agente de espera, `sleep` ou chamada no-op. O disparo usa
  `run_in_background: false` e você encerra o turn: a notificação de conclusão chega sozinha.

## Example

```text
Dev: /task-especificar-e-planejar exportar o relatório da listagem em CSV, com filtro de período

Nível 0:
  E0  rascunho: P1 analista de operações, familiaridade alta; ideia em uma frase
      corte: 1 assunto, sem corte — sem E0.5
      criou .claude/tmp/orquestracoes/2026-05-14-export-csv-relatorio/
  E1  estado-export-csv-relatorio (Explore, sonnet) → a listagem existe e pagina,
      não há exportação de nada; hipótese do dev: confirma
      cartão do projeto devolvido → projeto.md escrito pelo nível 0
  E2  gate da ideia, turn encerrado
      dev: "isso"
  E3  4 AC rascunhadas, grelha fez 2 perguntas (o que o CSV traz quando o período
      não tem linha; se o filtro aceita período aberto), 3 respostas viraram AC,
      1 virou fora de escopo
      gate das specs, turn encerrado
      dev: "corta a AC-004, isso é outra task"
  E4  7 RT, 2 SHOULD com saída, 2 linhas marcadas (agente): o teto de 50 mil linhas
      e o separador do CSV
      gate dos RT, turn encerrado
      dev: "aprovado"
  E5  spec fechada: 3 AC, 7 RT, 1 AC marcada (rn) — e dispara a E6 no mesmo turn
  E6  recon-export-csv-relatorio (gp, sonnet) → estado: confirma, veredito: simples,
      lanes: 2 codigo / 4 browser / 1 teste, fixtures: sincronizar, 2 dúvidas,
      roteiro proposto: 6 provas (5 S + 1 T)
  E7  1 dúvida óbvia assumida (onde o arquivo é gerado), 1 perguntada (o que
      acontece com o período aberto)
      roteiro repassado prova por prova, turn encerrado
      dev: escolheu "recusar o período aberto"; no roteiro, corrigiu o texto do S01
      e pediu o S06: período sem nenhuma linha
      roteiro.md escrito: 7 provas
  E8  plano-export-csv-relatorio (gp, sonnet) → 9 passos em 2 checkpoints,
      7/7 RT cobertos, 7 provas no plano de teste, nenhuma acrescentada
  E9  resumo do plano repassado, turn encerrado
      dev: "aprovado"
  E10 entrega: plano aprovado, 7/7 RT, 7 provas, e a linha que inicia a
      implementação no repo
```

Duas runs em paralelo, uma delas em ondas:

```text
Dev: /task-especificar-e-planejar {pasta-A}/ {pasta-B}/

Nível 0:
  E6  recon-export-csv-relatorio e recon-paginacao-listagem na mesma mensagem
      (gp, sonnet); barreira: espera os dois → simples / complexa
  E7  2 dúvidas, uma de cada assunto, numa chamada só com o slug no header
      os dois roteiros no mesmo gate, cada um sob o seu slug
      turn encerrado; o dev respondeu as duas e cortou uma prova da paginação
      roteiro.md escrito nas duas pastas
  E8  plano-export-csv-relatorio (sonnet) e plano-paginacao-listagem (opus) na
      mesma mensagem
      paginacao-listagem cobre 5/9 RT e declara a onda 2 pendente (RT-006 a RT-009)
  E9  os dois resumos no mesmo gate, cada linha abrindo pelo slug, turn encerrado
      dev: "export aprovado; na paginação, junta os dois primeiros checkpoints"
  E10 entrega export-csv-relatorio; paginacao-listagem volta à E8 com o ajuste,
      sozinho
      ondas.md escrito: onda 1 planejada, onda 2 pendente
```
