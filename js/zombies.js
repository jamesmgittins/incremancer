Zombies = {
  
  zombies : [],
  aliveZombies : [],
  zombieFrames : [],
  zombieDeadTexture : false,
  scaling : 2,
  attackDistance : 15,
  attackSpeed : 3,
  targetDistance : 100,
  fadeSpeed : 0.1,
  currId : 1,
  scanTime : 1,

  zombieCursor : false,

  populate() {
    GameModel.zombieCount = 0;
    if (this.zombieFrames.length == 0) {
      for (var i=0; i < 3; i++) {
        this.zombieFrames.push(PIXI.Texture.from('zombie' + (i + 1) + '.png'))
      }
      this.zombieDeadTexture = [PIXI.Texture.from('zombie4.png')];
    }

    if (this.zombies.length > 0) {
      for (var i=0; i < this.zombies.length; i++) {
        characterContainer.removeChild(this.zombies[i]);
      }
      this.zombies = [];
    }
    if (!this.zombieCursor) {
      this.zombieCursor = new PIXI.Sprite(PIXI.Texture.from('zombie1.png'));
      this.zombieCursor.alpha = 0.6;
      this.zombieCursor.scale.x = this.zombieCursor.scale.y = 3;
      this.zombieCursor.anchor = {x:0.5, y:1};
      uiContainer.addChild(this.zombieCursor);
    }
  },

  createZombie(x,y) {
    var zombie = new PIXI.AnimatedSprite(this.zombieFrames);
    zombie.dead = false;
    zombie.animationSpeed = 0.2;
    zombie.anchor = {x:0.5,y:1};
    zombie.position = {x:x,y:y};
    zombie.zIndex = zombie.position.y;
    zombie.visible = true;
    zombie.health = GameModel.zombieHealth;
    zombie.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
    zombie.attackTimer = 0;
    zombie.xSpeed = 0;
    zombie.ySpeed = 0;
    zombie.scanTime = 0;
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
    zombie.health -= damage;
    Blood.newSplatter(zombie.x, zombie.y);
    if (zombie.health <= 0 && !zombie.dead) {
      Bones.newBones(zombie.x, zombie.y);
      zombie.dead = true;
      zombie.textures = this.zombieDeadTexture;
      if (Math.random() < GameModel.brainRecoverChance) {
        GameModel.addBrains(1);
      }
    }
  },

  update(timeDiff) {
    var aliveZombies = [];
    for (var i=0; i < this.zombies.length; i++) {
      this.updateZombie(this.zombies[i],timeDiff);
      if (!this.zombies[i].dead)
        aliveZombies.push(this.zombies[i]);
    }
    GameModel.zombieCount = aliveZombies.length;
    this.aliveZombies = aliveZombies;
    if (GameModel.energy >= GameModel.zombieCost && GameModel.currentState == GameModel.states.playingLevel) {
      this.zombieCursor.visible = true;
    } else {
      this.zombieCursor.visible = false;
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

    if (zombie.target && !zombie.target.dead) {

      zombie.scanTime -= timeDiff;
      
      if (fastDistance(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y) > this.attackDistance)
        this.searchClosestTarget(zombie);
     
      if (fastDistance(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y) < this.attackDistance) {
        if (zombie.attackTimer < 0) {
          Humans.damageHuman(zombie.target, GameModel.zombieDamage);
          zombie.attackTimer = this.attackSpeed;
        }
      } else {
        this.updateZombieSpeed(zombie, timeDiff);
      }
    } else {
      this.searchClosestTarget(zombie);
      if (!zombie.target || zombie.target.dead)
        this.assignRandomTarget(zombie);
    }
  },

  searchClosestTarget(zombie) {
    if (zombie.scanTime > 0)
      return;

    zombie.scanTime = this.scanTime;
    var distanceToTarget = 10000;
    for (var i = 0; i < Humans.aliveHumans.length; i++) {
      if (Math.abs(Humans.aliveHumans[i].x - zombie.x) < this.targetDistance) {
        if (Math.abs(Humans.aliveHumans[i].y - zombie.y) < this.targetDistance) {
          var distanceToHuman = fastDistance(zombie.x, zombie.y, Humans.aliveHumans[i].x, Humans.aliveHumans[i].y);
          if (distanceToHuman < distanceToTarget) {
            zombie.target = Humans.aliveHumans[i];
            distanceToTarget = distanceToHuman;
          }
        }
      }
    }
  },

  assignRandomTarget(zombie) {
    zombie.target = getRandomElementFromArray(Humans.aliveHumans, Math.random());
  },

  updateZombieSpeed(zombie, timeDiff) {

    zombie.maxSpeed = GameModel.zombieSpeed;

    var accelX = zombie.target.x - zombie.position.x;
    var accelY = zombie.target.y - zombie.position.y;
    var factor = zombie.maxSpeed * 2 / (magnitude(accelX, accelY) || 1);

    zombie.xSpeed += accelX * factor * timeDiff;
    zombie.ySpeed += accelY * factor * timeDiff;
  
    if (magnitude(zombie.xSpeed, zombie.ySpeed) > zombie.maxSpeed) {
      zombie.xSpeed -= zombie.xSpeed * timeDiff * 8;
      zombie.ySpeed -= zombie.ySpeed * timeDiff * 8;
    }
    var newPosition = {x:zombie.position.x + zombie.xSpeed * timeDiff, y:zombie.position.y + zombie.ySpeed * timeDiff};
    if (Math.random() > 0.9 || this.isSpaceToMove(zombie, newPosition.x, newPosition.y)) {
      zombie.position = newPosition;
      zombie.zIndex = zombie.position.y;
    }
    zombie.scale = {x:zombie.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
  },

  spaceNeeded : 3,

  isSpaceToMove(zombie, x, y) {
    for (var i=0; i < Zombies.aliveZombies.length; i++) {
      if (Zombies.aliveZombies[i].zombieId != zombie.zombieId && Math.abs(Zombies.aliveZombies[i].x - x) < this.spaceNeeded) {
        if (Math.abs(Zombies.aliveZombies[i].y - y) < this.spaceNeeded && Math.abs(Zombies.aliveZombies[i].x - x) < this.spaceNeeded) {
          return false;
        }
      }
    }
    return true;
  }
};