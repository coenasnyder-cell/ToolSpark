# Skippy the Coder — Tool Styling Spec
**Companion to:** `skippy-spec.md` (Architecture)
**Focus:** How to structure tool output and state. Brand tokens live elsewhere — do not hardcode colors from this file.

---

## The Rule

Every tool you build must look unmistakably like ToolSpark — not like a generic AI-generated page.

**Vary the content, never vary the design system.**

The biggest failure mode is this: dumping the AI's text response straight into a div. Do not do that. Every result gets rendered as structured cards. This spec tells you exactly how.

---

## Form State

```html
<div id="state-form">
  <!-- Headline — specific to this tool, never generic -->
  <h2>[Specific headline]</h2>
  <p>[One sentence of context. Make it specific — not "Tell us about yourself."]</p>

  <!-- Input field -->
  <div>
    <label>[Field label]</label>
    <input type="text" id="field-id" placeholder="e.g. ..." />
  </div>

  <!-- Textarea field (when needed) -->
  <div>
    <label>[Field label]</label>
    <textarea id="field-id" rows="3" placeholder="e.g. ..."></textarea>
  </div>

  <!-- CTA button — always name the outcome -->
  <button onclick="startLoading()">[Outcome-named CTA] →</button>
</div>
```

**CTA button copy — name the actual outcome:**
- ✅ "Generate My Week of Content"
- ✅ "Build My Client Roadmap"
- ✅ "Calculate My Revenue Goal"
- ❌ "Submit" / "Send" / "Go" / "Generate"

---

## Loading State

Never show just a spinner. Always show branded copy that rotates.

```html
<div id="state-loading" style="display:none; text-align:center; padding:32px 0;">
  <div class="spinner"></div>
  <p id="loading-msg">[First loading message]</p>
  <p>[Specific promise — what is being built]</p>
</div>
```

Rotating messages JS:
```js
const loadingMessages = [
  "Analyzing your inputs…",
  "Building your [output noun]…",
  "Adding the finishing touches…"
];
let msgIndex = 0;
const msgInterval = setInterval(() => {
  msgIndex = (msgIndex + 1) % loadingMessages.length;
  document.getElementById('loading-msg').textContent = loadingMessages[msgIndex];
}, 950);
```

---

## Results State

**This is the most important section. Read it carefully.**

### THE RULE: Never dump raw text into a div.

The AI returns text. That text gets split into structured cards. Every day, step, idea, or item is its own card. A wall of text is a failure.

---

### Results header

```html
<div id="state-results" style="display:none;">
  <div>
    <div>
      <p>[Eyebrow — e.g. "Your Result"]</p>
      <h2>[Result headline — specific to what was generated]</h2>
      <p>[Subtitle — reflect inputs back, e.g. "For Introverted Entrepreneurs"]</p>
    </div>
    <span>[Status chip e.g. "Ready to film"]</span>
  </div>

  <div id="result-cards-container"></div>

  <!-- Tips section goes here (if applicable) -->

  <!-- Always include this button -->
  <button onclick="resetTool()">↺ Generate Another [output noun]</button>
</div>
```

---

### Content card (one per day / step / idea / item)

```html
<div class="result-card">
  <!-- Row 1: Eyebrow label + tag badge -->
  <div>
    <p>[Day 1 / Step 1 / Idea 1]</p>
    <span>[Content type tag]</span>
  </div>

  <!-- Card headline -->
  <h3>[Card title]</h3>

  <!-- Card subtitle (optional) -->
  <p>[Subtitle or angle]</p>

  <!-- Bullets — use → instead of • -->
  <ul>
    <li>→ [Bullet point text]</li>
    <!-- Repeat li for each bullet -->
  </ul>

  <!-- Optional footer (link or note) -->
  <div>[Action or note] →</div>
</div>
```

---

### Tips / checklist section

Use for production tips, bonus notes, or action checklists at the end of results.

```html
<div class="tips-section">
  <p>[Section title e.g. Production Tips]</p>

  <!-- Tip row — repeat for each item -->
  <div>
    <span>✓</span>
    <span>[Tip text]</span>
  </div>

  <!-- Footer stat (optional) -->
  <div>
    <strong>[Label e.g. Total time to produce]:</strong> [Value]
  </div>
</div>
```

---

## How to Render AI Results as Cards

### Preferred: Ask the AI to return JSON, then render it

In your API call, instruct the AI to return structured JSON. Then your `renderResults()` function builds the cards from that JSON.

