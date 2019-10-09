GameModel = {
  storageName: "ZombieData",

  energy:0,
  energyMax:10,
  energyRate:1,
  zombieCost:10,
  bloodMax:500,
  brainsMax:50,
  zombieHealth : 100,
  zombieDamage : 10,
  zombieSpeed : 10,
  brainRecoverChance:0,
  riseFromTheDeadChance:0,
  graveyard : 0,
  boneCollectorCapacity:10,
  frameRate : 0,
  humanCount : 50,
  zombieCount:0,
  endLevelTimer : 3,
  endLevelDelay : 3,
  
  level:1,
  
  currentState : "startGame",

  states : {
    playingLevel : "playingLevel",
    levelCompleted : "levelCompleted",
    startGame : "startGame"
  },

  baseStats : {
    energyRate : 1,
    energyMax : 10,
    bloodMax : 500,
    brainsMax : 50,
    zombieHealth : 100,
    zombieDamage : 10,
    zombieSpeed : 10,
    brainRecoverChance : 0,
    riseFromTheDeadChance : 0,
    level : 1,
    graveyard : 0,
    boneCollectorCapacity : 10
  },

  zoom : zoom,
  centerGameContainer : centerGameContainer,

  resetToBaseStats() {
    this.energyRate = this.baseStats.energyRate;
    this.energyMax = this.baseStats.energyMax;
    this.bloodMax = this.baseStats.bloodMax;
    this.brainsMax = this.baseStats.brainsMax;
    this.zombieHealth = this.baseStats.zombieHealth;
    this.zombieDamage = this.baseStats.zombieDamage;
    this.zombieSpeed = this.baseStats.zombieSpeed;
    this.brainRecoverChance = this.baseStats.brainRecoverChance;
    this.riseFromTheDeadChance = this.baseStats.riseFromTheDeadChance;
    this.graveyard = this.baseStats.graveyard;
    this.boneCollectorCapacity = this.baseStats.boneCollectorCapacity;
  },

  addEnergy(value) {
    this.energy += value;
    if (this.energy > this.energyMax)
      this.energy = this.energyMax;
  },

  addBlood(value) {
    this.persistentData.blood += value;
    if (this.persistentData.blood > this.bloodMax)
      this.persistentData.blood = this.bloodMax;
  },

  addBrains(value) {
    this.persistentData.brains += value;
    if (this.persistentData.brains > this.brainsMax)
      this.persistentData.brains = this.brainsMax;
  },

  addBones(value) {
    this.persistentData.bones += value;
    this.persistentData.bonesTotal += value;
  },

  getHumanCount(){
    return this.humanCount;
  },

  getEnergyRate() {
    return this.energyRate - this.persistentData.boneCollectors;
  },

  update(timeDiff, updateTime) {
    this.addEnergy(this.getEnergyRate() * timeDiff);

    if (this.currentState == this.states.playingLevel) {

      if (this.lastSave + 30000 < updateTime) {
        this.saveData();
        this.lastSave = updateTime;
      }
  
      if (this.getHumanCount() <= 0) {

        if (this.endLevelTimer < 0) {
          this.currentState = this.states.levelCompleted;
          this.persistentData.levelUnlocked = this.level + 1;
          this.startTimer = 3;
        } else {
          this.endLevelTimer -= timeDiff;
        } 
      }
    }
    if (this.currentState == this.states.levelCompleted) {
      this.startTimer -= timeDiff;
      if (this.startTimer < 0 && this.persistentData.autoStart) {
        this.nextLevel();
      }
    }
    
  },

  startGame() {
    this.setupLevel();
    this.currentState = this.states.playingLevel;
  },

  nextLevel() {
    this.level++;
    this.setupLevel();
    this.currentState = this.states.playingLevel;
  },

  setupLevel() {
    this.endLevelTimer = this.endLevelDelay;
    setGameFieldSizeForLevel();
    Humans.populate();
    Zombies.populate();
    Graveyard.initialize();
    centerGameContainer();
    Upgrades.applyUpgrades();
  },

  lastSave:0,

  persistentData : {
    autoStart : false,
    levelUnlocked : 1,
    blood : 0,
    brains : 0,
    bones: 0,
    bonesTotal : 0,
    upgrades : [],
    boneCollectors : 0,
    graveyardZombies : 1,
    resolution : 1,
    zoomButtons : false
  },

  saveData() {
    this.persistentData.dateOfSave = Date.now();
    try {
      localStorage.setItem(this.storageName, JSON.stringify(this.persistentData));
    } catch (e) {
      console.log(e);
    }
  },
  loadData() {
    try {
      if (localStorage.getItem(this.storageName) !== null) {
        this.persistentData = JSON.parse(localStorage.getItem(this.storageName));
        this.level = this.persistentData.levelUnlocked;        
      } 
    } catch (e) {
      console.log(e);
    }
  },
  resetData() {
    try {
      localStorage.removeItem(this.storageName);
    } catch (e) {
      console.log(e);
    }
    this.resetToBaseStats();
    this.setupLevel();
    window.location.reload();
  },

  setResolution(resolution) {
    if(!this.app)
      return;

    this.app.renderer.resolution = resolution;

    if (this.app.renderer.rootRenderTarget)
      this.app.renderer.rootRenderTarget.resolution = resolution;

    this.app.renderer.plugins.interaction.resolution = resolution;
    this.app.renderer.resize(document.body.clientWidth, document.body.clientHeight);
  }
};