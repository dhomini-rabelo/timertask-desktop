# Formato dos arquivos da run

Quatro arquivos vivem em `.claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/` e são escritos por
orquestrador. A pasta também é: O1 a cria no primeiro turn e cada orquestrador seguinte a
mantém, porque o nível 0 não escreve em disco. Os arquivos de rodada (`r{n}-{papel}.md`) são
escritos pelos filhos, e o formato é você quem define no prompt de cada um.

Duas regras valem para os quatro:

- **Ponteiros, não conteúdo.** Nenhum diff, nenhum trecho de código colado, nenhuma saída de
  comando. Se passa de duas linhas, vai para o arquivo da rodada e você cita o caminho.
- **Escrito para quem tem zero contexto.** O leitor é um sucessor fresco, ou o usuário. Nenhum
  dos dois viu a sua janela.

---

## `briefing.md` — o contrato da task

Só O1 escreve, quando o gate da Etapa 0 fecha: depois da rodada de reconhecimento e das
respostas do usuário, antes da rodada 1. Ninguém reescreve depois — o que muda no meio do
caminho é premissa nova, e premissa nova vive no handoff.

Ele existe porque a descrição do usuário chega uma vez, no prompt de O1, e nunca mais. Sem esse
arquivo, O2 herda uma task sem enunciado.

```md
# Briefing — {task em uma frase}

## O pedido
{a task como o usuário descreveu, verbatim. Sem interpretação.}

## Perguntas e respostas
- {pergunta que você mandou no `bloco: perguntas`}: {a resposta do usuário, verbatim}
{ou "nenhuma: o reconhecimento fechou tudo"}

## Definição de pronto
{como se prova, de fora, que a task acabou. Um comando, uma tela, um arquivo, um número.}

## Fora do escopo
{o que foi decidido não fazer, para nenhum sucessor "consertar de passagem".}

## Autorizações
{ação externa ou destrutiva liberada pelo usuário. "nenhuma" se não houve.}

## Premissas
{ambiguidade que você travou sozinho, e a decisão}
```

---

## `log.md` — o ledger

Uma linha por rodada, acrescentada quando a rodada fecha. Cada orquestrador escreve sob o próprio
cabeçalho e ninguém relê o log: o que a rodada seguinte precisa veio na notificação do filho.

```md
# Orquestração — {task em uma frase}

Pasta: .claude/tmp/orquestracoes/{YYYY-MM-DD}-{slug}/

## O1 (opus) — início {HH:MM}

| Rodada | Filhos | Modelo | Veredito |
|---|---|---|---|
| r1 | mapear-pacotes | sonnet | 9 pacotes, 2 com plugin custom |
| r2 | migrar-a, migrar-b | sonnet | 2 ok, build passou |
| r3 | migrar-c | sonnet | FAIL: alias de path |

Janela no fechamento: 152k. Handoff: handoff-1.md

## O2 (sonnet) — início {HH:MM}

| Rodada | Filhos | Modelo | Veredito |
|---|---|---|---|
| r4 | migrar-c | sonnet | ok, alias resolvido no tsup.config |

## Premissas assumidas
- {ambiguidade travada depois do gate, e a decisão}

## Handoffs
- O1 → O2: janela 152k, 3 pacotes pendentes
- {ou: "passei do teto por opção: janela 161k, faltava só o relatório"}

## Resultado
{entregue | entregue com ressalvas | bloqueado} — fim {HH:MM}
```

A tabela é o único lugar onde tabela se justifica aqui, porque cada célula é um nome, um modelo
ou um veredito de meia linha. Veredito que não cabe em meia linha vai para o arquivo da rodada.

As duas seções que não são opcionais:

- **`Premissas assumidas`**, porque fora do `bloco: perguntas` ninguém fala com o usuário. Esta
  seção é o registro do que foi decidido no lugar dele, e ela vira, palavra por palavra, uma
  seção do relatório final.
- **`Handoffs`**, porque quem lê precisa saber que aquela etapa foi feita por dois agentes. É o
  primeiro lugar onde se olha quando algo saiu pela metade.

---

## `handoff-{n}.md` — o estado que sobrevive à sua troca

O arquivo mais importante da cadeia. O teste é único: **o seu sucessor lê só ele e o
`briefing.md`, e dispara a próxima rodada sem adivinhar nada.**

A ordem das seções não é decorativa. `Próxima rodada` vem primeiro porque é a única que o
sucessor precisa ler para começar a trabalhar.

```md
# Handoff O{n} → O{n+1}

Briefing: .claude/tmp/orquestracoes/{data}-{slug}/briefing.md
Ledger: .claude/tmp/orquestracoes/{data}-{slug}/log.md

## Próxima rodada
{o que disparar agora: quantos filhos, que papel, que arquivo cada um lê e escreve, que modelo.
Escrito como ordem de serviço, não como sugestão.}

## Pendências, em ordem
1. {o que falta, uma linha cada. A lista encurta a cada handoff, ou a cadeia está girando em falso.}

## Já fechado
{uma linha por rodada concluída, com o caminho do arquivo da rodada. Sem repetir o conteúdo.}

## Armadilhas
{o que já foi tentado e falhou, e por quê. Sem esta seção o sucessor repete a sua rodada perdida
com outro nome. "nenhuma" se não houve.}

## Premissas
{as que você travou. Acumulativo: repita as do handoff anterior que ainda valem.}

## Estado do mundo
{o que está sujo fora do git: serviço subido, arquivo temporário, migração aplicada, branch
criada. O sucessor precisa saber o que ele herda ligado.}

## Janela
Fechei em {N}k, teto 140k, {N} turns de {N}.
```

Nenhuma seção fica vazia por preguiça: `nenhuma` é resposta legítima e informativa, silêncio não.

---

## `relatorio-final.md` — o que o usuário lê

Quem fecha a task escreve, e o corpo do retorno `bloco: fim` é este arquivo resumido em no
máximo 15 linhas. O nível 0 repassa o retorno sem reescrever, então o que estiver mal escrito
aqui chega mal escrito ao usuário.

```md
# {task em uma frase}

## Veredito
{entregue | entregue com ressalvas | bloqueado}

## O que mudou
- [caminho/arquivo.ts](caminho/arquivo.ts) — {o que mudou}

## Como foi provado
{o comando rodado, a tela verificada, o resultado. Concreto.}

## Premissas assumidas
{copiadas do ledger. Não é opcional.}

## O que ficou de fora
{pendência que a task não cobriu, e por quê}

## A cadeia
{quantos orquestradores, quantos filhos, quantas rodadas, pasta da run}
```
