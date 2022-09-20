// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Create the DynamoDB service object
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
exports.handler = async (event) => {
    const bucketName = event.Records[0].s3.bucket.name;
    const fileName = event.Records[0].s3.object.key;
    const s3Time = event.Records[0].eventTime;
    const version = fileName.substring(9,15);
    console.log(event);    
    
    const params = {
        TableName: process.env.FIRMWARE_TABLE,
        Item: {
            'firmware_version': {S: version},
            'fileName': {S: fileName},
            'bucketName': {S: bucketName},
            'timestamp' : {S: s3Time},
        },
    };
    
    // Adding the items into the DynamoDB table
    try {
        const data = await ddb.putItem(params).promise();
        console.log('Data:',data);
        return data;
    }
    catch (err) {
        console.log(err);
        const message = `Error inserting object ${firmware_version} into table.`;
        console.log(message);
        throw new Error(message);
    }
};


