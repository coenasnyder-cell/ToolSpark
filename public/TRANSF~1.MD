# Part 1: The Transformation - Chat Instructions
**For: Skippy | Project: ToolSpark | Tool: Discover Your Breakthrough**

> This file covers the chat flow, questions, transition message, and Firestore data model for Part 1 only.
> The journey map (`journeymap.html`) is already built - this routes to it on completion.

---

## Table of Contents

1. [Data to Load at Start](#1-data-to-load-at-start)
2. [Step 1 - Recap Card](#2-step-1---recap-card)
3. [Step 2 - Intro Message](#3-step-2---intro-message)
4. [Step 3 - Five Questions](#4-step-3---five-questions)
5. [Step 4 - Transition Message](#5-step-4---transition-message)
6. [Step 5 - Data to Save](#6-step-5---data-to-save)
7. [Routing](#7-routing)

---

## 1. Data to Load at Start

Load the following from Firestore before anything renders. Never ask the user for information that already exists here.

**From `users/{userId}/sparkProfile/profile`:**

| Field | Used For |
|---|---|
| `name` | Personalizing messages |
| `yourSpark` | AI context |
| `yourEdge` | AI context |
| `theResultYouCouldCreate` | AI context |

**From `users/{userId}/audienceBlueprint/blueprint`:**

| Field | Used For |
|---|---|
| `whoYouHelp` | Recap card |
| `whatTheyreStrugglingWith` | Recap card |
| `theTriggerMoment` | Recap card |
| `whatTheyveAlreadyTried` | AI context |
| `theTransformation` | Recap card |
| `wordsTheyUse` | AI context |

---

## 2. Step 1 - Recap Card

Display this as a card before any questions are asked. Auto-populated from loaded data - the user does not type anything here.

```text
Here's what we already know about your audience and what you do.

You help: [whoYouHelp]
Their struggle: [whatTheyreStrugglingWith]
Their trigger: [theTriggerMoment]
The transformation you create: [theTransformation]
```

**Two chips below the card:**
- `Yes, this sounds right`
- `A few things have shifted`

If `Yes` -> proceed to Step 2.

If `A few things have shifted` -> show inline editable fields for those four values. Changes apply to this session only - do not overwrite the original `audienceBlueprint`. Show a note:

`These changes will be used for this session only.`

After saving -> proceed to Step 2.

---

## 3. Step 2 - Intro Message

After the recap is confirmed, the AI sends this message before the first question:

> Before we map the journey, let's define the destination.
>
> This isn't just about what your customer will have at the end - it's about who they'll become.
>
> - What will they **understand** that they don't today?
> - What will they be able to **do confidently**?
> - What **skills, habits, or mindset** will they have developed by the time they finish?

No input required. This flows directly into Q1.

---

## 4. Step 3 - Five Questions

Open text input for all five questions.

- No chips
- One question at a time
- Keep each question block visually separated
- Use line breaks and bullets so nothing feels run together
- Use what the AI knows about the creator (their spark, audience, niche) to personalize the examples where possible

---

### Q1

- `Category:` Understanding
- `Question:` What's something they stop overthinking because they finally "get it"?
- `Framing:`
  Think about something that used to feel confusing, frustrating, or overwhelming - but now just makes sense.
- `Think about moments like:`
  - Pricing their offer
  - Creating content
  - Marketing
  - Knowing what to do next
- `AI listens for:` the mental shift - the thing that clicks

---

### Q2

- `Category:` Capability
- `Before asking:` Acknowledge Q1 in one sentence first.
- `Question:` What's something your customer can do at the end that would make Present-Day Them say, "No way I could've done that"?
- `Framing:`
  Think about a skill they've mastered - not just the results they've achieved. What are they confidently doing now that would've completely intimidated them when they started?
- `Think about moments like:`
  - Creating content consistently
  - Launching offers
  - Coaching others
  - Solving problems they once avoided
- `AI behavior:`
  If the creator's Q1 answer gives a clear signal, pre-fill the "because they learned X" part of the question to make it easier to complete.
  Example: if they said "pricing," the AI might say: *"Because they finally got clear on pricing, they can now ___."*
- `AI listens for:` a tangible skill or capability - the proof of change

---

### Q3

- `Category:` Wisdom
- `Before asking:` Acknowledge Q2 in one sentence first.
- `Question:` If they could leave one sticky note on Day-One Them's computer before the journey began - what would it say?
- `Think about moments like:`
  - "Start before you're ready."
  - "Progress beats perfection."
  - "You're closer than you think."
- `AI listens for:` the shortcut wisdom - what they wish they knew sooner

---

### Q4

- `Category:` Real-World Change
- `Before asking:` Acknowledge Q3 in one sentence first.
- `Question:` What's the first thing that becomes so normal...they forget it used to feel impossible?
- `Framing:`
  Think about something they used to overthink, avoid, or be afraid of - but now they do it without a second thought.
- `Think about moments like:`
  - Creating content
  - Launching a tool
  - Talking to customers
  - Making sales
- `AI listens for:` the normalized behavior - the deepest signal that transformation is real

---

### Q5

- `Category:` Identity
- `Before asking:` Acknowledge Q4 in one sentence first.
- `Question:` What's the moment they stop saying, "I hope I can do this"... and start saying, "I've got this"?
- `Think about moments like:`
  - They confidently help someone else.
  - They make a decision without second-guessing it.
  - They trust themselves without needing constant reassurance.
- `AI listens for:` the identity shift - the moment self-trust becomes real

---

## 5. Step 4 - Transition Message

After Q5 is answered, the AI sends this before generating results:

> Let me turn everything you've shared into a transformation your future tools, lessons, and marketing can all rally around.

Show a loading state while the AI synthesizes the Transformation Statement.

---

## 6. Step 5 - Data to Save

**Collection:** `users/{userId}/transformationBlueprint/blueprint`

| Field | Source |
|---|---|
| `currentState` | Recap card values (confirmed or session-edited) |
| `finallyGetsIt` | Q1 answer |
| `canNowDo` | Q2 answer |
| `stickyNote` | Q3 answer |
| `secondNature` | Q4 answer |
| `identityShift` | Q5 answer |
| `transformationStatement` | AI-synthesized from all five answers - one paragraph, editable on results page |
| `completedAt` | Timestamp |

---

## 7. Routing

On save -> route to `journeymap.html`
