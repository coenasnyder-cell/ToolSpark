// Shared sidebar nav + header — call initNav('pagekey', 'Page Title') on each member page.
(function() {
  // ── Brand config — change these one values to update across all member pages ──
  var LOGO_TAG_COLOR = 'rgba(255,255,255,0.45)'; // e.g. '#BBA8D4' for purple

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
    // { key: 'cert-hub', href: 'cert-hub.html', label: 'Certification Hub',
    //   icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M8 14l-4 7h16l-4-7"/><path d="M9 17l3 3 3-3"/></svg>' },
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
      key: 'pricing', href: 'pricing.html', label: 'Plans & Credits',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
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
      '#onboarding-banner{background:rgba(255,200,32,0.08);border-bottom:1px solid rgba(255,200,32,0.15);padding:10px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;}' +
      '#onboarding-banner-text{font-size:12px;color:rgba(255,255,255,0.65);line-height:1.4;flex:1;}' +
      '#onboarding-banner-btn{font-size:11px;font-weight:700;color:#000;background:#FFC820;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;white-space:nowrap;font-family:inherit;}' +
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
    if (!document.getElementById('nav-dm-sans')) {
      var fl = document.createElement('link');
      fl.id = 'nav-dm-sans'; fl.rel = 'stylesheet';
      fl.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap';
      document.head.appendChild(fl);
    }
    var s = document.createElement('style');
    s.id = 'nav-header-styles';
    s.textContent =
      /* ── Keyframes ── */
      '@keyframes twinkle{0%,100%{opacity:0.85;transform:scale(1) rotate(0deg);}50%{opacity:0.1;transform:scale(0.5) rotate(20deg);}}' +
      /* ── Sidebar shell ── */
      '.sidebar{width:var(--sidebar-width);background:var(--dark);height:100%;min-height:unset;display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:100;border-right:1px solid var(--border-dark);transition:transform 0.3s ease;}' +
      '.sidebar-logo{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border-dark);display:flex;align-items:center;justify-content:space-between;}' +
      '.sidebar-middle{flex:1;display:flex;flex-direction:column;overflow:hidden;}' +
      '.sidebar-nav{padding:0.5rem 1rem;display:flex;flex-direction:column;gap:1px;}' +
      '.nav-section-label{font-size:10px;font-weight:700;color:var(--border-dark);text-transform:uppercase;letter-spacing:0.14em;padding:0.5rem 0.5rem 0.3rem;}' +
      /* ── Sidebar footer ── */
      '.sidebar-footer{padding:0.75rem 1rem 1rem;position:relative;text-align:center;border-top:1px solid rgba(201,168,76,0.15);padding-top:12px;}' +
      '.sidebar-inspire-cta{font-family:"Playfair Display",serif;font-style:italic;font-size:20px;font-weight:400;color:var(--gold);line-height:1.1;display:inline-block;text-decoration:none;opacity:0.8;margin-bottom:8px;}' +
      '.sidebar-star{position:absolute;color:var(--gold);pointer-events:none;}' +
      '.ss1{top:14px;right:28px;animation:twinkle 2.8s cubic-bezier(0.77,0,0.175,1) 0.2s infinite;}' +
      '.ss2{top:32px;left:22px;animation:twinkle 3.1s cubic-bezier(0.77,0,0.175,1) 1.0s infinite;}' +
      '.ss3{top:60px;right:18px;animation:twinkle 2.6s cubic-bezier(0.77,0,0.175,1) 1.8s infinite;}' +
      '.ss4{top:95px;left:30px;animation:twinkle 3.3s cubic-bezier(0.77,0,0.175,1) 0.6s infinite;}' +
      '.sidebar-user{display:flex;align-items:center;justify-content:center;gap:10px;padding:6px 12px;border-radius:var(--radius-sm);}' +
      '.user-avatar{width:38px;height:38px;border-radius:50%;background:var(--gold-dim);border:2px solid rgba(201,168,76,0.25);display:flex;align-items:center;justify-content:center;font-family:"Playfair Display",serif;font-size:18px;font-weight:600;color:var(--gold);flex-shrink:0;overflow:hidden;}' +
      '.user-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;}' +
      '.user-info{min-width:0;}' +
      '.user-name{font-size:13px;font-weight:700;color:#F0EDE6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.user-role{font-size:11px;color:var(--text3);margin-top:1px;}' +
      /* ── Sidebar close + overlay ── */
      '.sidebar-close-btn{display:none;background:none;border:none;color:#9A9488;cursor:pointer;padding:4px;border-radius:6px;transition:all 0.15s;}' +
      '.sidebar-close-btn:hover{color:#F0EDE6;}' +
      '.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:90;opacity:0;pointer-events:none;transition:opacity 0.3s;backdrop-filter:blur(2px);}' +
      '.sidebar-overlay.open{opacity:1;pointer-events:all;}' +
      /* ── Main wrap ── */
      '.main-wrap{margin-left:var(--sidebar-width);flex:1;display:flex;flex-direction:column;height:100vh;height:100dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;}' +
      /* ── Top header ── */
      '.top-header{background:#000;border-bottom:1px solid rgba(255,255,255,0.08);height:72px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;position:sticky;top:0;z-index:50;gap:1rem;width:100%;}' +
      ':root{--header-height:72px;--radius:0px;--radius-sm:0px;--radius-lg:0px;}' +
      '.hamburger-btn{display:none;background:none;border:none;color:#fff;cursor:pointer;padding:6px;border-radius:6px;transition:background 0.15s;flex-shrink:0;align-items:center;justify-content:center;}' +
      '.hamburger-btn:hover{background:rgba(255,255,255,0.08);}' +
      '.header-title{font-family:"Inter",sans-serif;font-size:18px;font-weight:700;color:#fff;flex:1;line-height:1.2;}' +
      '.header-actions{display:flex;align-items:center;gap:10px;flex-shrink:0;}' +
      '.notif-btn{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.5);transition:all 0.15s;position:relative;text-decoration:none;}' +
      '.notif-btn:hover{border-color:rgba(255,200,32,0.4);color:#FFC820;}' +
      '.notif-dot{position:absolute;top:6px;right:6px;width:7px;height:7px;background:#FFC820;border-radius:50%;border:2px solid #000;}' +
      '.header-admin-btn{width:36px;height:36px;border-radius:50%;background:rgba(255,200,32,0.1);border:1px solid rgba(255,200,32,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#FFC820;transition:all 0.15s;text-decoration:none;}' +
      '.header-admin-btn:hover{background:rgba(255,200,32,0.2);border-color:rgba(255,200,32,0.55);}' +
      '.header-auth-btn{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.5);transition:all 0.15s;font-family:inherit;text-decoration:none;}' +
      '.header-auth-btn:hover{border-color:rgba(255,200,32,0.4);color:#FFC820;}' +
      '#header-signout-btn:hover{border-color:rgba(220,50,50,0.4)!important;color:#E05555!important;}' +
      /* ── Credits chip ── */
      '.header-credits{display:none;align-items:center;gap:5px;padding:5px 12px;background:rgba(255,200,32,0.08);border:1px solid rgba(255,200,32,0.2);border-radius:100px;font-size:12px;font-weight:700;color:#FFC820;text-decoration:none;transition:all 0.15s;white-space:nowrap;}' +
      '.header-credits:hover{background:rgba(255,200,32,0.15);border-color:rgba(255,200,32,0.4);}' +
      '.header-credits.low{background:rgba(220,50,50,0.1);border-color:rgba(220,50,50,0.3);color:#e05555;}' +
      '.header-credits.low:hover{background:rgba(220,50,50,0.18);}' +
      '@media(max-width:767px){.header-credits-label{display:none;}}' +
      /* ── Sidebar logo ── */
      '.logo-text{font-family:"Playfair Display",serif!important;font-size:30px!important;font-weight:700!important;color:#ffffff!important;letter-spacing:-0.2px;}' +
      '.logo-text span{color:#f5c842!important;}' +
      '.logo-tag{font-size:14px!important;color:' + LOGO_TAG_COLOR + '!important;text-transform:uppercase;letter-spacing:0.12em;margin-top:0!important;font-weight:700;text-align:center;}' +
      /* ── Sidebar nav items ── */
      '.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;font-family:"DM Sans",system-ui,sans-serif;font-size:13px;font-weight:500;letter-spacing:0.01em;text-decoration:none;transition:background 0.15s,color 0.15s;cursor:pointer;color:rgba(255,255,255,0.5)!important;white-space:nowrap;}' +
      '.nav-item:hover{background:rgba(255,255,255,0.06)!important;color:rgba(255,255,255,0.9)!important;}' +
      '.nav-item.active{background:rgba(255,200,32,0.1)!important;color:#FFC820!important;font-weight:600;}' +
      '.nav-icon{width:16px;height:16px;flex-shrink:0;opacity:0.55;}' +
      '.nav-item:hover .nav-icon,.nav-item.active .nav-icon{opacity:1;}' +
      /* ── Logout ── */
      '.logout-btn{color:rgba(255,255,255,0.35)!important;}' +
      '.logout-btn:hover{background:rgba(220,50,50,0.15)!important;color:#e05555!important;}' +
      /* ── Onboarding banner ── */
      '#onboarding-banner{background:rgba(255,200,32,0.08)!important;border-bottom:1px solid rgba(255,200,32,0.15)!important;}' +
      '#onboarding-banner-btn{background:#FFC820!important;color:#000!important;}' +
      /* ── Mobile bottom nav ── */
      '.mobile-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:60px;background:var(--dark);border-top:1px solid var(--border-dark);z-index:200;align-items:stretch;padding-bottom:env(safe-area-inset-bottom,0);-webkit-transform:translateZ(0);transform:translateZ(0);will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;}' +
      '.mobile-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;color:#7A7468;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;transition:color 0.15s;-webkit-tap-highlight-color:transparent;}' +
      '.mobile-nav-item.active,.mobile-nav-item:hover{color:var(--gold);}' +
      /* ── Responsive sidebar ── */
      '@media(max-width:1023px){' +
      '.sidebar{width:60px;}' +
      '.sidebar-logo>div:first-child,.nav-section-label,.nav-item span,.logo-tag,.user-info,.sidebar-footer{display:none;}' +
      '.main-wrap{margin-left:60px;}' +
      '.nav-item{justify-content:center;padding:10px;}' +
      '}' +
      '@media(max-width:767px){' +
      '.sidebar{width:280px;transform:translateX(-100%);z-index:300;}' +
      '.sidebar.open{transform:translateX(0);}' +
      '.sidebar-logo>div:first-child,.nav-section-label,.nav-item span,.logo-tag,.user-info{display:block;}' +
      '.nav-item{justify-content:flex-start;padding:9px 12px;}' +
      '.sidebar-close-btn{display:flex;}' +
      '.sidebar-overlay{display:block;}' +
      '.main-wrap{margin-left:0;}' +
      '.page-content{padding-bottom:calc(112px + env(safe-area-inset-bottom,0px))!important;}' +
      '.ts-mobile-stack-grid{grid-template-columns:1fr!important;}' +
      '.top-header{padding:0 1rem;height:54px;}' +
      '.hamburger-btn{display:flex;}' +
      '.header-title{font-size:17px;}' +
      '.sidebar-footer{display:none;}' +
      '.mobile-bottom-nav{display:flex;}' +
      '}';
    document.head.appendChild(s);
  }

  function injectSharedHeroStyles() {
    if (document.getElementById('ts-shared-hero-styles')) return;
    var s = document.createElement('style');
    s.id = 'ts-shared-hero-styles';
    s.textContent =
      '.ts-hero{background:var(--dark2);border:1px solid var(--border-dark);padding:2.35rem 2.25rem;display:flex;align-items:center;justify-content:space-between;gap:2.5rem;position:relative;overflow:hidden;box-shadow:var(--shadow-md);}' +
      '.ts-hero::before{content:"";position:absolute;top:0;right:0;width:420px;height:100%;background:radial-gradient(ellipse at right, rgba(201,168,76,0.10) 0%, transparent 65%);pointer-events:none;}' +
      '.ts-hero-spark{position:absolute;color:var(--gold);pointer-events:none;}' +
      '.ts-hero-sp1{top:18px;right:300px;animation:twinkle 2.8s cubic-bezier(0.77,0,0.175,1) 0.1s infinite;}' +
      '.ts-hero-sp3{bottom:26px;right:250px;animation:twinkle 2.8s cubic-bezier(0.77,0,0.175,1) 1.7s infinite;}' +
      '.ts-hero-sp5{bottom:20px;right:160px;animation:twinkle 3s cubic-bezier(0.77,0,0.175,1) 1.3s infinite;}' +
      '.ts-hero-copy,.ts-hero-stats,.ts-hero-avatar-wrap{position:relative;z-index:1;}' +
      '.ts-hero-copy{flex:1;min-width:0;max-width:760px;}' +
      '.ts-hero-eyebrow{display:inline-flex;align-items:center;gap:6px;background:var(--gold);border-radius:100px;padding:3px 12px;font-size:13px;font-weight:700;color:var(--dark);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;}' +
      '.ts-hero-title{font-family:"Playfair Display",serif;font-size:34px;font-weight:400;color:#F0EDE6;line-height:1.08;margin-bottom:12px;}' +
      '.ts-hero-subtitle{font-size:18px;color:rgba(255,255,255,0.68);line-height:1.6;max-width:700px;}' +
      '.ts-hero-stats{display:flex;gap:2rem;align-items:center;justify-content:space-evenly;flex-shrink:0;min-width:360px;transform:translateY(-6px);}' +
      '.ts-hero-stat{text-align:center;min-width:84px;}' +
      '.ts-hero-stat-value{display:block;font-family:"Playfair Display",serif;font-size:36px;font-weight:500;line-height:1.3;color:#F0EDE6;}' +
      '.ts-hero-stat-label{display:block;margin-top:4px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;}' +
      '.ts-hero-avatar-wrap{width:160px;max-width:160px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex-shrink:0;align-self:center;}' +
      '.ts-hero-avatar-wrap.ts-hero-avatar-small{width:132px;max-width:132px;justify-content:center;}' +
      '.ts-hero-avatar-wrap.ts-hero-avatar-has-speech{gap:0;}' +
      '.ts-hero-avatar-circle{width:148px;height:148px;border-radius:50%;background:rgba(28,26,23,1);border:2.5px solid var(--gold);box-shadow:0 0 0 10px rgba(201,168,76,0.10);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;z-index:1;}' +
      '.ts-hero-avatar-small .ts-hero-avatar-circle{width:110px;height:110px;box-shadow:0 0 0 8px rgba(201,168,76,0.08);}' +
      '.ts-hero-avatar-img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.ts-hero-avatar-plain{width:100%;max-width:132px;object-fit:contain;filter:drop-shadow(0 10px 22px rgba(0,0,0,0.24));}' +
      '.ts-hero-speech{display:block;flex-shrink:0;background:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:8px 12px;font-size:14px;font-weight:600;color:#2A1F0A;line-height:1.45;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.20);width:85%;margin-top:-24px;position:relative;z-index:2;transform:rotate(2deg);transform-origin:center top;}' +
      '.ts-hero-speech.ts-hero-speech-plain{width:100%;margin-top:-10px;}' +
      '@media(max-width:1000px){.ts-hero{gap:2rem;padding:2rem;justify-content:flex-start;}.ts-hero-title{font-size:30px;}.ts-hero-copy{max-width:100%;}.ts-hero-stats{min-width:0;gap:1.5rem;transform:none;}.ts-hero-stat-value{font-size:30px;}.ts-hero-avatar-wrap.ts-hero-avatar-small{width:110px;max-width:110px;}.ts-hero-avatar-wrap.ts-hero-avatar-small .ts-hero-avatar-plain{max-width:110px;}}' +
      '@media(max-width:640px){.ts-hero{padding:1.5rem 1.25rem;flex-direction:column;align-items:flex-start;gap:1.25rem;}.ts-hero-title{font-size:26px;}.ts-hero-subtitle{font-size:16px;max-width:100%;}.ts-hero-stats{width:100%;justify-content:flex-start;flex-wrap:wrap;gap:1rem 1.5rem;margin-top:2px;}.ts-hero-stat{min-width:84px;}.ts-hero-stat-value{font-size:24px;}.ts-hero-avatar-wrap{display:none;}.ts-hero-avatar-wrap.ts-hero-avatar-show-mobile{display:flex;width:96px;max-width:96px;align-self:center;}.ts-hero-avatar-wrap.ts-hero-avatar-show-mobile .ts-hero-avatar-plain{max-width:96px;}}';
    document.head.appendChild(s);
  }

  function sharedHeroSpark(className, size) {
    return '<svg class="ts-hero-spark ' + className + '" width="' + size + '" height="' + size + '" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 0L6.7 5.3L12 6L6.7 6.7L6 12L5.3 6.7L0 6L5.3 5.3Z"/></svg>';
  }

  function escapeHeroHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function resolveHeroSpeech(speech) {
    if (!speech) return null;
    var lines = Array.isArray(speech.lines)
      ? speech.lines.filter(function(line) { return line != null && String(line).trim(); })
      : [];
    var text = lines.length
      ? lines[Math.floor(Math.random() * lines.length)]
      : (speech.text || '');
    if (!text) return null;
    return {
      id: speech.id || '',
      className: speech.className || '',
      text: text
    };
  }

  window.renderSharedHero = function(target, options) {
    injectSharedHeroStyles();
    var mount = typeof target === 'string' ? document.querySelector(target) : target;
    if (!mount) return null;
    var opts = options || {};
    var stats = Array.isArray(opts.stats) ? opts.stats : [];
    var avatar = opts.avatar || {};
    var speech = resolveHeroSpeech(opts.speech || null);
    var titleHtml = opts.titleHtml || (opts.title ? escapeHeroHtml(opts.title) : '');
    var titleAttrs = opts.titleId ? ' id="' + opts.titleId + '"' : '';
    var subtitle = opts.subtitle ? escapeHeroHtml(opts.subtitle) : '';
    var statsHtml = stats.length ? '<div class="ts-hero-stats">' + stats.map(function(stat) {
      var valueAttrs = stat.id ? ' id="' + stat.id + '"' : '';
      var valueClass = 'ts-hero-stat-value' + (stat.valueClass ? ' ' + stat.valueClass : '');
      return '<div class="ts-hero-stat"><span class="' + valueClass + '"' + valueAttrs + '>' + (stat.value != null ? stat.value : '—') + '</span><span class="ts-hero-stat-label">' + (stat.label || '') + '</span></div>';
    }).join('') + '</div>' : '';
    var avatarWrapClasses = 'ts-hero-avatar-wrap' +
      (avatar.size === 'small' ? ' ts-hero-avatar-small' : '') +
      (speech ? ' ts-hero-avatar-has-speech' : '') +
      (avatar.showOnMobile ? ' ts-hero-avatar-show-mobile' : '');
    var avatarHtml = '';
    if (avatar.src) {
      var speechClasses = 'ts-hero-speech' +
        (avatar.circle === false ? ' ts-hero-speech-plain' : '') +
        (speech && speech.className ? ' ' + speech.className : '');
      var speechAttrs = speech && speech.id ? ' id="' + speech.id + '"' : '';
      var speechHtml = speech ? '<div class="' + speechClasses + '"' + speechAttrs + '>' + escapeHeroHtml(speech.text) + '</div>' : '';
      if (avatar.circle === false) {
        avatarHtml = '<div class="' + avatarWrapClasses + '"><img src="' + avatar.src + '" alt="' + (avatar.alt || '') + '" class="ts-hero-avatar-plain">' + speechHtml + '</div>';
      } else {
        avatarHtml = '<div class="' + avatarWrapClasses + '"><div class="ts-hero-avatar-circle"><img src="' + avatar.src + '" alt="' + (avatar.alt || '') + '" class="ts-hero-avatar-img"></div>' +
          speechHtml +
          '</div>';
      }
    }
    mount.innerHTML =
      '<section class="ts-hero">' +
        sharedHeroSpark('ts-hero-sp1', 20) +
        sharedHeroSpark('ts-hero-sp3', 16) +
        sharedHeroSpark('ts-hero-sp5', 14) +
        '<div class="ts-hero-copy">' +
          (opts.eyebrow ? '<div class="ts-hero-eyebrow">' + escapeHeroHtml(opts.eyebrow) + '</div>' : '') +
          '<h1 class="ts-hero-title"' + titleAttrs + '>' + titleHtml + '</h1>' +
          (subtitle ? '<p class="ts-hero-subtitle">' + subtitle + '</p>' : '') +
        '</div>' +
        statsHtml +
        avatarHtml +
      '</section>';
    return mount.firstElementChild;
  };

  function initHeader(pageTitle) {
    var header = document.querySelector('.top-header');
    if (!header) return;

    header.innerHTML =
      '<button class="hamburger-btn" id="hamburger-btn" aria-label="Open navigation">' + HAMBURGER_SVG + '</button>' +
      '<div class="header-title">' + (pageTitle || '') + '</div>' +
      '<div class="header-actions">' +
        '<a href="pricing.html" class="header-credits" id="header-credits" title="Credits remaining">⚡ <span id="header-credits-count">0</span> <span class="header-credits-label">credits</span></a>' +
        '<a href="admindashboard.html" class="header-admin-btn" id="header-admin-btn" style="display:none" title="Admin dashboard">' + ADMIN_SVG + '</a>' +
        '<a href="inbox.html" class="notif-btn" id="header-inbox-btn" style="display:none" title="Inbox">' + ENVELOPE_SVG + '<div class="notif-dot" id="inbox-dot" style="display:none"></div></a>' +
        '<a href="notifications.html" class="notif-btn" id="header-notif-btn" title="Notifications">' + BELL_SVG + '<div class="notif-dot" id="notif-dot" style="display:none"></div></a>' +
        '<a href="profile.html" class="header-auth-btn" id="header-profile-btn" style="display:none" title="My Profile">' + PERSON_SVG + '</a>' +
        '<button class="header-auth-btn" id="header-signout-btn" style="display:none" title="Sign out">' + SIGNOUT_SVG + '</button>' +
        '<a href="signon.html" class="header-auth-btn" id="header-signin-btn" title="Sign in">' + SIGNIN_SVG + '</a>' +
      '</div>';

    // Sidebar wiring
    var hamburgerBtn    = document.getElementById('hamburger-btn');
    var sidebar         = document.getElementById('sidebar');
    var sidebarOverlay  = document.getElementById('sidebar-overlay');
    var sidebarCloseBtn = document.getElementById('sidebar-close-btn');

    function openSidebar() {
      if (sidebar)        sidebar.classList.add('open');
      if (sidebarOverlay) sidebarOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      if (sidebar)        sidebar.classList.remove('open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (hamburgerBtn)    hamburgerBtn.addEventListener('click', openSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay)  sidebarOverlay.addEventListener('click', closeSidebar);
    window.addEventListener('resize', function() { if (window.innerWidth > 767) closeSidebar(); });

    document.addEventListener('tsUserReady', function(e) {
      var user       = e.detail;
      var adminBtn   = document.getElementById('header-admin-btn');
      var inboxBtn   = document.getElementById('header-inbox-btn');
      var profileBtn = document.getElementById('header-profile-btn');
      var signoutBtn = document.getElementById('header-signout-btn');
      var signinBtn  = document.getElementById('header-signin-btn');

      if (signoutBtn) signoutBtn.addEventListener('click', function() {
        firebase.auth().signOut().then(function() { window.location.href = 'signon.html'; });
      });

      if (!user) {
        if (inboxBtn)   inboxBtn.style.display   = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        if (signoutBtn) signoutBtn.style.display = 'none';
        if (signinBtn)  signinBtn.style.display  = 'flex';
        revealNav();
        return;
      }

      // Logged in
      if (inboxBtn)   inboxBtn.style.display   = 'flex';
      if (profileBtn) profileBtn.style.display = 'flex';
      if (signoutBtn) signoutBtn.style.display = 'flex';
      if (signinBtn)  signinBtn.style.display  = 'none';

      if (user.role === 'admin' && adminBtn) adminBtn.style.display = 'inline-flex';

      // Credits chip — credits.js owns the logic, nav.js just shows/hides the chip
      var creditsBtn = document.getElementById('header-credits');
      if (creditsBtn && user.role !== 'admin' && user.tier) {
        creditsBtn.style.display = 'flex';
      }

      // Sidebar user info
      var sbAvatar     = document.getElementById('sidebar-avatar');
      var sbName       = document.getElementById('sidebar-name');
      var sbRole       = document.getElementById('sidebar-role');
      var firebaseUser = firebase.auth().currentUser;
      var dispName     = user.displayName || (firebaseUser && firebaseUser.displayName) || (firebaseUser && firebaseUser.email) || 'Builder';
      var photoURL     = user.photoURL    || (firebaseUser && firebaseUser.photoURL)    || '';
      if (sbName)   sbName.textContent = dispName;
      if (sbRole)   sbRole.textContent = user.role === 'admin' ? 'Admin' : 'Member';
      if (sbAvatar) {
        if (photoURL) { sbAvatar.innerHTML  = '<img src="' + photoURL + '" alt="avatar">'; }
        else          { sbAvatar.textContent = dispName.charAt(0).toUpperCase(); }
      }

      revealNav();

      // Notification dot — only Firebase call nav.js still makes directly
      var notifDot = document.getElementById('notif-dot');
      if (notifDot && firebaseUser) {
        firebase.firestore().collection('notifications')
          .where('userId', '==', firebaseUser.uid)
          .where('read', '==', false)
          .limit(1).get()
          .then(function(snap) { if (!snap.empty) notifDot.style.display = 'block'; })
          .catch(function() {});
      }
    });
  }

  function injectSidebarHTML(activeKey) {
    if (document.getElementById('sidebar')) return;

    var STAR     = '<path d="M6 0L6.7 5.3L12 6L6.7 6.7L6 12L5.3 6.7L0 6L5.3 5.3Z" fill="currentColor"/>';
    var CLOSE_SV = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    var overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebar-overlay';

    var aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.id = 'sidebar';
    aside.innerHTML =
      '<div class="sidebar-logo">' +
        '<div style="text-align:center;line-height:1.1;">' +
          '<div class="logo-text">Tool<span>Spark</span></div>' +
          '<div class="logo-tag">Creator Hub</div>' +
        '</div>' +
        '<button class="sidebar-close-btn" id="sidebar-close-btn">' + CLOSE_SV + '</button>' +
      '</div>' +
      '<div class="sidebar-middle">' +
        '<nav class="sidebar-nav" id="sidebar-nav"></nav>' +
      '</div>' +
      '<div class="sidebar-footer">' +
        '<svg class="sidebar-star ss1" width="14" height="14" viewBox="0 0 12 12">' + STAR + '</svg>' +
        '<svg class="sidebar-star ss2" width="10" height="10" viewBox="0 0 12 12">' + STAR + '</svg>' +
        '<svg class="sidebar-star ss3" width="12" height="12" viewBox="0 0 12 12">' + STAR + '</svg>' +
        '<svg class="sidebar-star ss4" width="8" height="8" viewBox="0 0 12 12">' + STAR + '</svg>' +
        '<div class="sidebar-inspire-cta">Let\'s build ♡</div>' +
        '<div class="sidebar-user">' +
          '<div class="user-avatar" id="sidebar-avatar">?</div>' +
          '<div class="user-info">' +
            '<div class="user-name" id="sidebar-name">Loading...</div>' +
            '<div class="user-role" id="sidebar-role">Member</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var MOBILE_ITEMS = [
      { href:'community.html', key:'community', label:'Community',
        icon:'<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 00-3-3.87"/></svg>' },
      { href:'courses.html',   key:'courses',   label:'Courses',
        icon:'<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 17A2.5 2.5 0 014 14.5V5a2 2 0 012-2h14v14"/></svg>' },
      { href:'tools.html',     key:'tools',     label:'Tools',
        icon:'<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>' },
      { href:'inbox.html',     key:'inbox',     label:'Inbox',
        icon:'<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' },
      { href:'dashboard.html', key:'dashboard', label:'Dashboard',
        icon:'<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
    ];

    var mobileNav = document.createElement('nav');
    mobileNav.className = 'mobile-bottom-nav';
    mobileNav.innerHTML = MOBILE_ITEMS.map(function(item) {
      return '<a href="' + item.href + '" class="mobile-nav-item' + (item.key === activeKey ? ' active' : '') + '">' +
        item.icon + item.label + '</a>';
    }).join('');

    document.body.insertBefore(overlay, document.body.firstChild);
    document.body.insertBefore(aside, document.body.firstChild);
    document.body.appendChild(mobileNav);
  }

  // Fallback auth bootstrap for nav.js pages that do not load auth.js.
  // Must keep window.tsUser shape identical to auth.js.
  function ensureAuth() {
    if (window._tsUserReady) return;
    firebase.auth().onAuthStateChanged(function(firebaseUser) {
      if (window._tsUserReady) return;
      if (!firebaseUser) {
        window.tsUser = null;
        window._tsUserReady = true;
        document.dispatchEvent(new CustomEvent('tsUserReady', { detail: null, bubbles: true }));
        return;
      }
      firebase.firestore().collection('users').doc(firebaseUser.uid).get()
        .then(function(doc) {
          var data = doc.exists ? doc.data() : {};
          window.tsUser = {
            uid:     firebaseUser.uid,
            email:   firebaseUser.email,
            role:    data.userRole         || null,
            tier:    data.subscriptionTier || null,
            credits: typeof data.credits === 'number' ? data.credits : 0
          };
          window._tsUserReady = true;
          document.dispatchEvent(new CustomEvent('tsUserReady', { detail: window.tsUser, bubbles: true }));
        })
        .catch(function() {
          window.tsUser = { uid: firebaseUser.uid, email: firebaseUser.email, role: null, tier: null, credits: 0 };
          window._tsUserReady = true;
          document.dispatchEvent(new CustomEvent('tsUserReady', { detail: window.tsUser, bubbles: true }));
        });
    });
  }

  window.initNav = function(activeKey, pageTitle) {
    injectHeaderStyles();
    injectSidebarHTML(activeKey);

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
    ensureAuth();
  };
}());
