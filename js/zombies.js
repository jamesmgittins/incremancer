Zombies = {
  map : Map,
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
    lookingForTarget:"lookingForTarget",
    movingToTarget:"movingToTarget",
    attackingTarget:"attackingTarget"
  },

  populate() {
    this.graveyard = Graveyard;
    GameModel.zombieCount = 0;
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
    }

    if (this.zombies.length > 0) {
      for (var i=0; i < this.zombies.length; i++) {
        characterContainer.removeChild(this.zombies[i]);
        this.zombies[i].stop();
      }
      this.discardedZombies = this.zombies.slice();
      this.zombies.length = 0;
    }
    if (!this.zombieCursor) {
      this.zombieCursor = new PIXI.Sprite(PIXI.Texture.from('zombie1_1.png'));
      this.zombieCursor.alpha = 0.6;
      this.zombieCursor.scale.x = this.zombieCursor.scale.y = this.zombieCursorScale;
      this.zombieCursor.anchor = {x:35/80, y:1};
      uiContainer.addChild(this.zombieCursor);
    }
  },

  createZombie(x,y) {
    var textureId = Math.floor(Math.random() * this.textures.length);
    var zombie;
    if (this.discardedZombies.length > 0) {
      zombie = this.discardedZombies.pop();
      zombie.textures = this.textures[textureId].animated;
    } else {
      zombie = new PIXI.AnimatedSprite(this.textures[textureId].animated);
    }
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
    zombie.zIndex = zombie.position.y;
    zombie.leftTurner = Math.random() > 0.5;
    zombie.visible = true;
    zombie.health = zombie.super ? GameModel.zombieHealth * 10 : GameModel.zombieHealth;
    zombie.state = this.states.lookingForTarget;
    zombie.scaling = zombie.super ? 1.5 * this.scaling : this.scaling;
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
    if (GameModel.energy < GameModel.zombieCost)
      return;

    GameModel.energy -= GameModel.zombieCost;
    this.createZombie(x,y);
  },

  damageZombie(zombie, damage) {
    if (this.graveyard.isWithinFence(zombie)) {
      damage *= 0.5;
      Exclamations.newShield(zombie);
    }
    zombie.health -= damage;
    zombie.speedMultiplier = Math.max(Math.min(1, zombie.health / GameModel.zombieHealth), 0.4);
    Blood.newSplatter(zombie.x, zombie.y);
    if (zombie.health <= 0 && !zombie.dead) {
      Bones.newBones(zombie.x, zombie.y);
      zombie.dead = true;
      if (Math.random() < GameModel.infectedBlastChance) {
        this.causePlagueExplosion(zombie);
      }
      zombie.textures = this.textures[zombie.textureId].dead;
      if (Math.random() < GameModel.brainRecoverChance) {
        GameModel.addBrains(1);
      }
    }
  },

  causePlagueExplosion(zombie) {
    var explosionRadius = 50;
    Blood.newPlagueSplatter(zombie.x, zombie.y);
    Blasts.newBlast(zombie.x, zombie.y - 4);
    zombie.visible = false;
    for (var i = 0; i < this.aliveHumans.length; i++) {
      if (Math.abs(this.aliveHumans[i].x - zombie.x) < explosionRadius) {
        if (Math.abs(this.aliveHumans[i].y - zombie.y) < explosionRadius) {
          if (this.fastDistance(zombie.x, zombie.y, this.aliveHumans[i].x, this.aliveHumans[i].y) < explosionRadius) {
            this.inflictPlague(this.aliveHumans[i]);
            Humans.damageHuman(this.aliveHumans[i], zombie.super ? GameModel.zombieDamage * 10 : GameModel.zombieDamage);
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
    this.maxSpeed = GameModel.zombieSpeed;
    var aliveZombies = [];
    var zombiePartition = [];
    this.aliveHumans = Humans.aliveHumans;
    for (var i=0; i < this.zombies.length; i++) {
      if (this.zombies[i].visible) {
        this.updateZombie(this.zombies[i], timeDiff);
        if (!this.zombies[i].dead) {
          aliveZombies.push(this.zombies[i]);
          this.partitionInsert(zombiePartition, this.zombies[i]);
        }
      }
    }
    GameModel.zombieCount = aliveZombies.length;
    this.aliveZombies = aliveZombies;
    this.zombiePartition = zombiePartition;
    if (GameModel.energy >= GameModel.zombieCost && GameModel.currentState == GameModel.states.playingLevel) {
      this.zombieCursor.visible = true;
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
      this.causePlagueExplosion(zombie);
      if (Math.random() < GameModel.brainRecoverChance) {
        GameModel.addBrains(1);
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
      }
      return;
    }
    
    zombie.attackTimer -= timeDiff;
    zombie.scanTime -= timeDiff;

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
        if (distanceToHumanTarget > this.attackDistance * 3 && zombie.scanTime < 0) {
          this.searchClosestTarget(zombie);
        }
        this.updateZombieSpeed(zombie, timeDiff);
        break;

      case this.states.attackingTarget:
        if (this.fastDistance(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y) < this.attackDistance) {
          zombie.scale.x = zombie.target.x > zombie.x ? zombie.scaling : -zombie.scaling;
          if (zombie.attackTimer < 0) {
            Humans.damageHuman(zombie.target, zombie.super ? GameModel.zombieDamage * 10 : GameModel.zombieDamage);
            if (Math.random() < GameModel.infectedBiteChance) {
              this.inflictPlague(zombie.target);
            }
            zombie.attackTimer = this.attackSpeed;
          }
        } else {
          zombie.state = this.states.movingToTarget;
        }
        break;
    }
  },

  inflictPlague(human) {
    if (!human.infected) {
      Exclamations.newPoison(human);
      human.plagueDamage = GameModel.zombieDamage / 2;
      human.plagueTicks = 5;
    } else {
      human.plagueDamage += GameModel.zombieDamage / 2;
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
    var distanceToTarget = 10000;
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

  updateZombieSpeed(zombie, timeDiff) {

    if (!zombie.targetTimer || !zombie.targetVector) {
      zombie.targetTimer = 0;
    }
    zombie.targetTimer-=timeDiff;
    if (zombie.targetTimer <= 0) {
      zombie.targetVector = this.map.howDoIGetToMyTarget(zombie, zombie.target);
      zombie.targetTimer = 0.2;
    }
    
    if (GameModel.gameSpeed > 1) {
      var ax = Math.abs(zombie.targetVector.x);
      var ay = Math.abs(zombie.targetVector.y);
      if (Math.max(ax, ay) == 0)
        return;
      var ratio = 1 / Math.max(ax, ay);
      ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289);
      var zombieMaxSpeed = Math.max(this.maxSpeed * zombie.speedMultiplier, 8);
      zombie.xSpeed = zombie.targetVector.x * ratio * zombieMaxSpeed;
      zombie.ySpeed = zombie.targetVector.y * ratio * zombieMaxSpeed;
    } else {
      var factor = this.maxSpeed * 5 / (this.magnitude(zombie.targetVector.x, zombie.targetVector.y) || 1);

      zombie.xSpeed += zombie.targetVector.x * factor * timeDiff;
      zombie.ySpeed += zombie.targetVector.y * factor * timeDiff;
    
      var speedMagnitude = this.magnitude(zombie.xSpeed, zombie.ySpeed);
      var zombieMaxSpeed = Math.max(this.maxSpeed * zombie.speedMultiplier, 8);
      if (speedMagnitude > zombieMaxSpeed) {
        zombie.xSpeed *= zombieMaxSpeed / speedMagnitude;
        zombie.ySpeed *= zombieMaxSpeed / speedMagnitude;
      }
    }

    var newPosition = {x:zombie.position.x + zombie.xSpeed * timeDiff, y:zombie.position.y + zombie.ySpeed * timeDiff};

    if (!this.isSpaceToMove(zombie, newPosition.x, newPosition.y)) {
      if (Math.random() > 0.5) {
        // newPosition = {x:zombie.position.x + (-zombie.ySpeed/2 + zombie.xSpeed/2) * timeDiff, y:zombie.position.y + (zombie.xSpeed/2 + zombie.ySpeed/2) * timeDiff}; // 45 degrees
        newPosition = {x:zombie.position.x + -zombie.ySpeed * timeDiff, y:zombie.position.y + zombie.xSpeed * timeDiff}; // 90 degrees
      } else {
        // newPosition = {x:zombie.position.x + (zombie.ySpeed/2 + zombie.xSpeed/2) * timeDiff, y:zombie.position.y + (-zombie.xSpeed/2 + zombie.ySpeed/2) * timeDiff}; // 45 degrees
        newPosition = {x:zombie.position.x + zombie.ySpeed * timeDiff, y:zombie.position.y + -zombie.xSpeed * timeDiff}; // 90 degrees
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