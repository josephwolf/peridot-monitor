var module = angular.module('peridotController', [])

module.controller('mainController', ['$scope', '$q', '$interval', '$http', function($scope, $q, $interval, $http) {

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

    $scope.checkboxes = [];

    var constructComponentCheckboxes = function() {
    	angular.forEach($scope.componentNames, function(componentName) {
    		$scope.checkboxes.push({"name": componentName, "checked": true})
    	})
    }

	var getEnvironmentNames = function() {
		return $http.get('/environments')
			.then(function(response) {
				$scope.environmentNames = response.data;
				$scope.gridColumns = Math.floor(12 / ($scope.environmentNames.length + 1));
			});
	}

	var getComponentNames = function() {
		return $http.get('/componentnames')
			.then(function(response) {
				$scope.componentNames = response.data;
			}).then(function(){ if (jQuery.isEmptyObject($scope.checkboxes)){constructComponentCheckboxes()}});
	}

	var getEnrichedComponents = function() {
		return $http.get('/enrichedcomponents')
			.then(function(response) {
				$scope.enrichedComponents = response.data;
			});
	}

	var refreshComponents = function() {
		console.log("Refreshing components...")
		getEnrichedComponents()
	};

	getEnvironmentNames();
	getComponentNames();
	getEnrichedComponents();
	$interval(refreshComponents, 10000);
}]);
