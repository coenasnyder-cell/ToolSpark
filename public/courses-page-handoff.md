# ToolSpark — Courses Page Handoff
**Prepared for:** Developer  
**Design reference:** Courses & Training screenshot  
**Status:** Ready to build

---

## Overview

This document contains everything needed to build the ToolSpark Courses & Training page. It includes the full HTML structure, CSS, JavaScript file references, folder/file setup, image requirements, and implementation notes. Follow the instructions in order.

---

## 1. File & Folder Structure

Set up your project files exactly like this before writing any code:

```
/project-root
│
├── courses.html          ← Main page (HTML lives here)
├── courses.css           ← All styles for this page
│
├── js/
│   ├── nav.js            ← Global navigation logic (auth-aware nav state)
│   ├── auth.js           ← User authentication / session handling
│   └── credits.js        ← Credit balance display and deduction logic
│
└── images/
    ├── course-hero.png   ← Illustration in hero (graduation cap / stars)
    ├── challenge.jpg     ← ToolSpark Challenge course thumbnail (dark, gold logo)
    ├── build.jpg         ← Your First Build course thumbnail (dark, path diagram)
    ├── pip.png           ← Pip mascot (squirrel in hoodie)
    └── sid.png           ← Sid mascot (squirrel with backpack)
```

> **Image notes:**
> - `course-hero.png` should have a transparent background so it blends into the cream hero panel.
> - `challenge.jpg` and `build.jpg` are dark-background course thumbnails. Ideal aspect ratio: 4:3.
> - `pip.png` and `sid.png` are mascot illustrations. Render at 110px wide inside the help cards.

---

## 2. JavaScript Files — What Each One Does

These three files are referenced at the bottom of `courses.html`. The scripts are **not written in this document** — they should already exist in your project. This page simply references them.

| File | Purpose |
|------|---------|
| `js/nav.js` | Handles the top navigation bar — active states, mobile menu toggle, and auth-aware link visibility (e.g. hide "Log In" when user is signed in). |
| `js/auth.js` | Manages user session — checks if a user is logged in, stores/reads tokens, and redirects unauthenticated users away from protected pages. Load this **before** `nav.js` if nav depends on auth state. |
| `js/credits.js` | Reads the user's available credit balance and renders it in the UI. Also handles deduction events if a lesson or action costs credits. |

> **Load order matters.** The script tags at the bottom of the HTML are ordered: `nav.js` → `auth.js` → `credits.js`. If `auth.js` must run before `nav.js`, swap their order.

---

## 3. HTML — `courses.html`

