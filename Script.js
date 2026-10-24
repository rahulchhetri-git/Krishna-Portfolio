// =========================================================
      // KRISHNA ARYAL — PORTFOLIO
      // =========================================================
      (() => {
        // ---------- Footer year ----------
        const year = document.getElementById("year");
        if (year) year.textContent = new Date().getFullYear();

        // ---------- Highlight filter ----------
        const tabs = document.querySelectorAll(".filters__btn");
        const cards = document.querySelectorAll(".highlight__grid .card");

        tabs.forEach((tab) => {
          tab.addEventListener("click", () => {
            const filter = tab.dataset.filter;

            tabs.forEach((t) => {
              const active = t === tab;
              t.classList.toggle("is-active", active);
              t.setAttribute("aria-selected", active);
            });

            cards.forEach((card) => {
              const show = filter === "all" || card.dataset.category === filter;
              card.hidden = !show;
              card.classList.remove("is-refresh");
            });
            // Re-play the entrance for the cards that remain
            void document.body.offsetWidth;
            [...cards]
              .filter((c) => !c.hidden)
              .forEach((c, i) => {
                c.style.setProperty("--d", `${i * 0.08}s`);
                c.classList.add("is-refresh");
              });
          });
        });

        // ---------- Service accordion (one open at a time) ----------
        const items = document.querySelectorAll(".accordion__item");

        items.forEach((item) => {
          const head = item.querySelector(".accordion__head");
          const body = item.querySelector(".accordion__body");

          head.addEventListener("click", () => {
            const willOpen = !item.classList.contains("is-open");

            items.forEach((other) => {
              const open = other === item && willOpen;
              other.classList.toggle("is-open", open);
              other
                .querySelector(".accordion__head")
                .setAttribute("aria-expanded", open);
              other.querySelector(".accordion__body").hidden = !open;
            });
          });
        });

        // ---------- Animation ----------
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        // Hero fades out as you scroll past it
        const hero = document.querySelector(".hero");
        if (hero && !reduceMotion) {
          let ticking = false;
          const update = () => {
            const p = Math.min(
              Math.max(window.scrollY / (hero.offsetHeight * 0.85), 0),
              1,
            );
            hero.style.setProperty("--p", p.toFixed(3));
            ticking = false;
          };
          window.addEventListener(
            "scroll",
            () => {
              if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
              }
            },
            { passive: true },
          );
          update();
        }

        // Reveal-on-scroll: [selector, stagger in seconds, items per row]
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

        if (!reduceMotion && "IntersectionObserver" in window) {
          const io = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.remove("is-pending");
                entry.target.classList.add("is-in");
                io.unobserve(entry.target);
              });
            },
            { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
          );

          reveals.forEach(([selector, stagger, perRow]) => {
            document.querySelectorAll(selector).forEach((el, i) => {
              if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen
              el.style.setProperty("--d", `${(i % perRow) * stagger}s`);
              el.classList.add("is-pending");
              io.observe(el);
            });
          });
        }

        // ---------- Portrait: colour spotlight on hover ----------
        const portrait = document.querySelector(".hero__portrait");
        if (portrait) {
          portrait.addEventListener("pointerenter", () =>
            portrait.classList.add("is-hover"),
          );
          portrait.addEventListener("pointerleave", () =>
            portrait.classList.remove("is-hover"),
          );
          portrait.addEventListener("pointermove", (e) => {
            const r = portrait.getBoundingClientRect();
            portrait.style.setProperty("--mx", `${e.clientX - r.left}px`);
            portrait.style.setProperty("--my", `${e.clientY - r.top}px`);
          });
        }

        // ---------- Milestones: preview follows the cursor ----------
        const rows = document.querySelectorAll(".timeline__row");

        rows.forEach((row) => {
          const preview = row.querySelector(".timeline__preview");
          if (!preview) return;

          row.addEventListener("mousemove", (e) => {
            const rect = row.getBoundingClientRect();
            preview.style.left = `${e.clientX - rect.left + 20}px`;
          });
        });
      })();
