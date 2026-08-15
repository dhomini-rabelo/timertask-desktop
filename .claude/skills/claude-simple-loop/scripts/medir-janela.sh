#!/usr/bin/env bash
# Mede a PRÓPRIA ocupação de janela de contexto, lendo o transcript ao vivo.
#
# Usado por claude-simple-loop e claude-step-loop. Quem mede, e quando, está na
# tabela "Onde medir" do SKILL.md — medição é CHECKPOINT, não hábito: cada chamada
# a mais é um turn pago, e num grupo medido 62 chamadas produziram ZERO handoffs.
#
# Uso:
#   medir-janela.sh <nonce>    # dentro de um subagente: o nonce é o `description` do spawn
#   medir-janela.sh --self     # FALLBACK: acha o transcript ativo mais recente da sessão
#   medir-janela.sh --main     # no loop principal (nível 0)
#   medir-janela.sh --list     # diagnóstico: lista os descriptions recentes da sessão
#
# Exemplos desta skill:
#   PASSO=20 medir-janela.sh "plan-outbound-files-metadata"     # planejador (vida ~60 turns)
#   medir-janela.sh "test-outbound-files-metadata-browser-r02"  # tester de vida longa
#   medir-janela.sh --main                                      # o próprio orquestrador
#
# Saída (uma linha):
#   janela=118539 teto=150000 pct=79 turns=33 taxa=1084 proj=161899 proxima=73 status=handoff fonte=exato desc="E2-01-045"
#   status=handoff quando janela >= teto OU quando a PROJEÇÃO até a próxima medição o alcança.
#
# Teto configurável: TETO=180000 medir-janela.sh <nonce>   (default 150000)
# Passo de medição: PASSO=40 medir-janela.sh <nonce>   (default 40 turns)
#
# ---------------------------------------------------------------------------
# Por que este script foi endurecido (medido no grupo 045)
#
# A alavanca "o agente se auto-mede" falhou DUAS vezes seguidas, e não por
# desobediência: o planejador da subtask 01 chamou o script UMA vez, o nonce
# `E2-01-plan-045` foi REJEITADO (exit 65), ele nunca tentou de novo e fechou em
# 129% do teto. A causa está em disco e é verificável: varrendo 1.628 arquivos
# `*.meta.json` de todas as sessões, apenas 10 descriptions seguem a convenção de
# nonce — e todos os 10 são orquestradores de etapa disparados pelo NÍVEL 0. Os
# filhos que o `E2` dispara aparecem como "Planejador Opus subtask 02",
# "Planejador fresco subtask 03": rótulos legíveis, não o nonce que o prompt
# mandava usar na medição. Ou seja, o `description` do spawn e o `{nonce}` do
# corpo do prompt divergiam — e a medição por nonce estava condenada a falhar.
#
# Três consertos saíram daí, todos aqui:
#   1. O casamento por nonce é TOLERANTE: exato → case-insensitive → substring,
#      e o modo casado sai em `fonte=` para você saber o que aconteceu.
#   2. Existe `--self`, que não depende de nonce nenhum: pega o transcript de
#      subagente mais recentemente escrito da sessão e IMPRIME o `desc=` que
#      casou, para você conferir que é você mesmo.
#   3. O erro é ACIONÁVEL: em vez de só falhar, lista os descriptions candidatos
#      da sessão, para o agente corrigir e tentar de novo no mesmo turn.
# ---------------------------------------------------------------------------
#
# Por que a projeção existe. Medir só o valor atual falha no caso que ela deveria pegar:
# num grupo medido, o resync do backend mediu-se UMA vez, no turn 68 de 172, e recebeu
# `janela=181343 pct=72 status=ok`. A janela cresceu mais 70k DEPOIS desse único
# checkpoint e o agente fechou em 251.408 — acima do teto, sem nunca pedir handoff.
# O valor instantâneo estava certo; o que faltava era a DERIVADA. Por isso:
#
#   taxa   = crescimento médio por turn na metade mais recente da execução
#   proj   = janela projetada daqui a PASSO turns (janela + taxa × PASSO)
#   proxima= em que turn medir de novo (turns + PASSO)
#
# `status=handoff` dispara pela projeção — antes do estouro, não depois dele.
#
# PISO (default 60%) evita o falso positivo simétrico: um agente ainda em 40% da
# janela, com uma `taxa` alta e ruidosa vinda de poucos turns, projetaria estouro e
# pediria handoff cedo demais. Abaixo do piso a projeção é só informativa — o agente
# segue trabalhando e remede no `proxima`. Acima do piso ela decide.
# Configurável: PISO=70 medir-janela.sh <nonce>
#
# Por que funciona: cada turn do transcript grava um bloco `usage`, e o arquivo é
# append-only DURANTE a execução. A soma input + cache_read + cache_creation do último
# turn é a ocupação real da janela — o mesmo número que o pai recebe como
# `subagent_tokens` no bloco de uso do retorno.
#
# Dependência: `python3` (presente no ambiente). NÃO use `jq` aqui — ele está AUSENTE
# nesta máquina, e a versão anterior deste script falhava em silêncio por causa disso:
# num grupo medido, NENHUMA medição rodou e um agente chegou a 244,7k (98% do teto) sem
# ninguém notar.

