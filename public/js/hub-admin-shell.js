/**
 * hub-admin-shell.js
 * Universal sidebar for all creator admin pages.
 *
 * Pages set:  window.HUB_ADMIN_ACTIVE = 'key'  (before script loads)
 * Pages call: initAdminPage(callback)
 * Callback receives: (hub, creatorId)
 *
 * Shell handles: auth, branding injection, sidebar HTML + nav, hiding #admin-loading.
 * Pages handle:  showing their own #admin-main, setting document.title, loading page data.
 */

var ADMIN_NAV = [
  { key: 'admin',
    label: 'Overview',
    href:  '/hub/admin',
    icon:  '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
  { key: 'members',
    label: 'Members',
    href:  '/hub/admin-members',
    icon:  '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { key: 'courses',
    label: 'Courses',
    href:  '/hub/admin-courses',
    icon:  '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { key: 'tools',
    label: 'Tools',
    href:  '/hub/admin-tools',
    icon:  '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  { key: 'settings',
    label: 'Settings',
    href:  '/hub/admin-settings',
    icon:  '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
  { key: 'build-hub',
    label: 'Build Hub',
    href:  '/hub/build-hub',
    icon:  '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-7.9 7.9-3.3.6.6-3.3 7.6-8.2z"/><path d="M12 20h9"/></svg>' },
];

function _adminSignOut() {
  firebase.auth().signOut().then(function() { window.location.href = '/signon.html'; });
}

function initAdminPage(callback) {
  firebase.auth().onAuthStateChanged(function(user) {
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

        var hub = doc.data();

        if (hub.ownerId !== user.uid) {
          _adminShellError('Access denied.');
          return;
        }

        _injectAdminBranding(hub.branding);
        _renderAdminSidebar(hub);
        callback(hub, user.uid);
      })
      .catch(function(err) {
        _adminShellError('Could not load hub: ' + err.message);
      });
  });
}

function _renderAdminSidebar(hub) {
  var mount = document.getElementById('hub-admin-sidebar');
  if (!mount) return;

  var activeKey = window.HUB_ADMIN_ACTIVE || '';
  var slug      = hub.slug || '';
  var name      = (hub.displayName || 'Your Hub').trim() || 'Your Hub';

  var logoInner = (hub.branding && hub.branding.logoUrl)
    ? '<img src="' + hub.branding.logoUrl + '" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">'
    : '<span style="font-size:16px;font-weight:800;color:#000;">' + name.charAt(0).toUpperCase() + '</span>';

  var navHtml = ADMIN_NAV.map(function(item) {
    var active = item.key === activeKey ? ' active' : '';
    return '<a class="hub-nav-item' + active + '" href="' + item.href + '">' + item.icon + '<span>' + item.label + '</span></a>';
  }).join('') +
  '<div class="hub-nav-divider"></div>' +
  '<a class="hub-nav-item hub-view-link" href="/hub/dashboard?hub=' + slug + '">' +
    '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
      '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
      '<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>' +
    '</svg>View Hub' +
  '</a>';

  mount.innerHTML =
    '<aside class="hub-sidebar">' +
      '<div class="hub-sidebar-top">' +
        '<div class="hub-sidebar-logo">' + logoInner + '</div>' +
        '<div class="hub-sidebar-name">' + name + '</div>' +
        '<div class="hub-admin-badge">Admin</div>' +
      '</div>' +
      '<nav class="hub-sidebar-nav">' + navHtml + '</nav>' +
      '<div class="hub-sidebar-footer">' +
        '<button class="hub-signout-btn" onclick="_adminSignOut()">Sign out</button>' +
      '</div>' +
    '</aside>';

  var loading = document.getElementById('admin-loading');
  if (loading) loading.style.display = 'none';
}

function _injectAdminBranding(branding) {
  if (!branding) return;
  var overrides = [];
  if (branding.primaryColor) overrides.push('--yellow: ' + branding.primaryColor + ';');
  if (branding.accentColor)  overrides.push('--purple: ' + branding.accentColor  + ';');
  if (branding.bgColor)      overrides.push('--bg: '     + branding.bgColor      + ';');
  if (!overrides.length) return;

  var style = document.createElement('style');
  style.id = 'hub-branding';
  style.textContent = ':root { ' + overrides.join(' ') + ' }';
  document.head.appendChild(style);
}

function _adminShellError(msg) {
  var el = document.getElementById('admin-loading');
  if (el) {
    el.innerHTML = '<div style="text-align:center;padding:60px 0;color:#999;font-size:14px;">' + msg + '</div>';
  } else {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;font-size:14px;color:#999;">' + msg + '</div>';
  }
}
