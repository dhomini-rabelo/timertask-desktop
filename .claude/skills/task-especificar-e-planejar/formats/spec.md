# O formato da spec

A spec é o contrato entre o que o dev espera e o que a implementação vai provar. Sete blocos,
nesta ordem, e a ordem importa: cada bloco só usa o que os anteriores fecharam.

```text
[Personas]
[Familiaridade com o sistema]
[Estado atual]
[Ideia]
[Fora de escopo]
[Specs]
[Requisitos técnicos]
```

Os cinco primeiros são curtos. O peso está nos dois últimos, e eles falam línguas diferentes:
**`[Specs]` é o que o usuário espera, na língua dele. `[Requisitos técnicos]` é o que alguém
prova depois.** Misturar os dois é o erro que essa separação existe para impedir.

---

## O teste que decide se algo entra na spec

**Você decide sem abrir o repositório?** Então é spec.

- "Uma pergunta por mensagem" é decisão de produto. Entra.
- "Nenhuma mensagem passa de 8 linhas" é decisão de produto. Entra.
- "Usar o modelo X" é decisão de produto. Entra.
- "Criar um `MessageSplitter` em `src/services/`" exige ter lido o código. Fica para o plano.

A spec nunca nomeia arquivo, função, classe, pasta nem desenho de código. Isso é trabalho do
plano, e escrever aqui faria o dev aprovar escolha de implementação antes de qualquer
reconhecimento.

---

## Exemplo preenchido

```text
[Personas]
  P1  Analista de operações

[Familiaridade com o sistema]
  P1  Alta. Usa a listagem todo dia.

[Estado atual]
  A listagem existe e pagina. Não há exportação de nada.
  (confirmado no código)

[Ideia]
  Exportar o relatório da listagem em CSV, com filtro de período.

[Fora de escopo]
  Mudar a paginação da listagem, que já funciona.
  Exportar em outro formato.

[Specs]
  ### P1 — Analista de operações
  AC-001  Espera escolher um período e baixar um CSV com exatamente os registros daquele
          período, na ordem que já vê na listagem.
  AC-002  (rn) Espera ser avisado quando o período escolhido não tem nenhum registro, em
          vez de receber um arquivo vazio.
  AC-003  Espera ser avisado quando o período escolhido tem registros demais, com o
          limite dito claramente.

[Requisitos técnicos]
  ### Geral
  RT-001 (Geral) [MUST] O arquivo é gerado no servidor, em stream, sem carregar o
         período inteiro em memória, porque um período pode cobrir dezenas de
         milhares de registros.
  RT-002 (Geral) [SHOULD] Não introduzir dependência nova para escrever CSV. Se o
         que o projeto já usa não escapa o separador dentro do campo, subir para
         escrita manual do CSV, nesta ordem.

  ### P1 — Analista de operações
  RT-003 (AC-001) [MUST] Ao escolher o período e clicar em Exportar, o download começa
         e a listagem mostra "Gerando o arquivo…" enquanto ele é gerado.
  RT-004 (AC-001) [MUST] O arquivo baixado abre com uma linha de cabeçalho e uma linha
         por registro do período, na ordem da listagem.
  RT-005 (AC-001) [MUST] Um registro cujo texto contém o separador do CSV sai com o
         campo entre aspas, sem mudar o número de colunas.
  RT-006 (AC-002) [MUST] Um período sem nenhum registro é recusado com "Nenhum registro
         no período", e nada é baixado.
  RT-007 (AC-003) [MUST] Um período acima do teto de linhas é recusado dizendo o teto,
         sem começar o download.
```

---

## Bloco por bloco

### [Personas] e [Familiaridade com o sistema]

Uma ou mais personas, cada uma com um id curto (`P1`, `P2`). A familiaridade é por persona,
porque é ela que decide o que conta como mensagem boa: quem nunca viu o produto precisa de
coisa diferente de quem usa todo dia.

Se as duas personas querem coisas de verdade diferentes, provavelmente são duas tasks. A grelha
é onde isso aparece.

### [Estado atual]

De onde o sistema parte, em uma ou duas frases. **Este é o único bloco que o dev não preenche
sozinho**: a visão dele entra como hipótese e o subagente de estado atual confirma ou contradiz
no código. O bloco fechado carrega a marca `(confirmado no código)`.

Estado atual errado envenena tudo que vem depois, e é o erro mais caro do formato.

### [Ideia]

O que a task muda, em uma frase. Ela já carrega o estado desejado: "integrar o onboarding ao fim
do cadastro" diz onde o sistema chega.

### [Fora de escopo]

O que não vai ser feito. Se alimenta da grelha: **todo "não, isso não" do dev durante a
interrogação vira uma linha aqui.**

### [Specs]

