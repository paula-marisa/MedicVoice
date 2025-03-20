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

export default function Home() {
  // State
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
      const formData = {
        ...patient,
        ...report,
        status: "draft"
      };
      
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
      const formData = {
        ...patient,
        ...report,
        status: "submitted"
      };
      
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
    // In a real app, this would generate a PDF using a library like jsPDF
    console.log("Exporting PDF...", { patient, report });
  };

  // Handle SClinico export
  const handleExportSClinico = () => {
    // Verificar se temos um número de processo
    if (!patient.processNumber) {
      notificationRef.current?.show({
        message: "É necessário um número de processo para exportar para o SClínico",
        type: "error"
      });
      return;
    }
    
    // Em uma aplicação real, isso enviaria os dados formatados para o SClínico (HL7/FHIR ou JSON)
    const today = new Date();
    
    // Simulação: exportação para SClínico com autenticação médica
    console.log("Exportando para SClínico...", { 
      patient, 
      report, 
      exportDate: today.toISOString(),
      processNumber: patient.processNumber
    });
    
    // Numa implementação real, faria uma chamada de API para o backend
    // que integraria com o sistema SClínico usando o número de processo
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
