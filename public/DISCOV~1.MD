# Discover Your Breakthrough — Build Spec
**For: Skippy | Version: 1.0 | Project: ToolSpark**

> This is the build spec for the third tool in the ToolSpark creator journey.
> Do not build anything beyond what is described here. Future features and downstream tools are in a separate roadmap file.

---

## Table of Contents

1. [What This Tool Does](#1-what-this-tool-does)
2. [Files to Create](#2-files-to-create)
3. [Data This Tool Reads](#3-data-this-tool-reads)
4. [Complete User Flow](#4-complete-user-flow)
5. [Screen-by-Screen UX](#5-screen-by-screen-ux)
6. [Conversation Design](#6-conversation-design)
7. [AI Logic](#7-ai-logic)
8. [The Form Phase](#8-the-form-phase)
9. [Results Page](#9-results-page)
10. [Data Model](#10-data-model)
11. [Firestore Structure](#11-firestore-structure)
12. [Validation Rules](#12-validation-rules)
13. [Edge Cases](#13-edge-cases)
14. [Error Handling](#14-error-handling)
15. [Technical Notes](#15-technical-notes)
16. [Design Reference](#16-design-reference)

---

## 1. What This Tool Does

The creator arrives after completing **Find Your Spark** and **Audience Deep Dive**. Those tools already know who they are and who they help. This tool's job is to map the transformation their customer goes through — from painful starting point to desired end result — and turn that into an editable Customer Journey Blueprint.

**The output is not a product. It is not a tool. It is a planning document.**

By the end, the creator has:
- A written Current State (where their customer is now)
- A written Desired Outcome (where the customer wants to get)
- 3–5 named Journey Stages between the two
- A Milestone Card for each stage (what changes, what they learn, what stops them, the emotional shift, what success looks like)
- A set of Common Obstacles across the journey
- An approved Customer Journey Blueprint they feel proud of

---

## 2. Files to Create

```
public/discoverbreakthrough.html   — the main tool (welcome + chat + form)
public/breakthroughresults.html    — the results/blueprint page
```

Follow the same coding patterns as `audiencetool.html` and `audienceresults.html`. Same Firebase setup, same auth pattern, same structure.

---

## 3. Data This Tool Reads

At session start, load the following from Firestore. **Never ask the user for information that already exists here.**

### From `sparkProfile`:
| Field | Used For |
|---|---|
| `name` | Personalizing every message |
| `yourSpark` | AI context, recap card |
| `whatYouKnow` | AI context |
| `theResultYouCouldCreate` | AI context |
| `yourEdge` | AI context, recap card |

### From `audienceBlueprint`:
| Field | Used For |
|---|---|
| `iHelpStatement` | Recap card |
| `whoYouHelp` | Recap card, AI context |
| `whatTheyreStrugglingWith` | Recap card, Current State chat |
| `theTriggerMoment` | AI context, Current State chat |
| `whatTheyveAlreadyTried` | AI context, obstacles |
| `theTransformation` | Recap card, Desired Outcome chat |
| `wordsTheyUse` | AI context, form pre-fill |
| `whereToReachThem` | AI context only |

---

## 4. Complete User Flow

```
Welcome Screen
     ↓
Audience Recap Card  ←  pulled from saved data, confirm or tweak
     ↓
TAB 1: THE TRANSFORMATION
  Chat Phase  →  AI asks 3–4 questions, one at a time
       ↓
  Form Phase  →  Fields appear pre-filled from the conversation
       ↓
  Lock It In  →  Creator confirms, tab 1 marked complete
     ↓
TAB 2: THE JOURNEY
  Chat Phase  →  AI proposes stages, then asks per-stage questions
       ↓
  Form Phase  →  Full journey form appears pre-filled
       ↓
  Lock It In  →  Creator confirms, tab 2 marked complete
     ↓
Results Page  →  Full Blueprint displayed, creator approves
```

The creator never sees a form during the chat phase. The form only appears after the chat is complete. This keeps it feeling like a coaching conversation, not a worksheet.

---

## 5. Screen-by-Screen UX

### 5.1 Welcome Screen

Match the `/clarity` page welcome screen exactly (see Section 16 for design reference).

**Content:**
- Tool chip label: `DISCOVER YOUR BREAKTHROUGH`
- Headline: `Map Your Customer's Journey.`
- Italic gold subheading: `From where they are to where you take them.`
- Body: `You know your spark. You know your audience. Now let's map the exact path you guide them through. This takes about 20 minutes.`
- Mascot (use same character as /clarity) with speech bubble: `"Let's map the transformation you create."`
- Three feature preview cards (matching /clarity layout):
  - `The Transformation ✦` — A clear picture of where your customer starts and where they end up
  - `The Journey ✦` — The stages between before and after, with every milestone mapped
  - `The Blueprint ✦` — A complete, editable plan that becomes the foundation for everything you build
- `Profile loaded:` banner showing Spark + Audience data is ready (same style as /clarity)
- CTA button: `+ Start Mapping →`
- Small text below: `Usually takes about 20 minutes ♥`

---

### 5.2 Audience Recap Card

Shown **before** the first question. This is not a question — it is a confirmation.

**Layout:** White card, centered, full-width within the chat area. Sits where the first AI message would be.

**Content:**
```
Here's what we already know about your audience.
Does this still feel right?

You help: [whoYouHelp]
Their struggle: [whatTheyreStrugglingWith]
Their trigger: [theTriggerMoment]
The transformation you create: [theTransformation — first sentence only]
```

**Two chips below the card:**
- `Yes, this is still accurate`
- `A few things have shifted`

If they pick "Yes" → proceed to Tab 1 chat.

If they pick "A few things have shifted" → show a small inline edit form with those four fields editable. Changes update the session context only — they do not overwrite the original Audience Blueprint. Show a note: *"These changes will be used for this session only."* After saving edits → proceed to Tab 1 chat.

---

### 5.3 Tab Navigation

The two tabs sit at the top of the tool area, below the header progress nav.

```
[ Tab 1: The Transformation ]  [ Tab 2: The Journey ]
```

- Active tab: gold underline, bold text
- Completed tab: checkmark icon + label, muted gold
- Locked tab: greyed out, not clickable until Tab 1 is locked in
- Creator cannot jump to Tab 2 until Tab 1 is confirmed

The top progress nav (matching /clarity's numbered steps) should show:
```
1 RECAP  →  2 THE TRANSFORMATION  →  3 THE JOURNEY  →  ✓ YOUR BLUEPRINT
```

---

### 5.4 Tab 1 Chat Phase — The Transformation

The AI runs a short conversation, one question at a time. The chat UI matches /clarity exactly — mascot on the left, white rounded bubble, chips below when relevant, input at the bottom.

See Section 6 for the exact questions and chips.

When the chat is complete, the AI sends a transition message and the form slides in below the conversation (or replaces it — developer's choice based on what looks cleaner). The chat scrolls up and the form appears.

---

### 5.5 Tab 1 Form Phase — The Transformation

A clean form with labeled fields, all pre-filled by the AI from the conversation. Every field is editable.

**Fields:**

| Field Label | Pre-filled from | Max Length |
|---|---|---|
| **Current State** — Where your customer is right now | CS conversation answers + Audience Blueprint | 500 chars |
| **Their Emotional State** — How they feel at the start | CS-1 answer | 200 chars |
| **What They've Already Tried** | `whatTheyveAlreadyTried` + CS-2 answer | 300 chars |
| **Desired Outcome** — Where they want to end up | DO conversation answers + `theTransformation` | 500 chars |
| **The Identity Shift** — How they want to feel and be seen | DO-2 answer | 200 chars |

**Below the form:**
- Button: `Lock In My Transformation →` (gold, full-width)
- Small text: `You can edit this later from your Blueprint.`

On confirm → save to Firestore, mark Tab 1 complete, unlock Tab 2.

---

### 5.6 Tab 2 Chat Phase — The Journey

Tab 2 opens with the AI proposing 3–5 journey stage names based on the locked Transformation. This is not a question — it is a proposal.

AI message: *"Based on your transformation, here's a first draft of the journey stages. Do these feel right?"*

Stage names display as editable chips/pills inline in the chat bubble. Creator can rename any stage by clicking on it, or type a reply to ask for different names.

Then the AI moves through each stage with a short question set (see Section 6.3).

When all stages are covered, the form slides in.

---

### 5.7 Tab 2 Form Phase — The Journey

One form showing all stages and their milestone data. Each stage is a collapsible card. All fields pre-filled and editable.

**Per Stage Card:**

```
STAGE NAME  [editable inline]
─────────────────────────────────────
What changes at this stage:    [textarea, pre-filled]
What they need to learn:       [textarea, pre-filled]
What usually stops them:       [textarea, pre-filled]
Emotional shift:               [text field, format: Before → After]
What success looks like:       [textarea, pre-filled]
```

**Below all stage cards:**
- **Common Obstacles** section — AI synthesizes 3–5 obstacles from across all the milestone conversations. Displayed as editable cards. Creator can edit, remove, or add obstacles.
- Button: `Approve My Blueprint →` (gold, full-width)

On confirm → save everything to Firestore, set `status: approved`, navigate to Results page.

---

### 5.8 Results Page (`breakthroughresults.html`)

See Section 9 for full details.

---

## 6. Conversation Design

### 6.1 Voice Rules

| Do | Don't |
|---|---|
| Reference what they said earlier | Ask anything already in the Audience Blueprint |
| Keep messages to 2–3 sentences | Use "Great!" / "Amazing!" / "Fantastic!" |
| Explain why you're asking | Say "As an AI..." |
| Frame outputs as drafts | Say "Here is your journey." |
| Be specific to their data | Give generic coaching advice |

### 6.2 Tab 1 Questions — The Transformation

**Opening message (after recap confirmed):**
> *"Let's start with where your customer is right now — before they've found you. I already know they're dealing with [whatTheyreStrugglingWith], but I want to go deeper than the facts."*

---

**CS-1:** `"What does a bad day look like for them — not just the problem, but the feeling?"`

Chips:
- `"They feel like everyone else has figured it out except them"`
- `"They're overwhelmed and don't know where to start"`
- `"They keep starting over and never finish"`
- `"They're exhausted from trying things that don't work"`

**Thin answer follow-up** (trigger if < 15 words or no emotional language):
> *"What's one thing they've said out loud about this — even just a phrase you've heard?"*

---

**CS-2:** `"You mentioned they've already tried [whatTheyveAlreadyTried]. What made that feel like it wasn't working?"`

> Note: Pull from `whatTheyveAlreadyTried`. If that field is empty, ask: *"What have they already tried that hasn't worked?"*

---

**Transition to Desired Outcome:**
> *"You've painted a real picture of where they start. Now let's flip it — where do they want to end up?"*

---

**DO-1:** `"What does life look like on the other side? What has actually changed for them?"`

Chips:
- `"They finally feel like they know what they're doing"`
- `"They've got real results to show for it"`
- `"They feel in control instead of overwhelmed"`
- `"People around them have noticed the change"`

---

**DO-2:** `"How do they want to feel — and how do they want others to see them after this?"`

---

**Closing message before form:**
> *"Got it. Let me put that together into something you can review and edit."*

→ Form slides in.

---

### 6.3 Tab 2 Questions — The Journey

**Opening message:**
> *"Now that we know where they start and where they're going, let's map the road between. Based on what you've shared, here's a first draft of the journey:"*

→ Display proposed stage names as inline editable chips.
→ Ask: `"Do these stages feel right, or would you name them differently?"`

---

**Per-stage questions** (repeat for each stage):

AI opens each stage with:
> *"Let's dig into [STAGE NAME]. At this point your customer has just [brief inference of where they came from]."*

Then asks:

**MS-1:** `"What specifically changes for them in this stage?"`

**MS-2:** `"What do they need to learn or realize to get through it?"`

**MS-3:** `"What usually stops people right here?"`

**MS-4:** `"How do they feel at the start of this stage — and how do they feel when they make it through?"` *(two parts in one question to keep flow)*

Max 4 questions per stage. Do not ask MS-4 as a follow-up — always ask it.

**Thin answer follow-up** for any MS question (trigger if < 10 words):
> *"Can you be a bit more specific — what does that actually look like for them day-to-day?"*

---

**Closing message before form:**
> *"You've mapped every stage of the journey. Let me pull this together into a form you can review and adjust."*

→ Form slides in.

---

### 6.4 Chips

- Chips appear below the AI message, above the input field
- Selecting a chip populates the input field — it does **not** auto-submit
- Creator can edit the chip text before sending
- After selecting a chip, it highlights with a gold border (matching /clarity behavior)
- Not every question has chips — only where suggestions are genuinely useful

---

### 6.5 Stage Name Proposal

AI generates 3–5 stage names as JSON. Display them as inline editable pill chips inside the AI message bubble.

**Stage name rules:**
- 1–3 words each
- Written from the customer's perspective (what they're experiencing, not what the creator is teaching)
- No generic names like "Stage 1" or "Introduction"
- Avoid "Awareness" as the first stage — too vague

**Examples of good stage names:** `Getting Real`, `First Attempt`, `Breaking Through`, `Building Confidence`, `The Result`

Creator can:
- Click any chip to rename it inline
- Type in the chat to ask for completely different names
- Add a stage by typing `"add a stage between X and Y"`

---

## 7. AI Logic

### 7.1 Context Loading

Before the first message is sent, the AI system prompt is preloaded **server-side** with all data from Section 3. The AI never asks for information it already has.

System prompt constant name: `DISCOVER_BREAKTHROUGH_SYSTEM` in `functions/index.js`

### 7.2 System Prompt Constants

Add these constants to `functions/index.js` following the existing pattern of `FIND_YOUR_SPARK_SYSTEM` and `AUDIENCE_SYSTEM`:

| Constant | Used For |
|---|---|
| `DISCOVER_BREAKTHROUGH_SYSTEM` | Main conversation system prompt |
| `CURRENT_STATE_DRAFT_SYSTEM` | Generating the Current State pre-fill |
| `DESIRED_OUTCOME_DRAFT_SYSTEM` | Generating the Desired Outcome pre-fill |
| `STAGE_PROPOSAL_SYSTEM` | Generating 3–5 stage name proposals |
| `MILESTONE_CARD_SYSTEM` | Generating pre-filled milestone card fields (parameterized per stage) |
| `OBSTACLES_SYNTHESIS_SYSTEM` | Synthesizing Common Obstacles from all milestone conversations |

### 7.3 Draft Generation — What Each System Prompt Should Produce

**CURRENT_STATE_DRAFT_SYSTEM** → A 3–5 sentence paragraph in second-person present tense describing the customer's current state. Uses CS-1 and CS-2 answers + `whatTheyreStrugglingWith` + `theTriggerMoment` + `wordsTheyUse`. Begins with emotional state. Includes one behavioral detail. Ends with the feeling that makes them ready to seek help. Max 120 words. No jargon.

**DESIRED_OUTCOME_DRAFT_SYSTEM** → A 3–5 sentence paragraph describing the customer after the journey. Uses DO-1, DO-2 answers + `theTransformation` + `howTheyWantToBeeSeen`. First sentence: functional outcome. Middle: identity shift. Last: what others notice. Max 120 words.

**STAGE_PROPOSAL_SYSTEM** → Returns JSON array:
```json
[
  { "stageName": "string", "stageDescription": "string (1 sentence)" },
  ...
]
```
3–5 items. Stage names 1–3 words. Written from customer's perspective.

**MILESTONE_CARD_SYSTEM** → Returns JSON object for one stage:
```json
{
  "whatChanges": "string (1-2 sentences)",
  "whatTheyLearn": "string (1-2 sentences)",
  "obstacle": "string (1-2 sentences)",
  "emotionalShift": "string (format: 'X → Y')",
  "successMarker": "string (1 sentence)"
}
```

**OBSTACLES_SYNTHESIS_SYSTEM** → Returns JSON array from all milestone data:
```json
[
  {
    "obstacleTitle": "string (3-7 words)",
    "stageTag": "string (stage name)",
    "obstacleType": "Internal | External | Skill Gap",
    "whyItHappens": "string (1 sentence)"
  },
  ...
]
```
3–6 obstacles. Group similar ones. No duplicates.

### 7.4 Temperature Settings

| Generation Type | Temperature |
|---|---|
| Conversation / follow-ups | 0.7 |
| Stage name proposals | 0.7 |
| Structured JSON outputs (milestone cards, obstacles) | 0.4 |
| Draft paragraphs (Current State, Desired Outcome) | 0.6 |

### 7.5 Returning User

If `currentPhase` exists in Firestore and is not `complete`, the user is returning mid-session.

Show as the first message:
> *"Welcome back, [NAME]. You're working on [CURRENT_PHASE_LABEL]. Ready to keep going?"*

Two chips: `Pick up where I left off` / `Start over`

If "Start over" → confirm dialog → archive existing blueprint, create new one.

Resume exactly at the saved phase. Do not re-run completed phases.

---

## 8. The Form Phase

### 8.1 When It Appears

The form appears **after** the chat is complete for each tab. The AI sends a closing message, then the form slides or fades into view below. The chat history remains visible above (scrollable) so the creator can reference what they said.

### 8.2 Form Behavior

- All fields are pre-filled by AI from the conversation
- Every field is editable — click to edit, auto-saves on blur
- No save button — saving is automatic (2-second debounce after last keystroke)
- Show a subtle `Saved ✓` indicator top-right after each save
- Character counts shown on all text areas
- The form does not submit until the creator clicks the confirm button

### 8.3 Editing

- Click any field to edit inline
- `Tab` moves to the next field
- `Escape` cancels edit and reverts to last saved value
- If a field is left empty and the creator tries to confirm, highlight empty fields with a red outline and show: *"Fill in all fields before locking in."*

---

## 9. Results Page

### 9.1 Layout

Full-page layout. Header matches the tool (dark bar, ToolSpark wordmark). No tab nav on this page.

**Page title:** `Your Customer Journey Blueprint`
**Subheading:** `Everything mapped. Review it, edit anything, and approve when it's ready.`

### 9.2 Sections

Display each section as a white card with a section label and an `Edit` button in the top-right corner of each card.

| Section | Data Source |
|---|---|
| Your I Help Statement | `iHelpStatement` from Audience Blueprint |
| Current State | `currentStateDraft` from Journey Blueprint |
| Desired Outcome | `desiredOutcomeDraft` from Journey Blueprint |
| The Journey | `stages[]` — displayed as a horizontal visual flow |
| Milestone Cards | `milestones{}` — one expandable card per stage |
| Common Obstacles | `obstacles[]` — list of obstacle cards |

### 9.3 Edit Behavior

Clicking `Edit` on any card expands it inline — no page navigation, no modal.

- Text becomes editable
- `Save` and `Cancel` buttons appear
- On save → update Firestore, show `Saved ✓`
- Edits to data that originated from the Audience Blueprint update the Journey Blueprint only — they do not overwrite the original Audience Blueprint
- A subtle `Edited` badge appears on any card the creator has manually changed

### 9.4 Journey Visual

Display the stages as a horizontal flow:

```
[ Stage 1 ] → [ Stage 2 ] → [ Stage 3 ] → [ Stage 4 ] → [ Stage 5 ]
```

Each stage is a card with the stage name. Clicking a stage card expands the milestone details below. On mobile, display vertically.

### 9.5 Approve Button

Large gold button at the bottom: `Approve My Blueprint →`

**Validation before showing it as active** — all of these must be true:
- `currentStateDraftConfirmed === true`
- `desiredOutcomeDraftConfirmed === true`
- `stages.length >= 3`
- All milestones have `confirmed === true`
- `obstacles.length >= 1`

If any condition is unmet → button is disabled with tooltip listing what's missing. Clicking the disabled button shows a checklist of incomplete items with links to each section.

**On approve:**
1. Show confirmation: *"Ready to lock this in? You can always edit your Blueprint later."* — `[Yes, Approve It]` / `[Not Yet]`
2. Set `journeyBlueprint.status = 'approved'`
3. Set `journeyBlueprint.approvedAt = timestamp`
4. Show completion state on the page — celebration moment, not a new screen
5. Show: *"[NAME], your Customer Journey Blueprint is complete."*
6. Show next step prompt: `"Ready to design your offer? →"` (link to next tool when it exists — for now just save the approved state and leave them on this page)

---

## 10. Data Model

### 10.1 Top-Level Blueprint Document

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | string | Yes | Firebase Auth UID |
| `createdAt` | timestamp | Yes | Server timestamp |
| `updatedAt` | timestamp | Yes | Updated on every save |
| `status` | string | Yes | `'in_progress'` or `'approved'` |
| `approvedAt` | timestamp | No | Set on approval |
| `currentPhase` | string | Yes | Current phase name from state machine |
| `completedPhases` | array | Yes | List of completed phase names |

### 10.2 Current State

| Field | Type | Notes |
|---|---|---|
| `currentStateDraft` | string | AI-generated, max 500 chars |
| `currentStateDraftConfirmed` | boolean | True when Tab 1 locked in |
| `currentStateEdited` | boolean | True if manually edited |
| `emotionalState` | string | From form field, max 200 chars |
| `whatTheyveTriedEdited` | string | From form field — session version |

### 10.3 Desired Outcome

| Field | Type | Notes |
|---|---|---|
| `desiredOutcomeDraft` | string | AI-generated, max 500 chars |
| `desiredOutcomeDraftConfirmed` | boolean | True when Tab 1 locked in |
| `desiredOutcomeEdited` | boolean | True if manually edited |
| `identityShift` | string | From form field, max 200 chars |

### 10.4 Stages Array

| Field | Type | Notes |
|---|---|---|
| `stages` | array | Ordered array of Stage objects |
| `stages[].stageId` | string | UUID, generated client-side |
| `stages[].stageIndex` | number | 0-based order |
| `stages[].stageName` | string | 1–30 chars |
| `stages[].stageDescription` | string | AI-generated 1-sentence description |
| `stages[].aiProposed` | boolean | True if AI named it |

### 10.5 Milestones Map

Keyed by `stageId`.

| Field | Type | Notes |
|---|---|---|
| `milestones[stageId].whatChanges` | string | Max 300 chars |
| `milestones[stageId].whatTheyLearn` | string | Max 300 chars |
| `milestones[stageId].obstacle` | string | Max 300 chars |
| `milestones[stageId].emotionalShift` | string | Format: `X → Y`, max 60 chars |
| `milestones[stageId].successMarker` | string | Max 200 chars |
| `milestones[stageId].confirmed` | boolean | True when creator confirms this card |
| `milestones[stageId].edited` | boolean | True if any field was manually edited |

### 10.6 Obstacles Array

| Field | Type | Notes |
|---|---|---|
| `obstacles[].obstacleId` | string | UUID |
| `obstacles[].obstacleTitle` | string | 3–7 words, max 60 chars |
| `obstacles[].stageTag` | string | Stage name(s) this appears in |
| `obstacles[].obstacleType` | string | `'Internal'` / `'External'` / `'Skill Gap'` |
| `obstacles[].whyItHappens` | string | 1 sentence, max 200 chars |
| `obstacles[].aiProposed` | boolean | |
| `obstacles[].creatorAdded` | boolean | True if creator added manually |

---

## 11. Firestore Structure

```
users/
  {userId}/
    sparkProfile/
      profile                 ← READ ONLY from this tool
    audienceBlueprint/
      blueprint               ← READ ONLY from this tool
    journeyBlueprint/
      blueprint               ← WRITE — main document for this tool
        conversations/        ← subcollection
          tab1_transformation
          tab2_journey_stage_0
          tab2_journey_stage_1
          tab2_journey_stage_2
          ...
```

### Document: `journeyBlueprint/blueprint`

Contains all fields from Section 10. Keep stages, milestones, and obstacles in this single document — do not split into subcollections. Total data per user is well under Firestore's 1MB document limit.

### Subcollection: `conversations/{phaseId}`

One document per conversation phase. Fields:
```
phaseId: string
messages: array<{ role: 'user'|'ai', content: string, timestamp: Timestamp }>
status: 'in_progress' | 'complete'
completedAt: Timestamp
```

Keeps the main document lean. Full conversation history preserved for AI context on regeneration.

### Security Rules

- Users can only read/write their own documents: `request.auth.uid == userId`
- `sparkProfile` and `audienceBlueprint`: read-only from this tool
- `journeyBlueprint`: read + write for the authenticated user
- `status = 'approved'` should be set via a Cloud Function to stamp `approvedAt` server-side

---

## 12. Validation Rules

### Conversation Input
| Rule | Behavior |
|---|---|
| Min 10 characters | Send button disabled below 10 chars. Hint: *"Say a bit more — even a few words help"* |
| Max 800 characters | Character counter appears at 600. Hard stop at 800. |
| Empty submit | Send button disabled |

### Stage Names
| Rule | Behavior |
|---|---|
| Min 1 character | Cannot save blank stage name |
| Max 30 characters | Hard stop with counter |
| Min 3 stages | Cannot proceed with fewer. Warn if trying to delete below 3. |
| Max 6 stages | Block adding a 7th. Show: *"Most powerful journeys have 5 or fewer stages."* |
| Duplicate names | Warn but allow: *"Two stages have the same name — is that intentional?"* |

### Milestone Card Fields
| Field | Rule |
|---|---|
| `whatChanges` | 1–300 chars. Cannot confirm if empty. |
| `whatTheyLearn` | 1–300 chars. Cannot confirm if empty. |
| `obstacle` | 1–300 chars. Cannot confirm if empty. |
| `emotionalShift` | Must match `[text] → [text]`. Error: *"Use the format: Start feeling → End feeling"* |
| `successMarker` | 1–200 chars. Cannot confirm if empty. |

### Thin Answer Detection
Trigger a follow-up question if the creator's answer meets 2+ of these:
- Under 15 words
- Contains only generic phrases (`struggle`, `hard`, `difficult`, `don't know`) with no specific context
- No emotional vocabulary (no feeling words)
- No named specifics (no role names, behaviors, industry terms)

Only one follow-up per question. Accept and move on after that regardless of the answer.

---

## 13. Edge Cases

| Situation | Handling |
|---|---|
| No Spark Profile | Block entry. Show: *"Start with Find Your Spark first."* with link. |
| No Audience Blueprint | Warn but allow. Yellow banner: *"You haven't completed Audience Deep Dive yet — some questions may feel less personalized."* |
| Creator wants to start over | Confirm dialog. Archive existing blueprint (`status: 'archived'`). Create new one. |
| Creator reorders stages after milestones complete | Milestone data follows `stageId` not index. Update `stageIndex` values. Warn: *"Reordering stages won't affect your milestone content."* |
| Creator deletes a stage with a completed milestone | Confirm: *"Deleting [STAGE NAME] will also remove its milestone card."* If confirmed, soft-delete both (`deleted: true`). |
| Firestore offline | Use Firestore offline persistence. Show banner: *"You're offline — changes will sync when you reconnect."* |
| Session timeout | Auto-save means no data is lost. On return, detect incomplete phase and offer to resume. |
| AI returns empty content | Retry once silently. If still empty: *"That didn't come through — [Try again]"* |
| AI returns malformed JSON | Retry once with explicit JSON formatting instruction. If second attempt fails, return error to frontend. |
| Creator pastes very long text (>800 chars) | Truncate with notice: *"We trimmed that to keep things focused."* |

---

## 14. Error Handling

### AI API Errors
| Error | User Message |
|---|---|
| Timeout > 15s | Spinner to 15s, then: *"Taking longer than expected — still working on it."* Retry once. If fails: *"Something went wrong. [Try again]"* |
| API 500/503 | *"Ran into a hiccup. [Try again]"* — if 3 failures: *"Our AI is having a moment. Try refreshing — your progress is saved."* |
| Content policy rejection | *"I wasn't able to generate that. Try rephrasing or [edit it manually]."* |

### Firestore Errors
| Error | User Message |
|---|---|
| Permission denied | *"Something's wrong with your session. Try signing out and back in."* Log error + userId. |
| Network offline | Persist locally, banner: *"You're offline — changes will sync when you reconnect."* |
| Write failure | Toast: *"Couldn't save — we'll try again."* Retry with exponential backoff. |

### Form Errors
| Error | User Message |
|---|---|
| Empty field on confirm | Highlight with red outline. Toast: *"Fill in all sections before locking in."* |
| Wrong emotional shift format | Inline error below field: *"Use the format: How they feel → How they feel at the end"* |
| Blueprint approval with missing sections | Disabled button shows tooltip. On click shows checklist modal. |

---

## 15. Technical Notes

### Auto-Save
- Fires on every edit, debounced 2 seconds after last keystroke
- Optimistic UI: update local state immediately, persist to Firestore in background
- `Saved ✓` indicator top-right, fades after 3 seconds
- No manual save button anywhere in the tool

### Conversation History
When sending milestone conversations to AI for card generation, trim to last 10 messages — the card generation prompt doesn't need the full history, just the structured answers.

### Stage Reordering
Update all `stageIndex` values in a Firestore **batch write** to prevent partial updates.

### JSON Parsing
Wrap all structured AI output parsing in try/catch. On parse failure, retry once with an explicit JSON format reminder added to the system prompt. If second attempt fails, return error to frontend.

### Analytics Events to Fire
```
breakthrough_started
recap_confirmed
recap_edited
tab1_chat_complete
tab1_form_complete
tab1_locked_in
tab2_chat_complete
tab2_form_complete
blueprint_approved
```

---

## 16. Design Reference
Use clarity threme 
### Match This Page
The `/clarity` page at `toolspark.co/clarity` is the **direct visual template** for this tool. Match it exactly — same layout, same component patterns, same header, same chat UI. This is an evolution of that page, not a redesign from scratch.

Also reference `/spark` at `toolspark.co/spark` for the welcome screen layout and feature preview cards.

### Color Palette
| Name | Hex | Used For |
|---|---|---|
| Cream | `#F2EDE3` | Page background |
| White | `#FFFFFF` | Cards, chat bubbles, input fields |
| Warm Beige | `#EDE8DC` | Feature preview section background |
| Gold / Amber | `#B8960A` | Headlines italic, CTA button, active tabs, chips (selected), ✦ symbols, section labels |
| Dark Charcoal | `#1A1714` | Primary text |
| Medium Gray | `#6B6560` | Secondary text, placeholders |
| Red (errors) | `#DC2626` | Validation errors only |

### Typography
| Use | Style |
|---|---|
| Main headline | Bold serif — match the Playfair Display or equivalent used on `/spark` |
| Italic accent line (gold) | Same serif, italic, gold color |
| Body text | Clean sans-serif, same as existing tools |
| Small labels / chips | Uppercase, letter-spaced, small |
| Handwriting accent | Script font (e.g., "Usually takes about 20 minutes ♥") — match `/clarity` |

### Key Components (all match `/clarity`)
- **Header bar:** Dark charcoal, ToolSpark wordmark centered, tool name in gold beneath it
- **Progress nav:** Numbered circles connected by thin gold lines. Active = gold circle. Complete = checkmark. Future = grey circle. Labels in small uppercase.
- **Chat bubble:** White, large rounded corners, generous padding. Mascot character left-aligned at the top.
- **Chips:** Pill shape, thin border. Default = thin dark border. Selected/hover = gold border, slight warm fill.
- **Input field:** Wide, pill-shaped, `Type your answer...` placeholder. Gold send button `►` right edge.
- **CTA button:** Gold background, rounded, `+ Label →` format, bold sans-serif.
- **Section pill label:** Small, uppercase, thin border, rounded — e.g., `DISCOVER YOUR BREAKTHROUGH`
- **`+` decorators:** Small gold plus signs appear in corners of sections (decorative, match `/spark` and `/clarity`)

### Mascot
Use the same mascot character as `/clarity` (the character in the dark outfit with glasses). The mascot sits to the left of the first AI message bubble. Keep it small (same size as on `/clarity`). Do not resize or reposition it differently.

### Styling Assistance
Before writing any CSS or styling code, look in the **skills folder** for a skill called **`theme-factory`**. It may help with theming. The skill commands don't work directly — you need to locate it in the skills directory and read the instructions there.

**If you can't find it, ask Coena where it is before writing any styling code. Do not guess at styles — Coena has strong design standards and the existing pages are the reference.**

Do not use the `toolspark-tool-styling` skill.

---

*End of spec. Questions about anything here → ask Coena before building.*
