export function initFooter() {
  // ---------- Footer ----------
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}
