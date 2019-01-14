'use strict';

const async = require('async');
const request = require('request');

const link = 'https://image.tmdb.org/t/p/w185';

function get(title, callback) {
        console.log('requesting');
        request({
                url: 'https://api.themoviedb.org/3/search/movie',
                json: true,
                qs: {
                        include_adult: 'false',
                        page: '1',
                        language: 'en-US',
                        api_key: '<<API KEY>>',
                        query: title
                },
                body: '{}'
        }, function (err, response, body) {
                console.log('callback');
                let image = link + body.results[0].poster_path;
                callback(err, image);
        });
}

module.exports.query = function (titles, callback) {
        console.log('async requests');
        async.map(titles, get, function (err, response) {
                if (err) {
                        console.log(err);
                } else {
                        console.log('sorting');
                        let ret = [];

                        for (let i in response) {
                                let t = { title: titles[i], poster: response[i] };
                                ret.push(t);
                        }

                        callback(ret);
                }
        });
};
