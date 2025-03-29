import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/layout/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { setTheme as setAppTheme, getTheme } from "@/lib/theme";
import { 
  Settings, 
  Sun,
  Moon,
  Laptop,
} from "lucide-react";

import {
  getUserSettings,
  saveUserSettings,
  applyInterfaceSettings,
  getTranslations,
  applyTranslations,
  UserSettings
} from "@/lib/settings";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  
  // Configurações de Idioma
  const [language, setLanguage] = useState<string>("pt");
  const [dateFormat, setDateFormat] = useState<string>("dd/mm/yyyy");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  
  // Configurações de Interface
  const [fontSize, setFontSize] = useState<string>("medium");
  const [display, setDisplay] = useState({
    showStatistics: true
  });
  
  useEffect(() => {
    if (user?.id) {
      // Carregar configurações do usuário
      const userSettings = getUserSettings(user.id);
      
      // Atualizar estados com as configurações carregadas
      setLanguage(userSettings.language.language);
      setDateFormat(userSettings.language.dateFormat);
      setTheme(userSettings.language.theme);
      
      setFontSize(userSettings.interface.fontSize);
      setDisplay({
        showStatistics: userSettings.interface.showStatistics
      });
      
      // Aplicar configurações carregadas
      setAppTheme(userSettings.language.theme);
    }
  }, [user?.id]);
  
  function handleSaveSettings() {
    if (!user?.id) return;
    
    try {
      // Criar objeto com todas as configurações atualizadas
      const updatedSettings: UserSettings = {
        language: {
          language,
          dateFormat,
          theme
        },
        interface: {
          fontSize,
          highContrast: false,
          compactMode: false,
          showStatistics: display.showStatistics,
          dashboardLayout: "default"
        },
        notifications: {
          email: true,
          browser: true,
          reportUpdates: true,
          systemUpdates: true,
          adminMessages: false,
        },
        privacy: {
          saveSearchHistory: true,
          anonymousStatistics: true,
          useVoiceRecording: true,
          showRecordingIndicator: true,
          dataRetentionPeriod: "90d"
        },
        sound: {
          systemSounds: true,
          notificationSounds: true,
          volume: 70,
          voiceFeedback: false
        },
        reports: {
          defaultTemplate: "padrao",
          autosaveInterval: "2m",
          includeTimestamps: true,
          spellcheck: true
        }
      };
      
      // Se for admin, incluir configurações de admin
      if (isAdmin) {
        updatedSettings.admin = {
          sessionTimeout: "30",
          logRetention: "90",
          maintenanceMode: false
        };
      }
      
      // Salvar configurações
      const success = saveUserSettings(user.id, updatedSettings);
      
      // Aplicar mudanças de tema e idioma
      setAppTheme(theme);
      applyTranslations(language);
      applyInterfaceSettings(updatedSettings.interface);
      
      if (success) {
        toast({
          title: "Configurações salvas",
          description: "As suas alterações foram guardadas com sucesso.",
          duration: 3000
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Ocorreu um erro ao guardar as suas configurações.",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar",
        description: String(error) || "Ocorreu um erro ao guardar as suas configurações.",
        variant: "destructive",
        duration: 3000
      });
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-6">
        <div className="container">
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
              <p className="text-muted-foreground">
                Gerencie as configurações da sua conta e da aplicação.
              </p>
            </div>
          </div>
          
          <div className="mt-6 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configure as opções básicas do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select 
                      value={language} 
                      onValueChange={setLanguage}
                    >
                      <SelectTrigger id="language" className="w-full">
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Idioma em que o sistema será exibido.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Formato de Data</Label>
                    <Select 
                      value={dateFormat} 
                      onValueChange={setDateFormat}
                    >
                      <SelectTrigger id="date-format" className="w-full">
                        <SelectValue placeholder="Selecione o formato de data" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/AAAA (25/03/2025)</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/AAAA (03/25/2025)</SelectItem>
                        <SelectItem value="yyyy-mm-dd">AAAA-MM-DD (2025-03-25)</SelectItem>
                        <SelectItem value="dd.mm.yyyy">DD.MM.AAAA (25.03.2025)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Como as datas serão exibidas no sistema.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <RadioGroup 
                      value={theme} 
                      onValueChange={(value) => setTheme(value as "light" | "dark" | "system")} 
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light" className="flex items-center">
                          <Sun className="h-4 w-4 mr-1" />
                          Claro
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark" className="flex items-center">
                          <Moon className="h-4 w-4 mr-1" />
                          Escuro
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="theme-system" />
                        <Label htmlFor="theme-system" className="flex items-center">
                          <Laptop className="h-4 w-4 mr-1" />
                          Sistema
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Interface</CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Tamanho da Fonte</Label>
                    <Select 
                      value={fontSize} 
                      onValueChange={setFontSize}
                    >
                      <SelectTrigger id="font-size" className="w-full">
                        <SelectValue placeholder="Selecione o tamanho da fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                        <SelectItem value="xl">Extra grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-statistics">Mostrar Estatísticas</Label>
                      <p className="text-sm text-muted-foreground">
                        Exibir estatísticas na página inicial.
                      </p>
                    </div>
                    <Switch 
                      id="show-statistics" 
                      checked={display.showStatistics}
                      onCheckedChange={(value) => setDisplay({ ...display, showStatistics: value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}