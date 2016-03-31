var express 	= require('express');
var app 		= express();
var port 		= 2501;
var basicAuth 	= require('basic-auth')
var peridotPassword	= process.env.PERIDOT_PASSWORD

app.use(auth('peridotaccess', peridotPassword));
app.use(express.static(__dirname + '/public'));

require('./app/routes.js')(app);

app.listen(port);
console.log("App listening on port " + port);

function auth(username, password) {
	return function(req, res, next) {
		var user = basicAuth(req);
		if (!user || user.name !== username || user.pass !== password) {
			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			return res.send(401);
		}
		next();
	};
};