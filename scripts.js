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
