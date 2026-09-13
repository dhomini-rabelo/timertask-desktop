## Rules

### When performing any task

- **Check the memory** in [`.claude/memory/`](.claude/memory/README.md) before planning or executing a task. It holds what you cannot deduce from the code: environment requirements, business rules, past decisions and their why, standing rules, user preferences, past failures, and project vocabulary. The root `README.md` indexes the categories and each category indexes its entries. Open only the ones your task touches. To record anything there, use the `save-memory` skill.
- **NO GUESSING — never guess the user's intent, the task, or the answer.** Split every unknown in two. What the codebase can answer — file names, variable names, existing workflows, how something is implemented today — you resolve by searching, never by inventing. What only the user can answer — intent, expected outcome, which of two valid readings is the right one — you resolve by asking. This covers the answer and the solution too: every cause you name and every fix you propose rests on code you read or on output you ran, and when you have no such evidence you say what is missing instead of filling the gap with a plausible story. Before the first edit you must be able to state what changes, where, and what the expected result is; if you catch yourself thinking "probably", "I assume", or "it must be", the gap is still open — close it by searching or by asking, not by starting. A wrong assumption found after the code is written costs far more than one question asked before it.
- **Intent check.** If the user asks for action A but the context or the logic of the code suggests the real goal is B (or A looks counter-intuitive, contradictory, or out of place), do not silently do either one. Use `AskUserQuestion`: "You asked for [A], but that seems unusual in this context. Is your actual goal [B]? Would you prefer I execute [B] instead?"
- **Ask what only the user can answer — decide the rest yourself.** Asking is not free: a question about something a search would have answered, or about a small reversible choice, is pure friction. Decide on your own when the choice is cheap to undo and confined to code the user did not specify (the name of an internal variable, the shape of a private helper), and say what you decided. Ask when the possible readings lead to different work, when the change touches product behavior or visible design, or when being wrong means throwing the work away.
- **Ask before writing code, not after.** Use `AskUserQuestion` before the first edit, and cover everything you need in a single round instead of guessing now and rewriting later. Typical cases:
  - Unclear intent behind the request:
    - User: "Clean up the chat screen."
    - Ask: "Do you mean refactoring the code, removing unused UI, or reducing visual clutter in the layout?"
  - Missing expected outcome details:
    - User: "Implement a new modal to edit the user profiles."
    - Ask: "Where should the modal be triggered from?", "What fields should be included?"
  - Ambiguous scope:
    - User: "Update the button color."
    - Ask: "There are 3 types of buttons (Primary, Secondary, Danger). Which one?"
  - Missing file context:
    - User: "Add validation to the user form."
    - Ask: "I found `LoginForm.tsx` and `RegisterForm.tsx`. Which one are you referring to?"
  - Text formatting:
    - User: "Rename this file to GetUserData.ts."
    - Ask: "The coding convention for file names is kebab-case for this folder. Do you want me to rename it to get-user-data.ts instead?"

### When using skills

- Make sure to read the subfiles referenced in the main SKILLS.md file. They contain important guidance on how to use each skill properly.

#### After finishing a coding task

- Run the linting command in the right project. The lint command is always `npm run lint:fix`.

```bash
cd /path/to/project && npm run lint:fix
```

- Run the typescript compiler in the right project. The command is always `tsc --noEmit`.

```bash
cd /path/to/project && npx tsc --noEmit
```
