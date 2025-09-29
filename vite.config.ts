import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// Security headers plugin inline (can't import from src at build time)
const viteSecurityHeaders = {
  name: 'security-headers',
  configureServer(server: {
    middlewares: {
      use: (middleware: (req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => void) => void;
    };
  }) {
    server.middlewares.use((_req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });
  },
  configurePreviewServer(server: {
    middlewares: {
      use: (middleware: (req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => void) => void;
    };
  }) {
    server.middlewares.use((_req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    process.env.ANALYZE ? visualizer({ filename: "dist/stats.html", template: "treemap" }) : null,
    viteSecurityHeaders,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-slot', 'class-variance-authority', 'clsx'],
        },
      },
    },
  },
}));
