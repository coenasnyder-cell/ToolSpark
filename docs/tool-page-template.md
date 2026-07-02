# ToolSpark Tool Page Template

Canonical source: `journeymap.html` (as of the journeymap/discoverbreakthrough redesign work).
Also implemented on: `discoverbreakthrough.html` (with its own `roadmap-outer`/`define-outer` variant — see notes below).

Starter file to copy for a new tool page: `docs/tool-page-template.html`.

---

## Philosophy

**Structure and style are the constant. Content is the variable.**

CSS, layout, padding, spacing, and the section shell never change between tools. What changes per page: titles/copy, which roadmap step is active, and the actual data pulled in. Every place in the starter file that needs editing per-tool is marked:

- `<!-- CUSTOMIZE: ... -->` — a comment above HTML that needs changing (copy, active step, data hookup).
- `[BRACKETED TEXT]` — literal placeholder text to replace.

**This is a living document.** If you tweak one of these sections on a real page later, update this file too — otherwise it drifts out of date the same way line-number references would.

---

## CSS Tokens (`:root`)

One canonical token set. Copy this exactly — don't let a new page grow its own slightly-different tokens (that's how `--ink-soft` ended up defined on one page and not another, breaking a ported style).

```css
:root {
  --bg: #F8F5EF;
  --surface: rgba(255,255,255,0.84);
  --surface-strong: #ffffff;
  --ink: #1b1712;
  --muted: #6f6355;
  --gold: #c9a84c;
  --gold-deep: #8a6e1e;
  --line: rgba(27,23,18,0.10);
  --line-strong: rgba(201,168,76,0.28);
  --shadow: 0 18px 50px rgba(56,42,18,0.08);
  --green: #315b43;
  --green-bg: rgba(49,91,67,0.08);
  --cream: #f2ede2;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh;
  font-family: "DM Sans", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(201,168,76,0.18), transparent 30%),
    linear-gradient(180deg, #fbf8f1 0%, var(--bg) 100%);
}
a { color: inherit; }

.shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 20px 72px;
}

.hidden { display: none !important; }
```

Font import (Google Fonts):

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;700&family=Caveat:wght@600&display=swap" rel="stylesheet">
```

---

## Page Chrome (every tool page needs this)

```html
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Tool Name] · ToolSpark</title>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check-compat.js"></script>
<script>
  const firebaseConfig = {
    apiKey: "AIzaSyCJ0aVMa7M_Bs_Rg7otoAuckI86OtsFUgE",
    authDomain: "toolspark.co",
    projectId: "toolspark-2d62d",
    storageBucket: "toolspark-2d62d.firebasestorage.app",
    messagingSenderId: "82966513396",
    appId: "1:82966513396:web:f52b52b0ed2dc9537ac0a1",
    measurementId: "G-F6NVJRMHV6"
  };
  firebase.initializeApp(firebaseConfig);
  try { firebase.appCheck().activate("6LefuOcsAAAAAD1Pbu-O1q94rMf8u3bdPYoS82zJ", true); } catch (e) {}
  const db = firebase.firestore();
</script>
<script src="js/auth.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;700&family=Caveat:wght@600&display=swap" rel="stylesheet">
<style>/* tokens + section CSS goes here */</style>
</head>
<body data-page-title="[Tool Name]">
```

End of body — always include Lucide (several sections use `data-lucide` icons) and topbar.js:

```html
<script src="js/topbar.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
</body>
</html>
```

### The three-state pattern (loading → blocked → main)

Every tool page shows exactly one of these at a time:

```html
<div class="state-wrap" id="loadingState" style="display:flex;">
  <div class="state-card">
    <div class="loading"></div>
    <h2>[Loading message]</h2>
    <p id="loadingMessage">[Loading detail]</p>
  </div>
</div>

