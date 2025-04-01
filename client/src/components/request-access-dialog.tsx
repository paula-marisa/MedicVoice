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
        title: "Solicitação enviada",
        description: "O administrador vai analisar sua solicitação e entrar em contato por email.",
        variant: "default",
      });

      // Fechar o diálogo
      onOpenChange(false);

    } catch (error) {
      // Mostrar toast de erro
      toast({
        title: "Erro ao enviar solicitação",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
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
          <DialogTitle>Solicitar Acesso</DialogTitle>
          <DialogDescription>
            Preencha o formulário abaixo para solicitar acesso ao sistema. 
            O administrador irá revisar suas informações e enviar as credenciais para o email fornecido.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input 
                id="fullName" 
                {...form.register("fullName")} 
                placeholder="Seu nome completo" 
              />
              {form.formState.errors.fullName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="professionalId">Cédula Profissional</Label>
              <Input 
                id="professionalId" 
                {...form.register("professionalId")} 
                placeholder="Sua cédula profissional" 
              />
              {form.formState.errors.professionalId && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.professionalId.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input 
                id="specialty" 
                {...form.register("specialty")} 
                placeholder="Sua especialidade médica" 
              />
              {form.formState.errors.specialty && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.specialty.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                {...form.register("email")} 
                placeholder="seu.email@exemplo.com" 
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Contacto Telefónico</Label>
              <Input 
                id="phone" 
                {...form.register("phone")} 
                placeholder="Seu número de telefone" 
              />
              {form.formState.errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mechanographicNumber">Número Mecanográfico</Label>
              <Input 
                id="mechanographicNumber" 
                {...form.register("mechanographicNumber")} 
                placeholder="Seu número mecanográfico" 
              />
              {form.formState.errors.mechanographicNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.mechanographicNumber.message}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A enviar..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}