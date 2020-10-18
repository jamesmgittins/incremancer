var canvas;
var renderer;
var gameContainer,backgroundContainer,backgroundSpriteContainer,characterContainer,uiContainer,foregroundContainer;
var grass;
var canvasSize = {x:800,y:600};
var gameFieldSize = {x:600,y:600};

function onDragStart(event) {
  this.data = event.data;
  this.dragging = true;
  this.dragOffset = this.data.getLocalPosition(this);
  this.dragOffset.x *= this.scale.x;
  this.dragOffset.y *= this.scale.y;
  this.dragStartX = this.x;
  this.dragStartY = this.y;
  lastDiff = false;
}

function onDragEnd() {
  this.dragging = false;
  this.data = null;
  lastDiff = false;
}

var lastDiff = false;
var lastPinchZoom = 0;

function pinchZoom(event) {
  var curDiff = Math.abs(event.data.originalEvent.touches[0].clientX - event.data.originalEvent.touches[1].clientX);
  if (lastDiff) {
    if (lastPinchZoom + 50 < Date.now() && Math.abs(curDiff - lastDiff) > 10) {
      if (curDiff > lastDiff) {
        zoom(1);
      } else {
        zoom(-1);
      }
      lastPinchZoom = Date.now();
      lastDiff = curDiff;
    }
  } else {
    lastDiff = curDiff;
  }
}

function onDragMove(event) {
  if (Zombies.zombieCursor) {
    Zombies.zombieCursor.position = event.data.getLocalPosition(this.parent);
  }
  if (event.data.originalEvent.touches && event.data.originalEvent.touches.length > 1) {
    pinchZoom(event);
  } else if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.parent);
      this.x = newPosition.x - this.dragOffset.x;
      this.y = newPosition.y - this.dragOffset.y;
      preventGameContainerLeavingBounds(this);
      if (distanceBetweenPoints(this.dragStartX, this.dragStartY, this.x, this.y) > 5) {
        this.hasMoved = true;
      }
  }
}

function preventGameContainerLeavingBounds(gc) {
  var gcWidth = gameFieldSize.x * gc.scale.x;
  var gcHeight = gameFieldSize.y * gc.scale.y;
  if (gc.x > canvasSize.x * 0.5)
    gc.x = canvasSize.x * 0.5;
  if (gc.x + gcWidth < canvasSize.x * 0.5)
    gc.x = canvasSize.x * 0.5 - gcWidth;
  if (gc.y > canvasSize.y * 0.5)
    gc.y = canvasSize.y * 0.5;
  if (gc.y + gcHeight < canvasSize.y * 0.5)
    gc.y = canvasSize.y * 0.5 - gcHeight;
}

function onClickTap(event) {
  if (!this.hasMoved && GameModel.currentState == GameModel.states.playingLevel) {
    if (KeysPressed.shift) {
      Zombies.spawnAllZombies(event.data.getLocalPosition(this).x, event.data.getLocalPosition(this).y);
    } else {
      Zombies.spawnZombie(event.data.getLocalPosition(this).x, event.data.getLocalPosition(this).y);
    }
    
  }
  this.hasMoved = false;
}

function zoom(change, coords) {

  if (lastPinchZoom + 50 > Date.now()) {
    return;
  }
  lastPinchZoom = Date.now();
  var gc = gameContainer;

  if (!coords) {
    coords = {x:canvasSize.x * 0.5, y:canvasSize.y * 0.5};
  }

  var gcWidth = gameFieldSize.x * gc.scale.x;
  var gcHeight = gameFieldSize.y * gc.scale.y;

  if (coords.x > gc.x + gcWidth)
    coords.x = gc.x + gcWidth;
  if (coords.x < gc.x)
    coords.x = gc.x;
  if (coords.y < gc.y)
    coords.y = gc.y;
  if (coords.y > gc.y + gcHeight)
    coords.y = gc.y + gcHeight;

  var centerPosition = {
    x:(coords.x - (gc.x)) / gc.scale.x,
    y:(coords.y - (gc.y)) / gc.scale.y
  };

  if (change > 0) {
    if (gc.scale.x < 10) {
      gc.scale.x = gc.scale.y = gc.scale.x * 1.1;
      if (Zombies.zombieCursor && Zombies.zombieCursor.scale) // .scale is undefined sometimes, don't know why yet
        Zombies.zombieCursor.scale.x = Zombies.zombieCursor.scale.y = Zombies.zombieCursor.scale.x * 1.1
    }
  } else {
    if (Math.max(gcWidth, gcHeight) > Math.min(canvasSize.y, canvasSize.x) * 0.8) {
      gc.scale.x = gc.scale.y = gc.scale.x * 0.9;
      if (Zombies.zombieCursor && Zombies.zombieCursor.scale) // .scale is undefined sometimes, don't know why yet
        Zombies.zombieCursor.scale.x = Zombies.zombieCursor.scale.y = Zombies.zombieCursor.scale.x * 0.9;
    }
  }

  gc.x = coords.x - centerPosition.x * gc.scale.x;
  gc.y = coords.y - centerPosition.y * gc.scale.y;
  preventGameContainerLeavingBounds(gc);
}

