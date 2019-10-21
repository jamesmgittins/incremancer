Spells = {
  spells : [
    {
      id : 1,
      name : "Time Warp",
      icon : "",
      cooldown : 120,
      duration : 30,
      onStart() {
        GameModel.gameSpeed = 2;
      },
      onEnd() {
        GameModel.gameSpeed = 1;
      },
      unlocked : false
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
  castSpell(spell) {
    if (spell.onCooldown || spell.active)
      return false;

    spell.onCooldown = true;
    spell.cooldownLeft = spell.cooldown;
    spell.active = true;
    spell.timer = spell.duration;
    spell.onStart();
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
          spell.onEnd();
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