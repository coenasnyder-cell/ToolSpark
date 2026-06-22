// Inject sidebar CSS once — prefixed ts- to avoid conflicts with each page's existing styles
(function () {
  if (document.getElementById('ts-admin-shell-css')) return;
  const s = document.createElement('style');
  s.id = 'ts-admin-shell-css';
  s.textContent = `
    #ts-admin-sidebar { display: contents; }
    .ts-sidebar {
      width: 220px; flex-shrink: 0;
      background: #ffffff; border-right: 1px solid #e8e4f0;
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; height: 100vh; z-index: 200;
    }
    .ts-sidebar-top { padding: 14px 20px 20px; border-bottom: 1px solid #e8e4f0; 
      border-bottom: none;
   }
    .ts-sidebar-logo {
      width: 40px; height: 40px; border-radius: 10px;
      background: #f5c842; display: flex; align-items: center;
      justify-content: center; overflow: hidden; margin-bottom: 6px;
      font-size: 14px; font-weight: 800; color: #000; letter-spacing: -.5px;
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
    .ts-sidebar-footer { padding: 16px 12px; border-top: 1px solid #e8e4f0; }
    .ts-sidebar-user-name {
      font-size: 13px; font-weight: 600; color: #1a1523;
      padding: 0 4px; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ts-signout-btn {
      background: none; border: none; color: #9e9ab0;
      font-size: 12px; font-weight: 500; cursor: pointer;
      padding: 6px 8px; border-radius: 6px; width: 100%;
      text-align: left; transition: color .15s, background .15s;
      font-family: inherit;
    }
    .ts-signout-btn:hover { background: rgba(220,50,50,.08); color: #e05555; }
    @media (max-width: 768px) { .ts-sidebar { display: none; } }
  `;
  document.head.appendChild(s);
}());

const SITE_ADMIN_NAV = [
  { label: 'Dashboard',   href: '/admindashboard',    key: 'dashboard',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
  { label: 'Users',       href: '/adminuserprofiles', key: 'users',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { label: 'Courses',     href: '/admincourses',      key: 'courses',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { label: 'Tools',       href: '/admintools',        key: 'tools',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  { label: 'CRM',         href: '/admincrm',          key: 'crm',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/></svg>' },
  { label: 'Threads',     href: '/adminthreads',      key: 'threads',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
  { label: 'Events',      href: '/adminevents',       key: 'events',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { label: 'Waitlist',    href: '/adminwaitlist',     key: 'waitlist',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
  { label: 'Marketplace', href: '/adminmarketplace',  key: 'marketplace',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
  { label: 'API Usage',   href: '/adminapiusage',     key: 'api',
    icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
];

function _siteAdminSignOut() {
  auth.signOut().then(function () { window.location.href = '/signon.html'; });
}

function _renderSiteAdminSidebar(user, logoUrl) {
  const activeKey = window.SITE_ADMIN_ACTIVE || '';
  const name = user.displayName || user.email || 'Admin';

  const logoInner = logoUrl
    ? '<img src="' + logoUrl + '" style="width:100%;height:100%;object-fit:contain;" alt="">'
    : 'TS';

  const navHtml = SITE_ADMIN_NAV.map(function (item) {
    const cls = 'ts-nav-item' + (item.key === activeKey ? ' active' : '');
    return '<a class="' + cls + '" href="' + item.href + '">' + item.icon + '<span>' + item.label + '</span></a>';
  }).join('');

  const mount = document.getElementById('ts-admin-sidebar');
  if (!mount) return;
  mount.innerHTML =
    '<aside class="ts-sidebar">' +
      '<div class="ts-sidebar-top">' +
        '<div class="ts-sidebar-logo">' + logoInner + '</div>' +
      '</div>' +
      '<nav class="ts-sidebar-nav">' + navHtml + '</nav>' +
      '<div class="ts-sidebar-footer">' +
        '<div class="ts-sidebar-user-name">' + name + '</div>' +
        '<button class="ts-signout-btn" onclick="_siteAdminSignOut()">Sign out</button>' +
      '</div>' +
    '</aside>';
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
    if (callback) callback(user);
  });
}
