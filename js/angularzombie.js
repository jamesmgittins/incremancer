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

    zm.messageTimer = 4;
    zm.message = false;
    zm.lastUpdate = 0;
    zm.sidePanels = {};
    zm.upgrades = [];
    zm.currentShopFilter = "blood";
    zm.currentConstructionFilter = "available";
    zm.graveyardTab = "minions";

    zm.closeSidePanels = function() {
      zm.currentShopFilter = "blood";
      zm.currentConstructionFilter = "available";
      zm.graveyardTab = "minions";
      zm.sidePanels.options = false;
      zm.sidePanels.graveyard = false;
      zm.sidePanels.runesmith = false;
      zm.sidePanels.prestige = false;
      zm.sidePanels.construction = false;
      zm.sidePanels.shop = false;
      zm.sidePanels.open = false;
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
          break;
        case "runesmith":
          zm.sidePanels.runesmith = true;
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
      if (confirm("Are you sure you want to reset everything?")) {
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
      return Upgrades.upgradePrice(upgrade);
    }

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
        case Upgrades.types.bloodStoragePC:
          return "+" + Math.round(upgrade.effect * 100) + "% max blood";
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
          return "+" + Math.round(upgrade.effect * 100) + "% zombie damage";
        case Upgrades.types.zombieHealthPC:
          return "+" + Math.round(upgrade.effect * 100) + "% zombie health";
        case Upgrades.types.bonesRate:
          return "+" + upgrade.effect + " bones per second";
        case Upgrades.types.brainsRate:
          return "+" + upgrade.effect + " brains per second";
        case Upgrades.types.plagueDamagePC:
          return "+" + Math.round(upgrade.effect * 100) + "% plague damage";
        case Upgrades.types.spitDistance:
          return "+" + upgrade.effect + " spit distance";
        case Upgrades.types.blastHealing:
          return "+" + Math.round(upgrade.effect * 100) + "% plague healing";
        case Upgrades.types.plagueArmor:
          return "+" + Math.round(upgrade.effect * 100) + "% damage reduction";
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
      return !Upgrades.canAffordUpgrade(upgrade) || (upgrade.cap != 0 && Upgrades.currentRank(upgrade) >= upgrade.cap);
    }

    zm.requiredForUpgrade = function(upgrade) {
      var cost = zm.upgradePrice(upgrade);

      switch (upgrade.costType) {
        case Upgrades.costs.energy:
          return formatWhole(cost - zm.model.energy) + ' energy required';
        case Upgrades.costs.blood:
          return formatWhole(cost - zm.model.persistentData.blood) + ' blood required';
        case Upgrades.costs.brains:
          return formatWhole(cost - zm.model.persistentData.brains) + ' brains required';
        case Upgrades.costs.bones:
          return formatWhole(cost - zm.model.persistentData.bones) + ' bones required';
        case Upgrades.costs.prestigePoints:
          return formatWhole(cost - zm.model.persistentData.prestigePointsToSpend) + ' prestige points required';
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
      zm.model.centerGameContainer();
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
      if (confirm("Are you sure?")) {
        zm.model.prestige();
      }
    }

    zm.constructionLeadsTo = function(upgrade) {
      return Upgrades.constructionLeadsTo(upgrade);
    } 

    zm.howToPlay = [
      "Energy refills over time. You need 10 energy to spawn a zombie by clicking on the ground.",
      "Whenever one of your zombies attacks a human you will collect some blood.",
      "Killing a human or turning them into a zombie will earn you 1 brain.",
      "You can spend these currencies in the shop to purchase upgrades for your zombie horde.",
      "The world can be dragged with the mouse to explore it. Or by using the WASD or arrow keys.",
      "You can zoom in and out using your mouse wheel. Pinch to zoom on mobile.",
      "Hold shift or control to spawn multiple zombies with a single click."
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

    zm.infuseRune = function(rune, cost) {
      Upgrades.infuseRune(rune, cost, zm.infusionAmount);
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

  }]);