PartFactory = {

  costs : {
    blood : "blood",
    parts : "parts"
  },

  generatorsApplied : [],

  factoryStats() {
    var machines = 0;
    var partsPerSec = 0;
    for (var i = 0; i < this.generatorsApplied.length; i++) {
      machines += this.generatorsApplied[i].rank;
      partsPerSec += this.generatorsApplied[i].total / this.generatorsApplied[i].time;
    }
    return {
      machines:machines,
      partsPerSec:partsPerSec * GameModel.partsPCMod
    }
  },

  update(timeDiff) {
    for (var i = 0; i < this.generatorsApplied.length; i++) {
      this.generatorsApplied[i].timeLeft -= timeDiff;
      if (this.generatorsApplied[i].timeLeft < 0) {
        this.generatorsApplied[i].timeLeft = this.generatorsApplied[i].time;
        GameModel.persistentData.parts += this.generatorsApplied[i].total * GameModel.partsPCMod;
      }
    }
  },

  updateLongTime(timeDiff) {
    var partsCreated = 0;
    for (var i = 0; i < this.generatorsApplied.length; i++) {
      partsCreated += this.generatorsApplied[i].total * (timeDiff / this.generatorsApplied[i].time);
    }
    return partsCreated * GameModel.partsPCMod;
  },

  currentRank(generator) {
    for (var i = 0; i < GameModel.persistentData.generators.length; i++) {
      var owned = GameModel.persistentData.generators[i];
      if (generator.id == owned.id) {
        return owned.rank;
      }
    }
    return 0;
  },

  purchasePrice(generator) {
    return Math.round(generator.basePrice * Math.pow(generator.multi, this.currentRank(generator)));
  },

  upgradeMaxAffordable(upgrade) {
    var currentRank = this.currentRank(upgrade);
    var maxAffordable = 0;
    switch(upgrade.costType) {
      case this.costs.blood:
        maxAffordable = getMaxUpgrades(upgrade.basePrice, upgrade.multi, currentRank, GameModel.persistentData.blood);
        break;
      case this.costs.parts:
        maxAffordable = getMaxUpgrades(upgrade.basePrice, upgrade.multi, currentRank, GameModel.persistentData.parts);
        break;
    }
    if (upgrade.cap != 0) {
      return Math.min(maxAffordable, upgrade.cap - currentRank);
    }
    return maxAffordable;
  },

  upgradeMaxPrice(upgrade, number) {
    return getCostForUpgrades(upgrade.basePrice, upgrade.multi, this.currentRank(upgrade), number);
  },

  canAffordGenerator(generator) {
    switch(generator.costType) {
      case this.costs.blood:
        return GameModel.persistentData.blood >= this.purchasePrice(generator);
      case this.costs.parts:
        return GameModel.persistentData.parts >= this.purchasePrice(generator);
    }
    return false;
  },

  purchaseMaxGenerators(generator) {
    var amount = this.upgradeMaxAffordable(generator);
    for (var i = 0; i < amount; i++) {
      this.purchaseGenerator(generator, false);
    }
    GameModel.saveData();
  },

  purchaseGenerator(generator, save = true) {
    if (this.canAffordGenerator(generator)) {
      switch(generator.costType) {
        case this.costs.blood:
          GameModel.persistentData.blood -= this.purchasePrice(generator);
          break;
        case this.costs.parts:
          GameModel.persistentData.parts -= this.purchasePrice(generator);
          break;
      }
      var owned;
      for (var i = 0; i < GameModel.persistentData.generators.length; i++) {
        if (generator.id == GameModel.persistentData.generators[i].id) {
          owned = GameModel.persistentData.generators[i];
          owned.rank++;
        }
      }
      if (!owned)
        GameModel.persistentData.generators.push({
          id:generator.id,
          rank:1,
        });
      if (save) {
        GameModel.saveData();
      }
      this.applyGenerators();
    }
  },

  applyGenerator(generator, rank) {
    var owned = false;
    for (var i = 0; i < this.generatorsApplied.length; i++) {
      if (this.generatorsApplied[i].id == generator.id) {
        owned = true;
        this.generatorsApplied[i].rank = rank;
        this.generatorsApplied[i].total = this.generatorsApplied[i].produces * this.generatorsApplied[i].rank;
      }
    }
    if (!owned) {
      this.generatorsApplied.push({
        id:generator.id,
        produces:generator.produces,
        total: generator.produces * rank,
        rank:rank,
        time:generator.time,
        timeLeft:generator.time
      });
    }
  },

  applyGenerators() {
    for (var i = 0; i < this.generators.length; i++) {
      var currRank = this.currentRank(this.generators[i]);
      if (currRank > 0) {
        this.applyGenerator(this.generators[i], currRank);
      }
    }
  },

  Generator : function(id, name, costType, basePrice, multi, produces, time, description) {
    this.id = id;
    this.name = name;
    this.costType = costType;
    this.basePrice = basePrice;
    this.multi = multi;
    this.produces = produces;
    this.time = time;
    this.description = description;
    this.cap = 0;
  }
};

PartFactory.generators = [
  new PartFactory.Generator(1, "Simple Machine", PartFactory.costs.blood, 1000000, 1.08, 1, 2, "A simple device that produces 1 part every 2 seconds"),
  new PartFactory.Generator(2, "Part Duplicator", PartFactory.costs.parts, 100, 1.09, 4, 3, "A more advanced device that produces 4 parts every 3 seconds"),
  new PartFactory.Generator(3, "Stamp Press", PartFactory.costs.parts, 1000, 1.1, 16, 5, "An industrial press that produces 16 parts every 5 seconds"),
  new PartFactory.Generator(4, "Conveyor", PartFactory.costs.parts, 10000, 1.11, 64, 8, "A fantastic new invention that produces 64 parts every 8 seconds"),
  new PartFactory.Generator(5, "Splitter Combiner", PartFactory.costs.parts, 100000, 1.12, 192, 10, "A wondrous machine that produces 192 parts every 10 seconds"),
  new PartFactory.Generator(6, "Batch Converter", PartFactory.costs.parts, 500000, 1.13, 512, 12, "An astounding contraption that produces 512 parts every 12 seconds"),
];