# plan-simplified.md — step 03 · `botao-reports-e-abas-hoje-semana`

> Leia `../../memoria-da-task.md` ANTES de qualquer coisa. Este arquivo só carrega o recorte do step.

## Objetivo

Botão **"Reports"** no canto superior direito do card de tasks, seguindo o padrão de design atual,
abrindo um dialog com duas abas — **Today** e **Week** — que listam as tasks concluídas (com nome,
horário e duração) e mostram os totais de horas trabalhadas e ciclos do recorte.

## IN

- Gatilho em `components/IndexTasks/IndexTasks.tsx`: envolver o bloco de título (`:15-23`) numa linha
  `flex items-start justify-between` e colocar o botão à direita com `shrink-0` (memória §6).
  Estilo: **botão neutro com borda**, molde `IndexDarkModeToggle.tsx:8-20`
  (`rounded-xl border border-Black-100 bg-White text-Black-500 hover:bg-Black-100` + variantes `dark:`),
  com ícone `lucide-react` (`BarChart3` / `ChartColumn` / `FileText`) **e** o rótulo `Reports`
  (P14). Não usar o `Button` atom sem sobrescrever o padding (trap T10).
- Novo diretório `components/IndexTasks/IndexReportsDialog/` com o dialog e seus filhos
  (o repo agrupa componente + filhos por pasta: ver `IndexHeader/components/IndexWorkflowDialog/`).
- `Dialog.Root` **controlado** (`isOpen` + `onOpenChange`, molde `IndexTaskNoteDialog.tsx:75-93`),
  `Dialog.Content title="Reports"` com `description` curta e
  `className="w-[640px] max-h-[80vh] overflow-auto"` (o padrão é 420px — `Dialog/content.tsx:30`).
- Abas **Today** / **Week** em estado local (`useState`), no padrão visual do app (nada de lib nova).
  Today = a entrada do dia corrente; Week = os 7 dias rolantes (P5), agrupados por dia, do mais
  recente para o mais antigo.
- Por recorte, um cabeçalho com os totais: **horas trabalhadas** (`focusedSeconds` somado, formatado
  no molde `formatDuration` de `IndexScore.tsx:12-23`), **ciclos** (`cycles` somado) e **tasks
  concluídas** (`completedCount` somado).
- Linha de task concluída: título, badge do grupo e badge do workflow (P8 — mostrar o badge de
  workflow apenas quando houver mais de um workflow), horário de conclusão e duração
  (`formatTime` de `code/utils/date.ts`). Molde visual: `IndexFooter/IndexCompletedTaskItem.tsx:44-92`
  — **espelhar o estilo, não importar o componente** (ele depende de `Task` e de `timeEvents`, que o
  relatório não tem).
- Estados vazios: sem nada hoje / sem nada na semana, no molde `IndexTasks.tsx:31-38`.
- Dark mode em toda classe nova (trap T11).

## OUT

- A seção de histórico agregado dos dias fora da janela (é o **step 04** — não antecipar).
- Qualquer escrita no store de reports: este step **só lê** (a alimentação é do step 02).
- Export CSV/JSON, gráfico, seletor de data, edição/remoção de registro (P15).
- Alterar `IndexScore`, `IndexFooter`, o store de tasks ou o de reports (P10).
- Rota/página nova — o app é single-page, não há router (P14).

## Respostas do usuário que valem para ESTE step

- **P5** "semana" = 7 dias rolantes, coerente com a retenção.
- **P6/P7** a lista mostra as concluídas (`completedAt != null`); o total de horas soma
  `secondsToday` de **todas** as entradas do dia, inclusive não concluídas.
- **P8** escopo global entre workflows, com badge de workflow.
- **P14** botão com ícone + rótulo "Reports" no canto superior direito do card, abrindo `Dialog`.
- **P15** sem export, gráfico ou seletor de data.

## Arquivos / âncoras

- `src/pages/index/components/IndexTasks/IndexTasks.tsx:14-23` (header do card — onde o botão entra).
- `src/pages/index/components/IndexHeader/components/IndexDarkModeToggle.tsx:8-20` (estilo do botão).
- `src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowDialog.tsx:7-27`
  (dialog simples com lista + footer).
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskNoteDialog.tsx:75-117`
  (dialog controlado, largo, com scroll interno).
- `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx:44-92` (linha com
  badge, horários e duração) e `:16-30` (`formatClockTime` / `formatClockValue`).
- `src/pages/index/components/IndexScore.tsx:12-23` (`formatDuration`) e `:66-94` (bloco de métrica).
- `src/code/utils/date.ts` (`formatTime`).
- Tokens de cor e regra de dark mode: memória §4.2.
- Seletores de leitura: `getEntriesInWindow` do step 01 (`states/reports/utils.ts`).

## Dependências de steps anteriores

Steps 01 e 02 entregues: `timertasks:reports` existe, é hidratado com retenção e é alimentado com o
dia corrente. Este step consome o contrato do §3 da memória **como está**.

## Modo de teste de sistema

**Docker+browser only** (`npm run dev` + Playwright MCP). Roteiro mínimo: criar/rodar/concluir uma
task; abrir o dialog pelo botão do canto superior direito; conferir a aba Today (task pelo nome,
duração, totais de horas/ciclos/tasks) e a aba Week (agrupada por dia, incluindo hoje); conferir
estado vazio; screenshots **claro e escuro** do card com o botão e do dialog aberto (trap T11);
conferir que o header do card não quebrou com o card em `max-w-[600px]` (memória §6).

## CLASSE

**`julgamento`.** Espelha molde para o botão e para a linha de task, mas define a estrutura da view,
o comportamento das abas, os recortes de agregação exibidos e os estados vazios — decisões de UI que
não existem prontas em lugar nenhum do repo.
