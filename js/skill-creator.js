// ============================================================
// Tableau des statistiques par niveau
// ============================================================
const NIVEAU_TABLE = {
    1: { cibles: 1, zone: 'Contact', bonusMalus: 10,  degats: '3 + Mod.carac',  degatsMulti: '1 + Mod.carac' },
    2: { cibles: 2, zone: '5m',      bonusMalus: 10,  degats: '5 + Mod.carac',  degatsMulti: '2 + Mod.carac' },
    3: { cibles: 3, zone: '10m',     bonusMalus: 20,  degats: '7 + Mod.carac',  degatsMulti: '3 + Mod.carac' },
    4: { cibles: 4, zone: '15m',     bonusMalus: 20,  degats: '9 + Mod.carac',  degatsMulti: '4 + Mod.carac' },
    5: { cibles: 5, zone: '20m',     bonusMalus: 30,  degats: '11 + Mod.carac', degatsMulti: '5 + Mod.carac' }
};

// ============================================================
// Étapes du wizard
// ============================================================
const steps = [
    { id: 1, label: 'Identité' },
    { id: 2, label: 'Niveau' },
    { id: 3, label: 'Type' },
    { id: 4, label: 'Ressource' },
    { id: 5, label: 'Récap' }
];

// ============================================================
// État global
// ============================================================
let currentStep = 1;

let skill = {
    name: 'Capacité Sans Nom',
    desc: 'Une capacité magique puissante.',
    niveau: 1,
    isPassif: false,        // true = capacité permanente (réduit max ressource)
    sortType: 'mono',       // 'mono' | 'zone' | 'multi' | 'chaine'
    effects: [{ type: 'degats', niveau: 1 }],  // tableau d'effets avec niveaux individuels
    alterationType: null,   // 'immobilisation' | 'teleportation' | 'etourdissement'
    drainType: null,        // 'vie' | 'mana' | 'endurance'
    resourceType: 'mana',   // 'mana' | 'endurance' | 'sante' | 'objet'
    carac: 'INT',           // 'INT' | 'FOR' | 'AGI' | 'AUTRE'
    caracCustom: '',        // nom libre quand carac === 'AUTRE'
    image: null,
    imagePosition: { x: 0, y: 0, scale: 1 }
};

// ============================================================
// Variables pour le canvas d'image
// ============================================================
let skillImageCanvas = null;
let skillImageCtx = null;
let isDraggingSkillImage = false;
let lastSkillMousePos = { x: 0, y: 0 };

// ============================================================
// Fonctions helpers
// ============================================================
function getSortTypeLabel(sortType) {
    const labels = {
        mono:   'Mono-cible',
        zone:   'Zone',
        multi:  'Multi-cible',
        chaine: 'Chaîne'
    };
    return labels[sortType] || sortType;
}

function formatDegats(template) {
    const caracName = skill.carac === 'AUTRE'
        ? (skill.caracCustom.trim() || 'Autre')
        : skill.carac;
    return template.replace('Mod.carac', `Mod.${caracName}`);
}

function getActionsLabel(sortType) {
    if (skill.isPassif) return 'Permanent';
    return sortType === 'mono' ? '1 action' : '2 actions';
}

function getResourceLabel(resourceType) {
    const labels = { mana: 'Mana', endurance: 'Endurance', sante: 'PV', objet: 'Objet' };
    return labels[resourceType] || resourceType;
}

// Retourne le style inline du badge de rang selon la ressource
function getResourceBadgeStyle() {
    // Kept for potential future use — shape + color now drawn via drawRankBadge()
    return '';
}

