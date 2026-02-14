# Comté de Clairebois - Suite d'Outils JdR

Suite d'outils pour maîtres de jeu - Créez et gérez votre univers de jeu de rôle.

## 🗂️ Structure du Projet

```
/
├── index.html                      # 🏠 Page d'accueil
├── README.md                       # 📖 Documentation
├── STRUCTURE.txt                   # 📋 Guide de structure
├── css/
│   └── common.css                 # Styles partagés
└── pages/
    ├── character-creator.html     # ⚔️ Créateur de personnage
    ├── skill-creator.html         # 📜 Créateur de compétences (🔜)
    └── economy.html               # 💰 Gestion économie (🔜)
```

## 🎮 Outils Disponibles

### ⚔️ Créateur de Personnage ✅
Générez des fiches de personnage complètes avec :
- 23 races disponibles
- 7 archétypes de combat (Hybride, Martial, Mystique, Savant)
- 41 formations & compétences
- Avatar personnalisable avec éditeur d'image
- Export PNG et JSON
- Chargement de personnages existants
- Responsive (mobile + desktop)

### 📜 Créateur de Compétences ✅
Concevez des compétences équilibrées avec le système de rangs (1-6) :
- Configuration de base (nom, description, type de ressource)
- 13 améliorations disponibles (dégâts, barrière, zone, passif...)
- Système de rangs avec coûts croissants
- Calcul automatique du rang total
- Prévisualisation en temps réel
- Export/Import JSON
- Système d'invocations et familiers
- Validation des coûts (max 10 points, 6 capacités max)

### 💰 Économie (En développement)
Gérez l'économie de votre monde :
- Calculateur de richesse
- Générateur de prix
- Tables de coûts
- Conversion de monnaies

## 🚀 Utilisation

1. Ouvrez `index.html` dans votre navigateur
2. Cliquez sur l'outil souhaité (ex: "Créateur de Personnage")
3. Créez, exportez, sauvegardez !

**Accès direct** : Vous pouvez aussi ouvrir directement `pages/character-creator.html` pour accéder au créateur sans passer par l'index.

## 📱 Compatibilité

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Android)
- ✅ Tablette

## 🛠️ Technologies

- HTML5, CSS3, JavaScript (Vanilla)
- html2canvas pour export PNG
- Responsive design (mobile-first)
- Support tactile (pinch to zoom, drag)

## 📝 Notes de Développement

### Créateur de Personnage
- Fichier **tout-en-un** (HTML + CSS + JS intégrés)
- Les données du personnage sont sauvegardées en JSON
- L'image est encodée en base64 dans le JSON
- Le système de formations est dynamique selon l'archétype choisi
- Navigation libre après chargement d'un personnage
- Support mobile complet (tactile, pinch to zoom)

### Pages Annexes
- Les pages "Bientôt disponible" utilisent `css/common.css`
- Structure prête pour développement futur des outils

## 🎨 Personnalisation

### Modifier les couleurs globales
Éditez les variables CSS dans `css/common.css` :
```css
:root {
    --primary: #c89b3c;      /* Or */
    --secondary: #0a1428;    /* Bleu foncé */
    --accent: #e4ae39;       /* Or clair */
    --danger: #c2413e;       /* Rouge */
    --success: #4a9171;      /* Vert */
}
```

### Modifier le créateur de personnage
Éditez directement `character-creator.html` :
- **Couleurs** : Variables CSS dans la balise `<style>`
- **Races/Archétypes** : Section `gameData` dans le `<script>`
- **Formations** : Liste `formations` dans `gameData`

## 📄 Licence

© 2026 Comté de Clairebois - Tous droits réservés

## 🐛 Support

Pour des questions ou bugs, contactez l'équipe de développement.

---

**Version:** 1.0.0  
**Dernière mise à jour:** Février 2026
