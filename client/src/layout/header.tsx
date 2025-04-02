import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ClipboardList, User, LogOut, Settings, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Header() {
  const { user, profileImage, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useTranslation();
  
  // Obtém as iniciais do nome do usuário para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Obtém a função de navegação para redirecionamento
  const [, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    // Fechamos o menu dropdown após o clique
    setIsMenuOpen(false);
  };
  
  return (
    <header className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e nome do app */}
          <div className="flex items-center">
            <Link href={user?.role === "admin" ? "/admin" : "/"} className="flex items-center space-x-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              <span className="font-medium text-xl">{t('navigation.reports')}</span>
            </Link>
          </div>
          
          {/* Menu direito: Idioma, Tema, Avatar, Nome e Logout */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      {profileImage ? (
                        <AvatarImage src={profileImage} alt={user.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      {profileImage ? (
                        <AvatarImage src={profileImage} alt={user.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.role === "doctor" 
                          ? t('admin.users_role_doctor')
                          : user.role === "nurse" 
                          ? t('admin.users_role_nurse')
                          : t('admin.users_role_admin')}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Menu contextual: mostra ou esconde itens com base na localização atual */}
                  {location !== "/" && location !== "/reports" && user.role !== "admin" && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>{t('navigation.reports')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {location !== "/profile" && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('navigation.profile')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {location !== "/settings" && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('navigation.settings')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {user && user.role === "admin" && location !== "/admin" && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>{t('navigation.admin')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('auth.logout')}</span>
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