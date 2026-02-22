# Guide d'utilisation — Simpl'Résultat

---

## 1. Premiers pas

Simpl'Résultat vous aide à suivre vos finances personnelles en important des relevés bancaires, en catégorisant les transactions, en planifiant des budgets et en générant des rapports. L'application est disponible sur Windows et Linux.

### Fonctionnalités

- Importation de relevés bancaires CSV depuis plusieurs sources
- Catégorisation automatique et manuelle des transactions
- Répartition (split) d'une transaction sur plusieurs catégories
- Planification budgétaire avec vues mensuelles et annuelles
- Rapports visuels et graphiques interactifs avec menu contextuel
- Profils multiples avec bases de données séparées et NIP optionnel
- Mode sombre avec palette gris chaud
- Export et import de données avec chiffrement AES-256 optionnel

### Démarrage rapide

1. Au premier lancement, choisissez ou créez un profil — chaque profil a sa propre base de données
2. Allez dans Paramètres et définissez votre dossier d'import — créez un sous-dossier par compte bancaire
3. Placez vos relevés bancaires CSV dans le sous-dossier correspondant
4. Ouvrez la page Import et configurez votre source (mapping des colonnes, délimiteur, format de date)
5. Importez vos transactions, puis allez dans Catégories pour configurer les règles de mots-clés
6. Utilisez l'auto-catégorisation sur la page Transactions pour appliquer vos règles en masse
7. Configurez votre Budget et suivez votre progression via les Rapports

### Astuces

- Vous pouvez basculer entre le français et l'anglais via le sélecteur de langue dans la barre latérale
- Activez le mode sombre via le bouton dans la barre latérale
- Chaque page a une icône d'aide (?) dans l'en-tête avec des astuces rapides
- Vos données sont stockées localement sur votre ordinateur — rien n'est envoyé vers le cloud

---

## 2. Profils

Gérez plusieurs profils indépendants, chacun avec sa propre base de données. Idéal pour séparer les finances personnelles et professionnelles, ou pour plusieurs utilisateurs sur un même ordinateur.

### Fonctionnalités

- Création de profils multiples avec noms et couleurs personnalisés
- Chaque profil possède sa propre base de données séparée
- Protection optionnelle par NIP (code numérique)
- Changement de profil rapide depuis la barre latérale
- Suppression de profil avec toutes ses données

### Comment faire

1. Cliquez sur le sélecteur de profil dans la barre latérale pour voir les profils disponibles
2. Cliquez sur Gérer les profils pour créer, modifier ou supprimer des profils
3. Créez un nouveau profil en choisissant un nom, une couleur et un NIP optionnel
4. Basculez entre les profils en cliquant sur celui de votre choix dans le sélecteur

### Astuces

- Un profil par défaut est créé automatiquement au premier lancement
- Le NIP est demandé à chaque fois que vous accédez à un profil protégé
- La suppression d'un profil supprime définitivement toutes ses données — cette action est irréversible

---

## 3. Tableau de bord

Le tableau de bord vous donne un aperçu rapide de votre situation financière pour une période sélectionnée.

### Fonctionnalités

- Cartes résumées du solde, des revenus et des dépenses
- Répartition des dépenses par catégorie (graphique circulaire avec motifs SVG)
- Liste des transactions récentes
- Sélecteur de période ajustable
- Menu contextuel (clic droit) pour masquer une catégorie ou voir ses transactions

### Comment faire

1. Utilisez le sélecteur de période en haut à droite pour choisir une plage de temps (mois, 3 mois, année, etc.)
2. Consultez les cartes résumées pour votre solde, revenus totaux et dépenses totales
3. Vérifiez le graphique circulaire pour voir comment vos dépenses sont réparties par catégorie
4. Cliquez droit sur une catégorie dans le graphique pour la masquer ou voir le détail de ses transactions
5. Faites défiler vers le bas pour voir vos transactions les plus récentes

### Astuces

- Le solde est calculé comme les revenus moins les dépenses pour la période sélectionnée
- Les catégories masquées apparaissent sous forme de pastilles au-dessus du graphique — cliquez sur Tout afficher pour les restaurer
- Les motifs SVG (lignes, points, hachures) aident à distinguer les catégories au-delà des couleurs

---

## 4. Import

Importez des relevés bancaires à partir de fichiers CSV à l'aide d'un assistant étape par étape. Chaque compte bancaire est représenté par un dossier source.

### Fonctionnalités

- Assistant d'import multi-étapes avec aperçu des données
- Mapping de colonnes configurable, délimiteur et format de date
- Détection automatique des doublons (dans le lot et contre les données existantes)
- Modèles d'import pour sauvegarder et réutiliser les configurations
- Historique des imports avec possibilité de supprimer les imports précédents

### Comment faire

1. Définissez votre dossier d'import via le sélecteur de dossier en haut de la page
2. Créez un sous-dossier pour chaque banque/source et placez-y les fichiers CSV
3. Cliquez sur une source pour ouvrir l'assistant d'import
4. Configurez le délimiteur, l'encodage, le format de date et le mapping des colonnes
5. Sélectionnez les fichiers à importer et prévisualisez les données analysées
6. Vérifiez les doublons, examinez le résumé, puis confirmez l'import

