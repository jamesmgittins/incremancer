Trophies = {
  trophyStats : [
    {
      type:Upgrades.types.health,
      value:50
    },
    {
      type:Upgrades.types.damage,
      value:7
    },
    {
      type:Upgrades.types.energyCap,
      value:10
    },
    {
      type:Upgrades.types.energyRate,
      value:0.5
    },
    {
      type:Upgrades.types.boneCollectorCapacity,
      value:15
    },
    {
      type:Upgrades.types.plagueDamage,
      value:50
    },
    {
      type:Upgrades.types.bloodCap,
      value:5000
    },
    {
      type:Upgrades.types.brainsRate,
      value:2
    },
    {
      type:Upgrades.types.zombieHealthPC,
      value:0.02,
      percentage:true
    },
    {
      type:Upgrades.types.bonesRate,
      value:2
    },
    {
      type:Upgrades.types.zombieDmgPC,
      value:0.02,
      percentage:true
    }
  ],
  isPercentage(type) {
    for (var i = 0; i < this.trophyStats.length; i++) {
      if (this.trophyStats[i].type == type) {
        return this.trophyStats[i].percentage == true;
      }
    }
  },
  doesLevelHaveTrophy(level) {
    if (GameModel.persistentData.vipEscaped) {
      if (GameModel.persistentData.vipEscaped.includes(level)) {
        return false;
      }
    }
    if (GameModel.persistentData.trophies) {
      if (GameModel.persistentData.trophies.includes(level)) {
        return false;
      }
    }
    return level % 5 == 0;
  },
  createTrophy(level, owned, escaped) {
    var trophyId = Math.round(level / 5) - 1;
    var multiplier = Math.floor(trophyId / this.trophyStats.length);
    var trophy = this.trophyStats[trophyId - (multiplier * this.trophyStats.length)];
    return {
      level:level,
      type:trophy.type,
      effect:trophy.value * (multiplier + 1),
      rank:1,
      owned:owned,
      escaped:escaped
    };
  },
  trophyAquired(level) {
    if (!GameModel.persistentData.trophies) {
      GameModel.persistentData.trophies = [];
    }
    if (!GameModel.persistentData.trophies.includes(level)) {
      GameModel.persistentData.trophies.push(level);
      GameModel.persistentData.trophies.sort();
      GameModel.saveData();
      Upgrades.applyUpgrades();
      if (window.kongregate) {
        window.kongregate.stats.submit("trophies", GameModel.persistentData.trophies.length);
      }
      GameModel.sendMessage("The VIP has been killed! - New Trophy Aquired");
    } else {
      GameModel.sendMessage("The VIP has been killed!");
    }
  },
  getTrophyList() {
    if (!GameModel.persistentData.trophies) {
      GameModel.persistentData.trophies = [];
    }
    if (!GameModel.persistentData.vipEscaped) {
      GameModel.persistentData.vipEscaped = [];
    }
    var trophies = [];
    var maxTrophyToCreate = GameModel.persistentData.allTimeHighestLevel + 5;
    for (var i = 0; i < GameModel.persistentData.trophies.length; i++) {
      if (GameModel.persistentData.trophies[i] > maxTrophyToCreate) {
        maxTrophyToCreate = GameModel.persistentData.trophies[i];
      }
    }

    for (var i=5; i <= maxTrophyToCreate; i += 5) {
      trophies.push(this.createTrophy(i, GameModel.persistentData.trophies.includes(i), GameModel.persistentData.vipEscaped.includes(i)));
    }
    return trophies;
  },
  getTrophyTotals() {
    var trophiesCollected = this.getTrophyList().filter(trophy => trophy.owned);
    var trophies = [];
    for (var i = 0; i < trophiesCollected.length; i++) {
      if (trophies.filter(trophy => trophy.type == trophiesCollected[i].type).length == 0) {
        trophies.push(trophiesCollected[i]);
      } else {
        if (this.isPercentage(trophiesCollected[i].type)) {
          trophies.filter(trophy => trophy.type == trophiesCollected[i].type)[0].effect = 
            ((trophies.filter(trophy => trophy.type == trophiesCollected[i].type)[0].effect + 1) * (1 + trophiesCollected[i].effect)) - 1;
        } else {
          trophies.filter(trophy => trophy.type == trophiesCollected[i].type)[0].effect += trophiesCollected[i].effect;
        }
        
      }
    }
    return trophies;
  },
  getAquiredTrophyList() {
    if (!GameModel.persistentData.trophies) {
      GameModel.persistentData.trophies = [];
    }
    var trophies = [];
    for (var i=0; i < GameModel.persistentData.trophies.length; i++) {
      trophies.push(this.createTrophy(GameModel.persistentData.trophies[i], true));
    }
    return trophies;
  }
};