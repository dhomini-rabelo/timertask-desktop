# Plano — step 02 `scroll-vertical-ativas-e-inativas`

Task `correcao-layout-tasks`, último step. Classe `julgamento` / veredito de recon `simples`.
Escopos de implementação: **1** (`prompts/scroll-vertical-ativas-e-concluidas.md`).

Perguntas ao usuário nesta rodada: **sem dúvidas** — P1-P4 já são binding via `plan-simplified.md`,
e o recon fechou as duas incógnitas de execução (ripple do shell, estado de N4).

---

## Premissas assumidas

Tudo abaixo é **binding** para implementer, revisor e testador.

- **A1 — `height: 100%` vira `min-height: 100%`, não é apagado.** Nas duas regras de
  `global.css` (`html, body, #root` e `.body-df`) a declaração de altura muda de `height` para
  `min-height`. Motivo: o que aquelas linhas realmente entregam hoje é *piso* de altura para o
  fundo pintar a viewport inteira (elas vêm coladas em `background-color`); `min-height` preserva
  esse piso e remove o *teto*, que é o que trava o scroll. Apagar a linha também funcionaria, mas
  `min-height` documenta a intenção e é reversível numa palavra.
- **A2 — `min-h-screen` fica em `page.tsx:54`; só `max-h-screen` sai.** O `min-h-screen` é o piso
  de viewport de fato (percentual de `min-height` em `body`/`#root` resolve contra pai de altura
  `auto` e vira inerte); é ele que garante que a tela curta não mostre faixa de fundo errada.
- **A3 — nada de `overflow` novo em `html`, `body`, `#root` ou `.body-df`.** Qualquer `overflow`
  ali reintroduz o bug por outra porta (ou clipa, ou cria scroll duplo). O scroll vertical passa a
  ser o da janela, por ausência de restrição (P3).
- **A4 — o wrapper de scroll das concluídas é o `div` que JÁ existe** em `IndexFooter.tsx:81`
  (`flex flex-col gap-3`), que só ganha as duas classes. Não se cria um `div` novo, não se move o
  `ProgressBar` (`:94`) para dentro dele, e a linha-gatilho do accordion (`:44-65`) fica fora do
  scroll — ela precisa continuar sempre visível/clicável.
- **A5 — `IndexTaskNoteDialog` não é clipado pelo novo `overflow-y-auto`.** Verificado nesta
  rodada: `Dialog/content.tsx:20,52` usa `RadixDialog.Portal`, ou seja o modal de nota do
  `IndexCompletedTaskItem.tsx:83` renderiza fora da árvore do container. É o único elemento
  potencialmente flutuante dentro das concluídas. Nenhum ajuste necessário.
- **A6 — N4 não gera trabalho de implementação.** O overflow horizontal de página já foi
  eliminado como efeito colateral do step 01, com medição (`../01_overflow-horizontal-e-colapso-grupo/tests-01/verdict.md:39-46`:
  `scrollWidth == clientWidth == 605` nos 4 estados). Este step só **re-verifica em runtime** no
  cenário de escala (≥8 ativas), que a medição do step 01 não cobriu. Se reaparecer, vira nota de
  plano (`plan-notes`), não linha de código preventiva agora.
- **A7 — o empty-state da lista de ativas continua correto sem mudança.**
  `IndexTasks.tsx:32` usa `grow flex items-center justify-center` dentro do container flex-column;
  com `min-h-[250px]` preservado (P4) e o teto removido, o `grow` continua preenchendo os 250px.
  Nenhuma classe do empty-state muda.
- **A8 — `page.tsx:55-74` fica intocado.** O `flex-1` de `:55` e o layout de 2 colunas de
  `:66-74` funcionam igual com o shell destravado (`flex-1` com pai `min-h-screen` cresce até a
  viewport e depois acompanha o conteúdo). O recon confirmou que `IndexHeader`, `IndexTimer` e
  `IndexScore` não têm nenhum `vh`/`sticky`/`fixed`/`overflow`.

---

## Estado de git

- Branch: `main`
- Base commit: `91fd07b`
- Working tree limpa **exceto** 3 PNGs untracked na raiz (`test-1.png`, `test-2.png`,
  `3-active-tasks.png`). São evidência do usuário: **não apagar, não mover, não commitar**.

---

## Decisões binding herdadas (P1-P4)

- **P1** — "só as inativas devem ter scroll interno" = mover a restrição de altura+scroll da lista
  de ativas para a lista de concluídas.
- **P2** — altura máxima das concluídas = `max-h-[calc(100vh-400px)]`, **o mesmo valor** que sai de
  `IndexTasks.tsx:30`.
- **P3** — o scroll vertical passa a ser da **janela/página**, não de um novo container interno.
- **P4** — `min-h-[250px]` **permanece** na lista de ativas.

---

## Arquivos e âncoras exatas (4 arquivos, todos edição pontual)