<div class="state-wrap" id="blockedState">
  <div class="state-card">
    <div class="eyebrow">[Tool Name]</div>
    <h2 id="blockedTitle">You are almost there.</h2>
    <p id="blockedCopy">[Why they're blocked]</p>
    <ul class="checklist" id="blockedChecklist"></ul>
    <div class="state-links" id="blockedLinks"></div>
  </div>
</div>

<main class="shell hidden" id="appShell">
  <!-- sections go here -->
</main>
```

```css
.state-wrap {
  display: none;
  align-items: center;
  justify-content: center;
  min-height: 72vh;
  padding: 20px;
}
.state-card {
  max-width: 720px;
  width: 100%;
  padding: 36px 32px;
}
.state-card h2 {
  font-family: "Playfair Display", serif;
  font-size: 34px;
  margin-bottom: 12px;
}
.state-card p {
  color: var(--muted);
  line-height: 1.8;
  font-size: 15px;
}
.state-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}
.checklist {
  list-style: none;
  display: grid;
  gap: 10px;
  margin-top: 20px;
}
.checklist li {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px 16px;
  color: var(--ink);
}
.loading {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 3px solid rgba(201,168,76,0.2);
  border-top-color: var(--gold);
  animation: spin 0.9s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.panel, .state-card {
  background: var(--surface);
  border: 1px solid rgba(255,255,255,0.6);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow);
  border-radius: 12px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 12px;
  background: rgba(201,168,76,0.12);
  border: 1px solid rgba(201,168,76,0.24);
  color: var(--gold-deep);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 16px;
  width: fit-content;
}
```

JS pattern — one function to switch between the three states, one to build the blocked checklist:

```js
function showState(id) {
  document.getElementById("loadingState").style.display = id === "loadingState" ? "flex" : "none";
  document.getElementById("blockedState").style.display = id === "blockedState" ? "flex" : "none";
  document.getElementById("appShell").classList.toggle("hidden", id !== "appShell");
}

// CUSTOMIZE: missingItems = [{ label, href, cta }] for whatever this tool needs first
function buildBlockedState(missingItems) {
  const checklist = document.getElementById("blockedChecklist");
  const links = document.getElementById("blockedLinks");
  checklist.innerHTML = "";
  links.innerHTML = "";
  missingItems.forEach(function (item) {
    const li = document.createElement("li");
    li.textContent = item.label;
    checklist.appendChild(li);
    const a = document.createElement("a");
    a.className = "ghost-btn";
    a.href = item.href;
    a.textContent = item.cta;
    links.appendChild(a);
  });
  showState("blockedState");
}
```

---

## Connector Rules (the continuous-panel technique)

This is the trickiest part and not tied to any one section — it's how *whichever* sections you stack together read as one seamless block instead of separate floating cards with cream gaps between them. Only two pieces ever break from white: the hero image (dark) at the very top, and the bottom banner (dark) at the very bottom. Everything between them is one continuous white surface.

**Checklist when stacking sections:**

1. **First section in the stack** (usually the hero): round the top corners only — `border-radius: 12px 12px 0 0`.
2. **Last section in the stack** (the bottom banner): round the bottom corners only — `border-radius: 0 0 12px 12px`.
3. **Every section in between**: fully square — `border-radius: 0`. Zero margin/gap between adjacent sections (`margin: 0`, or the parent's `gap: 0` if it's a grid/flex parent).
4. **Every white section in between** shares the same background/border/shadow so the edges line up:
   ```css
   background: var(--surface);
   border-left: 1px solid rgba(255,255,255,0.6);
   border-right: 1px solid rgba(255,255,255,0.6);
   box-shadow: var(--shadow);
   ```
   (Top/bottom borders are intentionally omitted on interior sections — that's what makes the seam invisible. A visible top/bottom border between two white sections just draws a line where you don't want one.)
5. **If you insert a new section between two existing ones**, it also needs `border-radius: 0` and zero margin, and must pick up the same white/border/shadow treatment so it doesn't leave a gap.
6. **Whenever you touch any of this, update the mobile media query too.** Corner radii need matching adjustments there or a section will silently re-round itself at small viewports (this bit us once already — see `@media (max-width: 680px)` in journeymap.html for the pattern to copy).

---

## Section: Hero

```css
.hero { margin-bottom: 0; }

