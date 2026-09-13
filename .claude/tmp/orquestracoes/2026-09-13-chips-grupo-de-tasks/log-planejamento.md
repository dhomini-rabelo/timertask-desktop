# Planejamento — chips de projeto abaixo do input de adicionar task, que prefixam o título

Início: 2026-09-13 (E6 disparada)
Pasta: .claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/
Projeto: raiz (React/Vite em src/, Tauri em src-tauri/) — projeto.md
Spec: 10 AC, 22 RT, 2 SHOULD — spec.md
Corte: sem corte
Onda: onda única
Roteiro: 27 provas: 27 screenshots, 0 casos de suíte — roteiro.md

## Etapas

| # | Papel | Agente | Modelo | Veredito |
|---|---|---|---|---|
| E6 | reconhecimento | recon-chips-grupo-de-tasks | sonnet | simples, estado confirma, fixtures: sem mecanismo |
| E7 | dúvidas e roteiro | — | — | 2 dúvidas / 1 perguntada, roteiro: 27 provas, 1 acrescentada |
| E8 | plano | plano-chips-grupo-de-tasks | sonnet | 23 passos / 3 cp, 22/22 RT, marcos: nenhum, onda única |
| E9 | gate do plano | — | — | aprovado |

## Dúvidas técnicas (E7)
Levantadas: onde os projetos moram (array próprio com FK vs aninhado em Workflow); a engrenagem atual do header some ou fica.
Perguntadas: a engrenagem — o dev respondeu que ela continua, mas passando a abrir o modal de configurações novo (com o switch), e não mais o de workflows; o modal de workflows passa a ser alcançado só pelo "Manage" do select. Isso corrigiu RT-015 e RT-017 na spec e S16 no roteiro.
Assumidas: os projetos vão num array próprio com `workflowId` como chave, espelhando o padrão de Task e o filtro de useListingTasks; o tipo e o CRUD de Workflow não são tocados.

## Roteiro de comprovação (E7)
Proposto: 26 provas — 26 screenshots, 0 casos de suíte
Ambiente: npm run dev — http://localhost:1420
Fechado: o nível 0 achou RT-014 provado só pela metade (nome vazio sim, nome repetido não) e propôs a S27; o dev aprovou as 27. S16 reescrita para nomear a engrenagem do header.
Arquivo: roteiro.md

## RT por lane (E6)
codigo: RT-001, RT-002 (2) · browser: RT-003 a RT-022 (20) · teste: indisponível, nenhum RT


## Premissas assumidas
- Projetos em array próprio com `workflowId` como FK, espelhando `Task.workflowId` (assumida pelo nível 0 na E7).
- RT-014: o planejador implementou recusa de nome duplicado em `addProject`/`editProject`, apesar de o CRUD de workflow não recusar duplicado hoje — as duas frases do RT-014 estão em tensão e a prova S27 do roteiro aprovado trava a recusa.
- `selectedProjectId` é campo único e global, não persistido; só é limpo quando o projeto selecionado é excluído.
- Chave nova de localStorage `timertasks:settings` guardando `{ projectsEnabled }`.
- Valor sentinela `"manage-workflows"` para a opção Manage do select.
- Switch feito à mão como `<button role="switch" aria-checked>`, sem dependência nova (RT-002).

## Desvios da spec
- nenhum

## Handoffs
- E8: o planejador reportou `handoff` (janela em 88%) depois de fechar o plano com todas as seções completas; nenhuma seção ficou pendente e nenhum sucessor foi disparado.

## Gate do plano (E9)
aprovado

## Resultado
plano aprovado
Plano: .claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/plano.md
Lanes: browser, codigo
Cobertura: 22/22 RT
Provas: 27 do roteiro no plano de teste; acrescentadas pelo planejador: nenhuma; dispensadas: nenhuma
Checkpoints: 3
Fixtures: sem mecanismo
Ambiente: npm run dev — http://localhost:1420
Estado: nenhum
Fim: 2026-09-13
