# Teste — lane codigo — rodada 1 — chips de projeto abaixo do input de adicionar task

## Veredito
PASS

## Ambiente
pré-requisito: n/a
ambiente: n/a
url: n/a
estado: n/a
unidades: n/a

## RT provados

### RT-001 (AC-Geral) [MUST]
Requisito: Os projetos e o estado do switch são persistidos no mesmo mecanismo de armazenamento
local que os workflows já usam, porque o app não tem backend nem schema e um segundo mecanismo
criaria duas fontes de estado do usuário.
Como provei: `git diff a7519c3 --stat` para achar os quatro arquivos, depois `cat` de cada um.
Provas: n/a
Esperado: projects e projectsEnabled persistidos via localStorage, com chave no padrão
`timertasks:<feature>`.
Observado:
- `src/pages/index/hooks/useStoredProjects.ts:4` — `const localStorageKey = "timertasks:projects";`
  e o hook lê (`localStorage.getItem`) e grava (`localStorage.setItem`) nessa chave.
- `src/pages/index/hooks/useStoredSettings.ts:4` — `const localStorageKey = "timertasks:settings";`
  e o hook lê/grava `{ projectsEnabled }` nessa chave.
- `src/pages/index/states/projects/index.ts` e `src/pages/index/states/settings/index.ts` são
  stores Zustand em memória; a persistência real está nos dois hooks acima, que os consomem.
Resultado: PASS

### RT-002 (AC-Geral) [SHOULD]
Requisito: Não introduzir dependência nova de UI para as chips, o switch e os modais. Se o app
não tiver um primitivo de modal reutilizável, seguir o desenho do modal de workflows que já
existe, nesta ordem.
Como provei: `git diff a7519c3 -- package.json package-lock.json` (vazio) e leitura de
`IndexProjectChips.tsx`, `IndexProjectsDialog.tsx`, `IndexSettingsDialog.tsx`,
`IndexProjectsSwitch.tsx`.
Provas: n/a
Esperado: nenhum pacote novo em `dependencies`; modal usa `Dialog`/`Select` de
`src/layout/components/atoms`.
Observado:
- `git diff a7519c3 -- package.json package-lock.json` não voltou nenhuma linha — zero
  dependência nova.
- `IndexProjectsDialog.tsx:1` — `import { Dialog } from "../../../../../layout/components/atoms/Dialog";`
  e uso de `Dialog.Root`/`Dialog.Content`/`Dialog.Footer`.
- `IndexSettingsDialog.tsx:1` — `import { Dialog } from "../../../../../../layout/components/atoms/Dialog";`
  e uso de `Dialog.Root`/`Dialog.Content`.
- `IndexProjectChips.tsx` (chip) e `IndexProjectsSwitch.tsx` (switch) não são modal nem select —
  são estilizados à mão com `<button>`/classes Tailwind, sem lib nova, o que já é coberto pela
  ausência de pacote novo acima; o critério "usa Dialog/Select como primitivo" do RT se aplica
  aos dois componentes que são modais (`IndexProjectsDialog`, `IndexSettingsDialog`), e ambos
  usam.
Resultado: PASS

## Cobertura da lane
2 de 2 RT desta lane exercitados. Nenhum `n/d`.
provas: n/a

## O que quebrou
n/a — sem FAIL.

## Registros tocados
nenhum.

## Observações
Premissa assumida: o texto de RT-002 lista quatro componentes ("os componentes novos
`IndexProjectChips.tsx`, `IndexProjectsDialog.tsx`, `IndexSettingsDialog.tsx`,
`IndexProjectsSwitch.tsx`") para a checagem "usa Dialog/Select como primitivo", mas só dois deles
são modais (`IndexProjectsDialog`, `IndexSettingsDialog`); os outros dois são um chip e um switch,
sem primitivo de Dialog/Select ao qual aderir. Tratei o critério de primitivo como aplicável aos
dois componentes de modal, e o critério de "nenhuma dependência nova" (via `package.json`) como o
que cobre os quatro. Nenhum achado fora dos dois RT desta lane.
