// Arrell Advisory - Shared Scripts

// Legacy hash route redirect (preserves old bookmarks)
// Only runs on the home page to handle old #page-name URLs
(function() {
  var hash = window.location.hash.replace('#', '');
  if (!hash || (window.location.pathname !== '/' && window.location.pathname !== '/index.html')) return;
  var aliases = {
    'portfolio': 'methodology',
    'how-we-help': 'how-we-help',
    'about': 'principal',
    'speaking': 'training',
    'blog': 'insights',
    'articles': 'insights'
  };
  var knownPages = ['how-we-help','methodology','strategy','debrief','principal','missouri-report','insights','contact','start','training','book'];
  var page = aliases[hash] || hash;
  if (knownPages.indexOf(page) !== -1) {
    window.location.replace('/' + page);
  }
})();

// Nav scroll effect
window.addEventListener('scroll', function() {
  var nav = document.getElementById('nav');
  if (!nav) return;
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
  var menu = document.getElementById('mobileMenu');
  if (!menu) return;
  menu.inert = false;
  menu.classList.add('active');
  document.body.style.overflow = 'hidden';
  var toggle = document.querySelector('.mobile-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
  menu.querySelector('button, a').focus();
}
function closeMobileMenu() {
  var menu = document.getElementById('mobileMenu');
  if (!menu) return;
  menu.classList.remove('active');
  menu.inert = true;
  document.body.style.overflow = '';
  var toggle = document.querySelector('.mobile-toggle');
  if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
}
document.addEventListener('keydown', function(e) {
  var menu = document.getElementById('mobileMenu');
  if (!menu || !menu.classList.contains('active')) return;
  if (e.key === 'Escape') { closeMobileMenu(); return; }
  if (e.key !== 'Tab') return;
  var items = menu.querySelectorAll('a, button');
  var first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ============================================================
   CURRENT PAGE MARKER
   Gives assistive technology and sighted readers the same cue
   about where they are in the site.
============================================================ */
(function() {
  var here = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (here.length > 1) { here = here.replace(/\/$/, ''); }
  var links = document.querySelectorAll('.nav-links a[href], .mobile-overlay a[href]');
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if (href === here || (here === '/' && href === '/')) {
      links[i].setAttribute('aria-current', 'page');
    }
  }
})();

// Init
initReveals();

/* ============================================================
   COOKIE CONSENT + CONSENT-GATED ANALYTICS
   Analytics never load before "Accept All". Set AA_GA_ID to a
   GA4 measurement ID (e.g. 'G-XXXXXXXXXX') to activate GA4.
============================================================ */
var AA_GA_ID = ''; // <- paste GA4 measurement ID here to enable analytics

function aaConsent() { try { return localStorage.getItem('aa_consent'); } catch (e) { return window.__aaConsent || null; } }

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
  window.__aaConsent = value;
  try { localStorage.setItem('aa_consent', value); } catch (e) { /* In-memory consent when storage is unavailable. */ }
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
    '<span class="cb-text">We use strictly necessary cookies for site functionality. Analytics cookies are only used with your consent. No data is sold or shared for advertising. <a href="/privacy">Privacy Policy</a></span>' +
    '<span class="cb-actions">' +
    '<button class="cb-btn cb-reject" onclick="aaSetConsent(\'essential\',\'cookie_reject\')">Reject Non-Essential</button>' +
    '<button class="cb-btn cb-accept" onclick="aaSetConsent(\'all\',\'cookie_accept_all\')">Accept All</button>' +
    '</span>';
  document.body.appendChild(banner);
}

function aaOpenCookieSettings() {
  aaTrack('cookie_settings_open');
  window.__aaConsent = null;
  try { localStorage.removeItem('aa_consent'); } catch (e) { /* Storage may be disabled. */ }
  aaShowConsentBanner();
  return false;
}

(function() {
  if (!aaConsent()) { aaShowConsentBanner(); }
  else { aaLoadAnalytics(); }
})();

/* ============================================================
   SITE-WIDE FOOTER ENHANCEMENT
   Ensures Terms and Cookie Settings are present in every footer.
============================================================ */
(function() {
  var fl = document.querySelector('.footer-links');
  if (fl) {
    if (!fl.querySelector('a[href="/terms-of-service"]')) {
      var t = document.createElement('a');
      t.href = '/terms-of-service';
      t.textContent = 'Terms';
      fl.appendChild(t);
    }
    if (!fl.querySelector('a[data-cookie-settings], a[href="/privacy#cookie-settings"]')) {
      var c = document.createElement('a');
      c.href = '#';
      c.textContent = 'Cookie Settings';
      c.setAttribute('data-cookie-settings', '1');
      c.onclick = function(e) { e.preventDefault(); aaOpenCookieSettings(); };
      fl.appendChild(c);
    }
  }
})();

// Delegation also covers assessment result links added after page load.
document.addEventListener('click', function(e) {
  var link = e.target.closest('a');
  if (!link) return;
  var event = link.getAttribute('data-event');
  if (!event && link.getAttribute('href') === '/nga-white-paper') event = 'nga_white_paper_view';
  if (!event && link.classList.contains('insight-card')) event = 'resource_open';
  if (!event) return;
  var params = {page: window.location.pathname};
  // Optional context set by the situation router, related-content blocks
  // and the ecosystem links. Absent elsewhere, so the shape stays stable.
  var detail = link.getAttribute('data-situation') || link.getAttribute('data-destination');
  if (detail) params.detail = detail;
  params.destination = link.getAttribute('href');
  aaTrack(event, params);
});

// Sticky mobile CTA (pages that include #stickyCta)
(function() {
  var sticky = document.getElementById('stickyCta');
  if (!sticky) return;
  // The bar stands down once the closing blocks come into view, so it never
  // covers the newsletter field or the footer links. The newsletter band is
  // injected by a deferred script, so it is looked up on demand.
  function tailTop() {
    var tail = document.querySelector('.newsletter-band') || document.querySelector('.ecosystem') || document.querySelector('footer');
    return tail ? tail.getBoundingClientRect().top : Infinity;
  }
  function update() {
    var scrolledEnough = window.scrollY > window.innerHeight * 0.75;
    if (scrolledEnough && tailTop() > window.innerHeight) { sticky.classList.add('visible'); }
    else { sticky.classList.remove('visible'); }
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
