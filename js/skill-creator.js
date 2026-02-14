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
        desc: 'Capacité passive et permanente (zones passives: 5m au lieu de 10m)'
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
        cost: 1, 
        maxRank: 1, 
        desc: 'Créature permanente (doit être nourrie, automatiquement passif)'
    }
];

// État du créateur
let skill = {
    name: 'Capacité Sans Nom',
    desc: 'Une capacité magique puissante.',
    resourceType: 'mana',
    type: 'damage',
    baseRank: 1,
    enhancements: {}
};

// Initialisation
function init() {
    renderEnhancements();
    updatePreview();
    
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
    
    document.getElementById('skillType').addEventListener('change', (e) => {
        skill.type = e.target.value;
        updatePreview();
    });
}

// Rendu des améliorations
function renderEnhancements() {
    const list = document.getElementById('enhancementList');
    list.innerHTML = enhancements.map(enh => `
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
    const statBonus = skill.resourceType === 'mana' ? 'INT' : (skill.type === 'damage' ? 'FOR' : 'AGI');
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
    
    preview.innerHTML = `
        <div class="preview-name">${skill.name}</div>
        <div class="preview-rank">Rang ${totalRank} ${totalRank > 6 ? '⚠️ Dépassement !' : ''}</div>
        <div class="preview-desc">${skill.desc}</div>
        
        <div class="preview-stat">
            <span class="preview-stat-label">Type</span>
            <span class="preview-stat-value">${getTypeLabel(skill.type)}</span>
        </div>
        <div class="preview-stat">
            <span class="preview-stat-label">Coût</span>
            <span class="preview-stat-value">${totalRank} ${skill.resourceType === 'mana' ? 'Mana' : 'Endurance'}</span>
        </div>
        ${(skill.type === 'damage' || skill.type === 'heal' || skill.enhancements.heal) && !hasSummon ? `
            <div class="preview-stat">
                <span class="preview-stat-label">${skill.type === 'heal' || skill.enhancements.heal ? 'Soins' : 'Dégâts'}</span>
                <span class="preview-stat-value">${baseDamage}</span>
            </div>
        ` : ''}
        ${skill.enhancements.barrier ? `
            <div class="preview-stat">
                <span class="preview-stat-label">Barrière</span>
                <span class="preview-stat-value">${enhancements.find(e => e.id === 'barrier').values[skill.enhancements.barrier.rank - 1]} points</span>
            </div>
        ` : ''}
        ${skill.enhancements.armorPen ? `
            <div class="preview-stat">
                <span class="preview-stat-label">Pénétration d'Armure</span>
                <span class="preview-stat-value">Ignore ${enhancements.find(e => e.id === 'armorPen').values[skill.enhancements.armorPen.rank - 1]} RD</span>
            </div>
        ` : ''}
        ${skill.enhancements.damageReduction ? `
            <div class="preview-stat">
                <span class="preview-stat-label">Réduction de Dégât</span>
                <span class="preview-stat-value">-${enhancements.find(e => e.id === 'damageReduction').values[skill.enhancements.damageReduction.rank - 1]} dégâts reçus</span>
            </div>
        ` : ''}
        ${skill.enhancements.statBonus ? `
            <div class="preview-stat">
                <span class="preview-stat-label">Bonus de Caractéristique</span>
                <span class="preview-stat-value">+${enhancements.find(e => e.id === 'statBonus').values[skill.enhancements.statBonus.rank - 1]}</span>
            </div>
        ` : ''}
        <div class="preview-stat">
            <span class="preview-stat-label">Durée</span>
            <span class="preview-stat-value">${duration}</span>
        </div>
        ${isAoe ? `
            <div class="preview-stat">
                <span class="preview-stat-label">Portée</span>
                <span class="preview-stat-value">${skill.enhancements.passive ? '5m' : '10m'} de rayon</span>
            </div>
        ` : ''}
        ${hasSummon ? `
            <div class="preview-stat">
                <span class="preview-stat-label">Invocation</span>
                <span class="preview-stat-value">${getSummonDescription()}</span>
            </div>
        ` : ''}
        ${isFamiliar ? `
            <div class="preview-stat">
                <span class="preview-stat-label">Note</span>
                <span class="preview-stat-value">Doit être nourri quotidiennement</span>
            </div>
        ` : ''}
        
        ${Object.keys(skill.enhancements).length > 0 ? `
            <div class="preview-enhancements">
                <strong style="color: var(--accent);">Améliorations Actives:</strong>
                ${Object.entries(skill.enhancements).map(([id, data]) => {
                    const enh = enhancements.find(e => e.id === id);
                    let text = enh.name;
                    if (enh.values && data.rank) {
                        text += ` (${enh.values[data.rank - 1]})`;
                    } else if (enh.maxRank > 1 && data.rank > 1) {
                        text += ` (Rang ${data.rank})`;
                    }
                    return `<div class="preview-enhancement">${text}</div>`;
                }).join('')}
            </div>
        ` : ''}
        
        ${totalRank > 6 ? `
            <div style="background: rgba(194, 65, 62, 0.2); padding: 1rem; border-radius: 8px; margin-top: 1rem; border-left: 3px solid var(--danger);">
                <strong style="color: var(--danger);">⚠️ Attention !</strong><br>
                <span style="font-size: 0.9rem;">Cette capacité dépasse le rang 6 maximum. Un personnage avec 10 points peut avoir jusqu'à 6 capacités de rang variable.</span>
            </div>
        ` : ''}
    `;
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
        summon: 'Invocation',
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
                document.getElementById('skillType').value = skill.type;
                
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
            type: 'damage',
            baseRank: 1,
            enhancements: {}
        };
        
        document.getElementById('skillName').value = skill.name;
        document.getElementById('skillDesc').value = skill.desc;
        document.getElementById('resourceType').value = skill.resourceType;
        document.getElementById('skillType').value = skill.type;
        
        document.querySelectorAll('.enhancement-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.rank-selector').forEach(rs => rs.style.display = 'none');
        
        updatePreview();
    }
}

// Initialiser au chargement
init();
