# ToolSpark Blog & Founder Journal — Developer Spec v1.0

**For:** Skippy  
**Prepared by:** Coena  
**Date:** June 2026

---

## 1. Overview

Build a simple Blog / Founder Journal system on top of the existing ToolSpark Creator Hub infrastructure. Two surfaces:

- **Admin side** — protected area (existing admin login) where posts can be created, edited, saved as drafts, published, and unpublished.
- **Public side** — publicly accessible blog index and individual post pages showing only published content.

Keep v1 minimal. No comments, no tag/category manager UI, no advanced SEO fields. Just the core write → draft → publish → read loop.

---

## 2. Tech Stack

| Layer | Detail |
|---|---|
| Frontend | Vanilla JS / existing Hub HTML pages (same pattern as creatorhub pages) |
| Styling | `creatorhub.css` — shared CSS variables, components, and sidebar. No new CSS framework. |
| Backend / DB | Firebase Firestore — new `blogPosts` collection |
| Auth | Existing Firebase Admin auth (same session check used on all admin pages) |
| Hosting | Firebase Hosting (existing setup) |
| Slug generation | Client-side JS — auto-generated from title on creation, stored as field, editable before first publish |

---

## 3. Firestore Data Model

**Collection:** `blogPosts`  
**Path:** `/blogPosts/{postId}` (auto-generated Firestore doc ID)

| Field | Type | Notes |
|---|---|---|
| `title` | string | Post headline. Required. |
| `slug` | string | URL-safe identifier. Auto-generated from title. Must be unique. e.g. `"building-toolspark-week-3"` |
| `description` | string | Subtitle / excerpt shown on blog index card. Required. |
| `category` | string | One of the 5 fixed category values (see §4). Required. |
| `coverImage` | string | Full URL to cover image. Optional — card renders without it if absent. |
| `content` | string | Full post body. Plain text or lightweight HTML (see §7.2). Required. |
| `status` | string | `"draft"` \| `"published"`. Default: `"draft"`. |
| `authorName` | string | Display name shown on public post. Default: `"Coena"`. |
| `createdAt` | timestamp | Firestore server timestamp — set on document creation, never updated. |
| `updatedAt` | timestamp | Firestore server timestamp — updated on every save. |
| `publishedAt` | timestamp | Set once when status first changes to `"published"`. Never overwritten on re-publish. |

> ⚠️ `slug` must be unique. On save, query Firestore for an existing doc with the same slug before writing. If a collision exists, append `-2`, `-3`, etc.

> ⚠️ `publishedAt` is only set the first time a post is published. Re-publishing an unpublished post does not overwrite it.

---

## 4. Categories

Categories are a fixed list — no manager UI in v1. Hard-code them as a `<select>` in the editor.

| Category Value (stored in Firestore) | Description |
|---|---|
| Sunday Reset | Weekly reflection / wind-down posts |
| Confessions of an Introvert | Personal essays on introversion, energy, and boundaries |
| Building ToolSpark | Behind-the-scenes founder journal entries |
| Lessons Learned | Distilled takeaways from experience |
| AI & Tools | Observations, reviews, and thoughts on AI tools |

---

## 5. URL Routes

| Route | Page | Access |
|---|---|---|
| `/admin/blog` | Admin — Blog post list | Lists all posts (draft + published). Protected. |
| `/admin/blog/new` | Admin — Create new post | Blank editor form. Protected. |
| `/admin/blog/edit?id=X` | Admin — Edit existing post | Pre-filled editor form. Protected. |
| `/blog` | Public — Blog index | Shows all published posts. Public. |
| `/blog/:slug` | Public — Single post page | Full post content. Public. |

> ⚠️ Use query param `?id=postId` for the edit page — simpler than hash routing on static hosting.

---

## 6. Admin Pages

### 6.1 Admin Blog List (`/admin/blog`)

This is the main management view. Add "Blog" to the admin sidebar nav (see §9).

**Page layout:**

