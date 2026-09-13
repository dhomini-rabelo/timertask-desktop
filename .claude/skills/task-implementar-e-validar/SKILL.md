---
name: task-implementar-e-validar
description: >-
  Executes an already-approved plan acting only as an orchestrator, the
  autonomous half of the method: no question reaches the developer from
  start to finish. Level 0 never reads code, never edits a file and never
  runs a verification or test command itself — it receives the run folder
  that task-especificar-e-planejar left under .claude/tmp/orquestracoes/
  with spec.md and plano.md approved, and only dispatches subagents in
  sequence (implementation by plan checkpoints → pattern-and-code review
  every ~5 checkpoints and always on the last one → validation at the
  milestones the plan declared plus one full pass at the end, one tester per
  proof lane — curl, browser, teste, codigo → correction → adaptation of the
  future plan when the defect is in the plan rather than in the code →
  business-rule registration and context-documentation update), keeping a
  short ledger in the same folder. No project fact is hardcoded: every
  command, unit, test convention, environment prerequisite and fixture
  mechanism comes from the project card (projeto.md) the planning skill
  left in the run folder, or is discovered at runtime by the child that
  needs it; a lane whose required card field reads "nenhum" is unavailable,
  never defaulted to a guess. Validation is per RT-00N, which is binary and
  observable, and level 0 sums the verdict by AC-00N, the developer's own
  language: an AC is delivered when every RT that serves it passed. Every AC
  marked (rn) in the spec becomes a registered business rule, in whatever
  context doc or project memory the card names, before the run closes. A
  wrong plan no longer kills the run: an adaptor reads the spec and rewrites
  the future checkpoints, always choosing the path that preserves the AC the
  developer approved. A task split into waves runs one wave per execution:
  the ondas.md in the folder says which is current, its files carry the
  -o{k} suffix, and the ceilings count per wave. Ambiguity that turns up
  becomes an assumed premise recorded in the final report; only external
  action interrupts. Each stage that changes a file commits its own work,
  and level 0 gives a single git push at the end. Every child measures its
  own two ceilings with scripts/medir-janela.sh: ~150k of context window and
  60 turns. Sonnet in every execution role; only the adaptor pays Opus, and
  only on a complex task. This skill fires only on explicit request
  (disable-model-invocation: true) and coexists with whatever pipeline the
  repo already has (claude-step-*, claude-simple-loop) — it neither
  deprecates nor replaces any of them, and letting the router pick between
  them by inference is the most likely failure mode of that coexistence.
  Use when the user asks for task-implementar-e-validar,
  /task-implementar-e-validar, to implement an orchestrated plan, or to
  execute a task that has already been planned.
disable-model-invocation: true
---

# Orquestrar a implementação de um plano

## Overview

Você é **despachante, não executor**. O agente principal (nível 0) conduz a implementação inteira
sem tocar no código: dispara um subagente por etapa, anota o resultado em poucas linhas no ledger
e passa para a etapa seguinte.

Esta é a segunda metade do método:

- **`task-especificar-e-planejar`** — escreve a spec com o dev, mapeia o código e planeja. Entrega
  uma pasta de run com `spec.md`, `reconhecimento.md` e `plano.md` aprovados.
- **`task-implementar-e-validar`** (esta skill) — pega isso e vai até o push, **sem fazer pergunta
  nenhuma**.

A spec e o plano que você recebe já foram lidos e aprovados pelo dev. É isso que autoriza esta
metade a rodar sozinha: o rumo foi combinado, então interromper agora só atrasa. Ambiguidade que
aparecer no caminho vira **premissa assumida**, registrada no ledger e reportada no fim.

O que muda em relação a executar um plano solto é que **existe um contrato para provar**. O
`spec.md` traz as `AC-00N`, que são as expectativas do dev, e os `RT-00N`, que são o que se prova.
Cada passo do plano cita o `RT` que implementa, cada `RT` tem uma checagem, e a run só fecha
`entregue` quando todo `RT` passou ou está declarado em `## Desvios da spec`.

A razão de o nível 0 não executar é de custo, e é simples de enunciar:

```text
custo do nível 0 ≈ turns × contexto médio × preço do cache read
```

O contexto do nível 0 é relido a cada turn da task inteira. Tudo que entra nele — um arquivo lido
"só para conferir", a saída de um `tsc`, um diff — é pago de novo em todo turn seguinte. Por isso o
trabalho pesado vive **dentro** dos filhos, cujo contexto nasce e morre na etapa.

Esta skill **não sabe nada do repositório em que está rodando**: os comandos, as unidades e as
convenções saem do **cartão do projeto** que a skill de planejamento deixou em
`{pasta-da-run}/projeto.md`, não de um nome de unidade ou de pacote escrito aqui. Nenhum filho decide
por conta própria o que o cartão já responde.

### O que o nível 0 NUNCA faz

- Ler arquivo de código, plano, diff ou log de filho.
- Editar qualquer arquivo do projeto.
- Rodar o comando de verificação, o comando de teste, `curl`, build ou teste — e nenhum comando
  `git` além do `git push` único da Etapa 7.
- Chamar `Grep`, `Glob` ou `Explore` para "dar uma olhada rápida".

### O que o nível 0 faz, e só isso

1. Localiza a pasta da run e escreve o ledger (Etapa 0).
2. Dispara os subagentes, um por etapa, e anota o veredito de cada um.
3. Dispara a atualização da documentação de contexto, depois de o teste passar.
4. Dá o `git push` da branch, uma vez, no fim.
5. Entrega o relatório final ao dev.

> **Escrever o ledger é a única escrita permitida ao nível 0**, e ele nunca relê o que escreveu: o
> que ele precisa saber já está na notificação de conclusão do filho. Os commits são dos filhos;
> do nível 0 é só o push. Numa task em ondas há uma segunda escrita, de uma linha: marcar a onda
> como `implementada` no `ondas.md`, na Etapa 7.

---

## Autonomia: zero pergunta, com uma exceção

O `CLAUDE.md` deste repo manda usar `AskUserQuestion` quando há ambiguidade. Nesta skill essa
porta já foi fechada: as perguntas foram feitas na skill de planejamento, e o plano que saiu de lá
tem a aprovação do dev.

- **Você não pergunta nada.** Ambiguidade que aparecer no meio vira premissa assumida, registrada
  no ledger na seção `Premissas` e reportada no fim.
- **Nenhum filho pergunta nada.** Diga isso explicitamente em **todo** prompt de disparo: *"não
  chame `AskUserQuestion`; toda ambiguidade vira premissa assumida e documentada"*.
- **A única exceção é ação externa** não autorizada: publicar, enviar e-mail ou mensagem,
  cobrança. Aí você para e pergunta, mesmo no meio. Essas integrações são reais mesmo com o
  pré-requisito local — e o pré-requisito sobe na máquina, pelo gate da seção seguinte.

Se o plano estiver errado de um jeito que a implementação não consegue contornar, o caminho não é
perguntar: é **fechar como bloqueado** e devolver ao dev com o motivo. Um plano errado se corrige
na skill de planejamento, que é onde existe conversa.

---

## O pré-requisito de ambiente, e quem o confere

Uma prova precisa de mais do que código: precisa do serviço de que o código depende de pé — banco,
fila, storage, o processo que serve a rota. Qual é ele e o que o sobe está no campo
`pré-requisito de ambiente` do cartão do projeto, e é o cartão que manda, não a leitura que um
tester faz do plano.

Quem confere o pré-requisito é **o filho que vai executar**, nunca você:

- **Os testers de lane `curl`, `browser` e `teste` da Etapa 4**, na primeira chamada de cada um,
  antes de subir processo. A lane `codigo` não confere nada, porque a prova dela é estática.
- **O implementador**, só se a implementação precisar executar algo contra o serviço: uma migration
  do plano, um script de conferência, uma suíte que ele mesmo escreveu.

A ordem é **conferir antes de subir**. Serviço já no ar é serviço que se reusa: o filho checa o que
o cartão nomeia como pré-requisito, e só roda o comando de subida quando ele não está de pé.
Ninguém derruba nem recria o que já estava rodando — o serviço pode ser compartilhado com outra
sessão, e recriá-lo apaga o estado que a rodada anterior deixou. É isso que também faz a barreira
paralela funcionar: a primeira lane sobe, as outras duas encontram tudo pronto.

O pré-requisito sobe **na máquina**. Nenhum filho aponta o alvo para outro host, nem em leitura, e
**nenhum filho edita arquivo de configuração versionado** para conseguir isso: um retorno por
BLOCKER, `handoff` ou `preso` deixaria a árvore suja e os comandos seguintes apontando para o lugar
errado. Quando um comando ignora o override, passe a variável no próprio comando ou aponte-o para
uma cópia temporária fora do repositório. Se o campo `pré-requisito de ambiente` nomeia um serviço
remoto compartilhado, ou diz `nenhum` enquanto a suíte ou o ambiente exigem um serviço de pé, isso
é BLOCKER com o campo nomeado — não é uma decisão que o tester tome sozinho.

O veredito é uma linha, não prosa: **pré-requisito de pé, ou BLOCKER com o motivo.** BLOCKER aqui
não vira pergunta ao dev e não vira rodada de correção: não é o código que está errado, é a máquina
sem o serviço. O tester devolve BLOCKER com o motivo, você anota no ledger e a run fecha
**bloqueada**, sem push. Quando o cartão diz `pré-requisito de ambiente: nenhum` e nada exige
serviço, o filho escreve `pré-requisito: nenhum` no relatório e segue.

O que continua real com o serviço local são as **integrações externas** — e-mail, mensagem,
cobrança. É por elas que a exceção de autonomia da seção anterior existe.

---

## As fixtures são como o teste chega ao estado

Serviço de pé e vazio não prova quase nada: a maior parte das provas precisa de um sistema em algum
estado — a conta que já existe, o registro que já está no cenário que a prova exige, o arquivo que já foi importado.
Quem fabrica esse estado é o **mecanismo de fixtures** do projeto, e o campo homônimo do cartão diz
qual é o daqui, qual comando o roda e qual arquivo é o contrato dele. O plano que você recebeu já
traz o comando na linha `estado:` do `## Plano de teste`, e é ele que o tester roda, como está,
depois de o pré-requisito estar de pé.

A seção `## Fixtures` do plano responde o que esta run faz com o mecanismo, com um de quatro
vereditos:

- **`sincronizar`** — a task muda algo que o mecanismo fabrica, então ele muda junto. Passo de plano
  como qualquer outro, com uma exigência a mais: o arquivo que o cartão aponta como contrato do
  mecanismo sai no **mesmo commit** que a mudança de comportamento. Todo agente que usa o mecanismo
  lê esse arquivo e nenhum lê a implementação dele.
