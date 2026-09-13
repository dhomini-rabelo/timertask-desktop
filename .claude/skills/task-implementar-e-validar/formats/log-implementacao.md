# Formato do `log-implementacao.md`

Este é o ledger do nível 0 durante a implementação. Ele mora em
`.claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/log-implementacao.md`.

Na mesma pasta existe o `log-planejamento.md`, ledger da outra metade da orquestração. Os dois
arquivos não se cruzam: você escreve o seu e não abre o dele.

Numa task partida em ondas há um ledger por onda, e o da onda `k > 1` leva o sufixo:
`log-implementacao-o{k}.md`. Ele registra os contadores daquela onda, que nascem zerados.

## Como ele é escrito

- **Só o nível 0 escreve nele.** Os filhos escrevem os arquivos deles, na mesma pasta.
- **Uma linha por etapa, escrita quando a etapa fecha.** Você acrescenta ao final; nunca reescreve
  o que já está lá.
- **Você nunca relê o log.** O que precisa saber para a próxima etapa veio na notificação de
  conclusão do filho. Reler é pagar de novo pelo que já custou.
- **Ponteiros, não conteúdo.** Nenhum trecho de código, nenhum diff, nenhuma saída de comando. Se a
  informação passa de duas linhas, ela pertence ao arquivo da etapa.

## Estrutura

```md
# Implementação — {task em uma frase}

Início: {YYYY-MM-DD HH:MM}
Pasta: .claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/
Projeto: {as unidades afetadas} — projeto.md
Spec: {pasta}/spec.md — {N} AC, {N} RT, {N} marcadas (rn)
Onda: {onda {k} de {N} — RT desta onda / RT pendentes — ondas.md | "onda única"}
Plano: {pasta}/plano.md
Checkpoints: {N}
Marcos: {checkpoint {k} prova RT-00N, RT-00M | "nenhum" — veio no retorno do implementador}
Dificuldade: {simples | complexa — escolhe o modelo do adaptador na Etapa 5.5}
Lanes: {as que aparecem: curl, browser, teste, codigo — veio no retorno do implementador}
Ambiente: {o comando da linha `ambiente` do plano de teste, e a linha `url`, ou "nenhum"}
Pré-requisito: {o pré-requisito de ambiente e o veredito que o tester devolveu, ou "nenhum"}
Estado: {o comando da linha `estado` que o tester rodou, como ele o devolveu — ou "nenhum"}
Fixtures: {sincronizar | estender | sem mudança | sem mecanismo, como o implementador devolveu}

## Etapas

| # | Papel | Agente | Modelo | Veredito |
|---|---|---|---|---|
| E3 | implementação (checkpoint 1/8) | impl-{slug} | sonnet | 3 arquivos, gates ok |
| E3 | implementação (checkpoint 2/8) | impl-{slug} (reuso) | sonnet | 4 arquivos, gates ok |
| E3 | implementação (checkpoint 3/8) | impl-{slug} (reuso) | sonnet | 1 arquivo, gates ok |
| E3 | implementação (checkpoint 4/8) | impl-{slug} (reuso) | sonnet | 2 arquivos, gates ok |
| E3.5 | review r1 (cp 1–4) | review-{slug}-r1 | sonnet | reprovado: 2 blockers, 1 nit |
| E3.5 | correção r1 | impl-{slug} (reuso) | sonnet | 2 blockers corrigidos |
| E3.5 | review r2 (cp 1–4) | review-{slug}-r2 | sonnet | aprovado |
| E3 | implementação (checkpoint 5/8) | impl-{slug} (reuso) | sonnet | 2 arquivos, gates ok |
| E3 | implementação (checkpoint 6/8) | impl-{slug} (reuso) | sonnet | 3 arquivos, gates ok |
| E3 | implementação (checkpoint 7/8) | impl-{slug} (reuso) | sonnet | 1 arquivo, gates ok |
| E3 | implementação (checkpoint 8/8) | impl-{slug} (reuso) | sonnet | 2 arquivos, gates ok |
| E3.5 | review r3 (cp 5–8) | review-{slug}-r3 | sonnet | aprovado |
| E4 | teste marco 1 (cp 4, curl) | teste-{slug}-curl-r1 | sonnet | gate ok, RT-003 PASS |
| E4 | teste r1 (curl) | teste-{slug}-curl-r1 | sonnet | gate ok, RT-003 PASS, RT-004 FAIL |
| E4 | teste r1 (codigo) | teste-{slug}-codigo-r1 | sonnet | RT-001 PASS, RT-002 PASS |
| E5 | correção r1 | impl-{slug} (reuso) | sonnet | corrigido, gates ok |
| E5.5 | adaptação r1 | adapta-{slug}-r1 | opus | adaptado, cp 6–8 reescritos, AC-002 intacta |
| E3.5 | review r4 | review-{slug}-r4 | sonnet | aprovado |
| E4 | teste r2 (curl) | teste-{slug}-curl-r2 | sonnet | 7/7 RT PASS |
| E6 | contexto | contexto-{slug} | sonnet | {unidade}, 1 AC (rn) registrada, 1 doc de contexto |

## Cobertura por RT
- RT-00N (AC-00M) — {PASS | PASS com ressalva: a alternativa | FAIL | n/d: motivo | n/a} — lane
{uma linha por RT da spec, montada com os retornos das lanes da última rodada de teste}

## Veredito por AC
- AC-00N — {entregue | não entregue: o RT que reprovou}
{uma AC é entregue quando todo RT que a serve passou. Esta seção é a que vira o relatório do dev}

## Desvios da spec
- {RT que o plano declarou que não cumpriria, e o motivo. "nenhum" se não houve}
- {RT que uma adaptação da Etapa 5.5 passou a não cumprir, e qual AC isso afeta}

## Adaptações do plano
- {rodada, gatilho, veredito, checkpoints reescritos, e a AC que a adaptação protegeu ou perdeu.
  "nenhuma" se não houve}

## Nits do review
- {o nit em uma linha, e o arquivo. "nenhum" se não houve}

## Premissas assumidas
- {ambiguidade que você ou um filho travou sozinho, e a decisão}

## Handoffs
- {etapa, agente que estourou o teto (janela ou turns), qual dos dois, agente fresco que
  continuou. "nenhum" se não houve}
- {etapa, agente que voltou `preso`, o que ele reportou como travado, e a decisão: sucessor
  fresco ou bloqueada}

## Commits
Branch: {branch em que a run comitou}
Base: {hash curto de antes da primeira edição}
- {etapa} — {hash curto} — {mensagem}

## Resultado
{entregue | entregue com ressalvas | bloqueado}
Push: {branch publicada | não dado: task bloqueada}
Fim: {YYYY-MM-DD HH:MM}
```

