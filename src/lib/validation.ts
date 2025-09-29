import { z } from 'zod';

/**
 * Phase 4: Enhanced Input Validation & Security
 * Comprehensive validation schemas for all user inputs
 */

// Base validation utilities
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML chars
    .substring(0, 1000); // Limit length
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Contact Form Validation
export const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" })
    .regex(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/, { message: "Le nom contient des caractères invalides" }),
    
  email: z.string()
    .trim()
    .email({ message: "Adresse email invalide" })
    .max(255, { message: "L'email ne peut pas dépasser 255 caractères" })
    .toLowerCase(),
    
  phone: z.string()
    .trim()
    .optional()
    .refine((phone) => !phone || validatePhoneNumber(phone), {
      message: "Numéro de téléphone invalide"
    }),
    
  message: z.string()
    .trim()
    .min(1, { message: "Le message est requis" })
    .max(2000, { message: "Le message ne peut pas dépasser 2000 caractères" }),
    
  subject: z.string()
    .trim()
    .max(200, { message: "Le sujet ne peut pas dépasser 200 caractères" })
    .optional()
});

// Client/Lead Validation
export const clientSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" }),
    
  email: z.string()
    .trim()
    .email({ message: "Adresse email invalide" })
    .max(255, { message: "L'email ne peut pas dépasser 255 caractères" })
    .optional()
    .or(z.literal('')),
    
  phone: z.string()
    .trim()
    .refine((phone) => !phone || validatePhoneNumber(phone), {
      message: "Numéro de téléphone invalide"
    })
    .optional(),
    
  address: z.string()
    .trim()
    .max(500, { message: "L'adresse ne peut pas dépasser 500 caractères" })
    .optional(),
    
  notes: z.string()
    .trim()
    .max(1000, { message: "Les notes ne peuvent pas dépasser 1000 caractères" })
    .optional(),
    
  priority: z.enum(['normal', 'high', 'urgent'], {
    message: "Priorité invalide"
  }).optional(),
  
  status: z.enum(['nouveau', 'en_cours', 'converti', 'perdu'], {
    message: "Statut invalide"
  }).optional()
});

// Intervention Validation
export const interventionSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "Le titre est requis" })
    .max(200, { message: "Le titre ne peut pas dépasser 200 caractères" }),
    
  description: z.string()
    .trim()
    .max(2000, { message: "La description ne peut pas dépasser 2000 caractères" })
    .optional(),
    
  client_name: z.string()
    .trim()
    .min(1, { message: "Le nom du client est requis" })
    .max(100, { message: "Le nom du client ne peut pas dépasser 100 caractères" }),
    
  client_phone: z.string()
    .trim()
    .refine((phone) => !phone || validatePhoneNumber(phone), {
      message: "Numéro de téléphone invalide"
    })
    .optional(),
    
  address: z.string()
    .trim()
    .min(1, { message: "L'adresse est requise" })
    .max(500, { message: "L'adresse ne peut pas dépasser 500 caractères" }),
    
  city: z.string()
    .trim()
    .max(100, { message: "La ville ne peut pas dépasser 100 caractères" })
    .optional(),
    
  postal_code: z.string()
    .trim()
    .regex(/^[0-9]{5}$/, { message: "Code postal invalide (format: 12345)" })
    .optional(),
    
  service_type: z.string()
    .trim()
    .min(1, { message: "Le type de service est requis" })
    .max(100, { message: "Le type de service ne peut pas dépasser 100 caractères" }),
    
  priority: z.enum(['normal', 'P1', 'P2', 'P3'], {
    message: "Priorité invalide"
  }),
  
  estimated_duration: z.number()
    .min(15, { message: "Durée minimale: 15 minutes" })
    .max(480, { message: "Durée maximale: 8 heures" })
    .optional(),
    
  estimated_price: z.number()
    .min(0, { message: "Le prix ne peut pas être négatif" })
    .max(10000, { message: "Prix maximum: 10000€" })
    .optional(),
    
  scheduled_date: z.string()
    .refine((date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime()) && d >= new Date();
    }, { message: "Date invalide ou dans le passé" }),
    
  scheduled_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Heure invalide (format: HH:MM)"
    })
    .optional()
});

