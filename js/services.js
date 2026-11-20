export function initServices() {
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
}
