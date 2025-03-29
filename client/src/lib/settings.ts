import { toast } from "@/hooks/use-toast";

export interface LanguageSettings {
  language: string;
  dateFormat: string;
  theme: "light" | "dark" | "system";
}

export interface InterfaceSettings {
  fontSize: string;
  highContrast: boolean;
  compactMode: boolean;
  showStatistics: boolean;
  dashboardLayout: string;
}

export interface NotificationSettings {
  email: boolean;
  browser: boolean;
  reportUpdates: boolean;
  systemUpdates: boolean;
  adminMessages: boolean;
}

export interface PrivacySettings {
  saveSearchHistory: boolean;
  anonymousStatistics: boolean;
  useVoiceRecording: boolean;
  showRecordingIndicator: boolean;
  dataRetentionPeriod: string;
}

export interface SoundSettings {
  systemSounds: boolean;
  notificationSounds: boolean;
  volume: number;
  voiceFeedback?: boolean;
}

export interface ReportSettings {
  defaultTemplate: string;
  autosaveInterval: string;
  includeTimestamps: boolean;
  spellcheck: boolean;
}

export interface AdminSettings {
  sessionTimeout: string;
  logRetention: string;
  maintenanceMode: boolean;
}

export interface UserSettings {
  language: LanguageSettings;
  interface: InterfaceSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  sound: SoundSettings;
  reports: ReportSettings;
  admin?: AdminSettings;
}

