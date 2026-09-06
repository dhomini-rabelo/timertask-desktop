// QA script for task layout-melhorias-ui, tests-02. Node + Playwright standalone.
// Reuses tests-01/run.js scenario+audit logic; fixes: (1) screenshot honesty (element/clip crops
// instead of repeated identical fullPage), (2) item3b interactive-control exclusion, (3) debug
// own-line criterion rewritten, (4) explicit 320px completed-item overlap/overflow check.
const { chromium } = require("/tmp/pw/node_modules/playwright");
const path = require("path");
const fs = require("fs");

const SHOT_DIR = "/tmp/qa-layout-shots-r2";
fs.mkdirSync(SHOT_DIR, { recursive: true });
const consoleErrors = [];
const results = { contrastRuns: [], meiaColuna: {}, items: {}, borderCheck: {}, sceneAssert: {} };

async function shot(page, name) {
  await page.mouse.move(0, 0); // neutralize any residual :hover from a previous click before capture
  return page.screenshot({ path: path.join(SHOT_DIR, name + ".png"), fullPage: true });
}

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
async function clickStopIn(card) {
  const btn = card.locator("button").filter({ has: card.page().locator("svg.lucide-square") }).first();
  await btn.click();
}
async function clickCheckIn(card) {
  const btn = card.locator("button").filter({ has: card.page().locator("svg.lucide-check") }).first();
  await btn.click();
}

async function setDark(page, dark) {
  await page.evaluate((d) => {
    document.documentElement.classList.toggle("dark", d);
  }, dark);
  await page.waitForTimeout(120);
}

async function ensureGroupCollapsed(page, groupTitle, collapsed) {
  const card = cardByTitle(page, groupTitle);
  const isExpandedNow = (await card.getByPlaceholder("Add a task...").count()) > 0;
  const currentlyCollapsed = !isExpandedNow;
  if (currentlyCollapsed !== collapsed) {
    const chevronBtn = card
      .locator("button")
      .filter({ has: page.locator("svg.lucide-chevron-down, svg.lucide-chevron-up") })
      .first();
    await chevronBtn.click();
    await page.waitForTimeout(150);
  }
}

// ---- element-crop screenshot honesty fix: mark stable DOM anchors ONCE with data-qa-shot, then
// take Locator.screenshot() (auto scrolls+crops to exact element) for every named capture. Each
// named file is therefore a REAL crop of a distinct DOM region -- never a renamed duplicate of the
// same fullPage capture (tests-01's flagged defect).
async function markStableElements(page) {
  await page.evaluate(() => {
    const headerWrap = [...document.querySelectorAll("div")].find((d) => {
      const cl = d.className || "";
      return typeof cl === "string" && cl.includes("lg:flex-row") && cl.includes("items-stretch") && cl.includes("gap-6");
    });
    if (headerWrap) headerWrap.setAttribute("data-qa-shot", "header");

    const tasksListWrap = [...document.querySelectorAll("div")].find((d) => (d.className || "").includes("min-h-[250px]"));
    if (tasksListWrap) tasksListWrap.setAttribute("data-qa-shot", "taskslist");

    const span = [...document.querySelectorAll("span")].find((s) => /^\d+ of \d+ completed$/.test((s.textContent || "").trim()));
    if (span) {
      const root = span.parentElement && span.parentElement.parentElement && span.parentElement.parentElement.parentElement;
      if (root) root.setAttribute("data-qa-shot", "footer");
    }
  });
}

async function elShot(page, selector, name) {
  await page.mouse.move(0, 0); // neutralize any residual :hover from a previous click before capture
  const loc = page.locator(selector).first();
  const count = await loc.count();
  if (count === 0) {
    console.log("WARN missing element for", name, selector);
    return;
  }
  await loc.screenshot({ path: path.join(SHOT_DIR, name + ".png") });
}