function drawRankBadge() {
    const canvas = document.getElementById('rankBadgeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 60, H = 70;
    ctx.clearRect(0, 0, W, H);

    const colors = {
        mana:      { from: '#1a3d8c', to: '#0d2260', glow: '#4a7bd4' },
        endurance: { from: '#1a6b38', to: '#0d4022', glow: '#4ab87a' },
        sante:     { from: '#7c1e1e', to: '#500d0d', glow: '#c95050' },
        objet:     { from: '#4a4a4a', to: '#282828', glow: null },
    };
    const c = colors[skill.resourceType] || colors.mana;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, c.from);
    grad.addColorStop(1, c.to);

    // Pas d'effet de flou/aura sur aucune forme
    ctx.save();
    ctx.fillStyle = grad;

    // Shape
    ctx.beginPath();
    switch (skill.resourceType) {
        case 'mana': // Hexagone (pointes gauche/droite)
            ctx.moveTo(15,  0);
            ctx.lineTo(45,  0);
            ctx.lineTo(60, 35);
            ctx.lineTo(45, 70);
            ctx.lineTo(15, 70);
            ctx.lineTo( 0, 35);
            ctx.closePath();
            break;
        case 'endurance': // Cercle
            ctx.arc(30, 35, 30, 0, Math.PI * 2);
            break;
        case 'sante': // Goutte — pointe fine en haut, renflement rond en bas
            ctx.moveTo(30, 2);
            ctx.bezierCurveTo(34,  8, 58, 35, 58, 50);
            ctx.bezierCurveTo(58, 63, 46, 70, 30, 70);
            ctx.bezierCurveTo(14, 70,  2, 63,  2, 50);
            ctx.bezierCurveTo( 2, 35, 26,  8, 30,  2);
            ctx.closePath();
            break;
        case 'objet': // Carré aux coins arrondis
        default: {
            const r = 8;
            ctx.moveTo(r, 0);
            ctx.lineTo(W - r, 0);    ctx.arcTo(W,  0, W,      r, r);
            ctx.lineTo(W, H - r);    ctx.arcTo(W,  H, W - r,  H, r);
            ctx.lineTo(r, H);        ctx.arcTo(0,  H, 0,  H - r, r);
            ctx.lineTo(0, r);        ctx.arcTo(0,  0, r,       0, r);
            ctx.closePath();
        }
    }
    ctx.fill();
    ctx.restore();

    // Chiffre du rang
    ctx.save();
    ctx.fillStyle = '#e4ae39';
    ctx.font = `bold ${H * 0.43}px 'Cinzel', Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(skill.niveau), W / 2, H / 2 + 1);
    ctx.restore();
}

function getTypeBadgeStyle() {
    const styles = {
        mana:      { bg: 'linear-gradient(135deg, #1a3d8c 0%, #0d2260 100%)', border: '#4a7bd4' },
        endurance: { bg: 'linear-gradient(135deg, #1a6b38 0%, #0d4022 100%)', border: '#4ab87a' },
        sante:     { bg: 'linear-gradient(135deg, #7c1e1e 0%, #500d0d 100%)', border: '#c95050' },
        objet:     { bg: 'linear-gradient(135deg, #4a4a4a 0%, #282828 100%)', border: '#888888' },
    };
    const s = styles[skill.resourceType] || styles.mana;
    return `background: ${s.bg}; border-color: ${s.border};`;
}

function getCaracLabel(carac) {
    const labels = {
        INT:   'Intelligence (INT)',
        FOR:   'Force (FOR)',
        AGI:   'Agilité (AGI)',
        AUTRE: skill.caracCustom.trim() ? `${skill.caracCustom.trim()} (Autre)` : 'Autre'
    };
    return labels[carac] || carac;
}

function getAlterationLabel(alt) {
    const labels = {
        immobilisation: 'Immobilisation',
        teleportation:  'Téléportation',
        etourdissement: 'Étourdissement'
    };
    return labels[alt] || alt;
}

function getDrainTypeLabel(drainType) {
    const labels = {
        vie:       'Vie (PV)',
        mana:      'Mana',
        endurance: 'Endurance'
    };
    return labels[drainType] || drainType;
}

// ============================================================
// Helpers pour le système multi-effets
// ============================================================
function hasEffect(type) {
    return skill.effects.some(e => e.type === type);
}

function getEffectNiveau(type) {
    const effect = skill.effects.find(e => e.type === type);
    return effect ? effect.niveau : 0;
}

function getEffectLabel(type) {
    const labels = {
        degats:     'Dégâts',
        soin:       'Soins',
        barriere:   'Barrière',
        buff:       'Bonus',
        debuff:     'Malus',
        alteration: 'Altération',
        drain:      'Drain'
    };
    return labels[type] || type;
}

function getEffectIcon(type) {
    const icons = {
        degats:     '⚔️',
        soin:       '💚',
        barriere:   '🛡️',
        buff:       '⬆️',
        debuff:     '⬇️',
        alteration: '🌀',
        drain:      '🩸'
    };
    return icons[type] || '✨';
}

function redistributeNiveaux() {
    const total = skill.niveau;
    const count = skill.effects.length;

    // S'assurer que chaque effet a au moins 1
    skill.effects.forEach(e => { if (e.niveau < 1) e.niveau = 1; });

    let sum = skill.effects.reduce((s, e) => s + e.niveau, 0);

    // Si trop : réduire depuis la fin
    while (sum > total) {
        for (let i = skill.effects.length - 1; i >= 0; i--) {
            if (skill.effects[i].niveau > 1 && sum > total) {
                skill.effects[i].niveau--;
                sum--;
            }
        }
        // Sécurité : si tous à 1 et toujours trop, on ne peut rien faire
        if (skill.effects.every(e => e.niveau === 1)) break;
    }

    // Si pas assez : donner au premier
    while (sum < total) {
        skill.effects[0].niveau++;
        sum++;
    }
}

// ============================================================
// Navigation du wizard
// ============================================================
function nextStep() {
    if (currentStep < steps.length) {
        currentStep++;
        renderProgressBar();
        renderStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        renderProgressBar();
        renderStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToStep(stepId) {
    if (stepId <= currentStep) {
        currentStep = stepId;
        renderProgressBar();
        renderStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================================
// Rendu de la barre de progression
// ============================================================
function renderProgressBar() {
    const bar = document.getElementById('progressBar');
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

    let html = `<div class="progress-line" id="progressLine" style="width: ${progress}%"></div>`;
    steps.forEach(step => {
        const isActive    = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        html += `
            <div class="step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
                 onclick="goToStep(${step.id})">
                <div class="step-circle">${isCompleted ? '✓' : step.id}</div>
                <div class="step-label">${step.label}</div>
            </div>
        `;
    });
    bar.innerHTML = html;
}

// ============================================================
// Génération de la carte de prévisualisation (étape 5)
// ============================================================
function generatePreviewCard() {
    const stats         = NIVEAU_TABLE[skill.niveau];
    const isPassif      = skill.isPassif;
    const isMultiTarget = ['zone', 'multi', 'chaine'].includes(skill.sortType);
    const isMulti       = skill.sortType === 'multi';
    const isZoneOrChain = ['zone', 'chaine'].includes(skill.sortType);
    const isMultiEffect = skill.effects.length > 1;

    // Coût
    const coutHTML = isPassif
        ? `<span class="preview-stat-value" style="color: var(--success);">Max. -${skill.niveau} ${getResourceLabel(skill.resourceType)}</span>`
        : `<span class="preview-stat-value">${skill.niveau} ${getResourceLabel(skill.resourceType)}</span>`;

    // Cibles : seulement pour multi-cible
    const ciblesHTML = isMulti ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">🎯</div>
            <span class="preview-stat-label">Cibles</span>
            <span class="preview-stat-value">${stats.cibles}</span>
        </div>` : '';

    // Portée/Zone : seulement si pas mono-cible
    const porteeHTML = (skill.sortType !== 'mono') ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">📍</div>
            <span class="preview-stat-label">${isZoneOrChain ? 'Zone' : 'Portée'}</span>
            <span class="preview-stat-value">${stats.zone}</span>
        </div>` : '';

    // Générer le HTML pour chaque effet
    let effectsHTML = '';
    skill.effects.forEach(effect => {
        const effectStats = NIVEAU_TABLE[effect.niveau];
        const niveauTag = isMultiEffect ? ` <span style="font-size: 0.75rem; opacity: 0.6;">(Niv.${effect.niveau})</span>` : '';

        switch (effect.type) {
            case 'degats':
                effectsHTML += `
                    <div class="preview-stat">
                        <div class="preview-stat-icon">⚔️</div>
                        <span class="preview-stat-label">Dégâts${niveauTag}</span>
                        <span class="preview-stat-value">${formatDegats(isMultiTarget ? effectStats.degatsMulti : effectStats.degats)}</span>
                    </div>`;
                break;
            case 'soin':
                effectsHTML += `
                    <div class="preview-stat">
                        <div class="preview-stat-icon">💚</div>
                        <span class="preview-stat-label">Soins${niveauTag}</span>
                        <span class="preview-stat-value">${formatDegats(isMultiTarget ? effectStats.degatsMulti : effectStats.degats)}</span>
                    </div>`;
                break;
            case 'barriere':
                effectsHTML += `
                    <div class="preview-stat">
                        <div class="preview-stat-icon">🛡️</div>
                        <span class="preview-stat-label">Barrière${niveauTag}</span>
                        <span class="preview-stat-value">${formatDegats(isMultiTarget ? effectStats.degatsMulti : effectStats.degats)}</span>
                    </div>`;
                break;
            case 'buff':
            case 'debuff': {
                const isBuff = effect.type === 'buff';
                // Clamp to min 1 to prevent NIVEAU_TABLE[0] crash when isMultiTarget && effect.niveau === 1
                const bmNiv = Math.max(1, isMultiTarget ? effect.niveau - 1 : effect.niveau);
                const bmVal = NIVEAU_TABLE[bmNiv].bonusMalus;
                effectsHTML += `
                    <div class="preview-stat">
                        <div class="preview-stat-icon">${isBuff ? '⬆️' : '⬇️'}</div>
                        <span class="preview-stat-label">${isBuff ? 'Bonus' : 'Malus'}${isMultiTarget ? ' (multi)' : ''}${niveauTag}</span>
                        <span class="preview-stat-value">${isBuff ? '+' : '-'}${bmVal}</span>
                    </div>`;
                break;
            }
            case 'alteration':
                if (skill.alterationType) {
                    effectsHTML += `
                        <div class="preview-stat">
                            <div class="preview-stat-icon">🌀</div>
                            <span class="preview-stat-label">Altération${niveauTag}</span>
                            <span class="preview-stat-value">${getAlterationLabel(skill.alterationType)}</span>
                        </div>`;
                }
                break;
            case 'drain': {
                const drainDegats = formatDegats(effectStats.degatsMulti);
                effectsHTML += `
                    <div class="preview-stat">
                        <div class="preview-stat-icon">🩸</div>
                        <span class="preview-stat-label">Drain${skill.drainType ? ' (' + getDrainTypeLabel(skill.drainType) + ')' : ''}${niveauTag}</span>
                        <span class="preview-stat-value">${drainDegats}</span>
                    </div>
                    <div class="preview-stat">
                        <div class="preview-stat-icon">💚</div>
                        <span class="preview-stat-label">Soin (lanceur)</span>
                        <span class="preview-stat-value">${drainDegats}</span>
                    </div>`;
                break;
            }
        }
    });

    return `
        <div class="card-title-bar">
            <h3 class="preview-name">${skill.name}</h3>
        </div>
        <div class="card-content">
            <div class="card-image">
                ${skill.image
                    ? `<canvas id="previewImageCanvas" width="260" height="300"></canvas>`
                    : '<div class="card-image-placeholder">🎴</div>'}
                <div class="card-type-badge" style="${getTypeBadgeStyle()}">${getSortTypeLabel(skill.sortType)}${skill.isPassif ? ' · Passif' : ''}</div>
                <canvas id="rankBadgeCanvas" class="card-rank-badge" width="60" height="70"></canvas>
            </div>
            <div class="card-body">
                <div class="preview-desc">${skill.desc}</div>

                <div class="preview-stat">
                    <div class="preview-stat-icon">💪</div>
                    <span class="preview-stat-label">Caractéristique</span>
                    <span class="preview-stat-value">${getCaracLabel(skill.carac)}</span>
                </div>
                <div class="preview-stat">
                    <div class="preview-stat-icon">⚡</div>
                    <span class="preview-stat-label">Actions</span>
                    <span class="preview-stat-value">${getActionsLabel(skill.sortType)}</span>
                </div>
                ${isPassif ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">💎</div>
                    <span class="preview-stat-label">Coût (max)</span>
                    ${coutHTML}
                </div>` : ''}
                ${ciblesHTML}
                ${porteeHTML}
                ${effectsHTML}
            </div>
        </div>
    `;
}

// ============================================================
// Rendu des étapes
// ============================================================
function renderStep() {
    const content = document.getElementById('stepContent');

    switch (currentStep) {
        // --------------------------------------------------
        case 1: // Identité
            content.innerHTML = `
                <h2 class="step-title">✨ Identité</h2>
                <p class="step-description">Donnez un nom et une description à votre capacité, et ajoutez une image si vous le souhaitez.</p>

                <div class="input-group">
                    <label class="input-label">Nom de la Capacité</label>
                    <input type="text" class="text-input" id="skillName"
                           placeholder="Ex: Boule de Feu"
                           value="${skill.name}"
                           oninput="skill.name = this.value || 'Capacité Sans Nom'; updateNextBtn();">
                </div>

                <div class="input-group">
                    <label class="input-label">Description</label>
                    <textarea class="text-input" id="skillDesc"
                              placeholder="Décrivez l'effet de la capacité..."
                              oninput="skill.desc = this.value || 'Description manquante.'">${skill.desc}</textarea>
                </div>

                <div class="input-group">
                    <label class="input-label">Image de la Capacité</label>
                    <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;">Glissez pour positionner • Molette pour zoomer</p>
                    <div style="position: relative; width: 100%; max-width: 400px; margin: 0 auto;">
                        <canvas id="skillImageCanvas" width="260" height="300"
                                style="border: 3px solid var(--primary); border-radius: 12px; cursor: move; background: rgba(30, 45, 63, 0.5); display: block; width: 100%; aspect-ratio: 260/300; touch-action: none;"></canvas>
                        <input type="file" id="skillImageInput" accept="image/*" style="display: none;">
                        <button type="button" onclick="document.getElementById('skillImageInput').click()"
                                style="position: absolute; bottom: 10px; right: 10px; width: 40px; height: 40px; border-radius: 50%; background: var(--primary); border: none; color: var(--secondary); font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                            📷
                        </button>
                    </div>
                    <div style="text-align: center; margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center; max-width: 400px; margin: 1rem auto 0;">
                        <button type="button" class="btn btn-secondary" onclick="zoomSkillImage(-0.1)" style="padding: 0.5rem 1rem;">−</button>
                        <button type="button" class="btn btn-secondary" onclick="zoomSkillImage(0.1)" style="padding: 0.5rem 1rem;">+</button>
                        <button type="button" class="btn btn-secondary" onclick="resetSkillImagePosition()" style="padding: 0.5rem 1rem;">↻</button>
                    </div>
                </div>

                <div class="action-buttons">
                    <div></div>
                    <button class="btn btn-primary" id="nextBtn1" onclick="nextStep()">Suivant →</button>
                </div>
            `;
            // Initialiser le canvas après injection du HTML
            initSkillImageCanvas();
            document.getElementById('skillImageInput').addEventListener('change', loadSkillImage);
            updateNextBtn();
            break;

        // --------------------------------------------------
        case 2: // Niveau
            const tableRows = Object.entries(NIVEAU_TABLE).map(([niv, stats]) => {
                const isActive = parseInt(niv) === skill.niveau;
                return `<tr class="${isActive ? 'active-row' : ''}">
                    <td>${niv}</td>
                    <td>${stats.cibles}</td>
                    <td>${stats.zone}</td>
                    <td>±${stats.bonusMalus}</td>
                    <td>${stats.degats}</td>
                    <td>${stats.degatsMulti}</td>
                </tr>`;
            }).join('');

            content.innerHTML = `
                <h2 class="step-title">📊 Niveau du Sort</h2>
                <p class="step-description">Choisissez le niveau de votre capacité. Plus le niveau est élevé, plus la capacité est puissante — et coûteuse.</p>

                <div class="niveau-selector" id="niveauSelector">
                    ${[1,2,3,4,5].map(n => `
                        <button class="niveau-btn ${n === skill.niveau ? 'active' : ''}"
                                onclick="selectNiveau(${n})" data-niveau="${n}">${n}</button>
                    `).join('')}
                </div>

                <div style="overflow-x: auto;">
                    <table class="stats-table" id="statsTable">
                        <thead>
                            <tr>
                                <th>Niveau</th>
                                <th>Cibles</th>
                                <th>Zone</th>
                                <th>Bonus/Malus</th>
                                <th>Dégâts (mono)</th>
                                <th>Dégâts (multi/zone/chaîne)</th>
                            </tr>
                        </thead>
                        <tbody id="statsBody">${tableRows}</tbody>
                    </table>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="prevStep()">← Précédent</button>
                    <button class="btn btn-primary" onclick="nextStep()">Suivant →</button>
                </div>
            `;
            break;

        // --------------------------------------------------
        case 3: // Type de Sort + Effet
            const types = [
                { id: 'mono',   icon: '🎯', name: 'Mono-cible',  desc: '1 action · 1 cible directe' },
                { id: 'zone',   icon: '💥', name: 'Zone',         desc: '2 actions · zone de portée complète' },
                { id: 'multi',  icon: '👥', name: 'Multi-cible',  desc: '2 actions · plusieurs cibles choisies' },
                { id: 'chaine', icon: '⛓️', name: 'Chaîne',       desc: '2 actions · rebondit de cible en cible' }
            ];

            const effects = [
                { id: 'degats',    icon: '⚔️', name: 'Dégâts',    desc: 'Inflige des dégâts à la cible' },
                { id: 'soin',      icon: '💚', name: 'Soin',      desc: 'Restaure des points de vie' },
                { id: 'barriere',  icon: '🛡️', name: 'Barrière',  desc: 'Absorbe les dégâts reçus (puissance = dégâts)' },
                { id: 'buff',      icon: '⬆️', name: 'Buff',      desc: 'Applique un bonus à une caractéristique' },
                { id: 'debuff',    icon: '⬇️', name: 'Débuff',    desc: 'Applique un malus à une caractéristique' },
                { id: 'alteration',icon: '🌀', name: 'Altération', desc: 'Immobilisation, téléportation, étourdissement...' },
                { id: 'drain',     icon: '🩸', name: 'Drain',     desc: 'Dégâts (zone) sur une cible, soigne le lanceur d\'autant' }
            ];

            const alterations = [
                { id: 'immobilisation', icon: '⛓️', name: 'Immobilisation', desc: 'La cible ne peut plus se déplacer' },
                { id: 'teleportation',  icon: '✨', name: 'Téléportation',  desc: 'Déplace la cible ou le lanceur' },
                { id: 'etourdissement', icon: '💫', name: 'Étourdissement', desc: 'La cible perd son prochain tour' }
            ];

            const drains = [
                { id: 'vie',       icon: '❤️', name: 'Vie',       desc: 'Draine les points de vie de la cible' },
                { id: 'mana',      icon: '🔮', name: 'Mana',      desc: 'Draine le mana de la cible' },
                { id: 'endurance', icon: '💨', name: 'Endurance', desc: "Draine l'endurance de la cible" }
            ];

            content.innerHTML = `
                <h2 class="step-title">✨ Type & Effet</h2>
                <p class="step-description">Choisissez comment votre capacité se manifeste et quel effet elle produit.</p>

                <label class="input-label" style="margin-bottom: 0.75rem; display: block;">Forme du sort</label>
                <div class="type-grid" id="sortTypeGrid" style="margin-bottom: 1.5rem;">
                    ${types.map(t => `
                        <div class="type-option ${skill.sortType === t.id ? 'selected' : ''}"
                             data-id="${t.id}"
                             onclick="selectSortType('${t.id}')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${t.icon}</div>
                            <div class="type-option-name">${t.name}</div>
                            <div class="type-option-desc">${t.desc}</div>
                        </div>
                    `).join('')}
                </div>

                <label class="passif-toggle ${skill.isPassif ? 'active' : ''}" id="passifToggle" onclick="togglePassif()">
                    <span class="passif-toggle-icon">♾️</span>
                    <div>
                        <div class="passif-toggle-name">Capacité Passive</div>
                        <div class="passif-toggle-desc">Permanente · réduit le max de la ressource de ${skill.niveau} point${skill.niveau > 1 ? 's' : ''}</div>
                    </div>
                    <div class="passif-toggle-check">${skill.isPassif ? '✓' : ''}</div>
                </label>

                <div id="effectSection">
                    <label class="input-label" style="margin-bottom: 0.75rem; display: block;">Effet(s) produit(s) <span style="font-size: 0.8rem; opacity: 0.6;">(cliquez pour ajouter/retirer, max ${skill.niveau} effets)</span></label>
                    <div class="type-grid" id="effectGrid">
                        ${effects.map(e => `
                            <div class="type-option ${hasEffect(e.id) ? 'selected' : ''}"
                                 data-effect="${e.id}"
                                 onclick="toggleEffect('${e.id}')">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${e.icon}</div>
                                <div class="type-option-name">${e.name}</div>
                                <div class="type-option-desc">${e.desc}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div id="distributionSection" style="${skill.effects.length > 1 ? '' : 'display:none;'}"></div>

                    <div id="alterationSection" style="margin-top: 1.5rem; ${hasEffect('alteration') ? '' : 'display:none;'}">
                        <label class="input-label" style="margin-bottom: 0.75rem; display: block;">Type d'altération</label>
                        <div class="type-grid" id="alterationTypeGrid">
                            ${alterations.map(a => `
                                <div class="type-option ${skill.alterationType === a.id ? 'selected' : ''}"
                                     data-id="${a.id}"
                                     onclick="selectAlterationType('${a.id}')">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">${a.icon}</div>
                                    <div class="type-option-name">${a.name}</div>
                                    <div class="type-option-desc">${a.desc}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div id="drainSection" style="margin-top: 1.5rem; ${hasEffect('drain') ? '' : 'display:none;'}">
                        <label class="input-label" style="margin-bottom: 0.75rem; display: block;">Ressource drainée</label>
                        <div class="type-grid" id="drainTypeGrid">
                            ${drains.map(d => `
                                <div class="type-option ${skill.drainType === d.id ? 'selected' : ''}"
                                     data-id="${d.id}"
                                     onclick="selectDrainType('${d.id}')">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">${d.icon}</div>
                                    <div class="type-option-name">${d.name}</div>
                                    <div class="type-option-desc">${d.desc}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="prevStep()">← Précédent</button>
                    <button class="btn btn-primary" onclick="nextStep()">Suivant →</button>
                </div>
            `;
            // Rendre la section de répartition si multi-effets
            if (skill.effects.length > 1) {
                renderDistribution();
            }
            break;

        // --------------------------------------------------
        case 4: // Ressource & Caractéristique
            content.innerHTML = `
                <h2 class="step-title">⚙️ Ressource & Caractéristique</h2>
                <p class="step-description">Définissez quelle ressource est dépensée et quelle caractéristique influence cette capacité.</p>

                <div class="input-group">
                    <label class="input-label">Type de Ressource</label>
                    <select id="resourceType" class="text-input" onchange="skill.resourceType = this.value">
                        <option value="mana"      ${skill.resourceType === 'mana'      ? 'selected' : ''}>Mana</option>
                        <option value="endurance" ${skill.resourceType === 'endurance' ? 'selected' : ''}>Endurance</option>
                        <option value="sante"     ${skill.resourceType === 'sante'     ? 'selected' : ''}>Santé (PV)</option>
                        <option value="objet"     ${skill.resourceType === 'objet'     ? 'selected' : ''}>Objet</option>
                    </select>
                </div>

                <div class="input-group">
                    <label class="input-label">Caractéristique (Mod.carac)</label>
                    <select id="caracSelect" class="text-input" onchange="onCaracChange(this.value)">
                        <option value="INT"   ${skill.carac === 'INT'   ? 'selected' : ''}>Intelligence (Mod.INT)</option>
                        <option value="FOR"   ${skill.carac === 'FOR'   ? 'selected' : ''}>Force (Mod.FOR)</option>
                        <option value="AGI"   ${skill.carac === 'AGI'   ? 'selected' : ''}>Agilité (Mod.AGI)</option>
                        <option value="AUTRE" ${skill.carac === 'AUTRE' ? 'selected' : ''}>Autre (personnalisé)</option>
                    </select>
                </div>

                <div class="input-group" id="caracCustomGroup" style="${skill.carac === 'AUTRE' ? '' : 'display:none;'}">
                    <label class="input-label">Nom de la caractéristique</label>
                    <input type="text" class="text-input" id="caracCustomInput"
                           placeholder="Ex: Charisme, Niveau, Valeur d'objet..."
                           value="${skill.caracCustom}"
                           oninput="skill.caracCustom = this.value.trim()">
                </div>

                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="prevStep()">← Précédent</button>
                    <button class="btn btn-primary" onclick="nextStep()">Voir le récapitulatif →</button>
                </div>
            `;
            break;

        // --------------------------------------------------
        case 5: // Récapitulatif
            content.innerHTML = `
                <h2 class="step-title">📜 Récapitulatif</h2>
                <p class="step-description">Voici votre capacité. Vous pouvez l'exporter ou revenir modifier les étapes précédentes.</p>

                <div style="display: flex; justify-content: center; margin-bottom: 2rem;">
                    <div class="preview-skill" id="previewCard" style="width: 100%; max-width: 700px;">
                        ${generatePreviewCard()}
                    </div>
                </div>

                <div class="action-buttons" style="flex-wrap: wrap; gap: 0.75rem;">
                    <button class="btn btn-secondary" onclick="prevStep()">← Précédent</button>
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="downloadSkillPNG()">🖼️ PNG</button>
                        <button class="btn btn-primary" onclick="saveSkill()">💾 JSON</button>
                        <button class="btn btn-secondary" onclick="loadSkill()">📁 Charger</button>
                        <button class="btn btn-secondary" onclick="resetSkill()">🔄 Recommencer</button>
                    </div>
                </div>
            `;
            // Dessiner l'image et le badge de rang après injection du DOM
            setTimeout(() => {
                drawRankBadge();
                if (skill.image) updatePreviewImageCanvas();
            }, 0);
            break;
    }
}

// ============================================================
// Actions sur l'étape 2 (niveau)
// ============================================================
function selectNiveau(n) {
    skill.niveau = n;

    // Retirer les effets en excès si le nouveau niveau est inférieur au nombre d'effets
    while (skill.effects.length > n) {
        const removed = skill.effects.pop();
        if (removed.type === 'alteration') skill.alterationType = null;
        if (removed.type === 'drain') skill.drainType = null;
    }

    // Redistribuer les niveaux d'effets
    redistributeNiveaux();

    // Mettre à jour les boutons
    document.querySelectorAll('.niveau-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.niveau) === n);
    });
    // Mettre à jour le tableau (surbrillance de la ligne)
    document.querySelectorAll('#statsBody tr').forEach((row, i) => {
        row.classList.toggle('active-row', i + 1 === n);
    });
}

// ============================================================
// Actions sur l'étape 3 (type + effet)
// ============================================================
function selectSortType(id) {
    skill.sortType = id;
    const grid = document.getElementById('sortTypeGrid');
    if (grid) {
        grid.querySelectorAll('.type-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === id);
        });
    }
}

function togglePassif() {
    skill.isPassif = !skill.isPassif;
    const toggle = document.getElementById('passifToggle');
    if (toggle) {
        toggle.classList.toggle('active', skill.isPassif);
        toggle.querySelector('.passif-toggle-check').textContent = skill.isPassif ? '✓' : '';
    }
}

function toggleEffect(id) {
    const existingIndex = skill.effects.findIndex(e => e.type === id);

    if (existingIndex !== -1) {
        // Ne pas supprimer le dernier effet
        if (skill.effects.length <= 1) return;
        skill.effects.splice(existingIndex, 1);
        if (id === 'alteration') skill.alterationType = null;
        if (id === 'drain') skill.drainType = null;
    } else {
        // Vérifier qu'on peut ajouter (1 niveau minimum par effet)
        if (skill.effects.length >= skill.niveau) return;
        skill.effects.push({ type: id, niveau: 1 });
    }

    // Redistribuer les niveaux
    redistributeNiveaux();

    // Mettre à jour la sélection visuelle dans la grille
    const effectGrid = document.getElementById('effectGrid');
    if (effectGrid) {
        effectGrid.querySelectorAll('.type-option').forEach(el => {
            const elType = el.getAttribute('data-effect');
            el.classList.toggle('selected', hasEffect(elType));
        });
    }

    // Afficher/masquer la sous-section altération
    const alterationSection = document.getElementById('alterationSection');
    if (alterationSection) {
        alterationSection.style.display = hasEffect('alteration') ? '' : 'none';
    }

    // Afficher/masquer la sous-section drain
    const drainSection = document.getElementById('drainSection');
    if (drainSection) {
        drainSection.style.display = hasEffect('drain') ? '' : 'none';
    }

    // Mettre à jour la section de répartition
    renderDistribution();
}

function adjustEffectNiveau(index, delta) {
    const effect = skill.effects[index];
    const newNiveau = effect.niveau + delta;

    if (newNiveau < 1) return;
    const maxPossible = skill.niveau - (skill.effects.length - 1);
    if (newNiveau > maxPossible) return;

    // Trouver un autre effet pour compenser
    let compensateIndex = -1;
    for (let i = 0; i < skill.effects.length; i++) {
        if (i === index) continue;
        if (delta > 0 && skill.effects[i].niveau > 1) { compensateIndex = i; break; }
        if (delta < 0) { compensateIndex = i; break; }
    }

    if (compensateIndex === -1) return;

    effect.niveau = newNiveau;
    skill.effects[compensateIndex].niveau -= delta;

    renderDistribution();
}

function renderDistribution() {
    const container = document.getElementById('distributionSection');
    if (!container) return;

    if (skill.effects.length <= 1) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = '';
    let html = `<label class="input-label" style="margin-bottom: 0.75rem; display: block;">Répartition des niveaux (Total : ${skill.niveau})</label>`;

    skill.effects.forEach((effect, index) => {
        const canDecrease = effect.niveau > 1;
        const maxPossible = skill.niveau - (skill.effects.length - 1);
        // Also require a compensating effect with niveau > 1; otherwise the + action silently fails
        const canIncrease = effect.niveau < maxPossible
            && skill.effects.some((e, i) => i !== index && e.niveau > 1);

        html += `
            <div class="distribution-row">
                <span class="distribution-icon">${getEffectIcon(effect.type)}</span>
                <span class="distribution-label">${getEffectLabel(effect.type)}</span>
                <button class="distribution-btn ${canDecrease ? '' : 'disabled'}" onclick="adjustEffectNiveau(${index}, -1)" ${canDecrease ? '' : 'disabled'}>−</button>
                <span class="distribution-value">${effect.niveau}</span>
                <button class="distribution-btn ${canIncrease ? '' : 'disabled'}" onclick="adjustEffectNiveau(${index}, 1)" ${canIncrease ? '' : 'disabled'}>+</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function selectAlterationType(id) {
    skill.alterationType = id;
    const grid = document.getElementById('alterationTypeGrid');
    if (grid) {
        grid.querySelectorAll('.type-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === id);
        });
    }
}

function selectDrainType(id) {
    skill.drainType = id;
    const grid = document.getElementById('drainTypeGrid');
    if (grid) {
        grid.querySelectorAll('.type-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === id);
        });
    }
}

// ============================================================
// Actions sur l'étape 4 (ressource & caractéristique)
// ============================================================
function onCaracChange(value) {
    skill.carac = value;
    const group = document.getElementById('caracCustomGroup');
    if (group) group.style.display = value === 'AUTRE' ? '' : 'none';
    // Reset custom name when switching away
    if (value !== 'AUTRE') skill.caracCustom = '';
}

// ============================================================
// Validation du bouton Suivant (étape 1)
// ============================================================
function updateNextBtn() {
    const btn = document.getElementById('nextBtn1');
    if (!btn) return;
    const name = document.getElementById('skillName')?.value?.trim();
    btn.disabled = !name;
}

// ============================================================
// Canvas image — inchangé
// ============================================================
function initSkillImageCanvas() {
    skillImageCanvas = document.getElementById('skillImageCanvas');
    if (!skillImageCanvas) return;

    skillImageCtx = skillImageCanvas.getContext('2d');

    skillImageCanvas.addEventListener('mousedown', startDragSkillImage);
    skillImageCanvas.addEventListener('mousemove', dragSkillImage);
    skillImageCanvas.addEventListener('mouseup', endDragSkillImage);
    skillImageCanvas.addEventListener('mouseleave', endDragSkillImage);

    skillImageCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = skillImageCanvas.getBoundingClientRect();
        startDragSkillImage({ offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top });
    }, { passive: false });

    skillImageCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = skillImageCanvas.getBoundingClientRect();
        dragSkillImage({ offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top });
    }, { passive: false });

    skillImageCanvas.addEventListener('touchend', endDragSkillImage);

    let lastPinchDist = null;
    skillImageCanvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (lastPinchDist !== null) zoomSkillImage((dist - lastPinchDist) * 0.005);
            lastPinchDist = dist;
        }
    }, { passive: false });
    skillImageCanvas.addEventListener('touchend', () => { lastPinchDist = null; });

    skillImageCanvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        zoomSkillImage(e.deltaY > 0 ? -0.05 : 0.05);
    });

    if (skill.image) {
        drawSkillImageOnCanvas();
    } else {
        drawSkillImagePlaceholder();
    }
}

