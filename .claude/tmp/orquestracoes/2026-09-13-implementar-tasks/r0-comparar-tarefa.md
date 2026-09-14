# Tarefa — reconhecimento: comparar as duas runs planejadas

Você é um filho de reconhecimento, **read-only**. Não edite nenhum arquivo do projeto, não rode
comando que altere estado, não comite, não chame `AskUserQuestion`. Toda ambiguidade vira premissa
assumida e documentada no seu arquivo.

Raiz do repo: `/root/so/repos/timertasks/timertask-desktop-tree-1`

## O que ler

Duas pastas de run já planejadas (cada uma tem `spec.md`, `plano.md`, `projeto.md`,
`reconhecimento.md`, `roteiro.md`):

- `A` = `.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/`
- `B` = `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/`

Leia o `spec.md` inteiro das duas e, do `plano.md` de cada uma, apenas:
`## Passos` (só os títulos de checkpoint e os caminhos de arquivo citados), `## Plano de teste`,
`## Marcos de validação`, `## Fixtures`, `## Cobertura`, `## Desvios da spec`.
Do `reconhecimento.md` de cada uma, apenas o veredito de dificuldade (`simples` | `complexa`).
Não leia arquivo de código-fonte, exceto para confirmar que um caminho citado existe.

## O que responder

Escreva **`.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/r0-comparar.md`** com:

1. **Uma frase por task**: o que A entrega, o que B entrega, na língua do produto.
2. **Números por task**: quantos checkpoints o `## Passos` tem, quantas `AC`, quantas `RT`, quais
   `lane:` o `## Plano de teste` declara, quantos marcos de validação, o veredito de `## Fixtures`,
   o veredito de dificuldade.
3. **Sobreposição de arquivos**: a lista dos caminhos que **as duas** tocam, e para cada um, em
   uma linha, o que cada plano faz ali. Esta é a seção mais importante.
4. **Dependência**: B depende de algo que A cria, ou A depende de algo que B cria? Cite o passo.
   Se não há dependência, diga `nenhuma`.
5. **Risco de plano velho**: se uma for implementada primeiro, o plano da outra fica desatualizado
   em quais passos? Nomeie os passos, não generalize.
6. **Ordem recomendada** (A→B ou B→A), com o motivo em duas linhas.
7. **Comando de verificação real**: confirme, lendo `package.json` e `eslint.config.js`, se
   `npm run lint:fix` existe como script. Diga qual é o comando que de fato roda.

## Tetos

Meça sua janela a cada ~10 turns com:

```bash
.claude/skills/task-implementar-e-validar/scripts/medir-janela.sh --self
```

Tetos: 150k de janela e 60 turns. Com `status=handoff` ou `status=preso`, escreva o que já tem no
arquivo acima e retorne dizendo qual status deu.

## Retorno

Escreva o arquivo **antes** de retornar. O retorno tem no máximo 10 linhas: o caminho do arquivo,
a ordem recomendada e os números que cabem. Não sub-delegue.
