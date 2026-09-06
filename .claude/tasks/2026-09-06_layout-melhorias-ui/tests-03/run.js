// Focused QA for tests-03: prove (1) Debug pill compact & neighbor-of-time on same row as
// pencil/Notes/select at desktop widths, no regression at mobile; (2) Notes button icon-only with
// accessible name "Notes" in both list and footer usages. Reuses scenario-building helpers from
// tests-02/run.js (addPlain/addGroupChild/clickPlayIn/clickCheckIn patterns).
const { chromium } = require("/tmp/pw/node_modules/playwright");
const path = require("path");
const fs = require("fs");

const SHOT_DIR = "/tmp/claude-1000/-root-so-repos-timertasks-timertask-desktop-tree-1/598a76e0-5839-4063-8096-6e0528e6ed91/scratchpad/shots-03";
fs.mkdirSync(SHOT_DIR, { recursive: true });
const consoleErrors = [];
const results = { geometry: {}, a11y: {}, overview: {} };

async function addPlain(page, title) {
  const input = page.getByPlaceholder("Add a task... (use > to create a group)");
  await input.fill(title);
  await input.press("Enter");
  await page.waitForTimeout(150);
}
async function addGroupChild(page, groupTitle, childTitle) {
  const groupCard = page.locator(".group", { hasText: groupTitle }).first();
  const childInput = groupCard.getByPlaceholder("Add a task...");
  await childInput.fill(childTitle);
  await childInput.press("Enter");
  await page.waitForTimeout(150);
}
function cardByTitle(page, title) {
  return page.locator(".group", { hasText: title }).first();
}
async function clickPlayIn(card) {
  const btn = card.locator("button").filter({ has: card.page().locator("svg.lucide-play") }).first();
  await btn.click();
}
async function clickCheckIn(card) {
  const btn = card.locator("button").filter({ has: card.page().locator("svg.lucide-check") }).first();
  await btn.click();
}
async function setDark(page, dark) {
  await page.evaluate((d) => document.documentElement.classList.toggle("dark", d), dark);
  await page.waitForTimeout(120);
}

