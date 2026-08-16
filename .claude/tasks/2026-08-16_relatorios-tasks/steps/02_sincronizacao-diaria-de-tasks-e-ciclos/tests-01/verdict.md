# Verdict — step 02 "sincronizacao-diaria-de-tasks-e-ciclos" — tests-01

**Mode:** Docker+browser only (data-layer, no new UI). App served by `npm run dev` on `http://localhost:1420`.

**VEREDITO GERAL: PASS** — os 5 passos do roteiro passaram. A entrada do dia sobrevive ao Reset e ao reload, não duplica tasks, os ciclos avançam por delta (nunca zeram/retrocedem), e não há sinal de loop no console nem no `localStorage` ao longo do tempo.

---

## Observação prévia (não é falha)

O formato real persistido em `localStorage["timertasks:reports"]` é `{ "<yyyy-MM-dd>": DailyReportEntry }` — **sem** o wrapper `entriesByDate` mencionado no contexto da tarefa. Confirmado lendo `src/pages/index/hooks/useStoredReports.ts:47-50`: o que é serializado é `entriesByDate` diretamente (o `Record<string, DailyReportEntry>` do store), não um objeto contendo a chave `entriesByDate`. Isso é só uma imprecisão da descrição do step, não um bug — o `entriesByDate` é o nome do campo *dentro do estado em memória*, mas o que vai para o `localStorage` é o próprio record. Toda a validação abaixo foi feita lendo a chave correta: `JSON.parse(localStorage.getItem("timertasks:reports"))["<data-de-hoje>"]`.

Também havia estado pré-existente no perfil do browser reaproveitado pelo Playwright MCP (uma tarefa "Loose Task Five" com `secondsToday: 3933`, e stats "Focused Time 1h 5m", "Current Streak 2 days"), de uma sessão de teste anterior. Não interferiu na validação — os valores esperados foram sempre conferidos por delta relativo às minhas próprias ações, não por valores absolutos "zerados".

## Passo 1 — Projeção do dia: PASS

Criadas 2 tasks novas ("QA Sync Task A", "QA Sync Task B") no workflow "Work". Rodei o timer da global Pomodoro ("Start"), depois o timer per-task de A por ~13s e parei; depois rodei o timer de B e cliquei "Mark as complete" (torna-se `completedAt` não nulo).

JSON bruto (`timertasks:reports["2026-08-16"]`) após as ações:
```json
{
  "date": "2026-08-16",
  "cycles": 0,
  "focusedSeconds": 3950,
  "completedCount": 1,
  "tasks": [
    { "id": "a7", "title": "Loose Task Five", "secondsToday": 3933, "completedAt": null },
    { "id": "6b114211-...", "title": "QA Sync Task A", "secondsToday": 13, "completedAt": null },
    { "id": "0322296f-...", "title": "QA Sync Task B", "secondsToday": 4, "completedAt": "2026-08-16T15:51:28.541Z" }
  ],
  "namesPurged": false
}
```
Confere: as duas tasks novas estão presentes; `completedAt` não-nulo só em B; `focusedSeconds > 0`; `completedCount === 1`; `namesPurged === false`; `date` bate com a data local de hoje (2026-08-16).

Screenshot: `screenshots/01-projecao-do-dia.png`

## Passo 2 — Reset (crítico): PASS

Cliquei o botão **Reset** do app. A UI zera na hora (Tasks Completed 0, Focused Time 0m, Current Streak 0 days, lista de tasks fica vazia — "No tasks yet"). Reli a chave: a entrada de hoje continuou **idêntica** ao passo 1 — mesmas 3 tasks (Loose Task Five + A + B), mesmo `focusedSeconds: 3950`, mesmo `completedCount: 1`. Nada zerou, nada sumiu.

Screenshot: `screenshots/02-apos-reset-ui.png` (mostra a UI zerada, confirmando que o Reset realmente rodou — o que valida que a persistência do relatório é independente dessa limpeza)

## Passo 3 — Reload sem duplicar: PASS

`browser_navigate` para a mesma URL (reload completo). Reli a chave: conteúdo byte-a-byte igual ao do passo 2 — 3 ids únicos (`a7`, `6b114211-...`, `0322296f-...`), sem repetição, mesmos valores de `focusedSeconds`/`completedCount`/`cycles`.