- Header row: page title "Blog Posts" + a yellow **New Post** button (`btn-primary`) top-right.
- Filter tabs (optional): All | Published | Drafts — client-side filter, no extra Firestore query.
- Post list as a table or card list. Each row shows:
  - Cover image thumbnail (40×40px, border-radius: 8px) — placeholder grey box if no cover
  - Title (bold, `--text`)
  - Category (small grey pill)
  - Status badge — Published (`green-bg`, `--green` text) | Draft (`yellow-bg`, `#92400E` text)
  - Published date or "Draft" if not published
  - Action buttons: Edit (btn-ghost / pencil icon) | Publish/Unpublish toggle | Delete (red trash icon, confirm dialog)
- Firestore query: `getDocs(collection(db, "blogPosts"))` ordered by `createdAt` desc. Load all on page load (no pagination in v1).

---

### 6.2 Create / Edit Post (`/admin/blog/new` and `/admin/blog/edit?id=X`)

Single page handles both create and edit. Detect mode by checking for `?id=` query param.

**Form fields (in order):**

| Field | Input Type | Notes |
|---|---|---|
| Title | text input | Required. Triggers slug auto-generation on blur (create mode only). |
| Slug | text input | Auto-filled from title. Editable. Locked after first publish (show as read-only with small "locked" label). Stored lowercase, hyphens only. |
| Description | textarea (3 rows) | Required. Shown on public blog index card. |
| Category | `<select>` | Required. Populated with the 5 fixed categories. |
| Cover Image URL | text input | Optional. Full URL. Show a small live preview thumbnail below the field when a valid URL is entered. |
| Author Name | text input | Pre-filled with "Coena". Editable. |
| Content | textarea (tall, min 400px) | Required. Plain text. Supports basic HTML tags for formatting (`p`, `strong`, `em`, `ul`, `ol`, `li`, `h2`, `h3`, `blockquote`, `a`). Rendered as HTML on public page. |

**Action buttons:**

- **Save as Draft** (`btn-outline`) — saves/updates doc with `status: "draft"`. Available in both create and edit mode.
- **Publish** (`btn-primary`, yellow) — saves doc with `status: "published"`. Sets `publishedAt` if first publish. Redirects to `/admin/blog` on success.
- **Unpublish** (`btn-secondary`, purple) — sets `status: "draft"`. Only shown in edit mode when current status is `"published"`.
- **Cancel / Back** — `btn-ghost`, returns to `/admin/blog` without saving.
- **Delete** — `btn-ghost` in red, only in edit mode. Show a confirm dialog before deleting the Firestore doc.

**Slug generation logic:**

```js
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .replace(/\s+/g, '-')             // spaces → hyphens
    .replace(/-+/g, '-')              // collapse multiple hyphens
    .slice(0, 80);                    // max 80 chars
}
```

> ⚠️ After generating the slug, check Firestore for uniqueness. If `/blogPosts?where slug == value` returns any result (excluding the current doc in edit mode), append `-2`, `-3`, etc. until unique.

---

## 7. Public Pages

### 7.1 Blog Index (`/blog`)

Publicly accessible — no auth required.  
**Query:** `getDocs where status == "published"` ordered by `publishedAt` desc.

**Page layout:**

- Page header: "Blog" or "Founder Journal" as the `h1`. Optional short tagline below.
- Post grid: 2-column card grid on desktop, 1-column on mobile (≤768px).

**Post card — each card contains:**

- Cover image — full width at top of card (aspect ratio 16:9, `object-fit: cover`). Hidden if no `coverImage`.
- Category pill — small label (e.g. "Building ToolSpark") in purple text on light purple background (`--purple` at 10% opacity).
- Title — `h2`, bold, `--text`, 2-line clamp.
- Description — 3-line clamp, `--text2`.
- Date — formatted as "June 15, 2026", `--text3`, small.
- "Read More →" — styled as `btn-outline` or a styled anchor. Links to `/blog/:slug`.

> 💡 Cards use `.card` class from `creatorhub.css`: white background, `border-radius: 14px`, box-shadow as defined in `:root`.

---

### 7.2 Single Post Page (`/blog/:slug`)

Load post: query Firestore where `slug == :slug` and `status == "published"`. If not found, show 404 message.

**Page layout — top to bottom:**

