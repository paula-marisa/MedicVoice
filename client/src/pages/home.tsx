import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/layout/header";
import { Footer } from "@/layout/footer";
import { PatientForm, type PatientFormValues } from "@/components/patient-form";
import { ReportForm, type ReportFormValues } from "@/components/report-form";
import { VoiceRecognition } from "@/components/voice-recognition";
import { ExportOptions } from "@/components/export-options";
import { Notification } from "@/components/ui/notification";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertMedicalReportSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { jsPDF } from "jspdf";

export default function Home() {
  // State para autenticação
  const { user } = useAuth();
  
  // State para dados do paciente e relatório
  const [patient, setPatient] = useState<PatientFormValues>({
    processNumber: "",
    name: "",
    age: "",
    gender: ""
  });
  
  const [report, setReport] = useState<ReportFormValues>({
    diagnosis: "",
    symptoms: "",
    treatment: "",
    observations: ""
  });
  
  const [transcription, setTranscription] = useState<{ text: string, field: string } | undefined>();
  
  // Refs
  const notificationRef = useRef<{ show: (props: any) => void }>(null);
  
  // Mutations
  const saveReportMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest("POST", "/api/medical-reports", formData);
      return response.json();
    },
    onSuccess: () => {
      notificationRef.current?.show({
        message: "Relatório salvo com sucesso!",
        type: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medical-reports"] });
    },
    onError: (error) => {
      notificationRef.current?.show({
        message: `Erro ao salvar relatório: ${error.message}`,
        type: "error"
      });
    }
  });

  // Save as draft
  const handleSaveDraft = async () => {
    try {
      // Verificar se usuário está autenticado
      if (!user || !user.id) {
        notificationRef.current?.show({
          message: "Você precisa estar logado para salvar relatórios.",
          type: "error"
        });
        return;
      }
      
      const formData = {
        ...patient,
        ...report,
        status: "draft",
        userId: user.id
      };
      
      console.log("Salvando rascunho:", formData);
      
      // Validate data before sending
      insertMedicalReportSchema.parse(formData);
      
      saveReportMutation.mutate(formData);
    } catch (error) {
      console.error("Validation error:", error);
      notificationRef.current?.show({
        message: "Por favor, preencha todos os campos obrigatórios",
        type: "error"
      });
    }
  };

  // Save and submit
  const handleSaveAndSubmit = async () => {
    try {
      // Verificar se usuário está autenticado
      if (!user || !user.id) {
        notificationRef.current?.show({
          message: "Você precisa estar logado para salvar relatórios.",
          type: "error"
        });
        return;
      }
      
      const formData = {
        ...patient,
        ...report,
        status: "submitted",
        userId: user.id
      };
      
      console.log("Salvando e enviando relatório:", formData);
      
      // Validate data before sending
      insertMedicalReportSchema.parse(formData);
      
      saveReportMutation.mutate(formData);
    } catch (error) {
      console.error("Validation error:", error);
      notificationRef.current?.show({
        message: "Por favor, preencha todos os campos obrigatórios",
        type: "error"
      });
    }
  };

  // Clear form
  const handleClearForm = () => {
    setPatient({
      processNumber: "",
      name: "",
      age: "",
      gender: ""
    });
    
    setReport({
      diagnosis: "",
      symptoms: "",
      treatment: "",
      observations: ""
    });
    
    notificationRef.current?.show({
      message: "Formulário limpo",
      type: "info"
    });
  };

  // Handle transcription update
  const handleTranscriptionComplete = (text: string, field: string) => {
    setTranscription({ text, field });
    
    // Também atualiza o relatório diretamente
    const updatedReport = { ...report };
    updatedReport[field as keyof ReportFormValues] = text;
    setReport(updatedReport);
  };

  // Handle PDF export
  const handleExportPDF = () => {
    try {
      // Verificar se temos dados suficientes para gerar o PDF
      if (!patient.name || !patient.processNumber) {
        notificationRef.current?.show({
          message: "Preencha pelo menos o nome do paciente e número de processo",
          type: "error"
        });
        return;
      }

      // Criar um novo documento PDF
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('pt-BR');
      const userName = user?.name || 'Médico não identificado';

      // Adicionar título
      doc.setFontSize(18);
      doc.text("Relatório Médico", 105, 20, { align: 'center' });
      
      // Adicionar data e informações do médico
      doc.setFontSize(10);
      doc.text(`Data: ${today}`, 20, 30);
      doc.text(`Médico: ${userName} - ${user?.specialty || ''}`, 20, 35);
      
      // Adicionar informações do paciente
      doc.setFontSize(12);
      doc.text("Informações do Paciente", 20, 45);
      doc.setFontSize(10);
      doc.text(`Nome: ${patient.name}`, 25, 55);
      doc.text(`Nº Processo: ${patient.processNumber}`, 25, 60);
      doc.text(`Idade: ${patient.age}`, 25, 65);
      doc.text(`Gênero: ${patient.gender}`, 25, 70);
      
      // Adicionar informações do relatório
      doc.setFontSize(12);
      doc.text("Diagnóstico", 20, 85);
      doc.setFontSize(10);
      const diagnosisLines = doc.splitTextToSize(report.diagnosis, 170);
      doc.text(diagnosisLines, 25, 95);
      
      let currentY = 95 + (diagnosisLines.length * 5);
      
      doc.setFontSize(12);
      doc.text("Sintomas", 20, currentY + 10);
      doc.setFontSize(10);
      const symptomsLines = doc.splitTextToSize(report.symptoms, 170);
      doc.text(symptomsLines, 25, currentY + 20);
      
      currentY = currentY + 20 + (symptomsLines.length * 5);
      
      doc.setFontSize(12);
      doc.text("Tratamento", 20, currentY + 10);
      doc.setFontSize(10);
      const treatmentLines = doc.splitTextToSize(report.treatment, 170);
      doc.text(treatmentLines, 25, currentY + 20);
      
      currentY = currentY + 20 + (treatmentLines.length * 5);
      
      if (report.observations) {
        doc.setFontSize(12);
        doc.text("Observações", 20, currentY + 10);
        doc.setFontSize(10);
        const observationsLines = doc.splitTextToSize(report.observations, 170);
        doc.text(observationsLines, 25, currentY + 20);
      }
      
      // Adicionar rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Documento gerado em ${today} - Página ${i} de ${pageCount}`,
          105,
          285,
          { align: 'center' }
        );
      }
      
      // Salvar o PDF
      doc.save(`relatorio_${patient.processNumber}_${today.replace(/\//g, '-')}.pdf`);
      
      notificationRef.current?.show({
        message: "PDF exportado com sucesso!",
        type: "success"
      });
      
      console.log("Exporting PDF...", { patient, report });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      notificationRef.current?.show({
        message: "Erro ao gerar PDF. Por favor, tente novamente.",
        type: "error"
      });
    }
  };

  // Handle SClinico export
  const handleExportSClinico = () => {
    try {
      // Verificar se temos dados suficientes
      if (!patient.name || !patient.processNumber) {
        notificationRef.current?.show({
          message: "Preencha pelo menos o nome do paciente e número de processo",
          type: "error"
        });
        return;
      }
      
      // Verificar se usuário está autenticado
      if (!user) {
        notificationRef.current?.show({
          message: "Você precisa estar logado para exportar para o SClínico",
          type: "error"
        });
        return;
      }
      
      // Em uma aplicação real, isso enviaria os dados formatados para o SClínico (HL7/FHIR ou JSON)
      const today = new Date();
      
      // Simular uma chamada de API para o SClínico
      setTimeout(() => {
        // Simulação: exportação para SClínico com autenticação médica
        console.log("Exportando para SClínico...", { 
          patient, 
          report, 
          exportDate: today.toISOString(),
          processNumber: patient.processNumber,
          doctor: {
            id: user.id,
            name: user.name,
            specialty: user.specialty
          }
        });
        
        notificationRef.current?.show({
          message: `Relatório exportado para o SClínico com sucesso. Número do processo: ${patient.processNumber}`,
          type: "success"
        });
      }, 1000);
    } catch (error) {
      console.error("Erro ao exportar para SClínico:", error);
      notificationRef.current?.show({
        message: "Erro ao exportar para o SClínico. Por favor, tente novamente.",
        type: "error"
      });
    }
  };

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <PatientForm 
              onPatientChange={setPatient} 
              defaultValues={patient} 
            />
            
            <ReportForm 
              onReportChange={setReport} 
              defaultValues={report} 
              transcription={transcription} 
            />
            
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Button 
                variant="outline" 
                onClick={handleClearForm}
              >
                Limpar Campos
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleSaveDraft}
                disabled={saveReportMutation.isPending}
              >
                Salvar Rascunho
              </Button>
              <Button 
                onClick={handleSaveAndSubmit}
                disabled={saveReportMutation.isPending}
              >
                Salvar e Enviar
              </Button>
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <VoiceRecognition 
              onTranscriptionComplete={handleTranscriptionComplete} 
              notificationRef={notificationRef}
            />
            
            <ExportOptions 
              onExportPDF={handleExportPDF} 
              onExportSClinico={handleExportSClinico} 
              processNumber={patient.processNumber}
              notificationRef={notificationRef}
            />
          </div>
        </div>
      </main>
      
      <Footer />
      
      <Notification ref={notificationRef} />
    </>
  );
}
