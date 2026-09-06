# Veredito — tests-03 (rodada focada: 2 mudancas)

**PASS**

Script: `/tmp/claude-1000/.../scratchpad/run-focused.js` (dados brutos em `shots-03/results.json`), cenario 100% via UI (R3-Grupo/R3-Sub-01/R3-Sub-02, R3-Task-Footer), reaproveitando helpers de `tests-02/run.js`.

1. **1280**: actionRow height=61px (linha unica, sem wrap), tops pencil=553/notes=558/select=555/debugOuter=549 (spread 9px, dentro de 1 linha flex items-center), overlapPairs=0, overflowOffenders=0. Debug↔tempo gap=24px, debugOuterWidthRatio=0.355 (178px de 501px da fileira — pill compacto, nao esticado). Bate com `debug.png`.
2. **1100** (interior da fileira=459px, faixa meia-coluna): height=61px (linha unica), overlapPairs=0, overflowOffenders=0, docScrollWidth(1100)==docClientWidth(1100). debugOuterWidthRatio=0.387, gap Debug↔tempo=24px.
3. **1440**: height=61px (linha unica), overlapPairs=0, overflowOffenders=0, ratio=0.355, gap=24px — identico ao padrao de 1280/1100.
4. **390/320 sem regressao**: rowRect.height=141px (multi-linha: pencil+notes / select / debug), ownLine=true (debugOuter.top − pencil.top = 550/562px), debugOuterWidthRatio=0.917/0.89 (ocupa a linha inteira), docScrollWidth==docClientWidth em ambos (390 e 320) — zero overflow horizontal.
5. **A11y do Notes**: `getByRole('button',{name:'Notes',exact:true})` retornou count=3 (task ativa da lista + task inativa da lista + task completada no footer), todos com `aria-label="Notes"` e `textContent=""` (icone puro, sem rotulo visivel).
6. **Sem regressao visual**: screenshots 08/09 (overview 1280 light/dark) mostram 2 colunas de pé, card de grupo com superficie unica; 07 mostra footer com badge de verde+titulo na linha de cima e Start/End/Duration na linha de baixo. consoleErrors=0.

## Screenshots (`screenshots/`)
- `01/02/03-fileira-acoes-{1280,1440,1100}.png` — crop real da fileira de acoes (lapis/Notes/5min/Debug) em cada largura, linha unica.
- `04/05-fileira-acoes-{390,320}-mobile-own-line.png` — mesma fileira, Debug em linha propria (regressao checada).
- `06-notes-icone-so-lista.png` — crop lapis+lixeira+Notes (so icone, bola azul) na lista.
- `07-notes-icone-so-footer.png` — crop do item completado no footer, Notes so icone + badge/titulo em cima, tempos embaixo.
- `08/09-overview-1280-{light,dark}.png` — visao geral full-page, 2 colunas, sem quebra visivel.
