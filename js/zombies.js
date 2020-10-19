Zombies = {
  map : ZmMap,
  model : GameModel,
  zombies : [],
  discardedZombies : [],
  aliveZombies : [],
  aliveHumans : [],
  zombiePartition : [],
  scaling : 2,
  moveTargetDistance: 15,
  attackDistance : 15,
  attackSpeed : 3,
  targetDistance : 100,
  fadeSpeed : 0.1,
  currId : 1,
  scanTime : 3,
  textures : [],
  dogTexture : [],
  deadDogTexture : [],
  maxSpeed : 10,
  zombieCursor : false,
  zombieCursorScale : 3,
  burnTickTimer : 5,
  smokeTimer : 0.3,
  fastDistance:fastDistance,
  magnitude:magnitude,
  detonate : false,
  super : false,

  states : {
    lookingForTarget:1,
    movingToTarget:2,
    attackingTarget:3
  },

  populate() {
    this.graveyard = Graveyard;
    this.model.zombieCount = 0;
    if (this.textures.length == 0) {
      for (var i=0; i < 3; i++) {
        var animated = [];
        for (var j=0; j < 3; j++) {
          animated.push(PIXI.Texture.from('zombie' + (i + 1) + '_' + (j + 1) + '.png'));
        }
        this.textures.push({
          animated : animated,
          dead : [PIXI.Texture.from('zombie' + (i + 1) + '_dead.png')]
        })
      }
      for (var i=0; i < 2; i++) {
        this.dogTexture.push(PIXI.Texture.from("zombiedog" + (i + 1) + ".png"));
      }
      this.deadDogTexture = [PIXI.Texture.from("zombiedogdead.png")];
    }

    if (this.zombies.length > 0) {
      for (var i=0; i < this.zombies.length; i++) {
        characterContainer.removeChild(this.zombies[i]);
        this.zombies[i].stop();
      }
      this.discardedZombies = this.zombies.slice();
      this.zombies.length = 0;
      this.aliveZombies.length = 0;
    }
    if (!this.zombieCursor) {
      this.zombieCursor = new PIXI.Container();
      var cursorSprite = new PIXI.Sprite(PIXI.Texture.from('zombie1_1.png'));
      cursorSprite.alpha = 0.6;
      cursorSprite.scale.x = cursorSprite.scale.y = 1;
      cursorSprite.anchor = {x:35/80, y:1};
      this.zombieCursorText = new PIXI.Text("1", {
        fontFamily: 'sans-serif',
        fontSize : 40,
        fill: "#FFF",
        stroke: "#000",
        strokeThickness: 0,
        align: 'center'
      });
      this.zombieCursorText.anchor = {x:0.5, y:1};
      this.zombieCursorText.scale.x = this.zombieCursorText.scale.y = 0.1;
      this.zombieCursorText.y = -9
      this.zombieCursorText.visible = false;
      this.zombieCursorText.alpha = 0.7;

      this.zombieCursor.addChild(cursorSprite);
      this.zombieCursor.addChild(this.zombieCursorText);
      uiContainer.addChild(this.zombieCursor);

      
    }
  },

  createZombie(x, y, isDog = false) {
    var textureId = Math.floor(Math.random() * this.textures.length);
    var zombie;
    if (this.discardedZombies.length > 0) {
      zombie = this.discardedZombies.pop();
      if (isDog) {
        zombie.textures = this.dogTexture;
      } else {
        zombie.textures = this.textures[textureId].animated;
      }
    } else {
      if (isDog) {
        zombie = new PIXI.AnimatedSprite(this.dogTexture);
      } else {
        zombie = new PIXI.AnimatedSprite(this.textures[textureId].animated);
      }
      
    }
    zombie.zombie = true;
    zombie.mod = 1;
    zombie.scalemod = 1;
    if (this.super) {
      zombie.mod = 10;
      zombie.scalemod = 1.5;
    }
    if (zombie.scalemod > 2) {
      zombie.mod = 20;
      zombie.scalemod = 2;
    }
    zombie.isDog = isDog;
    zombie.deadTexture = zombie.isDog ? this.deadDogTexture : this.textures[textureId].dead;
    zombie.super = this.super;
    zombie.textureId = textureId;
    zombie.dead = false;
    zombie.burnDamage = 0;
    zombie.burning = false;
    zombie.lastKnownBuilding = false;
    zombie.alpha = 1;
    zombie.animationSpeed = 0.15;
    zombie.anchor = {x:35/80,y:1};
    zombie.position = {x:x,y:y};
    zombie.target = false;
    zombie.zIndex = zombie.position.y;
    zombie.visible = true;
    zombie.maxHealth = zombie.health = this.model.zombieHealth * zombie.mod;
    zombie.regenTimer = 5;
    zombie.state = this.states.lookingForTarget;
    var dogScale = isDog ? 0.7 : 1;
    zombie.scaling = zombie.scalemod * this.scaling * dogScale;
    zombie.scale = {
      x: Math.random() > 0.5 ? zombie.scaling : -1 * zombie.scaling,
      y: zombie.scaling
    };
    zombie.attackTimer = 0;
    zombie.xSpeed = 0;
    zombie.ySpeed = 0;
    zombie.speedMultiplier = 1;
    zombie.scanTime = 0;
    zombie.burnTickTimer = this.burnTickTimer;
    zombie.smokeTimer = this.smokeTimer;
    zombie.play();
    zombie.zombieId = this.currId++;
    this.zombies.push(zombie);
    characterContainer.addChild(zombie);
    Smoke.newZombieSpawnCloud(x, y - 2);
  },

  spawnZombie(x,y) {
    if (this.model.energy < this.model.zombieCost)
      return;

    this.model.energy -= this.model.zombieCost;
    this.createZombie(x, y, false);
  },

  spawnAllZombies(x,y) {
    var numZombies = Math.min(Math.floor(this.model.energy / this.model.zombieCost), 100);
    for (var i = 0; i < numZombies; i++) {
      this.spawnZombie(x + 4 * (Math.random() -1 ), y + 4 * (Math.random() -1 ));
    }
  },

  damageZombie(zombie, damage, human) {
    if (zombie.graveyard) {
      Graveyard.damageGraveyard(damage);
      return;
    }
    if (this.graveyard.isWithinFence(zombie)) {
      damage *= 0.5;
      Exclamations.newShield(zombie);
    }
    if (human && human.infected) {
      damage *= this.model.plagueDmgReduction;
    }
    zombie.health -= damage * this.model.runeEffects.damageReduction;
    zombie.speedMultiplier = Math.max(Math.min(1, zombie.health / zombie.maxHealth), 0.4);
    if (zombie.burning) {
      zombie.speedMultiplier = this.model.burningSpeedMod;
    }
    Blood.newSplatter(zombie.x, zombie.y);
    if (zombie.health <= 0 && !zombie.dead) {
      Bones.newBones(zombie.x, zombie.y);
      zombie.dead = true;
      if (Math.random() < this.model.infectedBlastChance) {
        this.causePlagueExplosion(zombie, zombie.maxHealth * 0.2, true);
      }
      zombie.textures = zombie.deadTexture;
      zombie.gotoAndStop(0);
      if (Math.random() < this.model.brainRecoverChance) {
        this.model.addBrains(1);
      }
    }
    if (human && this.model.runeEffects.damageReflection > 0) {
      Humans.damageHuman(human, damage * this.model.runeEffects.damageReflection);
    }
  },

  causePlagueExplosion(zombie, damage, killZombie = true) {
    var explosionRadius = 50;
    Blood.newPlagueSplatter(zombie.x, zombie.y);
    Blasts.newBlast(zombie.x, zombie.y - 4);
    if (killZombie) {
      zombie.visible = false;
      characterContainer.removeChild(zombie);
    }
    for (var i = 0; i < this.aliveHumans.length; i++) {
      if (Math.abs(this.aliveHumans[i].x - zombie.x) < explosionRadius) {
        if (Math.abs(this.aliveHumans[i].y - zombie.y) < explosionRadius) {
          if (this.fastDistance(zombie.x, zombie.y, this.aliveHumans[i].x, this.aliveHumans[i].y) < explosionRadius) {
            this.inflictPlague(this.aliveHumans[i]);
            Humans.damageHuman(this.aliveHumans[i], damage);
          }
        }
      }
    }
    if (this.model.blastHealing > 0) {
      var healingDone = damage * this.model.blastHealing;
      for (var i = 0; i < this.aliveZombies.length; i++) {
        if (Math.abs(this.aliveZombies[i].x - zombie.x) < explosionRadius) {
          if (Math.abs(this.aliveZombies[i].y - zombie.y) < explosionRadius) {
            if (this.fastDistance(zombie.x, zombie.y, this.aliveZombies[i].x, this.aliveZombies[i].y) < explosionRadius) {
              this.healZombie(this.aliveZombies[i], healingDone);
            }
          }
        }
      }
    }
  },

  partitionInsert(partition, zombie) {
    var x = Math.round(zombie.x / 10);
    var y = Math.round(zombie.y / 10);
    if (!partition[x])
      partition[x] = [];
    if (!partition[x][y])
      partition[x][y] = [];
    partition[x][y].push(zombie);
  },

  partitionGetNeighbours(zombie) {
    var neighbours = [];
    var x = Math.round(zombie.x / 10);
    var y = Math.round(zombie.y / 10);
    for (var i = x -1; i <= x + 1; i++) {
      if (this.zombiePartition[i]) {
        for (var j = y -1; j <= y + 1; j++) {
          if (this.zombiePartition[i][j]) {
            neighbours.push.apply(neighbours, this.zombiePartition[i][j]);
          }
        }
      }
    }
    return neighbours;
  },

  update(timeDiff) {
    this.maxSpeed = this.model.zombieSpeed;
    this.reactionTime = Math.max(0.2, this.aliveZombies.length / 2000);
    var aliveZombies = [];
    var zombiePartition = [];
    this.aliveHumans = Humans.aliveHumans;
    this.graveyardAttackers = Humans.graveyardAttackers;
    for (var i=0; i < this.zombies.length; i++) {
      if (this.zombies[i].visible) {
        this.updateZombie(this.zombies[i], timeDiff);
        if (!this.zombies[i].dead) {
          aliveZombies.push(this.zombies[i]);
          this.partitionInsert(zombiePartition, this.zombies[i]);
        }
      }
    }
    this.model.zombieCount = aliveZombies.length;
    this.aliveZombies = aliveZombies;
    this.zombiePartition = zombiePartition;
    if (this.model.energy >= this.model.zombieCost && this.model.currentState == this.model.states.playingLevel) {
      this.zombieCursor.visible = true;
      if (KeysPressed.shift) {
        this.zombieCursorText.visible = true;
        var numZombies = Math.min(Math.floor(this.model.energy / this.model.zombieCost), 100);
        if (this.zombieCursorText.text != numZombies) {
          this.zombieCursorText.text = numZombies;
        }
      } else {
        this.zombieCursorText.visible = false;
      }
    } else {
      this.zombieCursor.visible = false;
    }
  },

  detonateZombie(zombie, timeDiff) {
    if (!zombie.detonateTimer) {
      zombie.detonateTimer = Math.random() * 3;  
    }
    zombie.detonateTimer -= timeDiff;
    if (zombie.detonateTimer < 0) {
      Bones.newBones(zombie.x, zombie.y);
      zombie.dead = true;
      this.causePlagueExplosion(zombie, zombie.maxHealth * 0.2, true);
      if (Math.random() < this.model.brainRecoverChance) {
        this.model.addBrains(1);
      }
    }
  },

  updateZombie(zombie, timeDiff) {

    if (zombie.dead) {
      if (!zombie.visible)
        return;
      
      zombie.alpha -= this.fadeSpeed * timeDiff;
      if (zombie.alpha < 0) {
        zombie.visible = false;
        characterContainer.removeChild(zombie);
      }
      return;
    }
    
    zombie.attackTimer -= timeDiff;
    zombie.scanTime -= timeDiff;
    
    if (this.model.runeEffects.healthRegen > 0) {
      this.updateZombieRegen(zombie, timeDiff);
    }

    if (this.detonate) {
      this.detonateZombie(zombie, timeDiff);
    }
    
    if (zombie.burning)
      this.updateBurns(zombie, timeDiff);

    if ((!zombie.target || zombie.target.dead) && zombie.scanTime < 0) {
      zombie.state = this.states.lookingForTarget;
    }

    switch(zombie.state) {

      case this.states.lookingForTarget:

        this.searchClosestTarget(zombie.target ? zombie.target : zombie);
        if (!zombie.target || zombie.target.dead)
          this.assignRandomTarget(zombie);
        if (zombie.target) {
          zombie.state = this.states.movingToTarget;
        }
        break;

      case this.states.movingToTarget:

        var distanceToHumanTarget = this.fastDistance(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y);

        if (distanceToHumanTarget < this.attackDistance) {
          zombie.state = this.states.attackingTarget;
          break;
        }
        if (zombie.attackTimer < 0 && distanceToHumanTarget < this.model.spitDistance) {
          Bullets.newBullet(zombie, zombie.target, this.model.zombieDamage / 2, true);
          zombie.attackTimer = this.attackSpeed * this.model.runeEffects.attackSpeed;
        }

        if (distanceToHumanTarget > this.attackDistance * 3 && zombie.scanTime < 0) {
          this.searchClosestTarget(zombie);
        }
        this.updateZombieSpeed(zombie, timeDiff);

        break;

      case this.states.attackingTarget:
        var distanceToTarget = this.fastDistance(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y);
        if (distanceToTarget < this.attackDistance) {
          zombie.scale.x = zombie.target.x > zombie.x ? zombie.scaling : -zombie.scaling;
          if (zombie.attackTimer < 0) {
            Humans.damageHuman(zombie.target, this.calculateDamage(zombie));
            if (zombie.isDog) {
              zombie.target.dogStun = 1;
            }
            if (Math.random() < this.model.infectedBiteChance) {
              this.inflictPlague(zombie.target);
            }
            zombie.attackTimer = this.attackSpeed * this.model.runeEffects.attackSpeed;
            if (zombie.burning) {
              zombie.attackTimer *= (1 / this.model.burningSpeedMod);
            }
          }
          if (distanceToTarget > this.attackDistance / 2) {
            this.updateZombieSpeed(zombie, timeDiff);
          }
        } else {
          zombie.state = this.states.movingToTarget;
        }
        break;
    }
  },

  updateZombieRegen(zombie, timeDiff) {
    zombie.regenTimer -= timeDiff;

    if (zombie.regenTimer < 0) {
      zombie.regenTimer = 5;
      if (zombie.health < zombie.maxHealth) {
        zombie.health += zombie.maxHealth * this.model.runeEffects.healthRegen;
        if (zombie.health > zombie.maxHealth) {
          zombie.health = zombie.maxHealth;
        }
      }
    }
  },

  healZombie(zombie, healingDone) {
    if (zombie.health < zombie.maxHealth) {
      zombie.health += healingDone;
      Exclamations.newHealing(zombie);
      if (zombie.health > zombie.maxHealth) {
        zombie.health = zombie.maxHealth;
      }
    }
  },

  calculateDamage(zombie) {
    var damage = this.model.zombieDamage * zombie.mod;
    if (this.model.runeEffects.critChance > 0 && Math.random() < this.model.runeEffects.critChance) {
      damage *= this.model.runeEffects.critDamage;
    }
    return damage;
  },

  inflictPlague(human) {
    if (!human.infected) {
      Exclamations.newPoison(human);
      human.plagueDamage = (this.model.zombieDamage / 2) + this.model.plagueDamageMod;
      human.plagueTicks = 5;
    } else {
      human.plagueDamage += (this.model.zombieDamage / 2) + this.model.plagueDamageMod;
      human.plagueTicks += 5;
    }
    human.infected = true;
  },

  updateBurns(zombie, timeDiff) {
    zombie.burnTickTimer -= timeDiff;
    zombie.smokeTimer -= timeDiff;

    if (zombie.smokeTimer < 0) {
      Smoke.newFireSmoke(zombie.x, zombie.y - 14);
      zombie.smokeTimer = this.smokeTimer;
    }

    if (zombie.burnTickTimer < 0) {
      this.damageZombie(zombie, zombie.burnDamage);
      zombie.burnTickTimer = this.burnTickTimer;
      Exclamations.newFire(zombie);
    }
  },

  searchClosestTarget(zombie) {
    if (zombie.scanTime > 0)
      return;

    zombie.scanTime = this.scanTime * Math.random();
    var distanceToTarget = 300;

    if (this.model.isBossStage(this.model.level) && Math.random() > 0.3) {
      for (var i = 0; i < this.graveyardAttackers.length; i++) {
        if (Math.abs(this.graveyardAttackers[i].x - zombie.x) < distanceToTarget) {
          if (Math.abs(this.graveyardAttackers[i].y - zombie.y) < distanceToTarget) {
            var distanceToHuman = this.fastDistance(zombie.x, zombie.y, this.graveyardAttackers[i].x, this.graveyardAttackers[i].y);
            if (distanceToHuman < distanceToTarget) {
              zombie.target = this.graveyardAttackers[i];
              distanceToTarget = distanceToHuman;
            }
          }
        }
      }
    }

    if (distanceToTarget == 300) {
      distanceToTarget = 10000;
      for (var i = 0; i < this.aliveHumans.length; i++) {
        if (Math.abs(this.aliveHumans[i].x - zombie.x) < distanceToTarget) {
          if (Math.abs(this.aliveHumans[i].y - zombie.y) < distanceToTarget) {
            var distanceToHuman = this.fastDistance(zombie.x, zombie.y, this.aliveHumans[i].x, this.aliveHumans[i].y);
            if (distanceToHuman < distanceToTarget) {
              zombie.target = this.aliveHumans[i];
              distanceToTarget = distanceToHuman;
            }
          }
        }
      }
    }
  },

  assignRandomTarget(zombie) {
    var building = this.map.findBuilding(zombie);
    if (building && this.map.isInsidePoi(zombie.x, zombie.y, building, 0)) {
      for (var i = 0; i < this.aliveHumans.length; i++) {
        if (this.map.isInsidePoi(this.aliveHumans[i].x, this.aliveHumans[i].y, building, 0)) {
          zombie.target = this.aliveHumans[i];
          return;
        }
      }
    }
    zombie.target = getRandomElementFromArray(this.aliveHumans, Math.random());
  },

  dotProduct(x, y){
    return x * x + y * y;
  },

  updateZombieSpeed(zombie, timeDiff) {

    if (zombie.dogStun && zombie.dogStun > 0) {
      zombie.dogStun -= timeDiff;
      return;
    }

    if (!zombie.targetTimer || !zombie.targetVector) {
      zombie.targetTimer = 0;
    }
    zombie.targetTimer-=timeDiff;
    if (zombie.targetTimer <= 0) {
      zombie.targetVector = this.map.howDoIGetToMyTarget(zombie, zombie.target);
      zombie.targetTimer = this.reactionTime;
    }
    
    if (this.model.gameSpeed > 1 || zombie.isDog) {
      var dogSpeed = zombie.isDog ? 1.5 : 1;
      var zombieMaxSpeed = Math.max(this.maxSpeed * zombie.speedMultiplier * dogSpeed, 8);
      zombie.xSpeed = zombie.targetVector.x * zombieMaxSpeed;
      zombie.ySpeed = zombie.targetVector.y * zombieMaxSpeed;
    } else {
      var factor = this.maxSpeed * 5;

      zombie.xSpeed += zombie.targetVector.x * factor * timeDiff;
      zombie.ySpeed += zombie.targetVector.y * factor * timeDiff;
    
      var speedMagnitudeSq = this.dotProduct(zombie.xSpeed, zombie.ySpeed);
      var zombieMaxSpeedSq = Math.pow(Math.max(this.maxSpeed * zombie.speedMultiplier, 8),2);
      if (speedMagnitudeSq > zombieMaxSpeedSq) {
        zombie.xSpeed *= zombieMaxSpeedSq / speedMagnitudeSq;
        zombie.ySpeed *= zombieMaxSpeedSq / speedMagnitudeSq;
      }
    }

    var newPosition = {x:zombie.position.x + zombie.xSpeed * timeDiff, y:zombie.position.y + zombie.ySpeed * timeDiff};

    if (!zombie.turnTimer) {
      zombie.turnTimer = 0;
    }
    zombie.turnTimer -= timeDiff;

    if (zombie.turnTimer < 0) {
      zombie.turnTimer = 0.5;
      if (!this.isSpaceToMove(zombie, newPosition.x, newPosition.y)) {
        if (Math.random() > 0.5) {
          var newSpeed = {x:-zombie.ySpeed/2 + zombie.xSpeed/2, y:zombie.xSpeed/2 + zombie.ySpeed/2}; // 45 degrees
          zombie.xSpeed = newSpeed.x;
          zombie.ySpeed = newSpeed.y;
        } else {
          var newSpeed = {x:zombie.ySpeed/2 + zombie.xSpeed/2, y:-zombie.xSpeed/2 + zombie.ySpeed/2}; // 45 degrees
          zombie.xSpeed = newSpeed.x;
          zombie.ySpeed = newSpeed.y;
        }
        newPosition = {x:zombie.position.x + zombie.xSpeed * timeDiff, y:zombie.position.y + zombie.ySpeed * timeDiff};
      }
    }

    var collision = this.map.checkCollisions(zombie.position, newPosition);
    if (collision) {
      if (collision.x) {
        zombie.xSpeed = 0;
      }
      if (collision.y) {
        zombie.ySpeed = 0;
      }
      newPosition = {x:zombie.position.x + zombie.xSpeed * timeDiff, y:zombie.position.y + zombie.ySpeed * timeDiff};
      if (collision.x) {
        newPosition.x = collision.validX;
      }
      if (collision.y) {
        newPosition.y = collision.validY;
      }
    }

    zombie.position = newPosition;
    zombie.zIndex = zombie.position.y;
    zombie.scale.x = zombie.xSpeed > 0 ? zombie.scaling : -zombie.scaling;

  },

  spaceNeeded : 3,

  isSpaceToMove(zombie, x, y) {
    var neighbours = this.partitionGetNeighbours(zombie);
    for (var i=0; i < neighbours.length; i++) {
      if (neighbours[i].health >= zombie.health && neighbours[i].zombieId != zombie.zombieId && Math.abs(neighbours[i].x - x) < this.spaceNeeded) {
        if (Math.abs(neighbours[i].y - y) < this.spaceNeeded && Math.abs(neighbours[i].x - x) < this.spaceNeeded) {
          return this.fastDistance(x, y, neighbours[i].x, neighbours[i].y) > this.fastDistance(zombie.x, zombie.y, neighbours[i].x, neighbours[i].y);
        }
      }
    }
    return true;
  }
};