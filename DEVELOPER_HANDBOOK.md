# Arrell Advisory — Developer Handbook

**Everything you need to build, edit, and extend the Arrell Advisory website.**  
Version 1.1 · June 2026

> **Changelog v1.1 (June 2026)** — Major site update reflected throughout this handbook:
> - **New primary assessment:** `ai-transformation-readiness-assessment.html` (three-pillar, profile-based, no numeric scores) is now the live tool linked from the nav as "Take the Assessment."
> - **Retired the Governance Debrief product.** `debrief.html` is now a redirect to `strategy.html`. The Strategy Session ($500) is the single live booking offer.
> - **Retired the old scored assessment.** `governance-readiness-assessment.html` is now a redirect to the new assessment.
> - **Single Calendly URL** sitewide: `https://calendly.com/arrelladvisory/strategy`.
> - **Removed Five Layers / MPBP language** from `methodology.html` and the (now-redirected) debrief page; methodology now describes the three-pillar model.
> - **Nav updated:** Strategy Session is now the gold CTA button; "Book a Debrief" removed.
> - See the new **Section 15: Assessment & Agentic Workflow** for how the assessment captures leads and what is / isn't automated.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [File Map](#2-file-map)
3. [Design System](#3-design-system)
4. [How to Edit an Existing Page](#4-how-to-edit-an-existing-page)
5. [How to Add a New Page](#5-how-to-add-a-new-page)
6. [How to Add an Insights Article](#6-how-to-add-an-insights-article)
7. [How to Change the Navigation](#7-how-to-change-the-navigation)
8. [How to Change the Footer](#8-how-to-change-the-footer)
9. [HTML Building Blocks](#9-html-building-blocks)
10. [Forms and Integrations](#10-forms-and-integrations)
11. [Images](#11-images)
12. [Deployment](#12-deployment)
13. [Brand and Copy Rules](#13-brand-and-copy-rules)
14. [Known Issues](#14-known-issues)
15. [Assessment and Agentic Workflow](#15-assessment--agentic-workflow)

---

## 1. Quick Start

### What this site is

Static HTML website for an AI governance consulting firm. No frameworks. No build tools. No backend. Every page is a standalone HTML file that references a shared CSS and JS file.

### Tech stack

- HTML5, CSS3 (custom properties, flexbox, grid), vanilla JavaScript
- Google Fonts (Cormorant Garamond + Outfit)
- FormSubmit.co for form submissions
- Calendly for booking
- Hosted on GitHub Pages

### Local development

Open any `.html` file directly in a browser. No server required. For the best experience, use VS Code with Live Server extension — it auto-reloads on save and handles relative paths correctly.

### Deployment

Push to the `main` branch. GitHub Pages deploys automatically within 1–2 minutes.

---

## 2. File Map

### Shared assets (referenced by all core pages)

```
styles.css              → All site CSS. Every core page links to this.
scripts.js              → Nav scroll, scroll-reveal animations, mobile menu, legacy URL redirects.
favicon.png             → 32x32 favicon
favicon.ico             → ICO format favicon
apple-touch-icon.png    → 180x180 Apple touch icon
img/headshot.jpeg        → Principal page photo
img/safe-ai-use-book.jpeg → Book cover image
img/stc-squared-conference.jpeg → Speaking engagement photo
```

### Core pages (share styles.css, scripts.js, identical nav/footer)

```
index.html              → Home page
methodology.html        → NGA framework, service tiers
strategy.html           → Strategy Session ($500, Calendly CTA). Single live booking offer.
debrief.html            → RETIRED. Now a redirect → strategy.html (meta-refresh + JS + canonical, noindex).
principal.html          → Dr. Gbemisola bio
missouri-report.html    → Missouri case study (Insights entry)
insights.html           → Insights hub page
contact.html            → Contact form (FormSubmit.co)
```

### Primary assessment (standalone, self-contained)

```
ai-transformation-readiness-assessment.html
    → LIVE primary assessment. Three pillars (Transformation & Strategy,
      Risk & AI Governance, Data & Technical Governance), 15 questions,
      ~5 minutes. Email-gated via FormSubmit.co. Reveals a named PROFILE
      with color-only pillar bars — NO numeric scores shown to the user.
```

### Standalone pages (self-contained, own inline CSS)

```
governance-readiness-assessment.html  → RETIRED. Now a redirect → ai-transformation-readiness-assessment.html.
nga-white-paper-revised.html          → Full NGA white paper
missouri-governance.html              → Missouri EO visual analysis
missouri-ai-governance-report.html    → Extended Missouri report
risk-tiering.html                     → Risk-Proportional Governance framework
mpbp-framework.html                   → Standalone MPBP page. STILL LIVE but NOT in nav. Contains
                                        Five Layers / MPBP language slated for removal — flag before linking.
arrell-debrief-preview-v8.html        → ORPHANED. Not in nav. Legacy blurred debrief preview; safe to delete.
```

### What "standalone" means

Standalone pages have **all their CSS and JS inline** — they do NOT reference `styles.css` or `scripts.js`. Editing them is fully isolated. They have their own nav markup but share the same link destinations as core pages.

---

## 3. Design System

### Colors (CSS custom properties — always use variables, never raw hex)

```css
:root {
  --bg: #080c14;                       /* Primary background (near-black navy) */
  --bg2: #0e1420;                      /* Secondary background (cards, sidebars) */
  --bg-card: #0d1219;                  /* Card background */
  --bg-card-h: #111820;               /* Card hover background */
  --text: #e8e4de;                     /* Primary text (warm off-white) */
  --text-2: #8a8b8e;                   /* Body copy, descriptions */
  --text-3: #5c5e63;                   /* Muted labels, tertiary text */
  --gold: #b8945f;                     /* Brand accent — CTAs, headings, highlights */
  --gold-s: rgba(184,148,95,0.12);     /* Gold shadow/glow */
  --gold-h: #d4aa6a;                   /* Gold hover state */
  --gold-b: rgba(184,148,95,0.2);      /* Gold border */
  --border: rgba(255,255,255,0.06);    /* Subtle borders */
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'Outfit', system-ui, sans-serif;
}
```

**The site is dark-mode only.** Dark background + warm text + gold accents = premium positioning. There is no light mode.

### Typography

| Element | Font Family | Size | Weight |
|---------|------------|------|--------|
| Hero H1 | `var(--serif)` | `clamp(2.6rem, 5vw, 4.2rem)` | 400 |
| Section heading (`.sh`) | `var(--serif)` | `clamp(1.8rem, 3.5vw, 2.6rem)` | 400 |
| Card titles (h3) | `var(--serif)` | 1.3–1.45rem | 500 |
| Body text | `var(--sans)` | 1.05rem, line-height 1.85 | 300 |
| Buttons | `var(--sans)` | 0.85rem, uppercase | 500 |
| Nav links | `var(--sans)` | 0.78rem, uppercase | 400 |
| Section labels (`.sl`) | `var(--sans)` | 0.7rem, uppercase | 500 |

**Rule:** Serif for headings and display text. Sans for everything else.

### Responsive breakpoints

| Breakpoint | What changes |
|-----------|-------------|
| `max-width: 900px` | Grids collapse to single column, padding reduces |
| `max-width: 768px` | Desktop nav hides, mobile hamburger appears |

---

## 4. How to Edit an Existing Page

### Editing text content

1. Open the page's HTML file
2. Find the text you want to change
3. Edit it directly
4. Save and test in browser
5. Push to GitHub

**Example — change the hero headline on the home page:**

Open `index.html`, find:
```html
<h1>Autonomous AI is already<br>operational. <em>The organizational<br>architecture to scale it does not exist.</em></h1>
```
Change the text. Keep the `<br>` tags for line breaks and `<em>` for the italic portion.

### Editing a link

Find the `<a>` tag and change the `href` attribute:

```html
<!-- Internal link (to another page on the site) -->
<a href="methodology.html">Methodology</a>

<!-- External link (opens in new tab) -->
<a href="https://calendly.com/arrelladvisory/strategy" target="_blank" rel="noopener">Book Now</a>

<!-- Email link -->
<a href="mailto:hello@arrelladvisory.com">hello@arrelladvisory.com</a>
```

**Rules:**
- Internal links use relative paths: `methodology.html`, NOT `https://arrelladvisory.com/methodology.html`
- External links MUST include `target="_blank" rel="noopener"`
- Never use `onclick="goTo('...')"` — that's the old routing system

### Adding a new link to existing content

Wrap the text in an `<a>` tag:

```html
<!-- Before -->
<p>Read our analysis of Missouri's governance approach.</p>

<!-- After -->
<p>Read our <a href="missouri-report.html" style="color:var(--text-2);text-decoration:none;border-bottom:1px solid var(--border);transition:all 0.3s">analysis of Missouri's governance approach</a>.</p>
```

The inline styles above match the site's standard inline link style: muted color, bottom border, hover transition.

### Adding a button

Two button types:

```html
<!-- Primary button (gold background, dark text, with arrow icon) -->
<a href="governance-readiness-assessment.html" class="btn-primary">
  Take the Assessment
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
  </svg>
</a>

<!-- Ghost button (transparent, underline style) -->
<a href="strategy.html" class="btn-ghost">Or book a strategy session</a>
```

**Buttons side by side:**
```html
<div class="btn-row">
  <a href="..." class="btn-primary">Primary Action <svg>...</svg></a>
  <a href="..." class="btn-ghost">Secondary Action</a>
</div>
```

---

## 5. How to Add a New Page

### Step 1: Create the file

Copy this complete template. Save as `your-page-name.html` in the repo root.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PAGE TITLE | Arrell Advisory</title>
<meta name="description" content="PAGE DESCRIPTION FOR SEARCH ENGINES">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<link rel="icon" type="image/png" href="favicon.png">
<link rel="icon" type="image/x-icon" href="favicon.ico">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
</head>
<body>

<!-- NAV -->
<nav id="nav">
  <a href="index.html" class="nav-brand">
    <span class="nav-brand-name">Arrell Advisory</span>
    <span class="nav-brand-type">AI Governance</span>
  </a>
  <ul class="nav-links">
    <li><a href="methodology.html" data-page="methodology">Methodology</a></li>
    <li><a href="principal.html" data-page="principal">Principal</a></li>
    <li><a href="insights.html" data-page="insights">Insights</a></li>
    <li><a href="ai-transformation-readiness-assessment.html" class="nav-assess">Take the Assessment</a></li>
    <li><a href="strategy.html" class="nav-cta" data-page="strategy">Strategy Session</a></li>
    <li><a href="https://www.aireadyleaders.org" target="_blank" rel="noopener" style="color:var(--text-3)">AI Ready Leaders ↗</a></li>
  </ul>
  <button class="mobile-toggle" onclick="openMobileMenu()" aria-label="Open menu"><span></span><span></span><span></span></button>
</nav>

<div class="mobile-overlay" id="mobileMenu">
  <button class="mobile-close" onclick="closeMobileMenu()">&times;</button>
  <a href="index.html">Home</a>
  <a href="methodology.html">Methodology</a>
  <a href="principal.html">Principal</a>
  <a href="insights.html">Insights</a>
  <a href="ai-transformation-readiness-assessment.html" style="color:var(--gold)">Take the Assessment</a>
  <a href="strategy.html" style="color:var(--gold)">Strategy Session</a>
  <a href="https://www.aireadyleaders.org" target="_blank" rel="noopener" style="color:var(--text-3)">AI Ready Leaders ↗</a>
</div>

<main class="page-content">

  <!-- Back link (change destination and label as needed) -->
  <a href="index.html" class="back-link">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
    </svg> Home
  </a>

  <!-- PAGE CONTENT GOES HERE -->
  <section>
    <div class="sc">
      <div class="sl">SECTION LABEL</div>
      <h2 class="sh">Section Heading</h2>
      <p class="sb">Section description text goes here.</p>

      <!-- Your content -->

    </div>
  </section>

</main>

<!-- FOOTER -->
<footer>
  <div class="footer-brand">
    <div class="footer-brand-name">Arrell Advisory</div>
    <div class="footer-copy">&copy; 2026 Arrell Advisory. All rights reserved.</div>
  </div>
  <div class="footer-links">
    <a href="methodology.html">Methodology</a>
    <div class="footer-sep"></div>
    <a href="insights.html">Insights</a>
    <div class="footer-sep"></div>
    <a href="principal.html">Principal</a>
    <div class="footer-sep"></div>
    <a href="contact.html">Contact</a>
    <div class="footer-sep"></div>
    <a href="https://www.linkedin.com/company/arrell-advisory" target="_blank" rel="noopener">LinkedIn</a>
    <div class="footer-sep"></div>
    <a href="https://aiusersafety.org" target="_blank" rel="noopener">AI User Safety</a>
    <div class="footer-sep"></div>
    <a href="https://www.aireadyleaders.org" target="_blank" rel="noopener">AI Ready Leaders</a>
    <div class="footer-sep"></div>
    <a href="https://a.co/d/0buNPql1" target="_blank" rel="noopener">Book</a>
  </div>
</footer>

<script src="scripts.js"></script>
<!-- If this page has a nav link, set its active state: -->
<script>
document.querySelectorAll('.nav-links a[data-page]').forEach(function(a) {
  if (a.getAttribute('data-page') === 'YOUR-PAGE-NAME') a.classList.add('active');
});
</script>
</body>
</html>
```

### Step 2: Customize

1. Replace `PAGE TITLE` in the `<title>` tag (format: "Page Name | Arrell Advisory")
2. Replace `PAGE DESCRIPTION` in the meta description
3. Replace the content between `<main>` and `</main>`
4. Change the back-link destination if needed (e.g., link to `insights.html` instead of `index.html`)
5. If this page has a nav link, set `YOUR-PAGE-NAME` in the active-state script. If not, delete that script block.

### Step 3: Add to nav (only if the page should appear in navigation)

See [Section 7](#7-how-to-change-the-navigation).

---

## 6. How to Add an Insights Article

### Step 1: Create the article page

Create a new HTML file (e.g., `your-article.html`) using the template from Section 5. Set the back-link to point to `insights.html`:

```html
<a href="insights.html" class="back-link">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
  </svg> Insights
</a>
```

### Step 2: Add an entry card on the Insights hub page

Open `insights.html`. Find the `<div class="insights-grid reveal">` container. Add a new card BEFORE the closing `</div>` of that container:

```html
<a href="your-article.html" class="insight-card" style="text-decoration:none">
  <div class="insight-card-type">Article Type &bull; Category</div>
  <h3>Your Article Title</h3>
  <p>One or two sentence description of the article. What the reader will learn or understand.</p>
  <div class="insight-card-meta">
    <span>Month Year &middot; Dr. Gbemisola Adetayo</span>
    <span class="insight-card-cta">Read →</span>
  </div>
</a>
```

**Card fields:**
- `href` → path to the article page
- `.insight-card-type` → format: "Article Type &bull; Category" (e.g., "Case Study &bull; Public Sector")
- `<h3>` → article title
- `<p>` → 1–2 sentence summary
- `.insight-card-meta` → date and author, plus the "Read →" CTA

### Step 3: Test

Open `insights.html` in browser. Verify the card appears and clicking it navigates to the article.

---

## 7. How to Change the Navigation

### Files to update

Every nav change requires editing **10 files**:

**Core pages (8 files):**
`index.html`, `methodology.html`, `strategy.html`, `principal.html`, `missouri-report.html`, `insights.html`, `contact.html`

> `debrief.html` and `governance-readiness-assessment.html` are now redirect stubs — they have no shared nav and are excluded from nav edits.

**Standalone pages with shared nav (3 files):**
`ai-transformation-readiness-assessment.html`, `missouri-governance.html`, and the core pages above. (`arrell-debrief-preview-v8.html` is orphaned; do not maintain its nav.)

### Adding a new nav link

In each of the 11 files, add the link inside the `<ul class="nav-links">`:

```html
<li><a href="your-page.html" data-page="your-page">Link Text</a></li>
```

Also add it to the mobile menu `<div class="mobile-overlay" id="mobileMenu">`:

```html
<a href="your-page.html">Link Text</a>
```

**Nav link styles:**
- Standard link: just add `data-page="name"` for active highlighting
- Assessment style (gold underline): add `class="nav-assess"`
- CTA style (gold button): add `class="nav-cta"`

### Renaming a nav link

Find-and-replace the link text across all 11 files. Both in the desktop `<ul class="nav-links">` AND the mobile `<div class="mobile-overlay">`.

### Removing a nav link

Delete the `<li>...</li>` from the desktop nav and the corresponding `<a>` from the mobile menu, across all 11 files.

### Note on missouri-governance.html

This page uses a different nav structure (class `site-nav` instead of `nav`). Its nav is minimal — only 3 links. Update the links inside `<div class="site-nav-links">`.

---

## 8. How to Change the Footer

### Files to update

Footer changes require editing the **7 core pages + `ai-transformation-readiness-assessment.html`** (8 files). The retired `debrief.html` and `governance-readiness-assessment.html` redirect stubs have no footer.

The other standalone pages either have no footer or use a custom footer that is not part of the shared pattern.

### Adding a footer link

In each file, add inside `<div class="footer-links">`:

```html
<div class="footer-sep"></div>
<a href="your-page.html">Link Text</a>
```

The `footer-sep` div creates the visual separator dot between links.

### For external footer links:

```html
<div class="footer-sep"></div>
<a href="https://external-site.com" target="_blank" rel="noopener">Link Text</a>
```

---

## 9. HTML Building Blocks

These are the exact markup patterns used throughout the site. Copy and customize.

### Section (standard content block)

```html
<section>
  <div class="sc">
    <div class="sl">SECTION LABEL IN CAPS</div>
    <h2 class="sh">Section Heading Goes Here</h2>
    <p class="sb">Description paragraph. One or two sentences setting up what follows.</p>

    <!-- Your content here -->

  </div>
</section>
```

- `.sc` = container (max-width 1100px, centered)
- `.sl` = section label (small uppercase gold text)
- `.sh` = section heading (serif font, responsive size)
- `.sb` = section body (muted color, max-width 620px)

### Section with dark background

```html
<section class="bg-alt">
  <div class="sc">
    <!-- content -->
  </div>
</section>
```

### Card (problem statement pattern)

```html
<div class="problem-card">
  <div class="problem-label">"Quote or challenge statement"</div>
  <p>Explanation paragraph describing the problem in detail.</p>
</div>
```

### Insight entry card (for the Insights hub)

```html
<a href="article-page.html" class="insight-card" style="text-decoration:none">
  <div class="insight-card-type">Type &bull; Category</div>
  <h3>Article Title</h3>
  <p>Summary of the article.</p>
  <div class="insight-card-meta">
    <span>Month Year &middot; Dr. Gbemisola Adetayo</span>
    <span class="insight-card-cta">Read →</span>
  </div>
</a>
```

### Scroll-reveal animation

Add `class="reveal"` to any element to make it fade in when scrolled into view:

```html
<div class="reveal">
  This content fades in when the user scrolls to it.
</div>
```

The animation is handled by `scripts.js` using IntersectionObserver. No additional setup needed.

### Credential/tag strip

```html
<div class="cred-strip">
  <span class="cred-tag">Tag One</span>
  <span class="cred-tag">Tag Two</span>
  <span class="cred-tag">Tag Three</span>
</div>
```

### Divider line

```html
<div class="divider"></div>
```

### Hero badge (price/format label)

```html
<div class="debrief-hero-badge">Strategy Session · $500</div>
```

### Two-column layout (content + sidebar)

The `debrief-*` CSS classes remain in `styles.css` and power the **Strategy Session** page's content + sticky booking sidebar (the class names are legacy; the Debrief product is retired). Reuse pattern:

```html
<div class="debrief-body">
  <div class="debrief-what">
    <!-- Left column: content -->
    <h3>Heading</h3>
    <p>Content paragraph.</p>
  </div>
  <div class="debrief-booking">
    <!-- Right column: sticky sidebar -->
    <div class="debrief-booking-price">$500</div>
    <div class="debrief-booking-sub">Description of what's included</div>
    <a href="https://calendly.com/arrelladvisory/strategy" target="_blank" rel="noopener" class="btn-primary">
      Book a Strategy Session <svg>...</svg>
    </a>
  </div>
</div>
```

### Highlighted box

```html
<div class="debrief-value-box">
  <h4>Box Title</h4>
  <p>Content inside the highlighted box.</p>
</div>
```

### Bulleted list (within content)

```html
<ul class="debrief-deliverable-list">
  <li>First deliverable or point</li>
  <li>Second deliverable or point</li>
  <li>Third deliverable or point</li>
</ul>
```

---

## 10. Forms and Integrations

### Contact form (FormSubmit.co)

**Endpoint:** `https://formsubmit.co/ajax/hello@arrelladvisory.com`  
**File:** `contact.html` (JS is inline in this file, not in scripts.js)

The form submits via AJAX POST with a JSON body. On success, the button changes to "Message Sent ✓" for 4 seconds, then resets.

**To add a new form field:**

1. Add the HTML input inside `<div class="contact-form">`:

```html
<label for="contact-newfield">Field Label <span style="color:#c75050">*</span></label>
<input type="text" id="contact-newfield" placeholder="Placeholder text" required>
```

2. Update the `sendContactForm()` function to include the new field:
   - Add a variable: `var newfield = document.getElementById('contact-newfield').value.trim();`
   - Add it to the validation check
   - Add it to the JSON body in the fetch call
   - Add it to the reset array

**To add a dropdown:**

```html
<label for="contact-dropdown">Label <span style="color:#c75050">*</span></label>
<select id="contact-dropdown" required>
  <option value="">Select one...</option>
  <option value="Option A">Option A</option>
  <option value="Option B">Option B</option>
</select>
```

### Calendly booking links

**Primary URL (the ONLY booking URL sitewide):** `https://calendly.com/arrelladvisory/strategy`

Used on: index.html, strategy.html, methodology.html, and the assessment results CTA. There is one Calendly link only — the Strategy Session.

**Always open in new tab:**
```html
<a href="https://calendly.com/arrelladvisory/strategy" target="_blank" rel="noopener" class="btn-primary">
  Book a Strategy Session
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
  </svg>
</a>
```

**To change the Calendly URL:** Find-and-replace the old URL across all files that reference it.

### Assessment form (email gate)

**File:** `ai-transformation-readiness-assessment.html`  
**Endpoint:** `https://formsubmit.co/ajax/hello@arrelladvisory.com` (AJAX/fetch POST)  
**Model:** Three pillars — Transformation & Strategy (Q1–5), Risk & AI Governance (Q6–10), Data & Technical Governance (Q11–15). 15 questions, ~5 minutes.  
**Output:** A named PROFILE with color-only pillar bars. **No numeric scores are shown to the user.** Scoring/classification logic (`classify`, `pillarColor`, `computePillarScores`) runs entirely client-side; only the email + answers are POSTed to FormSubmit.

This page is fully self-contained. All CSS and JS are inline. Editing it does not affect any other page. See **Section 15** for the full lead-capture and agentic-workflow notes.

---

## 11. Images

### Where images live

All images are in the `img/` subdirectory at the repo root.

### Current images

| File | Used On | Description |
|------|---------|-------------|
| `img/headshot.jpeg` | principal.html | Dr. Gbemisola's headshot |
| `img/safe-ai-use-book.jpeg` | principal.html | SAFE AI USE Manual book cover |
| `img/stc-squared-conference.jpeg` | principal.html | STC Squared Conference photo |

### Adding a new image

1. Add the image file to the `img/` directory
2. Reference it in HTML:

```html
<img src="img/your-image.jpeg" alt="Descriptive alt text for accessibility">
```

**Always include an `alt` attribute.** Describe what the image shows for screen readers and SEO.

### Image sizing

Control image size with inline styles or Tailwind-style utility classes:

```html
<!-- Full width -->
<img src="img/photo.jpeg" alt="Description" style="width:100%;display:block">

<!-- Fixed width -->
<img src="img/photo.jpeg" alt="Description" style="width:200px">
```

---

## 12. Deployment

### Process

1. Make changes to the relevant file(s)
2. Test locally by opening the HTML file in a browser
3. Commit with a descriptive message (e.g., "Update methodology page CTA text")
4. Push to the `main` branch
5. Verify at arrelladvisory.com (allow 1–2 minutes for GitHub Pages to deploy)

### Pre-deployment checklist

- [ ] Changed content renders correctly in browser
- [ ] All internal links navigate to correct pages
- [ ] All external links open in new tabs
- [ ] Nav active state highlights the correct page
- [ ] Mobile menu opens and closes properly
- [ ] No broken images
- [ ] Forms submit successfully
- [ ] Calendly links open correctly
- [ ] Page looks correct at mobile width (resize browser to ~375px)

### Rolling back a change

If a deployment breaks something, revert the commit in Git:
```bash
git revert HEAD
git push
```

---

## 13. Brand and Copy Rules

### Voice

- **"We" voice** on firm pages (Methodology, Strategy, Contact, Insights)
- **"I" voice** only on the Principal page
- Executive-level language: precise, outcome-oriented, authoritative
- No em-dashes anywhere on the site
- Do not repeat "responsible" within the same clause

### Positioning

- Governance as strategic advantage, not compliance overhead
- Lead with outcomes, not mechanisms
- Use buyer vocabulary ("digital transformation," "board-defensible"), not internal jargon
- Frameworks are commodity — don't lead headlines with trademark symbols

### Proprietary IP names (use exactly as written)

- NGA™ (Nested Governance Architecture)
- Risk-Proportional Governance™
- SAFE AI USE™ (Structure, Accelerate, Filter, Empower)
- Dual-Lens Classification

> **Retired language (do NOT reintroduce on live pages):** "MPBP Framework™ (Map, Prioritize, Build, Pilot)" and "Five Layers of Operational Governance" have been removed from `methodology.html` and the retired debrief page. The public methodology now describes the **three-pillar model**. The standalone `mpbp-framework.html` still contains this language and is not linked from the nav — clear it before surfacing that page.

---

## 14. Known Issues

### NGA White Paper link may not resolve

`methodology.html` and `principal.html` link to `https://www.arrelladvisory.com/nga-white-paper`. The actual file is `nga-white-paper-revised.html`. Verify the URL resolves or update the links.

### Orphaned and unlinked pages

- `arrell-debrief-preview-v8.html` — orphaned legacy debrief preview, not in nav. Safe to delete.
- `mpbp-framework.html` — still live, not in nav, still contains Five Layers / MPBP language. Clear or remove before linking.
- Other pages that may still carry Five Layers / MPBP language and are out of the current update scope: `principal.html`, `missouri-report.html`, `nga-white-paper-revised.html`, `risk-tiering.html`, `missouri-ai-governance-report.html`. Review before reuse.

### Nav duplication

Changing the nav requires editing 11 files. This is a known tradeoff. If nav changes become frequent, consider migrating to Jekyll (GitHub Pages' built-in templating system).

### Framework pages have minimal/outdated nav

`risk-tiering.html` and `mpbp-framework.html` have no site navigation (and `mpbp-framework.html` retains retired Five Layers / MPBP copy). `missouri-governance.html` has a minimal custom nav. These should eventually be aligned with the current nav pattern.

### GitHub Pages SEO limitations

GitHub Pages has limited domain authority. If the Insights content strategy requires competitive search ranking, consider migrating to Vercel, Netlify, or a CMS.

---

## 15. Assessment & Agentic Workflow

### What the live assessment does on upload

`ai-transformation-readiness-assessment.html` is fully functional the moment the repo is pushed to GitHub Pages. With no extra setup it will:

1. Gate access behind an email capture.
2. Present 15 questions across the three pillars.
3. Compute pillar scores and classify the respondent into one of five named **profiles** entirely client-side.
4. Display the profile with color-only pillar bars (no numbers).
5. POST the email + raw answers to FormSubmit (`https://formsubmit.co/ajax/hello@arrelladvisory.com`), which emails the submission to you.

**This lead-capture path works out of the box.** No server, no API keys, no build step.

### What is NOT wired (the agentic workflow)

The Qualification Agent (HDSI capability-block mapping) and Synthesis Agent (report-template generation) described in the product spec are **backend automation and are NOT included in this static repo.** Uploading the repo does **not** activate them. The site captures the lead; it does not run the agents.

To activate the agentic workflow you need a separate automation layer that the static site cannot host:

- **Intake handoff:** point the form at (or fan out from) a webhook/automation endpoint (e.g. an automation platform, serverless function, or backend) instead of relying solely on the FormSubmit email. FormSubmit can forward to one endpoint, or replace the `fetch` target with your own webhook URL.
- **Qualification Agent:** receives the payload, maps answers to HDSI capability blocks, applies qualification logic.
- **Synthesis Agent:** generates the profile report from the agent template.
- **Human approval:** a review step before any report is sent (governance control — keep the human in the loop).

**Bottom line:** push the repo and the assessment collects qualified leads immediately. The automated qualification + synthesis + report generation requires wiring the form submission to your webhook/automation backend — that is a separate task from this static deployment.

### Where to change the submission target

In `ai-transformation-readiness-assessment.html`, the submission is a `fetch(...)` call to the FormSubmit AJAX endpoint. To route to your own webhook instead, replace that endpoint URL with your webhook URL and adjust the JSON payload to match your agent's expected schema.

---

## Appendix: Quick Reference

### CSS class cheat sheet

| Class | What it does |
|-------|-------------|
| `.sc` | Content container — max-width 1100px, centered |
| `.sl` | Section label — small uppercase gold text |
| `.sh` | Section heading — serif, responsive sizing |
| `.sb` | Section body — muted text, max-width 620px |
| `.btn-primary` | Gold CTA button |
| `.btn-ghost` | Underline-style secondary link |
| `.btn-row` | Container for side-by-side buttons |
| `.back-link` | Interior page back navigation arrow |
| `.reveal` | Triggers scroll fade-in animation |
| `.bg-alt` | Dark alternate section background |
| `.divider` | Gold horizontal rule |
| `.nav-assess` | Gold underline nav style (Assessment link) |
| `.nav-cta` | Gold button nav style (Strategy Session) |
| `.page-content` | Main content wrapper |
| `.mobile-toggle` | Hamburger menu button |
| `.mobile-overlay` | Full-screen mobile nav |
| `.insight-card` | Insights hub entry card |
| `.debrief-body` | Two-column layout (content + sidebar) |
| `.debrief-booking` | Sticky sidebar |
| `.debrief-value-box` | Highlighted content box |
| `.debrief-deliverable-list` | Styled bullet list |
| `.problem-card` | Problem statement card |
| `.cred-strip` | Credential tag container |
| `.cred-tag` | Individual credential tag |

### What to edit for common tasks

| I want to... | Edit these files |
|-------------|-----------------|
| Change text on one page | That page's HTML file only |
| Change site colors or fonts | `styles.css` only |
| Change scroll/animation behavior | `scripts.js` only |
| Add/change a nav link | 8 core pages + 3 standalone pages (11 files) |
| Add/change a footer link | 8 core pages + assessment page (9 files) |
| Add a new page (no nav link) | Create new HTML file from template |
| Add a new page (with nav link) | Create file + update 11 files |
| Add an Insights article | Create article page + add card to `insights.html` |
| Change contact form | `contact.html` only |
| Change assessment logic/profiles | `ai-transformation-readiness-assessment.html` only |
| Change booking URL | Find-and-replace `calendly.com/arrelladvisory/strategy` across all files |
| Add a legacy URL redirect | `scripts.js` (add to knownPages array) |
| Add a new image | Add file to `img/`, reference with `<img src="img/...">` |

### Arrow SVG (used in buttons)

Copy this SVG for any button that needs the right-pointing arrow:

```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
</svg>
```

### Back-link SVG (left chevron)

```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
</svg>
```