function drawSkillImagePlaceholder() {
    if (!skillImageCtx || !skillImageCanvas) return;
    const W = skillImageCanvas.width;
    const H = skillImageCanvas.height;
    skillImageCtx.clearRect(0, 0, W, H);
    skillImageCtx.fillStyle = 'rgba(30, 45, 63, 0.5)';
    skillImageCtx.fillRect(0, 0, W, H);
    skillImageCtx.fillStyle = 'rgba(200, 155, 60, 0.3)';
    skillImageCtx.font = '60px Arial';
    skillImageCtx.textAlign = 'center';
    skillImageCtx.textBaseline = 'middle';
    skillImageCtx.fillText('🎴', W / 2, H / 2);
}

function drawSkillImageOnCanvas() {
    if (!skill.image || !skillImageCtx || !skillImageCanvas) return;
    const img = new Image();
    img.onload = function () {
        const W = skillImageCanvas.width;
        const H = skillImageCanvas.height;
        skillImageCtx.clearRect(0, 0, W, H);
        const scale = skill.imagePosition.scale;
        const coverScale = Math.max(W / img.width, H / img.height) * scale;
        const drawW = img.width  * coverScale;
        const drawH = img.height * coverScale;
        const x = W / 2 + skill.imagePosition.x - drawW / 2;
        const y = H / 2 + skill.imagePosition.y - drawH / 2;
        skillImageCtx.drawImage(img, x, y, drawW, drawH);
        updatePreviewImageCanvas();
    };
    img.src = skill.image;
}

