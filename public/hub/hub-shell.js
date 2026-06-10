(function () {
  'use strict';

  var NAV_ITEMS = [
    {
      key: 'community', label: 'Community',
      icon: '<svg class="hs-nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 00-3-3.87"/></svg>'
    },
    {
      key: 'dashboard', label: 'Dashboard',
      icon: '<svg class="hs-nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
    },
    {
      key: 'roadmap', label: 'My Roadmap',
      icon: '<svg class="hs-nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/></svg>'
    },
    {
      key: 'courses', label: 'Courses',
      icon: '<svg class="hs-nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 17A2.5 2.5 0 014 14.5V5a2 2 0 012-2h14v14"/></svg>'
    },
    {
      key: 'support', label: 'Support',
      icon: '<svg class="hs-nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    }
  ];

  var CLOSE_SVG = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var HAMBURGER_SVG = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var SIGNOUT_SVG = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

  function injectStyles() {
    if (document.getElementById('hub-shell-styles')) return;
    var s = document.createElement('style');
    s.id = 'hub-shell-styles';
    s.textContent =
      ':root{--hs-sidebar-width:220px;--hs-header-height:60px;}' +
      'body{display:flex;min-height:100vh;min-height:100dvh;overflow-x:hidden;font-family:"Lato",sans-serif;-webkit-font-smoothing:antialiased;}' +

      /* SIDEBAR */
      '#hs-sidebar{width:var(--hs-sidebar-width);background:var(--hub-nav-bg,#0C0B09);min-height:100vh;display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:100;border-right:1px solid var(--hub-border,#2A2720);transition:transform 0.3s ease;}' +
      '.hs-sidebar-logo{padding:1.1rem 1.25rem 1rem;border-bottom:1px solid var(--hub-border,#2A2720);display:flex;align-items:center;gap:10px;}' +
      '.hs-logo-img{width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0;}' +
      '.hs-logo-icon{width:32px;height:32px;border-radius:6px;background:rgba(201,168,76,0.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}' +
      '.hs-hub-name{font-family:"Playfair Display",serif;font-size:15px;color:var(--hub-nav-text,#F0EDE6);font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '#hs-close-btn{display:none;background:none;border:none;color:var(--hub-nav-text,#F0EDE6);cursor:pointer;padding:4px;border-radius:6px;opacity:0.6;margin-left:auto;flex-shrink:0;}' +
      '#hs-close-btn:hover{opacity:1;}' +

      '#hs-sidebar-nav{flex:1;padding:0.75rem;display:flex;flex-direction:column;gap:2px;}' +
      '.hs-nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;color:#9A9488;font-size:14px;font-weight:400;cursor:pointer;text-decoration:none;transition:all 0.15s;}' +
      '.hs-nav-item:hover{background:rgba(255,255,255,0.05);color:var(--hub-nav-text,#F0EDE6);}' +
      '.hs-nav-item.active{background:rgba(201,168,76,0.12);color:var(--hub-nav-btn,#C9A84C);font-weight:700;border:1px solid rgba(201,168,76,0.2);}' +
      '.hs-nav-icon{width:18px;height:18px;opacity:0.7;flex-shrink:0;}' +
      '.hs-nav-item.active .hs-nav-icon{opacity:1;}' +

      '.hs-sidebar-footer{padding:0.75rem;border-top:1px solid var(--hub-border,#2A2720);}' +
      '.hs-sidebar-user{display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:8px;}' +
      '.hs-user-avatar{width:30px;height:30px;border-radius:50%;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--hub-nav-btn,#C9A84C);flex-shrink:0;}' +
      '.hs-user-name{font-size:12px;color:var(--hub-nav-text,#F0EDE6);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '#hs-logout-btn{display:flex;align-items:center;gap:8px;width:100%;padding:7px 12px;margin-top:4px;background:none;border:none;border-radius:8px;color:#6B5F5F;font-size:13px;font-family:inherit;cursor:pointer;transition:background 0.15s,color 0.15s;text-align:left;}' +
      '#hs-logout-btn:hover{background:rgba(220,50,50,0.1);color:#E05555;}' +

      /* MAIN */
      '#hs-main{margin-left:var(--hs-sidebar-width);flex:1;display:flex;flex-direction:column;min-height:100vh;}' +
      '#hs-header{background:var(--hub-nav-bg,#0C0B09);border-bottom:1px solid var(--hub-border,#2A2720);height:var(--hs-header-height);display:flex;align-items:center;gap:1rem;padding:0 1.5rem;position:sticky;top:0;z-index:50;}' +
      '#hs-hamburger{display:none;background:none;border:none;color:var(--hub-nav-text,#F0EDE6);cursor:pointer;padding:6px;border-radius:6px;align-items:center;justify-content:center;transition:background 0.15s;}' +
      '#hs-hamburger:hover{background:rgba(255,255,255,0.08);}' +
      '#hs-page-title{font-family:"Playfair Display",serif;font-size:18px;font-weight:400;color:var(--hub-nav-text,#F0EDE6);flex:1;}' +
      '#hs-header-actions{display:flex;align-items:center;gap:10px;}' +
      '.hs-content{flex:1;padding:2rem;background:var(--hub-page-bg,#F4F2EE);color:var(--hub-text-primary,#1A1714);}' +

      /* OVERLAY */
      '#hs-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99;opacity:0;pointer-events:none;transition:opacity 0.3s;}' +
      '#hs-overlay.open{opacity:1;pointer-events:all;}' +

      /* TABLET */
      '@media(max-width:1023px){' +
        '#hs-sidebar{width:60px;}' +
        '.hs-sidebar-logo,.hs-hub-name,#hs-close-btn,.hs-nav-item span,.hs-user-name{display:none;}' +
        '.hs-sidebar-user{justify-content:center;padding:8px;}' +
        '.hs-nav-item{justify-content:center;padding:10px;}' +
        '#hs-logout-btn span{display:none;}#hs-logout-btn{justify-content:center;padding:8px;}' +
        '#hs-main{margin-left:60px;}' +
      '}' +

      /* ADMIN BUTTON */
      '.hs-admin-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px;border:1px solid rgba(201,168,76,0.35);background:rgba(201,168,76,0.08);color:var(--hub-nav-btn,#C9A84C);font-family:"Lato",sans-serif;font-size:12px;font-weight:700;text-decoration:none;transition:all 0.15s;white-space:nowrap;}' +
      '.hs-admin-btn:hover{background:rgba(201,168,76,0.18);border-color:var(--hub-nav-btn,#C9A84C);}' +
      '.hs-admin-btn svg{width:13px;height:13px;flex-shrink:0;}' +

      /* MOBILE */
      '@media(max-width:767px){' +
        '#hs-sidebar{width:var(--hs-sidebar-width);transform:translateX(-100%);}' +
        '#hs-sidebar.open{transform:translateX(0);}' +
        '.hs-sidebar-logo{display:flex;}' +
        '.hs-hub-name{display:block;}' +
        '#hs-close-btn{display:block;}' +
        '.hs-nav-item{justify-content:flex-start;padding:9px 12px;}' +
        '.hs-nav-item span{display:inline;}' +
        '.hs-user-name{display:block;}' +
        '#hs-logout-btn{justify-content:flex-start;padding:7px 12px;}' +
        '#hs-logout-btn span{display:inline;}' +
        '#hs-overlay{display:block;}' +
        '#hs-main{margin-left:0;}' +
        '#hs-hamburger{display:flex;}' +
        '.hs-content{padding:1.25rem;}' +
      '}';
    document.head.appendChild(s);
  }

  function injectGA(id) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', id);
  }

  function applyColors(hub) {
    var color = hub.primaryColor || '#C9A84C';
    document.documentElement.style.setProperty('--gold', color);
    var map = {
      '--hub-page-bg':      hub.pageBgColor,
      '--hub-text-primary': hub.textPrimaryColor,
      '--hub-text-muted':   hub.textMutedColor,
      '--hub-border':       hub.borderColor,
      '--hub-btn-text':     hub.btnTextColor,
      '--hub-nav-bg':       hub.navBgColor,
      '--hub-nav-text':     hub.navTextColor,
      '--hub-nav-btn':      hub.navBtnColor
    };
    Object.keys(map).forEach(function(p) { if (map[p]) document.documentElement.style.setProperty(p, map[p]); });
  }

  function getLabelForKey(key) {
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      if (NAV_ITEMS[i].key === key) return NAV_ITEMS[i].label;
    }
    return '';
  }

  function buildShell(hub, slug, activeKey, studentAuth) {
    var sidebar  = document.getElementById('hs-sidebar');
    var overlay  = document.getElementById('hs-overlay');
    var header   = document.getElementById('hs-header');
    if (!sidebar) return;

    var logoHtml = hub.logoUrl
      ? '<img class="hs-logo-img" src="' + hub.logoUrl + '" alt="">'
      : '<div class="hs-logo-icon">⚡</div>';

    var features = hub.features || {};
    var visibleItems = NAV_ITEMS.filter(function(item) {
      return features[item.key] !== false;
    });

    sidebar.innerHTML =
      '<div class="hs-sidebar-logo">' +
        logoHtml +
        '<span class="hs-hub-name">' + (hub.hubName || '') + '</span>' +
        '<button id="hs-close-btn" aria-label="Close">' + CLOSE_SVG + '</button>' +
      '</div>' +
      '<nav id="hs-sidebar-nav">' +
        visibleItems.map(function(item) {
          var cls = 'hs-nav-item' + (item.key === activeKey ? ' active' : '');
          return '<a href="/hub/' + slug + '/' + item.key + '" class="' + cls + '">' +
            item.icon + '<span>' + item.label + '</span></a>';
        }).join('') +
      '</nav>' +
      '<div class="hs-sidebar-footer">' +
        '<div class="hs-sidebar-user">' +
          '<div class="hs-user-avatar" id="hs-user-avatar">?</div>' +
          '<div class="hs-user-name" id="hs-user-name">Member</div>' +
        '</div>' +
        '<button id="hs-logout-btn">' + SIGNOUT_SVG + '<span>Sign out</span></button>' +
      '</div>';

    if (header) {
      header.innerHTML =
        '<button id="hs-hamburger">' + HAMBURGER_SVG + '</button>' +
        '<div id="hs-page-title">' + getLabelForKey(activeKey) + '</div>' +
        '<div id="hs-header-actions"></div>';
    }

    // Mobile sidebar toggle
    var hamburger = document.getElementById('hs-hamburger');
    var closeBtn  = document.getElementById('hs-close-btn');
    function openSidebar()  { sidebar.classList.add('open'); if (overlay) overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('open'); document.body.style.overflow = ''; }
    if (hamburger) hamburger.addEventListener('click', openSidebar);
    if (closeBtn)  closeBtn.addEventListener('click', closeSidebar);
    if (overlay)   overlay.addEventListener('click', closeSidebar);
    window.addEventListener('resize', function() { if (window.innerWidth > 767) closeSidebar(); });

    // Auth
    var logoutBtn = document.getElementById('hs-logout-btn');
    if (studentAuth) {
      studentAuth.onAuthStateChanged(function(user) {
        if (user) {
          var avatarEl = document.getElementById('hs-user-avatar');
          var nameEl   = document.getElementById('hs-user-name');
          if (avatarEl) avatarEl.textContent = (user.email || 'M')[0].toUpperCase();
          if (nameEl)   nameEl.textContent   = user.displayName || user.email || 'Member';
          if (logoutBtn) logoutBtn.addEventListener('click', function() {
            studentAuth.signOut().then(function() { window.location.href = '/hub/' + slug + '/login'; });
          });
          // Show admin button if student user's email matches the hub owner
          if (hub.ownerEmail && user.email &&
              user.email.toLowerCase() === hub.ownerEmail.toLowerCase()) {
            showAdminButton();
          }
        } else if (hub.membersOnly) {
          window.location.href = '/hub/' + slug + '/login';
        }
      });
    } else {
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  // ── PUBLIC API ──
  // initHubPage(activeKey, callback)
  // callback receives (hub, slug, studentAuth, db)
  window.initHubPage = function(activeKey, callback) {
    injectStyles();
    var slug = window.location.pathname.split('/').filter(Boolean)[1] || '';

    var app;
    try { app = firebase.app(); }
    catch(e) {
      app = firebase.initializeApp({
        apiKey: 'AIzaSyCJ0aVMa7M_Bs_Rg7otoAuckI86OtsFUgE',
        authDomain: 'toolspark-2d62d.firebaseapp.com',
        projectId: 'toolspark-2d62d',
        storageBucket: 'toolspark-2d62d.firebasestorage.app',
        messagingSenderId: '82966513396',
        appId: '1:82966513796:web:f52b52b0ed2dc9537ac0a1'
      });
    }
    var db = app.firestore();

    db.collection('hubs').doc(slug).get().then(function(snap) {
      var hub = snap.exists ? snap.data() : {};
      applyColors(hub);
      if (hub.gaTrackingId) injectGA(hub.gaTrackingId);

      var studentAuth = null;
      var studentDb   = null;
      if (hub.studentFirebase && hub.studentFirebase.projectId) {
        try {
          var sa;
          try { sa = firebase.app('student'); }
          catch(e) { sa = firebase.initializeApp(hub.studentFirebase, 'student'); }
          studentAuth = sa.auth();
          studentDb   = sa.firestore();
        } catch(e) {}
      }

      buildShell(hub, slug, activeKey, studentAuth);

      // Show admin button if the logged-in ToolSpark user owns this hub
      function showAdminButton() {
        var actionsEl = document.getElementById('hs-header-actions');
        if (actionsEl && !document.getElementById('hs-admin-btn')) {
          var btn = document.createElement('a');
          btn.id = 'hs-admin-btn';
          btn.href = '/hub/admin-dashboard';
          btn.className = 'hs-admin-btn';
          btn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> Admin';
          actionsEl.appendChild(btn);
        }
      }

      var tsAuth = app.auth();
      tsAuth.onAuthStateChanged(function(tsUser) {
        if (!tsUser) return;
        db.collection('users').doc(tsUser.uid).get().then(function(userSnap) {
          if (userSnap.exists && userSnap.data().hubSlug === slug) showAdminButton();
        }).catch(function() {});
      });

      if (callback) callback(hub, slug, studentAuth, studentDb);

    }).catch(function() {
      buildShell({}, slug, activeKey, null);
      if (callback) callback({}, slug, null, null);
    });
  };

}());
