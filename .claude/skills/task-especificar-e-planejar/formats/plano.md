# O formato do plano

O plano tem dois leitores e eles querem coisas diferentes. O **dev** lê o `## Resumo do plano` no
gate e decide se autoriza; ele pensa em `AC`, porque foi isso que ele aprovou. O **implementador**
lê o resto e executa sem ter com quem falar; ele pensa em `RT`, porque é isso que o código faz.

Daí sai a regra que amarra o plano na spec.

---

## A amarra: passo cita `RT`, resumo fala `AC`

**Todo passo do plano cita o `RT` que ele implementa**, não a `AC`.

```text
1. (RT-004, RT-005) **{arquivo}** — gerar o CSV em stream, escapando o separador dentro do
   campo.
```

Passo raramente atende uma `AC` inteira, e passo de encanamento não atende nenhuma. Obrigar cada
passo a citar `AC` produz citação de fachada, que é pior que citação nenhuma: dá a aparência de
rastreabilidade sem a coisa. `RT` é concreto e binário, então a citação ou está certa ou está
obviamente errada.

**Passo que não implementa nenhum `RT` leva `(infra)`** e uma frase dizendo de qual passo ele é
pré-requisito. Migration, rename, extração de módulo, sincronização das fixtures: todos legítimos,
nenhum órfão.

**No `## Resumo do plano` a língua volta a ser `AC`.** O dev aprovou expectativas, não requisitos,
e é contra as expectativas dele que ele julga o plano. A ponte `AC ↔ RT` já está escrita na spec;
ninguém precisa copiá-la para cá.

---

## As quatro lanes de prova

Cada `RT` é provado por uma checagem, e cada checagem roda numa lane. O reconhecimento já atribuiu
a lane de cada `RT`; o plano escreve a checagem.

- **`curl`** — o comando completo, com método, URL, headers e body, mais a resposta esperada
  (status e campos).
- **`browser`** — as provas numeradas do roteiro, cada uma com a ação e o que precisa estar
  visível na tela.
- **`teste`** — o arquivo da suíte, os casos que ela cobre e o **comando de teste** que a roda. É
  a lane da regra com muitas bordas e da afirmação sobre o banco depois da ação, que screenshot
  não mostra e diff não fecha.
- **`codigo`** — o que o tester procura no diff, e onde. É a lane de requisito que ninguém observa
  de fora: escolha de modelo, teto de custo, biblioteca proibida. Escreva o que faz a checagem
  **falhar**, não o que faz passar: "nenhuma chamada de LLM fora da lista do `RT-002`" é checável;
  "usa agentes baratos" não é.

Uma task usa quantas lanes precisar. A linha `lane:` do plano de teste lista as que aparecem.

**As lanes `browser` e `teste` não são escritas aqui: elas chegam prontas.** O dev aprovou o
roteiro de comprovação no gate da Etapa 7, prova por prova, e o seu trabalho é copiá-lo para o
`## Plano de teste` e marcar a rodada de validação de cada prova. O contrato do roteiro, com a
anatomia de cada linha e o que você pode ou não mudar nele, está em
[`roteiro.md`](roteiro.md).

---

## Checkpoints: onde a implementação para para ser revisada

Os passos são agrupados em **checkpoints**, e cada checkpoint é uma fronteira onde **o código
compila e o lote faz sentido revisado**. A implementação para em cada um, e é sobre o lote fechado
que o revisor julga.

Checkpoint não é "cinco passos". O passo 3 pode ser metade de um refactor, e revisar ali é revisar
código quebrado: o revisor reprova uma função que o passo 4 ia terminar, o implementador conserta
o que não estava errado, e a rodada foi paga para nada. Quem sabe onde as fronteiras estão é você,
que leu o código.

O que faz uma fronteira boa:

- **O comando de verificação passa.** Se o lote deixa um import quebrado ou um tipo pela metade,
  ele não fechou.
- **O que vem depois consome o que ficou pronto.** Módulo novo, campo novo, migration: o
  checkpoint termina quando a coisa existe e os passos seguintes podem usá-la.
- **O lote é julgável sozinho.** O revisor precisa poder dizer "isto está certo" sem saber o que o
  passo seguinte vai fazer.

