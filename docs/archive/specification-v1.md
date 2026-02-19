# description générale

une application locale qui permet de traiter des csv bancaires (compte cheque, épargne, carte de crédit) pour faire le suivi des dépenses et du respect budgetaire

# fonctionnalités

## importation

a partir de repertoires locaux, permettre l'importation de fichier csv. le nom du repertoire identifie la source

par exemple
- carte de crédit --> source = "carte de crédit"
    - export_cc.csv
    - export_cc_AAAAMMJJ_1.csv
- compte chèque --> source = "compte chèque"
    - export_dt.csv
    - export_dt_AAAAMMJJ_1.csv
    
## appariement des champs du csv

lors de la création d'une nouvelle importation, l'application doit permettre l'appariement des colonnes avec la structure de donnée implantée
- date de la transaction
- description de la transaction
- code de la transaction
- montant debiteur
- montant crediteur

si les montants ne sont que sur une seule colonne, on doit permettre de preciser la regle de gestion (i.g. si négatif, alors créditeur, sinon débiteur). une case a cocher ou un toggle pourrait permettre cela.

## gestion des catégories

pour permettre de suivre adéquatement les dépenses, on doit pouvoir les catégoriser. pour faciliter le travail, une catégorisation de base sera proposée

- type de dépense (i.g. récurrente, ponctuelle, spéciale, transfert)
- catégorie (i.g. restaurant, sport, loyer, voiture)
- sous-catégorie (facultatif)
- fournisseur 
- mots clés

un fichier csv sera fournie lors du développement pour le chargement initial.
par la suite, une fenêtre doit permettre de les modifier, d'en ajouter ou d'en supprimer

## appariement des dépenses par catégorie

un appariement entre la description de la transaction et les mots clés doit être fait
les transactions qui ne peuvent être appariés doivent être identifiées et exposées dans une fenêtre qui pourra permettre d'ajouter ces cas dans la gestion des catégories via l'ajout de mot clé dans la bonne catégorie/sous-catégorie/fournisseur
les transactions qui n'ont pas été traités vont automatiquement tombé dans une catégorie "Autres dépenses"

## écritures d'ajustement

l'application doit permettre de faire des écritures d'ajustement
par exemple, reclasser une dépense d'Amazon dont une portion serait sport et l'autre musique
les écritures d'appliquent sur un mois donnée (par exemple à la dernière journée du mois)

## budget

il est possible de saisir des valeurs budgetaires par mois et par sous-catégorie

# reporting

plusieurs options de reporting sont disponibles
- suivi mensuel sur 12 mois
- comparable mois courant vs mois précédent
- cumulatifs année courante vs année précédente

le reporting est disponible sous format tabulaire ou graphique

# forfait

## freemium

fonctionnalités basiques
- importation des csv
- ajout de fournisseur et de mots clés
- visual simple - suivi mensuel

## payant

- fonctionnalités basiques 
- personnalisation des categories
- visuels multiples

# contrainte

- facile d'installation
- doit fonctionner sur
  - windows (p1)
  - macOS (p2)
  - linux (p3)
