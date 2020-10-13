Creatures = {
  map : ZmMap,
  model : GameModel,
  creatures : [],
  creatureCount : [],
  aliveCreatures : [],
  discardedSprites : [],
  aliveHumans : [],
  scaling : 1.6,
  moveTargetDistance: 15,
  attackDistance : 20,
  attackSpeed : 3,
  targetDistance : 100,
  fadeSpeed : 0.1,
  currId : 1,
  scanTime : 3,
  creatureTypes : CreatureFactory.types,
  golemTextures : {
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
    lookingForTarget:"lookingForTarget",
    movingToTarget:"movingToTarget",
    attackingTarget:"attackingTarget"
  },

  populate() {
    this.graveyard = Graveyard;

    if (!this.golemTextures.set) {
      this.golemTextures.down = [];
      this.golemTextures.up = [];
      this.golemTextures.right = [];
      this.golemTextures.dead = [];
      for (var i=0; i < 3; i++) {
        this.golemTextures.down.push(PIXI.Texture.from('golem' + i + '.png'));
      }
      for (var i=3; i < 6; i++) {
        this.golemTextures.up.push(PIXI.Texture.from('golem' + i + '.png'));
      }
      for (var i=6; i < 9; i++) {
        this.golemTextures.right.push(PIXI.Texture.from('golem' + i + '.png'));
      }
      this.golemTextures.dead.push(PIXI.Texture.from('golem9.png'));
      this.golemTextures.set = true;
    }

    // reset creature position at start of level
    var creatures = [];
    for (var i = 0; i < this.creatures.length; i++) {
      if (!GameModel.constructions.monsterFactory) {
        this.discardedSprites.push(this.creatures[i]);
        characterContainer.removeChild(this.creatures[i]);
      } else {
        if (!this.creatures[i].dead) {
          creatures.push(this.creatures[i]);
          this.creatures[i].x = this.graveyard.sprite.x;
          this.creatures[i].zIndex = this.creatures[i].y = this.graveyard.sprite.y + (this.graveyard.level > 2 ? 8 : 0);
          this.creatures[i].target = false;
          this.creatures[i].state = this.states.lookingForTarget;
        } else {
          this.discardedSprites.push(this.creatures[i]);
          characterContainer.removeChild(this.creatures[i]);
        }
      }
    }
    this.creatures = creatures;
    this.aliveCreatures = [];

    CreatureFactory.spawnSavedCreatures();
  },

  spawnCreature(health, damage, speed, type, level) {

    if (this.model.creatureCount >= this.model.creatureLimit) {
      return;
    }

    var creature;
    if (this.discardedSprites.length > 0) {
      creature = this.discardedSprites.pop();
      creature.textures = this.golemTextures.down;
    } else {
      creature = new PIXI.AnimatedSprite(this.golemTextures.down);
    }
    creature.immuneToBurns = false;
    creature.bulletReflect = 0;
    switch(type) {
      case this.creatureTypes.earthGolem:
        creature.tint = 0xA87f32;
        creature.bulletReflect = this.model.bulletproofChance;
        break;
      case this.creatureTypes.airGolem:
        creature.tint = 0x9CA5B8;
        break;
      case this.creatureTypes.fireGolem:
        creature.tint = 0xDB471A;
        creature.immuneToBurns = true;
        break;
      case this.creatureTypes.waterGolem:
        creature.tint = 0x4d86e8;
        creature.immuneToBurns = true;
        break;
    }
    creature.zombie = true;
    creature.level = level;
    creature.textureSet = this.golemTextures;
    creature.deadTexture = this.golemTextures.dead;
    creature.currentDirection = this.directions.down;
    creature.creatureType = type;
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
    creature.maxHealth = creature.health = health;
    creature.attackDamage = damage;
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
    creature.maxSpeed = speed;
    creature.scanTime = 0;
    creature.burnTickTimer = this.burnTickTimer;
    creature.smokeTimer = this.smokeTimer;
    creature.play();
    creature.zombieId = this.currId++;
    this.creatures.push(creature);
    characterContainer.addChild(creature);
    Smoke.newZombieSpawnCloud(creature.x, creature.y - 2);
    this.model.creatureCount++;
  },

  update(timeDiff) {
    var aliveCreatures = 0;
    this.aliveHumans = Humans.aliveHumans;
    this.graveyardAttackers = Humans.graveyardAttackers;
    this.aliveZombies = Zombies.aliveZombies;
    this.creatureCount = [];
    for (var i = 0; i < CreatureFactory.creatures.length; i++) {
      this.creatureCount[CreatureFactory.creatures[i].type] = 0;
    }

    this.model.persistentData.savedCreatures = [];

    for (var i=0; i < this.creatures.length; i++) {
      if (this.creatures[i].visible) {
        this.updateCreature(this.creatures[i], timeDiff);
      }
    }
    for (var i=0; i < this.creatures.length; i++) {
      if (this.creatures[i].visible) {
        if (!this.creatures[i].dead) {
          this.aliveZombies.push(this.creatures[i]);
          aliveCreatures++;
          this.creatureCount[this.creatures[i].creatureType]++;
          this.model.persistentData.savedCreatures.push({
            t:this.creatures[i].creatureType,
            l:this.creatures[i].level
          });
        }
      }
    }
    this.model.creatureCount = aliveCreatures;
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
      switch(creature.creatureType) {
        case this.creatureTypes.earthGolem:
          this.golemTaunt(creature);
          break;
        case this.creatureTypes.waterGolem:
          this.golemHeal(creature);
          break;
        case this.creatureTypes.fireGolem:
          this.golemFireball(creature);
          break;
      }
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
          creature.scale.x = creature.target.x > creature.x ? creature.scaling : -creature.scaling;
          if (creature.attackTimer < 0) {
            Humans.damageHuman(creature.target, this.calculateDamage(creature));
            if (creature.creatureType == this.creatureTypes.fireGolem) {
              Humans.burnHuman(creature.target, creature.attackDamage / 2);
            }
            creature.attackTimer = this.attackSpeed * this.model.runeEffects.attackSpeed;
            if (creature.burning) {
              creature.attackTimer *= (1 / this.model.burningSpeedMod);
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

  golemTaunt(creature) {
    for (var i=0; i < this.aliveHumans.length; i++) {
      if (Math.abs(this.aliveHumans[i].x - creature.x) < this.targetDistance) {
        if (Math.abs(this.aliveHumans[i].y - creature.y) < this.targetDistance) {
          if (!this.aliveHumans[i].vip) {
            this.aliveHumans[i].zombieTarget = creature;
            this.aliveHumans[i].target = creature;
          }
        }
      }
    }
  },

  golemHeal(creature) {
    var healingDone = creature.attackDamage;
    for (var i = 0; i < this.aliveZombies.length; i++) {
      if (Math.abs(this.aliveZombies[i].x - creature.x) < this.targetDistance) {
        if (Math.abs(this.aliveZombies[i].y - creature.y) < this.targetDistance) {
          this.healZombie(this.aliveZombies[i], healingDone);
        }
      }
    }
    for (var i=0; i < this.creatures.length; i++) {
      if (!this.creatures[i].dead && this.creatures[i].visible) {
        if (Math.abs(this.creatures[i].x - creature.x) < this.targetDistance) {
          if (Math.abs(this.creatures[i].y - creature.y) < this.targetDistance) {
            this.healZombie(this.creatures[i], healingDone);
          }
        }
      }
    }
  },

  golemFireball(creature) {
    var fireBalls = 5;
    for (var i=0; i < this.aliveHumans.length; i++) {
      if (fireBalls > 0) {
        if (Math.abs(this.aliveHumans[i].x - creature.x) < this.targetDistance) {
          if (Math.abs(this.aliveHumans[i].y - creature.y) < this.targetDistance) {
            fireBalls--;
            Bullets.newBullet(creature, this.aliveHumans[i], creature.attackDamage / 2, false, false, true);
          }
        }
      }
    }
  }
};