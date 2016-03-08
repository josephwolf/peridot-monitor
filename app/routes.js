module.exports = function(app) {
	var bodyParser = require('body-parser');
	var https = require('https');
	var multer = require('multer'); // v1.0.5
	var path = require('path');
	var git = require("nodegit");

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
		host: '',
		path: '',
		port: 443,
		headers: {
			'Content-Type':'application/json;charset=utf-8',
			'Accept':'application/json'
		}
	}

	var environmentNames = ["CI",
							"Performance",
							"QA",
							"Staging",
							"Production"]

	var componentNames = ["profiles",
						  "feeds",
						  "matching",
						  "media-access",
						  "music-search",
						  "listens-write",
						  "listens-view-materializer",
						  "listens-read",
						  "recommendations",
						  "search",
						  "webshare",
						  "webauth",
						  "webinternal",
						  "webartist",
						  "notifications-read",
						  "notifications-view-materializer",
						  "content-sharing",
						  "accounts",
						  "accounts-processor",
						  "moderation",
						  "moderation-processor",
						  "crowdmix-oauth-provider",
						  "authentication",
						  "trends-view-materializer",
						  "trends-read",
						  "summaries-view-materializer",
						  "summaries-read",
						  "external-moderation",
						  "external-moderation-processor",
						  "recent-listens-read",
						  "recent-listens-view-materializer",
						  "abuse-reporting",
						  "kafka-event-monitor"]

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
					if (unenrichedEnvironment.version != "Unavailable") { 
						unenrichedEnvironment.lastVersion = unenrichedEnvironment.version; 
						unenrichedEnvironment.version = "Unavailable" 
					} 
					if (response.statusCode == 502) { unenrichedEnvironment.error = "Bad Gateway" }
					if (response.statusCode == 404) { unenrichedEnvironment.error = "Not Found" }
				}
			})
		})
	
		request.end();
		request.on('error', function(e) {console.error(e)});
	}

	var enrichComponent = function(componentName) {
		var enrichedComponent = {"name": componentName, "environments": []}
		for (var i = environmentNames.length - 1; i >= 0; i--) {
			enrichedComponent.environments[i] = {"name": environmentNames[i], "version": "Unavailable", "lastVersion": "No known last version", "error": ''}
			getVersion(environmentNames[i], componentName)
		}
		if (typeof findComponent(componentName) != 'number') {enrichedComponents.unshift(enrichedComponent)}
	}

	var enrichComponents = function() {
		for (var i = componentNames.length - 1; i >= 0; i--) {
			enrichComponent(componentNames[i])
		}
	}

	var refreshComponents = function() {
 	    enrichComponents();
	    setTimeout(refreshComponents,10000);
	};

	var feedsGradlePropertiesVersion654 = '/feeds/814f294/app/gradle.properties?token=AGy972X3yWbTnr5KwNnHQVLYzMQuwWyxks5W5phBwA%3D%3D'
	var feedsGradlePropertiesVersion655 = '/feeds/2514597/app/gradle.properties?token=AGy979596SF2O2cvs6lYWVVpjAhLb4hHks5W5pgzwA%3D%3D'

	var getGitRaw = function() {
		httpsOptions.host = 'jsonplaceholder.typicode.com/'
		httpsOptions.path =  '/posts/'

		var request = https.request(httpsOptions, function(response) {
			var bodyChunks = [];
			response
			.on('data', function(chunk) { bodyChunks.push(chunk) })
			.on('end', function() {
				console.log( Buffer.concat(bodyChunks).toString() )
			})
		})
	
		request.end();
		request.on('error', function(e) {console.error(e)});
	}

	// var getGitDiff = function() {
	// 	var rawGit1 = getGitRaw(feedsGradlePropertiesVersion654);
	// 	var rawGit2 = getGitRaw(feedsGradlePropertiesVersion655);
	// }

	// var getMostRecentCommit = function(repository) {
 //  		return repository.getBranchCommit("master");
	// };

	// var getNodeGitMostRecentComit = function() {

	// 	git.Repository.open("tmp")
 //  		.then(function(repo) { return repo.getMasterCommit() })
 //  		.then(function(firstCommitOnMaster) {
 //  		  	var history = firstCommitOnMaster.history();
	// 		var count = 0;

 //  		  	history.on("start", function(commit) {
 //  		  	  	if (++count >= 9) { return; }
 //  		  	  	console.log("commit " + commit.sha());
	// 			var author = commit.author();
 //  		  	  	console.log("Author:\t" + author.name() + " <" + author.email() + ">");
 //  		  	  	console.log("Date:\t" + commit.date());
 //  		  	  	console.log("\n    " + commit.message());
 //  		  });
		
 //  		  history.start();
 //  		});
	// }

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	app.get('/', function(req, res) {
    	res.sendFile('./index.html', options, function(err) {
    	    if (err) { console.log(err); res.status(err.status).end();
    	    } else { console.log('Redirecting to index.html: ' + res); }
    	});
	});

	app.get('/componentnames', function(req, res) {
		res.send(componentNames)
	});

	app.get('/environments', function(req, res) {
		res.send(environmentNames)
	});

	app.get('/enrichedcomponents', function(req, res) {
		res.send(enrichedComponents)
	});

	getGitRaw();
	refreshComponents();
}