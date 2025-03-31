import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, User, Lock } from "lucide-react";
import { Footer } from "@/layout/footer";

// Esquema de validação de login
const loginSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [showRegister, setShowRegister] = useState<boolean>(true);
  const { user, isLoading, loginMutation } = useAuth();
  
  // Verificar se existem usuários no sistema
  useEffect(() => {
    // Consultar a API para ver se já existem usuários
    fetch("/api/check-users")
      .then(res => res.json())
      .then(data => {
        console.log("Verificação de usuários:", data);
        // Se já existem usuários, esconder o registro
        if (data.hasUsers) {
          setShowRegister(false);
        }
      })
      .catch(err => {
        console.error("Erro ao verificar usuários:", err);
        // Por segurança, se houver erro, esconder o registro
        setShowRegister(false);
      });
  }, []);
  
  // Formulário de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  // Função para submeter login
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  // Se estiver autenticado, redirecionar para a página apropriada com base no papel do usuário
  if (!isLoading && user) {
    // Se for admin, redireciona para o painel administrativo
    if (user.role === "admin") {
      return <Redirect to="/admin" />;
    }
    // Outros usuários vão para a página inicial
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-neutral-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <ClipboardList className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-xl font-semibold">Assistente de Relatórios Médicos</h1>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Para efetuar o login é necessário introduzir as credencias fornecidas, caso não tenha é necessário solicitar as mesmas {" "}
                <button 
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    alert("Por favor, contacte o administrador do sistema para obter credenciais de acesso.");
                  }}
                >
                  clicando aqui
                </button>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                    <Input 
                      id="username" 
                      className="pl-10"
                      {...loginForm.register("username")} 
                      placeholder="Seu nome de usuário" 
                    />
                  </div>
                  {loginForm.formState.errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                    <Input 
                      id="password" 
                      type="password" 
                      className="pl-10"
                      {...loginForm.register("password")} 
                      placeholder="Sua senha" 
                    />
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                {loginMutation.isError && (
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded">
                    {loginMutation.error instanceof Error 
                      ? loginMutation.error.message 
                      : "Erro ao fazer login. Verifique suas credenciais."}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
            {showRegister && (
              <CardFooter className="flex justify-center text-sm text-muted-foreground">
                Não tem uma conta? 
                <button 
                  type="button" 
                  className="ml-1 text-primary hover:underline"
                  onClick={() => {
                    alert("Contate um administrador para criar uma nova conta");
                  }}
                >
                  Registre-se
                </button>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}