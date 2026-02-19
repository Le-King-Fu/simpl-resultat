# ADR-0001 : Choix de Tauri v2 plutôt qu'Electron

- **Date** : 2025-01
- **Statut** : Accepté

## Contexte

Simpl'Résultat est une application de gestion financière personnelle qui doit fonctionner en tant qu'application desktop native sur Windows et Linux. Le choix du framework desktop impacte directement la taille de l'installeur, la consommation mémoire, la sécurité et l'accès aux APIs système.

Les deux options principales étaient :
- **Electron** : mature, large écosystème, embarque Chromium + Node.js
- **Tauri v2** : plus récent, utilise le webview natif du système, backend Rust

## Décision

Nous avons choisi **Tauri v2** comme framework desktop.

## Conséquences

### Positives

- **Taille de l'installeur** réduite (~10 Mo vs ~150 Mo pour Electron)
- **Consommation mémoire** significativement plus faible (pas de Chromium embarqué)
- **Sécurité** renforcée : backend Rust (memory-safe), système de capabilities granulaire de Tauri v2
- **Accès natif** au système de fichiers, dialogues natifs, et SQLite via les plugins Tauri
- **Chiffrement performant** : AES-256-GCM et Argon2 implémentés nativement en Rust

### Négatives

- **Écosystème** moins mature qu'Electron (moins de plugins communautaires)
- **Différences de rendu** potentielles entre les webviews (WebView2 sur Windows, WebKitGTK sur Linux)
- **Courbe d'apprentissage** Rust pour l'équipe frontend
- **Tauri v2** était encore récent au moment du choix, avec moins de retours d'expérience
