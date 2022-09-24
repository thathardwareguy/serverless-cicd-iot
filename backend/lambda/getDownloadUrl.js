// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Create the DynamoDB service object
const ddb = new AWS.DynamoDB.DocumentClient();
// dynamoDB table
const firmwareTable = process.env.FIRMWARE_TABLE;
// Create s3 service object
const s3 = new AWS.S3();
// use semver to compare version and return firmware if version has been updated
const semver = require('semver');
 
exports.handler = async (event) => {
    console.log('Processing event: ', event)
    let currentVersion;
    let url;
    try {
       //read current version from query parameter
    currentVersion = passVersionParameter(event);  
    } catch (error) {
        console.log('Failed to Pass Query Parameter',error.message)
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error : 'Invalid Parameter'
            })
        } 
    }
   
    console.log(currentVersion);
    //read most recent data from db
    const params = {
        TableName: firmwareTable,
        KeyConditionExpression: "#deviceType = :deviceType",
        ExpressionAttributeNames: {
            "#deviceType": "deviceType"
        },
        ExpressionAttributeValues: {
            ":deviceType": "esp32"
        }
    };
    const result = await ddb.query(params).promise();
    console.log(result);
    const firmwareVersion = result.Items[0].firmwareVersion;
    // check if device needs update
    const needsUpdate = semver.gt(firmwareVersion, currentVersion)
    console.log(needsUpdate);

    if(needsUpdate){
      // signed url parameters
    const bucketDetails = {
        Bucket: result.Items[0].bucketName,
        Key: result.Items[0].fileName,
        Expires: 60 * 5
      };
    console.log(bucketDetails);
    // form pre-signed url from data returned from db
    try {
          url = await new Promise((resolve, reject) => {
          s3.getSignedUrl('getObject', bucketDetails, (err, url) => {
            err ? reject(err) : resolve(url);
          });
        });
        console.log(url)
      } catch (err) {
        if (err) {
          console.log(err)
        }
      }
    // return download url to device
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            "Response" : url
        })
    }
    }
    else
    {
       return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            Response : 'Device up to date'
        })
    }
    }
    
  };
function passVersionParameter(event)
{
 const version = event.queryStringParameters.rawVersion;
 if (!version){
   return undefined;
 }
 return version;
}
