import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const reportSchema = z.object({
  diagnosis: z.string(),
  symptoms: z.string(),
  treatment: z.string(),
  observations: z.string()
});

export type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportFormProps {
  onReportChange: (report: ReportFormValues) => void;
  defaultValues?: Partial<ReportFormValues>;
  transcription?: {
    text: string;
    field: string;
  };
  // Botões específicos para cada campo
  diagnoseButton?: React.ReactNode;
  symptomsButton?: React.ReactNode;
  treatmentButton?: React.ReactNode;
  observationsButton?: React.ReactNode;
  // Mantemos o antigo para compatibilidade
  listenButton?: React.ReactNode;
}

export function ReportForm({ 
  onReportChange, 
  defaultValues, 
  transcription, 
  diagnoseButton, 
  symptomsButton, 
  treatmentButton, 
  observationsButton,
  listenButton 
}: ReportFormProps) {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      diagnosis: defaultValues?.diagnosis || "",
      symptoms: defaultValues?.symptoms || "",
      treatment: defaultValues?.treatment || "",
      observations: defaultValues?.observations || ""
    }
  });
  
  // Handle transcription updates
  useEffect(() => {
    if (transcription && transcription.text) {
      const fieldName = transcription.field as keyof ReportFormValues;
      form.setValue(fieldName, transcription.text);
      
      // Notify parent about the change
      const values = form.getValues();
      onReportChange(values);
    }
  }, [transcription, form, onReportChange]);

  const handleFormChange = () => {
    const values = form.getValues();
    onReportChange(values);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium mb-6">Conteúdo do Relatório</h2>
        
        <Form {...form}>
          <form className="space-y-6" onChange={handleFormChange}>
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="diagnosis">
                      Diagnóstico
                    </Label>
                    {diagnoseButton || listenButton}
                  </div>
                  <FormControl>
                    <Textarea
                      id="diagnosis"
                      placeholder="Descreva o diagnóstico do utente"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="symptoms">
                      Sintomas
                    </Label>
                    {symptomsButton || listenButton}
                  </div>
                  <FormControl>
                    <Textarea
                      id="symptoms"
                      placeholder="Liste os sintomas apresentados"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="treatment">
                      Tratamento Recomendado
                    </Label>
                    {treatmentButton || listenButton}
                  </div>
                  <FormControl>
                    <Textarea
                      id="treatment"
                      placeholder="Descreva o tratamento recomendado"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="observations">
                      Observações
                    </Label>
                    {observationsButton || listenButton}
                  </div>
                  <FormControl>
                    <Textarea
                      id="observations"
                      placeholder="Observações adicionais"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
