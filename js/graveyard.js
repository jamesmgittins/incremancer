Graveyard = {

  sprite : false,
  fortSprite : false,
  spikeSprites : [],
  level : 1,
  spikeTimer : 5,
  fenceRadius : 50,
  fastDistance : fastDistance,

  graveyardHealth : 0,
  graveyardMaxHealth : 0,
  target : {
    graveyard : true,
    x : 0,
    y: 0
  },

  healthBar : false,

  initialize() {

    if (typeof GameModel.persistentData.graveyardZombies == 'undefined') {
      GameModel.persistentData.graveyardZombies = 1;
    }

    this.drawGraveyard();
    this.drawFence();
    this.drawHealthBar();
    Bones.initialize();
    BoneCollectors.populate();
    Harpies.populate();
  },

  damageGraveyard(damage) {
    if (GameModel.isBossStage(GameModel.level)) {
      this.graveyardHealth -= damage;
      if (this.graveyardHealth < 0) {
        GameModel.currentState = GameModel.states.failed;
        GameModel.startTimer = 3;
      }
    }
  },

  drawHealthBar() {
    if (GameModel.isBossStage(GameModel.level)) {
      GameModel.sendMessage("Defend the Graveyard!");
      this.graveyardHealth = this.graveyardMaxHealth = GameModel.zombieHealth * 100 * GameModel.graveyardHealthMod;
      if (!this.healthBar) {
        this.healthBar = {
          container : new PIXI.Container(),
          background : new PIXI.Graphics(),
          foreground : new PIXI.Graphics(),
          percentage : 100
        }
        this.healthBar.container.addChild(this.healthBar.background);
        this.healthBar.container.addChild(this.healthBar.foreground);
        foregroundContainer.addChild(this.healthBar.container);
      }

      this.target.x = gameFieldSize.x / 2;
      this.target.y = gameFieldSize.y / 2;

      this.healthBar.container.visible = true;
      this.healthBar.container.x = this.target.x - 50;
      this.healthBar.container.y = this.target.y - 100;

      this.healthBar.background.clear();
      this.healthBar.background.lineStyle(12, 0x333333);
      this.healthBar.background.moveTo(-2,0);
      this.healthBar.background.lineTo(102,0);

      this.healthBar.foreground.clear();
      this.healthBar.foreground.lineStyle(8, 0xfd5252);
      this.healthBar.foreground.moveTo(0,0);
      this.healthBar.foreground.lineTo(100,0);

    } else {
      if (this.healthBar) {
        this.healthBar.background.clear();
        this.healthBar.foreground.clear();
        this.healthBar.container.visible = false;
      }
    }
  },

  updateHealthBar() {
    var percentage = Math.max(Math.round((this.graveyardHealth / this.graveyardMaxHealth) * 100),0);
    if (percentage != this.healthBar.percentage) {
      this.healthBar.foreground.clear();
      if (percentage > 0) {
        this.healthBar.foreground.lineStyle(8, 0xfd5252);
        this.healthBar.foreground.moveTo(0,0);
        this.healthBar.foreground.lineTo(percentage, 0);
      }
      this.healthBar.percentage = percentage;
    }
  },

  drawGraveyard() {
    if (!this.spikeTexture) {
      this.spikeTexture = PIXI.Texture.from("spikes.png");
    }
    if (this.sprite) {
      backgroundContainer.removeChild(this.sprite);
    }
    if (this.fortSprite) {
      characterContainer.removeChild(this.fortSprite);
      this.fortSprite = false;
    }
    this.level = 1;
    var textureName = "graveyard1.png";
    var fortTexture = false;
    if (GameModel.constructions.crypt) {
      this.level = 2;
      textureName = "graveyard2.png";
    }
    if (GameModel.constructions.fort) {
      this.level = 3;
      textureName = "sprites/megagraveyard.png";
      fortTexture = "fort1.png";
    }
    if (GameModel.constructions.fortress) {
      this.level = 4;
      textureName = "sprites/megagraveyard.png";
      fortTexture = "fort2.png";
    }
    if (GameModel.constructions.citadel) {
      this.level = 5;
      textureName = "sprites/megagraveyard.png";
      fortTexture = "fort3.png";
    }
    if (this.sprite) {
      this.sprite.texture = PIXI.Texture.from(textureName);
    } else {
      this.sprite = new PIXI.Sprite(PIXI.Texture.from(textureName));
    }

    var graveyardPosition = ZmMap.graveYardLocation;
    
    this.sprite.width = 32;
    this.sprite.height = 32;
    this.sprite.anchor = {x:0.5, y:0.5};
    this.sprite.scale = {x:2,y:2};
    this.sprite.visible = false;
    this.sprite.graveyard = true;
    backgroundContainer.addChild(this.sprite);
    this.sprite.x = graveyardPosition.x;
    this.sprite.y = graveyardPosition.y;

    ZmMap.graveyardCollision = false;

    if (fortTexture) {

      if (this.fortSprite) {
        fortSprite.texture = PIXI.Texture.from(fortTexture);
      } else {
        this.fortSprite = new PIXI.Sprite(PIXI.Texture.from(fortTexture));
      }
      
      this.fortSprite.anchor = {x:0.5, y:1};
      this.fortSprite.scale = {x:2,y:2};
      this.fortSprite.x = graveyardPosition.x;
      this.fortSprite.zIndex = this.fortSprite.y = graveyardPosition.y + 2;
      this.fortSprite.visible = false;
      characterContainer.addChild(this.fortSprite);
    }

  },

  drawFence() {
    if (this.fence) {
      backgroundContainer.removeChild(this.fence);
    }

    this.fenceRadius = GameModel.fenceRadius;
    this.fence = new PIXI.Container();
    this.fence.anchor = {x:0,y:0};
    this.fence.visible = false;
    backgroundContainer.addChild(this.fence);

    var textures = [];
    for (var i=0; i < 4; i++) {
      textures.push(PIXI.Texture.from('fencepost' + (i + 1) + '.png'));
    }

    var numPosts = Math.round(this.fenceRadius * 0.4);
    var radiansPerFencePost = Math.PI * 2 / numPosts;
    for (var i = 0; i < numPosts; i++) {
      var postSprite = new PIXI.Sprite(getRandomElementFromArray(textures, Math.random()));
      this.fence.addChild(postSprite);
      postSprite.anchor = {x:0.5,y:1};
      postSprite.scale.x = Math.random() > 0.5 ? 1 : -1;
      var positionWobble = -5 + Math.random() * 10;
      postSprite.position = RotateVector2d(0, this.fenceRadius + positionWobble, radiansPerFencePost * i);
    }
    this.fence.cacheAsBitmap = true;

    var graveyardPosition = ZmMap.graveYardLocation;

    this.fence.x = graveyardPosition.x;
    this.fence.y = graveyardPosition.y;

  },

  update(timeDiff) {
    BoneCollectors.addAndRemoveBoneCollectors();
    Harpies.addAndRemoveHarpies();

    if (GameModel.isBossStage(GameModel.level)) {
      this.updateHealthBar();
    }
    
    if (!GameModel.constructions.graveyard || GameModel.currentState != GameModel.states.playingLevel) {
      this.sprite.visible = false;
      return;
    }

    if (this.level < 2 && GameModel.constructions.crypt || this.level < 3 && GameModel.constructions.fort || this.level < 4 && GameModel.constructions.fortress || this.level < 5 && GameModel.constructions.citadel)
      this.drawGraveyard();

    this.sprite.visible = true;
    if (this.fortSprite) {
      this.fortSprite.visible = true;
    }

    if (this.level == 5) {
      if (Math.random() > 0.9) {
        if (Math.random() > 0.5) {
          Smoke.newFireSmoke(this.sprite.x - 20, this.sprite.y - 113);
        } else {
          Smoke.newFireSmoke(this.sprite.x + 20, this.sprite.y - 113);
        }
        
      }
    }

    if (GameModel.energy >= GameModel.energyMax && !GameModel.hidden) {
      for (var i = 0; i < GameModel.persistentData.graveyardZombies; i ++)  {
        Zombies.spawnZombie(this.sprite.x, this.sprite.y + (this.level > 2 ? 8 : 0));
      }
    }

    Bones.update(timeDiff);
    BoneCollectors.update(timeDiff);
    Harpies.update(timeDiff);

    if(!GameModel.constructions.fence || GameModel.currentState != GameModel.states.playingLevel) {
      this.fence.visible = false;
    } else {
      this.fence.visible = true;
      if (this.fenceRadius !== GameModel.fenceRadius) {
        this.drawFence();
      }
    }

    this.updatePlagueSpikes(timeDiff);
    this.updateSpikeSprites(timeDiff)
  },

  updatePlagueSpikes(timeDiff) {
    if (GameModel.constructions.plagueSpikes) {
      this.spikeTimer -= timeDiff;
      if (this.spikeTimer < 0) {
        this.spikeTimer = 5;
        var aliveHumans = Humans.aliveHumans;
        for (var i = 0; i < aliveHumans.length; i++) {
          if (Math.abs(aliveHumans[i].x - this.sprite.x) < this.fenceRadius) {
            if (Math.abs(aliveHumans[i].y - this.sprite.y) < this.fenceRadius) {
              if (this.fastDistance(this.sprite.x, this.sprite.y, aliveHumans[i].x, aliveHumans[i].y) < this.fenceRadius) {
                Zombies.inflictPlague(aliveHumans[i]);
                Humans.damageHuman(aliveHumans[i], GameModel.zombieDamage);
                Blood.newPlagueSplatter(aliveHumans[i].x, aliveHumans[i].y);
                this.addSpikeSprite(aliveHumans[i]);
              }
            }
          }
        }
      }
    }
  },

  addSpikeSprite(human) {
    var sprite = false;
    for (var i=0; i < this.spikeSprites.length;i++) { 
      if (!this.spikeSprites[i].visible) {
        sprite = this.spikeSprites[i];
        break;
      }
    }
    if (!sprite) {
      sprite = new PIXI.Sprite(this.spikeTexture);
      this.spikeSprites.push(sprite);
      characterContainer.addChild(sprite);
      sprite.anchor = {x:0.5, y:1};
    }
    sprite.visible = true;
    sprite.alpha = 1;
    sprite.x = human.x;
    sprite.y = human.y + 2;
    sprite.zIndex = sprite.y;
    sprite.scale.y = 2;
    sprite.scale.x = Math.random() > 0.5 ? 1.5 : -1.5;
  },

  updateSpikeSprites(timeDiff) {
    for (var i=0; i < this.spikeSprites.length;i++) {
      if (this.spikeSprites[i].visible) {
        this.spikeSprites[i].alpha -= timeDiff * 0.4;
        if (this.spikeSprites[i].alpha <= 0) {
          this.spikeSprites[i].visible = false;
        }
      }
    }
  },

  isWithinFence(position) {
    if(!GameModel.constructions.fence || GameModel.currentState != GameModel.states.playingLevel) {
      return false;
    }
    if (position.x > this.fence.x - this.fenceRadius && position.x < this.fence.x + this.fenceRadius && 
        position.y > this.fence.y - this.fenceRadius && position.y < this.fence.y + this.fenceRadius) {
      return this.fastDistance(position.x, position.y, this.fence.x, this.fence.y) <= this.fenceRadius;
    }
    return false;
  }
};