- Back link — "← Back to Blog" ghost link to `/blog`
- Category pill (same style as index card)
- Title — large `h1`
- Description / subtitle — slightly larger body text, `--text2`, italic optional
- Meta row — Author name · Published date (formatted). `--text3`.
- Cover image — full width, `max-height: 480px`, `object-fit: cover`, `border-radius: 14px`. Hidden if absent.
- Divider line
- Content — render as `innerHTML` (content field contains plain text / lightweight HTML). Wrap in a `.post-content` container.

**Post content styling — add to `creatorhub.css` or a `<style>` block on the page:**

```css
.post-content {
  max-width: 720px;
  margin: 0 auto;
  line-height: 1.75;
  font-size: 17px;
  color: var(--text);
}
.post-content h2 { font-size: 22px; font-weight: 700; margin: 32px 0 12px; color: var(--text); }
.post-content h3 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; color: var(--text); }
.post-content p  { margin-bottom: 18px; }
.post-content ul,
.post-content ol { padding-left: 24px; margin-bottom: 18px; }
.post-content li { margin-bottom: 6px; }
.post-content blockquote {
  border-left: 4px solid var(--yellow);
  padding: 12px 20px;
  background: var(--yellow-bg);
  border-radius: 0 8px 8px 0;
  margin: 24px 0;
  font-style: italic;
}
.post-content a      { color: var(--purple); text-decoration: underline; }
.post-content strong { font-weight: 700; }
.post-content em     { font-style: italic; }
```

---

## 8. Status Workflow

| Action | Transition | Notes |
|---|---|---|
| Create new post | `status: "draft"` | "Save as Draft" writes doc. "Publish" writes with `status: "published"` + sets `publishedAt`. |
| Draft → Published | Save as Draft → Publish | On publish: set `status: "published"`, set `publishedAt` (only if not already set), set `updatedAt`. |
| Published → Unpublish | Publish → Unpublish | Set `status: "draft"`. `publishedAt` is preserved. Post disappears from public blog immediately. |
| Re-publish | Draft → Publish again | Set `status: "published"`, set `updatedAt`. Do **NOT** overwrite `publishedAt`. |
| Delete | Any state → deleted | Delete Firestore doc. No soft-delete in v1. |

---

## 9. Admin Sidebar Navigation

Add a "Blog" nav item to the existing admin hub sidebar (`hub-sidebar-nav`). Use the same `.hub-nav-item` pattern from `creatorhub.css`.

```html
<!-- Add to admin sidebar nav list -->
<a href="/admin/blog" class="hub-nav-item" id="nav-blog">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
  Blog
</a>
```

> 💡 Mark the nav item as active (`class="hub-nav-item active"`) on all `/admin/blog*` pages using the same JS pattern used by other admin nav items.

---

## 10. CSS & Styling Reference

All blog pages (admin and public) inherit from `creatorhub.css`. Do not create a separate stylesheet. Use the existing CSS variables and component classes below.

### 10.1 Color Variables (from `:root` in `creatorhub.css`)

| CSS Variable | Hex | Usage |
|---|---|---|
| `--yellow` | `#FFC820` | Primary CTA, buttons, logo bg |
| `--purple` | `#6B2FB3` | Brand accent, active nav, links |
| `--black` | `#000000` | Button text on yellow |
| `--text` | `#111111` | Primary body text |
| `--text2` | `#555555` | Secondary text, nav items |
| `--text3` | `#999999` | Placeholder, timestamps, captions |
| `--bg` | `#F5F5F5` | Page background |
| `--card` | `#FFFFFF` | Card / panel background |
| `--card-alt` | `#FAFAFA` | Input bg, alternate card |
| `--border` | `#E5E7EB` | All borders and dividers |
| `--green` | `#16A34A` | Published / success status |
| `--red` | `#DC2626` | Error, destructive, delete |
| `--green-bg` | `#DCFCE7` | Published badge background |
| `--red-bg` | `#FEE2E2` | Unpublished / error badge bg |
| `--yellow-bg` | `#FEF9C3` | Draft badge background |

### 10.2 Other Design Tokens

| Token | Value |
|---|---|
| `--radius` | `14px` — cards, modals, cover images |
| `--radius-sm` | `10px` — buttons, inputs, small pills |
| `--shadow` | `0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)` |
| `--font` | `'Inter', sans-serif` |

### 10.3 Button Classes

