# ADR-0005 : Architecture multi-profils avec bases de données séparées

- **Date** : 2025-08
- **Statut** : Accepté

## Contexte

L'application doit supporter plusieurs profils utilisateur (par exemple, un profil personnel et un profil professionnel) avec une isolation complète des données. Chaque profil a ses propres catégories, transactions, budgets et paramètres.

Les options considérées :
- **Base unique avec colonne `profile_id`** : simple, mais risque de fuite de données entre profils
- **Bases de données séparées** : isolation totale, mais gestion plus complexe
- **Schémas SQLite** (ATTACH DATABASE) : isolation partielle, API complexe

## Décision

Chaque profil possède sa **propre base de données SQLite**. La liste des profils est stockée dans un fichier `profiles.json` dans le répertoire de données de l'application.

Architecture :
- `profiles.json` : métadonnées des profils (nom, chemin de la BDD, hash du PIN)
- `ProfileContext` (React) : état global du profil actif, liste des profils, fonctions de switching
- `ProfileSelectionPage` : page affichée quand aucun profil n'est actif (gate)
- Les nouveaux profils sont initialisés avec `consolidated_schema.sql` (via la commande `get_new_profile_init_sql`)
- Chaque profil peut être protégé par un PIN (hashé avec Argon2)

## Conséquences

### Positives

- **Isolation totale** : aucun risque de fuite de données entre profils
- **Suppression simple** : supprimer un profil = supprimer un fichier `.db`
- **Sauvegarde indépendante** : chaque profil peut être exporté/importé séparément
- **Pas de migration croisée** : les migrations s'appliquent indépendamment à chaque base

### Négatives

- **Reconnexion nécessaire** : le changement de profil nécessite la fermeture et la réouverture de la connexion SQLite
- **Pas de vue agrégée** : impossible de voir les données de tous les profils en même temps
- **Synchronisation du schéma** : chaque base doit être au même niveau de migration (géré par le plugin sql au démarrage)
- **Fichier `profiles.json` externe** : les métadonnées des profils ne sont pas dans SQLite, ce qui crée une dépendance à un fichier JSON séparé
