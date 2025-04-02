import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Edit, MoreHorizontal, FileText, Trash2, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MedicalReport } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ReportListProps {
  onEditReport: (report: MedicalReport) => void;
}

export function ReportList({ onEditReport }: ReportListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<MedicalReport | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  // Buscar relatórios do usuário
  const { data: reports, isLoading } = useQuery<{ success: boolean, data: MedicalReport[] }>({
    queryKey: ["/api/my-reports"],
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
  
  // Mutation para eliminar um relatório
  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
      return apiRequest('DELETE', `/api/medical-reports/${id}`, {
        reason
      });
    },
    onSuccess: () => {
      toast({
        title: "Relatório eliminado",
        description: "O relatório foi eliminado com sucesso.",
        variant: "default",
      });
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      setDeleteReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/my-reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao eliminar relatório",
        description: error.message || "Ocorreu um erro ao eliminar o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Filtrar relatórios pelo termo de busca
  const filteredReports = reports?.data?.filter(report => {
    const searchLower = searchTerm.toLowerCase();
    return (
      report.name.toLowerCase().includes(searchLower) ||
      report.processNumber.toLowerCase().includes(searchLower) ||
      report.diagnosis.toLowerCase().includes(searchLower)
    );
  }) || [];
  
  // Função para formatar data
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  };
  
  // Status badge cores
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'submitted':
        return <Badge variant="default">Enviado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.my_reports', 'Meus Relatórios')}</CardTitle>
        <CardDescription>
          {t('reports.description', 'Aqui você pode visualizar e editar todos os seus relatórios médicos.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
            <Input 
              placeholder={t('reports.search', 'Pesquisar por utente ou número de processo')}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhum relatório encontrado para a pesquisa." : "Você ainda não tem relatórios."}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('patient.name', 'Utente')}</TableHead>
                  <TableHead>{t('patient.process_number', 'Nº Processo')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('reports.created_at', 'Data')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('reports.status', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('reports.action_buttons', 'Ações')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{report.processNumber}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(report.createdAt)}</TableCell>
                    <TableCell className="hidden md:table-cell">{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => onEditReport(report)}
                              >
                                <Edit size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('reports.edit_report', 'Editar relatório')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                asChild
                              >
                                <Link to={`/reports/${report.id}/history`}>
                                  <FileText size={16} />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('patient.history', 'Histórico do utente')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Botão Eliminar */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setReportToDelete(report);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('reports.delete_report', 'Eliminar relatório')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Diálogo de confirmação de eliminação */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {t('reports.delete_report', 'Eliminar Relatório')}
              </DialogTitle>
              <DialogDescription>
                {t('reports.delete_confirmation', 'Esta ação não pode ser revertida. O relatório será marcado como eliminado e ficará visível apenas para administradores.')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">{t('patient.name', 'Utente')}:</p>
                  <p className="text-sm">{reportToDelete?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">{t('patient.process_number', 'Nº Processo')}:</p>
                  <p className="text-sm">{reportToDelete?.processNumber}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">{t('reports.delete_reason', 'Motivo da eliminação')}: <span className="text-red-500">*</span></p>
                <Textarea 
                  placeholder={t('reports.delete_reason_required', 'É necessário fornecer um motivo para a eliminação do relatório')}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="resize-none"
                  required
                />
                {deleteMutation.isPending && (
                  <p className="text-sm text-muted-foreground mt-1">{t('common.loading', 'A processar...')}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setReportToDelete(null);
                  setDeleteReason("");
                }}
              >
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button
                variant="destructive"
                disabled={!deleteReason.trim() || deleteMutation.isPending}
                onClick={() => {
                  if (reportToDelete?.id && deleteReason.trim()) {
                    deleteMutation.mutate({ 
                      id: reportToDelete.id, 
                      reason: deleteReason.trim() 
                    });
                  }
                }}
              >
                {deleteMutation.isPending ? (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    <span>A eliminar...</span>
                  </div>
                ) : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}