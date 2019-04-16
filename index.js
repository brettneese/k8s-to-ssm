#!/usr/bin/env node
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });

var yaml = require("js-yaml");
const ssm = new AWS.SSM({ apiVersion: "2014-11-06" });

let stdin = process.openStdin();
let data = "";

let destinationPath = process.argv[2];

if (destinationPath.slice(-1) == "/") {
  destinationPath = destinationPath.slice(0, -1);
}

async function addParam(key, value, type, allowUpdate) {
  let param = {
    Name: destinationPath + "/" + key,
    Type: type || "SecureString",
    Value: Buffer.from(value, "base64").toString(),
    Overwrite: (allowUpdate && allowUpdate == "false") || true
  };

  ssm.putParameter(param, function(err, data) {
    if (err) {
      console.log("Error adding parameter: " + param.Name);
      console.log(err, err.stack);
    } else {
      console.log("Added/updated parameter: " + param.Name);
    }
  });
}

stdin.on("data", function(chunk) {
  data += chunk;
});

stdin.on("end", function() {
  try {
    let items = JSON.parse(data).items;
  } catch (e) {
    items = yaml.safeLoadAll(data);

    if (items.items) {
      items = items.items;
    }
  }

  items.forEach(function(item) {
    if (item.type != "kubernetes.io/service-account-token") {
      Object.keys(item.data).forEach(async function(key) {
        addParam(
          item.metadata.name + "/" + key,
          item.data[key],
          item.metadata.annotations &&
            item.metadata.annotations["awsParam.Type"]
            ? item.metadata.annotations["awsParam.Type"]
            : null,
          item.metadata.annotations &&
            item.metadata.annotations["awsParam.allowUpdate"]
            ? item.metadata.annotations["awsParam.allowUpdate"]
            : null
        );
      });
    }
  });
});