set -uo pipefail

alvo="${1:-}"

if [ -z "$alvo" ]; then
  echo "erro: uso: medir-janela.sh <nonce> | --self | --main | --list" >&2
  exit 64
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "erro: python3 ausente — sem ele não há como ler o transcript" >&2
  exit 68
fi

TETO="${TETO:-150000}" PASSO="${PASSO:-40}" PISO="${PISO:-60}" \
ALVO="$alvo" CWD="$PWD" python3 <<'PY'
import glob, json, os, sys

teto = int(os.environ["TETO"])
passo = max(1, int(os.environ["PASSO"]))
piso = int(os.environ["PISO"])
alvo = os.environ["ALVO"]
cwd = os.environ["CWD"]

base = os.path.join(os.path.expanduser("~"), ".claude", "projects")
sessao = os.environ.get("CLAUDE_CODE_SESSION_ID", "")
# O slug do projeto é o cwd com "/" trocado por "-" (ex.: /home/x/y -> -home-x-y).
slug = cwd.replace("/", "-")


def falhar(msg, codigo):
    print("erro: " + msg, file=sys.stderr)
    sys.exit(codigo)


def metas():
    """Todos os *.meta.json visíveis, do escopo mais estreito para o mais largo."""
    escopos = []
    if sessao:
        escopos.append(os.path.join(base, "*", sessao, "subagents", "*.meta.json"))
    escopos.append(os.path.join(base, slug, "*", "subagents", "*.meta.json"))
    escopos.append(os.path.join(base, "*", "*", "subagents", "*.meta.json"))
    for padrao in escopos:
        achados = glob.glob(padrao)
        if achados:
            return achados
    return []


def descricao(caminho):
    try:
        with open(caminho, "r", encoding="utf-8", errors="replace") as f:
            return (json.load(f) or {}).get("description") or ""
    except Exception:
        return ""


def candidatos():
    """[(mtime, caminho_meta, description)] ordenado do mais recente para o mais antigo."""
    saida = []
    for m in metas():
        try:
            saida.append((os.path.getmtime(m), m, descricao(m)))
        except OSError:
            continue
    saida.sort(reverse=True)
    return saida


def transcript_de(meta):
    return meta[: -len(".meta.json")] + ".jsonl"


def ativo(caminho):
    return os.path.isfile(caminho) and os.path.getsize(caminho) > 0


# ---------------------------------------------------------------- modos

if alvo == "--list":
    for mtime, meta, desc in candidatos()[:25]:
        print('desc="%s" transcript=%s' % (desc, os.path.basename(transcript_de(meta))))
    sys.exit(0)

fonte = ""
desc_casada = ""

if alvo == "--main":
    if not sessao:
        falhar("CLAUDE_CODE_SESSION_ID ausente — sem ele não há como identificar a sessão", 67)
    achados = sorted(
        glob.glob(os.path.join(base, "*", sessao + ".jsonl")),
        key=os.path.getmtime,
        reverse=True,
    )
    if not achados:
        falhar('transcript do loop principal não encontrado para a sessão "%s"' % sessao, 66)
    transcript = achados[0]
    fonte, desc_casada = "main", "--main"

