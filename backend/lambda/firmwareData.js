// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Create the DynamoDB service object
const ddb = new AWS.DynamoDB.DocumentClient();
exports.handler = async (event) => {
    const bucketName = event.Records[0].s3.bucket.name;
    const fileName = event.Records[0].s3.object.key;
    const s3Time = event.Records[0].eventTime;
    const [file,deviceType,ver] = fileName.split("_");
    const version = ver.replace(/\.[^/.]+$/, "");
    console.log(event);    
    // Data object
    const params = {
        TableName: process.env.FIRMWARE_TABLE,
        Item: {
             deviceType: deviceType,
             firmware_version: version,
             fileName: fileName,
             bucketName: bucketName,
             timestamp:  s3Time,
        },
    };
    
    // Adding the items into the DynamoDB table
    try {
        const {data} = await ddb.put(params).promise();
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


