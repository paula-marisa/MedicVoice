import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

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
}

export function PatientForm({ onPatientChange, defaultValues }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      processNumber: defaultValues?.processNumber || "",
      name: defaultValues?.name || "",
      age: defaultValues?.age || "",
      gender: defaultValues?.gender || ""
    }
  });

  const handleFormChange = () => {
    const values = form.getValues();
    onPatientChange(values as PatientFormValues);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium mb-6">Dados do Paciente</h2>
        
        <Form {...form}>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onChange={handleFormChange}>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
