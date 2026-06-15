What we're building

A new agent page that generates a 5-email nurture sequence from existing Firestore data. No re-entry of information. Output is copy-paste email cards. Follows the same pattern as the Funnel Generator.
Page location

New page at /email-sequence. Add a quick-access card linking to it in the Launch & Marketing section of /dwy (alongside the existing Content Generator, Sparky, Marketplace, Community cards). Also make it accessible from /diy.
Gating

Require offer_sort_results/{uid} to exist before generating. If not present, show a prompt to complete Offer Packaging first.
Data to pull (all via Promise.allSettled — soft fail on each)
SourceFirestore LocationFields NeededSpark Statementspark_profiles (query by userId)sparkStatement, niche, idealClientAudienceaudience_results (query by userId)dailyFrustration, whatTheyHaveTried, theirObjections, dreamOutcome, howTheyWantToBeeSeen, theirWordsLead Magnet / Toolclarity_sessions (4-variant query)chosenTool nameOffer Packagingoffer_sort_results/{uid}transformation, coreDelivery, keepItems[]Offeroffer_results/{uid}format, justification, accessiblePriceJourney Mapjourney_maps/{uid}box1 (discovery)Brand Namefunnel_generator_results/{uid}brandName
Content Pillars not yet built — skip for now, no field needed.
System prompt injection

Inject a structured block into the Claude system prompt containing all populated fields. Only inject sections where data exists (same soft-fail pattern as Funnel Generator audience block). Include:

Who they serve + transformation (from spark + offer packaging)
Audience pain points and exact language (from audience results)
What the lead magnet delivers (chosen tool name)
Offer details and price
Brand name for personalization

Emails to generate

Ask Claude to return a JSON array of 5 email objects. Each object:
json{
  "emailNumber": 1,
  "purpose": "Welcome",
  "subjectLine": "...",
  "bodyText": "..."
}
Email purposes:

Welcome — deliver lead magnet, set expectations
Value — teach something useful, build trust
Story — personal story, lesson, or case study
Invitation — introduce the offer, soft CTA
Next Step — stronger invitation, clear CTA

UI — output display

One card per email. Each card contains:

Header: Email [number] — [Purpose]
Subject Line (labeled)
Body Copy (labeled)
Copy button for subject line
Copy button for body copy
Regenerate single email button (optional for V1)

Firestore write

On successful generation, save to email_sequences/{uid}:

emails[] array (all 5 objects)
generatedAt timestamp
userId

Milestone display

On completion show milestone card: "Email Nurture Sequence Complete"
Version 1 scope — do NOT include

Email provider integration
Download/export
Fancy templates
Per-email editing UI (copy only)