| # | Arquivo | Linha | Mudança |
|---|---|---|---|
| 1 | `src/pages/index/components/IndexTasks/IndexTasks.tsx` | `30` | `className` de `"flex flex-col gap-3 max-h-[calc(100vh-400px)] min-h-[250px] overflow-y-auto"` para `"flex flex-col gap-3 min-h-[250px]"` |
| 2 | `src/pages/index/page.tsx` | `54` | `"body-df min-h-screen max-h-screen flex flex-col"` para `"body-df min-h-screen flex flex-col"` |
| 3 | `src/layout/styles/global.css` | `45` (regra `html, body, #root`, `:44-47`) | `height: 100%;` para `min-height: 100%;` |
| 4 | `src/layout/styles/global.css` | `68` (regra `.body-df`, `:67-71`) | `height: 100%;` para `min-height: 100%;` (o `width: 100%` de `:69` **fica**) |
| 5 | `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` | `81` | `className` de `"flex flex-col gap-3"` para `"flex flex-col gap-3 max-h-[calc(100vh-400px)] overflow-y-auto"` |

São 5 edições em 4 arquivos. **Nenhum arquivo novo, nenhum componente novo, nenhum estado/hook novo.**

### Molde

O molde é a própria linha que sai: `max-h-[calc(100vh-400px)] overflow-y-auto` de
`IndexTasks.tsx:30` é literalmente o que entra em `IndexFooter.tsx:81` (memória §4). Não há nada a
inferir de outro lugar.

### Footprint que não pode quebrar (recon já mediu)

- `.body-df`: único consumidor é `page.tsx:54`; os outros 2 hits de grep são a definição
  (`global.css:67`) e a dark-variant (`:73`). A dark-variant **não** é tocada.
- `page.tsx:54` é o **único** uso de `h-screen`/`min-h-screen`/`max-h-screen` em `src/`.
- `IndexFooter` só é importado por `IndexTasks.tsx:7`; `IndexPage` só por `App.tsx:2`, e `App.tsx`
  não define altura própria.
- `IndexHeader`, `IndexTimer`, `IndexScore`: zero hits de `h-screen|100vh|overflow|sticky|fixed|height`.
- Outros `overflow` do projeto que **não** se mexe: `IndexTaskNoteDialog.tsx:92,94`,
  `IndexDebugTimer.tsx:93`, `Select/root.tsx:28`.

---

## OUT — não planejar nem executar

- **Não** reintroduzir scroll interno na lista de ativas em nenhuma forma: nem `max-h` "generoso",
  nem `overflow-auto` em ancestral intermediário, nem `h-[...]` calculado.
- **Não** tornar a coluna esquerda (`IndexTimer` + `IndexScore`, `page.tsx:66-73`) `sticky`/`fixed`
  (P9). Não foi pedido e é mudança de comportamento.
- **Não** mexer no card de task nem no card de grupo (`IndexTaskItem`, `IndexTaskGroup`,
  `IndexAlertSelect`, `IndexDebugTimer`) — território do step 01, já fechado no commit `e521536`.
- **Não** mexer em `IndexScore`/`scoreUtils` (N5/P9): as 2 esquisitices são pré-existentes e aceitas.
- **Não** mexer no átomo `Select` (P8) nem em `Select/trigger.tsx`.
- **Não** apagar/mover os PNGs da raiz.

---

## Critérios de aceite

Estruturais (verificáveis por leitura/grep, sem browser):

1. `grep -n "max-h-screen" src/` → **zero** hits.
2. `grep -n "overflow" src/pages/index/components/IndexTasks/IndexTasks.tsx` → **zero** hits.
3. `IndexTasks.tsx:30` ainda contém `min-h-[250px]` e continua `flex flex-col gap-3`.
4. `grep -n "height: 100%" src/layout/styles/global.css` → **zero** hits; as duas regras usam
   `min-height: 100%`; `width: 100%` de `.body-df` intacto; a regra `.dark .body-df` intacta.
5. `IndexFooter.tsx:81` contém exatamente `max-h-[calc(100vh-400px)] overflow-y-auto` somado ao
   `flex flex-col gap-3` que já existia; o `ProgressBar` de `:94` continua **fora** do bloco.
6. `npx tsc --noEmit` passa sem erro novo (T9: não existe suíte, este é o único gate estático).
7. `git diff --stat` toca exatamente 4 arquivos e nenhum outro.

Comportamentais (o teste de sistema prova):

8. Com ≥8 tasks ativas, o container da lista **não** tem barra de rolagem própria e a **janela**
   rola verticalmente (`document.documentElement.scrollHeight > clientHeight`).
9. Com 0 e com 1 task ativa o layout não colapsa nem abre buraco — o `min-h-[250px]` segura, e o
   empty-state segue centralizado.
10. Accordion de concluídas aberto com ≥15 itens: barra de rolagem **própria**, altura respeitando
    `calc(100vh-400px)`, e a linha-gatilho "X of Y completed" segue visível e clicável.
