# Discover Your Breakthrough V2 Spec
**Page:** `public/discoverbreakthrough.html`  
**Purpose:** Help the creator define the destination of their customer's transformation, then hand that cleanly into `journeymap.html`.

> This is the implementation spec for the rebuild of `discoverbreakthrough.html`.
> It replaces the old two-tab conversation model.

---

## 1. Core Goal

This page should do four things well:

1. Load what we already know from Spark and Audience.
2. Avoid re-asking for the customer's current state unless something has changed.
3. Help the creator define the destination of the transformation through a short, meaningful conversation.
4. Generate an editable transformation result that feeds directly into `journeymap.html`.

This page is **not** the journey mapping tool.
It is the transformation-definition tool that prepares the inputs for journey mapping.

---

## 2. Architecture Decisions

### Use the current live collections

Do **not** build this around nested user subcollection paths like:

- `users/{userId}/sparkProfile/profile`
- `users/{userId}/audienceBlueprint/blueprint`
- `users/{userId}/transformationBlueprint/blueprint`

Instead, use the same live data-loading strategy already used in the app:

- Spark source:
  - `spark_results`
  - fallback: `spark_profiles`
- Audience source:
  - `audience_results`
  - fallback: `audience_tool`
- Transformation/session save target:
  - `journey_sessions/{uid}`

This keeps the new flow compatible with:

- `journeymap.html`
- `journeyresults.html`
- any downstream tools already reading transformation fields from `journey_sessions`

---

## 3. Data To Load

Load this before rendering the page.

### Spark

Use the same latest-doc lookup strategy already in the app.

Normalize these fields for use on the page:

- `name`
- `statement` or `sparkStatement` or `yourSpark`
- `whatYouKnow` or `expertise`
- `yourEdge` or `resultYouCreate`

### Audience

Use the same latest-doc lookup strategy already in the app.

Normalize these fields for use on the page:

- `whoYouHelp`
- `whatTheyreStrugglingWith`
- `theTriggerMoment`
- `theTransformation`
- `whatTheyveAlreadyTried`
- `wordsTheyUse`
- `yourIHelpStatement`

### Existing transformation session

Load `journey_sessions/{uid}` if it exists.

This allows:

- resume behavior
- prefilling review fields
- preserving prior work without reopening the old Tab 2 model

---

## 4. Page Flow

The v2 page flow should be:

1. `Recap Card`
2. `Intro Message`
3. `Five-question transformation chat`
4. `Generate editable transformation results`
5. `Lock in and continue to Journey Map`

There is no Tab 2 conversation on this page anymore.

---

## 5. Step 1 - Recap Card

Show a recap card before any questions.

### Card content

```text
Here's what we already know about your audience and what you do.

You help: [whoYouHelp]
Their struggle: [whatTheyreStrugglingWith]
Their trigger: [theTriggerMoment]
The transformation you create: [theTransformation]
```

### Chips

- `Yes, this sounds right`
- `A few things have shifted`

### If "Yes, this sounds right"

Proceed directly to the intro message.

### If "A few things have shifted"

Show inline editable fields for:

- `whoYouHelp`
- `whatTheyreStrugglingWith`
- `theTriggerMoment`
- `theTransformation`

Important:

- These edits are **session-only**
- Do **not** overwrite the source Audience document
- Use these session-edited values everywhere else in this transformation session

Show this note:

`These changes will be used for this session only.`

---

## 6. Step 2 - Intro Message

After recap confirmation, show:

> Before we map the journey, let's define the destination.
>
> This isn't just about what your customer will have at the end - it's about who they'll become.
>
> - What will they understand that they do not today?
> - What will they be able to do confidently?
> - What skills, habits, or mindset will they have developed by the time they finish?

No input required here.
Flow directly into Q1.

---

## 7. Step 3 - Five Questions

### General rules

- One question at a time
- Open text input only
- No chips for the questions
- Acknowledge the previous answer in one sentence before the next question
- Keep each question visually separated
- Use bullets and line breaks in the question copy so nothing feels run together
- Use Spark + Audience context to personalize examples where helpful
- If an answer is thin or vague, ask one short follow-up before moving on

