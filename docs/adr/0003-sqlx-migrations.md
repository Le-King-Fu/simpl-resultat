# ADR-0003 : Migrations sqlx inline et contrainte de checksum

- **Date** : 2025-02
- **Statut** : Accepté

## Contexte

L'application utilise SQLite via `tauri-plugin-sql` pour le stockage local. Le schéma de la base de données évolue à chaque version (ajout de colonnes, nouvelles tables, changement de contraintes). Il faut un système de migration fiable qui :
- Applique les migrations dans l'ordre au démarrage
- Détecte les modifications non autorisées du schéma
- Supporte la création de nouvelles bases (nouveaux profils)

Le plugin `tauri-plugin-sql` fournit un système de migrations intégré basé sur `sqlx::migrate`, avec vérification de checksum.

## Décision

Nous utilisons les **migrations inline** définies dans `lib.rs` via `tauri_plugin_sql::Migration`. Chaque migration est une chaîne SQL embarquée dans le binaire.

En complément, un fichier `consolidated_schema.sql` contient le schéma complet (toutes les migrations fusionnées) et est utilisé pour initialiser les nouveaux profils sans rejouer les 6 migrations.

Les 6 migrations actuelles :
1. Schéma initial (13 tables, 9 index)
2. Seed des catégories et mots-clés par défaut
3. Ajout `has_header` sur `import_sources`
4. Ajout `is_inputable` sur `categories`
5. Création de `import_config_templates`
6. Changement de contrainte unique sur `imported_files`

## Conséquences

### Positives

- **Vérification de checksum** : sqlx détecte toute modification d'une migration déjà appliquée, empêchant les corruptions silencieuses
- **Migrations embarquées** dans le binaire : pas de fichiers SQL à distribuer séparément
- **Schéma consolidé** : les nouveaux profils démarrent avec un schéma propre sans passer par l'historique des migrations
- **Traçabilité** : chaque changement de schéma est versionné et documenté

### Négatives

- **Immutabilité** : une migration appliquée ne peut jamais être modifiée (erreur de checksum), ce qui force la création de nouvelles migrations correctives
- **Synchronisation manuelle** : le fichier `consolidated_schema.sql` doit être mis à jour manuellement après chaque nouvelle migration
- **Pas de rollback** : les migrations sont unidirectionnelles (pas de `down`)
