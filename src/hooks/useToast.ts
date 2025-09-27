import { toast } from '@/components/ui/sonner';

export const useToast = () => {
  const success = (title: string, message?: string) => {
    toast.success(title, { description: message });
  };
  const error = (title: string, message?: string) => {
    toast.error(title, { description: message });
  };
  const warning = (title: string, message?: string) => {
    toast.warning?.(title, { description: message }) || toast(title, { description: message });
  };
  const info = (title: string, message?: string) => {
    toast.info?.(title, { description: message }) || toast(title, { description: message });
  };

  return { success, error, warning, info };
};
