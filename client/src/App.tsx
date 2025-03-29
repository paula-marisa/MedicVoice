import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page-simple";
import PrivacyPolicy from "@/pages/privacy-policy";
import { setupTheme } from "@/lib/theme";
import { AuthProvider } from "./hooks/use-auth";

import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import { Header } from "@/layout/header";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <AdminRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
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
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
