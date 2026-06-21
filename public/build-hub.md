# Build Hub — content area spec

**Scope:** the page content only. No sidebar/nav — that's handled by the universal menu already. This covers everything that renders to the right of it: breadcrumb, header, roadmap, tool cards, validation, and the output banner.

---

## Brand tokens

| Token | Value |
|---|---|
| Purple (primary) | `#6B2FB3` |
| Yellow (accent) | `#FFC820` — accent only, never a fill |
| Page background | `#FAF8F5` |
| Card surface | White, `1.5px solid #E8E1F0` border, no shadow |
| Muted text | `#5F5E5A` (secondary), `#8A7FA0` (tertiary/eyebrow), `#B4B2A9` (locked/disabled) |
| Headline font | Poppins, 600 |
| Body font | Inter, 400 / 500 |
| Card radius | 12px |
| Pill radius | 20px (full) |
| Button radius | 7–8px |

---

## 1. Breadcrumb

Sits above the page title.

- Text: `Creator Hub › Build Hub`
- Font: Inter 11px, color `#B4B2A9`
- Current page segment: `#6B2FB3`, weight 500
- Separator icon: `ti-chevron-right`, 11px

## 2. Page header

Replaces what used to be a full hero — this is just a title row now that it lives inside the dashboard.

- Layout: title block left, progress block right, `justify-content: space-between`, wraps on narrow widths
- Title: Poppins 600, 21px, `#0D0D0D` — "Build Hub"
- Subtitle: Inter 12px, italic, `#8A7FA0` — the guiding question, e.g. "Can I build something people will use?"
- Progress label: Inter 11px, weight 500, `#6B2FB3`, right-aligned — "X of 4 complete"
- Progress bar: 110px wide, 5px tall, track `#E8E1F0`, fill `#6B2FB3`, radius 3px

## 3. Roadmap stepper

Four nodes, evenly spaced (25% width each), connected by 2px lines.

**Node states**

| State | Circle | Icon/content | Label color |
|---|---|---|---|
| Complete | 30px, filled `#6B2FB3` | `ti-check`, white | `#0D0D0D` |
| Active | 30px, white fill, `2px solid #6B2FB3` | step number, `#6B2FB3` | `#0D0D0D` |
| Locked | 30px, filled `#F1EFE8` | `ti-lock`, `#B4B2A9` | `#888780` |

- Label: Inter 10.5px, weight 500, centered under circle
- Connecting line: 2px tall, `#6B2FB3` if the step before it is complete, otherwise `#E8E1F0`
- Step order: Creator Hub Setup → Tool Builder → Preview → Publish

## 4. Tool cards

One card per step, full width, stacked vertically, 12px gap between cards.

**Shared structure**
- Card: white, `1.5px solid #E8E1F0`, radius 12px, padding `16px 18px`
- Layout: icon chip (36px, radius 9px) + content block, `display:flex; gap:12px`
- Header row inside content: title (Poppins 600, 14.5px) + status pill, `justify-content: space-between`

**Status pill styles**

| Status | Background | Text | Icon |
|---|---|---|---|
| Complete | `#E1F5EE` | `#085041` | `ti-check` |
| In progress | `#F7F4FB` | `#3C3489` | — |
| Locked | `#F1EFE8` | `#5F5E5A` | `ti-lock` |

**Body content per state**
- *Complete:* one-line confirmation of what's done (e.g. "Your brand profile is set and ready"), icon chip color `#6B2FB3` on `#F7F4FB`
- *In progress:* short status line (e.g. "Step 3 of 5 with Sparky") + filled purple button, text "Continue", `ti-arrow-right` trailing icon
- *Locked:* icon chip grayed (`#B4B2A9` on `#F1EFE8`), card body at 0.65 opacity, single line "Unlocks after [previous step]", no button

**Icons per step:** Creator Hub Setup = `ti-settings`, Tool Builder = `ti-puzzle`, Preview = `ti-eye`, Publish = `ti-rocket`

## 5. Validation checklist card

Visually distinct from the tool cards — dashed border, since it's a milestone rather than a tool.

- Card: white, `1.5px dashed #E8E1F0`, radius 12px, padding `16px 18px`, opacity 0.7 while locked
- Eyebrow: "After publish" — Inter 10px uppercase, `#8A7FA0`
- Title: "Validate your tool" — Poppins 600, 13.5px
- Status pill: same locked/unlocked styles as above
- Checklist items (render only once unlocked):
  - Get 3 users
  - Get feedback
  - Record improvements
  - Make 1 meaningful update
  - Share results in community
- Each item: `ti-square` (unchecked) or `ti-square-rounded-check` (checked) at 15px, `#B4B2A9` unchecked / `#6B2FB3` checked, label Inter 13px

## 6. Validated tool banner

The phase's output — styled as a soft milestone, not another card.

- Background: `#F7F4FB` (tinted, no border), radius 12px, padding `14px 16px`
- Icon chip: 32px, white bg, `ti-certificate` at `#6B2FB3`
- Title: "Validated tool" — Poppins 600, 13px
- Subtext: "Unlocked once your checklist is complete" — Inter 11.5px, `#5F5E5A`

---

## State logic (for reference)

- A step is **locked** until the step before it is complete
- **Active/in progress** = unlocked, no completed output yet
- **Complete** = output exists for that step
- Validation card unlocks only when Publish is complete
- Validated Tool banner activates only when all 5 checklist items are checked