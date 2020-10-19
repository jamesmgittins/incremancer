GameModel = {
  storageName: "ZombieData",
  kongregate: false,
  playFabId : false,
  titleId : "772D8",
  hidden: false,
  energy:0,
  energyMax:10,
  energyRate:1,
  brainsRate:0,
  bonesRate:0,
  energySpellMultiplier:1,
  zombieCost:10,
  bonesPCMod : 1,
  partsPCMod : 1,
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
  golemDamagePCMod :1,
  golemHealthPCMod : 1,
  plagueDamageMod : 0,
  graveyardHealthMod : 1,
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
  creatureCount:0,
  creatureLimit:1,
  harpySpeed:75,
  tankBuster : false,
  harpyBombs: 1,
  runicSyphon : {
    percentage: 0,
    blood: 0,
    bones: 0,
    brains: 0
  },
  gigazombies : false,
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
  autoUpgrades : false,
  autoconstruction : false,
  autoconstructionUnlocked : false,
  levelResourcesAdded : false,
  bulletproofChance : 0,
  gameSpeed : 1,
  
  level:1,
  
  currentState : "startGame",

  states : {
    playingLevel : "playingLevel",
    levelCompleted : "levelCompleted",
    startGame : "startGame",
    prestiged : "prestiged",
    failed : "failed"
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
    this.partsPCMod = 1;
    this.bloodPCMod = 1;
    this.bloodStorePCMod = 1;
    this.brainsPCMod = 1;
    this.brainsStorePCMod = 1;
    this.zombieHealthPCMod = 1;
    this.zombieDamagePCMod = 1;
    this.golemHealthPCMod = 1;
    this.golemDamagePCMod = 1;
    this.plagueDamageMod = 0;
    this.burningSpeedMod = 1;
    this.startingResources = 0;
    this.fenceRadius = 50;
    this.spitDistance = 0;
    this.blastHealing = 0;
    this.plagueDmgReduction = 1;
    this.creatureLimit = 1;
    this.runicSyphon.percentage = 0;
    this.autoconstructionUnlocked = false;
    this.autoUpgrades = false;
    this.graveyardHealthMod = 1;
    this.bulletproofChance = 0;
    this.gigazombies = false;
    this.harpySpeed = 75;
    this.tankBuster = false;
    this.harpyBombs = 1;
  },

  addEnergy(value) {
    this.energy += value;
    if (this.energy > this.energyMax)
      this.energy = this.energyMax;
  },

  addBlood(value) {
    if (isNaN(this.persistentData.blood)) {
      this.persistentData.blood = 0;  
    }
    if (isNaN(value))
      return;
    this.persistentData.blood += (value * this.bloodPCMod);
    if (this.persistentData.blood > this.bloodMax) {
      this.persistentData.blood = this.bloodMax;
      if (this.constructions.runesmith && this.runicSyphon.percentage > 0) {
        this.runicSyphon.blood += value * this.bloodPCMod;
      }
    }

    if (this.runicSyphon.percentage > 0) {
      this.runicSyphon.blood += value * this.bloodPCMod * this.runicSyphon.percentage;
    }
  },

  addBrains(value) {
    if (isNaN(this.persistentData.brains)) {
      this.persistentData.brains = 0;  
    }
    if (isNaN(value))
      return;
    this.persistentData.brains += (value * this.brainsPCMod);

    if (this.persistentData.brains > this.brainsMax) {
      this.persistentData.brains = this.brainsMax;
      if (this.constructions.runesmith && this.runicSyphon.percentage > 0) {
        this.runicSyphon.brains += value * this.brainsPCMod;
      }
    }

    if (this.runicSyphon.percentage > 0) {
      this.runicSyphon.brains += value * this.brainsPCMod * this.runicSyphon.percentage;
    }
  },

  addBones(value) {
    if (isNaN(this.persistentData.bones)) {
      this.persistentData.bones = 0;  
    }
    if (isNaN(value))
      return;
    this.persistentData.bones += (value * this.bonesPCMod);
    this.persistentData.bonesTotal += (value * this.bonesPCMod);

    if (this.runicSyphon.percentage > 0) {
      this.runicSyphon.bones += value * this.bonesPCMod * this.runicSyphon.percentage;
    }
  },

  getHumanCount(){
    return this.humanCount;
  },

  getEnergyRate() {
    return (this.energySpellMultiplier * this.energyRate) - (this.persistentData.boneCollectors + this.persistentData.harpies);
  },

  toggleGigazombies() {
    this.persistentData.gigazombiesOn = !this.persistentData.gigazombiesOn;
    Upgrades.applyUpgrades();
  },

  update(timeDiff, updateTime) {

    // spell update before gamespeed modifier
    Spells.updateSpells(timeDiff);

    timeDiff *= this.gameSpeed;

    if (this.hidden) { // force PIXI update
      update(timeDiff);
    }

    PartFactory.update(timeDiff);
    
    this.autoRemoveCollectorsHarpies();
    this.addEnergy(this.getEnergyRate() * timeDiff);

    if (this.currentState == this.states.playingLevel) {
      this.addBones(this.bonesRate * timeDiff);
      this.addBrains(this.brainsRate * timeDiff);
      Upgrades.updateRunicSyphon(this.runicSyphon);
      
      if (this.lastSave + 30000 < updateTime) {
        this.saveData();
        this.lastSave = updateTime;
      }

      if (this.lastPlayFabSave + 1200000 < updateTime) {
        this.saveToPlayFab();
      }
  
      if (this.getHumanCount() <= 0) {

        if (this.endLevelTimer < 0) {
          if (this.isBossStage(this.level) && Trophies.doesLevelHaveTrophy(this.level)) {
            Trophies.trophyAquired(this.level);
          }
          this.prestigePointsEarned = this.prestigePointsForLevel(this.level);
          this.currentState = this.states.levelCompleted;
          this.levelResourcesAdded = false;
          this.calculateEndLevelBones();
          this.calculateEndLevelZombieCages();
          if (!this.persistentData.levelsCompleted.includes(this.level)) {
            this.addPrestigePoints(this.prestigePointsForLevel(this.level));
            this.persistentData.levelsCompleted.push(this.level);
          }
          this.persistentData.levelUnlocked = this.level + 1;
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
      Upgrades.updateAutoUpgrades();
      CreatureFactory.update(timeDiff);
    }
    if (this.currentState == this.states.levelCompleted) {
      this.startTimer -= timeDiff;
      if (this.startTimer < 0 && this.persistentData.autoStart) {
        this.nextLevel();
      }
    }
    if (this.currentState == this.states.failed) {
      this.startTimer -= timeDiff;
      if (this.startTimer < 0 && this.persistentData.autoStart) {
        this.startLevel(this.level - 1);
      }
    }
    this.updateStats();
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

  startLevel(level) {
    this.level = level;
    this.startGame();
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
    Particles.initialize();
    Humans.populate();
    Zombies.populate();
    Graveyard.initialize();
    setTimeout(centerGameContainer,10);
    Upgrades.applyUpgrades();
    Upgrades.updateRuneEffects();
    PartFactory.applyGenerators();
    Creatures.populate();
    Skeleton.populate();
    this.addStartLevelResources();
    this.populateStats();
  },

  populateStats() {
    this.stats = {
      skeleton : {
        show : Skeleton.persistent.skeletons > 0,
        health : this.zombieHealth * 10,
        damage : this.zombieDamage * 10,
        speed: Skeleton.moveSpeed
      },
      zombie : {
        health : this.zombieHealth,
        damage : this.zombieDamage,
        speed : this.zombieSpeed
      },
      human : {
        health : Humans.getMaxHealth(this.level),
        damage : Humans.attackDamage,
        speed : Humans.maxRunSpeed
      },
      police : {
        show : Police.getMaxPolice() > 0,
        health : Police.getMaxHealth(),
        damage : Police.attackDamage,
        speed : Police.maxRunSpeed
      },
      army : {
        show : Army.getMaxArmy() > 0,
        health : Army.getMaxHealth(),
        damage : Army.attackDamage,
        speed : Army.maxRunSpeed
      }
    }
  },

  updateStats() {
    if (this.stats) {
      this.stats.zombie.health = this.zombieHealth;
      this.stats.zombie.damage = this.zombieDamage;
      this.stats.zombie.speed = this.zombieSpeed;
      this.stats.zombie.count = this.zombieCount;
      this.stats.skeleton.health = this.zombieHealth * 10;
      this.stats.skeleton.damage = this.zombieDamage * 10;
      this.stats.skeleton.speed = Skeleton.moveSpeed;
    }
  },

  vipEscaped() {
    if (!this.persistentData.vipEscaped) {
      this.persistentData.vipEscaped = [];
    }
    this.persistentData.vipEscaped.push(this.level);
    this.saveData();
  },

  updatePlayingLevel() {
    this.saveData();
  },

  addStartLevelResources() {
    this.energy = this.energyMax;

    if (!this.levelResourcesAdded) {
      this.persistentData.blood += this.startingResources * 500;
      if (this.persistentData.blood > this.bloodMax)
        this.persistentData.blood = this.bloodMax;

      this.persistentData.brains += this.startingResources * 50;
      if (this.persistentData.brains > this.brainsMax)
        this.persistentData.brains = this.brainsMax;

      this.persistentData.bones += this.startingResources * 200;
      this.persistentData.bonesTotal += this.startingResources * 200;

      this.levelResourcesAdded = true;
    }
  },

  onReady() {
    Upgrades.upgradeIdCheck();
  },

  lastSave:0,
  lastPlayFabSave : Date.now() - 15000,

  persistentData : {
    saveCreated : Date.now(),
    autoStart : false,
    levelUnlocked : 1,
    allTimeHighestLevel : 0,
    blood : 0,
    brains : 0,
    bones: 0,
    parts: 0,
    bonesTotal : 0,
    upgrades : [],
    constructions : [],
    prestigePointsEarned : 0,
    prestigePointsToSpend : 0,
    boneCollectors : 0,
    graveyardZombies : 1,
    harpies : 0,
    resolution : 1,
    zoomButtons : false,
    particles : true,
    generators : [],
    creatureLevels : [],
    creatures : [],
    creatureAutobuild : [],
    savedCreatures : [],
    levelsCompleted : []
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
      this.persistentData.blood = 0;
      this.persistentData.brains = 0;
      this.persistentData.bones = 0;
      this.persistentData.parts = 0;
      this.persistentData.generators = [];
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
      this.persistentData.creatureLevels = [];
      this.persistentData.creatureAutobuild = [];
      this.persistentData.levelsCompleted = [];
      this.persistentData.runeshatter = 0;
      this.zombiesInCages = 0;
      this.autoconstruction = false;
      this.levelResourcesAdded = false;
      this.persistentData.gigazombiesOn = false;
      this.gigazombies = false;
      this.runeEffects = {
        attackSpeed : 1,
        critChance : 0,
        critDamage : 0,
        damageReduction : 1,
        healthRegen : 0,
        damageReflection : 0
      };
      BoneCollectors.update(0.1);
      PartFactory.generatorsApplied = [];
      CreatureFactory.updateAutoBuild();
      CreatureFactory.resetLevels();
      this.level = 1;
      this.currentState = this.states.prestiged;
      this.setupLevel();
      this.saveData();
      for (var i = 0; i < Upgrades.upgrades.length; i++) {
        Upgrades.upgrades[i].auto = false;
      }
    }
  },

  saveData() {
    this.persistentData.dateOfSave = Date.now();
    try {
      localStorage.setItem(this.storageName, JSON.stringify(this.persistentData));
      localStorage.setItem(Skeleton.storageName, JSON.stringify(Skeleton.persistent));
    } catch (e) {
      console.log(e);
    }
  },
  loadData() {
    try {
      if (localStorage.getItem(this.storageName) !== null) {
        this.persistentData = JSON.parse(localStorage.getItem(this.storageName));
        this.level = this.persistentData.levelUnlocked;
        if (localStorage.getItem(Skeleton.storageName) !== null) {
          Skeleton.persistent = JSON.parse(localStorage.getItem(Skeleton.storageName));
        }
        this.updatePersistentData();
        this.calcOfflineProgress();
      } 
    } catch (e) {
      console.log(e);
    }
  },
  calcOfflineProgress() {
    Upgrades.applyUpgrades();
    Upgrades.updateRuneEffects();
    PartFactory.applyGenerators();
    if (this.constructions.partFactory) {
      var timeDiff = (Date.now() - this.persistentData.dateOfSave) / 1000;
      var partsCreated = PartFactory.updateLongTime(timeDiff);
      if (partsCreated > 0) {
        this.offlineMessage = "Your factory has generated " + formatWhole(partsCreated) + " parts while you were away";
        this.persistentData.parts += partsCreated;
      }
    }
  },
  resetData() {
    try {
      localStorage.removeItem(this.storageName);
      localStorage.removeItem(Skeleton.storageName);
      this.saveToPlayFab(true);
    } catch (e) {
      console.log(e);
    }
  },
  updatePersistentData() {
    if (!this.persistentData.constructions) {
      this.persistentData.constructions = [];
    }
    if (!this.persistentData.generators) {
      this.persistentData.generators = [];
    }
    if (!this.persistentData.parts) {
      this.persistentData.parts = 0;
    }
    if (!this.persistentData.creatureLevels) {
      this.persistentData.creatureLevels = [];
    }
    if (!this.persistentData.creatureAutobuild) {
      this.persistentData.creatureAutobuild = [];
    }
    if (!this.persistentData.savedCreatures) {
      this.persistentData.savedCreatures = [];
    }
    if (!this.persistentData.levelsCompleted) {
      this.persistentData.levelsCompleted = [];
    }
    if (!this.persistentData.saveCreated) {
      this.persistentData.saveCreated = Date.now();
    }
    if (typeof this.persistentData.particles == 'undefined') {
      this.persistentData.particles = true;
    }
    if (!this.persistentData.runeshatter) {
      this.persistentData.runeshatter = 0;
    }
    CreatureFactory.updateAutoBuild();
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
    this.persistentData.skeleton = Skeleton.persistent;
    this.blob = new Blob([LZString.compressToEncodedURIComponent(JSON.stringify(this.persistentData))], {type: "octet/stream"});
    delete this.persistentData.skeleton;
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
          if (savegame.skeleton) {
            Skeleton.persistent = savegame.skeleton;
            delete savegame.skeleton;
          }
          GameModel.persistentData = savegame;          
          GameModel.updatePersistentData();
          GameModel.saveToPlayFab();
          GameModel.level = GameModel.persistentData.levelUnlocked;
          CreatureFactory.spawnedSavedCreatures = false;
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
  },

  prestigePointsForLevel(level) {
    if (this.persistentData.levelsCompleted.includes(level)) {
      return 0;
    } else {
      return level;
    }
  },

  bossCompleted(level) {
    var bossLevel = Math.floor((level - 1) / 50) * 50;

    if (bossLevel < 50)
      return true;

    return this.persistentData.levelsCompleted.includes(bossLevel);
  },

  levelLocked(level) {
    return level > this.persistentData.allTimeHighestLevel + 1 || !this.bossCompleted(level);
  },

  isBossStage(level) {
    return level > 0 && level % 50 == 0;
  },

  levelInfo(level) {
    return {
      level : level,
      bossStage : this.isBossStage(level),
      completed : this.persistentData.levelsCompleted.includes(level),
      locked : this.levelLocked(level),
      trophy : Trophies.doesLevelHaveTrophy(level)
    }
  },

  loginInUsingPlayFab() {

    if (window.kongregate) {

      try {
        // Setting up playfab title ID
        PlayFab.settings.titleId = this.titleId;

        // forming request
        var request = {
          TitleId: PlayFab.settings.titleId,
          AuthTicket: window.kongregate.services.getGameAuthToken(),
          KongregateId : window.kongregate.services.getUserId(),
          CreateAccount: true
        };

        var model = this;

        // Invoke LoginWithKongregate API call and visualize both results (success or failue)
        PlayFabClientSDK.LoginWithKongregate(request,
          function(result){
            if (result && result.data && result.data.PlayFabId) {
              model.playFabId = result.data.PlayFabId;
              model.loadFromPlayFab();
            }
          },
          function(err){
            console.log(err);
          }
        );
      } catch (e) {
        console.error(e);
      }
    }
  },

  saveToPlayFab(remove = false) {
    this.lastPlayFabSave = Date.now();
    if (this.playFabId) {
      var trophies = this.persistentData.trophies;
      delete this.persistentData.trophies;
      var request = {
        TitleId : this.titleId,
        PlayFabId : this.playFabId,
        Data : {
          save : remove ? false : LZString.compressToEncodedURIComponent(JSON.stringify(this.persistentData)),
          trophies : remove ? false : LZString.compressToEncodedURIComponent(JSON.stringify(trophies)),
          skeleton : remove ? false : LZString.compressToEncodedURIComponent(JSON.stringify(Skeleton.persistent))
        }
      }
      this.persistentData.trophies = trophies;
      try {
        PlayFab.ClientApi.UpdateUserData(request,
          function(result){
            if (remove) {
              GameModel.resetToBaseStats();
              GameModel.setupLevel();
              window.location.reload();
            } else {
              GameModel.messageQueue.push("Game Saved to Cloud");
            }
          },
          function(err){
            console.log(err);
          }
        );
      } catch (e) {
        console.log(e);
      }
    } else {
      if (remove) {
        this.resetToBaseStats();
        this.setupLevel();
        window.location.reload();
      }
    }
  },


  loadFromPlayFab(force = false) {
    if (this.playFabId) {
      var request = {
        TitleId : this.titleId,
        PlayFabId : this.playFabId,
        Keys : ["save","trophies","skeleton"]
      }
      try {
        var model = this;
        PlayFab.ClientApi.GetUserData(request,
          function(result){
            if (result.data.Data.save) {
              var savegame = JSON.parse(LZString.decompressFromEncodedURIComponent(result.data.Data.save.Value));
              // playfab save is older so overwrite
              if (force || savegame.saveCreated < model.persistentData.saveCreated || (savegame.saveCreated == model.persistentData.saveCreated && savegame.dateOfSave > model.persistentData.dateOfSave)) {
                model.persistentData = savegame;
                if (result.data.Data.trophies) {
                  model.persistentData.trophies = JSON.parse(LZString.decompressFromEncodedURIComponent(result.data.Data.trophies.Value));
                }
                if (result.data.Data.skeleton) {
                  Skeleton.persistent = JSON.parse(LZString.decompressFromEncodedURIComponent(result.data.Data.skeleton.Value));
                }
                model.level = model.persistentData.levelUnlocked;
                model.updatePersistentData();
                model.calcOfflineProgress();
                model.setupLevel();
                GameModel.messageQueue.push("Game Loaded from Cloud");
              }
            }
          },
          function(err){
            console.log(err);
          }
        );
      } catch (e) {
        console.log(e);
      }
    }
  },

  allowPlayFabAction() {
    return this.lastPlayFabSave + 15000 < Date.now();
  }

};