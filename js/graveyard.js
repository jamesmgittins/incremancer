Graveyard = {

  sprite : false,
  fortSprite : false,
  level : 1,
  spikeTimer : 5,
  fenceRadius : 50,
  fastDistance : fastDistance,
  initialize() {

    if (typeof GameModel.persistentData.graveyardZombies == 'undefined') {
      GameModel.persistentData.graveyardZombies = 1;
    }

    this.drawGraveyard();
    this.drawFence();
    Bones.initialize();
    BoneCollectors.populate();
  },

  drawGraveyard() {
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
    this.sprite = new PIXI.Sprite(PIXI.Texture.from(textureName));
    this.sprite.width = 32;
    this.sprite.height = 32;
    this.sprite.anchor = {x:0.5, y:0.5};
    this.sprite.scale = {x:2,y:2};
    this.sprite.visible = false;
    this.sprite.graveyard = true;
    backgroundContainer.addChild(this.sprite);
    this.sprite.x = gameFieldSize.x / 2;
    this.sprite.y = gameFieldSize.y / 2;

    if (fortTexture) {
      this.fortSprite = new PIXI.Sprite(PIXI.Texture.from(fortTexture));
      this.fortSprite.anchor = {x:0.5, y:1};
      this.fortSprite.scale = {x:2,y:2};
      this.fortSprite.x = gameFieldSize.x / 2;
      this.fortSprite.zIndex = this.fortSprite.y = (gameFieldSize.y / 2) + 2;
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

    this.fence.x = gameFieldSize.x / 2;
    this.fence.y = gameFieldSize.y / 2;
  },

  update(timeDiff) {
    BoneCollectors.addAndRemoveBoneCollectors();
    
    if (!GameModel.constructions.graveyard || GameModel.currentState != GameModel.states.playingLevel) {
      this.sprite.visible = false;
      return;
    }

    if (this.level < 2 && GameModel.constructions.crypt || this.level < 3 && GameModel.constructions.fort || this.level < 4 && GameModel.constructions.fortress)
      this.drawGraveyard();

    this.sprite.visible = true;
    if (this.fortSprite) {
      this.fortSprite.visible = true;
    }

    if (GameModel.energy >= GameModel.energyMax) {
      for (var i = 0; i < GameModel.persistentData.graveyardZombies; i ++)  {
        Zombies.spawnZombie(this.sprite.x,this.sprite.y);
      }
    }

    Bones.update(timeDiff);
    BoneCollectors.update(timeDiff);

    if(!GameModel.constructions.fence || GameModel.currentState != GameModel.states.playingLevel) {
      this.fence.visible = false;
    } else {
      this.fence.visible = true;
      if (this.fenceRadius !== GameModel.fenceRadius) {
        this.drawFence();
      }
    }

    this.updatePlagueSpikes(timeDiff);
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
              }
            }
          }
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
    if (!this.texture) {
      this.texture = [];
      for (var i=0; i < 2; i++) {
        this.texture.push(PIXI.Texture.from('bonecollector' + (i + 1) + '.png'))
      }
    }
    for (var i = 0; i < this.sprites.length; i++) {
      this.sprites[i].boneList = false;
    }
  },

  addAndRemoveBoneCollectors() {
    if (this.sprites.length > GameModel.persistentData.boneCollectors) {
      var boneCollector = this.sprites.pop();
      for (var i = 0; i < boneCollector.boneList.length; i++){
        boneCollector.boneList[i].collector = false;
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
        for (var i=0; i < Bones.uncollected.length; i++) {
          if (!Bones.uncollected[i].collected && !Bones.uncollected[i].collector) {
            var distance = this.fastDistance(x, y, Bones.uncollected[i].x, Bones.uncollected[i].y);
            if (distance < distanceToNearest) {
              distanceToNearest = distance;
              nearestBone = Bones.uncollected[i];
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

    boneCollector.speedFactor = Math.min(1, boneCollector.speedFactor += timeDiff * 2);
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