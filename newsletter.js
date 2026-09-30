/* ============================================================
   ARRELL ADVISORY - NEWSLETTER SUBSCRIPTION

   Renders the newsletter form into every mount point on the page
   and submits to MailerLite's public embedded-form endpoint.

   No API key is used or required. AA_ML_ACCOUNT_ID and
   AA_ML_FORM_ID below are public identifiers - the same pair
   MailerLite prints in its own copy-paste embed snippet, visible
   in the HTML of any site running a MailerLite form. The
   subscriber group, the double opt-in email, and the thank-you
   behaviour are configured on the form inside the MailerLite
   dashboard, never here. This mirrors AA_GA_ID in scripts.js.

   To activate: paste the embedded form ID into AA_ML_FORM_ID.

   Until it is set, the section still renders in full - eyebrow,
   heading, email field, and the Stay in the Loop button - so the
   design can be reviewed on the live site before MailerLite is
   wired up.
   Submitting in that state contacts nothing and reports the
   signup as not yet live; it never claims a subscription that
   did not happen. Setting AA_ML_FORM_ID is the only change
   needed to make the same form start subscribing for real.
============================================================ */

var AA_ML_ACCOUNT_ID = '1271838';
var AA_ML_FORM_ID = '189648362613507643'; // string, not a number: exceeds Number.MAX_SAFE_INTEGER

