Zombies = {
  
  zombies : [],
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
    GameModel.zombieCount++;
    var zombie = new PIXI.AnimatedSprite(this.zombieFrames);
    zombie.dead = false;
    zombie.animationSpeed = 0.2;
    zombie.anchor = {x:0.5,y:1};
    zombie.position = {x:x,y:y};
    zombie.zIndex = zombie.position.y;
    zombie.visible = true;
    zombie.health = GameModel.zombieHealth;
    zombie.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
    zombie.attackTimer = this.attackSpeed;
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
      zombie.dead = true;
      GameModel.zombieCount--;
      zombie.textures = this.zombieDeadTexture;
      if (Math.random() < GameModel.brainRecoverChance) {
        GameModel.addBrains(1);
      }
    }
  },

  update(timeDiff) {
    for (var i=0; i < this.zombies.length; i++) {
      this.updateZombie(this.zombies[i],timeDiff);
    }
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
      
      if (distanceBetweenPoints(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y) > this.attackDistance)
        this.searchClosestTarget(zombie);
     
      if (distanceBetweenPoints(zombie.position.x, zombie.position.y, zombie.target.x, zombie.target.y) < this.attackDistance) {
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
          var distanceToHuman = distanceBetweenPoints(zombie.x, zombie.y, Humans.aliveHumans[i].x, Humans.aliveHumans[i].y);
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
    if (this.isSpaceToMove(zombie, newPosition.x, newPosition.y) || Math.random() > 0.9) {
      zombie.position = newPosition;
      zombie.zIndex = zombie.position.y;
    }
    zombie.scale = {x:zombie.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
  },

  spaceNeeded : 3,

  isSpaceToMove(zombie, x, y) {
    for (var i=0; i < Zombies.zombies.length; i++) {
      if (Zombies.zombies[i].zombieId != zombie.zombieId && Math.abs(Zombies.zombies[i].x - x) < this.spaceNeeded) {
        if (Math.abs(Zombies.zombies[i].y - y) < this.spaceNeeded) {
          if (distanceBetweenPoints(x, y, Zombies.zombies[i].x, Zombies.zombies[i].y) < distanceBetweenPoints(zombie.x, zombie.y, Zombies.zombies[i].x, Zombies.zombies[i].y))
            return false;
        }
      }
    }
    return true;
  }
};