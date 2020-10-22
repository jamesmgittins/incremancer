Humans = {

  map : ZmMap,
  maxWalkSpeed : 15,
  maxRunSpeed : 35,
  minSecondsTostand : 1,
  maxSecondsToStand : 60, // 60
  chanceToStayInCurrentBuilding : 0.95, // 0.95
  textures : [],
  doctorTextures :[],
  doctorDeadTexture : {},
  humans : [],
  discardedHumans : [],
  aliveHumans : [],
  graveyardAttackers : [],
  humansPerLevel : 50, // 50
  maxHumans : 1000, // 1000
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
  plagueTickTimer : 5,
  healTickTimer : 5,
  burnTickTimer : 5,
  smokeTimer : 0.3,
  fastDistance:fastDistance,
  frozen : false,

  graveYardPosition : {},

  states : {
    standing:1,
    walking:2,
    attacking:3,
    fleeing:4,
    escaping:5
  },

  randomSecondsToStand() {
    return this.minSecondsTostand + Math.random() * (this.maxSecondsToStand - this.minSecondsTostand);
  },

  damageHuman(human, damage) {
    GameModel.addBlood(Math.round(damage / 3));
    human.health -= damage;
    human.timeToScan = 0;
    if (!human.tank) {
      Blood.newSplatter(human.x, human.y);
      human.speedMod = Math.max(Math.min(1, human.health / human.maxHealth), 0.25);
    } else {
      Fragments.newPart(human.x, human.y - 18, 0x7B650E);
    }
    if (human.health <= 0 && !human.dead) {
      Bones.newBones(human.x, human.y);
      human.dead = true;
      GameModel.addBrains(1);
      Skeleton.addXp(GameModel.level);
      Skeleton.testForLoot();
      
      if (human.tank) {
        Blasts.newDroneBlast(human.x, human.y - 5);
        Fragments.newFragmentExplosion(human.x, human.y - 5, 0x7B650E);
        human.visible = false;
      } else {
        human.textures = human.deadTexture;
      }

      if (human.vip) {
        this.vipText.visible = false;
        Trophies.trophyAquired(GameModel.level);
      }
    }
    if (!Army.assaultStarted) {
      if (Math.random() > 0.9 && GameModel.isBossStage(GameModel.level)) {
        Army.assaultStarted = true;
        GameModel.sendMessage("The assault has begun!");
      }
    }
  },

  updateBurns(human, timeDiff) {
    human.burnTickTimer -= timeDiff;
    human.smokeTimer -= timeDiff;

    if (human.smokeTimer < 0) {
      Smoke.newFireSmoke(human.x, human.y - 14);
      human.smokeTimer = this.smokeTimer;
    }

    if (human.burnTickTimer < 0) {
      this.damageHuman(human, human.burnDamage);
      human.burnTickTimer = this.burnTickTimer;
      Exclamations.newFire(human);
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

  getMaxNpcs() {
    return Math.min(this.humansPerLevel * GameModel.level, this.maxHumans);
  },

  getMaxHumans() {
    if (GameModel.isBossStage(GameModel.level)) {
      return 0;
    }
    return this.getMaxNpcs() - (Police.police.length + Army.armymen.length);
  },

  getMaxDoctors() {
    var maxDoctors = Math.min(Math.round(0.7 * GameModel.level), 75);

    if (GameModel.level < 18)
      return 0;

    return maxDoctors;
  },

  getTorchChance() {
    if (GameModel.level < 10)
      return 0;
    
    return Math.min(GameModel.level - 10, 40) * 0.02;
  },

  getMaxHealth(level) {
    if (level < 7) {
      return (level + 4) * 10;
    }
    if (level < 12) {
      return (level -1) * 20;
    }
    if (level < 16) {
      return (level - 3) * 25;
    }
    if (level < 29) {
      return (level - 9) * 50;
    }
    if (level < 49) {
      return (level - 19) * 100;
    }
    if (level < 64) {
      return (level - 39) * 300;
    }
    if (level < 85) {
      return (level - 49) * 500;
    }
    if (level > 499) {
      return 8500000 * Math.pow(1.03, level - 499);
    }

    return 17800 * Math.pow(1.015, level - 84);
  },

  getAttackDamage() {
    if (GameModel.level == 1) {
      this.attackDamage = 2;
      return;
    }
    if (GameModel.level == 2) {
      this.attackDamage = 4;
      return;
    }
    if (GameModel.level == 3) {
      this.attackDamage = 5;
      return;
    }
    this.attackDamage = Math.round(this.getMaxHealth(GameModel.level) / 10);
  },

  setupVipText(human) {
    if (!this.vipText) {
      this.vipText = new PIXI.Text("VIP", {
        fontFamily: 'sans-serif',
        fontSize : 64,
        fill: "#FC0",
        stroke: "#000",
        strokeThickness: 5,
        align: 'center'
      });
      this.vipText.anchor = {x:0.5, y:1};
      this.vipText.scale.x = 0.25;
      this.vipText.scale.y = 0.25;
      foregroundContainer.addChild(this.vipText);
    }
    this.vipText.visible = true;
    this.vipText.human = human;
    this.vipText.yOffset = -20;
    this.vipText.x = human.x;
    this.vipText.y = human.y + this.vipText.yOffset;
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
    if (this.doctorTextures.length == 0) {
      for (var i=0; i < 3; i++) {
        this.doctorTextures.push(PIXI.Texture.from('doctor' + (i + 1) + '.png'))
      }
      this.doctorDeadTexture = [PIXI.Texture.from('doctor4.png')];
    }

    if (this.humans.length > 0) {
      for (var i=0; i < this.humans.length; i++) {
        characterContainer.removeChild(this.humans[i]);
        this.humans[i].stop();
      }
      this.discardedHumans = this.humans.slice();;
      this.humans.length = 0;
      this.aliveHumans.length = 0;
    }

    Police.populate();
    Army.populate();
    Tanks.populate();

    this.getAttackDamage();
    var maxHumans = this.getMaxHumans();
    var numDoctors = this.getMaxDoctors();
    var maxHealth = this.getMaxHealth(GameModel.level);
    var vipNeeded = Trophies.doesLevelHaveTrophy(GameModel.level);
    
    if (vipNeeded) {
      this.escapeTarget = {x:gameFieldSize.x / 2, y:gameFieldSize.y + 50};
    } else {
      if (this.vipText) {
        this.vipText.visible = false;
      }
    }
  
    for (var i=0; i < maxHumans; i++) {
      var human;
      if (numDoctors > 0) {
        if (this.discardedHumans.length > 0) {
          human = this.discardedHumans.pop();
          human.textures = this.doctorTextures;
        } else {
          human = new PIXI.AnimatedSprite(this.doctorTextures);
        }
        human.deadTexture = this.doctorDeadTexture;
        human.doctor = true;
        human.torchBearer = false;
        human.healTickTimer = Math.random() * this.healTickTimer;
        numDoctors--;
      } else {
        var torchBearer = Math.random() < this.getTorchChance();
        var textureId = Math.floor(Math.random() * 3) + (torchBearer ? 3 : 0);
        if (this.discardedHumans.length > 0) {
          human = this.discardedHumans.pop();
          human.textures = this.textures[textureId].animated;
        } else {
          human = new PIXI.AnimatedSprite(this.textures[textureId].animated);
        }
        human.torchBearer = torchBearer;
        human.deadTexture = this.textures[textureId].dead;
        human.doctor = false;
      }
      human.vip = false;
      human.dead = false;
      human.burning = false;
      human.burnDamage = 0;
      human.animationSpeed = 0.15;
      human.anchor = {x:35/80,y:1};
      human.currentPoi = this.map.getRandomBuilding();
      human.position = this.map.randomPositionInBuilding(human.currentPoi);
      human.zIndex = human.position.y;
      human.xSpeed = 0;
      human.ySpeed = 0;
      human.plagueTickTimer = Math.random() * this.plagueTickTimer;
      human.target = false;
      human.speedMod = 1;
      human.zombieTarget = false;
      human.infected = false;
      human.lastKnownBuilding = false;
      human.plagueDamage = 0;
      human.visionDistance = this.visionDistance;
      human.visible = true;
      human.alpha = 1;
      human.maxHealth = human.health = maxHealth;
      if (vipNeeded && !human.doctor) {
        human.vip = true;
        vipNeeded = false;
        human.maxHealth = human.health = maxHealth * 2;
        this.setupVipText(human);
      }
      human.timeToScan = Math.random() * this.scanTime;
      human.timeFleeing = 0;
      this.changeState(human, this.states.standing);
      human.timeStanding = Math.random() * this.randomSecondsToStand();
      human.attackTimer = this.attackSpeed;
      human.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.humans.push(human);
      characterContainer.addChild(human);
    }

    
  },

  updateHumanSpeed(human, timeDiff) {

    if (!human.tank) {
      if (this.frozen) {
        human.gotoAndStop(0);
        return;
      } else {
        if (!human.playing) {
          human.play();
        }
      }
    } else {
      if (this.frozen) {
        return;
      }
    }

    if (human.dogStun && human.dogStun > 0) {
      human.dogStun -= timeDiff;
      return;
    }

    if (!human.targetTimer || !human.targetVector) {
      human.targetTimer = 0;
    }
    human.targetTimer-=timeDiff;
    if (human.targetTimer <= 0) {
      human.targetVector = this.map.howDoIGetToMyTarget(human, human.target);
      human.targetTimer = 0.2;
    }
    var humanSpeedMod = human.speedMod * human.maxSpeed;
    
    human.xSpeed = human.targetVector.x * humanSpeedMod;
    human.ySpeed = human.targetVector.y * humanSpeedMod;

    if (isNaN(human.xSpeed) || isNaN(human.ySpeed)) {
      human.xSpeed = 0;
      human.ySpeed = 0;
    }

    human.position.x += human.xSpeed * timeDiff;
    human.position.y += human.ySpeed * timeDiff;
    human.zIndex = human.position.y;
    if (Math.abs(human.xSpeed) > 1 && !human.tank)
      human.scale.x = human.xSpeed > 0 ? this.scaling : -this.scaling;
  },

  drawTargets : false,

  update(timeDiff) {
    if (GameModel.currentState != GameModel.states.playingLevel) {
      return;
    }
    var aliveHumans = [];
    var aliveZombies = Zombies.aliveZombies;
    this.graveyardAttackers.length = 0;
    for (var i=0; i < this.humans.length; i++) {
      this.updateHuman(this.humans[i], timeDiff, aliveZombies);
      if (!this.humans[i].dead)
        aliveHumans.push(this.humans[i]);
    }
    this.aliveHumans = aliveHumans;
    GameModel.stats.human.count = this.aliveHumans.length;
    Police.update(timeDiff, aliveZombies);
    Army.update(timeDiff, aliveZombies);
    Tanks.update(timeDiff, aliveZombies);

    if (this.vipText && this.vipText.visible) {
      this.vipText.x = this.vipText.human.x;
      this.vipText.y = this.vipText.human.y + this.vipText.yOffset;
    }

    GameModel.humanCount = this.aliveHumans.length;
  },

  updateDeadHumanFading(human, timeDiff) {
    if (!human.visible)
      return;
  
    if (human.alpha > 0.5 && human.alpha - this.fadeSpeed * timeDiff <= 0.5) {
      if (!human.tank && Math.random() < GameModel.riseFromTheDeadChance) {
        Zombies.createZombie(human.x, human.y, human.isDog);
        human.visible = false;
        characterContainer.removeChild(human);
        return;
      }
    }
    human.alpha -= this.fadeSpeed * timeDiff;

    if (human.alpha < 0) {
      human.visible = false;
      characterContainer.removeChild(human);
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
      case this.states.escaping:
        human.play();
        human.maxSpeed = this.maxRunSpeed;
        human.target = this.escapeTarget;
        Exclamations.newExclamation(human);
        GameModel.sendMessage("The VIP is escaping!");
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
        zombie.burnDamage += this.attackDamage;
      }
      zombie.burning = true;
    }
  },

  burnHuman(human, damage) {
    if (!human)
      return;
      
    if (!human.burning) {
      human.burnTickTimer = this.burnTickTimer;
      human.smokeTimer = this.smokeTimer;
      Exclamations.newFire(human);
      human.burnDamage = damage;
    } else {
      human.burnDamage += damage;
    }
    human.burning = true;
  },

  updatePlague(human, timeDiff) {
    human.plagueTickTimer -= timeDiff;

    if (human.plagueTickTimer < 0) {
      this.damageHuman(human, human.plagueDamage);
      human.plagueTickTimer = this.plagueTickTimer;
      Exclamations.newPoison(human);
      human.plagueTicks--;
      if (this.pandemic) {
        this.pandemicBullet(human);
      }
      if (human.plagueTicks <= 0) {
        human.infected = false;
        human.plagueDamage = 0;
      }
    }
  },

  pandemicBullet(human) {
    for (var i = 0; i < this.aliveHumans.length; i++) {
      if (Math.abs(this.aliveHumans[i].x - human.x) < 30 && Math.abs(this.aliveHumans[i].y - human.y) < 30) {
        if (Math.random() < 0.3) {
          Bullets.newBullet(human, this.aliveHumans[i], GameModel.zombieDamage / 2, true);
        }
      }
    }
  },

  healHuman(human) {
    if (human.health < human.maxHealth) {
      if (human.infected && human.plagueTicks > 0) {
        human.plagueTicks--;
      }
      human.health += this.attackDamage * 2;
      if (human.health > human.maxHealth) {
        human.health = human.maxHealth;
        human.speedMod = Math.max(Math.min(1, human.health / human.maxHealth), 0.25);
      }
      Exclamations.newHealing(human);
    }
  },

  doHeal(human, timeDiff) {
    human.healTickTimer -= timeDiff;
    if (human.healTickTimer < 0) {
      var healRadius = 100;
      human.healTickTimer = this.healTickTimer;
      for (var i = 0; i < this.aliveHumans.length; i++) {
        if (Math.abs(this.aliveHumans[i].x - human.x) < healRadius) {
          if (Math.abs(this.aliveHumans[i].y - human.y) < healRadius) {
            if (this.fastDistance(human.x, human.y, this.aliveHumans[i].x, this.aliveHumans[i].y) < healRadius) {
              this.healHuman(this.aliveHumans[i]);
            }
          }
        }
      }
    }
  },

  updateHuman(human, timeDiff, aliveZombies) {
    
    if (human.dead)
      return this.updateDeadHumanFading(human, timeDiff);

    human.attackTimer -= timeDiff;
    human.timeToScan -= timeDiff;
    human.timeFleeing -= timeDiff;

    if (human.infected)
      this.updatePlague(human, timeDiff);
    if (human.doctor)
      this.doHeal(human, timeDiff);
    if (human.burning)
      this.updateBurns(human, timeDiff);

    if ((!human.zombieTarget || human.zombieTarget.dead) && human.timeToScan < 0) {
      var count = Humans.scanForZombies(human, aliveZombies);

      if (count > 0) {
        if (human.vip) {
          if (human.state !== this.states.escaping)
            this.changeState(human, this.states.escaping);
        } else if (Math.random() < count * this.fleeChancePerZombie) {
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
        if (this.fastDistance(human.position.x, human.position.y, human.target.x, human.target.y) < this.moveTargetDistance) {
          human.target = false;
          human.zombieTarget = false;
          this.changeState(human, this.states.standing);
        } else {
          Humans.updateHumanSpeed(human, timeDiff);
        }
        break;
      case this.states.escaping:
        if (this.fastDistance(human.position.x, human.position.y, human.target.x, human.target.y) < this.moveTargetDistance) {
          Smoke.newDroneCloud(human.x, human.y);
          human.dead = true;
          human.zombieTarget = false;
          human.visible = false;
          this.vipText.visible = false;
          GameModel.sendMessage("The VIP has escaped!");
          GameModel.vipEscaped();
        } else {
          Humans.updateHumanSpeed(human, timeDiff);
        }
        break;
      case this.states.attacking:
        human.scale.x = human.target.x > human.x ? this.scaling : -this.scaling;
        if (human.zombieTarget && !human.zombieTarget.dead) {
          var distanceToTarget = this.fastDistance(human.position.x, human.position.y, human.target.x, human.target.y);
          if (distanceToTarget < this.attackDistance) {
            if (human.attackTimer < 0) {
              Zombies.damageZombie(human.zombieTarget, this.attackDamage, human);
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
  map:ZmMap,
  maxWalkSpeed : 15,
  maxRunSpeed : 40,
  police : [],
  discardedPolice : [],
  walkTexture : [],
  deadTexture :[],
  dogTexture : [],
  deadDogTexture : [],
  policeDogLevel : 20,
  policePerLevel : 1,
  attackSpeed : 2,
  attackDamage : 16,
  attackDistance : 20,
  moveTargetDistance : 5,
  shootDistance : 110,
  visionDistance : 150,
  scaling :2,
  dogScaling: 1.3,
  radioTime : 30,

  states : {
    shooting : 1,
    attacking : 2,
    walking : 3,
    running : 4,
    standing : 5
  },

  dogStates : {
    following : 1,
    attacking : 2,
    hunting : 3
  },

  isExtraPolice() {
    return (GameModel.level + 10) % 20 == 0;
  },

  getMaxPolice() {

    var maxPolice = Math.min(Math.round(this.policePerLevel * GameModel.level), 100);

    if (GameModel.level < 3)
      return 0;

    if (this.isExtraPolice()) {
      return Math.max(maxPolice * 2, 150);
    }

    return maxPolice;
  },

  getMaxHealth() {
    return Math.round(Humans.getMaxHealth(GameModel.level) * 1.1);
  },

  getAttackDamage() {
    this.attackDamage = Math.round(this.getMaxHealth() / 10);
  },

  populate() {
    if (this.walkTexture.length == 0) {
      for (var i=0; i < 3; i++) {
        this.walkTexture.push(PIXI.Texture.from('cop' + (i + 1) + '.png'));
      }
      this.deadTexture = [PIXI.Texture.from('cop4.png')];
      for (var i=0; i < 2; i++) {
        this.dogTexture.push(PIXI.Texture.from("dog" + (i + 1) + ".png"));
      }
      this.deadDogTexture = [PIXI.Texture.from("dogdead.png")];
    }

    if (this.police.length > 0) {
      for (var i=0; i < this.police.length; i++) {
        characterContainer.removeChild(this.police[i]);
      }
      this.discardedPolice = this.police.slice();
      this.police = [];
    }

    var maxPolice = this.getMaxPolice();
    var maxHealth = this.getMaxHealth();
    var maxDogHealth = maxHealth * 0.6;
    this.getAttackDamage();

    for (var i=0; i < maxPolice; i++) {
      var police;
      if (this.discardedPolice.length > 0) {
        police = this.discardedPolice.pop();
        police.alpha = 1;
        police.textures = this.walkTexture;
      } else {
        police = new PIXI.AnimatedSprite(this.walkTexture);
      }
      police.isDog = false;
      police.deadTexture = this.deadTexture;
      police.animationSpeed = 0.2;
      police.anchor = {x:35/80,y:1};
      police.currentPoi = this.map.getRandomBuilding();
      police.position = this.map.randomPositionInBuilding(police.currentPoi);
      police.zIndex = police.position.y;
      police.xSpeed = 0;
      police.ySpeed = 0;
      police.radioTime = 5;
      police.speedMod = 1;
      police.dead = false;
      police.infected = false;
      police.burning = false;
      police.burnDamage = 0;
      police.lastKnownBuilding = false;
      police.plagueDamage = 0;
      police.plagueTickTimer = Math.random() * Humans.plagueTickTimer;
      police.maxSpeed = this.maxWalkSpeed;
      police.visionDistance = this.visionDistance;
      police.visible = true;
      police.maxHealth = police.health = maxHealth;
      police.timeToScan = Math.random() * Humans.scanTime;
      police.timeStanding = Math.random() * Humans.randomSecondsToStand();
      police.target = false;
      police.zombieTarget = false;
      police.state = this.states.standing;
      police.attackTimer = this.attackSpeed;
      police.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.police.push(police);
      characterContainer.addChild(police);

      if (GameModel.level >= this.policeDogLevel && Math.random() > 0.5) {
        this.createPoliceDog(police, maxDogHealth);
      }
    }

    if (this.isExtraPolice()) {
      GameModel.sendMessage("Warning: High Police Activity!");
    }
  },

  createPoliceDog(police, maxDogHealth) {
    var dog;
    if (this.discardedPolice.length > 0) {
      dog = this.discardedPolice.pop();
      dog.alpha = 1;
      dog.textures = this.dogTexture;
    } else {
      dog = new PIXI.AnimatedSprite(this.dogTexture);
    }
    dog.owner = police;
    dog.isDog = true;
    dog.deadTexture = this.deadDogTexture;
    dog.animationSpeed = 0.15;
    dog.anchor = {x:0.5,y:1};
    dog.position = {x:police.position.x + 3, y: police.position.y};
    dog.zIndex = dog.position.y;
    dog.xSpeed = 0;
    dog.ySpeed = 0;
    dog.speedMod = 1;
    dog.dead = false;
    dog.infected = false;
    dog.burning = false;
    dog.burnDamage = 0;
    dog.lastKnownBuilding = false;
    dog.plagueDamage = 0;
    dog.plagueTickTimer = Math.random() * Humans.plagueTickTimer;
    dog.maxSpeed = this.maxRunSpeed;
    dog.visionDistance = this.visionDistance;
    dog.visible = true;
    dog.maxHealth = dog.health = maxDogHealth;
    dog.timeToScan = Math.random() * Humans.scanTime;
    dog.target = police;
    dog.zombieTarget = false;
    dog.state = this.dogStates.following;
    dog.followTimer = 0;
    dog.attackTimer = this.attackSpeed;
    dog.scale = {x:Math.random() > 0.5 ? this.dogScaling : -1 * this.dogScaling, y: this.dogScaling};
    this.police.push(dog);
    characterContainer.addChild(dog);
  },

  update(timeDiff, aliveZombies) {
    var count = 0;
    for (var i=0; i < this.police.length; i++) {
      if (this.police[i].isDog) {
        this.updatePoliceDog(this.police[i], timeDiff, aliveZombies);
      } else {
        this.updatePolice(this.police[i], timeDiff, aliveZombies);
      }
      if (!this.police[i].dead) {
        Humans.aliveHumans.push(this.police[i]);
        count++;
      }
    }
    GameModel.stats.police.count = count;
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
      if (!this.police[i].dead && !this.police[i].isDog && (!this.police[i].zombieTarget || this.police[i].zombieTarget.dead)) {
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

    if (police.infected)
      Humans.updatePlague(police, timeDiff);
    if (police.burning)
      Humans.updateBurns(police, timeDiff);

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
            Zombies.damageZombie(police.zombieTarget, this.attackDamage, police);
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
            Bullets.newBullet(police, police.zombieTarget, this.attackDamage);
            police.attackTimer = this.attackSpeed;
          }
        } else {
          this.changeState(police, this.states.standing);
        }

        break;
    }
  },
  updateDogSpeed(dog, timeDiff) {
    // dog.speedMod = 1;
    Humans.updateHumanSpeed(dog, timeDiff);
    if (Math.abs(dog.xSpeed) > 1)
      dog.scale.x = dog.xSpeed > 0 ? this.dogScaling : -this.dogScaling;
  },
  updatePoliceDog(dog, timeDiff, aliveZombies) {
    
    if (dog.dead)
      return Humans.updateDeadHumanFading(dog, timeDiff);

    dog.attackTimer -= timeDiff;
    dog.timeToScan -= timeDiff;

    if (dog.infected)
      Humans.updatePlague(dog, timeDiff);
    if (dog.burning)
      Humans.updateBurns(dog, timeDiff);

    switch (dog.state) {

      case this.dogStates.following:

        if (dog.owner.dead) {
          dog.state = this.dogStates.hunting;
          dog.play();
          break;
        }

        if (dog.owner.zombieTarget && !dog.owner.zombieTarget.dead) {
          dog.state = this.dogStates.attacking;
          dog.play();
          dog.target = dog.owner.zombieTarget;
          break;
        }
        dog.target = dog.owner;
        if (fastDistance(dog.position.x, dog.position.y, dog.target.x, dog.target.y) < this.moveTargetDistance) {
          dog.followTimer = Math.random() * 3;
          dog.gotoAndStop(0);
        } else {
          dog.followTimer -= timeDiff;
          if (dog.followTimer < 0) {
            dog.play();
            this.updateDogSpeed(dog, timeDiff);
          }
        }
        break;
      case this.dogStates.attacking:

        if (dog.zombieTarget && !dog.zombieTarget.dead) {
          if (fastDistance(dog.position.x, dog.position.y, dog.zombieTarget.x, dog.zombieTarget.y) < this.moveTargetDistance) {
            dog.scale.x = dog.target.x > dog.x ? this.dogScaling : -this.dogScaling;
            if (dog.attackTimer < 0) {
              Zombies.damageZombie(dog.target, this.attackDamage, dog);
              dog.target.dogStun = 1;
              dog.attackTimer = this.attackSpeed;
            }
          } else {
            dog.target = dog.zombieTarget;
            this.updateDogSpeed(dog, timeDiff);
          }
        } else {
          dog.state = this.dogStates.following;
        }
      case this.dogStates.hunting:

        if ((!dog.zombieTarget || dog.zombieTarget.dead) && dog.timeToScan < 0) {
          Humans.scanForZombies(dog, aliveZombies);
          if (dog.zombieTarget) {
            dog.state = this.dogStates.attacking;
          }
        }

        if (fastDistance(dog.position.x, dog.position.y, dog.target.x, dog.target.y) < this.moveTargetDistance) {
          dog.target = {x:Math.random() * gameFieldSize.x, y:Math.random() * gameFieldSize.y};
          dog.maxSpeed = this.maxRunSpeed;
        } else {
          this.updateDogSpeed(dog, timeDiff);
        }
        break;
    }
  }
}

Army = {
  map:ZmMap,
  maxWalkSpeed : 20,
  maxRunSpeed : 50,
  armymen : [],
  discardedArmymen : [],
  textures : [],
  aliveZombies : [],
  armyPerLevel : 0.9,
  attackSpeed : 2,
  attackDamage : 20,
  attackDistance : 25,
  moveTargetDistance : 5,
  shootDistance : 130,
  visionDistance : 200,
  scaling :2,
  shotsPerBurst : 3,
  droneStrikeTimer : 0,
  droneStrikeTime : 35,
  assaultStarted : false,

  states : {
    shooting : 1,
    attacking : 2,
    walking : 3,
    running : 4,
    standing : 5
  },

  isExtraArmy() {
    return GameModel.level % 20 == 0;
  },

  getMaxArmy() {

    var maxArmy = Math.min(Math.round(this.armyPerLevel * GameModel.level), 100);

    if (GameModel.level < 11)
      return 0;

    if (this.isExtraArmy()) {
      return Math.max(maxArmy * 2, 150);
    }

    if (GameModel.isBossStage(GameModel.level)) {
      return Math.max(maxArmy , 75);
    }

    return maxArmy;
  },

  getMaxHealth() {
    return Math.round(Humans.getMaxHealth(GameModel.level) * 1.2);
  },

  getAttackDamage() {
    this.attackDamage = Math.round(this.getMaxHealth() / 10);
  },

  populate() {
    this.assaultStarted = false;

    if (this.textures.length == 0) {
      for (var i=0; i < 3; i++) {
        var animated = [];
        for (var j=0; j < 3; j++) {
          animated.push(PIXI.Texture.from('army' + (i + 1) + '_' + (j + 1) + '.png'));
        }
        this.textures.push({
          animated : animated,
          dead : [PIXI.Texture.from('army' + (i + 1) + '_dead.png')]
        })
      }
    }

    if (this.droneStrike && this.droneStrike.laser) {
      foregroundContainer.removeChild(this.droneStrike.text)
      foregroundContainer.removeChild(this.droneStrike.laser);
    }

    if (this.armymen.length > 0) {
      for (var i=0; i < this.armymen.length; i++) {
        characterContainer.removeChild(this.armymen[i]);
      }
      this.discardedArmymen = this.armymen.slice();
      this.armymen = [];
    }

    var maxArmy = this.getMaxArmy();
    var maxHealth = this.getMaxHealth();
    this.getAttackDamage();

    this.droneStrike = false;
    this.droneStrikeTimer = Math.random() * this.droneStrikeTime;
    this.droneActive = GameModel.level >= 25;
  
    for (var i=0; i < maxArmy; i++) {
      var armyman;
      var textureId = 0;
      if (GameModel.level > 35 && Math.random() < 0.3) {
        textureId = 1;
      }
      if ((GameModel.level > 45 && Math.random() < 0.3) || (GameModel.isBossStage(GameModel.level) && Math.random() < 0.5)) {
        textureId = 2;
      }
      if (this.discardedArmymen.length > 0) {
        armyman = this.discardedArmymen.pop();
        armyman.alpha = 1;
        armyman.textures = this.textures[textureId].animated;
      } else {
        armyman = new PIXI.AnimatedSprite(this.textures[textureId].animated);
      }
      armyman.minigun = textureId == 1;
      armyman.rocketlauncher = textureId == 2;
      armyman.deadTexture = this.textures[textureId].dead;
      armyman.animationSpeed = 0.2;
      armyman.anchor = {x:35/80,y:1};
      armyman.currentPoi = this.map.getRandomBuilding();
      armyman.position = this.map.randomPositionInBuilding(armyman.currentPoi);
      armyman.zIndex = armyman.position.y;
      armyman.xSpeed = 0;
      armyman.ySpeed = 0;
      armyman.speedMod = 1;
      armyman.dead = false;
      armyman.infected = false;
      armyman.burning = false;
      armyman.burnDamage = 0;
      armyman.lastKnownBuilding = false;
      armyman.plagueDamage = 0;
      armyman.plagueTickTimer = Math.random() * Humans.plagueTickTimer;
      armyman.maxSpeed = this.maxWalkSpeed;
      armyman.visionDistance = this.visionDistance;
      armyman.visible = true;
      armyman.maxHealth = armyman.health = maxHealth;
      armyman.timeToScan = Math.random() * Humans.scanTime;
      armyman.timeStanding = Math.random() * Humans.randomSecondsToStand();
      armyman.target = false;
      armyman.zombieTarget = false;
      armyman.state = this.states.standing;
      armyman.attackTimer = this.attackSpeed;
      armyman.attackingGraveyard = false;
      armyman.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      this.armymen.push(armyman);
      characterContainer.addChild(armyman);
    }

    if (this.isExtraArmy()) {
      GameModel.sendMessage("Warning: High Military Activity!");
    }
  },

  update(timeDiff, aliveZombies) {
    var count = 0;
    this.aliveZombies = aliveZombies;
    if (this.droneActive) {
      this.droneStrikeTimer -= timeDiff;
    }
    for (var i=0; i < this.armymen.length; i++) {
      this.updateArmy(this.armymen[i], timeDiff, aliveZombies);
      if (!this.armymen[i].dead) {
        Humans.aliveHumans.push(this.armymen[i]);
        if (this.armymen[i].attackingGraveyard) {
          Humans.graveyardAttackers.push(this.armymen[i]);
        }
        count++;
      } 
    }
    GameModel.stats.army.count = count;
    this.updateDroneStrike(timeDiff, aliveZombies);
  },

  decideStateOnZombieDistance(armyman) {
    if (armyman.zombieTarget && !armyman.zombieTarget.dead) {
      armyman.target = armyman.zombieTarget;
      var distanceToTarget = fastDistance(armyman.position.x, armyman.position.y, armyman.zombieTarget.x, armyman.zombieTarget.y);

      if (distanceToTarget > this.shootDistance && !armyman.rocketlauncher) {
        this.changeState(armyman, this.states.running);
        return;
      }

      if (distanceToTarget > this.shootDistance * 1.2 && armyman.rocketlauncher) {
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

    if (armyman.infected)
      Humans.updatePlague(armyman, timeDiff);
    if (armyman.burning)
      Humans.updateBurns(armyman, timeDiff);

    if ((!armyman.zombieTarget || armyman.zombieTarget.dead) && armyman.timeToScan < 0) {
      var zombies = Humans.scanForZombies(armyman, aliveZombies);
      if (zombies > 3 && this.droneActive && this.droneStrikeTimer < 0) {
        this.callDroneStrike(armyman, aliveZombies);
      }
      if (this.assaultStarted && armyman.rocketlauncher && Math.random() > 0.98) {
        armyman.zombieTarget = Graveyard.target;
        armyman.attackingGraveyard = true;
      }
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
            Zombies.damageZombie(armyman.zombieTarget, this.attackDamage, armyman);
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
            if (armyman.minigun) {
              armyman.shotsLeft = this.shotsPerBurst * 3;
            }
            if (armyman.rocketlauncher) {
              armyman.shotsLeft = 1;
            }
            armyman.attackTimer = armyman.rocketlauncher ? this.attackSpeed * 1.5 : this.attackSpeed;
            armyman.shotTimer = 0;
          }
          if (armyman.shotsLeft > 0) {
            armyman.shotTimer -= timeDiff;
            if (armyman.shotTimer < 0) {
              armyman.shotTimer = 0.15;
              if (armyman.minigun) {
                armyman.shotTimer = 0.08;
              }
              Bullets.newBullet(armyman, armyman.zombieTarget, armyman.rocketlauncher ? this.attackDamage * 1.2 : armyman.minigun ? this.attackDamage / 2 : this.attackDamage, false, armyman.rocketlauncher);
              armyman.shotsLeft--;
            }
          }
        } else {
          this.changeState(armyman, this.states.standing);
        }

        break;
    }
  },

  droneBlastRadius : 35,

  callDroneStrike(armyman, aliveZombies) {

    var zombiesInArea = 0;
    for (var i = 0; i < aliveZombies.length; i++) {
      if (aliveZombies[i].x > armyman.zombieTarget.x - this.droneBlastRadius && aliveZombies[i].x < armyman.zombieTarget.x + this.droneBlastRadius) {
        if (aliveZombies[i].y > armyman.zombieTarget.y - this.droneBlastRadius && aliveZombies[i].y < armyman.zombieTarget.y + this.droneBlastRadius) {
          zombiesInArea++;
        }
      }
    }
    var humansInArea = 0;
    var aliveHumans = Humans.aliveHumans;
    for (var i = 0; i < aliveHumans.length; i++) {
      if (aliveHumans[i].x > armyman.zombieTarget.x - this.droneBlastRadius && aliveHumans[i].x < armyman.zombieTarget.x + this.droneBlastRadius) {
        if (aliveHumans[i].y > armyman.zombieTarget.y - this.droneBlastRadius && aliveHumans[i].y < armyman.zombieTarget.y + this.droneBlastRadius) {
          humansInArea++;
        }
      }
    }

    if (zombiesInArea > 1 && humansInArea == 0) {
      Exclamations.newRadio(armyman);
      this.droneStrikeTimer = this.droneStrikeTime;
      this.droneStrike = {
        caller:armyman,
        target:armyman.zombieTarget,
        timer:3,
        bombsLeft:3
      }
    }
  },

  droneBomb(aliveZombies) {
    var variance = 32;
    this.droneExplosion(this.droneStrike.target.x + ((Math.random() - 1) * variance), this.droneStrike.target.y + ((Math.random() - 1) * variance), aliveZombies, this.attackDamage * 3);
    this.droneStrike.timer = 0.3;
    this.droneStrike.bombsLeft--;
  },

  droneExplosion(x, y, aliveZombies, damage) {
    if (!aliveZombies) {
      aliveZombies = this.aliveZombies;
    }
    Blasts.newDroneBlast(x, y);
    for (var i = 0; i < aliveZombies.length; i++) {
      if (aliveZombies[i].x > x - this.droneBlastRadius && aliveZombies[i].x < x + this.droneBlastRadius) {
        if (aliveZombies[i].y > y - this.droneBlastRadius && aliveZombies[i].y < y + this.droneBlastRadius) {
          Zombies.damageZombie(aliveZombies[i], damage);
        }
      }
    }
  },

  updateDroneStrike(timeDiff, aliveZombies) {
    if (this.droneStrike) {
      
      this.droneStrike.timer -= timeDiff;

      if (!this.droneStrike.startedBombing) {
        if (!this.droneStrike.text) {
          this.droneStrike.text = new PIXI.Text("3", {
            fontFamily: 'sans-serif',
            fontSize : 40,
            fill: "#F00",
            stroke: "#000",
            strokeThickness: 0,
            align: 'center'
          });
          this.droneStrike.text.anchor = {x:0.5, y:1};
          this.droneStrike.text.scale.x = 0.5;
          this.droneStrike.text.scale.y = 0.5;
          foregroundContainer.addChild(this.droneStrike.text)

          this.droneStrike.laser = new PIXI.Graphics();
          foregroundContainer.addChild(this.droneStrike.laser);
        }
        this.droneStrike.text.text = Math.ceil(this.droneStrike.timer);
        this.droneStrike.text.x = this.droneStrike.target.x;
        this.droneStrike.text.y = this.droneStrike.target.y - 30;

        this.droneStrike.laser.clear();
        this.droneStrike.laser.lineStyle(1, 0xFF0000);
        this.droneStrike.laser.moveTo(this.droneStrike.caller.x, this.droneStrike.caller.y - 10);
        this.droneStrike.laser.lineTo(this.droneStrike.target.x, this.droneStrike.target.y - 10);
      }

      if ((this.droneStrike.caller.dead || this.droneStrike.target.dead) && !this.droneStrike.startedBombing) {
        foregroundContainer.removeChild(this.droneStrike.text)
        foregroundContainer.removeChild(this.droneStrike.laser);
        this.droneStrike = false;
        this.droneStrikeTimer = 0;
        return;
      }
      
      if (this.droneStrike.timer < 0) {

        if (!this.droneStrike.startedBombing) {
          foregroundContainer.removeChild(this.droneStrike.text)
          foregroundContainer.removeChild(this.droneStrike.laser);
          this.droneStrike.startedBombing = true;
        }

        this.droneBomb(aliveZombies);

        if (this.droneStrike.bombsLeft <= 0) {
          this.droneStrike = false;
        }
      }
    }
  }
}


Tanks = {
  map:ZmMap,

  speed : 20,
  tanks : [],
  aliveTanks : [],
  attackSpeed : 5,
  scaling : 3,

  moveTargetDistance : 20,

  shootDistance:250,

  states : {
    shooting : 1,
    attacking : 2,
    patrolling : 3,
  },

  directions : {
    horizontal : 1,
    vertical : 2
  },

  getMaxTanks() {

    if (GameModel.isBossStage(GameModel.level)) {
      return Math.min(Math.round(GameModel.level / 30), 20);
    }
    return 0;
  },

  getMaxHealth() {
    return Math.round(Humans.getMaxHealth(GameModel.level) * 10);
  },

  getAttackDamage() {
    this.attackDamage = Math.round(this.getMaxHealth() / 10);
  },


  populate() {

    if (!this.textures) {
      this.textures = {
        vertical : [],
        horizontal : [],
        turret : []
      }
      for (var i=0; i < 2; i++) {
        this.textures.horizontal.push(PIXI.Texture.from('tank' + i  + '.png'));
      }
      for (var i=2; i < 4; i++) {
        this.textures.vertical.push(PIXI.Texture.from('tank' + i  + '.png'));
      }
      this.textures.turret = PIXI.Texture.from("tank4.png");
    }


    if (this.tanks.length > 0) {
      for (var i=0; i < this.tanks.length; i++) {
        characterContainer.removeChild(this.tanks[i]);
      }
      this.tanks = [];
      this.aliveTanks = [];
    }

    var maxTanks = this.getMaxTanks();
    var maxHealth = this.getMaxHealth();
    this.getAttackDamage();
  
    for (var i=0; i < maxTanks; i++) {
      var tank = new PIXI.Container();

      tank.tank = true;
      
      tank.tankSprite = new PIXI.AnimatedSprite(this.textures.horizontal);
      tank.turretSprite = new PIXI.Sprite(this.textures.turret);

      tank.addChild(tank.tankSprite);
      tank.addChild(tank.turretSprite);

      tank.tankSprite.animationSpeed = 0.2;
      tank.tankSprite.anchor = {x:0.5, y:1};
      tank.turretSprite.anchor = {x:7.5 / 16, y:7.5 / 16};
      tank.tankSprite.x = 0;
      tank.tankSprite.y = 0;
      tank.tankSprite.play();
      tank.turretSprite.x = 0;
      tank.turretSprite.y = -7;

      tank.currentDirection = this.directions.horizontal;

      tank.currentPoi = this.map.getRandomBuilding();
      tank.position = this.map.randomPositionInBuilding(tank.currentPoi);
      tank.zIndex = tank.position.y;
      tank.xSpeed = 0;
      tank.ySpeed = 0;
      tank.speedMod = 1;
      tank.dead = false;
      tank.infected = false;
      tank.burning = false;
      tank.burnDamage = 0;
      tank.lastKnownBuilding = false;
      tank.plagueDamage = 0;
      tank.plagueTickTimer = Math.random() * Humans.plagueTickTimer;
      tank.maxSpeed = this.speed;
      tank.visionDistance = 250;
      tank.visible = true;
      tank.maxHealth = tank.health = maxHealth;
      tank.timeToScan = Math.random() * Humans.scanTime;
      tank.target = false;
      tank.zombieTarget = false;
      tank.attackingGraveyard = false;
      tank.state = this.states.patrolling;
      tank.attackTimer = this.attackSpeed;
      tank.scale = {x:this.scaling, y:this.scaling};
      this.tanks.push(tank);
      characterContainer.addChild(tank);
    }
  },

  update(timeDiff, aliveZombies) {
    this.aliveZombies = aliveZombies;
    this.aliveTanks = [];
    for (var i=0; i < this.tanks.length; i++) {
      this.updateTank(this.tanks[i], timeDiff, aliveZombies);
      if (!this.tanks[i].dead) {
        Humans.aliveHumans.push(this.tanks[i]);
        this.aliveTanks.push(this.tanks[i]);
        if (this.tanks[i].attackingGraveyard) {
          Humans.graveyardAttackers.push(this.tanks[i]);
        }
      } 
    }
  },


  updateTank(tank, timeDiff, aliveZombies) {
    
    if (tank.dead)
      return Humans.updateDeadHumanFading(tank, timeDiff);

    tank.attackTimer -= timeDiff;
    tank.timeToScan -= timeDiff;

    if (tank.burning)
      Humans.updateBurns(tank, timeDiff);

    if ((!tank.zombieTarget || tank.zombieTarget.dead) && tank.timeToScan < 0) {
      Humans.scanForZombies(tank, aliveZombies);
      if (Army.assaultStarted && Math.random() > 0.9) {
        tank.zombieTarget = Graveyard.target;
        tank.attackingGraveyard = true;
      }
    }

    this.decideStateOnZombieDistance(tank);

    switch (tank.state) {

      case this.states.patrolling:

        if (!tank.target) {
          tank.target = this.map.randomPositionInBuilding(false);
        }

        if (fastDistance(tank.position.x, tank.position.y, tank.target.x, tank.target.y) < this.moveTargetDistance) {
          tank.target = false;
          tank.zombieTarget = false;
        } else {
          Humans.updateHumanSpeed(tank, timeDiff);
        }
        break;
      case this.states.attacking:
          if (tank.zombieTarget && !tank.zombieTarget.dead) {
            Humans.updateHumanSpeed(tank, timeDiff);
          } else {
            this.changeState(tank, this.states.patrolling);
          }
          break;
      case this.states.shooting:
        if (tank.zombieTarget && !tank.zombieTarget.dead) {
          if (tank.attackTimer < 0) {
            tank.attackTimer = this.attackSpeed;
            Bullets.newBullet(tank, tank.zombieTarget, this.attackDamage, false, true);
          }
        } else {
          this.changeState(tank, this.states.patrolling);
        }

        break;
    }

    this.updateTankSprites(tank, timeDiff);
  },

  updateTankSprites(tank, timeDiff) {
    if (Math.abs(tank.xSpeed) > Math.abs(tank.ySpeed)) {
      if (tank.currentDirection != this.directions.horizontal) {
        tank.currentDirection = this.directions.horizontal;
        tank.tankSprite.textures = this.textures.horizontal;
        tank.tankSprite.play();
        tank.turretSprite.y = -7;
      }
    } else {
      if (tank.currentDirection != this.directions.vertical) {
        tank.currentDirection = this.directions.vertical;
        tank.tankSprite.textures = this.textures.vertical;
        tank.tankSprite.play();
        tank.turretSprite.y = -8;
      }
    }
    if (tank.zombieTarget) {
      var targetAngle = Math.atan2(tank.zombieTarget.x - tank.x, tank.y - tank.zombieTarget.y) + (Math.PI / 2);
      if (tank.turretSprite.rotation > targetAngle) {
        tank.turretSprite.rotation -= timeDiff * 2;
      } else {
        tank.turretSprite.rotation += timeDiff * 2;
      }
    }
  },

  decideStateOnZombieDistance(tank) {
    if (tank.zombieTarget && !tank.zombieTarget.dead) {
      tank.target = tank.zombieTarget;
      var distanceToTarget = fastDistance(tank.position.x, tank.position.y, tank.zombieTarget.x, tank.zombieTarget.y);

      if (distanceToTarget > this.shootDistance) {
        this.changeState(tank, this.states.attacking);
        return;
      }
      
      this.changeState(tank, this.states.shooting);
    }
  },

  changeState(tank, state) {
    switch(state) {
      case this.states.patrolling:
          tank.tankSprite.play();
        break;
      case this.states.attcking:
          tank.tankSprite.play();
        break;
      case this.states.shooting:
          tank.tankSprite.gotoAndStop(0);
        break;
    }
    tank.state = state;
  },

}