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

	var getCommitData = function(repoName, page) {
		var request = {"repoName": repoName, "page": page}
		return $http.post('/commitdata', request)
			.then(function(response) { return response.data });
		return $q.defer().promise;
	}


	var getCommitsFromLogs = function(repoName, oldCommitId, newCommitId, newCommitData, collectedCommitData, oldCommit, newCommit, i) {

		angular.forEach(newCommitData, function(commit) {
			collectedCommitData.unshift(commit)
			if (commit.sha == oldCommitId) { oldCommit = commit }
			if (commit.sha == newCommitId) { newCommit = commit }
		})

		if (newCommitData == [] || i >= 5) { return {"oldCommit": oldCommit, "newCommit": newCommit, "collectedCommitData": collectedCommitData} }

		if (jQuery.isEmptyObject(oldCommit) || jQuery.isEmptyObject(newCommit)) {
			i = i + 1
			return getCommitData(repoName, i)
			.then(function(nextPageCommitData) { 
				return getCommitsFromLogs(repoName, oldCommitId, newCommitId, nextPageCommitData, collectedCommitData, oldCommit, newCommit, i) 
			})
		} else {
			return {"oldCommit": oldCommit, "newCommit": newCommit, "collectedCommitData": collectedCommitData}
		}
	}


	var collectCommitData = function(commitData, oldCommit, newCommit) {
		var oldCommitIndex = commitData.indexOf(oldCommit)
		var newCommitIndex = commitData.indexOf(newCommit)
		var commitsInRange = []

		if (jQuery.isEmptyObject(oldCommit) || jQuery.isEmptyObject(newCommit)) {
			return [{"error": "Could not get commit data."}]
		}

		for (var i = commitData.length - 1; i >= 0; i--) {
			if (i >= oldCommitIndex && i <= newCommitIndex) {
				commitsInRange.push({"id": commitData[i].sha, "message": commitData[i].commit.message, "author": commitData[i].author.login})
			}
		}
		return commitsInRange
	}

	gitService.getCommitMessagesFromVersionRange = function(repoName, oldVersion, newVersion) {
		var oldCommitId = ""
		var newCommitId = ""
		var itterator = 1
		var collectedCommits = []
		var oldCommit = {}
		var newCommit = {}

		return getTagData(repoName)
		.then(getVersionTagsFromTagData(oldVersion, newVersion))
		.then(getCommitIdsFromTags(repoName))
		.then(function(commitIds) { oldCommitId = commitIds.oldCommitId; newCommitId = commitIds.newCommitId; return getCommitData(repoName, itterator) })
		.then(function(firstPageCommitData) { return getCommitsFromLogs(repoName, oldCommitId, newCommitId, firstPageCommitData, collectedCommits, oldCommit, newCommit, itterator) })
		.then(function(commitDataAndIds) { return collectCommitData(commitDataAndIds.collectedCommitData, commitDataAndIds.oldCommit, commitDataAndIds.newCommit) })
	}

}]);
