// Shared sidebar nav + header — call initNav('pagekey', 'Page Title') on each member page.
(function() {
  var HAMBURGER_SVG = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var BELL_SVG      = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>';
  var ENVELOPE_SVG  = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  var PERSON_SVG    = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  var SIGNOUT_SVG   = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
  var SIGNIN_SVG    = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>';
  var ADMIN_SVG     = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

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
      key: 'cert-hub', href: 'cert-hub.html', label: 'Certification Hub',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M8 14l-4 7h16l-4-7"/><path d="M9 17l3 3 3-3"/></svg>'
    },
    {
      key: 'roadmap', href: 'roadmap.html', label: 'My Roadmap',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/><circle cx="7" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="7" cy="18" r="2" fill="currentColor" stroke="none"/></svg>'
    },
    {
      key: 'courses', href: 'courses.html', label: 'Courses',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 17A2.5 2.5 0 014 14.5V5a2 2 0 012-2h14v14"/></svg>'
    },
    {
      key: 'useragents', href: 'useragents.html', label: 'My Agents',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M18 3l2 2-2 2"/><path d="M6 3L4 5l2 2"/></svg>'
    },
    {
      key: 'marketplace', href: 'marketplace.html', label: 'Marketplace',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>'
    },
  ];

  var START_HERE_URL = 'course.html?courseId=JQYsP0RQUPWZ0twQtiQg&lessonId=XQW5SV09fR0fuvkaHT50';
  var LOCK_SVG = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-left:auto;opacity:0.5;flex-shrink:0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';

  function injectOnboardingBanner() {
    if (document.getElementById('onboarding-banner')) return;
    var s = document.createElement('style');
    s.textContent =
      '#onboarding-banner{background:rgba(201,168,76,0.1);border-bottom:1px solid rgba(201,168,76,0.2);padding:10px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;}' +
      '#onboarding-banner-text{font-size:12px;color:#E8D5A3;line-height:1.4;flex:1;}' +
      '#onboarding-banner-btn{font-size:11px;font-weight:700;color:#0C0B09;background:#C9A84C;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;white-space:nowrap;font-family:inherit;}' +
      '.nav-item.nav-locked{opacity:0.4;cursor:default;pointer-events:none;}';
    document.head.appendChild(s);
    var banner = document.createElement('div');
    banner.id = 'onboarding-banner';
    banner.innerHTML =
      '<div id="onboarding-banner-text">Watch the Start Here video to unlock your challenge</div>' +
      '<button id="onboarding-banner-btn" onclick="window.location.href=\'' + START_HERE_URL + '\'">Watch Now</button>';
    var sidebar = document.getElementById('sidebar');
    var nav = document.getElementById('sidebar-nav');
    if (sidebar && nav) sidebar.insertBefore(banner, nav);
  }

  function revealNav() {
    var nav = document.getElementById('sidebar-nav');
    if (nav) nav.style.visibility = 'visible';
  }

  function lockNav() {
    injectOnboardingBanner();
    var nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    nav.querySelectorAll('.nav-item').forEach(function(el) {
      el.classList.add('nav-locked');
      if (!el.querySelector('.nav-lock-icon')) {
        var icon = document.createElement('span');
        icon.className = 'nav-lock-icon';
        icon.innerHTML = LOCK_SVG;
        el.appendChild(icon);
      }
    });
  }

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
      '.header-auth-btn{width:36px;height:36px;border-radius:50%;background:var(--dark3);border:1px solid var(--border-dark);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#9A9488;transition:all 0.15s;font-family:inherit;text-decoration:none;}' +
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
        '<a href="inbox.html" class="notif-btn" id="header-inbox-btn" style="display:none" title="Inbox">' + ENVELOPE_SVG + '<div class="notif-dot" id="inbox-dot" style="display:none"></div></a>' +
        '<a href="notifications.html" class="notif-btn" id="header-notif-btn" title="Notifications">' + BELL_SVG + '<div class="notif-dot" id="notif-dot" style="display:none"></div></a>' +
        '<a href="profile.html" class="header-auth-btn" id="header-profile-btn" style="display:none" title="My Profile">' + PERSON_SVG + '</a>' +
        '<a href="signon.html" class="header-auth-btn" id="header-signin-btn" title="Sign in">' + SIGNIN_SVG + '</a>' +
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

    if (!window.firebase || !firebase.auth) return;
    var adminBtn   = document.getElementById('header-admin-btn');
    var inboxBtn   = document.getElementById('header-inbox-btn');
    var profileBtn = document.getElementById('header-profile-btn');
    var signinBtn  = document.getElementById('header-signin-btn');
    var notifDot   = document.getElementById('notif-dot');
    var inboxDot   = document.getElementById('inbox-dot');

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // Show logged-in icons, hide sign-in
        if (inboxBtn)   inboxBtn.style.display   = 'flex';
        if (profileBtn) profileBtn.style.display = 'flex';
        if (signinBtn)  signinBtn.style.display  = 'none';

        // Admin + onboarding check
        firebase.firestore().collection('users').doc(user.uid).get().then(function(snap) {
          var data = snap.exists ? snap.data() : {};
          if (data.userRole === 'admin') {
            if (adminBtn) adminBtn.style.display = 'inline-flex';
            var navEl = document.getElementById('sidebar-nav');
            if (navEl) {
              var adminLink = document.createElement('a');
              adminLink.href = '/hub/admin-dashboard';
              adminLink.className = 'nav-item';
              adminLink.innerHTML = '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg><span>Creator Hub</span>';
              navEl.appendChild(adminLink);
            }
            revealNav();
          } else if (!data.onboardingComplete) {
            lockNav();
            revealNav();
          } else {
            firebase.firestore().collection('certification_progress').doc(user.uid).get().then(function(cpSnap) {
              if (!cpSnap.exists || !cpSnap.data().phase1Complete) {
                var nav = document.getElementById('sidebar-nav');
                if (!nav) { revealNav(); return; }
                var CHALLENGE_HREFS = ['courses.html', 'community.html', 'roadmap.html'];
                var links = nav.querySelectorAll('a.nav-item');
                for (var i = 0; i < links.length; i++) {
                  var href = links[i].getAttribute('href');
                  if (CHALLENGE_HREFS.indexOf(href) === -1) {
                    links[i].style.display = 'none';
                  } else if (href === 'courses.html') {
                    links[i].setAttribute('href', START_HERE_URL);
                    var span = links[i].querySelector('span');
                    if (span) span.textContent = 'Challenge';
                  }
                }
              }
              revealNav();
            }).catch(function() { revealNav(); });
          }
        }).catch(function() { revealNav(); });

        // Notification dot
        firebase.firestore().collection('notifications')
          .where('userId', '==', user.uid)
          .where('read', '==', false)
          .limit(1).get().then(function(snap) {
            if (notifDot && !snap.empty) notifDot.style.display = 'block';
          }).catch(function() {});

      } else {
        // Logged out — only sign-in button
        if (inboxBtn)   inboxBtn.style.display   = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        if (signinBtn)  signinBtn.style.display  = 'flex';
        revealNav();
      }
    });
  }

  window.initNav = function(activeKey, pageTitle) {
    injectHeaderStyles();

    var nav = document.getElementById('sidebar-nav');
    if (nav) {
      nav.style.visibility = 'hidden';
      nav.innerHTML = ITEMS.map(function(item) {
        var active = item.key === activeKey ? ' active' : '';
        return '<a href="' + item.href + '" class="nav-item' + active + '">' +
          item.icon + '<span>' + item.label + '</span></a>';
      }).join('');
    }

    initHeader(pageTitle);
  };
}());