Copy this entire block into `courses.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Courses & Training – ToolSpark</title>
    <link rel="stylesheet" href="courses.css">
</head>
<body>

<div class="courses-page">

    <!-- ==========================================
         HERO
    =========================================== -->

    <section class="courses-hero">
        <div class="hero-content">
            <div class="hero-text">
                <h1>Courses & Training ✨</h1>
                <p>Step-by-step programs to help you build, launch,<br>and grow with AI tools.</p>
            </div>
            <div class="hero-image">
                <img src="images/course-hero.png" alt="Courses illustration">
            </div>
        </div>
    </section>


    <!-- ==========================================
         STATS
    =========================================== -->

    <section class="course-stats">

        <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div>
                <div class="stat-number">2</div>
                <div class="stat-label">Courses Enrolled</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div>
                <div class="stat-number">3 / 14</div>
                <div class="stat-label">Lessons Completed</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">⏱</div>
            <div>
                <div class="stat-number">2h 18m</div>
                <div class="stat-label">Total Learning Time</div>
            </div>
        </div>

        <!-- Path card — different layout, no large number -->
        <div class="stat-card stat-card--path">
            <div class="stat-icon">🚩</div>
            <div>
                <div class="stat-sublabel">Current Path</div>
                <div class="stat-path-name">Build It Yourself</div>
                <div class="stat-label">7 lessons remaining</div>
            </div>
        </div>

    </section>


    <!-- ==========================================
         CONTINUE LEARNING
    =========================================== -->

    <section class="continue-section">
        <h2 class="section-title">Continue Learning ✨</h2>

        <div class="continue-card">

            <div class="continue-image">
                <img src="images/challenge.jpg" alt="ToolSpark Challenge">
            </div>

            <div class="continue-content">
                <span class="course-chip course-chip--progress">In Progress</span>
                <h3 class="continue-title">ToolSpark Challenge</h3>
                <p class="continue-meta">Lesson 3 of 7 &bull; The AI Tool Idea</p>
                <div class="progress-wrap">
                    <div class="progress">
                        <div class="progress-fill" style="width:43%"></div>
                    </div>
                    <span class="progress-label">43%</span>
                </div>
            </div>

            <div class="continue-action">
                <a href="#" class="course-btn">Resume Lesson →</a>
            </div>

        </div>
    </section>


    <!-- ==========================================
         YOUR COURSES
    =========================================== -->

    <section class="your-courses">

        <div class="courses-header">
            <h2 class="section-title">Your Courses</h2>
            <div class="course-filters">
                <button class="filter-pill filter-pill--active">All Courses</button>
                <button class="filter-pill">In Progress</button>
                <button class="filter-pill">Completed</button>
                <button class="filter-pill">Not Started</button>
            </div>
        </div>

        <div class="course-grid">

            <!-- ToolSpark Challenge -->
            <article class="course-card">
                <div class="course-image">
                    <img src="images/challenge.jpg" alt="ToolSpark Challenge">
                </div>
                <div class="course-content">
                    <div>
                        <span class="course-chip course-chip--progress">In Progress</span>
                        <h3 class="course-title">ToolSpark Challenge</h3>
                        <p>7-day challenge to help you go from idea to AI tool in just one week.</p>
                    </div>
                    <div class="course-footer">
                        <div class="progress-wrap">
                            <div class="progress">
                                <div class="progress-fill" style="width:29%"></div>
                            </div>
                            <span class="progress-label">29%</span>
                        </div>
                        <div class="course-meta">
                            <span>2 of 7 lessons completed</span>
                        </div>
                        <div class="course-time-row">
                            <span class="course-time">⏱ 1h 45m remaining &nbsp; 7 lessons</span>
                            <a href="#" class="course-link">Continue →</a>
                        </div>
                    </div>
                </div>
            </article>

            <!-- Your First Build -->
            <article class="course-card">
                <div class="course-image">
                    <img src="images/build.jpg" alt="Your First Build">
                </div>
                <div class="course-content">
                    <div>
                        <span class="course-chip course-chip--progress">In Progress</span>
                        <h3 class="course-title">Your First Build</h3>
                        <p>Step-by-step program to build your first AI tool with guidance at every step.</p>
                    </div>
                    <div class="course-footer">
                        <div class="progress-wrap">
                            <div class="progress">
                                <div class="progress-fill" style="width:29%"></div>
                            </div>
                            <span class="progress-label">29%</span>
                        </div>
                        <div class="course-meta">
                            <span>2 of 7 lessons completed</span>
                        </div>
                        <div class="course-time-row">
                            <span class="course-time">⏱ 2h 10m remaining &nbsp; 7 lessons</span>
                            <a href="#" class="course-link">Continue →</a>
                        </div>
                    </div>
                </div>
            </article>

        </div>
    </section>


    <!-- ==========================================
         RECENTLY VIEWED
    =========================================== -->

    <section class="recently-viewed">

        <h2 class="section-title section-title--recent">
            <span class="recent-icon">🕐</span> Recently Viewed
        </h2>

        <div class="recent-card">
            <img src="images/build.jpg" alt="Your First Build" class="recent-thumb">
            <div class="recent-info">
                <strong>Your First Build</strong>
                <p>Lesson 2: Define Your Core Problem</p>
            </div>
            <a href="#" class="course-btn course-btn--outline">Resume Lesson →</a>
        </div>

    </section>


    <!-- ==========================================
         HELP
    =========================================== -->

    <section class="learning-help">

        <div class="help-intro">
            <h2>Need Help on Your<br>Learning Journey?</h2>
            <p>Your AI coaching companions are here to help you stay on track.</p>
        </div>

        <div class="help-card">
            <img src="images/pip.png" alt="Pip">
            <div class="help-card-text">
                <p class="help-card-eyebrow">Have questions about a lesson?</p>
                <strong>Chat with Pip</strong>
                <p>Your journey companion</p>
            </div>
            <a href="#" class="course-btn course-btn--gold">Chat with Pip →</a>
        </div>

        <div class="help-card">
            <img src="images/sid.png" alt="Sid">
            <div class="help-card-text">
                <p class="help-card-eyebrow">Need accountability or a pep talk?</p>
                <strong>Chat with Sid</strong>
                <p>Your accountability coach</p>
            </div>
            <a href="#" class="course-btn course-btn--gold">Chat with Sid →</a>
        </div>

    </section>

</div><!-- /.courses-page -->

<!-- Scripts — load order: nav → auth → credits -->
<script src="js/nav.js"></script>
<script src="js/auth.js"></script>
<script src="js/credits.js"></script>

</body>
</html>
```

