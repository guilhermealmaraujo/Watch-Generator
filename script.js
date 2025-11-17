const terrainsGridEl = document.getElementById('terrainsGrid');
const selectedGridEl = document.getElementById('selectedGrid');
const statusEl = document.getElementById('status');
const rollAllBtn = document.getElementById('rollAll');
const generateBtn = document.getElementById('generateGrid');
generateBtn.disabled = true; // disabled until config (or fallback) is ready

let selectedTerrains = [];

const inputs = {
  piloting: document.getElementById('pilotingInput'),
  navigating: document.getElementById('navigatingInput'),
  forraging: document.getElementById('forragingInput'),
  watching: document.getElementById('watchingInput')
};

let dcs = null;
let terrainKeys = [];
let oppressiveConditions = null;
let terrainOppressiveConditions = null;
let terrainVelocity = null;

// Image filename mapping (now direct as all filenames match keys)
function terrainImageName(key){
  return key + '.png';
}

async function loadConfig(){
  try {
    const url = 'config.json?cacheBust=' + Date.now();
    const res = await fetch(url, {cache: 'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    dcs = await res.json();
    const base = dcs['difficulty classes'].watch_actions;
    // Use terrain_grid_order from config if available, otherwise fallback to Object.keys
    terrainKeys = dcs.terrain_grid_order || Object.keys(base.piloting);
    oppressiveConditions = dcs.oppressive_conditions;
    terrainOppressiveConditions = dcs.terrain_opressive_conditions;
    terrainVelocity = dcs.terrain_speed;
    generateBtn.disabled = false;
    // Show sample to confirm load
    statusEl.textContent = 'Config loaded (piloting ashlands DC '+ base.piloting.ashlands + ').';
  } catch(err){
    statusEl.textContent = 'Config fetch failed. Serve via local server.';
    console.error('Config fetch failed:', err);
  }
}

function rollDie(){ return Math.floor(Math.random() * 20) + 1; }

function rollSingle(stat){
  inputs[stat].value = rollDie();
  flash(inputs[stat]);
}

function flash(el){
  el.classList.add('flash');
  setTimeout(()=> el.classList.remove('flash'), 300);
}

function rollAll(){ Object.keys(inputs).forEach(k => rollSingle(k)); }

function getRolls(){
  return {
    piloting: parseInt(inputs.piloting.value, 10) || rollDieAssign('piloting'),
    navigating: parseInt(inputs.navigating.value, 10) || rollDieAssign('navigating'),
    forraging: parseInt(inputs.forraging.value, 10) || rollDieAssign('forraging'),
    watching: parseInt(inputs.watching.value, 10) || rollDieAssign('watching')
  };
}

function hasRolls(){
  return Object.keys(inputs).some(stat => inputs[stat].value !== '');
}

function rollDieAssign(stat){ const v = rollDie(); inputs[stat].value = v; flash(inputs[stat]); return v; }

function renderTerrainCell(key, isSelected){
  const showComparisons = hasRolls();
  const rolls = showComparisons ? getRolls() : {};
  const actions = dcs['difficulty classes'].watch_actions;
  
  const terrainEl = document.createElement('div');
  terrainEl.className = 'terrain';
  terrainEl.dataset.terrainKey = key;
  
  const title = document.createElement('div');
  title.className = 'terrain-title';
  title.textContent = key.replace(/_/g,' ');
  
  const img = document.createElement('img');
  img.alt = key;
  img.src = 'terrains/' + terrainImageName(key);
  
  const checksWrap = document.createElement('div');
  checksWrap.className = 'checks';
  
  ['piloting','navigating','forraging','watching'].forEach(stat => {
    const dc = actions[stat][key];
    const checkEl = document.createElement('div');
    checkEl.className = 'check';
    
    const actionIcon = document.createElement('img');
    actionIcon.className = 'action-icon';
    actionIcon.src = 'icons/' + stat + '.svg';
    actionIcon.alt = stat;
    const fullLabel = (stat === 'forraging') ? 'Forraging' : (stat.charAt(0).toUpperCase() + stat.slice(1));
    actionIcon.setAttribute('data-label', fullLabel);
    
    const dcEl = document.createElement('div');
    dcEl.className = 'dc';
    dcEl.textContent = 'DC: ' + dc;
    
    checkEl.appendChild(actionIcon);
    checkEl.appendChild(dcEl);
    
    if(showComparisons){
      const roll = rolls[stat];
      const pass = roll >= dc;
      checkEl.classList.add(pass ? 'pass' : 'fail');
      
      const icon = document.createElement('img');
      icon.src = pass ? 'icons/check.svg' : 'icons/cross.svg';
      icon.alt = pass ? 'pass' : 'fail';
      
      const resultLabel = document.createElement('div');
      resultLabel.className = 'result-label ' + (pass ? 'result-pass' : 'result-fail');
      resultLabel.textContent = pass ? 'Success' : 'Fail';
      
      const rollVal = document.createElement('div');
      rollVal.className = 'roll-value';
      rollVal.textContent = 'Roll: ' + roll;
      
      checkEl.insertBefore(icon, actionIcon);
      checkEl.insertBefore(resultLabel, dcEl);
      checkEl.insertBefore(rollVal, dcEl);
    }
    
    checksWrap.appendChild(checkEl);
  });
  
  terrainEl.appendChild(title);
  terrainEl.appendChild(img);
  
  // Add velocity information
  if(terrainVelocity && terrainVelocity[key]){
    const velocityEl = document.createElement('div');
    velocityEl.className = 'terrain-velocity';
    
    const velocityToggle = document.createElement('button');
    velocityToggle.className = 'velocity-toggle';
    velocityToggle.textContent = '🚶 Velocidade';
    
    const velocityDesc = document.createElement('div');
    velocityDesc.className = 'velocity-desc hidden';
    velocityDesc.innerHTML = terrainVelocity[key];
    
    velocityToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      velocityDesc.classList.toggle('hidden');
      velocityToggle.classList.toggle('active');
    });
    
    velocityEl.appendChild(velocityToggle);
    velocityEl.appendChild(velocityDesc);
    terrainEl.appendChild(velocityEl);
  }
  
  terrainEl.appendChild(checksWrap);
  
  // Add oppressive condition if watching fails
  if(showComparisons && terrainOppressiveConditions){
    const watchingStat = actions.watching[key];
    const watchingRoll = rolls.watching;
    const watchingFails = watchingRoll < watchingStat;
    
    if(watchingFails){
      const conditionsList = terrainOppressiveConditions[key];
      if(conditionsList && conditionsList.length > 0){
        // Randomly select one condition from the array
        const randomIndex = Math.floor(Math.random() * conditionsList.length);
        const condition = conditionsList[randomIndex];
        
        const oppressiveEl = document.createElement('div');
        oppressiveEl.className = 'terrain-oppressive';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'oppressive-toggle';
        toggleBtn.textContent = '⚠ ' + condition.name;
        
        const descEl = document.createElement('div');
        descEl.className = 'oppressive-desc hidden';
        descEl.innerHTML = condition.description;
        
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          descEl.classList.toggle('hidden');
          toggleBtn.classList.toggle('active');
        });
        
        oppressiveEl.appendChild(toggleBtn);
        oppressiveEl.appendChild(descEl);
        terrainEl.appendChild(oppressiveEl);
      }
    }
  }
  
  // Click handler to move between grids
  terrainEl.addEventListener('click', () => {
    if(isSelected){
      // Move back to available
      selectedTerrains = selectedTerrains.filter(t => t !== key);
    } else {
      // Move to selected
      selectedTerrains.push(key);
    }
    updateTerrainGrid();
  });
  
  terrainEl.style.cursor = 'pointer';
  
  return terrainEl;
}

