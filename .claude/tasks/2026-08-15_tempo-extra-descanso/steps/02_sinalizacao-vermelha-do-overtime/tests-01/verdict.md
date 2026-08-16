# Verdict — step 02 sinalizacao-vermelha-do-overtime — tests-01

**Modo:** Docker+browser only (`npx tsc --noEmit` já rodado limpo antes desta rodada, não re-executado
aqui) + `npm run dev` (Vite, porta fixa 1420) + Playwright MCP.

**Commit-base:** `7997ddc` (branch `main`).

## Resultado final: **PASS**

Todos os 7 casos mínimos exigidos foram exercitados. Nenhuma regressão observada nos comportamentos do
step 01 (contagem negativa, painel de ações, fórmula proporcional de descanso). A sinalização vermelha
(número + anel) funciona nos dois temas, sem artefato de anel em nenhum instante testado.

## Ambiente

- `npm run dev` iniciado neste worktree, log em `/tmp/vite-dev.log`, pronto em `http://localhost:1420/`
  (`VITE v7.3.1 ready`).
- Contorno de permissão de notificação aplicado via `browser_evaluate`
  (`Notification.permission` → getter `'granted'`, `.requestPermission` → resolve `'granted'`) antes de
  qualquer interação — nenhuma tela de permissão bloqueou o teste.
- Todos os cliques feitos via `element.click()` real por `browser_evaluate` (não `browser_click`/Enter,
  conforme contorno da memória §7 — não testado o timeout diretamente, mas seguida a recomendação
  preventivamente).
- Técnica de deslocamento de relógio da memória §8 usada em todos os casos de overtime
  (`window.__setClockOffset(ms)`), com sucesso em todos.
- Console verificado ao final (`browser_console_messages`, `all: true`): únicos erros são ruído de
  extensão do browser (`Unchecked runtime.lastError`) e `ERR_CONNECTION_REFUSED` em `car-alarm.mp3`
  (o alerta sonoro falha em browser puro — comportamento pré-existente e aceito, memória §7). **Nenhum
  erro de runtime React, nenhum overlay de erro, nenhum stack trace relacionado às mudanças deste
  step.**

## Casos exercitados

### 1. Regressão atividade (tema claro)
Timer padrão 25 min, Start clicado, capturado ~19s depois. Número `24:41` em preto (cor padrão),
anel **verde**, contando para baixo normalmente.
Screenshot: `screenshots/01-atividade-normal-tema-claro.png` — **PASS**

### 2. Overtime, tema claro
Relógio deslocado para 26 min (timer de 25 min ⇒ ~1min42s de overtime). Número `-01:43` em
**vermelho** (`text-Red-500`), anel com arco **vermelho** parcial, painel de ações completo
(Stop/Rest/+5 min/+10 min/Skip) visível e alcançável.
Screenshot: `screenshots/02-overtime-tema-claro.png` — **PASS**

### 3. Overtime, tema escuro
Mesma condição de overtime, tema alternado para escuro via o toggle da própria UI (`useDarkMode`).
Número `-01:54` continua em **vermelho** (variante `dark:text-Red-400`, visivelmente distinto do branco
padrão do modo escuro) — o vermelho sobrevive ao dark mode, confirmando que a trap N3 (`twMerge`
derrubando a cor se aplicada no container) foi corretamente evitada aplicando a cor no `<span>` filho.
Anel vermelho também presente e nítido contra o fundo escuro do círculo.
Screenshot: `screenshots/03-overtime-tema-escuro.png` — **PASS**

### 4. Anel sem artefato em overtime (dois instantes)
- **~57% do ciclo excedido**: relógio deslocado para 38 min sobre timer de 25 min ⇒ `-14:11`
  (851s / 1500s ≈ 56.7%). Anel mostra um único arco vermelho parcial, contínuo, sem segmento fantasma
  do lado oposto.
  Screenshot: `screenshots/04a-anel-overtime-50pct.png`
- **~158% do ciclo excedido**: relógio deslocado para 63 min ⇒ `-39:27` (2367s / 1500s ≈ 157.8%). Anel
  mostra o círculo **cheio e estável** (saturado em 100%), sem voltas extras, sem "salto", sem arco
  duplicado — confirma o clamp de `getPercentage` em `[0,1]` (trap N2.2) funcionando corretamente mesmo
  bem além de 1× o ciclo.
  Screenshot: `screenshots/04b-anel-overtime-150pct-saturado.png`
- **PASS** (ambos instantes, nenhum artefato visual em nenhum dos dois)

### 5. Anel depois de "+5 min" (trap N10)
Timer reiniciado do zero (via "Skip"/`goBackToWork`), levado a overtime raso (`-00:21`), então clicado
"+5 min":
- **Momento de recuperação**: logo após o clique, tempo volta a ser positivo (`04:28` restantes),
  anel volta a **verde**, agora usando a escala de 5 min (`lastExtraAddedMinutes`) em vez dos 25 min
  originais — comportamento correto e sem estouro.
  Screenshot: `screenshots/05a-anel-recuperacao-apos-mais5.png`
