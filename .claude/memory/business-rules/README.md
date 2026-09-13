# Business rules

O que o produto decide: o critério que libera ou barra uma ação, o limite, o default, a ordem dos passos, o efeito colateral, o contrato que outro sub-projeto consome. Cada entrada traz a regra, o motivo dela e onde o código a aplica.

Não mora aqui: a ordem de como o agente escreve código, que vai para [`rules/`](../rules/README.md), nem a definição de um termo, que vai para [`vocabulary/`](../vocabulary/README.md).

## Entries

- [Razão de negócio do Ben e casos de uso do v1](./razao-de-negocio-e-casos-de-uso-v1.md) — abra antes de decidir o que Ben deve fazer ou para quem; sem isso dá pra achar que lembrete recorrente é v1, ou perder de vista que o único usuário validado é o fundador em dogfooding.
- [Projetos: chip, prefixo de título e switch global](./projetos-chips-prefixo-titulo.md) — abra antes de mexer nos chips de projeto, no prefixo de título da task ou no switch "Projetos" das configurações; sem isso dá pra achar que a task guarda vínculo com o projeto, ou que renomear/excluir um projeto deveria mudar tasks já salvas.
- [Inserção inline de task e seccionamento do card do grupo](./insercao-inline-tasks.md) — abra antes de mexer no ponto de inserção "+ adicionar task", no timeout do input inline ou no seccionamento da lista de um grupo em Active/Paused/Pending; sem isso dá pra achar que o input inline some mesmo com texto, ou que a lista de dentro do grupo tem sua própria regra de agrupamento.