// ---- auditContrast, embedded verbatim from plan.md (unchanged this round) ----
const AUDIT_CONTRAST_FN = String(function auditContrast() {
  const _cv = document.createElement("canvas");
  _cv.width = _cv.height = 1;
  const _cx = _cv.getContext("2d", { willReadFrequently: true });
  const parse = (s) => {
    if (!s) return [0, 0, 0, 0];
    _cx.clearRect(0, 0, 1, 1);
    _cx.fillStyle = "rgba(0, 0, 0, 0)";
    _cx.fillStyle = s;
    _cx.fillRect(0, 0, 1, 1);
    const d = _cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const _near = (a, b, tol) => [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= tol);
  const _t1 = parse("rgb(31, 41, 55)");
  const _t2 = parse("rgba(0, 128, 255, 0.4)");
  const _t3 = parse("color-mix(in oklab, rgb(190, 197, 209) 40%, transparent)");
  const _t4 = parse("oklab(0.5 0.1 -0.1)");
  const _t5 = parse("transparent");
  if (!_near(_t1, [31, 41, 55], 0) || Math.abs(_t1[3] - 1) > 0.01 ||
      !_near(_t2, [0, 128, 255], 1) || Math.abs(_t2[3] - 0.4) > 0.01 ||
      !_near(_t3, [190, 197, 209], 2) || Math.abs(_t3[3] - 0.4) > 0.02 ||
      !_near(_t4, [129, 69, 154], 3) || _t5[3] !== 0) {
    throw new Error("auditContrast: normalizador de cor reprovou o auto-teste " +
                    JSON.stringify([_t1, _t2, _t3, _t4, _t5]));
  }
  const ACCENT = [
    [209, 250, 229], [50, 183, 104], [16, 185, 129], [5, 150, 105],
    [254, 226, 226], [242, 79, 79], [235, 70, 70],
    [224, 242, 254], [86, 162, 255], [44, 141, 255], [26, 117, 224], [21, 101, 192],
    [254, 243, 199], [251, 191, 36], [245, 158, 11],
  ];
  const isAccent = (c) => ACCENT.some((t) => _near(c.map(Math.round), t, 2));
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
  const over = (fg, bg) => {
    const a = fg.length > 3 ? fg[3] : 1;
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };
  const ratioOf = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  function effBg(el) {
    const layers = [];
    let opaqueFound = false;
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.length < 3) continue;
      const a = c.length > 3 ? c[3] : 1;
      if (a === 0) continue;
      layers.push([c[0], c[1], c[2], a]);
      if (a === 1) { opaqueFound = true; break; }
    }
    let acc = opaqueFound
      ? [0, 0, 0]
      : document.documentElement.classList.contains("dark") ? [17, 24, 39] : [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  }
  const out = [];
  const push = (el, fgRaw, bg, fontPx, bold, isIcon, rule, textHint) => {
    const fg = over(fgRaw, bg);
    const ratio = ratioOf(fg, bg);
    const accent = isAccent(fgRaw);
    if (isIcon && accent) return;
    const large = isIcon || fontPx >= 18 || (fontPx >= 14 && bold);
    const min = accent ? 4.5 : large ? 3 : 4.5;
    if (ratio + 0.005 < min) {
      out.push({ rule: accent ? "R5" : rule, sel: sel(el), text: textHint, ratio: +ratio.toFixed(2), min,
                 color: `rgb(${fg.map(Math.round)})`, bg: `rgb(${bg.map(Math.round)})`, fontPx, bold });
    }
  };
  const sel = (el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ").slice(0, 3).join(".")}`;
  const root = document.getElementById("root") || document.body;
  root.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return;
    const st = getComputedStyle(el);
    const bg = effBg(el);
    const fontPx = parseFloat(st.fontSize);
    const bold = parseInt(st.fontWeight, 10) >= 700;
    const isIcon = el.tagName.toLowerCase() === "svg";
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText || isIcon) {
      push(el, parse(st.color), bg, fontPx, bold, isIcon,
           isIcon ? "R2" : (fontPx >= 18 || (fontPx >= 14 && bold)) ? "R2" : "R1",
           (el.textContent || "").trim().slice(0, 40) || (isIcon ? "<svg>" : ""));
    }
    if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.placeholder) {
      const ph = getComputedStyle(el, "::placeholder");
      push(el, parse(ph.color), bg, parseFloat(ph.fontSize) || fontPx, false, false, "R3", `::placeholder "${el.placeholder}"`);
    }
    if (!document.documentElement.classList.contains("dark") && (hasText || isIcon)) {
      const c = parse(st.color).slice(0, 3).map(Math.round);
      const BANNED = [[156, 163, 175], [190, 197, 209], [137, 144, 158]];
      if (BANNED.some((t) => _near(c, t, 1))) {
        out.push({ rule: "R4", sel: sel(el), text: (el.textContent || "").trim().slice(0, 40),
                   ratio: null, min: null, color: `rgb(${c})`, bg: `rgb(${bg.map(Math.round)})`, fontPx, bold });
      }
    }
  });
  return out;
});

