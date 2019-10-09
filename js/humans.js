Humans = {

  map : Map,
  maxWalkSpeed : 15,
  maxRunSpeed : 35,
  baseHealth: 100,
  minSecondsTostand : 1,
  maxSecondsToStand : 60, // 60
  chanceToStayInCurrentBuilding : 0.95, // 0.95
  textures : [],
  humans : [],
  aliveHumans : [],
  humansPerLevel : 50, // 50
  maxHumans : 1000,
  scaling: 2,
  visionDistance : 60,
  fleeChancePerZombie : 0.1,
  fleeTime : 10,
  scanTime : 3,
  attackDistance : 20,
  moveTargetDistance : 3,
  attackSpeed : 2,
  attackDamage : 5,
  fadeSpeed : 0.1,

  graveYardPosition : {},

  states : {
    standing:"standing",
    walking:"walking",
    attacking:"attacking",
    fleeing:"fleeing"
  },

  randomSecondsToStand() {
    return this.minSecondsTostand + Math.random() * (this.maxSecondsToStand - this.minSecondsTostand);
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
    if (Math.random() > this.chanceToStayInCurrentBuilding || human.timeFleeing > 0) {
      human.currentPoi = this.map.getRandomBuilding();
    }
    human.target = this.map.randomPositionInBuilding(human.currentPoi);
    human.maxSpeed = human.timeFleeing > 0 ? this.maxRunSpeed : this.maxWalkSpeed;
    human.xSpeed = 0;
    human.ySpeed = 0;
  },

  getMaxHumans() {
    return Math.min(this.humansPerLevel * GameModel.level, this.maxHumans) - (Police.getMaxPolice() + Army.getMaxArmy());
  },

  getTorchChance() {
    if (GameModel.level < 10)
      return 0;
    
    return Math.min(GameModel.level - 10, 10) * 0.05;
  },

  getBaseHealth() {
    return this.baseHealth + GameModel.level;
  },

  getAttackDamage() {
    this.attackDamage = Math.round(5 + (GameModel.level / 10));
  },

  populate() {
    
    this.map.populatePois();

    if (this.textures.length == 0) {
      for (var i=0; i < 6; i++) {
        var animated = [];
        for (var j=0; j < 3; j++) {
          animated.push(PIXI.Texture.from('human' + (i + 1) + '_' + (j + 1) + '.png'));
        }
        this.textures.push({
          animated : animated,
          dead : [PIXI.Texture.from('human' + (i + 1) + '_dead.png')]
        })
      }
    }

    if (this.humans.length > 0) {
      for (var i=0; i < this.humans.length; i++) {
        characterContainer.removeChild(this.humans[i]);
      }
      this.humans = [];
      this.aliveHumans = [];
    }

    this.getAttackDamage();
    var maxHumans = this.getMaxHumans();
  
    for (var i=0; i < maxHumans; i++) {
      var torchBearer = Math.random() < this.getTorchChance();
      var textureId = Math.floor(Math.random() * 3) + (torchBearer ? 3 : 0);
      var human = new PIXI.AnimatedSprite(this.textures[textureId].animated);
      human.torchBearer = torchBearer;
      human.deadTexture = this.textures[textureId].dead;
      human.animationSpeed = 0.15;
      human.anchor = {x:0.5,y:1};
      human.currentPoi = this.map.getRandomBuilding();
      human.position = this.map.randomPositionInBuilding(human.currentPoi);
      human.zIndex = human.position.y;
      human.xSpeed = 0;
      human.ySpeed = 0;
      human.visionDistance = this.visionDistance;
      human.visible = true;
      human.health = this.getBaseHealth();
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

    var vector = this.map.howDoIGetToMyTarget(human, human.target);
    // var xVector = human.target.x - human.x;
    // var yVector = human.target.y - human.y;
    var ax = Math.abs(vector.x);
    var ay = Math.abs(vector.y);
    if (Math.max(ax, ay) == 0)
      return;
    var ratio = 1 / Math.max(ax, ay);
    ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289);
    
    human.xSpeed = vector.x * ratio * human.maxSpeed;
    human.ySpeed = vector.y * ratio * human.maxSpeed;

    var newPosition = {x:human.position.x + human.xSpeed * timeDiff, y:human.position.y + human.ySpeed * timeDiff};

    var collision = this.map.checkCollisions(human.position, newPosition);
    if (collision) {
      if (collision.x) {
        human.xSpeed = 0;
        human.position.x = collision.validX;
      }
      if (collision.y) {
        human.ySpeed = 0;
        human.position.y = collision.validY;
      }
    }

    human.position.x += human.xSpeed * timeDiff;
    human.position.y += human.ySpeed * timeDiff;
    human.zIndex = human.position.y;
    if (Math.abs(human.xSpeed) > 0.5)
      human.scale.x = human.xSpeed > 0 ? this.scaling : -this.scaling;
  },

  drawTargets : false,

  update(timeDiff) {
    var aliveHumans = [];
    var aliveZombies = Zombies.aliveZombies;
    for (var i=0; i < this.humans.length; i++) {
      this.updateHuman(this.humans[i], timeDiff, aliveZombies);
      if (!this.humans[i].dead)
        aliveHumans.push(this.humans[i]);
    }
    this.aliveHumans = aliveHumans;
    Police.update(timeDiff, aliveZombies);
    Army.update(timeDiff, aliveZombies);

    if (this.drawTargets) {
      if (this.targetLine) {
        characterContainer.removeChild(this.targetLine);
      }
      this.targetLine = new PIXI.Graphics();
      characterContainer.addChild(this.targetLine);
      this.targetLine.lineStyle(2, 0xff0000);
      for (var i = 0; i < this.aliveHumans.length; i++) {
        if (this.aliveHumans[i].zombieTarget) {
          this.targetLine.lineStyle(2, 0xff0000);
          this.targetLine.moveTo(this.aliveHumans[i].x, this.aliveHumans[i].y);
          this.targetLine.lineTo(this.aliveHumans[i].zombieTarget.x, this.aliveHumans[i].zombieTarget.y);
        }
        if (this.aliveHumans[i].target) {
          this.targetLine.lineStyle(2, 0x0000ff);
          this.targetLine.moveTo(this.aliveHumans[i].x, this.aliveHumans[i].y);
          this.targetLine.lineTo(this.aliveHumans[i].target.x, this.aliveHumans[i].target.y);
        }
      }
    }

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


  inflictBurn(human, zombie) {
    if (human.torchBearer) {
      if (!zombie.burning) {
        Exclamations.newFire(zombie);
        zombie.burnDamage = this.attackDamage;
      } else {
        zombie.burnDamage++;
      }
      zombie.burning = true;
    }
  },

  updateHuman(human, timeDiff, aliveZombies) {
    
    if (human.dead)
      return this.updateDeadHumanFading(human, timeDiff);

    human.attackTimer -= timeDiff;
    human.timeToScan -= timeDiff;
    human.timeFleeing -= timeDiff;

    if ((!human.zombieTarget || human.zombieTarget.dead) && human.timeToScan < 0) {
      var count = Humans.scanForZombies(human, aliveZombies);

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
        if (fastDistance(human.position.x, human.position.y, human.target.x, human.target.y) < this.moveTargetDistance) {
          human.target = false;
          human.zombieTarget = false;
          this.changeState(human, this.states.standing);
        } else {
          Humans.updateHumanSpeed(human, timeDiff);
        }
        break;
      case this.states.attacking:
        human.scale.x = human.target.x > human.x ? this.scaling : -this.scaling;
        if (human.zombieTarget && !human.zombieTarget.dead) {
          var distanceToTarget = fastDistance(human.position.x, human.position.y, human.target.x, human.target.y);
          if (distanceToTarget < this.attackDistance) {
            if (human.attackTimer < 0) {
              Zombies.damageZombie(human.zombieTarget, this.attackDamage);
              this.inflictBurn(human, human.zombieTarget);
              human.attackTimer = this.attackSpeed;
            }
          } else {
            Humans.updateHumanSpeed(human, timeDiff);
          }
        } else {
          this.changeState(human, this.states.standing);
        }
        break;
    }
  },

  scanForZombies(human, aliveZombies) {
    human.timeToScan = this.scanTime;
    zombieSpottedCount = 0;
    for (var i = 0; i < aliveZombies.length; i++) {
      if (!aliveZombies[i].dead) {
        if (Math.abs(aliveZombies[i].x - human.x) < human.visionDistance) {
          if (Math.abs(aliveZombies[i].y - human.y) < human.visionDistance) {
            human.zombieTarget = aliveZombies[i];
            zombieSpottedCount++;
          }
        }
      }
    }
    return zombieSpottedCount;
  }
};

Police = {
  map:Map,
  maxWalkSpeed : 15,
  maxRunSpeed : 40,
  baseHealth : 200,
  police : [],
  walkTexture : [],
  deadTexture :[],
  policePerLevel : 1,
  attackSpeed : 2,
  attackDamage : 16,
  attackDistance : 20,
  moveTargetDistance : 5,
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
    var maxPolice = Math.min(Math.round(this.policePerLevel * GameModel.level), 100);

    if (GameModel.level < 3)
      return 0;

    return maxPolice;
  },

  getBaseHealth() {
    return this.baseHealth + (2 * GameModel.level);
  },

  getAttackDamage() {
    this.attackDamage = Math.round(16 + (GameModel.level / 10));
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
    this.getAttackDamage();

    for (var i=0; i < maxPolice; i++) {
      var police = new PIXI.AnimatedSprite(this.walkTexture);
      police.deadTexture = this.deadTexture;
      police.animationSpeed = 0.2;
      police.anchor = {x:0.5,y:1};
      police.currentPoi = this.map.getRandomBuilding();
      police.position = this.map.randomPositionInBuilding(police.currentPoi);
      police.zIndex = police.position.y;
      police.xSpeed = 0;
      police.ySpeed = 0;
      police.police = true;
      police.radioTime = 5;
      police.maxSpeed = this.maxWalkSpeed;
      police.visionDistance = this.visionDistance;
      police.visible = true;
      police.health = this.getBaseHealth();
      police.timeToScan = Math.random() * Humans.scanTime;
      police.timeStanding = Math.random() * Humans.randomSecondsToStand();
      police.state = this.states.standing;
      police.attackTimer = this.attackSpeed;
      police.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.police.push(police);
      characterContainer.addChild(police);
    }
  },

  update(timeDiff, aliveZombies) {
    for (var i=0; i < this.police.length; i++) {
      this.updatePolice(this.police[i], timeDiff, aliveZombies);
      if (!this.police[i].dead)
        Humans.aliveHumans.push(this.police[i]);
    }
  },

  decideStateOnZombieDistance(police) {
    if (police.zombieTarget && !police.zombieTarget.dead) {
      police.target = police.zombieTarget;
      var distanceToTarget = fastDistance(police.position.x, police.position.y, police.zombieTarget.x, police.zombieTarget.y);

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
        var distance = fastDistance(police.x, police.y, this.police[i].x, this.police[i].y);
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

  updatePolice(police, timeDiff, aliveZombies) {
    
    if (police.dead)
      return Humans.updateDeadHumanFading(police, timeDiff);

    police.attackTimer -= timeDiff;
    police.timeToScan -= timeDiff;
    police.radioTime -= timeDiff;

    if ((!police.zombieTarget || police.zombieTarget.dead) && police.timeToScan < 0) {
      Humans.scanForZombies(police, aliveZombies);
      if (police.zombieTarget && !police.zombieTarget.dead) {
        if (police.radioTime < 0)
          this.radioForBackup(police);
      }
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

        if (fastDistance(police.position.x, police.position.y, police.target.x, police.target.y) < this.moveTargetDistance) {
          police.target = false;
          police.zombieTarget = false;
          police.timeStanding = Humans.randomSecondsToStand();
          this.changeState(police, this.states.standing);
        } else {
          Humans.updateHumanSpeed(police, timeDiff);
        }

        break;
      case this.states.running:

        if (police.zombieTarget && !police.zombieTarget.dead) {
          if (police.target) {
            Humans.updateHumanSpeed(police, timeDiff);
          }
        } else {
          this.changeState(police, this.states.standing);
        }
        break;
      case this.states.attacking:
        if (police.zombieTarget && !police.zombieTarget.dead) {
          police.scale.x = police.zombieTarget.x > police.x ? this.scaling : -this.scaling;
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
          police.scale.x = police.zombieTarget.x > police.x ? this.scaling : -this.scaling;
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
  map:Map,
  maxWalkSpeed : 20,
  maxRunSpeed : 50,
  baseHealth : 300,
  armymen : [],
  walkTexture : [],
  deadTexture :[],
  armyPerLevel : 0.5,
  attackSpeed : 2,
  attackDamage : 20,
  attackDistance : 25,
  moveTargetDistance : 5,
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
    var maxArmy = Math.min(Math.round(this.armyPerLevel * GameModel.level), 100);

    if (GameModel.level < 8)
      return 0;

    return maxArmy;
  },

  getBaseHealth() {
    return this.baseHealth + (GameModel.level * 2);
  },

  getAttackDamage() {
    this.attackDamage = Math.round(20 + GameModel.level / 10);
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
    this.getAttackDamage();
  
    for (var i=0; i < maxArmy; i++) {
      var armyman = new PIXI.AnimatedSprite(this.walkTexture);
      armyman.deadTexture = this.deadTexture;
      armyman.animationSpeed = 0.2;
      armyman.anchor = {x:0.5,y:1};
      armyman.currentPoi = this.map.getRandomBuilding();
      armyman.position = this.map.randomPositionInBuilding(armyman.currentPoi);
      armyman.zIndex = armyman.position.y;
      armyman.xSpeed = 0;
      armyman.ySpeed = 0;
      armyman.army = true;
      armyman.maxSpeed = this.maxWalkSpeed;
      armyman.visionDistance = this.visionDistance;
      armyman.visible = true;
      armyman.health = this.getBaseHealth();
      armyman.timeToScan = Math.random() * Humans.scanTime;
      armyman.timeStanding = Math.random() * Humans.randomSecondsToStand();
      armyman.state = this.states.standing;
      armyman.attackTimer = this.attackSpeed;
      armyman.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.armymen.push(armyman);
      characterContainer.addChild(armyman);
    }
  },

  update(timeDiff, aliveZombies) {
    for (var i=0; i < this.armymen.length; i++) {
      this.updateArmy(this.armymen[i], timeDiff, aliveZombies);
      if (!this.armymen[i].dead)
        Humans.aliveHumans.push(this.armymen[i]);
    }
  },

  decideStateOnZombieDistance(armyman) {
    if (armyman.zombieTarget && !armyman.zombieTarget.dead) {
      armyman.target = armyman.zombieTarget;
      var distanceToTarget = fastDistance(armyman.position.x, armyman.position.y, armyman.zombieTarget.x, armyman.zombieTarget.y);

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

  updateArmy(armyman, timeDiff, aliveZombies) {
    
    if (armyman.dead)
      return Humans.updateDeadHumanFading(armyman, timeDiff);

    armyman.attackTimer -= timeDiff;
    armyman.timeToScan -= timeDiff;

    if ((!armyman.zombieTarget || armyman.zombieTarget.dead) && armyman.timeToScan < 0) {
      Humans.scanForZombies(armyman, aliveZombies);
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

        if (fastDistance(armyman.position.x, armyman.position.y, armyman.target.x, armyman.target.y) < this.moveTargetDistance) {
          armyman.target = false;
          armyman.zombieTarget = false;
          armyman.timeStanding = Humans.randomSecondsToStand();
          this.changeState(armyman, this.states.standing);
        } else {
          Humans.updateHumanSpeed(armyman, timeDiff);
        }

        break;
      case this.states.running:
        if (armyman.zombieTarget && !armyman.zombieTarget.dead) {
          Humans.updateHumanSpeed(armyman, timeDiff);
        } else {
          this.changeState(armyman, this.states.standing);
        }
        break;
      case this.states.attacking:
        if (armyman.zombieTarget && !armyman.zombieTarget.dead) {
          armyman.scale.x = armyman.zombieTarget.x > armyman.x ? this.scaling : -this.scaling;
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
          armyman.scale.x = armyman.zombieTarget.x > armyman.x ? this.scaling : -this.scaling;
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