- **`estender`** — a prova precisa de um cenário que o mecanismo não alcança hoje, e o plano cria o
  que falta. Esses passos costumam ser um checkpoint próprio, e ele vem **antes** dos checkpoints
  que dependem dele: o estado do teste depende de a fixture existir.
- **`sem mudança`** — o que existe alcança o cenário. Nada a fazer.
- **`sem mecanismo`** — o projeto não tem nenhum. A linha `estado:` diz `nenhum`, o estado de
  partida é montado num passo do plano, e nenhum tester o monta na mão.

Quando o diff toca o mecanismo, ele entra nos gates do checkpoint como qualquer outro código: o
**comando de verificação** do cartão e, se o cartão disser como rodar um alvo só, o **comando de
teste** restrito a ele. Mudança em fixture que ninguém rodou é mudança que ninguém conferiu, e o
custo dela é a próxima task testando contra um estado que o produto já não produz.

---

## A validação é por `RT`, e a `AC` fecha por soma

O `spec.md` tem duas listas e elas falam línguas diferentes. As `AC-00N` são o que o dev espera,
escritas como ele as descreveria. Os `RT-00N` são o que alguém prova, e cada um aponta a `AC` que
atende.

**Os testers provam `RT`.** É a única coisa que dá para provar: `RT` é concreto e binário, e um
tester que julgasse "o usuário espera mensagens claras" estaria dando opinião. Cada tester devolve
uma linha por `RT` da lane dele, no formato `RT-004 (AC-002) PASS`.

**Você soma a `AC`.** Uma `AC` costuma ser servida por vários `RT`, às vezes em lanes diferentes,
então nenhum tester sozinho consegue fechá-la. Você tem as quatro lanes na mão, e a regra é uma
linha:

> Uma `AC` está entregue quando **todo** `RT` que a serve passou.

Isso é aritmética sobre linhas que já estão no seu contexto, não leitura de arquivo. Duas
ressalvas mudam a conta:

- **`PASS com ressalva`** não derruba a `AC`. Ele acontece num `RT [SHOULD]` cuja implementação
  pegou uma alternativa da lista que a própria linha carrega. A `AC` fecha, e a ressalva viaja no
  relatório: o dev quer saber qual saída foi usada.
- **`RT` em `## Desvios da spec`** não conta contra a `AC`. O dev viu o desvio no gate do plano e
  seguiu mesmo assim. Diga isso na linha da `AC` em vez de omitir.

**Por que a `AC` e não só o `RT`.** `RT-004 reprovado` diz ao implementador o que consertar.
`AC-002 não entregue` diz ao dev o que ele não vai receber. São dois leitores, e o relatório final
é para o segundo.

---

## Regra de negócio marcada na spec vira registro obrigatório

A spec morre com a task: ela vive em `.claude/tmp/`, que é gitignored. O que precisa sobreviver
tem saída própria, e a `AC` marcada com `(rn)` é o mecanismo.

`(rn)` significa que aquela expectativa cria ou muda uma **regra de negócio**. O dev a marcou
assim no gate da spec, então a decisão já foi tomada e não se rejulga aqui: a Etapa 6 registra cada
uma na **doc de contexto** que o campo `docs de contexto` do cartão nomeia, e a run não fecha
`entregue` com uma delas de fora — a menos que o cartão não tenha destino nenhum (ver Etapa 6),
caso em que a regra sai como linha do relatório e o dev decide onde ela mora.

Isso é a metade garantida da Etapa 6. A outra metade continua sendo a varredura da **skill de
contexto** que o campo `skills de contexto` do cartão apontar, que pega a regra que ninguém pensou
em marcar.

---

## Modelos por papel

Sonnet em todo papel de execução. Opus entra em um lugar só, e é o mesmo lugar da outra metade: o
raciocínio de plano de uma task complexa. Aqui esse papel é o adaptador, e ele herda a regra da
skill de planejamento — Sonnet quando a task é `simples`, Opus quando é `complexa`. O veredito de
dificuldade sai do `reconhecimento.md`, não do `plano.md` — o template do plano não tem seção de
dificuldade —, e chegou a você no retorno do implementador, que o leu na leitura dirigida do
reconhecimento (ver "O cartão do projeto é a entrada de fatos"). Sem `reconhecimento.md`,
`## Marcos de validação: nenhum` lê como `simples` e qualquer marco declarado lê como `complexa`.

| Papel | Modelo |
|---|---|
| Implementador | `sonnet` |
| Revisor | `sonnet` |
| Tester (curl, browser, teste ou codigo) | `sonnet` |
| Correção | `sonnet` |
| Adaptador | `sonnet` se `simples` \| `opus` se `complexa` |
| Atualizador de contexto | `sonnet` |

**Todo disparo leva `model` explícito.** Disparo sem `model` herda o modelo do pai — que aqui é
Opus. Um implementador rodando em Opus por esquecimento custa várias vezes o orçamento da etapa e
não entrega nada a mais.

---

## Dois tetos por filho: ~150k de janela e 60 turns

Cada subagente mede a **própria** ocupação e para antes de virar problema. Os tetos são **150k de
janela** e **60 turns**, e o primeiro que estourar manda.

Eles não são redundantes: medem riscos diferentes.

- **O teto de janela é segurança.** Previne o filho morrer no meio do trabalho. Dispara em quem
  tem `taxa` alta — um revisor que abre arquivo grande enche 150k em 20 turns.
- **O teto de turns é custo.** O gasto de um filho é a integral do contexto ao longo dos turns.
  Como a janela cresce quase linear, o custo cresce com o **quadrado** dos turns:
  `taxa × turns² / 2`. Um filho de 226 turns medido numa run real consumiu 37,3M de tokens — 49%
  da run inteira — e 82% do custo dele era releitura de contexto. Partido em 4 sucessores de ~56
  turns, o mesmo trabalho custaria 12,7M em vez de 31,3M, porque cada sucessor recomeça perto do
  zero.

E o teto de janela não cobre o caso do outro: um filho em laço de baixo rendimento (`taxa` ~300)
precisa de **430 turns** para tocar 150k. São ~28M de tokens sem o teto de janela piscar uma vez.

O script está em `scripts/medir-janela.sh` e lê o transcript ao vivo do agente. Todo prompt de
filho carrega o bloco de medição — os arquivos em `prompts/` já o trazem inline, não remova.

**Como o filho se mede:**

```bash
.claude/skills/task-implementar-e-validar/scripts/medir-janela.sh --self
```

Saída em uma linha:

```text
janela=118539 teto=150000 pct=79 turns=33 teto_turns=60 taxa=1084 proj=161899 proxima=73 status=handoff fonte=self-mtime desc="..."
```

- **`status=ok`** — siga trabalhando, e meça de novo no turn indicado por `proxima`.
- **`status=handoff`** — pare de abrir frente nova, feche o que está na mão, escreva o estado no
  arquivo da etapa e retorne. Vem de janela cheia **ou** de 60 turns rendendo trabalho de verdade.
  O gatilho de janela dispara pela **projeção**, não pelo estouro: medir só o valor instantâneo já
  deixou agente passar de 250k sem nunca pedir socorro.
- **`status=preso`** — 60 turns ou mais com `taxa` abaixo de 400: muitos turns rendendo quase
  nada, que é assinatura de laço. **Pare e reporte**, sem fingir conclusão: escreva no arquivo da
  etapa o que fez, o que falta e no que você está travado, e retorne dizendo `preso`.

`preso` não é sinônimo de `handoff`, e é por isso que são dois status. Um sucessor que herda o
estado de um laço repete o laço, e o custo é pago duas vezes. O discriminador é a `taxa`, não a
janela: nos 15 filhos medidos, a `taxa` de quem produzia ficou entre 684 e 7.779 tokens por turn,
e laço de baixo rendimento gira em 200–300.

**Quando você recebe um retorno com `handoff`**, dispare um filho **fresco** da mesma etapa,
passando o caminho do arquivo que o anterior deixou em disco. Não tente continuar o agente
estourado por `SendMessage` — a janela dele é o problema.

**Quando o retorno vem com `preso`**, não relance por reflexo. Leia o motivo no retorno (dez
linhas, não o arquivo) e decida:

- **Progresso real, só longo** — dispare o sucessor fresco como num `handoff`.
- **Laço de verdade** (mesmo comando repetido, gate que não passa, dependência que não sobe) — a
  etapa está bloqueada. Registre no ledger e feche a run como bloqueada. Relançar sem mudar nada
  paga o mesmo laço de novo.

**Papel que legitimamente passa de 60 turns** — um tester com muitos casos curtos, por exemplo —
sobe o teto no disparo, em vez de virar `preso` a cada run:
`TETO_TURNS=120 medir-janela.sh --self`. O teto de janela continua valendo.

Se o `--self` errar o alvo (o `desc=` impresso não é o filho), meça com o `description` do spawn
como nonce: `medir-janela.sh "<description>"`. Por isso **o `description` de todo disparo deve ser
único e estável** — ele é o endereço da medição.

---

## Disparo: síncrono, sem sondagem, sem agente de espera

Todo disparo usa `run_in_background: false`.

Isso **não** trava a chamada: a tool `Agent` retorna na hora com um id e o filho roda em
background. O padrão correto é **encerrar o turn** — a notificação de conclusão chega sozinha.

Daí saem três proibições:

1. **Não sonde.** Nada de `TaskOutput` ou `Monitor` em loop esperando o filho.
2. **Não durma.** Nada de `sleep`, `true`, `echo .`, `date` ou um `ls` repetido "para passar o
   tempo". Cada um é um turn pago que não produz nada.
3. **Não crie agente de espera.** Nenhum fork, placeholder ou subagente cujo propósito seja
   aguardar outro. Um fork herda o contexto inteiro do pai e roda no modelo do pai — é a forma
   mais cara possível de não fazer nada.

**Barreira paralela sai de graça**: para rodar dois filhos em paralelo, faça as duas chamadas
`Agent` na mesma mensagem. As duas disparam no mesmo turn e cada retorno chega por notificação
própria. É barreira sem nenhum agente de espera.

**Profundidade máxima é 3** (nível 0 → etapa → nada). Nenhum agente de trabalho sub-delega.

---

## Commits durante a run, um push no fim

A run não termina com a árvore suja: **cada etapa que muda arquivo comita o próprio trabalho**, e o
nível 0 dá um único `git push` no fim.

Quem comita é quem editou, pela mesma razão que rege o resto da skill: o commit precisa da lista de
arquivos e do porquê da mudança, e isso só existe dentro da janela de quem fez o trabalho. O nível
0 comitando às cegas cairia num `git add -A` — que varre arquivo sujo alheio à run — e numa
mensagem genérica.

