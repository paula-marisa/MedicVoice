import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/layout/header";
import { Footer } from "@/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Clock, User, Activity, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Timeline, TimelineItem, TimelineConnector, TimelineContent, TimelineDot, TimelineHeader, TimelineSeparator, TimelineTitle } from "@/components/ui/timeline";
import { useAuth } from "@/hooks/use-auth";

interface AuditReport {
  report: {
    id: number;
    processNumber: string;
    name: string;
    doctor: {
      id: number;
      name: string;
      role: string;
      specialty: string;
    } | null;
  };
  auditLogs: Array<{
    id: number;
    userId: number;
    action: string;
    resourceType: string;
    resourceId: number;
    timestamp: string;
    details: Record<string, any>;
    user: {
      id: number;
      name: string;
      role: string;
    } | null;
  }>;
  communicationLogs: Array<{
    id: number;
    reportId: number;
    channelType: string;
    recipient: string;
    timestamp: string;
    status: string;
    message: string;
  }>;
}

export default function ReportAudit() {
  const [, params] = useRoute("/reports/:id/audit");
  const reportId = params?.id;
  const { user } = useAuth();
  
  // Determinar para onde voltar baseado no papel do usuário
  const backToPath = user?.role === "admin" ? "/admin" : "/";
  
  // Buscar histórico de auditoria do relatório
  const { data, isLoading, error } = useQuery<{ success: boolean, data: AuditReport }>({
    queryKey: [`/api/medical-reports/${reportId}/audit`],
    enabled: !!reportId,
  });

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FileText className="h-4 w-4" />;
      case 'update':
        return <Activity className="h-4 w-4" />;
      case 'view':
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-500';
      case 'update':
        return 'bg-blue-500';
      case 'view':
        return 'bg-yellow-500';
      case 'delete':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'create':
        return 'Relatório criado';
      case 'update':
        return 'Relatório atualizado';
      case 'view':
        return 'Relatório visualizado';
      case 'delete':
        return 'Relatório eliminado';
      case 'export':
        return 'Relatório exportado';
      default:
        return action;
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col justify-center items-center min-h-[60vh]">
            <h2 className="text-xl font-semibold mb-4">Erro ao carregar histórico</h2>
            <p className="text-muted-foreground mb-6">Não foi possível carregar o histórico deste relatório.</p>
            <Button asChild>
              <Link to={backToPath}>Voltar à página inicial</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { report, auditLogs, communicationLogs } = data.data;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" asChild className="mb-8">
          <Link to={`/reports/${reportId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao relatório
          </Link>
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Histórico do Relatório</CardTitle>
            <CardDescription>
              Nº Processo: {report.processNumber} | Utente: {report.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Não há registos de auditoria para este relatório.</p>
            ) : (
              <Timeline>
                {auditLogs.map((log, index) => (
                  <TimelineItem key={log.id}>
                    {index < auditLogs.length - 1 && <TimelineConnector />}
                    <TimelineSeparator>
                      <TimelineDot className={getActionColor(log.action)}>
                        {getActionIcon(log.action)}
                      </TimelineDot>
                    </TimelineSeparator>
                    <TimelineContent>
                      <TimelineHeader>
                        <TimelineTitle>
                          {getActionDescription(log.action)}
                        </TimelineTitle>
                        <Badge variant="outline">{formatDate(log.timestamp)}</Badge>
                      </TimelineHeader>
                      <div className="mt-2">
                        <p className="text-sm">
                          <span className="font-medium">Utilizador:</span>{" "}
                          {log.user ? log.user.name : "Sistema"}
                          {log.user?.role && <span className="ml-2 text-xs text-muted-foreground">
                            ({log.user.role === 'admin' ? 'Administrador' : 'Médico'})
                          </span>}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium">Detalhes:</p>
                            {Object.entries(log.details).map(([key, value]) => (
                              <p key={key} className="text-xs text-muted-foreground">
                                {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </CardContent>
        </Card>

        {communicationLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comunicações</CardTitle>
              <CardDescription>
                Histórico de comunicações enviadas sobre este relatório
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communicationLogs.map((log) => (
                  <div key={log.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">
                          {log.channelType === 'email' ? 'Email' : log.channelType === 'sms' ? 'SMS' : 'Notificação'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Para: {log.recipient}
                        </p>
                      </div>
                      <div>
                        <Badge variant={log.status === 'delivered' ? 'default' : log.status === 'failed' ? 'destructive' : 'outline'}>
                          {log.status === 'delivered' ? 'Entregue' : log.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{log.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </>
  );
}