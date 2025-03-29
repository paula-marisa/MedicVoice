import { Mic, MicOff, Ear } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface RecordingIndicatorProps {
  isRecording: boolean;
  recordingType: "listening" | "dictation";
  recordingTime: number;
  className?: string;
}

export function RecordingIndicator({
  isRecording,
  recordingType,
  recordingTime,
  className = ""
}: RecordingIndicatorProps) {
  const [visible, setVisible] = useState(true);
  
  // Piscando quando estiver gravando
  useEffect(() => {
    if (!isRecording) {
      setVisible(true);
      return;
    }
    
    const interval = setInterval(() => {
      setVisible((prev) => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, [isRecording]);
  
  // Formatar tempo como MM:SS
  const formattedTime = () => {
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isRecording) return null;
  
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 ${className} ${visible ? 'opacity-100' : 'opacity-70'}`}>
      <Badge variant="destructive" className="flex items-center gap-2 py-2 px-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        {recordingType === "listening" ? (
          <>
            <Ear className="h-4 w-4" />
            <span>Escutando paciente</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span>Gravando áudio</span>
          </>
        )}
        <span className="ml-1 text-xs font-mono">{formattedTime()}</span>
      </Badge>
    </div>
  );
}