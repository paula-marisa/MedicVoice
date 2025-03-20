import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ClipboardList } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white dark:bg-neutral-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ClipboardList className="h-8 w-8 text-primary-500" />
          <h1 className="text-xl font-semibold">Assistente de Relatórios Médicos</h1>
        </div>
        
        <ThemeToggle />
      </div>
    </header>
  );
}
