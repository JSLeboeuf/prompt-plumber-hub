# Codex CLI Bridge pour Cursor - Context 7

Ce projet est configuré pour utiliser Codex CLI avec le contexte Cursor (Context 7) pour un développement assisté par IA optimisé.

## Configuration

### 1. Fichier `.cursorrules`
Définit les règles de contexte du projet :
- **Tech Stack**: React/TypeScript, Vite, Supabase, Radix UI, Tailwind CSS
- **Structure**: Composants modulaires, hooks personnalisés, services API
- **Conventions**: TypeScript obligatoire, gestion d'état avec React Query
- **Patterns**: Composants réutilisables, gestion d'erreurs, accessibilité

### 2. Configuration Codex CLI
Le fichier `~/.codex/config.toml` contient une section dédiée pour ce projet :
```toml
[projects."C:\\Users\\Jean-Samuel\\drain fortin prod f\\prompt-plumber-hub"]
trust_level = "trusted"
context_rules = ".cursorrules"
model = "gpt-4"
model_reasoning_effort = "high"
```

### 3. Script Bridge
Le fichier `codex-bridge.ps1` permet de lancer Codex CLI avec tous les paramètres appropriés.

## Utilisation

### Lancement rapide
```powershell
.\codex-bridge.ps1 "Votre prompt ici"
```

### Avec prompt interactif
```powershell
.\codex-bridge.ps1
```

### Directement avec Codex CLI
```bash
codex -C "C:\Users\Jean-Samuel\drain fortin prod f\prompt-plumber-hub" --full-auto
```

## Fonctionnalités du Bridge

### ✅ Context 7 activé
- Accès complet au contexte du projet
- Règles de codage automatiques
- Structure et conventions respectées

### ✅ Configuration optimisée
- Modèle GPT-4 avec reasoning élevé
- Exécution automatique en mode sécurisé
- Accès trusted au répertoire du projet

### ✅ Intégration Cursor
- Compatible avec l'IA de Cursor
- Contexte partagé entre les outils
- Développement cohérent

## MCP Servers disponibles

Le projet a accès aux MCP servers suivants via Codex CLI :
- **Notion**: Gestion de connaissances
- **Filesystem**: Accès fichiers locaux
- **Browser**: Automatisation web
- **Memory**: Mémoire contextuelle
- **Sequential Thinking**: Raisonnement structuré
- Et plus...

## Commandes utiles

```powershell
# Démarrer une session interactive
.\codex-bridge.ps1

# Générer du code pour une fonctionnalité
.\codex-bridge.ps1 "Créer un composant pour afficher les statistiques des appels"

# Refactoriser du code existant
.\codex-bridge.ps1 "Optimiser le hook useAnalytics pour de meilleures performances"

# Ajouter des tests
.\codex-bridge.ps1 "Ajouter des tests unitaires pour le service CRM"
```

## Support

Si vous rencontrez des problèmes :
1. Vérifiez que Codex CLI est installé et à jour (`npm install -g @openai/codex@latest`)
2. Assurez-vous que le fichier `.cursorrules` existe à la racine du projet
3. Vérifiez les permissions du répertoire dans `config.toml`