### Q1 - Understanding

- `Question:` What's something they stop overthinking because they finally "get it"?
- `Framing:`
  Think about something that used to feel confusing, frustrating, or overwhelming - but now just makes sense.
- `Think about moments like:`
  - Pricing their offer
  - Creating content
  - Marketing
  - Knowing what to do next
- `AI listens for:` the mental shift - the thing that clicks

### Q2 - Capability

- `Question:` What's something your customer can do at the end that would make Present-Day Them say, "No way I could've done that"?
- `Framing:`
  Think about a skill they've mastered - not just the results they've achieved.
- `Think about moments like:`
  - Creating content consistently
  - Launching offers
  - Coaching others
  - Solving problems they once avoided
- `AI behavior:`
  If Q1 gives a clear signal, use it to tee up Q2 naturally.
- `AI listens for:` a tangible capability - the proof of change

### Q3 - Wisdom

- `Question:` If they could leave one sticky note on Day-One Them's computer before the journey began - what would it say?
- `Think about moments like:`
  - "Start before you're ready."
  - "Progress beats perfection."
  - "You're closer than you think."
- `AI listens for:` the shortcut wisdom - what they wish they knew sooner

### Q4 - Real-World Change

- `Question:` What's the first thing that becomes so normal...they forget it used to feel impossible?
- `Framing:`
  Think about something they used to overthink, avoid, or be afraid of - but now they do it without a second thought.
- `Think about moments like:`
  - Creating content
  - Launching a tool
  - Talking to customers
  - Making sales
- `AI listens for:` the normalized behavior - the deepest signal that the transformation is real

### Q5 - Identity

- `Question:` What's the moment they stop saying, "I hope I can do this"... and start saying, "I've got this"?
- `Think about moments like:`
  - They confidently help someone else
  - They make a decision without second-guessing it
  - They trust themselves without needing constant reassurance
- `AI listens for:` the identity shift - the moment self-trust becomes real

---

## 8. Step 4 - Generate Editable Results

After Q5, do **not** immediately route away.

First generate an editable results state on the same page.

### Transition message

Show:

> Let me turn everything you've shared into a transformation your future tools, lessons, and marketing can all rally around.

Then show a loading state while AI synthesizes the result.

### Results should be editable

Render an editable review panel with these sections:

1. `Current State`
2. `What Finally Clicks`
3. `What They Can Do Now`
4. `Sticky-Note Wisdom`
5. `What Becomes Second Nature`
6. `Identity Shift`
7. `Transformation Statement`

### Why this matters

The creator should be able to refine the output before moving into journey mapping.

This is the point where we turn a good conversation into a clean asset.

---

## 9. Results Content Rules

### Current State

This should be generated from:

- session recap values
- `whatTheyreStrugglingWith`
- `theTriggerMoment`
- `whatTheyveAlreadyTried`

It should be editable.

### Transformation Statement

This is the main synthesis output.

It should:

- feel warm and specific
- reflect both external and internal change
- include destination, confidence, and identity
- be useful later in:
  - journey mapping
  - offer positioning
  - messaging
  - copy

### Tone

The result should feel:

- clear
- encouraging
- real
- self-revealing

It should **not** sound:

- corporate
- vague
- like coaching fluff
- like generic AI filler

---

## 10. Save Model

Save to:

- `journey_sessions/{uid}`

This is the authoritative saved transformation session for downstream tools.

### Required compatibility fields

These fields should continue to exist because `journeymap.html` already reads them:

- `currentStateDraft`
- `emotionalState`
- `whatTheyveTriedEdited`
- `desiredOutcomeDraft`
- `identityShift`

### New v2 fields to save

- `userId`
- `name`
- `whoYouHelp`
- `whatTheyreStrugglingWith`
- `theTriggerMoment`
- `theTransformation`
- `yourIHelpStatement`
- `finallyGetsIt`
- `canNowDo`
- `stickyNote`
- `secondNature`
- `identityShift`
- `transformationStatement`
- `currentStateDraft`
- `emotionalState`
- `whatTheyveTriedEdited`
- `desiredOutcomeDraft`
- `currentStateEdited`
- `resultsReviewed`
- `currentPhase`
- `status`
- `updatedAt`

