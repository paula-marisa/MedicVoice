import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Info, Shield, ExternalLink, StopCircle, CheckCircle } from "lucide-react";
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
import { useTranslation } from "react-i18next";

// Função para criar gramática médica que ajuda no reconhecimento de termos médicos
function createMedicalGrammar() {
  if (typeof window === 'undefined') return null;
  
  const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
  if (!SpeechGrammarList) return null;
  
  // Criar uma nova lista de gramáticas
  const grammarList = new SpeechGrammarList();
  
  // Gramática para comandos
  const commands = [
    'diagnóstico', 'sintomas', 'tratamento', 'observações',
    'terminar', 'finalizar', 'parar'
  ];
  
  // Termos médicos comuns que queremos que sejam reconhecidos com maior precisão
  const medicalTerms = [
    'hipertensão', 'diabetes', 'cefaleia', 'enxaqueca', 'dispneia', 'taquicardia',
    'hematoma', 'fratura', 'edema', 'amigdalite', 'faringite', 'otite', 'rinite',
    'pneumonia', 'bronquite', 'catarata', 'glaucoma', 'artrite', 'artrose',
    'osteoporose', 'tendinite', 'fibromialgia', 'esclerose', 'isquemia', 'anemia',
    'leucemia', 'gastrite', 'colite', 'hepatite', 'cirrose', 'apendicite', 'cálculo', 
    'asma', 'enfisema', 'embolia', 'trombose', 'varizes', 'eczema', 'dermatite',
    'acne', 'lúpus', 'psoríase', 'urticária', 'nefrite', 'insuficiência', 'úlcera',
    'hérnia', 'conjuntivite', 'desidratação', 'intoxicação', 'hipotensão',
    'hipoglicemia', 'arritmia', 'insuficiência cardíaca', 'acidente vascular cerebral',
    'enfarte', 'convulsão', 'epilepsia', 'metástase', 'nódulo', 'tumor', 'quisto',
    'prolapso', 'diverticulite', 'hemoptise', 'hematemese', 'melena', 'hematúria',
    'icterícia', 'paracetamol', 'ibuprofeno', 'aspirina', 'omeprazol', 'antibiótico',
    'anti-inflamatório', 'ansiolítico', 'antidepressivo', 'antialérgico', 'insulina',
    'radioterapia', 'quimioterapia', 'fisioterapia', 'nutrição', 'reabilitação',
    'prognóstico', 'diagnóstico', 'sintomas', 'tratamento', 'etiologia'
  ];
  
  // Criar gramática para comandos (peso maior)
  const commandGrammar = `#JSGF V1.0; grammar commands; public <command> = ${commands.join(' | ')} ;`;
  grammarList.addFromString(commandGrammar, 2.0);
  
  // Criar gramática para termos médicos
  const medicalGrammar = `#JSGF V1.0; grammar medical; public <term> = ${medicalTerms.join(' | ')} ;`;
  grammarList.addFromString(medicalGrammar, 1.5);
  
  return grammarList;
}

interface VoiceRecognitionProps {
  onTranscriptionComplete: (text: string, field: string) => void;
  notificationRef: React.RefObject<any>;
  patientProcessNumber?: string; // Opcional: número do processo do paciente, se já disponível
}

