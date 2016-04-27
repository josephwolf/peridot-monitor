var module = angular.module('peridotController', [])

module.controller('iosController', ['$scope', '$q', '$http', function($scope, $q, $http) {

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
  $scope.iosVersionTrees = []

  $scope.getNewIosFlagData = function(treeName) {
    getIosFlagData(treeName)
  }

  var getIosFlagData = function(treeName) {
    return $http.post('/iosflagdata', { treeName })
      .then(function(response) { $scope.iosFlagData = response.data })
  }

  var getIosTagData = function(){
    var request = {"repoName": "iosapp"}
    return $http.post('/tagdata', request)
      .then(function(response) { return response.data });

    return $q.defer().promise;
  }

  var getTreeNameFromTag = function(tag) {
    var tagArray = tag.split(/(\/)/g)
    return tagArray[tagArray.length - 1]
  }

  var extractTreeNamesFromTagData = function(tagData) {
    angular.forEach(tagData, function(tag) {
      var treeName = getTreeNameFromTag(tag.ref)
      if (treeName.substring(0, 3) == "QA-") { 
        var tree = {'treeName': treeName, 'displayName': treeName.substring(3)}
        $scope.iosVersionTrees.unshift(tree) 
      }
    })
  }

  getIosTagData()
  .then(function(tagData) { extractTreeNamesFromTagData(tagData) })
  .then(function() { getIosFlagData($scope.iosVersionTrees[0].treeName) })
}]);