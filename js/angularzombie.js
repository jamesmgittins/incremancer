angular.module('zombieApp', [])
  .filter('decimal', function(){
    return format2Places;
  })
  .filter('whole', function(){
    return formatWhole;
  })
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript|data|blob):/);
  }])
  .controller('ZombieController', ['$scope','$interval','$document',function($scope, $interval, $document) {
    var zm = this;
    zm.model = GameModel;
    zm.spells = Spells;
    zm.keysPressed = KeysPressed;

    zm.messageTimer = 4;
    zm.message = false;
    zm.lastUpdate = 0;
    zm.sidePanels = {};
    zm.upgrades = [];
    zm.currentShopFilter = "blood";
    zm.currentConstructionFilter = "available";
    zm.graveyardTab = "minions";
    zm.trophyTab = "all";
    zm.factoryTab = "parts"
    zm.factoryStats = {};

    zm.closeSidePanels = function() {
      zm.currentShopFilter = "blood";
      zm.currentConstructionFilter = "available";
      zm.graveyardTab = "minions";
      zm.factoryTab = "parts"
      zm.sidePanels.options = false;
      zm.sidePanels.graveyard = false;
      zm.sidePanels.runesmith = false;
      zm.sidePanels.prestige = false;
      zm.sidePanels.construction = false;
      zm.sidePanels.shop = false;
      zm.sidePanels.open = false;
      zm.sidePanels.factory = false;
      zm.levelSelect.shown = false;
    }

    zm.openSidePanel = function(type) {
      zm.closeSidePanels();
      switch (type) {
        case "shop":
          zm.filterShop(zm.currentShopFilter);
          zm.sidePanels.shop = true;
          break;
        case "construction":
          zm.filterConstruction(zm.currentConstructionFilter);
          zm.sidePanels.construction = true;
          break;
        case "graveyard":
          zm.sidePanels.graveyard = true;
          zm.graveyardTab = "minions";
          zm.trophyTab = "all";
          break;
        case "runesmith":
          zm.sidePanels.runesmith = true;
          break;
        case "factory":
          zm.sidePanels.factory = true;
          zm.upgrades = PartFactory.generators;
          zm.factoryStats = PartFactory.factoryStats();
          break;
        case "prestige":
          zm.upgrades = Upgrades.prestigeUpgrades.filter(upgrade => upgrade.cap == 0 || zm.currentRank(upgrade) < upgrade.cap);
          zm.upgrades.push.apply(zm.upgrades, Upgrades.prestigeUpgrades.filter(upgrade => upgrade.cap !== 0 && zm.currentRank(upgrade) >= upgrade.cap));
          zm.sidePanels.prestige = true;
          break;
        case "options":
          zm.sidePanels.options = true;
          zm.model.downloadSaveGame();
          break;
      }
      zm.sidePanels.open = true;
    }

    zm.graveyardTabSelect = function(tab) {
      zm.graveyardTab = tab;
      if (tab == 'trophies') {
        zm.trophies = Trophies.getTrophyList();
        zm.trophyTab = "all";
      }
    }

    zm.trophyTabSelect = function(tab) {
      zm.trophyTab = tab;
      switch(tab) {
        case "all":
          zm.trophies = Trophies.getTrophyList();
          break;
        case "collected":
          zm.trophies = Trophies.getTrophyList().filter(trophy => trophy.owned);
          break;
        case "uncollected":
          zm.trophies = Trophies.getTrophyList().filter(trophy => !trophy.owned);
          break;
        case "totals":
          zm.trophies = Trophies.getTrophyTotals();
          break;
      }
    }

    zm.filterShop = function(type) {
      zm.currentShopFilter = type;
      zm.upgrades = Upgrades.getUpgrades(type);
    }

    zm.filterConstruction = function(type) {
      zm.currentConstructionFilter = type;
      switch(type) {
        case "available":
          zm.upgrades = Upgrades.getAvailableConstructions();
          break;
        case "completed":
          zm.upgrades = Upgrades.getCompletedConstructions();
          break;
      }
    }

    zm.resetGame = function() {
      if (confirm("Are you sure you want to reset everything? If you have a cloud save it will also be deleted. Make sure you export your save game first.")) {
        zm.model.resetData();
      }
    }

    zm.addBoneCollector = function() {
      if (zm.model.getEnergyRate() >= 1)
        zm.model.persistentData.boneCollectors++;
    }

    zm.subtractBoneCollector = function() {
      if (zm.model.persistentData.boneCollectors > 0)
        zm.model.persistentData.boneCollectors--;
    }

    zm.setHarpies = function(number) {
      if ((number >= 0 && number < zm.model.persistentData.harpies) || (zm.model.getEnergyRate() >= 1 && number > 0)) {
        zm.model.persistentData.harpies = number;
      }
    }

    zm.setGraveyardZombies = function(number) {
      if (number <= zm.maxGraveyardZombies() && number >= 0)
        zm.model.persistentData.graveyardZombies = number;
    }

    zm.maxGraveyardZombies = function() {
      return Math.floor(zm.model.energyMax / zm.model.zombieCost);
    }

    zm.upgradePrice = function(upgrade) {
      if (zm.sidePanels.factory) {
        return PartFactory.purchasePrice(upgrade);
      }
      return Upgrades.upgradePrice(upgrade);
    }

    // ---- Factory Functions ---- //
    zm.factory = {
      changeFactoryTab(tab) {
        zm.factoryTab = tab;
        if (tab == 'parts') {
          zm.upgrades = PartFactory.generators;
        } else {
          zm.upgrades = CreatureFactory.creatures;
        }
      },
      buyGenerator(generator) {
        if (zm.keysPressed.shift) {
          PartFactory.purchaseMaxGenerators(generator);
        } else {
          PartFactory.purchaseGenerator(generator);
        }
        zm.factoryStats = PartFactory.factoryStats();
      },
      generatorPrice(upgrade) {
        return PartFactory.purchasePrice(upgrade);
      },
      creaturePrice(creature) {
        return CreatureFactory.purchasePrice(creature);
      },
      creatureLevelPrice(creature) {
        return CreatureFactory.levelPrice(creature);
      },
      creaturePercent(creature) {
        return Math.min(Math.round(zm.model.persistentData.parts / this.creaturePrice(creature) * 100), 100);
      },
      creatureLevelPercent(creature) {
        return Math.min(Math.round(zm.model.persistentData.parts / this.creatureLevelPrice(creature) * 100), 100);
      },
      buyCreature(creature) {
        return CreatureFactory.startBuilding(creature);
      },
      creatureTooExpensive(creature) {
        return !CreatureFactory.canAffordCreature(creature);
      },
      creatureButtonText(creature) {
        if (creature.building) {
          return "Building...";
        }
        if (this.creatureTooExpensive(creature)) {
          return formatWhole(this.creaturePrice(creature) - zm.model.persistentData.parts) + ' parts required';
        } else {
          return "Build (" + formatWhole(this.creaturePrice(creature)) + " parts)";
        }
      },
      creatureLevelButtonText(creature) {
        if (this.canLevelCreature(creature)) {
          return "Upgrade Level " + (creature.level + 1) + " (" + formatWhole(this.creatureLevelPrice(creature)) + " parts)";
        }
        return formatWhole(this.creatureLevelPrice(creature) - zm.model.persistentData.parts) + ' parts required';
      },
      canBuildCreature(creature) {
        if (this.creatureTooExpensive(creature))
          return false;
        if (creature.building)
          return false;
        return CreatureFactory.creaturesBuildingCount() + zm.model.creatureCount < zm.model.creatureLimit;
      },
      canLevelCreature(creature) {
        return this.creatureLevelPrice(creature) < zm.model.persistentData.parts;
      },
      levelCreature(creature) {
        CreatureFactory.levelCreature(creature);
      },
      autoBuild(creature, number) {
        if (creature.autobuild + number >= 0 && creature.autobuild + number <= zm.model.creatureLimit) {
          CreatureFactory.creatureAutoBuildNumber(creature, number);
        }
      },
      creatureStats(creature) {
        return CreatureFactory.creatureStats(creature);
      }
    }
    // ---- Factory Functions ---- //


    // ---- Level Select Functions ---- //
    zm.levelSelect = {
      shown : false,
      levelsPerPage : 50,
      levels : [],
      levelRanges : [],
      start : 1,
      showButton() {
        return zm.model.persistentData.allTimeHighestLevel > 1;
      },
      show() {
        if (!this.shown) {
          zm.closeSidePanels();
          this.shown = true;
          this.level = zm.model.levelInfo(zm.model.level);
          this.start = Math.floor((this.level.level - 1) / this.levelsPerPage) * this.levelsPerPage + 1;
          this.populate();
        } else {
          this.shown = false;
        }
      },
      populate() {
        this.levels = [];
        this.levelRanges = [];
        if (this.start > this.levelsPerPage) {
          this.levelRanges.push(this.start - this.levelsPerPage);
        }
        this.levelRanges.push(this.start);
        if (this.start + this.levelsPerPage < zm.model.persistentData.allTimeHighestLevel) {
          this.levelRanges.push(this.start +  this.levelsPerPage);
        }
        
        for (var i = this.start; i < this.start + this.levelsPerPage; i++) {
          this.levels.push(zm.model.levelInfo(i));
        }
      },
      selectRange(range) {
        this.start = range;
        this.populate();
      },
      select(level) {
        this.level = level;
      },
      startLevel() {
        zm.model.startLevel(this.level.level);
        this.shown = false;
      },
    }
    // ---- Level Select Functions ---- //

    zm.addToHomeScreen = function() {
      if (zm.model.deferredPrompt) {
        deferredPrompt.prompt();
      }
    }

    zm.constructionPercent = function() {
      if (zm.model.persistentData.currentConstruction) {
        var time = zm.model.persistentData.currentConstruction.time - zm.model.persistentData.currentConstruction.timeRemaining;
        return Math.round(time / zm.model.persistentData.currentConstruction.time * 100);
      }
      return 0;
    }

    zm.updateConstructionUpgrades = function() {
      if (zm.sidePanels.construction == true)
        zm.upgrades = Upgrades.getAvailableConstructions();
    }

    zm.startConstruction = function(upgrade) {
      Upgrades.startConstruction(upgrade, zm);
      zm.upgrades = Upgrades.getAvailableConstructions();
    }

    zm.playPauseConstruction = function() {
      Upgrades.playPauseConstruction();
    }

    zm.cancelConstruction = function() {
      if(confirm("Are you sure you want to cancel construction?")) {
        Upgrades.cancelConstruction();
        zm.upgrades = Upgrades.getAvailableConstructions();
      }
    }

    zm.upgradeSubtitle = function(upgrade) {
      switch (upgrade.type) {
        case Upgrades.types.energyRate:
          return "+" + upgrade.effect + " energy per second";
        case Upgrades.types.energyCap:
          return "+" + upgrade.effect + " max energy";
        case Upgrades.types.bloodCap:
          return "+" + formatWhole(upgrade.effect) + " max blood";
        case Upgrades.types.bloodStoragePC:
          return "+" + Math.round(upgrade.effect * 100) + "% max blood";
        case Upgrades.types.bloodGainPC:
          return "+" + Math.round(upgrade.effect * 100) + "% blood income";
        case Upgrades.types.brainsGainPC:
          return "+" + Math.round(upgrade.effect * 100) + "% brains income";
        case Upgrades.types.bonesGainPC:
          return "+" + Math.round(upgrade.effect * 100) + "% bones income";
        case Upgrades.types.partsGainPC:
          return "+" + Math.round(upgrade.effect * 100) + "% parts income";
        case Upgrades.types.brainsStoragePC:
          return "+" + Math.round(upgrade.effect * 100) + "% max brains";
        case Upgrades.types.energyCost:
          return "-" + upgrade.effect + " zombie energy cost";
        case Upgrades.types.brainsCap:
          return "+" + upgrade.effect + " max brains";
        case Upgrades.types.damage:
          return "+" + upgrade.effect + " zombie damage";
        case Upgrades.types.speed:
          return "+" + upgrade.effect + " zombie speed";
        case Upgrades.types.health:
          return "+" + upgrade.effect + " zombie health";
        case Upgrades.types.brainRecoverChance:
          return "+" + Math.round(upgrade.effect * 100) + "% chance to recover brain";
        case Upgrades.types.riseFromTheDeadChance:
          return "+" + Math.round(upgrade.effect * 100) + "% chance for corpse to become zombie";
        case Upgrades.types.infectedBite:
          return "+" + Math.round(upgrade.effect * 100) + "% chance for zombies to infect their targets";
        case Upgrades.types.infectedBlast:
          return "+" + Math.round(upgrade.effect * 100) + "% chance for zombies to explode on death";
        case Upgrades.types.boneCollectorCapacity:
          return "+" + upgrade.effect + " bone collector capacity";
        case Upgrades.types.zombieDmgPC:
          return "+" + formatWhole(Math.round(upgrade.effect * 100)) + "% zombie damage";
        case Upgrades.types.zombieHealthPC:
          return "+" + formatWhole(Math.round(upgrade.effect * 100)) + "% zombie health";
        case Upgrades.types.bonesRate:
          return "+" + upgrade.effect + " bones per second";
        case Upgrades.types.brainsRate:
          return "+" + upgrade.effect + " brains per second";
        case Upgrades.types.plagueDamagePC:
          return "+" + formatWhole(Math.round(upgrade.effect * 100)) + "% plague damage";
        case Upgrades.types.spitDistance:
          return "+" + upgrade.effect + " spit distance";
        case Upgrades.types.blastHealing:
          return "+" + Math.round(upgrade.effect * 100) + "% plague healing";
        case Upgrades.types.plagueArmor:
          return "+" + Math.round(upgrade.effect * 100) + "% damage reduction";
        case Upgrades.types.monsterLimit:
          return "+" + upgrade.effect + " creature limit";
        case Upgrades.types.runicSyphon:
          return "+" + Math.round(upgrade.effect * 100) + "% runic syphon";
        case Upgrades.types.gigazombies:
          return "Unlock more gigazombies";
        case Upgrades.types.bulletproof:
          return "+" + Math.round(upgrade.effect * 100) + "% earth golem bullet reflect";
        case Upgrades.types.harpySpeed:
          return "+" + upgrade.effect + " harpy speed";
        case Upgrades.types.harpyBombs:
          return "+" + upgrade.effect + " harpy bombs";
        case Upgrades.types.tankBuster:
          return "Anti tank harpies";
      }
      return "";
    }

    zm.currentRank = function(upgrade) {
      if (zm.sidePanels.factory) {
        return PartFactory.currentRank(upgrade);
      }
      return Upgrades.currentRank(upgrade);
    }

    zm.currentRankConstruction = function(upgrade) {
      return Upgrades.currentRankConstruction(upgrade);
    }

    zm.upgradeTooExpensive = function(upgrade) {
      if (zm.sidePanels.factory) {
        return !PartFactory.canAffordGenerator(upgrade);
      }
      return !Upgrades.canAffordUpgrade(upgrade) || (upgrade.cap != 0 && Upgrades.currentRank(upgrade) >= upgrade.cap);
    }

    zm.requiredForUpgrade = function(upgrade) {
      var cost = zm.upgradePrice(upgrade);

      switch (upgrade.costType) {
        case Upgrades.costs.energy:
          return formatWhole(cost - zm.model.energy) + ' energy required';
        case Upgrades.costs.blood:
        case PartFactory.costs.blood:
          return formatWhole(cost - zm.model.persistentData.blood) + ' blood required';
        case Upgrades.costs.brains:
          return formatWhole(cost - zm.model.persistentData.brains) + ' brains required';
        case Upgrades.costs.bones:
          return formatWhole(cost - zm.model.persistentData.bones) + ' bones required';
        case Upgrades.costs.prestigePoints:
          return formatWhole(cost - zm.model.persistentData.prestigePointsToSpend) + ' prestige points required';
        case PartFactory.costs.parts:
          return formatWhole(cost - zm.model.persistentData.parts) + ' parts required';
      }
    }

    zm.purchaseText = function(upgrade) {
      if (zm.keysPressed.shift) {
        if (zm.sidePanels.factory) {
          var amount = PartFactory.upgradeMaxAffordable(upgrade);
          var price = PartFactory.upgradeMaxPrice(upgrade, amount);
          return 'Purchase ' + amount + ' (' + formatWhole(price) + ' ' + zm.costTranslate(upgrade.costType) + ')';
        } else {
          var amount = Upgrades.upgradeMaxAffordable(upgrade);
          var price = Upgrades.upgradeMaxPrice(upgrade, amount);
          return 'Purchase ' + amount + ' (' + formatWhole(price) + ' ' + zm.costTranslate(upgrade.costType) + ')';
        }
        
      }
      return 'Purchase (' + formatWhole(zm.upgradePrice(upgrade)) + ' ' + zm.costTranslate(upgrade.costType) + ')';
    }

    zm.costTranslate = function(costType) {
      if (costType == Upgrades.costs.prestigePoints) {
        return "points";
      }
      return costType
    },

    zm.buyUpgrade = function(upgrade) {
      if (zm.keysPressed.shift) {
        Upgrades.purchaseMaxUpgrades(upgrade);
      } else {
        Upgrades.purchaseUpgrade(upgrade);
      }
    }

    zm.upgradeStatInfo = function(upgrade) {
      return Upgrades.displayStatValue(upgrade);
    }

    zm.startGame = function() {
      zm.model.startGame();
    }

    zm.nextLevel = function() {
      zm.model.nextLevel();
    }

    zm.toggleAutoStart = function() {
      if (zm.model.persistentData.autoStart) {
        zm.model.persistentData.autoStart = false;
      } else {
        zm.model.persistentData.autoStart = true;
      }
    }

    zm.toggleResolution = function(resolution) {
      zm.model.persistentData.resolution = resolution;
      zm.model.setResolution(zm.model.persistentData.resolution);
    }

    zm.getResolution = function() {
      return zm.model.persistentData.resolution || 1;
    }

    zm.toggleZoomButtons = function() {
      zm.model.persistentData.zoomButtons = !zm.model.persistentData.zoomButtons;
    }

    zm.zoom = function(zoom) {
      zm.model.zoom(zoom);
    }

    zm.resetZoom = function() {
      zm.model.centerGameContainer(true);
    }

    zm.toggleShowFps = function() {
      zm.model.persistentData.showfps = !zm.model.persistentData.showfps;
    }

    zm.isShowPrestige = function() {
      if (typeof zm.model.persistentData.prestigePointsEarned  === 'undefined')
        return false;
      return zm.model.persistentData.allTimeHighestLevel > 5;
    }

    zm.doPrestige = function() {
      if (confirm("Are you sure?")) {
        zm.model.prestige();
      }
    }

    zm.constructionLeadsTo = function(upgrade) {
      return Upgrades.constructionLeadsTo(upgrade);
    } 

    zm.howToPlay = [
      "Energy refills over time. You need 10 energy to spawn a zombie by clicking on the ground.",
      "Hold shift or control to spawn multiple zombies with a single click.",
      "Whenever one of your zombies attacks a human you will collect some blood.",
      "Killing a human or turning them into a zombie will earn you 1 brain.",
      "You can spend these currencies in the shop to purchase upgrades for your zombie horde.",
      "Hold shift to buy the maximum affordable number of upgrades.",
      "The world can be dragged with the mouse to explore it. Or by using the WASD or arrow keys.",
      "You can zoom in and out using your mouse wheel. Pinch to zoom on mobile.",
    ];

    zm.updateMessages = function(timeDiff) {
      if (zm.message) {
        zm.messageTimer -= timeDiff;
        if (zm.messageTimer < 0) {
          zm.message = false;
          zm.messageTimer = 4;
        }
      } else {
        if (zm.model.messageQueue.length > 0) {
          zm.message = zm.model.messageQueue.shift();
          zm.messageTimer = 4;
        }
      }
    }

    zm.infusionAmount = 1000;
    zm.infusionMax = false;

    zm.infuseRune = function(rune, cost) {
      if (zm.infusionMax) {
        switch(cost) {
          case "blood":
            Upgrades.infuseRune(rune, cost, zm.model.persistentData.blood);
            break;
          case "brains":
            Upgrades.infuseRune(rune, cost, zm.model.persistentData.brains);
            break;
          case "bones":
            Upgrades.infuseRune(rune, cost, zm.model.persistentData.bones);
            break;
        }
      } else {
        Upgrades.infuseRune(rune, cost, zm.infusionAmount);
      }
    }

    zm.infuseButtonText = function() {
      if (zm.infusionMax) {
        return "Max";
      } else {
        return formatWhole(zm.infusionAmount);
      }
    }

    zm.energyPercent = function() {
      return Math.min(Math.round(zm.model.energy / zm.model.energyMax * 100),100);
    }
    zm.bloodPercent = function() {
      return Math.min(Math.round(zm.model.persistentData.blood / zm.model.bloodMax * 100), 100);
    }
    zm.brainsPercent = function() {
      return Math.min(Math.round(zm.model.persistentData.brains / zm.model.brainsMax * 100), 100);
    }

    zm.costAboveCap = function(upgrade, price) {
      switch(upgrade.costType) {
        case "blood":
          if (price > zm.model.bloodMax) {
            return "Blood capacity too low";
          }
          break;
        case "brains":
          if (price > zm.model.brainsMax) {
            return "Brains capacity too low";
          }
          break;
      }
      return false;
    }

    zm.upgradeButtonText = function(upgrade) {
      if (upgrade.cap != 0 && zm.currentRank(upgrade) >= upgrade.cap)
        return "Sold Out";
        
      var price = zm.upgradePrice(upgrade);

      if (zm.upgradeTooExpensive(upgrade)) {
        var aboveCap = zm.costAboveCap(upgrade, price);
        if (aboveCap)
          return aboveCap;
        return zm.requiredForUpgrade(upgrade)
      }
        
      return zm.purchaseText(upgrade, price)
    }

    zm.upgradePercent = function(upgrade) {
      switch(upgrade.costType) {
        case "blood":
          return Math.round(Math.min(1, zm.model.persistentData.blood / zm.upgradePrice(upgrade)) * 100);
        case "brains":
          return Math.round(Math.min(1, zm.model.persistentData.brains / zm.upgradePrice(upgrade)) * 100);
        case "bones":
          return Math.round(Math.min(1, zm.model.persistentData.bones / zm.upgradePrice(upgrade)) * 100);
        case "parts":
          return Math.round(Math.min(1, zm.model.persistentData.parts / zm.upgradePrice(upgrade)) * 100);
        case "prestigePoints":
          return Math.round(Math.min(1, zm.model.persistentData.prestigePointsToSpend / zm.upgradePrice(upgrade)) * 100);
      }
      
    }

    function update() {
      var updateTime = new Date().getTime();
      var timeDiff = (Math.min(1000, Math.max(updateTime - zm.lastUpdate,0))) / 1000;
      innerUpdate(timeDiff, updateTime);
      zm.lastUpdate = updateTime;
    }

    function innerUpdate(timeDiff, updateTime) {
      zm.model.update(timeDiff, updateTime);
      zm.updateMessages(timeDiff);
    }

    $document.ready(function(){
      $scope.updatePromise = $interval(update, 200);
      Upgrades.angularModel = zm;
    });
  }])
  .directive('levelSelect',function(){
    return {
      templateUrl: "./templates/levelselect.html"
    };
  })
  .directive('levelStats',function(){
    return {
      templateUrl: "./templates/levelstats.html"
    };
  })
  .directive('graveyardMenu',function(){
    return {
      templateUrl: "./templates/graveyardmenu.html"
    };
  })
  .directive('runesmithMenu',function(){
    return {
      templateUrl: "./templates/runesmithmenu.html"
    };
  })
  .directive('optionsMenu',function(){
    return {
      templateUrl: "./templates/optionsmenu.html"
    };
  })
  .directive('shopMenu',function(){
    return {
      templateUrl: "./templates/shopmenu.html"
    };
  })
  .directive('constructionMenu',function(){
    return {
      templateUrl: "./templates/constructionmenu.html"
    };
  })
  .directive('prestigeMenu',function(){
    return {
      templateUrl: "./templates/prestigemenu.html"
    };
  })
  .directive('factoryMenu',function(){
    return {
      templateUrl: "./templates/factorymenu.html"
    };
  });