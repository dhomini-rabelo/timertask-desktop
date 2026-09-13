# O formato do relatório de teste

As quatro lanes — `curl`, `browser`, `teste` e `codigo` — escrevem o mesmo relatório, em
`{pasta-da-run}/teste-{n}-{lane}.md`. Este arquivo é o contrato dos quatro.

---

## A unidade do relatório é o `RT`, não o caso

O `## Plano de teste` do plano traz uma seção por `RT`, com o título `### RT-00N — lane {lane}`.
**Cada uma dessas seções vira uma entrada do seu relatório, com o mesmo id.** Você não inventa
caso, não junta dois `RT` numa entrada e não renomeia nada.

Nas lanes `browser` e `teste` o plano vem organizado de outra forma, porque a prova é uma lista
numerada que o dev aprovou: as seções são `### Roteiro — lane browser` e `### Roteiro — lane teste`,
e cada linha é uma prova com id próprio (`S01`, `T01`) e o `RT` que ela serve entre parênteses.
**A entrada do relatório continua sendo o `RT`**: você agrupa as provas dele numa entrada só e cita
cada id. O `RT` fecha PASS quando todas as provas dele passaram.

O id é o que faz a validação dizer `RT-004 reprovado` em vez de "o terceiro caso falhou". Sem ele
o implementador vai ter que adivinhar o que consertar, e o dev não descobre qual expectativa dele
não foi entregue.

**Todo `RT` da sua lane sai com veredito.** `RT` que você não conseguiu exercitar sai `n/d` com o
motivo, nunca PASS. A lista dos `RT` da sua lane está no `## Cobertura` do plano.

**Prova do roteiro que você não conseguiu produzir não some.** Ela aparece na entrada do `RT` com o
motivo, e o `RT` sai `n/d` se nenhuma prova dele saiu, ou PASS parcial nenhum: prova que faltou
derruba o `RT` para `n/d`. O dev aprovou aquela lista uma por uma, e prova que evaporou entre o
gate e o relatório é a única coisa que ele não tem como descobrir sozinho.

### Rodada de marco: o escopo vem no delta

A validação roda em dois momentos, e o delta que te disparou diz qual é o seu.

- **Rodada final** — o plano inteiro está implementado. Sua lista é todo `RT` da sua lane, e é o
  caso comum.
- **Rodada de marco** — o delta diz `marco {m}` e nomeia os `RT` do escopo. A implementação está
  na metade do plano de propósito: o nível 0 parou num checkpoint onde alguns requisitos já são
  observáveis, para pegar erro antes de ele virar alicerce.

Nas lanes `browser` e `teste` o roteiro já diz isso em cada linha: prova marcada `[marco {m}]`
sai nessa rodada, e `[final]` sai só na última. O delta nomeia os `RT` e a marca confirma quais
provas deles entram.

**Numa rodada de marco, prove só os `RT` que o delta nomeou.** Os outros ficam de fora do
relatório — não os marque `n/d`, porque `n/d` significa "tentei e não consegui" e aqui não é o
caso: o código deles ainda não existe, e isso é o plano funcionando. Reportar FAIL num `RT` fora do
escopo dispara uma rodada de correção contra nada.

## Você reporta o `RT`, e diz a que `AC` ele serve

O `spec.md` traz cada requisito como `RT-004 (AC-002) [MUST] ...`. Copie esse `(AC-00M)` para a sua
entrada. Não julgue a `AC`: uma `AC` costuma ser servida por vários `RT`, às vezes em lanes
diferentes, e quem soma o veredito dela é o nível 0, com os retornos das quatro lanes na mão.

Você prova o `RT`, que é concreto e binário. A `AC` é a língua do dev, e ela se fecha por soma.

## `[MUST]` e `[SHOULD]` reprovam diferente

A marca de prioridade está na linha do `RT` no `spec.md`, e ela muda o que o seu FAIL significa:

- **`[MUST]` que falha é FAIL da rodada.** Volta ao implementador.
- **`[SHOULD]` que falha** não é FAIL automático: a linha do `RT` carrega a saída, que é a lista de
  alternativas na ordem ou o critério de desistência. Confira se a implementação pegou uma
  alternativa da lista. Se pegou, o veredito é **PASS com ressalva**, e você nomeia qual
  alternativa. Se não pegou nenhuma e também não desistiu pelo critério escrito, é FAIL.
- **`[MAY]` que não foi feito é `n/a`**, não FAIL.

---

## Formato de `teste-{n}-{lane}.md`

```md
# Teste — lane {curl | browser | teste | codigo} — rodada {n} — {task}

## Veredito
{PASS | FAIL | BLOCKER}

## Ambiente
pré-requisito: {o que você conferiu do campo `pré-requisito de ambiente`, e se já estava de pé ou
foi você que o subiu — ou "nenhum", ou "n/a" na lane codigo}
ambiente: {o comando da linha `ambiente` do plano, e se você o subiu ou já estava no ar, ou "n/a"
na lane codigo}
url: {a linha `url` do plano, ou "n/a" fora da lane browser}
estado: {o comando da linha `estado` que você rodou e os identificadores que ele imprimiu,
"nenhum", ou "n/a" na lane codigo}
unidades: {uma linha por unidade que a prova exigiu no ar: nome, endereço, e "já estava no ar |
subida por mim | n/a"}

## RT provados

### RT-004 (AC-002) [MUST]
Requisito: {a linha do RT, copiada do spec.md}
Como provei: {o curl, a navegação ou o que procurei no diff}
Provas: {nas lanes browser e teste, os ids do roteiro: S03, S04. "n/a" nas outras duas}
- S03 → {caminho do PNG} — visível: {o que está na imagem, com contagem quando ela importa}
- S04 → {caminho do PNG} — visível: {...}
Esperado: {o que a checagem do plano diz}
Observado: {o que aconteceu}
Resultado: {PASS | PASS com ressalva: {a alternativa} | FAIL | n/d: {motivo} | n/a}

### RT-00N (AC-00M) [SHOULD]
...

## Cobertura da lane
{N} de {N} RT desta lane exercitados. {os que ficaram `n/d`, com o motivo}
provas: {N} de {N} do roteiro produzidas. {as que faltaram, com o motivo. "n/a" nas lanes curl e
codigo}

## O que quebrou
{só em FAIL: por RT, o observado versus o esperado e a evidência — a linha de log do servidor, o
screenshot ou o trecho do diff. Isto é o que o implementador vai ler para consertar, então seja
específico.}

## Registros tocados
{o que você escreveu no serviço local, e qualquer arquivo de configuração versionado que editou, ou
"nenhum"}
```

---

## O retorno

No máximo 10 linhas, e elas precisam bastar para o nível 0 somar as `AC` sem abrir o arquivo:

```text
teste-{n}-{lane}.md
veredito: {PASS | FAIL | BLOCKER}
RT-003 (AC-001) PASS
RT-004 (AC-002) FAIL — {o que quebrou, meia linha}
RT-005 (AC-002) PASS com ressalva — {a alternativa}
cobertura: {N}/{N}
```

Uma linha por `RT`, com o id, a `AC` entre parênteses e o veredito. É a única parte do relatório
que viaja, e é dela que sai o veredito por `AC` no relatório final.
