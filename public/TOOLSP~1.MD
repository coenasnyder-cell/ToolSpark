# ToolSpark — Credit Gate Fix Spec

> **For Skippy.** Check off each item as it ships. Last updated: June 23, 2026.

---

## Root Cause — 3 bugs working together

1. **`firebase-functions-compat.js` missing from all tool pages.** `tsDeductCredits()` calls `firebase.functions()` — without the SDK loaded it throws a silent TypeError, the Promise rejects, and `catch(e) { return; }` in every start function swallows it. Button does nothing.

2. **`nav.js` missing from standalone tool pages** (the ones without a sidebar). `window.tsUser` is only set inside nav.js's auth callback. Without nav.js, `window.tsUser` is never populated, `tsUserReady` never fires, and the button hangs forever.

3. **`initHeader` in nav.js returned too early.** Even after nav.js was added, pages without a `.top-header` element hit `if (!header) return` before the Firebase auth listener was set up — same hanging result.

---

## Global Fixes Already Applied — Deploy Once, Covers Everything

| File | What changed |
|------|-------------|
| `js/nav.js` | `tsDeductCredits` now waits for `tsUserReady` before checking — no more race condition on fast clicks |
| `js/nav.js` | `initHeader` now sets up auth + Firestore listener even when no `.top-header` exists |
| `js/nav.js` | Firestore `.catch()` now fires `tsUserReady` (with `tsUser = null`) instead of silently hanging |
| `signon.html` | New users get `credits: 50` on document creation |
| All 22 tool pages | `firebase-functions-compat.js` script tag added |

---

## ✅ Already Fully Fixed — Just Needs Deploy

These pages already had `nav.js` loaded. Only needed `firebase-functions-compat.js` (done).  
Check off each one after verifying post-deploy.

- [ ] Find Your Spark — `spark.html` — 5 credits
- [ ] Optin Builder — `optin-builder.html` — 1 credit
- [ ] Email Sequence — `email-sequence.html` — 1 credit
- [ ] Funnel Generator — `funnel-generator.html` — 1 credit
- [ ] Journey Builder — `journey-builder.html` — 1 credit
- [ ] Sales Page Builder — `sales-page-builder.html` — 1 credit
- [ ] Offer Sort — `offer-sort.html` — 1 credit
- [ ] Offer Builder — `offer-builder.html` — 1 credit
- [ ] Lesson Project Editor — `lesson-project-editor.html` — 1 credit (called twice)
- [ ] Content Generator — `content-generator.html` — 1 credit
- [ ] Prompt Generator — `prompt-generator.html` — 1 credit

---

## ⚠️ Still Needs `nav.js` Added — One Change Per File

These pages have no sidebar and no `nav.js`. Add these two lines just before `</body>`:

```html
<script src="js/nav.js"></script>
<script>if (window.initNav) initNav('KEY', 'Page Title');</script>
```

| Tool | File | Credits | Key | Title |
|------|------|---------|-----|-------|
| Audience Deep Dive | `audiencetool.html` | 5 | `audiencetool` | Audience Deep Dive |
| Breakthrough Session | `clarity.html` | 5 | `clarity` | Breakthrough Session |
| Journey Companion | `journey-companion.html` | 5 | `journey-companion` | Journey Companion |
| Tool Finder | `toolfinder.html` | 5 | `toolfinder` | Tool Finder |
| Chat with Sparky | `sparky.html` | 1 | `sparky` | Chat with Sparky |
| Chat with Sparky (Redesign) | `sparky-redesign.html` | 1 | `sparky` | Chat with Sparky |
| Screen Recorder | `screen-recorder.html` | 1 | `screen-recorder` | Screen Recorder |
| Lesson Generator | `lesson-generator.html` | 1 | `lesson-generator` | Lesson Generator |
| Member Lesson | `member-lesson.html` | 1 | `member-lesson` | Lesson |
| TikTok Script | `tiktok-script.html` | 1 | `tiktok-script` | TikTok Script |
| Caption Pack | `caption-pack.html` | 1 | `caption-pack` | Caption Pack |

### Checklist

- [ ] Audience Deep Dive — `audiencetool.html`
- [ ] Breakthrough Session — `clarity.html`
- [ ] Journey Companion — `journey-companion.html`
- [ ] Tool Finder — `toolfinder.html`
- [ ] Chat with Sparky — `sparky.html`
- [ ] Chat with Sparky (Redesign) — `sparky-redesign.html`
- [ ] Screen Recorder — `screen-recorder.html`
- [ ] Lesson Generator — `lesson-generator.html`
- [ ] Member Lesson — `member-lesson.html`
- [ ] TikTok Script — `tiktok-script.html`
- [ ] Caption Pack — `caption-pack.html`

