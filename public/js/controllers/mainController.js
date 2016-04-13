var module = angular.module('peridotController', ['gitservice'])

module.controller('mainController', ['$scope', '$q', '$interval', '$http', 'gitService', function($scope, $q, $interval, $http, gitService) {

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

    $scope.checkboxes = {};
    $scope.showModal = false;
    $scope.toggleModal = function(){ $scope.showModal = !$scope.showModal; };
    $scope.collectedCommits = [];
    $scope.environments = [];
    $scope.environmentCheckboxes = {};
    $scope.loading = false;

    $scope.columnSize = function() {
      var noOfVisibleEnvs = 0;
      angular.forEach($scope.environmentCheckboxes, function(result) {
        if (result == true) noOfVisibleEnvs++;
      })
      
      switch(noOfVisibleEnvs) {
        case 1: return 10;
        case 2: return 5;
        case 3: return 3;
        default: return 2;
      }
    };

    var constructComponentCheckboxes = function() {
    	angular.forEach($scope.components, function(component) {
    		$scope.checkboxes[component.name.toString()] = true
    	})
    }

    var constructEnvironmentCheckboxes = function() {
      angular.forEach($scope.environments, function(environment) {
        $scope.environmentCheckboxes[environment.toString()] = true
      })
    }

	var getEnvironments = function() {
		return $http.get('/environments')
			.then(function(response) {
				$scope.environments = response.data;
			})
      .then(function(){
       if (jQuery.isEmptyObject($scope.environmentCheckboxes)) {
        constructEnvironmentCheckboxes()}
      });
	}

	var getComponents = function() {
		return $http.get('/componentnames')
			.then(function(response) { $scope.components = response.data })
			.then(function(){ if (jQuery.isEmptyObject($scope.checkboxes)){constructComponentCheckboxes()}});
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

  var extractJirasTicketFromCommitMessages = function(commitData) {
    var jiraTickets = []
    var regExQuery = new RegExp(/\w+([A-Z])-\w+([0-9])/g)

    angular.forEach(commitData, function(commit) {
      if (regExQuery.test(commit.message)) { jiraTickets.unshift(commit.message.match(regExQuery)) }
    })
    var collectedJiraTickets = [].concat.apply([], jiraTickets)
    var uniqueJiraTickets = []
    $.each(collectedJiraTickets, function(i, el) {
      if ($.inArray(el, uniqueJiraTickets) === -1) {uniqueJiraTickets.unshift(el)}
    })
    return uniqueJiraTickets;
  }

	$scope.getGitDiff = function(repoName, oldVersion, newVersion) {
		$scope.loading = true
		$scope.collectedCommits = []
		$scope.gitDiffTitle = "Commits between " + repoName + " " + oldVersion + " and " + repoName + " " + newVersion
		gitService.getCommitMessagesFromVersionRange(repoName, oldVersion, newVersion)
		.then(function(commitMessages){ 
      $scope.loading = false; 
      $scope.collectedCommits = commitMessages;
      $scope.jiraTickets = extractJirasTicketFromCommitMessages(commitMessages);
    })
	}

	getEnvironments();
	getComponents();
	getEnrichedComponents();
	$interval(refreshComponents, 10000);
}]);

module.directive('modal', function () {
    return {
      	template: '<div class="modal fade">' + 
                '<div class="container">' +
		      	      '<div class="modal-dialog">' + 
		      	          '<div class="modal-content">' + 
		      	              '<div class="modal-header">' + 
                   				'<button ng-click="toggleModal()" type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
                   				'<h4 class="modal-title">{{ gitDiffTitle }}</h4>' + 
              	  			'</div>' + 
		                   	'<div class="modal-body" ng-transclude></div>' + 
		      	          '</div>' + 
		      	      '</div>' + 
                '</div>' +
		      	'</div>',
      	restrict: 'E',
      	transclude: true,
      	replace:true,
      	scope:true,
      	link: function postLink(scope, element, attrs) {	  
      	    scope.$watch(attrs.visible, function(value){
      	        if(value == true)
      	            $(element).modal('show');
      	        else
      	            $(element).modal('hide');
      	    });
	  
      	    $(element).on('show.modal', function(){
      	      scope.$apply(function(){
      	        scope.$parent[attrs.visible] = true;
      	      });
      	    });
	  
      	    $(element).on('hide.modal', function(){
      	      scope.$apply(function(){
      	        scope.$parent[attrs.visible] = false;
      	      });
      	    });
      	}
    };
});