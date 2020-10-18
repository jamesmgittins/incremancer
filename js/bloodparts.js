Particles = {
  initialize() {
    Blood.initialize();
    Bullets.initialize();
    Exclamations.initialize();
    Blasts.initialize();
    Smoke.initialize();
    Fragments.initialize();
    PrestigePoints.initialize();
  },
  update(timeDiff) {
    Blood.update(timeDiff);
    Bullets.update(timeDiff);
    Exclamations.update(timeDiff);
    Blasts.update(timeDiff);
    Smoke.update(timeDiff);
    Fragments.update(timeDiff);
    PrestigePoints.update(timeDiff);
  }
}

PrestigePoints = {
  maxParts : 5,
  partCounter : 0,
  container : null,
  sprites : [],
  speed : 20,
  targetElement : null,
  animElement : null,
	initialize() {
    if (!this.container) {
      this.container = new PIXI.Container();
      foregroundContainer.addChild(this.container);
      this.texture = PIXI.Texture.from("pp.png");
    }

    this.targetElement = document.getElementById("prestige-button");
    this.animElement = document.getElementById("prestige-bg");

    if (this.sprites.length < this.maxParts) {
      for (var i = 0; i < this.maxParts; i++) {
        var sprite = new PIXI.Sprite(this.texture);
        sprite.anchor = {x:0.5, y:0.5};
        this.sprites.push(sprite);
        sprite.visible = false;
        this.container.addChild(sprite);
      }
    }
	},
	update(timeDiff) {
    if (!GameModel.persistentData.particles) {
      this.container.visible = false;
      return;
    } else {
      this.container.visible = true;
    }
    var target = {x:0, y:0};
    if (this.targetElement != null) {
      var rect  = this.targetElement.getBoundingClientRect();
      target = {x : rect.x + rect.width / 2, y : rect.y + rect.height / 2};
      target.x -= gameContainer.x;
      target.y -= gameContainer.y;
      target.x = target.x / gameContainer.scale.x;
      target.y = target.y / gameContainer.scale.y;
      
    }
		for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updatePart(this.sprites[i], timeDiff, target);
      }
		}
  },
  updatePart(sprite, timeDiff, target) {
    var vector = ZmMap.normalizeVector({x : target.x - sprite.x, y: target.y - sprite.y});
    var xDiff = (vector.x * 300) - sprite.xSpeed;
    var yDiff = (vector.y * 300) - sprite.ySpeed;
    sprite.xSpeed += xDiff * timeDiff;
    sprite.ySpeed += yDiff * timeDiff;
    sprite.x += sprite.xSpeed * timeDiff;
    sprite.y += sprite.ySpeed * timeDiff;
    if (fastDistance(sprite.x, sprite.y, target.x, target.y) < 30) {
      sprite.visible = false;
      sprite.x = 100;
      sprite.y = 100;
      if (this.animElement) {
        var prestigeBg = this.animElement;
        prestigeBg.classList.toggle("levelup");
        setTimeout(function() {
          prestigeBg.classList.toggle("levelup");
        }, 3000);
      }
    }
  },
  newPart(x,y) {
    if (!this.container.visible) {
      return;
    }
    var sprite = this.sprites[this.partCounter++];
    if (this.partCounter >= this.maxParts) {
      this.partCounter = 0;
    }
    sprite.x = x;
    sprite.y = y - 10;
    sprite.visible = true;
    sprite.scale = {x:2,y:2};
    sprite.xSpeed = 0;
    sprite.ySpeed = -100;
  }
};