| Etapa | Quem comita | Mensagem |
|---|---|---|
| E3 implementação | implementador | `{tipo}({escopo}): {o que a task entrega}` |
| E3.5 e E5 correção | implementador | `fix({escopo}): {o que o review ou o teste apontou}` |
| E6 documentação | atualizador de contexto | `docs: {a regra ou o fluxo que passou a constar}` |

Regras que valem para todo commit da run:

- **`git add` por caminho, nunca `git add -A`.** A árvore pode ter mudança anterior à run, e ela
  não é da task. Cada agente adiciona só os arquivos que ele mesmo alterou.
- **A mensagem segue o histórico do repo**, descoberto com `git log --oneline -25` antes do
  primeiro commit — não uma convenção fixa. Sem padrão legível no histórico, o fallback é
  conventional commit (`feat:`, `fix:`, `refactor:`, `docs:`), e isso vira uma linha em
  `Premissas`.
- **Uma rodada, um commit.** Cada rodada de correção fecha com o commit dela, e é isso que faz o
  histórico contar o que a orquestração fez.
- **Gate vermelho não comita.** O implementador comita depois de o **comando de verificação** do
  cartão passar, nunca antes.
- **A pasta da run não entra.** `.claude/tmp/` está no `.gitignore`, então nenhum `plano.md` ou
  `review-{n}.md` vira commit.
- **Etapa que não muda arquivo não comita.** Review e teste não produzem commit — o que eles
  escrevem mora na pasta ignorada da run.
- **Branch.** A run comita na branch em que a sessão já está. O implementador descobre a branch
  default com `git symbolic-ref --short refs/remotes/origin/HEAD` (fallback:
  `git remote show origin`; sem remoto, compara com o que `git branch --list` mostra como
  principal). Se a sessão está nela, ele cria a branch da task antes do primeiro commit — o nome
  segue o padrão que `git branch -a` mostrar, e sem padrão visível o fallback é `task/{slug}` — e
  devolve o nome no retorno; é para essa branch que o push da Etapa 7 vai. Sem branch default
  identificável, ele comita na branch corrente e diz isso no retorno.

### A base da run, e por que o revisor precisa dela

Com a Etapa 3 comitada, um `git diff` seco volta vazio e o revisor não veria nada. Por isso o
implementador registra, **antes da primeira edição**, o `git rev-parse HEAD` da run na seção
`Base da run` do `implementacao.md`. O revisor lê essa base no arquivo e diffa contra ela, o que
lhe entrega o trabalho inteiro da run — comitado e não comitado — numa saída só.

### O push (Etapa 7)

Um `git push` só, no fim, feito pelo nível 0:

```bash
git push -u origin HEAD
```

É a única exceção à regra de o nível 0 não rodar `git`, e ela se paga: a saída cabe em duas linhas,
e um subagente só para isso custaria um spawn inteiro.

**Task bloqueada não sobe.** Se a run fechou como `bloqueado` — blocker intocado em duas rodadas,
plano em dúvida, ou vinte e cinco FAILs de teste —, os commits ficam locais e o relatório final diz isso.
Publicar código que não passou no teste é decisão do dev, não da orquestração.

---

## A pasta da run em `.claude/tmp/orquestracoes/`

Você **não cria** a pasta: ela já existe, feita pela skill de planejamento, e é o parâmetro desta
skill. `.claude/tmp/` está no `.gitignore`, então nada disso vaza para o commit.

```text
.claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug-da-task}/
├── log-planejamento.md      ← ledger da outra metade; você não abre e não escreve nele
├── corte.md                 ← qual assunto é esta pasta; decisão anterior à spec, você não abre
├── spec.md                  ← o contrato: as AC e os RT. A entrada desta skill, com o plano
├── ondas.md                 ← só em task partida em ondas; diz qual onda é a corrente
├── projeto.md               ← o cartão do projeto; sem sufixo de onda, um por pasta
├── reconhecimento.md        ← leitura dirigida do implementador e do revisor (ver adiante)
├── roteiro.md               ← o roteiro de comprovação que o dev fechou; já está dentro do plano,
│                               e nenhum papel desta skill o abre
├── plano.md                 ← a entrada desta skill
├── log-implementacao.md     ← o seu ledger; só o nível 0 escreve
├── implementacao.md         ← Etapa 3
├── review-{n}.md            ← Etapa 3.5, um por rodada
├── teste-{n}-{lane}.md      ← Etapa 4, um por lane por rodada
├── screenshots/             ← Etapa 4, um PNG por prova do roteiro: r{n}-s0X-{slug}.png
├── adaptacao-{n}.md         ← Etapa 5.5, quando o plano precisou ser adaptado
└── contexto.md              ← Etapa 6
```

O `{slug}` sai do nome da pasta, sem a data. Ele nomeia todo `description` de disparo e a branch
`task/{slug}`, se ela precisar ser criada.

### Task em ondas: o mesmo fluxo, com sufixo no nome do arquivo

Um plano pode cobrir só uma parte da spec. Quando os passos do resto dependiam do formato de um
código que ninguém tinha escrito ainda, a skill de planejamento partiu a task em **ondas**: um
plano por onda, cada um planejado depois de a anterior estar implementada e validada. O `ondas.md`
da pasta diz qual é a corrente.

Para você isso muda **uma coisa e só uma**: o nome dos arquivos. Na onda `k > 1`, todo arquivo da
run leva o sufixo `-o{k}` — `plano-o2.md`, `log-implementacao-o2.md`, `implementacao-o2.md`,
`review-o2-{n}.md`, `teste-o2-{n}-{lane}.md`, `adaptacao-o2-{n}.md`, `contexto-o2.md`. A onda 1 usa
os nomes de sempre, e o `spec.md` é um só para todas.

O sufixo não é organização: sem ele a onda 2 sobrescreve `implementacao.md` e `teste-{n}-{lane}.md`
da onda 1, que são a prova do que já foi entregue e o que o próximo planejador vai ler para saber o
que existe no código.

**Os três tetos são por onda**, porque cada onda é uma execução inteira desta skill, com o próprio
ledger: 25 rodadas de teste contadas pelo `n` da Etapa 4 desta onda, duas adaptações de plano, e a
cadência de review calculada sobre os checkpoints deste plano. Uma onda não herda contador gasto
da anterior, e nenhum dos três teve o significado alterado.

**A validação final é da onda, não da task.** Ela prova os `RT` que este plano cobre. Os `RT` que
ficaram para a onda seguinte não são `n/d` e não são desvio: eles ainda não têm código, e o
relatório final os lista como pendentes da próxima onda.

### Disco é o canal de entrega

**Todo filho escreve o arquivo da etapa antes de retornar**, e o retorno dele é um ponteiro:
caminho do arquivo, veredito, no máximo 10 linhas. Retorno de filho já chegou no agente errado em
execução real — quando isso acontece, a pasta da run tem que bastar para reconstruir tudo.

**Os testers da Etapa 4 têm uma exceção, e ela é o que faz a soma das `AC` funcionar**: eles
devolvem uma linha por `RT` da lane deles, e num plano de muitos `RT` isso passa de 10 linhas. Só
essas linhas viajam; o resto do relatório fica em disco. Elas são a única entrada que você tem para
fechar o veredito por `AC` sem abrir arquivo nenhum.

Dois formatos ficam em `formats/`, e cada um é lido antes da etapa que o usa:

- [`formats/log-implementacao.md`](formats/log-implementacao.md) — o ledger. Leia antes de escrever
  a primeira linha dele, na Etapa 0.
- [`formats/teste.md`](formats/teste.md) — o relatório de validação, compartilhado pelas quatro
  lanes. Quem o lê são os testers; você passa o caminho no disparo da Etapa 4.

### Você passa caminhos, o filho lê

Nunca cole conteúdo de arquivo no prompt de um disparo — nem o corpo do prompt de `prompts/`, nem o
plano, nem o relatório de teste. Passe o **caminho**; o filho abre.

Numa onda `k > 1`, todo caminho que você passa e todo nome de arquivo de saída que você pede levam
o sufixo `-o{k}`. O prompt de cada filho cita o nome sem sufixo, e diz que o nome vindo no delta
vence: é você quem sabe em que onda a run está.

Um `@caminho` dentro do parâmetro `prompt` da tool `Agent` **não é expandido**: a expansão de `@`
acontece na entrada do usuário no CLI, não em parâmetro de tool. Então o filho receberia o caminho
como texto e teria que ler o arquivo de qualquer jeito — que é exatamente o que você quer. Se fosse
expandido seria pior ainda: o arquivo inteiro entraria no **seu** contexto ao montar a chamada, que
é o custo que esta skill existe para evitar.

---

## O cartão do projeto é a entrada de fatos

`{pasta-da-run}/projeto.md` é o cartão que a skill de planejamento escreveu — um por pasta, sem
sufixo de onda. Ele é a única fonte de comando, unidade, convenção e mecanismo desta skill; nenhum
papel decide um nome de unidade, de script ou de pacote por conta própria.

**O nível 0 nunca abre o `projeto.md`.** O que ele precisa — o comando de ambiente para o ledger, o
veredito de fixtures, o pré-requisito — chega no retorno dos filhos, como todo o resto.

Cada papel lê os campos que o trabalho dele exige:

| Papel | Campos que ele lê |
|---|---|
| implementador | `unidade afetada`, `skills de contexto`, `docs de contexto`, `comando de verificação`, `comando de teste`, `convenção de teste`, `mecanismo de fixtures`, `fluxo de dados persistentes`, `pré-requisito de ambiente`, `convenções que o plano tem que respeitar` |
| revisor | `unidade afetada`, `skills de contexto`, `docs de contexto`, `comando de verificação`, `mecanismo de fixtures`, `convenções que o plano tem que respeitar` |
| tester `curl` | `comando de ambiente`, `pré-requisito de ambiente`, `mecanismo de fixtures` |
| tester `browser` | `comando de ambiente`, `pré-requisito de ambiente`, `mecanismo de fixtures` |
| tester `teste` | `comando de teste`, `pré-requisito de ambiente`, `convenção de teste`, `mecanismo de fixtures` |
| tester `codigo` | `unidade afetada`, `convenções que o plano tem que respeitar` (nenhum comando: a prova é estática) |
| adaptador | `comando de teste`, `comando de verificação`, `comando de ambiente`, `mecanismo de fixtures`, `fluxo de dados persistentes` |
| atualizador de contexto | `docs de contexto`, `memória do projeto`, `skills de contexto`, `unidade afetada` |

