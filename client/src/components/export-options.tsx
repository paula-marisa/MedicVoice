import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";
import { useRef } from "react";

interface ExportOptionsProps {
  onExportPDF: () => void;
  onExportSClinico: () => void;
  notificationRef: React.RefObject<any>;
}

export function ExportOptions({ onExportPDF, onExportSClinico, notificationRef }: ExportOptionsProps) {
  // Handle PDF export
  const handleExportPDF = () => {
    try {
      onExportPDF();
      notificationRef.current?.show({
        message: "Relatório exportado como PDF com sucesso!",
        type: "success"
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      notificationRef.current?.show({
        message: "Erro ao exportar relatório como PDF",
        type: "error"
      });
    }
  };

  // Handle SClinico export
  const handleExportSClinico = () => {
    try {
      onExportSClinico();
      notificationRef.current?.show({
        message: "Relatório exportado para SClínico com sucesso!",
        type: "success"
      });
    } catch (error) {
      console.error("Error exporting to SClinico:", error);
      notificationRef.current?.show({
        message: "Erro ao exportar relatório para SClínico",
        type: "error"
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium mb-4">Opções de Exportação</h2>
        
        <div className="space-y-3">
          <Button 
            variant="default" 
            className="w-full flex items-center gap-2"
            onClick={handleExportPDF}
          >
            <FileDown className="h-5 w-5" />
            Exportar como PDF
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2"
            onClick={handleExportSClinico}
          >
            <Download className="h-5 w-5" />
            Exportar para SClínico
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
