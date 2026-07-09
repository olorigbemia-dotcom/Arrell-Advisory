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
    'speaking': 'training',
    'blog': 'insights',
    'articles': 'insights'
  };
  var knownPages = ['methodology','strategy','debrief','principal','missouri-report','insights','contact','start','training','book'];
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

/* ============================================================
   COOKIE CONSENT + CONSENT-GATED ANALYTICS
   Analytics never load before "Accept All". Set AA_GA_ID to a
   GA4 measurement ID (e.g. 'G-XXXXXXXXXX') to activate GA4.
============================================================ */
var AA_GA_ID = ''; // <- paste GA4 measurement ID here to enable analytics

function aaConsent() { return localStorage.getItem('aa_consent'); }

function aaLoadAnalytics() {
  if (!AA_GA_ID || aaConsent() !== 'all' || window.__aaGA) return;
  window.__aaGA = 1;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + AA_GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', AA_GA_ID);
}

// All C3 events route through here; silently dropped without consent
function aaTrack(eventName, params) {
  if (aaConsent() !== 'all') return;
  window.dataLayer = window.dataLayer || [];
  if (window.gtag) { gtag('event', eventName, params || {}); }
  else { dataLayer.push({ event: eventName, params: params || {} }); }
}

function aaSetConsent(value, eventName) {
  localStorage.setItem('aa_consent', value);
  var b = document.getElementById('consent-banner');
  if (b) b.remove();
  if (value === 'all') { aaLoadAnalytics(); }
  if (eventName) aaTrack(eventName);
}

function aaShowConsentBanner() {
  if (document.getElementById('consent-banner')) return;
  var banner = document.createElement('div');
  banner.id = 'consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML =
    '<span class="cb-text">We use strictly necessary cookies for site functionality. Analytics cookies are only used with your consent. No data is sold or shared for advertising. <a href="privacy.html">Privacy Policy</a></span>' +
    '<span class="cb-actions">' +
    '<button class="cb-btn cb-reject" onclick="aaSetConsent(\'essential\',\'cookie_reject\')">Reject Non-Essential</button>' +
    '<button class="cb-btn cb-accept" onclick="aaSetConsent(\'all\',\'cookie_accept_all\')">Accept All</button>' +
    '</span>';
  document.body.appendChild(banner);
}

function aaOpenCookieSettings() {
  aaTrack('cookie_settings_open');
  localStorage.removeItem('aa_consent');
  aaShowConsentBanner();
  return false;
}

(function() {
  if (!aaConsent()) { aaShowConsentBanner(); }
  else { aaLoadAnalytics(); }
})();

/* ============================================================
   SITE-WIDE NAV + FOOTER ENHANCEMENT
   Adds Training to the nav and Terms / Cookie Settings to the
   footer on every page without editing each legacy file.
============================================================ */
(function() {
  // Nav: Training link before "Take the Assessment"
  var navLinks = document.querySelector('.nav-links');
  if (navLinks && !navLinks.querySelector('a[href$="training.html"]')) {
    var li = document.createElement('li');
    li.innerHTML = '<a href="training.html" data-page="training">Training</a>';
    var assess = navLinks.querySelector('.nav-assess');
    navLinks.insertBefore(li, assess ? assess.parentElement : null);
  }
  // Mobile overlay: Training link
  var mo = document.getElementById('mobileMenu');
  if (mo && !mo.querySelector('a[href$="training.html"]')) {
    var a = document.createElement('a');
    a.href = 'training.html';
    a.textContent = 'Training';
    var anchor = mo.querySelector('a[href$="assessment.html"]');
    mo.insertBefore(a, anchor || null);
  }
  // Footer: Terms of Service + Cookie Settings links
  var fl = document.querySelector('.footer-links');
  if (fl) {
    if (!fl.querySelector('a[href$="terms-of-service.html"]')) {
      var t = document.createElement('a');
      t.href = 'terms-of-service.html';
      t.textContent = 'Terms';
      fl.appendChild(t);
    }
    if (!fl.querySelector('a[data-cookie-settings]')) {
      var c = document.createElement('a');
      c.href = '#';
      c.textContent = 'Cookie Settings';
      c.setAttribute('data-cookie-settings', '1');
      c.onclick = function(e) { e.preventDefault(); aaOpenCookieSettings(); };
      fl.appendChild(c);
    }
  }
})();

// Sticky mobile CTA (pages that include #stickyCta)
(function() {
  var sticky = document.getElementById('stickyCta');
  if (!sticky) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > window.innerHeight * 0.75) { sticky.classList.add('visible'); }
    else { sticky.classList.remove('visible'); }
  });
})();
