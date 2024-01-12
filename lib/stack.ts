import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IdealOctoWaffleLambda } from "./constructs/lambda";
import { IdealOctoWaffleDynamoTable } from "./constructs/dynamo";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { PREFIX } from "./configs";

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

    const productsDynamoTable = new IdealOctoWaffleDynamoTable(this, "products", {
      name: "sku",
      type: AttributeType.STRING
    });

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
  }
}
