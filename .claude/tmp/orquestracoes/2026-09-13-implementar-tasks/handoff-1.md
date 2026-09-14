# Handoff O1 → O2

Briefing: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/briefing.md
Ledger: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/log.md

Raiz do repo: `/root/so/repos/timertasks/timertask-desktop-tree-1`. Todo caminho abaixo é relativo
a ela.

## Próxima rodada

**Nada foi implementado ainda. Você começa a run A do zero.**

Você é o **nível 0 da skill `task-implementar-e-validar`** para a run A. Leia, nesta ordem:

1. `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/briefing.md` — o contrato.
2. `.claude/skills/task-implementar-e-validar/SKILL.md` — o workflow que você executa. São 1318
   linhas; leia inteiro uma vez, é a maior leitura da sua janela e ela se paga.
3. `.claude/skills/task-implementar-e-validar/formats/log-implementacao.md` — antes de escrever a
   primeira linha do ledger da run A.

**Run A** = `.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/`. Ela tem `spec.md`,
`plano.md`, `projeto.md`, `reconhecimento.md` e `roteiro.md`. **Não tem `ondas.md`**, então nenhum
arquivo leva sufixo `-o{k}`. `slug` = `chips-grupo-de-tasks`.

Etapa 0 já está meio andada por mim: a pasta existe, `spec.md` e `plano.md` estão lá, não há
`ondas.md`, e o `projeto.md` existe (o implementador não precisa levantar o cartão). Escreva o
cabeçalho de `chips-grupo-de-tasks/log-implementacao.md` e dispare a Etapa 3.

Números da run A, para você não abrir o plano: **3 checkpoints, 23 passos, 10 `AC`, 22 `RT`,
lanes `browser` e `codigo`, 0 marcos de validação, Fixtures `sem mecanismo`, dificuldade
`simples`**. Com `N=3`, a cadência de review dá `L=1`: **uma rodada de review só, no checkpoint 3**.
Confirme esses números no primeiro retorno do implementador; se divergirem, o retorno dele vence.

Disparo da Etapa 3:

```text
subagent_type: 'general-purpose'
model: 'sonnet'
description: 'impl-chips-grupo-de-tasks'
```

No delta do prompt, além dos caminhos que a skill manda (`prompts/implementador.md`, `plano.md`,
`spec.md`, `projeto.md`, `reconhecimento.md`, pasta da run), inclua as três correções abaixo —
elas vencem o que o cartão e o plano escreverem:

- **O comando de verificação é `npx eslint . --fix`, depois `npx tsc --noEmit`.** `npm run
  lint:fix` **não existe** no `package.json` e falha. O `plano.md` da run A escreve `npm run
  lint:fix` nas três fronteiras de checkpoint; o filho substitui.
- **`git add` por caminho, nunca `-A`.** `.claude/tmp/` é versionado neste repo (a skill supõe que
  não é), então um `git add -A` arrastaria os arquivos da run para o commit de código.
- **A branch é `feat/add-projetos-e-inline-tasks`**, que já não é a default. O implementador
  comita nela e **não** cria branch nova.

## Pendências, em ordem

1. Run A (`chips-grupo-de-tasks`) inteira: Etapas 0 → 7 da skill, terminando no `git push -u
   origin HEAD` e no fechamento do `log-implementacao.md` dela.
2. Run B (`inserir-task-inline`) inteira: mesmas etapas, `slug` = `inserir-task-inline`, também
   sem `ondas.md`. Números: **3 checkpoints, 10 passos, 8 `AC`, 26 `RT`, lanes `browser` e
   `codigo`, 0 marcos, Fixtures `sem mecanismo`, dificuldade `simples`**; `N=3` → uma rodada de
   review, no checkpoint 3.
3. **Passo extra da run B, autorizado pelo dev e fora do `plano.md` aprovado**: a task criada pelo
   ponto de inserção inline tem que compor o prefixo `"[projeto] "` quando há chip de projeto
   selecionado. Hoje `IndexInsertTaskPoint.tsx` chamaria `insertTask` direto, e a composição do
   prefixo vive só em `IndexAddInput.tsx` (passo 16 da run A). Passe isso no delta do
   implementador da run B como requisito adicional, e no delta do tester `browser` como prova a
   mais. Ele não tem `RT` próprio: reporte-o no relatório final como desvio deliberado.
