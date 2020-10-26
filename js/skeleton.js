Skeleton = {
  map : ZmMap,
  model : GameModel,
  skeletons : [],
  aliveSkeletons : [],
  discardedSprites : [],
  aliveHumans : [],
  scaling : 1,
  moveTargetDistance: 15,
  attackDistance : 20,
  attackSpeed : 3,
  targetDistance : 100,
  fadeSpeed : 0.1,
  currId : 1,
  scanTime : 3,
  spawnTimer : 0,
  respawnTime : 10,
  moveSpeed : 40,
  lastKillingBlow : 0,
  randomSpells : [],
  textures : {
    set:false
  },
  directions : {
    down:1,
    up:2,
    right:3,
    left:4,
    dead:5
  },
  burnTickTimer : 5,
  smokeTimer : 0.3,
  fastDistance:fastDistance,
  magnitude:magnitude,
  damageZombie:Zombies.damageZombie,
  searchClosestTarget:Zombies.searchClosestTarget,
  updateBurns:Zombies.updateBurns,
  updateZombieRegen:Zombies.updateZombieRegen,
  causePlagueExplosion:Zombies.causePlagueExplosion,
  inflictPlague:Zombies.inflictPlague,
  healZombie:Zombies.healZombie,

  states : {
    lookingForTarget:1,
    movingToTarget:2,
    attackingTarget:3
  },

  storageName : "incremancerskele",
  persistent : {
    xpRate : 0,
    skeletons : 0,
    level : 1,
    xp : 0,
    items : [],
    currItemId : 0
  },

  xpForNextLevel() {
    return 1000 * Math.pow(this.persistent.level, 2);
  },

  addXp(xp) {
    if (this.isAlive()) {
      this.persistent.xp += xp * this.persistent.xpRate;
      if (this.persistent.xp > this.xpForNextLevel()) {
        this.persistent.xp -= this.xpForNextLevel();
        this.persistent.level++;
        Upgrades.applyUpgrades();
        GameModel.sendMessage("Skeleton Champion reached level " + this.persistent.level + "!");
        var skeletonElement = document.getElementById("skeleton");
        if (skeletonElement) {
          skeletonElement.classList.toggle("levelup");
          setTimeout(function() {
            skeletonElement.classList.toggle("levelup");
          }, 3000);
        };        
      }
    }
  },

  isAlive : function() {
    for (var i = 0; i < this.skeletons.length; i++) {
      if (!this.skeletons[i].dead) {
        return true;
      }
    }
    return false;
  },

  applyUpgrades() {
    if (this.persistent.skeletons > 0) {
      this.applyItemUpgrades();
      var multiplier = 1 + (this.persistent.level / 100);
      GameModel.bloodPCMod *= multiplier;
      GameModel.brainsPCMod *= multiplier;
      GameModel.bonesPCMod *= multiplier;
      GameModel.partsPCMod *= multiplier;
      GameModel.zombieDamagePCMod *= multiplier;
      GameModel.zombieHealthPCMod *= multiplier;
    }
  },

  acceptOffer() {
    GameModel.persistentData.trophies = [];
    
    if (this.persistent.skeletons < 1) {
      this.persistent.skeletons = 1;
      this.persistent.xpRate = 1;
      GameModel.sendMessage("Skeleton Champion joins the fight!");
    } else {
      this.persistent.xpRate *= 2;
    }
    Upgrades.applyUpgrades();
    GameModel.saveData();
  },

  populate() {
    this.graveyard = Graveyard;

    if (!this.textures.set) {
      this.textures.down = [];
      this.textures.up = [];
      this.textures.right = [];
      this.textures.dead = [];
      for (var i=0; i < 3; i++) {
        this.textures.down.push(PIXI.Texture.from('skeleton' + i + '.png'));
      }
      for (var i=3; i < 6; i++) {
        this.textures.up.push(PIXI.Texture.from('skeleton' + i + '.png'));
      }
      for (var i=6; i < 9; i++) {
        this.textures.right.push(PIXI.Texture.from('skeleton' + i + '.png'));
      }
      this.textures.dead.push(PIXI.Texture.from('skeleton9.png'));
      this.textures.set = true;
    }

    // reset creature position at start of level
    var skeletons = [];
    for (var i = 0; i < this.skeletons.length; i++) {
      if (!this.skeletons[i].dead) {
        skeletons.push(this.skeletons[i]);
        this.skeletons[i].x = this.graveyard.sprite.x;
        this.skeletons[i].zIndex = this.skeletons[i].y = this.graveyard.sprite.y + (this.graveyard.level > 2 ? 8 : 0);
        this.skeletons[i].target = false;
        this.skeletons[i].state = this.states.lookingForTarget;
      } else {
        this.discardedSprites.push(this.skeletons[i]);
        characterContainer.removeChild(this.skeletons[i]);
      }
    }
    this.skeletons = skeletons;
    this.aliveSkeletons = [];

    this.lootChance = 0.001;
    if (GameModel.level < this.persistent.level)
      this.lootChance *= 0.5;
    if (GameModel.level > this.persistent.level * 2)
      this.lootChance *= 1.5;
  },

  spawnCreature() {
    var creature;
    if (this.discardedSprites.length > 0) {
      creature = this.discardedSprites.pop();
      creature.textures = this.textures.down;
    } else {
      creature = new PIXI.AnimatedSprite(this.textures.down);
    }
    creature.tint = 0xEEEEEE;
    creature.immuneToBurns = false;
    creature.bulletReflect = 0;
    creature.zombie = true;
    creature.textureSet = this.textures;
    creature.deadTexture = this.textures.dead;
    creature.currentDirection = this.directions.down;
    creature.dead = false;
    creature.burnDamage = 0;
    creature.burning = false;
    creature.lastKnownBuilding = false;
    creature.alpha = 1;
    creature.animationSpeed = 0.15;
    creature.anchor = {x:8.5/16,y:1};
    creature.position = {
      x:this.graveyard.sprite.x,
      y:this.graveyard.sprite.y + (this.graveyard.level > 2 ? 8 : 0)
    };
    creature.target = false;
    creature.zIndex = creature.position.y;
    creature.visible = true;
    creature.maxHealth = creature.health = (this.model.zombieHealth * 10);
    creature.attackDamage = this.model.zombieDamage * 10;
    creature.regenTimer = 5;
    creature.state = this.states.lookingForTarget;
    creature.scaling = this.scaling;
    creature.scale = {
      x: creature.scaling,
      y: creature.scaling
    };
    creature.abilityTime = Math.random() * 4;
    creature.attackTimer = 0;
    creature.xSpeed = 0;
    creature.ySpeed = 0;
    creature.speedMultiplier = 1;
    creature.maxSpeed = this.moveSpeed;
    creature.scanTime = 0;
    creature.burnTickTimer = this.burnTickTimer;
    creature.smokeTimer = this.smokeTimer;
    creature.play();
    creature.zombieId = this.currId++;
    this.skeletons.push(creature);
    characterContainer.addChild(creature);
    Smoke.newZombieSpawnCloud(creature.x, creature.y - 2);
  },

  skeletonTimer() {
    if (this.aliveSkeletons.length < this.persistent.skeletons) {
      return this.spawnTimer;
    }
    return 0;
  },

  update(timeDiff) {
    this.aliveHumans = Humans.aliveHumans;
    this.graveyardAttackers = Humans.graveyardAttackers;
    this.aliveZombies = Zombies.aliveZombies;

    this.aliveSkeletons = [];

    for (var i=0; i < this.skeletons.length; i++) {
      if (this.skeletons[i].visible) {
        this.updateCreature(this.skeletons[i], timeDiff);
        if (!this.skeletons[i].dead) {
          this.aliveZombies.push(this.skeletons[i]);
          this.aliveSkeletons.push(this.skeletons[i]);
        }
      }
    }

    if (this.aliveSkeletons.length < this.persistent.skeletons) {
      this.spawnTimer -= timeDiff;
      if (this.spawnTimer < 0) {
        this.spawnCreature();
        this.spawnTimer = this.respawnTime;
      }
    }
    this.lastKillingBlow -= timeDiff;
  },

  

  updateCreature(creature, timeDiff) {
    if (creature.dead) {
      if (!creature.visible)
        return;
      
      creature.alpha -= this.fadeSpeed * timeDiff;
      if (creature.alpha < 0) {
        creature.visible = false;
        characterContainer.removeChild(creature);
      }
      return;
    }
    
    creature.attackTimer -= timeDiff;
    creature.scanTime -= timeDiff;
    creature.abilityTime -= timeDiff;
    
    if (this.model.runeEffects.healthRegen > 0) {
      this.updateZombieRegen(creature, timeDiff);
    }
    
    if (creature.burning && !creature.immuneToBurns) {
      this.updateBurns(creature, timeDiff);
    }
    
    if (creature.abilityTime < 0) {
      creature.abilityTime = 4;
      // do abilities
    }

    if ((!creature.target || creature.target.dead) && creature.scanTime < 0) {
      creature.state = this.states.lookingForTarget;
    }

    switch(creature.state) {

      case this.states.lookingForTarget:

        this.searchClosestTarget(creature);
        if (creature.target) {
          creature.state = this.states.movingToTarget;
        }
        break;

      case this.states.movingToTarget:

        var distanceToHumanTarget = this.fastDistance(creature.position.x, creature.position.y, creature.target.x, creature.target.y);

        if (distanceToHumanTarget < this.attackDistance) {
          creature.state = this.states.attackingTarget;
          break;
        }

        if (distanceToHumanTarget > this.attackDistance * 3 && creature.scanTime < 0) {
          this.searchClosestTarget(creature);
        }
        this.updateCreatureSpeed(creature, timeDiff);

        break;

      case this.states.attackingTarget:
        var distanceToTarget = this.fastDistance(creature.position.x, creature.position.y, creature.target.x, creature.target.y);
        if (distanceToTarget < this.attackDistance) {
          if (creature.attackTimer < 0 && !creature.target.dead) {
            Humans.damageHuman(creature.target, this.calculateDamage(creature));
            if (creature.target.dead && this.lastKillingBlow <= 0) {
              GameModel.addPrestigePoints(this.persistent.level);
              this.lastKillingBlow = 20;
              PrestigePoints.newPart(creature.target.x, creature.target.y);
            }
            creature.attackTimer = this.attackSpeed * this.model.runeEffects.attackSpeed;
            if (creature.burning) {
              creature.attackTimer *= (1 / this.model.burningSpeedMod);
            }
            if (this.randomSpells.length > 0)  {
              for (var i = 0; i < this.randomSpells.length; i++) {
                if (Math.random() < 0.07) {
                  Spells.castSpellNoMana(this.randomSpells[i]);
                }
              }
            }
          }
          if (distanceToTarget > this.attackDistance / 2) {
            this.updateCreatureSpeed(creature, timeDiff);
          }
        } else {
          creature.state = this.states.movingToTarget;
        }
        break;
    }
  },

  incinerate() {
    var creature;
    for (var i=0; i < this.skeletons.length; i++) {
      if (this.skeletons[i].visible) {
        creature=this.skeletons[i];
      }
    }
    if (creature)
      for (var i=0; i < this.aliveHumans.length; i++) {
        if (Math.abs(this.aliveHumans[i].x - creature.x) < 200) {
          if (Math.abs(this.aliveHumans[i].y - creature.y) < 200) {
            Humans.burnHuman(this.aliveHumans[i], creature.attackDamage);
          }
        }
      }
  },
  

  getCreatureDirection(creature) {
    if(Math.abs(creature.xSpeed) > Math.abs(creature.ySpeed)) {
      //left right
      if (creature.xSpeed < 0) {
        return this.directions.left;
      }
      return this.directions.right;
    } else {
      // up down
      if (creature.ySpeed < 0) {
        return this.directions.up;
      }
      return this.directions.down;
    }
  },

  changeTextureDirection(creature) {
    var direction = this.getCreatureDirection(creature);
    if (direction !== creature.currentDirection) {
      switch(direction) {
        case this.directions.up:
          creature.textures = creature.textureSet.up;
          creature.scale.x = creature.scaling;
          break;
        case this.directions.down:
          creature.textures = creature.textureSet.down;
          creature.scale.x = creature.scaling;
          break;
        case this.directions.right:
          creature.textures = creature.textureSet.right;
          creature.scale.x = creature.scaling;
          break;
        case this.directions.left:
          creature.textures = creature.textureSet.right;
          creature.scale.x = -creature.scaling;
          break;
      }
      creature.currentDirection = direction;
      creature.play();
    }
  },

  updateCreatureSpeed(creature, timeDiff) {
    if (creature.dogStun && creature.dogStun > 0) {
      creature.dogStun -= timeDiff;
      return;
    }

    if (!creature.targetTimer || !creature.targetVector) {
      creature.targetTimer = 0;
    }
    creature.targetTimer-=timeDiff;
    if (creature.targetTimer <= 0) {
      creature.targetVector = this.map.howDoIGetToMyTarget(creature, creature.target);
      creature.targetTimer = 0.2;
    }

    var speedMod = creature.speedMultiplier * creature.maxSpeed;
    
    creature.xSpeed = creature.targetVector.x * speedMod;
    creature.ySpeed = creature.targetVector.y * speedMod;

    creature.position.x += creature.xSpeed * timeDiff;
    creature.position.y += creature.ySpeed * timeDiff;
    creature.zIndex = creature.position.y;
    this.changeTextureDirection(creature);
  },

  calculateDamage(creature) {
    var damage = creature.attackDamage;
    if (this.model.runeEffects.critChance > 0 && Math.random() < this.model.runeEffects.critChance) {
      damage *= this.model.runeEffects.critDamage;
    }
    return damage;
  },

  lootPositions : {
    helmet : {id:1,name:"Helmet"},
    chest : {id:2,name:"Chest"},
    legs : {id:3,name:"Legs"},
    gloves : {id:4,name:"Gloves"},
    boots : {id:5,name:"Boots"},
    sword : {id:6,name:"Sword"},
    shield : {id:7,name:"Shield"}
  },

  rarity : {
    common : 1,
    rare : 2,
    epic : 3,
    legendary : 4
  },

  prefixes : {
    commonQuality : ["Wooden", "Sturdy", "Rigid", "Iron", "Rusty", "Flimsy", "Battered", "Damaged", "Used", "Stained", "Training"],
    rareQuality : ["Steel", "Shiny", "Polished", "Forged", "Plated", "Bronze", "Reinforced", "Veteran's", "Reliable"],
    epicQuality : ["Antique", "Ancient", "Famous", "Bejeweled", "Notorious", "Historic", "Mythical", "Extraordinary"],
    legendaryQuality : ["Monstrous", "Diabolical", "Withering", "Terrible", "Demoniacal"]
  },

  stats : {
    respawnTime : {id:1, scaling:1},
    speed : {id:2, scaling:1},
    zombieHealth : {id:3, scaling:24},
    zombieDamage : {id:4, scaling:3},
    zombieSpeed : {id:5, scaling:1}
  },

  applyItemUpgrades() {
    this.moveSpeed = 40;
    this.respawnTime = 10;
    this.randomSpells = [];
    var that = this;
    this.persistent.items.filter(i => i.q).forEach(function(item){
      item.e.forEach(function(effect){
        switch (effect) {
          case that.stats.respawnTime.id:
            that.respawnTime--;
            break;
          case that.stats.speed.id:
            that.moveSpeed++;
            break;
          case that.stats.zombieHealth.id:
            GameModel.zombieHealth += item.l * that.stats.zombieHealth.scaling;
            break;
          case that.stats.zombieDamage.id:
            GameModel.zombieDamage += item.l * that.stats.zombieDamage.scaling;
            break;
          case that.stats.zombieSpeed.id:
            GameModel.zombieSpeed++;
            break;
        }
      });
      if (item.se)
        item.se.forEach(function(specialEffect){
          that.randomSpells.push(specialEffect);
        });
    });
  },

  getLootName(loot) {
    var prefix = "";
    switch (loot.r) {
      case this.rarity.common:
        prefix = this.prefixes.commonQuality[loot.p];
        break;
      case this.rarity.rare:
        prefix = this.prefixes.rareQuality[loot.p];
        break;
      case this.rarity.epic:
        prefix = this.prefixes.epicQuality[loot.p];
        break;
      case this.rarity.legendary:
        prefix = this.prefixes.legendaryQuality[loot.p];
        break;
    }
    var suffix = "";
    switch (loot.s) {
      case this.lootPositions.helmet.id:
        suffix = this.lootPositions.helmet.name;
        break;
      case this.lootPositions.chest.id:
        suffix = this.lootPositions.chest.name;
        break;
      case this.lootPositions.legs.id:
        suffix = this.lootPositions.legs.name;
        break;
      case this.lootPositions.gloves.id:
        suffix = this.lootPositions.gloves.name;
        break;
      case this.lootPositions.boots.id:
        suffix = this.lootPositions.boots.name;
        break;
      case this.lootPositions.sword.id:
        suffix = this.lootPositions.sword.name;
        break;
      case this.lootPositions.shield.id:
        suffix = this.lootPositions.shield.name;
        break;
    }
    return prefix + " " + suffix;
  },

  getLootClass(loot) {
    switch (loot.r) {
      case this.rarity.common:
        return "common";
      case this.rarity.rare:
        return "rare";
      case this.rarity.epic:
        return "epic";
      case this.rarity.legendary:
        return "legendary";
    }
  },

  getLootStats(loot) {
    var stats = [];
    if (loot.e)
      for (var i = 0; i < loot.e.length; i++) {
        switch (loot.e[i]) {
          case this.stats.respawnTime.id:
            stats.push("-1 second respawn time");
            break;
          case this.stats.speed.id:
            stats.push("+1 movement speed");
            break;
          case this.stats.zombieHealth.id:
            stats.push("+" + formatWhole(this.stats.zombieHealth.scaling * loot.l) + " zombie health");
            break;
          case this.stats.zombieDamage.id:
            stats.push("+" + formatWhole(this.stats.zombieDamage.scaling * loot.l) + " zombie damage");
            break;
          case this.stats.zombieSpeed.id:
            stats.push("+1 zombie speed");
            break;
        }
      }
      
    return stats;
  },

  getSpecialEffects(loot) {
    var stats = [];
    if (loot.se)
    for (var i = 0; i < loot.se.length; i++) {
      var spell = Spells.spells.filter(sp => sp.id == loot.se[i])[0];
      stats.push(spell.itemText || "Has a chance to cast " + spell.name + " when attacking, this does not cost energy or trigger a cooldown");
    }
    return stats;
  },

  testForLoot() {
    if (this.persistent.skeletons > 0) {
      if (Math.random() < this.lootChance) {
        var loot = this.generateLoot(this.persistent.level);
        GameModel.sendMessage(this.getLootName(loot) + " collected!");
        this.persistent.items.push(loot);
      }
    }
  },

  generateLoot(level) {
    var position = Math.round(Math.random() * 6) + 1;
    var rarity = this.rarity.common;
    var specialEffects = [];
    if (Math.random() < 0.2) {
      rarity = this.rarity.rare;
      if (Math.random() < 0.2) {
        rarity = this.rarity.epic;
        if (Math.random() < 0.1) {
          rarity = this.rarity.legendary;
          var spell = getRandomElementFromArray(Spells.spells, Math.random());
          specialEffects.push(spell.id);
        }
      }
    }
    var prefixIndex = 0;
    switch (rarity) {
      case this.rarity.common:
        prefixIndex = Math.floor(Math.random() * this.prefixes.commonQuality.length);
        break;
      case this.rarity.rare:
        prefixIndex = Math.floor(Math.random() * this.prefixes.rareQuality.length);
        break;
      case this.rarity.epic:
        prefixIndex = Math.floor(Math.random() * this.prefixes.epicQuality.length);
        break;
      case this.rarity.legendary:
        prefixIndex = Math.floor(Math.random() * this.prefixes.legendaryQuality.length);
        break;
    }
    var effects = [(Math.random() > 0.5 ? this.stats.zombieHealth.id : this.stats.zombieDamage.id)];
    for (var i = 0; i < rarity - 1; i++) {
      var effect = Math.ceil(Math.random() * 5);
      while (effects.includes(effect)) {
        effect = Math.ceil(Math.random() * 5);
      }
      effects.push(effect);
    }
    return {
      id : this.persistent.currItemId++,
      l : level,
      s : position,
      r : rarity,
      p : prefixIndex,
      e : effects,
      se : specialEffects,
      q : false
    }
  },

  destroyItem(item) {
    this.addXp(item.l * item.r * 10);
    for( var i = 0; i < this.persistent.items.length; i++){
      if ( this.persistent.items[i].id === item.id) { 
        this.persistent.items.splice(i, 1);
      }
    }
  },
  destroyAllItems() {
    this.addXp(this.xpForItems());
    this.persistent.items = this.persistent.items.filter(i => i.q);    
  },
  xpForItems() {
    var xp = 0;
    this.persistent.items.filter(i => !i.q).forEach(function(item){
      xp += item.l * item.r * 10;
    });
    return xp;
  }
};