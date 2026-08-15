APPROVED_WITH_RESALVAS

# Review r1 — step 02 `scroll-vertical-ativas-e-inativas`

Validador fresh (Opus). Base `91fd07b`, branch `main`. Revisados apenas os 4 arquivos do escopo,
via `git diff -U6`. Type-check já rodou (exit=0) e não foi re-executado.

## 1. Completude vs. critérios de aceite (7/7 atendidos)

| # | Critério | Resultado |
|---|---|---|
| 1 | zero `max-h-screen` em `src/` | OK — `grep -rn "max-h-screen" src/` sem resultado |
| 2 | zero `overflow` em `IndexTasks.tsx` | OK — grep sem resultado |
| 3 | `IndexTasks.tsx:30` mantém `min-h-[250px]` + `flex flex-col gap-3` | OK — `className="flex flex-col gap-3 min-h-[250px]"` |
| 4 | zero `height: 100%` em `global.css`; `width:100%` e `.dark .body-df` intactos | OK — só `min-height: 100%` em `:45` e `:68`; `.body-df` mantém `width: 100%`; `.dark .body-df` inalterado |
| 5 | `IndexFooter.tsx:81` com as 2 classes novas e `ProgressBar` fora do bloco | OK — `:81` `flex flex-col gap-3 max-h-[calc(100vh-400px)] overflow-y-auto`; bloco fecha em `:91/:92`, `ProgressBar` em `:94` fora dele |
| 6 | `npx tsc --noEmit` limpo | OK (informado no prompt, não re-rodado) |
| 7 | diff toca exatamente 4 arquivos de código | OK para código; ver Ressalva 2 |

Bindings conferidos um a um: P1 (altura+scroll migrados de ativas para concluídas) OK · P2 (mesmo
valor `max-h-[calc(100vh-400px)]` que saiu das ativas) OK, valor idêntico caractere a caractere ·
P3 (nenhum container novo criado; scroll passa a ser da janela) OK · P4 (`min-h-[250px]` permanece)
OK · A1 (`height`→`min-height`, sem apagar) OK · A2 (`min-h-screen` permanece em `page.tsx:54`, só
`max-h-screen` saiu) OK no código-fonte, com a ressalva 1 sobre o efeito real em runtime · A3
(nenhum `overflow` novo em html/body/#root/.body-df) OK — `grep -rn "overflow" src/layout/styles/`
sem nenhum resultado.

## 2. OUT respeitados (sem drift)

`git diff --stat` confirma: nenhuma alteração em card de task/grupo (`IndexTaskItem.tsx`,
`IndexAlertSelect.tsx`), em `IndexScore`/`scoreUtils`, no átomo `Select`, e nada de
`sticky`/`fixed` novo (`grep` de `sticky|position: fixed` só acha os dois usos pré-existentes do
`Dialog/content.tsx`). PNGs da raiz intocados.

## 3. Correção do que mudou (verificações positivas)

- **Nenhum filho depende mais de altura percentual do shell.** Os únicos `h-full` do projeto
  (`IndexDebugTimer.tsx:95`, `Timer/index.tsx:74`, `IndexTaskItem.tsx:181` e `:233`) estão dentro de
  caixas com altura própria/absolutas; a troca `height:100%` → `min-height:100%` em
  `html, body, #root` não colapsa nenhum deles.
- **Empty-state continua centralizado.** `IndexTasks.tsx:32` usa `grow flex items-center
  justify-center` dentro do container que ainda tem `min-h-[250px]` — o pai continua dando os 250px,
  logo o caso "0/1 ativa" segue válido.
- **A nova lista de concluídas não reintroduz scroll horizontal.** `overflow-y: auto` faz o eixo X
  computar como `auto`, mas `IndexCompletedTaskItem.tsx:55` e `:60` usam `break-all` no título e no
  badge de grupo, então o conteúdo quebra em vez de estourar a largura. Sem risco de barra
  horizontal nova nesse container.
- **Fundo da página não regride.** Mesmo que `.body-df` deixe de cobrir a viewport (ressalva 1), o
  canvas é pintado pelo elemento raiz (`html, body, #root` / `.dark, .dark body, .dark #root`), com
  a mesma cor. Sem "faixa branca" no dark mode.

## 4. Ressalvas (registrar, não corrigir em silêncio)

### R1 — `src/layout/styles/global.css:68` neutraliza o `min-h-screen` de `src/pages/index/page.tsx:54`

Mecanismo (é cascata, não estilo): o projeto é Tailwind v4 (`@import "tailwindcss"` em
`global.css:2`), então `.min-h-screen` vive na layer `utilities`. A regra `.body-df { min-height:
100% }` é **unlayered**, e declarações sem layer vencem qualquer `@layer` no cascade — logo
`min-height: 100%` sobrepõe `min-height: 100vh` no mesmo elemento. E como `#root` agora tem altura
`auto`, um `min-height` percentual contra containing block de altura automática resolve para `0`.
Resultado: o shell `.body-df` passa a ter altura de conteúdo, e a garantia "shell nunca menor que a
viewport" que a decisão A2 pretendia preservar é inerte.

Por que **não** é `CHANGES_REQUIRED`: (a) é consequência direta da combinação A1+A2 do próprio
plano, não desvio do implementador; (b) não produz quebra visível hoje — o fundo é pintado pelo
root (ver §3) e nada na árvore depende de um shell com altura de viewport: a cadeia de `flex-1` já
se interrompe em `page.tsx:56`, um `flex flex-col` sem `flex-1`, então o `flex flex-1 ...
justify-center` de `page.tsx:62` (tela de permissão de notificação) já era centrado só no conteúdo
antes desta mudança.

Risco a registrar: qualquer mudança futura que confie em `min-h-screen` nessa div vai falhar
silenciosamente. Se o orquestrador quiser fechar isso, é uma linha (remover `min-height` de
`.body-df`, deixando o utilitário `min-h-screen` fazer o trabalho) — mas está **fora** do escrito no
plano, então deve ser decisão explícita, não fix embutido.

### R2 — o diff tem 6 arquivos, não 4

Além dos 4 arquivos de código, `git diff --stat` mostra
`.claude/tasks/2026-08-15_correcao-layout-tasks/agents.md` (+4/-1) e
`.claude/tasks/2026-08-15_correcao-layout-tasks/orquestration.md` (+9). O conteúdo é escrituração de
nível 0 do fechamento do **step 01** (ledger `S01`, veredito `step-fechado`, commits
`e521536/a223747/91fd07b`), não código de produto e não drift deste step. Sem impacto no critério
substantivo, mas o critério literal "toca exatamente 4 arquivos" só passa se esses dois forem
commitados à parte / contabilizados como bookkeeping.

## 5. Sem findings de padrão de repo

Ambos os containers de scroll seguem o mesmo idioma já usado em
`IndexTaskNoteDialog.tsx:92`/`:94` (`max-h-[...] overflow-auto` via classe utilitária inline).
Nenhum padrão novo foi inventado; nenhuma dependência, arquivo ou helper foi criado.

## 6. O que o teste de sistema ainda precisa provar

O que revisão estática não cobre e cai para `tests-01/`: (1) com ≥8 ativas, a janela rola e a lista
de ativas não tem barra própria; (3) concluídas com ≥15 itens respeitando `calc(100vh-400px)`;
(5) regressão de scroll horizontal em escala (N4). Sugestão adicional derivada de R1: conferir de
relance, com pouco conteúdo (0 ativas, concluídas ocultas), que não aparece faixa de fundo divergente
no rodapé da viewport em dark mode — a análise diz que não aparece, mas é barato confirmar.
