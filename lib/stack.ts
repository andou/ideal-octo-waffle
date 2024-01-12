import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IdealOctoWaffleLambda } from "./constructs/lambda";
import { IdealOctoWaffleDynamoTable } from "./constructs/dynamo";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { PREFIX, REGION } from "./configs";
import { IdealOctoWaffleS3 } from "./constructs/s3";
import { EventType } from "aws-cdk-lib/aws-s3";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class IdealOctoWaffleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, "api", {
      restApiName: "IdealOctoWaffle",
      description: "IdealOctoWaffle / Description",
      deployOptions: {
        stageName: "dev"
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["http://localhost:3000"]
      }
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////  PRODUCTS  //////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const productsDynamoTable = new IdealOctoWaffleDynamoTable(
      this,
      "products-tbl",
      {
        name: "sku",
        type: AttributeType.STRING
      },
      {
        name: "sk",
        type: AttributeType.STRING
      }
    );

    const productsGetLambda = new IdealOctoWaffleLambda(this, "products", `products`, `get.ts`, {
      TABLE_NAME: productsDynamoTable.name
    });

    productsGetLambda.role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dynamodb:Query", "dynamodb:Scan"],
        resources: [productsDynamoTable.arn]
      })
    );

    api.root
      .resourceForPath("/products/")
      .addMethod("GET", new LambdaIntegration(productsGetLambda.lambda, { proxy: true }), {
        apiKeyRequired: true
      });

    api.root
      .resourceForPath("/products/{sku}")
      .addMethod("GET", new LambdaIntegration(productsGetLambda.lambda, { proxy: true }), {
        apiKeyRequired: true
      });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////  API KEY  ///////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const apiPlan = api.addUsagePlan(`${PREFIX}-api-usage-plan`, {
      name: "Basic Usage Plan",
      throttle: {
        rateLimit: 10,
        burstLimit: 2
      }
    });

    const key = api.addApiKey(`${PREFIX}-api-key`, {
      apiKeyName: `${PREFIX}-api-key`
    });
    apiPlan.addApiKey(key);

    new CfnOutput(this, `apiKeyId`, {
      value: key.keyId,
      exportName: "apiKeyId"
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////  IMPORT  ///////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const importBucket = new IdealOctoWaffleS3(this, "import");
    const importLambda = new IdealOctoWaffleLambda(this, "import", `import`, `index.ts`, {
      TABLE_NAME: productsDynamoTable.name,
      BATCH_WRITE_ITEM_MAX: "25",
      REGION
    });
    const s3ImportEventSource = new S3EventSource(importBucket.bucket, {
      events: [EventType.OBJECT_CREATED_PUT]
    });
    importLambda.lambda.addEventSource(s3ImportEventSource);

    importLambda.lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:GetObject", "s3:GetObjectVersion"],
        resources: [importBucket.bucket.bucketArn, `${importBucket.bucket.bucketArn}/*`]
      })
    );

    importLambda.role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dynamodb:BatchWriteItem"],
        resources: [productsDynamoTable.arn]
      })
    );

    new CfnOutput(this, `s3UrlForObject`, {
      value: importBucket.bucket.s3UrlForObject(),
      exportName: "s3UrlForObject"
    });
  }
}
