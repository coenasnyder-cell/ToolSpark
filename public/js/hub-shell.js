/**
 * hub-shell.js
 * Shared loader for all member-facing hub pages.
 *
 * Pages call: initHubPage(callback)
 * Callback receives: (hub, slug, creatorId, user)
 *
 * Requires: auth and db already initialized on window by the calling page.
 *
 * Flow:
 *   1. Read ?hub= slug from URL
 *   2. Load /creators doc by slug
 *   3. Inject branding CSS override
 *   4. Check ToolSpark auth
 *   5. Verify user is a member of this hub
 *   6. Call callback with hub data
 */

function initHubPage(callback) {
  const params  = new URLSearchParams(window.location.search);
  const slug    = params.get('hub') || '';

  if (!slug) {
    _hubShellError('No hub specified in URL.');
    return;
  }

  // Load hub doc by slug
  db.collection('creators').where('slug', '==', slug).limit(1).get()
    .then(function(snap) {
      if (snap.empty) {
        _hubShellError('Hub not found.');
        return;
      }

      const doc       = snap.docs[0];
      const creatorId = doc.id;
      const hub       = doc.data();

      // Inject branding before anything else renders
      _injectBranding(hub.branding);

      // Set page title to hub name
      if (hub.displayName) {
        document.title = hub.displayName;
      }

      // Auth check
      auth.onAuthStateChanged(function(user) {
        if (!user) {
          window.location.href = '/hub/join?hub=' + slug;
          return;
        }

        // Membership check: /users/{uid}.creatorId must match this hub
        db.collection('users').doc(user.uid).get()
          .then(function(userDoc) {
            const userData = userDoc.exists ? userDoc.data() : {};

            if (userData.creatorId !== creatorId) {
              // Not a member of this hub — send to join page
              window.location.href = '/hub/join?hub=' + slug;
              return;
            }

            // All good — hand off to page
            callback(hub, slug, creatorId, user);
          })
          .catch(function() {
            window.location.href = '/hub/join?hub=' + slug;
          });
      });
    })
    .catch(function(err) {
      _hubShellError('Could not load hub: ' + err.message);
    });
}

function _injectBranding(branding) {
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

  if (branding.bgColor) {
    document.body.style.background = branding.bgColor;
  }
}

function _hubShellError(msg) {
  const el = document.getElementById('hub-loading');
  if (el) {
    el.innerHTML = '<div style="text-align:center;padding:48px 0;color:#999;font-size:14px;">' + msg + '</div>';
  } else {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;font-size:14px;color:#999;">' + msg + '</div>';
  }
}