**Quando o cartão não existe.** Se o `ls` da Etapa 0 não achar `projeto.md`, o nível 0 **não** o
levanta — ele não lê código. Quem levanta é o **implementador**, como item 0 do trabalho dele,
seguindo a ordem de descoberta de `task-especificar-e-planejar/prompts/estado-atual.md`: doc de
contexto da raiz, manifesto da raiz (bloco de scripts e de workspaces), layout das unidades, doc da
unidade afetada, `ls .claude/skills/`, `ls .claude/agents/`, convenção de teste, fixtures. Teto de
~10 chamadas de tool, nenhum arquivo de código-fonte aberto por causa disso, campo que não fecha em
duas tentativas vira `desconhecido`. Ele escreve `{pasta-da-run}/projeto.md` e diz em uma linha do
retorno que levantou o cartão. **A ausência de `projeto.md` não é motivo de parada da Etapa 0.**

---

## Workflow

### Etapa 0 — localizar a pasta da run (nível 0)

Sem ler código, sem abrir o plano. Você precisa de duas coisas: **o caminho da pasta da run** e,
quando ela tem `ondas.md`, **qual onda é a corrente**.

- **O dev passou o caminho** — use-o.
- **O dev não passou** — liste os candidatos numa chamada e pegue o mais recente que tenha um
  plano:

  ```bash
  ls -dt .claude/tmp/orquestracoes/*/ | head -5
  ```

  Se houver mais de um candidato plausível, `AskUserQuestion` com a lista. Esta é a única pergunta
  que a skill admite fora da exceção destrutiva, e ela acontece **antes** do primeiro disparo:
  implementar o plano errado desperdiça a run inteira.

Um `ls` da pasta responde às duas perguntas de uma vez, e de brinde diz se há `projeto.md` — sem
ele, a Etapa 3 é quem levanta o cartão (ver "O cartão do projeto é a entrada de fatos"), e isso não
para a Etapa 0:

```bash
ls .claude/tmp/orquestracoes/{pasta}/
```

- **A pasta tem `ondas.md`** — abra-o, e só ele. Ele diz qual onda está `planejada` e ainda não foi
  implementada: essa é a sua, o plano dela é o que a tabela nomeia, e daí sai o sufixo que todo
  arquivo desta run vai carregar. Duas paradas, e nenhuma delas é pergunta:

  - **A onda corrente está `pendente`, sem plano** — pare e aponte
    `/task-especificar-e-planejar {pasta}`. Onda pendente é onda que ninguém planejou, e
    implementar sem plano é a metade autônoma decidindo o que o dev não aprovou.
  - **Todas as ondas estão `implementada`** — pare e diga isso. A task acabou.

  Ler o `ondas.md` é a única leitura de arquivo da run que você faz na skill inteira, e ela existe
  porque sem ela você não sabe qual plano disparar.

- **Falta o `spec.md` ou o plano da onda corrente** — pare e diga ao dev qual dos dois falta,
  apontando `/task-especificar-e-planejar`. Esta skill não planeja e não especifica; sem os dois
  arquivos ela não tem contrato para provar, e uma run que roda sem `spec.md` entrega código que
  ninguém sabe validar.

Escreva o cabeçalho do `log-implementacao.md` na mesma pasta, com o sufixo da onda quando houver, e
siga direto. Não abra nem o plano nem o `spec.md`: quem precisa deles são os filhos, e as contagens
que vão no cabeçalho chegam no primeiro retorno da Etapa 3.

### Etapa 3 — implementação (sonnet)

```text
subagent_type: 'general-purpose'
model: 'sonnet'
description: 'impl-{slug}'
```

Passe os caminhos de `prompts/implementador.md`, `{pasta-da-run}/plano.md`,
`{pasta-da-run}/spec.md` e `{pasta-da-run}/projeto.md` (o cartão, ou o aviso de que ele ainda não
existe), mais o caminho da pasta da run. Numa `k == 1`, se `reconhecimento.md` existir, o caminho
dele também vai — o implementador o lê só nas quatro coisas de "O cartão do projeto é a entrada de
fatos" mais o veredito de dificuldade.

O `spec.md` vai junto porque cada passo do plano cita o `RT-00N` que implementa, e o texto do
requisito está na spec. Quando o passo e o `RT` divergem, quem manda é o `RT`: o passo é a receita,
o `RT` é o que a Etapa 4 vai provar.

O prompt já obriga o filho a rodar, antes de retornar, **o comando de verificação** que o cartão
nomeia, na ordem em que ele o escreve, a partir da raiz. Quando o cartão diz
`comando de verificação: nenhum`, não há gate estático, e a fronteira do checkpoint passa a ser "o
lote é julgável sozinho e nada que ele deixou está pela metade".

Se o plano tocar o **mecanismo de fixtures**, os gates dele entram na mesma rodada — o comando de
verificação e, se o cartão disser como rodar um alvo só, o comando de teste restrito a ele.

Depois de os gates passarem, ele **comita o próprio trabalho** e devolve no retorno a branch, a
base da run, o hash curto do commit e as **lanes** que o plano definiu. Gate vermelho não
vira commit: nesse caso ele retorna sem comitar e diz isso no veredito.

Quatro coisas vêm do plano por ele, porque ele é o primeiro agente que abre o `plano.md` e você não
vai abri-lo: as **lanes** do `## Plano de teste`, que escolhem os testers da Etapa 4; o **total de
checkpoints**, que a cadência de review usa; os **marcos de validação**, com o checkpoint de cada um
e os `RT` que ele prova; e o **veredito de `## Fixtures`** (`sincronizar` | `estender` |
`sem mudança` | `sem mecanismo`). A elas se somam duas que não saem do plano: o **veredito de
dificuldade** — o `plano.md` não tem seção para isso, e ele sai do `reconhecimento.md` que o
implementador leu (ver "O cartão do projeto é a entrada de fatos"); sem `reconhecimento.md`, ele
deriva do `## Marcos de validação` do plano e o implementador diz isso no retorno — e **se ele
mesmo levantou o cartão do projeto**, quando a pasta chegou sem `projeto.md`. As quatro do plano
mais essas duas vão para o cabeçalho do ledger, uma vez só.

**O plano agrupa os passos em checkpoints**, na seção `## Passos`, e cada checkpoint é uma
fronteira onde o comando de verificação passa e o lote é julgável sozinho. O implementador implementa só até
o **primeiro** e retorna ali, em vez de seguir até o fim do plano. Ele registra no
`implementacao.md` quais passos e quais `RT` entraram naquele checkpoint e devolve, além do resto,
**qual checkpoint este é, de quantos, e se restam outros**. O total sai da contagem que ele faz ao
abrir o plano e não muda durante a run. Plano de um checkpoint só é o caso comum: ele implementa
tudo de uma vez.

Teste **não** roda neste ponto, nem por checkpoint: a Etapa 4 é sempre depois do último
checkpoint. Checkpoint fechado só pode ir para a Etapa 3.5 (revisão) — e nem sempre vai logo, que
é o que a cadência da seção seguinte decide.

Guarde o `agentId` do implementador: as Etapas 3.5 e 5 o reusam por `SendMessage`.

Anote no ledger: checkpoint (qual, de quantos, e se restam outros), arquivos alterados, gates
passaram ou não, branch, base da run, hash do commit, lanes e veredito de Fixtures. O total de
checkpoints, as lanes, os marcos e os dois vereditos (Fixtures e dificuldade) vão no cabeçalho do
ledger, uma vez só.

### Etapa 3.5 — review de padrões e de código (sonnet)

```text
subagent_type: 'general-purpose'
model: 'sonnet'
description: 'review-{slug}-r{n}'
```

Um revisor só, com duas lentes numa passada: os **padrões de escrita de código** do repo — as
**skills de contexto** que o cartão nomeia para a **unidade afetada**, e sem nenhuma, o
`## Padrão da vizinhança` do `reconhecimento.md` — e a **correção do código** em si (erro de
lógica, caminho de erro, estado de borda, tipo frouxo, contrato quebrado, passo do plano pela
metade). Ele também reroda o **comando de verificação** do cartão, em modo leitura, para conferir
o que o `implementacao.md` afirmou.

Passe os caminhos de `prompts/revisor.md`, `{pasta-da-run}/plano.md`, `{pasta-da-run}/spec.md`,
`{pasta-da-run}/projeto.md` e `{pasta-da-run}/implementacao.md`, mais o caminho de
`reconhecimento.md` (leitura dirigida, ver "O cartão do projeto é a entrada de fatos") e o caminho
da pasta da run, o número da rodada e **quais checkpoints esta rodada revisa**: o lote, que é uma
faixa (`checkpoints 3 a 7`) ou um número só, quando o lote fechou com um checkpoint. O revisor
precisa desses números: é por eles que ele recorta os arquivos do lote corrente e deixa em paz o
que um lote anterior já fechou.

**O revisor não prova a lane `codigo`.** Ele pergunta se o código está bom; o `tester-codigo` da
Etapa 4 pergunta se o código cumpre o `RT`. São dois julgamentos, e mantê-los separados é o que faz
um `reprovado` dizer sozinho que o problema é qualidade e um FAIL dizer sozinho que o problema é a
spec.

O `review-{n-1}.md` só entra quando a rodada anterior **reprovou este mesmo lote**. Rodada que abre
um lote novo não leva review nenhum: o anterior julgou outro trecho, e reabri-lo é retrabalho.

O `n` é o contador de review da run, e ele corre independente do contador de teste da Etapa 4: um
review disparado depois de um FAIL de teste continua a contagem de review, não a de teste.

Ele devolve `review-{n}.md` e um veredito: `aprovado` ou `reprovado`.

#### A cadência: um lote a cada ~5 checkpoints, e sempre no último

O implementador devolve, a cada retorno da Etapa 3, `checkpoint {k} de {N}`. A regra que decide se
o revisor sobe é aritmética, e você a aplica sem abrir arquivo nenhum. Assim que o primeiro retorno
da Etapa 3 te der o `{N}`, calcule os cortes uma vez e use a mesma lista até o fim da run:

- **`L`, o número de lotes** — `N ÷ 5` arredondado para o inteiro mais próximo, com mínimo 1. Em
  conta inteira: `L = (N + 2) ÷ 5` descartando a fração, e se der `0`, `L = 1`.
- **Os cortes** — cada lote leva `N ÷ L` checkpoints, e os primeiros `N % L` lotes levam um a mais.
  O revisor sobe no **último checkpoint de cada lote**.
