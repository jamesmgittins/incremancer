Graveyard = {

  sprite : false,

  initialize() {

    if (typeof GameModel.persistentData.graveyardZombies == 'undefined') {
      GameModel.persistentData.graveyardZombies = 1;
    }

    if (!this.sprite) {
      this.sprite = new PIXI.TilingSprite(PIXI.Texture.from('sprites/graveyard2.png'));
      this.sprite.width = 32;
      this.sprite.height = 32;
      this.sprite.anchor = {x:0.5, y:0.5};
      this.sprite.scale = {x:2,y:2};
      this.sprite.zIndex = 0;
      this.sprite.visible = false;
      this.sprite.graveyard = true;
      characterContainer.addChild(this.sprite);
    }

    this.sprite.x = gameFieldSize.x / 2;
    this.sprite.y = gameFieldSize.y / 2;

    Bones.initialize();
    BoneCollectors.populate();
  },

  update(timeDiff) {
    if (!GameModel.graveyard || GameModel.currentState != GameModel.states.playingLevel)
      return;

    this.sprite.visible = true;

    if (GameModel.energy >= GameModel.energyMax) {
      for (var i = 0; i < GameModel.persistentData.graveyardZombies; i ++)  {
        Zombies.spawnZombie(this.sprite.x,this.sprite.y);
      }
    }

    Bones.update(timeDiff);
    BoneCollectors.update(timeDiff);
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
  },

  update(timeDiff) {
    if (this.sprites.length > GameModel.persistentData.boneCollectors) {
      characterContainer.removeChild(this.sprites.pop());
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

    if (boneCollector.target)
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