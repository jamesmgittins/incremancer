Graveyard = {

  sprite : false,

  initialize() {

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
      Zombies.spawnZombie(this.sprite.x,this.sprite.y);
    }

    Bones.update(timeDiff);
    BoneCollectors.update(timeDiff);
  }
};

BoneCollectors = {

  sprites:[],
  maxSpeed:75,
  texture:false,
  scaling:2,
  collectDistance:10,

  states : {
    collecting:"collecting",
    returning:"returning"
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
    var nearestBone = false;
    var distanceToNearest = 2000;
    for (var i=0; i < Bones.uncollected.length; i++) {
      if (!Bones.uncollected[i].collected && !Bones.uncollected[i].collector) {
        var distance = distanceBetweenPoints(boneCollector.position.x, boneCollector.position.y, Bones.uncollected[i].x, Bones.uncollected[i].y);
        if (distance < distanceToNearest) {
          distanceToNearest = distance;
          nearestBone = Bones.uncollected[i];
        }
      }
    }
    if (nearestBone) {
      boneCollector.target = nearestBone;
      nearestBone.collector = true;
    } else {
      boneCollector.target = false;
    }
  },

  updateBoneCollector(boneCollector, timeDiff) {

    if (boneCollector.target)
      this.updateSpeed(boneCollector, timeDiff);

    switch(boneCollector.state) {

      case this.states.collecting:
        
        if (!boneCollector.target || boneCollector.target.collected || boneCollector.target.graveyard || !boneCollector.target.visible) {
          this.findNearestBone(boneCollector);
        }
        if (boneCollector.target && !boneCollector.target.collected) {
          if (distanceBetweenPoints(boneCollector.position.x, boneCollector.position.y, boneCollector.target.x, boneCollector.target.y) < this.collectDistance) {
            boneCollector.bones++;
            boneCollector.target.collected = true;
            boneCollector.xSpeed = 0;
            boneCollector.ySpeed = 0;
          }
        }
        if (boneCollector.bones >= GameModel.boneCollectorCapacity || !boneCollector.target) {
          boneCollector.state = this.states.returning;
          boneCollector.target = Graveyard.sprite;
          return;
        }
        break;

      case this.states.returning:
        if (distanceBetweenPoints(boneCollector.position.x, boneCollector.position.y, boneCollector.target.x, boneCollector.target.y) < this.collectDistance) {
          boneCollector.xSpeed = 0;
          boneCollector.ySpeed = 0;
          boneCollector.target = false;
          GameModel.addBones(boneCollector.bones);
          boneCollector.bones = 0;
          boneCollector.state = this.states.collecting;
        }
        break;
    }
  },

  updateSpeed(boneCollector, timeDiff) {

    var accelX = boneCollector.target.x - boneCollector.position.x;
    var accelY = boneCollector.target.y - boneCollector.position.y;
    var factor = this.maxSpeed * 2 / (magnitude(accelX, accelY) || 1);
    boneCollector.xSpeed += accelX * factor * timeDiff;
    boneCollector.ySpeed += accelY * factor * timeDiff;
  
    if (magnitude(boneCollector.xSpeed, boneCollector.ySpeed) > this.maxSpeed) {
      boneCollector.xSpeed -= boneCollector.xSpeed * timeDiff * 8;
      boneCollector.ySpeed -= boneCollector.ySpeed * timeDiff * 8;
    }
    boneCollector.position.x += boneCollector.xSpeed * timeDiff;
    boneCollector.position.y += boneCollector.ySpeed * timeDiff;
    boneCollector.zIndex = boneCollector.position.y;
  }
};