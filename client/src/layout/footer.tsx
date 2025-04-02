import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  
  return (
    <footer className="bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {currentYear} {t('footer.all_rights_reserved')}
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/privacy-policy">
              <span className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary cursor-pointer">
                {t('footer.privacy_policy')}
              </span>
            </Link>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('footer.rgpd_compliant')}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}