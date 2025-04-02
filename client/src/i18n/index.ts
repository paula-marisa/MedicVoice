import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Configuração de i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: {
          // Layout e navegação
          "navigation": {
            "home": "Início",
            "profile": "Perfil",
            "reports": "Relatórios",
            "admin": "Administração",
            "settings": "Configurações",
            "logout": "Sair",
            "login": "Entrar"
          },
          
          // Autenticação
          "auth": {
            "login": "Entrar",
            "logout": "Sair",
            "username": "Nome de utilizador",
            "password": "Palavra-passe",
            "login_error": "Nome de utilizador ou palavra-passe incorretos",
            "forgot_password": "Esqueceu a palavra-passe?",
            "request_access": "Solicitar acesso",
            "not_registered": "Não tem uma conta?",
            "register": "Registrar",
            "login_description": "Para efetuar o login é necessário introduzir as suas credencias, caso não as tenha pode solicitar acesso",
            "click_here": "clicando aqui"
          },
          
          // Relatórios médicos
          "reports": {
            "my_reports": "Meus Relatórios",
            "new_report": "Novo Relatório",
            "edit_report": "Editar Relatório",
            "report_details": "Detalhes do Relatório",
            "report_history": "Histórico do Relatório",
            "patient_name": "Nome do Utente",
            "process_number": "Nº Processo",
            "diagnosis": "Diagnóstico",
            "symptoms": "Sintomas",
            "treatment": "Tratamento",
            "observations": "Observações",
            "created_at": "Criado em",
            "updated_at": "Atualizado em",
            "status": "Estado",
            "search": "Pesquisar por utente ou número de processo",
            "delete_report": "Eliminar Relatório",
            "delete_confirmation": "Esta ação não pode ser revertida. O relatório será marcado como eliminado e ficará visível apenas para administradores.",
            "delete_reason": "Motivo da eliminação",
            "delete_reason_required": "É necessário fornecer um motivo para a eliminação do relatório",
            "deletion_in_progress": "A eliminar...",
            "delete": "Eliminar",
            "cancel": "Cancelar",
            "save": "Salvar",
            "save_draft": "Salvar Rascunho",
            "submit": "Enviar"
          },
          
          // Estados dos relatórios
          "status": {
            "draft": "Rascunho",
            "in_progress": "Em Progresso",
            "submitted": "Enviado",
            "archived": "Arquivado",
            "deleted": "Eliminado"
          },
          
          // Paciente/Utente
          "patient": {
            "details": "Detalhes do Utente",
            "name": "Nome",
            "age": "Idade",
            "gender": "Género",
            "contact": "Contacto",
            "health_number": "Número de Saúde",
            "process_number": "Número de Processo",
            "history": "Histórico do Utente"
          },
          
          // Histórico de Alterações
          "audit": {
            "changes": "Alterações",
            "change_history": "Histórico de Alterações",
            "field": "Campo",
            "old_value": "Valor Original",
            "new_value": "Novo Valor",
            "changed_by": "Alterado por",
            "date": "Data",
            "view_change": "Ver Alteração",
            "view_before_after": "Ver antes/depois",
            "no_changes": "Nenhuma alteração registrada para este relatório.",
            "details": "Detalhes",
            "version_details": "Detalhes das Versões",
            "additional_details": "Detalhes adicionais",
            "deletion_reason": "Motivo da eliminação"
          },
          
          // Administração
          "admin": {
            "users": "Utilizadores",
            "reports": "Relatórios",
            "access_requests": "Solicitações de Acesso",
            "audit_logs": "Registros de Auditoria",
            "system_settings": "Configurações do Sistema",
            "approve": "Aprovar",
            "reject": "Rejeitar",
            "pending": "Pendentes",
            "approved": "Aprovados",
            "rejected": "Rejeitados",
            "activate_user": "Ativar Utilizador",
            "deactivate_user": "Desativar Utilizador",
            "reset_password": "Redefinir Palavra-passe",
            "users_role_doctor": "Médico",
            "users_role_nurse": "Enfermeiro",
            "users_role_admin": "Administrador",
            "description": "Este é o painel de administrador do sistema de relatórios médicos. Aqui, podes gerir utilizadores, consultar relatórios médicos e acompanhar todas as atividades do sistema.",
            "register_users": "Registar Utilizadores",
            "register_users_description": "Para registar novos utilizadores, faça login como administrador e vá à seção 'Registar Utilizadores'."
          },
          
          // Configurações
          "settings": {
            "language": "Idioma",
            "portuguese": "Português",
            "english": "Inglês",
            "theme": "Tema",
            "light": "Claro",
            "dark": "Escuro",
            "system": "Sistema",
            "notifications": "Notificações",
            "profile_settings": "Configurações de Perfil",
            "privacy": "Privacidade",
            "security": "Segurança",
            "language_selection": "Seleção de Idioma"
          },
          
          // Mensagens gerais
          "messages": {
            "success": "Sucesso",
            "error": "Erro",
            "warning": "Aviso",
            "info": "Informação",
            "loading": "Carregando...",
            "saved": "Salvo com sucesso",
            "deleted": "Eliminado com sucesso",
            "updated": "Atualizado com sucesso",
            "confirm": "Confirmar",
            "cancel": "Cancelar",
            "no_data": "Nenhum dado encontrado",
            "required_field": "Este campo é obrigatório",
            "processing": "A processar...",
            "not_found": "Página não encontrada",
            "welcome": "Bem-vindo"
          },
          
          // App
          "app": {
            "title": "Assistente de Relatórios Médicos"
          },
          
          // Footer
          "footer": {
            "app_name": "Assistente de Relatórios Médicos",
            "all_rights_reserved": "Todos os direitos reservados",
            "gdpr_compliance": "Em conformidade com o RGPD",
            "dark_mode": "Modo Escuro"
          },
          
          // Reconhecimento de voz
          "voice": {
            "start_listening": "Iniciar Escuta",
            "stop_listening": "Parar Escuta",
            "listening": "Ouvindo...",
            "not_listening": "Não está ouvindo",
            "dictation": "Ditado",
            "symptoms_analysis": "Análise de Sintomas",
            "transcript": "Transcrição",
            "recording_time": "Tempo de gravação",
            "field_selection": "Selecionar campo para inserção",
            "privacy_note": "A gravação de áudio é processada localmente no seu navegador."
          },
          
          // Privacidade e Termos
          "privacy": {
            "consent": "Consentimento de Privacidade",
            "terms": "Termos de Uso",
            "data_processing": "Processamento de Dados",
            "retention": "Período de Retenção",
            "agree": "Concordo",
            "disagree": "Não Concordo",
            "policy": "Política de Privacidade"
          },
          
          // Exportação
          "export": {
            "export_as": "Exportar como",
            "pdf": "PDF",
            "sclinico": "SClínico",
            "export_success": "Exportado com sucesso",
            "export_error": "Erro na exportação"
          }
        }
      },
      en: {
        translation: {
          // Layout and navigation
          "navigation": {
            "home": "Home",
            "profile": "Profile",
            "reports": "Reports",
            "admin": "Administration",
            "settings": "Settings",
            "logout": "Logout",
            "login": "Login"
          },
          
          // Authentication
          "auth": {
            "login": "Login",
            "logout": "Logout",
            "username": "Username",
            "password": "Password",
            "login_error": "Incorrect username or password",
            "forgot_password": "Forgot password?",
            "request_access": "Request access",
            "not_registered": "Don't have an account?",
            "register": "Register",
            "login_description": "To login, please enter your credentials. If you don't have an account, you can request access",
            "click_here": "click here"
          },
          
          // Medical reports
          "reports": {
            "my_reports": "My Reports",
            "new_report": "New Report",
            "edit_report": "Edit Report",
            "report_details": "Report Details",
            "report_history": "Report History",
            "patient_name": "Patient Name",
            "process_number": "Process #",
            "diagnosis": "Diagnosis",
            "symptoms": "Symptoms",
            "treatment": "Treatment",
            "observations": "Observations",
            "created_at": "Created at",
            "updated_at": "Updated at",
            "status": "Status",
            "search": "Search by patient or process number",
            "delete_report": "Delete Report",
            "delete_confirmation": "This action cannot be undone. The report will be marked as deleted and will only be visible to administrators.",
            "delete_reason": "Reason for deletion",
            "delete_reason_required": "You must provide a reason for deleting the report",
            "deletion_in_progress": "Deleting...",
            "delete": "Delete",
            "cancel": "Cancel",
            "save": "Save",
            "save_draft": "Save Draft",
            "submit": "Submit"
          },
          
          // Report statuses
          "status": {
            "draft": "Draft",
            "in_progress": "In Progress",
            "submitted": "Submitted",
            "archived": "Archived",
            "deleted": "Deleted"
          },
          
          // Patient
          "patient": {
            "details": "Patient Details",
            "name": "Name",
            "age": "Age",
            "gender": "Gender",
            "contact": "Contact",
            "health_number": "Health Number",
            "process_number": "Process Number",
            "history": "Patient History"
          },
          
          // Change History
          "audit": {
            "changes": "Changes",
            "change_history": "Change History",
            "field": "Field",
            "old_value": "Original Value",
            "new_value": "New Value",
            "changed_by": "Changed by",
            "date": "Date",
            "view_change": "View Change",
            "view_before_after": "View before/after",
            "no_changes": "No changes recorded for this report.",
            "details": "Details",
            "version_details": "Version Details",
            "additional_details": "Additional details",
            "deletion_reason": "Reason for deletion"
          },
          
          // Administration
          "admin": {
            "users": "Users",
            "reports": "Reports",
            "access_requests": "Access Requests",
            "audit_logs": "Audit Logs",
            "system_settings": "System Settings",
            "approve": "Approve",
            "reject": "Reject",
            "pending": "Pending",
            "approved": "Approved",
            "rejected": "Rejected",
            "activate_user": "Activate User",
            "deactivate_user": "Deactivate User",
            "reset_password": "Reset Password",
            "users_role_doctor": "Doctor",
            "users_role_nurse": "Nurse",
            "users_role_admin": "Administrator",
            "description": "This is the administration panel for the medical reports system. Here, you can manage users, view medical reports, and monitor all system activities.",
            "register_users": "Register Users",
            "register_users_description": "To register new users, please login as administrator and go to the 'Register Users' section."
          },
          
          // Settings
          "settings": {
            "language": "Language",
            "portuguese": "Portuguese",
            "english": "English",
            "theme": "Theme",
            "light": "Light",
            "dark": "Dark",
            "system": "System",
            "notifications": "Notifications",
            "profile_settings": "Profile Settings",
            "privacy": "Privacy",
            "security": "Security",
            "language_selection": "Language Selection"
          },
          
          // General messages
          "messages": {
            "success": "Success",
            "error": "Error",
            "warning": "Warning",
            "info": "Information",
            "loading": "Loading...",
            "saved": "Saved successfully",
            "deleted": "Deleted successfully",
            "updated": "Updated successfully",
            "confirm": "Confirm",
            "cancel": "Cancel",
            "no_data": "No data found",
            "required_field": "This field is required",
            "processing": "Processing...",
            "not_found": "Page not found",
            "welcome": "Welcome"
          },
          
          // App
          "app": {
            "title": "Medical Reports Assistant"
          },
          
          // Footer
          "footer": {
            "app_name": "Medical Reports Assistant",
            "all_rights_reserved": "All rights reserved",
            "gdpr_compliance": "GDPR Compliant",
            "dark_mode": "Dark Mode"
          },
          
          // Voice recognition
          "voice": {
            "start_listening": "Start Listening",
            "stop_listening": "Stop Listening",
            "listening": "Listening...",
            "not_listening": "Not listening",
            "dictation": "Dictation",
            "symptoms_analysis": "Symptoms Analysis",
            "transcript": "Transcript",
            "recording_time": "Recording time",
            "field_selection": "Select field for insertion",
            "privacy_note": "Audio recording is processed locally in your browser."
          },
          
          // Privacy and Terms
          "privacy": {
            "consent": "Privacy Consent",
            "terms": "Terms of Use",
            "data_processing": "Data Processing",
            "retention": "Retention Period",
            "agree": "I Agree",
            "disagree": "I Disagree",
            "policy": "Privacy Policy"
          },
          
          // Export
          "export": {
            "export_as": "Export as",
            "pdf": "PDF",
            "sclinico": "SClinical",
            "export_success": "Exported successfully",
            "export_error": "Export error"
          }
        }
      }
    },
    lng: localStorage.getItem('language') || 'pt', // Default language is Portuguese
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false // Not needed for React
    }
  });

export default i18n;