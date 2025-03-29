import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ClipboardList, User, LogOut, Settings, ShieldCheck } from "lucide-react";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Obtém as iniciais do nome do usuário para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e nome do app */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              <span className="font-medium text-xl">Assistente de Relatórios</span>
            </Link>
          </div>
          
          {/* Menu direito: Avatar, Nome e Logout */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.role === "doctor" 
                          ? "Médico" 
                          : user.role === "nurse" 
                          ? "Enfermeiro" 
                          : "Administrador"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  
                  {user && user.role === "admin" && window.location.pathname !== "/admin" && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Painel Administrativo</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}