### Astuces

- Sauvegardez votre configuration comme modèle pour ne pas avoir à reconfigurer à chaque fois
- Les fichiers déjà importés sont marqués d'un badge — les ré-importer déclenchera la détection de doublons
- Vous pouvez supprimer un import de l'historique pour retirer toutes ses transactions

---

## 5. Transactions

Parcourez, filtrez, triez et catégorisez toutes vos transactions importées. C'est ici que vous organisez vos données financières.

### Fonctionnalités

- Recherche et filtre par description, catégorie, source ou plage de dates
- Sélecteurs de période rapides (ce mois, mois dernier, cette année, etc.)
- Colonnes triables (date, description, montant, catégorie)
- Assignation de catégorie en ligne via menu déroulant
- Auto-catégorisation basée sur les règles de mots-clés
- Ajout de mots-clés directement depuis une transaction
- Répartition (split) d'une transaction sur plusieurs catégories
- Notes sur les transactions

### Comment faire

1. Utilisez la barre de filtres pour affiner les transactions par texte, catégorie, source ou date
2. Cliquez sur un en-tête de colonne pour trier par ordre croissant ou décroissant
3. Pour catégoriser une transaction, cliquez sur son menu déroulant de catégorie et sélectionnez une catégorie
4. Pour auto-catégoriser toutes les transactions non catégorisées, cliquez sur le bouton Auto-catégoriser
5. Pour ajouter une règle de mot-clé depuis une transaction, cliquez sur l'icône + et entrez le mot-clé
6. Pour répartir une transaction sur plusieurs catégories, utilisez le bouton Répartition et ajoutez les montants par catégorie

### Astuces

- Utilisez les boutons de période rapide (Ce mois, Mois dernier, etc.) pour filtrer rapidement par date
- L'auto-catégorisation n'affecte que les transactions non catégorisées — elle n'écrase pas les assignations manuelles
- Ajouter un mot-clé depuis une transaction pré-remplit la catégorie pour construire rapidement vos règles
- Les transactions réparties affichent un indicateur visuel et le détail de la répartition

---

## 6. Catégories

Gérez votre arbre de catégories avec des sous-catégories, des règles de mots-clés pour l'auto-catégorisation et des couleurs personnalisées.

### Fonctionnalités

- Catégories hiérarchiques avec relations parent/enfant
- Trois types de catégories : Dépense, Revenu, Transfert
- Règles de mots-clés avec niveaux de priorité pour l'auto-catégorisation
- Couleurs personnalisées pour l'affichage des graphiques
- Glisser-déposer pour réordonner les catégories ou changer leur parent
- Basculer les catégories en saisissable ou non-saisissable
- Vue « Tous les mots-clés » pour voir l'ensemble des règles
- Réinitialiser les catégories aux valeurs par défaut

### Comment faire

1. Cliquez sur Ajouter une catégorie pour créer une nouvelle catégorie — choisissez un nom, un type et un parent optionnel
2. Sélectionnez une catégorie dans l'arbre pour voir ses détails et sa liste de mots-clés
3. Glissez-déposez une catégorie dans l'arbre pour la réordonner ou la déplacer sous un autre parent
4. Ajoutez des mots-clés correspondant aux descriptions des transactions pour l'auto-catégorisation
5. Définissez la priorité des mots-clés pour résoudre les conflits quand plusieurs catégories correspondent
6. Utilisez le sélecteur de couleur pour assigner une couleur personnalisée pour les graphiques

### Astuces

- Les catégories non-saisissables sont masquées du budget et des menus déroulants mais restent visibles dans les rapports
- Les mots-clés de priorité supérieure l'emportent quand plusieurs catégories correspondent à la même transaction
- Utilisez la vue Tous les mots-clés pour avoir un aperçu global de vos règles de catégorisation
- Utilisez Réinitialiser pour revenir aux catégories par défaut — cela dissociera toutes les catégories des transactions

---

## 7. Ajustements

Ajoutez des entrées manuelles non issues de vos relevés bancaires, et consultez les répartitions de transactions créées depuis la page Transactions.

### Fonctionnalités

- Créer des groupes d'ajustement nommés avec plusieurs entrées
- Assigner une catégorie à chaque entrée
- Marquer des ajustements comme récurrents
- Consultation des répartitions (splits) de transactions dans une section dédiée

### Comment faire

1. Cliquez sur Nouvel ajustement pour créer un groupe d'ajustement
2. Ajoutez des entrées avec une description, un montant, une date et une catégorie
3. Activez le drapeau récurrent si l'ajustement doit se répéter à chaque période
4. Consultez la section Répartitions de transactions pour voir les splits créés depuis la page Transactions

### Astuces

- Les ajustements apparaissent dans vos réels de budget aux côtés des transactions importées
- Utilisez les ajustements pour les dépenses prévues qui n'ont pas encore été débitées de votre compte
- Les répartitions de transactions sont créées depuis la page Transactions et apparaissent automatiquement ici

---

