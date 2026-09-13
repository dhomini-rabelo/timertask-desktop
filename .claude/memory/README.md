# Memory

O que o agente precisa saber sobre este repo e não descobre lendo o código no tempo que tem. **Leia as entradas relevantes antes de planejar ou executar qualquer task que toque no assunto delas.**

Para gravar algo aqui, use a skill [`save-memory`](../skills/save-memory/SKILL.md). Ela decide a categoria, nomeia o arquivo e atualiza o índice da categoria.

## Como ler

- Cada categoria tem o próprio `README.md` com as entradas. Abra só a categoria que interessa à sua task.
- O prefixo do nome do arquivo diz a qual sub-projeto a memória se aplica: `backend-`, `mobile-`, `design-`. **Sem prefixo** significa que ela vale para o repo inteiro ou atravessa mais de um projeto.

## Categorias

- **[`environment/`](./environment/README.md)** — o que a máquina, o build e o deploy exigem. Env obrigatória, porta, comando que precisa rodar antes, serviço externo de pé.

- **[`business-rules/`](./business-rules/README.md)** — o que o produto decide. Critério, limite, default, ordem dos passos, efeito colateral, contrato entre projetos.

- **[`decisions/`](./decisions/README.md)** — escolha técnica já tomada, com as alternativas descartadas e o porquê.

- **[`rules/`](./rules/README.md)** — ordem permanente de como trabalhar neste repo.

- **[`user-preferences/`](./user-preferences/README.md)** — como este usuário quer o trabalho feito e entregue.

- **[`fails-and-lessons/`](./fails-and-lessons/README.md)** — o que já falhou, por quê, e o que fazer no lugar.

- **[`vocabulary/`](./vocabulary/README.md)** — o que cada termo significa neste produto.
