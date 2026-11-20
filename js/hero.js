export function initHeroEffects({ reduceMotion, tabletLayout, hasIO }) {
  // ---------- Hero: fade out as you scroll past ----------
  const hero = document.querySelector(".hero");
  if (hero && !reduceMotion) {
    let ticking = false;
    let heroHeight = hero.offsetHeight || 1;
    let lastP = -1;

    const update = () => {
      ticking = false;
      const fadeDistance = tabletLayout.matches ? 3 : 2;
      const p = Math.min(
        Math.max(window.scrollY / (heroHeight * fadeDistance), 0),
        1,
      );
      const rounded = Math.round(p * 1000) / 1000;
      // Nothing to repaint once the hero is fully faded or unchanged
      if (rounded === lastP) return;
      lastP = rounded;
      hero.style.setProperty("--p", rounded.toFixed(3));
    };
    const schedule = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", schedule, { passive: true });
    // Cache the height instead of reading layout on every scroll frame
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        heroHeight = hero.offsetHeight || 1;
        schedule();
      }).observe(hero);
    } else {
      window.addEventListener(
        "resize",
        () => {
          heroHeight = hero.offsetHeight || 1;
          schedule();
        },
        { passive: true },
      );
    }
    update();

    // Replay the hero entrance (name, portrait, intro, socials) every time
    // the hero returns to the screen after being scrolled fully past.
    if (hasIO) {
      new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (entry.intersectionRatio === 0) {
            hero.classList.add("is-away");
          } else if (entry.intersectionRatio >= 0.2) {
            hero.classList.remove("is-away");
          }
        },
        { threshold: [0, 0.2] },
      ).observe(hero);
    }
  }

  // ---------- Hero: portrait colour spotlight ----------
  const portrait = document.querySelector(".hero__portrait");
  if (portrait) {
    let spotX = 0;
    let spotY = 0;
    let spotFrame = 0;
    const paintSpot = () => {
      spotFrame = 0;
      const r = portrait.getBoundingClientRect();
      portrait.style.setProperty("--mx", `${spotX - r.left}px`);
      portrait.style.setProperty("--my", `${spotY - r.top}px`);
    };
    const queueSpot = (e) => {
      spotX = e.clientX;
      spotY = e.clientY;
      if (!spotFrame) spotFrame = requestAnimationFrame(paintSpot);
    };

    portrait.addEventListener("pointerenter", (e) => {
      portrait.classList.add("is-hover");
      queueSpot(e);
    });
    portrait.addEventListener("pointerleave", () =>
      portrait.classList.remove("is-hover"),
    );
    portrait.addEventListener("pointermove", queueSpot, { passive: true });
  }
}
