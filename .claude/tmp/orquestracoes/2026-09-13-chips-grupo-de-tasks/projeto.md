# Cartão do projeto — timertask-desktop

docs de contexto: CLAUDE.md · nenhuma (unidade afetada é a raiz, mesma doc)
unidades do projeto: raiz — pacote único; front-end React/Vite em `src/` e backend nativo Tauri/Rust em `src-tauri/`, sem declaração de workspaces
unidade afetada: raiz
comando de teste: nenhum
comando de verificação: `npm run lint:fix`, depois `npx tsc --noEmit` (ordem do CLAUDE.md)
comando de ambiente: `npm run dev` — http://localhost:1420 (Vite; `strictPort: true`, reaproveitar servidor já de pé)
pré-requisito de ambiente: nenhum
mecanismo de fixtures: nenhum
convenção de teste: n/a
skills de contexto: nenhuma skill de contexto de unidade; skill de implementação do projeto: `task-implementar-e-validar`
memória do projeto: `.claude/memory/business-rules/README.md` (uma entrada, parece de outro produto — não aplicada aqui); demais categorias (`environment`, `decisions`, `rules`, `user-preferences`, `fails-and-lessons`, `vocabulary`) sem entradas
fluxo de dados persistentes: nenhum — estado local via `localStorage` ad-hoc por feature (`timertasks:workflows`, tasks, reports, tema), sem schema nem migração
convenções que o plano tem que respeitar: rodar `npm run lint:fix` e `npx tsc --noEmit` ao final de qualquer edição; nunca supor intenção do usuário quando o código pode responder, e perguntar só o que só o usuário sabe; usar `AskUserQuestion` antes da primeira edição quando o escopo estiver ambíguo