---

## 🔥 Firestore — Manual Step for Existing Users

New signups going forward get `credits: 50` automatically via `signon.html`.  
Existing user documents need it added by hand.

**Steps:** Firebase Console → Firestore → `users` collection → open each user doc → add field:

```
credits: 50
```

> Your own admin account can be any number you want (e.g. `9999`). Admin users bypass credit checks entirely — this is just for display purposes.

---

## Rule for Future Tool Pages

Any new tool page Skippy adds must include:

```html
<!-- Firebase SDKs (if not already present) -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-functions-compat.js"></script>

<!-- Nav (sets window.tsUser, required for credit gating) -->
<script src="js/nav.js"></script>
<script>if (window.initNav) initNav('page-key', 'Page Title');</script>
```

Without these, `tsDeductCredits` will hang and every button will be broken out of the box.

---

## Project: Admin Dashboard Redesign

> **Status: Planning only. No work started.**
> Design reference image saved at: `public/admindashboard.png`

### What changes
- **Sidebar/nav: do not touch** — keep the existing `admindashboard.html` sidebar structure, links, and logo exactly as-is. The logo already has the correct colors on this page. No HTML or CSS changes to the nav at all.
- **Page content: full redesign** — replace the current dashboard body with the new layout below.
- **Data: placeholders only** — no sections need to be wired to live Firestore data yet. Hardcode realistic-looking placeholder numbers and lists.

### Design language
Follows the existing ToolSpark dark theme already on `admindashboard.html` (dark sidebar, dark hero). Not the light-mode cream system used on the tool welcome pages.
- Humor and personality throughout — Skippy has a voice here
- Sparky robot illustration in the hero (use existing Sparky asset or placeholder)
- Caveat handwriting font for Skippy's casual notes/captions
- Gold sparkle stars (`@keyframes twinkle`) as decorative accents in the hero
- Sticky note component (gold/yellow) for Skippy's Note

### Page sections (top to bottom)

**1. Hero banner** — full-width dark card
- "Welcome back, [name] 👋" small eyebrow line
- Large headline: **"Mission Control"** with a small lightning bolt / swoosh accent
- Italic subtitle in Caveat: *"Today's chaos is organized below."*
- Sparky illustration floated right (placeholder robot SVG or img)
- Gold sparkle stars scattered in background
- **Skippy speech bubble** (white notecard, top-right of banner): short funny quip + a CTA button "View Today's Priorities →"

**2. Stats row** — 6 equal stat cards across full width

| Stat | Subtitle |
|------|----------|
| Builders Aboard | Registered accounts |
| Fresh Faces | Joined in the last 7 days |
| Ideas Shared | Community threads |
| Spark Sessions | Completed sessions |
| Projects Ignored | *(For now 😅)* |
| On the Waitlist | Early access signups |

**3. Four-column content row**

- **Currently Building** — checklist of in-progress tasks with checkboxes. Caveat italic footer: *"Skippy believes in you. (Sometimes.) ♡"*
- **Recent Activity** — timestamped feed of platform events (tool runs, content saved, sessions completed). "View all activity →" link at bottom.
- **Recent Wins** — star-icon list of small wins. Caveat footer: *"Celebrate the wins, even the tiny ones. 🎉"*
- **Community Pulse** — list of active community threads with reply count badges. "Go to Community →" link at bottom.

**4. Quick Access grid** — 3×3 card grid, each card has icon + title + one-line description + arrow

| Row 1 | Row 2 | Row 3 |
|-------|-------|-------|
| Creator Hub | Content Hub | Admin Agents |
| Manage Courses | Manage API | Manage Members |
| Manage Tools | Community | CRM Lead Management |

**5. Skippy's Note** — yellow sticky note component, floated bottom-right of the Quick Access section
- Title "Skippy's Note" in Caveat bold
- One short motivational/snarky line (e.g. *"You don't need more ideas. You need to finish the ones you have."*)
- Signed *"— Skippy 🤖"*

### Notes for implementation
- Use Caveat font (already imported on redesigned pages) for all handwriting-style text
- Sticky note: gold/yellow background (`#F5C842` or similar), slight drop shadow, maybe a 1–2deg rotation for personality
- Speech bubble in hero: white card with a small triangle pointer, Skippy's quip changes based on nothing (just hardcoded for now)
- All numbers in the stats row are hardcoded placeholders until Firestore queries are wired up later

### Motion + Animation
Use the same techniques from the Find Your Spark redesign (`spark.html` is the canonical reference, full pattern also in `docs/page-redesign-system.md` and memory):

