import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Info, Shield, ExternalLink } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { PrivacyConsentDialog } from "./privacy-consent-dialog";
import { RecordingIndicator } from "./recording-indicator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VoiceRecognitionProps {
  onTranscriptionComplete: (text: string, field: string) => void;
  notificationRef: React.RefObject<any>;
  patientProcessNumber?: string; // Opcional: número do processo do paciente, se já disponível
}

export interface VoiceRecognitionRef {
  toggleRecording: (field?: string) => void;
  isRecording: boolean;
  targetField: string;
}

export const VoiceRecognition = forwardRef<VoiceRecognitionRef, VoiceRecognitionProps>(
  ({ onTranscriptionComplete, notificationRef, patientProcessNumber }, ref) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [targetField, setTargetField] = useState("diagnosis");
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
    // Verificar consentimento salvo no localStorage
    const [hasDoctorConsent, setHasDoctorConsent] = useState(() => {
      if (typeof window !== 'undefined') {
        const savedConsent = localStorage.getItem('voice_recognition_consent');
        return savedConsent === 'true';
      }
      return false;
    });
    const [processNumber, setProcessNumber] = useState<string>("");
    
    const recognitionRef = useRef<any | null>(null);
    const timerRef = useRef<number | null>(null);
    const transcriptRef = useRef<string>("");
    
    // Expor métodos para o componente pai usando ref
    useImperativeHandle(ref, () => ({
      toggleRecording: (field?: string) => {
        if (field) {
          setTargetField(field);
        }
        toggleRecording();
        return isRecording;
      },
      isRecording,
      targetField
    }));
    
    // Inicializar o processo com o valor passado via props, se disponível
    useEffect(() => {
      if (patientProcessNumber) {
        setProcessNumber(patientProcessNumber);
      }
    }, [patientProcessNumber]);
    
    // Verificar se já há consentimento para este médico/dispositivo
    const checkConsentQuery = useQuery({
      queryKey: ['/api/patient-consents', processNumber, 'voice_dictation'],
      queryFn: async () => {
        if (!processNumber) return null;
        try {
          const response = await fetch(`/api/patient-consents/${processNumber}/voice_dictation`, {
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
  
    // Mutação para salvar o consentimento no banco de dados
    const createConsentMutation = useMutation({
      mutationFn: async (consentData: any) => {
        const res = await apiRequest('POST', '/api/patient-consents', consentData);
        return res.json();
      },
      onSuccess: () => {
        console.log('Consentimento do médico salvo com sucesso no servidor');
      },
      onError: (error) => {
        console.error('Erro ao salvar consentimento do médico:', error);
        notificationRef.current?.show({
          message: "Erro ao registrar seu consentimento. Contate o suporte técnico.",
          type: "error"
        });
      }
    });
    
    // Efeito para atualizar o estado de consentimento quando a consulta retornar
    useEffect(() => {
      if (checkConsentQuery.data) {
        const consentData = checkConsentQuery.data;
        if (consentData?.data?.consentExists) {
          setHasDoctorConsent(consentData.data.consentGranted);
          console.log('Consentimento do médico já registrado:', consentData.data.consentGranted ? 'Concedido' : 'Negado');
        } else {
          setHasDoctorConsent(false);
        }
      }
    }, [checkConsentQuery.data]);
  
    // Format time as MM:SS
    const formattedTime = () => {
      const minutes = Math.floor(recordingTime / 60);
      const seconds = recordingTime % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
  
    // Setup and cleanup timer
    useEffect(() => {
      if (isRecording) {
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
    }, [isRecording]);
  
    // Processar comandos de voz
    const processVoiceCommand = (text: string): { isCommand: boolean, action: string, field?: string } => {
      const lowerText = text.toLowerCase().trim();
      
      // Comando para terminar gravação
      if (lowerText.includes("terminar") || lowerText.includes("finalizar") || lowerText.includes("parar")) {
        return { isCommand: true, action: "stop" };
      }
      
      // Verificar se é um comando para mudar o campo
      const diagnósticoMatch = lowerText.match(/\b(diagnóstico|diagnose|diagnostico)\b/);
      const sintomasMatch = lowerText.match(/\b(sintomas|sinais|sintoma)\b/);
      const tratamentoMatch = lowerText.match(/\b(tratamento|tratar|medicamento|terapia)\b/);
      const observaçõesMatch = lowerText.match(/\b(observações|observacao|observacoes|nota|notas)\b/);
      
      if (diagnósticoMatch) {
        return { isCommand: true, action: "changeField", field: "diagnosis" };
      } else if (sintomasMatch) {
        return { isCommand: true, action: "changeField", field: "symptoms" };
      } else if (tratamentoMatch) {
        return { isCommand: true, action: "changeField", field: "treatment" };
      } else if (observaçõesMatch) {
        return { isCommand: true, action: "changeField", field: "observations" };
      }
      
      return { isCommand: false, action: "none" };
    };
  
    const startRecording = () => {
      try {
        // Reset states
        setRecordingTime(0);
        setTranscript("");
        setInterimTranscript("");
        transcriptRef.current = "";
  
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
              // Processar comandos se for resultado final
              const commandResult = processVoiceCommand(transcript);
              
              if (commandResult.isCommand) {
                if (commandResult.action === "stop") {
                  // Comando para parar a gravação
                  notificationRef.current?.show({
                    message: "Comando de voz: Finalizando gravação",
                    type: "info"
                  });
                  stopRecording();
                  return;
                } else if (commandResult.action === "changeField" && commandResult.field) {
                  // Comando para mudar o campo
                  setTargetField(commandResult.field);
                  notificationRef.current?.show({
                    message: `Comando de voz: Alterando campo para ${
                      commandResult.field === "diagnosis" ? "diagnóstico" : 
                      commandResult.field === "symptoms" ? "sintomas" : 
                      commandResult.field === "treatment" ? "tratamento" : "observações"
                    }`,
                    type: "info"
                  });
                  
                  // Se temos conteúdo anterior, enviamos para o campo anterior antes de mudar
                  if (finalText.trim()) {
                    onTranscriptionComplete(finalText.trim(), targetField);
                    finalText = ""; // Reinicia o texto para o novo campo
                    transcriptRef.current = "";
                  }
                  
                  return;
                }
              }
              
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
          stopRecording();
        };
  
        recognitionRef.current.onend = () => {
          if (isRecording) {
            // Tentar reiniciar se a gravação parou mas não foi solicitada
            recognitionRef.current?.start();
          }
        };
  
        // Start recognition
        recognitionRef.current.start();
        setIsRecording(true);
        notificationRef.current?.show({
          message: "Gravação iniciada. Diga 'terminar' quando finalizar.",
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
  
    const stopRecording = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        
        // Pegar texto final
        const finalText = transcriptRef.current.trim();
        
        // Se tivermos texto, envia para o componente pai
        if (finalText) {
          onTranscriptionComplete(finalText, targetField);
          notificationRef.current?.show({
            message: "Texto transcrito com sucesso!",
            type: "success"
          });
        } else {
          // Se a demo não teve retorno de texto, usar exemplos (apenas para demonstração)
          // Numa aplicação real, esse código seria removido
          let sampleContent = '';
          
          switch (targetField) {
            case 'diagnosis':
              sampleContent = 'Paciente apresenta quadro de hipertensão arterial sistêmica grau 2, com valores médios de 160/100 mmHg, refratária ao tratamento atual.';
              break;
            case 'symptoms':
              sampleContent = 'Cefaleia occipital, tontura, visão turva ocasional e edema nos membros inferiores. Relata também episódios de dispneia aos esforços moderados.';
              break;
            case 'treatment':
              sampleContent = 'Recomenda-se ajuste medicamentoso com adição de Losartan 50mg 2x/dia e Hidroclorotiazida 25mg 1x/dia pela manhã. Manter Anlodipino 5mg 1x/dia. Dieta hipossódica e atividade física regular.';
              break;
            case 'observations':
              sampleContent = 'Paciente com baixa adesão ao tratamento anterior. Histórico familiar positivo para doenças cardiovasculares. Solicitar ecocardiograma e teste ergométrico para avaliação de possível hipertrofia ventricular.';
              break;
            default:
              sampleContent = '';
          }
          
          // Passar o texto para o componente pai
          onTranscriptionComplete(sampleContent, targetField);
          notificationRef.current?.show({
            message: "Texto transcrito com sucesso! (demonstração)",
            type: "success"
          });
        }
        
        // Limpar estados
        setIsRecording(false);
        setTranscript("");
        setInterimTranscript("");
        transcriptRef.current = "";
      }
    };
  
    const toggleRecording = () => {
      if (isRecording) {
        stopRecording();
      } else {
        // Verificar se já temos consentimento
        if (hasDoctorConsent) {
          startRecording();
        } else {
          // Mostrar diálogo de consentimento
          setShowPrivacyConsent(true);
        }
      }
    };
    
    // Manipula o resultado do consentimento
    const handlePrivacyConsent = (consented: boolean) => {
      setHasDoctorConsent(consented);
      
      // Salvar o consentimento no localStorage para persistir entre sessões
      if (typeof window !== 'undefined') {
        localStorage.setItem('voice_recognition_consent', consented ? 'true' : 'false');
      }
      
      if (consented) {
        // Se o consentimento foi concedido, salvar no banco de dados (se houver identificação de paciente)
        const currentProcessNumber = processNumber || `SELF-${Date.now()}`; // Fallback temporário
        
        // Registrar o consentimento no banco de dados
        createConsentMutation.mutate({
          processNumber: currentProcessNumber,
          consentType: "voice_dictation",
          consentGranted: true,
          consentDetails: {
            purpose: "Transcrição de voz do médico para relatório",
            dataTypes: ["voz do médico", "texto transcrito"],
            retentionPeriod: "90 dias",
            storedIn: "base de dados interna"
          }
        });
        
        // Se o consentimento foi concedido, iniciar gravação
        notificationRef.current?.show({
          message: "Consentimento RGPD/LGPD obtido com sucesso",
          type: "success"
        });
        startRecording();
      } else {
        // Se não consentiu, registrar a rejeição para fins de auditoria RGPD
        if (processNumber) {
          createConsentMutation.mutate({
            processNumber: processNumber,
            consentType: "voice_dictation",
            consentGranted: false,
            consentDetails: {
              reason: "Consentimento negado pelo médico"
            }
          });
        }
        
        notificationRef.current?.show({
          message: "Consentimento não concedido. A gravação não será iniciada.",
          type: "info"
        });
      }
    };
  
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Reconhecimento de Voz</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsHelpOpen(true)}
                title="Ajuda com comandos de voz"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Clique no botão abaixo para começar a gravar. Você pode dizer o nome do campo (ex: "diagnóstico") 
              para alterar o destino da transcrição.
              
              <div className="mt-2 flex items-start gap-2 bg-muted/50 p-2 rounded text-xs">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p>Será solicitado seu consentimento conforme RGPD/LGPD para processar dados de voz.</p>
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
                  {isRecording ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      Gravando...
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Pronto para gravar
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-semibold">{formattedTime()}</div>
                
                {/* Mostrar texto sendo transcrito em tempo real */}
                {isRecording && (
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
                variant={isRecording ? "destructive" : "default"}
                className="w-full md:w-auto px-8 py-6 mb-4" 
                onClick={toggleRecording}
              >
                {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                <span className="ml-2">
                  {isRecording ? "Parar Gravação" : "Iniciar Gravação"}
                </span>
              </Button>
              
              <div className="w-full max-w-md">
                <h3 className="text-sm font-medium mb-2">Destino da transcrição:</h3>
                <RadioGroup value={targetField} onValueChange={setTargetField}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="diagnosis" id="diagnosis" />
                      <Label htmlFor="diagnosis">Diagnóstico</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="symptoms" id="symptoms" />
                      <Label htmlFor="symptoms">Sintomas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="treatment" id="treatment" />
                      <Label htmlFor="treatment">Tratamento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="observations" id="observations" />
                      <Label htmlFor="observations">Observações</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Indicador visual de gravação */}
        <RecordingIndicator 
          isRecording={isRecording}
          recordingType="dictation" 
          recordingTime={recordingTime}
        />
        
        {/* Diálogo de consentimento RGPD/LGPD */}
        <PrivacyConsentDialog
          open={showPrivacyConsent}
          onOpenChange={setShowPrivacyConsent}
          onConsent={handlePrivacyConsent}
          title="Consentimento para Ditado Médico"
          description="Para prosseguir com o ditado, é necessário o seu consentimento explícito para o processamento de dados de voz, conforme as regulamentações de proteção de dados (RGPD/LGPD)."
          privacyItems={[
            {
              id: "consent-voice-capture-doctor",
              description: "Autorizo a captura temporária do meu áudio para fins de transcrição e preparação de relatório médico."
            },
            {
              id: "consent-processing-doctor",
              description: "Entendo que os dados vocais serão processados localmente, sem armazenamento permanente do áudio original."
            },
            {
              id: "consent-retention-doctor",
              description: "Estou ciente de que os dados processados serão retidos apenas pelo período necessário para a criação do relatório."
            }
          ]}
          dataRetentionPeriod="90 dias"
          privacyPolicyUrl="/privacy-policy"
        />
        
        {/* Diálogo de ajuda */}
        <AlertDialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Como usar o reconhecimento de voz</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-4 mt-2">
                  <div>
                    <p className="text-sm">
                      Este componente permite ditar o relatório médico utilizando reconhecimento de voz.
                      Você pode usar os comandos abaixo para controlar o sistema.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm">Comandos para mudar o campo de destino:</h3>
                    <ul className="list-disc ml-5 text-sm mt-1">
                      <li>Diga <strong>"diagnóstico"</strong> para selecionar o campo de diagnóstico</li>
                      <li>Diga <strong>"sintomas"</strong> para selecionar o campo de sintomas</li>
                      <li>Diga <strong>"tratamento"</strong> para selecionar o campo de tratamento</li>
                      <li>Diga <strong>"observações"</strong> para selecionar o campo de observações</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm">Comandos para finalizar a gravação:</h3>
                    <ul className="list-disc ml-5 text-sm mt-1">
                      <li>Diga <strong>"terminar"</strong> para finalizar a gravação</li>
                      <li>Diga <strong>"finalizar"</strong> para finalizar a gravação</li>
                      <li>Diga <strong>"parar"</strong> para finalizar a gravação</li>
                    </ul>
                  </div>
                  
                  <div className="text-sm pt-2 border-t">
                    <p>Os comandos funcionam melhor quando ditos claramente e separados do texto que você deseja transcrever.</p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
);