| Class | Style | Use For |
|---|---|---|
| `btn-primary` | Yellow bg (`#FFC820`), black text, bold 700, `14px 24px` padding | Publish, New Post CTA |
| `btn-secondary` | Purple bg (`#6B2FB3`), white text, semi-bold 600, `12px 20px` | Unpublish |
| `btn-outline` | Transparent bg, purple border + text; fills purple on hover | Save as Draft, Read More |
| `btn-ghost` | No bg/border, purple text, underlines on hover | Cancel, Back to Blog, Edit |

### 10.4 Status Badge Patterns

```css
/* Published */
background: var(--green-bg);   /* #DCFCE7 */
color: var(--green);           /* #16A34A */
font-size: 12px; font-weight: 700; border-radius: 6px; padding: 3px 10px;

/* Draft */
background: var(--yellow-bg);  /* #FEF9C3 */
color: #92400E;
font-size: 12px; font-weight: 700; border-radius: 6px; padding: 3px 10px;

/* Category pill (public blog) */
background: rgba(107, 47, 179, 0.08);
color: var(--purple);
font-size: 12px; font-weight: 600; border-radius: 20px; padding: 4px 12px;
```

### 10.5 Admin Page Layout Shell

```html
<body>
  <div id="hub-admin-sidebar"></div>  <!-- sidebar injected by shared JS -->
  <main style="margin-left: 220px; padding: 32px; max-width: 1100px;">
    <!-- page content -->
  </main>
</body>
```

### 10.6 Public Blog Layout Shell

```html
<body style="background: var(--bg); font-family: var(--font);">
  <header><!-- optional minimal nav with ToolSpark logo + "Blog" label --></header>
  <main style="max-width: 1100px; margin: 0 auto; padding: 40px 24px;">
    <!-- post grid or single post -->
  </main>
</body>
```

---

## 11. Firestore Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // blogPosts — public can read published; admin can do anything
    match /blogPosts/{postId} {

      // Public: only read published posts
      allow read: if resource.data.status == 'published';

      // Admin: full access (reuse your existing isAdmin() function)
      allow read, write: if isAdmin();
    }
  }

  function isAdmin() {
    // Replace with your existing admin check, e.g.:
    return request.auth != null && request.auth.token.admin == true;
  }
}
```

> ⚠️ The public read rule uses `resource.data.status` to gate access — drafts are invisible to unauthenticated users even if someone guesses the URL with `?id=`.

---

## 12. Suggested Build Order

| Step | Task | Notes |
|---|---|---|
| 1 | Firestore collection + security rules | Manual or via Firebase console. Confirm rules work before building UI. |
| 2 | `/admin/blog` list page | Shows all posts from Firestore, status badges, edit/delete links. |
| 3 | `/admin/blog/new` — create form | Wire up form → Firestore write → redirect to list. |
| 4 | Publish / Save as Draft logic | Status transitions, `publishedAt` logic. |
| 5 | `/admin/blog/edit?id=X` | Pre-fill form from Firestore doc. Unpublish button. |
| 6 | Admin sidebar nav item | Add Blog link. Mark active. |
| 7 | `/blog` index page | Public post grid. Query published only. |
| 8 | `/blog/:slug` single post | Fetch by slug, render HTML content. |
| 9 | Slug uniqueness check | Add collision detection on save. |
| 10 | Polish & responsive | Mobile layout (≤768px), loading states, empty states, error handling. |

---

## 13. Empty States & Edge Cases

| Scenario | Behavior |
|---|---|
| No posts yet (admin list) | "No posts yet. Create your first post →" with link to `/admin/blog/new` |
| No published posts (public blog) | "Nothing published yet. Check back soon." |
| Post not found (`/blog/:slug`) | "Post not found" with link back to `/blog` |
| No cover image | Hide the `<img>` element entirely (do not show broken image) |
| Content loading | Simple skeleton or spinner inside the `.card` container |
| Slug collision on save | Auto-append `-2`, `-3`. Do not show an error to the user. |
| Delete confirmation | Use native `confirm()`: "Delete this post? This cannot be undone." |

---

*ToolSpark Blog Spec — v1.0 — For internal use only*  
*Questions? Message Coena before building, not after. 😄*
