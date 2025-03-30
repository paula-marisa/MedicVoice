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
import SettingsPage from "@/pages/settings-page";
import PrivacyPolicy from "@/pages/privacy-policy";
import ReportView from "@/pages/report-view";
import ReportAudit from "@/pages/report-audit";
import PatientHistory from "@/pages/patient-history";
import { setupTheme } from "@/lib/theme";
import { AuthProvider } from "./hooks/use-auth";

import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import { Header } from "@/layout/header";

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/login">
        <AuthPage />
      </Route>
      <ProtectedRoute path="/" component={Home} />
      <AdminRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/reports/:id" component={ReportView} />
      <ProtectedRoute path="/reports/:id/audit" component={ReportAudit} />
      <ProtectedRoute path="/reports/:id/history" component={PatientHistory} />
      <Route path="/privacy-policy">
        <PrivacyPolicy />
      </Route>
      <Route>
        <NotFound />
      </Route>
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
