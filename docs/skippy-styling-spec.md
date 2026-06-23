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
