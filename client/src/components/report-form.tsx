import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
  listenButton?: React.ReactNode; // Componente de botão para escuta
}

export function ReportForm({ onReportChange, defaultValues, transcription, listenButton }: ReportFormProps) {
  const { t } = useTranslation();
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
        <h2 className="text-lg font-medium mb-6">{t('report.title')}</h2>
        
        <Form {...form}>
          <form className="space-y-6" onChange={handleFormChange}>
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="diagnosis">
                    {t('report.diagnosis')}
                  </Label>
                  <FormControl>
                    <Textarea
                      id="diagnosis"
                      placeholder={t('report.diagnosis_placeholder')}
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
                      {t('report.symptoms')}
                    </Label>
                    {listenButton}
                  </div>
                  <FormControl>
                    <Textarea
                      id="symptoms"
                      placeholder={t('report.symptoms_placeholder')}
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
                  <Label htmlFor="treatment">
                    {t('report.treatment')}
                  </Label>
                  <FormControl>
                    <Textarea
                      id="treatment"
                      placeholder={t('report.treatment_placeholder')}
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
                  <Label htmlFor="observations">
                    {t('report.observations')}
                  </Label>
                  <FormControl>
                    <Textarea
                      id="observations"
                      placeholder={t('report.observations_placeholder')}
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
