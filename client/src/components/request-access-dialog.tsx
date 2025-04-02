import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";

// Esquema de validação para o formulário de solicitação de acesso
const requestAccessSchema = z.object({
  fullName: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
  professionalId: z.string().min(3, "Cédula profissional é obrigatória"),
  specialty: z.string().min(2, "Especialidade é obrigatória"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(9, "Número de telefone inválido"),
  mechanographicNumber: z.string().min(3, "Número mecanográfico é obrigatório"),
});

type RequestAccessFormValues = z.infer<typeof requestAccessSchema>;

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestAccessDialog({ open, onOpenChange }: RequestAccessDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguage();

  const form = useForm<RequestAccessFormValues>({
    resolver: zodResolver(requestAccessSchema),
    defaultValues: {
      fullName: "",
      professionalId: "",
      specialty: "",
      email: "",
      phone: "",
      mechanographicNumber: "",
    },
  });

  const onSubmit = async (data: RequestAccessFormValues) => {
    setIsSubmitting(true);
    try {
      // Enviar solicitação para o backend
      await apiRequest("POST", "/api/request-access", data);

      // Mostrar toast de sucesso
      toast({
        title: t('auth.request_form.success_title'),
        description: t('auth.request_form.success_message'),
        variant: "default",
      });

      // Fechar o diálogo
      onOpenChange(false);

    } catch (error) {
      // Mostrar toast de erro
      toast({
        title: t('auth.request_form.error_title'),
        description: error instanceof Error ? error.message : t('auth.request_form.error_message'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('auth.request_form.title')}</DialogTitle>
          <DialogDescription>
            {t('auth.request_form.description')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.request_form.full_name')}</Label>
              <Input 
                id="fullName" 
                {...form.register("fullName")} 
                placeholder={t('auth.request_form.full_name_placeholder')} 
              />
              {form.formState.errors.fullName && (
                <p className="text-red-500 text-sm mt-1">
                  {language === 'pt' 
                    ? form.formState.errors.fullName.message 
                    : t('auth.request_form.full_name_error')}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="professionalId">{t('auth.request_form.professional_id')}</Label>
              <Input 
                id="professionalId" 
                {...form.register("professionalId")} 
                placeholder={t('auth.request_form.professional_id_placeholder')} 
              />
              {form.formState.errors.professionalId && (
                <p className="text-red-500 text-sm mt-1">
                  {language === 'pt' 
                    ? form.formState.errors.professionalId.message 
                    : t('auth.request_form.professional_id_error')}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialty">{t('auth.request_form.specialty')}</Label>
              <Input 
                id="specialty" 
                {...form.register("specialty")} 
                placeholder={t('auth.request_form.specialty_placeholder')} 
              />
              {form.formState.errors.specialty && (
                <p className="text-red-500 text-sm mt-1">
                  {language === 'pt' 
                    ? form.formState.errors.specialty.message 
                    : t('auth.request_form.specialty_error')}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.request_form.email')}</Label>
              <Input 
                id="email" 
                type="email"
                {...form.register("email")} 
                placeholder={t('auth.request_form.email_placeholder')} 
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {language === 'pt' 
                    ? form.formState.errors.email.message 
                    : t('auth.request_form.email_error')}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.request_form.phone')}</Label>
              <Input 
                id="phone" 
                {...form.register("phone")} 
                placeholder={t('auth.request_form.phone_placeholder')} 
              />
              {form.formState.errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {language === 'pt' 
                    ? form.formState.errors.phone.message 
                    : t('auth.request_form.phone_error')}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mechanographicNumber">{t('auth.request_form.mechanographic_number')}</Label>
              <Input 
                id="mechanographicNumber" 
                {...form.register("mechanographicNumber")} 
                placeholder={t('auth.request_form.mechanographic_number_placeholder')} 
              />
              {form.formState.errors.mechanographicNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {language === 'pt' 
                    ? form.formState.errors.mechanographicNumber.message 
                    : t('auth.request_form.mechanographic_number_error')}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('auth.request_form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('auth.request_form.submitting') : t('auth.request_form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}