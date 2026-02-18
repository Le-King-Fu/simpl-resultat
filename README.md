# Simpl'Résultat

Application de bureau 100 % locale pour importer, catégoriser et analyser vos transactions financières personnelles ou d'entreprise. Aucune donnée ne quitte votre ordinateur.

![Version](https://img.shields.io/github/v/release/Le-King-Fu/simpl-resultat?label=version)
![Windows](https://img.shields.io/badge/plateforme-Windows-blue)
![Linux](https://img.shields.io/badge/plateforme-Linux-orange)

## Fonctionnalités

- **Import CSV** — Importez vos relevés bancaires depuis plusieurs sources avec auto-détection des colonnes et modèles d'import réutilisables
- **Tableau de bord** — Vue d'ensemble avec KPIs, répartition par catégorie et dernières transactions
- **Transactions** — Parcourez, recherchez et filtrez avec sélection rapide de période
- **Catégorisation automatique** — Attribution automatique par mots-clés, avec ajustement manuel
- **Split de transactions** — Répartissez une transaction sur plusieurs catégories
- **Budgets** — Grille budgétaire 12 mois par catégorie avec modèles et rapport Budget vs Réel
- **Ajustements** — Ajustements ponctuels ou récurrents par catégorie
- **Rapports** — Tendances mensuelles, répartition par catégorie, évolution dans le temps, budget vs réel
- **Graphiques interactifs** — Motifs SVG, menu contextuel (clic droit), détail des transactions par catégorie
- **Profils multiples** — Bases de données séparées avec protection PIN optionnelle
- **Export / Import de données** — Sauvegarde complète avec chiffrement AES-256-GCM optionnel
- **Mode sombre** — Thème sombre avec palette gris chaud
- **Bilingue** — Interface disponible en français et en anglais
- **Guide utilisateur intégré** — Documentation complète accessible depuis les paramètres, imprimable en PDF
- **Mise à jour automatique** — Notifications et installation des nouvelles versions depuis l'application

## Installation

### Windows

1. Rendez-vous sur la page [**Releases**](https://github.com/Le-King-Fu/simpl-resultat/releases/latest)
2. Téléchargez le fichier `.exe` (installateur NSIS)
3. Lancez le fichier téléchargé

> **Note :** Windows SmartScreen peut afficher un avertissement car l'application n'est pas signée numériquement.
> Cliquez sur **« Informations complémentaires »** puis **« Exécuter quand même »** pour continuer.

### Linux

1. Rendez-vous sur la page [**Releases**](https://github.com/Le-King-Fu/simpl-resultat/releases/latest)
2. Téléchargez le format adapté à votre distribution :
   - `.deb` pour Debian / Ubuntu
   - `.rpm` pour Fedora / openSUSE
   - `.AppImage` pour toute distribution (exécutable universel)
3. Installez le paquet ou lancez l'AppImage directement

## Démarrage rapide

### 1. Choisir ou créer un profil

Au premier lancement, un profil par défaut est créé. Vous pouvez ajouter d'autres profils (chacun avec sa propre base de données) et les protéger par un PIN.

### 2. Configurer le dossier d'import

Organisez vos fichiers CSV dans un dossier avec un sous-dossier par source :

```
Documents/
  Comptabilité/
    Desjardins/
      releve-2024-01.csv
      releve-2024-02.csv
    Autre banque/
      export.csv
```

### 3. Importer des transactions

- Allez dans **Import**
- Sélectionnez le dossier source et les fichiers CSV
- Configurez le mappage des colonnes (ou utilisez un modèle d'import sauvegardé)
- Vérifiez les doublons puis lancez l'import

### 4. Consulter le tableau de bord

Le tableau de bord affiche automatiquement :
- Les KPIs du mois (revenus, dépenses, solde)
- La répartition des dépenses par catégorie
- Les dernières transactions

### 5. Parcourir et catégoriser les transactions

- Utilisez la recherche et les filtres (date, catégorie, source, période rapide)
- Modifiez la catégorie d'une transaction en cliquant dessus
- Ajoutez des mots-clés pour automatiser les futures catégorisations
- Scindez une transaction sur plusieurs catégories si nécessaire

### 6. Gérer les budgets

- Définissez un budget mensuel par catégorie sur une grille 12 mois
- Créez des modèles budgétaires réutilisables
- Consultez le rapport **Budget vs Réel** pour suivre vos écarts

### 7. Analyser les rapports

- **Tendances** — Évolution mensuelle des revenus et dépenses
- **Catégories** — Répartition détaillée par catégorie (clic droit pour masquer ou voir le détail)
- **Évolution** — Suivi dans le temps par catégorie
- **Budget vs Réel** — Comparaison mensuelle et cumul annuel

### 8. Guide utilisateur

Un guide complet est accessible via **Paramètres → Guide utilisateur**. Il couvre toutes les fonctionnalités et peut être imprimé ou exporté en PDF.

## Développement

### Prérequis

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### Lancer en mode développement

```bash
npm install
npm run tauri dev
```

### Compiler l'application

```bash
npm run tauri build
```

Les installateurs sont générés dans `src-tauri/target/release/bundle/`.

## Publier une nouvelle version

1. Mettez à jour la version dans `src-tauri/tauri.conf.json` et `package.json`
2. Committez les changements
3. Créez et poussez un tag :

```bash
git tag v0.3.7
git push origin v0.3.7
```

Le workflow GitHub Actions compile automatiquement l'application pour Windows et Linux, puis publie les installateurs dans une nouvelle Release.

## Technologies

| Technologie | Rôle |
|---|---|
| [Tauri v2](https://v2.tauri.app/) | Framework desktop (Rust backend) |
| [React 19](https://react.dev/) | Interface utilisateur |
| [SQLite](https://www.sqlite.org/) | Base de données locale |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styles |
| [Recharts](https://recharts.org/) | Graphiques |
| [react-i18next](https://react.i18next.com/) | Internationalisation |
| [PapaParse](https://www.papaparse.com/) | Parsing CSV |
