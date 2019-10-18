Upgrades = {
  
  types : {
    energyRate:"energyRate",
    energyCap:"energyCap",
    damage:"damage",
    health:"health",
    speed:"speed",
    bloodCap:"bloodCap",
    brainsCap:"brainsCap",
    brainRecoverChance:"brainRecoverChance",
    riseFromTheDeadChance:"riseFromTheDeadChance",
    boneCollectorCapacity:"boneCollectorCapacity",
    construction:"construction",
    // prestige items
    bloodGainPC : "bloodGainPC",
    bloodStoragePC : "bloodStoragePC",
    brainsGainPC : "brainsGainPC",
    brainsStoragePC : "brainsStoragePC",
    bonesGainPC : "bonesGainPC",
    zombieDmgPC : "zombieDmgPC",
    zombieHealthPC : "zombieHealthPC"
  },

  costs : {
    energy : "energy",
    blood : "blood",
    brains : "brains",
    bones : "bones",
    prestigePoints : "prestigePoints"
  },

  applyUpgrades() {
    GameModel.resetToBaseStats();
    for (var i = 0; i < GameModel.persistentData.upgrades.length; i++) {
      this.applyUpgrade(GameModel.persistentData.upgrades[i]);
    }
    for (var i = 0; i < GameModel.persistentData.constructions.length; i++) {
      this.applyConstructionUpgrade(GameModel.persistentData.constructions[i]);
    }
    GameModel.bloodMax *= GameModel.bloodStorePCMod;
    GameModel.brainsMax *= GameModel.brainsStorePCMod;
    GameModel.zombieDamage *= GameModel.zombieDamagePCMod;
    GameModel.zombieHealth *= GameModel.zombieHealthPCMod;
  },

  applyUpgrade(upgrade) {
    switch (upgrade.type) {
      case this.types.energyRate:
        GameModel.energyRate += upgrade.effect * upgrade.rank;
        return;
      case this.types.energyCap:
        GameModel.energyMax += upgrade.effect * upgrade.rank;
        return;
      case this.types.bloodCap:
        GameModel.bloodMax += upgrade.effect * upgrade.rank;
        return;
      case this.types.brainsCap:
        GameModel.brainsMax += upgrade.effect * upgrade.rank;
        return;
      case this.types.damage:
        GameModel.zombieDamage += upgrade.effect * upgrade.rank;
        return;
      case this.types.speed:
        GameModel.zombieSpeed += upgrade.effect * upgrade.rank;
        return;
      case this.types.health:
        GameModel.zombieHealth += upgrade.effect * upgrade.rank;
        return;
      case this.types.brainRecoverChance:
        GameModel.brainRecoverChance += upgrade.effect * upgrade.rank;
        return;
      case this.types.riseFromTheDeadChance:
        GameModel.riseFromTheDeadChance += upgrade.effect * upgrade.rank;
        return;
      case this.types.construction:
        GameModel.construction = 1;
        return;
      case this.types.boneCollectorCapacity:
        GameModel.boneCollectorCapacity += upgrade.effect * upgrade.rank;
        return;
        // prestige items
      case this.types.bonesGainPC:
        GameModel.bonesPCMod += upgrade.effect * upgrade.rank;
        return;
      case this.types.bloodGainPC:
        GameModel.bloodPCMod += upgrade.effect * upgrade.rank;
        return;
      case this.types.bloodStoragePC:
        GameModel.bloodStorePCMod += upgrade.effect * upgrade.rank;
        return;
      case this.types.brainsGainPC:
        GameModel.brainsPCMod += upgrade.effect * upgrade.rank;
        return;
      case this.types.brainsStoragePC:
        GameModel.brainsStorePCMod += upgrade.effect * upgrade.rank;
        return;
      case this.types.zombieDmgPC:
        GameModel.zombieDamagePCMod += upgrade.effect * upgrade.rank;
        return;
      case this.types.zombieHealthPC:
        GameModel.zombieHealthPCMod += upgrade.effect * upgrade.rank;
        return;
    }
  },

  applyConstructionUpgrade(upgrade) {
    switch(upgrade.type) {
      case this.constructionTypes.graveyard:
        GameModel.constructions.graveyard = 1;
        return;
      case this.constructionTypes.fence:
        GameModel.constructions.fence = 1;
        return;
      case this.constructionTypes.fenceSize:
        GameModel.fenceRadius += upgrade.effect * upgrade.rank;
        return;
    }
  },

  displayStatValue(upgrade) {
    switch (upgrade.type) {
      case this.types.energyRate:
        return "Energy rate: " + format2Places(GameModel.energyRate) + " per second";
      case this.types.energyCap:
        return "Maximum energy: " + formatWhole(GameModel.energyMax);
      case this.types.bloodCap:
        return "Maximum blood: " + formatWhole(GameModel.bloodMax);
      case this.types.brainsCap:
        return "Maximum brains: " + formatWhole(GameModel.brainsMax);
      case this.types.damage:
        return "Zombie damage: " + formatWhole(GameModel.zombieDamage);
      case this.types.speed:
        return "Zombie speed: " + formatWhole(GameModel.zombieSpeed);
      case this.types.health:
        return "Zombie maximum health: " + formatWhole(GameModel.zombieHealth);
      case this.types.brainRecoverChance:
        return Math.round(GameModel.brainRecoverChance * 100) + "% chance to recover brain";
      case this.types.riseFromTheDeadChance:
        return Math.round(GameModel.riseFromTheDeadChance * 100) + "% chance for human corpses to turn into zombies";
      case this.types.construction:
        return GameModel.construction > 0 ? "You have unlocked Unholy Construction" : "You have yet to unlock Unholy Construction";
      case this.types.boneCollectorCapacity:
        return "Bone collector capacity: " + formatWhole(GameModel.boneCollectorCapacity);
      case this.types.bonesGainPC:
        return "Bones: " + Math.round(GameModel.bonesPCMod * 100) + "%";
      case this.types.bloodGainPC:
        return "Blood: " + Math.round(GameModel.bloodPCMod * 100) + "%";
      case this.types.bloodStoragePC:
        return "Blood Storage: " + Math.round(GameModel.bloodStorePCMod * 100) + "%";
      case this.types.brainsGainPC:
        return "Brains: " + Math.round(GameModel.brainsPCMod * 100) + "%";
      case this.types.brainsStoragePC:
        return "Brains Storage: " +  Math.round(GameModel.brainsStorePCMod * 100) + "%";
      case this.types.zombieDmgPC:
        return "Zombie Damage: " + Math.round(GameModel.zombieDamagePCMod * 100) + "%";
      case this.types.zombieHealthPC:
        return "Zombie Health: " + Math.round(GameModel.zombieHealthPCMod * 100) + "%";
    }
  },

  currentRank(upgrade) {
    for (var i = 0; i < GameModel.persistentData.upgrades.length; i++) {
      var ownedUpgrade = GameModel.persistentData.upgrades[i];
      if (upgrade.name == ownedUpgrade.name || upgrade.id == ownedUpgrade.id) {
        return ownedUpgrade.rank;
      }
    }
    return 0;
  },

  currentRankConstruction(upgrade) {
    if (GameModel.persistentData.constructions)
      for (var i = 0; i < GameModel.persistentData.constructions.length; i++) {
        var ownedUpgrade = GameModel.persistentData.constructions[i];
        if (upgrade.id == ownedUpgrade.id) {
          return ownedUpgrade.rank;
        }
      }
    return 0;
  },

  upgradePrice(upgrade) {
    return Math.round(upgrade.basePrice * Math.pow(upgrade.multiplier, this.currentRank(upgrade)));
  },

  canAffordUpgrade(upgrade) {
    switch(upgrade.costType) {
      case this.costs.energy:
        return GameModel.energy >= this.upgradePrice(upgrade);
      case this.costs.blood:
        return GameModel.persistentData.blood >= this.upgradePrice(upgrade);
      case this.costs.brains:
        return GameModel.persistentData.brains >= this.upgradePrice(upgrade);
      case this.costs.bones:
        return GameModel.persistentData.bones >= this.upgradePrice(upgrade);
      case this.costs.prestigePoints:
        return GameModel.persistentData.prestigePointsToSpend >= this.upgradePrice(upgrade);
    }
    return false;
  },

  purchaseUpgrade(upgrade) {
    if (this.canAffordUpgrade(upgrade)) {
      switch(upgrade.costType) {
        case this.costs.energy:
          GameModel.energy -= this.upgradePrice(upgrade);
          break;
        case this.costs.blood:
          GameModel.persistentData.blood -= this.upgradePrice(upgrade);
          break;
        case this.costs.brains:
          GameModel.persistentData.brains -= this.upgradePrice(upgrade);
          break;
        case this.costs.bones:
          GameModel.persistentData.bones -= this.upgradePrice(upgrade);
          break;
        case this.costs.prestigePoints:
          GameModel.persistentData.prestigePointsToSpend -= this.upgradePrice(upgrade);
          break;
      }
      var ownedUpgrade;
      for (var i = 0; i < GameModel.persistentData.upgrades.length; i++) {
        if (upgrade.name == GameModel.persistentData.upgrades[i].name || upgrade.id == GameModel.persistentData.upgrades[i].id) {
          ownedUpgrade = GameModel.persistentData.upgrades[i];
          ownedUpgrade.effect = upgrade.effect;
          ownedUpgrade.rank++;
          ownedUpgrade.id = upgrade.id;
          ownedUpgrade.costType = upgrade.costType;
        }
      }
      if (!ownedUpgrade)
        GameModel.persistentData.upgrades.push({
          id:upgrade.id,
          name:upgrade.name,
          costType:upgrade.costType,
          rank:1,
          type:upgrade.type,
          effect:upgrade.effect
        });
      
      GameModel.saveData();
      this.applyUpgrades();
      if (upgrade.purchaseMessage) {
        GameModel.messageQueue.push(upgrade.purchaseMessage);
      }
    }
  },

  constructionStates : {
    building:"building",
    paused:"paused",
    autoPaused:"autoPaused"
  },

  constructionTickTimer : 1,

  consumeResources(costPerTick) {
    // check for full availablity first
    var hasEnough = true;
    GameModel.persistentData.currentConstruction.shortfall = {};
    if (costPerTick.energy && costPerTick.energy > GameModel.energy) {
      hasEnough = false;
      GameModel.persistentData.currentConstruction.shortfall.energy = true;
    } 
    if (costPerTick.blood && costPerTick.blood > GameModel.persistentData.blood) {
      hasEnough = false;
      GameModel.persistentData.currentConstruction.shortfall.blood = true;
    }
    if (costPerTick.brains && costPerTick.brains > GameModel.persistentData.brains) {
      hasEnough = false;
      GameModel.persistentData.currentConstruction.shortfall.brains = true;
    } 
    if (costPerTick.bones && costPerTick.bones > GameModel.persistentData.bones) {
      hasEnough = false;
      GameModel.persistentData.currentConstruction.shortfall.bones = true;
    } 
    if (!hasEnough)
      return false;

    GameModel.persistentData.currentConstruction.shortfall = false;
    // then consume
    if (costPerTick.energy)
      GameModel.energy -= costPerTick.energy;
    if (costPerTick.blood)
      GameModel.persistentData.blood -= costPerTick.blood;
    if (costPerTick.brains)
      GameModel.persistentData.brains -= costPerTick.brains;
    if (costPerTick.bones)
      GameModel.persistentData.bones -= costPerTick.bones;
    return true;
  },

  completeConstruction() {
    var upgrade = Upgrades.constructionUpgrades.filter(upgrade => upgrade.id == GameModel.persistentData.currentConstruction.id)[0];
    var ownedUpgrade;
    for (var i = 0; i < GameModel.persistentData.constructions.length; i++) {
      if (upgrade.id == GameModel.persistentData.constructions[i].id) {
        ownedUpgrade = GameModel.persistentData.constructions[i];
        ownedUpgrade.effect = upgrade.effect;
        ownedUpgrade.rank++;
      }
    }
    if (!ownedUpgrade)
      GameModel.persistentData.constructions.push({
        id:upgrade.id,
        name:upgrade.name,
        rank:1,
        type:upgrade.type,
        effect:upgrade.effect
      });
    GameModel.persistentData.currentConstruction = false;
    GameModel.saveData();
    this.applyUpgrades();
    this.angularModel.updateConstructionUpgrades();
    GameModel.messageQueue.push("Construction of " + upgrade.name + " complete!");
    if (upgrade.completeMessage) {
      GameModel.messageQueue.push(upgrade.completeMessage);
    }
  },

  updateConstruction(timeDiff) {
    if (!GameModel.persistentData.currentConstruction || GameModel.persistentData.currentConstruction.state == this.constructionStates.paused)
      return false;
    
    this.constructionTickTimer -= timeDiff;
    if (this.constructionTickTimer < 0) {
      this.constructionTickTimer = 1;
      if(this.consumeResources(GameModel.persistentData.currentConstruction.costPerTick)) {
        GameModel.persistentData.currentConstruction.state = this.constructionStates.building;
        GameModel.persistentData.currentConstruction.timeRemaining -= 1;
        if (GameModel.persistentData.currentConstruction.timeRemaining <= 0) {
          this.completeConstruction();
        }
      } else {
        GameModel.persistentData.currentConstruction.state = this.constructionStates.autoPaused;
      }
    }
  },

  startConstruction(upgrade) {
    if (GameModel.persistentData.currentConstruction)
      return false;
    
    var costPerTick = {};
    if (upgrade.costs.energy)
      costPerTick.energy = upgrade.costs.energy / upgrade.time;
    if (upgrade.costs.blood)
      costPerTick.blood = upgrade.costs.blood / upgrade.time;
    if (upgrade.costs.brains)
      costPerTick.brains = upgrade.costs.brains / upgrade.time;
    if (upgrade.costs.bones)
      costPerTick.bones = upgrade.costs.bones / upgrade.time;

    GameModel.persistentData.currentConstruction = {
      state:this.constructionStates.building,
      name:upgrade.name,
      id:upgrade.id,
      timeRemaining:upgrade.time,
      time:upgrade.time,
      costPerTick:costPerTick
    }
  },

  playPauseConstruction() {
    if (!GameModel.persistentData.currentConstruction)
      return false;

    if (GameModel.persistentData.currentConstruction.state == this.constructionStates.paused) {
      GameModel.persistentData.currentConstruction.state = this.constructionStates.building
    } else {
      GameModel.persistentData.currentConstruction.state = this.constructionStates.paused
    }
  },

  cancelConstruction() {
    GameModel.persistentData.currentConstruction = false;
  },

  constructionAvailable(construction) {
    if (GameModel.persistentData.currentConstruction && GameModel.persistentData.currentConstruction.id == construction.id)
      return false;

    if (this.currentRankConstruction(construction) >= construction.cap)
      return false;

    if (construction.requires && GameModel.persistentData.constructions.filter(built => built.id == construction.requires).length == 0)
      return false;
    
    return true;
  },

  getAvailableConstructions() {
    return this.constructionUpgrades.filter(construction => this.constructionAvailable(construction));
  },

  constructionTypes : {
    graveyard : "graveyard",
    fence : "fence",
    fenceSize : "fenceSize"
  },

  Upgrade : function(id, name, type, costType, basePrice, multiplier, effect, cap, description, purchaseMessage) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.costType = costType;
    this.basePrice = basePrice;
    this.multiplier = multiplier;
    this.effect = effect;
    this.cap = cap;
    this.description = description;
    this.rank = 1;
    this.purchaseMessage = purchaseMessage;
  },

  Construction : function(id, name, type, costs, time, multiplier, effect, cap, requires, description, completeMessage) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.costs = costs;
    this.time = time;
    this.multiplier = multiplier;
    this.effect = effect;
    this.cap = cap;
    this.requires = requires;
    this.description = description;
    this.completeMessage = completeMessage;
  }
};

