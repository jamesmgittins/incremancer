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
    zm.upgrades = [];

    zm.toggleShop = function() {
      zm.shopOpen = !zm.shopOpen;
      zm.upgrades = Upgrades.upgrades;
    }

    zm.upgradePrice = function(upgrade) {
      return Upgrades.upgradePrice(upgrade);
    }

    zm.currentRank = function(upgrade) {
      return Upgrades.currentRank(upgrade);
    }

    zm.upgradeVisible = function(upgrade) {
      switch(upgrade.costType) {
        case Upgrades.costs.energy:
          return GameModel.energyMax >= upgrade.basePrice;
        case Upgrades.costs.blood:
          return GameModel.bloodMax >= upgrade.basePrice;
        case Upgrades.costs.brains:
          return GameModel.brainsMax >= upgrade.basePrice;
      }
      return true;
    }

    zm.upgradeTooExpensive = function(upgrade) {
      return !Upgrades.canAffordUpgrade(upgrade) || Upgrades.currentRank(upgrade) >= upgrade.cap;
    }

    zm.buyUpgrade = function(upgrade) {
      Upgrades.purchaseUpgrade(upgrade);
    }

    zm.upgradeStatInfo = function(upgrade) {
      return Upgrades.displayStatValue(upgrade);
    }

    zm.startGame = function() {
      GameModel.setupLevel();
      GameModel.currentState = GameModel.states.playingLevel;
    }

    zm.nextLevel = function() {
      GameModel.level++;
      GameModel.setupLevel();
      GameModel.currentState = GameModel.states.playingLevel;
    }

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