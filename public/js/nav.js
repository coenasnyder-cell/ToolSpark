// Shared sidebar nav — call initNav('pagekey') on each member page.
// Active page key maps: community, dashboard, courses, roadmap, inbox, build-agent
(function() {
  const ITEMS = [
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
      key: 'build-agent', href: 'build-agent.html', label: 'Build Agent',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
    },
    {
      key: 'journey-companion', href: 'journey-companion.html', label: 'Journey Companion',
      icon: '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    },
  ];

  window.initNav = function(activeKey) {
    var nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    nav.innerHTML = ITEMS.map(function(item) {
      var active = item.key === activeKey ? ' active' : '';
      return '<a href="' + item.href + '" class="nav-item' + active + '">' +
        item.icon + '<span>' + item.label + '</span></a>';
    }).join('') +
    '<a href="admindashboard.html" class="nav-item" id="admin-nav-link" style="display:none;">' +
    '<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' +
    '<span>Admin</span></a>';
  };
}());
