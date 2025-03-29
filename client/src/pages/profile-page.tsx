import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Shield, Clipboard, FileText, Stethoscope, UserCog, Calendar, Ban } from "lucide-react";

// Esquema para perfil de administrador
const adminProfileSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Introduza um email válido" }).optional(),
  employeeNumber: z.string().min(1, { message: "O número de funcionário é obrigatório" }),
  department: z.string().optional(),
  phone: z.string().optional(),
});

// Esquema para perfil de médico/enfermeiro
const medicalProfileSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Introduza um email válido" }).optional(),
  licenseNumber: z.string().min(1, { message: "A cédula profissional é obrigatória" }),
  specialty: z.string().min(1, { message: "A especialidade é obrigatória" }),
  phone: z.string().optional(),
});

type AdminProfileFormValues = z.infer<typeof adminProfileSchema>;
type MedicalProfileFormValues = z.infer<typeof medicalProfileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dados fictícios para simular os campos específicos do perfil
  const mockAdminProfile = {
    name: user?.name || "",
    email: "admin@hospital.pt",
    employeeNumber: "ADMIN-00" + (user?.id || "1"),
    department: "Administração",
    phone: "+351 912 345 678",
  };
  
  const mockMedicalProfile = {
    name: user?.name || "",
    email: user?.role === "doctor" ? "medico@hospital.pt" : "enfermeiro@hospital.pt",
    licenseNumber: user?.role === "doctor" ? "CP-" + (user?.id || "1") + "5243" : "CE-" + (user?.id || "1") + "7891",
    specialty: user?.specialty || "Cardiologia",
    phone: "+351 912 345 678",
  };
  
  // Criar formulários baseados no tipo de utilizador
  const adminForm = useForm<AdminProfileFormValues>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: mockAdminProfile,
  });
  
  const medicalForm = useForm<MedicalProfileFormValues>({
    resolver: zodResolver(medicalProfileSchema),
    defaultValues: mockMedicalProfile,
  });
  
  if (!user) return null;
  
  const isAdmin = user.role === "admin";
  const isDoctor = user.role === "doctor";
  
  // Função para lidar com o envio do formulário (simulada)
  const onAdminProfileSubmit = (data: AdminProfileFormValues) => {
    // Simulação de atualização de perfil
    toast({
      title: "Perfil atualizado",
      description: "As informações do seu perfil foram atualizadas com sucesso.",
    });
    console.log("Dados do perfil admin:", data);
  };
  
  const onMedicalProfileSubmit = (data: MedicalProfileFormValues) => {
    // Simulação de atualização de perfil
    toast({
      title: "Perfil atualizado",
      description: "As informações do seu perfil foram atualizadas com sucesso.",
    });
    console.log("Dados do perfil médico:", data);
  };
  
  // Função para simular o upload de foto
  const handlePhotoUpload = () => {
    setIsUploading(true);
    
    // Simulação de upload
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Foto atualizada",
        description: "A sua foto de perfil foi atualizada com sucesso.",
      });
    }, 1500);
  };
  
  // Obter as iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1">
        <div className="container max-w-7xl py-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
              <p className="text-muted-foreground">
                Gira e atualize as informações do seu perfil.
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 md:w-auto">
              <TabsTrigger value="profile">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="mr-2 h-4 w-4" />
                Segurança
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações de Perfil</CardTitle>
                    <CardDescription>
                      Veja e edite os detalhes do seu perfil aqui.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Seção do Avatar/Foto */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-xl bg-primary/10 text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Foto de Perfil</h3>
                        <p className="text-sm text-muted-foreground">
                          Esta foto será exibida no seu perfil e nas áreas do sistema.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2" 
                          onClick={handlePhotoUpload}
                          disabled={isUploading}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          {isUploading ? "A carregar..." : "Carregar nova foto"}
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Formulário baseado no tipo de utilizador */}
                    {isAdmin ? (
                      <Form {...adminForm}>
                        <form onSubmit={adminForm.handleSubmit(onAdminProfileSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={adminForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome Completo</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Seu nome completo" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={adminForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="seu.email@hospital.pt" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={adminForm.control}
                              name="employeeNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Número de Funcionário</FormLabel>
                                  <FormControl>
                                    <Input {...field} disabled />
                                  </FormControl>
                                  <FormDescription>
                                    O número de funcionário não pode ser alterado.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={adminForm.control}
                              name="department"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Departamento</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Departamento" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={adminForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Telefone</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+351 912 345 678" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button type="submit">Guardar Alterações</Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <Form {...medicalForm}>
                        <form onSubmit={medicalForm.handleSubmit(onMedicalProfileSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={medicalForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome Completo</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Seu nome completo" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={medicalForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="seu.email@hospital.pt" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={medicalForm.control}
                              name="licenseNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {isDoctor ? "Cédula Profissional" : "Número de Enfermeiro"}
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} disabled />
                                  </FormControl>
                                  <FormDescription>
                                    {isDoctor 
                                      ? "A cédula profissional não pode ser alterada." 
                                      : "O número de enfermeiro não pode ser alterado."}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={medicalForm.control}
                              name="specialty"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Especialidade</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Especialidade" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={medicalForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Telefone</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+351 912 345 678" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button type="submit">Guardar Alterações</Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>
                
                {/* Estatísticas e informações adicionais com base no tipo de utilizador */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isAdmin ? (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Utilizadores Geridos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">24</div>
                            <UserCog className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Relatórios no Sistema
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">183</div>
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Atividades Registadas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">412</div>
                            <Clipboard className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Relatórios Produzidos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">7</div>
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Utentes Atendidos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">5</div>
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            {isDoctor ? "Consultas Realizadas" : "Procedimentos Realizados"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">12</div>
                            <Stethoscope className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Segurança da Conta</CardTitle>
                    <CardDescription>
                      Altere a sua palavra-passe e gira as configurações de segurança.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Alterar Palavra-passe</h3>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Palavra-passe Atual</Label>
                          <Input id="current-password" type="password" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-password">Nova Palavra-passe</Label>
                          <Input id="new-password" type="password" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmar Palavra-passe</Label>
                          <Input id="confirm-password" type="password" />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={() => {
                          toast({
                            title: "Funcionalidade em desenvolvimento",
                            description: "Esta funcionalidade estará disponível em breve.",
                          })
                        }}>
                          Atualizar Palavra-passe
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Atividades da Conta</h3>
                      
                      <div className="rounded-md border">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Login bem-sucedido</p>
                              <p className="text-xs text-muted-foreground">
                                Hoje, {new Date().toLocaleTimeString('pt-PT')}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-green-500 dark:text-green-400">
                            Ativo
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between border-t p-4">
                          <div className="flex items-center gap-4">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Login bem-sucedido</p>
                              <p className="text-xs text-muted-foreground">
                                22/03/2025, 09:45
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Anterior
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <>
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Opções de Segurança Avançadas</h3>
                          
                          <div className="rounded-md border p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Sessões Ativas</p>
                                <p className="text-xs text-muted-foreground">
                                  Terminar todas as outras sessões ativas na sua conta.
                                </p>
                              </div>
                              <Button variant="destructive" size="sm" onClick={() => {
                                toast({
                                  title: "Sessões terminadas",
                                  description: "Todas as outras sessões foram encerradas com sucesso.",
                                })
                              }}>
                                <Ban className="h-4 w-4 mr-2" />
                                Terminar Sessões
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 px-6 py-4">
                    <p className="text-xs text-muted-foreground">
                      Mantenha a sua palavra-passe segura e não a partilhe com ninguém. Caso suspeite de atividade indevida, contacte o administrador do sistema.
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}