// Definições de traduções para cada idioma
export const translations = {
  pt: {
    general: {
      save: "Guardar Alterações",
      settings: "Configurações",
      customize: "Personalize o sistema de acordo com as suas preferências.",
      generalSettings: "Configurações Gerais",
      generalDescription: "Configure as opções básicas do sistema.",
      language: "Idioma",
      languageDescription: "Idioma em que o sistema será exibido.",
      dateFormat: "Formato de Data",
      dateFormatDescription: "Como as datas serão exibidas no sistema.",
      theme: "Tema",
      light: "Claro",
      dark: "Escuro",
      system: "Sistema",
      fontSettings: "Configurações de Letra",
      fontSize: "Tamanho da Fonte",
      small: "Pequeno",
      medium: "Médio",
      large: "Grande",
      extraLarge: "Extra grande",
      notifications: "Notificações",
      notificationsSettings: "Configurações de Notificações",
      notificationsDescription: "Determine como e quando deseja receber notificações.",
      notificationChannels: "Canais de Notificação",
      emailNotifications: "Notificações por Email",
      emailDescription: "Receber notificações no seu email.",
      browserNotifications: "Notificações no Navegador",
      browserDescription: "Receber notificações no navegador enquanto utiliza o sistema.",
      notificationTypes: "Tipos de Notificação",
      reportUpdates: "Atualizações de Relatórios",
      reportUpdatesDescription: "Notificações sobre alterações nos relatórios médicos.",
      systemUpdates: "Atualizações do Sistema",
      systemUpdatesDescription: "Notificações sobre novas funcionalidades ou manutenções.",
      adminMessages: "Mensagens Administrativas",
      adminMessagesDescription: "Notificações de ações que requerem atenção administrativa.",
      visualSettings: "Configurações Visuais",
      primaryColor: "Cor Primária",
      accentColor: "Cor de Destaque",
      privacySettings: "Configurações de Privacidade",
      privacyDescription: "Gerencie suas configurações de privacidade e proteção de dados.",
      saveHistory: "Guardar Histórico de Pesquisa",
      saveHistoryDescription: "Guardar pesquisas recentes para acesso mais rápido.",
      anonymousStats: "Enviar Estatísticas Anónimas",
      anonymousStatsDescription: "Contribuir com dados anónimos para melhorar o sistema.",
      voiceSettings: "Configurações de Reconhecimento de Voz",
      allowVoiceRecording: "Permitir Gravação de Voz",
      voiceRecordingDescription: "Permitir que o sistema utilize reconhecimento de voz para transcrições.",
      showRecordingIndicator: "Mostrar Indicador de Gravação",
      recordingIndicatorDescription: "Mostrar um indicador visual quando a gravação estiver ativa.",
      retentionPeriod: "Período de Retenção de Dados (dias)",
      retentionPeriodDescription: "Por quanto tempo os dados pessoais serão armazenados.",
      exportData: "Exportar Meus Dados",
      deleteData: "Solicitar Exclusão de Dados",
      soundSettings: "Configurações de Som",
      soundDescription: "Ajuste as configurações de áudio do sistema.",
      systemSounds: "Sons do Sistema",
      systemSoundsDescription: "Ativar sons para ações do sistema.",
      notificationSounds: "Sons de Notificação",
      notificationSoundsDescription: "Ativar sons para alertas e notificações.",
      volume: "Volume",
      testAudio: "Testar Audio",
      reportSettings: "Configurações de Relatórios",
      reportsDescription: "Personalize como os relatórios são criados e gerenciados.",
      defaultTemplate: "Modelo Padrão",
      autosaveInterval: "Intervalo de Gravação Automática (minutos)",
      autosaveDescription: "Com que frequência os relatórios são guardados automaticamente durante a edição.",
      includeTimestamps: "Incluir Carimbos de Data/Hora",
      timestampsDescription: "Adicionar data e hora automáticas em alterações de relatórios.",
      spellcheck: "Verificação Ortográfica",
      spellcheckDescription: "Verificar automaticamente erros ortográficos nos relatórios.",
      exportOptions: "Opções de Exportação",
      exportFormat: "Formato de Exportação Padrão",
      includeSignature: "Incluir assinatura digital nos relatórios exportados"
    },
    tabs: {
      general: "Geral",
      interface: "Interface", 
      notifications: "Notificações",
      privacy: "Privacidade",
      sound: "Som",
      reports: "Relatórios",
    },
  },
  "pt-br": {
    general: {
      save: "Salvar Alterações",
      settings: "Configurações",
      customize: "Personalize o sistema de acordo com suas preferências.",
      generalSettings: "Configurações Gerais",
      generalDescription: "Configure as opções básicas do sistema.",
      language: "Idioma",
      languageDescription: "Idioma em que o sistema será exibido.",
      dateFormat: "Formato de Data",
      dateFormatDescription: "Como as datas serão exibidas no sistema.",
      theme: "Tema",
      light: "Claro",
      dark: "Escuro",
      system: "Sistema",
      fontSettings: "Configurações de Fonte",
      fontSize: "Tamanho da Fonte",
      small: "Pequeno",
      medium: "Médio",
      large: "Grande",
      extraLarge: "Extra grande",
      notifications: "Notificações",
      notificationsSettings: "Configurações de Notificações",
      notificationsDescription: "Determine como e quando deseja receber notificações.",
      notificationChannels: "Canais de Notificação",
      emailNotifications: "Notificações por Email",
      emailDescription: "Receber notificações no seu email.",
      browserNotifications: "Notificações no Navegador",
      browserDescription: "Receber notificações no navegador enquanto utiliza o sistema.",
      notificationTypes: "Tipos de Notificação",
      reportUpdates: "Atualizações de Relatórios",
      reportUpdatesDescription: "Notificações sobre alterações nos relatórios médicos.",
      systemUpdates: "Atualizações do Sistema",
      systemUpdatesDescription: "Notificações sobre novas funcionalidades ou manutenções.",
      adminMessages: "Mensagens Administrativas",
      adminMessagesDescription: "Notificações de ações que requerem atenção administrativa.",
      visualSettings: "Configurações Visuais",
      primaryColor: "Cor Primária",
      accentColor: "Cor de Destaque",
      privacySettings: "Configurações de Privacidade",
      privacyDescription: "Gerencie suas configurações de privacidade e proteção de dados.",
      saveHistory: "Salvar Histórico de Pesquisa",
      saveHistoryDescription: "Salvar pesquisas recentes para acesso mais rápido.",
      anonymousStats: "Enviar Estatísticas Anônimas",
      anonymousStatsDescription: "Contribuir com dados anônimos para melhorar o sistema.",
      voiceSettings: "Configurações de Reconhecimento de Voz",
      allowVoiceRecording: "Permitir Gravação de Voz",
      voiceRecordingDescription: "Permitir que o sistema utilize reconhecimento de voz para transcrições.",
      showRecordingIndicator: "Mostrar Indicador de Gravação",
      recordingIndicatorDescription: "Mostrar um indicador visual quando a gravação estiver ativa.",
      retentionPeriod: "Período de Retenção de Dados (dias)",
      retentionPeriodDescription: "Por quanto tempo os dados pessoais serão armazenados.",
      exportData: "Exportar Meus Dados",
      deleteData: "Solicitar Exclusão de Dados",
      soundSettings: "Configurações de Som",
      soundDescription: "Ajuste as configurações de áudio do sistema.",
      systemSounds: "Sons do Sistema",
      systemSoundsDescription: "Ativar sons para ações do sistema.",
      notificationSounds: "Sons de Notificação",
      notificationSoundsDescription: "Ativar sons para alertas e notificações.",
      volume: "Volume",
      testAudio: "Testar Audio",
      reportSettings: "Configurações de Relatórios",
      reportsDescription: "Personalize como os relatórios são criados e gerenciados.",
      defaultTemplate: "Modelo Padrão",
      autosaveInterval: "Intervalo de Salvamento Automático (minutos)",
      autosaveDescription: "Com que frequência os relatórios são salvos automaticamente durante a edição.",
      includeTimestamps: "Incluir Carimbos de Data/Hora",
      timestampsDescription: "Adicionar data e hora automáticas em alterações de relatórios.",
      spellcheck: "Verificação Ortográfica",
      spellcheckDescription: "Verificar automaticamente erros ortográficos nos relatórios.",
      exportOptions: "Opções de Exportação",
      exportFormat: "Formato de Exportação Padrão",
      includeSignature: "Incluir assinatura digital nos relatórios exportados"
    },
    tabs: {
      general: "Geral",
      interface: "Interface", 
      notifications: "Notificações",
      privacy: "Privacidade",
      sound: "Som",
      reports: "Relatórios",
    },
  },
  en: {
    general: {
      save: "Save Changes",
      settings: "Settings",
      customize: "Customize the system according to your preferences.",
      generalSettings: "General Settings",
      generalDescription: "Configure the basic system options.",
      language: "Language",
      languageDescription: "Language in which the system will be displayed.",
      dateFormat: "Date Format",
      dateFormatDescription: "How dates will be displayed in the system.",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      fontSettings: "Font Settings",
      fontSize: "Font Size",
      small: "Small",
      medium: "Medium",
      large: "Large",
      extraLarge: "Extra large",
      notifications: "Notifications",
      notificationsSettings: "Notification Settings",
      notificationsDescription: "Determine how and when you want to receive notifications.",
      notificationChannels: "Notification Channels",
      emailNotifications: "Email Notifications",
      emailDescription: "Receive notifications to your email.",
      browserNotifications: "Browser Notifications",
      browserDescription: "Receive notifications in the browser while using the system.",
      notificationTypes: "Notification Types",
      reportUpdates: "Report Updates",
      reportUpdatesDescription: "Notifications about changes in medical reports.",
      systemUpdates: "System Updates",
      systemUpdatesDescription: "Notifications about new features or maintenance.",
      adminMessages: "Administrative Messages",
      adminMessagesDescription: "Notifications of actions that require administrative attention.",
      visualSettings: "Visual Settings",
      primaryColor: "Primary Color",
      accentColor: "Accent Color",
      privacySettings: "Privacy Settings",
      privacyDescription: "Manage your privacy and data protection settings.",
      saveHistory: "Save Search History",
      saveHistoryDescription: "Save recent searches for quicker access.",
      anonymousStats: "Send Anonymous Statistics",
      anonymousStatsDescription: "Contribute anonymous data to improve the system.",
      voiceSettings: "Voice Recognition Settings",
      allowVoiceRecording: "Allow Voice Recording",
      voiceRecordingDescription: "Allow the system to use voice recognition for transcriptions.",
      showRecordingIndicator: "Show Recording Indicator",
      recordingIndicatorDescription: "Show a visual indicator when recording is active.",
      retentionPeriod: "Data Retention Period (days)",
      retentionPeriodDescription: "How long personal data will be stored.",
      exportData: "Export My Data",
      deleteData: "Request Data Deletion",
      soundSettings: "Sound Settings",
      soundDescription: "Adjust the audio settings of the system.",
      systemSounds: "System Sounds",
      systemSoundsDescription: "Enable sounds for system actions.",
      notificationSounds: "Notification Sounds",
      notificationSoundsDescription: "Enable sounds for alerts and notifications.",
      volume: "Volume",
      testAudio: "Test Audio",
      reportSettings: "Report Settings",
      reportsDescription: "Customize how reports are created and managed.",
      defaultTemplate: "Default Template",
      autosaveInterval: "Autosave Interval (minutes)",
      autosaveDescription: "How often reports are automatically saved during editing.",
      includeTimestamps: "Include Timestamps",
      timestampsDescription: "Add automatic date and time to report changes.",
      spellcheck: "Spell Check",
      spellcheckDescription: "Automatically check for spelling errors in reports.",
      exportOptions: "Export Options",
      exportFormat: "Default Export Format",
      includeSignature: "Include digital signature in exported reports"
    },
    tabs: {
      general: "General",
      interface: "Interface", 
      notifications: "Notifications",
      privacy: "Privacy",
      sound: "Sound",
      reports: "Reports",
    },
  },
  es: {
    general: {
      save: "Guardar Cambios",
      settings: "Configuración",
      customize: "Personalice el sistema según sus preferencias.",
      generalSettings: "Configuración General",
      generalDescription: "Configure las opciones básicas del sistema.",
      language: "Idioma",
      languageDescription: "Idioma en que se mostrará el sistema.",
      dateFormat: "Formato de Fecha",
      dateFormatDescription: "Cómo se mostrarán las fechas en el sistema.",
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
      fontSettings: "Configuración de Fuente",
      fontSize: "Tamaño de Fuente",
      small: "Pequeño",
      medium: "Mediano",
      large: "Grande",
      extraLarge: "Extra grande",
      notifications: "Notificaciones",
      notificationsSettings: "Configuración de Notificaciones",
      notificationsDescription: "Determine cómo y cuándo desea recibir notificaciones.",
      notificationChannels: "Canales de Notificación",
      emailNotifications: "Notificaciones por Email",
      emailDescription: "Recibir notificaciones en su correo electrónico.",
      browserNotifications: "Notificaciones del Navegador",
      browserDescription: "Recibir notificaciones en el navegador mientras usa el sistema.",
      notificationTypes: "Tipos de Notificación",
      reportUpdates: "Actualizaciones de Informes",
      reportUpdatesDescription: "Notificaciones sobre cambios en informes médicos.",
      systemUpdates: "Actualizaciones del Sistema",
      systemUpdatesDescription: "Notificaciones sobre nuevas funciones o mantenimiento.",
      adminMessages: "Mensajes Administrativos",
      adminMessagesDescription: "Notificaciones de acciones que requieren atención administrativa.",
      visualSettings: "Configuración Visual",
      primaryColor: "Color Primario",
      accentColor: "Color de Acento",
      privacySettings: "Configuración de Privacidad",
      privacyDescription: "Gestione su configuración de privacidad y protección de datos.",
      saveHistory: "Guardar Historial de Búsqueda",
      saveHistoryDescription: "Guardar búsquedas recientes para acceso más rápido.",
      anonymousStats: "Enviar Estadísticas Anónimas",
      anonymousStatsDescription: "Contribuir con datos anónimos para mejorar el sistema.",
      voiceSettings: "Configuración de Reconocimiento de Voz",
      allowVoiceRecording: "Permitir Grabación de Voz",
      voiceRecordingDescription: "Permitir que el sistema utilice reconocimiento de voz para transcripciones.",
      showRecordingIndicator: "Mostrar Indicador de Grabación",
      recordingIndicatorDescription: "Mostrar un indicador visual cuando la grabación está activa.",
      retentionPeriod: "Período de Retención de Datos (días)",
      retentionPeriodDescription: "Por cuánto tiempo se almacenarán los datos personales.",
      exportData: "Exportar Mis Datos",
      deleteData: "Solicitar Eliminación de Datos",
      soundSettings: "Configuración de Sonido",
      soundDescription: "Ajuste la configuración de audio del sistema.",
      systemSounds: "Sonidos del Sistema",
      systemSoundsDescription: "Activar sonidos para acciones del sistema.",
      notificationSounds: "Sonidos de Notificación",
      notificationSoundsDescription: "Activar sonidos para alertas y notificaciones.",
      volume: "Volumen",
      testAudio: "Probar Audio",
      reportSettings: "Configuración de Informes",
      reportsDescription: "Personalice cómo se crean y gestionan los informes.",
      defaultTemplate: "Plantilla Predeterminada",
      autosaveInterval: "Intervalo de Autoguardado (minutos)",
      autosaveDescription: "Con qué frecuencia se guardan automáticamente los informes durante la edición.",
      includeTimestamps: "Incluir Marcas de Tiempo",
      timestampsDescription: "Añadir fecha y hora automáticas a los cambios de informes.",
      spellcheck: "Corrector Ortográfico",
      spellcheckDescription: "Comprobar automáticamente errores ortográficos en los informes.",
      exportOptions: "Opciones de Exportación",
      exportFormat: "Formato de Exportación Predeterminado",
      includeSignature: "Incluir firma digital en los informes exportados"
    },
    tabs: {
      general: "General",
      interface: "Interfaz", 
      notifications: "Notificaciones",
      privacy: "Privacidad",
      sound: "Sonido",
      reports: "Informes",
    },
  },
  fr: {
    general: {
      save: "Enregistrer les Modifications",
      settings: "Paramètres",
      customize: "Personnalisez le système selon vos préférences.",
      generalSettings: "Paramètres Généraux",
      generalDescription: "Configurez les options de base du système.",
      language: "Langue",
      languageDescription: "Langue dans laquelle le système sera affiché.",
      dateFormat: "Format de Date",
      dateFormatDescription: "Comment les dates seront affichées dans le système.",
      theme: "Thème",
      light: "Clair",
      dark: "Sombre",
      system: "Système",
      fontSettings: "Paramètres de Police",
      fontSize: "Taille de Police",
      small: "Petit",
      medium: "Moyen",
      large: "Grand",
      extraLarge: "Très grand",
      notifications: "Notifications",
      notificationsSettings: "Paramètres de Notifications",
      notificationsDescription: "Déterminez comment et quand vous souhaitez recevoir des notifications.",
      notificationChannels: "Canaux de Notification",
      emailNotifications: "Notifications par Email",
      emailDescription: "Recevoir des notifications sur votre email.",
      browserNotifications: "Notifications du Navigateur",
      browserDescription: "Recevoir des notifications dans le navigateur pendant l'utilisation du système.",
      notificationTypes: "Types de Notification",
      reportUpdates: "Mises à Jour de Rapports",
      reportUpdatesDescription: "Notifications sur les modifications des rapports médicaux.",
      systemUpdates: "Mises à Jour du Système",
      systemUpdatesDescription: "Notifications sur les nouvelles fonctionnalités ou maintenance.",
      adminMessages: "Messages Administratifs",
      adminMessagesDescription: "Notifications d'actions nécessitant une attention administrative.",
      visualSettings: "Paramètres Visuels",
      primaryColor: "Couleur Primaire",
      accentColor: "Couleur d'Accentuation",
      privacySettings: "Paramètres de Confidentialité",
      privacyDescription: "Gérez vos paramètres de confidentialité et de protection des données.",
      saveHistory: "Enregistrer l'Historique de Recherche",
      saveHistoryDescription: "Enregistrer les recherches récentes pour un accès plus rapide.",
      anonymousStats: "Envoyer des Statistiques Anonymes",
      anonymousStatsDescription: "Contribuer avec des données anonymes pour améliorer le système.",
      voiceSettings: "Paramètres de Reconnaissance Vocale",
      allowVoiceRecording: "Autoriser l'Enregistrement Vocal",
      voiceRecordingDescription: "Permettre au système d'utiliser la reconnaissance vocale pour les transcriptions.",
      showRecordingIndicator: "Afficher l'Indicateur d'Enregistrement",
      recordingIndicatorDescription: "Afficher un indicateur visuel lorsque l'enregistrement est actif.",
      retentionPeriod: "Période de Rétention des Données (jours)",
      retentionPeriodDescription: "Durée pendant laquelle les données personnelles seront conservées.",
      exportData: "Exporter Mes Données",
      deleteData: "Demander la Suppression des Données",
      soundSettings: "Paramètres de Son",
      soundDescription: "Ajustez les paramètres audio du système.",
      systemSounds: "Sons du Système",
      systemSoundsDescription: "Activer les sons pour les actions du système.",
      notificationSounds: "Sons de Notification",
      notificationSoundsDescription: "Activer les sons pour les alertes et notifications.",
      volume: "Volume",
      testAudio: "Tester l'Audio",
      reportSettings: "Paramètres de Rapports",
      reportsDescription: "Personnalisez la façon dont les rapports sont créés et gérés.",
      defaultTemplate: "Modèle par Défaut",
      autosaveInterval: "Intervalle de Sauvegarde Automatique (minutes)",
      autosaveDescription: "À quelle fréquence les rapports sont automatiquement enregistrés pendant l'édition.",
      includeTimestamps: "Inclure des Horodatages",
      timestampsDescription: "Ajouter automatiquement la date et l'heure aux modifications des rapports.",
      spellcheck: "Vérification Orthographique",
      spellcheckDescription: "Vérifier automatiquement les fautes d'orthographe dans les rapports.",
      exportOptions: "Options d'Exportation",
      exportFormat: "Format d'Exportation par Défaut",
      includeSignature: "Inclure une signature numérique dans les rapports exportés"
    },
    tabs: {
      general: "Général",
      interface: "Interface", 
      notifications: "Notifications",
      privacy: "Confidentialité",
      sound: "Son",
      reports: "Rapports",
    },
  },
};