function onWheel(event) {
  event.preventDefault();
  var coords = {
    x:event.clientX * (canvasSize.x / document.body.clientWidth),
    y:event.clientY * (canvasSize.y / document.body.clientHeight)
  };

  if (event.deltaY < 0 || event.deltaX < 0)
    zoom(+1, coords);
  else
    zoom(-1, coords);
}

function setupContainers(app) {
  gameContainer = new PIXI.Container();
  backgroundContainer = new PIXI.Container();
  backgroundSpriteContainer = new PIXI.Container();
  characterContainer = new PIXI.Container();
  characterContainer.sortableChildren = true;
  foregroundContainer = new PIXI.Container();
  uiContainer = new PIXI.Container();

  gameContainer.addChild(backgroundContainer);
  gameContainer.addChild(backgroundSpriteContainer);
  gameContainer.addChild(characterContainer);
  gameContainer.addChild(foregroundContainer);

  app.stage.addChild(gameContainer);
  app.stage.addChild(uiContainer);

  gameContainer.interactive = true;
  gameContainer.interactiveChildren = false;

  gameContainer.on('pointerdown', onDragStart);
  gameContainer.on('pointerup', onDragEnd);
  gameContainer.on('pointerupoutside', onDragEnd);
  gameContainer.on('pointermove', onDragMove);
  gameContainer.on('click', onClickTap);
  gameContainer.on('tap', onClickTap);
  document.getElementsByTagName('canvas')[0].onwheel = onWheel;
  document.getElementsByTagName('canvas')[0].oncontextmenu = function(event){
    event.preventDefault();
  };
}

function centerGameContainer(resetZoom = false) {
  if (resetZoom) {
    gameContainer.scale.x = canvasSize.defaultScale;
    gameContainer.scale.y = canvasSize.defaultScale;
    if (Zombies.zombieCursor)
      Zombies.zombieCursor.scale.x = Zombies.zombieCursor.scale.y = Zombies.zombieCursorScale * canvasSize.defaultScale;
  }
  
  gameContainer.x = (canvasSize.x - gameFieldSize.x * gameContainer.scale.x) / 2;
  gameContainer.y = (canvasSize.y - gameFieldSize.y * gameContainer.scale.y) / 2;
}

function scrollGameContainer(timeDiff) {
  var keys = KeysPressed;
  var moved = false;
  var gc = gameContainer;
  if (keys.w) {
    gc.y += keys.scrollSpeed * timeDiff;
    moved = true;
  }
  if (keys.a) {
    gc.x += keys.scrollSpeed * timeDiff;
    moved = true;
  }
  if (keys.s) {
    gc.y -= keys.scrollSpeed * timeDiff;
    moved = true;
  }
  if (keys.d) {
    gc.x -= keys.scrollSpeed * timeDiff;
    moved = true;
  }
  if (moved)
    preventGameContainerLeavingBounds(gc);
}

var viewableArea = {
  x:0,
  y:0,
  width:1000,
  height:1000,
  hideParticle(x, y) {
    if (x < this.x) {
      return true;
    }
    if (y < this.y) {
      return true;
    }
    if (x > this.x + this.width) {
      return true;
    }
    if (y > this.y + this.height) {
      return true;
    }
    return false;
  },
  update() {
    this.x = (-gameContainer.x) / gameContainer.scale.x;
    this.y = (-gameContainer.y) / gameContainer.scale.y;
    this.width = canvasSize.x / gameContainer.scale.x;
    this.height = canvasSize.y / gameContainer.scale.y;
  }
}

var debug = false;
var frames = 0;
var timeSinceLastFrameCount = 1;

function update(timeDiff) {

  if (GameModel.persistentData.showfps) {
    frames++;
    timeSinceLastFrameCount -= timeDiff;
    if (timeSinceLastFrameCount < 0) {
      GameModel.frameRate = frames;
      frames = 0;
      timeSinceLastFrameCount = 1;
    }
  }
  scrollGameContainer(timeDiff);
  viewableArea.update();
  
  timeDiff *= GameModel.gameSpeed;

  Graveyard.update(timeDiff);
  Humans.update(timeDiff);
  Zombies.update(timeDiff);
  Creatures.update(timeDiff);
  Skeleton.update(timeDiff);
  Particles.update(timeDiff);
}

