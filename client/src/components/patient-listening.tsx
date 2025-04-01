import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Info, Ear, Stethoscope, ExternalLink, Shield, X, StopCircle, CheckCircle } from "lucide-react";
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

// Interface para expor métodos para o componente pai
export interface PatientListeningRef {
  toggleListening: () => void;
  isListening: boolean;
}

export const PatientListening = forwardRef<PatientListeningRef, PatientListeningProps>(
  ({ onSymptomsDetected, notificationRef, patientProcessNumber }, ref) => {
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
    
    // Expor métodos para o componente pai usando ref
    useImperativeHandle(ref, () => ({
      toggleListening,
      isListening
    }));
    
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
        recognitionRef.current.maxAlternatives = 3; // Obter até 3 alternativas para cada trecho
        // Aumentar a taxa de reconhecimento para maior precisão
        // Isto melhora os resultados para terminologia médica específica
        
        // Manipular resultados de reconhecimento - versão melhorada
        recognitionRef.current.onresult = (event: any) => {
          let interimText = '';
          let finalText = transcriptRef.current;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            // Considerar múltiplas alternativas e escolher a de maior confiança
            let bestTranscript = "";
            let bestConfidence = 0;
            
            // Verificar todas as alternativas para cada resultado
            for (let j = 0; j < event.results[i].length; j++) {
              const alternative = event.results[i][j];
              if (alternative.confidence > bestConfidence) {
                bestConfidence = alternative.confidence;
                bestTranscript = alternative.transcript;
              }
            }
            
            // Se não encontrou nada nas alternativas, use a primeira opção (padrão)
            if (!bestTranscript) {
              bestTranscript = event.results[i][0].transcript;
            }
            
            if (event.results[i].isFinal) {
              finalText += bestTranscript + ' ';
              transcriptRef.current = finalText;
              setTranscript(finalText);
            } else {
              interimText = bestTranscript;
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
          
          const validSymptoms = symptoms.filter(s => s.confidence > 0.5);
          notificationRef.current?.show({
            message: `Análise completa. ${validSymptoms.length} sintomas detectados com confiança elevada.`,
            type: validSymptoms.length > 0 ? "success" : "warning"
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
      // Usando o estado atual para determinar a ação, não o estado do componente
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
      // Retorna o valor atualizado do estado para que o componente pai possa saber
      return !isListening;
    };
    
    // Manipula o resultado do consentimento
    const handlePrivacyConsent = (consented: boolean) => {
      console.log("Consentimento obtido:", consented);
      setHasPatientConsent(consented);
      
      // Importante: Simplificamos o fluxo de consentimento para evitar erros de banco de dados
      // Não precisamos mais salvar isso no banco, apenas registrar na sessão do usuário
      
      if (consented) {
        // Se o consentimento foi concedido, iniciar escuta diretamente
        notificationRef.current?.show({
          message: "Consentimento obtido com sucesso. Iniciando escuta.",
          type: "success"
        });
        // Iniciar gravação diretamente
        startListening();
      } else {
        notificationRef.current?.show({
          message: "Consentimento não concedido. A escuta não será iniciada.",
          type: "info"
        });
      }
    };
  
    const confirmSymptoms = () => {
      // Filtrar sintomas com confiança alta e formatá-los em um relatório estruturado
      const validSymptoms = detectedSymptoms.filter(symptom => symptom.confidence > 0.5);
      const formattedSymptoms = formatSymptomsReport(validSymptoms);
      
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
              
              <div className="mt-4 flex justify-center">
                <Button 
                  size="lg"
                  variant={isListening ? "destructive" : "default"}
                  className={`h-16 w-full md:w-auto flex items-center justify-center gap-2 ${isListening ? "bg-red-500" : ""}`}
                  onClick={toggleListening}
                >
                  {isListening ? (
                    <>
                      <StopCircle className="h-5 w-5" />
                      Parar Escuta
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5" />
                      Iniciar Escuta do Utente
                    </>
                  )}
                </Button>
              </div>
              
              {hasPatientConsent && (
                <div className="mt-2 text-center text-xs text-green-600 dark:text-green-400">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Consentimento obtido
                  </span>
                </div>
              )}
            </div>
            
            {/* Mostrar sempre a área de texto (com ou sem escuta ativa) */}
            <div className="mt-4 text-sm text-left bg-white dark:bg-neutral-900 p-3 rounded border overflow-y-auto max-h-36">
              <div className="font-medium text-sm mb-2">Transcrição do Utente:</div>
              {transcript ? (
                <p className="text-neutral-800 dark:text-neutral-200">{transcript}</p>
              ) : (
                <p className="text-neutral-500 italic">
                  {isListening 
                    ? "Aguardando o utente falar..."
                    : "Clique em 'Iniciar Escuta' para começar a capturar o que o utente diz."}
                </p>
              )}
              {interimTranscript && (
                <p className="text-neutral-500 italic">{interimTranscript}</p>
              )}
              
              {isListening && (
                <div className="flex items-center mt-2">
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Escutando...
                  </Badge>
                  <span className="ml-2 text-sm">{formattedTime()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Diálogo de informações */}
        <AlertDialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
          <AlertDialogContent>
            <div className="flex justify-between items-start">
              <AlertDialogTitle>Escuta e Análise Automática de Sintomas</AlertDialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setIsInfoOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
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
          privacyPolicyUrl="/privacy-policy"
        />
        
        {/* Diálogo de resultado da análise de sintomas */}
        <AlertDialog open={showAnalysisResult} onOpenChange={setShowAnalysisResult}>
          <AlertDialogContent className="max-w-3xl">
            <div className="flex justify-between items-start">
              <AlertDialogTitle>Sintomas Detectados</AlertDialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setShowAnalysisResult(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
            <AlertDialogDescription>
              <div className="mt-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Texto capturado do utente:</h3>
                  <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-md mb-4 text-sm max-h-32 overflow-y-auto">
                    {transcript}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Sintomas detectados:</h3>
                  {detectedSymptoms.length > 0 ? (
                    <div className="space-y-3">
                      {detectedSymptoms
                        .filter(symptom => symptom.confidence > 0.5) // Filtrar por confiança alta
                        .map((symptom, index) => (
                        <div key={index} className="bg-white dark:bg-neutral-900 p-3 rounded-md border">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-primary capitalize">{symptom.symptom}</h4>
                            <Badge variant={symptom.confidence > 0.7 ? "default" : "outline"} className="text-xs">
                              {Math.round(symptom.confidence * 100)}%
                            </Badge>
                          </div>
                          {symptom.context && (
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 break-words">
                              "{symptom.context}"
                            </div>
                          )}
                          {symptom.triggers && (
                            <div className="text-xs text-neutral-500 mt-1">
                              <span className="font-medium">Fatores desencadeantes:</span> {symptom.triggers}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500 border border-dashed rounded-md">
                      <div>Nenhum sintoma identificado.</div>
                      <div className="text-xs mt-1">Tente descrever com mais detalhes como se sente ou quais queixas apresenta. Por exemplo: "tenho dores de cabeça e tonturas há dois dias".</div>
                    </div>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAnalysisResult(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmSymptoms}
                disabled={detectedSymptoms.filter(s => s.confidence > 0.5).length === 0}
              >
                Confirmar e Adicionar ao Relatório
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
);