// Configurações padrão para novos usuários
const defaultSettings: UserSettings = {
  language: {
    language: "pt",
    dateFormat: "dd/mm/yyyy",
    theme: "system",
  },
  interface: {
    fontSize: "medium",
    highContrast: false,
    compactMode: false,
    showStatistics: true,
    dashboardLayout: "grid",
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
    dataRetentionPeriod: "90",
  },
  sound: {
    systemSounds: true,
    notificationSounds: true,
    volume: 70,
    voiceFeedback: true,
  },
  reports: {
    defaultTemplate: "medical",
    autosaveInterval: "5",
    includeTimestamps: true,
    spellcheck: true,
  },
};

// Recupera as configurações do usuário do localStorage
export function getUserSettings(userId: number): UserSettings {
  const storedSettings = localStorage.getItem(`user_settings_${userId}`);
  if (!storedSettings) {
    return defaultSettings;
  }
  
  try {
    const parsedSettings = JSON.parse(storedSettings);
    return {
      ...defaultSettings,
      ...parsedSettings,
    };
  } catch (error) {
    console.error("Erro ao carregar configurações do usuário:", error);
    return defaultSettings;
  }
}

// Salva as configurações do usuário no localStorage
export function saveUserSettings(userId: number, settings: UserSettings): boolean {
  try {
    localStorage.setItem(`user_settings_${userId}`, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Erro ao salvar configurações do usuário:", error);
    return false;
  }
}

// Obtém traduções baseadas no idioma atual
export function getTranslations(language: string = "pt") {
  return translations[language as keyof typeof translations] || translations.pt;
}

// Função para aplicar as traduções na interface do usuário
export function applyTranslations(language: string) {
  const selectedTranslations = getTranslations(language);
  
  // Define o atributo lang no documento HTML
  document.documentElement.setAttribute('lang', language);
  
  // Atualiza todos os textos da interface baseado no idioma selecionado
  if (language === "en") {
    // Textos principais
    document.querySelectorAll('h1, h2, h3, p, label, button').forEach(element => {
      // Ignora elementos dentro de componentes específicos (como select options)
      if (element.closest('[data-no-translate="true"]')) return;
      
      // Tradução de textos comuns
      switch(element.textContent?.trim()) {
        // Cabeçalhos
        case "Configurações": element.textContent = "Settings"; break;
        case "Personalize o sistema de acordo com as suas preferências.": element.textContent = "Customize the system according to your preferences."; break;
        case "Configurações Gerais": element.textContent = "General Settings"; break;
        case "Configure as opções básicas do sistema.": element.textContent = "Configure the basic system options."; break;
        case "Configurações de Interface": element.textContent = "Interface Settings"; break;
        case "Personalize a aparência do sistema.": element.textContent = "Customize the system appearance."; break;
        case "Configurações de Notificações": element.textContent = "Notification Settings"; break;
        case "Determine como e quando deseja receber notificações.": element.textContent = "Determine how and when you want to receive notifications."; break;
        case "Configurações de Privacidade": element.textContent = "Privacy Settings"; break;
        case "Gerencie suas configurações de privacidade e proteção de dados.": element.textContent = "Manage your privacy and data protection settings."; break;
        case "Configurações de Som": element.textContent = "Sound Settings"; break;
        case "Ajuste as configurações de áudio do sistema.": element.textContent = "Adjust the system's audio settings."; break;
        case "Configurações de Relatórios": element.textContent = "Report Settings"; break;
        case "Personalize como os relatórios são criados e gerenciados.": element.textContent = "Customize how reports are created and managed."; break;
        
        // Tabs
        case "Geral": element.textContent = "General"; break;
        case "Interface": element.textContent = "Interface"; break;
        case "Notificações": element.textContent = "Notifications"; break;
        case "Privacidade": element.textContent = "Privacy"; break;
        case "Som": element.textContent = "Sound"; break;
        case "Relatórios": element.textContent = "Reports"; break;
        
        // Campos
        case "Idioma": element.textContent = "Language"; break;
        case "Idioma em que o sistema será exibido.": element.textContent = "Language in which the system will be displayed."; break;
        case "Formato de Data": element.textContent = "Date Format"; break;
        case "Como as datas serão exibidas no sistema.": element.textContent = "How dates will be displayed in the system."; break;
        case "Tema": element.textContent = "Theme"; break;
        case "Claro": element.textContent = "Light"; break;
        case "Escuro": element.textContent = "Dark"; break;
        case "Sistema": element.textContent = "System"; break;
        case "Tamanho da Fonte": element.textContent = "Font Size"; break;
        case "Pequeno": element.textContent = "Small"; break;
        case "Médio": element.textContent = "Medium"; break;
        case "Grande": element.textContent = "Large"; break;
        case "Extra grande": element.textContent = "Extra Large"; break;
        case "Mostrar Estatísticas": element.textContent = "Show Statistics"; break;
        case "Exibir estatísticas na página inicial.": element.textContent = "Display statistics on the home page."; break;
        
        // Botões
        case "Guardar Alterações": element.textContent = "Save Changes"; break;
      }
    });
  } else {
    // Se for português, recarrega a página para redefinir todos os textos originais
    // Esta é uma solução mais simples, já que o padrão já é português
    window.location.reload();
  }
  
  // Atualiza os elementos com atributos de data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      // Navega pela estrutura de tradução usando a chave composta
      // ex: "settings.general.title" -> selectedTranslations.settings.general.title
      const value = key.split('.').reduce((obj, prop) => {
        return obj && obj[prop] ? obj[prop] : null;
      }, selectedTranslations as any);
      
      if (value) {
        // Atualiza o conteúdo do elemento
        element.textContent = value;
      }
    }
  });
  
  return selectedTranslations;
}

