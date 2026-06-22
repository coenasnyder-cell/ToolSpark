// Inject sidebar CSS once — prefixed ts- to avoid conflicts with each page's existing styles
(function () {
  if (document.getElementById('ts-admin-shell-css')) return;
  const s = document.createElement('style');
  s.id = 'ts-admin-shell-css';
  s.textContent = `
  .ts-header {
  position: fixed; top: 0; left: 0; right: 0; 
  height: var(--header-height);
  z-index: 250;
  background: #000000; border-bottom: 1px solid #000000;
  display: flex; align-items: center; gap: 12px;
  padding: 0 24px;
}
.ts-header-wordmark { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; }
.ts-header-wordmark .tool { color: #ffffff; }
.ts-header-wordmark .spark { color: #f5c842; }
.ts-header-tag {
  font-size: 11px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: #b08cf0;
}
.ts-header-brandblock { display: flex; flex-direction: column; line-height: 1.1; }

    #ts-admin-sidebar { display: contents; }
    .ts-sidebar {
      width: 220px; flex-shrink: 0;
      background: #ffffff; border-right: 1px solid #e8e4f0;
      display: flex; flex-direction: column;
      position: fixed; 
      top: var(--header-height); 
      left: 0; 
      height: calc(100vh - 60px); z-index: 200;
    }
    .ts-sidebar-top { padding: 14px 20px 20px; border-bottom: 1px solid #e8e4f0; 
      border-bottom: none;
   }
    .ts-sidebar-name { font-size: 14px; font-weight: 700; color: #1a1523; line-height: 1.3; }
    .ts-admin-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      color: #6b2fb3; opacity: .7; margin-top: 0px; letter-spacing: .06em;
    }
    .ts-sidebar-nav {
      padding: 8px 12px 16px;
      display: flex; flex-direction: column; gap: 2px; overflow-y: auto;
    }
    .ts-nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px;
      color: #6b6580; font-size: 14px; font-weight: 500;
      text-decoration: none; transition: background .15s, color .15s;
      font-family: inherit;
    }
    .ts-nav-item:hover { background: #f7f5fb; color: #1a1523; }
    .ts-nav-item.active { background: rgba(107,47,179,.08); color: #6b2fb3; font-weight: 700; }
    .ts-nav-item svg { flex-shrink: 0; opacity: .6; }
    .ts-nav-item.active svg { opacity: 1; }
    .ts-sidebar-footer { padding: 12px 12px 16px; border-top: 1px solid #e8e4f0; }
    .ts-sidebar-user { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; }
    .ts-user-avatar {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      background: rgba(107,47,179,0.08); border: 1px solid rgba(107,47,179,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #6b2fb3; overflow: hidden;
    }
    .ts-user-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .ts-user-info { flex: 1; min-width: 0; }
    .ts-user-name { font-size: 13px; font-weight: 700; color: #1a1523; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ts-user-role { font-size: 11px; color: #9e9ab0; }
    .ts-signout-btn {
      display: flex; align-items: center; gap: 8px;
      background: none; border: none; color: #9e9ab0;
      font-size: 12px; font-weight: 500; cursor: pointer;
      padding: 7px 10px; border-radius: 6px; width: 100%;
      text-align: left; transition: color .15s, background .15s;
      font-family: inherit; margin-top: 2px;
    }
    .ts-signout-btn:hover { background: rgba(220,50,50,.08); color: #e05555; }
    @media (max-width: 768px) { .ts-sidebar { display: none; } }
  `;
  document.head.appendChild(s);
}());

const SITE_ADMIN_NAV = [
  { label: 'Dashboard',   href: '/admindashboard',    key: 'dashboard',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
  { label: 'Blog',        href: '/admin/blog',        key: 'blog',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
  { label: 'Marketplace', href: '/adminmarketplace',  key: 'marketplace',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
  { label: 'Community',   href: '/adminthreads',      key: 'threads',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { label: 'API Usage',   href: '/adminapiusage',     key: 'api',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { label: 'Sparky',      href: '/sparky',            key: 'sparky',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
];

function _siteAdminSignOut() {
  auth.signOut().then(function () { window.location.href = '/signon.html'; });
}

function _renderSiteAdminSidebar(user, logoUrl) {
  const activeKey = window.SITE_ADMIN_ACTIVE || '';
  const name = user.displayName || user.email || 'Admin';
  const initial = name.charAt(0).toUpperCase();
  const avatarInner = user.photoURL
    ? '<img src="' + user.photoURL + '" alt="avatar">'
    : initial;

  const navHtml = SITE_ADMIN_NAV.map(function (item) {
    const cls = 'ts-nav-item' + (item.key === activeKey ? ' active' : '');
    return '<a class="' + cls + '" href="' + item.href + '">' + item.icon + '<span>' + item.label + '</span></a>';
  }).join('');

  const mount = document.getElementById('ts-admin-sidebar');
  if (!mount) return;
  mount.innerHTML =
    '<aside class="ts-sidebar">' +
      '<nav class="ts-sidebar-nav" style="flex:1;">' + navHtml + '</nav>' +
      '<div class="ts-sidebar-footer">' +
        '<div class="ts-sidebar-user">' +
          '<div class="ts-user-avatar">' + avatarInner + '</div>' +
          '<div class="ts-user-info">' +
            '<div class="ts-user-name">' + name + '</div>' +
            '<div class="ts-user-role">Admin</div>' +
          '</div>' +
        '</div>' +
        '<button class="ts-signout-btn" onclick="_siteAdminSignOut()">' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
          'Sign Out' +
        '</button>' +
      '</div>' +
    '</aside>';
}
function _renderSiteAdminHeader(user, logoUrl) {
  const mount = document.getElementById('ts-admin-header');
  if (!mount) return;
mount.innerHTML =
  '<header class="ts-header">' +
    '<div class="ts-header-brandblock">' +
      '<span class="ts-header-wordmark"><span class="tool">Tool</span><span class="spark">Spark</span></span>' +
      '<span class="ts-header-tag">Creator Hub</span>' +
    '</div>' +
  '</header>';
}

function initSiteAdminPage(callback) {
  auth.onAuthStateChanged(async function (user) {
    if (!user) { window.location.href = '/signon.html'; return; }

    try {
      const snap = await db.collection('users').doc(user.uid).get();
      const role = snap.exists ? snap.data().userRole : 'member';
      if (role !== 'admin') {
        const el = document.getElementById('access-denied');
        if (el) el.style.display = 'flex';
        return;
      }
    } catch (e) {
      const el = document.getElementById('access-denied');
      if (el) el.style.display = 'flex';
      return;
    }

    let logoUrl = '';
    try {
      const brandSnap = await db.collection('settings').doc('branding').get();
      if (brandSnap.exists) logoUrl = brandSnap.data().logoUrl || '';
    } catch (e) {}

    _renderSiteAdminSidebar(user, logoUrl);
    _renderSiteAdminHeader(user, logoUrl); 
    if (callback) callback(user);
  });
}