function overflowDiag() {
  const offenders = [...document.querySelectorAll("*")].filter((el) => {
    if (el.scrollWidth <= el.clientWidth + 2) return false;
    return getComputedStyle(el).textOverflow !== "ellipsis";
  });
  const sel = (el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ").slice(0, 3).join(".")}`;
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflowElsCount: offenders.length,
    overflowElsSample: offenders.slice(0, 6).map((el) => ({ sel: sel(el), sw: el.scrollWidth, cw: el.clientWidth, text: (el.textContent || "").slice(0, 30) })),
  };
}

// NEW this round: measure the exact bug the reviewer found (text under the note button at 320px)
// on a specific completed item, using the FIXED IndexCompletedTaskItem.tsx structure.
function completedItemCheck(title) {
  const span = document.querySelector(`span[title="${title}"]`);
  const card = span ? span.closest(".rounded-xl") : null;
  if (!card) return { found: false };
  const titleRow = card.querySelector("div.flex.items-center.gap-2.min-w-0");
  const timesRow = card.querySelector("div.flex.flex-wrap.items-center.gap-x-3.gap-y-1");
  const actionsBlock = card.querySelector("div.flex.items-center.gap-2.shrink-0");
  const m = (el) => el ? { sw: el.scrollWidth, cw: el.clientWidth, overflowNoEllipsis: el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).textOverflow !== "ellipsis" } : null;
  let overlapsActions = null;
  if (titleRow && actionsBlock) {
    const a = titleRow.getBoundingClientRect(), b = actionsBlock.getBoundingClientRect();
    const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    overlapsActions = ix > 0 && iy > 0;
  }
  let timesOverlapsActions = null;
  if (timesRow && actionsBlock) {
    const a = timesRow.getBoundingClientRect(), b = actionsBlock.getBoundingClientRect();
    const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    timesOverlapsActions = ix > 0 && iy > 0;
  }
  const titleSpan = span ? { text: span.textContent, sw: span.scrollWidth, cw: span.clientWidth, ellipsisApplied: span.scrollWidth > span.clientWidth && getComputedStyle(span).textOverflow === "ellipsis" } : null;
  return {
    found: true,
    titleRow: m(titleRow), timesRow: m(timesRow), actionsBlock: m(actionsBlock),
    overlapsActions, timesOverlapsActions, titleSpan,
  };
}

// Emended criterion (item 3, 3o critério): exclude interactive controls (Select/Button affordance
// borders) from the card-dentro-de-card scan.
function item3bScan() {
  const _cv = document.createElement("canvas"); _cv.width = _cv.height = 1;
  const _cx = _cv.getContext("2d", { willReadFrequently: true });
  const parse = (s) => {
    if (!s) return [0, 0, 0, 0];
    _cx.clearRect(0, 0, 1, 1);
    _cx.fillStyle = "rgba(0, 0, 0, 0)";
    _cx.fillStyle = s;
    _cx.fillRect(0, 0, 1, 1);
    const d = _cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (fg, bg) => {
    const a = fg.length > 3 ? fg[3] : 1;
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };
  function effBg(el) {
    const layers = [];
    let opaqueFound = false;
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.length < 3) continue;
      const a = c.length > 3 ? c[3] : 1;
      if (a === 0) continue;
      layers.push([c[0], c[1], c[2], a]);
      if (a === 1) { opaqueFound = true; break; }
    }
    let acc = opaqueFound ? [0, 0, 0] :
      document.documentElement.classList.contains("dark") ? [17, 24, 39] : [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  }
  const near = (a, b, tol) => [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= tol);
  const groupCard = [...document.querySelectorAll(".group.rounded-xl")].find((el) => el.textContent.includes("QA-Grupo-Par"));
  const taskSpan = document.querySelector('span[title="QA-Sub-01"]');
  const taskCard = taskSpan ? taskSpan.closest(".rounded-xl") : null;
  const INTERACTIVE_SEL = 'button, input, select, textarea, [role="combobox"]';
  function scanEl(root) {
    if (!root) return { found: false };
    const bad = [];
    root.querySelectorAll("*").forEach((el) => {
      if (el === root || !el.parentElement) return;
      if (el.matches(INTERACTIVE_SEL)) return; // emended: affordance border on a form control is not card-dentro-de-card
      const cs = getComputedStyle(el);
      const sides = ["Top", "Right", "Bottom", "Left"];
      const widths = sides.map((s) => parseFloat(cs[`border${s}Width`]));
      const styles = sides.map((s) => cs[`border${s}Style`]);
      const colors = sides.map((s) => parse(cs[`border${s}Color`]));
      const has4 = widths.every((w) => w > 0) && styles.every((s) => s !== "none") && colors.every((c) => c[3] > 0);
      if (!has4) return;
      const selfBg = effBg(el);
      const parentBg = effBg(el.parentElement);
      if (near(selfBg, parentBg, 1)) {
        bad.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 60) });
      }
    });
    return { found: true, badCount: bad.length, badSample: bad.slice(0, 5) };
  }
  return { groupCard: scanEl(groupCard), taskCard: scanEl(taskCard) };
}

