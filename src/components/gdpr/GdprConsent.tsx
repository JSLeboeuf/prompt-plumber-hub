import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToastContext } from '@/components/providers/ToastProvider';

interface GdprConsentProps {
  onConsentChange: (consents: { analytics: boolean; marketing: boolean }) => void;
}

export const GdprConsent: React.FC<GdprConsentProps> = ({ onConsentChange }) => {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const { success } = useToastContext();

  const handleSaveConsent = () => {
    const consents = {
      analytics: analyticsConsent,
      marketing: marketingConsent
    };
    
    // Store consent in localStorage for compliance
    localStorage.setItem('gdpr_consent', JSON.stringify({
      ...consents,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    onConsentChange(consents);
    success('Préférences de confidentialité sauvegardées');
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Consentement RGPD</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Nous respectons votre vie privée. Veuillez choisir les types de données que vous acceptez de partager.
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox
            id="analytics"
            checked={analyticsConsent}
            onCheckedChange={(checked) => setAnalyticsConsent(checked === true)}
          />
          <label htmlFor="analytics" className="text-sm leading-none cursor-pointer">
            <div className="font-medium">Données analytiques</div>
            <div className="text-muted-foreground">
              Nous aide à améliorer notre service en analysant l'usage anonyme
            </div>
          </label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketing"
            checked={marketingConsent}
            onCheckedChange={(checked) => setMarketingConsent(checked === true)}
          />
          <label htmlFor="marketing" className="text-sm leading-none cursor-pointer">
            <div className="font-medium">Communications marketing</div>
            <div className="text-muted-foreground">
              Recevoir des informations sur nos services et offres
            </div>
          </label>
        </div>

        <div className="pt-4 space-y-2">
          <Button onClick={handleSaveConsent} className="w-full">
            Enregistrer mes préférences
          </Button>
          <div className="text-xs text-muted-foreground text-center">
            Vous pouvez modifier ces préférences à tout moment dans les paramètres
          </div>
        </div>
      </CardContent>
    </Card>
  );
};