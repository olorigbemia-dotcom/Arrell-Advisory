# Workshop page image register

Covers `/ai-workshops-springfield/` (`ai-workshops-springfield/index.html`).

Photography on this page is deliberately sparse. Of the five existing Arrell
Advisory images considered, only two are genuine photographs that survive a dark
overlay. The rest of the page uses a tonal treatment built to the same geometry,
so a licensed photograph can be dropped in later without touching the CSS.

## In use now

| File | Page location | Markup | Intended replacement category |
|---|---|---|---|
| `img/Keynotes and workshops.jpg` (3000×1296) | Hero, `.labhero.has-photo` | `<img class="labhero-photo">` | Facilitator leading a room — workshop or seminar, audience visible, subject off-centre right |
| `img/speaking-keynote.jpg` (1113×683) | Closing band, `.labclose.has-photo` | `<img class="labclose-photo">` | Speaker or facilitator portrait in context; used as texture, so detail is not critical |

## Awaiting photography

The three workshop cards (`.labcard.is-visual`) currently render a tonal
gradient (`.labcard-tone`) rather than a photograph, because repeating either of
the two usable images across the cards was ruled out.

| Card | Workshop | Intended replacement category |
|---|---|---|
| Lab 01 | Build Your AI-Powered Business Assistant | Individual at a laptop doing focused administrative work |
| Lab 02 | Build Your Automated Marketing System | Content or campaign planning — whiteboard, calendar, small team |
| Lab 03 | Turn More Inquiries into Customers with AI | Customer-facing conversation or follow-up at a desk |

## How to replace

Each photograph is a plain `<img>` as the **first child** of its block. To swap
one, change `src` and the intrinsic `width`/`height` to the new file's real
pixel dimensions. No CSS change is needed.

To give a workshop card a photograph, replace its `<div class="labcard-tone">`
with an `<img class="labcard-photo" src="…" alt="" loading="lazy" width="…"
height="…">` in the same position. `.labcard-photo` is already styled (cover
fit, bottom-anchored copy, hover zoom) and sits behind the same
`.labcard-shade`.

## Rejected candidates

Recorded so these are not reconsidered without cause:

- `img/arl-classroom.jpg` (1440×1440) — casual group selfie; letterbox bars
  baked into the file; faces fill the frame.
- `img/enterprise-presentation.jpg` (1920×1080) — a photograph *of a projected
  slide*; its text competes with page copy under an overlay.
- `img/stc-squared-conference.jpeg` (1200×675) — a promotional flyer, not a
  photograph.

## Constraints

- Do not hotlink. Images are committed to the repository.
- Do not reuse the same photograph twice on this page.
- `labs.css` is shared by 25 pages (this subtree plus all of
  `/ai-ready-leaders/`). Every rule added for this treatment is gated behind
  `.has-photo` / `.is-visual` so no other page is affected. Keep it that way.
- `labs.css` is cache-busted with `?v=N`. Changing the file means bumping that
  marker on **all 25** referencing pages in the same commit.
