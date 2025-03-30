import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Stethoscope, Ear } from "lucide-react";
import { RecordingIndicator } from "./recording-indicator";

interface ListenButtonProps {
  isListening: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "full";
  showLabel?: boolean;
  className?: string;
}

export function ListenButton({ 
  isListening, 
  onClick, 
  size = "md", 
  variant = "inline",
  showLabel = true,
  className = ""
}: ListenButtonProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  // Setup and cleanup timer
  useEffect(() => {
    if (isListening) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening]);
  
  // Determinar tamanhos baseados na prop size
  const buttonSize = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  }[size];
  
  const iconSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];
  
  const labelStyle = "text-xs text-neutral-600 dark:text-neutral-400";
  
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          type="button"
          size="sm"
          variant={isListening ? "destructive" : "outline"}
          className={`rounded-full ${buttonSize} flex items-center justify-center relative`}
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            onClick(); 
            return false; 
          }}
          title={isListening ? "Parar Escuta" : "Iniciar Escuta"}
        >
          {isListening ? (
            <Ear className={iconSize} />
          ) : (
            <Stethoscope className={iconSize} />
          )}
          
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
        
        {showLabel && (
          <span className={labelStyle}>
            {isListening ? "Escutando..." : "Escutar"}
          </span>
        )}
      </div>
    );
  }
  
  // Versão mais completa com botão maior
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Button 
        type="button"
        size="lg"
        variant={isListening ? "destructive" : "default"}
        className={`${buttonSize} rounded-full mb-2 flex items-center justify-center`}
        onClick={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          onClick(); 
          return false; 
        }}
      >
        {isListening ? (
          <Ear className={iconSize} />
        ) : (
          <Stethoscope className={iconSize} />
        )}
      </Button>
      
      {showLabel && (
        <span className={labelStyle}>
          {isListening ? "Parar Escuta" : "Iniciar Escuta"}
        </span>
      )}
      
      {isListening && (
        <RecordingIndicator 
          isRecording={isListening}
          recordingType="listening" 
          recordingTime={recordingTime}
          className="mt-2"
        />
      )}
    </div>
  );
}