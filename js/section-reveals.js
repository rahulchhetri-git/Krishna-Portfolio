export function initSectionReveals({ reduceMotion, hasIO }) {
  // ---------- Sections: reveal on scroll, in both directions ----------
  // Each entry is [selector, stagger in seconds, items per row].
  const reveals = [
    [".highlight .section__title", 0, 1],
    [".highlight__toolbar", 0.1, 1],
    [".highlight__grid .card", 0.12, 2],
    [".service .section__title", 0, 1],
    [".accordion__item", 0.1, 1],
    [".milestone__head", 0, 1],
    [".timeline__row", 0.1, 1],
    [".contact__card", 0, 1],
    [".contact__links li", 0.08, 6],
  ];

  if (!reduceMotion && hasIO) {
    // "in" while on screen; "above" once scrolled past; "below" while waiting.
    // CSS turns these states into transitions, so every change can reverse.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          const state = entry.isIntersecting
            ? "in"
            : entry.boundingClientRect.top < 0
              ? "above"
              : "below";
          if (el.dataset.rv !== state) el.dataset.rv = state;
        });
      },
      { threshold: 0, rootMargin: "-6% 0px -6% 0px" },
    );

    reveals.forEach(([selector, stagger, perRow]) => {
      document.querySelectorAll(selector).forEach((el, i) => {
        el.style.setProperty("--d", `${(i % perRow) * stagger}s`);
        el.classList.add("rv");
        // Elements already on screen start visible (no flash on load)
        const rect = el.getBoundingClientRect();
        el.dataset.rv =
          rect.bottom < 0
            ? "above"
            : rect.top > window.innerHeight
              ? "below"
              : "in";
        io.observe(el);
      });
    });
  }
}
