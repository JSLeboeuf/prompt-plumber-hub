import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import './i18n';
// a11y: activer axe-core en dev
if (import.meta.env.DEV) {
  // charge axe-core/react dynamiquement pour éviter d'impacter le build
  import('@axe-core/react').then(({ default: axe }) => {
    import('react').then(React => {
      const ReactDOM = { render: () => {} } as any;
      try {
        // axe nécessite React et ReactDOM; avec React 18 createRoot, on l'appelle simplement
        axe(React as any, ReactDOM, 1000);
      } catch {}
    });
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