---

## 4. CSS — `courses.css`

Copy this entire block into `courses.css`:

```css
/* ============================================================
   RESET & BASE
============================================================ */

*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #F5F1E8;
    color: #1A1A1A;
    -webkit-font-smoothing: antialiased;
}

img {
    max-width: 100%;
    display: block;
}

a {
    text-decoration: none;
    color: inherit;
}

/* ============================================================
   PAGE WRAPPER
============================================================ */

.courses-page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 48px 34px 100px;
}

/* ============================================================
   SECTION TITLES
============================================================ */

.section-title {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 20px;
    color: #1A1A1A;
}

.section-title--recent {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #C89A2E;
}

.recent-icon {
    font-size: 20px;
}

/* ============================================================
   HERO
============================================================ */

.courses-hero {
    margin-bottom: 36px;
    background: #FAF6EE;
    border-radius: 24px;
    padding: 48px 48px 0;
    overflow: hidden;
}

.hero-content {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 40px;
}

.hero-text {
    flex: 1;
    padding-bottom: 48px;
}

.hero-text h1 {
    font-size: 52px;
    font-weight: 700;
    line-height: 1.05;
    margin-bottom: 14px;
}

.hero-text p {
    font-size: 18px;
    line-height: 1.7;
    color: #6B655C;
}

.hero-image {
    flex-shrink: 0;
    width: 320px;
    align-self: flex-end;
}

.hero-image img {
    width: 100%;
    display: block;
}

/* ============================================================
   STATS
============================================================ */

.course-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 40px;
}

.stat-card {
    background: #fff;
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 20px;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    gap: 18px;
    transition: transform .25s ease, box-shadow .25s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(0,0,0,.08);
}

.stat-icon {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F7F3EA;
    font-size: 22px;
    flex-shrink: 0;
}

.stat-number {
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
}

.stat-label {
    margin-top: 4px;
    color: #6B655C;
    font-size: 14px;
}

/* Path stat card variant */
.stat-card--path .stat-sublabel {
    font-size: 12px;
    color: #9A9088;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 4px;
}

.stat-card--path .stat-path-name {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
}

/* ============================================================
   COURSE CHIP (status badge)
============================================================ */

.course-chip {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
}

.course-chip--progress {
    background: #EAF4EC;
    color: #2E7D3E;
    border: 1px solid #B6DDB9;
}

.course-chip--completed {
    background: #E8F0FE;
    color: #1A56DB;
    border: 1px solid #B4C8FA;
}

.course-chip--not-started {
    background: #F3F4F6;
    color: #6B7280;
    border: 1px solid #D1D5DB;
}

/* ============================================================
   CONTINUE LEARNING
============================================================ */

.continue-section {
    margin-bottom: 46px;
}

.continue-card {
    display: grid;
    grid-template-columns: 200px 1fr auto;
    gap: 28px;
    align-items: center;
    background: #fff;
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 22px;
    padding: 26px;
    transition: transform .25s ease, box-shadow .25s ease;
}

.continue-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 36px rgba(0,0,0,.08);
}

.continue-image {
    border-radius: 14px;
    overflow: hidden;
}

.continue-image img {
    width: 100%;
    aspect-ratio: 16/10;
    object-fit: cover;
}

.continue-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 6px;
}

.continue-meta {
    color: #6B655C;
    font-size: 14px;
    margin-bottom: 16px;
}

.continue-action {
    flex-shrink: 0;
}

/* ============================================================
   PROGRESS BAR
============================================================ */

.progress-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
}

.progress {
    flex: 1;
    height: 8px;
    background: #ECE7DD;
    border-radius: 999px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #D9B14E, #E9C96B);
}

.progress-label {
    font-size: 13px;
    font-weight: 600;
    color: #6B655C;
    flex-shrink: 0;
}

/* ============================================================
   YOUR COURSES — HEADER + FILTERS
============================================================ */

.your-courses {
    margin-bottom: 50px;
}

.courses-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
}

.courses-header .section-title {
    margin-bottom: 0;
}

.course-filters {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.filter-pill {
    padding: 9px 18px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,.10);
    background: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background .2s ease, color .2s ease, border-color .2s ease;
}

.filter-pill:hover {
    background: #1A1A1A;
    color: #fff;
    border-color: #1A1A1A;
}

.filter-pill--active {
    background: #1A1A1A;
    color: #fff;
    border-color: #1A1A1A;
}

/* ============================================================
   COURSE GRID
============================================================ */

.course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
    gap: 24px;
}

.course-card {
    background: #fff;
    border-radius: 22px;
    border: 1px solid rgba(0,0,0,.06);
    padding: 22px;
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 22px;
    transition: transform .25s ease, box-shadow .25s ease;
}

.course-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 36px rgba(0,0,0,.08);
}

.course-image {
    border-radius: 14px;
    overflow: hidden;
    align-self: start;
}

.course-image img {
    width: 100%;
    aspect-ratio: 4/3;
    object-fit: cover;
    display: block;
}

.course-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.course-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.2;
}

.course-content p {
    color: #6B655C;
    font-size: 14px;
    line-height: 1.6;
}

.course-footer {
    margin-top: 16px;
}

.course-meta {
    margin-top: 8px;
    font-size: 13px;
    color: #7A746B;
}

.course-time-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
}

.course-time {
    font-size: 13px;
    color: #7A746B;
}

.course-link {
    font-size: 14px;
    font-weight: 600;
    color: #C89A2E;
    transition: opacity .2s;
}

.course-link:hover {
    opacity: .75;
}

/* ============================================================
   BUTTONS
============================================================ */

.course-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    padding: 0 26px;
    border-radius: 12px;
    background: #1A1A1A;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
    transition: background .25s ease, color .25s ease;
}

.course-btn:hover {
    background: #D8B04D;
    color: #1A1A1A;
}

/* Outlined variant — used in Recently Viewed */
.course-btn--outline {
    background: transparent;
    color: #1A1A1A;
    border: 2px solid #1A1A1A;
}

.course-btn--outline:hover {
    background: #1A1A1A;
    color: #fff;
}

/* Gold variant — used in Help cards */
.course-btn--gold {
    background: #F7F0E0;
    color: #8A6A1A;
    border: 1px solid #E0C87A;
}

.course-btn--gold:hover {
    background: #D8B04D;
    color: #1A1A1A;
    border-color: #D8B04D;
}

/* ============================================================
   RECENTLY VIEWED
============================================================ */

.recently-viewed {
    margin-bottom: 50px;
}

.recent-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: #fff;
    border-radius: 18px;
    padding: 18px 22px;
    border: 1px solid rgba(0,0,0,.06);
}

.recent-thumb {
    width: 80px;
    height: 56px;
    object-fit: cover;
    border-radius: 10px;
    flex-shrink: 0;
}

.recent-info {
    flex: 1;
}

.recent-info strong {
    display: block;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 3px;
}

.recent-info p {
    font-size: 13px;
    color: #6B655C;
}

/* ============================================================
   HELP SECTION
============================================================ */

.learning-help {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 22px;
    align-items: center;
}

.help-intro h2 {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 12px;
}

.help-intro p {
    color: #6B655C;
    font-size: 15px;
    line-height: 1.6;
}

.help-card {
    background: #fff;
    border-radius: 22px;
    padding: 28px 24px;
    border: 1px solid rgba(0,0,0,.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
    transition: transform .25s ease, box-shadow .25s ease;
}

.help-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 32px rgba(0,0,0,.08);
}

.help-card img {
    width: 110px;
}

.help-card-eyebrow {
    font-size: 12px;
    color: #9A9088;
    margin-bottom: 2px;
}

.help-card-text strong {
    display: block;
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 2px;
}

.help-card-text p {
    font-size: 13px;
    color: #6B655C;
}

/* ============================================================
   RESPONSIVE
============================================================ */

@media (max-width: 1100px) {
    .course-stats {
        grid-template-columns: repeat(2, 1fr);
    }

    .continue-card {
        grid-template-columns: 1fr;
        text-align: center;
    }

    .continue-action {
        display: flex;
        justify-content: center;
    }

    .course-grid {
        grid-template-columns: 1fr;
    }

    .course-card {
        grid-template-columns: 160px 1fr;
    }

    .learning-help {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .courses-page {
        padding: 24px 20px 60px;
    }

    .hero-content {
        flex-direction: column;
    }

    .hero-image {
        width: 100%;
    }

    .hero-text h1 {
        font-size: 36px;
    }

    .course-stats {
        grid-template-columns: 1fr;
    }

    .courses-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .course-card {
        grid-template-columns: 1fr;
    }
}
```