## 8. Budget

Planifiez votre budget mensuel pour chaque catégorie et suivez le prévu par rapport au réel tout au long de l'année.

### Fonctionnalités

- Grille budgétaire mensuelle pour toutes les catégories
- Colonne annuelle avec totaux automatiques
- Répartition égale du montant annuel sur 12 mois
- Modèles de budget pour sauvegarder et appliquer des configurations
- Sous-totaux par catégorie parente

### Comment faire

1. Utilisez le navigateur d'année pour sélectionner l'année du budget
2. Cliquez sur une cellule de mois pour entrer un montant prévu
3. Appuyez sur Entrée pour sauvegarder, Échap pour annuler, ou Tab pour passer au mois suivant
4. Utilisez le bouton de répartition (sur la colonne Annuel) pour distribuer également sur tous les mois
5. Sauvegardez votre budget comme modèle pour le réutiliser les années suivantes

### Astuces

- La colonne Annuel additionne automatiquement les 12 mois — un avertissement apparaît si les totaux mensuels ne correspondent pas
- Les modèles peuvent être appliqués à des mois spécifiques ou aux 12 mois d'un coup
- Les catégories parentes affichent les sous-totaux agrégés de leurs enfants

---

## 9. Rapports

Visualisez vos données financières avec des graphiques interactifs et comparez votre plan budgétaire au réel.

### Fonctionnalités

- Tendances mensuelles : revenus vs dépenses dans le temps (graphique en barres)
- Dépenses par catégorie : répartition des dépenses (graphique circulaire)
- Catégories dans le temps : suivez l'évolution de chaque catégorie (graphique en ligne)
- Budget vs Réel : tableau comparatif mensuel et cumul annuel
- Rapport dynamique : tableau croisé dynamique (pivot table) personnalisable
- Motifs SVG (lignes, points, hachures) pour distinguer les catégories
- Menu contextuel (clic droit) pour masquer une catégorie ou voir ses transactions

### Comment faire

1. Utilisez les onglets pour basculer entre Tendances, Par catégorie, Dans le temps et Budget vs Réel
2. Ajustez la période avec le sélecteur de période
3. Cliquez droit sur une catégorie dans un graphique pour la masquer ou voir le détail de ses transactions
4. Les catégories masquées apparaissent comme pastilles au-dessus du graphique — cliquez dessus pour les réafficher
5. Dans Budget vs Réel, basculez entre les vues Mensuel et Cumul annuel

### Astuces

- Les catégories masquées sont mémorisées tant que vous restez sur la page — cliquez sur Tout afficher pour réinitialiser
- Le sélecteur de période s'applique à tous les onglets de graphiques simultanément
- Budget vs Réel affiche l'écart en dollars et en pourcentage pour chaque catégorie
- Les motifs SVG aident les personnes daltoniennes à distinguer les catégories dans les graphiques

### Rapport dynamique

Le rapport dynamique fonctionne comme un tableau croisé dynamique (pivot table). Vous composez votre propre rapport en assignant des dimensions et des mesures.

**Dimensions disponibles :** Année, Mois, Type (dépense/revenu/transfert), Catégorie Niveau 1 (parent), Catégorie Niveau 2 (enfant).

**Mesures :** Montant périodique (somme), Cumul annuel (YTD).

1. Cliquez sur un champ disponible dans le panneau de droite
2. Choisissez où le placer : Lignes, Colonnes, Filtres ou Valeurs
3. Le tableau et/ou le graphique se mettent à jour automatiquement
4. Utilisez les filtres pour restreindre les données (ex : Type = dépense uniquement)
5. Basculez entre les vues Tableau, Graphique ou Les deux
6. Cliquez sur le X pour retirer un champ d'une zone

---

## 10. Paramètres

Configurez les préférences de l'application, vérifiez les mises à jour, accédez au guide utilisateur et gérez vos données avec les outils d'export/import.

### Fonctionnalités

- Affichage de la version de l'application
- Guide d'utilisation complet accessible directement depuis les paramètres
- Vérification automatique des mises à jour avec installation en un clic
- Export des données (transactions, catégories, ou les deux) en format JSON ou CSV
- Import des données depuis un fichier exporté précédemment
- Chiffrement AES-256-GCM optionnel pour les fichiers exportés

### Comment faire

1. Cliquez sur Guide d'utilisation pour accéder à la documentation complète
2. Cliquez sur Vérifier les mises à jour pour voir si une nouvelle version est disponible
3. Utilisez la section Gestion des données pour exporter ou importer vos données
4. Lors de l'export, choisissez ce qu'il faut inclure et définissez optionnellement un mot de passe pour le chiffrement
5. Lors de l'import, sélectionnez un fichier exporté précédemment — les fichiers chiffrés demanderont le mot de passe

### Astuces

- Les mises à jour ne remplacent que le programme — votre base de données n'est jamais modifiée
- Changez la langue de l'application via le sélecteur de langue dans la barre latérale
- Exportez régulièrement pour garder une sauvegarde de vos données
- Le guide d'utilisation peut être imprimé ou exporté en PDF via le bouton Imprimer
