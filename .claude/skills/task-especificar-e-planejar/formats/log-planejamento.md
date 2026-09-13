# O formato do `log-planejamento.md`

Este é o ledger do nível 0 na etapa de plano. Ele mora em
`.claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/log-planejamento.md` e nasce na Etapa 6, quando o
primeiro subagente é disparado.

Numa run com ondas há um ledger por onda, e o da onda `k > 1` leva o sufixo:
`log-planejamento-o{k}.md`. Cada onda tem o próprio reconhecimento, o próprio plano e o próprio
gate, e misturar as três coisas num arquivo só apaga qual onda decidiu o quê.

A etapa de spec não tem ledger: ela roda inteira na conversa do nível 0, e o que ela decidiu já
está no `spec.md`. O ledger começa quando há filho escrevendo arquivo, gate parando e teto podendo
estourar, que é o que ele existe para registrar.

A skill de implementação tem o ledger dela, `log-implementacao.md`, na mesma pasta. Os dois
arquivos não se cruzam.

## Como ele é escrito

- **Só o nível 0 escreve nele.** Os filhos escrevem os arquivos deles, na mesma pasta.
- **Uma linha por etapa, escrita quando a etapa fecha.** Você acrescenta ao final; nunca reescreve
  o que já está lá.
- **Você nunca relê o log.** O que precisa saber para a próxima etapa veio na notificação de
  conclusão do filho.
- **Ponteiros, não conteúdo.** Nenhum trecho de código, nenhum passo de plano, nenhuma saída de
  comando. Informação que passa de duas linhas pertence ao arquivo da etapa.

## Estrutura

```md
# Planejamento — {task em uma frase}

Início: {YYYY-MM-DD HH:MM}
Pasta: .claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/
Projeto: {as unidades afetadas} — projeto.md
Spec: {N} AC, {N} RT, {N} SHOULD — spec.md
Corte: {assunto {i} de {N} — corte.md | "sem corte"}
Onda: {onda {k} — os RT desta onda — ondas.md | "onda única"}
Roteiro: {{N} provas: {N} screenshots, {N} casos de suíte — roteiro.md | "n/a"}

## Etapas

| # | Papel | Agente | Modelo | Veredito |
|---|---|---|---|---|
| E6 | reconhecimento | recon-{slug} | sonnet | simples, estado confirma, fixtures: sincronizar |
| E7 | dúvidas e roteiro | — | — | 3 dúvidas / 1 perguntada, roteiro: 9 provas, 2 corrigidas |
| E8 | plano | plano-{slug} | sonnet | 6 passos / 2 cp, 7/7 RT, marcos: nenhum, onda única |
| E9 | gate do plano | — | — | aprovado |

## Dúvidas técnicas (E7)
Levantadas: {as dúvidas do recon, uma linha cada}
Perguntadas: {as que sobreviveram à regra 2, e a resposta do dev}
Assumidas: {as que o nível 0 respondeu sozinho, e a decisão}

## Roteiro de comprovação (E7)
Proposto: {N} provas — {N} screenshots, {N} casos de suíte
Ambiente: {o comando de ambiente do roteiro, ou "nenhum"}
Fechado: {o que o dev corrigiu, acrescentou e cortou, uma linha cada | "aprovado como proposto"}
Arquivo: roteiro.md
{"n/a" quando a task não tem RT de lane browser nem teste}

## Gate do plano (E9)
{aprovado | rodada r{n} pedida: o ajuste em uma linha | volta ao gate da spec: o motivo}

## Premissas assumidas
- {ambiguidade que um filho travou sozinho, e a decisão. "nenhuma" se não houve}

## Desvios da spec
- {RT que o plano não cumpre como escrito, e o que o dev disse no gate. "nenhum" se não houve}

## Handoffs
- {etapa, agente que estourou o teto, qual dos dois, agente fresco que continuou}
- {etapa, agente que voltou `preso`, o que ele reportou, e a decisão: sucessor fresco ou pergunta
  ao dev}
{"nenhum" se não houve}

## Resultado
{plano aprovado | abortado: motivo}
Plano: .claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/plano.md
Lanes: {as que aparecem: curl, browser, teste, codigo}
Cobertura: {N}/{N} RT
Provas: {N} do roteiro no plano de teste; acrescentadas pelo planejador: {ids | nenhuma};
dispensadas: {ids | nenhuma}
Checkpoints: {N}
Fixtures: {sincronizar | estender | sem mudança | sem mecanismo}
Ambiente: {o comando de ambiente do plano de teste, ou "nenhum"}
Estado: {o comando de estado do plano de teste, ou "nenhum"}
Fim: {YYYY-MM-DD HH:MM}
```

## As quatro seções que não são opcionais

- **`Dúvidas técnicas`** — é o registro de que o nível 0 filtrou, e do que ele filtrou. Sem ela
  ninguém sabe depois se uma decisão saiu do dev ou do agente, e a diferença importa quando o
  plano dá errado.
- **`Roteiro de comprovação`** — a linha `Fechado` é a única memória de que o dev mexeu no roteiro.
  Prova que ele acrescentou no gate e que depois aparece FAIL na validação é o caso em que essa
  linha decide quem estava certo.
- **`Premissas assumidas`** — os filhos não perguntam nada, então esta seção guarda o que eles
  decidiram sozinhos. Ela vira, palavra por palavra, uma seção do relatório de entrega.
- **`Handoffs`** — se um filho estourou um dos tetos, o próximo leitor precisa saber que aquela
  etapa foi feita por dois agentes. É o primeiro lugar onde se olha quando um mapa ou um plano saiu
  pela metade.

## `Cobertura` é a linha que a implementação lê

`{N}/{N} RT` é o único número desta skill que diz se o plano está inteiro. Se ele sai diferente de
`N/N`, a diferença tem que estar em `Desvios da spec`, e o dev tem que ter visto os desvios no
gate. As duas coisas juntas, ou o plano não devia ter sido aprovado.

## A tabela cabe em célula curta

Cada célula é um nome, um modelo ou um veredito de meia linha. Veredito que não couber em meia
linha vai para uma das seções abaixo da tabela, e a célula fica com o resumo.