function updatePreviewImageCanvas() {
    if (!skill.image) return;
    const previewCanvas = document.getElementById('previewImageCanvas');
    if (!previewCanvas) return;
    // Buffer stays at 260×300 — CSS width/height:100% stretches it visually to fill .card-image
    const W = 260, H = 300;
    const ctx = previewCanvas.getContext('2d');
    const img = new Image();
    img.onload = function () {
        ctx.clearRect(0, 0, W, H);
        const scale      = skill.imagePosition.scale;
        const coverScale = Math.max(W / img.width, H / img.height) * scale;
        const drawW      = img.width  * coverScale;
        const drawH      = img.height * coverScale;
        const x = W / 2 + skill.imagePosition.x - drawW / 2;
        const y = H / 2 + skill.imagePosition.y - drawH / 2;
        ctx.drawImage(img, x, y, drawW, drawH);
    };
    img.src = skill.image;
}

function startDragSkillImage(e) {
    if (!skill.image) return;
    isDraggingSkillImage = true;
    lastSkillMousePos = { x: e.offsetX, y: e.offsetY };
}

function dragSkillImage(e) {
    if (!isDraggingSkillImage || !skill.image) return;
    // e.offsetX is in CSS display pixels; imagePosition must be in internal canvas pixels
    // → scale by internal/display ratio so the editor behaves identically to the card preview
    const rect = skillImageCanvas.getBoundingClientRect();
    const sx = skillImageCanvas.width  / rect.width;
    const sy = skillImageCanvas.height / rect.height;
    skill.imagePosition.x += (e.offsetX - lastSkillMousePos.x) * sx;
    skill.imagePosition.y += (e.offsetY - lastSkillMousePos.y) * sy;
    lastSkillMousePos = { x: e.offsetX, y: e.offsetY };
    drawSkillImageOnCanvas();
}