Agrupadas por persona. Cada expectativa é uma `AC-00N`, escrita como o usuário a descreveria, e a
numeração é uma só para todas as personas, para nenhum id repetir.

Tudo em `[Specs]` é obrigatório e **nada aqui leva marca de prioridade**. Se o usuário espera, é
obrigatório. Expectativa "desejável" é expectativa que não deveria ter sido escrita.

A `AC` que cria ou muda uma regra de negócio leva `(rn)`. A spec morre com a task, então essa
marca é o que faz a implementação registrar a regra como **registro durável** na doc de contexto
do projeto, antes de fechar.

Em task de bug, a `AC` é a reprodução vista pelo usuário: "o usuário consegue concluir a ação", não
"o campo interno é recalculado direito". Assim o formato não precisa de modo especial para bug, só
fica curto.

### [Requisitos técnicos]

O que alguém prova depois. Formato de cada linha:

```text
RT-00N (AC-00N | AC-00N, AC-00M | Geral) [MUST | SHOULD | MAY] o requisito
```

Agrupados em três seções, nesta ordem: `### Geral`, `### Compartilhado` (o `RT` que atende `AC` de
mais de uma persona) e uma seção por persona. Numeração única, contínua entre as seções.

- **`(AC-00N)`** é a expectativa que o requisito atende. Um `RT` pode atender mais de uma.
- **`(Geral)`** é a restrição da task inteira, que não pende de nenhuma `AC`. Ela **carrega o
  motivo**, sempre: sem `AC` para se explicar, um `RT (Geral)` sem motivo vira regra órfã que o
  próximo agente aplica onde não deve.
- **`(Geral)` é só o que é desta task.** A convenção do repositório — o gerenciador de pacotes, o
  padrão de nome de arquivo, de onde se importa o quê — vive na **doc de contexto do projeto**, e é
  de lá que o plano a lê. Copiar para cá cria uma segunda fonte de verdade, e a cópia envelhece
  primeiro.

**As marcas de prioridade respondem uma pergunta só: quando bater na parede, o que cede?**

- **`[MUST]`** não cede. Sem ele a task não está entregue.
- **`[SHOULD]`** cede, e **carrega a saída**: a lista de alternativas na ordem, ou o critério de
  quando desistir. `SHOULD` sem saída é um `MUST` que vai ser violado em silêncio, com o
  implementador decidindo sozinho e o dev descobrindo no fim.
- **`[MAY]`** é o opcional, feito só se couber. Raro.

---

## Critérios de fechamento

A etapa de spec fecha quando as seis linhas abaixo são verdade. Elas são verificáveis, então
confira uma por uma antes de entregar.

1. **Toda `AC` tem pelo menos um `RT`.** `AC` sem `RT` é expectativa vaga demais para ser
   entregue, ou expectativa que ninguém pensou. Nos dois casos o dev quer saber agora.
2. **Todo `RT` aponta `AC` ou `(Geral)`.** `RT` órfão é escopo que alguém inventou no caminho.
3. **Todo `RT` cabe em uma das quatro lanes de prova.** Diga qual, para você mesmo, antes de
   escrever a linha:
   - **`curl`** — uma chamada HTTP mostra que o requisito vale.
   - **`browser`** — uma navegação na tela mostra.
   - **`teste`** — um caso de suíte automatizada mostra. É a lane da regra com muitas bordas e da
     afirmação sobre o banco depois da ação: "nenhum usuário novo é criado quando o e-mail repete"
     não aparece em tela e não fecha lendo diff.
   - **`codigo`** — nenhuma das três mostra, e a prova é alguém lendo o diff. É a lane de
     `RT-001` e `RT-002` do exemplo acima: "gerar em stream" e "não introduzir dependência
     nova" são decisão legítima, e ninguém as observa de fora do sistema.

   Se nenhuma das quatro serve, o que você escreveu não é `RT`: é `AC` que ainda não foi
   traduzida. "Mensagens bem escritas" não tem lane. "Nenhuma mensagem passa de 8 linhas" tem.

   A lane não é escrita na spec. Quem a registra é o reconhecimento, na etapa de plano, e é ela
   que vira a checagem que prova o `RT`. O que a spec deve é passar no teste.
4. **Todo `RT (Geral)` traz o motivo.**
5. **Todo `[SHOULD]` traz a saída.**
6. **Nenhum bloco nomeia arquivo, função, classe, pasta ou desenho de código.**

---

## Id nunca renumera

Se o dev cortar a `AC-002` na grelha, a `AC-003` continua `AC-003` e fica um buraco na sequência.
Buraco é barato. Id reaproveitado quebra a ligação entre a spec e o relatório de validação, que é
o que faz a validação reportar "AC-002 reprovada" em vez de "o item do meio falhou".
