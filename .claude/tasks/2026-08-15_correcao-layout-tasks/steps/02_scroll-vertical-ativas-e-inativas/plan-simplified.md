# Step 02 — scroll-vertical-ativas-e-inativas

> Leia `../../memoria-da-task.md` ANTES deste arquivo — em especial §1.3 (o que o print
> `3-active-tasks.png` mostra, você não vai vê-lo), §2.2 (footprint completo do travamento de altura),
> §5 (o que este step assume do 01) e §6 (traps N1/N2 e as de teste). Este plano não repete o que está lá.

## Objetivo

Pedido literal do usuário: *"não devemos ter um scroll interno das tasks ativas — somente das tasks
inativas — as tasks ativas podem esticar as páginas"*.

1. A lista de tasks **ativas** deixa de ter scroll interno e passa a esticar; a **página inteira**
   passa a rolar verticalmente.
2. A lista de tasks **inativas/concluídas** (o accordion do rodapé) passa a ter altura máxima + scroll
   interno próprio.

## IN

- Remover `max-h-[calc(100vh-400px)]` e `overflow-y-auto` de `IndexTasks.tsx:30`, **mantendo**
  `min-h-[250px]` (P4).
- **Destravar o shell de altura fixa** (P3, trap N2) — sem isto a lista cresce e o conteúdo simplesmente
  some abaixo da dobra, sem scroll nenhum. São 3 lugares e todos importam:
  `page.tsx:54` (`max-h-screen`), `global.css:44-47` (`html, body, #root { height:100% }`),
  `global.css:67-71` (`.body-df { height:100% }`).
- Dar altura máxima + `overflow-y-auto` à lista de concluídas em `IndexFooter.tsx:80-92`.
  **Valor: `max-h-[calc(100vh-400px)]`** (P2 — o mesmo que sai de `IndexTasks.tsx:30`).
- Verificar/corrigir o transbordo horizontal da PÁGINA (barrinha no rodapé da janela, memória §1.3 e
  trap N4) **se ele sobreviver ao step 01**.

## OUT

- Não reintroduzir nenhum scroll interno na lista de ativas, em nenhuma forma (nem `max-h` "generoso",
  nem `overflow-auto` num ancestral intermediário).
- Não tornar a coluna esquerda (`IndexTimer` + `IndexScore`, `page.tsx:66-73`) `sticky`/`fixed`: não foi
  pedido, e é mudança de comportamento (P9).
- Não mexer no card de task nem no card de grupo — foi o step 01.
- Não mexer em `IndexScore`/`scoreUtils` (N5, P9).

## Respostas/premissas que valem para ESTE step

- **P1** — "só as inativas devem ter scroll interno" é literalmente mover a restrição de altura+scroll
  da lista de ativas para a lista de concluídas.
- **P2** — altura máxima da lista de concluídas = `max-h-[calc(100vh-400px)]` (mesmo valor que existe
  hoje). É a única premissa de produto da task; um valor diferente é troca de uma classe em uma linha.
- **P3** — o scroll passa a ser da página inteira (window scroll), não de um novo container interno.
- **P4** — `min-h-[250px]` permanece na lista de ativas.

## Arquivos / âncoras sugeridos

- `src/pages/index/components/IndexTasks/IndexTasks.tsx:30` (e `:14`, `:44` como contexto)
- `src/pages/index/page.tsx:54` (e `:55-74` para entender o layout de 2 colunas)
- `src/layout/styles/global.css:44-47` e `:67-71`
- `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx:80-92` (e `:44-65`, o gatilho do
  accordion)

## Dependências do step 01

**Dura.** O step 01 tem de ter eliminado o overflow horizontal do card ANTES: `overflow-y:auto` implica
`overflow-x:auto` (trap N1), então é o container de `IndexTasks.tsx:30` que hoje converte o conteúdo
largo demais em scrollbar. Removendo esse container com o BUG A ainda vivo, o conteúdo passa a **vazar
por cima** do layout — pior que o bug original. Confirme no início do step que a lista de ativas não tem
mais scroll horizontal antes de remover a linha `:30`.

## Modo de teste de sistema

**Docker+browser only.** É layout puro e não há suíte nem Docker no repo (trap T9): na prática
`npm run dev` (Vite, porta fixa **1420**) + Playwright MCP, com os contornos de notificação /
`browser_click` / fixture no localStorage da memória §6. `.test` não se aplica.

Casos mínimos: (1) com muitas tasks ativas (≥8), a lista NÃO tem barra de rolagem própria e a **janela**
rola; (2) com 0 e com 1 task ativa o layout não colapsa nem fica com buraco (o `min-h-[250px]` segura);
(3) accordion de concluídas aberto com muitos itens (≥15) tem barra própria e respeita a altura máxima;
(4) header, `IndexTimer` e `IndexScore` continuam corretos ao rolar a página; (5) **regressão**: sem
scroll horizontal em lugar nenhum (nem na lista, nem na janela); (6) **regressão**: colapsar/expandir
grupo ativo (BUG C do step 01) continua funcionando com a nova altura da lista.

## CLASSE

**`julgamento`.** Mexe no shell global da página em 3 arquivos (incluindo CSS global que afeta toda a
aplicação), com raio de regressão sobre header, timer, score e o layout de 2 colunas responsivo, e exige
decidir como o scroll de janela convive com um app desktop Tauri de altura fixa. Não é espelho mecânico
de nenhum molde existente.
