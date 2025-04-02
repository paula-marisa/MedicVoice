import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  Settings,
  RefreshCw
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
  const { user, profileImage, registerMutation, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isAddingPatients, setIsAddingPatients] = useState(false);
  const [patientCount, setPatientCount] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Manter detalhes e elementos gerados consistentes para cada log
  const [logDetailsCache, setLogDetailsCache] = useState<{[key: number]: any}>({});
  // Cache para datas e IPs
  const [logDatesCache, setLogDatesCache] = useState<{[key: number]: string}>({});
  const [logIPsCache, setLogIPsCache] = useState<{[key: number]: string}>({});
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
  
  // Consulta para obter as solicitações de acesso pendentes
  const { 
    data: accessRequestsData, 
    isLoading: accessRequestsLoading,
    refetch: refetchAccessRequests 
  } = useQuery({
    queryKey: ["/api/access-requests/pending"],
    queryFn: async () => {
      const res = await fetch("/api/access-requests/pending", {
        method: "GET",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Erro ao obter solicitações de acesso pendentes");
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

  // Função para aprovar uma solicitação de acesso
  const handleApproveAccessRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          action: "approve",
          comments: "Aprovado pelo administrador."
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao aprovar solicitação de acesso");
      }

      const result = await response.json();

      // Extrair a senha temporária para mostrar ao administrador
      const temporaryPassword = result.data?.temporaryPassword;

      // Mostrar notificação de sucesso com a senha
      toast({
        title: "Solicitação aprovada",
        description: `O utilizador foi aprovado e pode agora aceder ao sistema. ${temporaryPassword ? `Senha temporária: ${temporaryPassword}` : ''}`,
        variant: "default",
        duration: 10000 // Deixar a notificação por mais tempo para o admin ver a senha
      });

      // Atualizar lista de solicitações pendentes
      refetchAccessRequests();
      // Atualizar lista de utilizadores
      refetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao aprovar solicitação de acesso",
        variant: "destructive"
      });
    }
  };

  // Função para rejeitar uma solicitação de acesso
  const handleRejectAccessRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          action: "reject",
          comments: "Rejeitado pelo administrador."
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao rejeitar solicitação de acesso");
      }

      const result = await response.json();

      // Mostrar notificação de sucesso
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação de acesso foi rejeitada.",
        variant: "default"
      });

      // Atualizar lista de solicitações pendentes
      refetchAccessRequests();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao rejeitar solicitação de acesso",
        variant: "destructive"
      });
    }
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

      
      {/* Banner específico do admin abaixo do header */}
      <div className="relative">
        <div className="bg-primary/10 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary mr-2" />
            <span className="font-semibold">{t('navigation.admin')}</span>
          </div>
        </div>
      </div>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{t('auth.welcome')}, {user.name}</h2>
            <p className="text-muted-foreground">
              {t('admin.description', 'Este é o painel de administrador do sistema de relatórios médicos. Aqui, podes gerir utilizadores, consultar relatórios médicos e acompanhar todas as atividades do sistema.')}
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="register">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('admin.register_users')}
              </TabsTrigger>
              <TabsTrigger value="access">
                <Key className="h-4 w-4 mr-2" />
                {t('admin.access_requests')}
              </TabsTrigger>
              <TabsTrigger value="users">
                <User className="h-4 w-4 mr-2" />
                {t('admin.users')}
              </TabsTrigger>
              <TabsTrigger value="patients">
                <Hospital className="h-4 w-4 mr-2" />
                {t('patient.details')}
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                {t('admin.reports')}
              </TabsTrigger>
              <TabsTrigger value="audit">
                <BarChart className="h-4 w-4 mr-2" />
                {t('admin.audit_logs')}
              </TabsTrigger>
            </TabsList>
            
            {/* Aba de Registro de Usuários */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.new_user_title')}</CardTitle>
                  <CardDescription>
                    {t('admin.new_user_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(handleRegisterUser)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">{t('auth.request_form.full_name')}</Label>
                      <Input 
                        id="register-name" 
                        {...registerForm.register("name")} 
                        placeholder={t('auth.request_form.full_name_placeholder')} 
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-username">{t('auth.username')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <Input 
                          id="register-username" 
                          className="pl-10"
                          {...registerForm.register("username")} 
                          placeholder={t('auth.username')} 
                        />
                      </div>
                      {registerForm.formState.errors.username && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">{t('auth.password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <Input 
                          id="register-password" 
                          type="password" 
                          className="pl-10"
                          {...registerForm.register("password")} 
                          placeholder={t('auth.password_placeholder')} 
                        />
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-role">{t('admin.role')}</Label>
                      <div className="relative">
                        <Hospital className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <select 
                          id="register-role" 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...registerForm.register("role")}
                        >
                          <option value="doctor">{t('admin.role_doctor')}</option>
                          <option value="nurse">{t('admin.role_nurse')}</option>
                          <option value="admin">{t('admin.role_admin')}</option>
                        </select>
                      </div>
                      {registerForm.formState.errors.role && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.role.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-specialty">{t('auth.request_form.specialty')}</Label>
                      <div className="relative">
                        <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <Input 
                          id="register-specialty" 
                          className="pl-10"
                          {...registerForm.register("specialty")} 
                          placeholder={t('auth.request_form.specialty_placeholder')} 
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
                      {registerMutation.isPending ? t('common.loading') : t('admin.register_user')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Solicitações de Acesso */}
            <TabsContent value="access">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.pending_access_title')}</CardTitle>
                  <CardDescription>
                    {t('admin.pending_access_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accessRequestsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('patient.name')}</TableHead>
                            <TableHead>{t('auth.request_form.professional_id')}</TableHead>
                            <TableHead>{t('auth.request_form.specialty')}</TableHead>
                            <TableHead>{t('auth.request_form.email')}</TableHead>
                            <TableHead>{t('auth.request_form.phone')}</TableHead>
                            <TableHead>{t('admin.request_date')}</TableHead>
                            <TableHead>{t('admin.action_buttons')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accessRequestsData && accessRequestsData.length > 0 ? (
                            accessRequestsData.map((request: any) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.full_name || "-"}</TableCell>
                                <TableCell>{request.professional_id || "-"}</TableCell>
                                <TableCell>{request.specialty || "-"}</TableCell>
                                <TableCell>{request.email || "-"}</TableCell>
                                <TableCell>{request.phone || "-"}</TableCell>
                                <TableCell>
                                  {request.created_at ? 
                                    new Date(request.created_at).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    }) : 
                                    "-"
                                  }
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => handleApproveAccessRequest(request.id)}
                                    >
                                      {t('admin.approve')}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleRejectAccessRequest(request.id)}
                                    >
                                      {t('admin.reject')}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4">
                                {t('admin.no_pending_requests')}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/50 flex justify-between p-4">
                  <div className="text-sm">
                    <p>{t('admin.add_user_manually_hint')}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchAccessRequests()}
                  >
                    {t('admin.refresh_list')}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Aba de Gerenciamento de Usuários */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.user_management_title')}</CardTitle>
                  <CardDescription>
                    {t('admin.user_management_description')}
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
                            <TableHead>{t('admin.name')}</TableHead>
                            <TableHead>{t('auth.username')}</TableHead>
                            <TableHead>{t('admin.role')}</TableHead>
                            <TableHead>{t('auth.request_form.specialty')}</TableHead>
                            <TableHead>{t('admin.professional_id')}</TableHead>
                            <TableHead>{t('admin.status')}</TableHead>
                            <TableHead>{t('reports.created_at')}</TableHead>
                            <TableHead>{t('admin.action_buttons')}</TableHead>
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
                                <TableCell>{userData.professionalId || "-"}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    userData.status === 'active' || !userData.status
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  }`}>
                                    {userData.status === 'active' || !userData.status ? t('profile.account_active', 'Ativo') : t('profile.account_inactive', 'Inativo')}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {userData.createdAt ? 
                                    new Date(userData.createdAt).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    }) : 
                                    "-"
                                  }
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {userData.status === "inactive" && (
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => {
                                          // Implementar função para reativar o usuário
                                          fetch(`/api/users/${userData.id}/status`, {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type": "application/json"
                                            },
                                            credentials: "include",
                                            body: JSON.stringify({
                                              status: "active"
                                            })
                                          })
                                          .then(response => {
                                            if (!response.ok) {
                                              throw new Error("Erro ao reativar utilizador");
                                            }
                                            return response.json();
                                          })
                                          .then(() => {
                                            toast({
                                              title: "Utilizador reativado",
                                              description: "O utilizador foi reativado com sucesso.",
                                              variant: "default"
                                            });
                                            refetchUsers();
                                          })
                                          .catch(error => {
                                            toast({
                                              title: "Erro",
                                              description: error.message,
                                              variant: "destructive"
                                            });
                                          });
                                        }}
                                      >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        {t('admin.activate_user')}
                                      </Button>
                                    )}
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
                                      {t('admin.reset_password')}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-4">
                                {t('admin.no_users_found', 'Nenhum utilizador encontrado.')}
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
                  <CardTitle>{t('admin.test_patients_title')}</CardTitle>
                  <CardDescription>
                    {t('admin.test_patients_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">{t('admin.test_patients_count')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('admin.test_patients_choose_count')}
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
                      <h4 className="font-medium mb-2">{t('admin.test_patients_to_be_created')}</h4>
                      <div className="space-y-2">
                        {Array.from({ length: patientCount }).map((_, index) => (
                          <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-background">
                            <div>
                              <span className="font-medium">{t('patient.test_patient')} {index + 1}</span>
                              <span className="text-muted-foreground ml-2">({t('patient.process')}: TEST{100 + index})</span>
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
                          {t('admin.creating_test_patients')}
                        </span>
                      ) : (
                        <>{t('admin.create_test_patients')}</>
                      )}
                    </Button>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="italic">
                        {t('admin.test_patients_note')}
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
                  <CardTitle>{t('admin.medical_reports_title')}</CardTitle>
                  <CardDescription>
                    {t('admin.medical_reports_description')}
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
                            <TableHead>{t('admin.patient')}</TableHead>
                            <TableHead>{t('admin.process_number')}</TableHead>
                            <TableHead>{t('admin.doctor')}</TableHead>
                            <TableHead>{t('admin.date')}</TableHead>
                            <TableHead>{t('admin.status')}</TableHead>
                            <TableHead>{t('admin.action_buttons')}</TableHead>
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
                                     const userInfo = usersData?.find((u: {id: number, name: string, role: string}) => u.id === report.userId);
                                     return userInfo ? `${userInfo.name} (${userInfo.role === 'admin' ? 'Admin' : 'Médico'})` : "Desconhecido";
                                   })()
                                  }
                                </TableCell>
                                <TableCell>
                                {report.createdAt ? 
                                  new Date(report.createdAt).toLocaleDateString('pt-PT', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  }) : 
                                  "-"
                                }
                              </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    report.status === 'submitted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  }`}>
                                    {report.status === 'submitted' ? t('admin.status_submitted') : 
                                     report.status === 'in_progress' ? t('admin.status_in_progress') : t('admin.status_draft')}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link to={`/reports/${report.id}`}>
                                        {t('admin.view_report')}
                                      </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link to={`/reports/${report.id}/audit`}>
                                        {t('admin.view_change_history')}
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
                                  t('admin.no_reports_found') : 
                                  t('admin.no_reports_match_search')}
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
                  <CardTitle>{t('admin.audit_logs_title')}</CardTitle>
                  <CardDescription>
                    {t('admin.audit_logs_description')}
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
                            <TableHead>{t('admin.datetime')}</TableHead>
                            <TableHead>{t('admin.user')}</TableHead>
                            <TableHead>{t('admin.action')}</TableHead>
                            <TableHead>{t('admin.resource')}</TableHead>
                            <TableHead>{t('admin.ip_address')}</TableHead>
                            <TableHead>{t('admin.details')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditLogsData && auditLogsData.length > 0 ? (
                            auditLogsData.map((log: any) => (
                              <TableRow key={log.id}>
                                <TableCell>
                                  {log.timestamp ? (
                                    <>
                                      {new Date(log.timestamp).toLocaleDateString('pt-PT', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })} {' '}
                                      {new Date(log.timestamp).toLocaleTimeString('pt-PT')}
                                    </>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>{log.user?.name || t('admin.system')}</TableCell>
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
                                      // Usar os detalhes do log, se disponíveis
                                      const detailsToShow = log.details || {
                                        mensagem: "Detalhes não disponíveis"
                                      };
                                      
                                      // Formatar os detalhes para exibição
                                      const formattedDetails = Object.entries(detailsToShow)
                                        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
                                        .join('\n');
                                      
                                      toast({
                                        title: t('admin.log_details'),
                                        description: (
                                          <pre className="mt-2 w-full p-4 rounded-md bg-muted text-sm whitespace-pre-wrap">
                                            {formattedDetails}
                                          </pre>
                                        ),
                                        variant: "default"
                                      });
                                    }}
                                  >
                                    {t('admin.view_details')}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                {t('admin.no_audit_logs_found')}
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
                    {t('admin.audit_logs_retention_notice')}
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