## A tabela cabe em célula curta

A tabela é o único lugar onde uma tabela se justifica aqui: cada célula é um nome, um modelo ou um
veredito de meia linha. Se um veredito não couber em meia linha, ele vai para a seção `Premissas
assumidas` ou para o arquivo da etapa, e a célula fica com o resumo.

## `Veredito por AC` é a seção que o dev lê

O resto do ledger é operação. Esta seção é o resultado, e ela é a única do arquivo que você monta
por conta em vez de copiar de um retorno: os testers reportam por `RT`, porque `RT` é binário e
observável; a `AC` fecha por soma, e a soma é sua.

A regra é uma linha: **uma `AC` está entregue quando todo `RT` que a serve passou.** Um `RT` em
`PASS com ressalva` não derruba a `AC`, mas a ressalva viaja junto no relatório final — o dev
aprovou um `[SHOULD]` com saída, e ele quer saber qual saída foi usada.

`RT` marcado em `## Desvios da spec` não conta contra a `AC`: o dev viu o desvio no gate do plano e
seguiu mesmo assim. Diga isso na linha da `AC`, em vez de omitir.

## Checkpoints ficam no cabeçalho

Igual à lane, quem sabe quantos checkpoints o plano marca é o implementador — você não abre o
`plano.md`. Ele conta ao abrir o plano e devolve o total já no primeiro retorno da Etapa 3, no
formato `checkpoint {k} de {N}`; o `{N}` não muda durante a run. É esse número que explica, mais
tarde, por que a tabela tem mais de uma linha E3 antes do primeiro E4 — e por que algumas delas
não têm um E3.5 logo abaixo: o review roda a cada lote de ~5 checkpoints e sempre no último, então
linha E3 de `k` que não fecha lote é seguida de outra linha E3.

