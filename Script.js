// =========================================================
// KRISHNA ARYAL — PORTFOLIO
// =========================================================
(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const compactLayout = window.matchMedia(
    "(max-width: 960px), (pointer: coarse)",
  );
  const hasIO = "IntersectionObserver" in window;

  // ---------- Footer ----------
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Featured media: only one clip plays at a time ----------
  // Every .card__media remembers its original children so a clip that is
  // stopped goes back to its thumbnail + play button (same nodes, so their
  // click listeners keep working).
  const mediaState = new WeakMap();
  let activeMedia = null;

  const getMediaState = (media) => {
    if (!mediaState.has(media)) {
      mediaState.set(media, { nodes: [...media.childNodes], cleanup: null });
    }
    return mediaState.get(media);
  };

  const stopActiveMedia = () => {
    if (!activeMedia) return;
    const media = activeMedia;
    activeMedia = null;
    const state = mediaState.get(media);
    if (state && state.cleanup) {
      const cleanup = state.cleanup;
      state.cleanup = null;
      cleanup();
    }
  };

  // Call right before a clip starts. Stops whatever else is playing.
  const claimPlayback = (media, cleanup) => {
    if (activeMedia && activeMedia !== media) stopActiveMedia();
    activeMedia = media;
    getMediaState(media).cleanup = cleanup;
  };

  document.querySelectorAll(".card__media").forEach(getMediaState);

  // ---------- Highlights: card filtering ----------
  const tabs = document.querySelectorAll(".filters__btn");
  const cards = document.querySelectorAll(".highlight__grid .card");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const filter = tab.dataset.filter;
      stopActiveMedia();

      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active);
      });
      cards.forEach((card) => {
        const categories = card.dataset.category.split(/\s+/);
        const show = filter === "all" || categories.includes(filter);
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
      // Back to the first card in the swipe row on mobile
      const grid = document.querySelector(".highlight__grid");
      if (grid) grid.scrollTo({ left: 0 });
    });
  });

  // ---------- Highlights: play video previews on demand ----------
  let hlsLibrary;
  const loadHlsLibrary = () => {
    if (!hlsLibrary) {
      hlsLibrary = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/hls.js@1.6.13/dist/hls.min.js";
        script.integrity =
          "sha384-z+tuLqMWl1/cPv7O+39RO0EURSNvorimpcCaMgeNwU+qFBx+AlUIl7jaAwg0cYil";
        script.crossOrigin = "anonymous";
        script.onload = () => resolve(window.Hls);
        script.onerror = () => {
          hlsLibrary = null;
          reject(new Error("Unable to load the HLS playback library."));
        };
        document.head.append(script);
      });
    }
    return hlsLibrary;
  };

  const showPlaybackError = (media) => {
    const message = document.createElement("p");
    message.className = "card__playback-error";
    message.textContent =
      "Unable to play this clip here. Use the Watch clip on Kick link below.";
    media.replaceChildren(message);
  };

  document.querySelectorAll(".card__play").forEach((button) => {
    button.addEventListener("click", async () => {
      const media = button.closest(".card__media");
      if (!media) return;
      const { nodes } = getMediaState(media);

      if (button.dataset.provider === "kick") {
        let hls = null;
        let cancelled = false;
        const video = document.createElement("video");

        claimPlayback(media, () => {
          cancelled = true;
          if (hls) {
            hls.destroy();
            hls = null;
          }
          video.pause();
          video.removeAttribute("src");
          video.load();
          media.replaceChildren(...nodes);
        });

        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = "none";
        video.title = button.dataset.videoTitle;
        video.setAttribute("aria-label", button.dataset.videoTitle);
        video.addEventListener("error", () => showPlaybackError(media), {
          once: true,
        });
        media.replaceChildren(video);

        const streamUrl = new URL(button.dataset.videoUrl);
        if (
          streamUrl.protocol !== "https:" ||
          streamUrl.hostname !== "clips.kick.com"
        ) {
          showPlaybackError(media);
          return;
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl.href;
          video.play().catch(() => {
            if (!cancelled) showPlaybackError(media);
          });
          return;
        }

        try {
          const Hls = await loadHlsLibrary();
          if (cancelled) return;
          if (!Hls?.isSupported()) {
            showPlaybackError(media);
            return;
          }
          const player = new Hls();
          hls = player;
          player.loadSource(streamUrl.href);
          player.attachMedia(video);
          video.muted = true;
          player.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {
              if (cancelled) return;
              const hint = document.createElement("span");
              hint.className = "card__playback-hint";
              hint.setAttribute("role", "status");
              hint.textContent =
                "Press play in the controls to start the clip. Sound can be enabled there.";
              media.append(hint);
            });
          });
          video.addEventListener(
            "playing",
            () => media.querySelector(".card__playback-hint")?.remove(),
            { once: true },
          );
          player.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              player.destroy();
              if (hls === player) hls = null;
              if (!cancelled) showPlaybackError(media);
            }
          });
        } catch {
          if (!cancelled) showPlaybackError(media);
        }
        return;
      }

      const player = document.createElement("iframe");
      const embedUrl = button.dataset.embedUrl
        ? new URL(button.dataset.embedUrl)
        : new URL(
            `https://www.youtube-nocookie.com/embed/${encodeURIComponent(button.dataset.videoId)}?autoplay=1&playsinline=1`,
          );
      if (
        embedUrl.protocol !== "https:" ||
        !["www.youtube-nocookie.com", "www.tiktok.com"].includes(
          embedUrl.hostname,
        )
      ) {
        return;
      }
      player.src = embedUrl.href;
      player.title = button.dataset.videoTitle;
      player.loading = "lazy";
      player.allow = "autoplay; encrypted-media; picture-in-picture";
      player.referrerPolicy = "strict-origin-when-cross-origin";
      player.allowFullscreen = true;

      claimPlayback(media, () => media.replaceChildren(...nodes));
      media.replaceChildren(player);
    });
  });

  // ---------- Highlights: play TikTok embeds on demand ----------
  const sendTikTokPlayerCommand = (frame, type) => {
    frame.contentWindow?.postMessage(
      { "x-tiktok-player": true, type },
      "https://www.tiktok.com",
    );
  };

  const tikTokPlayTimers = new WeakMap();
  const requestTikTokPlayback = (button, frame) => {
    window.clearTimeout(tikTokPlayTimers.get(button));
    let attempts = 0;
    const sendPlay = () => {
      if (button.dataset.playRequested !== "true") return;
      sendTikTokPlayerCommand(frame, "play");
      attempts += 1;
      if (attempts < 6) {
        tikTokPlayTimers.set(button, window.setTimeout(sendPlay, 700));
      } else {
        button.dataset.playRequested = "false";
        tikTokPlayTimers.delete(button);
      }
    };
    sendPlay();
  };

  document.querySelectorAll(".card__tiktok-play").forEach((button) => {
    button.addEventListener("click", () => {
      const media = button.closest(".card__media");
      const frame = media?.querySelector("iframe");
      if (!frame) return;

      claimPlayback(media, () => {
        window.clearTimeout(tikTokPlayTimers.get(button));
        tikTokPlayTimers.delete(button);
        button.dataset.playRequested = "false";
        sendTikTokPlayerCommand(frame, "pause");
        media.classList.remove("is-playing");
        button.hidden = false;
      });

      media.classList.add("is-playing");
      button.hidden = true;
      button.dataset.playRequested = "true";
      const playerUrl = new URL(frame.src);
      playerUrl.searchParams.set("autoplay", "1");
      frame.addEventListener(
        "load",
        () => requestTikTokPlayback(button, frame),
        { once: true },
      );
      frame.src = playerUrl.href;
    });
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== "https://www.tiktok.com") return;
    const button = [...document.querySelectorAll(".card__tiktok-play")].find(
      (candidate) =>
        candidate.closest(".card__media")?.querySelector("iframe")
          ?.contentWindow === event.source,
    );
    if (!button || event.data?.["x-tiktok-player"] !== true) return;

    const frame = button.closest(".card__media")?.querySelector("iframe");
    if (!frame) return;

    if (event.data.type === "onPlayerReady") {
      button.dataset.playerReady = "true";
      if (button.dataset.playRequested === "true") {
        sendTikTokPlayerCommand(frame, "play");
      }
    } else if (event.data.type === "onStateChange") {
      const playing = event.data.value === 1;
      button.hidden = playing;
      if (playing) {
        button.dataset.playRequested = "false";
        window.clearTimeout(tikTokPlayTimers.get(button));
        tikTokPlayTimers.delete(button);
      }
    }
  });

  // ---------- Services: accordion (one open at a time) ----------
  const items = document.querySelectorAll(".accordion__item");

  items.forEach((item) => {
    const head = item.querySelector(".accordion__head");

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

  // ---------- Hero: fade out as you scroll past ----------
  const hero = document.querySelector(".hero");
  if (hero && !reduceMotion) {
    let ticking = false;
    let heroHeight = hero.offsetHeight || 1;
    let lastP = -1;

    const update = () => {
      ticking = false;
      const fadeDistance = compactLayout.matches ? 3 : 1.3;
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

  // ---------- Milestones: preview follows the cursor ----------
  document.querySelectorAll(".timeline__row").forEach((row) => {
    const preview = row.querySelector(".timeline__preview");
    if (!preview) return;

    let frame = 0;
    let clientX = 0;
    const move = () => {
      frame = 0;
      const rect = row.getBoundingClientRect();
      // Preview is anchored at 36% of the row; offset it to the cursor
      const tx = clientX - rect.left + 20 - rect.width * 0.36;
      preview.style.setProperty("--tx", `${tx.toFixed(1)}px`);
    };
    row.addEventListener(
      "mousemove",
      (e) => {
        clientX = e.clientX;
        if (!frame) frame = requestAnimationFrame(move);
      },
      { passive: true },
    );
  });
})();
