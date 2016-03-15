var gitService = angular.module('gitservice', []);

gitService.service('gitService', ['$http', '$q', function($http, $q) {
	var gitService = this;
	var oldCommitId = ""
	var newCommitId = ""

	var getGitDiff = function(repoName, oldCommitId, newCommitId) {
		var request = {"repoName": repoName, "oldCommitId": oldCommitId, "newCommitId": newCommitId}
		return $http.post('/gitdiff', request)
			.then(function(response) { console.log("response data: ", response.data.diff_url )});

		var oldCommitId = ""
		var newCommitId = ""
		return $q.defer().promise;
	}

	var getTagData = function(repoName) {
		console.log("getting tag data for: " + repoName)
		var request = {"repoName": repoName}
		return $http.post('/tagdata', request)
			.then(function(response) { return response.data });

		return $q.defer().promise;
	}

	var processTagData = function(tagData, oldVersion, newVersion) {
		angular.forEach(tagData, function(tag) {
			if (tag.ref) {
				var tagRefSplitBySlashAndHyphen = tag.ref.split(/(?:\/|-)/g)
				var lastInSplitAray = tagRefSplitBySlashAndHyphen[tagRefSplitBySlashAndHyphen.length - 1]

        		tag.version = lastInSplitAray
		
				if (tag.version == oldVersion) { oldCommitId = tag.object.sha; console.log("Matched tag to version: ", tag) }
				if (tag.version == newVersion) { newCommitId = tag.object.sha; console.log("Matched tag to version: ", tag) }
			}
		})
	}

	gitService.compareComponentVersions = function(repoName, oldVersion, newVersion) {
		getTagData(repoName)
		.then(function(tagData) { processTagData(tagData, oldVersion, newVersion) })
		.then(function() { return getGitDiff(repoName, oldCommitId, newCommitId) })
		return $q.defer().promise;
	}

}]);
