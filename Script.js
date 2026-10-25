// =========================================================
// KRISHNA ARYAL — PORTFOLIO
// =========================================================
(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const phone = window.matchMedia("(max-width: 640px)");

  // ---------- Footer ----------
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // =========================================================
  // Highlights: video player
  //  - only ONE video plays at a time (starting another stops the first)
  //  - on phones the video opens in a player BELOW the grid, and the
  //    player closes itself when the video ends
  //  - on bigger screens it plays inside the card
  // =========================================================
  const stage = document.getElementById("player-stage");
  const stageMedia = stage?.querySelector(".stage__media");
  const stageTitle = stage?.querySelector(".stage__title");
  const stageClose = stage?.querySelector(".stage__close");
  const YT_ORIGIN = "https://www.youtube-nocookie.com";
  const TT_ORIGIN = "https://www.tiktok.com";
  let active = null;

  let hlsLibrary;
  const loadHlsLibrary = () => {
    if (!hlsLibrary) {
      hlsLibrary = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.6.13/dist/hls.min.js";
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

  function showError(host, text) {
    const message = document.createElement("p");
    message.className = "card__playback-error";
    message.textContent = text;
    host.replaceChildren(message);
  }

  function stopActive({ scrollBack = false } = {}) {
    if (!active) return;
    const a = active;
    active = null;
    window.clearTimeout(a.timer);
    if (a.hls) a.hls.destroy();
    if (a.video) {
      a.video.pause();
      a.video.removeAttribute("src");
      a.video.load();
    }
    if (a.inStage) {
      stage.hidden = true;
      stage.classList.remove("is-open");
      stageMedia.replaceChildren();
    } else {
      a.host.replaceChildren(...a.originals);
    }
    a.card?.classList.remove("is-active");
    if (scrollBack && a.card) {
      a.card.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    }
  }

  async function playKick(state, button, title) {
    const fail = () =>
      active === state &&
      showError(
        state.host,
        "Unable to play this clip here. Use the Watch clip on Kick link below.",
      );

    const video = document.createElement("video");
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "none";
    video.title = title;
    video.setAttribute("aria-label", title);
    video.addEventListener("error", fail, { once: true });
    video.addEventListener("ended", () => {
      if (active === state) stopActive({ scrollBack: true });
    });
    state.video = video;
    state.host.replaceChildren(video);

    let streamUrl;
    try {
      streamUrl = new URL(button.dataset.videoUrl);
    } catch {
      return fail();
    }
    if (streamUrl.protocol !== "https:" || streamUrl.hostname !== "clips.kick.com") {
      return fail();
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl.href;
      video.play().catch(fail);
      return;
    }

    try {
      const Hls = await loadHlsLibrary();
      if (active !== state) return;
      if (!Hls?.isSupported()) return fail();
      const hls = new Hls();
      state.hls = hls;
      hls.loadSource(streamUrl.href);
      hls.attachMedia(video);
      video.muted = true;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          const hint = document.createElement("span");
          hint.className = "card__playback-hint";
          hint.setAttribute("role", "status");
          hint.textContent =
            "Press play in the controls to start the clip. Sound can be enabled there.";
          state.host.append(hint);
        });
      });
      video.addEventListener(
        "playing",
        () => state.host.querySelector(".card__playback-hint")?.remove(),
        { once: true },
      );
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) fail();
      });
    } catch {
      fail();
    }
  }

  function playEmbed(state, button, title, provider) {
    const failMsg = "Unable to play this video here. Use the link below the card.";
    let url;
    try {
      if (provider === "tiktok") {
        url = new URL(button.dataset.embedUrl);
      } else {
        url = new URL(
          `${YT_ORIGIN}/embed/${encodeURIComponent(button.dataset.videoId)}`,
        );
        url.searchParams.set("autoplay", "1");
        url.searchParams.set("playsinline", "1");
        url.searchParams.set("rel", "0");
        url.searchParams.set("enablejsapi", "1");
        if (/^https?:$/.test(window.location.protocol)) {
          url.searchParams.set("origin", window.location.origin);
        }
      }
    } catch {
      return showError(state.host, failMsg);
    }
    const allowedHost =
      provider === "tiktok" ? "www.tiktok.com" : "www.youtube-nocookie.com";
    if (url.protocol !== "https:" || url.hostname !== allowedHost) {
      return showError(state.host, failMsg);
    }

    const frame = document.createElement("iframe");
    frame.title = title;
    frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;
    state.frame = frame;

    if (provider === "tiktok") {
      // TikTok needs a few "play" nudges before it starts by itself.
      let attempts = 0;
      const nudge = () => {
        if (active !== state) return;
        frame.contentWindow?.postMessage(
          { "x-tiktok-player": true, type: "play" },
          TT_ORIGIN,
        );
        attempts += 1;
        if (attempts < 6) state.timer = window.setTimeout(nudge, 700);
      };
      frame.addEventListener("load", nudge, { once: true });
    } else {
      // Ask YouTube to tell us when the video ends.
      frame.addEventListener(
        "load",
        () => {
          const w = frame.contentWindow;
          if (!w) return;
          w.postMessage(
            JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
            YT_ORIGIN,
          );
          w.postMessage(
            JSON.stringify({
              event: "command",
              func: "addEventListener",
              args: ["onStateChange"],
              id: 1,
              channel: "widget",
            }),
            YT_ORIGIN,
          );
        },
        { once: true },
      );
    }

    frame.src = url.href;
    state.host.replaceChildren(frame);
  }

  function startPlayback(button) {
    stopActive();

    const card = button.closest(".card");
    const title = button.dataset.videoTitle || "";
    const provider = button.dataset.provider || "youtube";
    const inStage = Boolean(stage) && phone.matches;

    let host;
    let originals = [];
    if (inStage) {
      host = stageMedia;
      stage.dataset.shape = button.closest(".card__media--vertical")
        ? "vertical"
        : "wide";
      stageTitle.textContent = title;
      stage.hidden = false;
      stage.classList.remove("is-open");
      void stage.offsetWidth; // restart the open animation
      stage.classList.add("is-open");
    } else {
      host = button.closest(".card__media");
      if (!host) return;
      originals = [...host.childNodes];
    }

    const state = { host, originals, inStage, card, kind: provider };
    active = state;
    card?.classList.add("is-active");

    if (provider === "kick") playKick(state, button, title);
    else playEmbed(state, button, title, provider);

    if (inStage) {
      requestAnimationFrame(() =>
        stage.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "center",
        }),
      );
    }
  }

  document
    .querySelectorAll(".card__play")
    .forEach((button) =>
      button.addEventListener("click", () => startPlayback(button)),
    );
  stageClose?.addEventListener("click", () =>
    stopActive({ scrollBack: true }),
  );

  // Players report back here (video ended / TikTok ready).
  window.addEventListener("message", (event) => {
    const a = active;
    if (!a?.frame || event.source !== a.frame.contentWindow) return;

    if (a.kind === "tiktok") {
      const data = event.data;
      if (event.origin !== TT_ORIGIN || data?.["x-tiktok-player"] !== true) return;
      if (data.type === "onPlayerReady") {
        a.frame.contentWindow?.postMessage(
          { "x-tiktok-player": true, type: "play" },
          TT_ORIGIN,
        );
      } else if (data.type === "onStateChange") {
        if (data.value === 1) window.clearTimeout(a.timer);
        else if (data.value === 0) stopActive({ scrollBack: true });
      }
      return;
    }

    if (event.origin !== YT_ORIGIN) return;
    let data = event.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }
    const ended =
      (data?.event === "onStateChange" && data.info === 0) ||
      (data?.event === "infoDelivery" && data.info?.playerState === 0);
    if (ended) stopActive({ scrollBack: true });
  });

  // ---------- Highlights: card filtering ----------
  const tabs = document.querySelectorAll(".filters__btn");
  const cards = document.querySelectorAll(".highlight__grid .card");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const filter = tab.dataset.filter;
      stopActive();

      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", isActive);
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
    });
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

  // ---------- Sections: reveal on scroll ----------
  // Each entry is [selector, stagger in seconds, items per row].
  const reveals = [
    [".highlight .section__title", 0, 1],
    [".highlight__toolbar", 0.1, 1],
    [".highlight__grid .card", 0.1, 2],
    [".service .section__title", 0, 1],
    [".accordion__item", 0.08, 1],
    [".milestone__head", 0, 1],
    [".timeline__row", 0.08, 1],
    [".contact__card > *", 0.12, 6],
    [".contact__links li", 0.07, 6],
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

  // =========================================================
  // Hero: portrait colour spotlight
  // The colour circle is a small clipped layer that is MOVED with
  // transforms (GPU), instead of re-painting a big mask every frame.
  //  - mouse: follows the cursor on hover
  //  - touch: follows your finger, and drifts around by itself when idle
  // =========================================================
  const portrait = document.querySelector(".hero__portrait");
  const spot = portrait?.querySelector(".hero__spot");
  const spotImg = spot?.querySelector("img");

  if (portrait && spot && spotImg) {
    const touchDevice = window.matchMedia("(hover: none)").matches;
    let radius = 0;
    let pw = 0;
    let ph = 0;
    let px = 0;
    let py = 0;
    let queued = false;
    let sweeping = false;
    let rafId = 0;
    let idleTimer = 0;
    let inView = true;

    const measure = () => {
      pw = portrait.offsetWidth;
      ph = portrait.offsetHeight;
      radius = spot.offsetWidth / 2;
      spotImg.style.width = `${pw}px`;
      spotImg.style.height = `${ph}px`;
    };
    const apply = () => {
      queued = false;
      spot.style.transform = `translate3d(${px - radius}px, ${py - radius}px, 0)`;
      spotImg.style.transform = `translate3d(${radius - px}px, ${radius - py}px, 0)`;
    };
    const place = (x, y) => {
      px = x;
      py = y;
      if (!queued) {
        queued = true;
        requestAnimationFrame(apply);
      }
    };
    const placeFromEvent = (e) => {
      const r = portrait.getBoundingClientRect();
      place(e.clientX - r.left, e.clientY - r.top);
    };

    measure();
    place(pw * 0.5, ph * 0.4);
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(portrait);
    else window.addEventListener("resize", measure);

    const sweep = (t) => {
      if (!sweeping) return;
      place(
        pw * (0.5 + 0.3 * Math.sin(t / 1300)),
        ph * (0.4 + 0.22 * Math.sin(t / 1900 + 1)),
      );
      rafId = requestAnimationFrame(sweep);
    };
    const startSweep = () => {
      if (!touchDevice || reduceMotion || sweeping || !inView) return;
      sweeping = true;
      portrait.classList.add("is-hover");
      rafId = requestAnimationFrame(sweep);
    };
    const stopSweep = () => {
      sweeping = false;
      cancelAnimationFrame(rafId);
    };

    portrait.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") portrait.classList.add("is-hover");
    });
    portrait.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") portrait.classList.remove("is-hover");
    });
    portrait.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      stopSweep();
      window.clearTimeout(idleTimer);
      portrait.classList.add("is-hover");
      placeFromEvent(e);
    });
    portrait.addEventListener("pointermove", (e) => {
      if (sweeping && e.pointerType !== "mouse") return;
      placeFromEvent(e);
    });
    const release = (e) => {
      if (e.pointerType === "mouse") return;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(startSweep, 2500);
    };
    portrait.addEventListener("pointerup", release);
    portrait.addEventListener("pointercancel", release);

    if (touchDevice && "IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) startSweep();
        else {
          stopSweep();
          portrait.classList.remove("is-hover");
        }
      }).observe(portrait);
    } else {
      startSweep();
    }
  }

  // ---------- Milestones: preview follows the cursor ----------
  document.querySelectorAll(".timeline__row").forEach((row) => {
    const preview = row.querySelector(".timeline__preview");
    if (!preview) return;
    let queued = false;
    let x = 0;

    row.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX - row.getBoundingClientRect().left + 20;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        preview.style.setProperty("--px", `${x}px`);
      });
    });
  });
})();