---

## 5. Filter Tab Interactivity

The course filter pills need a small JavaScript snippet to toggle the active state when clicked. Add this inline at the bottom of `courses.html` (above the script tags), or include it in `nav.js`:

```js
// Filter pill toggle
document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('filter-pill--active'));
        pill.classList.add('filter-pill--active');
    });
});
```

> **Note:** This snippet only handles the visual toggle. If the filters need to actually show/hide course cards, that logic should live in a dedicated `courses.js` and filter the `.course-card` elements by a `data-status` attribute.

---

## 6. Making Stats Dynamic

The four stat cards currently use hardcoded values. When you're ready to pull these from the backend, replace the inner text with template variables or JavaScript DOM updates targeting these elements:

| Stat | Element to target | Data field |
|------|------------------|------------|
| Courses Enrolled | `.stat-number` (1st card) | `user.coursesEnrolled` |
| Lessons Completed | `.stat-number` (2nd card) | `user.lessonsCompleted / user.totalLessons` |
| Total Learning Time | `.stat-number` (3rd card) | `user.learningTime` (format: `Xh Xm`) |
| Current Path | `.stat-path-name` | `user.currentPath.name` |
| Lessons Remaining | `.stat-label` (4th card) | `user.currentPath.lessonsRemaining` |

---

