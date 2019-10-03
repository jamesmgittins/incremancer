Humans = {

  maxWalkSpeed : 15,
  maxRunSpeed : 35,
  minSecondsTostand : 10,
  maxSecondsToStand : 200,
  whiteguyFrames : [],
  deadWhiteguy : [],
  blackguyFrames : [],
  deadBlackguy : [],
  humans : [],
  humansPerLevel : 50,
  scaling: 2,
  pointsOfInterest : [],
  maxPois : 7,
  visionDistance : 60,
  fleeChancePerZombie : 0.1,
  fleeTime : 10,
  scanTime : 3,
  attackDistance : 20,
  attackSpeed : 2,
  attackDamage : 5,
  fadeSpeed : 0.1,

  randomSecondsToStand() {
    return this.minSecondsTostand + Math.random() * (this.maxSecondsToStand - this.minSecondsTostand);
  },

  isValidPosition(position) {

    for (var i=0; i < this.pointsOfInterest.length; i++) {
      if (distanceBetweenPoints(position.x, position.y, this.pointsOfInterest[i].x, this.pointsOfInterest[i].y) < gameFieldSize.x * 0.2)
        return false;
    }

    return true;
  },

  populatePois() {
    this.pointsOfInterest = [];
    for (var i=0;i<this.maxPois;i++) {

      var popularity = i + 1;

      var foundPosition = false;
      var testPosition;

      while(!foundPosition) {
        testPosition = {x: (Math.random() * gameFieldSize.x * 0.8), y: (Math.random() * gameFieldSize.y * 0.8)};
        foundPosition = this.isValidPosition(testPosition);
      }

      var poi = {
        x: testPosition.x,
        y: testPosition.y,
        width : gameFieldSize.x * 0.03 * popularity,
        height : gameFieldSize.y * 0.03 * popularity
      };
      for (var j=0; j<popularity; j++) {
        this.pointsOfInterest.push(poi);
      }
    }
  },

  damageHuman(human, damage) {
    GameModel.addBlood(Math.round(damage / 3));
    human.health -= damage;
    Blood.newSplatter(human.x, human.y);
    if (human.health <= 0) {
      human.dead = true;
      GameModel.addBrains(1);
      GameModel.humanCount--;
      if (human.isWhite)
        human.textures = this.deadWhiteguy;
      else
        human.textures = this.deadBlackguy;
    }
  },

  assignRandomTarget(human) {

    var poi = getRandomElementFromArray(this.pointsOfInterest, Math.random());
    human.target = {x:poi.x + (Math.random() * poi.width), y: poi.y + (Math.random() * poi.height)};
    human.maxSpeed = human.timeFleeing > 0 ? this.maxRunSpeed : this.maxWalkSpeed;
    human.xSpeed = 0;
    human.ySpeed = 0;
  },

  populate() {
    
    this.populatePois();

    if (this.whiteguyFrames.length == 0) {
      for (var i=0; i < 3; i++) {
        this.whiteguyFrames.push(PIXI.Texture.from('whiteguy' + (i + 1) + '.png'))
        this.blackguyFrames.push(PIXI.Texture.from('blackguy' + (i + 1) + '.png'))
      }
      this.deadWhiteguy = [PIXI.Texture.from('whiteguy4.png')];
      this.deadBlackguy = [PIXI.Texture.from('blackguy4.png')];
    }

    if (this.humans.length > 0) {
      for (var i=0; i < this.humans.length; i++) {
        characterContainer.removeChild(this.humans[i]);
      }
      this.humans = [];
    }

    var maxHumans = this.humansPerLevel * GameModel.level;
  
    for (var i=0; i < maxHumans; i++) {
      var isWhite = Math.random() > 0.5;
      var human = new PIXI.AnimatedSprite(isWhite ? this.whiteguyFrames : this.blackguyFrames);
      human.isWhite = isWhite;
      human.animationSpeed = 0.2;
      human.anchor = {x:0.5,y:1};
      var poi = getRandomElementFromArray(this.pointsOfInterest, Math.random());
      human.position = {x:poi.x + (Math.random() * poi.width), y: poi.y + (Math.random() * poi.height)};
      human.zIndex = human.position.y;
      human.xSpeed = 0;
      human.ySpeed = 0;
      human.visible = true;
      human.health = 100;
      human.timeToScan = Math.random() * this.scanTime;
      human.timeFleeing = 0;
      human.timeStanding = Math.random() * this.randomSecondsToStand();
      human.attackTimer = this.attackSpeed;
      human.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.humans.push(human);
      characterContainer.addChild(human);
    }
    GameModel.humanCount += this.humans.length;
  },

  updateHumanSpeed(human, timeDiff) {

    var accelX = human.target.x - human.position.x;
    var accelY = human.target.y - human.position.y;
    var factor = human.maxSpeed / (magnitude(accelX, accelY) || 1);
    human.xSpeed += accelX * factor * timeDiff;
    human.ySpeed += accelY * factor * timeDiff;
  
    if (magnitude(human.xSpeed, human.ySpeed) > human.maxSpeed) {
      human.xSpeed -= human.xSpeed * timeDiff * 8;
      human.ySpeed -= human.ySpeed * timeDiff * 8;
    }
    human.position.x += human.xSpeed * timeDiff;
    human.position.y += human.ySpeed * timeDiff;
    human.zIndex = human.position.y;
  },

  update(timeDiff) {
    for (var i=0; i < this.humans.length; i++) {
      this.updateHuman(this.humans[i], timeDiff);
    }
  },

  updateDeadHumanFading(human, timeDiff) {
    if (!human.visible)
      return;
  
    if (human.alpha > 0.5 && human.alpha - this.fadeSpeed * timeDiff <= 0.5) {
      if (Math.random() < GameModel.riseFromTheDeadChance) {
        Zombies.createZombie(human.x, human.y);
        human.visible = false;
        return;
      }
    }
    human.alpha -= this.fadeSpeed * timeDiff;

    if (human.alpha < 0) {
      human.visible = false;
    }
    return;
  },

  updateHuman(human, timeDiff) {
    
    if (human.dead)
      return this.updateDeadHumanFading(human, timeDiff);

    if ((!human.zombieTarget || human.zombieTarget.dead) && human.timeToScan < 0) {
      var count = Humans.scanForZombies(human);

      if (count > 0) {
        if (Math.random() < count * this.fleeChancePerZombie) {
          human.timeFleeing = this.fleeTime;
          human.maxSpeed = this.maxRunSpeed;
          Exclamations.newExclamation(human);
        } else {
          human.target = human.zombieTarget;
        }
      }
    }

    human.attackTimer -= timeDiff;
    human.timeToScan -= timeDiff;

    if (human.target) {
      
      human.play();

      if (distanceBetweenPoints(human.position.x, human.position.y, human.target.x, human.target.y) < this.attackDistance) {

        if (human.zombieTarget && human.timeFleeing < 0 && !human.zombieTarget.dead) {
          if (human.attackTimer < 0) {
            Zombies.damageZombie(human.zombieTarget, this.attackDamage);
            human.attackTimer = this.attackSpeed;
          }
        } else {
          human.target = false;
          human.zombieTarget = false;
          human.timeFleeing = 0;
          human.timeStanding = this.randomSecondsToStand();
          human.gotoAndStop(0);
        }
      } else {
        Humans.updateHumanSpeed(human, timeDiff);
        human.scale = {x:human.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
      }
    } else {
      human.timeStanding -= timeDiff;
      human.timeFleeing -= timeDiff;
      if (human.timeFleeing < 0) {
        human.maxSpeed = this.maxWalkSpeed;
      }
      if (human.timeStanding < 0 || human.timeFleeing > 0) {
        this.assignRandomTarget(human);
      }
    }
  },

  scanForZombies(human) {
    human.timeToScan = this.scanTime;
    zombieSpottedCount = 0;
    for (var i = 0; i < Zombies.zombies.length; i++) {
      if (!Zombies.zombies[i].dead) {
        if (Math.abs(Zombies.zombies[i].x - human.x) < this.visionDistance) {
          if (Math.abs(Zombies.zombies[i].y - human.y) < this.visionDistance) {
            human.zombieTarget = Zombies.zombies[i];
            zombieSpottedCount++;
          }
        }
      }
    }
    return zombieSpottedCount;
  }
};