**Prompt instruction to add:**
```
Return your response as valid JSON only — no markdown, no prose outside the JSON. Use this structure:
{
  "headline": "string",
  "subtitle": "string",
  "status_chip": "string",
  "items": [
    {
      "label": "Day 1",
      "tag": "Tutorial",
      "title": "string",
      "subtitle": "string",
      "bullets": ["string", "string", "string"]
    }
  ],
  "tips": {
    "title": "string",
    "items": ["string"],
    "footer_label": "string",
    "footer_value": "string"
  }
}
```

**Render function:**
```js
function renderResults(data) {
  // Update header
  document.querySelector('#state-results h2').textContent = data.headline;
  document.querySelector('#state-results p').textContent = data.subtitle;
  document.querySelector('#state-results .status-chip').textContent = '✦ ' + data.status_chip;

  // Render item cards
  const container = document.getElementById('result-cards-container');
  container.innerHTML = '';
  data.items.forEach(item => {
    const bullets = item.bullets.map(b => `<li>→ ${b}</li>`).join('');

    container.innerHTML += `
      <div class="result-card">
        <div class="card-header">
          <p class="card-eyebrow">${item.label}</p>
          <span class="card-tag">${item.tag}</span>
        </div>
        <h3>${item.title}</h3>
        ${item.subtitle ? `<p class="card-subtitle">${item.subtitle}</p>` : ''}
        <ul>${bullets}</ul>
      </div>`;
  });

  // Render tips section
  if (data.tips) {
    const tipRows = data.tips.items.map(t => `
      <div class="tip-row">
        <span>✓</span>
        <span>${t}</span>
      </div>`).join('');

    container.innerHTML += `
      <div class="tips-section">
        <p class="tips-eyebrow">${data.tips.title}</p>
        ${tipRows}
        ${data.tips.footer_label ? `
        <div class="tips-footer">
          <strong>${data.tips.footer_label}:</strong> ${data.tips.footer_value}
        </div>` : ''}
      </div>`;
  }
}
```

---

### Fallback: If the AI returns text, parse it before rendering

If you can't get JSON back, split the text by day/section headers before putting anything on screen. Never pass raw text to `innerHTML` of a container div.

```js
// Example: split by "DAY X:" pattern
function parseTextToItems(text) {
  const sections = text.split(/DAY \d+:/i).filter(s => s.trim());
  return sections.map((section, i) => {
    const lines = section.trim().split('\n').filter(l => l.trim());
    return {
      label: `Day ${i + 1}`,
      title: lines[0].trim(),
      bullets: lines.slice(1).map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
    };
  });
}
```

---

## State Management

```js
function showState(id) {
  ['state-form', 'state-loading', 'state-results'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'block' : 'none';
  });
}

function startLoading() {
  showState('state-loading');
  document.getElementById('progress-bar').style.width = '66%';
  // start rotating messages, make API call
}

function showResults(data) {
  clearInterval(msgInterval);
  showState('state-results');
  document.getElementById('progress-bar').style.width = '100%';
  renderResults(data);
}

function resetTool() {
  showState('state-form');
  document.getElementById('progress-bar').style.width = '33%';
  // clear input fields
}
```

**Progress bar widths:** Form state = `33%` → Loading = `66%` → Results = `100%`

---

## Named Themes

Tools can request a named design theme instead of the default ToolSpark green. Specify the theme keyword in the brief ("build this tool with the clarity theme") and apply the corresponding token set and component patterns below.

---

### Theme: `clarity`

**When to use:** Assessment tools, session-based experiences, onboarding flows, or any tool that needs a warm, premium, slightly editorial feel. The clarity page (`/clarity`) is the canonical reference.

**Keyword trigger:** When a brief says "use clarity theme", "clarity styling", or "clarity design", apply everything in this section.

---

#### CSS Tokens (paste into `<style>` as `:root`)

```css
:root {
  --bg:          #F7F4EE;      /* warm cream page background */
  --bg-surface:  #EEEADF;      /* slightly darker cream, used in nested panels */
  --bg-card:     #FFFFFF;      /* card backgrounds */
  --gold:        #C9A84C;      /* primary accent, buttons, icons */
  --gold-text:   #8A6E1E;      /* gold for text, labels, links */
  --gold-dim:    rgba(201,168,76,0.10);
  --gold-mid:    rgba(201,168,76,0.22);
  --gold-glow:   rgba(201,168,76,0.25);
  --border:      rgba(26,20,10,0.09);
  --border-mid:  rgba(26,20,10,0.16);
  --ink:         #1A1510;      /* near-black body text */
  --ink-mid:     #6B5E50;      /* warm gray secondary text */
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --shadow:      0 1px 4px rgba(26,20,10,0.07);
}
```

---

