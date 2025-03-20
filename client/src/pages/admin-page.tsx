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
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Esquema de validação para registro de usuários pelo admin
const registerUserSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
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
  const { user, registerMutation } = useAuth();
  const { toast } = useToast();
  const [isAddingPatients, setIsAddingPatients] = useState(false);
  const [patientCount, setPatientCount] = useState(1);

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

  // Formulário de registro de usuários
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

  // Consulta para obter a lista de usuários
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
        throw new Error("Erro ao obter lista de usuários");
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
    const patients = Array.from({ length: patientCount }).map((_, index) => ({
      processNumber: `TEST${100 + index}`,
      name: `Paciente Teste ${index + 1}`,
      age: "45",
      gender: "masculino"
    }));

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
        title: "Pacientes de teste criados",
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

  // Função para registrar um novo usuário
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
    const patientNameMatches = report.patientName ? 
      report.patientName.toLowerCase().includes(searchReport.toLowerCase()) : false;
    
    const processNumberMatches = report.processNumber ? 
      report.processNumber.toLowerCase().includes(searchReport.toLowerCase()) : false;
    
    return patientNameMatches || processNumberMatches;
  }) : [];

  // A verificação agora é feita no AdminRoute, então não precisamos fazer ela aqui

  // Verificar se usuário existe
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-medium">Carregando informações do usuário...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardList className="h-8 w-8 text-primary-500 mr-2" />
            <h1 className="text-xl font-semibold">Painel Administrativo</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
              Voltar para o sistema
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user.name}</h2>
            <p className="text-muted-foreground">
              Este é o painel administrativo do sistema de relatórios médicos. Aqui, você pode gerenciar usuários, revisar relatórios médicos e acompanhar todas as atividades do sistema.
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="register">
                <UserPlus className="h-4 w-4 mr-2" />
                Registrar Usuários
              </TabsTrigger>
              <TabsTrigger value="users">
                <User className="h-4 w-4 mr-2" />
                Gerenciar Usuários
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
                  <CardTitle>Registrar Novo Usuário</CardTitle>
                  <CardDescription>
                    Cadastre novos médicos, enfermeiros ou administradores no sistema.
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
                          : "Erro ao registrar usuário. Verifique os dados e tente novamente."}
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registrando..." : "Registrar Usuário"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Gerenciamento de Usuários */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todos os usuários cadastrados no sistema.
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
                            <TableHead>Usuário</TableHead>
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
                                  {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={userData.id === user.id} // Não pode resetar própria senha
                                    onClick={() => {
                                      // Aqui implementaríamos a função para resetar senha
                                      toast({
                                        title: "Função em desenvolvimento",
                                        description: "A funcionalidade de reset de senha será implementada em breve.",
                                        variant: "default"
                                      });
                                    }}
                                  >
                                    <Key className="h-4 w-4 mr-1" />
                                    Resetar Senha
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                Nenhum usuário encontrado.
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
                        Escolha quantos utentes de teste deseja criar. Serão gerados registros com dados simulados.
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
                          Criando utentes...
                        </span>
                      ) : (
                        "Criar Utentes de Teste"
                      )}
                    </Button>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="italic">
                        Nota: Os dados de teste são criados apenas para fins de demonstração. 
                        Cada utente será registrado com um relatório médico em rascunho.
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
                                <TableCell className="font-medium">{report.utenteName || report.patientName}</TableCell>
                                <TableCell>{report.processNumber}</TableCell>
                                <TableCell>{report.doctor?.name || "Desconhecido"}</TableCell>
                                <TableCell>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    report.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  }`}>
                                    {report.status === 'completed' ? 'Concluído' : 
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
                                      <Link to={`/reports/${report.id}/audit`}>
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
                            <TableHead>Usuário</TableHead>
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
                                  {new Date(log.createdAt).toLocaleDateString('pt-BR')} {' '}
                                  {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
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
                                <TableCell>{log.ipAddress || "-"}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      toast({
                                        title: "Detalhes do Log",
                                        description: log.details ? JSON.stringify(log.details, null, 2) : "Sem detalhes adicionais",
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