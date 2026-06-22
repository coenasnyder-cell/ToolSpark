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
 *   2. No user -> /signon.html
 *   3. Load /creators/{uid} directly (uid is the creatorId)
 *   4. Doc missing -> /hub/setup (creator hasn't set up yet)
 *   5. ownerId mismatch -> denied (safety check)
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
        renderAdminSidebarBranding(hub.branding, hub.displayName);
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
  style.id = 'hub-branding';
  style.textContent = ':root { ' + overrides.join(' ') + ' }';
  document.head.appendChild(style);
}

function renderAdminSidebarBranding(branding, displayName) {
  const logoEl = document.getElementById('admin-hub-logo');
  if (!logoEl) return;

  const name = (displayName || 'Your Hub').trim() || 'Your Hub';
  const nameEl = document.getElementById('admin-hub-name');
  const badgeEl = document.querySelector('.admin-badge');

  if (nameEl) nameEl.style.display = 'none';
  if (badgeEl) badgeEl.style.display = 'none';

  if (branding && branding.logoUrl) {
    logoEl.style.display = 'inline-flex';
    logoEl.style.width = '40px';
    logoEl.style.height = '40px';
    logoEl.style.minHeight = '40px';
    logoEl.style.padding = '0';
    logoEl.style.borderRadius = '10px';
    logoEl.style.background = 'transparent';
    logoEl.style.color = '#000';
    logoEl.style.fontSize = '18px';
    logoEl.style.fontWeight = '800';
    logoEl.style.justifyContent = 'center';
    logoEl.style.textAlign = 'center';
    logoEl.style.wordBreak = 'normal';
    logoEl.style.lineHeight = '1';
    logoEl.innerHTML = '<img src="' + branding.logoUrl + '" alt="Hub logo" style="width:100%;height:100%;object-fit:contain;border-radius:10px;" />';
    return;
  }

  logoEl.style.display = 'inline-flex';
  logoEl.style.width = 'auto';
  logoEl.style.height = 'auto';
  logoEl.style.minHeight = '40px';
  logoEl.style.maxWidth = '100%';
  logoEl.style.padding = '10px 12px';
  logoEl.style.borderRadius = '12px';
  logoEl.style.background = 'rgba(255,255,255,.06)';
  logoEl.style.color = '#fff';
  logoEl.style.fontSize = '14px';
  logoEl.style.fontWeight = '700';
  logoEl.style.justifyContent = 'flex-start';
  logoEl.style.textAlign = 'left';
  logoEl.style.wordBreak = 'break-word';
  logoEl.style.lineHeight = '1.25';
  logoEl.textContent = name;
}

function _adminShellError(msg) {
  const el = document.getElementById('admin-loading');
  if (el) {
    el.innerHTML = '<div style="text-align:center;padding:60px 0;color:#999;font-size:14px;">' + msg + '</div>';
  } else {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;font-size:14px;color:#999;">' + msg + '</div>';
  }
}
