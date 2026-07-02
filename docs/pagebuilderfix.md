# Page Builder (/admin/builder) — Fix Log

Working notes on the VvvebJS-based page builder. Keep this updated as we go so we don't re-diagnose the same things twice.

## Fixed

**Image upload (was completely broken)**
- `libs/media/media.js` had a combined guard (`if (typeof mediaScanUrl === "undefined")`) that set `mediaPath`/`mediaScanUrl`/`uploadUrl` together. Since `editor.html` never defined `mediaScanUrl`, the guard fired and silently reset `uploadUrl` back to the vendor's PHP default (`"upload.php"`) right after we'd set it — every upload was 404ing. Fixed by defining `mediaScanUrl` in `editor.html`.
- The upload-success handler in `media.js` treated the Cloud Function's response (a full Storage download URL) as if it were a bare filename to join onto a folder path, corrupting the image src and using the whole URL as the display name. Fixed to use the URL as-is.

**Media Library — full CRUD built out**
- Added `builderScanMedia`, `builderDeleteMedia`, `builderRenameMedia` Cloud Functions in `functions/index.js`, same admin-gated shape as the existing `builderUploadImage`. Deployed — live URLs wired into `editor.html`.
- Fixed `media.js`'s `renameFile()`: it was passing a raw JS object as a `fetch()` body, which silently serializes to the string `"[object Object]"` — rename never actually sent its parameters anywhere, backend or not.
- Cleaned up dead/misleading response handling in `deleteFile`/`renameFile` (checked `.success`/`.message` on a plain-text response), crash-proofed error handling against non-Response errors, fixed the confirm/rename dialogs to show the real filename instead of the raw Storage URL, and made a successful rename update the list in place instead of leaving a stale row.

**Broken/misleading navigation**
- Sidebar "Dashboard" link and both ToolSpark logo links pointed at a dead template placeholder, a 404, or the public marketing waitlist page. All three now point to `/admindashboard.html`, matching the "Page Builder" card that links here from the admin dashboard.

**Missing section/style preview thumbnails**
- The Sections and Styles panels showed broken-image icons for every preview — the actual screenshot assets were never included in this deployment (only the two `.js` data files that reference them). Restored 180 files (~1.6MB) from the upstream `givanz/landing` repo into `demo/landing/screenshots/`.

**Download button did nothing when clicked**
- `plugin-jszip.js` fetches every asset (CSS/JS/images) the current page references before bundling a zip. One failed/CORS-blocked asset used to `reject()`, which killed the whole `Promise.all` and silently aborted the entire download with zero visible feedback. Fixed to degrade gracefully (skip the failed asset, keep going) and surface a real error toast if something else still fails.

**Drag-and-drop into a section that already has content**
- The insertion logic's "is this a container or a sibling-boundary" check (`isBlock`) only recognized literal `display: block`. This project's Bootstrap-5-heavy sections use `flex`/`grid` everywhere, so hovering an existing card/column wasn't recognized, and new elements got nested inside the wrong flex child instead of landing as a proper sibling. Fixed to recognize flex/grid/table/etc. the same way.

**Selection/hover highlight box flying off to a random position**
- Two places (`highlightMove`'s hover box, `selectNode`'s selection box) were subtracting the canvas's scroll position a second time on top of a calculation that already accounted for it (`getBoundingClientRect()` already nets out iframe-internal scroll). Harmless unscrolled; the more you'd scrolled into a page, the further off it flew. Fixed both.
- Note: `selectBoxPosition` (used to reposition the select box on iframe scroll/resize) has the same redundant-subtraction pattern and was **not yet fixed** — same bug, different call site.

**Click-to-select could trigger a real page's own click handlers**
- `preventDefault()` alone only cancels the browser's default action (link navigation, form submit) — it doesn't stop a handler the page's own JS attached directly to an element (a real sign-out button, delete action, checkout trigger) from firing, since that fires during bubbling before the builder's handler (on the outer frame body) gets a turn. Fixed by moving the click-to-select listener to the capture phase and adding `stopPropagation()`, so it intercepts before the real element's own handler runs. Reasoned through carefully but not yet tested live in a browser — test on something low-stakes before trusting it on a page with real destructive/payment actions.

**One specific broken page, fixed directly**
- The test template's Hero section was missing its middle column — the Sparky image had landed outside the hero card entirely (almost certainly a live casualty of the flex/grid drag-and-drop bug above), so the empty-looking column got deleted along with it. Restored the column and moved the image back in, written directly to the live Firestore draft (`page_drafts/page-template`).

## Still open

**"View page" link opens a blank new tab**
- Not root-caused yet. The eye-icon "Preview" toggle is fine (confirmed working as designed — it's a same-tab CSS layout toggle, not navigation). The external-link "View page" button is the broken one. Found a real, related bug while investigating: the New Page dialog silently overwrites whatever you type into its URL field (`builder.js` ~line 2814), so any page created through it gets a garbage `url` value — but haven't confirmed this is *the* cause of the blank tab specifically. Need the actual href value (right-click → copy link address) to pin it down.

**New Page creation is broken**
- The dialog's form still posts to `save.php` (dead PHP endpoint, never repointed to a real Cloud Function like Save/Upload were). Even if that's fixed, `data.url` gets computed as `folder + "/" + file"` where `folder` is always `undefined` (no active folder field in the form) — produces a garbage URL either way.

**No real multi-page support exists**
- `defaultPages` in `editor.html` is a single hardcoded object with exactly one entry (`page-template`). There's no persisted list of "all pages that exist" anywhere (Firestore or otherwise) — this is the real blocker behind both New Page creation and editing any real ToolSpark page. This is a feature to build, not a quick fix.

**Editing a real, existing ToolSpark page**
- Mechanically possible in principle (the draft-check-then-load-live-file flow already generalizes beyond the one test page) but never done, and blocked on the multi-page gap above. Real pages are "auth heavy" — their own auth.js/nav.js/credits.js run for real inside the edit iframe, which is expected friction, not a blocker by itself. The click-safety fix above was the prerequisite that made this safe to attempt at all.

**Dead PHP endpoints, never touched**
- Save-as-reusable-block (`save.php?action=saveReusable`)
- oEmbed proxy for embedding a tweet/video by URL (`save.php?action=oembedProxy`)

**AI Assistant plugin**
- Hardcoded empty OpenAI key (`chatgptOptions.key = ""` in `editor.html`) — fails gracefully with a toast, does nothing. Also calls OpenAI directly from the browser, which would expose a real key to anyone viewing page source if one were ever added — should go through a Cloud Function + secret instead, matching the `tts`/`getElevenLabsVoices` pattern already in this codebase.

**Design limitation, not a bug**
- Save writes a Firestore draft only (`page_drafts/{slug}`), never the live page file. Publishing is still a manual "copy the draft HTML into `public/{slug}.html` and deploy" step.

**Latent, not currently visible**
- A few vendored files (inputs.js's original unused upload handler, components-widgets.js, an unused function in builder.js) call jQuery's `$`, which isn't loaded anywhere on this page. Not breaking anything today because those code paths are dead/overridden — would throw `$ is not defined` if anything ever reactivates them.

## Deploy notes

- Everything under "Fixed" except the three new Cloud Functions is a static-file change (`public/admin/builder/**`) — hosting deploy only.
- `builderScanMedia`, `builderDeleteMedia`, `builderRenameMedia` are already deployed (confirmed live at `https://us-central1-toolspark-2d62d.cloudfunctions.net/...`).
- No `storage.rules`/`firestore.rules` changes were needed for anything above — the Cloud Functions use the Admin SDK, which bypasses client security rules.
