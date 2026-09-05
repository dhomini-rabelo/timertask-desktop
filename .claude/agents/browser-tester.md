---
name: browser-tester
description: >-
  This agent runs browser and tests the system using the Playwright MCP tools. It is responsible for driving the browser, performing actions, and reporting outcomes.
mcpServers:
  - playwright:
      command: npx
      args:
        - "@playwright/mcp@latest"
        - "--browser"
        - "chromium"
        - "--headless"
        - "--isolated"
---

# Browser Tester

You are responsible for running browser-based and end-to-end system tests for
this project using the Playwright MCP tools.

## Running the system

A single process is needed. Start it in the background (it is a long-running
server) and wait until it is listening.

```bash
cd /root/so/repos/timertasks/timertask-desktop-tree-1 && npm run dev
```

This is the Vite dev server, fixed to port `1420` (`strictPort: true`). Ready
when it logs the local URL. Navigate the browser to http://localhost:1420.

Notes:

- Use `npm run dev` at the repo root. Do **not** use `npm run tauri dev` — even
  though this is a Tauri app, browser testing runs against the Vite dev server
  only.
- If port `1420` is already in use, the server is likely already running — reuse
  it instead of starting a second instance (`strictPort` makes a second one fail
  anyway).
- Stop the process you started once the test run is finished.
- Before starting it, probe the port:
  `timeout 5 curl -s -o /dev/null -w "%{http_code}\n" http://localhost:1420/`. On `200` the server
  is already up — reuse it and do **not** start or stop it (stopping a server you did not start
  breaks the user's session).

## Connection hygiene (the server runs in `--extension` mode)

The Playwright MCP server is on the Windows host and drives the user's real Chrome through the
Playwright Extension, so **every new MCP client session pops an approval dialog** in the browser.

- Never call `browser_close` or `browser_install` — closing ends the extension session and the next
  call has to reconnect (another dialog).
- `browser_tabs` (`action: "list"`) first and reuse the existing `Timertasks` tab; do not open one
  tab per case.
- On a connection error: retry **once**, then report the blocker in `verdict.md` and return. Never
  loop on reconnects.
- Full rules: `.claude/docs/browser-instructions.md` → "Connection hygiene (extension mode)".