4. `relatorio-final.md` desta pasta (`2026-09-13-implementar-tasks/`), somando as duas runs:
   veredito por `AC` de cada uma, o que mudou, como foi provado, premissas, e o resultado dos dois
   pushes.

Se a run A fechar **bloqueada**, não dê push nela, registre o motivo e **siga para a run B mesmo
assim** — as duas são independentes.

## Já fechado

- **r0 — reconhecimento comparativo** (sonnet, read-only):
  [`r0-comparar.md`](r0-comparar.md). Entrega os números das duas runs, a sobreposição de arquivos
  (só `src/pages/index/states/tasks/index.ts`, sem conflito), a ausência de dependência entre elas,
  a ordem recomendada e a descoberta do `npm run lint:fix` inexistente. O prompt que o gerou está
  em `r0-comparar-tarefa.md`.
- **Gate com o dev**: as quatro respostas estão no `briefing.md`, seção `Perguntas e respostas`.
  O gate está fechado; daqui para frente toda ambiguidade é premissa, e só ação externa nova
  reabre pergunta.
- **Conserto de ambiente**: `.claude/tmp/` e `.claude/memory/` eram root-owned e nenhum filho
  conseguiria escrever ali. Já corrigido.

## Armadilhas

- **`npm run lint:fix` não existe.** É o erro mais provável da run: o `CLAUDE.md` manda rodá-lo, o
  `plano.md` da run A o repete em três fronteiras, e `package.json` só tem `dev`, `build`,
  `preview`, `tauri`, `setup:win`, `build:win`. Todo filho que roda o gate precisa ser avisado no
  delta.
- **`.claude/tmp/` está versionado.** A skill afirma que está no `.gitignore`, e não está. `git
  add -A` num filho arrastaria plano, review e relatório de teste para o commit.
- **`.claude/tmp/` e `.claude/memory/` eram root-owned**, e o uid da sessão é `dev`. Já consertei
  com `sudo chown -R dev:devwork` e `chmod g+w`, mas se aparecer `Permission denied` em escrita
  dentro de `.claude/`, é isso voltando: há `sudo` sem senha nesta máquina.
- **Medir a janela com `--self` erra o alvo** quando um filho está vivo: ele casa o transcript do
  filho. Meça pelo seu nonce: `.claude/skills/sem-nivel-0/scripts/medir-janela.sh "orq-implementar-tasks-o2"`.
- **Ler a `SKILL.md` inteira custa caro.** Foi o que me levou a `handoff` em 24 turns sem ter
  disparado uma edição. Leia-a uma vez, não volte nela, e não releia o `log.md`.
- Nenhuma rodada de implementação foi tentada ainda, então não há falha de código a evitar.

## Premissas

Todas as do `briefing.md`, seção `Premissas`, continuam valendo. Em resumo:

- Comando de verificação real: `npx eslint . --fix` + `npx tsc --noEmit`.
- Sequencial, sem parada entre A e B.
- Cada run é uma execução inteira da skill, com o próprio `log-implementacao.md`.
- Run bloqueada não recebe push e não impede a run seguinte.
- A lacuna do prefixo vira passo extra da run B.

## Estado do mundo

- Branch corrente: `feat/add-projetos-e-inline-tasks`. Árvore de código **limpa**; nenhum arquivo
  de `src/` ou `src-tauri/` foi tocado.
- Único não-commitado: a pasta desta orquestração,
  `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/` (untracked). Deixe-a untracked.
- Nenhum serviço subido. O `npm run dev` (Vite, porta fixa 1420) **não** está rodando — quem o
  sobe é o tester da lane `browser`, e o cartão diz para reaproveitar servidor já de pé.
- Ownership de `.claude/tmp/` e `.claude/memory/` alterada para `dev:devwork` (era `root`).
  `CLAUDE.md` e `package-lock.json` também. Nenhum conteúdo reescrito.
- Nenhum push dado. Nenhum commit novo: o `HEAD` continua em `a7519c3`.

## Janela

Fechei em 110k, teto 140k, 24 turns de 50. `status=handoff` por projeção (`proj=162k`).
