// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Create the DynamoDB service object
const ddb = new AWS.DynamoDB.DocumentClient();
// dynamoDB table
const firmwareTable = process.env.FIRMWARE_TABLE;
//read current version from query parameter
//read most recent data from db
// use semver to compare version and return firmware if version has been updated
// form pre-signed url from data returned from db
// return donwload url to device 
exports.handler = async (event) => {
    console.log('Processing event: ', event)
    //read query parameter
    const currentVersion = getQueryParameter(event,'rawVersion');
    console.log(currentVersion);
    //read data from dataBase
    const params = {
        TableName: firmwareTable,
        KeyConditionExpression: "#deviceType = :deviceType",
        ExpressionAttributeValues: {
            ":deviceType": deviceType
        },
        "Limit": "1",
        "ScanIndexForward": false
    };
    const result = await ddb.query(params).promise();
    console.log(result);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            "data": result,
        }),
    }
  }