// Aplica as configurações de fonte e contraste
export function applyInterfaceSettings(settings: InterfaceSettings) {
  const root = document.documentElement;
  
  // Aplicar tamanho da fonte usando atributos de dados
  root.setAttribute('data-fontsize', settings.fontSize);
  
  // Aplicar contraste
  if (settings.highContrast) {
    document.body.classList.add("high-contrast");
  } else {
    document.body.classList.remove("high-contrast");
  }
}

// Aplica cores personalizadas
export function applyCustomColors(primaryColor: string, accentColor: string) {
  const root = document.documentElement;
  
  root.style.setProperty('--primary', primaryColor);
  root.style.setProperty('--primary-foreground', getContrastColor(primaryColor));
  
  root.style.setProperty('--secondary', accentColor);
  root.style.setProperty('--secondary-foreground', getContrastColor(accentColor));
  
  // Também atualiza a cor de destaque
  root.style.setProperty('--accent', accentColor);
  root.style.setProperty('--accent-foreground', getContrastColor(accentColor));
}

// Função para determinar a cor de texto com melhor contraste (preto ou branco)
function getContrastColor(hexColor: string): string {
  // Remove o # do início se existir
  const color = hexColor.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calcula a luminosidade percebida (fórmula YIQ)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Retorna preto se for claro, branco se for escuro
  return yiq >= 128 ? '#000000' : '#ffffff';
}

