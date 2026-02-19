# ADR-0002 : useReducer plutôt que Redux/Zustand

- **Date** : 2025-01
- **Statut** : Accepté

## Contexte

L'application nécessite une gestion d'état complexe pour chaque domaine métier (transactions, catégories, budget, import, etc.). Chaque domaine a son propre cycle de vie avec des opérations CRUD, du chargement asynchrone, et des états d'erreur.

Les options considérées :
- **Redux** (+ Redux Toolkit) : standard de l'industrie, middleware, DevTools
- **Zustand** : léger, API simple, pas de boilerplate
- **useReducer** (React natif) : intégré à React, pas de dépendance externe

## Décision

Nous avons choisi **useReducer** (React natif) avec un hook custom par domaine métier, soit 12 hooks au total.

Chaque hook encapsule :
- Un reducer avec des actions typées
- Les appels aux services (couche d'accès aux données)
- L'état de chargement et la gestion d'erreur

## Conséquences

### Positives

- **Zéro dépendance** supplémentaire pour la gestion d'état
- **Colocalisation** : chaque domaine est isolé dans son propre hook, ce qui facilite la maintenance
- **Typage TypeScript** natif des actions et de l'état, sans configuration additionnelle
- **Simplicité** : pas de store global, pas de middleware, pas de boilerplate Redux
- **Prévisibilité** : le pattern reducer garde la logique de transition d'état explicite

### Négatives

- **Pas de DevTools** intégrés (pas d'inspection de l'historique des actions comme Redux DevTools)
- **Pas de partage d'état** natif entre hooks (résolu par le contexte `ProfileContext` pour l'état global)
- **Duplication** potentielle de patterns similaires entre les 12 hooks (chargement, erreur, CRUD)
