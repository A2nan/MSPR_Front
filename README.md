
MSPR - Statistiques Sanitaires
==============================

Application web développée dans le cadre d'un projet MSPR permettant de visualiser l’évolution des cas et des décès par maladie, pays et région à l’aide de graphiques dynamiques.

Fonctionnalités
---------------
- Visualisation des statistiques sanitaires (morts, cas) par pays, maladie et période
- Comparaison morts vs cas cumulés avec affichage du taux de létalité (%)
- Classement des 5 pays avec le plus de morts
- Export CSV des données affichées
- Interface utilisateur responsive avec Bootstrap 5
- API backend développée en Java Spring Boot
- Frontend moderne en Angular (standalone components)

Architecture
------------
mspr-statistiques/
├── backend/              → API REST Spring Boot (Java)
├── frontend/             → Application Angular (v16+)
└── README.txt            → Ce fichier

Installation
------------
Backend (Spring Boot)
1. Aller dans le dossier backend
2. Lancer le projet :
   ./mvnw spring-boot:run
   → API disponible sur http://localhost:8080/api

Frontend (Angular)
1. Aller dans le dossier frontend
2. Installer les dépendances :
   npm install
3. Lancer le serveur de développement :
   ng serve
   → Interface sur http://localhost:4200

API endpoints principaux
------------------------
- GET /api/pays → liste des pays
- GET /api/maladies → liste des maladies
- GET /api/statistiques/donnees-par-jour?paysId=X&maladieId=Y&type=total_mort
- GET /api/statistiques/top-pays-morts?maladieId=Y

Technologies utilisées
----------------------
Backend :
- Java 17
- Spring Boot (JPA, Web, CORS)
- H2 ou MySQL/PostgreSQL
- Swagger (OpenAPI)

Frontend :
- Angular 16+
- Chart.js
- Bootstrap 5

Auteurs
-------
Adnan Mahboubi
Moumine Koné
