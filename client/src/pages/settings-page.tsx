import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        title: t('settings.saved'),
        description: t('settings.savedSuccess'),
      });
    } else {
      toast({
        title: t('settings.errorSaving'),
        description: t('settings.errorSavingDesc'),
        variant: "destructive",
      });
    }
  };
  
  if (!user) return null;
  
  const isAdmin = user.role === "admin";
  
  return (
    <div className="container py-6">
      <main>
        <div className="container max-w-7xl py-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('settings.profile_settings')}</h1>
              <p className="text-muted-foreground">
                {t('settings.customize')}
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-8">
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                {t('settings.general')}
              </TabsTrigger>
              <TabsTrigger value="interface">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {t('settings.interface')}
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                {t('settings.notifications')}
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Lock className="h-4 w-4 mr-2" />
                {t('settings.privacy')}
              </TabsTrigger>
              <TabsTrigger value="sound">
                <Volume2 className="h-4 w-4 mr-2" />
                {t('settings.sound')}
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                {t('settings.reports')}
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              {/* Configurações Gerais */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.general')}</CardTitle>
                    <CardDescription>
                      {t('settings.generalDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {/* Opção de idioma removida conforme solicitado */}
                      
                      <div className="space-y-2">
                        <Label htmlFor="date-format">{t('settings.dateFormat')}</Label>
                        <Select 
                          value={dateFormat} 
                          onValueChange={setDateFormat}
                        >
                          <SelectTrigger id="date-format" className="w-full">
                            <SelectValue placeholder={t('settings.dateFormat')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dd/mm/yyyy">DD/MM/AAAA (25/03/2025)</SelectItem>
                            <SelectItem value="mm/dd/yyyy">MM/DD/AAAA (03/25/2025)</SelectItem>
                            <SelectItem value="yyyy-mm-dd">AAAA-MM-DD (2025-03-25)</SelectItem>
                            <SelectItem value="dd.mm.yyyy">DD.MM.AAAA (25.03.2025)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.dateFormatDescription')}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('settings.theme')}</Label>
                        <RadioGroup 
                          value={theme} 
                          onValueChange={(value) => setTheme(value as "light" | "dark" | "system")} 
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="light" id="theme-light" />
                            <Label htmlFor="theme-light" className="flex items-center">
                              <Sun className="h-4 w-4 mr-1" />
                              {t('settings.light')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dark" id="theme-dark" />
                            <Label htmlFor="theme-dark" className="flex items-center">
                              <Moon className="h-4 w-4 mr-1" />
                              {t('settings.dark')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="system" id="theme-system" />
                            <Label htmlFor="theme-system" className="flex items-center">
                              <Laptop className="h-4 w-4 mr-1" />
                              {t('settings.system')}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {isAdmin && (
                        <div className="rounded-md border p-4 space-y-4">
                          <h3 className="font-medium">{t('settings.adminOptions')}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="session-timeout">{t('settings.sessionTimeout')}</Label>
                              <Input 
                                id="session-timeout" 
                                type="number" 
                                min="5" 
                                max="180" 
                                defaultValue="30"
                              />
                              <p className="text-xs text-muted-foreground">
                                {t('settings.sessionTimeoutDesc')}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="log-retention">{t('settings.logRetention')}</Label>
                              <Input 
                                id="log-retention" 
                                type="number" 
                                min="30" 
                                max="365" 
                                defaultValue="90"
                              />
                              <p className="text-xs text-muted-foreground">
                                {t('settings.logRetentionDesc')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="maintenance-mode" />
                            <Label htmlFor="maintenance-mode">{t('settings.maintenanceMode')}</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.maintenanceModeDesc')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveSettings}>{t('settings.saveChanges')}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Configurações de Interface */}
              <TabsContent value="interface">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.interfaceSettings')}</CardTitle>
                    <CardDescription>
                      {t('settings.interfaceDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="font-size">{t('settings.fontSize')}</Label>
                        <Select 
                          value={fontSize} 
                          onValueChange={setFontSize}
                        >
                          <SelectTrigger id="font-size" className="w-full">
                            <SelectValue placeholder={t('settings.fontSizePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">{t('settings.small')}</SelectItem>
                            <SelectItem value="medium">{t('settings.medium')}</SelectItem>
                            <SelectItem value="large">{t('settings.large')}</SelectItem>
                            <SelectItem value="xl">{t('settings.extraLarge')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Opção de alto contraste removida conforme solicitado */}
                      
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="show-statistics">{t('settings.showStatistics')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.showStatisticsDesc')}
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
                    <Button onClick={handleSaveSettings}>{t('settings.saveChanges')}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Configurações de Notificações */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.notificationSettings')}</CardTitle>
                    <CardDescription>
                      {t('settings.notificationDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-md font-medium">{t('settings.notificationChannels')}</h3>
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
                      
                      <h3 className="text-md font-medium">{t('settings.notificationTypes')}</h3>
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
                            <h3 className="font-medium">{t('settings.advancedSettings')}</h3>
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
                    <Button onClick={handleSaveSettings}>{t('settings.saveChanges')}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Configurações de Privacidade */}
              <TabsContent value="privacy">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.privacySettings')}</CardTitle>
                    <CardDescription>
                      {t('settings.privacyDesc')}
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
                      
                      <h3 className="text-md font-medium">{t('settings.voiceRecognitionSettings')}</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="voice-recording">{t('settings.allowVoiceRecording')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.allowVoiceRecordingDesc')}
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
                          <Label htmlFor="recording-indicator">{t('settings.showRecordingIndicator')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.showRecordingIndicatorDesc')}
                          </p>
                        </div>
                        <Switch 
                          id="recording-indicator" 
                          checked={privacy.showRecordingIndicator}
                          onCheckedChange={(value) => setPrivacy({ ...privacy, showRecordingIndicator: value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="retention-period">{t('settings.dataRetentionPeriod')}</Label>
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
                          {t('settings.dataRetentionPeriodDesc')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={() => {
                          toast({
                            title: t('settings.featureInDevelopment'),
                            description: t('settings.exportDataAvailableSoon')
                          });
                        }}>
                          {t('settings.exportMyData')}
                        </Button>
                        <Button variant="destructive" onClick={() => {
                          toast({
                            title: t('settings.featureInDevelopment'),
                            description: t('settings.deleteDataRequestAvailableSoon')
                          });
                        }}>
                          {t('settings.requestDataDeletion')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveSettings}>{t('settings.saveChanges')}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Configurações de Som */}
              <TabsContent value="sound">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.soundSettings')}</CardTitle>
                    <CardDescription>
                      {t('settings.soundDesc')}
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
                      
                      <h3 className="text-md font-medium">{t('settings.voiceRecognitionPreferences')}</h3>
                      <div className="space-y-2">
                        <Label htmlFor="voice-language">{t('settings.recognitionLanguage')}</Label>
                        <Select defaultValue="pt">
                          <SelectTrigger id="voice-language">
                            <SelectValue placeholder={t('settings.selectLanguagePlaceholder')} />
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
                          <Label htmlFor="voice-feedback">{t('settings.auditoryFeedback')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.auditoryFeedbackDesc')}
                          </p>
                        </div>
                        <Switch id="voice-feedback" defaultChecked />
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: t('settings.audioTest'),
                            description: t('settings.audioTestSuccess'),
                          });
                        }}
                      >
                        {t('settings.testAudio')}
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveSettings}>{t('settings.saveChanges')}</Button>
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
                    <Button onClick={handleSaveSettings}>{t('settings.saveChanges')}</Button>
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