Blood = {
  maxParts : 1000,
  partCounter : 0,
  partsPerSplatter : 6,
  ecoPartsPerSplatter : 3,
  container : null,
  sprites : [],
  gravity : 100,
  spraySpeed : 20,
  fadeSpeed : 0.7,
	getTexture(color) {
		var blast = document.createElement('canvas');
		blast.width = 1;
		blast.height = 1;
		var blastCtx = blast.getContext('2d');

		// draw shape
		blastCtx.fillStyle = color;
		blastCtx.fillRect(0, 0, 1, 1);
		return PIXI.Texture.from(blast);
	},
	initialize() {
    this.viewableArea = viewableArea;
    if (!this.container) {
      this.container = new PIXI.Container();
      backgroundSpriteContainer.addChild(this.container);

      this.texture = this.getTexture("#ff0000");
      this.plagueTexture = this.getTexture("#00ff00");
    }

    if (this.sprites.length < this.maxParts) {
      for (var i = 0; i < this.maxParts; i++) {
        var sprite = new PIXI.Sprite(this.texture);
        this.sprites.push(sprite);
        sprite.visible = false;
        if (Math.random() > 0.5)
          sprite.scale = {x:2,y:2};
        this.container.addChild(sprite);
      }
    }
	},
	update(timeDiff) {
    if (!GameModel.persistentData.particles) {
      this.container.visible = false;
      return;
    } else {
      this.container.visible = true;
    }
    this.visibleParts = 0;
		for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updatePart(this.sprites[i], timeDiff);
        this.visibleParts++;
      }
		}
  },
  updatePart(sprite, timeDiff) {
    if (sprite.hitFloor) {
      sprite.alpha -= this.fadeSpeed * timeDiff;
      if (sprite.alpha <= 0) {
        sprite.visible = false;
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
  newPart(x,y, plague) {

    if (this.viewableArea.hideParticle(x,y)) {
      return;
    }
    var sprite = this.sprites[this.partCounter++];
    if (this.partCounter >= this.maxParts) {
      this.partCounter = 0;
    }
    if (plague) {
      sprite.texture = this.plagueTexture;
    } else {
      sprite.texture = this.texture; 
    }
    sprite.x = x;
    sprite.y = y - (8 + Math.random() * 10);
    sprite.floor = y;
    sprite.hitFloor = false;
    sprite.visible = true;
    sprite.alpha = 1;
    sprite.scale = {x:1,y:1};
    if (Math.random() > 0.5)
      sprite.scale = {x:2,y:2};
    var xSpeed = Math.random() * (plague ? this.spraySpeed * 1.5 : this.spraySpeed);
    sprite.xSpeed = Math.random() > 0.5 ? -1 * xSpeed : xSpeed;
    sprite.ySpeed = -1 * (plague ? this.spraySpeed * 1.5 : this.spraySpeed);
  },
  newSplatter(x,y) {
    if (!this.container.visible) {
      return;
    }
    if (this.visibleParts < 0.9 * this.maxParts) {
      for (var i=0; i<this.partsPerSplatter; i++) {
        this.newPart(x, y, false);
      }
    } else {
      for (var i=0; i<this.ecoPartsPerSplatter; i++) {
        this.newPart(x, y, false);
      }
    }
    
  },
  newPlagueSplatter(x,y) {
    if (!this.container.visible) {
      return;
    }
    for (var i=0; i < this.partsPerSplatter; i++) {
      this.newPart(x, y, true);
    }
  }
};

Bones = {
  maxParts : 100,
  partsPerSplatter : 3,
  container : null,
  sprites : [],
  discardedSprites : [],
  uncollected : [],
  gravity : 100,
  spraySpeed : 20,
  fadeTime : 40,
  fadeSpeed : 0.2,
  fadeBones : false,
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

    if (!this.container) {
      this.container = new PIXI.Container();
      backgroundSpriteContainer.addChild(this.container);
      this.texture = this.getTexture();
    }

    for (var i = 0; i < this.sprites.length; i++) {
      this.sprites[i].collected = true;
      this.sprites[i].visible = false;
      this.container.removeChild(this.sprites[i]);
    }

    if (this.sprites.length < this.maxParts) {
      for (var i = 0; i < this.maxParts; i++) {
        var sprite = new PIXI.Sprite(this.texture);
        sprite.visible=false;
        this.sprites.push(sprite);
      }
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
    this.fadeBones = uncollectedBones.length > 200;
  },
  updatePart(sprite, timeDiff) {
    if (sprite.collected) {
      sprite.visible = false;
      this.discardedSprites.push(sprite);
      this.container.removeChild(sprite);
      return;
    }
    if (sprite.hitFloor) {
      
      if (this.fadeBones)
        sprite.fadeTime -= timeDiff;

      if (sprite.fadeTime < 0 && !sprite.collector) {
        sprite.alpha -= this.fadeSpeed * timeDiff;
        if (sprite.alpha <= 0) {
          sprite.visible = false;
          this.discardedSprites.push(sprite);
          this.container.removeChild(sprite);
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
    var sprite;
    if (this.discardedSprites.length > 0) {
      var sprite = this.discardedSprites.pop();
    } else {
      sprite = new PIXI.Sprite(this.texture);
      this.sprites.push(sprite);
    }
    this.container.addChild(sprite);
    sprite.x = x;
    sprite.y = y - (8 + Math.random() * 10);
    sprite.fadeTime = Math.random() * this.fadeTime;
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
  },
  newBones(x,y) {
    if (!GameModel.constructions.graveyard)
      return;
    for (var i=0; i<this.partsPerSplatter; i++) {
      this.newPart(x,y);
    }
  }
};

Exclamations = {
  sprites : [],
  discardedSprites : [],
  maxSprites : 10,
  container:null,
  height:20,
  fadeSpeed:4,

  initialize() {

    if (!this.container) {
      this.container = new PIXI.Container();
      foregroundContainer.addChild(this.container);
  
      this.healTexture = PIXI.Texture.from("healing.png");
      this.exclamationTexture = PIXI.Texture.from("exclamation.png");
      this.radioTexture = PIXI.Texture.from("radio.png");
      this.fireTexture = PIXI.Texture.from("fire.png");
      this.shieldTexture = PIXI.Texture.from("shield.png");
      this.poisonTexture = PIXI.Texture.from("poison.png");
    }
    
    for (var i = 0; i < this.sprites.length; i++) {
      this.container.removeChild(this.sprites[i]);
    }

    if (this.sprites.length < this.maxSprites) {
      for (var i = 0; i < this.maxSprites; i++) {
        var sprite = new PIXI.Sprite(this.exclamationTexture);
        sprite.anchor = {x:0.5,y:1};
        this.sprites.push(sprite);
        sprite.visible = false;
      }
    }
		
    this.discardedSprites = this.sprites.slice();
  },

  newIcon(target, texture, displayTime) {
    if (target.hasIcon)
      return;
    var sprite;
    if (this.discardedSprites.length > 0) {
      sprite = this.discardedSprites.pop();
    } else {
      sprite = new PIXI.Sprite(this.exclamationTexture);
      sprite.anchor = {x:0.5,y:1};
      this.sprites.push(sprite);
    }
    this.container.addChild(sprite);
    sprite.texture = texture;
    sprite.target = target;
    sprite.target.hasIcon = true;
    sprite.x = target.x;
    sprite.y = target.y - this.height;
    sprite.visible = true;
    sprite.time = displayTime;
    sprite.alpha = 1;
    sprite.scale = {x:1.5,y:1.5};
  },

  newHealing(target) {
    this.newIcon(target, this.healTexture, 1);
  },

  newExclamation(target) {
    this.newIcon(target, this.exclamationTexture, 2);
  },

  newRadio(target) {
    this.newIcon(target, this.radioTexture, 3);
  },

  newFire(target) {
    this.newIcon(target, this.fireTexture, 1);
  },

  newShield(target) {
    this.newIcon(target, this.shieldTexture, 1);
  },

  newPoison(target) {
    this.newIcon(target, this.poisonTexture, 1);
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
    sprite.time -= timeDiff;
    if (sprite.time < 0) {
      sprite.alpha -= timeDiff * this.fadeSpeed;
      if (sprite.alpha < 0) {
        sprite.visible = false;
        sprite.target.hasIcon = false;
        this.discardedSprites.push(sprite);
      }
    }
  }
};

Bullets = {
  maxParts : 20,
  speed : 150,
  hitbox : 12,
  sprites : [],
  discardedSprites : [],
  fadeSpeed : 0.2,
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
  getFireballTexture() {
		var blast = document.createElement('canvas');
		blast.width = 8;
		blast.height = 8;
		var blastCtx = blast.getContext('2d');

		var radgrad = blastCtx.createRadialGradient(4, 4, 0, 4, 4, 4);
		radgrad.addColorStop(0, 'rgba(255,255,0,1)');
		radgrad.addColorStop(0.8, 'rgba(255,0,0,0.2)');
		radgrad.addColorStop(1, 'rgba(255,0,0,0)');

		// draw shape
		blastCtx.fillStyle = radgrad;
		blastCtx.fillRect(0, 0, 8, 8);

		return PIXI.Texture.from(blast);
	},
	initialize() {

    if (!this.texture) {
      this.texture = this.getTexture();
      this.fireballTexture = this.getFireballTexture();
    }
    for (var i = 0; i < this.sprites.length; i++) {
      characterContainer.removeChild(this.sprites[i]);
    }

    if (this.sprites.length < this.maxParts) {
      for (var i = 0; i < this.maxParts; i++) {
        var sprite = new PIXI.Sprite(this.texture);
        sprite.scale.x = sprite.scale.y = 2;
        sprite.visible = false;
        this.sprites.push(sprite);
      }
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
    if (fastDistance(sprite.x, sprite.y + 8, sprite.target.x, sprite.target.y) < sprite.hitbox) {
      if (sprite.plague) {
        Zombies.inflictPlague(sprite.target);
        Humans.damageHuman(sprite.target, sprite.damage);
      } else if (sprite.fireball) {
        Humans.burnHuman(sprite.target, sprite.damage);
        Humans.damageHuman(sprite.target, sprite.damage);
      } else {
        if (!sprite.rocket && sprite.target.bulletReflect && Math.random() < sprite.target.bulletReflect) {
          this.newBullet(sprite.target, sprite.source, sprite.damage, false, false, false);
        } else {
          if (sprite.rocket) {
            if (sprite.target.graveyard) {
              Graveyard.damageGraveyard(sprite.damage);
            }
            Army.droneExplosion(sprite.target.x, sprite.target.y, false, sprite.damage);
          } else {
            if (sprite.target.zombie) {
              Zombies.damageZombie(sprite.target, sprite.damage, sprite.source);
            } else {
              Humans.damageHuman(sprite.target, sprite.damage);
            }
          }
        }
      }
      
      sprite.visible = false;
      this.discardedSprites.push(sprite);
      characterContainer.removeChild(sprite);
    } else {
      sprite.x += sprite.xSpeed * timeDiff;
      sprite.y += sprite.ySpeed * timeDiff;
      sprite.zIndex = sprite.y;
    }
    sprite.alpha -= this.fadeSpeed * timeDiff;
    if (sprite.alpha < 0) {
      sprite.visible = false;
      this.discardedSprites.push(sprite);
      characterContainer.removeChild(sprite);
    }
  },
  newBullet(source, target, damage, plague = false, rocket = false, fireball = false) {
    var sprite;
    if (this.discardedSprites.length > 0) {
     sprite = this.discardedSprites.pop();
    } else {
      sprite = new PIXI.Sprite(this.texture);
      sprite.scale.x = sprite.scale.y = 2;
      this.sprites.push(sprite);
    }
    characterContainer.addChild(sprite);
    sprite.texture = fireball ? this.fireballTexture : this.texture;
    sprite.source = source;
    sprite.x = source.x;
    sprite.y = source.y - 8;
    if (plague) {
      sprite.y = source.y - 12;
    }
    sprite.target = target;
    sprite.damage = damage;
    sprite.visible = true;
    sprite.alpha = 1;

    sprite.hitbox = rocket ? this.hitbox * 1.5 : this.hitbox;

    sprite.plague = plague;
    sprite.rocket = rocket;
    sprite.fireball = fireball;
    sprite.tint = plague ? 0x00FF00 : rocket ? 0xFFEC00 : 0xFFFFFF;
    sprite.scale.x = sprite.scale.y = rocket ? 2.5 : 2;
    if (fireball) {
      sprite.scale.x = sprite.scale.y = 1.5;
    }

    var xVector = target.x - sprite.x;
    var yVector = (target.y - 8) - sprite.y;
    var ax = Math.abs(xVector);
    var ay = Math.abs(yVector);
    var ratio = 1 / Math.max(ax, ay);
    ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289);
    
    sprite.xSpeed = xVector * ratio * this.speed;
    sprite.ySpeed = yVector * ratio * this.speed;

    sprite.rotation = Math.atan2(sprite.ySpeed, sprite.xSpeed);
  }
};

Blasts = {
  maxParts:50,
  partCounter:0,
  sprites:[],
	getTexture() {
		var blast = document.createElement('canvas');
		blast.width = 32;
		blast.height = 32;
		var blastCtx = blast.getContext('2d');

		var radgrad = blastCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
		radgrad.addColorStop(0, 'rgba(255,255,255,1)');
		radgrad.addColorStop(0.8, 'rgba(255,255,128,0.2)');
		radgrad.addColorStop(1, 'rgba(255,180,0,0)');

		// draw shape
		blastCtx.fillStyle = radgrad;
		blastCtx.fillRect(0, 0, 32, 32);

		return PIXI.Texture.from(blast);
	},
	initialize() {
    this.viewableArea = viewableArea;
    if (!this.texture) {
      this.texture = this.getTexture();
      this.container = new PIXI.Container();
      foregroundContainer.addChild(this.container);
    }
    
    if (this.sprites.length < this.maxParts) {
      for (var i = 0; i < this.maxParts; i++) {
        var sprite = new PIXI.Sprite(this.texture);
        sprite.scale.x = sprite.scale.y = 2;
        sprite.anchor = {x:0.5, y:0.5};
        sprite.visible = false;
        this.sprites.push(sprite);
        this.container.addChild(sprite);
      }
    }
	},
	update(timeDiff) {
		for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updatePart(this.sprites[i], timeDiff);
      }
		}
  },
  updatePart(sprite, timeDiff) {
    if (sprite.visible) {
      sprite.scale.y -= (10 * timeDiff);
      sprite.scale.x = sprite.scale.y;
      if (sprite.scale.x <= 0) {
        sprite.visible = false;
      }
    }
  },
	newBlast: function(x, y) {
    if (this.viewableArea.hideParticle(x,y)) {
      return;
    }
    var sprite = this.sprites[this.partCounter++];
    if (this.partCounter >= this.maxParts)
      this.partCounter = 0;
      
    sprite.scale.x = sprite.scale.y = 2;
		sprite.visible = true;
		sprite.x = x;
    sprite.y = y;
    Smoke.newCloud(x, y);
  },
  newDroneBlast: function(x, y) {
    var sprite = this.sprites[this.partCounter++];
    if (this.partCounter >= this.maxParts)
      this.partCounter = 0;
      
    sprite.scale.x = sprite.scale.y = 2;
		sprite.visible = true;
		sprite.x = x;
    sprite.y = y;
    Smoke.newDroneCloud(x, y);
	}
};

Smoke = {
  maxParts:1000,
  partCounter:0,
  container:false,
  sprites:[],
  tint:0xFFFFFF,
	getTexture() {
		var size = 8;
    var blast = document.createElement('canvas');
    blast.width = size + 4;
    blast.height = size + 4;
    var blastCtx = blast.getContext('2d');
    blastCtx.shadowBlur = 5;
    blastCtx.shadowColor = "white";
    var radgrad = blastCtx.createRadialGradient(size / 2 + 2, size / 2 + 2, 0, size / 2 + 2, size / 2 + 2, size / 2);
    radgrad.addColorStop(0, 'rgba(255,255,255,0.05)');
    radgrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    radgrad.addColorStop(1, 'rgba(255,255,255,0)');
    blastCtx.fillStyle = radgrad;
    blastCtx.fillRect(0, 0, size + 4, size + 4);
    return PIXI.Texture.from(blast);
	},
	initialize() {
    this.viewableArea = viewableArea;
    this.allowTint = GameModel.app && GameModel.app.renderer && GameModel.app.renderer.type == 1;

    if (!this.texture) {
      this.texture = this.getTexture();
      this.container = new PIXI.Container();

      for (var i = 0; i < this.maxParts; i++) {
        var sprite = new PIXI.Sprite(this.texture);
        sprite.scale.x = sprite.scale.y = 2;
        sprite.anchor = {x:0.5, y:0.5};
        sprite.visible = false;
        this.sprites.push(sprite);
        this.container.addChild(sprite);
      }
      foregroundContainer.addChild(this.container);
    }

	},
	update(timeDiff) {
    if (!GameModel.persistentData.particles) {
      this.container.visible = false;
      return;
    } else {
      this.container.visible = true;
    }
		for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updatePart(this.sprites[i], timeDiff);
      }
		}
  },
  updatePart(sprite, timeDiff) {
    sprite.scale.y -= (1.5 * timeDiff);
    sprite.scale.x = sprite.scale.y;
    sprite.y += sprite.ySpeed;
    if (sprite.scale.x <= 0) {
      sprite.visible = false;
    }
  },
	newSmoke(x, y, variance = 0) {
    if (this.viewableArea.hideParticle(x,y)) {
      return;
    }
    var sprite = this.sprites[this.partCounter++];
    if (this.partCounter >= this.maxParts)
      this.partCounter = 0;
    
    if (this.allowTint) {
      sprite.tint = this.tint;
    }

    var sizeVariance = 0.2;
    sprite.ySpeed = -0.5;
    sprite.scale.x = sprite.scale.y = 1.6 - sizeVariance + (Math.random() * sizeVariance * 2);
		sprite.visible = true;
		sprite.x = x - variance + (Math.random() * variance * 2);
    sprite.y = y - variance + (Math.random() * variance * 2);
  },
  newFireSmoke(x, y) {
    if (!this.container.visible) {
      return;
    }
    this.tint = 0xFFFFFF;
    this.newSmoke(x, y, 3);
  },
  newCloud(x, y) {
    if (!this.container.visible) {
      return;
    }
    this.tint = 0x00FF00;
    for (var i = 0; i < 10; i++) {
      this.newSmoke(x, y, 16);
    }
  },
  newDroneCloud(x, y) {
    if (!this.container.visible) {
      return;
    }
    this.tint = 0xFFFFFF;
    for (var i = 0; i < 10; i++) {
      this.newSmoke(x, y, 24);
    }
  },
  newZombieSpawnCloud(x,y) {
    if (!this.container.visible) {
      return;
    }
    this.tint = 0x00FF00;
    for (var i = 0; i < 5; i++) {
      this.newSmoke(x, y, 6);
    }
  }
};

Fragments = {
  maxParts : 200,
  partCounter : 0,
  partsPerSplatter : 15,
  container : null,
  sprites : [],
  gravity : 100,
  spraySpeed : 50,
  fadeSpeed : 0.7,
	getTexture() {
		var blast = document.createElement('canvas');
		blast.width = 5;
		blast.height = 1;
		var blastCtx = blast.getContext('2d');

		// draw shape
		blastCtx.fillStyle = "#FFFFFF";
		blastCtx.fillRect(0, 0, 5, 1);
		return PIXI.Texture.from(blast);
	},
	initialize() {
    this.viewableArea = viewableArea;
    if (!this.container) {
      this.container = new PIXI.Container();
      backgroundSpriteContainer.addChild(this.container);

      this.texture = this.getTexture("#ff0000");
    }

    if (this.sprites.length < this.maxParts) {
      for (var i = 0; i < this.maxParts; i++) {
        var sprite = new PIXI.Sprite(this.texture);
        this.sprites.push(sprite);
        sprite.visible = false;
        sprite.scale = {x:2,y:2};
        this.container.addChild(sprite);
      }
    }
	},
	update(timeDiff) {
    if (!GameModel.persistentData.particles) {
      this.container.visible = false;
      return;
    } else {
      this.container.visible = true;
    }
    this.visibleParts = 0;
		for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].visible) {
        this.updatePart(this.sprites[i], timeDiff);
        this.visibleParts++;
      }
		}
  },
  updatePart(sprite, timeDiff) {
    if (sprite.hitFloor) {
      sprite.alpha -= this.fadeSpeed * timeDiff;
      if (sprite.alpha <= 0) {
        sprite.visible = false;
      }
    } else {
      sprite.ySpeed += this.gravity * timeDiff;
      sprite.x += sprite.xSpeed * timeDiff;
      sprite.y += sprite.ySpeed * timeDiff;
      if (sprite.y >= sprite.floor) {
        sprite.hitFloor = true;
      }
      sprite.rotation += sprite.rotSpeed * timeDiff;
    }    
  },
  newPart(x, y, tint) {
    if (!this.container.visible) {
      return;
    }
    if (this.viewableArea.hideParticle(x,y)) {
      return;
    }
    var sprite = this.sprites[this.partCounter++];
    if (this.partCounter >= this.maxParts) {
      this.partCounter = 0;
    }
    sprite.texture = this.texture;
    sprite.tint = tint;
    sprite.x = x;
    sprite.y = y - (8 + Math.random() * 10);
    sprite.floor = y;
    sprite.hitFloor = false;
    sprite.visible = true;
    sprite.rotation = Math.random() * 5
    sprite.rotSpeed =  -2 + Math.random() * 4;
    sprite.alpha = 1;
    sprite.scale = {x:2,y:2};
    var xSpeed = Math.random() * this.spraySpeed;
    sprite.xSpeed = Math.random() > 0.5 ? -1 * xSpeed : xSpeed;
    sprite.ySpeed = -1 * (10 + (Math.random() * this.spraySpeed));
  },
  newFragmentExplosion(x, y, tint) {
    if (!this.container.visible) {
      return;
    }
    for (var i=0; i < this.partsPerSplatter; i++) {
      this.newPart(x, y, tint);
    }
  }
};