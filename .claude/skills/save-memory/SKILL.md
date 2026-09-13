---
name: save-memory
description: Grava uma informação persistente do projeto em .claude/memory, na categoria certa entre environment, business-rules, decisions, user-preferences, fails-and-lessons, vocabulary e rules, e indexa no README daquela categoria. Use quando o usuário pedir para salvar, guardar, registrar, documentar ou lembrar algo sobre o repositório, o produto, o ambiente, uma decisão, um erro que aconteceu ou o jeito de trabalhar.
---

# Save memory

Memória é o que o próximo agente precisa saber e não vai descobrir no tempo que tem: o que o ambiente exige, o que o produto decide, por que a escolha foi aquela, o que já quebrou, o que um termo significa aqui e como o usuário quer o trabalho feito.

Tudo mora em `.claude/memory/`, dividido em sete categorias. **Escolher a categoria é a decisão inteira desta skill**: arquivo na categoria errada é arquivo que ninguém abre.

## As sete categorias

A pergunta que classifica: **o que quebra se ninguém souber disso?**

- **`environment/`** — quebra a máquina, o build ou o deploy. Env obrigatória, porta, comando que precisa rodar antes, pegadinha de simulador ou de device, serviço externo que precisa estar de pé.

- **`business-rules/`** — quebra o que o produto decide. Critério que libera ou barra uma ação, limite, default, ordem dos passos, efeito colateral, contrato que outro projeto consome.

- **`decisions/`** — quebra por alguém desfazer sem saber o porquê. Escolha técnica já tomada, com as alternativas descartadas e o motivo.

- **`rules/`** — quebra por o agente trabalhar de outro jeito. Ordem permanente que vale para quem mexer neste repo.

- **`user-preferences/`** — quebra a entrega para este usuário. Gosto dele sobre idioma, formato, nível de detalhe, o que confirmar antes de executar.

- **`fails-and-lessons/`** — quebra de novo do mesmo jeito. Algo que já falhou: o sintoma, a causa e o que fazer no lugar.

- **`vocabulary/`** — quebra a conversa. O que um termo significa neste produto.

### Desempates

Os pares abaixo são os que colidem de verdade. Quando o pedido cair num deles e a leitura ainda ficar dividida, use `AskUserQuestion`.

1. **Decisão x regra.** A decisão olha para trás ("ficamos com Zustand em vez de Redux porque..."). A regra olha para frente ("todo estado de página novo entra num store da própria página"). Se a decisão também gera uma ordem, grave a decisão em `decisions/` e cite o arquivo dela na regra.

2. **Regra x preferência.** A regra vale para qualquer um que mexa no repo. A preferência é deste usuário, e outra pessoa no mesmo projeto poderia trabalhar de outro jeito sem estar errada.

3. **Regra de negócio x regra.** `business-rules/` é o que o produto decide para quem usa o app. `rules/` é o que o agente faz enquanto escreve código.

4. **Ambiente x lição.** `environment/` guarda o requisito ("precisa do emulador aberto antes de `npm run android`"). `fails-and-lessons/` guarda o episódio ("rodei sem o emulador, o erro que apareceu foi X, e ele não diz a causa real").

5. **Vocabulário x regra de negócio.** `vocabulary/` define o termo. `business-rules/` diz o que o sistema faz com ele.

### O que não é memória

- **Estrutura de pasta, nome de arquivo, jeito de declarar componente ou tipo** é design ou padrão de código: skill [`task-add-coding-pattern-or-design`](../task-add-coding-pattern-or-design/SKILL.md).
- **Descrição de o que cada sub-projeto é e onde ficam suas pastas** é contexto de projeto: skill [`code-get-project-context`](../code-get-project-context/SKILL.md).
- **Status de trabalho em andamento** não é memória em categoria nenhuma. Memória é o que continua verdade depois que a task acaba.

## Escopo: o prefixo do nome do arquivo

O repo tem três sub-projetos, e o nome do arquivo carrega a qual deles a memória se aplica:

- `backend-`, `mobile-`, `design-` quando vale para um projeto só. Exemplo: `mobile-expo-secure-store-cache.md`.
- **Sem prefixo** quando vale para o repo inteiro ou atravessa mais de um projeto. Nesse caso, a primeira linha do arquivo diz onde ela vale.

Se o pedido não deixa claro qual projeto, pergunte com `AskUserQuestion` antes de nomear o arquivo. `project-mobile` é o foco ativo, mas isso não autoriza assumir que a memória é dele.

## Workflow

1. **Classifique a categoria** com a pergunta do "o que quebra" e os desempates acima.

2. **Resolva o nome do arquivo**: `.claude/memory/{categoria}/{prefixo-}{topico-em-kebab-case}.md`. "Cache do token no secure store" em `project-mobile` vira `mobile-token-secure-store-cache.md`.

