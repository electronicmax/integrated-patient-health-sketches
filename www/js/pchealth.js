angular.module('pchealth',[])
	.controller('par',($scope, datafab) => {
		console.log('thing');
		window.dfb = datafab;		
		$scope.days = datafab.test();
		$scope.hideline = false;
	});