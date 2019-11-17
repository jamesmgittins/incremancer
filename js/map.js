Map = {

  buildings : [],
  buildingsByPopularity : [],
  buildingTextures : false,
  entranceWidth : 16,
  entranceDepth : 16,
  cornerDistance : 14,
  minBuildings: 3,
  wallWidth : 4,
  graveyardCollision : false,

  getRandomBuilding() {
    return getRandomElementFromArray(this.buildingsByPopularity, Math.random());
  },

  roomNoOverlap(position1, position2) {
    var buffer = 50;
    if (position1.x > position2.x + position2.width + buffer || position1.x + position1.width + buffer < position2.x)
      return true;
    if (position1.y > position2.y + position2.height + buffer || position1.y + position1.height + buffer < position2.y)
      return true;
  },

  isValidPosition(position) {

    if (!this.roomNoOverlap(position, this.graveYardPosition))
      return false;

    for (var i=0; i < this.buildings.length; i++) {
      if (!this.roomNoOverlap(position, this.buildings[i]))
        return false;
    }

    return true;
  },

  makeHorizontalWall(walls, texture, hasEntrance, x, y, width) {

    if (hasEntrance) {
      var wall1 = new PIXI.TilingSprite(texture);
      wall1.x = x;
      wall1.y = y;
      wall1.width = width / 2 - this.entranceWidth;
      wall1.height = 4;
      walls.push(wall1);

      var wall2 = new PIXI.TilingSprite(texture);
      wall2.x = x + (width / 2) + this.entranceWidth;
      wall2.y = y;
      wall2.width = (width / 2) - this.entranceWidth;
      wall2.height = 4;
      walls.push(wall2);
    } else {
      var wall = new PIXI.TilingSprite(texture);
      wall.x = x;
      wall.y = y;
      wall.width = width;
      wall.height = 4;
      walls.push(wall);
    }
  },

  makeVerticalWall(walls, texture, hasEntrance, x, y, height) {

    if (hasEntrance) {
      var wall1 = new PIXI.TilingSprite(texture);
      wall1.x = x;
      wall1.y = y;
      wall1.width = 4;
      wall1.height = height / 2 - this.entranceWidth;
      walls.push(wall1);

      var wall2 = new PIXI.TilingSprite(texture);
      wall2.x = x;
      wall2.y = y + (height / 2) + this.entranceWidth;;
      wall2.width = 4;
      wall2.height = (height / 2) - this.entranceWidth;
      walls.push(wall2);
    } else {
      var wall = new PIXI.TilingSprite(texture);
      wall.x = x;
      wall.y = y;
      wall.width = 4;
      wall.height = height;
      walls.push(wall);
    }
  },

  addBuilding(poi) {
    poi.container = new PIXI.Container();
    poi.floorSprite = new PIXI.TilingSprite(PIXI.Texture.WHITE);
    poi.floorSprite.tint = rgbToHex(10 + Math.round(Math.random() * 50), 10 + Math.round(Math.random() * 50), 10 + Math.round(Math.random() * 50));
    poi.floorSprite.alpha = 0.2;
    // poi.floorSprite.x = poi.x;
    // poi.floorSprite.y = poi.y;
    poi.container.x = poi.x;
    poi.container.y = poi.y;
    poi.floorSprite.width = poi.width;
    poi.floorSprite.height = poi.height;
    // backgroundContainer.addChild(poi.floorSprite);
    poi.container.addChild(poi.floorSprite);

    var possibleEntrances = [
      {
        x: poi.x + poi.width / 2,
        y: poi.y,
        north : true,
        inside : {
          x: poi.x + poi.width / 2,
          y: poi.y + this.entranceDepth,
          entrance:true
        },
        outside : {
          x: poi.x + poi.width / 2,
          y: poi.y - this.entranceDepth,
          entrance:true
        }
      },
      {
        x: poi.x + poi.width / 2,
        y: poi.y + poi.height,
        south : true,
        inside : {
          x: poi.x + poi.width / 2,
          y: poi.y + poi.height - this.entranceDepth,
          entrance:true
        },
        outside : {
          x: poi.x + poi.width / 2,
          y: poi.y + poi.height + this.entranceDepth,
          entrance:true
        }
      },
      {
        x: poi.x,
        y: poi.y + poi.height / 2,
        west : true,
        inside : {
          x: poi.x + this.entranceDepth,
          y: poi.y + poi.height / 2,
          entrance:true
        },
        outside : {
          x: poi.x - this.entranceDepth,
          y: poi.y + poi.height / 2,
          entrance:true
        }
      },
      {
        x: poi.x + poi.width / 2,
        y: poi.y + poi.height / 2,
        east : true,
        inside : {
          x: poi.x + poi.width - this.entranceDepth,
          y: poi.y + poi.height / 2,
          entrance:true
        },
        outside : {
          x: poi.x + poi.width + this.entranceDepth,
          y: poi.y + poi.height / 2,
          entrance:true
        }
      }
    ];
    var closestEntrance;
    var center = {x:gameFieldSize.x / 2, y:gameFieldSize.y / 2};
    var closestDistance = 2000;
    for (var i=0; i < possibleEntrances.length; i++) {
      var distance = fastDistance(possibleEntrances[i].x, possibleEntrances[i].y, center.x, center.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEntrance = possibleEntrances[i];
      }
    }
    poi.entrance = closestEntrance;

    poi.walls = [];
    var wallTexture = getRandomElementFromArray(this.buildingTextures.walls, Math.random());

    // this.makeHorizontalWall(poi.walls, wallTexture, poi.entrance.north, poi.x - 4, poi.y - 4, poi.width + 8);
    // this.makeHorizontalWall(poi.walls, wallTexture, poi.entrance.south, poi.x - 4, poi.y + poi.height, poi.width + 8);
    // this.makeVerticalWall(poi.walls, wallTexture, poi.entrance.west, poi.x - 4, poi.y - 4, poi.height + 8);
    // this.makeVerticalWall(poi.walls, wallTexture, poi.entrance.east, poi.x + poi.width, poi.y - 4, poi.height + 8);

    this.makeHorizontalWall(poi.walls, wallTexture, poi.entrance.north, -4, -4, poi.width + 8);
    this.makeHorizontalWall(poi.walls, wallTexture, poi.entrance.south, -4, poi.height, poi.width + 8);
    this.makeVerticalWall(poi.walls, wallTexture, poi.entrance.west, -4, -4, poi.height + 8);
    this.makeVerticalWall(poi.walls, wallTexture, poi.entrance.east, poi.width, -4, poi.height + 8);

    for (var i=0; i < poi.walls.length; i++) {
      // backgroundContainer.addChild(poi.walls[i]);
      poi.container.addChild(poi.walls[i]);
    }
    poi.container.cacheAsBitmap = true;
    backgroundContainer.addChild(poi.container);

    for (var i=0; i < poi.walls.length; i++) {
      poi.walls[i].collisionX = poi.x + poi.walls[i].x;
      poi.walls[i].collisionY = poi.y + poi.walls[i].y;
      poi.walls[i].collisionWidth = poi.walls[i].width;
      poi.walls[i].collisionHeight = poi.walls[i].height;
    }
  },

  addCorners(building) {
    building.corners = [];
    building.corners.push({ // top left
      x:building.x - this.cornerDistance,
      y:building.y - this.cornerDistance
    });
    building.corners.push({ // top right
      x:building.x + building.width + this.cornerDistance,
      y:building.y - this.cornerDistance
    });
    building.corners.push({ // bottom left
      x:building.x - this.cornerDistance,
      y:building.y + building.height + this.cornerDistance
    });
    building.corners.push({ // bottom right
      x:building.x + building.width + this.cornerDistance,
      y:building.y + building.height + this.cornerDistance
    });
  },

  populatePois() {
    if (!this.buildingTextures) {
      var floors = [];
      var walls = [];
      
      for (var i = 0; i < 2; i++) {
        walls.push(PIXI.Texture.from('floor' + (i + 1) + '.png'));
      }
      for (var i = 0; i < 2; i++) {
        walls.push(PIXI.Texture.from('wall' + (i + 1) + '.png'));
      }
      this.buildingTextures = {
        floors:floors,
        walls:walls
      }
    }

    if (this.buildings.length > 0) {
      for (var i = 0; i < this.buildings.length; i++) {
        backgroundContainer.removeChild(this.buildings[i].container);
        this.buildings[i].container.destroy();
        // backgroundContainer.removeChild(this.buildings[i].floorSprite);
        for (var j=0; j < this.buildings[i].walls.length; j++) {
          // backgroundContainer.removeChild(this.buildings[i].walls[j]);
        }
      }
    }

    var buildingId = 1;

    this.buildingsByPopularity = [];
    this.buildings = [];

    this.graveYardPosition = {
      x:gameFieldSize.x / 2 - 50,
      y:gameFieldSize.y / 2 - 50,
      width: 100, height: 100
    };

    var minBuildings = this.minBuildings;
    var spaceToCreate = Humans.getMaxHumans();
    var areaPerPerson = 500;
    var maxRoomSize = Math.max(Math.min(50, Math.round(spaceToCreate / 3)), 10);
    var minRoomSize = 5;

    if (GameModel.isBossStage(GameModel.level)) {
      spaceToCreate = 0;
      minBuildings = 0;
    }

    while(spaceToCreate > 0 || minBuildings > 0) {
      minBuildings--;
      var personSize = Math.round(minRoomSize + (Math.random() * (maxRoomSize - minRoomSize)));
      var roomSize = Math.sqrt(personSize * areaPerPerson);
      spaceToCreate -= personSize;
      var foundPosition = false;
      var testPosition;

      var counter = 1000;
      var spaceFromEdges = 10;
      while(!foundPosition && counter > 0) {
        counter--;
        testPosition = {
          x: spaceFromEdges + (Math.random() * (gameFieldSize.x - (2 * spaceFromEdges + roomSize))), 
          y: spaceFromEdges + (Math.random() * (gameFieldSize.y - (2 * spaceFromEdges + roomSize))),
          width : roomSize,
          height: roomSize
        };
        foundPosition = this.isValidPosition(testPosition);
      }

      if (foundPosition) {
        var poi = {
          id : buildingId++,
          x: testPosition.x,
          y: testPosition.y,
          width : roomSize,
          height : roomSize
        };
        this.addBuilding(poi);
        var popularity = Math.max(Math.round(roomSize / 10), 1);
        for (var j=0; j<popularity; j++) {
          this.buildingsByPopularity.push(poi);
        }
        this.buildings.push(poi);
        this.addCorners(poi);
      }
    }

    this.populateTrees();
  },

  randomPositionInBuilding(building) {
    if (!building) {
      var xMod = Math.random() > 0.5 ? -1 : 1;
      var yMod = Math.random() > 0.5 ? -1 : 1;
      var x25 = gameFieldSize.x / 4;
      var y25 = gameFieldSize.y / 4;

      if (Math.random() > 0.5) {
        return {
          x: Math.random() * gameFieldSize.x,
          y: (gameFieldSize.y / 2) + (yMod * y25) + (Math.random() * yMod * y25)
        }
      }
      return {
        x: (gameFieldSize.x / 2) + (xMod * x25) + (Math.random() * xMod * x25), 
        y: Math.random() * gameFieldSize.y,
      }
    }
    var wallBuffer = 5;
    return {x:building.x + wallBuffer + (Math.random() * (building.width - wallBuffer * 2)), y: building.y + wallBuffer + (Math.random() * (building.height - wallBuffer * 2))};
  },

  isInsidePoi(x, y, poi, wall = 0) {
    return x > poi.x - wall && x < poi.x + poi.width + wall && y > poi.y - wall && y < poi.y + poi.height + wall;
  },

  wallCollisionBuffer : 3,

  checkWall(wall, start, end, collision) {
    if (start.y > wall.collisionY && start.y < wall.collisionY + wall.collisionHeight) {
      if (start.x < wall.collisionX - this.wallCollisionBuffer && end.x > wall.collisionX - this.wallCollisionBuffer) {
        collision.x = true;
        collision.validX = wall.collisionX - this.wallCollisionBuffer - 1;
      }
      if (start.x > wall.collisionX + wall.collisionWidth + this.wallCollisionBuffer && end.x < wall.collisionX + wall.collisionWidth + this.wallCollisionBuffer) {
        collision.x = true;
        collision.validX = wall.collisionX + wall.collisionWidth + this.wallCollisionBuffer + 1;
      }
    }

    if (start.x > wall.collisionX && start.x < wall.collisionX + wall.collisionWidth) {
      if (start.y < wall.collisionY - this.wallCollisionBuffer && end.y > wall.collisionY - this.wallCollisionBuffer) {
        collision.y = true;
        collision.validY = wall.collisionY - this.wallCollisionBuffer - 1;
      } 
      if (start.y > wall.collisionY + wall.collisionHeight + this.wallCollisionBuffer && end.y < wall.collisionY + wall.collisionHeight + this.wallCollisionBuffer) {
        collision.y = true;
        collision.validY = wall.collisionY + wall.collisionHeight + this.wallCollisionBuffer + 1;
      }
    }
  },

  checkGraveyard(start, end) {
    var collision = {
      x:false, 
      y:false
    };
    if (this.graveyardCollision) {
      this.checkWall(this.graveyardCollision, start, end, collision);
    }
    if (collision.x || collision.y)
      return collision;

    return false;
  },

  checkCollisions(start, end) {
    var closeBuilding = this.findBuilding(start);

    if (!closeBuilding) {
      return this.checkGraveyard(start, end);
    }

    var collision = {
      x:false, 
      y:false
    };

    for (var i = 0; i < closeBuilding.walls.length; i++) {
      this.checkWall(closeBuilding.walls[i], start, end, collision);
    }
    

    return collision;
  },

  fastDistance : fastDistance,

  pathFindStepSize : 5,

  pathStepCalc(start, end) {
    var xVector = end.x - start.x;
    var yVector = end.y - start.y;
    var ax = Math.abs(xVector);
    var ay = Math.abs(yVector);
    if (Math.max(ax, ay) == 0)
      return;
    var ratio = 1 / Math.max(ax, ay);
    ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289);
    
    return {
      x: xVector * ratio * this.pathFindStepSize,
      y: yVector * ratio * this.pathFindStepSize
    };
  },

  isBuildingClose(position, building) {
    return position.x > building.x - this.cornerDistance && 
            position.x < building.x + building.width + this.cornerDistance && 
            position.y > building.y - this.cornerDistance && 
            position.y < building.y + building.height + this.cornerDistance;
  },

  findBuilding(position) {

    if (position.lastKnownBuilding) {
      if(this.isBuildingClose(position, position.lastKnownBuilding)) {
        return position.lastKnownBuilding;
      }
    }

    var buildingsToCheck = this.buildings;

    for (var i = 0; i < buildingsToCheck.length; i++) {
      if (this.isBuildingClose(position, buildingsToCheck[i])) {
        position.lastKnownBuilding = buildingsToCheck[i];
        return position.lastKnownBuilding;
      } 
    }
    position.lastKnownBuilding = false;
    return false;
  },

  normalizeVector(vector) {

    if (vector.x + vector.y == 0) {
      return vector;
    }

    var magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    vector.x /= magnitude;
    vector.y /= magnitude;
    return vector;
  },

  modifyVectorForCollision(vector, building, position) {

    // no building = no collision
    if (!building && !this.graveyardCollision) {
      return this.normalizeVector(vector);
    }

    // check 5 distance from position
    var collision = {x:false, y:false};
    var collisionDistance = 1;

    var end = {
      x:position.x + (vector.x > 0 ? collisionDistance : -collisionDistance),
      y:position.y + (vector.y > 0 ? collisionDistance : -collisionDistance)
    };

    // check all the walls
    if (building) {
      for (var i = 0; i < building.walls.length; i++) {
        this.checkWall(building.walls[i], position, end, collision);
      }
    }

    if (this.graveyardCollision) {
      this.checkWall(this.graveyardCollision, position, end, collision);
    }

    if (collision.x) {
      vector.x = 0;
    }
    if (collision.y) {
      vector.y = 0;
    }
    return this.normalizeVector(vector);
  },

  willVectorHitBuilding(start, end, building) {

    var dx = end.x - start.x;
    var dy = end.y - start.y;

    if (dx < 0 && start.x < building.x - 4)
      return false;
    if (dx > 0 && start.x > building.x + building.width + 4)
      return false;
    if (dy < 0 && start.y < building.y - 4)
      return false;
    if(dy > 0 && start.y > building.y + building.width + 4)
      return false;

    var step = this.pathStepCalc(start, end);
    var stepsToTake = 10;
    var hasHit = false;
    var testPosition = {x:start.x, y:start.y};
    while (!hasHit && stepsToTake > 0) {
      stepsToTake--;
      testPosition.x += step.x;
      testPosition.y += step.y;
      if (this.isInsidePoi(testPosition.x, testPosition.y, building, 4)) {
        hasHit = true;
      }
    }
    return hasHit;
  },

  findNearestCorner(position, corners) {
    var closestCorner = false;
    var closestDistance = 10000;
    for (var i = 0; i < corners.length; i++) {
      var distance = this.fastDistance(position.x, position.y, corners[i].x, corners[i].y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCorner = corners[i];
      }
    }
    return closestCorner;
  },

  findAdjacentCorners(corner, building) {
    var corners = [];
    for (var i = 0; i < building.corners.length; i++) {
      if (building.corners[i].x == corner.x || building.corners[i].y == corner.y) {
        corners.push(building.corners[i]);
      }
    }
    return corners;
  },

  navigateAroundBuilding(position, target, building, distanceToTarget) {

    // if no building return vector
    var vector = {
      x: target.x - position.x,
      y: target.y - position.y,
      distance: distanceToTarget
    };
    if (!building) {
      return this.normalizeVector(vector);
    }

    // am I going to hit this building
    var hitBuilding = this.willVectorHitBuilding(position, target, building);

    // if not return straight to target
    if (!hitBuilding) {
      return this.modifyVectorForCollision(vector, building, position);
    }

    // if I am then find path around
    // check closest corner to target
    var corner = this.findNearestCorner(target, building.corners);
    hitBuilding = this.willVectorHitBuilding(position, corner, building);
    if (!hitBuilding) {
      vector.x = corner.x - position.x;
      vector.y = corner.y - position.y;
      return this.modifyVectorForCollision(vector, building, position);
    }

    // if still hit building then go to my closest adjacent corner
    corner = this.findNearestCorner(position, this.findAdjacentCorners(corner, building));
    vector.x = corner.x - position.x;
    vector.y = corner.y - position.y;
    return this.modifyVectorForCollision(vector, building, position);
  },

  howDoIGetToMyTarget(currentPosition, targetPosition) {

    var distanceToTarget = this.fastDistance(currentPosition.x, currentPosition.y, targetPosition.x, targetPosition.y);
    var closeBuilding = this.findBuilding(currentPosition);
    var insideBuilding = false;
    
    if (closeBuilding) {

      insideBuilding = this.isInsidePoi(currentPosition.x, currentPosition.y, closeBuilding, 0);

      if (insideBuilding) {
        if (this.isInsidePoi(targetPosition.x, targetPosition.y, closeBuilding, 0)) {
          // target in same building as me, just return direction
          return this.modifyVectorForCollision({
            x: targetPosition.x - currentPosition.x,
            y: targetPosition.y - currentPosition.y,
            distance: distanceToTarget
          }, closeBuilding, currentPosition);
        } else {
          // I need to go outside
          return this.modifyVectorForCollision({
            x: closeBuilding.entrance.outside.x - currentPosition.x,
            y: closeBuilding.entrance.outside.y - currentPosition.y,
            distance: distanceToTarget
          }, closeBuilding, currentPosition);
        }
      }
    }

    var targetCloseBuilding = this.findBuilding(targetPosition);
    
    if (targetCloseBuilding) {
      insideBuilding = this.isInsidePoi(targetPosition.x, targetPosition.y, targetCloseBuilding, 0);

      if (insideBuilding) {
        // I need to go inside
        var distanceToEntrance = this.fastDistance(currentPosition.x, currentPosition.y, targetCloseBuilding.entrance.outside.x, targetCloseBuilding.entrance.outside.y);
        if (distanceToEntrance < 30) {
          return this.modifyVectorForCollision({
            x: targetCloseBuilding.entrance.inside.x - currentPosition.x,
            y: targetCloseBuilding.entrance.inside.y - currentPosition.y,
            distance: distanceToTarget
          }, closeBuilding, currentPosition);
        }
        // navigate to entrance
        return this.navigateAroundBuilding(currentPosition, targetCloseBuilding.entrance.outside, closeBuilding, distanceToTarget);
      }
    }


    if (distanceToTarget < 20) {
      // no need to navigate this close, just return direction
      return this.modifyVectorForCollision({
        x: targetPosition.x - currentPosition.x,
        y: targetPosition.y - currentPosition.y,
        distance: distanceToTarget
      }, closeBuilding, currentPosition);
    }

    // navigate to target
    return this.navigateAroundBuilding(currentPosition, targetPosition, closeBuilding, distanceToTarget);
  },

  treeSprites : [],
  treeTextures : [],

  isValidTreePosition(position) {
    if (!this.isValidPosition(position))
      return false;
    for (var i=0; i < this.treeSprites.length; i++) {
      if (this.fastDistance(position.x, position.y, this.treeSprites[i].x, this.treeSprites[i].y) < 25)
        return false;
    }
    return true;
  },
  
  populateTrees() {

    if (this.treeSprites.length > 0) {
      for (var i = 0; i < this.treeSprites.length; i++) {
        characterContainer.removeChild(this.treeSprites[i]);
      }
      this.treeSprites = [];
    }

    if (this.treeTextures.length == 0) {
      for (var i=0; i < 6; i++) {
        this.treeTextures.push(PIXI.Texture.from('tree' + i + '.png'));
      }
    }

    var treesToCreate = Math.round(gameFieldSize.x / 50);

    while(treesToCreate > 0) {
      var foundPosition = false;
      var testPosition;
      var counter = 1000;
      var spaceFromEdges = 8;
      var roomSize = 2;

      while(!foundPosition && counter > 0) {
        counter--;
        testPosition = {
          x: spaceFromEdges + (Math.random() * (gameFieldSize.x - (2 * spaceFromEdges))), 
          y: spaceFromEdges + (Math.random() * (gameFieldSize.y - (2 * spaceFromEdges))),
          width : roomSize,
          height: roomSize
        };
        foundPosition = this.isValidTreePosition(testPosition);
      }

      if (foundPosition) {
        var alivePercent = 0.4 + Math.random() * 0.6;
        if (GameModel.constructions.graveyard) {
          alivePercent = Math.min((this.fastDistance(testPosition.x, testPosition.y, gameFieldSize.x / 2, gameFieldSize.y / 2) - 90) / 400, 1);
        }
        var textureId = (this.treeTextures.length - 1) - Math.round((this.treeTextures.length - 1) * alivePercent);
        var treeSprite = new PIXI.Sprite(this.treeTextures[textureId]);
        treeSprite.anchor = {x:0.5, y:1};
        treeSprite.x = testPosition.x;
        treeSprite.y = testPosition.y;
        treeSprite.zIndex = treeSprite.y;
        treeSprite.scale.x = treeSprite.scale.y = 2;
        treeSprite.scale.x = Math.random() > 0.5 ? treeSprite.scale.x : -1 * treeSprite.scale.x;
        this.treeSprites.push(treeSprite);
        characterContainer.addChild(treeSprite);
      }
      treesToCreate--;
    }
  }
};