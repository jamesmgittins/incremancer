Blood = {
  maxParts : 1000,
  partsPerSplatter : 10,
  container : null,
  sprites : [],
  discardedSprites : [],
  gravity : 100,
  spraySpeed : 20,
  fadeSpeed : 0.2,
	getTexture() {
		var blast = document.createElement('canvas');
		blast.width = 1;
		blast.height = 1;
		var blastCtx = blast.getContext('2d');

		// draw shape
		blastCtx.fillStyle = "#ff0000";
		blastCtx.fillRect(0, 0, 1, 1);
		return PIXI.Texture.from(blast);
	},
	initialize() {

    this.container = new PIXI.Container();
    backgroundContainer.addChild(this.container);

    this.texture = this.getTexture();

		for (var i = 0; i < this.maxParts; i++) {

      var sprite = new PIXI.Sprite(this.texture);
      this.container.addChild(sprite);
      sprite.visible=false;
      this.sprites.push(sprite);
    }
    this.discardedSprites = this.sprites.slice();
	},
	update(timeDiff) {
		for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updatePart(this.sprites[i], timeDiff);
      }
		}
  },
  updatePart(sprite, timeDiff) {
    if (sprite.hitFloor) {
      sprite.alpha -= this.fadeSpeed * timeDiff;
      if (sprite.alpha <= 0) {
        sprite.visible = false;
        this.discardedSprites.push(sprite);
      }
    } else {
      sprite.ySpeed += this.gravity * timeDiff;
      sprite.x += sprite.xSpeed * timeDiff;
      sprite.y += sprite.ySpeed * timeDiff;
      if (sprite.y >= sprite.floor) {
        sprite.hitFloor = true;
      }
    }
    
  },
  newPart(x,y) {
    if (this.discardedSprites.length > 0) {
      var sprite = this.discardedSprites.pop();
      sprite.x = x;
      sprite.y = y - (8 + Math.random() * 10);
      sprite.floor = y;
      sprite.hitFloor = false;
      sprite.visible = true;
      sprite.alpha = 1;
      sprite.scale = {x:1,y:1};
      if (Math.random() > 0.5)
        sprite.scale = {x:2,y:2};
      var xSpeed = Math.random() * this.spraySpeed;
      sprite.xSpeed = Math.random() > 0.5 ? -1 * xSpeed : xSpeed;
      sprite.ySpeed = -1 * this.spraySpeed;
    }
  },
  newSplatter(x,y) {
    for (var i=0; i<this.partsPerSplatter; i++) {
      this.newPart(x,y);
    }
  }
};

Bones = {
  maxParts : 1000,
  partsPerSplatter : 3,
  container : null,
  sprites : [],
  discardedSprites : [],
  uncollected : [],
  gravity : 100,
  spraySpeed : 20,
  fadeTime : 15,
  fadeSpeed : 0.2,
	getTexture() {
		var blast = document.createElement('canvas');
		blast.width = 4;
		blast.height = 1;
		var blastCtx = blast.getContext('2d');

		// draw shape
		blastCtx.fillStyle = "#dddddd";
		blastCtx.fillRect(0, 0, 4, 1);
		return PIXI.Texture.from(blast);
	},
	initialize() {

    for (var i = 0; i < this.sprites.length; i++) {
      this.sprites[i].collected = true;
      this.sprites[i].visible = false;
    }
    if (this.container)
      return;

    this.container = new PIXI.Container();
    backgroundContainer.addChild(this.container);

    this.texture = this.getTexture();

		for (var i = 0; i < this.maxParts; i++) {

      var sprite = new PIXI.Sprite(this.texture);
      this.container.addChild(sprite);
      sprite.visible=false;
      this.sprites.push(sprite);
    }
    this.discardedSprites = this.sprites.slice();
	},
	update(timeDiff) {
    var uncollectedBones = [];
		for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updatePart(this.sprites[i], timeDiff);
        uncollectedBones.push(this.sprites[i]);
      }
    }
    this.uncollected = uncollectedBones;
  },
  updatePart(sprite, timeDiff) {
    if (sprite.collected) {
      sprite.visible = false;
      this.discardedSprites.push(sprite);
      return;
    }
    if (sprite.hitFloor) {
      
      sprite.fadeTime -= timeDiff;

      if (sprite.fadeTime < 0) {
        sprite.collector = true;
        sprite.alpha -= this.fadeSpeed * timeDiff;
        if (sprite.alpha <= 0) {
          sprite.visible = false;
          this.discardedSprites.push(sprite);
        }
      }
      
    } else {
      sprite.ySpeed += this.gravity * timeDiff;
      sprite.rotation += sprite.rotSpeed * timeDiff;
      sprite.x += sprite.xSpeed * timeDiff;
      sprite.y += sprite.ySpeed * timeDiff;
      if (sprite.y >= sprite.floor) {
        sprite.hitFloor = true;
      }
    }
    
  },
  newPart(x,y) {
    if (this.discardedSprites.length > 0) {
      var sprite = this.discardedSprites.pop();
      sprite.x = x;
      sprite.y = y - (8 + Math.random() * 10);
      sprite.fadeTime = this.fadeTime;
      sprite.rotation = Math.random() * 5
      sprite.rotSpeed =  -2 + Math.random() * 4;
      sprite.floor = y;
      sprite.hitFloor = false;
      sprite.collected = false;
      sprite.collector = false;
      sprite.visible = true;
      sprite.alpha = 1;
      sprite.scale = {x:1,y:1};
      if (Math.random() > 0.5)
        sprite.scale = {x:1.5,y:1.5};
      var xSpeed = Math.random() * this.spraySpeed;
      sprite.xSpeed = Math.random() > 0.5 ? -1 * xSpeed : xSpeed;
      sprite.ySpeed = -1 * this.spraySpeed;
    }
  },
  newBones(x,y) {
    if (GameModel.graveyard == 0)
      return;
    for (var i=0; i<this.partsPerSplatter; i++) {
      this.newPart(x,y);
    }
  }
};

