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

const patientSchema = z.object({
  processNumber: z.string().min(1, { message: "Número do processo é obrigatório" }),
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  age: z.string().min(1, { message: "Idade é obrigatória" }).refine((value) => {
    const parsedValue = parseInt(value);
    return !isNaN(parsedValue) && parsedValue > 0 && parsedValue <= 120;
  }, { message: "Idade deve ser um número entre 1 e 120" }),
  gender: z.string().min(1, { message: "Gênero é obrigatório" })
});

export type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onPatientChange: (patient: PatientFormValues) => void;
  defaultValues?: Partial<PatientFormValues>;
  disabled?: boolean;
}

export function PatientForm({ onPatientChange, defaultValues, disabled = false }: PatientFormProps) {
  const { toast } = useToast();
  const [processNumber, setProcessNumber] = useState<string>(defaultValues?.processNumber || "");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      processNumber: defaultValues?.processNumber || "",
      name: defaultValues?.name || "",
      age: defaultValues?.age || "",
      gender: defaultValues?.gender || ""
    }
  });

  // Query para buscar dados do paciente
  const { 
    data: patientData, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ["patient", processNumber],
    queryFn: async () => {
      if (!processNumber || processNumber.length < 3) return null;
      
      try {
        const response = await fetch(`/api/patients/${processNumber}`);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error("Erro ao buscar dados do paciente");
        }
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar paciente:", error);
        return null;
      }
    },
    enabled: false // Não buscar automaticamente
  });

  // Buscar paciente pelo processo
  const searchPatient = async () => {
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
        onPatientChange(values as PatientFormValues);
        
        toast({
          title: "Paciente encontrado",
          description: `Dados de ${result.data.name} carregados com sucesso.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Paciente não encontrado",
          description: "Não foram encontrados dados para este número de processo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar os dados do paciente.",
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
    onPatientChange(values as PatientFormValues);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium mb-6">Dados do Paciente</h2>
        
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
                onClick={searchPatient}
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
                    <Label htmlFor="patient-name">
                      Nome do Paciente
                    </Label>
                    <FormControl>
                      <Input
                        id="patient-name"
                        placeholder="Nome completo"
                        {...field}
                        disabled={disabled || isFetching}
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
                    <Label htmlFor="patient-age">
                      Idade
                    </Label>
                    <FormControl>
                      <Input
                        id="patient-age"
                        placeholder="Idade"
                        {...field}
                        disabled={disabled || isFetching}
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
                    <Label htmlFor="patient-gender">
                      Género
                    </Label>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={disabled || isFetching}
                    >
                      <FormControl>
                        <SelectTrigger id="patient-gender">
                          <SelectValue placeholder="Selecionar" />
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
