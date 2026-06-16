# ToolSpark Site QA Log
**Date:** June 2026  
**Auditor:** Cowork + Coena  
**Scope:** All pages — visual, links, tool functionality

## Status Key
- ✅ Pass
- ⚠️ Issue (non-blocking)
- ❌ Fail (needs fix)
- 🔲 Not tested yet

---

## Shared Foundation (Onboarding Flow)
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Onboarding | /onboarding | 🔲 | |
| Sparky intro | /sparky | 🔲 | |
| Find Your Spark | /spark | 🔲 | |
| Spark Results | /spark-results | 🔲 | |
| Audience Tool | /audiencetool | 🔲 | |
| Audience Results | /audienceresults | 🔲 | |
| Clarity | /clarity | 🔲 | |
| Journey Companion | /journey-companion | 🔲 | |

## Certification Flow
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Cert Hub | /cert-hub | 🔲 | |
| Phase 2 | /cert-phase2 | 🔲 | |
| DWY (submit form) | /dwy | 🔲 | |
| Certificate | /certificate | 🔲 | |
| Graduation | /graduation | 🔲 | |

## Build Tools
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Build Agent | /build-agent | 🔲 | |
| Prompt Generator | /prompt-generator | 🔲 | |
| Value Mirror | /value-tool | 🔲 | |
| Offer Sort | /offer-sort | 🔲 | |
| Offer Builder | /offer-builder | 🔲 | |
| Journey Builder | /journey-builder | 🔲 | |
| Sales Copy Builder | /sales-page-builder | 🔲 | |
| Funnel Generator | /funnel-generator | 🔲 | |
| Launch Kit | /launch-kit | 🔲 | |
| Email Sequence | /email-sequence | 🔲 | |

## Content Hub
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Content Hub | /content-hub | 🔲 | |
| Post Ideas | /content-generator | 🔲 | |
| Quick Recorder | /quick-recorder | 🔲 | |
| Post Image Maker | /post-image-maker | 🔲 | |
| 31-Day Planner | /social-scheduler | 🔲 | |

## DIY Path
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| DIY Checklist | /diy | 🔲 | |

## Post-Graduation
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Marketplace | /marketplace | 🔲 | |

## Creator Hub
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Hub Admin | /hub-admin | 🔲 | |
| Hub Setup | /hub-setup | 🔲 | |
| Hub Settings | /hub-settings | 🔲 | |
| Hub Launch | /hub-launch | 🔲 | |

## Member Nav Pages
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Dashboard | /dashboard | 🔲 | |
| Roadmap | /roadmap | 🔲 | |
| Community | /community | 🔲 | |
| Courses | /courses | 🔲 | |
| Inbox | /inbox | 🔲 | |
| My Agents | /useragents | 🔲 | |

## Admin Pages
| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Admin Dashboard | /admindashboard | 🔲 | |
| Admin Certificates | /admincertificates | 🔲 | |
| Admin CRM | /admincrm | 🔲 | |
| Admin User Profiles | /adminuserprofiles | 🔲 | |
| Admin Content Hub | /admin-content-hub | 🔲 | |
| Admin Courses Hub | /admin-courses-hub | 🔲 | |
| Admin Events | /adminevents | 🔲 | |
| Admin Waitlist | /adminwaitlist | 🔲 | |
| API Usage | /adminapiusage | 🔲 | |

---

## Issues Found

| # | Page | Severity | Issue | Fix |
|---|------|----------|-------|-----|
| 1 | Dashboard | ✅ | "? MEMBERS AREA" badge on welcome banner — broken icon or placeholder showing as `?` | Removed the `?` — now reads "Members Area" cleanly |
| 2 | Dashboard | ✅ | "Lesson Generator" card visible in Quick Access for member Billy — admin-only tool | Card hidden by default, shown only when `isAdmin` is true |
| 3 | Audience Deep Dive | ✅ | Typo: "Your Client **Provile**" — should be "Profile" | Fixed in audiencetool.html |
| 4 | Value Mirror | ✅ | Subtitle reads "TOOLSPARK · ROADBLOCK 8" — sounds negative | Changed to "TOOLSPARK · VALUE MIRROR" |
| 5 | Content Hub | ✅ | User name shows "Loading..." in bottom-left sidebar — profile not loading on this page | Now populates from auth user immediately as fallback before Firestore read completes |
| 6 | Offer Builder | ✅ | TOOL field shows generic "Your AI tool" not Billy's actual tool name "The Messaging Gap Finder" | Now falls back to value_tool TOOL_NAME, then clarity session chosenToolName |
| 7 | Journey Builder | ✅ | Shows "Journey Saved" indicator but all fields are empty | Now validates saved doc has real content before showing saved state |
| 8 | Marketplace | ⚠️ | "Build Agent" listed as a public marketplace tool (internal tool, not a student build) | Remove from public marketplace before launch — needs admin action in Firestore |
| 9 | Courses | ⚠️ | "Your First Build" course has broken/missing thumbnail | Needs thumbnail image URL — admin action in course editor |
| 10 | DWY (/dwy) | ⚠️ | Old "Certification Roadmap" page still live alongside new cert-hub/cert-phase2 — potential confusion | Under review — cert-hub "Review Phase 1" now links to roadmap.html instead |