## 7. Progress Bar Values

Progress bar fill widths are set inline via `style="width:XX%"`. When pulling from the backend, set this dynamically:

```js
document.querySelector('.progress-fill').style.width = user.progress + '%';
document.querySelector('.progress-label').textContent = user.progress + '%';
```

---

## 8. Design Tokens (Colors & Typography)

| Token | Value | Usage |
|-------|-------|-------|
| `--gold` | `#D9B14E` / `#E9C96B` | Progress bars, hover states |
| `--gold-deep` | `#C89A2E` | Links, "Recently Viewed" heading |
| `--cream-bg` | `#F5F1E8` | Page background |
| `--cream-hero` | `#FAF6EE` | Hero panel background |
| `--card-border` | `rgba(0,0,0,.06)` | All card borders |
| `--text-muted` | `#6B655C` | Subtext, descriptions |
| `--text-faint` | `#9A9088` | Eyebrow labels, timestamps |
| Font | `Inter` (system fallback: `system-ui`) | All body text |
| Base size | `16px` | Root font size |

---

## 9. Checklist Before Handing to QA

- [ ] All 5 images present in `/images/` folder  
- [ ] `course-hero.png` has transparent background  
- [ ] `courses.css` linked correctly in `<head>`  
- [ ] Three script tags at bottom of `<body>` in correct order  
- [ ] Filter pill toggle script is working  
- [ ] Hover states working on all cards and buttons  
- [ ] Responsive layout tested at 1280px, 1100px, 768px, 375px  
- [ ] Progress bar widths update correctly from data  
- [ ] Stat card values match logged-in user data  
- [ ] `auth.js` redirects unauthenticated users before page renders  
