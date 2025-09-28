import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

export const toast = {
  success: (title: string, options?: { description?: string }) => {
    sonnerToast.success(title, { description: options?.description });
  },
  error: (title: string, options?: { description?: string }) => {
    sonnerToast.error(title, { description: options?.description });
  },
  info: (title: string, options?: { description?: string }) => {
    sonnerToast.info(title, { description: options?.description });
  },
  warning: (title: string, options?: { description?: string }) => {
    sonnerToast.warning(title, { description: options?.description });
  }
};

export function Toaster() {
  return <SonnerToaster position="top-right" richColors closeButton />;
}