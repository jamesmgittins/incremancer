Upgrades = {
  
  types : {
    energyRate:"energyRate",
    energyCap:"energyCap",
    damage:"damage",
    health:"health",
    speed:"speed",
    brainsRate:"brainsRate",
    bonesRate:"bonesRate",
    energyRate:"energyRate",
    bloodCap:"bloodCap",
    brainsCap:"brainsCap",
    brainRecoverChance:"brainRecoverChance",
    riseFromTheDeadChance:"riseFromTheDeadChance",
    boneCollectorCapacity:"boneCollectorCapacity",
    construction:"construction",
    infectedBite:"infectedBite",
    infectedBlast:"infectedBlast",
    plagueDamage:"plagueDamage",
    burningSpeedPC:"burningSpeedPC",
    unlockSpell:"unlockSpell",
    spitDistance:"spitDistance",
    blastHealing:"blastHealing",
    plagueArmor:"plagueArmor",
    monsterLimit:"monsterLimit",
    runicSyphon:"runicSyphon",
    gigazombies:"gigazombies",
    bulletproof:"bulletproof",
    harpySpeed:"harpySpeed",
    tankBuster:"tankBuster",
    harpyBombs:"harpyBombs",
    // prestige items
    bloodGainPC : "bloodGainPC",
    bloodStoragePC : "bloodStoragePC",
    brainsGainPC : "brainsGainPC",
    brainsStoragePC : "brainsStoragePC",
    bonesGainPC : "bonesGainPC",
    partsGainPC : "partsGainPC",
    zombieDmgPC : "zombieDmgPC",
    zombieHealthPC : "zombieHealthPC",
    golemHealthPC : "golemHealthPC",
    golemDamagePC : "golemDamagePC",
    startingPC : "startingPC",
    energyCost : "energyCost",
    autoconstruction : "autoconstruction",
    autoshop : "autoshop",
    graveyardHealth : "graveyardHealth"
  },

  costs : {
    energy : "energy",
    blood : "blood",
    brains : "brains",
    bones : "bones",
    prestigePoints : "prestigePoints",
    parts : "parts"
  },

  hasRequirement(upgrade) {
    if (upgrade.requires && GameModel.persistentData.constructions.filter(built => built.id == upgrade.requires).length == 0) {
      return false;
    }
    return true;
  },

  getUpgrades(type) {
    switch(type) {
      case this.costs.blood:
      case this.costs.brains:
      case this.costs.bones:
      case this.costs.parts:
        return this.upgrades.filter(upgrade => upgrade.costType == type && (upgrade.cap == 0 || this.currentRank(upgrade) < upgrade.cap) && this.hasRequirement(upgrade));    
      case "completed":
        return this.upgrades.filter(upgrade => upgrade.cap > 0 && this.currentRank(upgrade) >= upgrade.cap);
    }
  },

  applyUpgrades() {
    GameModel.resetToBaseStats();
    Spells.lockAllSpells();
    for (var i = 0; i < GameModel.persistentData.upgrades.length; i++) {
      var upgrade = Upgrades.upgrades.filter(up => up.id == GameModel.persistentData.upgrades[i].id)[0];
      if (!upgrade) {
        upgrade = Upgrades.prestigeUpgrades.filter(up => up.id == GameModel.persistentData.upgrades[i].id)[0];
      }
      if (upgrade) {
        this.applyUpgrade(upgrade, GameModel.persistentData.upgrades[i].rank);
      }
    }
    for (var i = 0; i < GameModel.persistentData.constructions.length; i++) {
      this.applyConstructionUpgrade(GameModel.persistentData.constructions[i]);
    }
    var trophies = Trophies.getAquiredTrophyList();
    for (var i = 0; i < trophies.length; i++) {
      this.applyUpgrade(trophies[i], trophies[i].rank);
    }
    Skeleton.applyUpgrades();
    GameModel.bloodMax *= GameModel.bloodStorePCMod;
    GameModel.brainsMax *= GameModel.brainsStorePCMod;
    GameModel.zombieDamage *= GameModel.zombieDamagePCMod;
    GameModel.zombieHealth *= GameModel.zombieHealthPCMod;
    if (GameModel.persistentData.runeshatter) {
      GameModel.zombieDamage *= this.shatterEffect();
      GameModel.zombieHealth *= this.shatterEffect();
      GameModel.zombieCost += GameModel.persistentData.runeshatter;
    }
    // if (GameModel.persistentData.gigazombiesOn) {
    //   GameModel.zombieCost *= 5;
    // }
  },

  applyUpgrade(upgrade, rank) {
    switch (upgrade.type) {
      case this.types.energyRate:
        GameModel.energyRate += upgrade.effect * rank;
        return;
      case this.types.brainsRate:
        GameModel.brainsRate += upgrade.effect * rank;
        return;
      case this.types.bonesRate:
        GameModel.bonesRate += upgrade.effect * rank;
        return;
      case this.types.energyCap:
        GameModel.energyMax += upgrade.effect * rank;
        return;
      case this.types.bloodCap:
        GameModel.bloodMax += upgrade.effect * rank;
        return;
      case this.types.brainsCap:
        GameModel.brainsMax += upgrade.effect * rank;
        return;
      case this.types.damage:
        GameModel.zombieDamage += upgrade.effect * rank;
        return;
      case this.types.speed:
        GameModel.zombieSpeed += upgrade.effect * rank;
        return;
      case this.types.health:
        GameModel.zombieHealth += upgrade.effect * rank;
        return;
      case this.types.brainRecoverChance:
        GameModel.brainRecoverChance += upgrade.effect * rank;
        return;
      case this.types.riseFromTheDeadChance:
        GameModel.riseFromTheDeadChance += upgrade.effect * rank;
        return;
      case this.types.infectedBite:
        GameModel.infectedBiteChance += upgrade.effect * rank;
        return;
      case this.types.infectedBlast:
        GameModel.infectedBlastChance += upgrade.effect * rank;
        return;
      case this.types.plagueDamage:
        GameModel.plagueDamageMod += upgrade.effect, rank;
        return;
      case this.types.burningSpeedPC:
        GameModel.burningSpeedMod += upgrade.effect * rank;
        return;
      case this.types.construction:
        GameModel.construction = 1;
        return;
      case this.types.boneCollectorCapacity:
        GameModel.boneCollectorCapacity += upgrade.effect * rank;
        return;
      case this.types.unlockSpell:
        Spells.unlockSpell(upgrade.effect);
        return;
      case this.types.spitDistance:
        GameModel.spitDistance = 30 + upgrade.effect * rank;
        return
      case this.types.blastHealing:
        GameModel.blastHealing += upgrade.effect * rank;
        return;
      case this.types.plagueArmor:
        GameModel.plagueDmgReduction -= upgrade.effect * rank;
        return;
      case this.types.monsterLimit:
        GameModel.creatureLimit += upgrade.effect * rank;
        return;
      case this.types.runicSyphon:
        GameModel.runicSyphon.percentage += upgrade.effect * rank;
        return;
      // case this.types.gigazombies:
      //   GameModel.gigazombies = true;
      //   return;
      case this.types.bulletproof:
        GameModel.bulletproofChance += upgrade.effect * rank;
        return;
      case this.types.harpySpeed:
        GameModel.harpySpeed += upgrade.effect * rank;
        return;
      case this.types.tankBuster:
        GameModel.tankBuster = true;
        return;
      case this.types.harpyBombs:
        GameModel.harpyBombs += upgrade.effect * rank;
        return;
        // prestige items
      case this.types.bonesGainPC:
        GameModel.bonesPCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.partsGainPC:
        GameModel.partsPCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.bloodGainPC:
        GameModel.bloodPCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.bloodStoragePC:
        GameModel.bloodStorePCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.brainsGainPC:
        GameModel.brainsPCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.brainsStoragePC:
        GameModel.brainsStorePCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.zombieDmgPC:
        GameModel.zombieDamagePCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.zombieHealthPC:
        GameModel.zombieHealthPCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.golemDamagePC:
        GameModel.golemDamagePCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.golemHealthPC:
        GameModel.golemHealthPCMod *= Math.pow(1 + upgrade.effect, rank);
        return;
      case this.types.startingPC:
        GameModel.startingResources += upgrade.effect * rank;
        return;
      case this.types.energyCost:
        GameModel.zombieCost -= upgrade.effect * rank;
        return;
      case this.types.autoconstruction:
        GameModel.autoconstructionUnlocked = true;
        return;
      case this.types.autoshop:
        GameModel.autoUpgrades = true;
        return;
      case this.types.graveyardHealth:
        GameModel.graveyardHealthMod *= Math.pow(1 + upgrade.effect, rank);
        return;
    }
  },

  applyConstructionUpgrade(upgrade) {
    switch(upgrade.type) {
      case this.constructionTypes.graveyard:
        GameModel.constructions.graveyard = 1;
        return;
      case this.constructionTypes.crypt:
        GameModel.constructions.crypt = 1;
        // GameModel.brainsStorePCMod += 0.5;
        // GameModel.bloodStorePCMod += 0.5;
        GameModel.brainsStorePCMod *= 1.5;
        GameModel.bloodStorePCMod *= 1.5;
        return;
      case this.constructionTypes.fort:
        GameModel.constructions.fort = 1;
        // GameModel.brainsStorePCMod += 0.6;
        // GameModel.bloodStorePCMod += 0.6;
        GameModel.brainsStorePCMod *= 1.6;
        GameModel.bloodStorePCMod *= 1.6;
        return;
      case this.constructionTypes.fortress:
        GameModel.constructions.fortress = 1;
        // GameModel.brainsStorePCMod += 0.7;
        // GameModel.bloodStorePCMod += 0.7;
        GameModel.brainsStorePCMod *= 1.7;
        GameModel.bloodStorePCMod *= 1.7;
        return;
      case this.constructionTypes.citadel:
        GameModel.constructions.citadel = 1;
        // GameModel.brainsStorePCMod += 0.8;
        // GameModel.bloodStorePCMod += 0.8;
        GameModel.brainsStorePCMod *= 1.8;
        GameModel.bloodStorePCMod *= 1.8;
        return;
      case this.constructionTypes.plagueSpikes:
        GameModel.constructions.plagueSpikes = 1;
        return;
      case this.constructionTypes.fence:
        GameModel.constructions.fence = 1;
        return;
      case this.constructionTypes.fenceSize:
        GameModel.fenceRadius += upgrade.effect * upgrade.rank;
        return;
      case this.constructionTypes.pit:
        GameModel.bloodMax += 1000000 * upgrade.rank;
        GameModel.brainsMax += 100000 * upgrade.rank;
        return;
      case this.constructionTypes.runesmith:
        GameModel.constructions.runesmith = 1;
        if (!GameModel.persistentData.runes) {
          GameModel.persistentData.runes = {
            life : {
              blood:0,
              brains:0,
              bones:0
            },
            death : {
              blood:0,
              brains:0,
              bones:0
            }
          }
        }
        return;
      case this.constructionTypes.aviary:
        GameModel.constructions.aviary = 1;
        return;
      case this.constructionTypes.zombieCage:
        GameModel.zombieCages += upgrade.effect * upgrade.rank;
        return;
      case this.constructionTypes.partFactory:
        GameModel.constructions.partFactory = true;
        GameModel.constructions.factory = true;
        return;
      case this.constructionTypes.monsterFactory:
        GameModel.constructions.monsterFactory = true;
        GameModel.constructions.factory = true;
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
      case this.types.infectedBite:
        return Math.round(GameModel.infectedBiteChance * 100) + "% chance for zombies to infect their targets";
      case this.types.infectedBlast:
        return Math.round(GameModel.infectedBlastChance * 100) + "% chance for zombies to explode on death";
      case this.types.bulletproof:
        return Math.round(GameModel.bulletproofChance * 100) + "% chance for earth golems to reflect bullets";
      case this.types.construction:
        return GameModel.construction > 0 ? "You have unlocked Unholy Construction" : "You have yet to unlock Unholy Construction";
      case this.types.boneCollectorCapacity:
        return "Bone collector capacity: " + formatWhole(GameModel.boneCollectorCapacity);
      case this.types.bonesGainPC:
        return "Bones: " + formatWhole(Math.round(GameModel.bonesPCMod * 100)) + "%";
      case this.types.partsGainPC:
        return "Parts: " + formatWhole(Math.round(GameModel.partsPCMod * 100)) + "%";
      case this.types.bloodGainPC:
        return "Blood: " + formatWhole(Math.round(GameModel.bloodPCMod * 100)) + "%";
      case this.types.bloodStoragePC:
        return "Blood Storage: " + formatWhole(GameModel.bloodStorePCMod * 100) + "%";
      case this.types.brainsGainPC:
        return "Brains: " + formatWhole(Math.round(GameModel.brainsPCMod * 100)) + "%";
      case this.types.brainsStoragePC:
        return "Brains Storage: " +  formatWhole(GameModel.brainsStorePCMod * 100) + "%";
      case this.types.zombieDmgPC:
        return "Zombie Damage: " + Math.round(GameModel.zombieDamagePCMod * 100) + "%";
      case this.types.zombieHealthPC:
        return "Zombie Health: " + Math.round(GameModel.zombieHealthPCMod * 100) + "%";
      case this.types.golemDamagePC:
        return "Golem Damage: " + Math.round(GameModel.golemDamagePCMod * 100) + "%";
      case this.types.golemHealthPC:
        return "Golem Health: " + Math.round(GameModel.golemHealthPCMod * 100) + "%";
      case this.types.startingPC:
        return Math.round(GameModel.startingResources * 500) + " blood, " + Math.round(GameModel.startingResources * 50) + " brains, " + Math.round(GameModel.startingResources * 200) + " bones";
      case this.types.unlockSpell:
        return this.currentRank(upgrade) > 0 ? "You have learned this spell" : "You have yet to learn this spell";
      case this.types.energyCost:
        return "Zombie Cost: " + GameModel.zombieCost + " energy";
      case this.types.burningSpeedPC:
        return "Burning zombie speed: " + Math.round(GameModel.burningSpeedMod * 100) + "%";
      case this.types.blastHealing:
        return "Plague heal: " + Math.round(GameModel.blastHealing * 100) + "%";
      case this.types.spitDistance:
        return "Zombie spit distance: " + GameModel.spitDistance;
      case this.types.plagueArmor:
        return "Infected damage reduction: " + Math.round(100 - (GameModel.plagueDmgReduction * 100)) + "%";
      case this.types.monsterLimit:
        return "Creature limit: " + GameModel.creatureLimit;
      case this.types.runicSyphon:
        return "Syphon amount: " + Math.round(GameModel.runicSyphon.percentage * 100) + "%";
      case this.types.autoconstruction:
        return this.currentRank(upgrade) > 0 ? "You have unlocked automatic construction" : "You have yet to unlock automatic construction";
      case this.types.autoshop:
        return this.currentRank(upgrade) > 0 ? "You have unlocked automatic shop purchases" : "You have yet to unlock automatic shop purchases";
      case this.types.graveyardHealth:
        return "Graveyard health: " + Math.round(GameModel.graveyardHealthMod * 100) + "%";
      // case this.types.gigazombies:
        // return this.currentRank(upgrade) > 0 ? "You have unlocked more gigazombies" : "You have yet to unlock more gigazombies";
      case this.types.harpySpeed:
        return "Harpy speed: " + formatWhole(GameModel.harpySpeed);
      case this.types.harpyBombs:
        return "Harpy bombs: " + formatWhole(GameModel.harpyBombs);
      case this.types.tankBuster:
        return this.currentRank(upgrade) > 0 ? "You have unlocked tank buster" : "You have yet to unlock tank buster";
    }
  },

  currentRank(upgrade) {
    for (var i = 0; i < GameModel.persistentData.upgrades.length; i++) {
      var ownedUpgrade = GameModel.persistentData.upgrades[i];
      if (upgrade.id == ownedUpgrade.id) {
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

  upgradeMaxAffordable(upgrade) {
    var currentRank = this.currentRank(upgrade);
    var maxAffordable = 0;
    switch(upgrade.costType) {
      case this.costs.blood:
        maxAffordable = getMaxUpgrades(upgrade.basePrice, upgrade.multiplier, currentRank, GameModel.persistentData.blood);
        break;
      case this.costs.brains:
        maxAffordable = getMaxUpgrades(upgrade.basePrice, upgrade.multiplier, currentRank, GameModel.persistentData.brains);
        break;
      case this.costs.bones:
        maxAffordable = getMaxUpgrades(upgrade.basePrice, upgrade.multiplier, currentRank, GameModel.persistentData.bones);
        break;
      case this.costs.parts:
        maxAffordable = getMaxUpgrades(upgrade.basePrice, upgrade.multiplier, currentRank, GameModel.persistentData.parts);
        break;
      case this.costs.prestigePoints:
        maxAffordable = getMaxUpgrades(upgrade.basePrice, upgrade.multiplier, currentRank, GameModel.persistentData.prestigePointsToSpend);
        break;
    }
    if (upgrade.cap != 0) {
      return Math.min(maxAffordable, upgrade.cap - currentRank);
    }
    return maxAffordable;
  },

  upgradeMaxPrice(upgrade, number) {
    return getCostForUpgrades(upgrade.basePrice, upgrade.multiplier, this.currentRank(upgrade), number);
  },

  canAffordUpgrade(upgrade) {
    if (upgrade.cap > 0 && this.currentRank(upgrade) >= upgrade.cap) {
      upgrade.auto = false;
      return false;
    }
    switch(upgrade.costType) {
      case this.costs.energy:
        return GameModel.energy >= this.upgradePrice(upgrade);
      case this.costs.blood:
        return GameModel.persistentData.blood >= this.upgradePrice(upgrade);
      case this.costs.brains:
        return GameModel.persistentData.brains >= this.upgradePrice(upgrade);
      case this.costs.bones:
        return GameModel.persistentData.bones >= this.upgradePrice(upgrade);
      case this.costs.parts:
        return GameModel.persistentData.parts >= this.upgradePrice(upgrade);
      case this.costs.prestigePoints:
        return GameModel.persistentData.prestigePointsToSpend >= this.upgradePrice(upgrade);
    }
    return false;
  },

  constructionLeadsTo(construction) {
    return this.constructionUpgrades.filter(upgrade => upgrade.requires == construction.id)
      .concat(this.upgrades.filter(upgrade => upgrade.requires == construction.id))
      .map(upgrade => upgrade.name).join(", ");
  },

  purchaseMaxUpgrades(upgrade) {
    var amount = this.upgradeMaxAffordable(upgrade);
    for (var i = 0; i < amount; i++) {
      this.purchaseUpgrade(upgrade, false);
    }
    GameModel.saveData();
  },

  purchaseUpgrade(upgrade, save = true) {
    if (this.canAffordUpgrade(upgrade)) {
      var prestige = false;
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
          prestige = true;
          GameModel.persistentData.prestigePointsToSpend -= this.upgradePrice(upgrade);
          break;
        case this.costs.parts:
          GameModel.persistentData.parts -= this.upgradePrice(upgrade);
          break;
      }
      var ownedUpgrade;
      for (var i = 0; i < GameModel.persistentData.upgrades.length; i++) {
        if (upgrade.id == GameModel.persistentData.upgrades[i].id) {
          ownedUpgrade = true;
          GameModel.persistentData.upgrades[i] = {
            id : upgrade.id,
            rank : GameModel.persistentData.upgrades[i].rank + 1
          };
          if (prestige) {
            GameModel.persistentData.upgrades[i].costType = this.costs.prestigePoints;
          }
          break;
        }
      }
      if (!ownedUpgrade) {
        var persistUpgrade = {
          id:upgrade.id,
          rank:1
        };
        if (prestige) {
          persistUpgrade.costType = this.costs.prestigePoints;
        }
        GameModel.persistentData.upgrades.push(persistUpgrade);
      }
        
      
      if (save)
        GameModel.saveData();

      this.applyUpgrades();
      if (upgrade.purchaseMessage) {
        GameModel.sendMessage(upgrade.purchaseMessage);
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
    if (costPerTick.parts && costPerTick.parts > GameModel.persistentData.parts) {
      hasEnough = false;
      GameModel.persistentData.currentConstruction.shortfall.parts = true;
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
    if (costPerTick.parts)
      GameModel.persistentData.parts -= costPerTick.parts;
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
    GameModel.sendMessage("Construction of " + upgrade.name + " complete!");
    if (upgrade.completeMessage) {
      GameModel.sendMessage(upgrade.completeMessage);
    }
  },

  updateAutoUpgrades() {
    if (GameModel.autoUpgrades) {
      for (var i = 0; i < this.upgrades.length; i++) {
        if (this.upgrades[i].auto) {
          this.purchaseUpgrade(this.upgrades[i], false);
        }
      }
      if (GameModel.constructions.factory) {
        for (var i = 0; i < PartFactory.generators.length; i++) {
          if (PartFactory.generators[i].auto) {
            PartFactory.purchaseGenerator(PartFactory.generators[i], false);
          }
        }
      }
    }
    if (GameModel.autoShatter) {
      this.doShatter();
    }
  },

  updateConstruction(timeDiff) {
    if ((!GameModel.persistentData.currentConstruction && !GameModel.autoconstruction) || GameModel.persistentData.currentConstruction.state == this.constructionStates.paused)
      return false;
    
    if (GameModel.persistentData.currentConstruction) {
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
    } else if(GameModel.autoconstruction) {
      var upgrades = this.getAvailableConstructions();
      if (!upgrades || upgrades.length == 0) {
        GameModel.autoconstruction = false;
        return;
      }
      var cheapestUpgrade = false;
      var lowestCost = 0;
      for (var i = 0; i < upgrades.length; i++) {
        var cost = (upgrades[i].costs.energy || 0) + (upgrades[i].costs.blood || 0) + (upgrades[i].costs.brains || 0) + (upgrades[i].costs.bones || 0) + ((upgrades[i].costs.parts || 0) * 100);
        if (cost < lowestCost || !cheapestUpgrade) {
          lowestCost = cost;
          cheapestUpgrade = upgrades[i];
        }
      }
      if (cheapestUpgrade) {
        setTimeout(function(){Upgrades.startConstruction(cheapestUpgrade);});
      }
    }
  },

  startConstruction(upgrade) {
    if (GameModel.persistentData.currentConstruction)
      return false;

    var fastMode = GameModel.persistentData.blood >= (upgrade.costs.blood || 0) 
                && GameModel.persistentData.brains >= (upgrade.costs.brains || 0)
                && GameModel.persistentData.bones >= (upgrade.costs.bones || 0)
                && GameModel.persistentData.parts >= (upgrade.costs.parts || 0)
                && GameModel.energy >= (upgrade.costs.energy || 0);
    
    var costPerTick = {};
    if (upgrade.costs.energy)
      costPerTick.energy = upgrade.costs.energy / (fastMode ? 5 : upgrade.time);
    if (upgrade.costs.blood)
      costPerTick.blood = upgrade.costs.blood / (fastMode ? 5 : upgrade.time);
    if (upgrade.costs.brains)
      costPerTick.brains = upgrade.costs.brains / (fastMode ? 5 : upgrade.time);
    if (upgrade.costs.bones)
      costPerTick.bones = upgrade.costs.bones / (fastMode ? 5 : upgrade.time);
    if (upgrade.costs.parts)
      costPerTick.parts = upgrade.costs.parts / (fastMode ? 5 : upgrade.time);

    GameModel.persistentData.currentConstruction = {
      state:this.constructionStates.building,
      name:upgrade.name,
      id:upgrade.id,
      timeRemaining:(fastMode ? 5 : upgrade.time),
      time:(fastMode ? 5 : upgrade.time),
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

  constructionComplete(construction) {
    return this.currentRankConstruction(construction) >= construction.cap;
  },

  getAvailableConstructions() {
    return this.constructionUpgrades.filter(construction => this.constructionAvailable(construction));
  },

  getCompletedConstructions() {
    return this.constructionUpgrades.filter(construction => this.constructionComplete(construction));
  },

  upgradeIdCheck() {
    var ids = [];
    Upgrades.upgrades.forEach(function(upgrade) {
      if (ids[upgrade.id]) {
        console.error("ID " + upgrade.id + " already used");
      }
      ids[upgrade.id] = true;
    });
    Upgrades.prestigeUpgrades.forEach(function(upgrade) {
      if (ids[upgrade.id]) {
        console.error("ID " + upgrade.id + " already used");
      }
      ids[upgrade.id] = true;
    });
    Upgrades.constructionUpgrades.forEach(function(upgrade) {
      if (ids[upgrade.id]) {
        console.error("ID " + upgrade.id + " already used");
      }
      ids[upgrade.id] = true;
    });
  },

  runeCalculations : [
    {
      rune: "death",
      effect : "attackSpeed",
      cost: "blood",
      logBase : 1.6,
      adjustment : -13,
      subtract : true,
      cap : 0.8
    },
    {
      rune: "death",
      effect : "critChance",
      cost: "brains",
      logBase : 1.3,
      adjustment : -20,
      cap : 0.8
    },
    {
      rune: "death",
      effect : "critDamage",
      cost: "bones",
      logBase : 1.03,
      adjustment : -200,
      cap : false
    },
    {
      rune: "life",
      effect : "damageReduction",
      cost: "blood",
      logBase : 1.5,
      adjustment : -15,
      subtract : true,
      cap : 0.8
    },
    {
      rune: "life",
      effect : "healthRegen",
      cost: "brains",
      logBase : 2.9,
      adjustment : -5.5,
      cap : 0.5
    },
    {
      rune: "life",
      effect : "damageReflection",
      cost: "bones",
      logBase : 1.24,
      adjustment : -30,
      cap : 1
    }
  ],

  updateRunicSyphon(runicSyphon) {
    if (runicSyphon.percentage > 0) {
      GameModel.persistentData.runes.life.blood += runicSyphon.blood / 2;
      GameModel.persistentData.runes.death.blood += runicSyphon.blood / 2;
      GameModel.persistentData.runes.life.brains += runicSyphon.brains / 2;
      GameModel.persistentData.runes.death.brains += runicSyphon.brains / 2;
      GameModel.persistentData.runes.life.bones += runicSyphon.bones / 2;
      GameModel.persistentData.runes.death.bones += runicSyphon.bones / 2;
      runicSyphon.blood = 0;
      runicSyphon.brains = 0;
      runicSyphon.bones = 0;
      this.updateRuneEffects();
    }
  },

  shatterPercent(rune) {
    var amountRequired = 100000000 * Math.pow(1.5,GameModel.persistentData.runeshatter);
    return Math.floor(Math.min(1,rune.blood / amountRequired) * 100);
  },

  shatterBloodCost(rune) {
    return Math.max(0,(100000000 * Math.pow(1.5,GameModel.persistentData.runeshatter)) - rune.blood);
  },

  shatterEffect() {
    return Math.pow(1.1, GameModel.persistentData.runeshatter);
  },

  canShatter() {
    return this.shatterPercent(GameModel.persistentData.runes.life) + this.shatterPercent(GameModel.persistentData.runes.death) == 200;
  },

  doShatter() {
    if (this.canShatter()) {
      GameModel.persistentData.runeshatter++;
      GameModel.persistentData.runes.life.blood = 0;
      GameModel.persistentData.runes.death.blood = 0;
      GameModel.persistentData.runes.life.brains = 0;
      GameModel.persistentData.runes.death.brains = 0;
      GameModel.persistentData.runes.life.bones = 0;
      GameModel.persistentData.runes.death.bones = 0;
      this.updateRuneEffects();
      this.applyUpgrades();
    }
  },

  infuseRune(runeType, costType, amount) {
    var rune = runeType == "life" ? GameModel.persistentData.runes.life : GameModel.persistentData.runes.death;
    switch(costType) {
      case "blood":
        if (GameModel.persistentData.blood >= amount) {
          rune.blood += amount;
          GameModel.persistentData.blood -= amount;
        }
        break;
      case "brains":
        if (GameModel.persistentData.brains >= amount) {
          rune.brains += amount;
          GameModel.persistentData.brains -= amount;
        }
        break;
      case "bones":
        if (GameModel.persistentData.bones >= amount) {
          rune.bones += amount;
          GameModel.persistentData.bones -= amount;
        }
        break;
    }
    this.updateRuneEffects();
  },

  updateRuneEffects() {
    if (!GameModel.persistentData.runes)
      return;

    var runeEffects = {
      attackSpeed : 1,
      critChance : 0,
      critDamage : 0,
      damageReduction : 1,
      healthRegen : 0,
      damageReflection : 0
    };

    for (var i = 0; i < this.runeCalculations.length; i++) {
      var calculation = this.runeCalculations[i];
      var infusionAmount = GameModel.persistentData.runes[calculation.rune][calculation.cost];
      if (infusionAmount > 0) {
        var result = (Math.log(infusionAmount) / Math.log(calculation.logBase) + calculation.adjustment) / 100;
        if (result > 0) {
          if (calculation.cap && result > calculation.cap) {
            result = calculation.cap;
          }
          if (calculation.subtract) {
            runeEffects[calculation.effect] -= result;
          } else {
            runeEffects[calculation.effect] += result;
          }
        }
      }
    }
    GameModel.runeEffects = runeEffects;
  },

  constructionTypes : {
    graveyard : "graveyard",
    crypt : "crypt",
    fort : "fort",
    fortress : "fortress",
    citadel : "citadel",
    fence : "fence",
    fenceSize : "fenceSize",
    plagueWorkshop : "plagueWorkshop",
    plagueLaboratory : "plagueLaboratory",
    plagueSpikes : "plagueSpikes",
    spellTower : "spellTower",
    runesmith : "runesmith",
    aviary : "aviary",
    zombieCage : "zombieCage",
    partFactory : "partFactory",
    monsterFactory : "monsterFactory",
    pit : "pit",
    harpy : "harpy"
  },

  Upgrade : function(id, name, type, costType, basePrice, multiplier, effect, cap, description, purchaseMessage, requires) {
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
    this.requires = requires;
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

var million = 1000000;
var billion = 1000 * million;
var trillion = 1000 * billion;

Upgrades.constructionUpgrades = [
  new Upgrades.Construction(201, "Cursed Graveyard", Upgrades.constructionTypes.graveyard, {blood:1800}, 30, 1, 1, 1, false, "Construct a Cursed Graveyard in the town that will automatically spawn zombies when your energy is at its maximum!", "Graveyard menu now available!"),
  new Upgrades.Construction(205, "Crypt", Upgrades.constructionTypes.crypt, {blood:21000, bones:2220}, 60, 1, 1, 1, 201, "Construct a Crypt in your graveyard. This will give you a nice dark and quiet place to think. The additional space will also allow you to store 50% more blood and brains!"),
  new Upgrades.Construction(206, "Bone Fort", Upgrades.constructionTypes.fort, {blood:60000, bones:6000, energy:60}, 60, 1, 1, 1, 205, "Turn your crypt into a fort. The additional space will also allow you to store 60% more blood and brains.", "New upgrades are available in the shop!"),
  new Upgrades.Construction(207, "Bone Fortress", Upgrades.constructionTypes.fortress, {blood:100000, bones:9000, energy:90}, 60, 1, 1, 1, 206, "Turn your fort into a fortress. The additional space will also allow you to store 70% more blood and brains."),
  new Upgrades.Construction(211, "Bone Citadel", Upgrades.constructionTypes.citadel, {blood:200000, bones:12000, energy:120}, 60, 1, 1, 1, 207, "Turn your fortress into a towering citadel that looms over the town. The additional space will also allow you to store 80% more blood and brains.","New upgrades are available in the shop!"),
  new Upgrades.Construction(202, "Perimeter Fence", Upgrades.constructionTypes.fence, {bones:880, energy:22}, 44, 1, 1, 1, 201, "Build a protective fence around the graveyard that will reduce damage taken by zombies inside by 50%."),
  new Upgrades.Construction(203, "Bigger Fence", Upgrades.constructionTypes.fenceSize, {bones:880, energy:22}, 44, 1, 10, 4, 202, "Enlarge the fence so a greater area is protected."),
  new Upgrades.Construction(204, "Plague Workshop", Upgrades.constructionTypes.plagueWorkshop, {blood:10200, brains:600}, 60, 1, 1, 1, 205, "Build a laboratory to study the effects of plague. This will unlock new upgrades in the shop.", "Plague upgrades now available!"),
  new Upgrades.Construction(208, "Plague Spikes", Upgrades.constructionTypes.plagueSpikes, {brains:3000, bones:1000}, 30, 1, 1, 1, 204, "Booby trap the area around your graveyard with cruel spikes that infect trespassing humans with the plague."),
  new Upgrades.Construction(209, "Spell Tower", Upgrades.constructionTypes.spellTower, {brains:3000, blood:30000}, 30, 1, 1, 1, 206, "Dedicate one tower of your fort to the study of spellcraft. Perhaps you can learn some new spells?", "Spells now available in the shop!"),
  new Upgrades.Construction(210, "Runesmith", Upgrades.constructionTypes.runesmith, {bones:3000, blood:120000, brains:1000}, 30, 1, 1, 1, 207, "Build a runesmith's workshop in order to fortify your zombies with powerful runes."),
  new Upgrades.Construction(212, "Accursed Aviary", Upgrades.constructionTypes.aviary, {bones:6000, blood:220000, brains:2000}, 60, 1, 1, 1, 211, "Construct an aviary on top of your citadel so you can release wicked harpies to bomb the townspeople.", "Harpies available for hire in the graveyard menu"),
  new Upgrades.Construction(213, "Zombie Cage", Upgrades.constructionTypes.zombieCage, {bones:600, blood:900}, 30, 1, 5, 1, 201, "Build a cage to contain surplus zombies once a town is defeated."),
  new Upgrades.Construction(214, "Second Zombie Cage", Upgrades.constructionTypes.zombieCage, {bones:1200, blood:1800}, 30, 1, 10, 1, 205, "Build an additional cage to contain surplus zombies once a town is defeated."),
  new Upgrades.Construction(215, "Third Zombie Cage", Upgrades.constructionTypes.zombieCage, {bones:1800, blood:2700}, 30, 1, 10, 1, 206, "Build an additional cage to contain surplus zombies once a town is defeated."),
  new Upgrades.Construction(216, "Fourth Zombie Cage", Upgrades.constructionTypes.zombieCage, {bones:2400, blood:3600}, 30, 1, 10, 1, 207, "Build an additional cage to contain surplus zombies once a town is defeated."),
  new Upgrades.Construction(217, "Fifth Zombie Cage", Upgrades.constructionTypes.zombieCage, {bones:3000, blood:4500}, 30, 1, 15, 1, 211, "Build an additional cage to contain surplus zombies once a town is defeated."),
  new Upgrades.Construction(218, "Plague Laboratory", Upgrades.constructionTypes.plagueLaboratory, {brains:25000, blood:million}, 50, 1, 1, 1, 211, "Expand the plague workshop into a well equipped laboratory in order to unlock additional plague upgrades."),
  new Upgrades.Construction(219, "Part Factory", Upgrades.constructionTypes.partFactory, {brains:35000, blood:15 * million}, 50, 1, 1, 1, 218, "Build a factory to create parts that can be used to construct more powerful beings for your army.", "Factory menu now available!"),
  new Upgrades.Construction(220, "Creature Factory", Upgrades.constructionTypes.monsterFactory, {brains:45000, blood:40 * million}, 50, 1, 1, 1, 219, "Build a factory to turn creature parts into living entities of destruction", "Creatures now available in factory menu!"),
  new Upgrades.Construction(221, "Bottomless Pit", Upgrades.constructionTypes.pit, {bones:75000, parts:5 * million}, 50, 1, 1, 10, 219, "A bottomless pit with walls made from creature parts. Drastically increases your capacity to store blood and brains."),
  new Upgrades.Construction(222, "Harpy Outfitter", Upgrades.constructionTypes.harpy, {bones:75000, brains:75000, blood:80 * million}, 50, 1, 1, 1, 220, "Build an outfitter to upgrade the abilities of your harpies.", "Harpy upgrades now available in the shop!")
];

Upgrades.prestigeUpgrades = [
  new Upgrades.Upgrade(108, "A Small Investment", Upgrades.types.startingPC, Upgrades.costs.prestigePoints, 10, 1.25, 1, 0, "Each rank gives you an additional 500 blood, 50 brains, and 200 bones when starting a new level."),
  new Upgrades.Upgrade(109, "Time Warp", Upgrades.types.unlockSpell, Upgrades.costs.prestigePoints, 50, 1, 1, 1, "Unlock the Time Warp spell in order to speed up the flow of time."),
  new Upgrades.Upgrade(110, "Master of Death", Upgrades.types.energyCost, Upgrades.costs.prestigePoints, 1000, 1, 1, 5, "Each rank reduces the energy cost of summoning a zombie by 1"),
  new Upgrades.Upgrade(101, "Blood Storage", Upgrades.types.bloodStoragePC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 0, "Additional 20% blood storage for each rank."),
  new Upgrades.Upgrade(102, "Blood Rate", Upgrades.types.bloodGainPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 0, "Additional 20% blood income rate for each rank."),
  new Upgrades.Upgrade(103, "Brain Storage", Upgrades.types.brainsStoragePC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 0, "Additional 20% brain storage for each rank."),
  new Upgrades.Upgrade(104, "Brain Rate", Upgrades.types.brainsGainPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 0, "Additional 20% brain income rate for each rank."),
  new Upgrades.Upgrade(105, "Bone Rate", Upgrades.types.bonesGainPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 0, "Additional 20% bones income rate for each rank."),
  // new Upgrades.Upgrade(106, "Zombie Health", Upgrades.types.zombieHealthPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 0, "Additional 20% zombie health for each rank"),
  // new Upgrades.Upgrade(107, "Zombie Damage", Upgrades.types.zombieDmgPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 0, "Additional 20% zombie damage for each rank")
  new Upgrades.Upgrade(111, "Parts Rate", Upgrades.types.partsGainPC, Upgrades.costs.prestigePoints, 10, 1.25, 0.2, 0, "Additional 20% creature parts income rate for each rank."),
  new Upgrades.Upgrade(112, "Auto Construction", Upgrades.types.autoconstruction, Upgrades.costs.prestigePoints, 250, 1, 1, 1, "Unlock the ability to automatically start construction of the cheapest available building option."),
  new Upgrades.Upgrade(114, "Auto Shop", Upgrades.types.autoshop, Upgrades.costs.prestigePoints, 250, 1, 1, 1, "Unlock the ability to automatically purchase items from the shop."),
  new Upgrades.Upgrade(113, "Graveyard Health", Upgrades.types.graveyardHealth, Upgrades.costs.prestigePoints, 10, 1.25, 0.1, 0, "Additional 10% graveyard health during boss levels with each rank."),
];

Upgrades.upgrades = [
  // blood upgrades
  new Upgrades.Upgrade(1, "Bloodthirst", Upgrades.types.damage, Upgrades.costs.blood, 50, 1.2, 1, 40, "Your zombies thirst for blood and do +1 damage for each rank of Bloodthirst."),
  new Upgrades.Upgrade(9, "Sharpened Teeth", Upgrades.types.damage, Upgrades.costs.blood, 3000, 1.23, 3, 50, "Your zombies bites do +3 damage with each rank of Sharpened Teeth.", false, 206),
  new Upgrades.Upgrade(11, "Razor Claws", Upgrades.types.damage, Upgrades.costs.blood, 28000, 1.25, 5, 0, "Your zombies attacks do +5 damage with each rank of Razor Claws.", false, 211),
  new Upgrades.Upgrade(16, "Killer Instinct", Upgrades.types.damage, Upgrades.costs.blood, 1000000, 1.27, 8, 0, "Your zombies attacks do +8 damage with each rank of Killer Instinct.", false, 220),
  new Upgrades.Upgrade(2, "Like Leather", Upgrades.types.health, Upgrades.costs.blood, 100, 1.2, 10, 40, "Your zombies gain tougher skin and +10 health with each rank."),
  new Upgrades.Upgrade(10, "Thick Skull", Upgrades.types.health, Upgrades.costs.blood, 5000, 1.23, 25, 50, "Your zombies gain +25 health with each rank.", false, 206),
  new Upgrades.Upgrade(12, "Battle Hardened", Upgrades.types.health, Upgrades.costs.blood, 32000, 1.25, 40, 0, "Your zombies gain +40 health with each rank of Battle Hardened.", false, 211),
  new Upgrades.Upgrade(17, "Tough as Nails", Upgrades.types.health, Upgrades.costs.blood, 1000000, 1.27, 100, 0, "Your zombies gain +100 health with each rank of Tough as Nails.", false, 220),
  new Upgrades.Upgrade(3, "Cold Storage", Upgrades.types.brainsCap, Upgrades.costs.blood, 150, 1.2, 50, 20, "Turns out you can use all of your spare blood to store brains and keep them fresh. Each rank increases your maximum brain capacity by 50."),
  new Upgrades.Upgrade(4, "Recycling is Cool", Upgrades.types.brainRecoverChance, Upgrades.costs.blood, 1000, 1.2, 0.1, 10, "Why are we wasting so many good brains on this project? Each rank increases your chance to get a brain back from a dead zombie by 10%"),
  new Upgrades.Upgrade(5, "Your Soul is Mine!", Upgrades.types.riseFromTheDeadChance, Upgrades.costs.blood, 1500, 1.4, 0.1, 10, "Using your most powerful blood magic you command the bodies of the dead to rise as your servants! Each rank grants 10% chance that dead humans will turn into zombies."),
  new Upgrades.Upgrade(6, "Infected Bite", Upgrades.types.infectedBite, Upgrades.costs.blood, 3500, 1.4, 0.1, 10, "Your zombies are now infected with plague and could infect their victims too. Each rank adds 10% chance to inflict damage over time when a zombie attacks a target.", false, 204),
  new Upgrades.Upgrade(7, "Detonate", Upgrades.types.unlockSpell, Upgrades.costs.blood, 25000, 1, 3, 1, "Learn the Detonate spell which can explode all of your zombies into a cloud of plague. Not exactly sure how useful that will be.", "New spell learned, Detonate!", 209),
  new Upgrades.Upgrade(8, "Gigazombies?", Upgrades.types.unlockSpell, Upgrades.costs.blood, 50000, 1, 5, 1, "Learn the Gigazombies spell which will turn some of your zombies into hulking monstrosities with increased health and damage.", "New spell learned, Gigazombies!", 209),
  new Upgrades.Upgrade(13, "Blazing Speed", Upgrades.types.burningSpeedPC, Upgrades.costs.blood, 30000, 1.25, 0.05, 10, "The humans are using torches to set your zombies on fire. Perhaps we can turn the tables on them? Each rank increases the movement and attack speed of burning zombies by 5%", false, 207),
  new Upgrades.Upgrade(14, "Spit it Out", Upgrades.types.spitDistance, Upgrades.costs.blood, 500000, 1.6, 5, 10, "The first rank gives your zombies the ability to spit plague at enemies beyond normal attack range. Spit attacks do 50% zombie damage and infect the victim with plague. Subsequent ranks will increase the range of spit attacks.", false, 218),
  new Upgrades.Upgrade(15, "Runic Syphon", Upgrades.types.runicSyphon, Upgrades.costs.blood, 34000, 1.9, 0.01, 10, "Infuse your runes for free! Each rank gives your Runesmith the ability to infuse 1% of your resource income, without consuming it. Additionally when blood and brains reach their storage limit, any additional resources will be infused automatically.", false, 210),
  // new Upgrades.Upgrade(18, "More Gigazombies", Upgrades.types.gigazombies, Upgrades.costs.blood, 100000000, 1.27, 1, 1, "We need more gigazombies! This will unlock the ability for all zombies to be gigazombies. They gain health and damage but the energy cost also increases. This can be toggled in the graveyard.", false, 220),
  new Upgrades.Upgrade(19, "Faster Harpies", Upgrades.types.harpySpeed, Upgrades.costs.blood, 100 * million, 1.07, 2, 20, "These harpies are way too slow! We have to make them faster. Each rank increases harpy speed by 2", false, 222),

  // brain upgrades
  new Upgrades.Upgrade(20, "Energy Rush", Upgrades.types.energyRate, Upgrades.costs.brains, 20, 1.8, 0.5, 20, "Melting brains down in your cauldron to make smoothies can be beneficial for your health. It also increases your energy rate by 0.5 per second for each rank."),
  new Upgrades.Upgrade(21, "Master Summoner", Upgrades.types.energyCap, Upgrades.costs.brains, 10, 1.5, 5, 20, "All the brains you harvested have proved fruitful in your experiments. Each rank raises your maximum energy by 5."),
  new Upgrades.Upgrade(22, "Primal Reflexes", Upgrades.types.speed, Upgrades.costs.brains, 5, 1.6, 1, 20, "The zombies retain more of their human agility increasing run speed by 1 for each rank."),
  new Upgrades.Upgrade(23, "Blood Harvest", Upgrades.types.bloodStoragePC, Upgrades.costs.brains, 50, 1.12, 0.1, 0, "All this brain power has enabled you to devise some superior blood storage methods. Each rank increases your maximum blood by 10%."),
  new Upgrades.Upgrade(24, "Unholy Construction", Upgrades.types.construction, Upgrades.costs.brains, 25, 1, 1, 1, "Learn the art of Unholy Construction in order to build structures that will solidify your foothold on the town.", "Construction menu now available!"),
  new Upgrades.Upgrade(25, "Infected Corpse", Upgrades.types.infectedBlast, Upgrades.costs.brains, 500, 1.4, 0.1, 10, "Fill your zombies with so much plague they are ready to explode! Each rank adds 10% chance for a zombie to explode into a cloud of plague upon death.", false, 204),
  new Upgrades.Upgrade(26, "Energy Charge", Upgrades.types.unlockSpell, Upgrades.costs.brains, 2000, 1, 2, 1, "Learn the Energy Charge spell which can drastically increase your energy rate for a short time.", "New spell learned, Energy Charge!", 209),
  new Upgrades.Upgrade(27, "What Doesn't Kill You", Upgrades.types.blastHealing, Upgrades.costs.brains, 10000, 1.3, 0.1, 20, "Plague explosions from zombies and harpies will also heal nearby zombies for 10% of the explosion damage with each rank.", false, 218),
  new Upgrades.Upgrade(28, "One is Never Enough", Upgrades.types.monsterLimit, Upgrades.costs.brains, 20000, 1.2, 1, 15, "We're definitely going to need more than one golem to finish the job. Each rank increases your creature limit by 1", false, 220),
  new Upgrades.Upgrade(29, "Tank Buster", Upgrades.types.tankBuster, Upgrades.costs.brains, 400000, 1.2, 1, 1, "Teach your harpies some new tricks. Once bought this upgrade will make your harpies drop fire bombs on tanks during boss stages.", false, 222),
  
  // bone upgrades
  new Upgrades.Upgrade(40, "Bone Throne", Upgrades.types.energyCap, Upgrades.costs.bones, 50, 1.55, 10, 15, "Sitting atop your throne of bones you can finally think clearly. Each rank increases maximum energy by 10."),
  new Upgrades.Upgrade(41, "Crown of Bones", Upgrades.types.energyRate, Upgrades.costs.bones, 200, 1.5, 0.2, 25, "Not just dapper, these spikes help channel your energy. Each rank increases energy rate by 0.2 per second."),
  new Upgrades.Upgrade(42, "Bonebarrows", Upgrades.types.boneCollectorCapacity, Upgrades.costs.bones, 300, 1.2, 5, 20, "Your bone collectors are struggling to carry all these bones. Maybe it's time we gave them an upgrade? Each rank increases their carrying capacity by 5."),
  new Upgrades.Upgrade(43, "Bone Reinforced Tanks", Upgrades.types.bloodCap, Upgrades.costs.bones, 500, 1.07, 2000, 0, "Finally! Now that we have a solid construction material we can get to work building better storage for our other resources. Each rank increases blood storage by 2000."),
  new Upgrades.Upgrade(44, "Brain Cage", Upgrades.types.brainsCap, Upgrades.costs.bones, 650, 1.07, 500, 0, "There's nothing I love more than a mind enslaved. Now we can put these brains where they belong. In cages! Each rank increases brain storage by 500."),
  new Upgrades.Upgrade(45, "Earth Freeze", Upgrades.types.unlockSpell, Upgrades.costs.bones, 5000, 1, 4, 1, "Learn the Earth Freeze spell which can freeze all humans in place for a short time.", "New spell learned, Earth Freeze!", 209),
  new Upgrades.Upgrade(46, "Plague Armor", Upgrades.types.plagueArmor, Upgrades.costs.bones, 15000, 1.6, 0.02, 10, "The best defense is a good offense? True in the case of Plague Armor which reduces the damage done by infected humans by 2% per rank.", false, 218),
  new Upgrades.Upgrade(47, "Bulletproof", Upgrades.types.bulletproof, Upgrades.costs.bones, 60000, 1.6, 0.05, 5, "Craft your earth golems from much harder stone. Each rank gives them 5% chance to reflect bullets back to their source.", false, 220),
  new Upgrades.Upgrade(48, "Bombs Away", Upgrades.types.harpyBombs, Upgrades.costs.bones, 500000, 1.6, 1, 3, "Upgrade your harpies so they can carry more than just one bomb at a time.", false, 222),

  // parts upgrades
  new Upgrades.Upgrade(60, "Extra Limbs", Upgrades.types.golemDamagePC, Upgrades.costs.parts, 900, 1.3, 0.02, 0, "Your golems gain +2% damage with each rank of Extra Limbs.", false, 220),
  new Upgrades.Upgrade(61, "Big Boned", Upgrades.types.golemHealthPC, Upgrades.costs.parts, 1000, 1.31, 0.02, 0, "Your golems gain +2% health with each rank of Big Boned.", false, 220),
];
