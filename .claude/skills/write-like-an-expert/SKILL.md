---
name: write-like-an-expert
description: Aplique antes de escrever qualquer texto que uma pessoa ou um agente vai ler, inclusive respostas de uma linha, perguntas e relatos de resultado. Dispara em: resposta no chat, pergunta ao usuário (`AskUserQuestion`), mensagem de commit, descrição de PR, comentário de review, doc ou README, e ao criar ou editar skill, AGENTS.md e CLAUDE.md. Cobre estrutura em tópicos, unslop (tiques de texto de IA) e escrita de documentos para agentes.
---

# Escrever como um especialista

Esta skill soma três disciplinas: **estrutura** (como um especialista organiza o texto), **unslop** (remover os tiques de texto gerado por IA) e **escrita para agentes** (como escrever skills, `AGENTS.md`/`CLAUDE.md` e docs que um agente consome). As duas primeiras valem para todo texto; a terceira, quando o leitor é um agente.

---

## Parte 1 — Estruturar como um especialista

Ao responder no chat ou escrever documentação, estruture o texto como um especialista faria: o leitor entende rápido, sem reler. Nunca despeje tudo num parágrafo único e longo.

Como se estivesse explicando algo do zero para um colega de trabalho, você não cuspiria um monte de informação de uma vez só. Você quebraria em partes e etapas sequenciais, contextualizando durante o caminho, usaria tópicos e destacaria o essencial. O mesmo vale para o chat.

### Características

1. **Parágrafos curtos.** Uma ideia por parágrafo.

2. **Quebre em tópicos.** Use subtítulos (`###`) e listas numeradas para separar assuntos.

3. **Aninhe os detalhes.** O ponto principal no item; o detalhe como sub-item.

4. **Use espaçamento.** Linha em branco entre itens longos para dar respiro.

5. **Destaque o essencial.** **Negrito** no termo-chave de cada item.

6. **Tabela só se cada célula for curtíssima.** Se as descrições forem longas, não use tabela — divida em tópicos.

### Exemplo de estrutura

Em vez de um parágrafo corrido:

```md
O serviço recebe o pedido, valida os dados, grava no banco e dispara
uma notificação por e-mail, retornando o status para o cliente.
```

Prefira tópicos:

```md
### Como o serviço processa um pedido

1. Recebe o pedido e valida os dados.

2. Persiste e notifica:
   - Grava no banco.
   - Dispara o e-mail de confirmação.

3. Retorna o status para o cliente.
```

### Exemplo de quando NÃO usar tabela

Tabela com células longas (evite) — cada linha vira um parágrafo espremido e ilegível:

```md
| Decisão | Observação |
|---------|-----------|
| Usar fila de mensagens | Escolhemos processamento assíncrono porque o pico de carga... |
```

Prefira tópicos:

```md
### Decisão: usar fila de mensagens

Optamos por processamento assíncrono para absorver picos de carga sem
travar a resposta ao cliente.
```

Use tabela apenas quando as células forem curtíssimas, por exemplo:

```md
| Campo | Valor   |
|-------|---------|
| Auth  | Nenhuma |
| Cache | Redis   |
```

---

## Parte 2 — Unslop: remover padrões de IA

Edite o texto para remover padrões de texto gerado por IA e adicionar voz humana.

### Processo

1. Escaneie o texto procurando os padrões abaixo.
2. Reescreva. Preserve o significado, mantenha o tom pretendido.
3. Adicione alma (próxima seção).
4. Auto-auditoria: "o que torna isso obviamente gerado por IA?" Corrija o que sobrou.

### Adicionar alma

Remover padrões é metade do trabalho. Texto estéril e sem voz é tão óbvio quanto.

- **Tenha opinião.** Reaja aos fatos em vez de listar prós e contras neutramente.
- **Varie o ritmo.** Frases curtas. Depois outras mais longas, que tomam seu tempo. Misture.
- **Reconheça a complexidade.** "Impressionante, mas também meio inquietante" é melhor que "impressionante".
- **Use primeira pessoa quando couber.** "Eu" não é anti-profissional.
- **Deixe alguma bagunça entrar.** Estrutura perfeita parece feita por máquina.
- **Seja específico.** Não "isso é preocupante", mas "tem algo inquietante em agentes rodando às 3 da manhã".

