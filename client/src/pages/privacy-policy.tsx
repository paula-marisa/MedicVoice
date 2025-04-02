import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useTranslate } from "@/hooks/use-language";

export function PrivacyPolicy() {
  const { t } = useTranslate();
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>{t('privacy.title', 'Política de Privacidade')}</span>
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                {t('common.back', 'Voltar')}
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-2">{t('privacy.introduction.title', 'Introdução')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.introduction.content', 'O Sistema de Relatórios Médicos está comprometido com a proteção da sua privacidade e dos seus dados pessoais. Esta política de privacidade explica como recolhemos, usamos, partilhamos e protegemos os seus dados quando utiliza o nosso sistema.')}
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Dados Recolhidos</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              O nosso sistema recolhe e processa os seguintes tipos de dados:
            </p>
            <ul className="list-disc pl-8 space-y-1 text-muted-foreground">
              <li>Dados de identificação pessoal (nome, número de processo)</li>
              <li>Dados profissionais (especialidade médica, identificação profissional)</li>
              <li>Dados de saúde (sintomas, diagnósticos, tratamentos)</li>
              <li>Gravações de áudio (durante a utilização das funcionalidades de escuta e ditado)</li>
              <li>Relatórios médicos e histórico clínico</li>
              <li>Dados de utilização do sistema (acessos, ações realizadas)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Finalidades do Tratamento</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Os dados são tratados para as seguintes finalidades:
            </p>
            <ul className="list-disc pl-8 space-y-1 text-muted-foreground">
              <li>Criação e gestão de relatórios médicos</li>
              <li>Melhoria da eficiência no diagnóstico e tratamento de pacientes</li>
              <li>Garantia da qualidade e segurança dos serviços médicos</li>
              <li>Auditoria e rastreabilidade das ações realizadas no sistema</li>
              <li>Cumprimento de obrigações legais</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Período de Conservação</h3>
            <p className="text-muted-foreground leading-relaxed">
              Todos os dados processados pela funcionalidade de escuta e reconhecimento de voz são mantidos de forma segura e criptografada por um período máximo de 90 dias, após os quais são automaticamente eliminados. Os relatórios médicos e outros dados relacionados com os processos clínicos são conservados pelos períodos legalmente estabelecidos para registos médicos.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Direitos dos Titulares dos Dados</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Como titular dos dados, tem direito a:
            </p>
            <ul className="list-disc pl-8 space-y-1 text-muted-foreground">
              <li>Aceder aos seus dados pessoais</li>
              <li>Solicitar a retificação de dados incorretos</li>
              <li>Solicitar a eliminação dos seus dados (dentro dos limites legais)</li>
              <li>Opor-se ao tratamento dos seus dados</li>
              <li>Solicitar a limitação do tratamento dos seus dados</li>
              <li>Solicitar a portabilidade dos seus dados</li>
              <li>Retirar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Medidas de Segurança</h3>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas técnicas e organizacionais adequadas para proteger os seus dados pessoais contra o acesso, a divulgação, a alteração ou a destruição não autorizados, incluindo encriptação, controlo de acesso, registos de auditoria e formação contínua do pessoal.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Partilha de Dados</h3>
            <p className="text-muted-foreground leading-relaxed">
              Os seus dados podem ser partilhados com outros profissionais de saúde envolvidos no seu tratamento, sempre no estrito cumprimento do sigilo médico e das normas aplicáveis. Não partilhamos os seus dados com terceiros para fins comerciais ou de marketing.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Contacto</h3>
            <p className="text-muted-foreground leading-relaxed">
              Para exercer os seus direitos ou para qualquer questão relacionada com a proteção dos seus dados pessoais, pode contactar o nosso Responsável pela Proteção de Dados através do e-mail dpo@sistemarelatoriosmedicos.pt ou do endereço [Endereço da Instituição].
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Alterações à Política de Privacidade</h3>
            <p className="text-muted-foreground leading-relaxed">
              Esta política de privacidade pode ser atualizada periodicamente. Publicaremos qualquer alteração no nosso site e, se as alterações forem significativas, enviaremos uma notificação através do sistema.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Data da Última Atualização</h3>
            <p className="text-muted-foreground leading-relaxed">
              Esta política de privacidade foi atualizada pela última vez em 1 de abril de 2025.
            </p>
          </section>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Link href="/">
            <Button className="w-full md:w-auto">{t('privacy.back_to_system', 'Voltar para o Sistema')}</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default PrivacyPolicy;