elif alvo == "--self":
    # Sem nonce: o transcript de subagente escrito mais recentemente é, quase
    # sempre, o seu — o pai está parado esperando você. Por isso o `desc=` sai na
    # linha: se ele não for você, ignore a leitura e meça de novo com o nonce certo.
    escolhido = None
    for _mtime, meta, desc in candidatos():
        t = transcript_de(meta)
        if ativo(t):
            escolhido, desc_casada = t, desc
            break
    if not escolhido:
        falhar("nenhum transcript de subagente ativo nesta sessão (rode --list para ver o que existe)", 65)
    transcript, fonte = escolhido, "self-mtime"

else:
    lista = candidatos()
    escolhido = None
    # Tolerância deliberada: o modo que casou sai em `fonte=`, então uma medição
    # por substring nunca se disfarça de casamento exato.
    for modo, teste in (
        ("exato", lambda d: d == alvo),
        ("ci", lambda d: d.lower() == alvo.lower()),
        ("substring", lambda d: alvo.lower() in d.lower() or d.lower() in alvo.lower()),
    ):
        for _mtime, meta, desc in lista:
            if desc and teste(desc) and ativo(transcript_de(meta)):
                escolhido, fonte, desc_casada = transcript_de(meta), modo, desc
                break
        if escolhido:
            break
    if not escolhido:
        recentes = [d for _m, _p, d in lista[:8] if d]
        falhar(
            'nenhum subagente com description ~ "%s".\n'
            "       O nonce da medição É o parâmetro `description` do spawn — se quem te "
            "disparou escreveu outro rótulo lá, nenhum nonce vai casar.\n"
            "       NÃO desista depois de UM erro: tente `medir-janela.sh --self` (acha o "
            "transcript ativo mais recente e imprime o desc= que casou).\n"
            "       Descriptions recentes desta sessão: %s" % (alvo, recentes or "nenhuma"),
            65,
        )
    transcript = escolhido

if not os.path.isfile(transcript):
    falhar('transcript não encontrado para "%s"' % alvo, 66)

# ---------------------------------------------------------------- medição

janelas = []
with open(transcript, "r", encoding="utf-8", errors="replace") as f:
    for linha in f:
        linha = linha.strip()
        if not linha:
            continue
        try:
            evento = json.loads(linha)
        except json.JSONDecodeError:
            # última linha pode estar sendo escrita agora (transcript ao vivo)
            continue
        if evento.get("type") != "assistant":
            continue
        uso = (evento.get("message") or {}).get("usage")
        if not uso:
            continue
        janelas.append(
            (uso.get("input_tokens") or 0)
            + (uso.get("cache_read_input_tokens") or 0)
            + (uso.get("cache_creation_input_tokens") or 0)
        )

turns = len(janelas)
janela = janelas[-1] if janelas else 0

# Taxa = crescimento médio por turn na METADE MAIS RECENTE da execução. A metade
# recente, e não a run inteira, porque o arranque de todo agente é um degrau (o
# baseline entra de uma vez) que achataria a média e esconderia justamente a fase
# em que a janela dispara.
meio = turns // 2
taxa = 0
if turns - meio >= 2:
    taxa = max(0, (janela - janelas[meio]) // (turns - meio))

proj = janela + taxa * passo
proxima = turns + passo
pct = janela * 100 // teto if teto else 0

# O valor absoluto sempre manda. A projeção só decide DEPOIS do piso — antes dele a
# `taxa` é ruidosa demais para justificar um handoff (que custa um baseline novo).
status = "handoff" if (janela >= teto or (pct >= piso and proj >= teto)) else "ok"
print(
    'janela=%d teto=%d pct=%d turns=%d taxa=%d proj=%d proxima=%d status=%s fonte=%s desc="%s"'
    % (janela, teto, pct, turns, taxa, proj, proxima, status, fonte, desc_casada)
)
PY
