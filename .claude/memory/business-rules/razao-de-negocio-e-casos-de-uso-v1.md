# Razão de negócio do Ben e casos de uso do v1

Vale para o repo inteiro — é a razão de o produto existir, não algo de um sub-projeto só.

- **Problema que resolve**: uma pessoa muito ocupada (o fundador) precisa capturar notas, lembretes e tarefas sem digitar — digitar é lento e cansativo para o volume de capturas pequenas que um dia corrido gera. Hoje esse conteúdo se perde entre um app de notas do telefone, os alarmes do telefone e conversas soltas com o ChatGPT (que não persiste nem agenda nada).
- **Usuário-alvo do v1**: o próprio fundador, N=1. A validação é dogfooding diário — sucesso do v1 é o fundador usar Ben para ao menos 1 captura de voz por dia útil, por 2 semanas seguidas, dentro de 30 dias do lançamento. Não há usuário pagante nem validação de mercado ainda; monetização (US$10/mês por créditos) fica para v1.5+.
- **Casos de uso do v1 (os únicos três)**: nota, lembrete **único/one-off** (com `fires_at`, sem OS notification — só lista in-app com rótulo de tempo relativo) e task. **Lembrete recorrente NÃO faz parte do v1** — o PRD cita "pagar a internet todo dia 15" apenas como exemplo do tipo de roteamento de voz que o produto mira, mas o próprio documento adia lembretes recorrentes para v2 explicitamente, porque no v1 (web) os alarmes são mockados e não disparam de verdade — não faz sentido guardar recorrência que nunca dispara.
- **Onde o código aplica**: as três entities reais do backend — `Note`, `Reminder`, `Task` (o modelo de dados do PRD já previa `captures.type ∈ {note, reminder, task}`).
- **Fonte verificada**: `docs/prd-to-ux/2026-05-23-ben-prototype/01-prd.md` (arquivo será apagado; esta entrada preserva o essencial que não existe em nenhum outro lugar do repo).
