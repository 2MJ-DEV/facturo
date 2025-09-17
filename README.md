# 📌 Facturo – Application de gestion de factures

**Facturo** est une application web moderne de gestion de factures conçue pour les indépendants, PME et entreprises. Elle simplifie la création, l’envoi et le suivi des factures tout en garantissant la conformité légale et la sécurité des données.

## ✨ Fonctionnalités principales
- 🧾 **Création de factures** avec numérotation séquentielle conforme  
- 📧 **Envoi par email et export en PDF**  
- 💰 **Suivi des paiements** (totaux et partiels)  
- 📊 **Tableau de bord interactif** : revenus, factures payées/impayées  
- 👥 **Gestion multi-utilisateurs** (admin, comptable, employé)  
- 🔒 **Sécurité & conformité** : RGPD, archivage légal  

## 🛠️ Stack technique
- **Front-end** : React.js  
- **Back-end** : Node.js (Express)  
- **Base de données** : PostgreSQL  
- **Authentification** : JWT + Bcrypt (hashage des mots de passe)  
- **Déploiement** : Vercel / Render  
- **CI/CD** : GitHub Actions  

## 🚀 Installation & utilisation

### 1. Cloner le projet
```bash
git clone https://github.com/votre-organisation/facturo.git
cd facturo
```

### 2. Installer les dépendances
```bash
npm install
```
### 3. Configurer les variables d’environnement
Créer un fichier .env à la racine :
```bash
DATABASE_URL=postgres://user:password@localhost:5432/facturo
JWT_SECRET=ton_secret_jwt
EMAIL_HOST=smtp.example.com
EMAIL_USER=ton_email
EMAIL_PASS=ton_mot_de_passe
```
### 4. Lancer le projet en développement
```bash
npm run dev
```

## 📂 Structure du projet
```bash
facturo/
├── client/         # Front-end React
├── server/         # Back-end Node/Express
├── db/             # Schéma et migrations PostgreSQL
├── tests/          # Tests unitaires & end-to-end
├── README.md
└── package.json
```
## 🧪 Tests & Qualité
- ✅ Tests unitaires sur l’API
- ✅ Tests end-to-end (Cypress)
- ✅ Vérification conformité légale (numérotation & archivage)

## 📈 Roadmap (sprints)
- Sprint 1 : Setup projet (CI/CD, DB, API hello world)
- Sprint 2 : CRUD factures + PDF
- Sprint 3 : Envoi email + logs
- Sprint 4 : Paiements + statuts
- Sprint 5 : Dashboard + graphiques
- Sprint 6 : Améliorations & tests automatiques

## 👥 Contributeurs
Ce projet est développé dans un cadre pédagogique avec les étudiants du département genie logiciel.
Contributions et retours sont les bienvenus via issues ou pull requests.

## 📄 Licence
Ce projet est sous licence MIT. Vous êtes libre de l’utiliser, le modifier et le distribuer.