### Field meanings

- `currentStateDraft`
  - a clean editable summary of where they are now
- `emotionalState`
  - how they feel at the start of the transformation
- `whatTheyveTriedEdited`
  - the best current version of what they have already tried
- `desiredOutcomeDraft`
  - the best clear summary of where they want to be
- `identityShift`
  - the self-trust / identity turning point from Q5
- `transformationStatement`
  - the polished synthesis paragraph

### Suggested phase values

- `recap`
- `chat`
- `review`
- `completed`

Use these instead of resurrecting:

- `tab1_chat`
- `tab1_form`
- `tab2_chat`
- `tab2_form`
- `blueprint`

---

## 11. Routing

### Before lock-in

Stay on `discoverbreakthrough.html` while the creator reviews and edits the result.

### On lock-in

After the creator confirms the editable transformation result:

1. save the final transformation state into `journey_sessions/{uid}`
2. mark the transformation step complete
3. route to `journeymap.html`

---

## 12. Non-Goals

This page should not:

- rebuild the old two-tab experience
- ask multi-stage journey questions
- store transformation output in a separate parallel data model
- overwrite source Audience documents when the creator makes temporary recap edits
- skip the editable transformation review step

---

## 13. Build Notes

When rebuilding `discoverbreakthrough.html`, prefer:

- reusing the existing latest-doc loading helpers for Spark and Audience
- reusing `journey_sessions/{uid}` as the save target
- deleting or bypassing old Tab 2 logic entirely
- keeping the UI focused on one clean flow instead of legacy branching

This should feel like:

- recap
- destination
- synthesis
- review
- continue

Not like:

- tab 1
- tab 2
- hidden draft systems
- unfinished blueprint placeholders

---

## 14. Roadmap Pull Contract

Before removing or simplifying any results-page UI, keep this data contract documented for the future roadmap experience.

### A. Transformation source

The roadmap flow should continue pulling the transformation foundation from:

- `journey_sessions/{uid}`

Minimum fields to preserve:

- `currentStateDraft`
- `desiredOutcomeDraft`
- `identityShift`

Useful supporting fields to preserve:

- `emotionalState`
- `whatTheyveTriedEdited`
- `finallyGetsIt`
- `canNowDo`
- `stickyNote`
- `secondNature`
- `transformationStatement`
- `yourIHelpStatement`

### B. Journey map source

The roadmap flow should continue pulling the mapped customer journey from:

- `journey_maps/{uid}`

Primary fields for the visual roadmap:

- `journeyTitle`
- `journeySummary`
- `transformation.from`
- `transformation.to`
- `transformation.identityShift`
- `journeyStages`

Each `journeyStages[]` item should keep:

- `stageOrder`
- `stageName`
- `whatThisStageFeelsLike`
- `whatTheyNeedNow`
- `obstacleToOvercome`
- `toolOpportunity`

### C. What the lightweight results page can show

If `journeyresults.html` becomes a lighter preview instead of a full report, it only needs:

- `transformation.from`
- `transformation.to`
- `transformation.identityShift`
- `journeyStages[].stageName`
- `journeyStages[].whatThisStageFeelsLike`
- `journeyStages[].whatTheyNeedNow`

This means the results page can safely stop rendering:

- standalone obstacles
- standalone tool opportunities
- long narrative blocks

while still preserving the deeper roadmap data for later.

### D. What the future roadmap page can show

The future roadmap page can pull the fuller stage-level structure:

- `stageName`
- `whatThisStageFeelsLike`
- `whatTheyNeedNow`
- `obstacleToOvercome`
- `toolOpportunity`

Recommended presentation:

- results page = simple visual map
- roadmap page = fuller strategic breakdown

### E. Legacy compatibility fields to keep for now

These can stay in `journey_maps/{uid}` until downstream pages are rebuilt:

- `customerStartingPoint`
- `desiredTransformation`
- `leadMagnetTool`
- `mvpTool`
- `expansionTool`
- `journeyNarrative`

These are compatibility fields, not the preferred long-term roadmap rendering model.