BoneCollectors = {

  sprites:[],
  maxSpeed:125,
  texture:false,
  scaling:2,
  collectDistance:10,
  fastDistance : fastDistance,

  states : {
    collecting:"collecting",
    returning:"returning",
    waiting:"waiting"
  },

  populate() {
    this.bones = Bones;
    if (!this.texture) {
      this.texture = [];
      for (var i=0; i < 2; i++) {
        this.texture.push(PIXI.Texture.from('bonecollector' + (i + 1) + '.png'));
      }
    }
    for (var i = 0; i < this.sprites.length; i++) {
      this.sprites[i].boneList = [];
      this.sprites[i].target = false;
      this.sprites[i].position = {x:Graveyard.sprite.x,y:Graveyard.sprite.y};
      this.sprites[i].state = this.states.collecting;
    }
  },

  addAndRemoveBoneCollectors() {
    if (this.sprites.length > GameModel.persistentData.boneCollectors) {
      var boneCollector = this.sprites.pop();
      if (boneCollector.boneList) {
        for (var i = 0; i < boneCollector.boneList.length; i++){
          boneCollector.boneList[i].collector = false;
        }
      }
      GameModel.addBones(boneCollector.bones);
      characterContainer.removeChild(boneCollector);
    }
    if (this.sprites.length < GameModel.persistentData.boneCollectors) {
      var sprite = new PIXI.AnimatedSprite(this.texture);
      sprite.animationSpeed = 0.2;
      sprite.anchor = {x:0.5,y:1};
      sprite.position = {x:Graveyard.sprite.x,y:Graveyard.sprite.y};
      sprite.zIndex = sprite.position.y;
      sprite.visible = true;
      sprite.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      sprite.xSpeed = 0;
      sprite.ySpeed = 0;
      sprite.bones = 0;
      sprite.speedFactor = 0;
      sprite.state = this.states.collecting;
      sprite.play();
      sprite.boneList = [];
      this.sprites.push(sprite);
      characterContainer.addChild(sprite);
    }
  },

  update(timeDiff) {
    for (var i=0; i< this.sprites.length; i++) {
      this.updateBoneCollector(this.sprites[i], timeDiff);
    }
  },

  findNearestBone(boneCollector) {

    if (!boneCollector.boneList) {
      boneCollector.boneList = [];
    }

    if (boneCollector.boneList.length == 0) {
      var x = boneCollector.x;
      var y = boneCollector.y;
      for (var j = 0; j < 3; j++) {
        var nearestBone = false;
        var distanceToNearest = 2000;
        for (var i=0; i < this.bones.uncollected.length; i++) {
          if (!this.bones.uncollected[i].collected && !this.bones.uncollected[i].collector) {
            var distance = this.fastDistance(x, y, this.bones.uncollected[i].x, this.bones.uncollected[i].y);
            if (distance < distanceToNearest) {
              distanceToNearest = distance;
              nearestBone = this.bones.uncollected[i];
            }
          }
        }
        if (nearestBone) {
          boneCollector.boneList.push(nearestBone);
          nearestBone.collector = true;
          x = nearestBone.x;
          y = nearestBone.y;
        } else {
          break;
        }
      }
    }

    if (boneCollector.boneList.length > 0) {
      boneCollector.target = boneCollector.boneList.shift();
    } else {
      boneCollector.target = false;
    }
    
  },

  updateBoneCollector(boneCollector, timeDiff) {

    if (boneCollector.target && !(boneCollector.target.graveyard && boneCollector.state == this.states.collecting))
      this.updateSpeed(boneCollector, timeDiff);

    switch(boneCollector.state) {

      case this.states.collecting:
        
        if (!boneCollector.target || boneCollector.target.collected || !boneCollector.target.visible) {
          this.findNearestBone(boneCollector);
        }
        if (boneCollector.target && !boneCollector.target.collected) {
          if (this.fastDistance(boneCollector.position.x, boneCollector.position.y, boneCollector.target.x, boneCollector.target.y) < this.collectDistance) {
            boneCollector.bones++;
            boneCollector.target.collected = true;
            boneCollector.speedFactor = 0;
          }
        }
        if (boneCollector.bones >= GameModel.boneCollectorCapacity || !boneCollector.target) {
          boneCollector.state = this.states.returning;
          boneCollector.target = Graveyard.sprite;
          return;
        }
        break;

      case this.states.returning:
        if (!boneCollector.target) {
          boneCollector.target = Graveyard.sprite;
        }
        if (this.fastDistance(boneCollector.position.x, boneCollector.position.y, boneCollector.target.x, boneCollector.target.y) < this.collectDistance) {
          boneCollector.target = false;
          GameModel.addBones(boneCollector.bones);
          boneCollector.bones = 0;
          boneCollector.state = this.states.collecting;
          boneCollector.speedFactor = 0;
        }
        break;
    }
  },

  updateSpeed(boneCollector, timeDiff) {

    boneCollector.speedFactor = Math.min(1, boneCollector.speedFactor += timeDiff * 3);

    var xVector = boneCollector.target.x - boneCollector.x;
    var yVector = boneCollector.target.y - boneCollector.y;
    var ax = Math.abs(xVector);
    var ay = Math.abs(yVector);
    if (Math.max(ax, ay) == 0)
      return;
    var ratio = 1 / Math.max(ax, ay);
    ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289);
    
    boneCollector.xSpeed = xVector * ratio * this.maxSpeed * boneCollector.speedFactor;
    boneCollector.ySpeed = yVector * ratio * this.maxSpeed * boneCollector.speedFactor;

    boneCollector.position.x += boneCollector.xSpeed * timeDiff;
    boneCollector.position.y += boneCollector.ySpeed * timeDiff;
    boneCollector.zIndex = boneCollector.position.y;
  }
};

