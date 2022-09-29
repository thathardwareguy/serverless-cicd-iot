const AWS = require('aws-sdk');
const semver = require("semver");

exports.handler = async (event) => {
  try {
    const versionValid = validateVersionParam(event);

    // is rawVersion valid?
    if (!versionValid) {
      console.log("Failed to Pass Query Parameter");

      return response({
        statusCode: 400,
        data: {
          error: "Invalid Parameter",
        },
      });
    }

    const currentVersion = event.queryStringParameters.rawVersion;

    const dbResult = await readDataFromDb();
    const needsUpdate = await checkForUpdate(dbResult, currentVersion);

    if (needsUpdate) {
      const url = getSignedUrl(dbResult); //await getSignedUrl(dbResult);

      // return download url to device
      return response({
        statusCode: 200,
        data: {
          Response: url,
        },
      });
    } else {
      return response({
        statusCode: 200,
        data: {
          Response: "Device up to date",
        },
      });
    }
  } catch (error) {
    console.log(error);

    return response({
      statusCode: 503,
      data: {
        error: "An error occurred. Try again later.",
        stack: { error }, // So the client can see or trace error. Remove if not required.
      },
    });
  }
};

/**
 * Read/Query the most recent data from dynamo db.
 *
 * @returns DynamoDB query output
 */
const readDataFromDb = async () => {
  // dynamoDB table
  const firmwareTable = process.env.FIRMWARE_TABLE;
  const params = {
    TableName: firmwareTable,
    KeyConditionExpression: "#deviceType = :deviceType",
    ExpressionAttributeNames: {
      "#deviceType": "deviceType",
    },
    ExpressionAttributeValues: {
      ":deviceType": "esp32",
    },
  };

  // Create the DynamoDB service object
  const ddb = new AWS.DynamoDB.DocumentClient();

  // read most recent data from db
  const result = await ddb.query(params).promise();

  return result;
};

/**
 * This checks if an update is required.
 * Checks if the `currentVersion` is greater than the `firmwareVersion` on the database
 *
 * @param {StPromiseResult<AWS.DynamoDB.DocumentClient.QueryOutput, AWS.AWSError>ring} result
 * @param {String} currentVersion
 *
 * @returns Boolean
 */
const checkForUpdate = async (result, currentVersion) => {
  const firmwareVersion = result.Items[0].firmwareVersion;
  // check if device needs update
  const needsUpdate = semver.gt(firmwareVersion, currentVersion);

  return needsUpdate;
};

/**
 * Gets the signed download url from the database result.
 *
 * @param {StPromiseResult<AWS.DynamoDB.DocumentClient.QueryOutput, AWS.AWSError>ring} result
 * @returns Promise<string>
 */
const getSignedUrl = (result) => {
  // Create s3 service object
  //const s3 = new AWS.S3();
   /*
  // signed url parameters
  const bucketDetails = {
    Bucket: result.Items[0].bucketName,
    Key: result.Items[0].fileName,
    Expires: 60 * 5,
  };
  */
  const url = `http://${result.Items[0].bucketName}.s3.us-east-2.amazonaws.com/${result.Items[0].fileName}`
  // form pre-signed url from data returned from db 
  /*
  const url = await new Promise((resolve, reject) => {
    s3.getSignedUrl("getObject", bucketDetails, (err, url) => {
      err ? reject(err) : resolve(url);
    });
  });
  */

  return url;
};

/**
 * Checks if the version `rawVersion` is defined and valid.
 * `rawVersion` must be passed as a query parameter and defined under `event.queryStringParameters`
 * @param {AwsEvent} event
 * @returns boolean
 */
const validateVersionParam = (event) => {
  // check if event.queryStringParameters is defined
  const params = event.queryStringParameters;
  if (params !== undefined || params !== null) {
    // check if rawVersion is defined
    if (params.rawVersion !== undefined || params.rawVersion !== null) {
      const rawVersion = params.rawVersion;

      // Ensure rawVersion is a string
      if (typeof rawVersion === "string") {
        // version must be in format v0.0.1
        // v[int].[int].[int]
        const versionFormat = /^v[0-9].[0-9].[0-9]/g;

        if (versionFormat.test(rawVersion)) {
          return true;
        }

        return false;
      }

      return false;
    }

    return false;
  }

  return false;
};

/**
 * Builds the response object and returns it.
 *
 * @param {Number} statusCode the status code of the response.
 * @param {Object} data the body of the response containing the response data
 * @param {Object} header optional headers to add
 * @returns Response body
 */
const response = ({ statusCode, data, header = {} }) => {
  // Merge default headers with possible optionals headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    ...header,
  };
  const body = JSON.stringify(data);

  return {
    statusCode,
    headers,
    body,
  };
};