// Meia coluna geometry, with the emended debug-own-line criterion (left-align OR zero intersection
// with the Notes button, instead of the falsified debug.top >= notesButton.bottom).
function measureGeometry(vpLabel) {
  function rect(el) { return el ? el.getBoundingClientRect() : null; }
  const activeSection = document.querySelector('[data-tasks-section="active"]');
  const groupCards = activeSection
    ? [...activeSection.children].filter((c) => c.textContent.includes("QA-Grupo-Scroll") || c.textContent.includes("QA-Grupo-Par"))
    : [];
  const rects = groupCards.map((c) => ({
    title: c.textContent.includes("QA-Grupo-Scroll") ? "Scroll" : "Par",
    rect: rect(c),
  }));
  const overflowEls = [...document.querySelectorAll("*")].filter(
    (el) => el.scrollWidth > el.clientWidth + 2,
  );
  const overflowElsWithoutEllipsis = overflowEls.filter((el) => getComputedStyle(el).textOverflow !== "ellipsis");
  const sub01 = [...document.querySelectorAll(".group")].find((el) => el.textContent.includes("QA-Sub-01"));
  let overlapPairs = 0, debugLeftEqualsRowLeft = null, debugIntersectsNotes = null;
  if (sub01) {
    const actionRow = sub01.querySelector('[class*="border-t"]');
    const buttons = actionRow ? [...actionRow.querySelectorAll("button, [class*=select]")] : [];
    for (let i = 0; i < buttons.length; i++) {
      for (let j = i + 1; j < buttons.length; j++) {
        const a = buttons[i].getBoundingClientRect();
        const b = buttons[j].getBoundingClientRect();
        const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (ix > 0 && iy > 0) overlapPairs++;
      }
    }
    if (actionRow) {
      const notesBtn = [...actionRow.querySelectorAll("button")].find((b) => b.textContent.trim() === "Notes");
      const debugWrap = actionRow.querySelector(".w-full.min-w-0");
      const arRect = actionRow.getBoundingClientRect();
      if (debugWrap) {
        const dRect = debugWrap.getBoundingClientRect();
        debugLeftEqualsRowLeft = Math.abs(dRect.left - arRect.left) <= 2;
        if (notesBtn) {
          const nRect = notesBtn.getBoundingClientRect();
          const ix = Math.max(0, Math.min(dRect.right, nRect.right) - Math.max(dRect.left, nRect.left));
          const iy = Math.max(0, Math.min(dRect.bottom, nRect.bottom) - Math.max(dRect.top, nRect.top));
          debugIntersectsNotes = ix > 0 && iy > 0;
        }
      }
    }
  }
  return {
    vp: vpLabel,
    groupRects: rects,
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    overflowElsCount: overflowEls.length,
    overflowElsWithoutEllipsisCount: overflowElsWithoutEllipsis.length,
    overlapPairsInActionRow: overlapPairs,
    debugLeftEqualsRowLeft,
    debugIntersectsNotes,
  };
}

