# ADR-0004 : Chiffrement AES-256-GCM pour l'export de données

- **Date** : 2025-06
- **Statut** : Accepté

## Contexte

L'application permet d'exporter et d'importer des données utilisateur (transactions, catégories, budgets) pour la sauvegarde ou le transfert entre machines. Ces données contiennent des informations financières personnelles et doivent être protégées.

Il fallait un format d'export :
- Chiffré avec un mot de passe utilisateur
- Intègre (détection de toute altération)
- Auto-contenu (un seul fichier)

## Décision

Nous avons implémenté un **format propriétaire SREF** (Simpl'Résultat Export Format) côté Rust avec :

- **Chiffrement** : AES-256-GCM (chiffrement authentifié)
- **Dérivation de clé** : Argon2id à partir du mot de passe utilisateur
- **Format binaire** :
  - Magic : `SREF` (4 octets)
  - Version : `0x01` (1 octet)
  - Salt : 16 octets (aléatoire)
  - Nonce : 12 octets (aléatoire)
  - Données chiffrées : reste du fichier

La détection du format se fait via la commande `is_file_encrypted` qui vérifie le magic `SREF`.

## Conséquences

### Positives

- **Chiffrement authentifié** : AES-256-GCM garantit à la fois la confidentialité et l'intégrité des données
- **Résistance au brute-force** : Argon2id rend les attaques par dictionnaire coûteuses
- **Implémentation Rust** : performances natives, pas de dépendance à des binaires externes
- **Format auto-détectable** : le magic `SREF` permet de distinguer fichiers chiffrés et non chiffrés

### Négatives

- **Format propriétaire** : pas d'interopérabilité avec d'autres outils (pas de standard comme GPG)
- **Pas de récupération** possible si le mot de passe est perdu
- **Évolution du format** : les changements de version nécessitent une rétrocompatibilité