**Plano de poucos passos é um checkpoint só**, e isso é o caso comum. Não invente fronteira para
parecer organizado: cada checkpoint é uma parada da implementação, e parada sem ganho é atrito.

Um checkpoint que estende ou sincroniza o **mecanismo de fixtures** fica **sozinho e antes** dos
checkpoints que dependem dele, porque o estado do teste depende de a fixture existir.

---

## Marcos de validação: onde a implementação prova antes de seguir

Por padrão a validação roda **uma vez, no fim**, e para a maioria das tasks isso está certo: subir
os apps e fabricar cenário custa igual para provar um `RT` ou dez, e essa ignição se paga uma vez.

Task **complexa** é onde isso falha. O revisor de cada lote lê diff, não executa fluxo: erro de
comportamento no checkpoint 2 atravessa oito checkpoints sem ninguém notar, e o conserto deixa de
ser uma linha para virar cascata. É o mesmo argumento que fez a revisão rodar em lotes em vez de
uma vez no fim, aplicado ao que a revisão não vê.

**Quando o reconhecimento deu veredito `complexa`, declare 1 ou 2 marcos de validação.** Um marco é
um checkpoint onde alguns `RT` já são observáveis e vale prová-los antes de construir por cima.

O que faz um marco valer o preço:

- **O comportamento já é observável ali.** `RT` que só existe depois do último checkpoint não é
  marco, é o teste final.
- **O que vem depois se apoia nele.** Marco é onde o erro viraria alicerce: o contrato externo que
  fecha, o webhook que passa a disparar de verdade, o shape que três checkpoints vão consumir.
- **A lane já está paga ou é barata.** `codigo` não sobe app nenhum. `curl` e `teste` sobem um app
  ou o banco local. `browser` sobe navegador, app, locale e o estado que o mecanismo de fixtures
  monta — marco em lane `browser` precisa de um risco à altura.

Marco declarado é o que preenche a rodada de cada prova do roteiro: as provas que ele exige levam
`[marco {m}]`, e as outras ficam `[final]`. A seção `## Marcos de validação` lista os ids, para o
nível 0 poder disparar a rodada sem abrir o roteiro.

**Teto de dois marcos, e nunca no último checkpoint.** Marco no último checkpoint é a validação
final com outro nome. Task `simples` não leva marco: escreva `nenhum` e a validação roda uma vez,
no fim.

O marco escolhe **por risco, não por aritmética**. A revisão batcheia por conta porque todo diff
pede as mesmas duas lentes; validação não tem nada de homogêneo — a ignição varia dez vezes entre
lanes e o risco se concentra em checkpoints específicos. Quem sabe onde eles estão é você, que leu
o código.

---

## Ondas: quando o resto do plano seria chute

Um plano cobre todos os `RT` da spec. É o caso comum, e é o que a cobertura reversa mede.

Existe um caso em que ele não consegue, e não é o da task grande: é o da task cujo **segundo
pedaço só pode ser planejado contra código que ainda não existe**. O `RT-007` consome o shape que
o `RT-002` cria, e esse shape só vai ser decidido enquanto alguém escreve o `RT-002`. Planejar o
`RT-007` hoje é escrever passo contra contrato imaginado, e passo assim chega na implementação
como retrabalho. É o mesmo defeito que a Etapa 5.5 da skill de implementação conserta depois que
ele cobra, só que aqui dá para não pagar.

**Uma onda é o pedaço da spec que dá para planejar com o código de hoje.** Quando o resto não dá,
o plano cobre uma onda e declara a próxima como pendente, com os `RT` que ficaram nela. O plano da
onda seguinte é escrito depois de a anterior estar implementada e validada, por um reconhecimento
novo que lê o código que ela deixou pronto.

**O critério é seco: a próxima onda existe quando os passos dela dependem do formato de um código
que esta onda vai criar e que o reconhecimento não tem como ver hoje.** Fora disso é checkpoint, e
checkpoint o método já resolve sem partir plano nenhum. Lido ao contrário, o critério mata a onda
de fachada: "criar o endpoint e depois a tela que o consome" é um plano de dois checkpoints,
porque o contrato do endpoint você decide agora.

