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
import { ClipboardList, User, Lock, AlertTriangle, Globe } from "lucide-react";
import { Footer } from "@/layout/footer";
import { RequestAccessDialog } from "@/components/request-access-dialog";
import { PasswordRecoveryDialog } from "@/components/password-recovery-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";

// Esquema de validação de login
const loginSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [showRegister, setShowRegister] = useState<boolean>(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState<boolean>(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const { user, isLoading, loginMutation } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  
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
  
  // Reset das tentativas falhas após um período (5 minutos)
  useEffect(() => {
    if (failedAttempts > 0) {
      const timer = setTimeout(() => {
        setFailedAttempts(0);
      }, 5 * 60 * 1000); // 5 minutos
      
      return () => clearTimeout(timer);
    }
  }, [failedAttempts]);
  
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
    loginMutation.mutate(data, {
      onError: () => {
        // Incrementa contagem de tentativas falhas
        const newCount = failedAttempts + 1;
        setFailedAttempts(newCount);
        
        // Após 3 tentativas, sugere recuperação de senha
        if (newCount >= 3) {
          toast({
            title: "Várias tentativas falhas de login",
            description: "Esqueceu sua senha? Você pode recuperá-la através do link abaixo.",
            variant: "destructive",
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRecoveryDialogOpen(true)}
                className="mt-2 w-full"
              >
                Recuperar senha
              </Button>
            ),
          });
        }
      }
    });
  };
  
  // Se estiver autenticado, redirecionar para a página apropriada com base no papel do usuário
  if (!isLoading && user) {
    // Reset das tentativas falhas após login bem-sucedido
    if (failedAttempts > 0) {
      setFailedAttempts(0);
    }
    
    // Se for admin, redireciona para o painel de administrador
    if (user.role === "admin") {
      return <Redirect to="/admin" />;
    }
    // Outros usuários vão para a página inicial
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-neutral-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardList className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-xl font-semibold">{t('app.title')}</h1>
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'pt' ? 'PT' : 'EN'}</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t('auth.login')}</CardTitle>
              <CardDescription>
                {t('auth.login_description')}{" "}
                <button 
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setRequestDialogOpen(true)}
                >
                  {t('auth.click_here')}
                </button>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('auth.username')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                    <Input 
                      id="username" 
                      className="pl-10"
                      {...loginForm.register("username")} 
                      placeholder={t('auth.username')} 
                    />
                  </div>
                  {loginForm.formState.errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                    <Input 
                      id="password" 
                      type="password" 
                      className="pl-10"
                      {...loginForm.register("password")} 
                      placeholder={t('auth.password')} 
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
                
                {failedAttempts >= 3 && (
                  <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-3 rounded flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Muitas tentativas malsucedidas</p>
                      <p className="text-sm">
                        Esqueceu sua senha? 
                        <button 
                          type="button"
                          className="ml-1 text-primary hover:underline"
                          onClick={() => setRecoveryDialogOpen(true)}
                        >
                          Clique aqui para recuperá-la
                        </button>.
                      </p>
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? t('messages.loading') : t('auth.login')}
                </Button>
              </form>
            </CardContent>
            {showRegister && (
              <CardFooter className="flex justify-center text-sm text-muted-foreground">
                {t('auth.not_registered')}
                <button 
                  type="button" 
                  className="ml-1 text-primary hover:underline"
                  onClick={() => {
                    // Informar o usuário que é necessário fazer login como administrador
                    toast({
                      title: t('admin.register_users'),
                      description: t('admin.register_users_description'),
                      variant: "default",
                    });
                  }}
                >
                  {t('auth.register')}
                </button>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
      
      <Footer />
      
      {/* Diálogos */}
      <RequestAccessDialog 
        open={requestDialogOpen} 
        onOpenChange={setRequestDialogOpen} 
      />
      
      <PasswordRecoveryDialog
        open={recoveryDialogOpen}
        onOpenChange={setRecoveryDialogOpen}
      />
    </div>
  );
}