.hero-card {
  position: relative;
  width: 100%;
  background-color: #2a2015;
  background-image: url('breakthrough-banner.png'); /* CUSTOMIZE: per-tool hero image, or drop the image and keep the dark gradient */
  background-size: cover;
  background-position: center 30%;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  aspect-ratio: 16 / 4.5;
  min-height: 0;
  opacity: 0;
  transform: scale(0.98);
  animation: heroReveal 600ms var(--ease-out) 80ms forwards;
}
.hero-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(10,8,4,0.12) 0%, rgba(10,8,4,0.0) 40%, rgba(10,8,4,0.55) 75%, rgba(10,8,4,0.82) 100%);
  border-radius: inherit;
}
.hero-overlay-text { position: absolute; bottom: 32px; left: 40px; z-index: 2; max-width: 52ch; }
.hero-overlay-text .eyebrow { background: rgba(201,168,76,0.16); border: 1px solid rgba(201,168,76,0.32); color: var(--gold); margin-bottom: 12px; }
h1 {
  font-family: "Playfair Display", serif;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.08;
  color: #fff;
  margin-bottom: 10px;
  text-shadow: 0 2px 16px rgba(0,0,0,0.4);
  opacity: 0;
  animation: heroTextUp 480ms var(--ease-out) 220ms forwards;
}
h1 em {
  color: var(--gold);
  font-style: italic;
  background: linear-gradient(90deg, var(--gold) 0%, #f0d080 45%, var(--gold) 100%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3.5s linear 900ms infinite;
}
.hero-copy { color: rgba(255,255,255,0.88); font-size: 15px; line-height: 1.7; text-shadow: 0 1px 10px rgba(0,0,0,0.65); opacity: 0; animation: heroTextUp 480ms var(--ease-out) 300ms forwards; }
.hero-note { margin-top: 10px; font-family: "Caveat", cursive; font-size: 24px; color: var(--gold-light, #E8D5A3); text-shadow: 0 1px 10px rgba(0,0,0,0.65); opacity: 0; animation: heroTextUp 480ms var(--ease-out) 340ms forwards; }

@keyframes heroReveal { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
@keyframes heroTextUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer { to { background-position: 220% center; } }
```

```html
<section class="hero">
  <div class="hero-card">
    <div class="hero-overlay-text">
      <div class="eyebrow"><!-- CUSTOMIZE: phase/eyebrow label --></div>
      <h1><!-- CUSTOMIZE: title, wrap the emphasized part in <em> --></h1>
      <p class="hero-copy"><!-- CUSTOMIZE: one-line description of what this page does --></p>
      <div class="hero-note"><!-- CUSTOMIZE: optional handwritten-style aside, delete if not needed --></div>
    </div>
  </div>
</section>
```

Mobile (`@media max-width: 680px`): `.hero-card { border-radius: 12px 12px 0 0; aspect-ratio: 4 / 3; background-position: center 34%; }`, `.hero-overlay-text { left: 20px; right: 20px; bottom: 20px; }`, `h1 { font-size: 26px; }`.

---

## Section: Roadmap

Optional. Shows where this tool sits in the overall ToolSpark journey (Spark → Audience → Transformation → Journey Map → Tool Map → Launch). **The only thing that changes per page is which step is `.active` (with the "YOU ARE HERE" tag) and which steps are `.done`.**

```css
.roadmap-outer {
  background: var(--surface);
  border-left: 1px solid rgba(255,255,255,0.6);
  border-right: 1px solid rgba(255,255,255,0.6);
  box-shadow: var(--shadow);
  padding: 18px 32px 22px;
  margin-bottom: 0;
}
.roadmap { display: flex; align-items: center; gap: 0; overflow-x: auto; scrollbar-width: none; }
.roadmap::-webkit-scrollbar { display: none; }
.roadmap-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; position: relative; }
.step-circle {
  width: 64px; height: 64px; border-radius: 50%;
  border: 1.5px solid rgba(26,20,10,0.16);
  background: transparent; color: #1a1510;
  display: flex; align-items: center; justify-content: center;
}
.roadmap-step.done .step-circle { border-color: var(--gold); color: #1a1510; }
.roadmap-step.active .step-circle { border-color: var(--gold); background: var(--gold); color: #1a1510; box-shadow: 0 0 18px rgba(201,168,76,0.45); }
.step-circle svg { width: 40px; height: 40px; stroke: currentColor; stroke-width: 2.2; }
.step-label { font-size: 14px; font-weight: 800; letter-spacing: 0.04em; color: #1a1510; white-space: nowrap; text-align: center; margin-top: 8px; }
.roadmap-step.done .step-label { color: rgba(201,168,76,0.65); }
.roadmap-step.active .step-label { color: var(--gold); }
.step-here {
  position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
  font-size: 9px; font-weight: 800; letter-spacing: 0.10em; color: #1a1510;
  white-space: nowrap; text-transform: uppercase;
}
.step-connector { flex: 1; height: 1.5px; min-width: 20px; background: rgba(26,20,10,0.10); position: relative; top: -18px; }
.step-connector.done { background: rgba(201,168,76,0.45); }
```

```html
<!-- Roadmap (attached to bottom of hero) -->
<div class="roadmap-outer">
  <div class="roadmap">
    <!-- CUSTOMIZE: mark steps .done up through wherever this tool sits, exactly one .active step
         with a .step-here "YOU ARE HERE" tag, everything after is plain (not started).
         A connector only gets .done when BOTH steps it connects are .done — the connector
         leading INTO the active step stays plain. -->
    <div class="roadmap-step done">
      <div class="step-circle"><i data-lucide="zap" width="15" height="15"></i></div>
      <div class="step-label">Spark</div>
    </div>
    <div class="step-connector done"></div>
    <div class="roadmap-step done">
      <div class="step-circle"><i data-lucide="users" width="15" height="15"></i></div>
      <div class="step-label">Audience</div>
    </div>
    <div class="step-connector"></div>
    <div class="roadmap-step active">
      <div class="step-here">YOU ARE HERE</div>
      <div class="step-circle"><i data-lucide="sparkles" width="15" height="15"></i></div>
      <div class="step-label">[Current Step]</div>
    </div>
    <div class="step-connector"></div>
    <div class="roadmap-step">
      <div class="step-circle"><i data-lucide="map" width="15" height="15"></i></div>
      <div class="step-label">Journey Map</div>
    </div>
    <div class="step-connector"></div>
    <div class="roadmap-step">
      <div class="step-circle"><i data-lucide="wrench" width="15" height="15"></i></div>
      <div class="step-label">Tool Map</div>
    </div>
    <div class="step-connector"></div>
    <div class="roadmap-step">
      <div class="step-circle"><i data-lucide="rocket" width="15" height="15"></i></div>
      <div class="step-label">Launch</div>
    </div>
  </div>
</div>
```

Mobile: `.roadmap-outer { padding: 16px 20px 18px; }`.

---

## Section: Compare Panel (before/after)

Renamed from the transformation-specific `transform-box`/`transformation` classes for the template, since this is really a generic two-column comparison, not something tied to "transformation" specifically. **`journeymap.html` and `discoverbreakthrough.html` keep their original `transform-box`/`transformation-panel`/`transform-arrow` names — no need to rename those live pages.** New pages built from this template should use the names below.

```css
.compare-panel {
  border-radius: 0;
  border-top: none;
  border-bottom: none;
}
.compare-panel h2 {
  font-family: "Playfair Display", serif;
  font-size: clamp(34px, 4vw, 48px);
  line-height: 1.05;
  margin-bottom: 8px;
  text-align: center;
}
.compare-summary { color: var(--muted); line-height: 1.7; font-size: 15px; max-width: 60ch; margin: 0 auto; text-align: center; }

.compare-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 18px; align-items: stretch; margin-top: 22px; }
.compare-card { padding: 22px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255,255,255,0.78); }
.compare-card-title {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px; padding: 8px 12px 8px 8px; border-radius: 12px;
  background: rgba(201,168,76,0.10); border: 1px solid rgba(201,168,76,0.18);
  border-bottom: 2px solid rgba(201,168,76,0.35);
  color: var(--gold-deep); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
}
.compare-card-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%;
  background: #1A1510; color: var(--gold); flex-shrink: 0;
}
.compare-arrow { display: flex; align-items: center; justify-content: center; color: var(--gold-deep); font-size: 30px; padding: 0 6px; }

.compare-points { list-style: none; display: grid; gap: 12px; } /* list-style:none matters — without it you get a double bullet next to the ::before dot */
.compare-points li { position: relative; padding-left: 22px; color: var(--ink); }
.compare-points li::before {
  content: ""; position: absolute; left: 0; top: 0.66em;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--gold); box-shadow: 0 0 0 5px rgba(201,168,76,0.14);
}
```

```html
<section class="grid">
  <article class="panel panel-full compare-panel">
    <h2><!-- CUSTOMIZE: section title, e.g. "The Transformation" --></h2>
    <div class="compare-grid">
      <div class="compare-card">
        <div class="compare-card-title">
          <span class="compare-card-icon"><!-- CUSTOMIZE: icon svg --></span>
          [Where they start] <!-- CUSTOMIZE -->
        </div>
        <ul class="compare-points" id="compareStart"></ul> <!-- CUSTOMIZE: populate via JS, see below -->
      </div>
      <div class="compare-arrow">&rarr;</div>
      <div class="compare-card">
        <div class="compare-card-title">
          <span class="compare-card-icon"><!-- CUSTOMIZE: icon svg --></span>
          [Where they end up] <!-- CUSTOMIZE -->
        </div>
        <ul class="compare-points" id="compareEnd"></ul> <!-- CUSTOMIZE: populate via JS -->
      </div>
    </div>

    <!-- OPTIONAL: bonus callout box below the two cards. Kept as its original
         "Identity Shift" naming/pattern — only generalize this into its own
         reusable component if a second tool actually needs the same shape.
         Delete this whole block if this tool doesn't need a callout. -->
    <div class="transform-identity">
      <span class="transform-icon"><!-- CUSTOMIZE: icon svg --></span>
      <div class="transform-identity-body">
        <span class="transform-identity-label">[Callout Label]</span>
        <p id="calloutText"></p>
      </div>
    </div>
  </article>
</section>
```

```css
/* Optional callout box CSS — copy only if you're keeping the block above */
.transform-identity { margin-top: 18px; padding: 16px 18px; border-radius: 12px; background: linear-gradient(180deg, rgba(201,168,76,0.12), rgba(201,168,76,0.05)); border: 1px solid rgba(201,168,76,0.20); display: flex; align-items: flex-start; gap: 14px; }
.transform-icon { display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; border-radius: 50%; background: var(--gold); color: #fff; flex-shrink: 0; }
.transform-icon svg { width: 32px; height: 32px; }
.transform-identity-body { display: flex; flex-direction: column; min-width: 0; }
.transform-identity-label { display: block; margin-bottom: 6px; color: var(--gold-deep); font-size: 16px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
```

JS pattern for populating the two lists (this is the piece that pulls real data — see `buildSentenceListHtml`/`textOrFallback` in journeymap.html for the exact helper functions):

```js
document.getElementById("compareStart").innerHTML = buildSentenceListHtml(
  /* CUSTOMIZE: the data field for "where they start" */,
  "Not found yet."
);
document.getElementById("compareEnd").innerHTML = buildSentenceListHtml(
  /* CUSTOMIZE: the data field for "where they end up" */,
  "Not found yet."
);
```

Mobile: `.compare-panel { border-radius: 0; }`, `.compare-grid { grid-template-columns: 1fr; }`, `.compare-arrow { transform: rotate(90deg); min-height: 28px; }`.

---

## Section: Action Panel (feature list + CTA)

Generalized from `.generate-panel` — a title, 2-4 short value-prop bullets with icons, a primary/secondary button pair, and a status helper line underneath. The verb ("Generate", "Create", "Build"...) is whatever fits the tool, so the class name stays neutral.

```css
.action-panel {
  display: grid;
  gap: 18px;
  border-radius: 0;
  border-color: rgba(201,168,76,0.35);
  border-top: 2px solid rgba(201,168,76,0.35);
  border-bottom: none;
  box-shadow: var(--shadow), 0 0 0 1px rgba(201,168,76,0.10) inset;
}
.define-divider { display: flex; align-items: center; gap: 6px; }
.divider-line { flex: 1; height: 1px; position: relative; overflow: hidden; }
.divider-line::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--gold), transparent); opacity: 0.25; }
.divider-text { font-family: "Playfair Display", serif; font-size: 24px; font-weight: 500; font-style: italic; letter-spacing: 0.01em; color: var(--muted); white-space: nowrap; }

.build-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.build-list li { display: flex; align-items: flex-start; gap: 12px; background: rgba(255,255,255,0.6); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; }
.build-icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; flex-shrink: 0; color: var(--gold-deep); }