async function runAudit(page, label) {
  await page.mouse.move(0, 0); // neutralize any residual :hover before measuring resting-state contrast
  await page.waitForTimeout(30);
  let entry;
  try {
    const fnBody = `(${AUDIT_CONTRAST_FN})()`;
    const violations = await page.evaluate(fnBody);
    entry = { label, threw: false, violations };
  } catch (err) {
    entry = { label, threw: true, error: String(err && err.message) };
  }
  results.contrastRuns.push(entry);
  return entry;
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
  await markStableElements(page);

  // ============ 00: empty state, all 4 theme/viewport combos, BEFORE any data ============
  await shot(page, "00-estado-vazio");
  await runAudit(page, "00-estado-vazio light 1280");
  await setDark(page, true);
  await shot(page, "07-dark-00");
  await runAudit(page, "00-estado-vazio dark 1280");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await shot(page, "09-mobile-390-dark-00");
  await runAudit(page, "00-estado-vazio dark 390");
  await setDark(page, false);
  await shot(page, "08-mobile-390-00");
  await runAudit(page, "00-estado-vazio light 390");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(150);

  // ============ Build scenario data (steps 2-16) ============
  await addPlain(page, "QA-Task-Solta-A");
  await addPlain(page, "QA-Task-Solta-B");
  await addPlain(page, "QA-Task-Solta-C");
  await addPlain(page, "QA-Task-Titulo-Muito-Comprido-Para-Provar-Truncate-Com-Ellipsis-No-Card");
  await addPlain(page, ">QA-Grupo-Scroll");
  for (let i = 1; i <= 10; i++) {
    await addGroupChild(page, "QA-Grupo-Scroll", `QA-Sub-${String(i).padStart(2, "0")}`);
  }
  let scrollN = 10;
  while (scrollN < 16) {
    const overflowing = await page.evaluate((title) => {
      const card = [...document.querySelectorAll(".group")].find((el) => el.textContent.includes(title));
      if (!card) return false;
      const scrollables = [...card.querySelectorAll("*")].filter(
        (el) => el.scrollHeight > el.clientHeight + 2,
      );
      return scrollables.length > 0;
    }, "QA-Grupo-Scroll");
    if (overflowing) break;
    scrollN += 1;
    await addGroupChild(page, "QA-Grupo-Scroll", `QA-Sub-${String(scrollN).padStart(2, "0")}`);
  }
  results.sceneAssert.scrollSubtaskCount = scrollN;

  await addPlain(page, ">QA-Grupo-Par");
  await addGroupChild(page, "QA-Grupo-Par", "QA-Par-1");
  await addGroupChild(page, "QA-Grupo-Par", "QA-Par-2");

  await addPlain(page, ">QA-Grupo-Pausado");
  await addGroupChild(page, "QA-Grupo-Pausado", "QA-Pau-1");
  await addGroupChild(page, "QA-Grupo-Pausado", "QA-Pau-2");

  await addPlain(page, ">QA-Grupo-100");
  await addGroupChild(page, "QA-Grupo-100", "QA-100-A");
  await addGroupChild(page, "QA-Grupo-100", "QA-100-B");

  const startBtn = page.getByRole("button", { name: /^Start$/ }).first();
  await startBtn.click();
  await page.waitForTimeout(300);

  async function completeSubtaskInGroup(groupTitle, subTitle) {
    const groupCard = cardByTitle(page, groupTitle);
    const subCard = groupCard.locator(".group", { hasText: subTitle }).first();
    await clickPlayIn(subCard);
    await page.waitForTimeout(300);
    const subCard2 = cardByTitle(page, groupTitle).locator(".group", { hasText: subTitle }).first();
    await clickCheckIn(subCard2);
    await page.waitForTimeout(300);
  }
  await completeSubtaskInGroup("QA-Grupo-100", "QA-100-A");
  await completeSubtaskInGroup("QA-Grupo-100", "QA-100-B");
  const grupo100 = cardByTitle(page, "QA-Grupo-100");
  await grupo100.hover();
  await page.waitForTimeout(150);
  const groupCheckBtn = cardByTitle(page, "QA-Grupo-100")
    .locator("button").filter({ has: page.locator("svg.lucide-check") }).first();
  await groupCheckBtn.click();
  await page.waitForTimeout(400);

  let soltaB = cardByTitle(page, "QA-Task-Solta-B");
  await clickPlayIn(soltaB);
  await page.waitForTimeout(300);
  soltaB = cardByTitle(page, "QA-Task-Solta-B");
  await clickCheckIn(soltaB);
  await page.waitForTimeout(400);

  const pauCard = cardByTitle(page, "QA-Grupo-Pausado").locator(".group", { hasText: "QA-Pau-1" }).first();
  await clickPlayIn(pauCard);
  await page.waitForTimeout(300);
  const pauCard2 = cardByTitle(page, "QA-Grupo-Pausado").locator(".group", { hasText: "QA-Pau-1" }).first();
  await clickStopIn(pauCard2);
  await page.waitForTimeout(300);

  let soltaA = cardByTitle(page, "QA-Task-Solta-A");
  await clickPlayIn(soltaA);
  await page.waitForTimeout(300);
  soltaA = cardByTitle(page, "QA-Task-Solta-A");
  await clickStopIn(soltaA);
  await page.waitForTimeout(300);

  const sub01 = cardByTitle(page, "QA-Grupo-Scroll").locator(".group", { hasText: "QA-Sub-01" }).first();
  await clickPlayIn(sub01);
  await page.waitForTimeout(300);
  const par1 = cardByTitle(page, "QA-Grupo-Par").locator(".group", { hasText: "QA-Par-1" }).first();
  await clickPlayIn(par1);
  await page.waitForTimeout(500);

  const sceneState = await page.evaluate(() => {
    function titlesIn(sectionName) {
      const el = document.querySelector(`[data-tasks-section="${sectionName}"]`);
      if (!el) return null;
      return [...el.children].map((c) => (c.textContent || "").trim().slice(0, 60));
    }
    return {
      active: titlesIn("active"),
      paused: titlesIn("paused"),
      pending: titlesIn("pending"),
    };
  });
  results.sceneAssert.sections = sceneState;

  const footerToggle = page.locator("div.cursor-pointer", { hasText: /completed/ }).first();
  await footerToggle.click();
  await page.waitForTimeout(300);

  const footerHasCards = await page.evaluate(() => {
    const body = document.body.textContent || "";
    return { hasGrupo100: body.includes("QA-Grupo-100"), hasSoltaB: body.includes("QA-Task-Solta-B") };
  });
  results.sceneAssert.footer = footerHasCards;

  // ============ Item 2 DOM assertion ============
  results.items.item2 = await page.evaluate(() => {
    const sections = [...document.querySelectorAll("[data-tasks-section]")];
    let badStartEndDur = [];
    sections.forEach((sec) => {
      [...sec.querySelectorAll("*")].forEach((el) => {
        const t = (el.textContent || "").trim();
        if (/^Start \d/.test(t) || /^End \d/.test(t) || /^Duration \d/.test(t)) {
          badStartEndDur.push(t.slice(0, 40));
        }
      });
    });
    return {
      sectionsCount: sections.length,
      badStartEndDurCount: badStartEndDur.length,
      badStartEndDurSample: badStartEndDur.slice(0, 5),
    };
  });

  // ============ Item 3 DOM assertion (radius/geometry) ============
  results.items.item3 = await page.evaluate(() => {
    const card = [...document.querySelectorAll(".group")].find((el) =>
      el.textContent.includes("QA-Grupo-Par") && el.className.includes("rounded-xl"),
    );
    if (!card) return { found: false };
    const cs = getComputedStyle(card);
    const header = card.children[0];
    const hcs = header ? getComputedStyle(header) : null;
    return {
      found: true,
      rootOverflow: cs.overflow,
      rootBorderRadius: cs.borderRadius,
      headerBorderRadius: hcs ? hcs.borderRadius : null,
      headerBorderWidth: hcs ? hcs.borderTopWidth : null,
    };
  });

  // ============ Item 3, terceiro critério (emendado): exclui controles interativos ============
  results.items.item3b = await page.evaluate(`(${item3bScan})()`);

  // ============ Item 4 DOM assertion (single scroll region) ============
  results.items.item4 = await page.evaluate(() => {
    const all = [...document.querySelectorAll("*")];
    const scrollers = all.filter((el) => {
      const cs = getComputedStyle(el);
      return el.scrollHeight > el.clientHeight + 2 && ["auto", "scroll"].includes(cs.overflowY);
    });
    return {
      count: scrollers.length,
      ariaLabels: scrollers.map((el) => el.getAttribute("aria-label")),
    };
  });

  // ============ Meia coluna geometry @1280 (emended debug/1100-range criteria) ============
  results.meiaColuna["1280"] = await page.evaluate(`(${measureGeometry})("1280")`);

  // ============ Item 7 header geometry @1280 ============
  results.items.item7 = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).borderRadius === "24px");
    const timerEl = [...document.querySelectorAll("*")].find((el) => {
      const cl = el.classList;
      return cl.contains("h-32") && cl.contains("w-32");
    });
    const statsCard = boxes.find((b) => b.textContent.includes("Today")) || boxes[0];
    const startBtnEl = [...document.querySelectorAll("button")].find((b) =>
      /^(Start|Stop|Resume|Pause)$/.test((b.textContent || "").trim()),
    );
    return {
      boxCount: boxes.length,
      timerHasRadius24Ancestor: timerEl ? !!timerEl.closest('[class*="rounded-\\["]') : null,
      timerRect: timerEl ? timerEl.getBoundingClientRect() : null,
      statsRect: statsCard ? statsCard.getBoundingClientRect() : null,
      startBtnLabel: startBtnEl ? startBtnEl.textContent.trim() : null,
      startBtnRect: startBtnEl ? startBtnEl.getBoundingClientRect() : null,
    };
  });

  // ============ Dark-mode border check (Green-400 vs Black-600) ============
  await setDark(page, true);
  await page.waitForTimeout(200);
  results.borderCheck.dark = await page.evaluate(() => {
    function findSubtaskRoot(title) {
      const span = document.querySelector(`span[title="${title}"]`);
      return span ? span.closest(".rounded-xl") : null;
    }
    const active = findSubtaskRoot("QA-Sub-01");
    const inactive = findSubtaskRoot("QA-Sub-02");
    return {
      activeBorderColor: active ? getComputedStyle(active).borderColor : null,
      activeClassName: active ? active.className : null,
      inactiveBorderColor: inactive ? getComputedStyle(inactive).borderColor : null,
      inactiveClassName: inactive ? inactive.className : null,
    };
  });
  await shot(page, "border-check-dark-active-vs-inactive");

  // ============ 1280 dark: HONEST element crops (never the same fullPage renamed) ============
  await elShot(page, '[data-qa-shot="header"]', "07-dark-01");
  await elShot(page, '.rounded-xl:has(span[title="QA-Sub-01"])', "07-dark-02");
  await elShot(page, '[data-qa-shot="taskslist"]', "07-dark-03");
  await elShot(page, '[data-tasks-section="paused"]', "07-dark-03d");
  await elShot(page, '.group:has-text("QA-Grupo-Par")', "07-dark-04");
  await ensureGroupCollapsed(page, "QA-Grupo-Par", true);
  await elShot(page, '.group:has-text("QA-Grupo-Par")', "07-dark-04b");
  await ensureGroupCollapsed(page, "QA-Grupo-Par", false);
  await elShot(page, '.group:has-text("QA-Grupo-Scroll")', "07-dark-05");
  await elShot(page, '[data-qa-shot="footer"]', "07-dark-06");
  await runAudit(page, "02-tasks-simples dark 1280");
  await runAudit(page, "04-grupo-expandido dark 1280");
  await runAudit(page, "06-footer-expandido dark 1280");

  // ============ back to light, 1280: HONEST element crops ============
  await setDark(page, false);
  await page.waitForTimeout(150);
  await elShot(page, '[data-qa-shot="header"]', "01-header-desktop");
  await elShot(page, '.rounded-xl:has(span[title="QA-Sub-01"])', "02-tasks-simples");
  await elShot(page, '[data-qa-shot="taskslist"]', "03-lista-2-colunas");
  await elShot(page, '[data-tasks-section="paused"]', "03d-paused-2-colunas");
  await elShot(page, '.group:has-text("QA-Grupo-Par")', "04-grupo-expandido");
  await ensureGroupCollapsed(page, "QA-Grupo-Par", true);
  await elShot(page, '.group:has-text("QA-Grupo-Par")', "04b-grupo-colapsado");
  await ensureGroupCollapsed(page, "QA-Grupo-Par", false);
  await elShot(page, '.group:has-text("QA-Grupo-Scroll")', "05-grupo-scroll");
  await elShot(page, '[data-qa-shot="footer"]', "06-footer-expandido");
  await runAudit(page, "02-tasks-simples light 1280");
  await runAudit(page, "04-grupo-expandido light 1280");
  await runAudit(page, "06-footer-expandido light 1280");

  // ============ 1440 ============
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(150);
  await elShot(page, '[data-qa-shot="taskslist"]', "03b-1440-2-colunas");
  results.meiaColuna["1440"] = await page.evaluate(`(${measureGeometry})("1440")`);

  // ============ 1100 ============
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.waitForTimeout(150);
  await elShot(page, '[data-qa-shot="taskslist"]', "03c-1100-2-colunas");
  results.meiaColuna["1100"] = await page.evaluate(`(${measureGeometry})("1100")`);
  results.items.item6_1100 = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  // ============ 320: overflow proof + the exact completed-item check the reviewer demanded ============
  await page.setViewportSize({ width: 320, height: 844 });
  await page.waitForTimeout(150);
  await shot(page, "10-mobile-320-overflow");
  await elShot(page, '.rounded-xl:has(span[title="QA-Task-Solta-B"])', "10b-mobile-320-footer-crop-sem-badge");
  await elShot(page, '.rounded-xl:has(span[title="QA-100-A"])', "10c-mobile-320-footer-crop-com-badge");
  results.items.item6_320 = await page.evaluate(overflowDiag);
  results.items.item6_320_completedSoltaB = await page.evaluate(`(${completedItemCheck})("QA-Task-Solta-B")`);
  results.items.item6_320_completed100A = await page.evaluate(`(${completedItemCheck})("QA-100-A")`);

  // ============ 768 overflow check ============
  await page.setViewportSize({ width: 768, height: 900 });
  await page.waitForTimeout(150);
  results.items.item6_768 = await page.evaluate(overflowDiag);

  // ============ 390 mobile, light: HONEST element crops + audits ============
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await elShot(page, '.rounded-xl:has(span[title="QA-Sub-01"])', "08-mobile-390-02");
  await elShot(page, '[data-qa-shot="taskslist"]', "08-mobile-390-03");
  await elShot(page, '[data-tasks-section="paused"]', "08-mobile-390-03d");
  await elShot(page, '.group:has-text("QA-Grupo-Par")', "08-mobile-390-04");
  await ensureGroupCollapsed(page, "QA-Grupo-Par", true);
  await elShot(page, '.group:has-text("QA-Grupo-Par")', "08-mobile-390-04b");
  await ensureGroupCollapsed(page, "QA-Grupo-Par", false);
  await elShot(page, '.group:has-text("QA-Grupo-Scroll")', "08-mobile-390-05");
  await elShot(page, '[data-qa-shot="footer"]', "08-mobile-390-06");
  await shot(page, "08-mobile-390-01-fullpage-ref"); // full page reference for 390 (honest label: whole page)
  await runAudit(page, "02-tasks-simples light 390");
  await runAudit(page, "04-grupo-expandido light 390");
  await runAudit(page, "06-footer-expandido light 390");
  results.items.item6_390 = await page.evaluate(overflowDiag);
  results.items.item6_390_timeSpans = await page.evaluate(() => ({
    timeSpansBad: [...document.querySelectorAll("span")].filter((el) => {
      const t = (el.textContent || "");
      if (!/Start|End|Duration/.test(t)) return false;
      const cs = getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
      return el.getBoundingClientRect().height > 2 * lh + 2;
    }).length,
  }));

  // ============ 390 mobile, dark: 04 and 06 ============
  await setDark(page, true);
  await page.waitForTimeout(150);
  await elShot(page, '.group:has-text("QA-Grupo-Par")', "09-mobile-390-dark-04");
  await elShot(page, '[data-qa-shot="footer"]', "09-mobile-390-dark-06");
  await runAudit(page, "02-tasks-simples dark 390");
  await runAudit(page, "04-grupo-expandido dark 390");
  await runAudit(page, "06-footer-expandido dark 390");

  await setDark(page, false);
  await page.setViewportSize({ width: 1280, height: 900 });

  const consoleErrorsFiltered = consoleErrors.filter(
    (e) => !/DevTools|Autofill|source map/i.test(e),
  );
  results.consoleErrors = consoleErrorsFiltered;

  fs.writeFileSync("/tmp/qa-results-r2.json", JSON.stringify(results, null, 2));
  console.log("QA_DONE contrastRuns=" + results.contrastRuns.length +
    " threwAny=" + results.contrastRuns.some((r) => r.threw) +
    " totalViolations=" + results.contrastRuns.reduce((s, r) => s + (r.violations ? r.violations.length : 0), 0) +
    " consoleErrors=" + consoleErrorsFiltered.length);

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error("QA_SCRIPT_FAILED", err);
  process.exit(1);
});
