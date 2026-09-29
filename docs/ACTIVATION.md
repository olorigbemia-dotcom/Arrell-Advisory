# Activation runbook: newsletter and analytics

Arrell Advisory is about to become the destination for all AI Ready Leaders
traffic. Two values are missing before that traffic can be captured or counted.
Both are one-line changes. Neither needs a code change beyond pasting the value.

**Nothing in this document is live yet.** Both systems are built, tested and
inert until the values below are supplied.

---

## 1. Newsletter — `AA_ML_FORM_ID`

### What the implementation already expects

`newsletter.js` uses MailerLite's **public embedded-form endpoint**:

```
POST https://assets.mailerlite.com/jsonp/{AA_ML_ACCOUNT_ID}/forms/{AA_ML_FORM_ID}/subscribe
body: fields[email], ml-submit=1, anticsrf=true
```

This is the correct architecture for a static site and it should not be
replaced:

- **No API key is involved, and none may ever be added.** This site is served
  from GitHub Pages with no build step, so any key placed in a `.js` file is
  published to every visitor. The embedded-form endpoint needs no secret.
- **No group ID appears in the code.** The group is bound to the form inside
  the MailerLite dashboard, which is where it belongs — changing the group
  later needs no deploy.
- **No backend is required.** Adding one would mean adding hosting
  infrastructure this site does not have.

`AA_ML_ACCOUNT_ID` is already set to `2466818`. That is a public identifier,
the same one MailerLite prints in its own copy-paste embed snippet.

### The one value needed

> **REQUIRES MAILERLITE EMBEDDED FORM ID**
>
> File: `newsletter.js`, line 27
> Currently: `var AA_ML_FORM_ID = '';`
> Needs: the numeric form ID of a MailerLite **embedded form**, taken from the
> form's own embed snippet in the dashboard.

Do not guess or reuse an AI Ready Leaders form ID. AI Ready Leaders subscribes
server-side through the MailerLite **API** with a secret key; its group IDs are
not embedded-form IDs and will not work here.

### Dashboard configuration that must accompany it

| Setting | Required value | Why |
|---|---|---|
| Double opt-in | **On** | `newsletter.js` tells the subscriber to "check your inbox and confirm". `/privacy` also states MailerLite is "used only for subscribers who have confirmed via double opt-in". With it off, both statements are false. |
| Group | `Arrell — Newsletter` | Must be a group used for nothing else. See the consent boundaries below. |
| Confirmation and thank-you pages | Set | Otherwise confirmers land on MailerLite's defaults. |

### What is already verified

Tested in a real browser against a stubbed endpoint, and by
`tests/newsletter.test.cjs`:

- renders correctly at 1440px and at 390px, field and button stacking on mobile
- success state: form clears, confirmation message shown
- error state: **the typed address is retained**, plain-language message with a
  fallback address, button re-enabled
- duplicate submission: an in-flight lock blocks a second submit; MailerLite
  upserts by email, so a repeat is harmless
- 20-second timeout, honeypot, and no technical detail leaked to the reader
- consent wording unchanged

### What cannot be verified until the ID exists

A real submission reaching MailerLite. **Do not describe the newsletter as live
until one test address has completed the double opt-in and appears in the
group.**

---

## 2. Analytics — `AA_GA_ID`

### Current state

`scripts.js` carries a complete, consent-gated analytics layer. It is correct
and should not be replaced. It is simply inert:

```js
var AA_GA_ID = ''; // <- paste GA4 measurement ID here to enable analytics
```

Consent gating is enforced in two independent places, both verified:

- `aaLoadAnalytics()` will not inject the gtag script without **both** a
  measurement ID and `consent === 'all'`.
- `aaTrack()` returns before touching `dataLayer` unless `consent === 'all'`.

So no event reaches Google before a visitor accepts, and none is queued for
later replay.

### The one value needed

> **REQUIRES GA4 MEASUREMENT ID**
>
> File: `scripts.js`, line 105
> Currently: `var AA_GA_ID = '';`
> Needs: a GA4 measurement ID in the form `G-XXXXXXXXXX`.

### Event readiness

