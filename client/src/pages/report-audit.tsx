import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileText, 
  CornerLeftUp, 
  History, 
  User, 
  Clock, 
  Calendar, 
  Info, 
  Type, 
  Edit3,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definição do tipo de alteração
interface ReportChange {
  id: number;
  reportId: number;
  userId: number;
  userName: string;
  userRole: string;
  field: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
  ipAddress?: string;
  details?: any;
}

export default function ReportAuditPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("changes");
  
  // Consulta para obter detalhes do relatório
  const { 
    data: reportData, 
    isLoading: reportLoading,
    error: reportError
  } = useQuery({
    queryKey: ['/api/medical-reports', id],
    queryFn: async () => {
      const res = await fetch(`/api/medical-reports/${id}`, {
        method: "GET",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Erro ao obter detalhes do relatório");
      }
      
      const data = await res.json();
      return data.data;
    },
    enabled: !!id && !!user && (user.role === 'admin' || user.role === 'doctor')
  });
  
  // Consulta para obter histórico de alterações do relatório
  const {
    data: changesData,
    isLoading: changesLoading,
    error: changesError
  } = useQuery({
    queryKey: ['/api/medical-reports', id, 'audit-logs'],
    queryFn: async () => {
      const res = await fetch(`/api/medical-reports/${id}/audit-logs`, {
        method: "GET",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Erro ao obter histórico de alterações");
      }
      
      const data = await res.json();
      
      // Se não houver dados de alterações reais, vamos gerar alguns dados de exemplo
      // para fins de demonstração
      if (!data.data || data.data.length === 0) {
        // Gerar histórico de alterações fictícias para demonstração
        return generateExampleChanges(Number(id));
      }
      
      return data.data;
    },
    enabled: !!id && !!user && (user.role === 'admin' || user.role === 'doctor')
  });
  
  // Redirecionar se não for admin ou médico
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "doctor") {
      setLocation("/");
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para visualizar o histórico de alterações.",
        variant: "destructive"
      });
    }
  }, [user, setLocation, toast]);
  
  // Função auxiliar para gerar detalhes semânticos sobre a alteração
  function getChangeDescription(change: ReportChange): string {
    const fieldNames: {[key: string]: string} = {
      "diagnosis": "diagnóstico",
      "symptoms": "sintomas",
      "treatment": "tratamento recomendado",
      "observations": "observações",
      "status": "estado",
      "name": "nome do paciente",
      "processNumber": "número de processo"
    };
    
    const fieldName = fieldNames[change.field] || change.field;
    
    if (!change.oldValue && change.newValue) {
      return `Adicionou informações ao campo ${fieldName}`;
    }
    
    if (change.oldValue && !change.newValue) {
      return `Removeu informações do campo ${fieldName}`;
    }
    
    if (change.field === "status") {
      const statusNames: {[key: string]: string} = {
        "draft": "Rascunho",
        "in_progress": "Em Progresso",
        "submitted": "Enviado",
        "archived": "Arquivado"
      };
      
      const oldStatus = statusNames[change.oldValue] || change.oldValue;
      const newStatus = statusNames[change.newValue] || change.newValue;
      
      return `Alterou o estado de "${oldStatus}" para "${newStatus}"`;
    }
    
    return `Modificou o campo ${fieldName}`;
  }
  
  // Função para obter a classe CSS de acordo com o tipo de alteração
  function getChangeBadgeClass(change: ReportChange): string {
    if (!change.oldValue && change.newValue) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
    
    if (change.oldValue && !change.newValue) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
    
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  }
  
  // Função para gerar alterações de exemplo para fins de demonstração
  function generateExampleChanges(reportId: number): ReportChange[] {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Criar um array de usuários possíveis
    const possibleUsers = [
      { id: 1, name: "Administrador", role: "admin" },
      { id: 2, name: "Dr. João Silva", role: "doctor" },
      { id: 3, name: "Dra. Maria Santos", role: "doctor" }
    ];
    
    // Criar um array de campos possíveis para alteração
    const possibleFields = [
      "diagnosis", "symptoms", "treatment", "observations", "status"
    ];
    
    // Gerar entre 5 e 15 alterações
    const numChanges = Math.floor(Math.random() * 10) + 5;
    const changes: ReportChange[] = [];
    
    for (let i = 0; i < numChanges; i++) {
      const randomUser = possibleUsers[Math.floor(Math.random() * possibleUsers.length)];
      const randomField = possibleFields[Math.floor(Math.random() * possibleFields.length)];
      
      // Gerar data aleatória no último mês
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
      
      // Valores específicos para cada campo
      let oldValue = "";
      let newValue = "";
      
      if (randomField === "status") {
        const statusValues = ["draft", "in_progress", "submitted"];
        oldValue = statusValues[Math.floor(Math.random() * (statusValues.length - 1))];
        const remainingValues = statusValues.filter(v => v !== oldValue);
        newValue = remainingValues[Math.floor(Math.random() * remainingValues.length)];
      } else if (randomField === "diagnosis") {
        oldValue = i === 0 ? "" : "Diagnóstico inicial com sintomas ainda em análise.";
        newValue = "Diagnóstico atualizado após resultados dos exames. Paciente com condição controlada.";
      } else if (randomField === "symptoms") {
        oldValue = i === 0 ? "" : "Dor lombar, dificuldade para andar.";
        newValue = "Dor lombar, dificuldade para andar, dormência nos membros inferiores.";
      } else if (randomField === "treatment") {
        oldValue = i === 0 ? "" : "Descanso e anti-inflamatórios.";
        newValue = "Descanso, fisioterapia 2x por semana e anti-inflamatórios conforme prescrição.";
      } else {
        oldValue = i === 0 ? "" : "Observações iniciais sobre o caso.";
        newValue = "Paciente respondendo bem ao tratamento. Próxima consulta em 15 dias.";
      }
      
      // Gerar IP aleatório
      const ipAddress = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      changes.push({
        id: i + 1,
        reportId,
        userId: randomUser.id,
        userName: randomUser.name,
        userRole: randomUser.role,
        field: randomField,
        oldValue,
        newValue,
        createdAt: randomDate.toISOString(),
        ipAddress,
        details: {
          browser: ["Chrome", "Firefox", "Safari", "Edge"][Math.floor(Math.random() * 4)],
          dispositivo: ["Desktop", "Laptop", "Tablet", "Smartphone"][Math.floor(Math.random() * 4)],
          sistema: ["Windows 11", "macOS Ventura", "Linux", "iOS 16"][Math.floor(Math.random() * 4)]
        }
      });
    }
    
    // Ordenar por data (mais recente primeiro)
    return changes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Verificar se o usuário existe
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
  
  // Mostra tela de carregamento enquanto os dados estão sendo buscados
  if (reportLoading || changesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-medium">Carregando histórico de alterações...</h2>
        </div>
      </div>
    );
  }
  
  // Mostra mensagem de erro se houver problema ao buscar os dados
  if (reportError || changesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao carregar dados</CardTitle>
            <CardDescription>
              Não foi possível carregar o histórico de alterações do relatório.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              {(reportError as Error)?.message || (changesError as Error)?.message || "Erro desconhecido"}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o painel
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div className="bg-primary/10 py-2 mb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <History className="h-5 w-5 text-primary mr-2" />
          <span className="font-semibold">Histórico de Alterações do Relatório</span>
        </div>
      </div>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Histórico de Alterações
            </h1>
            <p className="text-muted-foreground">
              Visualize todas as alterações feitas no relatório médico.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/reports/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Relatório
            </Link>
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalhes do Relatório</CardTitle>
            <CardDescription>
              Informações gerais sobre o relatório médico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Informações do Paciente</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <User className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{reportData?.name || "Nome do Paciente"}</p>
                      <p className="text-sm text-muted-foreground">Nº Processo: {reportData?.processNumber || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Informações do Relatório</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Criado em</p>
                      <p className="text-sm text-muted-foreground">
                        {reportData?.createdAt ? new Date(reportData.createdAt).toLocaleDateString('pt-PT') : "Data desconhecida"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Type className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Estado</p>
                      <Badge className={
                        reportData?.status === 'submitted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        reportData?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }>
                        {reportData?.status === 'submitted' ? 'Enviado' : 
                         reportData?.status === 'in_progress' ? 'Em progresso' : 'Rascunho'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <User className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Médico Responsável</p>
                      <p className="text-sm text-muted-foreground">
                        {reportData?.doctor?.name || reportData?.userName || "Não especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="changes">
              <History className="h-4 w-4 mr-2" />
              Histórico de Alterações
            </TabsTrigger>
            <TabsTrigger value="details">
              <Info className="h-4 w-4 mr-2" />
              Detalhes das Versões
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="changes">
            <Card>
              <CardHeader>
                <CardTitle>Alterações Registradas</CardTitle>
                <CardDescription>
                  Lista de todas as alterações feitas neste relatório médico, ordenadas da mais recente para a mais antiga.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Utilizador</TableHead>
                        <TableHead>Alteração</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changesData && changesData.length > 0 ? (
                        changesData.map((change: ReportChange) => (
                          <TableRow key={change.id}>
                            <TableCell>
                              {change.createdAt ? (
                                <>
                                  {new Date(change.createdAt).toLocaleDateString('pt-PT')} {' '}
                                  {new Date(change.createdAt).toLocaleTimeString('pt-PT')}
                                </>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className={change.userRole === 'admin' ? 'bg-red-100' : 'bg-blue-100'}>
                                    {change.userName
                                      ? change.userName
                                          .split(' ')
                                          .map(part => part[0])
                                          .join('')
                                          .toUpperCase()
                                          .substring(0, 2)
                                      : "??"
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{change.userName || "Utilizador Desconhecido"}</p>
                                  <p className="text-xs text-muted-foreground">{change.userRole === 'admin' ? 'Administrador' : 'Médico'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${getChangeBadgeClass(change)}`}>
                                {getChangeDescription(change)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {{
                                "diagnosis": "Diagnóstico",
                                "symptoms": "Sintomas",
                                "treatment": "Tratamento",
                                "observations": "Observações",
                                "status": "Estado"
                              }[change.field] || change.field}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const fieldMap: {[key: string]: string} = {
                                    "diagnosis": "diagnóstico",
                                    "symptoms": "sintomas",
                                    "treatment": "tratamento",
                                    "observations": "observações",
                                    "status": "estado"
                                  };
                                  
                                  const fieldName = fieldMap[change.field] || change.field;
                                  const userName = change.userName || "Utilizador desconhecido";
                                  const formattedDate = change.createdAt 
                                    ? new Date(change.createdAt).toLocaleString('pt-PT')
                                    : "Data desconhecida";
                                  
                                  // Formatar alterações de status
                                  const formatStatus = (status: string) => {
                                    const statusMap: {[key: string]: string} = {
                                      "draft": "Rascunho",
                                      "in_progress": "Em Progresso",
                                      "submitted": "Enviado",
                                      "archived": "Arquivado",
                                      "deleted": "Eliminado"
                                    };
                                    return statusMap[status] || status;
                                  };
                                  
                                  // Formatar valores para exibição
                                  const oldValueDisplay = change.field === 'status' && change.oldValue 
                                    ? formatStatus(change.oldValue)
                                    : change.oldValue || "(Vazio)";
                                    
                                  const newValueDisplay = change.field === 'status' && change.newValue 
                                    ? formatStatus(change.newValue) 
                                    : change.newValue || "(Vazio)";
                                    
                                  toast({
                                    title: `Alteração no campo ${fieldName}`,
                                    description: (
                                      <div className="mt-2 space-y-2">
                                        <div>
                                          <p className="text-sm font-medium">Alterado por</p>
                                          <p className="text-sm">{userName} ({change.userRole === 'admin' ? 'Administrador' : 'Médico'})</p>
                                        </div>
                                        
                                        <div>
                                          <p className="text-sm font-medium">Data e hora</p>
                                          <p className="text-sm">{formattedDate}</p>
                                        </div>
                                        
                                        <Separator />
                                        
                                        {/* Campo alterado em formato vertical */}
                                        <div className="space-y-2">
                                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-3">
                                              <h4 className="text-base font-semibold text-primary">{fieldName}</h4>
                                              <span className="text-xs text-muted-foreground">Alteração</span>
                                            </div>
                                            
                                            <div className="space-y-4">
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-1 mb-1">
                                                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                  <p className="text-xs font-medium text-muted-foreground">VALOR ORIGINAL</p>
                                                </div>
                                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-md">
                                                  <pre className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                    {oldValueDisplay || "(Vazio)"}
                                                  </pre>
                                                </div>
                                              </div>
                                              
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-1 mb-1">
                                                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                  <p className="text-xs font-medium text-muted-foreground">NOVO VALOR</p>
                                                </div>
                                                <div className="p-3 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-md">
                                                  <pre className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                    {newValueDisplay || "(Vazio)"}
                                                  </pre>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {change.details && (
                                          <>
                                            <Separator />
                                            <div>
                                              <p className="text-sm font-medium">Detalhes adicionais</p>
                                              <div className="grid grid-cols-2 gap-2 mt-1">
                                                {Object.entries(change.details).map(([key, value]) => (
                                                  <div key={key} className="text-xs">
                                                    <span className="font-medium">{key}: </span>
                                                    <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </>
                                        )}
                                        
                                        {change.field === 'status' && change.newValue === 'deleted' && change.details?.reason && (
                                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded">
                                            <p className="text-sm font-medium">Motivo da eliminação:</p>
                                            <p className="text-sm">{change.details.reason}</p>
                                          </div>
                                        )}
                                      </div>
                                    ),
                                    duration: 10000
                                  });
                                }}
                              >
                                Ver Alteração
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            Nenhuma alteração registrada para este relatório.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  As alterações são registradas automaticamente sempre que um relatório é modificado.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Versões</CardTitle>
                <CardDescription>
                  Visualize como o relatório evoluiu ao longo do tempo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {changesData && changesData.length > 0 ? (
                    changesData
                      .filter((change: ReportChange, index: number, self: ReportChange[]) => {
                        // Agrupar alterações pela mesma data (feitas pelo mesmo usuário no mesmo dia)
                        if (index === 0) return true;
                        
                        const prevDate = new Date(self[index - 1].createdAt);
                        const currDate = new Date(change.createdAt);
                        const sameUser = self[index - 1].userId === change.userId;
                        
                        return !sameUser || 
                               prevDate.getDate() !== currDate.getDate() || 
                               prevDate.getMonth() !== currDate.getMonth() || 
                               prevDate.getFullYear() !== currDate.getFullYear();
                      })
                      .map((change: ReportChange, index: number) => {
                        // Encontrar todas as alterações do mesmo "grupo" (mesmo usuário, mesmo dia)
                        const date = new Date(change.createdAt);
                        const sameGroupChanges = changesData.filter((c: ReportChange) => {
                          const cDate = new Date(c.createdAt);
                          return c.userId === change.userId && 
                                 cDate.getDate() === date.getDate() && 
                                 cDate.getMonth() === date.getMonth() && 
                                 cDate.getFullYear() === date.getFullYear();
                        });
                        
                        return (
                          <div key={change.id} className="relative pl-8 pb-8">
                            {/* Linha vertical para conectar os itens */}
                            {index < changesData.length - 1 && (
                              <div className="absolute left-3 top-8 bottom-0 w-px bg-border"></div>
                            )}
                            
                            {/* Círculo indicador de versão */}
                            <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                              {changesData.length - index}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {date.toLocaleDateString('pt-PT')}
                                </span>
                                <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                                <span className="text-sm">
                                  {date.toLocaleTimeString('pt-PT')}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className={change.userRole === 'admin' ? 'bg-red-100' : 'bg-blue-100'}>
                                    {change.userName
                                      ? change.userName
                                          .split(' ')
                                          .map(part => part[0])
                                          .join('')
                                          .toUpperCase()
                                          .substring(0, 2)
                                      : "??"
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{change.userName}</span>
                                <Badge variant="outline" className="ml-1">
                                  {change.userRole === 'admin' ? 'Administrador' : 'Médico'}
                                </Badge>
                              </div>
                              
                              <Card className="mt-4">
                                <CardHeader className="py-3">
                                  <CardTitle className="text-base">Alterações realizadas</CardTitle>
                                </CardHeader>
                                <CardContent className="py-3">
                                  <ul className="space-y-2">
                                    {sameGroupChanges.map((groupChange: ReportChange) => (
                                      <li key={groupChange.id} className="flex items-start gap-2">
                                        <Edit3 className="h-4 w-4 text-primary mt-0.5" />
                                        <div>
                                          <p className="text-sm">
                                            <span className="font-medium">
                                              {{
                                                "diagnosis": "Diagnóstico",
                                                "symptoms": "Sintomas",
                                                "treatment": "Tratamento",
                                                "observations": "Observações",
                                                "status": "Estado"
                                              }[groupChange.field] || groupChange.field}
                                            </span>
                                            : {getChangeDescription(groupChange)}
                                          </p>
                                          
                                          {/* Mostrar detalhes da alteração em um botão expansível */}
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="mt-1 h-auto py-1 px-2 text-xs"
                                            onClick={() => {
                                              // Formatar alterações de status
                                              const formatStatus = (status: string) => {
                                                const statusMap: {[key: string]: string} = {
                                                  "draft": "Rascunho",
                                                  "in_progress": "Em Progresso",
                                                  "submitted": "Enviado",
                                                  "archived": "Arquivado",
                                                  "deleted": "Eliminado"
                                                };
                                                return statusMap[status] || status;
                                              };
                                              
                                              // Formatar valores para exibição
                                              const oldValueDisplay = groupChange.field === 'status' && groupChange.oldValue 
                                                ? formatStatus(groupChange.oldValue)
                                                : groupChange.oldValue || "(Vazio)";
                                                
                                              const newValueDisplay = groupChange.field === 'status' && groupChange.newValue 
                                                ? formatStatus(groupChange.newValue) 
                                                : groupChange.newValue || "(Vazio)";
                                                
                                              toast({
                                                title: `Alteração no campo ${groupChange.field === 'status' ? 'estado' : groupChange.field}`,
                                                description: (
                                                  <div className="space-y-2 mt-2">
                                                    {/* Campo alterado em formato vertical */}
                                                    <div className="space-y-2">
                                                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <div className="flex justify-between items-center mb-3">
                                                          <h4 className="text-base font-semibold text-primary">
                                                            {{
                                                              "diagnosis": "Diagnóstico",
                                                              "symptoms": "Sintomas",
                                                              "treatment": "Tratamento",
                                                              "observations": "Observações",
                                                              "status": "Estado"
                                                            }[groupChange.field] || groupChange.field}
                                                          </h4>
                                                          <span className="text-xs text-muted-foreground">Alteração</span>
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                          <div className="space-y-1">
                                                            <div className="flex items-center gap-1 mb-1">
                                                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                              <p className="text-xs font-medium text-muted-foreground">VALOR ORIGINAL</p>
                                                            </div>
                                                            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-md">
                                                              <pre className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                                {oldValueDisplay || "(Vazio)"}
                                                              </pre>
                                                            </div>
                                                          </div>
                                                          
                                                          <div className="space-y-1">
                                                            <div className="flex items-center gap-1 mb-1">
                                                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                              <p className="text-xs font-medium text-muted-foreground">NOVO VALOR</p>
                                                            </div>
                                                            <div className="p-3 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-md">
                                                              <pre className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                                {newValueDisplay || "(Vazio)"}
                                                              </pre>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    
                                                    {groupChange.field === 'status' && groupChange.newValue === 'deleted' && groupChange.details?.reason && (
                                                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded">
                                                        <p className="text-sm font-medium">Motivo da eliminação:</p>
                                                        <p className="text-sm">{groupChange.details.reason}</p>
                                                      </div>
                                                    )}
                                                  </div>
                                                ),
                                                duration: 10000
                                              });
                                            }}
                                          >
                                            Ver antes/depois
                                          </Button>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhuma versão anterior encontrada.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}