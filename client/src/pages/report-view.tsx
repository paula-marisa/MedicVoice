import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/layout/header";
import { Footer } from "@/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalReport } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { useAuth } from "@/hooks/use-auth";

export default function ReportView() {
  const [, params] = useRoute("/reports/:id");
  const reportId = params?.id;
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user } = useAuth();

  // Determinar para onde voltar baseado no papel do usuário
  const backToPath = user?.role === "admin" ? "/admin" : "/";

  // Buscar detalhes do relatório
  const { data: reportData, isLoading, error } = useQuery<{ success: boolean, data: MedicalReport }>({
    queryKey: [`/api/medical-reports/${reportId}`],
    enabled: !!reportId,
  });

  useEffect(() => {
    if (error) {
      setLoadError("Não foi possível carregar o relatório. Por favor, tente novamente mais tarde.");
    }
  }, [error]);

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

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!reportData?.data) return;
    
    const report = reportData.data;
    const doc = new jsPDF();
    
    // Configurações
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Relatório Médico", 105, 15, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nº Processo: ${report.processNumber}`, 15, 30);
    doc.text(`Data: ${formatDate(report.createdAt)}`, 15, 35);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Utente", 15, 45);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nome: ${report.name}`, 15, 50);
    doc.text(`Idade: ${report.age} anos`, 15, 55);
    doc.text(`Género: ${report.gender}`, 15, 60);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Diagnóstico", 15, 70);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(report.diagnosis || "Não especificado", 15, 75);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Sintomas", 15, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(report.symptoms || "Não especificado", 15, 90);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Tratamento", 15, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(report.treatment || "Não especificado", 15, 105);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", 15, 115);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(report.observations || "Não especificado", 15, 120);
    
    // Adicionar rodapé com informações do médico
    doc.setFontSize(10);
    doc.text("Este relatório foi gerado automaticamente pelo sistema.", 105, 270, { align: "center" });
    
    doc.save(`relatorio-${report.processNumber}.pdf`);
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

  if (loadError || !reportData?.data) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col justify-center items-center min-h-[60vh]">
            <h2 className="text-xl font-semibold mb-4">Erro ao carregar relatório</h2>
            <p className="text-muted-foreground mb-6">{loadError || "Relatório não encontrado"}</p>
            <Button asChild>
              <Link to={user?.role === "admin" ? "/admin" : "/"}>
                Voltar à página inicial
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const report = reportData.data;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-2">
        <div className="print:hidden mb-6">
          <Button variant="outline" asChild className="mb-8">
            <Link to={backToPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <Card className="mb-6 border-none print:shadow-none">
          <CardHeader className="print:pb-2">
            <div className="flex justify-between items-start print:hidden">
              <div>
                <CardTitle className="text-2xl">Relatório Médico</CardTitle>
                <CardDescription>Nº Processo: {report.processNumber}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="hidden print:block">
              <h1 className="text-2xl font-bold">Relatório Médico</h1>
              <p>Nº Processo: {report.processNumber}</p>
              <p>Data: {formatDate(report.createdAt)}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 print:space-y-3 print:text-sm">
            <div>
              <h3 className="font-semibold text-lg mb-2 print:text-base">Dados do Utente</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p>{report.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Idade</p>
                  <p>{report.age} anos</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Género</p>
                  <p>{report.gender === "masculino" ? "Masculino" : "Feminino"}</p>
                </div>
              </div>
            </div>

            <Separator className="print:hidden" />

            <div>
              <h3 className="font-semibold text-lg mb-2 print:text-base">Diagnóstico</h3>
              <p>{report.diagnosis || "Não especificado"}</p>
            </div>

            <Separator className="print:hidden" />

            <div>
              <h3 className="font-semibold text-lg mb-2 print:text-base">Sintomas</h3>
              <p>{report.symptoms || "Não especificado"}</p>
            </div>

            <Separator className="print:hidden" />

            <div>
              <h3 className="font-semibold text-lg mb-2 print:text-base">Tratamento</h3>
              <p>{report.treatment || "Não especificado"}</p>
            </div>

            <Separator className="print:hidden" />

            <div>
              <h3 className="font-semibold text-lg mb-2 print:text-base">Observações</h3>
              <p>{report.observations || "Não especificado"}</p>
            </div>
          </CardContent>

          <CardFooter className="flex-col items-start pt-6 print:hidden">
            <div className="w-full flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs w-fit ${
                report.status === 'submitted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {report.status === 'submitted' ? 'Enviado' : 'Rascunho'}
              </span>
            </div>
          </CardFooter>
        </Card>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}