#### Font Stack

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;700&family=Caveat:wght@400;600&display=swap" rel="stylesheet">
```

| Role | Font | Usage |
|------|------|-------|
| Headings | `'Playfair Display', serif` | `font-weight: 700`, italic `em` spans in gold-text |
| Body / UI | `'DM Sans', sans-serif` | All body copy, labels, buttons |
| Handwritten | `'Caveat', cursive` | Speech bubbles, personal notes, Sparky dialogue |

---

#### Page Background

```css
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);       /* #F7F4EE — not white */
  color: var(--ink);
}
```

---

#### Cards

```css
.clarity-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 2px 20px rgba(26,20,10,0.07);
}
```

Nested info panels (inside a card) use `background: #F2EEE5` and `border-radius: 18px`.

---

#### Eyebrow / Pill Label

```html
<div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
  <span style="font-size:11px; font-weight:600; color:var(--gold-text); border:1px solid rgba(201,168,76,0.35); border-radius:999px; padding:4px 12px; letter-spacing:0.04em; text-transform:uppercase; background:var(--gold-dim);">
    [Label Text]
  </span>
  <span style="color:var(--gold);">✦</span>
</div>
```

---

#### Section Labels (inside panels)

```css
.clarity-section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold-text);
  margin-bottom: 16px;
}
```

---

#### Input Fields

```css
.clarity-input-wrap {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg);
  border: 1.5px solid var(--border-mid);
  border-radius: 12px;
  padding: 12px 16px;
  transition: border-color 0.18s var(--ease-out);
}
.clarity-input-wrap:focus-within { border-color: var(--gold); }
.clarity-input {
  flex: 1; background: none; border: none; outline: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px; color: var(--ink);
}
```

---

#### CTA Button

```css
.clarity-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 12px;
  background: var(--gold);
  color: var(--ink);
  border: none;
  padding: 17px 24px;
  border-radius: 4px;               /* intentionally square — not rounded */
  font-family: 'DM Sans', sans-serif;
  font-size: 16px; font-weight: 700;
  cursor: pointer;
  transition: background-color 0.16s var(--ease-out), transform 0.16s var(--ease-out);
}
.clarity-btn:active { transform: scale(0.98); }
@media (hover: hover) and (pointer: fine) {
  .clarity-btn:hover { background: var(--gold-text); color: #fff; transform: translateY(-1px); }
}
```

---

#### Sparkle Animation

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.9; transform: scale(1) rotate(0deg); }
  50%       { opacity: 0.15; transform: scale(0.55) rotate(18deg); }
}
.sp { color: var(--gold); }
.sp-anim { animation: twinkle 2.8s var(--ease-in-out) infinite; }
```

Stagger delays with `animation-delay` (e.g. `0.1s`, `0.9s`, `1.7s`) for multiple sparkles.

---

#### Result Cards (clarity variant)

Same card-per-item rule as the default spec, but with clarity tokens:

```html
<div class="result-card" style="background:var(--bg-card); border:1px solid var(--border); border-radius:18px; padding:24px; margin-bottom:16px;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
    <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:var(--gold-text);">[Step 1 / Idea 1]</span>
    <span style="font-size:11px; font-weight:600; color:var(--gold-text); border:1px solid rgba(201,168,76,0.35); border-radius:999px; padding:3px 10px; background:var(--gold-dim);">[Tag]</span>
  </div>
  <h3 style="font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--ink); margin-bottom:8px;">[Card Title]</h3>
  <p style="font-size:13px; color:var(--ink-mid); line-height:1.6;">[Card body or bullets]</p>
</div>
```

---

#### What changes vs. default ToolSpark styling

| Default ToolSpark | Clarity Theme |
|---|---|
| Dark sidebar, green accent | No sidebar; warm cream + gold |
| `border-radius: 12px` cards | `border-radius: 24px` outer, `18px` inner |
| System sans-serif | Playfair Display headings + DM Sans body |
| Green buttons | Gold buttons (`#C9A84C`), square corners (`border-radius: 4px`) |
| White `#fff` background | Cream `#F7F4EE` background |
| Standard pill chips | Gold-bordered pill with `background: var(--gold-dim)` |

---

## What to Avoid

| Don't | Do instead |
|-------|------------|
| `innerHTML = rawApiResponseText` | Parse JSON then call `renderResults(data)` |
| Button says "Submit" or "Generate" | Name the actual outcome |
| No loading messages, just a spinner | Rotating branded loading copy |
| One big result block | Individual cards per item |
| Bullet points with `•` | Arrow bullets `→` |
| Numbered markers `01 / 02 / 03` | `Day 1 / Step 1 / Idea 1` eyebrow labels |

---

*Spec written by Cowork. Companion to `skippy-spec.md`. June 2026.*
