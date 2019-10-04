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
  this.dragOffset.x *= gameContainer.scale.x;
  this.dragOffset.y *= gameContainer.scale.y;
}

function onDragEnd() {
  this.dragging = false;
  this.data = null;
}

function onDragMove(event) {
  if (Zombies.zombieCursor) {
    Zombies.zombieCursor.position = event.data.getLocalPosition(this.parent);
  }
  if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.parent);
      if (distanceBetweenPoints(this.x, this.y, newPosition.x - this.dragOffset.x, newPosition.y - this.dragOffset.y) >= 1) {
        this.x = newPosition.x - this.dragOffset.x;
        this.y = newPosition.y - this.dragOffset.y;
        if (this.x > canvasSize.x * 0.5)
          this.x = canvasSize.x * 0.5;
        if (this.x + this.width < canvasSize.x * 0.5)
          this.x = canvasSize.x * 0.5 - this.width;
        if (this.y > canvasSize.y * 0.5)
          this.y = canvasSize.y * 0.5;
        if (this.y + this.height < canvasSize.y * 0.5)
          this.y = canvasSize.y * 0.5 - this.height;
        this.hasMoved = true;
      }
  }
}

function onClickTap(event) {
  if (!this.hasMoved && GameModel.currentState == GameModel.states.playingLevel) {
    Zombies.spawnZombie(event.data.getLocalPosition(this).x, event.data.getLocalPosition(this).y);
  }
  this.hasMoved = false;
}

function zoom(change, coords) {

  if (!coords) {
    coords = {x:canvasSize.x * 0.5, y:canvasSize.y * 0.5};
  }

  var centerPosition = {
    x:(coords.x - (gameContainer.x)) / gameContainer.scale.x,
    y:(coords.y * 0.5 - (gameContainer.y)) / gameContainer.scale.y
  };

  if (change > 0) {
    gameContainer.scale.x = gameContainer.scale.y = gameContainer.scale.x + 0.1;
    Zombies.zombieCursor.scale.x = Zombies.zombieCursor.scale.y = Zombies.zombieCursor.scale.x + 0.1;
  } else {
    if (gameContainer.scale.x > 0.15) {
      gameContainer.scale.x = gameContainer.scale.y = gameContainer.scale.x - 0.1;
      Zombies.zombieCursor.scale.x = Zombies.zombieCursor.scale.y = Zombies.zombieCursor.scale.x - 0.1;
    }
  }

  gameContainer.x = coords.x - centerPosition.x * gameContainer.scale.x;
  gameContainer.y = coords.y * 0.5 - centerPosition.y * gameContainer.scale.y;
}

function onWheel(event) {

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
  gameContainer.scale.x = 1;
  gameContainer.scale.y = 1;
  gameContainer.x = (canvasSize.x - gameFieldSize.x) / 2;
  gameContainer.y = (canvasSize.y - gameFieldSize.y) / 2;
}

function update(timeDiff) {
  Graveyard.update(timeDiff);
  Humans.update(timeDiff);
  Zombies.update(timeDiff);
  Blood.update(timeDiff);
  Bullets.update(timeDiff);
  Exclamations.update(timeDiff);
}

function setGameFieldSizeForLevel() {
  var size = Math.min(500 + (GameModel.level * 100), 2000);
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
    width: canvasSize.x, height: canvasSize.y, backgroundColor: 0x104510, resolution: window.devicePixelRatio || 1, antialias:false
  });
  document.body.appendChild(app.view);

  setupContainers(app);

  app.loader
    .add('sprites/grass.png')
    .add('sprites/graveyard.png')
    .add('sprites/whiteguy.json')
    .add('sprites/blackguy.json')
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

    GameModel.loadData();

    setGameFieldSizeForLevel();

    Blood.initialize();
    Bullets.initialize();
    Exclamations.initialize();
    centerGameContainer();

    // Listen for animate update
    app.ticker.add((delta) => {
      update(app.ticker.deltaMS / 1000);
    });
  });
}


window.onload = function() {
  var maxCanvasSize = 1000;
  if (document.body.clientWidth > document.body.clientHeight) {
    canvasSize = {x:maxCanvasSize, y: Math.round(document.body.clientHeight / document.body.clientWidth * maxCanvasSize)};
  } else {
    canvasSize = {x:Math.round(document.body.clientWidth / document.body.clientHeight * maxCanvasSize), y: maxCanvasSize};
  }
  // canvasSize = {x:document.body.clientWidth, y:document.body.clientHeight};
  startGame();
};
