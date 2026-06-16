# ToolSpark Architecture Spec — Skippy Build Brief
**Author:** Cowork (Architecture + QA)  
**For:** Skippy (Developer)  
**Date:** June 2026  
**Status:** Pre-Launch Cleanup — 30-Day Timeline  
**Goal:** Reduce confusion, make the workflow obvious, wire everything together.

---

## Context

ToolSpark helps people go from idea to launched AI tool without coding. The system works — it needs organization, not new builds. This spec covers every page decision, the new Certification Hub architecture, what gets wired together, and a few small fixes. No new tool builds unless explicitly noted.

**Team:**
- Coena = Founder + decision-maker
- Skippy = Developer (that's you)
- Sparky = Accountability dinosaur AI
- Nemo = Marketing/content agent
- Cowork = Architecture + QA (wrote this doc)

---

## Part 1 — Page Decisions

### DELETE These Files

| File | Reason |
|------|--------|
| `public/techstack.html` | Old process, no longer used. Orphan page with no links in or out. Remove entirely. |
| `public/journey-map.html` | Old 614-line version of journey-builder.html. **Incompatible schema conflict:** saves `box2`, `box3`, `box4`, `discovery` fields to `journey_maps/{uid}` — the new journey-builder.html expects `customerStartingPoint`, `desiredTransformation`, `leadMagnetTool`, `mvpTool`, `expansionTool`. Both write to the same Firestore path, so old docs cause blank fields in current builder. No real users yet — delete cleanly pre-launch. |
| `public/journey-map-spec.md` | Outdated design spec sitting in the public folder. Should never be public-facing. Delete from `/public/` — keep in repo history only if you want. |

### KEEP, No Changes

| File | Notes |
|------|-------|
| `public/journey-companion.html` | AI accountability coach used during the Challenge/Clarity phase. Cannot rename — walkthrough videos are already recorded with this name. Placement: Challenge phase only (Phase 1). |
| `public/diy.html` | DIY checklist for Do-It-Yourself path only. Not part of the Certification Program. Keep as a standalone resource. |
| `public/build-agent.html` | AI tool builder. Used in Phase 2 cert flow. |
| `public/prompt-generator.html` | Prompt generator. Used in Phase 2 cert flow. |
| `public/offer-sort.html` | Used in Phase 3. |
| `public/offer-builder.html` | Used in Phase 3. |
| `public/sales-page-builder.html` | Dual-purpose — see wiring section below. |
| `public/funnel-generator.html` | Funnel builder. Used in both Phase 2 (opt-in) and Phase 3 (sales). |
| `public/email-sequence.html` | Phase 3 only. |
| `public/certificate.html` | Graduation cert display. Keep. |
| `public/graduation.html` | Graduation celebration. Keep. |
| `public/marketplace.html` | Keep. Used in Phase 2 (free tool listing) and graduation (paid tool listing). |

### KEEP + WIRE

| File | What Needs to Happen |
|------|----------------------|
| `public/value-tool.html` | **Value Mirror** — exists and works but is linked to nothing. Wire it into Phase 2 cert flow as the final step before "Phase 2 Complete." See Phase 2 spec below. Confirm where it stores its output in Firestore — the results need to display back in the Phase 2 checklist. |

### RENAME

| File | New Name | UI Label | Notes |
|------|----------|----------|-------|
| `public/launch-map.html` | `public/launch-kit.html` | "Launch Kit" | Aggregates offer + journey + funnel + sales copy for Phase 3. "Launch Map" adds to the map/roadmap naming confusion. Rename the file, update all internal links. |

### EVOLVE (No New File, Restructure Existing)

| File | What It Becomes |
|------|-----------------|
| `public/dwy.html` | This was the 5-phase cert checklist + Submit for Review form. It becomes the content for **Phase 2** inside the new Certification Hub. See Phase 2 spec below. You can either keep `dwy.html` as the URL or create `cert-phase2.html` — your call on the cleaner approach. |

---

## Part 2 — Dashboard Changes

### Current Problem
The student dashboard has scattered links to cert tools everywhere. Students don't know where to start or what order to follow.

### Changes Required

**Add two primary cards to the main dashboard:**

1. **Certification Hub card** — large, prominent, center placement
   - Label: "Certification Hub"
   - Subtitle: "Your path from idea to launched AI business"
   - Links to: `/cert-hub.html` (new page — see Part 3)
   - Show phase progress indicator (Phase 1 / Phase 2 / Phase 3 with checkmarks)

2. **Content Hub card** — secondary card
   - Label: "Content Hub"
   - Subtitle: "Tools to build your audience"
   - Links to: `/content-hub.html` (new page — see Part 5)
   - Visible once user has chosen a path (after Choose Your Path step)

**Remove from sidebar nav (or deprioritize):**
- Direct link to "Journey Builder" from the sidebar — it belongs inside Phase 3 of Certification Hub, not as a top-level nav item
- Direct link to "31-Day Planner" from sidebar — it belongs in Content Hub

**Keep in sidebar nav:**
- Dashboard
- Certification Hub (replaces "My Roadmap")
- Community
- Courses
- Inbox
- My Agents
- Marketplace (locked until graduation — keep as-is)
- Creator Hub (post-grad — keep as-is)

---

## Part 3 — Certification Hub (New Page)

**File:** `public/cert-hub.html`  
**Access:** All DWY members (logged in, chosen DWY path)  
**URL:** `/cert-hub`

### Layout

Three phase cards stacked vertically or in a clear progression layout:

```
┌─────────────────────────────────────────────┐
│  ✅ PHASE 1 — The Challenge        COMPLETE  │
│  Spark, Audience, Clarity, Choose Your Path  │
│  [View Phase 1] →                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  🔓 PHASE 2 — Build Your Lead Magnet        │
│  Creator Hub → Build → Value Mirror →        │
│  Content → Sales Copy → Marketplace          │
│  [Enter Phase 2] →                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  🔒 PHASE 3 — Launch & Monetize   LOCKED    │
│  Unlocks when Phase 2 is complete            │
└─────────────────────────────────────────────┘
```

### Unlock Logic

**Firestore path:** `certification_progress/{uid}`

**Fields:**
```javascript
{
  phase1Complete: boolean,   // true when user has chosen DWY path
  phase1CompletedAt: timestamp,
  phase2Complete: boolean,   // true when user clicks "Phase 2 Complete" button
  phase2CompletedAt: timestamp,
  phase3Complete: boolean,   // true at graduation
  phase3CompletedAt: timestamp,
  marketplaceFreeListed: boolean,   // free tool listed in marketplace
  marketplacePaidListed: boolean,   // paid tool listed at graduation
}
```

**Rules:**
- Phase 1 card: Always unlocked. Shows complete if `phase1Complete === true`.
- Phase 2 card: Unlocked if `phase1Complete === true`. Shows complete if `phase2Complete === true`.
- Phase 3 card: Locked (grayed out, lock icon) if `phase2Complete !== true`. Unlocks and becomes clickable when `phase2Complete === true`.

**Phase 1 completion trigger:** Set `phase1Complete = true` when user selects "Certification Program" at the Choose Your Path step. If a user already went through the Challenge and chose DWY, backfill this as true.

---

## Part 4 — Phase Detail Pages

### Phase 1 — The Challenge
**This flow already exists.** No new builds needed — just make sure the Certification Hub card links to the appropriate starting point or summary.

**Phase 1 steps (existing pages):**
1. `onboarding.html` — Welcome
2. `sparky.html` — Meet Sparky
3. `spark.html` → `spark-results.html` — Find Your Spark / Spark Statement
4. `audiencetool.html` → `audienceresults.html` — Audience Deep Dive
5. `clarity.html` — Discover Your Breakthrough (3 tool recommendations)
6. `journey-companion.html` — AI Accountability Coach (Clarity/unstuck phase)
7. Choose Your Path → selects DWY → **sets `phase1Complete = true`**

The Phase 1 card in Certification Hub can show a summary/recap of what they completed (Spark Statement, audience, tool recommendation) with a "View" link. No rebuild needed.

---

### Phase 2 — Build Your Lead Magnet
**File:** `public/dwy.html` (keep URL) OR create `public/cert-phase2.html`  
**Access:** Unlocked when `phase1Complete === true`

This page is a **vertical checklist/flow** — each step links to the tool, student returns to check it off. Steps are in order. A "Phase 2 Complete" button appears at the bottom, only clickable once all steps are checked.

**Phase 2 Steps:**

| # | Step Label | Links To | Notes |
|---|-----------|----------|-------|
| 1 | Set Up Creator Hub | `hub-admin.html` → `hub-setup.html` → `hub-launch.html` | First thing DWY students do. Hub is their branded AI tool platform. |
| 2 | Build Your AI Tool | `build-agent.html` | Core tool creation |
| 3 | Generate Prompts | `prompt-generator.html` | Refine tool prompts |
| 4 | Value Mirror | `value-tool.html` | **NEW WIRE.** Confidence builder — validates the tool's value before building the offer. This is the final pre-offer step. Student sees: what their tool does, who it helps, what transformation it creates. Results should display back in this checklist (show a summary card). |
| 5 | Create Content Plan | `social-scheduler.html` (31-Day Planner) | Start building audience while building the tool |
| 6 | Post Ideas | `content-generator.html` | Ungate at launch — see Content Hub section |
| 7 | Record a Video | `quick-recorder.html` | Ungate at launch. Add MP4 conversion link (see fix below) |
| 8 | Build Sales Copy (Opt-In) | `sales-page-builder.html?mode=optin` | **Dual-mode** — see wiring section. Phase 2 = free tool, opt-in copy, price=FREE |
| 9 | Generate Opt-In Funnel | `funnel-generator.html` | Lead page + thank you page for free tool |
| 10 | List in Marketplace (Free) | `marketplace.html` | List free lead magnet tool. Sets `marketplaceFreeListed = true` |
| 11 | Submit for Review | Existing DWY submit form | Submit to Coena for certification check |

**"Phase 2 Complete" Button:**
- Shown at the bottom of the checklist
- Only active when all steps are checked off (or at minimum: steps 1, 2, 4, 8, 9, 10, 11)
- On click: sets `phase2Complete = true`, `phase2CompletedAt = now()`
- Redirect to `cert-hub.html` where Phase 3 is now unlocked

---

### Phase 3 — Launch & Monetize
**File:** `public/launch-kit.html` (renamed from `launch-map.html`)  
**Access:** Unlocked when `phase2Complete === true`  
**UI Label:** "Launch Kit"

This page is the paid offer build + launch sequence.

**Phase 3 Steps:**

| # | Step Label | Links To | Notes |
|---|-----------|----------|-------|
| 1 | Map Your Customer Journey | `journey-builder.html` | Now they have real audience data from Phase 2. Journey Builder uses Phase 2 validation to map the paid offer: lead magnet tool (Phase 2) → paid MVP tool (Phase 3). Fields: `leadMagnetTool` (pre-filled from Phase 2), `mvpTool` (new), `expansionTool` (future). |
| 2 | Sort Your Offers | `offer-sort.html` | Prioritize offer ideas |
| 3 | Build Your Offer | `offer-builder.html` | Define the paid offer structure (challenge / coaching / membership) |
| 4 | Build Your AI Tool (MVP) | `build-agent.html` | Second tool — the one they charge for |
| 5 | Build Sales Copy (Paid) | `sales-page-builder.html?mode=sales` | **Dual-mode** — Phase 3 = paid tool, price=$X, full sales page |
| 6 | Generate Sales Funnel | `funnel-generator.html` | Sales page + checkout + thank you |
| 7 | Build Email Sequence | `email-sequence.html` | Nurture sequence for leads |
| 8 | List MVP in Marketplace | `marketplace.html` | List paid tool. Sets `marketplacePaidListed = true` |
| 9 | Graduate 🎓 | `graduation.html` → `certificate.html` | Sets `phase3Complete = true`. Unlocks Marketplace (full access), Creator Hub, 31-Day Planner. |

---

## Part 5 — Content Hub (New Page)

**File:** `public/content-hub.html`  
**Access:** All members who have chosen a path (DIY or DWY) — available from dashboard  
**Note:** Currently all 4 tools below are admin-gated. **Ungate all of them for members at launch.**

### Content Hub Tools

| Tool | File | Current Status |
|------|------|----------------|
| Post Ideas | `content-generator.html` | Admin-gated → ungate for members |
| Quick Recorder | `quick-recorder.html` | Admin-gated → ungate for members |
| Post Image Maker | `post-image-maker.html` | Admin-gated → ungate for members |
| 31-Day Content Planner | `social-scheduler.html` | Post-grad only → make available to all members |

The Content Hub page is a simple card grid linking to each tool. Clean, one-stop-shop for content creation.

---

## Part 6 — Quick Recorder MP4 Fix

**File:** `public/quick-recorder.html`

Quick Recorder outputs `.webm` files. Most platforms (social media, email platforms, etc.) require `.mp4`. Non-techie users won't know how to convert.

**Fix:** After the file download triggers, display this message:

```html
<div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
  <p class="text-sm text-amber-800">
    Your recording saved as <strong>.webm</strong> — most platforms need MP4.
    <a 
      href="https://cloudconvert.com/webm-to-mp4" 
      target="_blank" 
      rel="noopener noreferrer"
      class="font-semibold underline"
    >
      Convert to MP4 free here →
    </a>
  </p>
</div>
```

CloudConvert is free for standard conversions. Add this immediately after the download button/confirmation, not before.

---

## Part 7 — Data Wiring Details

### Sales Copy Builder — Dual Mode
**File:** `public/sales-page-builder.html`

This tool is used in both Phase 2 (opt-in copy, free tool) and Phase 3 (sales copy, paid tool). It needs to behave differently in each context.

**Implementation:**

Accept a `mode` query parameter:
- `?mode=optin` — Phase 2 context
  - UI label: "Opt-In Page Copy"
  - Price field: defaults to "FREE", field is read-only or hidden
  - Headline prompt: framed around giving away a free tool
  - CTA language: "Get Instant Access" / "Get It Free"
- `?mode=sales` — Phase 3 context (default behavior if no param)
  - UI label: "Sales Page Copy"
  - Price field: editable, user enters their price
  - Headline prompt: framed around paid transformation
  - CTA language: "Join Now" / "Enroll Today"

Link from Phase 2 checklist: `/sales-page-builder.html?mode=optin`  
Link from Phase 3 checklist: `/sales-page-builder.html?mode=sales`

---

### Value Mirror — Output Display in Phase 2

**File:** `public/value-tool.html`

Before wiring, confirm where Value Mirror currently saves its output in Firestore. It likely saves to `value_mirrors/{uid}` or a field in the user doc.

In the Phase 2 checklist, after the student completes Value Mirror and returns, show a summary card:

```
✅ Value Mirror Complete
──────────────────────────────
Your Tool: [tool name]
Who It Helps: [target audience]  
The Transformation: [before → after]
Their Confidence Score: [X/10]
```

Pull this data from whatever Firestore path Value Mirror writes to. If it doesn't write to Firestore yet, add that save logic to value-tool.html.

---

### Journey Builder — Phase 2 Data Pre-Fill in Phase 3

**File:** `public/journey-builder.html`  
**Firestore path:** `journey_maps/{uid}`

In Phase 3 Step 1, the Journey Builder should pre-fill the `leadMagnetTool` field with whatever tool they built in Phase 2. This data comes from the build-agent output (stored in whatever collection build-agent.html writes to — confirm the field name).

The `mvpTool` field is new for Phase 3 — blank, user fills in.  
The `expansionTool` field is a stretch/future tool — optional.

---

### Marketplace — Phased Listing

**File:** `public/marketplace.html`

**Phase 2 listing (free tool):**
- Accessible from Phase 2 checklist Step 10
- User can list their lead magnet tool
- Listing type: Free / Lead Magnet
- Sets `marketplaceFreeListed = true` in `certification_progress/{uid}`

**Phase 3 listing (paid tool) — at graduation:**
- Accessible after graduation
- Full marketplace access unlocks
- Listing type: Paid
- Sets `marketplacePaidListed = true` in `certification_progress/{uid}`

If the marketplace currently has no listing type distinction, add a `listingType` field: `"free"` or `"paid"`. This controls how the tool displays on the public marketplace page.

---

## Part 8 — Admin Courses Hub (Context Only — No Action Needed)

**Page:** `/admin-courses-hub`

This is Coena's admin tool for creating training content. It includes:
- **Courses** (Editor) — create/publish courses, manage visibility
- **Lesson Generator** — generate full lesson packages with Sparky
- **Slide Builder** — build lesson slide images
- **Voice Tool** — generate voiceover audio with ElevenLabs
- **Lesson Projects** — manage lesson projects from script to export
- **Lesson Package** — collect all assets (video, audio, script, slides)

**No action needed for launch.** This is a production tool Coena uses to create certification training content.

**Future consideration:** Each Certification Hub phase could have a linked "Training" section pulling from courses created here. For example: Phase 2 could surface a "Watch: How to Build Your Lead Magnet Tool" video from the Courses library. Not a launch item — flagging for the roadmap.

The member-facing `courses.html` page already shows published courses. Make sure any courses Coena publishes for cert training show up there.

---

## Part 9 — Summary of All New Files to Create

| File | Purpose |
|------|---------|
| `public/cert-hub.html` | Certification Hub — 3-phase progress page with unlock logic |
| `public/content-hub.html` | Content Hub — card grid for Post Ideas, Quick Recorder, Post Image Maker, 31-Day Planner |

That's it. Two new pages. Everything else is wiring, renaming, and ungating.

---

## Part 10 — Build Order (Suggested)

Do these in order to minimize breakage:

1. **Deletes first** — remove `techstack.html`, `journey-map.html`, `journey-map-spec.md` from public/. No links depend on them.
2. **Rename** `launch-map.html` → `launch-kit.html`. Update any internal links.
3. **Firestore schema** — create `certification_progress/{uid}` collection. Seed `phase1Complete = true` for any existing DWY users.
4. **Quick Recorder MP4 fix** — small change, easy win, deploy fast.
5. **Ungate Content Hub tools** — remove admin-gate from `content-generator.html`, `quick-recorder.html`, `post-image-maker.html`, `social-scheduler.html`. Make available to all members.
6. **Sales Copy dual mode** — add `?mode=optin` vs `?mode=sales` logic to `sales-page-builder.html`.
7. **Value Mirror Firestore** — confirm where it saves output. Add save if missing. Wire display into Phase 2 checklist.
8. **Build `cert-hub.html`** — 3-phase card layout with unlock logic reading from `certification_progress/{uid}`.
9. **Build/update Phase 2 page** (evolve `dwy.html`) — vertical checklist, 11 steps, Phase 2 Complete button.
10. **Build/update Phase 3 page** (`launch-kit.html`) — vertical checklist, 9 steps.
11. **Build `content-hub.html`** — simple card grid.
12. **Dashboard updates** — add Certification Hub card, Content Hub card. Update sidebar nav.
13. **Journey Builder pre-fill** — wire Phase 2 lead magnet data into Phase 3 Journey Builder `leadMagnetTool` field.
14. **Marketplace listing types** — add `listingType` field, Phase 2 and graduation wiring.
15. **QA pass** — test full flow: onboarding → Phase 1 complete → Phase 2 unlock → Phase 2 complete → Phase 3 unlock → graduation.

---

## Questions for Coena Before Building

1. **Phase 2 URL** — keep `dwy.html` or create new `cert-phase2.html`? If rename, do you want to redirect the old URL?
2. **Value Mirror Firestore** — Skippy: can you confirm the current save path for value-tool.html output? Coena: do you remember if it was saving to Firestore at all?
3. **Phase 1 backfill** — are there any existing real users (students who went through the challenge already) whose `phase1Complete` needs to be set to true? Or are we clean?
4. **Marketplace listing types** — does the marketplace currently support paid vs free listings, or is everything just listed the same way?
5. **dwy.html submit form** — does the existing Submit for Review form in dwy.html go to `admincertificates.html` for Coena's review? Confirm so we keep that connection in the new Phase 2 page.

---

*Spec written by Cowork. Last updated June 2026. All decisions confirmed with Coena in prior session.*
