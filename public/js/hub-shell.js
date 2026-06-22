/**
 * hub-shell.js
 * Universal sidebar for all member-facing hub pages.
 *
 * Pages set:  window.HUB_MEMBER_ACTIVE = 'dashboard' | 'courses' | etc.
 * Pages call: initHubPage(callback)
 * Callback receives: (hub, slug, creatorId, user)
 *
 * Shell handles: auth, membership, branding, sidebar + mobile bar HTML, hiding #hub-loading.
 * Pages handle:  showing their own #main-content, setting document.title, loading page data.
 */

var MEMBER_NAV = [
  { key: 'dashboard',
    label: 'Dashboard',
    href:  'dashboard',
    icon:  '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
  { key: 'courses',
    label: 'Courses',
    href:  'courses',
    icon:  '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { key: 'community',
    label: 'Community',
    href:  null,
    disabled: true,
    icon:  '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
];

var _hubMemberSlug = '';

function _memberSignOut() {
  auth.signOut().then(function() { window.location.href = '/hub/join?hub=' + _hubMemberSlug; });
}

function openMobileNav() {
  var el = document.getElementById('hub-mobile-drawer');
  if (el) el.style.display = 'block';
}

function closeMobileNav() {
  var el = document.getElementById('hub-mobile-drawer');
  if (el) el.style.display = 'none';
}

function initHubPage(callback) {
  var params = new URLSearchParams(window.location.search);
  var slug   = params.get('hub') || '';

  if (!slug) {
    _hubShellError('No hub specified in URL.');
    return;
  }

  db.collection('creators').where('slug', '==', slug).limit(1).get()
    .then(function(snap) {
      if (snap.empty) {
        _hubShellError('Hub not found.');
        return;
      }

      var doc       = snap.docs[0];
      var creatorId = doc.id;
      var hub       = doc.data();

      _injectMemberBranding(hub.branding);

      if (hub.displayName) document.title = hub.displayName;

      auth.onAuthStateChanged(function(user) {
        if (!user) {
          window.location.href = '/hub/join?hub=' + slug;
          return;
        }

        db.collection('users').doc(user.uid).get()
          .then(function(userDoc) {
            var userData = userDoc.exists ? userDoc.data() : {};

            if (userData.creatorId !== creatorId) {
              window.location.href = '/hub/join?hub=' + slug;
              return;
            }

            _renderMemberSidebar(hub, slug, user);
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

function _renderMemberSidebar(hub, slug, user) {
  var mount = document.getElementById('hub-member-sidebar');
  if (!mount) return;

  _hubMemberSlug    = slug;
  var activeKey     = window.HUB_MEMBER_ACTIVE || '';
  var name          = (hub.displayName || 'Your Hub').trim() || 'Your Hub';
  var userName      = user.displayName || user.email || '';
  var userEmail     = user.email || '';

  var logoInner = (hub.branding && hub.branding.logoUrl)
    ? '<img src="' + hub.branding.logoUrl + '" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">'
    : '<span style="font-size:16px;font-weight:800;color:#000;">' + name.charAt(0).toUpperCase() + '</span>';

  var navItems = MEMBER_NAV.map(function(item) {
    var cls  = 'hub-nav-item' + (item.key === activeKey ? ' active' : '') + (item.disabled ? ' disabled' : '');
    var href = item.href ? '/hub/' + item.href + '?hub=' + slug : '#';
    var tag  = item.href && !item.disabled ? 'a' : 'div';
    var attr = item.href && !item.disabled ? ' href="' + href + '"' : '';
    return '<' + tag + ' class="' + cls + '"' + attr + '>' + item.icon + '<span>' + item.label + '</span></' + tag + '>';
  }).join('');

  mount.innerHTML =
    '<div class="hub-mobile-bar" id="hub-mobile-bar" style="display:none;">' +
      '<div class="hub-mobile-name">' + name + '</div>' +
      '<button class="hub-mobile-menu-btn" onclick="openMobileNav()">' +
        '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
          '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' +
        '</svg>' +
      '</button>' +
    '</div>' +
    '<div class="hub-mobile-drawer" id="hub-mobile-drawer">' +
      '<div class="hub-mobile-backdrop" onclick="closeMobileNav()"></div>' +
      '<div class="hub-mobile-panel">' +
        '<button class="hub-mobile-close" onclick="closeMobileNav()">' +
          '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
        navItems +
      '</div>' +
    '</div>' +
    '<aside class="hub-sidebar">' +
      '<div class="hub-sidebar-top">' +
        '<div class="hub-sidebar-logo">' + logoInner + '</div>' +
        '<div class="hub-sidebar-name">' + name + '</div>' +
      '</div>' +
      '<nav class="hub-sidebar-nav">' + navItems + '</nav>' +
      '<div class="hub-sidebar-footer">' +
        '<div class="hub-sidebar-user-name">' + userName + '</div>' +
        '<div class="hub-sidebar-user-email">' + userEmail + '</div>' +
        '<button class="hub-signout-btn" onclick="_memberSignOut()">Sign out</button>' +
      '</div>' +
    '</aside>';

  var loading = document.getElementById('hub-loading');
  if (loading) loading.style.display = 'none';

  if (window.innerWidth <= 768) {
    var bar = document.getElementById('hub-mobile-bar');
    if (bar) bar.style.display = 'flex';
  }
}

function _injectMemberBranding(branding) {
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

  if (branding.bgColor) document.body.style.background = branding.bgColor;
}

function _hubShellError(msg) {
  var el = document.getElementById('hub-loading');
  if (el) {
    el.innerHTML = '<div style="text-align:center;padding:48px 0;color:#999;font-size:14px;">' + msg + '</div>';
  } else {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;font-size:14px;color:#999;">' + msg + '</div>';
  }
}