- **Sparkle stars** — 4-point SVG star `M6 0L6.7 5.3L12 6L6.7 6.7L6 12L5.3 6.7L0 6L5.3 5.3Z` with `@keyframes twinkle` (scale + rotate at 50%). Use 2.8s duration, stagger delays by ~0.8–1.0s so stars never pulse together. Scatter 3–4 in the hero banner.
- **Fade-up entrances** — `@keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }` on cards and sections as they appear
- **Sticky note tilt** — `transform: rotate(-1deg)` or `rotate(2deg)` on Skippy's Note for a natural dropped-on-the-desk feel (same technique as the rotated speech bubble on `clarity.html`)
- **Gold easing vars** — `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` and `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` for all transitions
- **`prefers-reduced-motion`** — wrap all animations in a media query so they're skipped for users who have it enabled

---

## Project: Shared Content-Width Tier System

> **Status: Planning only. No work started.**
> Do not make changes until page-by-page tier assignments are reviewed and approved.

### Goal
Replace every page's hardcoded `.page-content { max-width: XXXpx }` with a reference to one of three shared CSS custom properties. Any future global width change then only needs to happen in one file.

### The three tiers

```css
/* public/css/shared.css  (create this file) */
:root {
  --content-narrow:  800px;   /* chat tools, sequential flows, form-heavy pages */
  --content-medium: 1100px;   /* standard admin/content pages, most member pages */
  --content-wide:   1600px;   /* dense dashboards, multi-column layouts */
}
```

Every page adds one import in `<head>`:
```html
<link rel="stylesheet" href="/css/shared.css">
```

Then each page's `.page-content` rule becomes:
```css
.page-content { max-width: var(--content-wide); /* or narrow/medium */ }
```

### Implementation order
1. Create `public/css/shared.css` with the three variables (and any other future global tokens).
2. Present the page-by-page tier assignment table below for approval before touching any page.
3. Go through all ~25 pages, add the `<link>` import, and replace the hardcoded `max-width` value.
4. Verify each page still looks correct after the swap.

### Proposed page-by-page tier assignments
*(Review and adjust before executing — these are Skippy's first-pass calls.)*

| Page | File | Current max-width | Proposed tier |
|------|------|------------------|---------------|
| Dashboard | `dashboard.html` | 1600px | `--content-wide` |
| Admin Dashboard | `admindashboard.html` | 1100px | `--content-medium` |
| Admin API Usage | `adminapiusage.html` | 1200px | `--content-medium` |
| Admin Events | `adminevents.html` | 1100px | `--content-medium` |
| Admin Courses | `admincourses.html` | 1100px | `--content-medium` |
| Admin Certificates | `admincertificates.html` | 1100px | `--content-medium` |
| Admin Agents | `adminagents.html` | 860px | `--content-medium` |
| Admin Waitlist | `adminwaitlist.html` | 900px | `--content-medium` |
| Admin Community Hub | `admin-community-hub.html` | 900px | `--content-medium` |
| Admin Content Hub | `admin-content-hub.html` | 900px | `--content-medium` |
| Admin Courses Hub | `admin-courses-hub.html` | 900px | `--content-medium` |
| Admin Just Sparked | `adminjustsparked.html` | 900px | `--content-medium` |
| Admin Audience Sessions | `adminaudiencesessions.html` | 860px | `--content-medium` |
| Admin Blog | `admin/blog.html` | 1000px | `--content-medium` |
| Admin Blog New | `admin/blog/new.html` | 860px | `--content-medium` |
| Admin Blog Edit | `admin/blog/edit.html` | 860px | `--content-medium` |
| Community | `community.html` | 860px | `--content-medium` |
| DIY Path | `diy.html` | 860px | `--content-medium` |
| Cert Hub | `cert-hub.html` | 760px | `--content-narrow` |
| Email Sequence | `email-sequence.html` | 820px | `--content-narrow` |
| Find Your Spark | `spark.html` | (check) | `--content-narrow` |
| Audience Deep Dive | `audiencetool.html` | (check) | `--content-narrow` |
| Clarity / Breakthrough | `clarity.html` | (check) | `--content-narrow` |
| Journey Companion | `journey-companion.html` | (check) | `--content-narrow` |
| Prompt Generator | `prompt-generator.html` | (check) | `--content-narrow` |

> Pages marked *(check)* are standalone tool pages — read each before assigning a tier.
> Admin CRM pages (`admincrm.html`, `admincrm-automation.html`) have custom layouts — review separately.

### When we're in a page anyway
If we're already editing a page for the credit gate fix or nav.js pass, we can drop in the `<link>` and swap the `max-width` at the same time rather than doing a separate pass. No need to wait for the full batch if the page is already open.
