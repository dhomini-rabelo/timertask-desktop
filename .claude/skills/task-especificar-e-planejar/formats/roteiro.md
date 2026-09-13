# O roteiro de comprovação

O roteiro é a **lista fechada e numerada das provas que a implementação vai produzir**, escrita
antes do plano e aprovada pelo dev.

Sem ele a prova é decidida na hora do teste. A instrução que o tester de tela recebia era "salve um
PNG por passo-chave", e passo-chave era ele quem escolhia: o caminho feliz rende screenshot, o
e-mail inválido não, e o dev descobre no fim que a borda que ele tinha na cabeça nunca foi
exercitada. Caso de borda é justo o que ninguém inventa sozinho.

O roteiro inverte isso. O dev lê "o analista escolhe um período sem nenhum registro, a exportação é
recusada" **antes** de existir plano, e o que ele aprovou ali é o que a validação vai cobrar.

---

## Quem escreve, e quando

1. **O reconhecimento propõe** (Etapa 6). Ele leu o código, então sabe as telas que existem, o
   script que sobe o ambiente e o que o mock fabrica.
2. **O dev fecha** (Etapa 7). Ele corrige o texto de cada prova, acrescenta a borda que faltou e
   corta a que não interessa. É o único momento em que a lista se negocia.
3. **O planejador carrega** (Etapa 8). Ele copia o roteiro aprovado para o `## Plano de teste` e
   amarra cada prova a uma rodada de validação. Ele não reescreve asserção nenhuma.
4. **O tester executa** (etapa de validação da outra skill). Uma prova, um veredito, e o arquivo do
   screenshot leva o id no nome.

O planejador tem duas liberdades e nenhuma terceira. Ele **acrescenta** prova, com o próximo id
livre, quando um `RT` ficaria sem nenhuma, e diz isso em "Decisões que travei sozinho". Ele
**dispensa** prova aprovada só por `## Desvios da spec`, com o motivo, e o dev decide no gate.
Trocar em silêncio o texto de uma asserção aprovada é devolver a decisão ao agente, que é o que o
roteiro existe para impedir.

---

## Duas formas de prova, dois ids

O roteiro cobre as duas lanes cuja prova é uma coisa que alguém produz:

- **`S0n` — screenshot**, lane `browser`. Uma tela, uma asserção.
- **`T0n` — caso de suíte**, lane `teste`. Um caso de teste automatizado que o **comando de teste**
  do projeto roda e que falha sozinho.

As lanes `curl` e `codigo` ficam fora do roteiro e mantêm a entrada por `RT` que sempre tiveram: um
comando com resposta esperada, ou um alvo no diff com a linha que reprova. As duas já são literais
e reproduzíveis por quem não leu o código, que é o que o roteiro compra para as outras duas.

**Id nunca renumera.** Se o dev cortar o `S04` no gate, o `S05` continua `S05` e a sequência fica
com um buraco. Buraco é barato. Id reaproveitado quebra a ligação entre o roteiro, o nome do PNG em
disco e o relatório de validação.

---

## O cabeçalho: ambiente, estado e ponto de partida

Três linhas abrem o roteiro, e nenhuma é opcional.

```text
ambiente: {comando de ambiente}
estado: {comando de estado}
url: {url} — {o que está aberto ali}
```

- **`ambiente`** é o **comando de ambiente** do cartão do projeto: o comando que sobe o ambiente
  inteiro em que as provas rodam. Um projeto costuma ter mais de uma variante — com serviço falso ou
  real, com um dependente a mais no ar — e elas **não são intercambiáveis**. O reconhecimento
  confere no manifesto do projeto qual delas serve, e nomeia essa. Sem esta linha o tester escolhe,
  e o que ele escolhe é a variante mais curta. Prova rodada no ambiente errado não é FAIL: é uma
  hora perdida.
- **`estado`** é o **comando de estado** que fabrica o ponto de partida das provas, com o que ele
  imprime que o tester vai reusar. Ele vem do mecanismo de fixtures que o cartão achou; `nenhum`
  quando o projeto não tem um, e aí o estado é montado num passo do plano.
- **`url`** é onde a primeira prova de tela começa, escrita exatamente como o navegador a abre. Ela
  sai do endereço em que o comando de ambiente sobe. `nenhum` na lane `teste` sozinha, que não abre
  navegador.

Quando uma prova sai desse ponto de partida, ela carrega a própria linha. `estado:` quando ela
precisa de outro registro ou de outra fase. `url:` quando ela acontece em outra tela. O tester roda
ou navega antes dela.

---

## A anatomia de um `S0n`

```text
S01 (RT-003) [marco 1] o analista escolhe o período do mês passado e clica em
    Exportar → o download começa e a listagem mostra "Gerando o arquivo…"
```

Quatro campos, nesta ordem:

1. **O id**, `S01`.
2. **O `RT` que a prova serve**, entre parênteses. Mais de um, quando a mesma tela prova dois.
3. **A rodada de validação**, entre colchetes: `[marco {m}]` ou `[final]`. Quem preenche é o
   planejador, porque é ele quem declara os marcos; o reconhecimento propõe todas como `[final]` e
   não erra por isso.