(function () {
  'use strict';

  var TIMEOUT_MS = 20000;

  var COPY = {
    // The newsletter's public name. Title case here so a screen reader speaks it
    // correctly and the name stays exact in the DOM; the all-caps treatment is CSS.
    eyebrow: 'AI Without The Panic',
    heading: 'Stay informed about AI without the panic.',
    blurb: 'Practical insights, useful guidance, and updates to help you understand AI, make informed decisions, and use it responsibly.',
    // Carried over from the previous section copy. It is the reassurance a reader
    // looks for before giving an address, and the promise /privacy makes in writing.
    note: 'Sent occasionally. We never share your address, and you can unsubscribe at any time.',
    label: 'Email address',
    placeholder: 'you@organization.com',
    button: 'Stay in the Loop',
    pending: 'Subscribing…',
    sending: 'Sending your subscription…',
    success: 'Thank you. Please check your inbox and confirm your subscription to finish signing up.',
    invalid: 'Please enter a valid email address.',
    error: 'We could not complete your subscription just now. Please try again, or email hello@arrelladvisory.com.',
    // Shown while AA_ML_FORM_ID is unset. Honest about not being live yet, and
    // still useful to a real visitor: it gives them a way to reach us.
    unconfigured: 'Newsletter signup is not quite live yet. Email hello@arrelladvisory.com and we will add you to the list.'
  };

  function configured() {
    return !!(AA_ML_ACCOUNT_ID && AA_ML_FORM_ID);
  }

  function endpoint() {
    return 'https://assets.mailerlite.com/jsonp/' + AA_ML_ACCOUNT_ID + '/forms/' + AA_ML_FORM_ID + '/subscribe';
  }

  /**
   * MailerLite's embedded-form endpoint is not a CORS API - note the /jsonp/
   * segment in its own path. It returns no Access-Control-Allow-Origin, so a
   * fetch() may post to it but can never read the reply: the promise rejects
   * before any status is seen, and every submission looks like a failure.
   *
   * The official embed sidesteps that two ways. The plain HTML form does a
   * native POST, which is a navigation and so exempt from CORS; the on-page
   * AJAX variant uses JSONP, and a <script> load is exempt too. Only the second
   * hands the page a readable answer, which is what lets this section go on
   * reporting success and failure honestly rather than assuming either.
   *
   * Resolves with MailerLite's parsed response. Rejects if the script fails to
   * load or nothing answers within TIMEOUT_MS.
   */
  function subscribe(email) {
    return new Promise(function (resolve, reject) {
      var callback = 'aaMailerLite' + Date.now() + Math.floor(Math.random() * 1e6);
      var script = document.createElement('script');
      var timer;

      function cleanup() {
        clearTimeout(timer);
        try { delete window[callback]; } catch (e) { window[callback] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callback] = function (data) { cleanup(); resolve(data || {}); };
      script.onerror = function () { cleanup(); reject(new Error('Request failed')); };
      timer = setTimeout(function () { cleanup(); reject(new Error('Timed out')); }, TIMEOUT_MS);

      // The same fields the official embed sends, carried as query parameters
      // because a script load is a GET.
      script.src = endpoint() +
        '?fields[email]=' + encodeURIComponent(email) +
        '&ml-submit=1' +
        '&anticsrf=true' +
        '&callback=' + callback;

      (document.head || document.documentElement).appendChild(script);
    });
  }

  // Markup is entirely literal; no user input is ever interpolated here.
  function markup(id) {
    return '' +
      '<div class="newsletter-copy">' +
        '<p class="eyebrow newsletter-eyebrow">' + COPY.eyebrow + '</p>' +
        '<h2 class="newsletter-heading">' + COPY.heading + '</h2>' +
        '<p class="newsletter-blurb">' + COPY.blurb + '</p>' +
      '</div>' +
      '<form class="newsletter-form" novalidate>' +
        '<label class="newsletter-label" for="' + id + '-email">' + COPY.label + '</label>' +
        '<div class="newsletter-row">' +
          '<input type="email" id="' + id + '-email" name="email" autocomplete="email" required maxlength="254" placeholder="' + COPY.placeholder + '">' +
          '<button type="submit" class="btn-primary">' + COPY.button + '</button>' +
        '</div>' +
        '<p class="newsletter-company" aria-hidden="true">' +
          '<label for="' + id + '-company">Company</label>' +
          '<input type="text" id="' + id + '-company" name="company" tabindex="-1" autocomplete="off">' +
        '</p>' +
        '<p class="newsletter-status form-status" role="status" aria-live="polite"></p>' +
        '<p class="newsletter-note">' + COPY.note + '</p>' +
      '</form>';
  }

  function bind(mount, variant, index) {
    var id = 'newsletter-' + variant + '-' + index;
    mount.innerHTML = markup(id);

    var form = mount.querySelector('.newsletter-form');
    var input = mount.querySelector('input[type=email]');
    var honeypot = mount.querySelector('input[name=company]');
    var button = mount.querySelector('button[type=submit]');
    var status = mount.querySelector('.newsletter-status');
    var inFlight = false;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (inFlight) return;

      if (!input.checkValidity() || !input.value.trim()) {
        status.textContent = COPY.invalid;
        input.focus();
        return;
      }

      // A filled honeypot means a bot. Show the normal success state and send nothing.
      if (honeypot.value) {
        status.textContent = COPY.success;
        form.reset();
        return;
      }

      // Staging: the form is rendered so the section can be reviewed on the live
      // site, but there is nothing to submit to until a form ID is set. Say so
      // plainly rather than claiming a subscription that did not happen.
      if (!configured()) {
        status.textContent = COPY.unconfigured;
        return;
      }

      inFlight = true;
      button.disabled = true;
      input.readOnly = true;
      button.textContent = COPY.pending;
      form.setAttribute('aria-busy', 'true');
      status.textContent = COPY.sending;

      try {
        var result = await subscribe(input.value.trim());
        if (result.success !== true && result.success !== 'true') throw new Error('Subscription not accepted');

        status.textContent = COPY.success;
        form.reset();
        if (typeof aaTrack === 'function') aaTrack('newsletter_subscribe', { placement: variant });
      } catch (error) {
        // Technical detail stays in the console; the reader sees plain guidance.
        if (window.console && window.console.error) window.console.error('Newsletter subscription failed:', error);
        status.textContent = COPY.error;
      } finally {
        inFlight = false;
        button.disabled = false;
        input.readOnly = false;
        button.textContent = COPY.button;
        form.removeAttribute('aria-busy');
      }
    });
  }

  function init() {
    var mounts = document.querySelectorAll('[data-newsletter]');

    // The section renders whether or not a form ID is set, so the design can be
    // reviewed on the live site ahead of the MailerLite setup. Submission is what
    // is gated, in the submit handler above - never the rendering.

    // The site-wide band is injected ahead of the shared footer so the footer's
    // own flex layout is untouched. A page that places its own mount point (for
    // example the dedicated section on /insights) opts out, so no page ever
    // shows two newsletter forms.
    var footer = document.querySelector('footer .footer-links') ? document.querySelector('footer') : null;
    // Pages carrying the ecosystem block anchor the band above it, so the
    // subscribe form stays the last conversion step before the page closes.
    var anchor = document.querySelector('.ecosystem') || footer;
    if (footer && mounts.length === 0) {
      var band = document.createElement('section');
      band.className = 'newsletter-band';
      band.setAttribute('aria-label', COPY.eyebrow);
      var inner = document.createElement('div');
      inner.setAttribute('data-newsletter', 'band');
      band.appendChild(inner);
      anchor.parentNode.insertBefore(band, anchor);
      mounts = document.querySelectorAll('[data-newsletter]');
    }

    for (var i = 0; i < mounts.length; i++) {
      bind(mounts[i], mounts[i].getAttribute('data-newsletter') === 'section' ? 'section' : 'band', i);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
