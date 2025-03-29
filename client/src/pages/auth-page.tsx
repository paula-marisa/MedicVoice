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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Stethoscope, User, Lock, Hospital } from "lucide-react";
import { Footer } from "@/layout/footer";

// Esquema de validação de login
const loginSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

// Esquema de validação de registro
const registerSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.string().min(1, "Função é obrigatória"),
  specialty: z.string().optional()
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showRegister, setShowRegister] = useState<boolean>(true);
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
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
  
  // Formulário de registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      role: "doctor", // Valor padrão
      specialty: ""
    }
  });
  
  // Função para submeter login
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  // Função para submeter registro
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
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
      <header className="bg-white dark:bg-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <ClipboardList className="h-8 w-8 text-primary-500 mr-2" />
          <h1 className="text-xl font-semibold">Assistente de Relatórios Médicos</h1>
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Formulário */}
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${showRegister ? 'grid-cols-2' : 'grid-cols-1'} mb-8`}>
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  {showRegister && (
                    <TabsTrigger value="register">Registrar</TabsTrigger>
                  )}
                </TabsList>
                
                {/* Tab de Login */}
                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle>Acesso do Profissional</CardTitle>
                      <CardDescription>
                        Faça login com suas credenciais para acessar o sistema.
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
                          onClick={() => setActiveTab("register")}
                        >
                          Registre-se
                        </button>
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>
                
                {/* Tab de Registro - só mostrar se permitido */}
                {showRegister && (
                  <TabsContent value="register">
                    <Card>
                      <CardHeader>
                        <CardTitle>Cadastro de Profissional</CardTitle>
                        <CardDescription>
                          Crie uma conta para acessar o sistema de relatórios médicos.
                        </CardDescription>
                      </CardHeader>
                    <CardContent>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-name">Nome Completo</Label>
                          <Input 
                            id="register-name" 
                            {...registerForm.register("name")} 
                            placeholder="Dr. João Silva" 
                          />
                          {registerForm.formState.errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {registerForm.formState.errors.name.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="register-username">Usuário</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                            <Input 
                              id="register-username" 
                              className="pl-10"
                              {...registerForm.register("username")} 
                              placeholder="Escolha um nome de usuário" 
                            />
                          </div>
                          {registerForm.formState.errors.username && (
                            <p className="text-red-500 text-sm mt-1">
                              {registerForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Senha</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                            <Input 
                              id="register-password" 
                              type="password" 
                              className="pl-10"
                              {...registerForm.register("password")} 
                              placeholder="Crie uma senha segura" 
                            />
                          </div>
                          {registerForm.formState.errors.password && (
                            <p className="text-red-500 text-sm mt-1">
                              {registerForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="register-role">Função</Label>
                          <div className="relative">
                            <Hospital className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                            <select 
                              id="register-role" 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...registerForm.register("role")}
                            >
                              <option value="doctor">Médico</option>
                              <option value="nurse">Enfermeiro</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </div>
                          {registerForm.formState.errors.role && (
                            <p className="text-red-500 text-sm mt-1">
                              {registerForm.formState.errors.role.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="register-specialty">Especialidade</Label>
                          <div className="relative">
                            <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                            <Input 
                              id="register-specialty" 
                              className="pl-10"
                              {...registerForm.register("specialty")} 
                              placeholder="Ex: Cardiologia, Pediatria" 
                            />
                          </div>
                          {registerForm.formState.errors.specialty && (
                            <p className="text-red-500 text-sm mt-1">
                              {registerForm.formState.errors.specialty.message}
                            </p>
                          )}
                        </div>
                        
                        {registerMutation.isError && (
                          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded">
                            {registerMutation.error instanceof Error 
                              ? registerMutation.error.message 
                              : "Erro ao registrar. Tente novamente com dados diferentes."}
                          </div>
                        )}
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Registrando..." : "Registrar"}
                        </Button>
                      </form>
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm text-muted-foreground">
                      Já tem uma conta? 
                      <button 
                        type="button" 
                        className="ml-1 text-primary hover:underline"
                        onClick={() => setActiveTab("login")}
                      >
                        Entrar
                      </button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                )}
              </Tabs>
            </div>
            
            {/* Hero Section */}
            <div className="hidden lg:block">
              <div className="bg-primary-50 dark:bg-primary-900/20 p-8 rounded-lg">
                <div className="flex justify-center mb-6">
                  <ClipboardList className="h-16 w-16 text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold text-center mb-4">
                  Assistente de Relatórios Médicos
                </h2>
                <p className="text-center mb-6">
                  Plataforma para criação e gestão de relatórios médicos com reconhecimento de voz em português.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-primary-100 dark:bg-primary-800/50 p-2 rounded-full mr-3">
                      <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Reconhecimento de voz avançado</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ditado de relatórios com tecnologia de reconhecimento de voz em português.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary-100 dark:bg-primary-800/50 p-2 rounded-full mr-3">
                      <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Integração com SClínico</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Exportação de relatórios diretamente para o sistema SClínico dos hospitais portugueses.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary-100 dark:bg-primary-800/50 p-2 rounded-full mr-3">
                      <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Rastreabilidade completa</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Registro detalhado de todas as alterações e comunicações realizadas.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary-100 dark:bg-primary-800/50 p-2 rounded-full mr-3">
                      <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Segurança e Conformidade LGPD/GDPR</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Processamento de dados em conformidade com as leis de proteção de dados.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}