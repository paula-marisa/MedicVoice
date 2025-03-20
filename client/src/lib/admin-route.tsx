import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }
  
        // Redirecionar para a página principal se não for admin ou não estiver autenticado
        if (!user || user.role !== "admin") {
          return <Redirect to="/" />;
        }
  
        // Se for admin, renderiza o componente
        return <Component {...params} />;
      }}
    </Route>
  );
}