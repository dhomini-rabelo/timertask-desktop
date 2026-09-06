# Juizo da evidencia — tests-03 (juiz-layout-melhorias-ui-test-r03, opus fresco, janela 69k)

veredito: APROVADO_COM_RESSALVAS

Metodo: o juiz decodificou cada PNG e localizou as bounding boxes do pill/botao/texto, medindo os
pixels ele mesmo em vez de confiar nos numeros do verdict.

## Melhoria 1 — Debug do lado do tempo no PC: ATENDIDA

Bate com `debug.png`. Pill medido em 01/03: x=312..487 (176px) numa fileira de 501px (ratio 0,351; o
verdict dizia 0,355) e 270..445 (176px) em 459px. Na referencia o pill mede 178px e o vao
texto-"Debug" -> texto-"00:00" e 40px, exatamente igual ao crop. Mesma fileira do lapis/Notes/"5 min",
pill de largura fixa (nao esticado). O overview 09 (dark) e visualmente a forma da referencia.

## Melhoria 2 — Notes so icone: ATENDIDA

Crop 06: botao com 26px (icone 14px + p-1.5), sem rotulo; 07 idem no footer. A11y ok e MELHOR que
antes: `aria-label={label || "Notes"}` + `title`, e o atomo Button faz `{...props}` no `<button>`. O
footer passava `label=""` e antes ficava SEM nome acessivel — o fix cobre os 3 usos.

## Regressao: nada quebrado

- Mobile ok: 04/05 mostram o pill em linha propria ocupando 262/288 e 192/218 px, sem overflow — a
  aposta do `w-full sm:w-auto` se sustenta.
- Folga em 1100: o vao central medido e 82px contra um minimo de 8px (`gap-2`), ou seja ~74px de folga
  real — nao esta no limite. A fileira e irma do titulo (nao divide linha com ele), entao titulo maior
  nao a aperta.

## Ressalvas de rigor (nao bloqueantes)

- (a) **1100 nao e o caso mais apertado**: `lg:grid-cols-2` comeca em 1024px, onde o interior cai para
  ~421px (74-38 = ~36px de folga).
- (b) A variante de **3 botoes** (lapis + lixeira + Notes, task pausada mas ja iniciada — estado real)
  nao foi medida com o Debug: custa ~+40px (crop 06: 97px de grupo esquerdo vs 57px nos crops 01/03),
  o que em 1024px zera a folga e faz o pill quebrar para linha propria. Degradacao BENIGNA (pill
  compacto de 176px, sem overflow nem sobreposicao) — nao o defeito que o usuario reclamou.
- (c) 01 e 02 sao praticamente a mesma imagem (84 de 30.561 pixels diferentes; ambas 501x61): 1280 e
  1440 dao o mesmo layout por causa do max-width, entao o shot de 1440 nao prova um estado distinto.
  Os 9 md5 sao distintos e nenhum e captura renomeada.

## Em aberto

Nada que impeca fechar. Duas observacoes:
- medir 1024px com a task pausada+iniciada fecharia a ultima lacuna;
- o badge "Running" que aparece na `debug.png` ja estava ausente em tests-02 (aprovado) — nao e
  regressao desta rodada e esta fora do pedido.
