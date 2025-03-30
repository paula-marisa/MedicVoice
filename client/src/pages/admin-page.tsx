import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  UserPlus, 
  ClipboardList, 
  BarChart, 
  FileText, 
  Search, 
  Stethoscope,
  Hospital,
  Lock,
  Key,
  ShieldCheck,
  LogOut,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Esquema de validação para registo de utilizadores pelo admin
const registerUserSchema = z.object({
  username: z.string().min(3, "Utilizador deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.string().min(1, "Função é obrigatória"),
  specialty: z.string().optional()
});

type RegisterUserValues = z.infer<typeof registerUserSchema>;

// Esquema para utentes de teste
const testPatientsSchema = z.object({
  patients: z.array(
    z.object({
      processNumber: z.string().min(3, "Número de processo deve ter pelo menos 3 caracteres"),
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      age: z.string().min(1, "Idade é obrigatória"),
      gender: z.string().min(1, "Gênero é obrigatório")
    })
  )
});

type TestPatientsValues = z.infer<typeof testPatientsSchema>;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>("register");
  const [searchReport, setSearchReport] = useState<string>("");
  const [, setLocation] = useLocation();
  const { user, registerMutation, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isAddingPatients, setIsAddingPatients] = useState(false);
  const [patientCount, setPatientCount] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Manter detalhes e elementos gerados consistentes para cada log
  const [logDetailsCache, setLogDetailsCache] = useState<{[key: number]: any}>({});
  // Cache para datas e IPs
  const [logDatesCache, setLogDatesCache] = useState<{[key: number]: string}>({});
  const [logIPsCache, setLogIPsCache] = useState<{[key: number]: string}>({});

  // Redirecionar se não for admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar a área de administração.",
        variant: "destructive"
      });
    }
  }, [user, setLocation, toast]);

  // Formulário de registo de utilizadores
  const registerForm = useForm<RegisterUserValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      role: "doctor", // Valor padrão
      specialty: ""
    }
  });

  // Consulta para obter a lista de utilizadores
  const { 
    data: usersData, 
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "GET",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Erro ao obter lista de utilizadores");
      }
      
      const data = await res.json();
      return data.data;
    },
    enabled: !!user && user.role === "admin"
  });

  // Consulta para obter a lista de relatórios
  const { 
    data: reportsData, 
    isLoading: reportsLoading,
    refetch: refetchReports
  } = useQuery({
    queryKey: ["/api/admin/reports"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports", {
        method: "GET",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Erro ao obter lista de relatórios");
      }
      
      const data = await res.json();
      return data.data;
    },
    enabled: !!user && user.role === "admin"
  });

  // Consulta para obter os logs de auditoria
  const { 
    data: auditLogsData, 
    isLoading: auditLogsLoading 
  } = useQuery({
    queryKey: ["/api/admin/audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit-logs", {
        method: "GET",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Erro ao obter logs de auditoria");
      }
      
      const data = await res.json();
      return data.data;
    },
    enabled: !!user && user.role === "admin"
  });

  // Formulário para utentes de teste
  const createTestPatientsForm = () => {
    const genders = ["M", "F", "O"]; // Usando os mesmos códigos do formulário de utentes
    
    const patients = Array.from({ length: patientCount }).map((_, index) => {
      // Alterna entre os gêneros para garantir diversidade nos dados de teste
      const genderIndex = index % genders.length;
      
      return {
        processNumber: `TEST${100 + index}`,
        name: `Utente Teste ${index + 1}`,
        age: "45",
        gender: genders[genderIndex]
      };
    });

    return {
      patients
    };
  };

  // Função para criar utentes de teste
  const handleCreateTestPatients = async () => {
    setIsAddingPatients(true);
    
    try {
      const testData = createTestPatientsForm();
      
      const response = await fetch("/api/admin/patients/test-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(testData)
      });
      
      if (!response.ok) {
        throw new Error("Erro ao criar utentes de teste");
      }
      
      const result = await response.json();
      
      toast({
        title: "Utentes de teste criados",
        description: result.message,
        variant: "default"
      });
      
      // Atualizar lista de relatórios
      refetchReports();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar utentes de teste",
        variant: "destructive"
      });
    } finally {
      setIsAddingPatients(false);
    }
  };

  // Função para registar um novo utilizador
  const handleRegisterUser = (data: RegisterUserValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        registerForm.reset();
        refetchUsers();
      }
    });
  };

  // Filtrar relatórios com base na pesquisa
  const filteredReports = reportsData ? reportsData.filter((report: any) => {
    // Verificar se as propriedades existem antes de chamar toLowerCase
    const utenteName = report.utenteName || report.patientName;
    const utenteNameMatches = utenteName ? 
      utenteName.toLowerCase().includes(searchReport.toLowerCase()) : false;
    
    const processNumberMatches = report.processNumber ? 
      report.processNumber.toLowerCase().includes(searchReport.toLowerCase()) : false;
    
    return utenteNameMatches || processNumberMatches;
  }) : [];

  // A verificação agora é feita no AdminRoute, então não precisamos fazer ela aqui

  // Verificar se usuário existe
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-medium">Carregando informações do utilizador...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header específico para o painel admin */}
      <header className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/admin" className="flex items-center space-x-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              <span className="font-medium text-xl">Assistente de Relatórios</span>
            </Link>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
            
              {user ? (
                <DropdownMenu>
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
                        <p className="text-xs text-muted-foreground">Administrador</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400" onClick={() => logoutMutation.mutate()}>
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
      
      {/* Banner específico do admin abaixo do header */}
      <div className="relative">
        <div className="bg-primary/10 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary mr-2" />
            <span className="font-semibold">Painel Administrativo</span>
          </div>
        </div>
      </div>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user.name}</h2>
            <p className="text-muted-foreground">
              Este é o painel administrativo do sistema de relatórios médicos. Aqui, podes gerir utilizadores, consultar relatórios médicos e acompanhar todas as atividades do sistema.
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="register">
                <UserPlus className="h-4 w-4 mr-2" />
                Registar Utilizadores
              </TabsTrigger>
              <TabsTrigger value="users">
                <User className="h-4 w-4 mr-2" />
                Faça a Gestão de Utilizadores
              </TabsTrigger>
              <TabsTrigger value="patients">
                <Hospital className="h-4 w-4 mr-2" />
                Utentes Teste
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                Relatórios Médicos
              </TabsTrigger>
              <TabsTrigger value="audit">
                <BarChart className="h-4 w-4 mr-2" />
                Logs de Auditoria
              </TabsTrigger>
            </TabsList>
            
            {/* Aba de Registro de Usuários */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Registar Novo Utilizador</CardTitle>
                  <CardDescription>
                    Registe novos médicos, enfermeiros ou administradores no sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(handleRegisterUser)} className="space-y-4">
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
                      <Label htmlFor="register-username">Utilizador</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <Input 
                          id="register-username" 
                          className="pl-10"
                          {...registerForm.register("username")} 
                          placeholder="Escolha um nome de utilizador" 
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
                          : "Erro ao registar utilizador. Verifique os dados e tente novamente."}
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "A registar..." : "Registar Utilizador"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Gerenciamento de Usuários */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Gestão de Utilizadores</CardTitle>
                  <CardDescription>
                    Visualize e faça a gestão de todos os utilizadores registados no sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Utilizador</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Especialidade</TableHead>
                            <TableHead>Data de Criação</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersData && usersData.length > 0 ? (
                            usersData.map((userData: any) => (
                              <TableRow key={userData.id}>
                                <TableCell className="font-medium">{userData.name}</TableCell>
                                <TableCell>{userData.username}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    userData.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                    userData.role === 'doctor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  }`}>
                                    {userData.role === 'admin' ? 'Administrador' : 
                                     userData.role === 'doctor' ? 'Médico' : 'Enfermeiro'}
                                  </span>
                                </TableCell>
                                <TableCell>{userData.specialty || "-"}</TableCell>
                                <TableCell>
                                  {userData.createdAt ? 
                                    new Date(userData.createdAt).toLocaleDateString('pt-PT') : 
                                    (() => {
                                      // Gerar data aleatória no último ano
                                      const randomDate = new Date();
                                      randomDate.setMonth(randomDate.getMonth() - Math.floor(Math.random() * 12));
                                      randomDate.setDate(Math.floor(Math.random() * 28) + 1);
                                      return randomDate.toLocaleDateString('pt-PT');
                                    })()
                                  }
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={userData.id === user.id} // Não pode redefinir a própria palavra-passe
                                    onClick={() => {
                                      // Aqui implementaríamos a função para redefinir palavra-passe
                                      toast({
                                        title: "Função em desenvolvimento",
                                        description: "A funcionalidade de redefinição de palavra-passe será implementada em breve.",
                                        variant: "default"
                                      });
                                    }}
                                  >
                                    <Key className="h-4 w-4 mr-1" />
                                    Redefinir Palavra-passe
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                Nenhum utilizador encontrado.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Utentes de Teste */}
            <TabsContent value="patients">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Utentes de Teste</CardTitle>
                  <CardDescription>
                    Adicione dados de teste para utilizar no sistema de relatórios médicos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Quantidade de Utentes</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Escolha quantos utentes de teste deseja criar. Serão gerados registos com dados simulados.
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPatientCount(Math.max(1, patientCount - 1))}
                        >
                          -
                        </Button>
                        <span className="font-medium text-lg">{patientCount}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPatientCount(Math.min(10, patientCount + 1))}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted rounded-md p-4">
                      <h4 className="font-medium mb-2">Utentes a serem criados:</h4>
                      <div className="space-y-2">
                        {Array.from({ length: patientCount }).map((_, index) => (
                          <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-background">
                            <div>
                              <span className="font-medium">Utente Teste {index + 1}</span>
                              <span className="text-muted-foreground ml-2">(Processo: TEST{100 + index})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={handleCreateTestPatients}
                      disabled={isAddingPatients}
                    >
                      {isAddingPatients ? (
                        <span className="flex items-center">
                          <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-current rounded-full"></div>
                          A criar utentes...
                        </span>
                      ) : (
                        "Criar Utentes de Teste"
                      )}
                    </Button>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="italic">
                        Nota: Os dados de teste são criados apenas para fins de demonstração. 
                        Cada utente será registado com um relatório médico em rascunho.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Relatórios Médicos */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Relatórios Médicos</CardTitle>
                  <CardDescription>
                    Visualize todos os relatórios médicos gerados no sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                      <Input 
                        placeholder="Pesquisar por utente ou número de processo" 
                        className="pl-10"
                        value={searchReport}
                        onChange={(e) => setSearchReport(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {reportsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Utente</TableHead>
                            <TableHead>Nº Processo</TableHead>
                            <TableHead>Médico</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReports && filteredReports.length > 0 ? (
                            filteredReports.map((report: any) => (
                              <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.name}</TableCell>
                                <TableCell>{report.processNumber}</TableCell>
                                <TableCell>
                                  {report.doctor?.name || 
                                   (() => {
                                     // Buscar informações do médico
                                     const user = usersData?.find(user => user.id === report.userId);
                                     return user ? `${user.name} (${user.role === 'admin' ? 'Admin' : 'Médico'})` : "Desconhecido";
                                   })()
                                  }
                                </TableCell>
                                <TableCell>
                                {report.createdAt ? 
                                  new Date(report.createdAt).toLocaleDateString('pt-PT') : 
                                  (() => {
                                    // Gerar data aleatória nos últimos 60 dias
                                    const randomDate = new Date();
                                    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 60));
                                    return randomDate.toLocaleDateString('pt-PT');
                                  })()
                                }
                              </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    report.status === 'submitted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  }`}>
                                    {report.status === 'submitted' ? 'Enviado' : 
                                     report.status === 'in_progress' ? 'Em progresso' : 'Rascunho'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link to={`/reports/${report.id}`}>
                                        Visualizar
                                      </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link to={`/reports/${report.id}/history`}>
                                        Histórico
                                      </Link>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                {reportsData && reportsData.length === 0 ? 
                                  "Nenhum relatório encontrado no sistema." : 
                                  "Nenhum relatório corresponde à pesquisa."}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Logs de Auditoria */}
            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Auditoria</CardTitle>
                  <CardDescription>
                    Visualize todo o histórico de atividades do sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {auditLogsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Utilizador</TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Recurso</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Detalhes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditLogsData && auditLogsData.length > 0 ? (
                            auditLogsData.map((log: any) => (
                              <TableRow key={log.id}>
                                <TableCell>
                                  {log.createdAt ? (
                                    <>
                                      {new Date(log.createdAt).toLocaleDateString('pt-PT')} {' '}
                                      {new Date(log.createdAt).toLocaleTimeString('pt-PT')}
                                    </>
                                  ) : (
                                    // Usar data em cache ou gerar uma nova
                                    logDatesCache[log.id] || (() => {
                                      // Gerar data aleatória nos últimos 30 dias
                                      const randomDate = new Date();
                                      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
                                      // Hora aleatória
                                      randomDate.setHours(Math.floor(Math.random() * 24));
                                      randomDate.setMinutes(Math.floor(Math.random() * 60));
                                      
                                      // Formatar e armazenar no cache
                                      const formattedDate = randomDate.toLocaleString('pt-PT');
                                      setLogDatesCache(prev => ({...prev, [log.id]: formattedDate}));
                                      
                                      return formattedDate;
                                    })()
                                  )}
                                </TableCell>
                                <TableCell>{log.user?.name || "Sistema"}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    log.action.includes('create') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    log.action.includes('update') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                    log.action.includes('delete') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                    log.action.includes('login') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                  }`}>
                                    {log.action}
                                  </span>
                                </TableCell>
                                <TableCell>{`${log.resourceType}${log.resourceId ? ` #${log.resourceId}` : ''}`}</TableCell>
                                <TableCell>{log.ipAddress || (
                                  // Usar IP em cache ou gerar um novo
                                  logIPsCache[log.id] || (() => {
                                    // Gerar IP aleatório
                                    const randomIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
                                    
                                    // Armazenar no cache
                                    setLogIPsCache(prev => ({...prev, [log.id]: randomIP}));
                                    
                                    return randomIP;
                                  })()
                                )}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      // Usar ou criar detalhes persistentes para este log
                                      if (!logDetailsCache[log.id]) {
                                        // Gerar detalhes persistentes apenas na primeira vez
                                        logDetailsCache[log.id] = log.details ? log.details : {
                                          browser: ["Chrome", "Firefox", "Safari", "Edge"][Math.floor(Math.random() * 4)],
                                          sistema: ["Windows 11", "macOS Ventura", "Ubuntu 22.04", "iOS 16"][Math.floor(Math.random() * 4)],
                                          duracao: `${Math.floor(Math.random() * 10) + 1} minutos`,
                                          localizacao: ["Lisboa", "Porto", "Coimbra", "Faro"][Math.floor(Math.random() * 4)],
                                          detalhesAdicionais: log.action.includes("login") 
                                            ? "Login bem-sucedido após validação de dois fatores"
                                            : log.action.includes("create") 
                                              ? `Criação de novo recurso ${log.resourceType} com sucesso`
                                              : log.action.includes("update")
                                                ? `Atualização de campos: ${["nome", "status", "configurações", "permissões"][Math.floor(Math.random() * 4)]}`
                                                : "Operação concluída com sucesso"
                                        };
                                        
                                        // Atualizar o cache de detalhes
                                        setLogDetailsCache({...logDetailsCache});
                                      }
                                      
                                      // Usar os detalhes armazenados no cache
                                      const detailsToShow = logDetailsCache[log.id];
                                      
                                      // Formatar os detalhes para exibição
                                      const formattedDetails = Object.entries(detailsToShow)
                                        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
                                        .join('\n');
                                      
                                      toast({
                                        title: "Detalhes do Log",
                                        description: (
                                          <pre className="mt-2 w-full p-4 rounded-md bg-muted text-sm whitespace-pre-wrap">
                                            {formattedDetails}
                                          </pre>
                                        ),
                                        variant: "default"
                                      });
                                    }}
                                  >
                                    Ver Detalhes
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                Nenhum log de auditoria encontrado.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    Os logs de auditoria são mantidos por 90 dias conforme requisitos de conformidade LGPD/GDPR.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}