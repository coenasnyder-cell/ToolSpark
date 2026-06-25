// credits.js — credit gating, deduction, modal, chip display
// Requires: auth.js loaded first. Never touches Firebase directly — reads window.tsUser.
(function () {

  // ------- core promise helper -------
  function waitForUser() {
    return new Promise(function (resolve) {
      if (window._tsUserReady) { resolve(window.tsUser); return; }
      document.addEventListener('tsUserReady', function handler() {
        document.removeEventListener('tsUserReady', handler);
        resolve(window.tsUser);
      });
    });
  }

  // ------- main gating function -------
  // Returns true if the action should proceed, false otherwise.
  window.tsDeductCredits = async function (cost) {
    cost = (typeof cost === 'number') ? cost : 5;

    var user = await waitForUser();

    if (!user) {
      window.location.href = '/login.html';
      return false;
    }

    // Admin bypass — no credit check at all
    if (user.role === 'admin') {
      return true;
    }

    // No paid tier — send to pricing
    if (!user.tier) {
      window.location.href = '/pricing.html';
      return false;
    }

    // Not enough credits
    if (user.credits < cost) {
      showCreditsModal(user.credits, cost);
      return false;
    }

    // Call Cloud Function to deduct
    try {
      var deductFn = firebase.functions().httpsCallable('deductCredits');
      var result   = await deductFn({ cost: cost });
      // Keep local count in sync
      window.tsUser.credits = result.data.remaining;
      _updateChip(window.tsUser.credits);
      return true;
    } catch (err) {
      console.error('[credits.js] deductCredits Cloud Function failed:', err);
      return false;
    }
  };

  // ------- page-level gate (optional — call at top of page if whole page needs a tier) -------
  window.tsGatePage = async function () {
    var user = await waitForUser();
    if (!user)             { window.location.href = '/login.html';  return false; }
    if (user.role === 'admin') return true;
    if (!user.tier)        { window.location.href = '/pricing.html'; return false; }
    return true;
  };

  // ------- credits modal -------
  function showCreditsModal(current, needed) {
    var existing = document.getElementById('ts-credits-modal');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'ts-credits-modal';
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:9999',
      'background:rgba(0,0,0,0.55)',
      'display:flex','align-items:center','justify-content:center'
    ].join(';');

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:40px 32px;
                  max-width:420px;width:90%;text-align:center;
                  font-family:system-ui,sans-serif;box-shadow:0 8px 40px rgba(0,0,0,.18)">
        <div style="font-size:2.5rem;margin-bottom:12px">⚡</div>
        <h2 style="margin:0 0 10px;font-size:1.4rem">Not enough credits</h2>
        <p style="color:#666;margin:0 0 28px;line-height:1.5">
          You have <strong>${current}</strong> credit${current === 1 ? '' : 's'} but
          this tool costs <strong>${needed}</strong>.
        </p>
        <a href="/pricing.html"
           style="display:inline-block;background:#6C63FF;color:#fff;
                  padding:13px 32px;border-radius:8px;text-decoration:none;
                  font-weight:700;font-size:1rem;margin-bottom:14px">
          Get more credits
        </a><br>
        <button id="ts-modal-close"
                style="background:none;border:none;color:#999;cursor:pointer;
                       font-size:.9rem;margin-top:4px;padding:6px 12px">
          Cancel
        </button>
      </div>`;

    document.body.appendChild(overlay);

    document.getElementById('ts-modal-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
  }

  window.showCreditsModal = showCreditsModal;

  // ------- credits chip -------
  function _updateChip(credits) {
  var count = document.getElementById('header-credits-count');
  if (count) count.textContent = credits;
}

  // Populate chip on load (skip for admins — no chip makes sense)
  document.addEventListener('tsUserReady', function (e) {
    var user = e.detail;
    if (user && user.role !== 'admin') _updateChip(user.credits);
  });

})();