import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-1 mb-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-PT')}
        </p>
      </div>

      <div className="space-y-8 text-sm leading-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
          <p className="mb-3">
            Esta Política de Privacidade descreve como o Assistente de Relatórios Médicos coleta, utiliza, processa e protege as suas informações pessoais e os dados relacionados aos pacientes durante a utilização do nosso serviço.
          </p>
          <p>
            Esta política está em conformidade com o Regulamento Geral de Proteção de Dados (RGPD) da União Europeia e com a Lei Geral de Proteção de Dados (LGPD) do Brasil, garantindo a proteção e privacidade dos seus dados e dos dados dos pacientes que possa processar através da nossa plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Dados Coletados</h2>
          <p className="mb-3">
            O Assistente de Relatórios Médicos coleta e processa os seguintes tipos de dados:
          </p>

          <h3 className="text-lg font-medium mt-4 mb-2">2.1. Dados do Profissional de Saúde</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Informações de conta (nome, e-mail, especialidade médica)</li>
            <li>Credenciais de acesso (nome de utilizador e senha encriptada)</li>
            <li>Registos de atividade na plataforma</li>
            <li>Preferências de utilização</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">2.2. Dados dos Pacientes</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Informações demográficas (nome, idade, género, número de processo)</li>
            <li>Dados clínicos (sintomas, diagnósticos, tratamentos)</li>
            <li>Registos áudio temporários (quando a funcionalidade de escuta do utente é utilizada)</li>
            <li>Transcrições de áudio (processadas a partir dos registos áudio)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Finalidade do Processamento de Dados</h2>
          <p className="mb-3">
            Os dados coletados são utilizados exclusivamente para:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Facilitar a criação e gestão de relatórios médicos</li>
            <li>Permitir a transcrição de consultas médicas com o consentimento do paciente</li>
            <li>Melhorar a eficiência do atendimento médico</li>
            <li>Garantir a segurança e integridade dos dados</li>
            <li>Cumprir com obrigações legais e regulatórias</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Processamento de Áudio e Reconhecimento de Voz</h2>
          <p className="mb-3">
            Quando as funcionalidades de reconhecimento de voz ou escuta do utente são utilizadas, aplicam-se as seguintes condições:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>O consentimento explícito é sempre solicitado antes de iniciar qualquer gravação</li>
            <li>Os dados de áudio são processados temporariamente e não são armazenados permanentemente</li>
            <li>As transcrições geradas são utilizadas apenas para facilitar a criação do relatório médico</li>
            <li>Os dados são processados com medidas de segurança apropriadas para garantir a confidencialidade</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Medidas de Segurança</h2>
          <p className="mb-3">
            Implementamos medidas técnicas e organizacionais para proteger os seus dados pessoais contra:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Acesso não autorizado</li>
            <li>Divulgação, alteração ou destruição não autorizada</li>
            <li>Perda acidental</li>
          </ul>

          <p className="mt-3">
            Estas medidas incluem encriptação de dados, controles de acesso rigorosos, auditorias de segurança regulares e formação contínua da nossa equipe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Retenção de Dados</h2>
          <p className="mb-3">
            Os dados são retidos apenas pelo período necessário para cumprir as finalidades para as quais foram coletados, conforme detalhado abaixo:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Dados de áudio temporários: excluídos imediatamente após o processamento (geralmente dentro de minutos)</li>
            <li>Transcrições: retidas por até 90 dias, ou até que o relatório médico seja finalizado</li>
            <li>Relatórios médicos: retidos conforme exigido pela legislação aplicável e políticas de retenção médica</li>
            <li>Registos de consentimento: mantidos por pelo menos 5 anos conforme exigido pelo RGPD e LGPD</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Direitos dos Titulares dos Dados</h2>
          <p className="mb-3">
            De acordo com o RGPD e a LGPD, os titulares dos dados têm os seguintes direitos:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Direito de acesso aos dados pessoais</li>
            <li>Direito de retificação de dados inexatos</li>
            <li>Direito ao apagamento dos dados ("direito ao esquecimento")</li>
            <li>Direito à limitação do processamento</li>
            <li>Direito à portabilidade dos dados</li>
            <li>Direito de oposição ao processamento</li>
            <li>Direito de não estar sujeito a decisões automatizadas, incluindo criação de perfil</li>
          </ul>

          <p className="mt-3">
            Para exercer qualquer um destes direitos, entre em contato conosco através dos canais indicados no final desta política.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Transferências Internacionais de Dados</h2>
          <p>
            Não realizamos transferências de dados para fora do Espaço Económico Europeu (EEE) ou do Brasil. Todos os dados são processados e armazenados em servidores localizados dentro do EEE, em conformidade com as legislações de proteção de dados aplicáveis.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Alterações a Esta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Quando fizermos alterações significativas, iremos notificá-lo através de um aviso visível na nossa plataforma. Incentivamos a consulta regular desta política para estar informado sobre como estamos protegendo as suas informações.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contacto</h2>
          <p className="mb-3">
            Se tiver dúvidas sobre esta Política de Privacidade ou sobre as nossas práticas de proteção de dados, entre em contato conosco:
          </p>

          <div className="bg-muted p-4 rounded-md">
            <p><strong>Assistente de Relatórios Médicos</strong></p>
            <p>E-mail: privacidade@relatoriospediatricos.pt</p>
            <p>Telefone: +351 210 000 000</p>
            <p>Endereço: Avenida da República, 50, 1050-196 Lisboa, Portugal</p>
          </div>
        </section>
      </div>
    </div>
  );
}