Upgrades.constructionUpgrades = [
  new Upgrades.Construction(201, "Cursed Graveyard", Upgrades.constructionTypes.graveyard, {blood:1800, energy:30}, 30, 1, 1, 1, false, "Construct a Cursed Graveyard in the town that will automatically spawn zombies when your energy is at its maximum!", "Graveyard menu now available!"),
  new Upgrades.Construction(202, "Perimeter Fence", Upgrades.constructionTypes.fence, {bones:880, energy:22}, 44, 1, 1, 1, 201, "Build a protective fence around the graveyard that will reduce damage taken by zombies inside by 50%."),
  new Upgrades.Construction(203, "Bigger Fence", Upgrades.constructionTypes.fenceSize, {bones:880, energy:22}, 44, 1, 10, 4, 202, "Enlarge the fence so more area is protected.")
];

Upgrades.prestigeUpgrades = [
  new Upgrades.Upgrade(101, "Blood Storage", Upgrades.types.bloodStoragePC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 1000, "Additional 20% blood storage for each rank."),
  new Upgrades.Upgrade(102, "Blood Rate", Upgrades.types.bloodGainPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 1000, "Additional 20% blood income rate for each rank."),
  new Upgrades.Upgrade(103, "Brain Storage", Upgrades.types.brainsStoragePC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 1000, "Additional 20% brain storage for each rank."),
  new Upgrades.Upgrade(104, "Brain Rate", Upgrades.types.brainsGainPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 1000, "Additional 20% brain income rate for each rank."),
  new Upgrades.Upgrade(105, "Bone Rate", Upgrades.types.bonesGainPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 1000, "Additional 20% bones income rate for each rank."),
  // new Upgrades.Upgrade(106, "Zombie Health", Upgrades.types.zombieHealthPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 1000, "Additional 20% zombie health for each rank"),
  // new Upgrades.Upgrade(107, "Zombie Damage", Upgrades.types.zombieDmgPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 1000, "Additional 20% zombie damage for each rank")
];

