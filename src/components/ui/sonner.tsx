export const toast = {
  success: (title: string, options?: { description?: string }) => {
    console.log('Success:', title, options?.description);
  },
  error: (title: string, options?: { description?: string }) => {
    console.log('Error:', title, options?.description);
  },
  info: (title: string, options?: { description?: string }) => {
    console.log('Info:', title, options?.description);
  },
  warning: (title: string, options?: { description?: string }) => {
    console.log('Warning:', title, options?.description);
  }
};

export function Toaster() {
  return null;
}