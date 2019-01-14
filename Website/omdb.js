'use strict';

const async = require('async');
const request = require('request');

const link = 'https://www.omdbapi.com/?t=TITLE&apikey=<<API KEY>>';

function links(titles) {
        console.log('creating links');
        let ret = [];

        for (let i = 0; i < titles.length; ++i) {
                //titles[i] = titles[i].split(' ').join('+');
                ret.push(link.replace('TITLE', titles[i]));
        }

        return ret;
}

function get(url, callback) {
        console.log('requesting');
        request({ url: url, json: true }, function (err, response, body) {
                console.log('callback');
                callback(err, body.Poster);
        });
}

module.exports.query = function (titles, callback) {
        console.log('quering');
        let urls = links(titles);

        console.log('async requests');
        async.map(urls, get, function (err, response) {
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