// SMS/Message Validation
export const smsSchema = z.object({
  customer_phone: z.string()
    .trim()
    .refine(validatePhoneNumber, { message: "Numéro de téléphone invalide" }),
    
  customer_name: z.string()
    .trim()
    .min(1, { message: "Le nom du client est requis" })
    .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" }),
    
  message: z.string()
    .trim()
    .min(1, { message: "Le message est requis" })
    .max(1600, { message: "Le message ne peut pas dépasser 1600 caractères" }),
    
  service_type: z.string()
    .trim()
    .max(100, { message: "Le type de service ne peut pas dépasser 100 caractères" }),
    
  priority: z.enum(['normal', 'P1', 'P2', 'P3'], {
    message: "Priorité invalide"
  })
});

// Support Ticket Validation
export const supportTicketSchema = z.object({
  client_name: z.string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" }),
    
  client_email: z.string()
    .trim()
    .email({ message: "Adresse email invalide" })
    .max(255, { message: "L'email ne peut pas dépasser 255 caractères" }),
    
  client_phone: z.string()
    .trim()
    .refine((phone) => !phone || validatePhoneNumber(phone), {
      message: "Numéro de téléphone invalide"
    })
    .optional(),
    
  subject: z.string()
    .trim()
    .min(1, { message: "Le sujet est requis" })
    .max(200, { message: "Le sujet ne peut pas dépasser 200 caractères" }),
    
  description: z.string()
    .trim()
    .min(1, { message: "La description est requise" })
    .max(2000, { message: "La description ne peut pas dépasser 2000 caractères" }),
    
  category: z.enum(['general', 'technical', 'billing', 'emergency'], {
    message: "Catégorie invalide"
  }),
  
  priority: z.enum(['low', 'normal', 'high', 'urgent'], {
    message: "Priorité invalide"
  })
});

// Search and Filter Validation
export const searchFilterSchema = z.object({
  query: z.string()
    .trim()
    .max(100, { message: "La recherche ne peut pas dépasser 100 caractères" })
    .optional(),
    
  filters: z.record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
    
  sortBy: z.string()
    .max(50, { message: "Critère de tri invalide" })
    .optional(),
    
  sortOrder: z.enum(['asc', 'desc'])
    .optional(),
    
  page: z.number()
    .min(1, { message: "Numéro de page invalide" })
    .max(1000, { message: "Numéro de page trop élevé" })
    .optional(),
    
  limit: z.number()
    .min(1, { message: "Limite invalide" })
    .max(100, { message: "Limite maximale: 100" })
    .optional()
});

// URL/External API Validation
export const urlSchema = z.string()
  .url({ message: "URL invalide" })
  .refine((url) => {
    const allowedDomains = [
      'api.whatsapp.com',
      'api.twilio.com',
      'api.sendgrid.com',
      'maps.googleapis.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => urlObj.hostname.endsWith(domain));
    } catch {
      return false;
    }
  }, { message: "Domaine non autorisé" });

// File Upload Validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "Fichier trop volumineux (max: 10MB)"
    })
    .refine((file) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'text/plain'
      ];
      return allowedTypes.includes(file.type);
    }, {
      message: "Type de fichier non autorisé"
    }),
    
  description: z.string()
    .trim()
    .max(500, { message: "Description trop longue" })
    .optional()
});

// Export types for TypeScript
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ClientData = z.infer<typeof clientSchema>;
export type InterventionData = z.infer<typeof interventionSchema>;
export type SMSData = z.infer<typeof smsSchema>;
export type SupportTicketData = z.infer<typeof supportTicketSchema>;
export type SearchFilterData = z.infer<typeof searchFilterSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;

// Validation helper functions
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.parse(data);
  
  // Additional sanitization for string fields
  if (typeof result === 'object' && result !== null) {
    const sanitized = { ...result };
    Object.keys(sanitized).forEach(key => {
      const value = (sanitized as any)[key];
      if (typeof value === 'string') {
        (sanitized as any)[key] = sanitizeString(value);
      }
    });
    return sanitized;
  }
  
  return result;
};

export const validateWithFeedback = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validData = validateAndSanitize(schema, data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    
    return {
      success: false,
      errors: ['Erreur de validation inconnue']
    };
  }
};