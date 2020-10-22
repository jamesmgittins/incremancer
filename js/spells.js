Spells = {
  spells : [
    {
      id : 1,
      name : "Time Warp",
      tooltip : "Speed up the flow of time for 30 seconds",
      icon : "",
      cooldown : 120,
      duration : 30,
      energyCost : 0,
      start() {
        GameModel.gameSpeed = 2;
      },
      end() {
        GameModel.gameSpeed = 1;
      }
    },
    {
      id : 2,
      name : "Energy Charge",
      tooltip : "5x Energy rate for 20 seconds, cost 50 energy",
      icon : "",
      cooldown : 180,
      duration : 20,
      energyCost : 50,
      start() {
        GameModel.energySpellMultiplier = 5;
      },
      end() {
        GameModel.energySpellMultiplier = 1;
      }
    },
    {
      id : 3,
      name : "Detonate",
      tooltip : "Explode your zombies into clouds of plague, cost 69 energy... nice",
      icon : "",
      cooldown : 120,
      duration : 3,
      energyCost : 69,
      start() {
        Zombies.detonate = true;
      },
      end() {
        Zombies.detonate = false;
      }
    },
    {
      id : 4,
      name : "Earth Freeze",
      tooltip : "Freeze all humans in place preventing them from moving for 15 seconds, cost 75 energy",
      icon : "",
      cooldown : 60,
      duration : 15,
      energyCost : 75,
      start() {
        Humans.frozen = true;
      },
      end() {
        Humans.frozen = false;
      }
    },
    {
      id : 5,
      name : "Gigazombies",
      tooltip : "For 5 seconds any zombies spawned will be giants with 10x health and attack damage, cost 100 energy",
      icon : "",
      cooldown : 360,
      duration : 5,
      energyCost : 100,
      start() {
        Zombies.super = true;
      },
      end() {
        Zombies.super = false;
      }
    },
    {
      id : 6,
      name : "Incinerate",
      tooltip : "Burns humans near the skeleton champion",
      itemText : "Has a chance to cast Incinerate when attacking, burning all humans within a large radius of the Skeleon",
      icon : "",
      cooldown : 1,
      duration : 10,
      energyCost : 10,
      start() {
        Skeleton.incinerate();
      },
      end() {

      }
    },
    {
      id : 7,
      name : "Pandemic",
      tooltip : "Causes plague to spread",
      itemText : "Has a chance to cast Pandemic when attacking, causing infected humans to spread the plague to each other for 20 seconds",
      icon : "",
      cooldown : 10,
      duration : 20,
      energyCost : 10,
      start() {
        Humans.pandemic = true;
      },
      end() {
        Humans.pandemic = false;
      }
    }
  ],
  lockAllSpells() {
    for (var i = 0; i < this.spells.length; i++) {
      this.spells[i].unlocked = false;
    }
  },
  unlockSpell(spellId) {
    for (var i = 0; i < this.spells.length; i++) {
      if (spellId == this.spells[i].id) {
        this.spells[i].unlocked = true;
      }
    }
  },
  getSpell(spellId) {
    for (var i = 0; i < this.spells.length; i++) {
      if (spellId == this.spells[i].id) {
        return this.spells[i];
      }
    }
  },
  getUnlockedSpells() {
    return this.spells.filter(spell => spell.unlocked);
  },
  castSpell(spell) {
    if (spell.onCooldown || spell.active || !spell.unlocked)
      return false;

    if (spell.energyCost > GameModel.energy)
      return false;
    
    GameModel.energy -= spell.energyCost;
    spell.onCooldown = true;
    spell.cooldownLeft = spell.cooldown;
    spell.active = true;
    spell.timer = spell.duration;
    spell.start();
    GameModel.sendMessage(spell.name);
  },
  castSpellNoMana(spellId) {
    var spellList = this.spells.filter(sp => sp.id == spellId);
    if (spellList.length > 0) {
      var spell = spellList[0];
      if (spell.onCooldown || spell.active)
        return false;
      
      spell.active = true;
      spell.timer = spell.duration;
      spell.start();
      GameModel.sendMessage(spell.name);
    }
  },
  updateSpells(timeDiff) {
    for (var i = 0; i < this.spells.length; i++) {
      var spell = this.spells[i];

      if (spell.onCooldown) {
        spell.cooldownLeft -= timeDiff;
        if (spell.cooldownLeft <= 0) {
          spell.onCooldown = false;
        }
      }

      if (spell.active) {
        spell.timer -= timeDiff;
        if (spell.timer <= 0) {
          spell.active = false;
          spell.end();
        }
      }
    }
  }
};

for (var i = 0; i < Spells.spells.length; i++) {
  Spells.spells[i].onCooldown = false;
  Spells.spells[i].active = false;
  Spells.spells[i].cooldownLeft = 0;
  Spells.spells[i].timer = 0;
}