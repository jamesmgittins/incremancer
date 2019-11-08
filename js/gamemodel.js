GameModel = {
  storageName: "ZombieData",

  energy:0,
  energyMax:10,
  energyRate:1,
  brainsRate:0,
  bonesRate:0,
  energySpellMultiplier:1,
  zombieCost:10,
  bonesPCMod : 1,
  bloodMax:1000,
  bloodPCMod : 1,
  bloodStorePCMod : 1,
  brainsMax:50,
  brainsPCMod : 1,
  brainsStorePCMod : 1,
  zombieHealth : 100,
  zombieHealthPCMod : 1,
  zombieDamage : 10,
  zombieDamagePCMod : 1,
  zombieSpeed : 10,
  zombieCages : 0,
  zombiesInCages : 0,
  plagueDamagePCMod : 1,
  burningSpeedMod : 1,
  startingResources : 0,
  brainRecoverChance:0,
  riseFromTheDeadChance:0,
  infectedBiteChance:0,
  infectedBlastChance:0,
  constructions : {},
  construction : 0,
  boneCollectorCapacity:10,
  frameRate : 0,
  humanCount : 50,
  zombieCount:0,
  endLevelTimer : 3,
  endLevelDelay : 3,
  messageQueue : [],
  runeEffects : {
    attackSpeed : 1,
    critChance : 0,
    critDamage : 0,
    damageReduction : 1,
    healthRegen : 0,
    damageReflection : 0
  },

  gameSpeed : 1,
  
  level:1,
  
  currentState : "startGame",

  states : {
    playingLevel : "playingLevel",
    levelCompleted : "levelCompleted",
    startGame : "startGame",
    prestiged : "prestiged"
  },

  baseStats : {
    energyRate : 1,
    brainsRate : 0,
    bonesRate : 0,
    energyMax : 10,
    bloodMax : 1000,
    brainsMax : 50,
    zombieCost : 10,
    zombieHealth : 100,
    zombieDamage : 10,
    zombieSpeed : 10,
    level : 1,
    graveyard : 0,
    construction : 0,
    boneCollectorCapacity : 10
  },

  zoom : zoom,
  centerGameContainer : centerGameContainer,

  resetToBaseStats() {
    this.energyRate = this.baseStats.energyRate;
    this.brainsRate = this.baseStats.brainsRate;
    this.bonesRate = this.baseStats.bonesRate;
    this.energyMax = this.baseStats.energyMax;
    this.bloodMax = this.baseStats.bloodMax;
    this.brainsMax = this.baseStats.brainsMax;
    this.zombieHealth = this.baseStats.zombieHealth;
    this.zombieDamage = this.baseStats.zombieDamage;
    this.zombieSpeed = this.baseStats.zombieSpeed;
    this.zombieCost = this.baseStats.zombieCost;
    this.zombieCages = 0;
    this.brainRecoverChance = 0;
    this.riseFromTheDeadChance = 0;
    this.infectedBiteChance = 0;
    this.infectedBlastChance = 0;
    this.construction = this.baseStats.construction;
    this.constructions = {};
    this.boneCollectorCapacity = this.baseStats.boneCollectorCapacity;
    this.bonesPCMod = 1;
    this.bloodPCMod = 1;
    this.bloodStorePCMod = 1;
    this.brainsPCMod = 1;
    this.brainsStorePCMod = 1;
    this.zombieHealthPCMod = 1;
    this.zombieDamagePCMod = 1;
    this.plagueDamagePCMod = 1;
    this.burningSpeedMod = 1;
    this.startingResources = 0;
    this.fenceRadius = 50;
    this.spitDistance = 0;
    this.blastHealing = 0;
    this.plagueDmgReduction = 1;
  },

  addEnergy(value) {
    this.energy += value;
    if (this.energy > this.energyMax)
      this.energy = this.energyMax;
  },

  addBlood(value) {
    this.persistentData.blood += (value * this.bloodPCMod);
    if (this.persistentData.blood > this.bloodMax)
      this.persistentData.blood = this.bloodMax;
  },

  addBrains(value) {
    this.persistentData.brains += (value * this.brainsPCMod);
    if (this.persistentData.brains > this.brainsMax)
      this.persistentData.brains = this.brainsMax;
  },

  addBones(value) {
    this.persistentData.bones += (value * this.bonesPCMod);
    this.persistentData.bonesTotal += (value * this.bonesPCMod);
  },

  getHumanCount(){
    return this.humanCount;
  },

  getEnergyRate() {
    return (this.energySpellMultiplier * this.energyRate) - (this.persistentData.boneCollectors + this.persistentData.harpies);
  },

  update(timeDiff, updateTime) {
    Spells.updateSpells(timeDiff);

    timeDiff *= this.gameSpeed;
    this.autoRemoveCollectorsHarpies();
    this.addEnergy(this.getEnergyRate() * timeDiff);
    if (this.currentState == this.states.playingLevel) {
      this.addBones(this.bonesRate * timeDiff);
      this.addBrains(this.brainsRate * timeDiff);

      if (this.lastSave + 30000 < updateTime) {
        this.saveData();
        this.lastSave = updateTime;
      }
  
      if (this.getHumanCount() <= 0) {

        if (this.endLevelTimer < 0) {
          this.currentState = this.states.levelCompleted;
          this.calculateEndLevelBones();
          this.calculateEndLevelZombieCages();
          if (this.level == this.persistentData.levelUnlocked) {
            this.persistentData.levelUnlocked = this.level + 1;
            this.addPrestigePoints(this.level);
          }
          if (!this.persistentData.allTimeHighestLevel || this.level > this.persistentData.allTimeHighestLevel) {
            this.persistentData.allTimeHighestLevel = this.level;
            if (window.kongregate) {
              window.kongregate.stats.submit("level", this.persistentData.allTimeHighestLevel);
            }
          }
          this.startTimer = 3;
        } else {
          this.endLevelTimer -= timeDiff;
        } 
      }
      Upgrades.updateConstruction(timeDiff);
    }
    if (this.currentState == this.states.levelCompleted) {
      this.startTimer -= timeDiff;
      if (this.startTimer < 0 && this.persistentData.autoStart) {
        this.nextLevel();
      }
    }
  },

  calculateEndLevelBones() {
    this.endLevelBones = 0;
    if (this.persistentData.boneCollectors > 0 && Bones.uncollected) {
      this.endLevelBones = Bones.uncollected.length;
      this.addBones(this.endLevelBones);
    }
  },

  calculateEndLevelZombieCages() {
    if (this.zombieCages > 0) {
      this.zombiesInCages += this.zombieCount;
      if (this.zombiesInCages > this.zombieCages)
        this.zombiesInCages = this.zombieCages;
    }
  },

  autoRemoveCollectorsHarpies() {
    if (this.getEnergyRate() < 0) {
      var energyRate = this.getEnergyRate();
      if (this.persistentData.harpies > 0) {
        this.persistentData.harpies -= Math.round(Math.abs(energyRate));
        if (this.persistentData.harpies < 0) {
          this.persistentData.harpies = 0;
        }
      }
      if (this.getEnergyRate() < 0 && this.persistentData.boneCollectors > 0) {
        this.persistentData.boneCollectors--;
      }
    }
  },

  releaseCagedZombies() {
    if (this.currentState == this.states.playingLevel) {
      for (var i=0; i < this.zombiesInCages; i++) {
        Zombies.createZombie(Graveyard.sprite.x, Graveyard.sprite.y);
      }
      this.zombiesInCages = 0;
    }
  },

  sacrificeCagedZombies() {
    this.addBlood(this.cagedZombieSacrificeValue().blood);
    this.addBrains(this.cagedZombieSacrificeValue().brains);
    this.addBones(this.cagedZombieSacrificeValue().bones);
    this.zombiesInCages = 0;
  },

  cagedZombieSacrificeValue() {
    return {
      blood:this.zombiesInCages * this.zombieHealth * 0.5,
      brains:this.zombiesInCages,
      bones:this.zombiesInCages * 3
    }
  },

  startGame() {
    this.currentState = this.states.playingLevel;
    this.setupLevel();
    this.updatePlayingLevel();
  },

  nextLevel() {
    this.level++;
    this.currentState = this.states.playingLevel;
    this.setupLevel();
    this.updatePlayingLevel();
    if(this.persistentData.autoRelease) {
      this.releaseCagedZombies();
    }
  },

  setupLevel() {
    this.endLevelTimer = this.endLevelDelay;
    setGameFieldSizeForLevel();
    Blood.initialize();
    Bullets.initialize();
    Exclamations.initialize();
    Blasts.initialize();
    Smoke.initialize();
    Humans.populate();
    Zombies.populate();
    Graveyard.initialize();
    centerGameContainer();
    Upgrades.applyUpgrades();
    Upgrades.updateRuneEffects();
    this.addStartLevelResources();
  },

  vipEscaped() {
    if (!this.persistentData.vipEscaped) {
      this.persistentData.vipEscaped = [];
    }
    this.persistentData.vipEscaped.push(this.level);
    this.saveData();
  },

  updatePlayingLevel() {
    this.persistentData.levelStarted = this.level;
    this.saveData();
  },

  addStartLevelResources() {
    this.energy = this.energyMax;

    if (this.currentState == this.states.playingLevel && this.persistentData.levelStarted != this.level && this.startingResources > 0) {
      this.persistentData.blood += this.startingResources * 500;
      if (this.persistentData.blood > this.bloodMax)
        this.persistentData.blood = this.bloodMax;

      this.persistentData.brains += this.startingResources * 50;
      if (this.persistentData.brains > this.brainsMax)
        this.persistentData.brains = this.brainsMax;

      this.persistentData.bones += this.startingResources * 200;
      this.persistentData.bonesTotal += this.startingResources * 200;
    }
  },

  onReady() {
    if (!GameModel.persistentData.constructions) {
      GameModel.persistentData.constructions = [];
    }
    Upgrades.upgradeIdCheck();
  },

  lastSave:0,

  persistentData : {
    autoStart : false,
    levelUnlocked : 1,
    levelStarted : 0,
    allTimeHighestLevel : 0,
    blood : 0,
    brains : 0,
    bones: 0,
    bonesTotal : 0,
    upgrades : [],
    constructions : [],
    prestigePointsEarned : 0,
    prestigePointsToSpend : 0,
    boneCollectors : 0,
    graveyardZombies : 1,
    harpies : 0,
    resolution : 1,
    zoomButtons : false
  },

  addPrestigePoints(points) {
    if (typeof this.persistentData.prestigePointsEarned == 'undefined') {
      this.persistentData.prestigePointsEarned = 0;
      this.persistentData.prestigePointsToSpend = 0;
    }
    this.persistentData.prestigePointsEarned += points;
  },

  prestige() {
    if (this.persistentData.prestigePointsEarned > 0) {
      this.persistentData.levelUnlocked = 1;
      this.persistentData.levelStarted = 0;
      this.persistentData.blood = 0;
      this.persistentData.brains = 0;
      this.persistentData.bones = 0;
      this.persistentData.bonesTotal = 0;
      this.persistentData.upgrades = this.persistentData.upgrades.filter(upgrade => upgrade.costType == Upgrades.costs.prestigePoints);
      this.persistentData.constructions = [];
      this.persistentData.boneCollectors = 0;
      this.persistentData.currentConstruction = false;
      this.persistentData.harpies = 0;
      this.persistentData.graveyardZombies = 1;
      this.persistentData.prestigePointsToSpend += this.persistentData.prestigePointsEarned;
      this.persistentData.prestigePointsEarned = 0;
      this.persistentData.runes = false;
      this.persistentData.vipEscaped = [];
      BoneCollectors.update(0.1);
      this.level = 1;
      this.currentState = this.states.prestiged;
      this.setupLevel();
      this.saveData();
    }
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

  sendMessage(message) {
    if (!this.messageQueue.includes(message)) {
      this.messageQueue.push(message);
    }
  },

  setResolution(resolution) {
    if(!this.app)
      return;

    this.app.renderer.resolution = resolution;

    if (this.app.renderer.rootRenderTarget)
      this.app.renderer.rootRenderTarget.resolution = resolution;

    this.app.renderer.plugins.interaction.resolution = resolution;
    this.app.renderer.resize(document.body.clientWidth, document.body.clientHeight);
  },

  downloadSaveGame() {
    this.blob = new Blob([LZString.compressToEncodedURIComponent(JSON.stringify(this.persistentData))], {type: "octet/stream"});
    this.encodedContent = window.URL.createObjectURL(this.blob);
    var datestamp = new Date().toISOString().replace(/:|T|Z|\./g,"");
    this.savefilename = "incremancer-" + datestamp + ".sav";
  },

  importFile() {
    var files = document.getElementById("import-file").files;

    if (files && files.length == 1) {
      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(event) {
        var savegame = JSON.parse(LZString.decompressFromEncodedURIComponent(event.target.result));
        if (savegame.dateOfSave) {
          GameModel.persistentData = savegame;
          GameModel.level = GameModel.persistentData.levelUnlocked;
          GameModel.setupLevel();
        } else {
          alert("Error loading save game");
        }
      };
      reader.readAsText(file);
    }
  },

  toggleFullscreen() {
    if (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } else {
      var i = document.body;
      if (i.requestFullscreen) {
        i.requestFullscreen();
      } else if (i.webkitRequestFullscreen) {
        i.webkitRequestFullscreen();
      } else if (i.mozRequestFullScreen) {
        i.mozRequestFullScreen();
      } else if (i.msRequestFullscreen) {
        i.msRequestFullscreen();
      }
    }
  }

};