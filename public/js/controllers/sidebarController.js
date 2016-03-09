(function() {
/* global angular */
var module = angular.module('sidebarcontroller', []);

module.controller('sidebarController', function($scope) {
    $scope.state = false;

    $scope.toggleNavBar = function() {
        $scope.state = !$scope.state;
    };
});

module.directive('sidebarDirective', function() {
    return {
        link : function(scope, element, attr) {
            scope.$watch(attr.sidebarDirective, function(newVal) {
                if(newVal) {
                  element.addClass('show'); 
                  return;
                }
                element.removeClass('show');
            });
        }
    };
});

module.directive('constrictDirective', function() {
    return {
        link : function(scope, element, attr) {
            scope.$watch(attr.constrictDirective, function(newVal) {
                if (newVal) {
                  element.addClass('constrict');
                  return;
                }
                element.removeClass('constrict');
            })
        }
    }
});
    
}());