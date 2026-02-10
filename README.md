# Simpl'Résultat

Application de bureau pour importer, catégoriser et analyser les transactions financières de votre entreprise.

![Version](https://img.shields.io/github/v/release/simpl-software/simpl-result?label=version)
![Windows](https://img.shields.io/badge/plateforme-Windows-blue)

## Fonctionnalités

- **Import CSV** — Importez vos relevés bancaires depuis plusieurs sources (Desjardins, etc.)
- **Tableau de bord** — Vue d'ensemble avec KPIs, répartition par catégorie et dernières dépenses
- **Transactions** — Parcourez, recherchez et filtrez toutes vos transactions
- **Catégorisation automatique** — Attribution automatique par mots-clés, avec ajustement manuel
- **Rapports** — Tendances mensuelles, répartition par catégorie, évolution dans le temps
- **Bilingue** — Interface disponible en français et en anglais

## Installation (Windows)

1. Rendez-vous sur la page [**Releases**](../../releases/latest)
2. Téléchargez le fichier `.msi` (installateur Windows)
3. Lancez le fichier téléchargé

> **Note :** Windows SmartScreen peut afficher un avertissement car l'application n'est pas signée numériquement.
> Cliquez sur **« Informations complémentaires »** puis **« Exécuter quand même »** pour continuer.

## Démarrage rapide

### 1. Configurer le dossier d'import

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

### 2. Importer des transactions

- Allez dans **Transactions → Importer**
- Sélectionnez le dossier source et les fichiers CSV
- Configurez le mappage des colonnes (date, description, montant)
- Vérifiez l'aperçu puis lancez l'import

### 3. Consulter le tableau de bord

Le tableau de bord affiche automatiquement :
- Les KPIs du mois (revenus, dépenses, solde)
- La répartition des dépenses par catégorie
- Les dernières transactions

### 4. Parcourir et catégoriser les transactions

- Utilisez la recherche et les filtres (date, catégorie, source)
- Modifiez la catégorie d'une transaction en cliquant dessus
- Ajoutez des mots-clés pour automatiser les futures catégorisations

### 5. Analyser les rapports

- **Tendances** — Évolution mensuelle des revenus et dépenses
- **Catégories** — Répartition détaillée par catégorie
- **Évolution** — Suivi dans le temps par catégorie

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
git tag v0.1.0
git push origin v0.1.0
```

Le workflow GitHub Actions compile automatiquement l'application et publie les installateurs dans une nouvelle Release.

## Technologies

| Technologie | Rôle |
|---|---|
| [Tauri v2](https://v2.tauri.app/) | Framework desktop (Rust backend) |
| [React 19](https://react.dev/) | Interface utilisateur |
| [SQLite](https://www.sqlite.org/) | Base de données locale |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styles |
| [Recharts](https://recharts.org/) | Graphiques |
| [react-i18next](https://react.i18next.com/) | Internationalisation |