11. Header, `IndexTimer` e `IndexScore` continuam corretos e legíveis ao rolar a página (não somem,
    não sobrepõem, não ficam presos).
12. Regressão: **nenhum** scroll horizontal — nem na lista de ativas, nem nas concluídas, nem na
    janela (`scrollWidth == clientWidth` no `documentElement` e nos dois containers).
13. Regressão: expandir/colapsar um grupo **ativo** continua funcionando com a nova altura de lista.

---

## Teste de sistema

**Modo: Docker+browser only** — na prática **browser only**. Não há suíte de teste nem Dockerfile
no repositório (trap T9), então `.test` não se aplica. O procedimento é `npm run dev` (Vite, **porta
fixa 1420**, `vite.config.ts:18` — falha se a porta já estiver ocupada) + Playwright MCP.

Pasta do teste: `tests-01/` dentro deste step.

### Contornos obrigatórios (todos já validados em steps anteriores, não reinventar)

- **Tela de permissão de notificação:** sobrescrever `window.Notification.permission` (getter →
  `'granted'`) e `.requestPermission` (→ resolve `'granted'`) via `browser_evaluate` **antes** de
  clicar "Allow notifications"; refazer a cada reload.
- **`browser_click` e tecla Enter não funcionam neste app** (timeout de "stable" por causa dos
  cronômetros re-renderizando). Usar native DOM value-setter + `dispatchEvent('input')` para
  inputs, e `element.click()` real via `browser_evaluate`.
- **Fixture no localStorage** (chave `timertasks:tasks`): logo após plantar, monkey-patch
  `Storage.prototype.setItem` para engolir escritas nessa chave na página que está saindo, e só
  então recarregar. Mais confiável que torcer para o `beforeunload` não disparar.
- **DnD (dnd-kit) não é testável por automação neste ambiente** (4 steps confirmaram). Se algum
  caso encostar em drag, registrar `## Not run` — não tentar automação nova.

### Casos mínimos (os 6 de `plan-simplified.md`)

1. **≥8 tasks ativas** — a lista NÃO tem barra própria; a **janela** rola. Medir
   `container.scrollHeight === container.clientHeight` e
   `documentElement.scrollHeight > documentElement.clientHeight`. **Neste mesmo estado, medir
   também `documentElement.scrollWidth === clientWidth`** — é a re-verificação de N4 em escala que
   o step 01 não cobriu (A6).
2. **0 e 1 task ativa** — layout não colapsa nem fica com buraco; `min-h-[250px]` segura; o
   empty-state ("No tasks yet..." / "All tasks completed!") aparece centralizado.
3. **Accordion de concluídas com ≥15 itens** — barra própria, altura máxima respeitada, gatilho
   "X of Y completed" continua clicável e o `ProgressBar` continua abaixo, fora do scroll.
4. **Header / `IndexTimer` / `IndexScore` ao rolar a página** — continuam corretos; nada de
   elemento cortado ou sobreposto no meio do scroll.
5. **Regressão — zero scroll horizontal**: `scrollWidth == clientWidth` no `documentElement`, no
   container das ativas e no novo container das concluídas.
6. **Regressão — colapsar/expandir grupo ativo** com a nova altura de lista. Escopo desta
   verificação: **só a mudança de altura/scroll vertical**. A teoria de overflow horizontal já foi
   refutada dinamicamente no step 01 ("Padrões capturados no step 01": num flex-column com
   ancestral de largura fixa, linha-irmã que transborda na horizontal não desloca nem esconde as
   vizinhas; o chevron ficou em posição idêntica pré e pós-fix). **Não re-litigar BUG C**; só
   confirmar que o chevron continua alcançável e que `collapsed` alterna no store.

---

## Ordem de execução para o implementer

1. **Pré-cheque duro (§5 da memória):** confirmar que a lista de ativas não tem mais scroll
   horizontal ANTES de remover a linha `:30`. Basta confirmar que o fix do step 01 está no código:
   `IndexAlertSelect.tsx:22` com `w-auto shrink-0`, `IndexTaskItem.tsx:248` com `shrink-0`, `:265`
   com `min-w-0`. O recon já verificou os 3 e estão lá — se algum não estiver, **parar e reportar**,
   não seguir. Removendo o container com o BUG A vivo o conteúdo vazaria por cima do layout, pior
   que o bug original.
2. Edições 1→5 da tabela, na ordem (ativas → shell → concluídas).
3. `npx tsc --noEmit`.
4. Os 7 critérios estruturais de aceite.

---

## Por que UM escopo só

Recon deu `partição: não`. São 5 edições de classe CSS/Tailwind em 4 arquivos existentes, sem
módulo novo, sem suíte nova, sem lógica nova, e as três frentes (ativas, shell, concluídas) são
**interdependentes** — separar criaria um estado intermediário quebrado (lista crescendo em shell
travado, conteúdo sumindo abaixo da dobra sem scroll, memória §2.2). Um implementer só.
