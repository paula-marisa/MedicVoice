import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // Carrega as configurações do usuário do localStorage
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [language, setLanguage] = useState("pt");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    reportUpdates: true,
    systemUpdates: true,
    adminMessages: user?.role === "admin" ? true : false,
  });
  const [privacy, setPrivacy] = useState({
    saveSearchHistory: true,
    anonymousStatistics: true,
    useVoiceRecording: true, 
    showRecordingIndicator: true,
    dataRetentionPeriod: "90",
  });
  const [display, setDisplay] = useState({
    compactMode: false,
    showStatistics: true,
    dashboardLayout: "grid",
  });
  const [sound, setSound] = useState({
    systemSounds: true,
    notificationSounds: true,
    volume: 70,
  });
  const [reportSettings, setReportSettings] = useState({
    defaultTemplate: user?.role === "admin" ? "administrative" : "medical",
    autosaveInterval: "5",
    includeTimestamps: true,
    spellcheck: true,
  });
  
  // Carrega as configurações do usuário quando o componente montar
  useEffect(() => {
    if (user) {
      const userSettings = getUserSettings(user.id);
      setSettings(userSettings);
      
      // Atualiza os estados com as configurações do usuário
      setLanguage(userSettings.language.language);
      setDateFormat(userSettings.language.dateFormat);
      setTheme(userSettings.language.theme);
      setFontSize(userSettings.interface.fontSize);
      setHighContrast(userSettings.interface.highContrast);
      setDisplay(userSettings.interface);
      setNotifications(userSettings.notifications);
      setPrivacy(userSettings.privacy);
      setSound(userSettings.sound);
      setReportSettings(userSettings.reports);
      
      // Aplica as configurações de interface
      applyInterfaceSettings(userSettings.interface);
      
      // Aplica o tema
      setAppTheme(userSettings.language.theme);
    }
  }, [user]);
  
  // Função para salvar as configurações
  const handleSaveSettings = () => {
    if (!user || !settings) return;
    
    // Atualiza o objeto de configurações com os estados atuais
    const updatedSettings: UserSettings = {
      ...settings,
      language: {
        language,
        dateFormat,
        theme,
      },
      interface: {
        ...display,
        fontSize,
        highContrast,
      },
      notifications,
      privacy,
      sound,
      reports: reportSettings,
    };
    
    // Salva as configurações no localStorage
    const saved = saveUserSettings(user.id, updatedSettings);
    
    if (saved) {
      // Aplica as configurações imediatamente
      applyInterfaceSettings(updatedSettings.interface);
      setAppTheme(theme);
      
      // Exibe mensagem de sucesso
      toast({
        title: "Configurações guardadas",
        description: "As suas alterações foram guardadas com sucesso e aplicadas.",
      });
    } else {
      toast({
        title: "Erro ao guardar",
        description: "Ocorreu um erro ao guardar as configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  if (!user) return null;
  
  const isAdmin = user.role === "admin";
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="container max-w-7xl py-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
              <p className="text-muted-foreground">
                Personalize o sistema de acordo com as suas preferências.
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-8">
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="interface">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Interface
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Lock className="h-4 w-4 mr-2" />
                Privacidade
              </TabsTrigger>
              <TabsTrigger value="sound">
                <Volume2 className="h-4 w-4 mr-2" />
                Som
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                Relatórios
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              {/* Configurações Gerais */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                    <CardDescription>
                      Configure as opções básicas do sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {/* Opção de idioma removida conforme solicitado */}
                      
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
              </TabsContent>
              
              {/* Configurações de Interface */}
              <TabsContent value="interface">
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
                      
                      {/* Opção de alto contraste removida conforme solicitado */}
                      
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
              </TabsContent>
              
              {/* Configurações de Notificações */}
              <TabsContent value="notifications">
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
                                Notificações de ações que requerem atenção administrativa.
                              </p>
                            </div>
                            <Switch 
                              id="admin-messages" 
                              checked={notifications.adminMessages}
                              onCheckedChange={(value) => setNotifications({ ...notifications, adminMessages: value })}
                            />
                          </div>
                          
                          <div className="rounded-md border p-4 space-y-4">
                            <h3 className="font-medium">Configurações Avançadas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="notification-schedule">Horário de Notificações</Label>
                                <Select defaultValue="always">
                                  <SelectTrigger id="notification-schedule">
                                    <SelectValue placeholder="Selecione o horário" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="always">Sempre</SelectItem>
                                    <SelectItem value="working-hours">Horário de Trabalho (9h-18h)</SelectItem>
                                    <SelectItem value="custom">Personalizado</SelectItem>
                                    <SelectItem value="none">Nunca</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="notification-frequency">Frequência</Label>
                                <Select defaultValue="immediate">
                                  <SelectTrigger id="notification-frequency">
                                    <SelectValue placeholder="Selecione a frequência" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="immediate">Imediata</SelectItem>
                                    <SelectItem value="hourly">Resumo por Hora</SelectItem>
                                    <SelectItem value="daily">Resumo Diário</SelectItem>
                                    <SelectItem value="weekly">Resumo Semanal</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Configurações de Privacidade */}
              <TabsContent value="privacy">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Privacidade</CardTitle>
                    <CardDescription>
                      Gerencie suas configurações de privacidade e proteção de dados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="save-search-history">Guardar Histórico de Pesquisa</Label>
                          <p className="text-sm text-muted-foreground">
                            Guardar pesquisas recentes para acesso mais rápido.
                          </p>
                        </div>
                        <Switch 
                          id="save-search-history" 
                          checked={privacy.saveSearchHistory}
                          onCheckedChange={(value) => setPrivacy({ ...privacy, saveSearchHistory: value })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="anonymous-statistics">Enviar Estatísticas Anónimas</Label>
                          <p className="text-sm text-muted-foreground">
                            Contribuir com dados anónimos para melhorar o sistema.
                          </p>
                        </div>
                        <Switch 
                          id="anonymous-statistics" 
                          checked={privacy.anonymousStatistics}
                          onCheckedChange={(value) => setPrivacy({ ...privacy, anonymousStatistics: value })}
                        />
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-md font-medium">Configurações de Reconhecimento de Voz</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="voice-recording">Permitir Gravação de Voz</Label>
                          <p className="text-sm text-muted-foreground">
                            Permitir que o sistema utilize reconhecimento de voz para transcrições.
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
                          <Label htmlFor="recording-indicator">Mostrar Indicador de Gravação</Label>
                          <p className="text-sm text-muted-foreground">
                            Mostrar um indicador visual quando a gravação estiver ativa.
                          </p>
                        </div>
                        <Switch 
                          id="recording-indicator" 
                          checked={privacy.showRecordingIndicator}
                          onCheckedChange={(value) => setPrivacy({ ...privacy, showRecordingIndicator: value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="retention-period">Período de Retenção de Dados (dias)</Label>
                        <Input 
                          id="retention-period" 
                          type="number" 
                          value={privacy.dataRetentionPeriod}
                          onChange={(e) => setPrivacy({ 
                            ...privacy, 
                            dataRetentionPeriod: e.target.value 
                          })}
                          min="30" 
                          max="365"
                        />
                        <p className="text-sm text-muted-foreground">
                          Por quanto tempo os dados pessoais serão armazenados antes de serem automaticamente excluídos (conforme LGPD/GDPR).
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={() => {
                          toast({
                            title: "Função em desenvolvimento",
                            description: "A exportação de dados pessoais estará disponível em breve."
                          });
                        }}>
                          Exportar Meus Dados
                        </Button>
                        <Button variant="destructive" onClick={() => {
                          toast({
                            title: "Função em desenvolvimento",
                            description: "A solicitação de exclusão de dados estará disponível em breve."
                          });
                        }}>
                          Solicitar Exclusão de Dados
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Configurações de Som */}
              <TabsContent value="sound">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Som</CardTitle>
                    <CardDescription>
                      Ajuste as configurações de áudio do sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="system-sounds">Sons do Sistema</Label>
                          <p className="text-sm text-muted-foreground">
                            Ativar sons para ações do sistema.
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
                            Ativar sons para alertas e notificações.
                          </p>
                        </div>
                        <Switch 
                          id="notification-sounds" 
                          checked={sound.notificationSounds}
                          onCheckedChange={(value) => setSound({ ...sound, notificationSounds: value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="volume-slider">Volume</Label>
                          <span className="text-sm text-muted-foreground">{sound.volume}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <VolumeX className="h-4 w-4 text-muted-foreground" />
                          <input
                            id="volume-slider"
                            type="range"
                            min="0"
                            max="100"
                            value={sound.volume}
                            onChange={(e) => setSound({ ...sound, volume: parseInt(e.target.value) })}
                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                          />
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-md font-medium">Preferências de Reconhecimento de Voz</h3>
                      <div className="space-y-2">
                        <Label htmlFor="voice-language">Idioma de Reconhecimento</Label>
                        <Select defaultValue="pt">
                          <SelectTrigger id="voice-language">
                            <SelectValue placeholder="Selecione o idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt">Português (Portugal)</SelectItem>
                            <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="voice-feedback">Feedback Auditivo</Label>
                          <p className="text-sm text-muted-foreground">
                            Fornecer feedback sonoro durante o reconhecimento de voz.
                          </p>
                        </div>
                        <Switch id="voice-feedback" defaultChecked />
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Teste de Áudio",
                            description: "Se ouviu um som, o áudio está a funcionar corretamente.",
                          });
                        }}
                      >
                        Testar Audio
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Configurações de Relatórios */}
              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Relatórios</CardTitle>
                    <CardDescription>
                      Personalize como os relatórios são criados e gerenciados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="default-template">Modelo Padrão</Label>
                        <Select 
                          value={reportSettings.defaultTemplate} 
                          onValueChange={(value) => setReportSettings({ ...reportSettings, defaultTemplate: value })}
                        >
                          <SelectTrigger id="default-template">
                            <SelectValue placeholder="Selecione o modelo padrão" />
                          </SelectTrigger>
                          <SelectContent>
                            {isAdmin ? (
                              <>
                                <SelectItem value="administrative">Administrativo</SelectItem>
                                <SelectItem value="management">Gestão</SelectItem>
                                <SelectItem value="general">Geral</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="medical">Médico</SelectItem>
                                <SelectItem value="consultation">Consulta</SelectItem>
                                <SelectItem value="examination">Exame</SelectItem>
                                <SelectItem value="discharge">Alta</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="autosave-interval">Intervalo de Gravação Automática (minutos)</Label>
                        <Input 
                          id="autosave-interval" 
                          type="number" 
                          value={reportSettings.autosaveInterval}
                          onChange={(e) => setReportSettings({ 
                            ...reportSettings, 
                            autosaveInterval: e.target.value 
                          })}
                          min="1" 
                          max="60"
                        />
                        <p className="text-sm text-muted-foreground">
                          Com que frequência os relatórios são guardados automaticamente durante a edição.
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="include-timestamps">Incluir Carimbos de Data/Hora</Label>
                          <p className="text-sm text-muted-foreground">
                            Adicionar data e hora automáticas em alterações de relatórios.
                          </p>
                        </div>
                        <Switch 
                          id="include-timestamps" 
                          checked={reportSettings.includeTimestamps}
                          onCheckedChange={(value) => setReportSettings({ ...reportSettings, includeTimestamps: value })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="spellcheck">Verificação Ortográfica</Label>
                          <p className="text-sm text-muted-foreground">
                            Verificar automaticamente erros ortográficos nos relatórios.
                          </p>
                        </div>
                        <Switch 
                          id="spellcheck" 
                          checked={reportSettings.spellcheck}
                          onCheckedChange={(value) => setReportSettings({ ...reportSettings, spellcheck: value })}
                        />
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-md font-medium">Opções de Exportação</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="default-export">Formato de Exportação Padrão</Label>
                          <Select defaultValue="pdf">
                            <SelectTrigger id="default-export">
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="docx">Word (DOCX)</SelectItem>
                              <SelectItem value="html">HTML</SelectItem>
                              <SelectItem value="txt">Texto Simples (TXT)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {isAdmin && (
                          <div className="space-y-2">
                            <Label htmlFor="export-header">Cabeçalho Institucional</Label>
                            <Select defaultValue="hospital">
                              <SelectTrigger id="export-header">
                                <SelectValue placeholder="Selecione o cabeçalho" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hospital">Hospital Central</SelectItem>
                                <SelectItem value="clinic">Clínica Especializada</SelectItem>
                                <SelectItem value="department">Departamento</SelectItem>
                                <SelectItem value="none">Nenhum</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="include-signature" defaultChecked />
                        <Label htmlFor="include-signature">Incluir assinatura digital nos relatórios exportados</Label>
                      </div>
                      
                      {isAdmin && (
                        <div className="rounded-md border p-4 space-y-4">
                          <h3 className="font-medium">Configurações Administrativas de Relatórios</h3>
                          <div className="space-y-2">
                            <Label htmlFor="report-naming">Convenção de Nomenclatura</Label>
                            <Select defaultValue="date-patient-type">
                              <SelectTrigger id="report-naming">
                                <SelectValue placeholder="Selecione o formato" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="date-patient-type">Data-Utente-Tipo</SelectItem>
                                <SelectItem value="patient-date-type">Utente-Data-Tipo</SelectItem>
                                <SelectItem value="type-patient-date">Tipo-Utente-Data</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="report-workflow">Fluxo de Trabalho de Relatórios</Label>
                            <Select defaultValue="draft-review-final">
                              <SelectTrigger id="report-workflow">
                                <SelectValue placeholder="Selecione o fluxo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft-review-final">Rascunho-Revisão-Final</SelectItem>
                                <SelectItem value="draft-final">Rascunho-Final</SelectItem>
                                <SelectItem value="simple">Simples (Sem Etapas)</SelectItem>
                                <SelectItem value="advanced">Avançado (Personalizado)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="require-approval" defaultChecked />
                            <Label htmlFor="require-approval">Exigir aprovação para relatórios finais</Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveSettings}>Guardar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}