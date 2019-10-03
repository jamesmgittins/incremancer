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
  humanCount : 50,

  graveyard : 0,

  level:1,
  zombieCount:0,

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
    graveyard : 0
  },

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
        this.currentState = this.states.levelCompleted;
        this.persistentData.levelUnlocked = this.level + 1;
      }

    }
    
  },

  setupLevel() {
    setGameFieldSizeForLevel();
    Humans.populate();
    Zombies.populate();
    Graveyard.initialize();
    centerGameContainer();
  },

  lastSave:0,

  persistentData : {
    levelUnlocked : 1,
    blood : 0,
    brains : 0,
    bones: 0,
    bonesTotal : 0,
    upgrades : [],
    boneCollectors : 0
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
        this.setupLevel();
        Upgrades.applyUpgrades();
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
  }
};