function endDragSkillImage() {
    isDraggingSkillImage = false;
}

function zoomSkillImage(delta) {
    if (!skill.image) return;
    skill.imagePosition.scale = Math.max(0.5, Math.min(3, skill.imagePosition.scale + delta));
    drawSkillImageOnCanvas();
}

function resetSkillImagePosition() {
    if (!skill.image) return;
    skill.imagePosition = { x: 0, y: 0, scale: 1 };
    drawSkillImageOnCanvas();
}

function loadSkillImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        skill.image = e.target.result;
        skill.imagePosition = { x: 0, y: 0, scale: 1 };
        drawSkillImageOnCanvas();
        const container = skillImageCanvas?.parentElement;
        if (container && !container.querySelector('.remove-skill-img-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'remove-skill-img-btn';
            btn.textContent = '✕';
            btn.onclick = removeSkillImage;
            btn.style.cssText = 'position:absolute;top:10px;right:10px;width:35px;height:35px;border-radius:50%;background:var(--danger);border:none;color:white;font-size:1rem;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
            container.appendChild(btn);
        }
    };
    reader.readAsDataURL(file);
}

function removeSkillImage() {
    skill.image = null;
    skill.imagePosition = { x: 0, y: 0, scale: 1 };
    drawSkillImagePlaceholder();
    const btn = document.querySelector('.remove-skill-img-btn');
    if (btn) btn.remove();
}

