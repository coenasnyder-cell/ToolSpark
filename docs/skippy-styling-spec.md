# Skippy the Coder — Tool Styling Spec
**Companion to:** `skippy-spec.md` (Architecture)
**Focus:** How every tool you build must look. Design system, component patterns, results rendering.

---

## The Rule

Every tool you build must look unmistakably like ToolSpark — not like a generic AI-generated page.

**Vary the content, never vary the design system.**

The biggest failure mode is this: dumping the AI's text response straight into a div. Do not do that. Every result gets rendered as structured cards. This spec tells you exactly how.

---

## Brand Tokens

Use these exact values. No near-equivalents.

| Token | Value | When to use |
|-------|-------|-------------|
| Purple primary | `#6B2FB3` | Buttons, focus rings, progress bar, eyebrow labels, `→` bullets |
| Yellow accent | `#FFC820` | Small chips/badges only — never as a fill or large background |
| Yellow text | `#5A3A00` | Text on `#FFC820` backgrounds |
| Near-black | `#0D0D0D` | All headlines and body text |
| Page background | `#F7F4FB` | Outer page bg — warm purple-tinted off-white. NEVER use flat `#F4F4F4` |
| Card border | `#E8E1F0` | 1.5px flat border on all cards. No box-shadow. |
| Muted text | `#6B6B6B` | Subtitles, helper text |
| Purple-light fill | `#F3EDF9` | Tag backgrounds, tip section background |
| Tag text | `#4A1B8A` | Text on purple-light backgrounds |
| Purple hover button bg | `#5A2598` | Purple button hover state |

---

## Typography

Always load both fonts. Never use the same font family for headlines and body — that's the biggest "generic AI tool" tell.

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

| Use | Font | Weight |
|-----|------|--------|
| Headlines, button text, eyebrow labels, day labels | `'Sora', sans-serif` | 700 |
| Body copy, field labels, helper text, bullet text | `'Inter', system-ui, sans-serif` | 400–500 |

---

## Page Shell

Every tool uses this exact outer wrapper. Never skip the header, branding line, or progress bar.

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">

<div style="background:#F7F4FB; min-height:100vh; padding:32px 16px; font-family:'Inter',system-ui,sans-serif;">

  <!-- Header -->
  <div style="text-align:center; margin-bottom:24px;">
    <h1 style="font-family:'Sora',sans-serif; font-size:22px; font-weight:700; color:#0D0D0D; margin:0 0 4px;">[Tool Name]</h1>
    <p style="font-size:12px; color:#999; margin:0 0 14px;">Powered by ToolSpark ⚡</p>
    <!-- Progress bar -->
    <div style="max-width:460px; margin:0 auto; height:3px; background:#E8E1F0; border-radius:2px;">
      <div id="progress-bar" style="height:100%; background:#6B2FB3; border-radius:2px; width:33%; transition:width 0.5s ease;"></div>
    </div>
  </div>

  <!-- Card container -->
  <div style="background:white; border:1.5px solid #E8E1F0; border-radius:12px; padding:32px; max-width:600px; margin:0 auto;">
    <!-- States go here (form / loading / results) -->
  </div>

</div>
```

**Progress bar widths:** Form state = `33%` → Loading = `66%` → Results = `100%`

---

## Form State

```html
<div id="state-form">
  <!-- Eyebrow (Step indicator) -->
  <p style="font-size:11px; font-weight:700; color:#6B2FB3; text-transform:uppercase; letter-spacing:0.07em; margin:0 0 6px; font-family:'Sora',sans-serif;">Step 1 of 2</p>

  <!-- Headline — specific to this tool, never generic -->
  <h2 style="font-family:'Sora',sans-serif; font-size:19px; font-weight:700; color:#0D0D0D; margin:0 0 6px;">[Specific headline]</h2>
  <p style="font-size:13px; color:#6B6B6B; margin:0 0 24px; line-height:1.6;">[One sentence of context. Make it specific — not "Tell us about yourself."]</p>

  <!-- Input field -->
  <div style="margin-bottom:18px;">
    <label style="display:block; font-weight:500; font-size:13px; color:#0D0D0D; margin-bottom:6px;">[Field label]</label>
    <input type="text" id="field-id"
      placeholder="e.g. ..."
      style="width:100%; box-sizing:border-box; border:1.5px solid #E8E1F0; border-radius:8px; padding:10px 14px; font-size:14px; font-family:'Inter',system-ui,sans-serif; outline:none; color:#0D0D0D; background:white; transition:border-color 0.2s;"
      onfocus="this.style.borderColor='#6B2FB3'"
      onblur="this.style.borderColor='#E8E1F0'">
  </div>

  <!-- Textarea field (when needed) -->
  <div style="margin-bottom:28px;">
    <label style="display:block; font-weight:500; font-size:13px; color:#0D0D0D; margin-bottom:6px;">[Field label]</label>
    <textarea id="field-id" rows="3"
      placeholder="e.g. ..."
      style="width:100%; box-sizing:border-box; border:1.5px solid #E8E1F0; border-radius:8px; padding:10px 14px; font-size:14px; font-family:'Inter',system-ui,sans-serif; outline:none; color:#0D0D0D; background:white; resize:none; transition:border-color 0.2s;"
      onfocus="this.style.borderColor='#6B2FB3'"
      onblur="this.style.borderColor='#E8E1F0'"></textarea>
  </div>

  <!-- CTA button — always name the outcome -->
  <button onclick="startLoading()"
    style="width:100%; background:#6B2FB3; color:white; border:none; border-radius:8px; padding:14px 24px; font-size:15px; font-weight:700; font-family:'Sora',sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;"
    onmouseover="this.style.background='#5A2598'"
    onmouseout="this.style.background='#6B2FB3'">
    [Outcome-named CTA] →
  </button>
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
  <div style="width:44px; height:44px; border:3px solid #E8E1F0; border-top-color:#6B2FB3; border-radius:50%; margin:0 auto 20px; animation:spin 0.75s linear infinite;"></div>
  <p id="loading-msg" style="font-family:'Sora',sans-serif; font-size:16px; font-weight:700; color:#0D0D0D; margin:0 0 4px;">[First loading message]</p>
  <p style="font-size:13px; color:#999; margin:0;">[Specific promise — what is being built]</p>
