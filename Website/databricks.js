'use strict';

const request = require('request');

const uri = 'https://<<USERNAME>>:<<PASSWORD>>@<<DATABRICKS ADDRESS>>/api/2.0/jobs/';

var check = function (run_id, callback) {
        request({
                uri: uri + 'runs/list?completed_only=true&job_id=4',
                method: 'GET'
        }, function (err, response, body) {
                if (err) {
                        console.log('Databricks error: ', err);
                        callback(false);
                } else {
                        body = JSON.parse(body);

                        let job = body.runs;
                        for (let i in job) {
                                if (job[i].run_id == run_id) {
                                        callback(true);
                                        break;
                                }
                        }
                }
        });
}

module.exports.run = function (userId, callback) {
        console.log('Databricks: Running job');

        request({
                uri: uri + 'run-now',
                method: 'POST',
                json: {
                        'job_id': 4,
                        'notebook_params': {
                                'userId': userId
                        }
                }
        }, function (err, response, body) {
                if (err) {
                        callback(err);
                } else {
                        var run_id = body.run_id;

                        var timeout = setInterval(function () {
                                console.log('Databricks: Checking job status...');

                                check(run_id, function (bool) {
                                        if (bool) {
                                                console.log('Databricks: Timer cleared');
                                                clearInterval(timeout);
                                                callback(null);
                                                return;
                                        }
                                });
                        }, 12000);
                }
        });
};
