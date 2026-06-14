# ToolSpark Journey Map — Developer Spec

## Overview

A one-question tool that takes a Certification student's three tool ideas from the Roadmap and maps them into a visual 4-box customer journey. Almost entirely pre-filled from existing Firestore data. Output is a visual map + CTA to the Funnel Generator.

**Route:** `toolspark.co/journey-map`  
**Access:** Certification students only (gate by enrollment status)  
**Placement in sequence:** After Offer Sort, before Funnel Generator

---

## Data Sources

Pull the following from Firestore on page load. Do not ask the student to re-enter anything that already exists.

| Field | Source | Maps to |
|---|---|---|
| Tool 1 name + description | Roadmap → Discover Your Breakthrough → tool they selected to build first | Box 2 (Entry) |
| Tool 2 name + description | Roadmap → Discover Your Breakthrough → second tool idea | Box 3 (Core) |
| Tool 3 name + description | Roadmap → Discover Your Breakthrough → third tool idea | Box 4 (Next) |
| Accessible price | Offer Builder output → Accessible tier | Box 2 price |
| Confident price | Offer Builder output → Confident tier | Box 3 price |
| Premium price | Offer Builder output → Premium tier | Box 4 price |

**If Offer Builder hasn't been completed:** show price ranges as defaults — Box 2: $7–$47, Box 3: $47–$197, Box 4: $197+

**If Roadmap Tool 2 or Tool 3 are empty:** show the box with a dashed border and label "Your next tool — to be decided" with no description.

---

## The One Question

Display the three pre-filled tools in a preview card so the student can see what's already populated. Below that, one question:

> "One question before we map this out — how do people find you right now?"

**Button options (single select):**
- ToolSpark Marketplace
- Social media (Instagram, LinkedIn, etc.)
- Referral / word of mouth
- I don't have traffic yet

This answer populates Box 1 (Discovery).

**If they select "I don't have traffic yet":** Box 1 shows "ToolSpark Marketplace" as the default with a note: "Your Marketplace listing is your starting point — we'll make sure it's live before you send traffic."

---

## Output — The Visual Map

Display a horizontal 4-box map with arrows between each box. On mobile, stack vertically with down arrows.

Journey Map

### Arrows between boxes
Simple right-pointing arrow (→) between each box. Color: muted gold. On mobile: down arrow (↓).

---

## Below the Map

**Callout note** (only show if Box 1 = Marketplace or "I don't have traffic yet"):
> ⚡ Your Marketplace listing is your Box 1. Make sure it's live and complete before you drive traffic to your funnel.

**Save state:** Save the completed journey map to Firestore under the student's profile so it can be referenced by the Funnel Generator.

**Two buttons:**

Primary: `Build your funnel →` — links to `toolspark.co/funnel-generator` (passes journey map data)

Secondary: `Edit` — allows them to manually override any pre-filled field if they want to adjust tool order or descriptions

---

## Edge Cases

**Student hasn't completed the Roadmap:** Block access with a message — "Complete your Roadmap first to unlock the Journey Map. Your three tool ideas live there." Link to `/roadmap`.

**Student hasn't completed the Offer Builder:** Show the map with default price ranges. Add a soft nudge below: "Want real prices in your map? Complete the Offer Builder first." Link to `/offer-builder`.

**Student wants to reorder their tools:** The Edit button lets them drag or reassign which tool goes in which box. The Roadmap order is the default but not locked.

---

## Design Notes

- Match the existing ToolSpark platform aesthetic (dark nav, offwhite background, Georgia serif, gold accents)
- The map itself should be clean enough to screenshot — students will share this
- Box labels in small caps, tool names in larger weight, descriptions in muted smaller text
- Price badges as small gold pill/tag on each box
- Keep the whole page short — intro card + one question + map + buttons. No scrolling needed on desktop.

---

## Data Saved to Firestore on Completion

```
journeyMap: {
  discovery: "[their answer]",
  box2: {
    toolName: "[Tool 1 name]",
    toolDescription: "[Tool 1 description]",
    price: "[Accessible price or default]"
  },
  box3: {
    toolName: "[Tool 2 name]",
    toolDescription: "[Tool 2 description]",
    price: "[Confident price or default]"
  },
  box4: {
    toolName: "[Tool 3 name]",
    toolDescription: "[Tool 3 description]",
    price: "[Premium price or default]"
  },
  completedAt: [timestamp]
}
```

---

## Summary for Developer

1. Gate to Certification students only
2. Pull 3 tool ideas + prices from Firestore on load — pre-fill everything
3. Ask one question: how do they get traffic
4. Render the 4-box visual map
5. Save completed map to Firestore
6. CTA passes data to Funnel Generator
7. Edit button allows manual override of any field
