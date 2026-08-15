# Veredito — Teste de sistema (browser) — Step 02: item unificado, N cronômetros paralelos

Ambiente: Vite dev server já estava rodando em `http://localhost:1420` (reutilizado, não iniciado por
este teste — logo não foi finalizado ao final). Playwright MCP rodando sob Windows (paths
`C:\Users\T-GAMER\...`); screenshots copiados de
`/mnt/c/Users/T-GAMER/AppData/Local/Temp/.playwright-mcp/` para a pasta deste attempt.

Fixture: em vez de plantar `localStorage` manualmente, as 3 tasks (`Task Alpha`, `Task Beta`,
`Task Gamma`) foram criadas via a própria UI (campo "Add a new task...") no workflow "Work" (default,
já selecionado). Isso evitou risco de erro de shape do fixture e exercita o fluxo de criação real.
Override de `window.Notification` (permission → `granted`, `requestPermission` → resolve `granted`)
foi aplicado via `browser_evaluate` logo após cada navegação/reload, antes de qualquer interação —
na prática a tela de permissão do Tauri nem chegou a aparecer neste ambiente puro-browser, mas o
override foi mantido como precaução. Todos os cliques em botões dentro da lista de tasks foram feitos
via `element.click()` dentro de `browser_evaluate` (localização por texto do título/ícone lucide),
conforme o contorno documentado — `browser_click` funcionou normalmente apenas para os botões fora da
lista de tasks (Start/Stop/Resume do timer global, textbox de criação, edição de título, notas).

Console: 3 mensagens de erro presentes desde o carregamento inicial e estáveis durante todo o teste —
`"A listener indicated an asynchronous response but the message channel closed..."` — assinatura
típica de extensão do Chrome, não relacionada à aplicação. Nenhum erro novo apareceu durante nenhuma
interação.

## Casos

### 1. N cronômetros em paralelo — PASS
Timer global iniciado ("Start"). Play em Task Alpha e depois em Task Beta (sem parar a primeira).
Após 2s: ambas com anel de cronômetro subindo (00:11 e 00:07), borda/fundo verde, badge "Running" nas
duas simultaneamente. Task Gamma permaneceu intocada (sem ring/badge). Iniciar Beta não interrompeu
Alpha.
Screenshot: `screenshots/case01-two-parallel-timers-running.png`

### 2. Pausa em bloco — PASS
Com as duas rodando, cliquei "Stop" no timer global. As duas passaram a badge "Paused", borda voltou
ao cinza padrão, e os valores (00:22 / 00:18) ficaram congelados — reconferido 2s depois com os mesmos
valores exatos.
Screenshot: `screenshots/case02-both-paused-global-stop.png`

### 3. Retoma em bloco — PASS
Cliquei "Resume" no timer global. Após 2s ambas as tasks retomaram a contagem a partir do ponto onde
pararam (00:22→00:31 e 00:18→00:27, ambas +9s, nenhum reset a zero), badge voltou a "Running", borda
verde.
Screenshot: `screenshots/case03-both-resumed-not-reset.png`

### 4. Concluir uma task rodando — PASS
Com as duas rodando, cliquei o botão de check ("Mark as complete") em Task Alpha. Task Alpha saiu
imediatamente da lista ativa (sem piscar/remontar a lista inteira), contador global "Tasks Completed"
foi para 1, "Focused Time" para 1m. Task Beta continuou rodando sem interrupção (00:48 no snapshot
seguinte, badge "Running" mantido, timer global seguiu contando 24:02→23:58).
Screenshot: `screenshots/case04-complete-one-other-continues.png`

### 5. Guard do timer global parado — PASS
Parei o timer global ("Stop") — isso também pausou automaticamente a Task Beta que estava rodando
(comportamento esperado/consistente com o caso 2). Em seguida cliquei play em Task Gamma (nunca
iniciada). Mensagem de erro `"Global timer is not running"` apareceu imediatamente em banner vermelho
com ícone de alerta, e Task Gamma permaneceu sem iniciar (sem ring, badge ou mudança de estado).
Screenshot: `screenshots/case05-guard-global-timer-not-running.png`

### 6. Progressive disclosure — PASS
Confirmado em dois pontos: (a) logo após criação das 3 tasks, nenhuma tinha ring/badge/debug timer,
apenas play (triângulo verde), editar, apagar, seletor de alerta e botão Notes; (b) Task Gamma
manteve esse estado (sem ring/Running/Paused/debug) durante todo o teste até ser apagada no caso 9,
mesmo com outras tasks já cronometradas — confirma que o disclosure é por task, não global.
Screenshot: `screenshots/case06-progressive-disclosure-never-started.png`

### 7. Reload preserva estado sem auto-retomar — PASS
Com Task Beta pausada em 01:03 (timer global parado), recarreguei a página inteira
(`browser_navigate` para a mesma URL). Após o reload: tempo total preservado (01:03 exibido no ring),
botão mostra Play (triângulo verde, não Pause/Stop), a borda do card NÃO está verde (cinza padrão),
badge mostra "Paused" (não "Running"), drag handle (ícone de grade) e botão de apagar (lixeira)
presentes. A task não retomou sozinha — permaneceu parada até nova ação do usuário. Nota: o timer
global voltou a 25:00/parado após o reload, que é esperado pois esse estado é apenas em memória
(não persistido) — fora do escopo deste caso, que trata da persistência da task.
Screenshot: `screenshots/case07-reload-preserves-state-no-autoresume.png`

### 8. Edição e nota — PASS
Editei o título de "Task Beta" para "Task Beta Renamed" via o botão de lápis → input → Enter; salvou
corretamente e o tempo acumulado (01:03) não foi afetado pela edição. Abri o diálogo de notas
("Notes for Task Beta Renamed"), digitei uma nota, botão mudou de "Saved" (disabled) para "Save Note"
(dirty) e ao clicar voltou para "Saved" (disabled). Fechei o diálogo (Escape) e reabri: o texto da nota
apareceu persistido no textarea, com o botão já em estado "Saved".
Screenshots: `screenshots/case08-note-saved.png`, `screenshots/case08-note-reopened-persisted.png`

### 9. Apagar — PASS
Com Task Gamma parada (nunca iniciada, portanto não rodando), cliquei o botão de lixeira. A task sumiu
imediatamente da lista, contador foi para "1 of 2 completed" / progresso 50% (2 tasks ativas restantes
menos as completadas). Nenhum erro no console.
Screenshot: `screenshots/case09-delete-task-gamma.png`

### 10. Drag-and-drop — Not run
Não executado. Ambiente de automação (Playwright MCP headless/CDP) não consegue simular o
pointer-capture real de SO que o dnd-kit exige — nem `browser_drag` nem uma sequência sintética de
`PointerEvent` via `browser_evaluate` produzem um drag funcional nesta lib, conforme já validado por
teste anterior deste mesmo step. Não foi forçado para não travar o veredito por uma limitação de
ambiente alheia ao código sob teste.

## Veredito geral: PASS

Todos os 9 casos executáveis passaram, incluindo os comportamentos centrais da mudança do step
(N cronômetros paralelos, pausa/retoma em bloco preservando tempo acumulado, conclusão de uma task não
afeta as demais, guard do timer global, progressive disclosure, e persistência sem auto-retomada após
reload). O caso de DnD foi registrado como Not run por limitação conhecida e documentada do ambiente
de automação, não por falha do produto. Nenhum overlay de erro de runtime apareceu em nenhum fluxo;
os únicos erros de console observados são ruído de extensão de navegador, presentes desde o primeiro
carregamento e não relacionados à aplicação.
