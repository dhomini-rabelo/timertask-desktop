<!--
IMPLEMENTER LAUNCH (stage 2).

The implementer's prompt BODY is not here: the PLANNER writes it, one file per scope, at
{task_dir}/prompts/{escopo-kebab}.md. This file documents the FORM of the launch — and the
orchestrator does not need to open it again after the first launch of the run.
-->

# Launching the implementer — `@` the ready prompt, never "read section X of the plan"

```text
Agent(
  subagent_type: 'general-purpose',
  model: 'sonnet',                     # EXPLICIT always — without `model` the child inherits Opus
  run_in_background: false,
  description: 'impl-{escopo-kebab}-{nome_task}',   # nonce; fix rounds: -fix{N}
  prompt:
    "@{task_dir}/prompts/{escopo-kebab}.md\n\n" +
    "{the delta below, and nothing more}"
)
```

The delta:

```text
The file mentioned above IS your complete task — contract, extract of binding decisions, mold, footprint, git state, acceptance criteria and the files you own. If for any reason its content did not arrive expanded in this message, read it ONCE with `Read` and follow it; never open the plan file instead.

You are agent "{escopo-kebab}" of the task "{nome_task}". Any other ready-prompt file in that folder belongs to ANOTHER agent running alongside you: those files, and the files they own, are OUT OF SCOPE for you.

Follow the repo's existing patterns — naming, structure, libraries, and the project rules in CLAUDE.md. Match the surrounding code rather than introducing a new style.

Run the type-checker ONCE, at the end, as YOUR acceptance criterion, and send its verbose output to a file: `cmd > /tmp/tsc.log 2>&1; echo "exit=$?"; tail -5 /tmp/tsc.log`. Do NOT run it repeatedly while working, and do NOT run the linter or the full test suite — the orchestrator owns those, once, after you return.

Do NOT run `git status` or `git diff`: your branch and base commit are in the file above, and the list of files you changed comes from YOUR return, never from git.

Do NOT spawn or delegate to any agent. Do NOT edit the plan, the task docs, or another scope's files.

SEARCH WITH THE CUT IN THE COMMAND — narrow path, `-m 5`, `--include=`, `-l` when you only need which files, `| head -40` as the last stage; never unbounded output. To read part of a large file use `Read` with `offset`/`limit`, never `sed -n`, `cat`, `head` or `tail`. Your footprint is already in the file above: do not re-grep what it already gives you.

DISK IS THE DELIVERY CHANNEL. Your final message may not reach the orchestrator that spawned you. So before returning, make sure every change is written to disk and, if the contract asks for notes, append them to their file. Your final message is at most 10 lines: the list of files you created/edited, the type-check exit code, and anything you deliberately did NOT do (with the one-line reason). Never paste diffs or file bodies into the return.

This run is autonomous — never call AskUserQuestion. If you hit a hard blocker (missing secret, missing access, a contradiction in the contract), stop, write what you found, and return `blocked: {reason}` — do not guess your way around it.
```

## Fix rounds

Reviewer and tester feedback have **no file to mention** — they are composed on the spot. Send them
as direct text via `SendMessage` to the implementer that owns the scope (its context is intact, and
this is a short sequential chain over the same scope — exactly where reuse pays), and copy the text
into `orquestration.md`:

```text
The reviewer/tester found the following on YOUR scope. Fix only these, do not refactor beyond them, and do not touch another scope's files:

{findings, one per line, each with file:line}

Preserve the business rules. When you are done: re-run the type-checker once, and return at most 10 lines — files touched, exit code, and one line per finding saying how it was addressed.
```

Use a **fresh** implementer instead (`description: 'impl-{escopo}-{nome_task}-fix{N}'`, reading the
plan notes + its ready prompt from disk) when the owning agent is gone, or when its measured window
is already above ~80k — a fresh Sonnet reading disk is cheaper than a fat context re-read on every
turn.
