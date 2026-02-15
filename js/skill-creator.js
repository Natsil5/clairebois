// Configuration des améliorations
const enhancements = [
    { 
        id: 'damage', 
        name: 'Augmentation de Dégâts/Soins', 
        cost: 1, 
        maxRank: 3, 
        desc: '+2/+4/+6 points de dégâts ou soins',
        values: [2, 4, 6]
    },
    { 
        id: 'barrier', 
        name: 'Barrière', 
        cost: 1, 
        maxRank: 3, 
        desc: '+4/+8/+12 points de barrière (absorbe les dégâts avant les PV)',
        values: [4, 8, 12]
    },
    { 
        id: 'aoe', 
        name: 'Aire d\'Effet', 
        cost: 1, 
        maxRank: 1, 
        desc: 'Capacité de zone (dégâts/soins ÷2, 10m de rayon ou 5m si passif)'
    },
    { 
        id: 'armorPen', 
        name: 'Réduction d\'Armure', 
        cost: 1, 
        maxRank: 3, 
        desc: 'Ignore 1/2/3 points de réduction de dégât',
        values: [1, 2, 3]
    },
    { 
        id: 'damageReduction', 
        name: 'Réduction de Dégât', 
        cost: 1, 
        maxRank: 3, 
        desc: 'Réduit 1/2/3 points de dégât supplémentaires reçus',
        values: [1, 2, 3]
    },
    { 
        id: 'statBonus', 
        name: 'Bonus de Caractéristique', 
        cost: 1, 
        maxRank: 3, 
        desc: '+10/+20/+30 à une caractéristique (FOR, AGI ou INT)',
        values: [10, 20, 30]
    },
    { 
        id: 'heal', 
        name: 'Soin', 
        cost: 1, 
        maxRank: 1, 
        desc: 'La capacité permet de soigner (3+STAT de base)'
    },
    { 
        id: 'passive', 
        name: 'Passif', 
        cost: 1, 
        maxRank: 1, 
        desc: 'Capacité passive et permanente (aucun coût en ressources, zones passives: 5m au lieu de 10m)'
    },
    { 
        id: 'summonTiny', 
        name: 'Invocation Minuscule', 
        cost: 1, 
        maxRank: 1, 
        desc: 'Invoque 2 créatures minuscules (durée: 10 tours)'
    },
    { 
        id: 'summonSmall', 
        name: 'Invocation Petite', 
        cost: 1, 
        maxRank: 1, 
        desc: 'Invoque 1 créature petite (durée: 10 tours)'
    },
    { 
        id: 'summonMedium', 
        name: 'Invocation Moyenne', 
        cost: 2, 
        maxRank: 1, 
        desc: 'Invoque 1 créature moyenne (durée: 10 tours)'
    },
    { 
        id: 'summonLarge', 
        name: 'Invocation Grande', 
        cost: 3, 
        maxRank: 1, 
        desc: 'Invoque 1 créature grande (durée: 10 tours)'
    },
    { 
        id: 'familiar', 
        name: 'Familier', 
        cost: 0, 
        maxRank: 1, 
        desc: 'Créature permanente (doit être nourrie, automatiquement passif, ne coûte pas de rang ni de ressources)'
    }
];

// État du créateur
let skill = {
    name: 'Capacité Sans Nom',
    desc: 'Une capacité magique puissante.',
    resourceType: 'mana',
    statType: 'INT',
    type: 'damage',
    baseRank: 1,
    enhancements: {},
    image: null,
    imagePosition: { x: 0, y: 0, scale: 1 }
};

// Variables pour le canvas d'image
let skillImageCanvas = null;
let skillImageCtx = null;
let isDraggingSkillImage = false;
let lastSkillMousePos = { x: 0, y: 0 };

// Initialiser le canvas d'image
function initSkillImageCanvas() {
    skillImageCanvas = document.getElementById('skillImageCanvas');
    if (!skillImageCanvas) return;
    
    skillImageCtx = skillImageCanvas.getContext('2d');
    
    // Events souris
    skillImageCanvas.addEventListener('mousedown', startDragSkillImage);
    skillImageCanvas.addEventListener('mousemove', dragSkillImage);
    skillImageCanvas.addEventListener('mouseup', endDragSkillImage);
    skillImageCanvas.addEventListener('mouseleave', endDragSkillImage);
    
    // Events tactiles (mobile)
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

    // Pinch to zoom sur mobile
    let lastPinchDist = null;
    skillImageCanvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (lastPinchDist !== null) {
                zoomSkillImage((dist - lastPinchDist) * 0.005);
            }
            lastPinchDist = dist;
        }
    }, { passive: false });
    skillImageCanvas.addEventListener('touchend', () => { lastPinchDist = null; });

    // Zoom molette (desktop)
    skillImageCanvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        zoomSkillImage(delta);
    });
    
    // Dessiner l'image si elle existe
    if (skill.image) {
        drawSkillImageOnCanvas();
    } else {
        drawSkillImagePlaceholder();
    }
}