function setGameFieldSizeForLevel() {
  var size = Math.min(500 + (GameModel.level * 50), 1500);
  var shift = Math.random() * size / 3;

  gameFieldSize = {
    x:size + shift,
    y:size - shift
  };
  
  if (grass) {
    grass.width = gameFieldSize.x;
    grass.height = gameFieldSize.y;
  }
  gameContainer.hitArea = new PIXI.Rectangle(0,0,gameFieldSize.x,gameFieldSize.y);
}

function startGame() {

  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

  const app = new PIXI.Application({
    width: canvasSize.x, height: canvasSize.y, backgroundColor: 0x104510, resolution: GameModel.persistentData.resolution || 1, antialias:false, resizeTo: window
  });
  document.body.appendChild(app.view);

  setupContainers(app);

  app.loader
    .add('sprites/ground.json')
    .add('sprites/megagraveyard.png')
    .add('sprites/graveyard.json')
    .add('sprites/buildings.json')
    .add('sprites/humans.json')
    .add('sprites/cop.json')
    .add('sprites/dogs.json')
    .add('sprites/army.json')
    .add('sprites/doctor.json')
    .add('sprites/zombie.json')
    .add('sprites/golem.json')
    .add('sprites/bonecollector.json')
    .add('sprites/harpy.json')
    .add('sprites/objects2.json')
    .add('sprites/fenceposts.json')
    .add('sprites/trees2.json')
    .add('sprites/fortress.json')
    .add('sprites/tank.json')
    .add('sprites/skeleton.json')
    .load(function(){

    GameModel.app = app;

    setGameFieldSizeForLevel();

    grass = new PIXI.TilingSprite(PIXI.Texture.from('grass.png'));
    grass.width = gameFieldSize.x;
    grass.height = gameFieldSize.y;
    backgroundContainer.addChild(grass);

    GameModel.setupLevel();
    

    setTimeout(function(){
      centerGameContainer(true);
    });
    

    // Listen for animate update
    app.ticker.add((delta) => {
      update(app.ticker.deltaMS / 1000);
    });
  });
}

function setSizes() {
  var x = document.body.clientWidth;
  var y = document.body.clientHeight;
  canvasSize = {
    x: x, 
    y: y,
    defaultScale: Math.max(x, y) / 1000
  };
  KeysPressed.scrollSpeed = Math.max(x, y) / 4;
}


window.onload = function() {
  GameModel.loadData();
  GameModel.onReady();
  setSizes()
  startGame();

  if(window.self !== window.top) {
    if (document.referrer != "" &&
    document.referrer.indexOf("kongregate.com") == -1 &&
    document.referrer.indexOf("konggames.com") == -1 &&
    document.referrer.indexOf("gti.nz") == -1) {
      window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    } else {
      if (document.referrer.indexOf("kongregate.com") !== -1 || document.referrer.indexOf("konggames.com") !== -1) {
        kongregateAPI.loadAPI(function(){
          window.kongregate = kongregateAPI.getAPI();
          GameModel.kongregate = true;
          GameModel.loginInUsingPlayFab();
        });
      }
    }
  }

  document.addEventListener("visibilitychange", function(){
    if (document.visibilityState == "hidden") {
      GameModel.hidden = true;
    } else {
      GameModel.hidden = false;
    }
  }, false);
};

window.onresize = function() {
  setSizes();
}

KeysPressed = {
  scrollSpeed:200,
  w:false,
  a:false,
  s:false,
  d:false,
  shift:false
}

window.onblur = function() {
  KeysPressed.w = KeysPressed.a = KeysPressed.s = KeysPressed.d = false;
};

window.onkeydown = function (e) {
	switch (e.keyCode) {
    case 16:
    case 17:
      KeysPressed.shift = true;
      break;
    case 87:
    case 38:
      KeysPressed.w = true;
      break;
    case 65:
    case 37:
      KeysPressed.a = true;
      break;
    case 83:
    case 40:
      KeysPressed.s = true;
      break;
    case 68:
    case 39:
      KeysPressed.d = true;
      break;
    default:
      return true;
	}
	return false;
};
window.onkeyup = function (e) {
	switch (e.keyCode) {
    case 16:
    case 17:
      KeysPressed.shift = false;
      break;
		case 87:
    case 38:
      KeysPressed.w = false;
			break;
		case 65:
    case 37:
      KeysPressed.a = false;
			break;
		case 83:
    case 40:
      KeysPressed.s = false;
			break;
		case 68:
    case 39:
      KeysPressed.d = false;
			break;
		default:
			return true;
	}
	return false;
};
window.addEventListener('beforeinstallprompt', (e) => {
  // Stash the event so it can be triggered later.
  GameModel.deferredPrompt = e;
});