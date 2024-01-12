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

### Retrieve the api key

**_NOTE_** Change `dev` in the command below accordingly to the environment you have choose,

```
aws apigateway get-api-key --api-key $(cat cdk-outputs.json | jq -r '."ideal-octo-waffle-dev-main-stack".apiKeyId') --include-value | jq -r '.value'
```