// Aplica configurações de notificação
export function requestNotificationPermission(callback: (permission: boolean) => void) {
  if (!("Notification" in window)) {
    toast({
      title: "Notificações não suportadas",
      description: "O seu navegador não suporta notificações de desktop.",
      variant: "destructive"
    });
    callback(false);
    return;
  }
  
  if (Notification.permission === "granted") {
    callback(true);
    return;
  }
  
  if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      callback(permission === "granted");
    });
  } else {
    toast({
      title: "Permissão necessária",
      description: "Permita notificações nas configurações do seu navegador para receber alertas.",
      variant: "destructive"
    });
    callback(false);
  }
}

// Formata datas de acordo com o formato selecionado
export function formatDate(date: Date, format: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case "dd/mm/yyyy":
      return `${day}/${month}/${year}`;
    case "mm/dd/yyyy":
      return `${month}/${day}/${year}`;
    case "yyyy-mm-dd":
      return `${year}-${month}-${day}`;
    case "dd.mm.yyyy":
      return `${day}.${month}.${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

// Reproduz um som de notificação
export function playNotificationSound(volume: number = 70) {
  const audio = new Audio("/notification.mp3");
  audio.volume = volume / 100;
  audio.play().catch(error => {
    console.error("Erro ao reproduzir som de notificação:", error);
  });
}

// Função para exibir notificação do sistema
export function showNotification(title: string, body: string, soundEnabled: boolean = true, volume: number = 70) {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico"
    });
    
    if (soundEnabled) {
      playNotificationSound(volume);
    }
    
    return notification;
  }
  
  return null;
}