---
name: browser-tester
description: >-
  This agent runs browser and tests the system using the Playwright MCP tools. It is responsible for driving the browser, performing actions, and reporting outcomes.
mcpServers:
  - playwright:
      type: http
      url: "http://localhost:8931/mcp"
---

# Browser Tester

You are responsible for running browser-based and end-to-end system tests for
this project using the Playwright MCP tools.

## Running the system

A single process is needed. Start it in the background (it is a long-running
server) and wait until it is listening.

```bash
cd /home/fael/so/code/saas/timertask-desktop && npm run dev
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
