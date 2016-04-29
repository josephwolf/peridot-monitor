var module = angular.module('peridotController', [])

module.controller('iosController', ['$scope', '$q', '$http', function($scope, $q, $http) {

  $scope.colours = [{
    name: "Red",
    hex: "#F21B1B"
  }, {
    name: "Blue",
    hex: "#1B66F2"
  }, {
    name: "Green",
    hex: "#07BA16"
  }];
  $scope.colour = "";

	$(document).ready(function() {
    	var aboveHeight = $('header').outerHeight();

    	$(window).scroll(function(){
    	    if ($(window).scrollTop() > aboveHeight){
    	        $('nav').addClass('fixed').css('top','0').next().css('padding-top','60px');
    	    } else {
    	        $('nav').removeClass('fixed').next().css('padding-top','0')
    	    }
    	});
    });

  $scope.iosFlagData = {}
  $scope.iosQaVersionVersions = []
  $scope.iosProdInternalVersionVersions = []
  $scope.iosStagingVersionVersions = []

  $scope.iosEnvironments = [{'environmentName': 'QA', 'data': $scope.iosQaVersionVersions},
                            {'environmentName': 'PROD', 'data': $scope.iosProdInternalVersionVersions},
                            {'environmentName': 'STAGING', 'data': $scope.iosStagingVersionVersions}]

  $scope.currentIosAppEnvironment = $scope.iosEnvironments[0]
  $scope.currentIosAppVersion = $scope.currentIosAppEnvironment[0]

  $scope.getNewIosFlagData = function(version) {
    getIosFlagData(version.versionName)
    $scope.currentIosAppVersion = version
  }

  $scope.changeEnvironment = function(environment) {
    $scope.currentIosAppEnvironment = environment
  }

  var getIosFlagData = function(versionName) {
    return $http.post('/iosflagdata', { versionName })
      .then(function(response) { $scope.iosFlagData = response.data.reverse() })
  }

  var getIosTagData = function(){
    var request = {"repoName": "iosapp"}
    return $http.post('/tagdata', request)
      .then(function(response) { return response.data });

    return $q.defer().promise;
  }

  var getVersionNameFromTag = function(tag) {
    var tagArray = tag.split(/(\/)/g)
    return tagArray[tagArray.length - 1]
  }

  var extractVersionsFromTagData = function(tagData) {
    angular.forEach(tagData, function(tag) {
      var versionName = getVersionNameFromTag(tag.ref)
      if (versionName.substring(0, 3) == "QA-") { 
        var version = {'versionName': versionName, 'displayName': versionName.substring(3)}
        $scope.iosQaVersionVersions.unshift(version) 
      }
      if (versionName.substring(0, 14) == "PROD_INTERNAL-") { 
        var version = {'versionName': versionName, 'displayName': versionName.substring(14)}
        $scope.iosProdInternalVersionVersions.unshift(version) 
      }
      if (versionName.substring(0, 8) == "STAGING-") { 
        var version = {'versionName': versionName, 'displayName': versionName.substring(8)}
        $scope.iosStagingVersionVersions.unshift(version) 
      }
    })
  }

  getIosTagData()
  .then(function(tagData) { extractVersionsFromTagData(tagData) })
  .then(function() { getIosFlagData($scope.iosEnvironments[0].data[0].versionName); $scope.currentIosAppVersion = $scope.iosEnvironments[0].data[0] })
}]);