# Ideal Octo Waffle

## Running the project

### Authenticate

Export an authenticated profile

```
export AWS_PROFILE=<your_profile>
```

### Clone the project

```
git clone git@github.com:andou/ideal-octo-waffle.git
```

### Install dependencies

```
yarn
```

### Choose an environment

Export the NODE_ENV variable with the environment of your choose, e.g. `dev`

```
export NODE_ENV=dev
```

For sake of simplicity, let's stick with the `dev` convention from now on, ok?

Create a conf file for this environment, `config/dev.yaml`

```
env: dev
account_number: "specify-the-account-number"
region: specify-the-region
```

### Bootstrap CDK

```
cdk bootstrap
```

### Deploy the stack

```
cdk deploy --outputs-file ./cdk-outputs.json
```

### Retrieve the S3 bucket where to upload files

```
cat cdk-outputs.json | jq -r '."ideal-octo-waffle-dev-main-stack".s3UrlForObject'
```

### Upload some data

**_NOTE_** Change `dev` in the command below accordingly to the environment you have choose,

```
aws s3 cp sample/products_10.csv $(cat cdk-outputs.json | jq -r '."ideal-octo-waffle-dev-main-stack".s3UrlForObject')/products/products_10.csv
aws s3 cp sample/stocks_10.csv $(cat cdk-outputs.json | jq -r '."ideal-octo-waffle-dev-main-stack".s3UrlForObject')/stock/stocks_10.csv
```

### Make some API call

First, retrieve the api key

**_NOTE_** Change `dev` in the command below accordingly to the environment you have choose,

```
aws apigateway get-api-key --api-key $(cat cdk-outputs.json | jq -r '."ideal-octo-waffle-dev-main-stack".apiKeyId') --include-value | jq -r '.value'
```

and the API ID

```
cat cdk-outputs.json | jq -r '."ideal-octo-waffle-dev-main-stack".restApiId'
```

then you can fetch a single product

```
curl --header "x-api-key: <your_key>" https://<restApiId>.execute-api.eu-west-1.amazonaws.com/dev/products/09-8086714 | jq

```

```json
{
  "price": "42.57",
  "name": "Radish",
  "sku": "09-8086714",
  "quantity": "1234"
}
```

or all the products

```
curl --header "x-api-key: <your_key>" https://<restApiId>.execute-api.eu-west-1.amazonaws.com/dev/products/ | jq
```

```json
{
  "products": [
    {
      "price": "2.5",
      "name": "Water Chestnut - Canned",
      "sku": "55-4451992",
      "quantity": "578"
    },
    {
      "price": "8.51",
      "name": "Cheese - CiccioPasticcio",
      "sku": "65-2543216",
      "quantity": "399"
    },
    {
      "price": "56.29",
      "name": "Energy - Boo - Koo",
      "sku": "44-3995800",
      "quantity": "799"
    }
  ]
}
```

### Clean everything up

```
cdk destroy
```

## Improvements

### Get all products

The API to retrieve all products performs a scan of the whole table does not use pagination. The API should be modified to take pagination into account and reduce large amount of data to be transferred at each call.

### Sync file read

The data import performs a synchronous reading of the CSV file uploaded to S3 before parsing it. On very large CSV files, this could be a problem. It would be more appropriate to read from a buffer and parse accordingly.

### Sync batch write

Once the file is parsed, the data is inserted into DynamoDB by the same Lambda through a batch write. It would be better if the records were sent to an SQS queue to be dequeued by another Lambda, which would then perform the writing to DynamoDB.