Por isso a célula de uma linha E3.5 diz **o lote que ela cobriu** (`review r1 (cp 1–5)`). Sem esse
recorte, quem lê o ledger depois não consegue amarrar o veredito ao trecho julgado, e uma rodada
aprovada parece cobrir a run inteira quando cobria um lote. Rodada de run sem checkpoint,
ou rodada de correção da Etapa 5, não leva lote nenhum na célula.

## As lanes ficam no cabeçalho

Você não abre o `plano.md`, então as lanes chegam pelo retorno do implementador, que é o primeiro
agente a ler o plano. Elas vão no cabeçalho porque a Etapa 4 as consulta em toda rodada — cada lane
é um tester — e porque o `log-planejamento.md` também as registra: se os dois discordarem, quem
manda é o plano, e a divergência é sinal de que o implementador leu outro arquivo.

Uma linha `E4` por lane por rodada, com a lane na célula do papel. Duas lanes numa rodada são duas
linhas com o mesmo `r{n}`, porque elas foram disparadas na mesma barreira paralela e o veredito de
cada uma é independente.

## O estado e as fixtures ficam no cabeçalho

Ao lado do pré-requisito, e pela mesma razão: eles respondem **contra que estado** a prova rodou. A
linha `Estado` guarda o comando da linha `estado` que o tester digitou, e é o que faz a prova ser
repetível depois que a pasta da run já foi embora — um PASS sem ela é um PASS que ninguém reproduz.

A linha `Fixtures` guarda o que a run deixou no mecanismo. `estender` é a que mais importa: ela diz
que o repo ganhou um cenário novo, e o relatório final a repassa ao dev, porque é ele que vai
reusá-lo na próxima task.

## O pré-requisito fica no cabeçalho

A linha `Pré-requisito` guarda o veredito que o pré-requisito de ambiente imprimiu na primeira
rodada de teste. Ela está no cabeçalho, e não numa célula da tabela, porque responde a pergunta que
alguém vai fazer depois: **qual pré-requisito respondeu nesta run?** Um `pré-requisito de pé` diz
que o serviço do campo `pré-requisito de ambiente` estava disponível; um `BLOCKER` explica, com o
motivo, por que a run fechou bloqueada sem ter testado nada.

## Nit vive aqui porque ninguém mais o carrega

`Nits do review` é o único registro do que o revisor apontou e o implementador não consertou — por
decisão da skill, nit não vira rodada de correção. Ele sai daqui para o relatório final, onde o dev
decide se vale uma task. Nit que não entra nesta seção morre com a janela do revisor.

## `Commits` é o que sobrevive à pasta da run

A pasta desta run vive em `.claude/tmp/`, que é ignorado pelo git e some com uma limpeza. Os
commits não somem, e por isso a seção `Commits` é a ponte entre as duas coisas: ela liga cada etapa
da orquestração ao hash que carrega o trabalho dela, e é por ela que alguém reconstrói o que
aconteceu depois que a pasta já foi embora.

Cada linha entra quando a etapa fecha, com o hash que o filho devolveu no retorno — o nível 0 não
roda `git log` para descobri-lo. A linha `Push` fecha a run: a branch publicada, ou o motivo de não
ter sido.

## As duas seções que não são opcionais

- **`Premissas assumidas`** — nesta metade da orquestração ninguém pergunta nada ao dev, então esta
  seção é o registro do que foi decidido no lugar dele. Ela vira, palavra por palavra, uma seção do
  relatório final.
- **`Handoffs`** — se um filho estourou um dos tetos (150k de janela ou 60 turns), o próximo leitor
  precisa saber que aquela etapa foi feita por dois agentes. É o primeiro lugar onde se olha quando
  algo saiu pela metade. Registre também o `preso`: a mesma etapa dando handoff duas vezes, ou um
  `preso` relançado sem mudança, é o sinal de que a etapa está em laço e não em progresso.
