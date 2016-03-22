var gitService = angular.module('gitservice', []);

gitService.service('gitService', ['$http', '$q', function($http, $q) {
	var gitService = this;
	var oldCommitId = ""
	var newCommitId = ""

	gitService.getGitDiff = function(repoName, oldCommitId, newCommitId) {
		var request = {"repoName": repoName, "oldCommitId": oldCommitId, "newCommitId": newCommitId}
		return $http.post('/gitdiff', request)
			.then(function(response) { console.log("DIFF FILE: ", response.data.diff_url )});

		var oldCommitId = ""
		var newCommitId = ""
		return $q.defer().promise;
	}

	var getTagData = function(repoName) {
		var request = {"repoName": repoName}
		return $http.post('/tagdata', request)
			.then(function(response) { return response.data });

		return $q.defer().promise;
	}


	var getVersionTagsFromTagData = function(oldVersion, newVersion) {
		return function(tagData) {
			var earlyTag = {}
			var lateTag = {}

			angular.forEach(tagData, function(tag) {
				var tagRefSplitBySlashAndHyphen = tag.ref.split(/(?:\/|-)/g)
				var tagVersion = tagRefSplitBySlashAndHyphen[tagRefSplitBySlashAndHyphen.length - 1]

		        if (tagVersion == oldVersion) { earlyTag = tag }
		     	if (tagVersion == newVersion) { lateTag = tag }
			})

			return {"earlyTag": earlyTag, "lateTag": lateTag}
		}
	}

	var getCommitData = function(repoName) {
		return function(tags) {
			var request = {"repoName": repoName}
			return $http.post('/commitdata', request)
				.then(function(response) { return {"commitData": response.data, "tags": tags} });
	
			return $q.defer().promise;
		}
	}

	var correlateTagsToCommitData = function(commitData, earlyTag, lateTag) {
		var earlyCommit = {}
		var lateCommit = {}

		angular.forEach(commitData, function(commit) {
			if ( commit.sha == earlyTag.object.sha ) { earlyCommit = commit }
			if ( commit.sha == lateTag.object.sha ) { lateCommit = commit }
		})

		return readMessageFromCommitRange(commitData, earlyCommit, lateCommit)
	}

	var readMessageFromCommitRange = function(commitData, earlyCommit, lateCommit) {
		var collectedCommits = []
		for (var i = commitData.length - 1; i >= 0; i--) {
			if (i <= commitData.indexOf(earlyCommit) && i >= commitData.indexOf(lateCommit)) {
				collectedCommits.push({"id": commitData[i].sha, "message": commitData[i].commit.message, "author": commitData[i].author.login})
			}
		}
		return collectedCommits
	}

	gitService.getCommitMessagesFromVersionRange = function(repoName, oldVersion, newVersion) {
		return getTagData(repoName)
		.then(getVersionTagsFromTagData(oldVersion, newVersion))
		.then(getCommitData(repoName))
		.then(function(commitDataAndTags) { return correlateTagsToCommitData(commitDataAndTags.commitData, commitDataAndTags.tags.earlyTag, commitDataAndTags.tags.lateTag) })
	}

}]);
