'use strict';

const express = require('express');
const mysql = require('mysql');

const crypt = require('./phash');
const dynamo = require('./dynamodb');
//const omdb = require('./omdb');
const tmdb = require('./tmdb');
const databricks = require('./databricks');

var router = express.Router();

var pool = mysql.createPool({
        connectionLimit:        '10',
        host:                   '<<MYSQL HOST ADDRESS>>',
        user:                   '<<MYSQL USER>>',
        password:               '<<MYSQL PASSWORD>>',
        database:               '<<MYSQL DATABASE>>'
});

var loggedIn = function (request, response) {
        if (request.session.login) {
                response.redirect('/rate');

                return 1;
        }

        return 0;
};
var loggedOut = function (request, response) {
        if (!request.session.login) {
                response.redirect('/?msg=You+need+to+login+first%21');

                return 1;
        }

        return 0;
};

router.get('/', function (request, response) {
        if (loggedIn(request, response)) return;

	response.render('login', { msg: request.query.msg });
});

router.post('/', function (request, response) {
        if (loggedIn(request, response)) return;

        request.check('email', 'Email is invalid.').isEmail();
        request.check('password', 'Password field is empty.').notEmpty();

        request.getValidationResult().then(function (result) {
                if (!result.isEmpty()) {
                        response.render('login', { errs: result.array() });
                        return;
                }

                pool.getConnection(function (err, con) {
                        if (err) {
                                console.log('Connection error: ', err);
                                response.render('login', { msg: 'Connection to the server failed!' });
                                return;
                        }

                        var sql = 'SELECT id, password, nacl, firstname, verified FROM users WHERE email = ?';
                        var value = request.body.email;
                        con.query(sql, [value], function (err, result) {
                                con.release();
                                if (err) {
                                        console.log('Connection error: ', err);
                                        response.render('login', { msg: 'Request to the server failed!' });
                                        return;
                                }

                                if (result.length <= 0) {
                                        response.render('login', { msg: 'Email or password is invalid. Try again.' });
                                        return;
                                }

                                var res = result[0];
                                if (!crypt.verify(res.password, request.body.password, res.nacl)) {
                                        response.render('login', { msg: 'Email or password is invalid. Try again.' });
                                        return;
                                }

                                /*
                                if (!res.verified) {
                                        response.render('login', { msg: 'Email is not yet verified.' });
                                        return;
                                }
                                */

                                request.session.login = true;
                                request.session.userId = res.id;
                                request.session.firstname = res.firstname;
                                response.redirect('/rate?msg=Logged+in+successfully%21');
                        });

                        con.on('error', function (err) {
                                console.log('Connection error: ', err);
                                response.render('login', { msg: 'Server request failed!' });
                                return;
                        });
                });
        });
});

router.get('/register', function (request, response) {
        if (loggedIn(request, response)) return;

        response.render('register');
});

router.post('/register', function (request, response) {
        if (loggedIn(request, response)) return;

        request.check('email', 'Email is invalid.').isEmail();
        request.check('email', 'Email length must be within 6 to 50 characters long.').len(6, 50);
        request.check('password', 'Password length must be within 8 to 100 characters long.').len(8, 100);
        request.check('confirm', 'Passwords do not match.').equals(request.body.password);
        request.check('firstname', 'First name must have a maximum length of 20.').isLength({ max: 20 });
        request.check('lastname', 'Last name must have a maximum length of 20.').isLength({ max: 20 });

        request.getValidationResult().then(function (result) {
                if (!result.isEmpty()) {
                        response.render('register', { errs: result.array() });
                        return;
                }

                pool.getConnection(function (err, con) {
                        if (err) {
                                console.log('Connection error: ', err);
                                response.render('register', { msg: 'Connection to the server failed!' });
                                return;
                        }

                        var sql = 'SELECT email FROM users WHERE email = ?';
                        var value = request.body.email;
                        con.query(sql, [value], function (err, result) {
                                if (err) {
                                        con.release();
                                        console.log('Connection error: ', err);
                                        response.render('register', { msg: 'Request to the server failed!' });
                                        return;
                                }

                                if (result.length > 0) {
                                        con.release();
                                        response.render('register', { msg: 'That email is taken. Try another.' });
                                        return;
                                }

                                var email = request.body.email;
                                var firstname = request.body.firstname;
                                var lastname = request.body.lastname;
                                if (!firstname || firstname == '') firstname = 'John';
                                if (!lastname || lastname == '') lastname = 'Doe';
                                var password = crypt.sha256Crypt(request.body.password);
                                //var token = crypt.token(email);

                                var sql = 'INSERT INTO users (email, password, nacl, firstname, lastname) VALUES ?';
                                var values = [[email, password.hash, password.salt, firstname, lastname]];
                                con.query(sql, [values], function (err, result) {
                                        con.release();
                                        if (err) {
                                                console.log('Connection error: ', err);
                                                response.render('register', { msg: 'Request to the server failed!' });
                                                return;
                                        }

                                        response.redirect('/?msg=Registration+successful%21');
                                        //response.redirect('/?msg=Registration+successful%21+Check+your+email+to+verify+your+account%21');
                                });
                        });

                        con.on('error', function (err) {
                                console.log('Connection error: ', err);
                                response.render('register', { msg: 'Server request failed!' });
                                return;
                        });
                });
        });
});

