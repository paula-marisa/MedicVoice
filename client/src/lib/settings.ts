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

// Definições padrão para Português de Portugal
const defaultTranslations = {
  pt: {
    general: {
      save: "Guardar Alterações",
      settings: "Configurações",
      customize: "Personalize o sistema de acordo com as suas preferências.",
      generalSettings: "Configurações Gerais",
      generalDescription: "Configure as opções básicas do sistema.",
    },
    tabs: {
      general: "Geral",
      interface: "Interface", 
      notifications: "Notificações",
      privacy: "Privacidade",
      sound: "Som",
      reports: "Relatórios",
    },
    // Mais traduções podem ser adicionadas conforme necessário
  },
  "pt-br": {
    general: {
      save: "Salvar Alterações",
      settings: "Configurações",
      customize: "Personalize o sistema de acordo com suas preferências.",
      generalSettings: "Configurações Gerais",
      generalDescription: "Configure as opções básicas do sistema.",
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
  return defaultTranslations[language as keyof typeof defaultTranslations] || defaultTranslations.pt;
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
  
  // Aplicar modo compacto
  if (settings.compactMode) {
    document.body.classList.add("compact-mode");
  } else {
    document.body.classList.remove("compact-mode");
  }
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