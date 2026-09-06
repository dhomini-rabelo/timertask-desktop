// QA script for task layout-task-card, tests-01. Node + Playwright (MCP channel is broken on this host).
const { chromium } = require("/tmp/pw/node_modules/playwright");
const path = require("path");

const SHOT_DIR = "/tmp/qa-layout-shots";
const consoleErrors = [];

function shot(page, name) {
  return page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: true });
}

async function addPlain(page, title) {
  const input = page.getByPlaceholder("Add a task... (use > to create a group)");
  await input.fill(title);
  await input.press("Enter");
}

async function addGroupChild(page, groupTitle, childTitle) {
  // Locate the group card by its title text, then use the child input inside it.
  const groupCard = page.locator(".group", { hasText: groupTitle }).first();
  const childInput = groupCard.getByPlaceholder("Add a task...");
  await childInput.fill(childTitle);
  await childInput.press("Enter");
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/opt/ms-playwright/chromium-1243/chrome-linux64/chrome",
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Shim: Notification.permission must read 'granted' before app boot, or the whole UI stays
  // gated behind the "Allow notifications" screen (headless Chromium never actually grants it).
  await context.addInitScript(() => {
    Object.defineProperty(window.Notification, "permission", { value: "granted" });
  });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));

  await page.goto("http://localhost:1420/", { waitUntil: "networkidle" });
  await page.getByPlaceholder("Add a task... (use > to create a group)").waitFor({ state: "visible", timeout: 15000 });

  // ---- 00: initial full layout, full width, no sidebar ----
  await shot(page, "00-layout-inicial-full-width.png");

  // ---- Create presets ----
  await addPlain(page, "QA-Task-Solta");
  await addPlain(page, ">QA-Grupo-Pendente");
  await addPlain(page, ">QA-Grupo-100");
  await addPlain(page, ">QA-Grupo-Scroll");

  await page.waitForTimeout(300);
  await shot(page, "01-presets-criados.png");

  // Add 2 subtasks to QA-Grupo-100
  await addGroupChild(page, "QA-Grupo-100", "QA-Sub100-A");
  await addGroupChild(page, "QA-Grupo-100", "QA-Sub100-B");

  // Add 8 subtasks to QA-Grupo-Scroll (proves internal scroll)
  for (let i = 1; i <= 8; i++) {
    await addGroupChild(page, "QA-Grupo-Scroll", `QA-Sub-${i}`);
  }
  await page.waitForTimeout(300);
  await shot(page, "02-subtasks-adicionadas.png");

  // ---- Validation: empty submit is a no-op, no crash, no error overlay ----
  const addInput = page.getByPlaceholder("Add a task... (use > to create a group)");
  await addInput.fill("   ");
  await addInput.press("Enter");
  await page.waitForTimeout(200);
  const hasOverlay = await page.locator("vite-error-overlay").count();
  await shot(page, "03-validacao-submit-vazio-sem-crash.png");

  // ---- Start global countdown timer (required for any per-task Play to work) ----
  const startBtn = page.getByRole("button", { name: /^Start$/ }).first();
  await startBtn.click();
  await page.waitForTimeout(300);
  await shot(page, "04-timer-global-iniciado.png");

  // ---- Start QA-Task-Solta timer (standalone) ----
  async function taskCard(title) {
    return page.locator(".group", { hasText: title }).first();
  }

  let soltaCard = await taskCard("QA-Task-Solta");
  await soltaCard.locator("button").first().click().catch(() => {});
  // The first button in the header row is drag handle (div) not button; find Play icon button precisely.
  // Use a more robust approach: click the button whose svg has class matching Play (lucide "play").
  async function clickPlayIn(card) {
    const btn = card.locator("button").filter({ has: page.locator("svg.lucide-play") }).first();
    await btn.click();
  }
  async function clickStopIn(card) {
    const btn = card.locator("button").filter({ has: page.locator("svg.lucide-square") }).first();
    await btn.click();
  }

  soltaCard = await taskCard("QA-Task-Solta");
  await clickPlayIn(soltaCard);
  await page.waitForTimeout(1500);
  await shot(page, "05-standalone-timer-rodando-sem-badge-paused.png");

  // Pause it (this is the path that BEFORE showed a "Paused" badge)
  soltaCard = await taskCard("QA-Task-Solta");
  await clickStopIn(soltaCard);
  await page.waitForTimeout(300);
  await shot(page, "06-standalone-pausado-sem-badge-paused.png");

  // Resume
  soltaCard = await taskCard("QA-Task-Solta");
  await clickPlayIn(soltaCard);
  await page.waitForTimeout(1200);
  await shot(page, "07-standalone-retomado.png");
  // Stop again, leave it paused as requested by the preset spec
  soltaCard = await taskCard("QA-Task-Solta");
  await clickStopIn(soltaCard);
  await page.waitForTimeout(300);
  await shot(page, "08-standalone-deixado-pausado.png");

  // ---- Start a subtask inside QA-Grupo-Scroll to move the group into Active, proving inner + outer scroll ----
  const scrollGroupCard = page.locator(".group", { hasText: "QA-Grupo-Scroll" }).first();
  const sub1Card = scrollGroupCard.locator(".group", { hasText: "QA-Sub-1" }).first();
  await clickPlayIn(sub1Card);
  await page.waitForTimeout(1000);
  await shot(page, "09-grupo-scroll-ativo-com-1-rodando.png");

  // Prove scroll: outer Active region and inner group subtasks region should have scrollHeight > clientHeight
  const scrollInfo = await page.evaluate(() => {
    const regions = Array.from(document.querySelectorAll('[role="region"]'));
    return regions.map((el) => ({
      label: el.getAttribute("aria-label"),
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowing: el.scrollHeight > el.clientHeight,
    }));
  });

  // Keyboard focus check: Tab should be able to reach a scrollable region (tabIndex=0)
  await page.keyboard.press("Tab");
  const activeElAfterFirstTab = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    role: document.activeElement?.getAttribute("role"),
    aria: document.activeElement?.getAttribute("aria-label"),
  }));

  // Direct focusability proof (not order-dependent): the Active region has tabIndex=0, so it
  // must be able to receive focus programmatically and register as document.activeElement, and
  // its scroll-label sibling must NOT move (only the inner region scrolls).
  const activeRegionFocusProof = await page.evaluate(() => {
    const region = document.querySelector('[role="region"][aria-label="Active tasks"]');
    if (!region) return { found: false };
    const label = Array.from(document.querySelectorAll("span")).find(
      (s) => s.textContent.trim() === "Active",
    );
    const labelTopBefore = label ? label.getBoundingClientRect().top : null;
    region.scrollTop = 50;
    const labelTopAfter = label ? label.getBoundingClientRect().top : null;
    region.focus();
    return {
      found: true,
      tabIndex: region.tabIndex,
      isActiveElement: document.activeElement === region,
      labelStaysPutWhileRegionScrolls: labelTopBefore === labelTopAfter,
      regionScrollTopApplied: region.scrollTop,
    };
  });
  await shot(page, "09b-active-region-scrollada-label-fixo.png");

  // ---- Complete the two subtasks of QA-Grupo-100, then complete the group (100% state) ----
  const grupo100Card = page.locator(".group", { hasText: "QA-Grupo-100" }).first();
  await shot(page, "10-grupo-100-antes.png");

  async function completeSubtaskInGroup(groupLocator, subTitle) {
    const subCard = groupLocator.locator(".group", { hasText: subTitle }).first();
    await clickPlayIn(subCard);
    await page.waitForTimeout(400);
    const checkBtn = subCard.locator("button").filter({ has: page.locator("svg.lucide-check") }).first();
    await checkBtn.click();
    await page.waitForTimeout(300);
  }

  await completeSubtaskInGroup(grupo100Card, "QA-Sub100-A");
  await completeSubtaskInGroup(page.locator(".group", { hasText: "QA-Grupo-100" }).first(), "QA-Sub100-B");
  await page.waitForTimeout(300);
  await shot(page, "11-grupo-100-parcial-para-completo-habilitado.png");

  // Click the group-level Check to mark the whole group complete
  const grupo100CardAfter = page.locator(".group", { hasText: "QA-Grupo-100" }).first();
  const groupCheckBtn = grupo100CardAfter
    .locator("button")
    .filter({ has: page.locator("svg.lucide-check") })
    .first();
  await groupCheckBtn.click();
  await page.waitForTimeout(400);
  await shot(page, "12-grupo-100-completo-no-footer.png");

  // Expand the footer "completed" section to see start/end/duration + group badge for the completed group's children
  const footerToggle = page.getByText(/completed$/).last();
  await footerToggle.click().catch(() => {});
  await page.waitForTimeout(300);
  await shot(page, "13-footer-completo-expandido.png");

  // ---- Edit and delete flows ----
  // Edit QA-Grupo-Pendente title
  const pendCard = page.locator(".group", { hasText: "QA-Grupo-Pendente" }).first();
  const editBtn = pendCard.locator("button").filter({ has: page.locator("svg.lucide-pencil") }).first();
  await editBtn.click();
  await page.waitForTimeout(200);
  // IndexEditInput is a controlled React input (autoFocus) — target it via focus, not the
  // `value` attribute (React sets that as a DOM property, not a reflected HTML attribute).
  const activeEditInput = page.locator("input:focus");
  await activeEditInput.fill("QA-Grupo-Pendente-Editado");
  await activeEditInput.press("Enter");
  await page.waitForTimeout(300);
  await shot(page, "14-grupo-pendente-editado.png");

  // Delete the edited (now empty) group
  const editedCard = page.locator(".group", { hasText: "QA-Grupo-Pendente-Editado" }).first();
  const delBtn = editedCard.locator("button").filter({ has: page.locator("svg.lucide-trash-2") }).first();
  await delBtn.click();
  await page.waitForTimeout(300);
  await shot(page, "15-grupo-pendente-deletado.png");

  // Create + edit + delete a throwaway standalone task to prove task-level CRUD (not just group CRUD)
  await addPlain(page, "QA-Task-CRUD");
  await page.waitForTimeout(200);
  const crudCard = page.locator(".group", { hasText: "QA-Task-CRUD" }).first();
  const crudEditBtn = crudCard.locator("button").filter({ has: page.locator("svg.lucide-pencil") }).first();
  await crudEditBtn.click();
  await page.waitForTimeout(200);
  const crudEditInput = page.locator("input:focus");
  await crudEditInput.fill("QA-Task-CRUD-Editada");
  await crudEditInput.press("Enter");
  await page.waitForTimeout(300);
  await shot(page, "16-task-solta-crud-editada.png");
  const crudCardAfter = page.locator(".group", { hasText: "QA-Task-CRUD-Editada" }).first();
  const crudDelBtn = crudCardAfter.locator("button").filter({ has: page.locator("svg.lucide-trash-2") }).first();
  await crudDelBtn.click();
  await page.waitForTimeout(300);
  await shot(page, "17-task-solta-crud-deletada.png");

  // ---- Full layout screenshot with everything populated (Active/Paused/Pending all visible) ----
  await shot(page, "18-layout-completo-active-paused-pending.png");

  // Zoom on the top card (header/timer/stats) — take a viewport screenshot scrolled to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(SHOT_DIR, "19-card-topo-header-timer-stats.png") });

  // ---- Stats sanity: read the 4 named metrics ----
  const statsText = await page.evaluate(() => {
    const labels = ["Today's Focus", "Tasks Started", "Avg / task", "In Progress"];
    const spans = Array.from(document.querySelectorAll("span"));
    const result = {};
    for (const label of labels) {
      const labelSpan = spans.find((s) => s.textContent.trim() === label);
      if (labelSpan) {
        const tile = labelSpan.closest(".flex.flex-col.gap-2");
        const valueSpan = tile ? tile.querySelector(".text-xl") : null;
        result[label] = valueSpan ? valueSpan.textContent.trim() : null;
      } else {
        result[label] = "LABEL_NOT_FOUND";
      }
    }
    return result;
  });

  // ---- Responsive: narrow viewport ----
  await page.setViewportSize({ width: 420, height: 900 });
  await page.waitForTimeout(300);
  await shot(page, "20-responsivo-estreito.png");
  await page.setViewportSize({ width: 1280, height: 900 });

  // ---- Reload persistence + global timer must be re-started after reload ----
  await page.reload({ waitUntil: "networkidle" });
  await page.getByPlaceholder("Add a task... (use > to create a group)").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(300);
  await shot(page, "21-pos-reload-persistencia.png");

  const results = {
    consoleErrors,
    hasOverlayOnEmptySubmit: !!hasOverlay,
    scrollInfo,
    activeElAfterFirstTab,
    activeRegionFocusProof,
    statsText,
  };
  console.log("QA_RESULTS_JSON_START");
  console.log(JSON.stringify(results, null, 2));
  console.log("QA_RESULTS_JSON_END");

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error("QA_SCRIPT_FAILED", err);
  process.exit(1);
});