// ============================================================
// Export PNG
// ============================================================
async function downloadSkillPNG() {
    const card = document.getElementById('previewCard');
    if (!card) return;
    try {
        const canvas = await html2canvas(card, {
            backgroundColor: '#1a1a2e',
            scale: 2,
            logging: false,
            useCORS: true
        });
        canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${skill.name.replace(/\s+/g, '_')}_carte.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    } catch (error) {
        console.error('Erreur lors de la génération du PNG:', error);
        alert('Erreur lors de la génération de l\'image');
    }
}

// ============================================================
// Sauvegarde / Chargement / Réinitialisation
// ============================================================
function saveSkill() {
    const data = JSON.stringify(skill, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function loadSkill() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loaded = JSON.parse(event.target.result);
                // Compatibilité avec les anciens fichiers
                // Rétrocompat : ancien format utilisait sortType: 'passif'
                const legacyPassif = loaded.sortType === 'passif';
                const loadedNiveau = loaded.niveau ?? 1;

                // Rétrocompat : ancien format avait effectType (string), nouveau a effects (array)
                let loadedEffects;
                if (loaded.effects && Array.isArray(loaded.effects)) {
                    loadedEffects = loaded.effects;
                } else {
                    const oldEffectType = loaded.effectType ?? 'degats';
                    loadedEffects = [{ type: oldEffectType, niveau: loadedNiveau }];
                }

                skill = {
                    name:          loaded.name          ?? 'Capacité Sans Nom',
                    desc:          loaded.desc          ?? 'Description manquante.',
                    niveau:        loadedNiveau,
                    isPassif:      loaded.isPassif      ?? legacyPassif,
                    sortType:      legacyPassif ? 'mono' : (loaded.sortType ?? 'mono'),
                    effects:       loadedEffects,
                    alterationType:loaded.alterationType?? null,
                    drainType:     loaded.drainType     ?? null,
                    resourceType:  loaded.resourceType  ?? 'mana',
                    carac:         loaded.carac         ?? (loaded.statType ?? 'INT'),
                    caracCustom:   loaded.caracCustom   ?? '',
                    image:         loaded.image         ?? null,
                    imagePosition: loaded.imagePosition ?? { x: 0, y: 0, scale: 1 }
                };
                // Aller directement au récap
                currentStep = 5;
                renderProgressBar();
                renderStep();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                alert('Erreur lors du chargement du fichier');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetSkill() {
    if (confirm('Êtes-vous sûr de vouloir recommencer ?')) {
        skill = {
            name: 'Capacité Sans Nom',
            desc: 'Une capacité magique puissante.',
            niveau: 1,
            isPassif: false,
            sortType: 'mono',
            effects: [{ type: 'degats', niveau: 1 }],
            alterationType: null,
            drainType: null,
            resourceType: 'mana',
            carac: 'INT',
            caracCustom: '',
            image: null,
            imagePosition: { x: 0, y: 0, scale: 1 }
        };
        currentStep = 1;
        renderProgressBar();
        renderStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================================
// Initialisation
// ============================================================
function init() {
    renderProgressBar();
    renderStep();
}

init();
