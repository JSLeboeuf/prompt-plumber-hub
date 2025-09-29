import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import './i18n';
import { logger } from "@/lib/logger";
// a11y: activer axe-core en dev
if (import.meta.env.DEV) {
  // charge axe-core/react dynamiquement pour éviter d'impacter le build
  import('@axe-core/react').then(({ default: axe }) => {
    import('react').then(React => {
      const ReactDOM = { render: () => {} } as { render: () => void };
      try {
        // axe nécessite React et ReactDOM; avec React 18 createRoot, on l'appelle simplement
        axe(React as typeof React, ReactDOM, 1000);
      } catch (error) {
        logger.warn('axe-core/react setup failed', error as Error);
      }
    }).catch((error) => {
      logger.warn('Failed to import React for axe-core', error as Error);
    });
  }).catch((error) => {
    logger.warn('axe-core/react dynamic import failed', error as Error);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
