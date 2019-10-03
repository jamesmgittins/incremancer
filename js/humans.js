Humans = {

  maxWalkSpeed : 15,
  maxRunSpeed : 35,
  baseHealth: 100,
  minSecondsTostand : 10,
  maxSecondsToStand : 200,
  whiteguyFrames : [],
  deadWhiteguy : [],
  blackguyFrames : [],
  deadBlackguy : [],
  humans : [],
  aliveHumans : [],
  humansPerLevel : 50,
  maxHumans : 1000,
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

  states : {
    standing:"standing",
    walking:"walking",
    attacking:"attacking",
    fleeing:"fleeing"
  },

  randomSecondsToStand() {
    return this.minSecondsTostand + Math.random() * (this.maxSecondsToStand - this.minSecondsTostand);
  },

  isValidPosition(position) {

    if (distanceBetweenPoints(position.x, position.y, gameFieldSize.x / 2, gameFieldSize.y / 2) < gameFieldSize.x * 0.25)
      return false;

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
    human.timeToScan = 0;
    if (human.health <= 0) {
      Bones.newBones(human.x, human.y);
      human.dead = true;
      GameModel.addBrains(1);
      human.textures = human.deadTexture;
    }
  },

  assignRandomTarget(human) {

    var poi = getRandomElementFromArray(this.pointsOfInterest, Math.random());
    human.target = {x:poi.x + (Math.random() * poi.width), y: poi.y + (Math.random() * poi.height)};
    human.maxSpeed = human.timeFleeing > 0 ? this.maxRunSpeed : this.maxWalkSpeed;
    human.xSpeed = 0;
    human.ySpeed = 0;
  },

  getMaxHumans() {
    return Math.min(this.humansPerLevel * GameModel.level, this.maxHumans) - (Police.getMaxPolice() + Army.getMaxArmy());
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
      this.aliveHumans = [];
    }

    var maxHumans = this.getMaxHumans();
  
    for (var i=0; i < maxHumans; i++) {
      var isWhite = Math.random() > 0.5;
      var human = new PIXI.AnimatedSprite(isWhite ? this.whiteguyFrames : this.blackguyFrames);
      human.deadTexture = isWhite ? this.deadWhiteguy : this.deadBlackguy;
      human.animationSpeed = 0.2;
      human.anchor = {x:0.5,y:1};
      var poi = getRandomElementFromArray(this.pointsOfInterest, Math.random());
      human.position = {x:poi.x + (Math.random() * poi.width), y: poi.y + (Math.random() * poi.height)};
      human.zIndex = human.position.y;
      human.xSpeed = 0;
      human.ySpeed = 0;
      human.visionDistance = this.visionDistance;
      human.visible = true;
      human.health = this.baseHealth;
      human.timeToScan = Math.random() * this.scanTime;
      human.timeFleeing = 0;
      this.changeState(human, this.states.standing);
      human.timeStanding = Math.random() * this.randomSecondsToStand();
      human.attackTimer = this.attackSpeed;
      human.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.humans.push(human);
      characterContainer.addChild(human);
    }

    Police.populate();
    Army.populate();
  },

  updateHumanSpeed(human, timeDiff) {

    var accelX = human.target.x - human.position.x;
    var accelY = human.target.y - human.position.y;
    var factor = human.maxSpeed * 2 / (magnitude(accelX, accelY) || 1);
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
    var aliveHumans = [];
    for (var i=0; i < this.humans.length; i++) {
      this.updateHuman(this.humans[i], timeDiff);
      if (!this.humans[i].dead)
        aliveHumans.push(this.humans[i]);
    }
    this.aliveHumans = aliveHumans;
    Police.update(timeDiff);
    Army.update(timeDiff);

    GameModel.humanCount = this.aliveHumans.length;
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

  changeState(human, state) {
    switch(state) {
      case this.states.standing:
        human.gotoAndStop(0);
        human.maxSpeed = this.maxWalkSpeed;
        human.timeStanding = Humans.randomSecondsToStand();
        break;
      case this.states.walking:
        human.play();
        human.maxSpeed = this.maxWalkSpeed;
        break;
      case this.states.fleeing:
        human.play();
        human.timeFleeing = this.fleeTime;
        human.maxSpeed = this.maxRunSpeed;
        this.assignRandomTarget(human);
        Exclamations.newExclamation(human);
        break;
      case this.states.attacking:
        human.play();
        human.maxSpeed = this.maxRunSpeed;
        break;
    }
    human.state = state;
  },

  updateHuman(human, timeDiff) {
    
    if (human.dead)
      return this.updateDeadHumanFading(human, timeDiff);

    human.attackTimer -= timeDiff;
    human.timeToScan -= timeDiff;
    human.timeFleeing -= timeDiff;

    if ((!human.zombieTarget || human.zombieTarget.dead) && human.timeToScan < 0) {
      var count = Humans.scanForZombies(human);

      if (count > 0) {
        if (Math.random() < count * this.fleeChancePerZombie) {
          this.changeState(human, this.states.fleeing);
        } else {
          human.target = human.zombieTarget;
          this.changeState(human, this.states.attacking);
        }
      }
    }

    switch (human.state) {
      case this.states.standing:
        human.timeStanding -= timeDiff;
        if (human.timeStanding < 0) {
          this.assignRandomTarget(human);
          this.changeState(human, this.states.walking);
        }
        break;
      case this.states.walking:
      case this.states.fleeing:
        if (distanceBetweenPoints(human.position.x, human.position.y, human.target.x, human.target.y) < this.attackDistance) {
          human.target = false;
          human.zombieTarget = false;
          this.changeState(human, this.states.standing);
        } else {
          Humans.updateHumanSpeed(human, timeDiff);
          human.scale = {x:human.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
        }
        break;
      case this.states.attacking:
        if (distanceBetweenPoints(human.position.x, human.position.y, human.target.x, human.target.y) < this.attackDistance) {
          if (human.zombieTarget && !human.zombieTarget.dead) {
            if (human.attackTimer < 0) {
              Zombies.damageZombie(human.zombieTarget, this.attackDamage);
              human.attackTimer = this.attackSpeed;
            }
          } else {
            this.changeState(human, this.states.standing);
          }
        } else {
          Humans.updateHumanSpeed(human, timeDiff);
          human.scale = {x:human.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
        }
        break;
    }
  },

  scanForZombies(human) {
    human.timeToScan = this.scanTime;
    zombieSpottedCount = 0;
    for (var i = 0; i < Zombies.aliveZombies.length; i++) {
      if (!Zombies.aliveZombies[i].dead) {
        if (Math.abs(Zombies.aliveZombies[i].x - human.x) < human.visionDistance) {
          if (Math.abs(Zombies.aliveZombies[i].y - human.y) < human.visionDistance) {
            human.zombieTarget = Zombies.aliveZombies[i];
            zombieSpottedCount++;
          }
        }
      }
    }
    return zombieSpottedCount;
  }
};

Police = {
  maxWalkSpeed : 15,
  maxRunSpeed : 40,
  baseHealth : 200,
  police : [],
  walkTexture : [],
  deadTexture :[],
  policePerLevel : 0.6,
  attackSpeed : 2,
  attackDamage : 16,
  attackDistance : 20,
  shootDistance : 100,
  visionDistance : 150,
  scaling :2,
  radioTime : 30,

  states : {
    shooting : "shooting",
    attacking : "attacking",
    walking : "walking",
    running : "running",
    standing : "standing"
  },

  getMaxPolice() {
    var maxPolice = Math.round(this.policePerLevel * GameModel.level);

    if (GameModel.level < 3)
      return 0;

    return maxPolice;
  },

  populate() {
    if (this.walkTexture.length == 0) {
      for (var i=0; i < 3; i++) {
        this.walkTexture.push(PIXI.Texture.from('cop' + (i + 1) + '.png'))
      }
      this.deadTexture = [PIXI.Texture.from('cop4.png')];
    }

    if (this.police.length > 0) {
      for (var i=0; i < this.police.length; i++) {
        characterContainer.removeChild(this.police[i]);
      }
      this.police = [];
    }

    var maxPolice = this.getMaxPolice();

    for (var i=0; i < maxPolice; i++) {
      var police = new PIXI.AnimatedSprite(this.walkTexture);
      police.deadTexture = this.deadTexture;
      police.animationSpeed = 0.2;
      police.anchor = {x:0.5,y:1};
      var poi = getRandomElementFromArray(Humans.pointsOfInterest, Math.random());
      police.position = {x:poi.x + (Math.random() * poi.width), y: poi.y + (Math.random() * poi.height)};
      police.zIndex = police.position.y;
      police.xSpeed = 0;
      police.ySpeed = 0;
      police.radioTime = 5;
      police.maxSpeed = this.maxWalkSpeed;
      police.visionDistance = this.visionDistance;
      police.visible = true;
      police.health = this.baseHealth;
      police.timeToScan = Math.random() * Humans.scanTime;
      police.timeStanding = Math.random() * Humans.randomSecondsToStand();
      police.state = this.states.standing;
      police.attackTimer = this.attackSpeed;
      police.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.police.push(police);
      characterContainer.addChild(police);
    }
  },

  update(timeDiff) {
    for (var i=0; i < this.police.length; i++) {
      this.updatePolice(this.police[i], timeDiff);
      if (!this.police[i].dead)
        Humans.aliveHumans.push(this.police[i]);
    }
  },

  decideStateOnZombieDistance(police) {
    if (police.zombieTarget && !police.zombieTarget.dead) {
      police.target = police.zombieTarget;
      var distanceToTarget = distanceBetweenPoints(police.position.x, police.position.y, police.target.x, police.target.y);

      if (distanceToTarget > this.shootDistance) {
        this.changeState(police, this.states.running);
        return;
      }

      if (distanceToTarget < this.attackDistance) {
        this.changeState(police, this.states.attacking);
        return;
      }
      this.changeState(police, this.states.shooting);
    }
  },

  changeState(police, state) {
    switch(state) {
      case this.states.standing:
        police.gotoAndStop(0);
        break;
      case this.states.walking:
        police.play();
        police.maxSpeed = this.maxWalkSpeed;
        break;
      case this.states.running:
        police.play();
        police.maxSpeed = this.maxRunSpeed;
        break;
      case this.states.shooting:
        police.gotoAndStop(0);
        break;
      case this.states.attacking:
        police.play();
        break;
    }
    police.state = state;
  },

  radioForBackup(police) {
    
    var closestPolice = false;
    var closestDistance = 2000;

    for (var i=0; i < this.police.length; i++) {
      if (!this.police[i].dead && (!this.police[i].zombieTarget || this.police[i].zombieTarget.dead)) {
        var distance = distanceBetweenPoints(police.x, police.y, this.police[i].x, this.police[i].y);
        if (distance < closestDistance) {
          closestPolice = this.police[i];
          closestDistance = distance;
        }
      }
    }

    if (closestPolice) {
      closestPolice.zombieTarget = police.zombieTarget;
      Exclamations.newRadio(police);
      Exclamations.newRadio(closestPolice);
      police.radioTime = this.radioTime;
      closestPolice.radioTime = this.radioTime;
    }
  },

  updatePolice(police, timeDiff) {
    
    if (police.dead)
      return Humans.updateDeadHumanFading(police, timeDiff);

    police.attackTimer -= timeDiff;
    police.timeToScan -= timeDiff;
    police.radioTime -= timeDiff;

    if ((!police.zombieTarget || police.zombieTarget.dead) && police.timeToScan < 0) {
      Humans.scanForZombies(police);
      if (police.zombieTarget && !police.zombieTarget.dead && police.radioTime < 0)
        this.radioForBackup(police);
    }

    this.decideStateOnZombieDistance(police);

    switch (police.state) {

      case this.states.standing:
        police.timeStanding -= timeDiff;
        if (police.timeStanding < 0) {
          Humans.assignRandomTarget(police);
          this.changeState(police, this.states.walking);
        }

        break;
      case this.states.walking:

        if (distanceBetweenPoints(police.position.x, police.position.y, police.target.x, police.target.y) < this.attackDistance) {
          police.target = false;
          police.zombieTarget = false;
          police.timeStanding = Humans.randomSecondsToStand();
          this.changeState(police, this.states.standing);
        } else {
          Humans.updateHumanSpeed(police, timeDiff);
          police.scale = {x:police.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
        }

        break;
      case this.states.running:

        if (police.zombieTarget && !police.zombieTarget.dead) {
          Humans.updateHumanSpeed(police, timeDiff);
          police.scale = {x:police.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
        } else {
          this.changeState(police, this.states.standing);
        }
        break;
      case this.states.attacking:
        if (police.zombieTarget && !police.zombieTarget.dead) {
          if (police.attackTimer < 0) {
            Zombies.damageZombie(police.zombieTarget, this.attackDamage);
            police.attackTimer = this.attackSpeed;
          }
        } else {
          this.changeState(police, this.states.standing);
        }

        break;
      case this.states.shooting:
        if (police.zombieTarget && !police.zombieTarget.dead) {
          if (police.attackTimer < 0) {
            Bullets.newBullet(police.x, police.y, police.zombieTarget, this.attackDamage);
            police.attackTimer = this.attackSpeed;
          }
        } else {
          this.changeState(police, this.states.standing);
        }

        break;
    }
  }

}

Army = {
  maxWalkSpeed : 20,
  maxRunSpeed : 50,
  baseHealth : 300,
  armymen : [],
  walkTexture : [],
  deadTexture :[],
  armyPerLevel : 0.3,
  attackSpeed : 2,
  attackDamage : 20,
  attackDistance : 25,
  shootDistance : 120,
  visionDistance : 200,
  scaling :2,
  shotsPerBurst : 3,

  states : {
    shooting : "shooting",
    attacking : "attacking",
    walking : "walking",
    running : "running",
    standing : "standing"
  },

  getMaxArmy() {
    var maxArmy = Math.round(this.armyPerLevel * GameModel.level);

    if (GameModel.level < 8)
      return 0;

    return maxArmy;
  },


  populate() {
    if (this.walkTexture.length == 0) {
      for (var i=0; i < 3; i++) {
        this.walkTexture.push(PIXI.Texture.from('army' + (i + 1) + '.png'))
      }
      this.deadTexture = [PIXI.Texture.from('army4.png')];
    }

    if (this.armymen.length > 0) {
      for (var i=0; i < this.armymen.length; i++) {
        characterContainer.removeChild(this.armymen[i]);
      }
      this.armymen = [];
    }

    var maxArmy = this.getMaxArmy();
  
    for (var i=0; i < maxArmy; i++) {
      var armyman = new PIXI.AnimatedSprite(this.walkTexture);
      armyman.deadTexture = this.deadTexture;
      armyman.animationSpeed = 0.2;
      armyman.anchor = {x:0.5,y:1};
      var poi = getRandomElementFromArray(Humans.pointsOfInterest, Math.random());
      armyman.position = {x:poi.x + (Math.random() * poi.width), y: poi.y + (Math.random() * poi.height)};
      armyman.zIndex = armyman.position.y;
      armyman.xSpeed = 0;
      armyman.ySpeed = 0;
      armyman.maxSpeed = this.maxWalkSpeed;
      armyman.visionDistance = this.visionDistance;
      armyman.visible = true;
      armyman.health = this.baseHealth;
      armyman.timeToScan = Math.random() * Humans.scanTime;
      armyman.timeStanding = Math.random() * Humans.randomSecondsToStand();
      armyman.state = this.states.standing;
      armyman.attackTimer = this.attackSpeed;
      armyman.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.armymen.push(armyman);
      characterContainer.addChild(armyman);
    }
  },

  update(timeDiff) {
    for (var i=0; i < this.armymen.length; i++) {
      this.updateArmy(this.armymen[i], timeDiff);
      if (!this.armymen[i].dead)
        Humans.aliveHumans.push(this.armymen[i]);
    }
  },

  decideStateOnZombieDistance(armyman) {
    if (armyman.zombieTarget && !armyman.zombieTarget.dead) {
      armyman.target = armyman.zombieTarget;
      var distanceToTarget = distanceBetweenPoints(armyman.position.x, armyman.position.y, armyman.target.x, armyman.target.y);

      if (distanceToTarget > this.shootDistance) {
        this.changeState(armyman, this.states.running);
        return;
      }

      if (distanceToTarget < this.attackDistance) {
        this.changeState(armyman, this.states.attacking);
        return;
      }
      this.changeState(armyman, this.states.shooting);
    }
  },

  changeState(armyman, state) {
    switch(state) {
      case this.states.standing:
          armyman.gotoAndStop(0);
        break;
      case this.states.walking:
          armyman.play();
          armyman.maxSpeed = this.maxWalkSpeed;
        break;
      case this.states.running:
          armyman.play();
          armyman.maxSpeed = this.maxRunSpeed;
        break;
      case this.states.shooting:
          armyman.gotoAndStop(0);
        break;
      case this.states.attacking:
          armyman.play();
        break;
    }
    armyman.state = state;
  },

  updateArmy(armyman, timeDiff) {
    
    if (armyman.dead)
      return Humans.updateDeadHumanFading(armyman, timeDiff);

    armyman.attackTimer -= timeDiff;
    armyman.timeToScan -= timeDiff;

    if ((!armyman.zombieTarget || armyman.zombieTarget.dead) && armyman.timeToScan < 0) {
      Humans.scanForZombies(armyman);
    }

    this.decideStateOnZombieDistance(armyman);

    switch (armyman.state) {

      case this.states.standing:
        armyman.timeStanding -= timeDiff;
        if (armyman.timeStanding < 0) {
          Humans.assignRandomTarget(armyman);
          this.changeState(armyman, this.states.walking);
        }

        break;
      case this.states.walking:

        if (distanceBetweenPoints(armyman.position.x, armyman.position.y, armyman.target.x, armyman.target.y) < this.attackDistance) {
          armyman.target = false;
          armyman.zombieTarget = false;
          armyman.timeStanding = Humans.randomSecondsToStand();
          this.changeState(armyman, this.states.standing);
        } else {
          Humans.updateHumanSpeed(armyman, timeDiff);
          armyman.scale = {x:armyman.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
        }

        break;
      case this.states.running:

        if (armyman.zombieTarget && !armyman.zombieTarget.dead) {
          Humans.updateHumanSpeed(armyman, timeDiff);
          armyman.scale = {x:armyman.xSpeed > 0 ? this.scaling : -this.scaling, y:this.scaling};
        } else {
          this.changeState(armyman, this.states.standing);
        }
        break;
      case this.states.attacking:
        if (armyman.zombieTarget && !armyman.zombieTarget.dead) {
          if (armyman.attackTimer < 0) {
            Zombies.damageZombie(armyman.zombieTarget, this.attackDamage);
            armyman.attackTimer = this.attackSpeed;
          }
        } else {
          this.changeState(armyman, this.states.standing);
        }

        break;
      case this.states.shooting:
        if (armyman.zombieTarget && !armyman.zombieTarget.dead) {
          if (armyman.attackTimer < 0) {
            armyman.shotsLeft = this.shotsPerBurst;
            armyman.attackTimer = this.attackSpeed;
            armyman.shotTimer = 0;
          }
          if (armyman.shotsLeft > 0) {
            armyman.shotTimer -= timeDiff;
            if (armyman.shotTimer < 0) {
              armyman.shotTimer = 0.15;
              Bullets.newBullet(armyman.x, armyman.y, armyman.zombieTarget, this.attackDamage);
              armyman.shotsLeft--;
            }
          }
        } else {
          this.changeState(armyman, this.states.standing);
        }

        break;
    }
  }

}