### Padrões a detectar e corrigir

#### Conteúdo

1. **Inflação.** "momento crucial", "testament to", "evolving landscape", "marca indelével". Corte e diga o que aconteceu.
2. **Name-dropping.** Listar fontes sem contexto. Escolha uma e diga o que foi dito.
3. **Gerúndios superficiais.** "destacando...", "garantindo...", "refletindo...", "showcasing...", "fostering...". Delete ou expanda com fonte real.
4. **Linguagem promocional.** "vibrante", "deslumbrante", "revolucionário", "renomado", "imperdível". Use descrição neutra.
5. **Atribuições vagas.** "Especialistas acreditam", "relatórios sugerem". Nomeie a fonte ou delete.
6. **Desafios formulaicos.** "Apesar dos desafios... continua prosperando." Substitua por fatos específicos.

#### Linguagem

7. **Vocabulário de IA.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape (abstrato), pivotal, showcase, tapestry, testament, underscore, vibrant — e os equivalentes em português: "robusto", "abrangente", "crucial", "aprofundar", "panorama". Troque por palavras simples.
8. **Formas rebuscadas de dizer "é".** "serve como", "se destaca como", "conta com", "apresenta". Diga "é" ou "tem".
9. **"Não é só X, mas Y."** Afirme o ponto diretamente.
10. **Regra de três.** Forçar ideias em grupos de três. Use o número natural.
11. **Ciclo de sinônimos.** Protagonista, personagem principal, figura central no mesmo parágrafo. Escolha um e repita.
12. **Falsos intervalos.** "de X a Y" quando X e Y não formam uma escala real. Liste os tópicos diretamente.

#### Estilo

13. **Travessão em excesso.** Evite travessões (em dash). Use ponto ou vírgula — sem trocar por parênteses, que é só outro tique. Se o pensamento precisa de separação, termine a frase.
14. **Dois-pontos como conector.** Dois-pontos servem antes de lista ou exemplo, não como muleta no meio da frase. Reescreva para o ponto se sustentar sozinho.
15. **Negrito em excesso.** Não coloque em negrito todo nome próprio ou sigla.
16. **Listas de rótulo-e-dois-pontos.** O tique é o rótulo em negrito que repete a própria linha: "**Performance:** a performance melhorou...". Converta em prosa. Um lead-in em negrito terminado em ponto, seguido de detalhe genuinamente novo ("**Schema em TypeScript.** As tabelas vivem num arquivo só."), é aceitável.
17. **Títulos em Title Case.** Use sentence case.
18. **Emojis decorativos.** Remova de títulos e bullets.
19. **Aspas curvas.** Troque por aspas retas.

#### Artefatos de chatbot

20. **Frases de chatbot.** "Espero que ajude!", "Me avise se...", "Claro!", "Certamente!", "Achei a causa raiz!". Remova.
21. **Disclaimers de cutoff.** "Embora os detalhes sejam limitados...". Ache a fonte ou remova.
22. **Tom bajulador.** "Ótima pergunta! Você está absolutamente certo!". Responda direto.

#### Enchimento

23. **Frases de enchimento.** "A fim de" vira "Para". "Devido ao fato de que" vira "Porque". "É importante notar que" é deletado.
24. **Hedging excessivo.** "poderia potencialmente talvez ser argumentado que" vira "pode".
25. **Conclusões genéricas.** "O futuro é promissor." Diga planos ou fatos específicos.

#### Jargão

26. **Metáforas abstratas como substantivo.** Substrate, wedge, vector, locus, nexus, primitive (substantivo), harness (metáfora), surface ("API surface"), bedrock, scaffolding (metáfora), modality, paradigm, flywheel, north star, "alavanca", "pilar", "ecossistema" (abstrato). Quase sempre existe a palavra concreta e mais simples. Use-a.

#### Fala direta

