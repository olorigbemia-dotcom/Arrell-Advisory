// Arrell Advisory - Shared Scripts

// Legacy hash route redirect (preserves old bookmarks)
// Only runs on the home page to handle old #page-name URLs
(function() {
  var hash = window.location.hash.replace('#', '');
  if (!hash) return;
  var aliases = {
    'portfolio': 'methodology',
    'how-we-help': 'methodology',
    'about': 'principal',
    'speaking': 'principal',
    'blog': 'insights',
    'articles': 'insights'
  };
  var knownPages = ['methodology','strategy','debrief','principal','missouri-report','insights','contact'];
  var page = aliases[hash] || hash;
  if (knownPages.indexOf(page) !== -1) {
    window.location.replace(page + '.html');
  }
})();

// Nav scroll effect
window.addEventListener('scroll', function() {
  var nav = document.getElementById('nav');
  if (window.scrollY > 40) { nav.classList.add('scrolled'); }
  else { nav.classList.remove('scrolled'); }
});

// Scroll reveal animations
function initReveals() {
  var reveals = document.querySelectorAll('.reveal:not(.visible)');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function(el) { observer.observe(el); });
  } else {
    reveals.forEach(function(el) { el.classList.add('visible'); });
  }
}

// Mobile menu
function openMobileMenu() {
  document.getElementById('mobileMenu').classList.add('active');
}
function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('active');
}

// Init
initReveals();

// Privacy notice banner
(function() {
  if (localStorage.getItem('aa_privacy_ok')) return;
  var banner = document.createElement('div');
  banner.id = 'privacy-banner';
  banner.innerHTML =
    '<span style="flex:1;min-width:0">This site uses Google Fonts (which may transmit your IP to Google) and FormSubmit for form delivery. No tracking or advertising cookies are used. <a href="privacy.html" style="color:var(--gold);text-decoration:none;border-bottom:1px solid rgba(184,148,95,0.4)">Privacy Policy</a></span>' +
    '<button onclick="(function(){localStorage.setItem(\'aa_privacy_ok\',\'1\');document.getElementById(\'privacy-banner\').remove()})()" aria-label="Dismiss privacy notice" style="flex-shrink:0;background:var(--gold);color:#080c14;border:none;padding:0.45rem 1.1rem;border-radius:2px;font-family:var(--sans);font-size:0.78rem;font-weight:500;letter-spacing:0.04em;cursor:pointer">OK</button>';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;display:flex;align-items:center;gap:1.25rem;padding:0.9rem 1.5rem;background:#0e1420;border-top:1px solid rgba(255,255,255,0.07);font-family:var(--sans);font-size:0.82rem;color:#8a8b8e;line-height:1.55';
  document.body.appendChild(banner);
}());
