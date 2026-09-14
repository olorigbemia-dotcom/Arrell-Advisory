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

   Until it is set, the section still renders in full - heading,
   email field, and Subscribe button - so the design can be
   reviewed on the live site before MailerLite is wired up.
   Submitting in that state contacts nothing and reports the
   signup as not yet live; it never claims a subscription that
   did not happen. Setting AA_ML_FORM_ID is the only change
   needed to make the same form start subscribing for real.
============================================================ */

var AA_ML_ACCOUNT_ID = '2466818';
var AA_ML_FORM_ID = ''; // <- paste the MailerLite embedded form ID here to enable the newsletter

(function () {
  'use strict';

  var TIMEOUT_MS = 20000;

  var COPY = {
    heading: 'Subscribe to Our Newsletter',
    section: 'Practical perspectives on responsible AI adoption — new insights, resources, and announcements from Arrell Advisory. Sent occasionally. We never share your address, and you can unsubscribe at any time.',
    band: 'Insights, resources, and announcements on responsible AI adoption — sent occasionally. Unsubscribe at any time.',
    label: 'Email address',
    placeholder: 'you@organization.com',
    button: 'Subscribe',
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

  // Markup is entirely literal; no user input is ever interpolated here.
  function markup(variant, id) {
    var blurb = variant === 'section' ? COPY.section : COPY.band;
    return '' +
      '<div class="newsletter-copy">' +
        '<h2 class="newsletter-heading">' + COPY.heading + '</h2>' +
        '<p class="newsletter-blurb">' + blurb + '</p>' +
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
      '</form>';
  }

  function bind(mount, variant, index) {
    var id = 'newsletter-' + variant + '-' + index;
    mount.innerHTML = markup(variant, id);

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

      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

      try {
        var body = new FormData();
        body.append('fields[email]', input.value.trim());
        body.append('ml-submit', '1');
        body.append('anticsrf', 'true');

        var response = await fetch(endpoint(), {
          method: 'POST',
          body: body,
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Request failed');

        var result = await response.json();
        if (result.success !== true && result.success !== 'true') throw new Error('Subscription not accepted');

        status.textContent = COPY.success;
        form.reset();
        if (typeof aaTrack === 'function') aaTrack('newsletter_subscribe', { placement: variant });
      } catch (error) {
        // Technical detail stays in the console; the reader sees plain guidance.
        status.textContent = COPY.error;
      } finally {
        clearTimeout(timeout);
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
      band.setAttribute('aria-label', COPY.heading);
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