`page_view` arrives automatically from `gtag('config', …)` once the ID is set;
there is no explicit event for it and none is needed.

Six of the intended event names exist exactly as written. **Four differ**, and
the difference is worth settling before the ID is pasted, because renaming
after data starts arriving splits every funnel across two names:

| Intended | In the code today |
|---|---|
| `page_view` | automatic from `gtag('config')` — no change needed |
| `situation_select` | `situation_select` |
| `assessment_start` | `assessment_start` |
| `assessment_complete` | `assessment_complete` |
| `related_insight_click` | `related_insight_click` |
| `related_capability_click` | `related_capability_click` |
| `ecosystem_click` | `ecosystem_click` |
| `strategy_cta` | **`strategy_cta_click`** |
| `strategy_submit` | **`introductory_call_inquiry`** |
| `newsletter_signup` | **`newsletter_subscribe`** |

Nothing has ever been recorded, so renaming is free right now and will never be
this cheap again. Either decision is defensible: the existing names are more
precise, the intended names are more uniform. **Pick one before pasting the ID**
— and if the existing names stay, update the intended-event list rather than
leaving two vocabularies in circulation.

There is a second, separate naming split already in the code: the advanced
governance assessment uses `assessment_started` / `assessment_completed` while
the primary assessment uses `assessment_start` / `assessment_complete`. Two
names for one funnel step. Unifying them behind a `tier` parameter is tracked
separately.

### What cannot be verified until the ID exists

Real events in GA4 DebugView. **Do not describe analytics as operational until
each funnel step has been observed firing once in a browser.**

### Two things to write down before anyone reads the first report

- Analytics load only after "Accept All", so every GA4 number is a
  consenting-visitor subset. It will never reconcile with MailerLite's own
  subscriber count or with the inbox.
- Four pages never load `scripts.js` at all: `/nga-white-paper`,
  `/missouri-ai-governance-report`, `/risk-tiering` and `/mpbp-framework`.
  Arrivals on those pages are invisible to GA4.

---

## 3. MailerLite group structure

Four purposes, kept apart. They are **not** interchangeable, and the separation
is a consent requirement rather than a preference.

| Group | Purpose | Source | Consent basis | Migration status |
|---|---|---|---|---|
| `Arrell — Newsletter` | Marketing and ongoing insight | `newsletter.js` form, all pages | Explicit opt-in **plus double opt-in** | New. Starts empty. |
| `Arrell — Assessment Profile` | Follow-up on a readiness profile | Advanced governance assessment email gate | "…deliver my profile **and contact me about relevant services**". Service contact, **not** newsletter | Not yet wired. Requires its own embedded form. |
| `Arrell — Strategy Inquiries` | Reply to a specific enquiry | `intake.js` (`/strategy`, `/contact`) | The form states: "**This is not a marketing subscription**" | Not yet wired. Human reply is the current process and works. |
| `Arrell — Events & Workshops` | Programme registration | No source on Arrell today | — | **Cannot be created yet.** `/training` has no registration mechanism. |

### The boundary that must not be crossed

Two of these audiences gave an address on terms that **exclude** marketing:

- Strategy enquiries: the consent text says so in those words.
- Assessment completers: consent covers service contact about their profile.

Moving either into the newsletter group would breach the basis on which the
address was given. Tag them `consent:service-only` and treat that tag as a hard
filter on every campaign.

### AI Ready Leaders subscribers

The six existing AI Ready Leaders groups stay where they are. **They are not
migrated into the Arrell newsletter.** Those subscribers opted in to AI Ready
Leaders, a different brand with a different audience — nontechnical individual
leaders rather than organizations.

If those addresses are ever to receive Arrell material, the consent basis has
to be re-established by asking them, from the AI Ready Leaders sender, whether
they want to move. That is a campaign, not a data migration, and it is a
founder decision.

---

## 4. What must never be done here

- Never place a MailerLite API key, Stripe key or any other secret in this
  repository. Every file here is served publicly and there is no build step to
  hide a value behind.
- Never combine the four groups above.
- Never import AI Ready Leaders subscribers into the newsletter group.
