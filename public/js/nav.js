// Shared sidebar nav + header — call initNav('pagekey', 'Page Title') on each member page.
(function() {
  var HAMBURGER_SVG = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var BELL_SVG = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>';
  var SIGNOUT_SVG = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
  var SIGNIN_SVG = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>';
  var ADMIN_SVG = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

  var ITEMS = [
    {
      key: 'community', href: 'community.html', label: 'Community',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 00-3-3.87"/></svg>'
    },
    {
      key: 'dashboard', href: 'dashboard.html', label: 'Dashboard',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
    },
    {
      key: 'courses', href: 'courses.html', label: 'Courses',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 17A2.5 2.5 0 014 14.5V5a2 2 0 012-2h14v14"/></svg>'
    },
    {
      key: 'roadmap', href: 'roadmap.html', label: 'My Roadmap',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>'
    },
    {
      key: 'inbox', href: 'inbox.html', label: 'Inbox',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
    },
    {
      key: 'lesson-projects', href: 'lesson-projects.html', label: 'Lesson Generator',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
    },
  ];

  function injectHeaderStyles() {
    if (document.getElementById('nav-header-styles')) return;
    var s = document.createElement('style');
    s.id = 'nav-header-styles';
    s.textContent =
      '.top-header{background:var(--dark2);border-bottom:1px solid var(--border-dark);height:var(--header-height);display:flex;align-items:center;justify-content:space-between;padding:0 2rem;position:sticky;top:0;z-index:50;gap:1rem;}' +
      '.hamburger-btn{display:none;background:none;border:none;color:#F0EDE6;cursor:pointer;padding:6px;border-radius:6px;transition:background 0.15s;flex-shrink:0;align-items:center;justify-content:center;}' +
      '.hamburger-btn:hover{background:rgba(255,255,255,0.08);}' +
      '.header-title{font-family:"Playfair Display",serif;font-size:20px;font-weight:400;color:#F0EDE6;flex:1;line-height:1.2;}' +
      '.header-actions{display:flex;align-items:center;gap:10px;flex-shrink:0;}' +
      '.notif-btn{width:36px;height:36px;border-radius:50%;background:var(--dark3);border:1px solid var(--border-dark);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#9A9488;transition:all 0.15s;position:relative;text-decoration:none;}' +
      '.notif-btn:hover{border-color:rgba(201,168,76,0.3);color:var(--gold);}' +
      '.notif-dot{position:absolute;top:6px;right:6px;width:7px;height:7px;background:var(--gold);border-radius:50%;border:2px solid var(--dark2);}' +
      '.header-admin-btn{width:36px;height:36px;border-radius:50%;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--gold);transition:all 0.15s;text-decoration:none;}' +
      '.header-admin-btn:hover{background:rgba(201,168,76,0.2);border-color:rgba(201,168,76,0.55);}' +
      '.header-auth-btn{width:36px;height:36px;border-radius:50%;background:var(--dark3);border:1px solid var(--border-dark);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#9A9488;transition:all 0.15s;font-family:inherit;}' +
      '.header-auth-btn:hover{border-color:rgba(201,168,76,0.3);color:var(--gold);}' +
      '.mobile-bottom-nav{-webkit-transform:translateZ(0);transform:translateZ(0);will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;}' +
      '@media(max-width:767px){' +
      '.top-header{padding:0 1rem;height:54px;}' +
      '.hamburger-btn{display:flex;}' +
      '.header-title{font-size:17px;}' +
      '.sidebar-footer{display:none;}' +
      '}';
    document.head.appendChild(s);
  }

  function initHeader(pageTitle) {
    var header = document.querySelector('.top-header');
    if (!header) return;

    header.innerHTML =
      '<button class="hamburger-btn" id="hamburger-btn" aria-label="Open navigation">' + HAMBURGER_SVG + '</button>' +
      '<div class="header-title">' + (pageTitle || '') + '</div>' +
      '<div class="header-actions">' +
        '<a href="admindashboard.html" class="header-admin-btn" id="header-admin-btn" style="display:none" title="Admin dashboard">' + ADMIN_SVG + '</a>' +
        '<a href="notifications.html" class="notif-btn" id="header-notif-btn">' + BELL_SVG + '<div class="notif-dot" id="notif-dot" style="display:none"></div></a>' +
        '<button class="header-auth-btn" id="header-auth-btn" title="Sign in">' + SIGNIN_SVG + '</button>' +
      '</div>';

    // Sidebar wiring
    var hamburgerBtn = document.getElementById('hamburger-btn');
    var sidebar = document.getElementById('sidebar');
    var sidebarOverlay = document.getElementById('sidebar-overlay');
    var sidebarCloseBtn = document.getElementById('sidebar-close-btn');

    function openSidebar() {
      if (sidebar) sidebar.classList.add('open');
      if (sidebarOverlay) sidebarOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    window.addEventListener('resize', function() { if (window.innerWidth > 767) closeSidebar(); });

    // Auth state
    if (!window.firebase || !firebase.auth) return;
    var authBtn = document.getElementById('header-auth-btn');
    var adminBtn = document.getElementById('header-admin-btn');
    var notifDot = document.getElementById('notif-dot');

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        authBtn.innerHTML = SIGNOUT_SVG;
        authBtn.title = 'Sign out';
        authBtn.onclick = function() {
          firebase.auth().signOut().then(function() { window.location.href = 'signon.html'; });
        };
        // Admin check
        firebase.firestore().collection('users').doc(user.uid).get().then(function(snap) {
          if (snap.exists && snap.data().userRole === 'admin') {
            adminBtn.style.display = 'inline-flex';
          }
        }).catch(function() {});
        // Notification dot
        firebase.firestore().collection('notifications')
          .where('userId', '==', user.uid)
          .where('read', '==', false)
          .limit(1).get().then(function(snap) {
            if (notifDot && !snap.empty) notifDot.style.display = 'block';
          }).catch(function() {});
      } else {
        authBtn.innerHTML = SIGNIN_SVG;
        authBtn.title = 'Sign in';
        authBtn.onclick = function() { window.location.href = 'signon.html'; };
      }
    });
  }

  window.initNav = function(activeKey, pageTitle) {
    injectHeaderStyles();

    var nav = document.getElementById('sidebar-nav');
    if (nav) {
      nav.innerHTML = ITEMS.map(function(item) {
        var active = item.key === activeKey ? ' active' : '';
        return '<a href="' + item.href + '" class="nav-item' + active + '">' +
          item.icon + '<span>' + item.label + '</span></a>';
      }).join('');
    }

    initHeader(pageTitle);
  };
}());
