import { useState, useEffect, useRef } from "react";
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
  Globe, 
  Bell, 
  Eye, 
  Lock, 
  Palette, 
  VolumeX, 
  Volume2, 
  FileText, 
  Calendar,
  Mail,
  Moon,
  Sun,
  Laptop,
  LayoutDashboard
} from "lucide-react";

import {
  getUserSettings,
  saveUserSettings,
  applyInterfaceSettings,
  applyCustomColors,
  getTranslations,
  applyTranslations,
  formatDate,
  translations,
  LanguageSettings,
  InterfaceSettings,
  NotificationSettings,
  PrivacySettings,
  SoundSettings,
  ReportSettings,
  AdminSettings,
  UserSettings
} from "@/lib/settings";
import { requestNotificationPermission, playNotificationSound } from "@/lib/settings";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [currentTranslations, setCurrentTranslations] = useState(getTranslations());
  
  // Configurações de Idioma
  const [language, setLanguage] = useState<string>("pt");
  const [dateFormat, setDateFormat] = useState<string>("dd/mm/yyyy");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  
  // Configurações de Interface
  const [fontSize, setFontSize] = useState<string>("medium");
  const [display, setDisplay] = useState({
    showStatistics: true
  });
  
  // Configurações de Notificações
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    reportUpdates: true,
    systemUpdates: true,
    adminMessages: true
  });
  
  // Configurações de Privacidade
  const [privacy, setPrivacy] = useState({
    saveSearchHistory: true,
    anonymousStatistics: true,
    useVoiceRecording: true,
    showRecordingIndicator: true,
    dataRetentionPeriod: "90d"
  });
  
  // Configurações de Som
  const [sound, setSound] = useState({
    systemSounds: true,
    notificationSounds: true,
    volume: 70,
    voiceFeedback: false
  });
  
  // Configurações de Relatórios
  const [reports, setReports] = useState({
    defaultTemplate: "padrao",
    autosaveInterval: "2m",
    includeTimestamps: true,
    spellcheck: true
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
      
      setNotifications(userSettings.notifications);
      setPrivacy(userSettings.privacy);
      setSound(userSettings.sound);
      setReports(userSettings.reports);
      
      // Aplicar configurações carregadas
      setAppTheme(userSettings.language.theme);
      applyTranslations(userSettings.language.language);
      
      // Atualizar o estado das traduções
      setCurrentTranslations(getTranslations(userSettings.language.language));
    }
  }, [user?.id]);
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState("general");
  
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
        notifications,
        privacy,
        sound,
        reports
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
          title: window.appTranslations?.settingsSaved || "Configurações salvas",
          description: window.appTranslations?.settingsSavedDesc || "As suas alterações foram guardadas com sucesso.",
          duration: 3000
        });
        
        // Tocar som de notificação para demonstrar as configurações de som
        if (sound.notificationSounds) {
          playNotificationSound(sound.volume);
        }
      } else {
        toast({
          title: window.appTranslations?.errorSaving || "Erro ao salvar",
          description: window.appTranslations?.errorSavingDesc || "Ocorreu um erro ao guardar as suas configurações.",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: window.appTranslations?.errorSaving || "Erro ao salvar",
        description: String(error) || "Ocorreu um erro ao guardar as suas configurações.",
        variant: "destructive",
        duration: 3000
      });
    }
  }
  
  async function handleRequestNotificationPermission() {
    requestNotificationPermission((permission) => {
      if (permission) {
        toast({
          title: "Permissão concedida",
          description: "Agora você receberá notificações do sistema.",
          duration: 3000
        });
      } else {
        toast({
          title: "Permissão negada",
          description: "Você não receberá notificações do navegador.",
          variant: "destructive",
          duration: 3000
        });
      }
    });
  }
  
  function handleTestNotificationSound() {
    playNotificationSound(sound.volume);
    toast({
      title: "Teste de som",
      description: "O som de notificação foi reproduzido.",
      duration: 3000
    });
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
            {/* Configurações Gerais */}
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
                      onValueChange={(value) => {
                        setLanguage(value);
                        
                        // Para evitar problemas de DOM, não aplicamos traduções ao mudar
                        // o idioma no select, mas apenas quando salvar as configurações
                        if (value === 'pt') {
                          setCurrentTranslations(getTranslations('pt'));
                        } else {
                          setCurrentTranslations(getTranslations('en'));
                        }
                      }}
                    >
                      <SelectTrigger id="language" className="w-full">
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent data-no-translate="true">
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
                  
                  {isAdmin && (
                    <div className="rounded-md border p-4 space-y-4">
                      <h3 className="font-medium">Opções Administrativas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="session-timeout">Tempo Limite de Sessão (minutos)</Label>
                          <Input 
                            id="session-timeout" 
                            type="number" 
                            min="5" 
                            max="180" 
                            defaultValue="30"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tempo de inatividade até encerramento automático da sessão.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="log-retention">Período de Retenção de Logs (dias)</Label>
                          <Input 
                            id="log-retention" 
                            type="number" 
                            min="30" 
                            max="365" 
                            defaultValue="90"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tempo de retenção dos logs de auditoria no sistema.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="maintenance-mode" />
                        <Label htmlFor="maintenance-mode">Ativar modo de manutenção</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O modo de manutenção bloqueará o acesso para todos os utilizadores, exceto administradores.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
              </CardFooter>
            </Card>
              
            {/* Configurações de Interface */}
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
                  
                  {isAdmin && (
                    <div className="rounded-md border p-4 space-y-4">
                      <h3 className="font-medium">Personalizações Visuais Avançadas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primary-color">Cor Primária</Label>
                          <div className="flex">
                            <Input 
                              id="primary-color" 
                              type="color" 
                              defaultValue="#0284c7"
                              className="w-16 h-8 p-1"
                            />
                            <Input 
                              type="text" 
                              value="#0284c7" 
                              className="ml-2"
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accent-color">Cor de Destaque</Label>
                          <div className="flex">
                            <Input 
                              id="accent-color" 
                              type="color" 
                              defaultValue="#0ea5e9"
                              className="w-16 h-8 p-1"
                            />
                            <Input 
                              type="text" 
                              value="#0ea5e9" 
                              className="ml-2"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
              </CardFooter>
            </Card>
            
            {/* Configurações de Notificações */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
                <CardDescription>
                  Determine como e quando deseja receber notificações.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Canais de Notificação</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações no seu email.
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={notifications.email}
                      onCheckedChange={(value) => setNotifications({ ...notifications, email: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="browser-notifications">Notificações no Navegador</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações no navegador enquanto utiliza o sistema.
                      </p>
                    </div>
                    <Switch 
                      id="browser-notifications" 
                      checked={notifications.browser}
                      onCheckedChange={(value) => setNotifications({ ...notifications, browser: value })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <h3 className="text-md font-medium">Tipos de Notificação</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="report-updates">Atualizações de Relatórios</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre alterações nos relatórios médicos.
                      </p>
                    </div>
                    <Switch 
                      id="report-updates" 
                      checked={notifications.reportUpdates}
                      onCheckedChange={(value) => setNotifications({ ...notifications, reportUpdates: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="system-updates">Atualizações do Sistema</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre novas funcionalidades ou manutenções.
                      </p>
                    </div>
                    <Switch 
                      id="system-updates" 
                      checked={notifications.systemUpdates}
                      onCheckedChange={(value) => setNotifications({ ...notifications, systemUpdates: value })}
                    />
                  </div>
                  
                  {isAdmin && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="admin-messages">Mensagens Administrativas</Label>
                          <p className="text-sm text-muted-foreground">
                            Notificações relacionadas a tarefas administrativas.
                          </p>
                        </div>
                        <Switch 
                          id="admin-messages" 
                          checked={notifications.adminMessages}
                          onCheckedChange={(value) => setNotifications({ ...notifications, adminMessages: value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={handleRequestNotificationPermission}
                    >
                      Permitir Notificações no Navegador
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique no botão acima para dar permissão para o sistema enviar notificações.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
              </CardFooter>
            </Card>
            
            {/* Configurações de Privacidade */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Privacidade</CardTitle>
                <CardDescription>
                  Controle como seus dados são utilizados pelo sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="search-history">Histórico de Pesquisa</Label>
                      <p className="text-sm text-muted-foreground">
                        Guardar histórico de pesquisas realizadas.
                      </p>
                    </div>
                    <Switch 
                      id="search-history" 
                      checked={privacy.saveSearchHistory}
                      onCheckedChange={(value) => setPrivacy({ ...privacy, saveSearchHistory: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="anonymous-stats">Estatísticas Anónimas</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar dados anónimos para melhorar o sistema.
                      </p>
                    </div>
                    <Switch 
                      id="anonymous-stats" 
                      checked={privacy.anonymousStatistics}
                      onCheckedChange={(value) => setPrivacy({ ...privacy, anonymousStatistics: value })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <h3 className="text-md font-medium">Configurações de Voz</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="voice-recording">Gravação de Voz</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir gravação de voz para transcrição e ditado.
                      </p>
                    </div>
                    <Switch 
                      id="voice-recording" 
                      checked={privacy.useVoiceRecording}
                      onCheckedChange={(value) => setPrivacy({ ...privacy, useVoiceRecording: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="recording-indicator">Indicador de Gravação</Label>
                      <p className="text-sm text-muted-foreground">
                        Mostrar indicador visual durante a gravação de áudio.
                      </p>
                    </div>
                    <Switch 
                      id="recording-indicator" 
                      checked={privacy.showRecordingIndicator}
                      onCheckedChange={(value) => setPrivacy({ ...privacy, showRecordingIndicator: value })}
                    />
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="data-retention">Período de Retenção de Dados</Label>
                    <Select 
                      value={privacy.dataRetentionPeriod} 
                      onValueChange={(value) => setPrivacy({ ...privacy, dataRetentionPeriod: value })}
                    >
                      <SelectTrigger id="data-retention" className="w-full">
                        <SelectValue placeholder="Selecione o período de retenção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30d">30 dias</SelectItem>
                        <SelectItem value="90d">90 dias</SelectItem>
                        <SelectItem value="180d">6 meses</SelectItem>
                        <SelectItem value="365d">1 ano</SelectItem>
                        <SelectItem value="730d">2 anos</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Define quanto tempo seus dados são mantidos no sistema.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
              </CardFooter>
            </Card>
            
            {/* Configurações de Som */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Som</CardTitle>
                <CardDescription>
                  Configure as opções de som do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="system-sounds">Sons do Sistema</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativar efeitos sonoros para interações do sistema.
                      </p>
                    </div>
                    <Switch 
                      id="system-sounds" 
                      checked={sound.systemSounds}
                      onCheckedChange={(value) => setSound({ ...sound, systemSounds: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notification-sounds">Sons de Notificação</Label>
                      <p className="text-sm text-muted-foreground">
                        Tocar som ao receber notificações.
                      </p>
                    </div>
                    <Switch 
                      id="notification-sounds" 
                      checked={sound.notificationSounds}
                      onCheckedChange={(value) => setSound({ ...sound, notificationSounds: value })}
                    />
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="volume">Volume ({sound.volume}%)</Label>
                    <div className="flex items-center space-x-2">
                      <VolumeX className="h-4 w-4" />
                      <input
                        id="volume"
                        type="range"
                        min="0"
                        max="100"
                        value={sound.volume}
                        onChange={(e) => setSound({ ...sound, volume: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <Volume2 className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="mt-2"
                    onClick={handleTestNotificationSound}
                  >
                    Testar Som de Notificação
                  </Button>

                  {/* Configuração adicionada para opção de feedback por voz */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="voice-feedback">Feedback por Voz</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativar resposta audível para comandos de voz.
                      </p>
                    </div>
                    <Switch 
                      id="voice-feedback" 
                      checked={sound.voiceFeedback}
                      onCheckedChange={(value) => setSound({ ...sound, voiceFeedback: value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
              </CardFooter>
            </Card>
            
            {/* Configurações de Relatórios */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Relatórios</CardTitle>
                <CardDescription>
                  Configure como os relatórios médicos são gerenciados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-template">Modelo Padrão</Label>
                    <Select 
                      value={reports.defaultTemplate} 
                      onValueChange={(value) => setReports({ ...reports, defaultTemplate: value })}
                    >
                      <SelectTrigger id="default-template" className="w-full">
                        <SelectValue placeholder="Selecione o modelo padrão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="padrao">Modelo Padrão</SelectItem>
                        <SelectItem value="simples">Modelo Simples</SelectItem>
                        <SelectItem value="detalhado">Modelo Detalhado</SelectItem>
                        <SelectItem value="especialidade">Por Especialidade</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Modelo utilizado ao criar novos relatórios.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="autosave-interval">Intervalo de Salvamento Automático</Label>
                    <Select 
                      value={reports.autosaveInterval} 
                      onValueChange={(value) => setReports({ ...reports, autosaveInterval: value })}
                    >
                      <SelectTrigger id="autosave-interval" className="w-full">
                        <SelectValue placeholder="Selecione o intervalo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30s">30 segundos</SelectItem>
                        <SelectItem value="1m">1 minuto</SelectItem>
                        <SelectItem value="2m">2 minutos</SelectItem>
                        <SelectItem value="5m">5 minutos</SelectItem>
                        <SelectItem value="10m">10 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Frequência com que os rascunhos são salvos automaticamente.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-timestamps">Incluir Carimbos de Data/Hora</Label>
                      <p className="text-sm text-muted-foreground">
                        Adicionar data e hora de criação/modificação aos relatórios.
                      </p>
                    </div>
                    <Switch 
                      id="include-timestamps" 
                      checked={reports.includeTimestamps}
                      onCheckedChange={(value) => setReports({ ...reports, includeTimestamps: value })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="spellcheck">Verificação Ortográfica</Label>
                      <p className="text-sm text-muted-foreground">
                        Verificar e corrigir erros de ortografia durante a escrita.
                      </p>
                    </div>
                    <Switch 
                      id="spellcheck" 
                      checked={reports.spellcheck}
                      onCheckedChange={(value) => setReports({ ...reports, spellcheck: value })}
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