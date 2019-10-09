var canvas;
var renderer;
var gameContainer,backgroundContainer,characterContainer,uiContainer;
var grass;
var canvasSize = {x:800,y:600};
var gameFieldSize = {x:600,y:600};

function onDragStart(event) {
  this.data = event.data;
  this.dragging = true;
  this.dragOffset = this.data.getLocalPosition(this);
  this.dragOffset.x *= this.scale.x;
  this.dragOffset.y *= this.scale.y;
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
      if (distanceBetweenPoints(this.x, this.y, newPosition.x - this.dragOffset.x, newPosition.y - this.dragOffset.y) >= 1) {
        this.x = newPosition.x - this.dragOffset.x;
        this.y = newPosition.y - this.dragOffset.y;
        preventGameContainerLeavingBounds(this);
        this.hasMoved = true;
      }
  }
}

function preventGameContainerLeavingBounds(gc) {
  if (gc.x > canvasSize.x * 0.5)
    gc.x = canvasSize.x * 0.5;
  if (gc.x + gc.width < canvasSize.x * 0.5)
    gc.x = canvasSize.x * 0.5 - gc.width;
  if (gc.y > canvasSize.y * 0.5)
    gc.y = canvasSize.y * 0.5;
  if (gc.y + gc.height < canvasSize.y * 0.5)
    gc.y = canvasSize.y * 0.5 - gc.height;
}

function onClickTap(event) {
  if (!this.hasMoved && GameModel.currentState == GameModel.states.playingLevel) {
    Zombies.spawnZombie(event.data.getLocalPosition(this).x, event.data.getLocalPosition(this).y);
  }
  this.hasMoved = false;
}

function zoom(change, coords) {

  var gc = gameContainer;

  if (!coords) {
    coords = {x:canvasSize.x * 0.5, y:canvasSize.y * 0.5};
  }

  var gcWidth = gc.width;
  var gcHeight = gc.height;

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
    gc.scale.x = gc.scale.y = gc.scale.x * 1.1;
    Zombies.zombieCursor.scale.x = Zombies.zombieCursor.scale.y = Zombies.zombieCursor.scale.x * 1.1
  } else {
    if (gc.scale.x > 0.15) {
      gc.scale.x = gc.scale.y = gc.scale.x * 0.9;
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

  if (event.deltaY < 0)
    zoom(+1, coords);
  else
    zoom(-1, coords);
}

function setupContainers(app) {
  gameContainer = new PIXI.Container();
  backgroundContainer = new PIXI.Container();
  characterContainer = new PIXI.Container();
  characterContainer.sortableChildren = true;
  uiContainer = new PIXI.Container();

  gameContainer.addChild(backgroundContainer);
  gameContainer.addChild(characterContainer);

  app.stage.addChild(gameContainer);
  app.stage.addChild(uiContainer);

  gameContainer.interactive = true;
  gameContainer.on('pointerdown', onDragStart);
  gameContainer.on('pointerup', onDragEnd);
  gameContainer.on('pointerupoutside', onDragEnd);
  gameContainer.on('pointermove', onDragMove);
  gameContainer.on('click', onClickTap);
  gameContainer.on('tap', onClickTap);
  document.getElementsByTagName('canvas')[0].onwheel = onWheel;
}

function centerGameContainer() {
  gameContainer.scale.x = canvasSize.defaultScale;
  gameContainer.scale.y = canvasSize.defaultScale;
  gameContainer.x = (canvasSize.x - gameContainer.width) / 2;
  gameContainer.y = (canvasSize.y - gameContainer.height) / 2;
  if (Zombies.zombieCursor)
    Zombies.zombieCursor.scale.x = Zombies.zombieCursor.scale.y = Zombies.zombieCursorScale * canvasSize.defaultScale;
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

var debug = false;
var frames = 0;
var timeSinceLastFrameCount = 1;

function update(timeDiff) {
  scrollGameContainer(timeDiff);
  Graveyard.update(timeDiff);
  Humans.update(timeDiff);
  Zombies.update(timeDiff);
  Blood.update(timeDiff);
  Bullets.update(timeDiff);
  Exclamations.update(timeDiff);

  if (GameModel.showfps) {
    frames++;
    timeSinceLastFrameCount -= timeDiff;
    if (timeSinceLastFrameCount < 0) {
      GameModel.frameRate = frames;
      frames = 0;
      timeSinceLastFrameCount = 1;
    }
  }
}

function setGameFieldSizeForLevel() {
  var size = Math.min(500 + (GameModel.level * 50), 1500);
  gameFieldSize = {
    x:size,
    y:size
  };
  grass.width = gameFieldSize.x;
  grass.height = gameFieldSize.y;
}

function startGame() {

  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

  const app = new PIXI.Application({
    width: canvasSize.x, height: canvasSize.y, backgroundColor: 0x104510, resolution: GameModel.persistentData.resolution || 1, antialias:false, resizeTo: window
  });
  document.body.appendChild(app.view);

  setupContainers(app);

  app.loader
    .add('sprites/grass.png')
    .add('sprites/graveyard.png')
    .add('sprites/buildings.json')
    .add('sprites/humans.json')
    .add('sprites/cop.json')
    .add('sprites/army.json')
    .add('sprites/zombie.json')
    .add('sprites/bonecollector.json')
    .add('sprites/objects.json')
    .load(function(){

    grass = new PIXI.TilingSprite(PIXI.Texture.from('sprites/grass.png'));
    grass.width = gameFieldSize.x;
    grass.height = gameFieldSize.y;
    backgroundContainer.addChild(grass);

    GameModel.setupLevel();
    
    setGameFieldSizeForLevel();

    Blood.initialize();
    Bullets.initialize();
    Exclamations.initialize();
    centerGameContainer();
    GameModel.app = app;

    // Listen for animate update
    app.ticker.add((delta) => {
      update(app.ticker.deltaMS / 1000);
    });
  });
}

function setSizes() {
  canvasSize = {
    x: document.body.clientWidth, 
    y: document.body.clientHeight,
    defaultScale: Math.max(document.body.clientWidth, document.body.clientHeight) / 1000
  };
  KeysPressed.scrollSpeed = Math.max(document.body.clientWidth, document.body.clientHeight) / 4;
}


window.onload = function() {
  GameModel.loadData();
  setSizes()
  startGame();
};

window.onresize = function() {
  setSizes();
}

KeysPressed = {
  scrollSpeed:200,
  w:false,
  a:false,
  s:false,
  d:false
}

window.onblur = function() {
  KeysPressed.w = KeysPressed.a = KeysPressed.s = KeysPressed.d = false;
};

window.onkeydown = function (e) {
	switch (e.keyCode) {
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