import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IdealOctoWaffleLambda } from "./constructs/lambda";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";

export class IdealOctoWaffleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hello = new IdealOctoWaffleLambda(this, "hello-world-handler", "./lib/lambdas/hello/index.ts", {});

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

    const resource = api.root.addResource("products");

    resource.addMethod("GET", new LambdaIntegration(hello.lambda, { proxy: true }));
  }
}
