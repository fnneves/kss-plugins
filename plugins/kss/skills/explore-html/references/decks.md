# Slide deck explorer

**Use when**: the user wants to *present* something — a research recap, a status update with narrative, a "here's what we're proposing" pitch. The page is read in linear order, one viewport at a time.

**Defining trait**: each slide is a complete thought that fills the viewport. Navigation is keyboard-driven; the audience reads at the pace of the speaker.

## Worked example shape

A 6-slide research recap (the shape Thariq uses in `09-slide-deck.html`):

1. **Title slide** — eyebrow + headline + one-line dek + an SVG ornament. No body content.
2. **Context slide** — what we were trying to figure out, in 2-3 sentences. Maybe a small framing diagram.
3. **Finding slide** — the headline finding, big and centered. One sentence.
4. **Evidence slide** — the chart or data view that supports the finding.
5. **Inverted "what this changes" slide** — high-contrast (dark background) for the moment of impact.
6. **Next steps slide** — 3-4 bullets, each with an owner.

The deck is scannable as a series of viewports. There's no scrolling within a slide — if you need scroll, you have too much per slide.

## Layout primitives

Each slide is a `<section class="slide">` sized to ~`100vh`:

```css
html { scroll-snap-type: y mandatory; }
.slide {
  min-height: 100vh;
  scroll-snap-align: start;
  display: grid;
  place-content: center;
  padding: 56px 48px;
}
.slide-inner { max-width: 880px; }
```

A high-contrast variant for emphasis:

```css
.slide.invert { background: var(--slate); color: var(--ivory); }
.slide.invert h2 { color: var(--ivory); }
.slide.invert .muted { color: var(--g300); }
```

A footer counter (`3 / 6`) lives outside `.slide`:

```css
#counter {
  position: fixed; bottom: 24px; right: 32px;
  font-family: var(--mono); font-size: 12px;
  color: var(--g500);
  background: var(--paper); padding: 6px 12px;
  border: 1.5px solid var(--g300); border-radius: 999px;
}
```

## The 30-line navigation script

```html
<script>
(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counter = document.getElementById('counter');
  let current = 0;

  function go(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides[current].scrollIntoView({ behavior: 'smooth' });
  }

  document.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown', ' '].includes(e.key)) { e.preventDefault(); go(current + 1); }
    if (['ArrowLeft', 'ArrowUp'].includes(e.key))         { e.preventDefault(); go(current - 1); }
  });

  // Update counter as user scrolls
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        current = slides.indexOf(en.target);
        counter.textContent = (current + 1) + ' / ' + slides.length;
      }
    });
  }, { threshold: 0.6 });
  slides.forEach((s) => obs.observe(s));
})();
</script>
```

That's the whole deck engine. No Reveal.js, no impress.js, no framework.

## Title-slide ornament

A small abstract SVG glyph on the title slide gives it a visual anchor without a hero image. Anything geometric and palette-coherent works.

```html
<svg class="ornament" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
  <circle cx="28" cy="28" r="22" fill="none" stroke="#D97757" stroke-width="2"/>
  <circle cx="28" cy="28" r="10" fill="#788C5D"/>
</svg>
```

## Full-bleed sparkline footer (optional)

For the evidence slide, a thin SVG sparkline at the bottom of the viewport gives data context without a full chart:

```html
<svg width="100%" height="64" viewBox="0 0 780 64" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0,40 Q200,10 400,30 T780,20" fill="none" stroke="#D97757" stroke-width="2"/>
</svg>
```

`preserveAspectRatio="none"` lets the SVG stretch to fill width without distorting the vertical scale.

## Common pitfalls

- **Too much per slide.** If you find yourself scrolling within a slide, split it. The format is `viewport = thought`.
- **Decorating empty slides.** If a slide has 12 words on it, that's fine — don't pad it with gratuitous visuals to "fill the space."
- **Forgetting the counter.** Without `3 / 6` in the corner, the audience doesn't know how long the deck is.
- **Animations that interrupt reading.** Scroll-snap is enough motion. Don't add fade-in/slide-in transitions on every slide — they slow down the experienced reader.
- **Tiny mono font on full-bleed slides.** 13px mono looks fine in a card but loses legibility at slide scale. Bump body type to 18-22px on slides.

## Reference primitives from `assets/template.html`

- The `--ivory`/`--slate`/`--clay` palette (slides should match the page system)
- `.eyebrow` for the small uppercase mono label above each slide title
- `.muted` for sub-text and footnotes
- `<details>/<summary>` if a slide needs progressive disclosure