export function VoiceRecognition({ onTranscriptionComplete, notificationRef, patientProcessNumber }: VoiceRecognitionProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [targetField, setTargetField] = useState("diagnosis");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [hasDoctorConsent, setHasDoctorConsent] = useState(false);
  const [processNumber, setProcessNumber] = useState<string>("");
  
  const recognitionRef = useRef<any | null>(null);
  const timerRef = useRef<number | null>(null);
  const transcriptRef = useRef<string>("");
  
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
    
    // IMPORTANTE: Verifica primeiro se a frase COMEÇA com uma das palavras-chave
    // Isso impede que essas palavras sejam detectadas no meio de uma frase normal
    
    // Comandos para mudar de campo - verificar se a frase começa com estas palavras
    if (/^diagnóstico\b|^diagnostico\b|^diagnose\b/.test(lowerText)) {
      return { isCommand: true, action: "changeField", field: "diagnosis" };
    }
    
    if (/^sintomas\b|^sintoma\b|^sinais\b/.test(lowerText)) {
      return { isCommand: true, action: "changeField", field: "symptoms" };
    }
    
    if (/^tratamento\b|^tratar\b|^medicamento\b|^terapia\b/.test(lowerText)) {
      return { isCommand: true, action: "changeField", field: "treatment" };
    }
    
    if (/^observações\b|^observacoes\b|^observacao\b|^notas\b|^nota\b/.test(lowerText)) {
      return { isCommand: true, action: "changeField", field: "observations" };
    }
    
    // Se não começa com palavra-chave, tenta o método antigo (verificar em qualquer parte do texto)
    // mas apenas para comandos específicos precedidos por algum marcador como "campo", "seção", "mudar para"
    
    if (lowerText.includes("campo diagnóstico") || 
        lowerText.includes("campo diagnostico") || 
        lowerText.includes("seção diagnóstico") ||
        lowerText.includes("secao diagnostico") ||
        lowerText.includes("mudar para diagnóstico")) {
      return { isCommand: true, action: "changeField", field: "diagnosis" };
    }
    
    if (lowerText.includes("campo sintomas") || 
        lowerText.includes("seção sintomas") ||
        lowerText.includes("secao sintomas") ||
        lowerText.includes("mudar para sintomas")) {
      return { isCommand: true, action: "changeField", field: "symptoms" };
    }
    
    if (lowerText.includes("campo tratamento") || 
        lowerText.includes("seção tratamento") ||
        lowerText.includes("secao tratamento") ||
        lowerText.includes("mudar para tratamento")) {
      return { isCommand: true, action: "changeField", field: "treatment" };
    }
    
    if (lowerText.includes("campo observações") || 
        lowerText.includes("campo observacoes") ||
        lowerText.includes("seção observações") ||
        lowerText.includes("secao observacoes") ||
        lowerText.includes("mudar para observações")) {
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
      recognitionRef.current.maxAlternatives = 3; // Considerar até 3 alternativas para cada frase
      recognitionRef.current.grammars = createMedicalGrammar();
      // Aumentar o tempo antes de considerar que o usuário parou de falar
      // Isso ajuda quando o usuário faz pausas entre frases
      if ('speechrecognitionevent' in window) {
        (window as any).speechRecognitionList = (window as any).speechRecognitionList || (window as any).webkitSpeechRecognitionList;
      }
      
      // Manipular resultados de reconhecimento
      recognitionRef.current.onresult = (event: any) => {
        let interimText = '';
        let finalText = transcriptRef.current;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            // Novo processamento para capturar frases exatas como "relativamente ao diagnóstico" e "tratamento recomendado"
            const diagnosisPattern = /(relativamente ao diagnóstico|quanto ao diagnóstico|sobre o diagnóstico|diagnóstico)/i;
            const treatmentPattern = /(relativamente ao tratamento|quanto ao tratamento|tratamento recomendado|sobre o tratamento)/i;
            const symptomsPattern = /(relativamente aos sintomas|quanto aos sintomas|sobre os sintomas|sintomas apresentados)/i;
            const observationsPattern = /(relativamente às observações|quanto às observações|sobre as observações|observações adicionais)/i;
            
            let foundPattern = false;
            let newField = "";
            
            // Verificar padrões específicos para relatórios médicos em português
            if (diagnosisPattern.test(transcript)) {
              newField = "diagnosis";
              foundPattern = true;
            } else if (treatmentPattern.test(transcript)) {
              newField = "treatment";
              foundPattern = true;
            } else if (symptomsPattern.test(transcript)) {
              newField = "symptoms";
              foundPattern = true;
            } else if (observationsPattern.test(transcript)) {
              newField = "observations";
              foundPattern = true;
            }
            
            if (foundPattern) {
              // Se encontrou um padrão no meio da frase, muda o campo e notifica
              // Se temos conteúdo anterior, enviamos para o campo anterior
              if (finalText.trim()) {
                onTranscriptionComplete(finalText.trim(), targetField);
                notificationRef.current?.show({
                  message: `Detectada mudança de seção para ${
                    newField === "diagnosis" ? "diagnóstico" : 
                    newField === "symptoms" ? "sintomas" : 
                    newField === "treatment" ? "tratamento" : "observações"
                  }`,
                  type: "info"
                });
              }
              
              // Atualiza o campo alvo
              setTargetField(newField);
              
              // Reinicia o texto para o novo campo
              finalText = ""; 
              transcriptRef.current = "";
            }
            
            // Agora processar comandos explícitos
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
        // Não conseguimos capturar texto
        notificationRef.current?.show({
          message: "Não foi possível capturar o texto. Por favor, tente novamente falando mais alto e claramente.",
          type: "warning"
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
      // O médico não precisa dar consentimento explícito para usar o ditado
      // O clique no botão de gravação já é considerado como consentimento implícito
      
      // Se for a primeira vez, vamos registrar o consentimento implícito
      if (!hasDoctorConsent) {
        setHasDoctorConsent(true);
        
        // Registrar o consentimento implícito no banco de dados
        const currentProcessNumber = processNumber || `SELF-${Date.now()}`;
        createConsentMutation.mutate({
          processNumber: currentProcessNumber,
          consentType: "voice_dictation",
          consentGranted: true,
          consentDetails: {
            purpose: "Transcrição de voz do médico para relatório",
            dataTypes: ["voz do médico", "texto transcrito"],
            retentionPeriod: "90 dias",
            storedIn: "base de dados interna",
            consentMethod: "implícito (clique no botão de gravação)"
          }
        });
      }
      
      // Iniciar a gravação diretamente
      startRecording();
    }
  };
  
  // Manipula o resultado do consentimento
  const handlePrivacyConsent = (consented: boolean) => {
    setHasDoctorConsent(consented);
    
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
            <h2 className="text-lg font-medium">{t('voiceRecognition.title', 'Reconhecimento de Voz')}</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsHelpOpen(true)}
              title={t('voiceRecognition.helpTooltip', 'Ajuda com comandos de voz')}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {t('voiceRecognition.instructions', 'Clique no botão abaixo para começar a gravar. Você pode dizer o nome do campo (ex: "diagnóstico") para alterar o destino da transcrição.')}
            
            <div className="mt-2 flex items-start gap-2 bg-muted/50 p-2 rounded text-xs">
              <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p>{t('voiceRecognition.privacyNote', 'Ao clicar no botão de gravação, você autoriza o processamento temporário dos dados de voz, que serão mantidos de forma segura por até 90 dias conforme as regulamentações de proteção de dados.')}</p>
                <Link href="/privacy-policy" className="text-primary hover:underline inline-flex items-center gap-1 mt-1">
                  {t('voiceRecognition.viewPrivacyPolicy', 'Ver política de privacidade completa')}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center mb-6">
            <Button 
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className={`h-16 w-full md:w-auto flex items-center justify-center gap-2 ${isRecording ? "bg-red-500" : ""}`}
              onClick={toggleRecording}
            >
              {isRecording ? (
                <>
                  <StopCircle className="h-5 w-5" />
                  {t('voiceRecognition.stopRecording', 'Parar Gravação')}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  {t('voiceRecognition.startRecording', 'Iniciar Gravação')}
                </>
              )}
            </Button>
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
                    {t('voiceRecognition.recording', 'Gravando...')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {t('voiceRecognition.readyToRecord', 'Pronto para gravar')}
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
          
          {/* Removido o botão duplicado */}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-medium mb-4">{t('voiceRecognition.targetField', 'Campo de Destino')}</h2>
          
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            {t('voiceRecognition.targetFieldInstructions', 'Selecione o campo onde o texto transcrito será inserido:')}
          </div>
          
          <RadioGroup value={targetField} onValueChange={setTargetField}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="diagnosis" id="target-diagnosis" />
                <Label htmlFor="target-diagnosis">{t('voiceRecognition.diagnosis', 'Diagnóstico')}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="symptoms" id="target-symptoms" />
                <Label htmlFor="target-symptoms">{t('voiceRecognition.symptoms', 'Sintomas')}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="treatment" id="target-treatment" />
                <Label htmlFor="target-treatment">{t('voiceRecognition.treatment', 'Tratamento Recomendado')}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="observations" id="target-observations" />
                <Label htmlFor="target-observations">{t('voiceRecognition.observations', 'Observações')}</Label>
              </div>
            </div>
          </RadioGroup>
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
        title={t('voiceRecognition.consentDialog.title', 'Consentimento para Reconhecimento de Voz')}
        description={t('voiceRecognition.consentDialog.description', 'Para prosseguir com o reconhecimento de voz, é necessário o seu consentimento explícito para o processamento de dados de voz, conforme as regulamentações de proteção de dados (RGPD/LGPD).')}
        privacyItems={[
          {
            id: "consent-voice-capture-doctor",
            description: "Autorizo a captura temporária do meu áudio para fins de transcrição e preenchimento do relatório médico."
          },
          {
            id: "consent-processing-doctor",
            description: "Entendo que os dados vocais serão processados localmente, sem armazenamento permanente do áudio original, e que os textos transcritos serão utilizados apenas para auxiliar na preparação do relatório médico."
          },
          {
            id: "consent-retention-doctor",
            description: "Estou ciente de que os dados processados serão retidos apenas pelo período necessário para a criação do relatório e podem ser excluídos mediante solicitação."
          }
        ]}
        dataRetentionPeriod="90 dias"
        privacyPolicyUrl="/privacy-policy"
      />

      {/* Diálogo de ajuda */}
      <AlertDialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('voiceRecognition.helpDialog.title', 'Comandos de Voz Disponíveis')}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 mt-2">
                <div>
                  <h3 className="font-medium text-sm">{t('voiceRecognition.helpDialog.fieldCommands', 'Comandos para mudar de campo:')}</h3>
                  <ul className="list-disc ml-5 text-sm mt-1">
                    <li>Diga <strong>"diagnóstico"</strong> para alterar para o campo de diagnóstico</li>
                    <li>Diga <strong>"sintomas"</strong> para alterar para o campo de sintomas</li>
                    <li>Diga <strong>"tratamento"</strong> para alterar para o campo de tratamento</li>
                    <li>Diga <strong>"observações"</strong> para alterar para o campo de observações</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm">{t('voiceRecognition.helpDialog.stopCommands', 'Comandos para finalizar a gravação:')}</h3>
                  <ul className="list-disc ml-5 text-sm mt-1">
                    <li>Diga <strong>"terminar"</strong> para finalizar a gravação</li>
                    <li>Diga <strong>"finalizar"</strong> para finalizar a gravação</li>
                    <li>Diga <strong>"parar"</strong> para finalizar a gravação</li>
                  </ul>
                </div>
                
                <div className="text-sm pt-2 border-t">
                  <p>{t('voiceRecognition.helpDialog.tip', 'Os comandos funcionam melhor quando ditos claramente e separados do texto que você deseja transcrever.')}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
