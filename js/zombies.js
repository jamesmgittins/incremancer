Zombies = {
  map : Map,
  zombies : [],
  aliveZombies : [],
  zombiePartition : [],
  scaling : 2,
  moveTargetDistance: 15,
  attackDistance : 15,
  attackSpeed : 3,
  targetDistance : 100,
  fadeSpeed : 0.1,
  currId : 1,
  scanTime : 2,
  textures : [],
  maxSpeed : 10,
  zombieCursor : false,
  zombieCursorScale : 3,
  burnTickTimer : 5,
  fastDistance:fastDistance,

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
      }
      this.zombies = [];
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
    var zombie = new PIXI.AnimatedSprite(this.textures[textureId].animated);
    zombie.textureId = textureId;
    zombie.dead = false;
    zombie.animationSpeed = 0.15;
    zombie.anchor = {x:35/80,y:1};
    zombie.position = {x:x,y:y};
    zombie.zIndex = zombie.position.y;
    zombie.visible = true;
    zombie.health = GameModel.zombieHealth;
    zombie.state = this.states.lookingForTarget;
    zombie.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
    zombie.attackTimer = 0;
    zombie.xSpeed = 0;
    zombie.ySpeed = 0;
    zombie.scanTime = 0;
    zombie.burnTickTimer = this.burnTickTimer;
    zombie.play();
    zombie.zombieId = this.currId++;
    this.zombies.push(zombie);
    characterContainer.addChild(zombie);
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
    Blood.newSplatter(zombie.x, zombie.y);
    if (zombie.health <= 0 && !zombie.dead) {
      Bones.newBones(zombie.x, zombie.y);
      zombie.dead = true;
      zombie.textures = this.textures[zombie.textureId].dead;
      if (Math.random() < GameModel.brainRecoverChance) {
        GameModel.addBrains(1);
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
    var aliveHumans = Humans.aliveHumans;
    for (var i=0; i < this.zombies.length; i++) {
      this.updateZombie(this.zombies[i], timeDiff, aliveHumans);
      if (!this.zombies[i].dead) {
        aliveZombies.push(this.zombies[i]);
        this.partitionInsert(zombiePartition, this.zombies[i]);
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

  updateZombie(zombie, timeDiff, aliveHumans) {

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
    
    this.updateBurns(zombie, timeDiff);

    if (!zombie.target || zombie.target.dead) {
      zombie.state = this.states.lookingForTarget;
    }

    switch(zombie.state) {

      case this.states.lookingForTarget:

        this.searchClosestTarget(zombie, aliveHumans);
        if (!zombie.target || zombie.target.dead)
          this.assignRandomTarget(zombie, aliveHumans);
        if (zombie.target) {
          zombie.state = this.states.movingToTarget;
          zombie.scanTime = this.scanTime;
        }
        break;

      case this.states.movingToTarget:

        var distanceToHumanTarget = this.fastDistance(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y);

        if (distanceToHumanTarget < this.attackDistance) {
          zombie.state = this.states.attackingTarget;
          break;
        }
        if (distanceToHumanTarget > this.attackDistance * 3 && zombie.scanTime < 0) {
          this.searchClosestTarget(zombie, aliveHumans);
        }
        this.updateZombieSpeed(zombie, timeDiff);
        break;

      case this.states.attackingTarget:
        if (this.fastDistance(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y) < this.attackDistance) {
          zombie.scale.x = zombie.target.x > zombie.x ? this.scaling : -this.scaling;
          if (zombie.attackTimer < 0) {
            Humans.damageHuman(zombie.target, GameModel.zombieDamage);
            zombie.attackTimer = this.attackSpeed;
          }
        } else {
          zombie.state = this.states.movingToTarget;
        }
        break;
    }
  },

  updateBurns(zombie, timeDiff) {
    zombie.burnTickTimer -= timeDiff;

    if (zombie.burning && zombie.burnTickTimer < 0) {
      this.damageZombie(zombie, zombie.burnDamage);
      zombie.burnTickTimer = this.burnTickTimer;
      Exclamations.newFire(zombie);
    }
  },

  searchClosestTarget(zombie, aliveHumans) {
    if (zombie.scanTime > 0)
      return;

    zombie.scanTime = this.scanTime;
    var distanceToTarget = 10000;
    for (var i = 0; i < aliveHumans.length; i++) {
      if (Math.abs(aliveHumans[i].x - zombie.x) < this.targetDistance) {
        if (Math.abs(aliveHumans[i].y - zombie.y) < this.targetDistance) {
          var distanceToHuman = this.fastDistance(zombie.x, zombie.y, aliveHumans[i].x, aliveHumans[i].y);
          if (distanceToHuman < distanceToTarget) {
            zombie.target = aliveHumans[i];
            distanceToTarget = distanceToHuman;
          }
        }
      }
    }
  },

  assignRandomTarget(zombie, aliveHumans) {
    var building = this.map.findBuilding(zombie);
    if (building && this.map.isInsidePoi(zombie.x, zombie.y, building, 0)) {
      for (var i = 0; i < aliveHumans.length; i++) {
        if (this.map.isInsidePoi(aliveHumans[i].x, aliveHumans[i].y, building, 0)) {
          zombie.target = aliveHumans[i];
          return;
        }
      }
    }
    zombie.target = getRandomElementFromArray(aliveHumans, Math.random());
  },

  updateZombieSpeed(zombie, timeDiff) {

    var vector = this.map.howDoIGetToMyTarget(zombie, zombie.target);

    var factor = this.maxSpeed * 2 / (magnitude(vector.x, vector.y) || 1);

    zombie.xSpeed += vector.x * factor * timeDiff;
    zombie.ySpeed += vector.y * factor * timeDiff;
  
    if (magnitude(zombie.xSpeed, zombie.ySpeed) > this.maxSpeed) {
      zombie.xSpeed -= zombie.xSpeed * timeDiff * 8;
      zombie.ySpeed -= zombie.ySpeed * timeDiff * 8;
    }

    var newPosition = {x:zombie.position.x + zombie.xSpeed * timeDiff, y:zombie.position.y + zombie.ySpeed * timeDiff};

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

    if (Math.random() > 0.6 || this.isSpaceToMove(zombie, newPosition.x, newPosition.y)) {
      zombie.position = newPosition;
      zombie.zIndex = zombie.position.y;
    }
    zombie.scale.x = zombie.xSpeed > 0 ? this.scaling : -this.scaling;
    
  },

  spaceNeeded : 3,

  isSpaceToMove(zombie, x, y) {
    var neighbours = this.partitionGetNeighbours(zombie);
    for (var i=0; i < neighbours.length; i++) {
      if (neighbours[i].zombieId != zombie.zombieId && Math.abs(neighbours[i].x - x) < this.spaceNeeded) {
        if (Math.abs(neighbours[i].y - y) < this.spaceNeeded && Math.abs(neighbours[i].x - x) < this.spaceNeeded) {
          return this.fastDistance(x, y, neighbours[i].x, neighbours[i].y) > this.fastDistance(zombie.x, zombie.y, neighbours[i].x, neighbours[i].y);
        }
      }
    }
    return true;
  }
};