- **Todo checkpoint de marco é um corte, e ele substitui o corte aritmético do lote em que cai.**
  O marco põe um tester no meio da run, e a regra de que nenhuma linha chega ao tester sem ter
  passado por um revisor não abre exceção para ele. Substituir em vez de somar é o que evita duas
  rodadas de review encostadas: num plano de 10 com cortes em 5 e 10, um marco no checkpoint 4 faz
  os cortes virarem 4 e 10 — o primeiro lote fica um checkpoint mais curto, e é só isso.

Plano de até 7 checkpoints cai em lote único e leva uma rodada só, no fim. De 8 a 12, `L` é 2 e o
corte cai bem na metade. De 13 em diante, os lotes voltam a ficar em torno de 5:

| `N` | `L` | Lotes | Review dispara em |
| --- | --- | --- | --- |
| 1–7 | 1 | o plano inteiro | `N` |
| 8 | 2 | 4 + 4 | 4, 8 |
| 10 | 2 | 5 + 5 | 5, 10 |
| 12 | 2 | 6 + 6 | 6, 12 |
| 13 | 3 | 5 + 4 + 4 | 5, 9, 13 |
| 15 | 3 | 5 + 5 + 5 | 5, 10, 15 |
| 20 | 4 | 5 + 5 + 5 + 5 | 5, 10, 15, 20 |
| 10, marco em 4 | 2 | 4 + 6 | 4, 10 |

- **`k` fecha um lote — e `k == N` e todo checkpoint de marco sempre fecham** — dispare o revisor
  sobre o lote fechado: os checkpoints desde a última rodada de review até `k`.
- **Qualquer outro `k`** — não dispare revisor. Mande o implementador seguir direto para o próximo
  checkpoint via `SendMessage` para o `agentId` guardado na Etapa 3, sem passar caminho de review
  nenhum, exatamente como no caso `aprovado` com checkpoint restante.

Num plano de 10 checkpoints isso dá 2 rodadas de review (lotes 1–5 e 6–10) em vez de 10; num de 4,
dá uma só. Plano sem checkpoint não muda: uma rodada, no fim, sobre a implementação inteira. O `n`
continua sendo o contador da run inteira e sobe de lote para lote, sem reiniciar.

**Por que em lote de ~5.** O caro de uma rodada de review não é o diff: é a ignição. Todo revisor
é fresco — carrega as skills de contexto do cartão para a unidade tocada, abre o `plano.md` e o
`implementacao.md`, diffa contra a base da run e reroda o comando de verificação antes de julgar a
primeira linha. Essa parte custa igual para um checkpoint ou para cinco, e é ela que se
paga uma vez por lote, não uma por checkpoint. O diff, que é a parte que de fato cresce com o lote,
é a parte barata da conta — e o lote maior ainda economiza o que o revisor de um checkpoint
minúsculo gastava para descobrir que não havia quase nada para olhar.

**Por que não uma rodada só, no fim.** Dois motivos, e nenhum é gosto. O primeiro é o custo do erro
tardio: checkpoint errado vira base do checkpoint seguinte, e o conserto deixa de ser uma linha
para virar cascata — o implementador continua vivo e com o diff na janela, mas o trabalho que ele
desfaz cresce a cada checkpoint construído por cima do erro. O segundo é o teto de 150k: o diff da
run inteira numa passada só empurra o revisor para `handoff`, e `handoff` é um revisor fresco a
mais — a rodada que a economia prometia poupar volta pela porta dos fundos, agora sem o proveito de
ter olhado o código cedo. O lote de ~5 é a troca escolhida: pega o erro antes de ele virar alicerce
sem pagar ignição a cada passo. Ele aceita, em plano grande, que um lote não caiba nos 150k — e é
para isso que o `handoff` do revisor existe, com o revisor fresco da mesma rodada retomando pelo
`review-{n}.md`.

O que o veredito do revisor decide:

- **`aprovado`, e restam checkpoints** — mande o implementador continuar via `SendMessage` para o
  `agentId` guardado na Etapa 3, sem passar nenhum caminho de review (não houve reprovação). Ele
  implementa até o próximo checkpoint e retorna; daí a cadência acima decide se a Etapa 3.5 sobe
  de novo, com `n+1`, ou se ele segue direto. Os `nits` de cada rodada aprovada não voltam ao
  implementador; eles se acumulam para o relatório final, na Etapa 7.
- **`aprovado`, e não resta checkpoint** — a implementação inteira do plano já foi revisada. Siga
  para a Etapa 4.
- **`reprovado`** — mande o implementador consertar via `SendMessage` para o `agentId` guardado na
  Etapa 3, passando o **caminho** do `review-{n}.md`. Ele fecha a rodada com o commit dela. Quando
  ele retornar, dispare um revisor **fresco** com `r{n+1}`, passando também o caminho do
  `review-{n}.md`. Isso acontece **dentro** do lote atual — só depois de aprovado é que se decide
  se avança para o próximo lote ou para a Etapa 4.

**Por que aqui, antes do teste.** O tester só sabe exercitar o comportamento de fora. Erro que ele
não consegue provocar e desvio de padrão que ele nunca vê saem nesta etapa ou não saem de lugar
nenhum. E consertar agora é barato: o implementador ainda está vivo, com o diff na janela. É por
isso que o `k == N` da cadência não é negociável — ele é o que garante que nenhuma linha chegue ao
tester sem ter passado por um revisor.

**Por que um revisor fresco por rodada.** A janela dele não acumula entre rodadas, e a rodada 2 tem
escopo pequeno de propósito: checar os blockers da rodada anterior e procurar o que o conserto
quebrou. Reusar o revisor por `SendMessage` guardaria pouco e o empurraria para o teto justamente
na rodada em que ele precisa reler o diff.

#### O laço vai até aprovar, e o teto é a janela

Esta etapa **não tem limite de rodadas**. Ela roda até `aprovado`, e o que a limita é o teto de
150k dos dois agentes envolvidos:

- **Implementador com `handoff`** — dispare um implementador **fresco** com os caminhos de
  `{pasta-da-run}/plano.md` e `{pasta-da-run}/implementacao.md`, mais o
  `{pasta-da-run}/review-{n}.md` **se houver conserto pendente**; num avanço de checkpoint não há
  review para passar — nem quando a cadência pulou a rodada —, e o sucessor descobre onde retomar
  pela seção `Checkpoints` do `implementacao.md`. Guarde o `agentId` novo: ele é o destinatário dos `SendMessage` seguintes,
  aqui e na Etapa 5. O `implementacao.md` vai junto também porque é lá que mora a `Base da run` —
  o sucessor a mantém, e o revisor continua diffando contra ela.
- **Revisor com `handoff`** — dispare um revisor fresco da mesma rodada, passando o `review-{n}.md`
  parcial que ele deixou. Ele continua pelos arquivos do diff que ficaram sem olhar.

Registre todo handoff no ledger, na seção `Handoffs`.

Se algum dos dois voltar com **`preso`** em vez de `handoff`, leia o motivo do retorno antes de
relançar: progresso real só longo vira sucessor fresco, laço de verdade vira blocker. Relançar um
laço sem mudar nada paga o mesmo laço de novo.

Três casos param o laço, porque nenhuma rodada extra os resolve:

- **Blocker `intocado` em duas rodadas seguidas.** O implementador não está conseguindo consertar,
  e a terceira tentativa é a mesma. Feche como bloqueado e leve o blocker ao dev.
- **`preso` que você julgou laço.** O mesmo gate não passa, o mesmo comando repete, a dependência
  não sobe. Feche como bloqueado com o motivo que o filho reportou.
- **O revisor preencheu `Plano em dúvida` apontando o plano como causa.** A correção certa é
  refazer o plano, não o código: mandar o implementador consertar produz uma volta que a rodada
  seguinte reabre. Isto **não fecha mais a run** — vá para a Etapa 5.5 e deixe o adaptador julgar.
  Se ele voltar `sem-adaptacao`, o plano não era o problema e o laço de review continua de onde
  parou, agora sabendo que o passo está certo.

Anote no ledger: rodada, o lote de checkpoints que ela cobriu, veredito, quantos blockers, em uma
linha o que reprovou, e o hash do commit da correção quando houve uma.

### Etapa 4 — validação (sonnet), um tester por lane

A validação roda em dois momentos, e é o plano que decide se o primeiro existe:

- **Validação de marco** — só quando o plano declarou algum em `## Marcos de validação`. Roda no
  checkpoint que o marco nomeia, depois de o lote dele ter passado pela Etapa 3.5 aprovado, e prova
  **apenas os `RT` que o marco lista**, nas lanes que ele lista. Task `simples` não tem marco, e
  então esta metade não existe.
- **Validação final** — sempre, depois que o lote do último checkpoint tiver passado pela Etapa 3.5
  aprovado. Prova **todos** os `RT` da spec, inclusive os que um marco já provou: checkpoint
  construído depois pode ter quebrado o que passou antes, e um `PASS` de marco não é crédito
  permanente.

**Não invente validação em checkpoint que não é marco.** O custo de subir as unidades e fabricar cenário
se paga em risco declarado, não em toda fronteira — e quem sabia onde o risco estava foi o
planejador, que leu o código e já escreveu a resposta. Passo do plano que peça "rode o teste aqui"
sem ser marco vira, nesta skill, só mais um checkpoint, e ele entra na cadência de review da Etapa
3.5.

As lanes vêm do `## Plano de teste` e chegaram a você no retorno do implementador. **Uma lane, um
tester.** Dispare todos os da rodada **na mesma mensagem**: as chamadas `Agent` saem no mesmo turn,
cada retorno chega por notificação própria, e isso é barreira paralela sem nenhum agente de espera.

| Lane | `subagent_type` | Prompt |
|---|---|---|
| `curl` | `general-purpose` | `prompts/tester-curl.md` |
| `browser` | `browser-tester` quando `ls .claude/agents/` mostrar esse agente; senão `general-purpose` com as tools de browser | `prompts/tester-browser.md` |
| `teste` | `general-purpose` | `prompts/tester-teste.md` |
| `codigo` | `general-purpose` | `prompts/tester-codigo.md` |

`model: 'sonnet'` nos quatro. `description`: `teste-{slug}-{lane}-r{n}`, com `n` = número da
rodada.

Passe a cada um os caminhos de `{pasta-da-run}/plano.md`, `{pasta-da-run}/spec.md`,
`{pasta-da-run}/projeto.md`, `{pasta-da-run}/implementacao.md` e `formats/teste.md`, mais o caminho
da pasta da run e o número da rodada.