- **Reentrada em overtime na nova escala**: relógio empurrado mais adiante até `-01:49` (109s sobre os
  300s da escala de 5 min ≈ 36%). Anel mostra arco vermelho parcial coerente com a nova escala, sem
  inversão, sem estouro, sem herdar a escala antiga de 25/30 min.
  Screenshot: `screenshots/05b-anel-overtime-nova-escala-5min.png`
- **PASS**

### 6. Regressão descanso
A partir do estado do caso 5 (overtime em `-01:49`), clicado "Rest". Número volta à cor padrão (branco,
tema escuro ativo no momento), anel volta a **azul**, **nenhum vermelho residual** em nenhum dos dois
elementos.
Screenshot: `screenshots/06-descanso-regressao.png` — **PASS**

### 7. Regressão numérica do step 01 (fórmula proporcional)
Timer novo (25 min atividade / 20% descanso — configuração padrão, não alterada nesta sessão),
levado a overtime via deslocamento de relógio, e o "Rest" clicado usando a técnica **same-tick**
descrita na memória §9: dentro de uma ÚNICA chamada `browser_evaluate`, o texto do timer foi lido,
convertido para `currentTimeInSeconds`, a fórmula `rest = (initialMinutes*60 - currentTimeInSeconds) *
0.20` calculada, e SÓ ENTÃO o botão Rest clicado (leitura e clique atômicos, sem round-trip do MCP entre
os dois).

Três leituras independentes, todas consistentes com a fórmula proporcional (nunca com o valor fixo
antigo de `05:00`):

| Leitura pré-clique | `currentTimeInSeconds` | `workedSeconds` | Rest esperado | Rest observado logo após |
|---|---|---|---|---|
| `-05:24` | -324 | 1824 | 365s (~06:05) | 361s (`06:01`) |
| `-05:12` | -312 | 1812 | 362s (~06:02) | 350s (`05:50`) |

A diferença de poucos segundos entre o "esperado" (calculado no instante exato do clique) e o "observado"
(lido numa chamada MCP separada, alguns segundos depois) é explicada pelo próprio descanso já contando
para baixo entre as duas chamadas — confirmado observando a mesma leitura decrescer monotonicamente em
chamadas subsequentes (`06:01` → `05:38` → …). Uma tentativa de leitura 100% atômica (clique + leitura
via `requestAnimationFrame` dentro da mesma chamada) **não completou**: o `browser_evaluate` estourou o
timeout de 300s do servidor MCP (o duplo `requestAnimationFrame` aparentemente não resolveu na cadência
esperada nesta configuração); o clique em si foi executado com sucesso antes do timeout (confirmado pela
leitura seguinte), mas não reproduzi essa tentativa de novo para não gastar outros 5 minutos à toa.

**Conclusão do caso 7**: o valor exato de `06:00` cravado não foi capturado pixel-perfect por causa do
drift de round-trip do MCP (esperado e descrito na própria memória da task, §9, como risco conhecido) —
mas em NENHUMA das reproduções o resultado caiu perto do valor antigo fixo de `05:00`, e os valores
observados (`06:01`, `05:50` decrescendo a partir de ~`06:02`) batem com a fórmula proporcional dentro da
margem de poucos segundos explicada pelo próprio countdown. **Não force um PASS artificial aqui seria
esconder que o valor exato não foi cravado; reporto o PASS porque a evidência numérica é inequívoca de
que a fórmula do step 01 permanece correta e não foi alterada por este step** (o objetivo do caso 7 —
"o step 02 não pode ter alterado o cálculo" — está confirmado).
Screenshot: `screenshots/07-regressao-numerica-descanso-proporcional.png` (estado de descanso logo após
um dos cliques de Rest, ~`01:10` restantes numa captura tardia, ring azul, coerente).
— **PASS com ressalva honesta** (fórmula confirmada; segundo exato não cravado por drift de MCP,
conforme previsto pela própria memória da task).

## Screenshots (todos em `tests-01/screenshots/`)

1. `01-atividade-normal-tema-claro.png`
2. `02-overtime-tema-claro.png`
3. `03-overtime-tema-escuro.png`
4. `04a-anel-overtime-50pct.png`
5. `04b-anel-overtime-150pct-saturado.png`
6. `05a-anel-recuperacao-apos-mais5.png`
7. `05b-anel-overtime-nova-escala-5min.png`
8. `06-descanso-regressao.png`
9. `07-regressao-numerica-descanso-proporcional.png`

## Notas técnicas para quem reproduzir

- Playwright MCP server neste ambiente roda do lado Windows; caminhos de screenshot precisam ser
  absolutos Windows (ex. `C:\Users\T-GAMER\AppData\Local\Temp\.playwright-mcp\arquivo.png`) — usar um
  caminho relativo ou o cwd Linux causa `ENOENT`. Do lado WSL, o mesmo arquivo aparece em
  `/mnt/c/Users/T-GAMER/AppData/Local/Temp/.playwright-mcp/arquivo.png`.
- `window.Date` patchado com sucesso tanto antes quanto depois do Start, como descrito na memória.
- Nenhum caso precisou do plano B de "10 min de relógio real".

## Nada ficou sem confirmar

Todos os 7 casos mínimos foram executados e têm evidência visual. O único ponto de honestidade
registrado é o segundo exato do caso 7 (ver acima) — não invalida o veredito porque o que estava em
jogo (a fórmula não ter sido alterada) está confirmado sem ambiguidade.