3. **Leia o `README.md` da categoria** e procure uma entrada que já seja dona do assunto. O objetivo é não criar arquivo novo para um tópico que já tem dono.

4. **Grave o conteúdo**:
   - Arquivo já existe: leia primeiro e atualize a seção relevante, sem sobrescrever o resto. Se não estiver claro se é substituir ou mesclar, use `AskUserQuestion`.
   - Arquivo novo: crie com um título `#` que nomeia o tópico em linguagem humana.

5. **Indexe no `README.md` da categoria**, com uma linha que diga o gatilho e a consequência (ver [Formato do índice](#formato-do-índice)). Nunca remova entradas de outros tópicos.

6. **Pedido com mais de uma metade**: grave uma entrada por categoria e ligue uma à outra por link relativo. "A geração só roda com o token válido, e o token só aparece se o Firebase estiver configurado no `.env`" carrega uma regra de negócio e um requisito de ambiente. Cada metade vai para a pasta dela.

O `README.md` da raiz de `.claude/memory/` indexa as **categorias**, não as entradas. Ele só muda quando uma categoria nova nasce, e categoria nova só nasce com o usuário confirmando por `AskUserQuestion`.

## Regras

- Escreva em **português**, com um assunto por arquivo.
- Use a skill [`utils-write-documentation`](../utils-write-documentation/SKILL.md) para o tom e a formatação.
- Registre só o que continua verdade depois que a task acabar.
- Nunca invente link, caminho de arquivo, nome de env ou detalhe que o usuário não deu. O que faltar, pergunte ou deixe de fora.
- Prefira atualizar um arquivo existente a criar um quase-duplicado.
- Todo caminho de arquivo que entrar no texto tem que existir: confirme com grep ou glob antes de escrever.

## Formato do arquivo

Não existe estrutura obrigatória. Organize do jeito que servir ao conteúdo: parágrafo curto, lista, bloco de código.

```md
# Título do tópico

Uma ou duas frases dizendo quando isso se aplica e o que acontece sem isso.
```

Três categorias pedem um recheio específico, porque sem ele a entrada não serve:

- **`decisions/`** — a escolha, as alternativas descartadas e o porquê. Sem o porquê, a próxima pessoa reabre a discussão do zero.
- **`fails-and-lessons/`** — o sintoma que apareceu, a causa real e o que fazer no lugar. O sintoma entra porque é por ele que o próximo agente vai procurar.
- **`business-rules/`** — a regra, o motivo dela e onde o código a aplica.

## Formato do índice

O `README.md` de cada categoria existe para o agente decidir o que abrir sem abrir:

```md
- [Título do tópico](./prefixo-topico.md) — quando abrir o arquivo, e o que quebra sem ele.
```

A linha diz duas coisas: o **gatilho**, ou seja, quando a memória se aplica, e a **consequência** de tocar no assunto sem ela. A resposta em si mora no arquivo.

O teste: se dá para executar a task só com a linha do índice, reescreva a linha.

## Exemplos

- "Salva que o `project-mobile` precisa do emulador Android aberto antes do `npm run android`."
  - Requisito de máquina, um projeto só: `environment/mobile-android-emulator-prereq.md`.

- "Registra que a gravação de áudio para de transcrever acima de 10 minutos."
  - Limite que o produto aplica: `business-rules/mobile-audio-max-duration.md`.

- "Guarda que eu prefiro que você me pergunte antes de instalar qualquer dependência nova."
  - Gosto do usuário, não lei do repo: `user-preferences/confirmar-dependencia-nova.md`.

- "Anota que passei duas horas num erro de token porque o `expo-secure-store` não lê síncrono."
  - Episódio com causa e contorno: `fails-and-lessons/mobile-secure-store-leitura-assincrona.md`.

- "Salva que 'capture' aqui é nota, lembrete e task juntos."
  - Termo do produto: `vocabulary/capture.md`.

- "Salva que toda página nova tem uma pasta `components/` e uma `hooks/` dentro dela."
  - Isso é estrutura de código, não memória: use `task-add-coding-pattern-or-design`.

## Saída de emergência

- **Nenhuma das sete categorias serve.** Pare e pergunte com `AskUserQuestion` se é para criar uma categoria nova. Categoria nova custa uma pasta, um `README.md` e uma linha no índice da raiz.
- **Duas categorias servem igualmente bem.** Pergunte em vez de escolher por conta. Entrada duplicada em duas pastas envelhece de um lado só.
- **A informação contradiz uma entrada existente.** Pare e resolva com `AskUserQuestion`. Duas memórias que se contradizem valem menos que nenhuma.
- **A informação parece presa à task atual.** Confirme com o usuário se ela realmente pertence à memória.
