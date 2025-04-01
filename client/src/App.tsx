import { useEffect, useState } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import PrivacyPolicy from "@/pages/privacy-policy";
import ReportView from "@/pages/report-view";
import ReportAudit from "@/pages/report-audit";
import PatientHistory from "@/pages/patient-history";
import { setupTheme } from "@/lib/theme";
import { AuthProvider, useAuth } from "./hooks/use-auth";

import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import { Header } from "@/layout/header";

// Componente interno para as rotas que verifica se precisa redirecionar para login
function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [initialVisitChecked, setInitialVisitChecked] = useState(false);
  const [shouldForceLogin, setShouldForceLogin] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Monitorar mudanças na URL
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Adicionar listener para mudanças de URL
    window.addEventListener('popstate', handleLocationChange);
    
    // Sobrescrever o método pushState para detectar mudanças programáticas
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      // @ts-ignore
      originalPushState.apply(this, arguments);
      handleLocationChange();
    };
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  // Verificar se é a primeira visita ou se não está logado
  useEffect(() => {
    // Sempre verificamos se o usuário não está na página de autenticação
    const isAuthPage = currentPath === "/auth" || currentPath === "/login";
    
    // Se já estiver na página de autenticação, não forçamos outro redirecionamento
    if (isAuthPage) {
      setInitialVisitChecked(true);
      return;
    }
    
    // Se não estiver logado, forçamos o redirecionamento para o login
    if (!user && !isLoading) {
      setShouldForceLogin(true);
    }
    
    // Sempre limpa a variável hasVisited na inicialização para garantir login na primeira visita
    sessionStorage.removeItem('hasVisited');
    
    setInitialVisitChecked(true);
  }, [user, isLoading, currentPath]);

  // Aguardar a verificação inicial para evitar redirecionamentos indesejados
  if (!initialVisitChecked) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  // Se deve forçar o login e não estiver na página de autenticação
  if (shouldForceLogin) {
    return <Redirect to="/auth" />;
  }

  // Adiciona o cabeçalho apenas se o usuário estiver autenticado e não estiver nas páginas de autenticação
  const showHeader = user && 
                     currentPath !== "/auth" && 
                     currentPath !== "/login";

  return (
    <>
      {showHeader && <Header />}
      <Switch>
        <Route path="/auth">
          <AuthPage />
        </Route>
        <Route path="/login">
          <AuthPage />
        </Route>
        
        {/* Rota de administrador */}
        <AdminRoute path="/admin" component={AdminPage} />
        
        {/* Página inicial */}
        <Route path="/">
          {user ? (
            user.role === "admin" ? <Redirect to="/admin" /> : <Home />
          ) : (
            <Redirect to="/auth" />
          )}
        </Route>
        
        {/* Rotas protegidas comuns */}
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        
        {/* Rotas de relatórios médicos - restritas a médicos */}
        <Route path="/reports/:id">
          {!user ? (
            <Redirect to="/auth" />
          ) : user.role === "admin" || user.role === "doctor" ? (
            <ReportView />
          ) : (
            <Redirect to="/" />
          )}
        </Route>
        
        <Route path="/reports/:id/audit">
          {!user ? (
            <Redirect to="/auth" />
          ) : user.role === "admin" || user.role === "doctor" ? (
            <ReportAudit />
          ) : (
            <Redirect to="/" />
          )}
        </Route>
        
        <Route path="/reports/:id/history">
          {!user ? (
            <Redirect to="/auth" />
          ) : user.role === "admin" ? (
            <Redirect to="/admin" />
          ) : (
            <PatientHistory />
          )}
        </Route>
        
        <Route path="/privacy-policy">
          <PrivacyPolicy />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </>
  );
}

function App() {
  // Setup theme on mount
  useEffect(() => {
    setupTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
