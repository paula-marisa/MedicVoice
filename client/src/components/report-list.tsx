import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Edit, MoreHorizontal, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MedicalReport } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface ReportListProps {
  onEditReport: (report: MedicalReport) => void;
}

export function ReportList({ onEditReport }: ReportListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Buscar relatórios do usuário
  const { data: reports, isLoading } = useQuery<{ success: boolean, data: MedicalReport[] }>({
    queryKey: ["/api/my-reports"],
    refetchInterval: 60000, // Atualiza a cada 1 minuto
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
        <CardTitle>Meus Relatórios</CardTitle>
        <CardDescription>
          Aqui você pode visualizar e editar todos os seus relatórios médicos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
            <Input 
              placeholder="Pesquisar por paciente ou número de processo" 
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
                  <TableHead>Paciente</TableHead>
                  <TableHead>Nº Processo</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                              <p>Editar relatório</p>
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
      </CardContent>
    </Card>
  );
}