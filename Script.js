// =========================================================
      // KRISHNA ARYAL — PORTFOLIO
      // =========================================================
      (() => {
        // ---------- Footer ----------
        const year = document.getElementById("year");
        if (year) year.textContent = new Date().getFullYear();

        // ---------- Highlights: card filtering ----------
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

            if (button.dataset.provider === "kick") {
              const video = document.createElement("video");
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
                video.play().catch(() => showPlaybackError(media));
                return;
              }

              try {
                const Hls = await loadHlsLibrary();
                if (!Hls?.isSupported()) {
                  showPlaybackError(media);
                  return;
                }
                const player = new Hls();
                player.loadSource(streamUrl.href);
                player.attachMedia(video);
                video.muted = true;
                player.on(Hls.Events.MANIFEST_PARSED, () => {
                  video.play().catch(() => {
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
                    showPlaybackError(media);
                  }
                });
              } catch {
                showPlaybackError(media);
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
            player.allow =
              "autoplay; encrypted-media; picture-in-picture";
            player.referrerPolicy = "strict-origin-when-cross-origin";
            player.allowFullscreen = true;

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
              candidate
                .closest(".card__media")
                ?.querySelector("iframe")?.contentWindow === event.source,
          );
          if (!button || event.data?.["x-tiktok-player"] !== true) return;

          const frame = button
            .closest(".card__media")
            ?.querySelector("iframe");
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

        // ---------- Animations: reduced-motion preference ----------
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        // ---------- Hero: fade out as you scroll past ----------
        const hero = document.querySelector(".hero");
        if (hero && !reduceMotion) {
          let ticking = false;
          const update = () => {
            const p = Math.min(
              Math.max(window.scrollY / (hero.offsetHeight * 1.3), 0),
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

        // ---------- Sections: reveal on scroll ----------
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

        // ---------- Hero: portrait colour spotlight ----------
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
