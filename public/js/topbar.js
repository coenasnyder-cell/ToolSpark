// topbar.js — lightweight top bar for standalone tool pages.
// Requires: auth.js loaded first. No sidebar. No credits logic.
(function () {

  function buildTopbar() {
    var pageTitle = document.body.getAttribute('data-page-title') || document.title || 'ToolSpark';

    var bar = document.createElement('div');
    bar.id = 'ts-topbar';
    bar.style.cssText = [
      'height:48px','display:flex','align-items:center','justify-content:space-between',
      'padding:0 20px','background:#1A1510',
      'border-bottom:1px solid rgba(255,255,255,0.06)',
      'font-family:\'DM Sans\',system-ui,sans-serif',
      'flex-shrink:0','position:relative','z-index:300',
      'box-sizing:border-box'
    ].join(';');

    bar.innerHTML =
      '<a id="ts-topbar-back" href="dashboard.html" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:rgba(255,255,255,0.55);font-size:13px;font-weight:500;white-space:nowrap;transition:color 0.15s">' +
        '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>' +
        'Dashboard' +
      '</a>' +
      '<div style="display:flex;flex-direction:column;line-height:1.1;position:absolute;left:50%;transform:translateX(-50%);pointer-events:none;text-align:center">' +
        '<span style="font-family:\'Playfair Display\',serif;font-size:16px;font-weight:700">' +
          '<span style="color:#fff">Tool</span><span style="color:#C9A84C">Spark</span>' +
        '</span>' +
        '<span id="ts-topbar-title" style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#BBA8D4">' +
          pageTitle +
        '</span>' +
      '</div>' +
      '<span id="ts-credits-chip" style="font-size:12px;color:rgba(255,255,255,0.4);white-space:nowrap"></span>';

    bar.querySelector('#ts-topbar-back').addEventListener('mouseover', function () {
      this.style.color = '#fff';
    });
    bar.querySelector('#ts-topbar-back').addEventListener('mouseout', function () {
      this.style.color = 'rgba(255,255,255,0.55)';
    });

    document.body.insertBefore(bar, document.body.firstChild);
  }

  buildTopbar();

  function _updateChip(credits) {
    var count = document.getElementById('header-credits-count'); // nav.js pages
    if (count) count.textContent = credits;
    var chip = document.getElementById('ts-credits-chip');       // topbar.js pages
    if (chip) chip.textContent = credits + ' credits';
  }
})();
