export function initServices() {
  // ---------- Services: accordion (one open at a time) ----------
  const items = document.querySelectorAll(".accordion__item");
  const firstItem = items[0];
  const mobileLayout = window.matchMedia("(max-width: 600px)");

  items.forEach((item) => {
    const head = item.querySelector(".accordion__head");
    const body = item.querySelector(".accordion__body");
    const open = mobileLayout.matches && item === firstItem;

    item.classList.toggle("is-open", open);
    head.setAttribute("aria-expanded", String(open));
    body.hidden = !open;

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
}
