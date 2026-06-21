# Spec: Stripe Subscription Integration
**Status:** Backend complete — frontend wiring needed
**Date:** 2026-06-20

---

## What Was Built

Three new Firebase Functions and one nav.js change. All backend logic is done. Skippy's job is to wire the frontend.

---

## Pricing Structure

| Tier | Price | Credits/month | Credit cost: expensive tools | Credit cost: everything else |
|---|---|---|---|---|
| **Starter** | $10/mo | 50 | 5 per run | 1 per run |
| **Premium** | $27/mo | 100 | 5 per run | 1 per run |
| **Advanced** | $47/mo | 300 | 5 per run | 1 per run |

**Expensive tools (5 credits/run):** Find Your Spark, Discover Your Breakthrough, Audience Deep Dive, Tool Finder, Journey Companion, Build Agent

**Everything else:** 1 credit/run

---

## Firestore — New Fields on `users/{uid}`

These fields are now written by the backend. Do NOT write them from the frontend.

```
subscriptionTier:    'starter' | 'premium' | 'advanced' | null
subscriptionStatus:  'active' | 'cancelled' | 'past_due' | null
credits:             number  (current balance, resets monthly on renewal)
stripeCustomerId:    string  (Stripe customer ID)
stripeSubscriptionId: string (Stripe subscription ID)
```

---

## New Firebase Functions

### 1. `createCheckoutSession` (HTTP POST, auth required)

Starts a Stripe checkout session. Call this when the user clicks a "Subscribe" or "Upgrade" button.

**Request:**
```js
const idToken = await firebase.auth().currentUser.getIdToken();
const res = await fetch('https://[region]-[project].cloudfunctions.net/createCheckoutSession', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify({ tier: 'premium' }), // 'starter' | 'premium' | 'advanced'
});
const { url } = await res.json();
window.location.href = url; // redirect to Stripe hosted checkout
```

**Success:** Stripe handles payment. On completion, user is redirected to:
- `https://toolspark.co/dashboard.html?checkout=success`
- `https://toolspark.co/pricing.html?checkout=cancelled` (if they bailed)

**After redirect:** `subscriptionTier`, `subscriptionStatus`, and `credits` are already written to Firestore by the webhook. You don't need to do anything — just show a success message if `?checkout=success` is in the URL.

---

### 2. `stripeWebhook` (HTTP POST, no auth — Stripe signs it)

Do NOT call this from the frontend. Register its URL in the Stripe dashboard:
```
https://[region]-[project].cloudfunctions.net/stripeWebhook
```

Events it handles automatically:
- `checkout.session.completed` → activates tier, seeds credits
- `invoice.paid` → resets credits on monthly renewal
- `customer.subscription.updated` → handles upgrades/downgrades
- `customer.subscription.deleted` → cancels tier, zeroes credits

---

### 3. `deductCredits` (Callable, auth required)

Call this before running a tool. It uses a Firestore transaction so balance can't go negative.

```js
const deductCredits = firebase.functions().httpsCallable('deductCredits');

try {
  const result = await deductCredits({ cost: 5 }); // cost = credits to deduct
  // result.data.creditsRemaining = new balance
  // Now run the tool
} catch (err) {
  if (err.code === 'functions/resource-exhausted') {
    // Show "Not enough credits" UI
  }
}
```

Admin users automatically bypass the check (returns `creditsRemaining: -1`).

---

## `window.tsUser` (available on every member page after nav loads)

`nav.js` now exposes this after the Firestore read on page load:

```js
window.tsUser = {
  role:    'member' | 'admin' | null,
  tier:    'starter' | 'premium' | 'advanced' | null,
  credits: 42, // current balance
}
```

Use this to gate UI without a second Firestore read. Example:
```js
// Wait for nav to finish loading, then check
window.addEventListener('load', function() {
  if (!window.tsUser || !window.tsUser.tier) {
    // No subscription — show upgrade prompt
  }
  if (window.tsUser.tier === 'starter') {
    // Hide Premium/Advanced-only features
  }
});
```

---

## Secrets Skippy Needs to Set in Firebase

Coena needs to create these in the Stripe dashboard, then set them as Firebase secrets:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_PRICE_STARTER
firebase functions:secrets:set STRIPE_PRICE_PREMIUM
firebase functions:secrets:set STRIPE_PRICE_ADVANCED
```

The price IDs come from the Stripe dashboard after creating the three subscription products.

---

## Frontend Tasks for Skippy

- [ ] Create a pricing/upgrade page (or modal) with three tier cards — calls `createCheckoutSession` on click
- [ ] On `dashboard.html`, check for `?checkout=success` and show a welcome/confirmation message
- [ ] Gate tool access by tier using `window.tsUser.tier` (Starter can't see Premium/Advanced tools)
- [ ] Show credit balance somewhere visible (header or sidebar) using `window.tsUser.credits`
- [ ] Before each tool run, call `deductCredits({ cost: N })` — show "not enough credits" UI on `resource-exhausted` error
- [ ] Add upgrade nudge when credits are low (e.g., < 10 remaining)

---

## Tool Tier Access

| Tool category | Starter | Premium | Advanced |
|---|---|---|---|
| Clarity tools (Find Your Spark, Breakthrough, Audience, Tool Finder) | ✅ | ✅ | ✅ |
| Journey Companion | ✅ | ✅ | ✅ |
| Creator Hub | ❌ | ✅ | ✅ |
| Build & Planning tools | ❌ | ✅ | ✅ |
| Media tools + ConvoFlip | ❌ | ✅ | ✅ |
| Marketing & Content tools | ❌ | ❌ | ✅ |
| Sales & Conversion tools | ❌ | ❌ | ✅ |
| Launch tools | ❌ | ❌ | ✅ |
