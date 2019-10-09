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

    zm.lastUpdate = 0;
    zm.shopOpen = false;
    zm.graveyardOpen = false;
    zm.optionsOpen = false;
    zm.upgrades = [];

    zm.currentShopFilter = "blood";

    zm.toggleShop = function() {
      zm.optionsOpen = false;
      zm.graveyardOpen = false;
      zm.upgrades = Upgrades.upgrades.filter(upgrade => upgrade.costType == zm.currentShopFilter);
      zm.shopOpen = !zm.shopOpen;
    }

    zm.filterShop = function(type) {
      zm.currentShopFilter = type;
      zm.upgrades = Upgrades.upgrades.filter(upgrade => upgrade.costType == zm.currentShopFilter);
    }

    zm.toggleGraveyard = function() {
      zm.optionsOpen = false;
      zm.shopOpen = false;
      zm.graveyardOpen = !zm.graveyardOpen;
    }

    zm.toggleOptions = function() {
      zm.shopOpen = false;
      zm.graveyardOpen = false;
      zm.optionsOpen = !zm.optionsOpen;
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
      if (!zm.shopOpen)
        return 0;

      return Upgrades.upgradePrice(upgrade);
    }

    zm.addToHomeScreen = function() {
      if (zm.model.deferredPrompt) {
        deferredPrompt.prompt();
      }
    }

    zm.upgradeSubtitle = function(upgrade) {
      if (!zm.shopOpen)
        return "";

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
        case Upgrades.types.graveyard:
          return "Unlock Graveyard";
        case Upgrades.types.boneCollectorCapacity:
          return "+" + upgrade.effect + " bone collector capacity";
      }
      return "";
    }

    zm.currentRank = function(upgrade) {
      if (!zm.shopOpen)
        return 0;

      return Upgrades.currentRank(upgrade);
    }

    zm.upgradeVisible = function(upgrade) {
      if (!zm.shopOpen)
        return false;

      switch(upgrade.costType) {
        case Upgrades.costs.energy:
          return GameModel.energyMax >= upgrade.basePrice;
        case Upgrades.costs.blood:
          return GameModel.bloodMax >= upgrade.basePrice;
        case Upgrades.costs.brains:
          return GameModel.brainsMax >= upgrade.basePrice;
        case Upgrades.costs.bones:
          return GameModel.persistentData.bonesTotal >= upgrade.basePrice;
      }
      return true;
    }

    zm.upgradeTooExpensive = function(upgrade) {
      if (!zm.shopOpen)
        return true;

      return !Upgrades.canAffordUpgrade(upgrade) || Upgrades.currentRank(upgrade) >= upgrade.cap;
    }

    zm.requiredForUpgrade = function(upgrade) {
      if (!zm.shopOpen)
        return "";

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
      }
    }

    zm.purchaseText = function(upgrade) {
      if (!zm.shopOpen)
        return "";

      return 'Purchase (' + formatWhole(zm.upgradePrice(upgrade)) + ' ' + upgrade.costType + ')';
    }

    zm.buyUpgrade = function(upgrade) {
      Upgrades.purchaseUpgrade(upgrade);
    }

    zm.upgradeStatInfo = function(upgrade) {
      if (!zm.shopOpen)
        return "";

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
      GameModel.showfps = !GameModel.showfps;
    }

    zm.howToPlay = [
      "Energy refills over time. You need 10 energy to spawn a zombie by clicking on the ground.",
      "Whenever one of your zombies attacks a human you will collect some blood.",
      "Killing a human or turning them into a zombie will earn you 1 brain.",
      "You can spend these currencies in the shop to purchase upgrades for your zombie horde.",
      "The world can be dragged with the mouse to explore it. Or by using the WASD or arrow keys.",
      "You can zoom in and out using your mouse wheel. Pinch to zoom on mobile."
    ];

    function update() {
      var updateTime = new Date().getTime();
      var timeDiff = (Math.min(1000, Math.max(updateTime - zm.lastUpdate,0))) / 1000;
      innerUpdate(timeDiff, updateTime);
      zm.lastUpdate = updateTime;
    }

    function innerUpdate(timeDiff, updateTime) {
      zm.model.update(timeDiff, updateTime);
    }

    $document.ready(function(){
      $scope.updatePromise = $interval(update, 200);
    });

  }]);