## Passo 4 — Ciclos por delta: PASS

Não há mecanismo de dev/debug para acelerar o timer (confirmado por grep no código: nenhum `import.meta.env`, `VITE_`, "multiplier"/"speed"/"debug" ligado ao motor do timer). O menor "Activity time" configurável via Settings (gear icon → Pomodoro settings) é 10 min, resting mínimo 20%. Para não gastar ~24 min de espera real, usei a API de clock virtual do Playwright (`page.clock.install()` + `page.clock.fastForward(...)`, via `browser_run_code_unsafe`) para avançar o relógio do browser — isso é uma técnica de teste, não uma feature do produto; o fluxo de cliques exercitado foi o real: Start → (overtime) → **Rest** → (rest esgota sozinho, mostra "Back to Work") → **Back to Work**.

- Ciclo 1: cliquei Start, avancei o clock além dos 10 min, cliquei "Rest", avancei além do período de descanso (auto-parou, mostrou "Back to Work"), cliquei "Back to Work". Relatório: `cycles: 1` (screenshot `screenshots/03-ciclo1-total-cycles-1.png`).
- **Reload da página** (zera o contador em memória — UI voltou a mostrar "Total cycles: 0", confirmando que o contador em memória de fato reseta).
- Ciclo 2: reconfigurei o Activity time para 10 min de novo (não persiste entre reloads, esperado), reinstalei o clock virtual, repeti Start → Rest → avanço → Back to Work. Relatório: `cycles: 2` — **nunca voltou a 1 nem zerou**. UI (em memória, pós-reload) mostrava "Total cycles: 1" nesse momento — a contagem em memória e a contagem persistida por dia são propositalmente independentes (a persistida é a soma acumulada de todos os deltas do dia, mesmo atravessando reloads).

Screenshot: `screenshots/04-ciclo2-report-cycles-2.png`

## Passo 5 — Anti-loop: PASS

Com o app parado (timer global parado via "Stop", sem interação do usuário), li `timertasks:reports` duas vezes com 6s reais de intervalo entre as leituras: conteúdo **idêntico** (string bruta igual). `browser_console_messages` (níveis error e warning, `all: true`) não mostrou nenhum "Maximum update depth exceeded" nem warning de loop de render — as únicas 9 mensagens registradas durante toda a sessão são "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received", um ruído clássico de extensão de browser do Chrome, não do código do app (não referencia nenhum arquivo do projeto, não é um erro React).

---

## Nota lateral (não bloqueante, achado incidental de UX)

Ao clicar em "Mark as complete" numa task, ela **desaparece imediatamente** da lista visível (`IndexActiveTasksList` filtra tasks completas da view). O clique seguinte que eu tentei fazer no botão de stop/play dessa mesma task falhou (`Cannot read properties of undefined`) porque o elemento já não existe mais no DOM. Isso é comportamento esperado do produto (lista mostra só tasks ativas), não um bug do step em teste — só registrando para quem for investigar o próximo passo relacionado a completar tasks via browser.

## Ambiente / dicas para o próximo tester

- Cliques reais via Playwright (`browser_click`, inclusive via `page.getByRole(...).click()`) **travaram consistentemente** neste ambiente (`waiting for element to be visible, enabled and stable`, timeout, mesmo em elementos claramente visíveis/habilitados) — parece um problema do ambiente (servidor Playwright MCP rodando via Windows, ver paths `C:\Users\T-GAMER\...`), não do app. Contornei disparando `element.click()` via `browser_evaluate`/JS diretamente, que funcionou de forma confiável em todas as tentativas.
- Screenshots do MCP caem em `C:\Users\T-GAMER\AppData\Local\Temp\.playwright-mcp\...`, acessível do WSL em `/mnt/c/Users/T-GAMER/AppData/Local/Temp/.playwright-mcp/...` (note: `.playwright-mcp`, não `playwright-mcp-output` como o doc genérico sugere).
- Para exercitar um ciclo completo do Pomodoro sem esperar minutos reais, `page.clock.install()` + `page.clock.fastForward(ms)` via `browser_run_code_unsafe` funciona bem com este motor de timer (baseado em `differenceInMilliseconds` contra `new Date()`, então a virtualização do clock é suficiente).
