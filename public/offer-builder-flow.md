# ToolSpark Offer Builder — Conversation Flow

## Design Principle
People freeze on pricing because they price based on what it cost them to build, not what the outcome is worth to the buyer. Every question in this flow is designed to surface buyer value, not builder effort.

If the student completed the roadmap, pre-fill their tool name, audience, and transformation from their Selected Direction and Spark Statement so they don't repeat themselves.

---

## The Flow (6 Questions)

---

### Opening (auto-filled from roadmap if available)

> "You built **[Tool Name]** for **[Audience]**. Let's figure out what to charge for it — and more importantly, how to say the price out loud without wincing."

If no roadmap data: ask them to name their tool and describe their audience in one line first.

---

### Question 1 — The Transformation

**Ask:**
> "In one sentence — what can someone DO after using your tool that they couldn't easily do before?"

**Good answer looks like:**
"They can identify their ideal client in 20 minutes instead of spending weeks overthinking it."

**What to extract:**
- The outcome category: clarity / time saved / money made / confidence / access to something previously gated
- A rough transformation statement for the output

**If they answer with features ("it has 5 questions and a PDF output") — push back:**
> "That's what it has — I need what it does for the person using it. What changes for them after they use it?"

---

### Question 2 — Time & Effort Replaced

**Ask:**
> "How long would it take your buyer to get this same result WITHOUT your tool — using their own time and energy?"

**Options (chat buttons or free text):**
- Under 30 minutes (they could probably do it themselves quickly)
- 1–3 hours of real focused work
- A full day or more of research and thinking
- They probably couldn't get there alone — they'd stay stuck

**What to extract:**
This sets the value floor. "Half a day of a consultant's time at $150/hr = $600 in value. Your tool at $97 is a 6x deal."

---

### Question 3 — Buyer Context

**Ask:**
> "Who's your most likely buyer right now? Pick the one that fits best."

**Options:**
- Early-stage coach or solopreneur (just getting started, budget is tight, under $3K/month)
- Established service provider (has clients, makes $3K–$10K/month, more willing to invest)
- Small business owner (has a team, less price-sensitive, values their time)
- I genuinely don't know yet

**What to extract:**
Price ceiling. A $47 tool is a no-brainer for an established consultant. For an early-stage solopreneur, $47 might feel like a lot. This changes the confident price tier.

---

### Question 4 — How They Use It

**Ask:**
> "How does someone actually use your tool — and how often?"

**Options:**
- Once to get a specific result, then they're done (→ one-time purchase)
- They come back to it regularly or use it with multiple clients (→ subscription worth considering)
- It's part of a bigger offer — they use it as a bonus or intake tool (→ add-on, not standalone)
- They use it completely on their own, no involvement from me (→ standalone product)

**What to extract:**
Format recommendation. One-time vs. monthly vs. bundled.

---

### Question 5 — The Comparables Check

**Ask:**
> "If someone wanted this result WITHOUT your tool, what would they actually do — and what would it cost them?"

**Examples to prompt them:**
- Hire a coach or consultant for a session ($150–$300/hr)
- Buy a course ($97–$997)
- Spend hours Googling and still not feel confident
- Just skip it and stay stuck (the real cost = inaction)

**What to extract:**
The anchor number. If the alternative costs $300 and takes 3 hours, $97 is suddenly easy to defend. If the alternative is free but painful, frame around time and confidence instead.

---

### Question 6 — Proof Level

**Ask:**
> "Where are you right now with proof? Be honest — this changes the recommendation."

**Options:**
- No testimonials yet, launching cold
- I have 1–3 beta users or early results I can reference
- I have real testimonials or case studies
- I am the case study (I've done this for myself)

**What to extract:**
Which price tier to lead with. No proof = start accessible. Strong proof = go confident or premium.

---

## Output

---

### What the output card shows:

---

**Your tool:** [Tool Name]
**Your buyer:** [Audience]
**The transformation:** [One-line outcome from Q1]
**Value vs. alternative:** [From Q5 — e.g., "replaces a $200 coaching session"]
**Format:** [One-time / Monthly / Add-on — from Q4]
**Proof level:** [Cold / Early / Established — from Q6]

---

### Your Three Prices

**🟡 Accessible — $[X]**
Use this if you're launching cold with no testimonials. It lowers the barrier to yes and gets you your first buyers and proof. Don't stay here long.

**⚡ Confident — $[X]**
This is your real price. It reflects the value of what you built and doesn't undersell the transformation. Use this once you have 2–3 people who've used it.

**🏅 Premium — $[X]**
When you have real results and testimonials, this is where you go. It signals that this isn't a guess — it's a proven thing with a track record.

---

### The sentence that justifies your price:

> "[Tool Name] helps [audience] [transformation] — without [alternative pain/cost/time]. For [buyer type] who would otherwise [comparables from Q5], [price] is a straightforward decision."

**Example:**
"The Clarity Compass helps coaches identify their ideal client in under 30 minutes — without spending weeks overthinking or paying for a $300 strategy session. For early-stage coaches who'd otherwise stay stuck or hire a consultant, $47 is a straightforward decision."

---

### Your format recommendation:

One sentence explaining why one-time or monthly fits their specific situation based on Q4.

---

## Pricing Logic (for the AI prompt)

Use this to calculate the three tiers:

| Situation | Accessible | Confident | Premium |
|---|---|---|---|
| Replaces < 1hr of work, early-stage buyer | $7–$17 | $27–$47 | $67–$97 |
| Replaces 1–3hrs, established buyer | $27–$47 | $67–$97 | $147–$197 |
| Replaces half day+, any buyer | $47–$97 | $97–$197 | $297–$497 |
| No proof yet | Drop one tier | Lead here | Don't use yet |
| Strong proof/testimonials | Can skip | Lead here | Push here |

---

## Notes for Building

- Pre-fill from roadmap wherever possible — don't make them repeat what they already said
- Chat-style intake (like the onboarding) fits better than a form for this audience
- The "sentence that justifies your price" is the most important output — most people can pick a number but freeze when asked to say why
- Add a "copy this" button to the justification sentence so they can drop it straight into their sales page
- Consider connecting the output directly to the sales page builder — "Ready to build your sales page around this price? →"
