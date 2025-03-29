import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Política de Privacidade</h1>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
      
      <div className="prose dark:prose-invert max-w-none">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-primary m-0">Conformidade com RGPD/LGPD</h2>
        </div>
        
        <p>
          O Assistente de Relatórios Médicos foi desenvolvido com foco na conformidade com o Regulamento Geral de Proteção de Dados (RGPD/GDPR) da União Europeia e a Lei Geral de Proteção de Dados (LGPD) do Brasil. Esta política de privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados.
        </p>
        
        <h3>1. Quais dados coletamos</h3>
        <p>
          Nossa aplicação coleta diferentes tipos de dados:
        </p>
        <ul>
          <li>
            <strong>Dados de conta e autenticação:</strong> Nome de usuário, senha (armazenada de forma segura e criptografada), nome completo, especialidade médica
          </li>
          <li>
            <strong>Dados de relatórios médicos:</strong> Informações inseridas manualmente ou por meio de ditado de voz sobre diagnósticos, tratamentos e observações de pacientes
          </li>
          <li>
            <strong>Dados de áudio temporários:</strong> Durante o uso das funcionalidades de reconhecimento de voz (ditado médico e escuta do paciente), processamos dados de áudio para transcrição, que são processados localmente no navegador
          </li>
          <li>
            <strong>Dados de auditoria:</strong> Para rastreabilidade e segurança, registramos informações sobre ações realizadas na plataforma, incluindo criação, atualização e exportação de relatórios, junto com endereço IP e timestamp
          </li>
        </ul>
        
        <h3>2. Como usamos seus dados</h3>
        <p>
          Utilizamos os dados coletados exclusivamente para:
        </p>
        <ul>
          <li>Fornecer as funcionalidades da plataforma, incluindo criação e gestão de relatórios médicos</li>
          <li>Facilitar o fluxo de trabalho médico com ferramentas de reconhecimento de voz e análise de sintomas</li>
          <li>Manter registros de auditoria para fins de segurança e conformidade</li>
          <li>Melhorar nossas funcionalidades com base em dados agregados e anonimizados de uso</li>
        </ul>
        
        <h3>3. Base legal para processamento</h3>
        <p>
          Processamos seus dados com base nas seguintes justificativas legais:
        </p>
        <ul>
          <li><strong>Consentimento:</strong> Para funcionalidades específicas como reconhecimento de voz, sempre solicitamos seu consentimento explícito antes de ativar a coleta</li>
          <li><strong>Execução de contrato:</strong> Para fornecer os serviços acordados em nossos termos de uso</li>
          <li><strong>Interesse legítimo:</strong> Para manter a segurança e funcionalidade da plataforma</li>
          <li><strong>Obrigação legal:</strong> Para manter registros conforme exigido por regulamentações de saúde</li>
        </ul>
        
        <h3>4. Retenção de dados</h3>
        <p>
          Mantemos seus dados apenas pelo tempo necessário:
        </p>
        <ul>
          <li><strong>Dados de conta:</strong> Mantidos enquanto sua conta estiver ativa</li>
          <li><strong>Relatórios médicos:</strong> Armazenados conforme períodos legais de retenção de prontuários médicos</li>
          <li><strong>Dados de transcrição temporários:</strong> Excluídos imediatamente após o processamento ou em até 24 horas</li>
          <li><strong>Logs de auditoria:</strong> Mantidos por 90 dias para fins de segurança e conformidade</li>
        </ul>
        
        <h3>5. Seus direitos como titular de dados</h3>
        <p>
          De acordo com o RGPD e LGPD, você tem os seguintes direitos:
        </p>
        <ul>
          <li><strong>Acesso:</strong> Solicitar quais dados pessoais temos sobre você</li>
          <li><strong>Retificação:</strong> Corrigir dados imprecisos</li>
          <li><strong>Exclusão:</strong> Solicitar a remoção de seus dados</li>
          <li><strong>Restrição:</strong> Limitar como usamos seus dados</li>
          <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
          <li><strong>Objeção:</strong> Contestar o processamento de seus dados</li>
          <li><strong>Retirada de consentimento:</strong> Revogar permissões previamente concedidas</li>
        </ul>
        <p>
          Para exercer qualquer desses direitos, entre em contato com nossa equipe através da página de suporte ou pelo e-mail privacy@exemplo.com.
        </p>
        
        <h3>6. Segurança de dados</h3>
        <p>
          Implementamos medidas técnicas e organizacionais para proteger seus dados:
        </p>
        <ul>
          <li>Criptografia de dados em repouso e em trânsito</li>
          <li>Controles de acesso estritos baseados em funções</li>
          <li>Logs de auditoria para todas as atividades de processamento de dados</li>
          <li>Processamento local sempre que possível</li>
          <li>Backup regular e procedimentos de recuperação de desastres</li>
        </ul>
        
        <h3>7. Compartilhamento de dados</h3>
        <p>
          Não compartilhamos seus dados com terceiros, exceto:
        </p>
        <ul>
          <li>Quando você solicita explicitamente a exportação para sistemas externos (como SClínico)</li>
          <li>Quando exigido por lei ou ordem judicial</li>
        </ul>
        <p>
          Em todos os casos de compartilhamento de dados, garantimos que as medidas adequadas de proteção sejam implementadas.
        </p>
        
        <h3>8. Atualizações desta política</h3>
        <p>
          Esta política de privacidade pode ser atualizada periodicamente para refletir alterações em nossas práticas. Notificaremos sobre alterações significativas via e-mail ou notificação na aplicação.
        </p>
        
        <div className="mt-8 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-PT')}
          </p>
        </div>
      </div>
    </div>
  );
}