As lanes `browser` e `teste` recebem no plano de teste o **roteiro de comprovação**: a lista
numerada de provas que o dev fechou no gate da Etapa 7 da outra skill, cada uma com a ação, o que
precisa estar visível e a rodada em que sai. O tester produz aquelas provas e nem uma a mais, e o
nome do PNG em disco leva o id da prova. Você não abre o roteiro; ele chega ao tester pelo
`plano.md`, e o que volta para você é uma linha por `RT`, como nas outras lanes.

As linhas `ambiente` e `url` do plano de teste dizem **qual comando sobe o ambiente e onde a
primeira prova de tela começa**, e as duas vão no delta junto dos caminhos. Um projeto costuma ter
mais de uma variante de subida e elas não são intercambiáveis: comando escolhido pelo tester por
conta própria é uma hora perdida, não um FAIL.

**Numa validação de marco, passe também o escopo**: que é o marco `{m}`, quais `RT` provar e o
checkpoint em que a implementação está. Sem essa linha o tester tenta provar `RT` cujo código ainda
não existe e devolve FAIL em requisito que ninguém implementou — um FAIL falso que dispara uma
rodada de correção inteira contra nada.

**Dispare só as lanes que aparecem na linha `lane:` do plano** — e numa rodada de marco, só as
lanes do marco, que costumam ser menos. Um plano pode ter muitos casos e
continuar sendo uma lane só: caso é o que se exercita, lane é com que ferramenta. Subir o
`browser-tester` num plano sem tela é pagar o navegador para não ver tela nenhuma, e disparar o
`tester-codigo` sem nenhum `RT` dessa lane é um spawn que devolve uma lista vazia.

Validação é observação, não conserto: os três prompts proíbem editar código da unidade.

#### O que cada tester devolve

Uma linha por `RT` da lane dele, no formato de [`formats/teste.md`](formats/teste.md):

```text
RT-003 (AC-001) PASS
RT-004 (AC-002) FAIL — retorna 500 quando o retry é o terceiro
```

Junte as linhas das lanes e **some as `AC`**: uma `AC` está entregue quando todo `RT` que a serve
passou. A conta e as duas ressalvas estão na seção "A validação é por `RT`" acima.

**Rodada com qualquer `RT [MUST]` em FAIL vai para a Etapa 5.** O `teste-{n}-{lane}.md` da lane que
reprovou é o que volta ao implementador — se duas lanes reprovaram, os dois caminhos vão.

**Rodada de marco que passou inteira não fecha nada**: mande o implementador seguir para o próximo
checkpoint como num `aprovado` de review. O marco provou que a base está de pé, e é só isso que ele
prometia.

**Na rodada seguinte, redispare só as lanes que reprovaram.** `PASS` não expira dentro da run, e o
que protege contra a regressão que o conserto introduziu é a Etapa 3.5, que roda obrigatoriamente
entre a correção e a nova validação e olha justamente o diff do conserto. Redisparar todas a cada
rodada paga a conferência do pré-requisito de ambiente, a subida das unidades e a fabricação de
estado de novo, para reconfirmar
`RT` que ninguém tocou.

**Lane indisponível é BLOCKER, não FAIL.** Uma lane está indisponível quando o campo do cartão que
ela exige diz `nenhum`: `comando de teste: nenhum` fecha a lane `teste`, `comando de ambiente:
nenhum` fecha as lanes `browser` e `curl`. Nesse caso ela não "assume um padrão" e você não escolhe
um comando por ela. Se o `## Cobertura` do plano ainda atribuiu um `RT` a uma lane fechada, o
reconhecimento contradisse o próprio cartão, e o defeito é de planejamento: dispare a lane, o
tester devolve **BLOCKER** nomeando o campo que está `nenhum`, e a run fecha **bloqueada**, sem
push, apontando `/task-especificar-e-planejar {pasta}`. Não é um quarto gatilho da Etapa 5.5 — o
plano não está errado no caminho, está errado na premissa, e quem conserta premissa é a skill de
planejamento.

#### O pré-requisito e o estado

**As lanes `curl`, `browser` e `teste` conferem o pré-requisito de ambiente**, e a barreira
paralela não atrapalha: quem confere antes de subir encontra o serviço já de pé quando outra lane
subiu primeiro. A lane `teste` precisa dele tanto quanto as outras duas — o campo
`pré-requisito de ambiente` do cartão diz de que serviço a suíte deste projeto depende, e sem ele
ela falha por ambiente, não por asserção. A lane `codigo` não confere nada, porque a prova dela é
estática.

Pré-requisito ausente não vira rodada de correção: não é o código que está errado, é a máquina sem
o serviço. O tester devolve BLOCKER com o motivo, e a run fecha bloqueada, sem push.

Com o pré-requisito de pé, o tester roda o comando da linha `estado` para fabricar o estado de
partida e reporta o comando e os identificadores que ele imprimiu. Comando que não roda também é
BLOCKER, e não FAIL: sem estado não existe checagem, e o código não é o culpado. Comando que rodou
mas não alcança o cenário é o mesmo BLOCKER, com o que faltou nomeado — é essa linha que vira a
extensão do mecanismo de fixtures na próxima passada de planejamento.

Anote no ledger: por lane, os `RT` com veredito e a linha `status=` do gate; depois a seção
`Cobertura por RT` e a `Veredito por AC`, que você monta somando as lanes.

### Etapa 5 — correção (sonnet), no máximo 25 rodadas

Se a Etapa 4 deu FAIL em algum `RT [MUST]`:

1. Mande o implementador consertar via `SendMessage` para o `agentId` guardado — ele ainda tem o
   contexto da implementação, e reusá-lo é mais barato que um filho fresco. Passe o **caminho** do
   `teste-{n}-{lane}.md` de cada lane que reprovou, não o conteúdo. Ele fecha a rodada com o commit
   dela.
2. Se o implementador tiver retornado com `handoff`, dispare um implementador **fresco** com os
   caminhos de `{pasta-da-run}/plano.md`, `{pasta-da-run}/spec.md`,
   `{pasta-da-run}/implementacao.md` e os `teste-{n}-{lane}.md` que reprovaram.
3. Passe o conserto pela Etapa 3.5, no próximo número da contagem de review, e só então volte à
   Etapa 4 com `n+1`. O código que o tester exercita é sempre código revisado, e essa rodada de
   review sai barata: o revisor fresco só olha o que mudou desde o `review` anterior.

**Na terceira rodada de FAIL do mesmo `RT`, pare de consertar e vá para a Etapa 5.5.** Três
consertos que não movem o mesmo requisito não são um bug a mais na fila: é o plano descrevendo um
caminho que não chega onde o `RT` pede. Insistir daí em diante paga a mesma rodada de novo, e o
implementador não tem autoridade para trocar o caminho — só o adaptador tem.

**Pare na vigésima quinta rodada de teste.** O teto conta o `n` da Etapa 4 — rodadas de teste, e
só elas. Adaptação não gasta rodada e não a devolve: ela troca o caminho que as rodadas seguintes
vão exercitar, e a contagem segue de onde estava.

Vinte e cinco rodadas de teste não são um bug a mais para corrigir. Nesse ponto o laço de correção
já tentou, o adaptador já usou as duas adaptações dele, e o que sobra é a spec — que não é sua para
mexer. Encerre, escreva no ledger o que falhou nas rodadas e leve ao dev como bloqueio, sem tentar
a vigésima sexta. Spec errada volta para `/task-especificar-e-planejar`.

### Etapa 5.5 — adaptar o plano (sonnet ou opus), no máximo 2 vezes

Esta etapa é condicional e existe para um caso só: **o defeito está no plano, não no código.** Ela
é o que separa uma run que termina de uma run que morre — antes dela, plano errado fechava a task
como bloqueada e devolvia tudo para a skill de planejamento, gastando de novo a metade que o dev
já tinha aprovado.

Três gatilhos, e nenhum outro:

1. **Terceira rodada de FAIL do mesmo `RT`** na Etapa 5.
2. **`Plano em dúvida` preenchido pelo revisor** apontando um passo do plano como causa.
3. **Marco reprovado** cuja correção não passou em duas rodadas. Este é o gatilho que paga melhor:
   você está no checkpoint 4 de 10, com seis checkpoints ainda por escrever, e é exatamente aí que
   adaptar plano futuro vale algo.

```text
subagent_type: 'general-purpose'
model: 'sonnet' se a task é simples | 'opus' se é complexa
description: 'adapta-{slug}-r{n}'
```

Passe os caminhos de `prompts/adaptador.md`, `{pasta-da-run}/spec.md`, `{pasta-da-run}/plano.md`,
`{pasta-da-run}/implementacao.md` e o do julgamento que disparou a etapa — o `teste-{n}-{lane}.md`
que reprovou, o `review-{n}.md` com o `Plano em dúvida`, ou os dois.

#### A `AC` vence, e é isso que o adaptador otimiza

O adaptador reescreve `plano.md` e **nunca** `spec.md`. A `AC` é a expectativa que o dev aprovou; o
`RT` é a tradução técnica dela, escrita antes de alguém ter tocado o código. Quando a realidade
mostra que a tradução estava errada, a tradução muda — a expectativa não.

Ele escolhe pela ordem de preferência do prompt, e ela é a razão de esta etapa existir: outro
caminho técnico para a mesma `AC` primeiro, a `AC` inteira por um caminho mais caro depois, `AC`
com desvio declarado em terceiro, e `AC` não entregue só em último recurso. **Custo é desempate,
nunca o primeiro critério.**

#### O que cada veredito decide

- **`adaptado`** — o plano futuro mudou e toda `AC` segue inteira. Dispare um implementador
  **fresco** com os caminhos do `plano.md` novo e do `implementacao.md`, mais o `adaptacao-{n}.md`.
  Fresco, não `SendMessage`: a janela do anterior carrega o plano velho inteiro, e é justo o plano
  velho que acabou de ser trocado. Guarde o `agentId` novo. Depois siga a cadência de review
  normalmente — o checkpoint adaptado é um lote como qualquer outro.
- **`adaptado-com-desvio`** — igual, e o `RT` desviado entra em `## Desvios da spec`. Ele sai do
  relatório final na língua da `AC`, dizendo o que o dev perde, não qual `RT` caiu.
- **`adaptado-com-ac-em-risco`** — igual, e a `AC` afetada vai para o relatório final como **não
  entregue**, com o motivo. A run continua e entrega as outras. Não maquie isso como desvio: `AC`
  que caiu é a informação mais importante que o relatório carrega, e a run que a esconde entrega
  algo que o dev não pediu sem ele saber.
- **`sem-adaptacao`** — o plano está certo e a execução não. Nada mudou em disco. Volte de onde
  você veio: o laço de correção da Etapa 5 ou o de review da Etapa 3.5, agora com uma informação
  que você não tinha, que é a de que reescrever plano não resolve.