4. **A asserção**, com a ação antes da seta e o que precisa estar visível depois dela.

A seta é o que separa o que o tester **faz** do que ele **vê**. Ela existe porque as duas metades
falham diferente: ação que não dá para executar é BLOCKER, e tela que não mostra o esperado é FAIL.

### As sete regras da asserção

1. **Uma asserção por screenshot.** Duas coisas para conferir são dois screenshots. Prova que cobre
   três afirmações não tem veredito possível: uma passa, a outra não, e o relatório fica com um
   PASS pela metade que ninguém sabe ler.

2. **A ação é escrita como o usuário a faz.** "O usuário responde um e-mail inválido", não "o
   payload chega com e-mail malformado". Quem executa está no navegador, não no código.

3. **O que precisa estar visível é nomeado.** "A tela abriu" não é prova de nada. A asserção diz o
   sujeito que tem que aparecer, e é esse sujeito que o PNG tem que mostrar.

4. **Texto que a spec fixou vai entre aspas.** Se o `RT` diz que a pergunta é direta, a asserção
   escreve `"Qual seu e-mail?"`. Assim o tester não aceita uma variação que a spec recusava.

5. **Todo caminho de erro escrito na spec tem screenshot próprio.** E-mail inválido, e-mail já
   usado, limite estourado, timeout: cada um é um `S0n`, nunca um adendo do caminho feliz. Esta é a
   regra que mais muda o resultado, porque é a que o tester não cumpre sozinho.

6. **A ordem é a da conversa.** O roteiro é uma sequência: o `S03` encontra a tela que o `S02`
   deixou. Prova que rompe a sequência carrega a própria linha `estado:` ou `url:`.

7. **Sem número inventado.** Contagem, limite e prazo que aparecem na asserção saem de um `RT`. Se
   não saem de nenhum, ou a spec está incompleta ou a asserção está adivinhando.

---

## A anatomia de um `T0n`

```text
T01 (RT-005) [final] {arquivo da suíte} — texto com o separador dentro do campo →
    o campo sai escapado e o número de colunas não muda
```

Mesmos quatro campos, com o **arquivo da suíte** antes da asserção. O roteiro nomeia o arquivo
porque ele é o entregável: quem escreve o teste é o implementador, num passo do plano que cita o
`RT`, e quem roda é o tester da lane `teste`. Tester não escreve o próprio teste — validação é
observação, e um agente que escreve a prova e depois a executa está aprovando o trabalho dele.

Onde as suítes vivem e como se chamam é o campo `convenção de teste` do cartão do projeto, e o
roteiro escreve o **caminho completo** do arquivo, novo ou existente, seguindo essa convenção, mais
o comando que o roda:

```text
comando: {comando de teste}
```

Quando a suíte precisa de um serviço de pé — banco, fila, storage —, isso é o campo
`pré-requisito de ambiente` do cartão, e a lane `teste` passa pelo mesmo gate desse pré-requisito
que as lanes `curl` e `browser`. Quando o cartão diz `comando de teste: nenhum`, a lane `teste` não
existe nesta task: o `RT` que a pediria cai em `curl` ou `codigo`, e o reconhecimento diz isso na
linha da lane.

---

## Quando a lane `teste` é a escolha certa

A lane nasceu porque duas coisas estavam sendo provadas na lane errada.

- **Regra com muitas bordas.** Provar seis formatos de e-mail inválido por screenshot são seis
  telas, seis boots e seis PNG. A mesma coisa é uma suíte com seis casos e um comando.
- **Regra que a tela não mostra e o diff não fecha.** "Nenhum usuário é criado quando o e-mail
  repete" é uma afirmação sobre o banco depois da ação. Screenshot não mostra o banco, e ler o
  diff só mostra a intenção do código.

A lane `codigo` continua sendo a de escolha de modelo, teto de custo e biblioteca proibida: o que
se prova lendo, não rodando.

**Screenshot não vira suíte por economia.** A tela que o dev vai querer conferir com os próprios
olhos é disso: o layout, o texto que o usuário lê, o estado depois da ação. É lane `browser`, e o
roteiro existe justamente para o dev poder olhar depois.

---

## Critérios de fechamento do roteiro

O roteiro fecha quando as sete linhas abaixo são verdade. Confira uma por uma antes de levar ao
gate.

1. **A linha `ambiente` existe** e nomeia o comando de ambiente que o cartão do projeto achou.
2. **As linhas `estado` e `url` existem**, mesmo que digam `nenhum`.
3. **Todo `RT` de lane `browser` tem pelo menos um `S0n`.**
4. **Todo `RT` de lane `teste` tem pelo menos um `T0n`, com arquivo de suíte e comando**, ou a lane
   `teste` está indisponível no cartão, e nenhum `RT` foi posto nela.
5. **Toda prova tem id, `RT`, rodada e uma asserção com ação e sujeito visível.**
6. **Todo caminho de erro que a spec escreveu tem prova própria.**
7. **Nenhuma prova depende de estado ou de tela que ninguém alcançou**: ou ela vem depois da prova
   que deixa a tela nesse ponto, ou ela carrega a própria linha `estado:` ou `url:`.
