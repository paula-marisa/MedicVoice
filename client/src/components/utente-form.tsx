import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const utenteSchema = z.object({
  processNumber: z.string().min(1, { message: "Número do processo é obrigatório" }),
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  age: z.string().min(1, { message: "Idade é obrigatória" }).refine((value) => {
    const parsedValue = parseInt(value);
    return !isNaN(parsedValue) && parsedValue > 0 && parsedValue <= 120;
  }, { message: "Idade deve ser um número entre 1 e 120" }),
  gender: z.string().min(1, { message: "Gênero é obrigatório" })
});

export type UtenteFormValues = z.infer<typeof utenteSchema>;

interface UtenteFormProps {
  onUtenteChange: (utente: UtenteFormValues) => void;
  defaultValues?: Partial<UtenteFormValues>;
  disabled?: boolean;
}

export function UtenteForm({ onUtenteChange, defaultValues, disabled = false }: UtenteFormProps) {
  const { toast } = useToast();
  const [processNumber, setProcessNumber] = useState<string>(defaultValues?.processNumber || "");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const form = useForm<UtenteFormValues>({
    resolver: zodResolver(utenteSchema),
    defaultValues: {
      processNumber: defaultValues?.processNumber || "",
      name: defaultValues?.name || "",
      age: defaultValues?.age || "",
      gender: defaultValues?.gender || ""
    }
  });

  // Query para buscar dados do utente
  const { 
    data: utenteData, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ["utente", processNumber],
    queryFn: async () => {
      if (!processNumber || processNumber.length < 3) return null;
      
      try {
        const response = await fetch(`/api/utentes/${processNumber}`);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error("Erro ao buscar dados do utente");
        }
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar utente:", error);
        return null;
      }
    },
    enabled: false // Não buscar automaticamente
  });

  // Buscar utente pelo processo
  const searchUtente = async () => {
    setIsSearching(true);
    try {
      const result = await refetch();
      
      if (result.data) {
        // Preencher formulário com dados encontrados
        form.setValue("name", result.data.name);
        form.setValue("age", result.data.age.toString());
        form.setValue("gender", result.data.gender);
        
        // Notificar mudança
        const values = form.getValues();
        onUtenteChange(values as UtenteFormValues);
        
        toast({
          title: "Utente encontrado",
          description: `Dados de ${result.data.name} carregados com sucesso.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Utente não encontrado",
          description: "Não foram encontrados dados para este número de processo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar os dados do utente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Atualizar o número do processo quando o campo mudar
  const handleProcessNumberChange = (value: string) => {
    setProcessNumber(value);
    form.setValue("processNumber", value);
  };

  const handleFormChange = () => {
    const values = form.getValues();
    onUtenteChange(values as UtenteFormValues);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium mb-6">Dados do Utente</h2>
        
        <Form {...form}>
          <form className="space-y-6" onChange={handleFormChange}>
            {/* Número de processo com botão de busca */}
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <FormField
                  control={form.control}
                  name="processNumber"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="hospital-process">
                        Número do Processo Hospitalar
                      </Label>
                      <FormControl>
                        <Input
                          id="hospital-process"
                          placeholder="ex: 12345678"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleProcessNumberChange(e.target.value);
                          }}
                          disabled={disabled || isFetching}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button 
                type="button" 
                onClick={searchUtente}
                disabled={disabled || isSearching || !processNumber || processNumber.length < 3}
                className="mb-[2px]"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="utente-name">
                      Nome do Utente
                    </Label>
                    <FormControl>
                      <Input
                        id="utente-name"
                        placeholder="Nome completo"
                        {...field}
                        disabled={true} // Nome sempre bloqueado, associado ao processo
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="utente-age">
                      Idade
                    </Label>
                    <FormControl>
                      <Input
                        id="utente-age"
                        placeholder="Idade"
                        {...field}
                        disabled={true} // Idade sempre bloqueada, associada ao processo
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="utente-gender">
                      Género
                    </Label>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={true} // Género sempre bloqueado, associado ao processo
                    >
                      <FormControl>
                        <SelectTrigger id="utente-gender">
                          <SelectValue placeholder="Selecionar">
                            {field.value === "M" ? "Masculino" : 
                             field.value === "F" ? "Feminino" : 
                             field.value === "O" ? "Outro" : "Selecionar"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="O">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}