**Teto de duas adaptações por run.** Se um terceiro gatilho disparar, pare: duas reescritas de plano
que não fecharam a task apontam para a spec, e spec é decisão do dev. Feche como bloqueado com o
motivo e aponte `/task-especificar-e-planejar`.

Se o adaptador voltar com `handoff`, dispare um adaptador fresco com o `adaptacao-{n}.md` parcial —
mas confira a linha `plano:` do retorno: se ela diz `reescrito` pela metade, o sucessor precisa
saber disso, porque plano parcialmente reescrito é pior que plano velho.

Anote no ledger: gatilho, veredito, checkpoints reescritos, cobertura nova, e a `AC` afetada com o
que aconteceu com ela.

### Etapa 6 — atualizar a documentação de contexto (sonnet)

```text
subagent_type: 'general-purpose'
model: 'sonnet'
description: 'contexto-{slug}'
```

Roda **depois de a Etapa 4 dar PASS**, e só então. Código que não passou no teste está num estado
que ninguém quer ver descrito como se fosse a verdade do sistema: se a task fechou bloqueada, pule
esta etapa e diga isso no relatório.

Passe os caminhos de `prompts/atualizador-contexto.md`, `{pasta-da-run}/spec.md`,
`{pasta-da-run}/projeto.md` e da pasta da run.

O trabalho dele tem duas metades. A primeira é **garantida**: cada `AC` marcada com `(rn)` no
`spec.md` vira uma regra registrada na **doc de contexto** que o campo `docs de contexto` do
cartão nomeia. O dev declarou aquilo regra de negócio no gate da spec, então isso não passa por
filtro de relevância e não se rejulga aqui. Quando o cartão diz `docs de contexto: nenhuma` e
`memória do projeto: nenhuma`, não há destino durável neste repo: as regras saem como linhas
prontas para colar em `## Pendente` do `contexto.md`, o retorno é `sem destino`, e isso **não** é
ressalva — é o dev quem decide onde elas moram. A segunda metade é a varredura de sempre: ele
carrega a **skill de varredura de contexto** que o campo `skills de contexto` do cartão apontar, e
segue o workflow dela. Sem nenhuma apontada, a Etapa 6 é só a metade garantida do item 0, e ele
devolve `sem varredura`.

Ele escreve `contexto.md` e comita a documentação junto do arquivo de pontos de revisão que a
skill de varredura mantém, quando há uma.
Como o código da run já está comitado, o `HEAD` que aquela skill usa como fronteira já contém a
task inteira — que é a fronteira certa para o ponto de revisão que ela grava.

Por que isto é uma etapa e não um detalhe do implementador: a doc de contexto do projeto é o que
**todo** agente deste repo lê antes de planejar. Ela carrega regra de negócio e fluxo de sistema,
então uma regra que mudou no código e não mudou lá vira um plano errado na próxima task — e o erro
só aparece quando a implementação já está pronta. O implementador, no fim da janela dele e com a
cabeça no diff, é o pior agente possível para esse julgamento.

O corte é estreito de propósito, e o prompt do filho o carrega: entra o que mudou regra, contrato,
passo de fluxo ou efeito colateral. Refatoração, renomeação interna, formatação, bump de
dependência e teste não encostam na documentação. Filho que não achou nada para mudar retorna `sem
alteração`, e isso é um resultado bom.

**`AC (rn)` que tinha destino e não foi registrada fecha a run com ressalva**, e o relatório final
diz qual. A spec morre com a task, então regra não registrada agora é regra perdida.

Anote no ledger: unidades em escopo, quantas `AC (rn)` foram registradas sobre o total, docs alterados
ou `sem alteração`, e o hash do commit de docs.

### Etapa 7 — push e relatório final (nível 0)

Se o veredito é `entregue` ou `entregue com ressalvas`, publique a branch — uma chamada, e é o
único `git` que você roda na run inteira:

```bash
git push -u origin HEAD
```

Se o veredito é `bloqueado`, **não dê push**: os commits ficam locais e o relatório diz isso. Numa
run em ondas, cada onda dá o próprio push da mesma branch, no fim dela.

**Se a run tem `ondas.md` e o veredito não é `bloqueado`**, marque a onda como `implementada` na
tabela dele. É a única escrita sua fora do ledger, e ela existe porque é essa linha que a próxima
sessão de planejamento lê para saber onde a task parou: sem ela, a onda seguinte não sabe que pode
começar.

Feche o `log-implementacao.md` e responda ao dev com:

- **Veredito**: entregue, entregue com ressalvas, ou bloqueado.
- **O que o dev recebe**, uma linha por `AC`, na língua da `AC`:

  ```text
  AC-001  entregue
  AC-002  entregue com ressalva — RT-005 usou a segunda alternativa da lista (quebrar em duas
          mensagens em vez de estourar o limite)
  AC-003  não entregue — RT-007 reprovou: a mensagem de coleta não abre com "Etapa X de N"
  ```

  Esta é a primeira seção do relatório, e é a única que responde a pergunta do dev. A lista de
  `RT` é o detalhe que sustenta cada linha, e ela vem depois.
- **Provas em disco**: quantos PNG a validação produziu e o caminho da pasta `screenshots/`, em
  link markdown. É o que o dev abre para ver a entrega dele com os próprios olhos, e cada arquivo
  leva o id da prova que ele aprovou no gate do roteiro.
- **Cobertura**: `{N}/{N} RT` com veredito, por lane, e os que ficaram `n/d` com o motivo. Numa
  onda, a conta é sobre os `RT` desta onda.
- **Onda**, quando a run tem `ondas.md`: qual onda fechou, o que ela entrega na língua das `AC`, e
  os `RT` que continuam pendentes da próxima. Eles não são `n/d` nem desvio, e a diferença importa:
  ninguém tentou prová-los ainda porque o código deles não existe. Feche com a linha que planeja a
  próxima onda, agora contra o código que esta acabou de escrever:

  ```text
  /task-especificar-e-planejar .claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/
  ```
- **Desvios da spec**: os `RT` que o plano declarou que não cumpriria. O dev os viu no gate do
  plano, mas ele fecha a task olhando esta lista.
- **O que mudou**: arquivos, em links markdown clicáveis.
- **Adaptações do plano**, quando houve: o gatilho, o que o adaptador trocou e qual `AC` isso
  protegeu. Se alguma adaptação custou uma `AC`, ela já apareceu como `não entregue` na primeira
  seção — aqui vai o porquê. O dev aprovou um plano no gate e recebeu outro: esta seção é onde ele
  descobre isso, e ela não é opcional.
- **Marcos de validação**, quando o plano tinha algum: em que checkpoint cada um rodou e o que ele
  pegou. Marco que reprovou e virou adaptação é a prova de que o marco se pagou.
- **Review**: quantas rodadas até `aprovado`, e os `nits` que o revisor deixou. Nit não foi
  consertado por ninguém, então quem decide se ele vale uma task é o dev.
- **Como foi provado**: as lanes que rodaram, o pré-requisito que respondeu (a linha de veredito do
  tester) e o comando que fabricou o estado de partida.
- **Fixtures**: `sincronizar`, `estender`, `sem mudança` ou `sem mecanismo`. Se a run estendeu o
  mecanismo, nomeie o cenário que passou a existir: é o que o dev reusa na próxima task, e o
  arquivo que o cartão aponta como contrato do mecanismo já o descreve.
- **Regras de negócio registradas**: as `AC (rn)` que a Etapa 6 gravou na doc de contexto do
  projeto, uma linha cada, com o arquivo que as recebeu — ou, quando o cartão não tinha destino, a
  lista de regras em `sem destino` que o dev ainda precisa acomodar. Se alguma ficou de fora sem
  ser por falta de destino, diga qual: a spec morre com a task e ela não estará em lugar nenhum.
- **Documentação de contexto**: os docs que a Etapa 6 alterou, ou `sem alteração`, ou `sem
  varredura` / `sem destino` com o motivo.
- **Premissas assumidas**: as que você e os filhos travaram sozinhos. Esta seção não é opcional —
  é onde o dev descobre o que decidiram por ele, e nesta metade da orquestração ninguém perguntou
  nada.
- **Commits e push**: a branch, os commits da run em uma linha cada (hash curto e mensagem), e o
  resultado do push — ou `não dado`, com o motivo, se a task fechou bloqueada.
- **Caminho da pasta da run**.

---

## Requirements

- A entrada desta skill é uma pasta de run com `spec.md` **e** o plano da onda corrente. Faltando
  um dos dois, ela para e aponta `/task-especificar-e-planejar`.
- **Task em ondas roda uma onda por execução.** O `ondas.md` diz qual é a corrente, todo arquivo da
  onda `k > 1` leva o sufixo `-o{k}`, e os três tetos (25 rodadas de teste, 2 adaptações, a
  cadência de review) contam por onda, sem herdar nada da anterior. A validação final prova os `RT`
  desta onda; os das próximas saem no relatório como pendentes, nunca como `n/d` nem como desvio.
- O nível 0 não lê, não edita e não roda comando de projeto. As únicas exceções são a escrita do
  ledger, a leitura do `ondas.md` e a marcação da onda como `implementada` nele, o `ls` da Etapa 0
  e o `git push` da Etapa 7.
- Ninguém chama `AskUserQuestion` depois do primeiro disparo. As exceções são a escolha da pasta
  da run na Etapa 0 e ação destrutiva ou externa. Toda outra ambiguidade vira premissa registrada.
- Todo disparo leva `model` explícito e `description` único. Sonnet em todo papel de execução; o
  adaptador é o único que paga Opus, e só quando a task é `complexa`.
- Todo prompt de filho vai como **caminho** para um arquivo de `prompts/`, com um delta curto.
  Ninguém cola corpo de prompt nem conteúdo de arquivo na chamada: o filho lê o que precisa por
  conta própria, e assim o texto nunca passa pelo contexto do nível 0.
- Todo filho escreve seu arquivo em disco antes de retornar e devolve no máximo 10 linhas.
- Nenhum código chega aos testers sem passar pela Etapa 3.5. O review é um agente só, com as duas
  lentes: padrões (as **skills de contexto** que o cartão nomeia para a unidade tocada, ou o
  `## Padrão da vizinhança` do reconhecimento sem nenhuma) e correção do código. Ele lê, julga e
  reroda o **comando de verificação** do cartão, em modo leitura; ele não edita arquivo do projeto
  e não prova a lane `codigo`, que tem tester próprio na Etapa 4.
- Nenhum fato de projeto está escrito nesta skill. Comando, unidade, convenção de teste, mecanismo
  de fixtures, memória e fluxo de dados persistentes saem do **cartão do projeto**
  (`{pasta-da-run}/projeto.md`), e o nível 0 nunca o lê.