**Declare no máximo a próxima onda.** Se depois dela ainda sobrar `RT`, quem vai saber é o
planejador dela, que terá lido o código que hoje não existe. Plano que desenha as ondas 2, 3 e 4
de uma vez faz a mesma adivinhação que a onda existe para evitar.

Onda não parte a spec. As `AC` e os `RT` continuam sendo os mesmos, numerados uma vez só na pasta
da run. O que se parte é o plano, e a soma das ondas fecha `N/N`.

---

## Cobertura reversa é o que fecha o plano

**Todo `RT` da spec tem pelo menos uma checagem no plano de teste.** Não é uma boa prática, é o
critério de aceite do plano: `RT` sem checagem é requisito que o dev aprovou e que ninguém vai
provar, e ele só aparece na entrega, quando é caro.

Faça a conferência ao contrário, do `RT` para a checagem, nunca da checagem para o `RT`. Lendo na
direção fácil todo plano parece completo, porque toda checagem que existe prova alguma coisa. O
buraco só aparece percorrendo a lista de `RT` da spec, um por um.

`RT` que a implementação vai violar por decisão do plano não é buraco de cobertura, é decisão: ele
entra em `## Desvios da spec`, com o motivo. `[SHOULD]` violado usa a saída que a própria linha
carrega, e o plano diz qual alternativa pegou.

A conferência tem uma segunda direção, e ela é curta: **toda prova do roteiro aprovado aparece no
`## Plano de teste`**, ou tem linha em `## Desvios da spec`. O dev aprovou aquela lista prova por
prova, e prova que sai do plano sem ele saber é a decisão dele sendo desfeita em silêncio.

**Num plano com onda pendente a conferência é a mesma e a conta muda**: cada `RT` da spec aparece
na `## Cobertura` apontando uma checagem desta onda, a linha de `## Desvios da spec` que o
dispensa, ou a onda pendente que vai cobri-lo. `{cobertos nesta onda} + {pendentes} = N`. `RT`
pendente não é desvio, porque ninguém desistiu dele.

---

## Formato de `plano.md`

````md
# Plano — {task}

## Resumo do plano

### O que muda

#### Checkpoint 1 — {título curto do que fica pronto aqui}
- **{lead-in em negrito: arquivo, contrato ou exceção}.** {o detalhe}
- ...

#### Checkpoint N — {título curto do que fica pronto aqui}
- ...

{os mesmos checkpoints da seção ## Passos, na mesma ordem e com os mesmos títulos: é assim que o
dev vê onde a implementação vai parar}

### Decisões que travei sozinho
- {a decisão e o que ela custa; se ela se afasta de um RT da spec, diga aqui}
- ...

### O que fica de fora
- {escopo que o plano recusou, além do que a spec já pôs em [Fora de escopo]}
- ...

### Como se prova
{uma linha por AC, na língua da AC: AC-001 — {o que se observa para dizer que passou} ({as provas
do roteiro e as lanes que a fecham: S01, S02, RT-003 na lane curl})}

{Numa rodada de ajuste, abra "O que muda" dizendo o que mudou desde a rodada anterior.}

## Objetivo
{uma ou duas frases: o estado final}

## Passos

### Checkpoint 1 — {título curto do que fica pronto aqui}
1. (RT-00N | RT-00N, RT-00M | infra) **{arquivo}** — {o que muda e por quê}
2. ...

### Checkpoint N — {título curto do que fica pronto aqui}
- ...

{numeração dos passos contínua entre os checkpoints; plano pequeno tem um checkpoint só}

## Marcos de validação
{"nenhum" quando a task é simples, ou o marco não vale a ignição}

### Marco {m} — checkpoint {k} de {N}
prova: {os RT observáveis neste ponto}
lane: {as lanes que este marco usa}
provas: {os ids do roteiro que saem nesta rodada: S01, S02, T01. "n/a" se o marco não usa browser
nem teste}
motivo: {o que se apoia neste checkpoint, e o que custa descobrir o erro depois}

## Ondas
{"onda única" quando este plano cobre todos os RT da spec}

### Onda {k} — esta
cobre: {os RT desta onda}

### Onda {k+1} — pendente
cobre: {os RT que ficam para depois}
por que agora seria chute: {o código desta onda de que os passos dela dependem, e que ninguém tem
como ler hoje}

