# ToolSpark Light-Mode Page Redesign System

Used on: `sparky-redesign.html`, `journey-companion.html`, `spark.html`
Apply to: the two remaining pages.

---

## Fonts (Google Fonts import)

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;700&family=Caveat:wght@400;600&display=swap" rel="stylesheet">
```

| Role | Font | Usage |
|------|------|-------|
| Serif headline | `Playfair Display` italic | Page titles, h1, welcome headlines |
| Body / UI | `DM Sans` | All body copy, buttons, inputs, labels |
| Handwriting | `Caveat` | Speech bubbles, casual annotations only |

---

## CSS Tokens (`:root`)

```css
:root {
  --bg:          #F7F4EE;        /* page background (warm cream) */
  --bg-surface:  #EEEADF;        /* slightly darker surface */
  --bg-card:     #FFFFFF;        /* white cards */
  --gold:        #C9A84C;        /* primary accent, buttons, sparkles */
  --gold-text:   #8A6E1E;        /* dark gold for text on light bg */
  --gold-dim:    rgba(201,168,76,0.10);  /* subtle gold wash */
  --gold-mid:    rgba(201,168,76,0.22);  /* medium gold tint */
  --border:      rgba(26,20,10,0.09);    /* card/section borders */
  --border-mid:  rgba(26,20,10,0.16);    /* input borders */
  --ink:         #1A1510;        /* primary text */
  --ink-mid:     #6B5E50;        /* secondary text */
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --shadow:      0 1px 4px rgba(26,20,10,0.07);
  /* legacy remaps — keep so JS-injected elements inherit correctly */
  --surface:    var(--bg-card);
  --dark:       var(--bg);
  --text:       var(--ink);
  --text2:      var(--ink-mid);
  --text3:      var(--ink-mid);
  --gold-light: var(--gold-text);
  --green-dim:  rgba(201,168,76,0.09);
  --green-mid:  var(--gold);
  --shadow:     0 1px 4px rgba(26,20,10,0.07);
}
```

---

## Dark Header (copy exactly)

Used inside welcome overlays AND as the sticky `site-header` for the chat/tool state.

```html
<header class="site-header">  <!-- or class="spark-header" inside overlay -->
  <a href="dashboard.html" class="ph-back">
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
    Dashboard
  </a>
  <div class="ph-brandblock">
    <span class="ph-wordmark"><span class="tool">Tool</span><span class="spark">Spark</span></span>
    <span class="ph-tag">Creator Hub</span>  <!-- change subtitle per page if needed -->
  </div>
  <span></span>  <!-- spacer to keep logo centered via absolute positioning -->