- **Review roda a cada lote de ~5 checkpoints, e sempre no último**: com `L = (N + 2) ÷ 5` lotes
  (mínimo 1) de `N ÷ L` checkpoints cada, dispare-o quando o implementador fechar o último
  checkpoint de um lote — e `k == N` sempre fecha um —, sobre o lote desde a última rodada; nos
  demais o implementador segue direto. Checkpoint de marco é sempre um corte, substituindo o corte
  aritmético do lote em que cai. O `k == N` é o que sustenta a invariante da linha acima.
- **A validação roda nos marcos que o plano declarou e uma vez no fim**, nunca em checkpoint que
  não é marco. A rodada de marco prova só os `RT` do marco, nas lanes do marco; a final prova todos
  os `RT` da spec, inclusive os que um marco já tinha aprovado.

- **Um tester por lane, disparados na mesma mensagem**, e só as lanes que o plano lista. Cada um
  reporta uma linha por `RT` no formato de [`formats/teste.md`](formats/teste.md); nenhum julga
  `AC`.

- **O nível 0 soma as `AC`**: uma `AC` está entregue quando todo `RT` que a serve passou.
  `PASS com ressalva` não a derruba, e `RT` em `## Desvios da spec` não conta contra ela. O
  relatório final abre por `AC`, não por `RT`.

- **Todo `RT` da spec sai da Etapa 4 com veredito.** `RT` que nenhum tester conseguiu exercitar é
  `n/d` com o motivo, nunca PASS.
- O laço de review vai até `aprovado`, sem limite de rodadas. Quem o limita são os dois tetos do
  filho — 150k de janela e 60 turns: com `handoff`, entra um agente fresco daquele papel. Blocker
  `intocado` em duas rodadas seguidas e `preso` que o nível 0 julgou laço fecham a task como
  bloqueada. `Plano em dúvida` apontando o plano **não** fecha: vai para a Etapa 5.5.
- Blocker volta ao implementador; nit vai só para o relatório final.
- **Plano errado é adaptado, não devolvido.** Três FAILs do mesmo `RT`, `Plano em dúvida` do
  revisor ou marco reprovado que duas correções não resolveram disparam a Etapa 5.5, no máximo duas
  vezes por run. O adaptador reescreve só checkpoints futuros do `plano.md`, nunca o `spec.md`, e
  escolhe sempre o caminho que preserva a `AC` que o dev aprovou — custo é desempate. `AC` que ele
  não conseguiu preservar sai no relatório como não entregue, nunca como desvio.
- **Máximo de 25 rodadas de teste**, contadas pelo `n` da Etapa 4 desta onda. Adaptação não gasta
  rodada nem reinicia a contagem, e onda nova começa do zero porque é outra execução da skill, com
  outro plano e outro ledger. Estourado o teto, o que sobra é a spec: a run fecha bloqueada e volta
  à skill de planejamento.
- Nenhuma execução da run fala com o serviço remoto compartilhado. O filho que vai executar confere
  o **pré-requisito de ambiente** do cartão antes de subir processo, e a ausência dele — quando o
  ambiente exige um serviço de pé — fecha a etapa como BLOCKER e a run como bloqueada. Não existe
  fallback para um host remoto, nem em leitura.
- **As lanes `browser` e `teste` executam o roteiro de comprovação do plano**: as provas numeradas
  que o dev fechou no planejamento, nem uma a mais nem uma a menos, com o id da prova no nome do
  PNG. Prova que não saiu aparece no relatório com o motivo, e o `RT` dela não sai PASS.
- **O ambiente sobe pelo comando da linha `ambiente`** do plano de teste e a navegação começa na
  linha `url`, não no que o tester escolher. Um projeto costuma ter mais de uma variante de subida,
  e elas não são intercambiáveis.
- O estado do teste vem do **mecanismo de fixtures**, pelo comando da linha `estado` do plano,
  rodado depois de o pré-requisito estar de pé. Nenhum tester monta o estado na mão, e comando de
  estado que não roda é BLOCKER.
- Passo de plano que sincroniza ou estende o mecanismo de fixtures é implementado como qualquer
  outro passo, com o arquivo de contrato do mecanismo no mesmo commit e os gates dele — o comando
  de verificação e, se o cartão disser como rodar um alvo só, o comando de teste restrito a ele —
  na mesma rodada.
- Validação que dá PASS é seguida da Etapa 6. Lá, **toda `AC` marcada `(rn)` na spec vira regra
  registrada na doc de contexto que o cartão nomeia** — essa metade é garantida e não passa por
  filtro de relevância, salvo quando o cartão não tem destino nenhum, caso em que ela sai como
  linha do relatório e o dev decide. A skill de varredura que o campo `skills de contexto` apontar
  reconcilia o resto, quando houver uma. Nada disso é feito pelo nível 0.
- O comando de verificação e o comando de teste do cartão rodam dentro do implementador e do
  revisor, nunca no nível 0.
- Toda etapa que muda arquivo comita o próprio trabalho: o implementador na Etapa 3 e em cada
  rodada de correção, o atualizador de contexto na Etapa 6. `git add` por caminho, a mensagem no
  formato que `git log --oneline -25` mostrar, e nunca com gate vermelho. Review e teste não
  comitam.
- O implementador registra a `Base da run` no `implementacao.md` antes da primeira edição, e é
  contra ela que o revisor diffa.
- O push é um só, no fim, dado pelo nível 0, e não acontece em task bloqueada.
- Nada de fork, placeholder, agente de espera, `sleep` ou chamada no-op.

## Example

```text
Dev: /task-implementar-e-validar .claude/tmp/orquestracoes/2026-05-14-export-csv-relatorio/

Nível 0:
  E0  pasta confirmada, spec.md e plano.md presentes, log-implementacao.md criado
  E3  impl-export-csv-relatorio (gp, sonnet)       → checkpoint 1/8, 3 arquivos,
                                                      RT-001 RT-002 fechados, commit a1b2c3d,
                                                      lanes: curl+codigo
                                                      N=8 → L=2, cortes em 4 e 8
  E3  SendMessage: siga (não fecha lote)           → checkpoint 2/8, commit b2c3d4e
  E3  SendMessage: siga (não fecha lote)           → checkpoint 3/8, commit c3d4e5f
  E3  SendMessage: siga (não fecha lote)           → checkpoint 4/8, commit d4e5f6a
  E3.5 review-export-csv-relatorio-r1 (gp, sonnet) → lote cp 1–4: reprovado,
                                                      2 blockers (1 deles: RT-004 não
                                                      atendido), 1 nit
  E3.5 SendMessage ao implementador com o caminho do review-1.md → commit e5f6a7b
  E3.5 review-export-csv-relatorio-r2              → lote cp 1–4: aprovado
  E3  SendMessage: siga                            → checkpoints 5/8 a 8/8, 4 commits
  E3.5 review-export-csv-relatorio-r3              → lote cp 5–8 (k == N): aprovado
  E4  duas chamadas na mesma mensagem:
      teste-export-csv-relatorio-curl-r1 (gp)      → pré-requisito de pé, estado: comando
                                                      da linha `estado` executado, cenário
                                                      periodo-cheio criado,
                                                      RT-003 PASS, RT-007 FAIL
      teste-export-csv-relatorio-codigo-r1 (gp)    → RT-001 PASS, RT-002 PASS com ressalva
                                                      (usou `;` como separador, a segunda
                                                      opção da lista)
      soma: AC-001 entregue, AC-002 entregue, AC-003 não entregue (RT-007)
  E5  SendMessage ao implementador com o caminho do teste-1-curl.md → commit d0e1f2a
  E3.5 review-export-csv-relatorio-r4              → aprovado
  E4  teste-export-csv-relatorio-curl-r2           → RT-007 PASS. 7/7 RT, 3/3 AC
  E6  contexto-export-csv-relatorio (gp, sonnet)   → AC-003 (rn) registrada na doc de
                                                      contexto do projeto, 1 doc alterado,
                                                      commit e1f2a3b
  E7  git push -u origin HEAD e relatório ao dev, aberto por AC
```

Uma task `complexa`, com marco e adaptação — o caminho que antes fechava a run como bloqueada:

```text
Dev: /task-implementar-e-validar .claude/tmp/orquestracoes/2026-05-20-paginacao-listagem/

Nível 0:
  E0  pasta confirmada, log-implementacao.md criado
  E3  impl-paginacao-listagem (gp, sonnet)         → checkpoint 1/10, commit a1b2c3d,
                                                      lanes: browser+codigo, dificuldade:
                                                      complexa (reconhecimento.md),
                                                      marco 1: cp 4 prova RT-003 (browser)
                                                      N=10 → L=2, cortes 5 e 10;
                                                      marco em 4 substitui o 5 → cortes 4 e 10
  E3  SendMessage: siga ×3                         → checkpoints 2/10 a 4/10, 3 commits
  E3.5 review-paginacao-listagem-r1                → lote cp 1–4 (marco): aprovado
  E4  teste-paginacao-listagem-browser-r1          → marco 1, escopo RT-003: FAIL —
                                                      a página avança por índice de página
                                                      e o cursor da resposta anterior não
                                                      é o que a próxima leitura espera
  E5  correção r1 → commit e5f6a7b
  E4  teste-...-browser-r2                         → marco 1: RT-003 FAIL de novo
  E5  correção r2 → commit f6a7b8c
  E4  teste-...-browser-r3                         → marco 1: RT-003 FAIL — 2 correções
                                                      não moveram o marco → E5.5
  E5.5 adapta-paginacao-listagem-r1 (gp, opus)     → adaptado: o cursor passa a vir do id
                                                      do último registro, não do índice da
                                                      página; cp 5–10 reescritos, RT-003
                                                      mudou de forma, AC-002 intacta, 8/8 RT
  E3  impl fresco (plano novo + adaptacao-1.md)    → checkpoint 5/10, commit a7b8c9d
                                                      agentId novo guardado
  E3  SendMessage: siga ×5                         → checkpoints 6/10 a 10/10, 5 commits
  E3.5 review-paginacao-listagem-r2                → lote cp 5–10 (k == N): aprovado
  E4  teste final, duas lanes na mesma mensagem    → 8/8 RT PASS, 3/3 AC entregues
                                                      (RT-003 revalidado: marco não dá
                                                      crédito permanente)
  E6  contexto-paginacao-listagem                  → 1 AC (rn) registrada, commit b8c9d0e
  E7  push e relatório: 3/3 AC, 1 adaptação do plano com o gatilho e o que ela protegeu
```