router.post('/ajax-api-session', function (request, response) {
        pool.getConnection(function (err, con) {
                if (err) {
                        console.log('Connection error: ', err);
                        response.send(JSON.stringify({ status: 0 }));
                        return;
                }

                var sql = 'SELECT id FROM users WHERE email = ?';
                var value = request.body.email;
                con.query(sql, [value], function (err, result) {
                        if (err) {
                                con.release();
                                console.log('Connection error: ', err);
                                response.send(JSON.stringify({ status: 0 }));
                                return;
                        }

                        if (result.length > 0) {
                                con.release();
                                request.session.login = true;
                                request.session.userId = result[0].id;
                                request.session.firstname = request.body.firstname;
                                response.send(JSON.stringify({ status: 1 }));
                                return;
                        }

                        var email = request.body.email;
                        var firstname = request.body.firstname;
                        var lastname = request.body.lastname;
                        if (!firstname || firstname == '') firstname = 'John';
                        if (!lastname || lastname == '') lastname = 'Doe';
                        var password = crypt.sha256Crypt(request.body.id);
                        //var token = crypt.token(email);

                        var sql = 'INSERT INTO users (email, password, nacl, firstname, lastname, verified) VALUES ?';
                        var values = [[email, password.hash, password.salt, firstname, lastname, 1]];
                        con.query(sql, [values], function (err, result) {
                                con.release();
                                if (err) {
                                        console.log('Connection error: ', err);
                                        response.send(JSON.stringify({ status: 0 }));
                                        return;
                                }
                                /*
                                request.session.login = true;
                                request.session.userId = res;
                                request.session.firstname = firstname;
                                */
                                response.send(JSON.stringify({ status: 2 }));
                                return;
                        });
                });

                con.on('error', function (err) {
                        console.log('Connection error: ', err);
                        response.send(JSON.stringify({ status: 0 }));
                        return;
                });
        });
});

router.get('/verify', function (request, response) {
        response.send("Verifying temporarily disabled.");
});

router.post('/ajax-rate', function (request, response) {
        //console.log(request.session.userId);
        pool.getConnection(function (err, con) {
                if (err) {
                        console.log('Connection error: ', err);
                        response.send(JSON.stringify({ status: 0 }));
                        return;
                }

                var sql = 'INSERT INTO ratings (userId, movieId, rating) VALUES ?';
                var values = [[request.session.userId, request.body.movieId, request.body.rating]];
                con.query(sql, [values], function (err, result) {
                        con.release();
                        if (err) {
                                console.log('Connection error: ', err);
                                response.send(JSON.stringify({ status: 0 }));
                                return;
                        }

                        response.send(JSON.stringify({ status: 1 }));
                        return;
                });

                con.on('error', function (err) {
                        console.log('Connection error: ', err);
                        response.send(JSON.stringify({ status: 0 }));
                        return;
                });
        });
});

router.post('/ajax-databricks', function (request, response) {
        databricks.run(request.session.userId, function (err) {
                if (err) {
                        console.log('Databricks error: ', err);
                        response.send(JSON.stringify({ status: 0 }));
                        return;
                } else {
                        console.log('Databricks: Job success');

                        dynamo.query(request.session.userId, function (err, data) {
                                if (err) {
                                        console.log('Dynamodb error: ', err);
                                        response.send(JSON.stringify({ status: 0 }));
                                        return;
                                } else {
                                        console.log('Dynamodb: Query success');
                                        console.log(data);

                                        tmdb.query(data, function (movies) {
                                                //console.log(res);
                                                console.log('TMDB: Query success');
                                                response.send(JSON.stringify({ status: 1, movies: movies }));
                                                return;
                                        });
                                }
                        });
                }
        });
});

router.get('/logout', function (request, response) {
        if (loggedOut(request, response)) return;

        request.session.destroy();
        response.redirect('/?msg=Logged+out+successfully%21');
});

router.get('/rate', function (request, response) {
        if (loggedOut(request, response)) return;

	response.render('rate', { msg: request.query.msg, fn: request.session.firstname });
});

router.get('/recommendations', function (request, response) {
        if (loggedOut(request, response)) return;

        response.render('recommendations', { fn: request.session.firstname });
});

router.get('/privacy-policy', function (request, response) {
	response.render('legal/privacy');
});

router.get('/terms-of-service', function (request, response) {
	response.render('legal/terms');
});

router.use(function (request, response) {
        response.status(404).render('errors/404', { url: request.url });
});

router.use(function (request, response) {
        response.status(500).render('errors/500');
});

module.exports = router;
