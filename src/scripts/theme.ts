const STORAGE_KEY = "portfolio-theme";
const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");

function storedTheme() {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function applyTheme(theme: string) {
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = theme;
  }

  document.querySelectorAll<HTMLButtonElement>("[data-theme-option]").forEach((button) => {
    const isActive = button.dataset.themeOption === theme;
    button.setAttribute("aria-pressed", String(isActive));
  });
}

applyTheme(storedTheme());

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-theme-option]") : null;
  if (!target?.dataset.themeOption) return;
  localStorage.setItem(STORAGE_KEY, target.dataset.themeOption);
  applyTheme(target.dataset.themeOption);
});

media.addEventListener("change", () => {
  if (storedTheme() === "system") applyTheme("system");
});

