# Teste — lane browser — rodada 2 — inserir-task-inline

## Veredito
PASS

## Ambiente
pré-requisito: nenhum (campo `pré-requisito de ambiente` não se aplica a este cartão — `Fixtures`
diz "veredito: sem mecanismo", nenhum serviço remoto exigido).
ambiente: `npm run dev` (Vite, porta fixa 1420) — não estava no ar; subi eu (probe `curl` em
`http://localhost:1420/` retornou vazio antes de subir).
url: http://localhost:1420/
estado: nenhum comando automatizado (conforme `estado: nenhum comando automatizado — montar
dirigindo a UI` do `plano.md`). Não reconstruí o estado do zero: a mesma janela do Chrome
(extensão Playwright) ainda tinha o `localStorage` deixado pela rodada 1, com o card "Group X"
expandido mostrando a seção Active com "Sub 1", "Sub Ativa Nova", "Sub 2" (3 itens → 3 frestas) e a
seção Pending com "Sub Nova", "Sub Final" (2 itens → 2 frestas). Esse estado é o mesmo cenário
documentado em `teste-1-browser.md` (grupo com múltiplas subtasks/frestas em seções diferentes,
exatamente onde o vazamento de hover foi reproduzido na rodada 1) e ainda mais rico que o mínimo do
roteiro (5 frestas no total dentro do grupo, não só as 2 do `S10`) — decisão: reusar em vez de
recriar, por ser cenário conhecido/documentado e escopo desta rodada ser só o RT-011.
unidades: Vite dev server, http://localhost:1420/, subida por mim nesta rodada.

## RT provados

### RT-011 (AC-004) [MUST]
Requisito: Tudo de RT-004 a RT-010 vale igual entre as tasks de um grupo/subtask, e a task criada
nasce dentro daquele grupo, na posição da fresta e na seção daquela fresta. (Escopo desta rodada:
só a parte de isolamento de hover por fresta, que foi o que reprovou na rodada 1 — corrigido no
commit `07fd675`. A parte de criação/posicionamento já tinha passado na rodada 1 e não foi
retestada, por instrução do delta.)
Como provei: com o card "Group X" expandido (seção Active: "Sub 1", "Sub Ativa Nova", "Sub 2";
seção Pending: "Sub Nova", "Sub Final"), hover isolado em cada uma das 5 frestas do grupo, uma de
cada vez, com screenshot full-page após cada hover: acima de "Sub 1" (Active), entre "Sub 1" e "Sub
Ativa Nova" (Active), entre "Sub Ativa Nova" e "Sub 2" (Active), acima de "Sub Nova" (Pending) e
entre "Sub Nova" e "Sub Final" (Pending). Controle final: hover fora de qualquer fresta (título
"Tasks").
Provas: n/a (a run não numerou provas específicas de rodada 2; capturas abaixo mapeadas por fresta)
- r2-s10-hover-active-fresta1.png → visível: só "+ adicionar task" acima de "Sub 1"; nenhum outro
  rótulo (nem entre Sub1/Sub Ativa Nova, nem em Pending) aceso.
- r2-s10-hover-active-fresta2.png → visível: só "+ adicionar task" entre "Sub 1" e "Sub Ativa
  Nova"; nenhum outro aceso.
- r2-s10-hover-active-fresta3.png → visível: só "+ adicionar task" entre "Sub Ativa Nova" e "Sub 2"
  (página rolou e "Sub 1"/"Sub Ativa Nova" saíram da viewport, mas o rótulo aparece na posição
  correta, imediatamente acima de "Sub 2"); nenhum outro rótulo aceso.
- r2-s10-hover-pending-fresta1.png → visível: só "+ adicionar task" acima de "Sub Nova"; nenhum
  rótulo da seção Active aceso junto.
- r2-s10-hover-pending-fresta2.png → visível: só "+ adicionar task" entre "Sub Nova" e "Sub Final";
  nenhum outro aceso.
- r2-s10-controle-sem-hover.png → visível: nenhum rótulo "+ adicionar task" na tela (mouse fora de
  qualquer fresta).
Esperado: hover isolado por fresta, igual à raiz — só o rótulo da fresta sob o cursor aparece.
Observado: confirmado nas 5 frestas do grupo (3 na seção Active, 2 na seção Pending) — nenhum
vazamento cruzado (nem dentro da mesma seção, nem entre seções diferentes do mesmo grupo). O bug
da rodada 1 (`r1-s10-bug-vazamento-hover.png`, hover acima de "Sub 1" acendendo também o rótulo
acima de "Sub 2") não reproduziu.
Resultado: PASS

## Cobertura da lane
1 de 1 RT desta rodada exercitado (RT-011, único no escopo desta rodada — os demais RT da lane já
passaram na rodada 1 e não foram tocados pela correção, conforme instrução do delta).
provas: 6 de 6 capturas planejadas para este RT produzidas (5 frestas + 1 controle sem hover).

## O que quebrou
Nada — RT-011 passou.

## Registros tocados
Nenhum arquivo de configuração versionado editado. `localStorage["timertasks:tasks"]` (e afins) do
Chrome usado pela extensão Playwright permanece com o estado herdado da rodada 1 (não alterado
nesta rodada — só hover, nenhuma criação/edição feita).
