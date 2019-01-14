'use strict';

const express = require('express');
const expressValidator = require('express-validator');
const expressSession = require('express-session');
const favicon = require('serve-favicon');
const MongoStore = require('connect-mongo')(expressSession);
const path = require('path');
const bodyParser = require('body-parser');
//var compression = require('compression');
const helmet = require('helmet');

const router = require('./route');

var app = express();

const port = 8080;

app.set('view engine', 'ejs');

//app.use(compression());
app.use(helmet());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(expressSession({
	secret: '<<SECRET KEY>>',
	saveUninitialized: false,
	resave: false,
	store: new MongoStore({
		//ttl: 14 * 24 * 60 * 60, // in seconds
		url: 'mongodb://localhost/'
	}),
	cookie: { maxAge: 180 * 60 * 1000 } // in milliseconds
}));

app.use('/style', express.static(path.join(__dirname, 'css')));
app.use('/script', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));

//app.use(function (request, response, next) {
	//response.locals.session = request.session;
//});
app.use('/', router);

app.listen(port, function () {
	console.log('Listening on port: ', port);
});