.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 20px; }
.primary-btn, .ghost-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  text-decoration: none; border-radius: 10px; padding: 12px 18px;
  font-size: 14px; font-weight: 700;
  transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}
.primary-btn { border: none; background: var(--gold); color: var(--ink); cursor: pointer; box-shadow: 0 8px 24px rgba(201,168,76,0.22); }
.primary-btn:disabled { cursor: wait; opacity: 0.7; }
.ghost-btn { color: var(--muted); border: 1px solid var(--line); background: rgba(255,255,255,0.56); }

.helper { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; font-size: 13px; color: var(--gold-deep); text-align: center; }
.helper svg { flex-shrink: 0; }
```

```html
<article class="panel panel-full action-panel">
  <div class="define-divider">
    <div class="divider-line"></div>
    <div class="divider-text"><!-- CUSTOMIZE: "Generate My X", "Build Your Y", etc. --></div>
    <div class="divider-line"></div>
  </div>
  <ul class="mini-list build-list">
    <!-- CUSTOMIZE: 2-4 short value-prop bullets, each with an icon -->
    <li>
      <span class="build-icon"><!-- CUSTOMIZE: icon svg --></span>
      <span><!-- CUSTOMIZE: bullet copy --></span>
    </li>
  </ul>
  <div class="actions">
    <button class="primary-btn" id="primaryActionBtn">
      <!-- CUSTOMIZE: icon svg -->
      <span id="primaryActionLabel">[Primary action label]</span>
    </button>
    <a class="ghost-btn hidden" href="#" id="secondaryActionBtn">
      <!-- CUSTOMIZE: icon svg, href, and unhide via JS when relevant -->
      <span>[Secondary action label]</span>
    </a>
  </div>
  <div class="helper" id="actionHelper">
    <!-- CUSTOMIZE: icon svg -->
    <span id="actionHelperText">[Status/helper copy]</span>
  </div>