Harpies = {
  model:GameModel,
  sprites:[],
  bombSprites : [],
  discardedBombSprites : [],
  bombHeight:100,
  textures:false,
  scaling:2.5,
  fastDistance : fastDistance,

  states : {
    bombing : "bombing",
    returning : "returning"
  },

  populate() {
    if (!this.textures) {
      this.textures = [];
      for (var i = 0; i < 2; i++) {
        this.textures.push(PIXI.Texture.from("harpy" + (i + 1) + ".png"));
      }
      this.bombTexture = PIXI.Texture.from("harpybomb.png")
    }
    if (typeof this.model.persistentData.harpies === 'undefined') {
      this.model.persistentData.harpies = 0;
    }

    for (var i = 0; i < this.sprites.length; i++) {
      this.sprites[i].target = false;
      this.sprites[i].position = {x:Graveyard.sprite.x,y:Graveyard.sprite.y - this.bombHeight};
      this.sprites[i].state = this.states.returning;
    }

    for (var i = 0; i < this.bombSprites.length; i++) {
      this.bombSprites[i].visible = false;
    }
  },

  addAndRemoveHarpies() {
    if (this.sprites.length > this.model.persistentData.harpies) {
      var harpy = this.sprites.pop();
      harpy.target = false;
      if (harpy.bomb) {
        harpy.bomb.dropped = true;
        harpy.bomb.floor = harpy.bomb.y + this.bombHeight;
      }
      foregroundContainer.removeChild(harpy);
    }
    if (this.sprites.length < this.model.persistentData.harpies) {
      var sprite = new PIXI.AnimatedSprite(this.textures);
      sprite.animationSpeed = 0.2;
      sprite.anchor = {x:0.5,y:1};
      sprite.position = {x:Graveyard.sprite.x,y:Graveyard.sprite.y - this.bombHeight};
      sprite.zIndex = sprite.position.y;
      sprite.visible = true;
      sprite.scale = {x:Math.random() > 0.5 ? this.scaling : -1 * this.scaling, y:this.scaling};
      sprite.xSpeed = 0;
      sprite.ySpeed = 0;
      sprite.speedFactor = 0;
      sprite.state = this.states.returning;
      sprite.play();
      this.sprites.push(sprite);
      foregroundContainer.addChild(sprite);
    }
  },

  update(timeDiff) {
    for (var i=0; i < this.sprites.length; i++) {
      this.updateHarpy(this.sprites[i], timeDiff);
    }
    for (var i=0; i < this.bombSprites.length; i++) {
      if (this.bombSprites[i].visible)
        this.updateBomb(this.bombSprites[i], timeDiff);
    }
  },

  updateBomb(bomb, timeDiff) {
    if (bomb.dropped) {
      bomb.rotation += timeDiff * bomb.rotSpeed;
      bomb.ySpeed += timeDiff * 50;
      bomb.scale.x = bomb.scale.y -= timeDiff * 0.2;
      bomb.y += bomb.ySpeed * timeDiff;
      if (bomb.y >= bomb.floor - 2) {
        bomb.visible = false;
        this.discardedBombSprites.push(bomb);
        if (bomb.fire) {
          Humans.burnHuman(bomb.target, this.model.zombieHealth * 0.1);
        }
        Zombies.causePlagueExplosion(bomb, this.model.zombieHealth * 0.2, false);
      }
    } else {
      bomb.x = bomb.harpy.x;
      bomb.y = bomb.harpy.y;
    }
  },

  updateHarpy(harpy, timeDiff) {
    switch (harpy.state) {
      case this.states.bombing:

        if (!harpy.target || harpy.target.graveyard || harpy.target.dead) {
          if (this.model.tankBuster && this.model.isBossStage(this.model.level) && Tanks.aliveTanks.length > 0) {
            harpy.target = getRandomElementFromArray(Tanks.aliveTanks, Math.random());
            harpy.bomb.fire = true;
          } else {
            for (var i = 0; i < 8; i++) {
              harpy.target = getRandomElementFromArray(Humans.aliveHumans, Math.random());
              if (!harpy.target || (this.fastDistance(harpy.x, harpy.y, harpy.target.x, harpy.target.y - this.bombHeight) < 500)) {
                break;
              }
            }
            
            harpy.bomb.fire = false;
          }
        }

        if (!harpy.target) {
          harpy.state = this.states.returning;
          return;
        }
          

        if (this.fastDistance(harpy.x, harpy.y, harpy.target.x, harpy.target.y - this.bombHeight) < 10) {
          harpy.bombs--;
          harpy.bomb.dropped = true;
          harpy.bomb.floor = harpy.target.y;
          harpy.bomb.target = harpy.target;
          harpy.bomb = false;
          harpy.speedFactor = 0;
          harpy.target = false;
          if (harpy.bombs <= 0) {
            harpy.state = this.states.returning;
          } else {
            this.getBomb(harpy);
          }
          
        } else {
          this.updateHarpySpeed(harpy, timeDiff);
        }

        break;
      case this.states.returning:
      
        if (!harpy.target) {
          harpy.target = Graveyard.sprite;
        }

        if (this.fastDistance(harpy.x, harpy.y, harpy.target.x, harpy.target.y - this.bombHeight) < 10) {
          harpy.bombs = this.model.harpyBombs;
          this.getBomb(harpy);
          harpy.state = this.states.bombing;
          harpy.speedFactor = 0;
        } else {
          this.updateHarpySpeed(harpy, timeDiff);
        }

        break;
    }
  },

  getBomb(harpy) {
    var bomb;
    if (this.discardedBombSprites.length > 0) {
      bomb = this.discardedBombSprites.pop();
    } else {
      bomb = new PIXI.Sprite(this.bombTexture);
      this.bombSprites.push(bomb);
      foregroundContainer.addChild(bomb);
      bomb.anchor = {x:0.5,y:0.5};
    }
    bomb.scale.x = bomb.scale.y = 2;
    bomb.rotation = 0;
    bomb.rotSpeed = Math.random() > 0.5 ? 4 : -4;
    bomb.ySpeed = 0;
    bomb.visible = true;
    bomb.dropped = false;
    bomb.harpy = harpy;
    harpy.bomb = bomb;
  },

  updateHarpySpeed(harpy, timeDiff) {
    harpy.speedFactor = Math.min(1, harpy.speedFactor += timeDiff * 2);

    var xVector = harpy.target.x - harpy.x;
    var yVector = (harpy.target.y - this.bombHeight) - harpy.y;
    var ax = Math.abs(xVector);
    var ay = Math.abs(yVector);
    if (Math.max(ax, ay) == 0)
      return;
    var ratio = 1 / Math.max(ax, ay);
    ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289);
    
    harpy.xSpeed = xVector * ratio * this.model.harpySpeed * harpy.speedFactor;
    harpy.ySpeed = yVector * ratio * this.model.harpySpeed * harpy.speedFactor;

    harpy.position.x += harpy.xSpeed * timeDiff;
    harpy.position.y += harpy.ySpeed * timeDiff;
    harpy.scale.x = harpy.xSpeed > 0 ? this.scaling : -1 * this.scaling;
  }
};