# Orquestration — step 02_sinalizacao-vermelha-do-overtime

## Extrato do step

- Decisões vinculantes: A1 anel reenche proporcional em overtime, saturando em cheio
  (`Math.min(-currentSeconds/totalSeconds, 1)` dentro de `getPercentage`); A2 clamp mora só em
  `getPercentage` (cobre os 2 caminhos de total via `getCircleDashoffset`, não duplicar em
  `getCircleDashoffset`); A3 prop nova `isOvertime?: boolean` no `Timer` (não derivar dentro dele);
  A4 mesmo limiar do step 01 (`isOvertime` já calculado em `IndexTimer.tsx:40`); A5 só a COR recebe
  `isOvertime`, a geometria (`getCircleDashoffset`) não muda de assinatura; A6 botão Stop do painel
  de overtime continua `variant="danger"`, nada muda no painel; A7 anel sem par `dark:` (tokens Red
  não têm override `.dark` em `global.css:13-14`) — só o número (Tailwind) precisa do par
  `text-Red-500 dark:text-Red-400`.
- Critérios de aceitação: tsc limpo; exatamente 2 arquivos no diff; atividade normal = cor
  padrão + anel verde; overtime = número `-MM:SS` vermelho (`text-Red-500`/`dark:text-Red-400`) +
  anel `var(--color-Red-400)`; anel recarrega proporcional e satura sem arco fantasma, inclusive
  após "+5 min" (N10); descanso = cor padrão + anel azul, zero vermelho residual; cálculo do step
  01 intacto (25@20% + 5min overtime ⇒ 06:00).
- Arquivos no escopo: `src/layout/components/common/Timer/index.tsx` (TimerProps `:3-9`,
  `getPercentage` `:11-21`, `getCircleDashoffset` `:23-44` NÃO MEXER, assinatura `:46-52`, `<span>`
  `:91`); `src/pages/index/components/IndexTimer.tsx` (`strokeColor` `:51-53`, passar
  `isOvertime={isOvertime}` no bloco `:44-54`, resto do arquivo intacto). Fora de escopo:
  `countdownTimer.ts`, `global.css`, `Button/index.tsx`, os 3 PNGs untracked na raiz.
- Estado de git: branch `main` | commit-base `5c1282d` (step 01 fechado e commitado).
- Armadilhas: N2.2 arco fantasma (resolvido pelo clamp em `getPercentage`); N3 twMerge mata o
  vermelho no dark mode se for pro container — cor só no `<span>` filho; N10
  `lastExtraAddedMinutes` troca o total do anel — já coberto por A2 (clamp único cobre os 2
  caminhos); ressalva `Math.floor`/`Math.ceil` do tick NÃO se aplica aqui (este step não toca
  `countdownTimer.ts`).
- Cenário/preset de teste: Docker+browser only. `npx tsc --noEmit` + `npm run dev` (porta 1420) +
  Playwright MCP + deslocamento de `window.Date` (memória §8) para entrar em overtime sem esperar.
  7 casos mínimos no `plan.md` (regressão atividade, overtime claro, overtime escuro, anel sem
  artefato em 2 instantes, anel após +5min, regressão descanso, regressão numérica do step 01).

## {ts} — recon (S02-recon-tempo-extra-descanso)

- Pointer: `recon.md` | Veredito: complexa (falha itens 4 e 5 — semântica do anel em aberto +
  clamp é lógica nova) | Partição: não

## {ts} — planner (S02-plan-tempo-extra-descanso, opus)

- Pointers: `plan.md`, `prompts/sinalizacao-vermelha-do-overtime.md` ×1
- Next: implement

## {ts} — implementer (S02-impl-sinalizacao-vermelha-do-overtime-tempo-extra-descanso)

- Files changed: 2 (`Timer/index.tsx`, `IndexTimer.tsx`) | Type-check: exit=0

## {ts} — validator (S02-validate-tempo-extra-descanso-r1)

- Verdict: APPROVED_WITH_RESALVAS | Pointer: `review-r1.md` | Findings: `Timer/index.tsx:98` —
  `: undefined` vs `: ""` no twMerge (estilo, sem correção); `IndexTaskItem.tsx:180-184` — mini-timer
  herda o clamp de `getPercentage` (efeito colateral positivo, sem correção)
- Commit: `7997ddc` (implement + validate)

## {ts} — tests-01

- Mode: Docker+browser only | Result: PASS (7/7 casos) | Pointer: `tests-01/verdict.md`
- Caso 7 (regressão numérica) com ressalva honesta: drift de round-trip do MCP impediu cravar o
  segundo exato, mas a fórmula proporcional do step 01 foi confirmada, nunca o valor fixo antigo
- Commit: `f42dedd` (teste)
- Next: close step
