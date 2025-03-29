import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Info, Ear, Stethoscope, ExternalLink, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { analyzeSymptoms, formatSymptomsReport } from "@/lib/symptoms-analyzer";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogFooter
} from "@/components/ui/alert-dialog";
import { PrivacyConsentDialog } from "./privacy-consent-dialog";
import { RecordingIndicator } from "./recording-indicator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PatientListeningProps {
  onSymptomsDetected: (symptoms: string) => void;
  notificationRef: React.RefObject<any>;
  patientProcessNumber?: string; // Opcional: número do processo do paciente, se já disponível
}

export function PatientListening({ onSymptomsDetected, notificationRef, patientProcessNumber }: PatientListeningProps) {
  const [isListening, setIsListening] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [detectedSymptoms, setDetectedSymptoms] = useState<any[]>([]);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [hasPatientConsent, setHasPatientConsent] = useState(false);
  const [processNumber, setProcessNumber] = useState<string>(""); // Número do processo do paciente atual
  
  const recognitionRef = useRef<any | null>(null);
  const timerRef = useRef<number | null>(null);
  const transcriptRef = useRef<string>("");
  
  // Função para atualizar o número do processo e verificar consentimento
  const updateProcessNumber = (newProcessNumber: string) => {
    setProcessNumber(newProcessNumber);
    // Verifica se já existe consentimento para este paciente
    if (newProcessNumber) {
      checkConsentQuery.refetch();
    }
  };
  
  // Inicializar o processo com o valor passado via props, se disponível
  useEffect(() => {
    if (patientProcessNumber) {
      updateProcessNumber(patientProcessNumber);
    }
  }, [patientProcessNumber]);

  // Consulta para verificar se já existe um consentimento para este paciente
  const checkConsentQuery = useQuery({
    queryKey: ['/api/patient-consents', processNumber, 'voice_listening'],
    queryFn: async () => {
      if (!processNumber) return null;
      try {
        const response = await fetch(`/api/patient-consents/${processNumber}/voice_listening`, {
          credentials: 'include'
        });
        if (response.status === 404) {
          return { consentExists: false };
        }
        if (!response.ok) {
          throw new Error('Erro ao verificar consentimento');
        }
        return response.json();
      } catch (error) {
        console.error('Erro ao verificar consentimento:', error);
        return { consentExists: false };
      }
    },
    enabled: !!processNumber, // Só executa se houver um número de processo
  });
  
  // Efeito para atualizar o estado de consentimento quando a consulta retornar
  useEffect(() => {
    if (checkConsentQuery.data) {
      const consentData = checkConsentQuery.data;
      if (consentData?.data?.consentExists) {
        setHasPatientConsent(consentData.data.consentGranted);
        console.log('Consentimento já registrado:', consentData.data.consentGranted ? 'Concedido' : 'Negado');
      } else {
        setHasPatientConsent(false);
      }
    }
  }, [checkConsentQuery.data]);
  
  // Mutação para salvar o consentimento no banco de dados
  const createConsentMutation = useMutation({
    mutationFn: async (consentData: any) => {
      const res = await apiRequest('POST', '/api/patient-consents', consentData);
      return res.json();
    },
    onSuccess: () => {
      console.log('Consentimento salvo com sucesso no servidor');
    },
    onError: (error) => {
      console.error('Erro ao salvar consentimento:', error);
      notificationRef.current?.show({
        message: "Erro ao registrar consentimento do paciente. Contate o suporte.",
        type: "error"
      });
    }
  });

  // Format time as MM:SS
  const formattedTime = () => {
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Setup and cleanup timer
  useEffect(() => {
    if (isListening) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening]);

  const startListening = () => {
    try {
      // Reset states
      setRecordingTime(0);
      setTranscript("");
      setInterimTranscript("");
      transcriptRef.current = "";
      setDetectedSymptoms([]);

      // Setup Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        notificationRef.current?.show({
          message: "Reconhecimento de voz não suportado pelo seu navegador",
          type: "error"
        });
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-PT'; // Portuguese (Portugal)
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      // Manipular resultados de reconhecimento
      recognitionRef.current.onresult = (event: any) => {
        let interimText = '';
        let finalText = transcriptRef.current;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
            transcriptRef.current = finalText;
            setTranscript(finalText);
          } else {
            interimText = transcript;
          }
        }
        
        setInterimTranscript(interimText);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        notificationRef.current?.show({
          message: `Erro: ${event.error}`,
          type: "error"
        });
        stopListening();
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Tentar reiniciar se a gravação parou mas não foi solicitada
          recognitionRef.current?.start();
        }
      };

      // Start recognition
      recognitionRef.current.start();
      setIsListening(true);
      notificationRef.current?.show({
        message: "Escutando o utente. Clique em parar quando terminar.",
        type: "info"
      });
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      notificationRef.current?.show({
        message: "Erro ao iniciar o reconhecimento de voz",
        type: "error"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      
      // Pegar texto final
      const finalText = transcriptRef.current.trim();
      
      // Se tivermos texto, analisar para detectar sintomas
      if (finalText) {
        // Analisa o texto para encontrar sintomas
        const symptoms = analyzeSymptoms(finalText);
        setDetectedSymptoms(symptoms);
        setShowAnalysisResult(true);
        
        notificationRef.current?.show({
          message: `Análise completa. ${symptoms.length} sintomas detectados.`,
          type: "success"
        });
      } else {
        notificationRef.current?.show({
          message: "Nenhum texto capturado. Tente novamente.",
          type: "warning"
        });
      }
      
      // Limpar estados
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      // Verificar se já temos consentimento
      if (hasPatientConsent) {
        startListening();
      } else {
        // Mostrar diálogo de consentimento
        setShowPrivacyConsent(true);
      }
    }
  };
  
  // Manipula o resultado do consentimento
  const handlePrivacyConsent = (consented: boolean) => {
    setHasPatientConsent(consented);
    
    if (consented) {
      // Obter o número do processo do relatório atual (assumindo que vem de um form ou contexto)
      // Nota: Este é apenas um exemplo, na implementação real você deve obter o ID do paciente atual
      const currentProcessNumber = processNumber || `PROC-${Date.now()}`; // Fallback temporário
      
      // Registrar o consentimento no banco de dados
      createConsentMutation.mutate({
        processNumber: currentProcessNumber,
        consentType: "voice_listening",
        consentGranted: true,
        consentDetails: {
          purpose: "Transcrição e análise de sintomas",
          dataTypes: ["voz", "texto transcrito"],
          retentionPeriod: "90 dias",
          storedIn: "base de dados interna"
        }
      });
      
      // Se o consentimento foi concedido, iniciar escuta
      notificationRef.current?.show({
        message: "Consentimento RGPD/LGPD obtido com sucesso",
        type: "success"
      });
      startListening();
    } else {
      // Se não consentiu, registrar a rejeição para fins de auditoria RGPD
      if (processNumber) {
        createConsentMutation.mutate({
          processNumber: processNumber,
          consentType: "voice_listening",
          consentGranted: false,
          consentDetails: {
            reason: "Consentimento negado pelo utente"
          }
        });
      }
      
      notificationRef.current?.show({
        message: "Consentimento não concedido. A escuta não será iniciada.",
        type: "info"
      });
    }
  };

  const confirmSymptoms = () => {
    // Formatar os sintomas detectados em um relatório estruturado
    const formattedSymptoms = formatSymptomsReport(detectedSymptoms);
    
    // Passar os sintomas para o componente pai
    onSymptomsDetected(formattedSymptoms);
    
    // Mostrar notificação
    notificationRef.current?.show({
      message: "Sintomas adicionados ao relatório com sucesso!",
      type: "success"
    });
    
    // Limpar e fechar
    setShowAnalysisResult(false);
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Escuta do Utente</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsInfoOpen(true)}
              title="Informações sobre escuta do utente"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Clique para iniciar a escuta do utente e captar automaticamente os sintomas relatados.
            O sistema irá detectar e estruturar os sintomas para o relatório.
            
            <div className="mt-2 flex items-start gap-2 bg-muted/50 p-2 rounded text-xs">
              <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p>Será solicitado consentimento do utente conforme RGPD/LGPD para processar dados de voz.</p>
                <Link href="/privacy-policy" className="text-primary hover:underline inline-flex items-center gap-1 mt-1">
                  Ver política de privacidade
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg p-6 text-center">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium mb-2">
                {isListening ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Escutando...
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Pronto para escutar
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-semibold">{formattedTime()}</div>
              
              {/* Mostrar texto sendo transcrito em tempo real */}
              {isListening && (
                <div className="mt-4 text-sm text-left bg-white dark:bg-neutral-900 p-3 rounded border overflow-y-auto max-h-24">
                  {transcript && <p className="text-neutral-800 dark:text-neutral-200">{transcript}</p>}
                  {interimTranscript && (
                    <p className="text-neutral-500 italic">{interimTranscript}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <Button 
              size="lg"
              variant={isListening ? "destructive" : "default"}
              className="h-16 w-16 rounded-full mb-3 flex items-center justify-center"
              onClick={toggleListening}
            >
              {isListening ? (
                <Ear className="h-6 w-6" />
              ) : (
                <Stethoscope className="h-6 w-6" />
              )}
            </Button>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {isListening ? "Parar Escuta" : "Iniciar Escuta"}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogo de informações */}
      <AlertDialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escuta e Análise Automática de Sintomas</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 mt-2">
                <div>
                  <p className="text-sm">
                    Este componente permite escutar o que o utente relata durante a consulta e automaticamente 
                    extrair os sintomas mencionados para incluir no relatório médico.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm">Como usar:</h3>
                  <ul className="list-disc ml-5 text-sm mt-1">
                    <li>Inicie a escuta quando o utente começar a descrever seus sintomas</li>
                    <li>Deixe-o falar naturalmente, como em uma consulta normal</li>
                    <li>O sistema irá capturar o que foi dito e analisar os sintomas mencionados</li>
                    <li>Ao finalizar, você poderá revisar os sintomas detectados</li>
                    <li>Confirme para adicionar os sintomas ao relatório de forma estruturada</li>
                  </ul>
                </div>
                
                <div className="text-sm pt-2 border-t">
                  <p>O reconhecimento funciona melhor em ambientes silenciosos e quando o utente fala claramente.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Indicador visual de gravação */}
      <RecordingIndicator 
        isRecording={isListening}
        recordingType="listening" 
        recordingTime={recordingTime}
      />
      
      {/* Diálogo de consentimento RGPD/LGPD */}
      <PrivacyConsentDialog
        open={showPrivacyConsent}
        onOpenChange={setShowPrivacyConsent}
        onConsent={handlePrivacyConsent}
        title="Consentimento para Escuta do Utente"
        description="Para prosseguir com a escuta do utente, é necessário o consentimento explícito para o processamento de dados de voz, conforme as regulamentações de proteção de dados (RGPD/LGPD)."
        privacyItems={[
          {
            id: "consent-voice-capture",
            description: "Autorizo a captura temporária do áudio da conversa com o profissional de saúde para fins de transcrição e análise de sintomas."
          },
          {
            id: "consent-processing",
            description: "Entendo que os dados vocais serão processados localmente, sem armazenamento permanente do áudio original, e que os textos transcritos serão utilizados apenas para auxiliar na preparação do relatório médico."
          },
          {
            id: "consent-retention",
            description: "Estou ciente de que os dados processados serão retidos apenas pelo período necessário para a criação do relatório e podem ser excluídos mediante solicitação."
          }
        ]}
        dataRetentionPeriod="90 dias"
      />
      
      {/* Diálogo de resultado da análise de sintomas */}
      <AlertDialog open={showAnalysisResult} onOpenChange={setShowAnalysisResult}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sintomas Detectados</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Texto capturado do utente:</h3>
                <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-md mb-4 text-sm max-h-32 overflow-y-auto">
                  {transcript}
                </div>
                
                <h3 className="text-sm font-medium mb-2">Sintomas detectados:</h3>
                {detectedSymptoms.length > 0 ? (
                  <div className="space-y-2">
                    {detectedSymptoms.map((symptom, index) => (
                      <div key={index} className="bg-white dark:bg-neutral-900 border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{symptom.symptom}</span>
                          <Badge variant={symptom.confidence > 0.7 ? "default" : 
                                          symptom.confidence > 0.5 ? "secondary" : "outline"}>
                            Confiança: {Math.round(symptom.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          "{symptom.context}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-neutral-500 dark:text-neutral-400 py-4">
                    Nenhum sintoma detectado no texto. Tente novamente com mais detalhes.
                  </p>
                )}
                
                {detectedSymptoms.length > 0 && (
                  <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Texto a ser adicionado ao relatório:</h3>
                    <p className="text-sm">{formatSymptomsReport(detectedSymptoms)}</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={() => setShowAnalysisResult(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmSymptoms}
              disabled={detectedSymptoms.length === 0}
            >
              Adicionar ao Relatório
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}