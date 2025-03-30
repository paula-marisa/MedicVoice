import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Calendar, FileText, User, Clock } from "lucide-react";
import { MedicalReport } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Header } from "@/layout/header";
import { Footer } from "@/layout/footer";

export default function PatientHistory() {
  const { id } = useParams();
  const [processNumber, setProcessNumber] = useState<string | null>(null);

  // Obter o relatório atual para acessar o número do processo
  const { data: reportData, isLoading: reportLoading } = useQuery<{ success: boolean; data: MedicalReport }>({
    queryKey: [`/api/medical-reports/${id}`],
    enabled: Boolean(id),
  });

  // Buscar relatórios pelo número do processo
  const { data: historyData, isLoading: historyLoading } = useQuery<{
    success: boolean;
    data: MedicalReport[];
  }>({
    queryKey: [`/api/medical-reports/by-process/${processNumber}`],
    enabled: Boolean(processNumber),
  });

  useEffect(() => {
    if (reportData?.data?.processNumber) {
      setProcessNumber(reportData.data.processNumber);
    }
  }, [reportData]);

  const formatDate = (date: string | Date) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>;
      case "submitted":
        return <Badge variant="default">Enviado</Badge>;
      case "in_progress":
        return <Badge variant="secondary">Em Progresso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Relatório atual sendo visualizado
  const report = reportData?.data;

  if (reportLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <h1 className="text-xl font-semibold">Relatório não encontrado</h1>
        <Button asChild>
          <Link to="/">Voltar para página inicial</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Histórico do Utente</h1>
            <p className="text-muted-foreground">
              Processo Nº: {report.processNumber} | Utente: {report.name}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/reports/${report.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Voltar ao relatório
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Relatórios</CardTitle>
            <CardDescription>
              Todos os relatórios médicos deste utente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : historyData?.data?.length ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData.data.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatDate(report.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            {/* Aqui precisaria buscar o nome do médico, usando um hook separado ou enriquecendo os dados no backend */}
                            {report.userId ? `Médico #${report.userId}` : "Desconhecido"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px] truncate">
                            {report.diagnosis || "Não especificado"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(report.status)}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/reports/${report.id}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Não há outros relatórios para este utente.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório Atual</CardTitle>
            <CardDescription>
              Detalhes do relatório em visualização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="font-medium">Informações do relatório</h3>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="inline-block mr-1 h-3 w-3" />
                    {formatDate(report.createdAt)}
                  </p>
                </div>
                <div>
                  {getStatusBadge(report.status)}
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Diagnóstico</h4>
                  <p className="text-sm">{report.diagnosis || "Não especificado"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Sintomas</h4>
                  <p className="text-sm">{report.symptoms || "Não especificado"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Tratamento</h4>
                  <p className="text-sm">{report.treatment || "Não especificado"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Observações</h4>
                  <p className="text-sm">{report.observations || "Não especificado"}</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button size="sm" asChild>
                  <Link to={`/reports/${report.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver relatório completo
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}