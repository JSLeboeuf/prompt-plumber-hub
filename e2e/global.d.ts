declare namespace NodeJS {
  interface ProcessEnv {
    E2E_EMAIL?: string;
    E2E_PASSWORD?: string;
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  }
}