27. **Diga o que faz, não como parece.** "SQL legível", "tipos que acompanham seu schema" nomeiam uma sensação. A correção nomeia o mecanismo ou um número: "`.toSQL()` retorna a string exata enviada ao banco", "renomear uma coluna quebra o build". Se a frase não vira instrução, fato ou número concreto, corte. Teste extra: se a frase poderia aparecer inalterada na doc de outro projeto, ela não diz nada sobre este. Corte.
28. **Encurte ou divida frases densas.** Se o leitor precisa voltar para parsear, quebre em duas. Uma ideia por frase.
29. **Voz ativa.** Pegue "é/são/foi/foram + particípio" e nomeie o agente: "as queries são validadas" vira "o compilador valida as queries". Passiva só quando o agente é desconhecido ou genuinamente irrelevante.
30. **Corte advérbios ou use verbo mais forte.** "roda rapidamente" vira "é rápido" ou o número. "melhora significativamente" vira o delta medido.
31. **Prefira a palavra simples.** "utilizar" vira "usar", "leverage" vira "usar", "facilitar" vira "ajudar", "inúmeros" vira "muitos", "na eventualidade de" vira "se".

---

## Parte 3 — Escrever documentos para agentes

Referência para qualquer documento que um agente consome: uma skill, um `AGENTS.md`/`CLAUDE.md`, um doc alcançado por ponteiro. A embalagem muda; a escrita não. As mesmas alavancas tornam cada um previsível, porque o agente segue o mesmo _processo_ em toda execução.

### Context pointers

Um **context pointer** é uma referência que vive no contexto do agente, nomeia material fora do contexto e codifica a condição para alcançá-lo. A description de uma skill é um; uma linha no `AGENTS.md` apontando um doc é o mesmo objeto. A _redação_ do ponteiro, não o alvo, decide quando o agente alcança o material. Um alvo essencial atrás de um ponteiro fraco é um bug de variância: afie a redação primeiro; só inline o material se afiar falhar.

Um ponteiro faz dois trabalhos: dizer o que o material é e listar os **branches** que disparam o acesso (um branch é um caso distinto que o documento trata). Cada palavra de um ponteiro sempre-carregado custa em todo turno, então merece poda mais dura que o corpo:

- **Coloque a leading word na frente**: o ponteiro é onde ela dispara.
- **Um gatilho por branch.** Sinônimos que renomeiam o mesmo branch são um branch escrito duas vezes; colapse.
- **Corte identidade que o corpo já carrega.**

### Os dois custos

Todo documento e ponteiro gasta um de dois orçamentos:

- **Context load**: custo do material sempre-carregado na janela do agente — gasta tokens e atenção em todo turno, dispare ou não.
- **Cognitive load**: custo no humano — saber quais documentos existem e quando usar cada um. Não é um custo a minimizar: é o preço da agência humana; gaste onde o julgamento humano importa.

Material alcançado só por ponteiro escapa do context load pagando a linha do próprio ponteiro; material sem ponteiro nenhum vive só de cognitive load.

### Hierarquia de informação

Um documento é feito de dois tipos de conteúdo: **steps** (ações ordenadas que o agente executa) e **reference** (definições, regras e fatos consultados sob demanda). A decisão central é onde cada peça senta na escada, ordenada por quão imediatamente o agente precisa dela:

1. **Step in-file** — o que o agente faz, em ordem.
2. **Reference in-file** — consultada sob demanda; um conjunto plano de regras num nível só é arranjo legítimo, não smell.
3. **Reference disclosed** — empurrada para um arquivo separado, alcançada por ponteiro, carregada só quando o ponteiro dispara.

Empurre pouco para baixo e o topo incha; empurre demais e você esconde o que o agente precisa. Essa tensão é a decisão inteira.

- **Progressive disclosure** é o movimento escada abaixo (para fora do arquivo principal, atrás de um ponteiro) para o topo continuar legível. O teste mais limpo é o branching: inline o que todo branch precisa; disclose o que só alguns alcançam.
- **Co-location**: mantenha definição, regras e ressalvas de um conceito sob um mesmo heading, em vez de espalhados. O teste: o documento deve ler como documentação escrita para o agente.
- **Sprawl** é o modo de falha: documento longo demais mesmo com toda linha viva. A cura é a escada — disclose reference atrás de ponteiros e divida por branch ou sequência.

