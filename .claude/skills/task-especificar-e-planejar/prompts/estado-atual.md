# Confirmar o estado atual e levantar o cartão do projeto

Você tem duas entregas: dizer de onde o sistema parte hoje, no recorte que a task encosta, e
levantar o **cartão do projeto** — os comandos, o layout e as convenções deste repositório.
Você não planeja, não propõe solução e não edita nada.

## O que você recebe

- **A task**, como o dev a descreveu.
- **A hipótese do dev** sobre o estado atual, quando ele deu uma. Ela é hipótese, não verdade:
  o dev pode estar descrevendo o sistema de três meses atrás.
- **A unidade do projeto** onde isso vive, quando o dev soube dizer. Quando ele não soube, você
  descobre: é parte do cartão.

## O que fazer

1. Leia a doc de contexto do projeto (`CLAUDE.md`, senão `AGENTS.md`, senão `README.md`) e as
   skills de contexto que `.claude/skills/` tiver para a unidade afetada, e ache o fluxo que a
   task encosta. As regras de negócio vivem lá, e é lá que o estado atual está descrito antes de
   estar no código.

2. **Levante o cartão do projeto.** É a segunda entrega desta etapa, e a última vez que alguém paga
   por essa descoberta nesta run. Ela é barata de propósito: um punhado de `ls` e de leitura de
   manifesto, teto de dez chamadas, **nenhum arquivo de código-fonte aberto por causa dela**. Nesta
   ordem, parando em cada passo que já responde o campo:

   - a **doc de contexto da raiz**: `CLAUDE.md`, senão `AGENTS.md`, senão `README.md` (os dois
     primeiros, quando existirem os dois);
   - o **manifesto da raiz**, só o bloco de scripts/tasks e o de workspaces: `package.json`, senão
     `pnpm-workspace.yaml`, `Makefile`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`,
     `Gemfile`. Quando a doc e o manifesto divergem sobre o nome de um comando, **manda o
     manifesto**;
   - o **layout das unidades**: um `ls` nos diretórios que o manifesto declara como workspace. Repo
     de um pacote só fecha o campo com `raiz`;
   - a **doc de contexto da unidade afetada**, e só dela;
   - `ls .claude/skills/` e, se existir, `ls .claude/agents/`;
   - um `ls` de convenção de teste e um de fixtures.

   Campo que não fecha em duas tentativas vira `desconhecido`, e você segue. O que o repo não tem
   vira `nenhum`/`nenhuma`, que é um valor legítimo e não um achado.

3. Confirme no código. O que o fluxo documentado promete e o que o código faz podem divergir, e
   quando divergem quem manda é o código.

4. Responda três coisas, e só elas:
   - **O que já funciona** no recorte da task.
   - **O que não existe ainda**, e que a task provavelmente vai criar.
   - **A hipótese do dev está certa?** `confirma` ou `contradiz`. Se contradiz, diga em uma
     frase o que é diferente.

## Limites

- **Não chame `AskUserQuestion`.** Toda ambiguidade vira premissa, escrita no retorno.
- **Não abra frente nova.** Se o recorte da task não estiver claro, descreva o estado do fluxo
  mais próximo e diga que o recorte ficou ambíguo. O gate do dev resolve isso em uma linha.
- **Fique no recorte.** Mapear a unidade inteira é trabalho do reconhecimento, na etapa de plano.

## O retorno

No máximo 12 linhas, neste formato. Não escreva arquivo nenhum: o retorno é a entrega.

```text
estado atual: <uma ou duas frases, na língua do produto, não na do código>
já funciona: <lista curta>
não existe: <lista curta>
hipótese do dev: confirma | contradiz — <uma frase, se contradiz>
premissas: <o que você assumiu, se assumiu algo>
status: ok | handoff | preso — <o que ficou por confirmar, se não for ok>
```

Escreva "estado atual" como um dev sênior responde ao tech lead que perguntou onde a feature
está hoje. Sem caminho de arquivo, sem nome de função: quem vai ler é o dev, decidindo produto.

Depois das linhas acima, devolva o bloco `## Cartão do projeto` **literalmente**, no formato que o
`SKILL.md` define. Ele fura o teto de 12 linhas, e é o único que fura: o nível 0 escreve o
`projeto.md` a partir dele, porque você não tem `Write`.

## Tetos: ~150k de janela e 60 turns

Meça a sua própria ocupação a cada ~40 turns, e antes de abrir frente nova de leitura:

```bash
.claude/skills/task-especificar-e-planejar/scripts/medir-janela.sh --self
```

- `status=ok` → siga, e remeça no turn indicado por `proxima`.
- `status=handoff` → pare de ler e retorne com o que já confirmou. Não há arquivo para escrever:
  o retorno é a entrega, então diga na linha `status` o que ficou por confirmar.
- `status=preso` → 60 turns ou mais com `taxa` abaixo de 400: você está buscando sem achar. Retorne
  com `preso` e diga em uma linha o que procurou e não encontrou. Isso o dev resolve em uma frase,
  e é por isso que vale retornar em vez de continuar procurando.

Se o `desc=` impresso não for você, meça pelo nonce: `medir-janela.sh "<seu description>"`.

Estourar um teto aqui é raro, porque a etapa é curta de propósito: um recorte, três respostas. Se
estourou, o recorte provavelmente está errado, e dizer isso vale mais que ler mais dez arquivos.
