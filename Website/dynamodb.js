'use strict';

var AWS = require("aws-sdk");

AWS.config.update({
        region: "<<AWS REGION>>",
        endpoint: "<<AWS ENDPOINT ADDRESS>>",
        StreamArn: "<<AWS STREAMARN>>"
});

var dynamo = new AWS.DynamoDB.DocumentClient();

module.exports.query = function(userId, func) {
        console.log('Dynamodb: Running query');
        var array = [];

        var params = {
                TableName : "<<DYNAMODB TABLE>>",
                KeyConditionExpression: "#ui = :id",
                ExpressionAttributeNames:{
                        "#ui": "userId"
                },
                ExpressionAttributeValues: {
                        ":id": userId
                }
        };

        dynamo.query(params, function(err, data) {
                if (err) {
                        func(err, null);
                } else {
                        data.Items.forEach(function (item) {
                                array = item.Movies.values
                                //console.log(array);
                                func(null, array);
                        });
                }
        }, array);
};
