var module = angular.module('peridotController', [])

module.controller('mainController', ['$scope', '$q', '$interval', '$http', function($scope, $q, $interval, $http) {

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
			});
	}

	var getEnrichedComponents = function() {
		return $http.get('/enrichedcomponents')
			.then(function(response) {
				// console.log(response.data)
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
