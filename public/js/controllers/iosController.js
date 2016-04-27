var module = angular.module('peridotController', [])

module.controller('iosController', ['$scope', '$q', '$interval', '$http', function($scope, $q, $interval, $http) {

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

  var getIosFlagData = function() {
    return $http.get('/iosflagdata')
      .then(function(response) { $scope.iosFlagData = response.data })
  }

	var refreshComponents = function() {
		console.log("Refreshing components...");
    getIosFlagData()
	};

  getIosFlagData()
	$interval(refreshComponents, 10000);
}]);