</article>
```

**Note on updating button text via JS:** always target the inner `<span>` (`#primaryActionLabel`, `#actionHelperText`), never `.textContent` on the button/div itself — otherwise you wipe out the icon along with the text. This bit us once already on journeymap.html.

Mobile: `.action-panel { border-radius: 0; }`, `.build-list { grid-template-columns: 1fr; }` (at 900px).

---

## Section: Bottom Banner

```css
.bottom-banner {
  display: flex; align-items: center; gap: 20px;
  background: #1a1510; border-radius: 0 0 12px 12px;
  padding: 22px 28px; margin-top: 0; overflow: hidden; position: relative; justify-content: center;
}
.bottom-banner-copy p { color: rgba(255,255,255,0.88); font-size: 28px; font-weight: 700; line-height: 1.5; margin: 0 0 3px; flex: 0 1 auto; text-align: center; }
.bottom-banner-copy em { font-family: "Playfair Display", serif; font-style: italic; font-size: 28px; color: var(--gold); font-weight: 500; }
.banner-glow { position: absolute; right: -40px; top: -40px; width: 260px; height: 260px; background: radial-gradient(circle, rgba(201,168,76,0.28) 0%, transparent 70%); pointer-events: none; }
```

```html
<div class="bottom-banner">
  <div class="banner-glow"></div>
  <div class="bottom-banner-copy">
    <p><!-- CUSTOMIZE: closing line --> <em><!-- CUSTOMIZE: emphasized closing phrase --></em></p>
  </div>
</div>
```

Mobile: `.bottom-banner { border-radius: 0 0 12px 12px; }` (stays the same, just re-listed in the mobile query for clarity alongside the other radius overrides).

---

## Quick Reference: what actually changes per page

| Piece | Changes per tool? |
|---|---|
| `:root` tokens, fonts, page chrome | Never |
| Connector rules (radius/margin/border chaining) | Never — the *pattern* is fixed, though which sections you include varies |
| Hero image, title, copy | Yes |
| Roadmap active/done steps | Yes |
| Compare panel title, icons, data source | Yes (structure/CSS stays fixed) |
| Optional callout box | Include or delete per tool |
| Action panel copy, bullets, button labels, data wiring | Yes (structure/CSS stays fixed) |
| Bottom banner copy | Yes |
| `showState`/`buildBlockedState` JS shape | Never — only the `missingItems` content passed in changes |
