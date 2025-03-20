type Theme = "dark" | "light" | "system";

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getTheme(): Theme {
  const theme = localStorage.getItem("theme") as Theme | null;
  if (theme === "dark" || theme === "light") return theme;
  return "system";
}

export function getResolvedTheme(): "dark" | "light" {
  const theme = getTheme();
  return theme === "system" ? getSystemTheme() : theme;
}

export function setTheme(theme: Theme) {
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  
  // Update DOM
  if (resolvedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  
  // Save preference
  localStorage.setItem("theme", theme);
}

export function setupTheme() {
  const theme = getTheme();
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  
  // Update DOM
  if (resolvedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // Listen for system theme changes
  if (theme === "system") {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (getTheme() !== "system") return;
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    });
  }
}