Upgrades.upgrades = [
  // blood upgrades
  new Upgrades.Upgrade(1, "Bloodthirst", Upgrades.types.damage, Upgrades.costs.blood, 50, 1.42, 1, 100, "Your zombies thirst for blood and do +1 damage for each rank of Bloodthirst."),
  new Upgrades.Upgrade(2, "Leatherface", Upgrades.types.health, Upgrades.costs.blood, 100, 1.4, 10, 100, "Your zombies gain thicker skin and +10 health with each rank."),
  new Upgrades.Upgrade(3, "Cold Storage", Upgrades.types.brainsCap, Upgrades.costs.blood, 150, 1.2, 50, 100, "Turns out you can use all of your spare blood to store brains and keep them fresh. Each rank increases your maximum brain capacity by 50."),
  new Upgrades.Upgrade(4, "Recycling is Cool", Upgrades.types.brainRecoverChance, Upgrades.costs.blood, 1000, 1.2, 0.1, 10, "Why are we wasting so many good brains on this project? Each rank increases your chance to get a brain back from a dead zombie by 10%"),
  new Upgrades.Upgrade(5, "Your Soul is Mine!", Upgrades.types.riseFromTheDeadChance, Upgrades.costs.blood, 1500, 1.4, 0.1, 10, "Using your most powerful blood magic you command the bodies of the dead to rise as your servants! Each rank grants 10% chance that dead humans will turn into zombies."),

  // brain upgrades
  new Upgrades.Upgrade(20, "Energy Rush", Upgrades.types.energyRate, Upgrades.costs.brains, 20, 1.8, 0.5, 15, "Melting brains down in your cauldron to make smoothies can be beneficial for your health. It also increases your energy rate by 0.5 per second for each rank."),
  new Upgrades.Upgrade(21, "Master Summoner", Upgrades.types.energyCap, Upgrades.costs.brains, 10, 1.5, 5, 20, "All the brains you harvested have proved fruitful in your experiments. Each rank raises your maximum energy by 5."),
  new Upgrades.Upgrade(22, "Primal Reflexes", Upgrades.types.speed, Upgrades.costs.brains, 5, 1.6, 1, 50, "The zombies retain more of their human agility increasing run speed by 1 for each rank."),
  new Upgrades.Upgrade(23, "Blood Harvest", Upgrades.types.bloodCap, Upgrades.costs.brains, 50, 1.1, 500, 100, "All this brain power has enabled you to devise some superior blood storage vats. Each rank increases your maximum blood by 500."),
  new Upgrades.Upgrade(24, "Unholy Construction", Upgrades.types.construction, Upgrades.costs.brains, 75, 1, 1, 1, "Learn the art of Unholy Construction in order to build structures that will solidify your foothold on the town.", "Construction menu now available!"),
  
  // bone upgrades
  new Upgrades.Upgrade(40, "Bone Throne", Upgrades.types.energyCap, Upgrades.costs.bones, 50, 1.5, 10, 10, "Sitting atop your throne of bones you can finally think clearly. Each rank increases maximum energy by 10."),
  new Upgrades.Upgrade(41, "Crown of Bones", Upgrades.types.energyRate, Upgrades.costs.bones, 200, 1.5, 0.2, 25, "Not just dapper, these spikes help channel your energy. Each rank increases energy rate by 0.2 per second."),
  new Upgrades.Upgrade(42, "Bonebarrows", Upgrades.types.boneCollectorCapacity, Upgrades.costs.bones, 300, 1.2, 5, 20, "Your bone collectors are struggling to carry all these bones. Maybe it's time we gave them an upgrade? Each rank increases their carrying capacity by 5."),
  new Upgrades.Upgrade(43, "Bone Reinforced Blood Tanks", Upgrades.types.bloodCap, Upgrades.costs.bones, 500, 1.1, 2000, 100, "Finally! Now that we have a solid construction material we can get to work building better storage for our other resources. Each rank increases blood storage by 2000."),
  new Upgrades.Upgrade(44, "Brain Cage", Upgrades.types.brainsCap, Upgrades.costs.bones, 650, 1.1, 500, 100, "There's nothing I love more than a mind enslaved. Now we can put these brains where they belong. In cages! Each rank increases brain storage by 200."),
];