</div>

<style>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
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

## Results State ⚡

**This is the most important section. Read it carefully.**

### THE RULE: Never dump raw text into a div.

The AI returns text. That text gets split into structured cards. Every day, step, idea, or item is its own card. A wall of text is a failure.

---

### Results header

```html
<div id="state-results" style="display:none;">
  <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
    <div>
      <p style="font-size:11px; font-weight:700; color:#6B2FB3; text-transform:uppercase; letter-spacing:0.07em; margin:0 0 3px; font-family:'Sora',sans-serif;">Your Result</p>
      <h2 style="font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:#0D0D0D; margin:0;">[Result headline — specific to what was generated]</h2>
      <p style="font-size:13px; color:#888; margin:4px 0 0;">[Subtitle — reflect inputs back, e.g. "For Introverted Entrepreneurs"]</p>
    </div>
    <span style="background:#FFC820; color:#5A3A00; font-size:11px; font-weight:700; padding:4px 11px; border-radius:20px; white-space:nowrap; flex-shrink:0; margin-top:2px;">✦ [Status chip e.g. Ready to film]</span>
  </div>

  <div id="result-cards-container"></div>

  <!-- Tips section goes here (if applicable) -->

  <!-- Always include this button -->
  <button onclick="resetTool()"
    style="width:100%; background:white; color:#6B2FB3; border:1.5px solid #6B2FB3; border-radius:8px; padding:12px 24px; font-size:14px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; margin-top:8px; transition:background 0.15s;"
    onmouseover="this.style.background='#F7F4FB'"
    onmouseout="this.style.background='white'">
    ↺ Generate Another [output noun]
  </button>
</div>
```

---

### Content card (one per day / step / idea / item)

```html
<div style="border:1.5px solid #E8E1F0; border-radius:12px; padding:20px 22px; margin-bottom:12px;">

  <!-- Row 1: Eyebrow label + tag badge -->
  <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:6px;">
    <p style="font-size:11px; font-weight:700; color:#6B2FB3; text-transform:uppercase; letter-spacing:0.07em; margin:0; font-family:'Sora',sans-serif;">[Day 1 / Step 1 / Idea 1]</p>
    <span style="background:#F3EDF9; color:#4A1B8A; font-size:11px; font-weight:600; padding:3px 9px; border-radius:12px; white-space:nowrap;">[Content type tag]</span>
  </div>

  <!-- Card headline -->
  <h3 style="font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#0D0D0D; margin:0 0 6px;">[Card title]</h3>

  <!-- Card subtitle (optional) -->
  <p style="font-size:13px; font-weight:500; color:#3D1A7A; margin:0 0 10px;">[Subtitle or angle]</p>

  <!-- Bullets — use → instead of • -->
  <ul style="margin:0; padding:0; list-style:none;">
    <li style="font-size:13px; color:#444; line-height:1.6; padding:3px 0 3px 16px; position:relative;">
      <span style="position:absolute; left:0; color:#6B2FB3; font-size:12px;">→</span>
      [Bullet point text]
    </li>
    <!-- Repeat li for each bullet -->
  </ul>

  <!-- Optional footer (link or note) -->
  <div style="margin-top:12px; padding-top:10px; border-top:1px solid #F0EBF8;">
    <span style="font-size:12px; font-weight:600; color:#6B2FB3;">[Action or note] →</span>
  </div>

</div>
```

---

### Tips / checklist section

Use for production tips, bonus notes, or action checklists at the end of results.

