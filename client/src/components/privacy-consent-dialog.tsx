import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Info, Lock, Shield, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useTranslate } from "@/hooks/use-language";

interface PrivacyConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: (consentGranted: boolean) => void;
  title: string;
  description: string;
  privacyItems: Array<{
    id: string;
    description: string;
  }>;
  dataRetentionPeriod?: string;
  privacyPolicyUrl?: string;
}

export function PrivacyConsentDialog({
  open,
  onOpenChange,
  onConsent,
  title,
  description,
  privacyItems,
  dataRetentionPeriod = "90 dias",
  privacyPolicyUrl
}: PrivacyConsentDialogProps) {
  const { t } = useTranslate();
  const [itemConsents, setItemConsents] = useState<{ [key: string]: boolean }>(
    privacyItems.reduce((acc, item) => ({ ...acc, [item.id]: false }), {})
  );

  const allConsented = Object.values(itemConsents).every(Boolean);

  const handleToggleConsent = (id: string) => {
    setItemConsents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAccept = () => {
    onConsent(true);
    onOpenChange(false);
  };

  const handleDecline = () => {
    onConsent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t('consent.required_consents', 'Consentimentos necessários (RGPD/LGPD)')}
            </h3>
            <div className="space-y-3">
              {privacyItems.map((item) => (
                <div key={item.id} className="flex space-x-2 items-start">
                  <Checkbox 
                    id={item.id} 
                    checked={itemConsents[item.id]} 
                    onCheckedChange={() => handleToggleConsent(item.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={item.id}
                      className="text-sm font-normal leading-snug"
                    >
                      {item.description}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t('consent.data_retention', 'Todos os dados processados serão mantidos de forma segura e criptografada por um período máximo de {period}, conforme as políticas de proteção de dados. Você pode solicitar a exclusão antecipada destes dados a qualquer momento.').replace('{period}', dataRetentionPeriod)}
                </p>
                <p className="text-xs">
                  <Link href="/privacy-policy" className="text-primary hover:underline flex items-center gap-1">
                    {t('consent.view_privacy_policy', 'Ver política de privacidade completa')}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button type="button" variant="outline" onClick={handleDecline}>
            {t('consent.decline', 'Recusar')}
          </Button>
          <Button type="button" onClick={handleAccept} disabled={!allConsented}>
            {t('consent.accept', 'Aceitar e continuar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}