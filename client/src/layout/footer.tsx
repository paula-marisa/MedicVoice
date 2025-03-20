export function Footer() {
  return (
    <footer className="mt-12 bg-white dark:bg-neutral-800 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            &copy; {new Date().getFullYear()} Assistente de Relatórios Médicos. Todos os direitos reservados.
          </div>
          <div className="mt-4 md:mt-0 text-sm text-neutral-500 dark:text-neutral-400">
            Versão 1.0.0 | Protegido por LGPD/GDPR
          </div>
        </div>
      </div>
    </footer>
  );
}