```html
<div style="background:#F3EDF9; border:1.5px solid #D4B8F0; border-radius:12px; padding:20px 22px; margin-bottom:16px;">
  <p style="font-size:11px; font-weight:700; color:#6B2FB3; text-transform:uppercase; letter-spacing:0.07em; margin:0 0 12px; font-family:'Sora',sans-serif;">[Section title e.g. Production Tips]</p>

  <!-- Tip row — repeat for each item -->
  <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; font-size:13px; color:#3D1A7A; line-height:1.5;">
    <span style="color:#6B2FB3; font-size:15px; flex-shrink:0; margin-top:1px;">✓</span>
    <span>[Tip text]</span>
  </div>

  <!-- Footer stat (optional) -->
  <div style="margin-top:12px; padding-top:10px; border-top:1px solid #D4B8F0; font-size:13px; color:#555;">
    <strong style="color:#0D0D0D;">[Label e.g. Total time to produce]:</strong> [Value]
  </div>
</div>
```

---

## How to Render AI Results as Cards (The Critical Part)

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
    const bullets = item.bullets.map(b => `
      <li style="font-size:13px; color:#444; line-height:1.6; padding:3px 0 3px 16px; position:relative;">
        <span style="position:absolute; left:0; color:#6B2FB3; font-size:12px;">→</span>
        ${b}
      </li>`).join('');

    container.innerHTML += `
      <div style="border:1.5px solid #E8E1F0; border-radius:12px; padding:20px 22px; margin-bottom:12px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:6px;">
          <p style="font-size:11px; font-weight:700; color:#6B2FB3; text-transform:uppercase; letter-spacing:0.07em; margin:0; font-family:'Sora',sans-serif;">${item.label}</p>
          <span style="background:#F3EDF9; color:#4A1B8A; font-size:11px; font-weight:600; padding:3px 9px; border-radius:12px; white-space:nowrap;">${item.tag}</span>
        </div>
        <h3 style="font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#0D0D0D; margin:0 0 6px;">${item.title}</h3>
        ${item.subtitle ? `<p style="font-size:13px; font-weight:500; color:#3D1A7A; margin:0 0 10px;">${item.subtitle}</p>` : ''}
        <ul style="margin:0; padding:0; list-style:none;">${bullets}</ul>
      </div>`;
  });

  // Render tips section
  if (data.tips) {
    const tipRows = data.tips.items.map(t => `
      <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; font-size:13px; color:#3D1A7A; line-height:1.5;">
        <span style="color:#6B2FB3; font-size:15px; flex-shrink:0;">✓</span>
        <span>${t}</span>
      </div>`).join('');

    container.innerHTML += `
      <div style="background:#F3EDF9; border:1.5px solid #D4B8F0; border-radius:12px; padding:20px 22px; margin-bottom:16px;">
        <p style="font-size:11px; font-weight:700; color:#6B2FB3; text-transform:uppercase; letter-spacing:0.07em; margin:0 0 12px; font-family:'Sora',sans-serif;">${data.tips.title}</p>
        ${tipRows}
        ${data.tips.footer_label ? `
        <div style="margin-top:12px; padding-top:10px; border-top:1px solid #D4B8F0; font-size:13px; color:#555;">
          <strong style="color:#0D0D0D;">${data.tips.footer_label}:</strong> ${data.tips.footer_value}
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

---

## Pre-Ship Checklist

Before calling any tool done:

- [ ] Background is `#F7F4FB`, not flat gray `#F4F4F4`
- [ ] All cards use `border:1.5px solid #E8E1F0` — no `box-shadow`
- [ ] Headline font is Sora, body font is Inter — never the same family for both
- [ ] Progress bar advances through all three states (33% → 66% → 100%)
- [ ] Loading state has rotating branded messages, not just a spinner
- [ ] Results are individual cards — not a raw text dump
- [ ] Yellow `#FFC820` appears only as a small chip/badge — never as a large fill
- [ ] CTA button copy names the actual outcome
- [ ] "Generate Another [noun]" button is present at the bottom of results
- [ ] Empty/first load shows the form with intro context — not a blank screen
- [ ] All three states have been wired: form → loading → results → reset

---

## What to Avoid

| ❌ Don't | ✅ Do instead |
|----------|-------------|
| `background:#F4F4F4` (flat gray) | `background:#F7F4FB` (warm tinted) |
| `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` | `border:1.5px solid #E8E1F0` |
| Same font for headline and body | Sora headlines / Inter body |
| `innerHTML = rawApiResponseText` | Parse JSON → `renderResults(data)` |
| Button says "Submit" or "Generate" | Button names the outcome |
| No loading messages — just a spinner | Rotating branded loading copy |
| Yellow as a section background or card fill | Yellow only as a small badge chip |
| Numbered markers `01 / 02 / 03` | `Day 1 / Step 1 / Idea 1` eyebrow labels |
| Bullet points with `•` | Arrow bullets `→` in purple |

---

*Spec written by Cowork. Companion to `skippy-spec.md`. June 2026.*