function drawSkillImagePlaceholder() {
    if (!skillImageCtx || !skillImageCanvas) return;
    
    skillImageCtx.clearRect(0, 0, 400, 280);
    
    // Fond
    skillImageCtx.fillStyle = 'rgba(30, 45, 63, 0.5)';
    skillImageCtx.fillRect(0, 0, 400, 280);
    
    // Icône
    skillImageCtx.fillStyle = 'rgba(200, 155, 60, 0.3)';
    skillImageCtx.font = '60px Arial';
    skillImageCtx.textAlign = 'center';
    skillImageCtx.textBaseline = 'middle';
    skillImageCtx.fillText('🎴', 200, 140);
}

function drawSkillImageOnCanvas() {
    if (!skill.image || !skillImageCtx || !skillImageCanvas) return;
    
    const img = new Image();
    img.onload = function() {
        skillImageCtx.clearRect(0, 0, 400, 280);
        
        // "Cover" : respecter le ratio
        const scale = skill.imagePosition.scale;
        const coverScale = Math.max(400 / img.width, 280 / img.height) * scale;
        const drawW = img.width * coverScale;
        const drawH = img.height * coverScale;
        
        const x = 200 + skill.imagePosition.x - drawW / 2;
        const y = 140 + skill.imagePosition.y - drawH / 2;
        
        skillImageCtx.drawImage(img, x, y, drawW, drawH);
        
        // Mettre à jour aussi le canvas de prévisualisation
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
    img.onload = function() {
        ctx.clearRect(0, 0, 400, 280);
        
        // Appliquer le même calcul de "cover" que le canvas d'édition
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
    
    const dx = e.offsetX - lastSkillMousePos.x;
    const dy = e.offsetY - lastSkillMousePos.y;
    
    skill.imagePosition.x += dx;
    skill.imagePosition.y += dy;
    
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

// Charger l'image de la compétence
function loadSkillImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        skill.image = e.target.result;
        skill.imagePosition = { x: 0, y: 0, scale: 1 };
        drawSkillImageOnCanvas();
        
        // Ajouter le bouton de suppression s'il n'existe pas
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
        
        updatePreview();
    };
    reader.readAsDataURL(file);
}

// Retirer l'image
function removeSkillImage() {
    skill.image = null;
    skill.imagePosition = { x: 0, y: 0, scale: 1 };
    drawSkillImagePlaceholder();
    
    // Supprimer le bouton de suppression
    const btn = document.querySelector('.remove-skill-img-btn');
    if (btn) btn.remove();
    
    updatePreview();
}

// Télécharger la carte en PNG
async function downloadSkillPNG() {
    const card = document.getElementById('previewCard');
    
    try {
        const canvas = await html2canvas(card, {
            backgroundColor: '#1a1a2e',
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        canvas.toBlob(function(blob) {
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

// Initialisation
function init() {
    renderEnhancements();
    updatePreview();
    
    // Initialiser le canvas d'image
    initSkillImageCanvas();
    
    // Event listeners
    document.getElementById('skillName').addEventListener('input', (e) => {
        skill.name = e.target.value || 'Capacité Sans Nom';
        updatePreview();
    });
    
    document.getElementById('skillDesc').addEventListener('input', (e) => {
        skill.desc = e.target.value || 'Description manquante.';
        updatePreview();
    });
    
    document.getElementById('resourceType').addEventListener('change', (e) => {
        skill.resourceType = e.target.value;
        updatePreview();
    });
    
    document.getElementById('statType').addEventListener('change', (e) => {
        skill.statType = e.target.value;
        updatePreview();
    });
    
    document.getElementById('skillType').addEventListener('change', (e) => {
        skill.type = e.target.value;
        
        // Si on quitte le type invocation/familier, supprimer les améliorations d'invocation
        if (e.target.value !== 'summon_familiar') {
            const summonEnhancements = ['summonTiny', 'summonSmall', 'summonMedium', 'summonLarge', 'familiar'];
            summonEnhancements.forEach(id => {
                if (skill.enhancements[id]) {
                    delete skill.enhancements[id];
                    const checkbox = document.getElementById(`enh-${id}`);
                    if (checkbox) checkbox.checked = false;
                }
            });
        }
        
        // Re-rendre les améliorations pour afficher/cacher les invocations
        renderEnhancements();
        updatePreview();
    });
    
    // Event listener pour l'upload d'image
    document.getElementById('skillImageInput').addEventListener('change', loadSkillImage);
}

// Rendu des améliorations
function renderEnhancements() {
    const list = document.getElementById('enhancementList');
    
    // Filtrer les améliorations selon le type de capacité
    const summonEnhancements = ['summonTiny', 'summonSmall', 'summonMedium', 'summonLarge', 'familiar'];
    const filteredEnhancements = enhancements.filter(enh => {
        // Si le type est invocation/familier, afficher toutes les améliorations
        if (skill.type === 'summon_familiar') {
            return true;
        }
        // Sinon, cacher les améliorations d'invocation
        return !summonEnhancements.includes(enh.id);
    });
    
    list.innerHTML = filteredEnhancements.map(enh => `
        <div class="enhancement-item">
            <div class="enhancement-header">
                <input type="checkbox" class="enhancement-checkbox" 
                       id="enh-${enh.id}" onchange="toggleEnhancement('${enh.id}')">
                <label class="enhancement-name" for="enh-${enh.id}">${enh.name}</label>
                <span class="enhancement-cost">+${enh.cost} Rang</span>
            </div>
            <div class="enhancement-desc">${enh.desc}</div>
            ${enh.maxRank > 1 ? `
                <div class="rank-selector" id="rank-${enh.id}" style="display: none;">
                    ${Array.from({length: enh.maxRank}, (_, i) => `
                        <button class="rank-btn ${i === 0 ? 'active' : ''}" 
                                onclick="setEnhancementRank('${enh.id}', ${i + 1})">
                            Rang ${i + 1}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Toggle amélioration
function toggleEnhancement(id) {
    const checkbox = document.getElementById(`enh-${id}`);
    const enh = enhancements.find(e => e.id === id);
    
    if (checkbox.checked) {
        skill.enhancements[id] = { rank: 1 };
        if (enh.maxRank > 1) {
            document.getElementById(`rank-${id}`).style.display = 'flex';
        }
    } else {
        delete skill.enhancements[id];
        if (enh.maxRank > 1) {
            document.getElementById(`rank-${id}`).style.display = 'none';
        }
    }
    
    updatePreview();
}

// Définir le rang d'une amélioration
function setEnhancementRank(id, rank) {
    if (skill.enhancements[id]) {
        skill.enhancements[id].rank = rank;
        
        // Mettre à jour l'UI
        const selector = document.getElementById(`rank-${id}`);
        selector.querySelectorAll('.rank-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i + 1 === rank);
        });
        
        updatePreview();
    }
}

// Calculer le rang total
function calculateTotalRank() {
    let total = skill.baseRank;
    for (const [id, data] of Object.entries(skill.enhancements)) {
        const enh = enhancements.find(e => e.id === id);
        total += enh.cost * data.rank;
    }
    return total;
}

// Mettre à jour la prévisualisation
function updatePreview() {
    const totalRank = calculateTotalRank();
    
    // Mettre à jour les coûts
    document.getElementById('totalRank').textContent = totalRank;
    document.getElementById('totalCost').textContent = totalRank;
    document.getElementById('totalCost').className = totalRank > 6 ? 'cost-value error' : 'cost-value';
    
    // Générer la carte de prévisualisation
    const preview = document.getElementById('previewCard');
    
    // Calculer les dégâts/soins de base
    const statBonus = skill.statType;
    let baseDamage = `3 + ${statBonus}`;
    
    // Appliquer les bonus de dégâts
    if (skill.enhancements.damage) {
        const bonus = enhancements.find(e => e.id === 'damage').values[skill.enhancements.damage.rank - 1];
        baseDamage += ` + ${bonus}`;
    }
    
    // Aire d'effet divise par 2
    const isAoe = skill.enhancements.aoe;
    if (isAoe) {
        baseDamage = `(${baseDamage}) / 2`;
    }
    
    // Déterminer si c'est un familier ou une invocation
    const isFamiliar = skill.enhancements.familiar;
    const hasSummon = skill.enhancements.summonTiny || skill.enhancements.summonSmall || 
                      skill.enhancements.summonMedium || skill.enhancements.summonLarge;
    
    // Déterminer la durée
    let duration = 'Instantané';
    if (skill.enhancements.passive || isFamiliar) {
        duration = 'Permanent';
    } else if (skill.type === 'buff' || skill.type === 'debuff' || hasSummon) {
        duration = '10 tours (1 minute)';
    }
    
    // Générer le HTML de la carte
    preview.innerHTML = `
        <!-- Barre de titre avec nom seulement -->
        <div class="card-title-bar">
            <h3 class="preview-name">${skill.name}</h3>
        </div>
        
        <!-- Image de la carte avec les badges -->
        <div class="card-image">
            ${skill.image ? `<canvas id="previewImageCanvas" width="400" height="280" style="width: 100%; height: 100%;"></canvas>` : '<div class="card-image-placeholder">🎴</div>'}
            <div class="card-type-badge">${getTypeLabel(skill.type)}</div>
            <div class="card-rank-badge ${totalRank > 6 ? 'error' : ''}">${totalRank}</div>
        </div>
        
        <!-- Corps de la carte -->
        <div class="card-body">
            <div class="preview-desc">${skill.desc}</div>
            
            ${!skill.enhancements.passive && !isFamiliar ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">💎</div>
                    <span class="preview-stat-label">Coût</span>
                    <span class="preview-stat-value">${totalRank} ${skill.resourceType === 'mana' ? 'Mana' : skill.resourceType === 'endurance' ? 'Endurance' : 'PV'}</span>
                </div>
            ` : `
                <div class="preview-stat">
                    <div class="preview-stat-icon">♾️</div>
                    <span class="preview-stat-label">Coût</span>
                    <span class="preview-stat-value" style="color: #4a9171;">Aucun (Passif)</span>
                </div>
            `}
            ${(skill.type === 'damage' || skill.type === 'heal' || skill.enhancements.heal) && !hasSummon ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">${skill.type === 'heal' || skill.enhancements.heal ? '❤️' : '⚔️'}</div>
                    <span class="preview-stat-label">${skill.type === 'heal' || skill.enhancements.heal ? 'Soins' : 'Dégâts'}</span>
                    <span class="preview-stat-value">${baseDamage}</span>
                </div>
            ` : ''}
            ${skill.enhancements.barrier ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">🛡️</div>
                    <span class="preview-stat-label">Barrière</span>
                    <span class="preview-stat-value">${enhancements.find(e => e.id === 'barrier').values[skill.enhancements.barrier.rank - 1]} points</span>
                </div>
            ` : ''}
            ${skill.enhancements.armorPen ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">🗡️</div>
                    <span class="preview-stat-label">Pénétration d'Armure</span>
                    <span class="preview-stat-value">Ignore ${enhancements.find(e => e.id === 'armorPen').values[skill.enhancements.armorPen.rank - 1]} RD</span>
                </div>
            ` : ''}
            ${skill.enhancements.damageReduction ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">🛡️</div>
                    <span class="preview-stat-label">Réduction de Dégât</span>
                    <span class="preview-stat-value">-${enhancements.find(e => e.id === 'damageReduction').values[skill.enhancements.damageReduction.rank - 1]} dégâts reçus</span>
                </div>
            ` : ''}
            ${skill.enhancements.statBonus ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">💪</div>
                    <span class="preview-stat-label">Bonus de Caractéristique</span>
                    <span class="preview-stat-value">+${enhancements.find(e => e.id === 'statBonus').values[skill.enhancements.statBonus.rank - 1]}</span>
                </div>
            ` : ''}
            <div class="preview-stat">
                <div class="preview-stat-icon">⏱️</div>
                <span class="preview-stat-label">Durée</span>
                <span class="preview-stat-value">${duration}</span>
            </div>
            ${isAoe ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">🎯</div>
                    <span class="preview-stat-label">Portée</span>
                    <span class="preview-stat-value">${skill.enhancements.passive ? '5m' : '10m'} de rayon</span>
                </div>
            ` : ''}
            ${hasSummon ? `
                <div class="preview-stat">
                    <div class="preview-stat-icon">👥</div>
                    <span class="preview-stat-label">Invocation</span>
                    <span class="preview-stat-value">${getSummonDescription()}</span>
                </div>
            ` : ''}
            
            ${Object.keys(skill.enhancements).length > 0 ? `
                <div class="preview-enhancements">
                    <div class="preview-enhancements-title">Effets</div>
                    ${Object.entries(skill.enhancements).map(([id, data]) => {
                        const enh = enhancements.find(e => e.id === id);
                        let text = enh.name;
                        if (enh.values && data.rank) {
                            text += ` : ${enh.values[data.rank - 1]}`;
                        } else if (enh.maxRank > 1 && data.rank > 1) {
                            text += ` (Rang ${data.rank})`;
                        }
                        return `<div class="preview-enhancement">${text}</div>`;
                    }).join('')}
                    ${isFamiliar ? `<div class="preview-enhancement">Doit être nourri quotidiennement</div>` : ''}
                    ${skill.enhancements.passive ? `<div class="preview-enhancement">Effet permanent, aucun coût à l'activation</div>` : ''}
                </div>
            ` : ''}
            
            ${totalRank > 6 ? `
                <div style="background: rgba(194, 65, 62, 0.2); padding: 0.75rem; border-radius: 8px; margin-top: 1rem; border-left: 3px solid #c2413e;">
                    <strong style="color: #c2413e; font-size: 0.9rem;">⚠️ Rang trop élevé !</strong><br>
                    <span style="font-size: 0.85rem; color: #d0d0d0;">Maximum autorisé: Rang 6</span>
                </div>
            ` : ''}
        </div>
    `;
    
    // Dessiner l'image dans le canvas de prévisualisation si elle existe
    if (skill.image) {
        setTimeout(updatePreviewImageCanvas, 0);
    }
}

function getSummonDescription() {
    if (skill.enhancements.summonTiny) return '2 créatures minuscules';
    if (skill.enhancements.summonSmall) return '1 créature petite';
    if (skill.enhancements.summonMedium) return '1 créature moyenne';
    if (skill.enhancements.summonLarge) return '1 créature grande';
    if (skill.enhancements.familiar) return 'Familier permanent';
    return 'Aucune';
}

function getTypeLabel(type) {
    const labels = {
        damage: 'Dégâts',
        heal: 'Soin',
        buff: 'Buff',
        debuff: 'Debuff',
        summon_familiar: 'Créature',
        cosmetic: 'Cosmétique'
    };
    return labels[type] || type;
}

// Sauvegarder
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

// Charger
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
                skill = JSON.parse(event.target.result);
                
                // Mettre à jour l'UI
                document.getElementById('skillName').value = skill.name;
                document.getElementById('skillDesc').value = skill.desc;
                document.getElementById('resourceType').value = skill.resourceType;
                document.getElementById('statType').value = skill.statType || 'INT';
                document.getElementById('skillType').value = skill.type;
                
                // Charger l'image si elle existe
                if (skill.image) {
                    if (!skill.imagePosition) {
                        skill.imagePosition = { x: 0, y: 0, scale: 1 };
                    }
                    drawSkillImageOnCanvas();
                    
                    // Ajouter le bouton de suppression
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
                } else {
                    skill.imagePosition = { x: 0, y: 0, scale: 1 };
                    drawSkillImagePlaceholder();
                }
                
                // Re-rendre les améliorations pour afficher les bonnes selon le type
                renderEnhancements();
                
                // Réinitialiser les checkboxes
                document.querySelectorAll('.enhancement-checkbox').forEach(cb => cb.checked = false);
                
                // Appliquer les améliorations
                for (const [id, data] of Object.entries(skill.enhancements)) {
                    document.getElementById(`enh-${id}`).checked = true;
                    const enh = enhancements.find(e => e.id === id);
                    if (enh.maxRank > 1) {
                        document.getElementById(`rank-${id}`).style.display = 'flex';
                        setEnhancementRank(id, data.rank);
                    }
                }
                
                updatePreview();
            } catch (error) {
                alert('Erreur lors du chargement du fichier');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Réinitialiser
function resetSkill() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser ?')) {
        skill = {
            name: 'Capacité Sans Nom',
            desc: 'Une capacité magique puissante.',
            resourceType: 'mana',
            statType: 'INT',
            type: 'damage',
            baseRank: 1,
            enhancements: {},
            image: null,
            imagePosition: { x: 0, y: 0, scale: 1 }
        };
        
        document.getElementById('skillName').value = skill.name;
        document.getElementById('skillDesc').value = skill.desc;
        document.getElementById('resourceType').value = skill.resourceType;
        document.getElementById('statType').value = skill.statType;
        document.getElementById('skillType').value = skill.type;
        
        // Réinitialiser l'image
        drawSkillImagePlaceholder();
        
        document.querySelectorAll('.enhancement-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.rank-selector').forEach(rs => rs.style.display = 'none');
        
        updatePreview();
    }
}

// Initialiser au chargement
init();