function measureActionRow(subtaskTitle) {
  const span = document.querySelector(`span[title="${subtaskTitle}"]`);
  const card = span ? span.closest(".rounded-xl") : null;
  if (!card) return { found: false };
  const actionRow = card.querySelector('div.flex.flex-wrap.items-center.justify-between.gap-2.px-3.py-2');
  if (!actionRow) return { found: false, cardFound: true };
  const pencilBtn = actionRow.querySelector("svg.lucide-pencil")?.closest("button") || null;
  const notesBtn = [...actionRow.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") || "") === "Notes") || null;
  const selectBox = actionRow.querySelector('[class*="select"], button[role="combobox"], [role="combobox"]') || actionRow.querySelector('div.flex.items-center.gap-1 ~ div button') || null;
  const selectAlt = [...actionRow.querySelectorAll("button, [role=combobox]")].find((b) => (b.textContent || "").includes("min")) || null;
  const debugOuter = actionRow.querySelector(".w-full.sm\\:w-auto.min-w-0");
  const debugBtn = debugOuter ? [...debugOuter.querySelectorAll("button")].find((b) => (b.textContent || "").includes("Debug")) : null;
  const timeSpan = debugOuter ? [...debugOuter.querySelectorAll("span")].find((s) => /^\d{2}:\d{2}/.test((s.textContent || "").trim())) : null;

  const r = (el) => (el ? el.getBoundingClientRect() : null);
  const rowRect = r(actionRow);
  const pencilRect = r(pencilBtn);
  const notesRect = r(notesBtn);
  const selectRect = r(selectAlt || selectBox);
  const debugOuterRect = r(debugOuter);
  const debugBtnRect = r(debugBtn);
  const timeRect = r(timeSpan);

  const elems = [pencilBtn, notesBtn, selectAlt || selectBox, debugOuter].filter(Boolean);
  let overlapPairs = 0;
  for (let i = 0; i < elems.length; i++) {
    for (let j = i + 1; j < elems.length; j++) {
      const a = elems[i].getBoundingClientRect(), b = elems[j].getBoundingClientRect();
      const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      if (ix > 0.5 && iy > 0.5) overlapPairs++;
    }
  }
  const overflowOffenders = [...actionRow.querySelectorAll("*"), actionRow].filter(
    (el) => el.scrollWidth > el.clientWidth + 2,
  ).length;

  const tops = [pencilRect, notesRect, selectRect, debugOuterRect].filter(Boolean).map((x) => x.top);
  const sameRow = tops.length > 0 ? Math.max(...tops) - Math.min(...tops) <= 3 : null;

  return {
    found: true,
    rowRect: rowRect && { top: rowRect.top, left: rowRect.left, width: rowRect.width, height: rowRect.height },
    pencilRect: pencilRect && { top: pencilRect.top, left: pencilRect.left, width: pencilRect.width },
    notesRect: notesRect && { top: notesRect.top, left: notesRect.left, width: notesRect.width },
    selectRect: selectRect && { top: selectRect.top, left: selectRect.left, width: selectRect.width },
    debugOuterRect: debugOuterRect && { top: debugOuterRect.top, left: debugOuterRect.left, width: debugOuterRect.width },
    debugBtnRect: debugBtnRect && { top: debugBtnRect.top, left: debugBtnRect.left, right: debugBtnRect.right, width: debugBtnRect.width },
    timeRect: timeRect && { top: timeRect.top, left: timeRect.left, right: timeRect.right, width: timeRect.width },
    debugToTimeGap: debugBtnRect && timeRect ? timeRect.left - debugBtnRect.right : null,
    debugOuterWidthRatio: debugOuterRect && rowRect ? +(debugOuterRect.width / rowRect.width).toFixed(3) : null,
    sameRow,
    overlapPairs,
    overflowOffenders,
    ownLine: debugOuterRect && pencilRect ? debugOuterRect.top - pencilRect.top > 8 : null,
  };
}

function overflowDiag() {
  return {
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
  };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/opt/ms-playwright/chromium-1243/chrome-linux64/chrome",
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    Object.defineProperty(window.Notification, "permission", { value: "granted" });
  });
  const page = await context.newPage();
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));

  await page.goto("http://localhost:1420/", { waitUntil: "networkidle" });
  await page.getByPlaceholder("Add a task... (use > to create a group)").waitFor({ state: "visible", timeout: 15000 });

  // ---- minimal scenario ----
  await addPlain(page, "R3-Task-Footer");
  await addPlain(page, ">R3-Grupo");
  await addGroupChild(page, "R3-Grupo", "R3-Sub-01");
  await addGroupChild(page, "R3-Grupo", "R3-Sub-02");

  const startBtn = page.getByRole("button", { name: /^Start$/ }).first();
  await startBtn.click();
  await page.waitForTimeout(300);

  const sub01 = cardByTitle(page, "R3-Grupo").locator(".group", { hasText: "R3-Sub-01" }).first();
  await clickPlayIn(sub01);
  await page.waitForTimeout(400);

  let footerTask = cardByTitle(page, "R3-Task-Footer");
  await clickPlayIn(footerTask);
  await page.waitForTimeout(300);
  footerTask = cardByTitle(page, "R3-Task-Footer");
  await clickCheckIn(footerTask);
  await page.waitForTimeout(400);

  const footerToggle = page.locator("div.cursor-pointer", { hasText: /completed/ }).first();
  await footerToggle.click();
  await page.waitForTimeout(300);

  // ---- a11y: Notes button accessible name, both usages ----
  results.a11y.notesButtonCountByRole = await page.getByRole("button", { name: "Notes", exact: true }).count();
  results.a11y.notesButtonsAriaLabels = await page.evaluate(() =>
    [...document.querySelectorAll("button")]
      .filter((b) => b.getAttribute("aria-label") === "Notes" || b.getAttribute("title") === "Notes")
      .map((b) => ({ ariaLabel: b.getAttribute("aria-label"), title: b.getAttribute("title"), textContent: b.textContent.trim() })),
  );

  // ---- geometry at 1280, 1440, 1100 ----
  for (const w of [1280, 1440, 1100]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(150);
    results.geometry[w] = await page.evaluate(`(${measureActionRow})("R3-Sub-01")`);
    results.geometry[w].docOverflow = await page.evaluate(overflowDiag);
    await page.locator(".group", { hasText: "R3-Sub-01" }).first().locator('div.flex.flex-wrap.items-center.justify-between.gap-2.px-3.py-2').first()
      .screenshot({ path: path.join(SHOT_DIR, `action-row-${w}.png`) }).catch(() => {});
  }

  // ---- mobile 390, 320: no-regression check ----
  for (const w of [390, 320]) {
    await page.setViewportSize({ width: w, height: 844 });
    await page.waitForTimeout(150);
    results.geometry[w] = await page.evaluate(`(${measureActionRow})("R3-Sub-01")`);
    results.geometry[w].docOverflow = await page.evaluate(overflowDiag);
    await page.locator(".group", { hasText: "R3-Sub-01" }).first().locator('div.flex.flex-wrap.items-center.justify-between.gap-2.px-3.py-2').first()
      .screenshot({ path: path.join(SHOT_DIR, `action-row-${w}.png`) }).catch(() => {});
  }

  // ---- notes button detail crops (list + footer) ----
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(150);
  await page.locator(".group", { hasText: "R3-Sub-02" }).first().locator('div.flex.items-center.gap-1').first()
    .screenshot({ path: path.join(SHOT_DIR, "notes-btn-list.png") }).catch(() => {});
  const footerCard = page.locator(".rounded-xl", { hasText: "R3-Task-Footer" }).first();
  await footerCard.screenshot({ path: path.join(SHOT_DIR, "notes-btn-footer.png") }).catch(() => {});

  // ---- overview screenshots light/dark 1280 ----
  await page.screenshot({ path: path.join(SHOT_DIR, "overview-1280-light.png"), fullPage: true });
  await setDark(page, true);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(SHOT_DIR, "overview-1280-dark.png"), fullPage: true });
  await setDark(page, false);

  const consoleErrorsFiltered = consoleErrors.filter((e) => !/DevTools|Autofill|source map/i.test(e));
  results.consoleErrors = consoleErrorsFiltered;

  fs.writeFileSync(path.join(SHOT_DIR, "results.json"), JSON.stringify(results, null, 2));
  console.log("QA_DONE " + JSON.stringify(results, null, 2));

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error("QA_SCRIPT_FAILED", err);
  process.exit(1);
});
