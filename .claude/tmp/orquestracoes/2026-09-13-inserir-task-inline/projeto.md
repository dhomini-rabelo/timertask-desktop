# Cartão do projeto — timertask-desktop

docs de contexto: CLAUDE.md · nenhuma (unidade única, mesma doc da raiz)
unidades do projeto: raiz (pacote único; `package.json` não declara `workspaces`. Há `src` — frontend React/Vite/TS — e `src-tauri` — backend Rust do Tauri —, mas não são workspaces npm declarados)
unidade afetada: raiz (o recorte é só frontend, em `src/pages/index/components/IndexTasks` e `src/pages/index/states/tasks`)
comando de teste: nenhum (sem vitest/jest/config no repo; a suíte é prova manual/browser por task, guardada em `.claude/tasks/{data}_{slug}/tests-NN/`)
comando de verificação: `npx eslint . --fix` (config em `eslint.config.js`), depois `npx tsc --noEmit` — CLAUDE.md chama isso de `npm run lint:fix`, mas `package.json` não tem script `lint`/`lint:fix` (diverge; o script não existe no manifesto, o comando real é via `npx` direto)
comando de ambiente: `npm run dev` (Vite, porta fixa 1420, `vite.config.ts`)
pré-requisito de ambiente: nenhum (sem banco/fila/storage externo; estado persiste em `localStorage` do navegador/webview)
mecanismo de fixtures: nenhum (sem seed/factory; provas anteriores montam o estado dirigindo a UI dentro do próprio script Playwright, ex. `.claude/tasks/2026-09-06_layout-task-card/tests-01/run.js`)
convenção de teste: n/a (não há suíte automatizada; provas vivem em `.claude/tasks/{data}_{slug}/tests-NN/run.js` + `screenshots/` + `verdict.md`, rodadas com Playwright/Chromium headless)
skills de contexto: `task-especificar-e-planejar` (esta), `task-implementar-e-validar` (skill de implementação), `save-memory`; agente `browser-tester` em `.claude/agents/browser-tester.md` para prova de tela
memória do projeto: `.claude/memory/README.md` (índice) · `business-rules/`, `decisions/`, `environment/`, `fails-and-lessons/`, `rules/`, `user-preferences/`, `vocabulary/`
fluxo de dados persistentes: nenhum (sem schema/migração; o único "banco" é a chave `timertasks:tasks` no `localStorage`, escrita por `useStoredTasks`)
convenções que o plano tem que respeitar: rodar `npx eslint . --fix` e `npx tsc --noEmit` depois de qualquer alteração (CLAUDE.md); nunca adivinhar intenção — ambiguidade de produto vira pergunta ao dev, não suposição (CLAUDE.md); regra de negócio nova, se houver, vira registro em `.claude/memory/business-rules/` via skill `save-memory`