### Steps e critérios de conclusão

Todo step termina num **completion criterion**, a condição que diz ao agente que o trabalho acabou. Duas propriedades o tornam alavanca:

- **Clareza**: o agente distingue pronto de não-pronto? Um limite vago ("entendimento alcançado") convida à **conclusão prematura**. Defenda nesta ordem: afie o limite primeiro (barato e local); só se ele for irredutivelmente difuso _e_ você observar a pressa, esconda os steps seguintes dividindo a sequência (esconder só funciona através de uma fronteira real de contexto — hand-off ou subagente).
- **Exigência**: quanto o critério cobra. "Todo model modificado contabilizado" força trabalho minucioso onde "produza uma lista de mudanças" não força. E não é restrito a steps: "toda regra aplicada" amarra um corpo de reference plano do mesmo jeito.

Os critérios mais fortes são verificáveis e exaustivos.

### Quando dividir

Dividir um documento em dois gasta um dos dois custos, então divida só quando o corte compensa: **por sequência**, quando os steps posteriores tentam o agente a apressar o step atual — mantê-los fora de vista gera mais legwork no step da vez. Cuidado com o inverso: fundir sequências expõe cada step ao que vem depois, convidando à conclusão prematura.

### Leading words

Uma **leading word** é um conceito compacto que já vive no pretraining do modelo e com o qual o agente pensa durante a execução (_lesson_, _fog of war_, _tracer bullets_). Repetida como token, nunca como frase, ela acumula uma definição distribuída e ancora uma região inteira de comportamento em pouquíssimos tokens. Cunhar sua própria palavra funciona se você definir claramente, mas uma palavra inventada não recruta priors: prefira uma palavra existente.

Ela ancora duas vezes: no corpo (_execução_ — o agente busca o mesmo comportamento toda vez que a palavra aparece) e no ponteiro (_invocação_ — a mesma palavra nos seus prompts, docs e código faz o agente alcançar o material com mais confiabilidade).

Cace oportunidades de refatorar com leading words — cada tríade soletrada em três lugares é uma passagem implorando para colapsar num token só:

- "rápido, determinístico, de baixo overhead" → _tight_ (um loop _tight_).
- "um loop em que você acredita" → _red_ (o loop fica _red_ no bug, ou não fica).

**Negação** é o modo de falha ao lado desta alavanca: dirigir por proibição arrasta o comportamento proibido para o contexto e o torna _mais_ disponível ("não pense num elefante"). Escreva o **positivo**: declare o comportamento-alvo ("escreva comentários de uma linha") para o proibido nunca ser mencionado. Uma proibição só se justifica como guardrail duro impossível de frasear positivamente — e mesmo assim, emparelhada com o alvo positivo.

### Pruning

- **Single source of truth**: cada significado num único lugar autoritativo, para mudar comportamento ser edição de um lugar só. **Duplicação** custa manutenção e tokens e infla a proeminência do significado na escada.
- **O ambiente é fonte de verdade também** (`package.json`, configs, layout de diretórios, `--help`). Documento que o repete é um **cache**: só vale quando o lookup é caro. Cacheie o que o agente não acha olhando: a convenção não-escrita, o porquê de uma escolha, a pegadinha que nenhum config confessa.
- **Relevância**: cheque cada linha — ela ainda influencia o que o documento faz? Sem disciplina de poda o destino padrão é **sedimento**: camadas obsoletas que se acumulam porque adicionar parece seguro e remover parece arriscado.
- **Cace no-ops** frase a frase: instrução que o modelo já obedece por padrão paga custo para dizer nada. O teste (muda o comportamento versus o padrão?) é relativo ao modelo, não ao leitor — resolva rodando o documento, não debatendo. Quando uma frase falha, delete a frase inteira. O teste também avalia leading words: palavra fraca demais para vencer o padrão (_seja minucioso_) é no-op; a correção é uma palavra mais forte (_implacável_), não outra técnica.
