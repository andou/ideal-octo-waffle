import { Construct } from "constructs";
import { LAMBDA_TRACING, PREFIX, PROJECT_NAME, REGION, RETENTION_PERIOD } from "../configs";

import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Effect, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LAMBDA_ROOT_DIR, LAMBDA_SRC_DIR } from "../configs/lambda_runtime";

const commonNodeJsProps = {
  runtime: Runtime.NODEJS_18_X,
  handler: "index.handler",
  tracing: LAMBDA_TRACING,
  logRetention: RETENTION_PERIOD,
  initialPolicy: undefined
};

export class IdealOctoWaffleLambda extends Construct {
  private _lambdaName: string;

  public get lambdaName(): string {
    return this._lambdaName;
  }
  public set lambdaName(value: string) {
    this._lambdaName = value;
  }

  private _lambda: NodejsFunction;

  public get lambda(): NodejsFunction {
    return this._lambda;
  }
  public set lambda(value: NodejsFunction) {
    this._lambda = value;
  }

  private _role: Role;
  public get role(): Role {
    return this._role;
  }
  public set role(value: Role) {
    this._role = value;
  }

  constructor(
    scope: Construct,
    id: string,
    folder: string,
    handler = "index.ts",
    environment?:
      | {
          [key: string]: string;
        }
      | undefined,
    lambdaName = id,
    timeout: Duration | undefined = undefined
  ) {
    super(scope, `${id}-lmb`);

    this.lambdaName = `${PREFIX}-${lambdaName}`;

    const lambdaLogGroup = new LogGroup(this, `${lambdaName}-log-group`, {
      logGroupName: `/aws/lambda/${lambdaName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RETENTION_PERIOD
    });

    this.role = new Role(this, `${lambdaName}-lambda-role`, {
      roleName: `${lambdaName}-lambda-role`,
      assumedBy: new ServicePrincipal("lambda.amazonaws.com")
    });

    this.lambda = new NodejsFunction(this, lambdaName, {
      ...commonNodeJsProps,
      entry: `./${LAMBDA_ROOT_DIR}/${folder}/${LAMBDA_SRC_DIR}/${handler}`,
      depsLockFilePath: `./${LAMBDA_ROOT_DIR}/${folder}/yarn.lock`,
      environment: {
        ...environment,
        SERVICE_NAME: this.lambdaName,
        REGION: REGION,
        NAMESPACE: PROJECT_NAME
      },
      functionName: lambdaName,
      role: this.role,
      timeout
    });

    this.lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
        resources: [lambdaLogGroup.logGroupArn]
      })
    );
  }
}
