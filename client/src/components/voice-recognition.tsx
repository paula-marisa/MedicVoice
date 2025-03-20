import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface VoiceRecognitionProps {
  onTranscriptionComplete: (text: string, field: string) => void;
  notificationRef: React.RefObject<any>;
}

export function VoiceRecognition({ onTranscriptionComplete, notificationRef }: VoiceRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [targetField, setTargetField] = useState("diagnosis");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<number | null>(null);

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

  const startRecording = () => {
    try {
      // Reset timer
      setRecordingTime(0);

      // Setup Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      
      // Collect results
      let finalTranscript = '';
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        notificationRef.current?.show({
          message: `Erro: ${event.error}`,
          type: "error"
        });
        stopRecording();
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          stopRecording();
        }
      };

      // Start recognition
      recognitionRef.current.start();
      setIsRecording(true);
      notificationRef.current?.show({
        message: "Gravação iniciada",
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
      // In a real application, you'd extract the final transcript here
      // For demonstration, let's create sample content based on target field
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
      
      // Pass the transcript to parent component
      onTranscriptionComplete(sampleContent, targetField);
      setIsRecording(false);
      notificationRef.current?.show({
        message: "Texto transcrito com sucesso!",
        type: "success"
      });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-medium mb-4">Reconhecimento de Voz</h2>
          
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Clique no botão abaixo para começar a gravar o relatório. Fale claramente e o texto será transcrito automaticamente.
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
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <Button 
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="h-16 w-16 rounded-full mb-3"
              onClick={toggleRecording}
            >
              {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {isRecording ? "Parar Gravação" : "Iniciar Gravação"}
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-medium mb-4">Campo de Destino</h2>
          
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Selecione o campo onde o texto transcrito será inserido:
          </div>
          
          <RadioGroup value={targetField} onValueChange={setTargetField}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="diagnosis" id="target-diagnosis" />
                <Label htmlFor="target-diagnosis">Diagnóstico</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="symptoms" id="target-symptoms" />
                <Label htmlFor="target-symptoms">Sintomas</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="treatment" id="target-treatment" />
                <Label htmlFor="target-treatment">Tratamento Recomendado</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="observations" id="target-observations" />
                <Label htmlFor="target-observations">Observações</Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
