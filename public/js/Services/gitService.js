var gitService = angular.module('gitservice', []);

gitService.service('gitService', ['$http', '$q', function($http, $q) {
	var gitService = this;

	var getTagData = function(repoName) {
		var request = {"repoName": repoName}
		return $http.post('/tagdata', request)
			.then(function(response) { return response.data });

		return $q.defer().promise;
	}


	var getVersionTagsFromTagData = function(oldVersion, newVersion) {
		return function(tagData) {
			var oldTag = {}
			var newTag = {}

			angular.forEach(tagData, function(tag) {
				var tagRefSplitBySlashAndHyphen = tag.ref.split(/(?:\/|-)/g)
				var tagVersion = tagRefSplitBySlashAndHyphen[tagRefSplitBySlashAndHyphen.length - 1]

		        if (tagVersion == oldVersion) { oldTag = tag }
		     	if (tagVersion == newVersion) { newTag = tag }
			})

			return {"oldTag": oldTag, "newTag": newTag}
		}
	}

	var getTagCommitId = function(url) {
		var request = {"url": url}
		return $http.post('/tagcommitdata', request)
			.then(function(response) { if (response.data.object) { return response.data.object.sha }
									   else { return response.data.sha } });
	
		return $q.defer().promise;
	}

	var getCommitIdsFromTags = function(repoName) {
		return function(tags) {
				var oldCommitId = ""
				var newCommitId = ""
	
			try {
				return getTagCommitId(tags.oldTag.object.url)
					.then(function(returnedId) { oldCommitId = returnedId; 
						return getTagCommitId(tags.newTag.object.url) })
					.then(function(returnedId) { newCommitId = returnedId; 
						return {"oldCommitId": oldCommitId, "newCommitId": newCommitId}
				})
			} catch(err) {
				return {"oldCommitId": undefined, "newCommitId": undefined}
			}
		}
	}

	var getCommitData = function(repoName) {
		return function(commitIds) {
			var request = {"repoName": repoName}
			return $http.post('/commitdata', request)
				.then(function(response) { return {"commitData": response.data, "commitIds": commitIds} });
	
			return $q.defer().promise;
		}
	}

	var getIndexOfCommitById = function(commitData, commitId) {
		if (commitId != undefined) {
			for (var i = commitData.length - 1; i >= 0; i--) {
				if (commitData[i].sha == commitId) { return i }
			}			
		} else { return undefined }
	}

	var collectCommitData = function(commitData, oldCommitId, newCommitId) {
		var collectedCommits = []
		var oldCommitIndex = getIndexOfCommitById(commitData, oldCommitId)
		var newCommitIndex = getIndexOfCommitById(commitData, newCommitId)

		if (newCommitIndex != undefined && oldCommitIndex != undefined) {
			for (var i = commitData.length - 1; i >= 0; i--) {
				if (i <= oldCommitIndex && i >= newCommitIndex) {
					collectedCommits.unshift({"id": commitData[i].sha, "message": commitData[i].commit.message, "author": commitData[i].author.login})
				}
			}
		}

		if (newCommitIndex != undefined && oldCommitIndex == undefined) {
			for (var i = commitData.length - 1; i >= 0; i--) {
				if (i >= newCommitIndex) {
					collectedCommits.unshift({"id": commitData[i].sha, "message": commitData[i].commit.message, "author": commitData[i].author.login})
				}
			}
			collectedCommits.unshift({"error": "Commit log is too long! Displaying incomplete list..."})
		}

		if (newCommitIndex == undefined && oldCommitIndex == undefined) {
			collectedCommits.unshift({"error": "Could not get tag data"})
		}

		return collectedCommits
	}

	gitService.getCommitMessagesFromVersionRange = function(repoName, oldVersion, newVersion) {
		return getTagData(repoName)
		.then(getVersionTagsFromTagData(oldVersion, newVersion))
		.then(getCommitIdsFromTags(repoName))
		.then(getCommitData(repoName))
		.then(function(commitDataAndIds) { return collectCommitData(commitDataAndIds.commitData, commitDataAndIds.commitIds.oldCommitId, commitDataAndIds.commitIds.newCommitId) })
	}

}]);