Exclamations = {
  sprites : [],
  discardedSprites : [],
  maxSprites : 50,
  container:null,
  exclamationTexture:null,
  radioTexture:null,
  height:20,
  displayTime:2,
  fadeSpeed:4,

  initialize() {
    this.container = new PIXI.Container();
    characterContainer.addChild(this.container);

    this.exclamationTexture = PIXI.Texture.from("exclamation.png");
    this.radioTexture = PIXI.Texture.from("radio.png");

		for (var i = 0; i < this.maxSprites; i++) {

      var sprite = new PIXI.Sprite(this.exclamationTexture);
      this.container.addChild(sprite);
      sprite.visible=false;
      sprite.anchor = {x:0.5,y:1};
      this.sprites.push(sprite);
    }
    this.discardedSprites = this.sprites.slice();
  },

  newExclamation(target) {
    if (this.discardedSprites.length > 0) {
      var sprite = this.discardedSprites.pop();
      sprite.texture = this.exclamationTexture;
      sprite.target = target;
      sprite.x = target.x;
      sprite.y = target.y - this.height;
      sprite.visible = true;
      sprite.time = this.displayTime;
      sprite.alpha = 1;
      sprite.scale = {x:1.5,y:1.5};
    }
  },

  newRadio(target) {
    if (this.discardedSprites.length > 0) {
      var sprite = this.discardedSprites.pop();
      sprite.texture = this.radioTexture;
      sprite.target = target;
      sprite.x = target.x;
      sprite.y = target.y - this.height;
      sprite.visible = true;
      sprite.time = this.displayTime;
      sprite.alpha = 1;
      sprite.scale = {x:1.5,y:1.5};
    }
  },

  update(timeDiff) {
    for (var i=0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updateSprite(this.sprites[i], timeDiff);
      }
    }
  },

  updateSprite(sprite, timeDiff) {
    sprite.x = sprite.target.x;
    sprite.y = sprite.target.y - this.height;
    sprite.zIndex = sprite.target.y;
    sprite.time -= timeDiff;
    if (sprite.time < 0) {
      sprite.alpha -= timeDiff * this.fadeSpeed;
      if (sprite.alpha < 0) {
        sprite.visible = false;
        this.discardedSprites.push(sprite);
      }
    }
  }
};

Bullets = {
  maxParts : 200,
  speed : 150,
  hitbox : 8,
  container : null,
  sprites : [],
  discardedSprites : [],
	getTexture() {
		var blast = document.createElement('canvas');
		blast.width = 1;
		blast.height = 1;
		var blastCtx = blast.getContext('2d');

		// draw shape
		blastCtx.fillStyle = "#ffffff";
		blastCtx.fillRect(0, 0, 1, 1);
		return PIXI.Texture.from(blast);
	},
	initialize() {

    this.texture = this.getTexture();

		for (var i = 0; i < this.maxParts; i++) {

      var sprite = new PIXI.Sprite(this.texture);
      characterContainer.addChild(sprite);
      sprite.visible=false;
      sprite.scale.x = sprite.scale.y = 2;
      this.sprites.push(sprite);
    }
    this.discardedSprites = this.sprites.slice();
	},
	update(timeDiff) {
		for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updatePart(this.sprites[i], timeDiff);
      }
		}
  },
  updatePart(sprite, timeDiff) {
    if (distanceBetweenPoints(sprite.x, sprite.y + 8, sprite.target.x, sprite.target.y) < this.hitbox) {
      Zombies.damageZombie(sprite.target, sprite.damage);
      sprite.visible = false;
      this.discardedSprites.push(sprite);
    } else {
      sprite.x += sprite.xSpeed * timeDiff;
      sprite.y += sprite.ySpeed * timeDiff;
      sprite.zIndex = sprite.y;
    }

    if (sprite.x > gameContainer.width + 100 || sprite.x < -100 || sprite.y < -100 || sprite.y > gameContainer.height + 100) {
      sprite.visible = false;
      this.discardedSprites.push(sprite);
    }
    
  },
  newBullet(x,y,target,damage) {
    if (this.discardedSprites.length > 0) {
      var sprite = this.discardedSprites.pop();
      sprite.x = x;
      sprite.y = y - 8;
      sprite.target = target;
      sprite.damage = damage;
      sprite.visible = true;
      
      var aimAngle = Math.atan2(x - target.x, target.y - y);
      var bulletSpeed = RotateVector2d(0, this.speed, aimAngle);
      
      sprite.xSpeed = bulletSpeed.x;
      sprite.ySpeed = bulletSpeed.y;
    }
  }
};