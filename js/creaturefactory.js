CreatureFactory = {

  types : {
    earthGolem:1,
    airGolem:2,
    fireGolem:3,
    waterGolem:4
  },

  creaturesInProgress : 0,

  update(timeDiff) {
    this.creaturesInProgress = 0;
    var creatureCount = Creatures.creatureCount;
    for (var i = 0; i < this.creatures.length; i++) {
      if (this.creatures[i].building) {
        this.creatures[i].timeLeft -= timeDiff;
        if (this.creatures[i].timeLeft < 0) {
          this.spawnCreature(this.creatures[i]);
          this.creatures[i].building = false;
        } else {
          this.creaturesInProgress++;
        }
      } else {
        if (typeof creatureCount[this.creatures[i].type] !== 'undefined' && creatureCount[this.creatures[i].type] < this.creatures[i].autobuild) {
          this.startBuilding(this.creatures[i]);
        }
      }
      if (GameModel.persistentData.creatureLevels[this.creatures[i].id])
        this.creatures[i].level = GameModel.persistentData.creatureLevels[this.creatures[i].id];
    }
  },

  purchasePrice(creature) {
    return creature.baseCost * Math.pow(2, creature.level - 1);
  },

  levelPrice(creature) {
    return creature.baseCost * Math.pow(2, creature.level) * 5;
  },

  levelCreature(creature) {
    if (this.levelPrice(creature) < GameModel.persistentData.parts) {
      GameModel.persistentData.parts -= this.levelPrice(creature);
      creature.level++;
      GameModel.persistentData.creatureLevels[creature.id] = creature.level;
    }
  },

  canAffordCreature(creature) {
    return this.purchasePrice(creature) < GameModel.persistentData.parts;
  },

  startBuilding(creature) {
    if (creature.building) {
      return;
    }
    if (!this.canAffordCreature(creature)) {
      return;
    }
    if (this.creaturesInProgress + GameModel.creatureCount >= GameModel.creatureLimit) {
      return;
    }
    creature.building = true;
    creature.timeLeft = creature.time;
    GameModel.persistentData.parts -= this.purchasePrice(creature);
  },

  creatureAutoBuildNumber(creature, number) {
    if (creature.autobuild + number >= 0) {
      creature.autobuild += number;
      GameModel.persistentData.creatureAutobuild[creature.id] = creature.autobuild;
    }
  },

  updateAutoBuild() {
    for (var i = 0; i < this.creatures.length; i++) {
      this.creatures[i].autobuild = GameModel.persistentData.creatureAutobuild[this.creatures[i].id] || 0;
    }
  },

  spawnCreature(creature) {
    var health = creature.baseHealth * Math.pow(2, creature.level - 1);
    var damage = creature.baseDamage * Math.pow(2, creature.level - 1);
    Creatures.spawnCreature(health, damage, creature.speed, creature.type);
  },

  Creature : function(id, type, name, baseHealth, baseDamage, speed, baseCost, description) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.baseHealth = baseHealth;
    this.baseDamage = baseDamage;
    this.speed = speed;
    this.baseCost = baseCost;
    this.description = description;
    this.time = 3;
    this.building = false;
    this.timeLeft = 10;
    this.autobuild = 0;
    this.level = 1;
  }
}

CreatureFactory.creatures = [
  new CreatureFactory.Creature(1, CreatureFactory.types.earthGolem, "Earth Golem", 6000, 50, 25, 800, "A golem born from rocks and mud, able to take a lot of punishment and taunt enemies to attack it"),
  new CreatureFactory.Creature(2, CreatureFactory.types.airGolem, "Air Golem", 1200, 120, 45, 900, "A fast moving golem able to cover large distances and chase targets down"),
  new CreatureFactory.Creature(3, CreatureFactory.types.fireGolem, "Fire Golem", 1200, 150, 32, 1000, "A fireball spewing golem that ignites everything it touches"),
  new CreatureFactory.Creature(4, CreatureFactory.types.waterGolem, "Water Golem", 1400, 140, 30, 1100, "A calming golem that restores health to nearby units")
];