</header>
```

```css
.site-header, .spark-header {
  height: 48px; background: #1A1510;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; flex-shrink: 0; position: relative;
}
.ph-back {
  display: flex; align-items: center; gap: 6px;
  text-decoration: none; color: rgba(255,255,255,0.55);
  font-size: 13px; font-weight: 500;
  transition: color 0.15s var(--ease-out);
}
.ph-back:hover { color: #FFFFFF; }
.ph-brandblock {
  display: flex; flex-direction: column; line-height: 1.1;
  position: absolute; left: 50%; transform: translateX(-50%);
  pointer-events: none;
}
.ph-wordmark { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; }
.ph-wordmark .tool { color: #FFFFFF; }
.ph-wordmark .spark { color: var(--gold); }
.ph-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #BBA8D4; text-align: center; }
```

---

## Sparkle Animation (4-point star)

SVG path: `M6 0L6.7 5.3L12 6L6.7 6.7L6 12L5.3 6.7L0 6L5.3 5.3Z` (viewBox `0 0 12 12`)

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.9; transform: scale(1) rotate(0deg); }
  50%       { opacity: 0.15; transform: scale(0.55) rotate(18deg); }
}
.sp { position: absolute; color: var(--gold); flex-shrink: 0; }
/* Stagger delays so sparkles never pulse together: 0.1s / 0.9s / 1.7s */
.sp-tl { top: -8px;   left: -30px;  animation: twinkle 2.8s var(--ease-in-out) 0.1s infinite; }
.sp-tr { top: -6px;   right: -18px; animation: twinkle 2.8s var(--ease-in-out) 0.9s infinite; }
.sp-br { bottom: 14px; right: -26px; animation: twinkle 2.8s var(--ease-in-out) 1.7s infinite; }
/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .sp { animation: none !important; opacity: 0.7 !important; }
}
```

HTML (inside a `position: relative` wrapper):
```html
<div class="sparky-avatar-wrap">
  <svg class="sp sp-tl" width="20" height="20" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M6 0L6.7 5.3L12 6L6.7 6.7L6 12L5.3 6.7L0 6L5.3 5.3Z"/>
  </svg>
  <svg class="sp sp-tr" width="13" height="13" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M6 0L6.7 5.3L12 6L6.7 6.7L6 12L5.3 6.7L0 6L5.3 5.3Z"/>
  </svg>
  <div class="sparky-avatar">
    <span class="sparky-avatar-ph">S</span>
  </div>
</div>
```

---

## Avatar Ring Frame

```css
.sparky-avatar-wrap {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
}
.sparky-avatar {
  width: 88px; height: 88px; border-radius: 50%;   /* 110px on spark.html */
  border: 2.5px solid var(--gold);
  background: var(--bg-surface);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 0 0 6px var(--gold-dim);            /* 8px on spark.html */
}
.sparky-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.sparky-avatar-ph {
  font-family: 'Playfair Display', serif; font-style: italic;
  font-size: 28px; color: var(--gold-text); user-select: none; /* 36px on spark.html */
}
```

Replace `.sparky-avatar-ph` span with `<img src="PATH_TO_SPARKY">` when mascot is ready.

---

## Eyebrow Pill Row

```html
<div class="jc-eyebrow-row">
  <svg class="jc-sp jc-sp-l" width="15" height="15" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M6 0L6.7 5.3L12 6L6.7 6.7L6 12L5.3 6.7L0 6L5.3 5.3Z"/>
  </svg>
  <span class="jc-eyebrow-pill">ToolSpark · Page Name</span>
</div>
```

```css
.jc-eyebrow-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.jc-eyebrow-pill {
  font-size: 11px; font-weight: 600; color: var(--gold-text);
  border: 1px solid rgba(201,168,76,0.35); border-radius: 999px;
  padding: 4px 12px; letter-spacing: 0.04em; text-transform: uppercase;
  background: var(--gold-dim); white-space: nowrap;
}
.jc-sp { color: var(--gold); flex-shrink: 0; }
.jc-sp-l { animation: twinkle 2.8s var(--ease-in-out) 0.2s infinite; }
```

---

## Welcome Overlay Pattern (full-page light-mode)

```css
#overlay-id {
  position: fixed; inset: 0; background: var(--bg);
  z-index: 200; display: flex; flex-direction: column;
  overflow-y: auto; transition: opacity 0.45s var(--ease-out);
}
#overlay-id.hidden { opacity: 0; pointer-events: none; }
.content-area { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 32px 20px 48px; }
.main-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 24px; padding: 40px; max-width: 740px; width: 100%;
  box-shadow: 0 2px 20px rgba(26,20,10,0.07);
}
```

---

## Gold CTA Button

```css
.cta-btn {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--gold); color: var(--ink);
  border: none; padding: 15px 36px; border-radius: 14px;
  font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  transition: background-color 0.16s var(--ease-out), transform 0.16s var(--ease-out);
}
.cta-btn:active { transform: scale(0.97); }
@media (hover: hover) and (pointer: fine) {
  .cta-btn:hover { background: var(--gold-text); color: #fff; transform: translateY(-1px); }
}
```

---

## Source files (canonical implementations)

- Sparky chat page: `public/sparky-redesign.html`
- Journey Companion: `public/journey-companion.html`
- Find Your Spark: `public/spark.html`