function updateTerrainGrid(){
  if(!dcs){
    statusEl.textContent = 'Config not loaded.';
    return;
  }
  const showComparisons = hasRolls();
  
  selectedGridEl.innerHTML = '';
  terrainsGridEl.innerHTML = '';

  // Render selected terrains
  selectedTerrains.forEach(key => {
    const terrainEl = renderTerrainCell(key, true);
    selectedGridEl.appendChild(terrainEl);
  });
  
  // Render available terrains (not selected)
  terrainKeys.forEach(key => {
    if(!selectedTerrains.includes(key)){
      const terrainEl = renderTerrainCell(key, false);
      terrainsGridEl.appendChild(terrainEl);
    }
  });
  statusEl.textContent = showComparisons ? 'Grid updated with current rolls.' : 'Grid displayed (no rolls yet).';
}

function buildGrid(){
  if(!dcs){
    statusEl.textContent = 'Config not loaded. Attempting reload...';
    loadConfig().then(()=> { if(dcs) buildGrid(); });
    return;
  }

  // Roll for oppressive climate condition (1d6, on 1 roll 1d12)
  const d6 = Math.floor(Math.random() * 6) + 1;
  const oppressivePanel = document.getElementById('oppressivePanel');
  oppressivePanel.innerHTML = '';
  
  const rollInfoEl = document.createElement('div');
  rollInfoEl.style.fontSize = '.75rem';
  rollInfoEl.style.opacity = '0.7';
  rollInfoEl.style.marginBottom = '.5rem';
  rollInfoEl.textContent = 'd6 roll: ' + d6;
  
  if(d6 === 1){
    const d12 = Math.floor(Math.random() * 12) + 1;
    rollInfoEl.textContent += ' | d12 roll: ' + d12;
    const condition = oppressiveConditions[d12.toString()];
    oppressivePanel.className = 'oppressive-panel active';
    oppressivePanel.appendChild(rollInfoEl);
    const titleEl = document.createElement('div');
    titleEl.className = 'oppressive-title';
    titleEl.textContent = condition.name;
    const descEl = document.createElement('div');
    descEl.className = 'oppressive-desc';
    descEl.textContent = condition.description;
    oppressivePanel.appendChild(titleEl);
    oppressivePanel.appendChild(descEl);
  } else {
    oppressivePanel.className = 'oppressive-panel none';
    oppressivePanel.appendChild(rollInfoEl);
    const msgEl = document.createElement('div');
    msgEl.textContent = 'No oppressive climate conditions in this watch';
    oppressivePanel.appendChild(msgEl);
  }

  // Build terrain grid
  updateTerrainGrid();
  statusEl.textContent = 'Watch generated with current rolls.';
}

// Event listeners
rollAllBtn.addEventListener('click', () => { rollAll(); statusEl.textContent = 'All dice rolled.'; });

generateBtn.addEventListener('click', () => buildGrid());

const updateBtn = document.getElementById('updateGrid');
updateBtn.addEventListener('click', () => updateTerrainGrid());

document.querySelectorAll('button[data-roll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const stat = btn.getAttribute('data-roll');
    rollSingle(stat);
    statusEl.textContent = stat + ' die rolled.';
  });
});

// Initial load
loadConfig().then(() => {
  if(dcs) updateTerrainGrid();
});
