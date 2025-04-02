import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Download, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { useTranslation } from "react-i18next";

interface ExportOptionsProps {
  onExportPDF: () => void;
  onExportSClinico: () => void;
  processNumber?: string;
  notificationRef: React.RefObject<any>;
}

export function ExportOptions({ 
  onExportPDF, 
  onExportSClinico, 
  processNumber,
  notificationRef 
}: ExportOptionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const today = new Date();
  const formattedDate = format(today, "dd 'de' MMMM 'de' yyyy", { locale: pt });

  // Handle PDF export
  const handleExportPDF = () => {
    try {
      onExportPDF();
      notificationRef.current?.show({
        message: t('export.success'),
        type: "success"
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      notificationRef.current?.show({
        message: t('export.error'),
        type: "error"
      });
    }
  };

  // Handle SClinico export
  const handleExportSClinico = () => {
    // Verificar se temos um número de processo válido
    if (!processNumber) {
      toast({
        title: t('export.error'),
        description: "É necessário fornecer um número de processo válido para exportar para o SClínico.",
        variant: "destructive",
      });
      return;
    }

    try {
      onExportSClinico();
      notificationRef.current?.show({
        message: `${t('export.success')} Nº Processo: ${processNumber}`,
        type: "success"
      });
    } catch (error) {
      console.error("Error exporting to SClinico:", error);
      notificationRef.current?.show({
        message: t('export.error'),
        type: "error"
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium mb-4">{t('export.title')}</h2>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            <Calendar className="h-4 w-4" />
            <span>{t('export.report_date', 'Data do relatório')}: {formattedDate}</span>
          </div>
          
          {user && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('export.responsible_doctor', 'Médico responsável')}: {user.name}
            </div>
          )}
          
          {processNumber && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {t('patient.process_number', 'Número do processo')}: {processNumber}
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <Button 
            variant="default" 
            className="w-full flex items-center gap-2"
            onClick={handleExportPDF}
          >
            <FileDown className="h-5 w-5" />
            {t('export.to_pdf')}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2"
            onClick={handleExportSClinico}
            disabled={!processNumber}
          >
            <Download className="h-5 w-5" />
            {t('export.to_sclinico')}
          </Button>
          
          {!processNumber && (
            <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              {t('export.sclinico_warning', 'Para exportar para o SClínico, é necessário preencher o número do processo hospitalar.')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
