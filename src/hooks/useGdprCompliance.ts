import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

interface GdprConsent {
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

interface GdprRequest {
  id?: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability';
  email: string;
  description: string;
  status?: string;
}

export const useGdprCompliance = () => {
  const [consent, setConsent] = useState<GdprConsent | null>(null);
  const [loading, setLoading] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    const storedConsent = localStorage.getItem('gdpr_consent');
    if (storedConsent) {
      try {
        setConsent(JSON.parse(storedConsent));
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to parse GDPR consent', normalizedError);
      }
    }
  }, []);

  const updateConsent = useCallback((newConsent: Omit<GdprConsent, 'timestamp' | 'version'>) => {
    const consentWithMeta: GdprConsent = {
      ...newConsent,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('gdpr_consent', JSON.stringify(consentWithMeta));
    setConsent(consentWithMeta);
  }, []);

  const submitGdprRequest = useCallback(async (request: GdprRequest) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gdpr_requests')
        .insert({
          request_type: request.type,
          email: request.email,
          justification: request.description,
          status: 'pending'
        });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const anonymizeOldData = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('anonymize_customer_data');
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Access denied or error occurred'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const hasConsent = useCallback((type: 'analytics' | 'marketing'): boolean => {
    return consent ? consent[type] : false;
  }, [consent]);

  const isConsentRequired = useCallback((): boolean => {
    // Check if consent is older than 1 year (GDPR requirement)
    if (!consent) return true;
    
    const consentDate = new Date(consent.timestamp);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return consentDate < oneYearAgo;
  }, [consent]);

  return {
    consent,
    loading,
    updateConsent,
    submitGdprRequest,
    anonymizeOldData,
    hasConsent,
    isConsentRequired
  };
};
