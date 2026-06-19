/**
 * hub-admin-shell.js
 * Shared loader for all creator admin pages.
 *
 * Usage: initAdminPage(callback)
 * Callback receives: (hub, creatorId)
 *
 * Requires: auth and db already initialized on window by the calling page.
 *
 * Flow:
 *   1. Wait for Firebase auth
 *   2. No user → /signon.html
 *   3. Load /creators/{uid} directly (uid is the creatorId)
 *   4. Doc missing → /hub/setup (creator hasn't set up yet)
 *   5. ownerId mismatch → denied (safety check)
 *   6. Inject branding, call callback
 */

function initAdminPage(callback) {
  auth.onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = '/signon.html?redirect=/hub/admin';
      return;
    }

    db.collection('creators').doc(user.uid).get()
      .then(function(doc) {
        if (!doc.exists) {
          window.location.href = '/hub/setup';
          return;
        }

        const hub = doc.data();

        // Safety: make sure this doc actually belongs to the caller
        if (hub.ownerId !== user.uid) {
          _adminShellError('Access denied.');
          return;
        }

        _injectAdminBranding(hub.branding);
        callback(hub, user.uid);
      })
      .catch(function(err) {
        _adminShellError('Could not load hub: ' + err.message);
      });
  });
}

function _injectAdminBranding(branding) {
  if (!branding) return;
  const overrides = [];
  if (branding.primaryColor) overrides.push('--yellow: ' + branding.primaryColor + ';');
  if (branding.accentColor)  overrides.push('--purple: ' + branding.accentColor + ';');
  if (branding.bgColor)      overrides.push('--bg: '     + branding.bgColor + ';');
  if (!overrides.length) return;

  const style = document.createElement('style');
  style.id    = 'hub-branding';
  style.textContent = ':root { ' + overrides.join(' ') + ' }';
  document.head.appendChild(style);
}

function _adminShellError(msg) {
  const el = document.getElementById('admin-loading');
  if (el) {
    el.innerHTML = '<div style="text-align:center;padding:60px 0;color:#999;font-size:14px;">' + msg + '</div>';
  } else {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;font-size:14px;color:#999;">' + msg + '</div>';
  }
}
