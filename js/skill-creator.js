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
    sortType: 'mono',
    effectType: 'degats',   // 'degats' | 'soin' | 'barriere' | 'buff' | 'debuff' | 'alteration'
    alterationType: null,   // 'immobilisation' | 'teleportation' | 'etourdissement'
    resourceType: 'mana',
    carac: 'INT',
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
        chaine: 'Chaîne',
        passif: 'Passif'
    };
    return labels[sortType] || sortType;
}

function formatDegats(template) {
    return template.replace('Mod.carac', `Mod.${skill.carac}`);
}

function getActionsLabel(sortType) {
    if (sortType === 'passif') return 'Permanent';
    return sortType === 'mono' ? '1 action' : '2 actions';
}

function getResourceLabel(resourceType) {
    const labels = { mana: 'Mana', endurance: 'Endurance', sante: 'PV' };
    return labels[resourceType] || resourceType;
}

function getCaracLabel(carac) {
    const labels = { INT: 'Intelligence (INT)', FOR: 'Force (FOR)', AGI: 'Agilité (AGI)' };
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
    const isPassif      = skill.sortType === 'passif';
    const isMultiTarget = ['zone', 'multi', 'chaine'].includes(skill.sortType);
    const isMulti       = skill.sortType === 'multi';
    const isZoneOrChain = ['zone', 'chaine'].includes(skill.sortType);

    // Coût
    const coutHTML = isPassif
        ? `<span class="preview-stat-value" style="color: var(--success);">Réduction max. -${skill.niveau} ${getResourceLabel(skill.resourceType)}</span>`
        : `<span class="preview-stat-value">${skill.niveau} ${getResourceLabel(skill.resourceType)}</span>`;

    // Cibles : seulement pour multi-cible
    const ciblesHTML = isMulti ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">🎯</div>
            <span class="preview-stat-label">Cibles</span>
            <span class="preview-stat-value">${stats.cibles}</span>
        </div>` : '';

    // Portée/Zone : seulement si pas mono-cible
    const porteeHTML = (!isPassif && skill.sortType !== 'mono') ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">📍</div>
            <span class="preview-stat-label">${isZoneOrChain ? 'Zone' : 'Portée'}</span>
            <span class="preview-stat-value">${stats.zone}</span>
        </div>` : '';

    // Dégâts : seulement si effectType === 'degats'
    const degatsHTML = (!isPassif && skill.effectType === 'degats') ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">⚔️</div>
            <span class="preview-stat-label">Dégâts</span>
            <span class="preview-stat-value">${formatDegats(isMultiTarget ? stats.degatsMulti : stats.degats)}</span>
        </div>` : '';

    // Soins : seulement si effectType === 'soin'
    const soinsHTML = (!isPassif && skill.effectType === 'soin') ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">💚</div>
            <span class="preview-stat-label">Soins</span>
            <span class="preview-stat-value">${formatDegats(isMultiTarget ? stats.degatsMulti : stats.degats)}</span>
        </div>` : '';

    // Barrière : seulement si effectType === 'barriere', puissance = dégâts
    const barriereHTML = (!isPassif && skill.effectType === 'barriere') ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">🛡️</div>
            <span class="preview-stat-label">Barrière</span>
            <span class="preview-stat-value">${formatDegats(isMultiTarget ? stats.degatsMulti : stats.degats)}</span>
        </div>` : '';

    // Bonus/Malus : seulement si buff ou debuff
    // Si multi-cible, la valeur est celle du niveau inférieur (niveau - 1, minimum 1)
    const bonusMalusNiveau = (isMultiTarget && skill.niveau > 1) ? skill.niveau - 1 : skill.niveau;
    const bonusMalusVal = NIVEAU_TABLE[bonusMalusNiveau].bonusMalus;
    const bonusMalusHTML = (!isPassif && (skill.effectType === 'buff' || skill.effectType === 'debuff')) ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">${skill.effectType === 'buff' ? '⬆️' : '⬇️'}</div>
            <span class="preview-stat-label">${skill.effectType === 'buff' ? 'Bonus' : 'Malus'}${isMultiTarget ? ' (multi)' : ''}</span>
            <span class="preview-stat-value">${skill.effectType === 'buff' ? '+' : '-'}${bonusMalusVal}</span>
        </div>` : '';

    // Altération : seulement si effectType === 'alteration' et un type est choisi
    const alterationHTML = (!isPassif && skill.effectType === 'alteration' && skill.alterationType) ? `
        <div class="preview-stat">
            <div class="preview-stat-icon">🌀</div>
            <span class="preview-stat-label">Altération</span>
            <span class="preview-stat-value">${getAlterationLabel(skill.alterationType)}</span>
        </div>` : '';

    return `
        <div class="card-title-bar">
            <h3 class="preview-name">${skill.name}</h3>
        </div>
        <div class="card-image">
            ${skill.image
                ? `<canvas id="previewImageCanvas" width="400" height="280" style="width: 100%; height: 100%;"></canvas>`
                : '<div class="card-image-placeholder">🎴</div>'}
            <div class="card-type-badge">${getSortTypeLabel(skill.sortType)}</div>
            <div class="card-rank-badge">${skill.niveau}</div>
        </div>
        <div class="card-body">
            <div class="preview-desc">${skill.desc}</div>

            <div class="preview-stat">
                <div class="preview-stat-icon">💎</div>
                <span class="preview-stat-label">Coût</span>
                ${coutHTML}
            </div>
            <div class="preview-stat">
                <div class="preview-stat-icon">⚡</div>
                <span class="preview-stat-label">Actions</span>
                <span class="preview-stat-value">${getActionsLabel(skill.sortType)}</span>
            </div>
            ${ciblesHTML}
            ${porteeHTML}
            ${degatsHTML}
            ${soinsHTML}
            ${barriereHTML}
            ${bonusMalusHTML}
            ${alterationHTML}
            <div class="preview-stat">
                <div class="preview-stat-icon">💪</div>
                <span class="preview-stat-label">Caractéristique</span>
                <span class="preview-stat-value">${getCaracLabel(skill.carac)}</span>
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
                        <canvas id="skillImageCanvas" width="400" height="280"
                                style="border: 3px solid var(--primary); border-radius: 12px; cursor: move; background: rgba(30, 45, 63, 0.5); display: block; width: 100%; touch-action: none;"></canvas>
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
                { id: 'chaine', icon: '⛓️', name: 'Chaîne',       desc: '2 actions · rebondit de cible en cible' },
                { id: 'passif', icon: '♾️', name: 'Passif',       desc: 'Permanent · réduit le max de magie/endurance' }
            ];

            const effects = [
                { id: 'degats',    icon: '⚔️', name: 'Dégâts',    desc: 'Inflige des dégâts à la cible' },
                { id: 'soin',      icon: '💚', name: 'Soin',      desc: 'Restaure des points de vie' },
                { id: 'barriere',  icon: '🛡️', name: 'Barrière',  desc: 'Absorbe les dégâts reçus (puissance = dégâts)' },
                { id: 'buff',      icon: '⬆️', name: 'Buff',      desc: 'Applique un bonus à une caractéristique' },
                { id: 'debuff',    icon: '⬇️', name: 'Débuff',    desc: 'Applique un malus à une caractéristique' },
                { id: 'alteration',icon: '🌀', name: 'Altération', desc: 'Immobilisation, téléportation, étourdissement...' }
            ];

            const alterations = [
                { id: 'immobilisation', icon: '⛓️', name: 'Immobilisation', desc: 'La cible ne peut plus se déplacer' },
                { id: 'teleportation',  icon: '✨', name: 'Téléportation',  desc: 'Déplace la cible ou le lanceur' },
                { id: 'etourdissement', icon: '💫', name: 'Étourdissement', desc: 'La cible perd son prochain tour' }
            ];

            // Si passif, forcer effectType à null (pas affiché)
            const showEffect = skill.sortType !== 'passif';

            content.innerHTML = `
                <h2 class="step-title">✨ Type & Effet</h2>
                <p class="step-description">Choisissez comment votre capacité se manifeste et quel effet elle produit.</p>

                <label class="input-label" style="margin-bottom: 0.75rem; display: block;">Forme du sort</label>
                <div class="type-grid" style="margin-bottom: 2rem;">
                    ${types.map(t => `
                        <div class="type-option ${skill.sortType === t.id ? 'selected' : ''}"
                             onclick="selectSortType('${t.id}')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${t.icon}</div>
                            <div class="type-option-name">${t.name}</div>
                            <div class="type-option-desc">${t.desc}</div>
                        </div>
                    `).join('')}
                </div>

                <div id="effectSection" style="${skill.sortType === 'passif' ? 'display:none;' : ''}">
                    <label class="input-label" style="margin-bottom: 0.75rem; display: block;">Effet produit</label>
                    <div class="type-grid">
                        ${effects.map(e => `
                            <div class="type-option ${skill.effectType === e.id ? 'selected' : ''}"
                                 onclick="selectEffectType('${e.id}')">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${e.icon}</div>
                                <div class="type-option-name">${e.name}</div>
                                <div class="type-option-desc">${e.desc}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div id="alterationSection" style="margin-top: 1.5rem; ${skill.effectType === 'alteration' ? '' : 'display:none;'}">
                        <label class="input-label" style="margin-bottom: 0.75rem; display: block;">Type d'altération</label>
                        <div class="type-grid">
                            ${alterations.map(a => `
                                <div class="type-option ${skill.alterationType === a.id ? 'selected' : ''}"
                                     onclick="selectAlterationType('${a.id}')">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">${a.icon}</div>
                                    <div class="type-option-name">${a.name}</div>
                                    <div class="type-option-desc">${a.desc}</div>
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
                    </select>
                </div>

                <div class="input-group">
                    <label class="input-label">Caractéristique (Mod.carac)</label>
                    <select id="caracSelect" class="text-input" onchange="skill.carac = this.value">
                        <option value="INT" ${skill.carac === 'INT' ? 'selected' : ''}>Intelligence (Mod.INT)</option>
                        <option value="FOR" ${skill.carac === 'FOR' ? 'selected' : ''}>Force (Mod.FOR)</option>
                        <option value="AGI" ${skill.carac === 'AGI' ? 'selected' : ''}>Agilité (Mod.AGI)</option>
                    </select>
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
                    <div class="preview-skill" id="previewCard" style="width: 100%; max-width: 400px;">
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
            // Dessiner l'image dans la carte si elle existe
            if (skill.image) {
                setTimeout(updatePreviewImageCanvas, 0);
            }
            break;
    }
}

// ============================================================
// Actions sur l'étape 2 (niveau)
// ============================================================
function selectNiveau(n) {
    skill.niveau = n;
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
    // Mettre à jour les cartes de la forme du sort
    // Les cartes sortType sont dans le premier .type-grid, les cartes effectType dans le second
    const grids = document.querySelectorAll('.type-grid');
    if (grids[0]) {
        grids[0].querySelectorAll('.type-option').forEach(el => {
            el.classList.toggle('selected', el.getAttribute('onclick').includes(`'${id}'`));
        });
    }
    // Masquer/afficher la section effet selon passif
    const effectSection = document.getElementById('effectSection');
    if (effectSection) {
        effectSection.style.display = id === 'passif' ? 'none' : '';
    }
}

function selectEffectType(id) {
    skill.effectType = id;
    skill.alterationType = null; // réinitialiser si on change d'effet
    const grids = document.querySelectorAll('.type-grid');
    if (grids[1]) {
        grids[1].querySelectorAll('.type-option').forEach(el => {
            el.classList.toggle('selected', el.getAttribute('onclick').includes(`'${id}'`));
        });
    }
    // Afficher/masquer la sous-section altération
    const alterationSection = document.getElementById('alterationSection');
    if (alterationSection) {
        alterationSection.style.display = id === 'alteration' ? '' : 'none';
        // Déselectionner toutes les cartes d'altération si on change d'effet
        if (id !== 'alteration' && grids[2]) {
            grids[2].querySelectorAll('.type-option').forEach(el => el.classList.remove('selected'));
        }
    }
}

function selectAlterationType(id) {
    skill.alterationType = id;
    const grids = document.querySelectorAll('.type-grid');
    if (grids[2]) {
        grids[2].querySelectorAll('.type-option').forEach(el => {
            el.classList.toggle('selected', el.getAttribute('onclick').includes(`'${id}'`));
        });
    }
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
    skillImageCtx.clearRect(0, 0, 400, 280);
    skillImageCtx.fillStyle = 'rgba(30, 45, 63, 0.5)';
    skillImageCtx.fillRect(0, 0, 400, 280);
    skillImageCtx.fillStyle = 'rgba(200, 155, 60, 0.3)';
    skillImageCtx.font = '60px Arial';
    skillImageCtx.textAlign = 'center';
    skillImageCtx.textBaseline = 'middle';
    skillImageCtx.fillText('🎴', 200, 140);
}

function drawSkillImageOnCanvas() {
    if (!skill.image || !skillImageCtx || !skillImageCanvas) return;
    const img = new Image();
    img.onload = function () {
        skillImageCtx.clearRect(0, 0, 400, 280);
        const scale = skill.imagePosition.scale;
        const coverScale = Math.max(400 / img.width, 280 / img.height) * scale;
        const drawW = img.width * coverScale;
        const drawH = img.height * coverScale;
        const x = 200 + skill.imagePosition.x - drawW / 2;
        const y = 140 + skill.imagePosition.y - drawH / 2;
        skillImageCtx.drawImage(img, x, y, drawW, drawH);
        updatePreviewImageCanvas();
    };
    img.src = skill.image;
}

function updatePreviewImageCanvas() {
    if (!skill.image) return;
    const previewCanvas = document.getElementById('previewImageCanvas');
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    const img = new Image();
    img.onload = function () {
        ctx.clearRect(0, 0, 400, 280);
        const scale = skill.imagePosition.scale;
        const coverScale = Math.max(400 / img.width, 280 / img.height) * scale;
        const drawW = img.width * coverScale;
        const drawH = img.height * coverScale;
        const x = 200 + skill.imagePosition.x - drawW / 2;
        const y = 140 + skill.imagePosition.y - drawH / 2;
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
    skill.imagePosition.x += e.offsetX - lastSkillMousePos.x;
    skill.imagePosition.y += e.offsetY - lastSkillMousePos.y;
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
                skill = {
                    name:          loaded.name          ?? 'Capacité Sans Nom',
                    desc:          loaded.desc          ?? 'Description manquante.',
                    niveau:        loaded.niveau        ?? 1,
                    sortType:      loaded.sortType      ?? 'mono',
                    effectType:    loaded.effectType    ?? 'degats',
                    alterationType:loaded.alterationType?? null,
                    resourceType:  loaded.resourceType  ?? 'mana',
                    carac:         loaded.carac         ?? (loaded.statType ?? 'INT'),
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
            sortType: 'mono',
            effectType: 'degats',
            alterationType: null,
            resourceType: 'mana',
            carac: 'INT',
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
