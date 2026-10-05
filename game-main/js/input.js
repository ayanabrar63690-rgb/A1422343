export const keys = new Set();

const alias = (k) => k.toLowerCase();

export function initInput() {
  window.addEventListener("keydown", (e) => {
    const tag = (e.target || document.activeElement || {}).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return; // typing in a form field
    if (["ArrowLeft", "ArrowRight", " ", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
    keys.add(alias(e.key));
  });
  window.addEventListener("keyup", (e) => {
    const tag = (e.target || document.activeElement || {}).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    keys.delete(alias(e.key));
  });
  window.addEventListener("blur", () => keys.clear());
}

export function pressed(...names) {
  return names.some((n) => keys.has(n));
}

