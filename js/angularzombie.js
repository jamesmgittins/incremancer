angular.module('zombieApp', [])
  .filter('decimal', function(){
    return format2Places;
  })
  .filter('whole', function(){
    return formatWhole;
  })
  .controller('ZombieController', ['$scope','$interval','$document',function($scope, $interval, $document) {
    var zm = this;
    zm.model = GameModel;

    zm.messageTimer = 4;
    zm.message = false;
    zm.lastUpdate = 0;
    zm.sidePanels = {};
    zm.upgrades = [];
    zm.currentShopFilter = "blood";

    zm.closeSidePanels = function() {
      zm.sidePanels.options = false;
      zm.sidePanels.graveyard = false;
      zm.sidePanels.prestige = false;
      zm.sidePanels.construction = false;
      zm.sidePanels.shop = false;
    }

    zm.openSidePanel = function(type) {
      zm.closeSidePanels();
      switch (type) {
        case "shop":
          zm.upgrades = Upgrades.upgrades.filter(upgrade => upgrade.costType == zm.currentShopFilter);
          zm.sidePanels.shop = true;
          break;
        case "construction":
          zm.upgrades = Upgrades.getAvailableConstructions();
          zm.sidePanels.construction = true;
          break;
        case "graveyard":
          zm.sidePanels.graveyard = true;
          break;
        case "prestige":
          zm.upgrades = Upgrades.prestigeUpgrades;
          zm.sidePanels.prestige = true;
          break;
        case "options":
          zm.sidePanels.options = true;
          break;
      }
    }

    zm.filterShop = function(type) {
      zm.currentShopFilter = type;
      zm.upgrades = Upgrades.upgrades.filter(upgrade => upgrade.costType == zm.currentShopFilter);
    }

    zm.resetGame = function() {
      GameModel.resetData();
    }

    zm.addBoneCollector = function() {
      if (zm.model.getEnergyRate() >= 1)
        zm.model.persistentData.boneCollectors++;
    }

    zm.subtractBoneCollector = function() {
      if (zm.model.persistentData.boneCollectors > 0)
        zm.model.persistentData.boneCollectors--;
    }

    zm.addGraveyardZombie = function() {
      if (zm.model.persistentData.graveyardZombies < zm.model.energyMax / 10)
        zm.model.persistentData.graveyardZombies++;
    }

    zm.subtractGraveyardZombie = function() {
      if(zm.model.persistentData.graveyardZombies > 0) {
        zm.model.persistentData.graveyardZombies--;
      }
    }

    zm.upgradePrice = function(upgrade) {
      return Upgrades.upgradePrice(upgrade);
    }

    zm.addToHomeScreen = function() {
      if (zm.model.deferredPrompt) {
        deferredPrompt.prompt();
      }
    }

    zm.constructionPercent = function() {
      if (GameModel.persistentData.currentConstruction) {
        var time = GameModel.persistentData.currentConstruction.time - GameModel.persistentData.currentConstruction.timeRemaining;
        return Math.round(time / GameModel.persistentData.currentConstruction.time * 100);
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
      Upgrades.cancelConstruction();
      zm.upgrades = Upgrades.getAvailableConstructions();
    }

    zm.upgradeSubtitle = function(upgrade) {
      switch (upgrade.type) {
        case Upgrades.types.energyRate:
          return "+" + upgrade.effect + " energy per second";
        case Upgrades.types.energyCap:
          return "+" + upgrade.effect + " max energy";
        case Upgrades.types.bloodCap:
          return "+" + upgrade.effect + " max blood";
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
        case Upgrades.types.boneCollectorCapacity:
          return "+" + upgrade.effect + " bone collector capacity";
      }
      return "";
    }

    zm.currentRank = function(upgrade) {
      return Upgrades.currentRank(upgrade);
    }

    zm.currentRankConstruction = function(upgrade) {
      return Upgrades.currentRankConstruction(upgrade);
    }

    zm.upgradeTooExpensive = function(upgrade) {
      return !Upgrades.canAffordUpgrade(upgrade) || Upgrades.currentRank(upgrade) >= upgrade.cap;
    }

    zm.requiredForUpgrade = function(upgrade) {
      var cost = zm.upgradePrice(upgrade);

      switch (upgrade.costType) {
        case Upgrades.costs.energy:
          return formatWhole(cost - GameModel.energy) + ' energy required';
        case Upgrades.costs.blood:
          return formatWhole(cost - GameModel.persistentData.blood) + ' blood required';
        case Upgrades.costs.brains:
          return formatWhole(cost - GameModel.persistentData.brains) + ' brains required';
        case Upgrades.costs.bones:
          return formatWhole(cost - GameModel.persistentData.bones) + ' bones required';
        case Upgrades.costs.prestigePoints:
          return formatWhole(cost - GameModel.persistentData.prestigePointsToSpend) + ' prestige points required';
      }
    }

    zm.purchaseText = function(upgrade) {
      return 'Purchase (' + formatWhole(zm.upgradePrice(upgrade)) + ' ' + upgrade.costType + ')';
    }

    zm.buyUpgrade = function(upgrade) {
      Upgrades.purchaseUpgrade(upgrade);
    }

    zm.upgradeStatInfo = function(upgrade) {
      return Upgrades.displayStatValue(upgrade);
    }

    zm.startGame = function() {
      GameModel.startGame();
    }

    zm.nextLevel = function() {
      GameModel.nextLevel();
    }

    zm.toggleAutoStart = function() {
      if (GameModel.persistentData.autoStart) {
        GameModel.persistentData.autoStart = false;
      } else {
        GameModel.persistentData.autoStart = true;
      }
    }

    zm.toggleResolution = function(resolution) {
      GameModel.persistentData.resolution = resolution;
      GameModel.setResolution(GameModel.persistentData.resolution);
    }

    zm.getResolution = function() {
      return GameModel.persistentData.resolution || 1;
    }

    zm.toggleZoomButtons = function() {
      GameModel.persistentData.zoomButtons = !GameModel.persistentData.zoomButtons;
    }

    zm.zoom = function(zoom) {
      GameModel.zoom(zoom);
    }

    zm.resetZoom = function() {
      GameModel.centerGameContainer();
    }

    zm.toggleShowFps = function() {
      zm.model.persistentData.showfps = !zm.model.persistentData.showfps;
    }

    zm.isShowPrestige = function() {
      if (typeof zm.model.persistentData.prestigePointsEarned  === 'undefined')
        return false;
      return zm.model.persistentData.prestigePointsEarned > 10 || zm.model.persistentData.prestigePointsToSpend > 0 || zm.model.persistentData.upgrades.filter(upgrade => upgrade.costType == Upgrades.costs.prestigePoints).length > 0
    }

    zm.doPrestige = function() {
      zm.model.prestige();
    }

    zm.howToPlay = [
      "Energy refills over time. You need 10 energy to spawn a zombie by clicking on the ground.",
      "Whenever one of your zombies attacks a human you will collect some blood.",
      "Killing a human or turning them into a zombie will earn you 1 brain.",
      "You can spend these currencies in the shop to purchase upgrades for your zombie horde.",
      "The world can be dragged with the mouse to explore it. Or by using the WASD or arrow keys.",
      "You can zoom in and out using your mouse wheel. Pinch to zoom on mobile."
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

    zm.energyPercent = function() {
      return Math.round(zm.model.energy / zm.model.energyMax * 100);
    }
    zm.bloodPercent = function() {
      return Math.round(zm.model.persistentData.blood / zm.model.bloodMax * 100);
    }
    zm.brainsPercent = function() {
      return Math.round(zm.model.persistentData.brains / zm.model.brainsMax * 100);
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
      $scope.updatePromise = $interval(update, 100);
      Upgrades.angularModel = zm;
    });

  }]);