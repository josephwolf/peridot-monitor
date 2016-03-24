module.exports = function(app) {
	var bodyParser = require('body-parser');
	var https = require('https');
	var multer = require('multer'); // v1.0.5
	var path = require('path');
	var request = require('request');

	var options = {
		dotfiles: 'ignore',
		root: "/src/public/", //change to "./public/" for local version
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true,
		}
	}

	var httpsOptions = {
		method: 'GET',
		port: 443,
		headers: {
			'Content-Type':'application/json;charset=utf-8',
			'Accept':'application/json'
		}
	}

	var githubHttpsOptions = {
		method: 'GET',
		port: 443,
		headers: {
			'Content-Type':'application/json;charset=utf-8',
			'Accept':'application/json',
			'User-Agent': 'josephwolf',
			'Authorization': 'CHANGEME'
		}
	}

	var environmentNames = ["CI",
							"Performance",
							"QA",
							"Staging",
							"Production"]

	var components = [{"name": "abuse-reporting", 					"repo": "abuse-reporting"},
					  {"name": "accounts", 							"repo": "accounts"},
					  {"name": "accounts-processor", 				"repo": "accounts"},
					  {"name": "authentication", 					"repo": "authentication"},
					  {"name": "content-sharing", 					"repo": "content-sharing"},
					  {"name": "external-moderation-processor", 	"repo": "external-moderation"},
					  {"name": "external-moderation-outbound", 		"repo": "external-moderation"},
					  {"name": "feeds", 							"repo": "feeds"},
					  {"name": "invitations", 						"repo": "invitations"},
					  {"name": "kafka-event-monitor", 				"repo": "kafka-event-monitor"},
					  {"name": "listens-read", 						"repo": "listens"},
					  {"name": "listens-view-materializer", 		"repo": "listens"},
					  {"name": "listens-write", 					"repo": "listens"},
					  {"name": "matching", 							"repo": "matching"},
					  {"name": "media-access", 						"repo": "media-access"},
					  {"name": "moderation", 						"repo": "moderation"},
					  {"name": "moderation-processor", 				"repo": "moderation"},
					  {"name": "music-search", 						"repo": "matching"},
					  {"name": "notifications-read", 				"repo": "notifications"},
					  {"name": "notifications-view-materializer", 	"repo": "notifications"},
	                  {"name": "profiles", 							"repo": "profiles"},
					  {"name": "recent-listens-read", 				"repo": "recent-listens"},
					  {"name": "recent-listens-view-materializer", 	"repo": "recent-listens"},
					  {"name": "recommendations", 					"repo": "recommendations"},
					  {"name": "search", 							"repo": "search"},
					  {"name": "sms-gateway",						"repo": "sms-gateway"},
					  {"name": "summaries-read", 					"repo": "summaries"},
					  {"name": "summaries-view-materializer", 		"repo": "summaries"},
					  {"name": "trends-read", 						"repo": "trends"},
					  {"name": "trends-view-materializer", 			"repo": "trends"},
					  {"name": "webartist", 						"repo": "web-artist"},
					  {"name": "webauth", 							"repo": "web-auth"},
					  {"name": "webinternal", 						"repo": "web-internal"},
					  {"name": "webshare", 							"repo": "web-share"}]

	var enrichedComponents = []

	var findComponent = function(componentName) {
		for (var i = 0, len = enrichedComponents.length; i < len; i++) {
    		if (enrichedComponents[i].name == componentName) { return i}
		}
	}

	var findEnvironment = function(environmentName, component) {
		for (var i = 0, len = component.environments.length; i < len; i++) {
    		if (component.environments[i].name == environmentName) { return i}
		}
	}

	var getVersion = function(environment, componentName) {
		if (environment == "Production") { httpsOptions.host = 'api.crwd.mx' } 
		else { httpsOptions.host = environment + '.dev.crwd.mx' }
		httpsOptions.path = '/' + componentName + '/meta'

		var request = https.request(httpsOptions, function(response) {
			var bodyChunks = [];
			response
			.on('data', function(chunk) { bodyChunks.push(chunk) })
			.on('end', function() { 

				var enrichedComponent = enrichedComponents[findComponent(componentName)]
				var unenrichedEnvironment = enrichedComponent.environments[findEnvironment(environment, enrichedComponent)]

				if (response.statusCode == 200) {
					var responseData = JSON.parse(Buffer.concat(bodyChunks)).version

					if (unenrichedEnvironment.version != responseData) {
						if (unenrichedEnvironment.version != "Unavailable") { unenrichedEnvironment.lastVersion = unenrichedEnvironment.version }
						if (responseData == 'Unable to retrieve version information' || responseData == '') { unenrichedEnvironment.error = 'Unable to retrieve version information' } 
						else {
							unenrichedEnvironment.version = responseData;
							unenrichedEnvironment.error = ''
						}
					}
				}

				else {
					if (unenrichedEnvironment.version != 'Unavailable') { 
						unenrichedEnvironment.lastVersion = unenrichedEnvironment.version;
						unenrichedEnvironment.version = 'Unavailable' 
					} 
					if (response.statusCode == 502) { unenrichedEnvironment.error = 'Bad Gateway' }
					if (response.statusCode == 404) { unenrichedEnvironment.error = 'Not Found' }
				}
			})
		})
	
		request.end();
		request.on('error', function(e) {console.error(e)});
	}

	var enrichComponent = function(component) {
		var enrichedComponent = {"name": component.name, "repo": component.repo, "environments": []}
		for (var i = environmentNames.length - 1; i >= 0; i--) {
			enrichedComponent.environments[i] = {"name": environmentNames[i], "version": 'Unavailable', "lastVersion": 'No known last version', "error": ''}
			getVersion(environmentNames[i], component.name)
		}
		if (typeof findComponent(component.name) != 'number') {enrichedComponents.unshift(enrichedComponent)}
	}

	var enrichComponents = function() {
		for (var i = components.length - 1; i >= 0; i--) {
			enrichComponent(components[i])
		}
	}

	var refreshComponents = function() {
 	    enrichComponents();
	    setTimeout(refreshComponents,10000);
	};

	var getGitDiff = function(repoName, oldCommitId, newCommitId, res) {
		githubHttpsOptions.url = 'https://api.github.com/repos/crowdmix/' + repoName + '/compare/' + oldCommitId + "..." + newCommitId

		request(githubHttpsOptions, function(error, response, body) {
			if (error == null && response.statusCode == 200) { res.send(body) } 
			else { res.send({"error": "Unable to get git diff"}) }
		})
	}


	var getGithubRepoTagData = function(repoName, res) {
		githubHttpsOptions.url = 'https://api.github.com/repos/crowdmix/' + repoName + '/git/refs/tags'

		request(githubHttpsOptions, function (error, response, body) { 
			if (error == null && response.statusCode == 200) { res.send(body) } 
			else { res.send({"error": "Unable to send tag data"})} 
		})
	}

	var getGithubRepoCommitData = function(repoName, res) {
		githubHttpsOptions.url = 'https://api.github.com/repos/crowdmix/' + repoName + '/commits?sha=master'

		request(githubHttpsOptions, function (error, response, body) { 
			if (error == null && response.statusCode == 200) { res.send(body) } 
			else { res.send({"error": "Unable to send tag data"})} 
		})
	}

	var getGithubTagCommitData = function(url, res) {
		githubHttpsOptions.url = url

		request(githubHttpsOptions, function (error, response, body) { 
			if (error == null && response.statusCode == 200) { res.send(body) } 
			else { res.send({"error": "Unable to send tag data"})} 
		})
	}

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	app.get('/', function(req, res) {
    	res.sendFile('./index.html', options, function(err) {
    	    if (err) { console.log(err); res.status(err.status).end();
    	    } else { console.log('Redirecting to index.html: ' + res); }
    	});
	});

	app.get('/componentnames', function(req, res) {
		res.send(components)
	});

	app.get('/environments', function(req, res) {
		res.send(environmentNames)
	});

	app.get('/enrichedcomponents', function(req, res) {
		res.send(enrichedComponents)
	});

	app.post('/gitdiff', function(req, res) {
		getGitDiff(req.body.repoName, req.body.oldCommitId, req.body.newCommitId, res)
	})

	app.post('/tagdata', function(req, res) {
		getGithubRepoTagData(req.body.repoName, res)
	})

	app.post('/commitdata', function(req, res) {
		getGithubRepoCommitData(req.body.repoName, res)
	})

	app.post('/tagcommitdata', function(req, res) {
		getGithubTagCommitData(req.body.url, res)
	})

	refreshComponents();
}
