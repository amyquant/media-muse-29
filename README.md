# Media Muse

Construis une application web complète de revue de presse et de veille médiatique, en français, pensée comme un outil professionnel de monitoring des médias.

OBJECTIF PRODUIT
L'application doit permettre à un utilisateur de surveiller des thématiques/mots-clés, agréger des articles provenant de sources personnalisables, analyser le volume médiatique et les tendances, puis produire des rapports d'analyse.

FONCTIONNALITÉS MVP À IMPLÉMENTER

1. TABLEAU DE BORD / ANALYSE DU VOLUME
- Sélecteur de période entièrement personnalisable: aujourd'hui, 7 jours, 30 jours, 3 mois, 1 an et période personnalisée.
- Recherche/sélection d'une ou plusieurs thématiques ou mots-clés.
- KPI: nombre total d'articles, nombre de sources, évolution vs période précédente, nombre de sujets/tendances détectés.
- Graphique temporel du nombre d'articles publiés, avec regroupement jour/semaine/mois selon la période.
- Ventilation par type de texte: Actualité, Opinion, Éditorial, Analyse, Entrevue, Communiqué, Autre.
- Graphiques permettant de comparer les types de textes et les sources.
- Filtres croisés: période, thématique, mot-clé, source, type de texte, langue.

2. TENDANCES ET SUJETS RÉCURRENTS
- Une page "Tendances" qui regroupe les articles par sujets/thèmes récurrents.
- Afficher pour chaque tendance: nom du sujet, volume d'articles, évolution, première apparition, dernière apparition, principales sources.
- Prévoir une logique de détection de sujets à partir des titres/résumés/mots-clés; pour le MVP, une approche déterministe par mots-clés/catégories est acceptable, mais architecture prête pour une analyse sémantique/IA ultérieure.
- Afficher les tendances émergentes et celles qui diminuent.
- Cliquer une tendance doit ouvrir les articles correspondants.

3. EXPLORATEUR DE PRESSE
- Page permettant de chercher et filtrer tous les textes.
- Cartes/lignes d'articles avec titre, source, date, type de texte, thématiques, extrait, lien externe.
- Tri par date, pertinence, source.
- Recherche plein texte.
- Filtres par thématique, type, source et période.
- Vue détail d'un article avec métadonnées.

4. SOURCES PERSONNALISABLES
- Page "Sources".
- Ajouter une source RSS avec nom, URL du flux, catégorie, langue, statut actif/inactif.
- Modifier, supprimer, activer/désactiver une source.
- Afficher dernier succès de synchronisation et nombre d'articles.
- Prévoir aussi une architecture pour futures sources API/web, avec type de source.
- Ne pas prétendre qu'un RSS réel fonctionne sans backend: créer l'interface et le modèle de données, et préparer une couche d'ingestion clairement séparée.

5. SURVEILLANCE DE MOTS-CLÉS
- Page "Veille".
- Créer une veille avec nom, mots-clés inclus, mots-clés exclus, sources ciblées, types de texte, langues et fréquence.
- Liste des veilles actives.
- Pour chaque veille: volume récent, dernière activité, variation.
- Préparer les notifications/alertes comme fonctionnalité future, avec statut configuré/non configuré.
- Permettre de lancer une analyse d'une veille.

6. RAPPORTS D'ANALYSE
- Page "Rapports".
- Créer un rapport à partir d'une période + veille/thématique + filtres.
- Générer un aperçu de rapport professionnel contenant: résumé exécutif, volume médiatique, évolution temporelle, répartition par type de texte, sources principales, tendances/sujets récurrents, articles importants.
- Bouton "Exporter PDF" et "Exporter CSV" dans l'interface; si l'export réel nécessite un backend, prévoir une implémentation MVP fonctionnelle côté application pour les données disponibles.
- Historique des rapports avec date, période et veille.

DONNÉES / BACKEND
- Utiliser le backend PostgreSQL/Supabase de Lovable.
- Créer un schéma propre: sources, articles, topics, keywords/watchlists, articles_topics, reports et tables nécessaires.
- Ajouter des données de démonstration réalistes en français afin que tous les graphiques et écrans soient immédiatement visibles.
- Prévoir des timestamps et index utiles.
- Architecture séparant clairement ingestion des sources, normalisation des articles, classification des types, détection de tendances et interface.
- Pour les données de démonstration, ne pas utiliser de faux liens présentés comme de vrais articles: utiliser des URLs clairement fictives ou des liens génériques de démonstration.

INTERFACE
- Application desktop-first mais responsive.
- Style professionnel de type SaaS de veille médiatique: moderne, sobre, très lisible, beaucoup d'espace, excellente hiérarchie visuelle.
- Navigation latérale: Tableau de bord, Explorer, Tendances, Veilles, Sources, Rapports, Paramètres.
- Interface entièrement en français.
- Utiliser des graphiques interactifs avec tooltips.
- États loading/empty/error.
- Prévoir une recherche globale.
- Ne pas faire une simple landing page: construire directement le produit/dashboard.
- Ajouter des contrôles et interactions fonctionnels, pas seulement des maquettes.

IMPORTANT
- Construire d'abord une version MVP solide et cohérente avec les données de démonstration.
- Ne pas inventer une intégration RSS fonctionnelle si elle n'est pas réellement connectée. L'interface d'ajout RSS doit être prête et le modèle de données doit permettre une future ingestion.
- Le produit doit être conçu pour évoluer vers de vraies sources, NLP/IA, alertes et génération de rapports automatisés.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/46b40fa7-adb7-487e-81c6-56cfcece5e01).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