## Contratos
{assinaturas, shapes de payload, nomes de campo — o que precisa bater entre camadas}

## Fixtures
veredito: {sincronizar | estender | sem mudança | sem mecanismo}
a mudar: {arquivos do mecanismo de fixtures que os passos tocam, e o teste que acompanha. "nada"
quando o veredito é sem mudança ou sem mecanismo}

## Plano de teste
lane: {as lanes que aparecem: curl, browser, teste, codigo}
ambiente: {o comando de ambiente do roteiro, ou "nenhum"}
estado: {o comando de estado do mecanismo de fixtures, ou "nenhum"}
url: {onde a primeira prova de tela começa, como o navegador a abre, ou "nenhum"}

### Roteiro — lane browser
{as provas do roteiro aprovado, na ordem, uma por linha}
S01 (RT-00N) [marco {m} | final] {a ação} → {o que precisa estar visível}
S02 (RT-00N) [final] {a ação} → {o que precisa estar visível}
{"n/a" quando a task não tem RT de lane browser}

### Roteiro — lane teste
comando: {comando de teste}
T01 (RT-00N) [final] {arquivo da suíte} — {o caso} → {a asserção}
{"n/a" quando a task não tem RT de lane teste}

### RT-003 — lane curl
​```bash
{comando completo}
​```
Esperado: {status e campos}

### RT-001 — lane codigo
Procurar em: {arquivo ou pasta}
Reprova se: {o que faz a checagem falhar}

## Cobertura
{uma linha por RT da spec: RT-00N → {as provas ou a seção do plano de teste que o prova: S01, S02
na lane browser, T01 na lane teste, a seção RT-00N nas lanes curl e codigo}}

## Desvios da spec
{RT que o plano não cumpre como escrito, e por quê. "nenhum" se não houve}

## Riscos
{o que pode quebrar em outro lugar}

## Premissas
{ambiguidades que você travou sozinho}
````

---

## Critérios de fechamento

O plano fecha quando as doze linhas abaixo são verdade. Confira uma por uma antes de entregar.

1. **Todo passo cita `RT` ou `(infra)`.**
2. **Todo passo `(infra)` diz de qual passo é pré-requisito.**
3. **O comando de verificação do projeto passa no fim de cada checkpoint**, e quando o cartão diz
   `nenhum`, o lote não deixa nada pela metade.
4. **Todo `RT` da spec aparece na seção `## Cobertura`**, apontando uma checagem, a linha de
   `## Desvios da spec` que o dispensa, ou a onda pendente que vai cobri-lo.
5. **Toda checagem do plano de teste nomeia a lane e é executável por quem não leu o código.**
6. **As linhas `estado`, `ambiente` e `url` existem**, mesmo que digam `nenhum`.
7. **O `## Resumo do plano` fala em `AC`**, e o bloco `Como se prova` tem uma linha por `AC`.
8. **O veredito de fixtures está respondido**, mesmo que seja `sem mudança` ou `sem mecanismo`, e
   `sincronizar` ou `estender` viraram passos.
9. **A seção `## Marcos de validação` existe**, mesmo que diga `nenhum`. Todo marco cai num
   checkpoint que não é o último, nomeia `RT` observáveis ali, e são no máximo dois.
10. **A seção `## Ondas` existe**, mesmo que diga `onda única`. Quando há onda pendente, todo `RT`
   da spec está em exatamente um lugar: coberto nesta onda, em `## Desvios da spec`, ou na onda
   pendente.
11. **Toda prova do roteiro aprovado está no `## Plano de teste` com o texto que o dev aprovou**, ou
   em `## Desvios da spec`. Prova que você acrescentou leva o próximo id livre e aparece em
   "Decisões que travei sozinho".
12. **Toda prova carrega a rodada**, `[marco {m}]` ou `[final]`, e os ids de cada marco estão na
   linha `provas:` dele.

## O que o plano não faz

O plano detalha o **como**. O **o quê** já está fechado na spec e não se renegocia aqui.

Um plano que acha que uma `AC` está errada, ou que um `RT [MUST]` é impossível como escrito, não
corrige por conta própria: escreve em `## Desvios da spec` e o dev decide no gate. Plano que
reescreve requisito é plano que devolve a task ao problema que a spec existe para resolver.
