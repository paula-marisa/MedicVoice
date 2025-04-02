import { useState, useEffect } from "react";
import { getResolvedTheme, getTheme, setTheme } from "@/lib/theme";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslate } from "@/hooks/use-language";

export function ThemeToggle() {
  const { t } = useTranslate();
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");
  
  useEffect(() => {
    setResolvedTheme(getResolvedTheme());
    
    // Setup listener for theme changes
    const checkTheme = () => {
      setResolvedTheme(getResolvedTheme());
    };
    
    window.addEventListener("storage", checkTheme);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", checkTheme);
    
    return () => {
      window.removeEventListener("storage", checkTheme);
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", checkTheme);
    };
  }, []);
  
  const toggleTheme = () => {
    const theme = getTheme();
    const newTheme = theme === "light" || (theme === "system" && resolvedTheme === "light") ? "dark" : "light";
    setTheme(newTheme);
    setResolvedTheme(newTheme);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="theme-toggle" className="text-sm text-neutral-600 dark:text-neutral-400">
        {resolvedTheme === "dark" ? t('settings.dark', 'Modo Escuro') : t('settings.light', 'Modo Claro')}
      </Label>
      <Switch
        id="theme-toggle"
        checked={resolvedTheme === "dark"}
        onCheckedChange={toggleTheme}
      />
    </div>
  );
}
