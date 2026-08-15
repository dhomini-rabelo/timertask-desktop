# Recon — step 02 scroll-vertical-ativas-e-inativas

Base commit confirmado: `91fd07b` (HEAD). Todos os 4 anchors de `memoria-da-task.md` §2.2/§3
foram reabertos e batem linha-a-linha com o estado atual do repo — nada mudou desde a memória.

## Mapa de arquivos

- `src/pages/index/components/IndexTasks/IndexTasks.tsx:30` | linha do scroll interno das ativas (remover) | 9-48 lido inteiro
- `src/pages/index/page.tsx:54` | shell `max-h-screen` (destravar) | 11-83 lido inteiro
- `src/layout/styles/global.css:44-47,67-71` | `height:100%` em `html,body,#root` e `.body-df` (destravar) | 1-75 lido inteiro
- `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx:80-92` | bloco de concluídas, hoje sem `max-h`/`overflow` (adicionar) | 1-97 lido inteiro
- `src/App.tsx:1-8` | único ponto de montagem de `IndexPage`, sem CSS/height próprio | lido inteiro

## Molde a espelhar

A própria linha que sai de `IndexTasks.tsx:30` é o molde do que entra em `IndexFooter.tsx:81`:
`max-h-[calc(100vh-400px)] overflow-y-auto` — já confirmado no plano (P2), nada de novo a inferir.

## Footprint

- `body-df`: único consumidor é `page.tsx:54`; `global.css:67,73` são a definição/dark-variant.
  Nenhum outro arquivo referencia a classe (`grep -rn "body-df" src/` = 3 hits, todos já mapeados).
- `IndexFooter`: importado só por `IndexTasks.tsx:7`; nenhum outro call site.
- `IndexPage`/`page.tsx`: importado só por `App.tsx:2`; `App.tsx` não define altura/CSS próprio,
  só importa `global.css`.
- `IndexTimer.tsx`, `IndexScore.tsx`, `IndexHeader/IndexHeader.tsx`: grep por
  `h-screen|100vh|overflow|sticky|fixed|height` nos 3 arquivos = **zero hits**. Nenhum dos três
  assume o shell de altura fixa; nada ali quebra ao liberar `page.tsx:54`/`global.css`.
- `global.css` inteiro: único outro uso de `height` é `height: auto;` comentado (:61), irrelevante.

## Armadilhas

- Já cobertas por completo em `memoria-da-task.md` §6 (N1-N5, T4/T8/T9/T10) e §5 (dependência dura
  do step 01). Não há trap nova encontrada nesta rodada de leitura.
- Confirmação de campo (não estava no texto da memória, achei agora): o "Padrões capturados no
  step 01" bate 100% com o código atual — `IndexAlertSelect.tsx:22` tem `w-auto shrink-0`,
  `IndexTaskItem.tsx:248` tem `shrink-0`, `:265` tem `min-w-0` sem `flex-1`. O pré-requisito duro
  do §5 ("nenhum conteúdo da lista transborda na horizontal antes de remover `overflow-y-auto`")
  está satisfeito.

## Sinal de teste

Não encontrado nenhum automatizado (T9, sem `*.test.*` no repo). Precisa de stack rodando + browser
(`npm run dev` porta 1420 + Playwright MCP), confirmado pelo próprio plano ("Docker+browser only").

## Resposta à pergunta do delta — ripple do shell de altura fixa

**Não há ripple.** `page.tsx` é o único consumidor de `.body-df`/`global.css:44-47,67-71`, e é
também o único lugar no projeto que usa `max-h-screen`/`min-h-screen`/`h-screen` (`grep -rn
"min-h-screen\|max-h-screen\|h-screen" src/` = 1 hit, a própria linha 54). `IndexHeader`,
`IndexTimer`, `IndexScore` e o layout de 2 colunas (`page.tsx:66-74`, `gap-24`, `md:flex-row`) não
fazem nenhuma suposição de altura de viewport — nenhum `vh`, `sticky`, `fixed` ou `overflow` nos
três componentes. Deixar a coluna esquerda (Timer+Score) e a direita (Tasks) crescerem juntas com
scroll de página é consistente com o flex-column atual; não precisa de leitura mais ampla.

## Resposta à pergunta do delta — estado atual de N4 (overflow horizontal de página)

**Resolvido como efeito colateral do step 01**, com evidência medida (não é inferência): o
verdict de `tests-01` (`.claude/tasks/2026-08-15_correcao-layout-tasks/steps/01_overflow-horizontal-e-colapso-grupo/tests-01/verdict.md:39-46`)
mediu `document.documentElement` em 4 estados (task solta com/sem debug rodado, task de grupo
com/sem debug rodado): `scrollWidth == clientWidth == 605` nos 4 casos, "none — PASS". Ou seja
N4 não sobreviveu ao step 01 nos cenários testados (confirma a hipótese da memória de que N4 era
consequência do BUG A/overflow-y-auto). **Ressalva real:** essa medição foi feita com poucas
tasks (1 solta + 1 grupo), não com o cenário "≥8 ativas" que o próprio plano deste step pede como
caso mínimo (1) — o plano já prevê re-checar isso em runtime durante o teste de sistema deste
step, então não é um gap de recon, é o próprio caso de teste do plano fazendo o trabalho.

## Veredito de complexidade

1. Uma frente só? **sim** — só frontend, CSS/Tailwind puro (page.tsx, IndexTasks.tsx, IndexFooter.tsx, global.css).
2. Footprint de no máximo 6 arquivos a criar/editar? **sim** — 4 arquivos (`IndexTasks.tsx`, `page.tsx`, `global.css`, `IndexFooter.tsx`), confirmado pela leitura completa acima.
3. Existe molde/irmão claro para espelhar? **sim** — a própria linha `max-h-[calc(100vh-400px)] overflow-y-auto` que sai de `IndexTasks.tsx:30` é o molde exato do que entra em `IndexFooter.tsx:81`.
4. Zero decisão de arquitetura/produto em aberto? **sim** — P1-P4 já são binding no plan-simplified.md; o próprio plano classifica isto como `julgamento` mas as decisões de PRODUTO (valor do max-h, o que remove/adiciona) já estão fechadas, restando julgamento de EXECUÇÃO (destravar 3 lugares do shell sem quebrar o layout responsivo).
5. Zero lógica/algoritmo novo não-trivial? **sim** — é só troca/adição de classes Tailwind e ajuste de CSS global; nenhum estado, hook ou lógica nova.

`veredito: simples`

## Sinal de partição

`partição: não` — não há módulo/util novo nem suíte de teste nova; é edição pontual em 4 arquivos existentes.
