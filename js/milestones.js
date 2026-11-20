export function initMilestones() {
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
}
