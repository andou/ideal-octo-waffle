import * as config from "config";
import { Tracing } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

const PROJECT_NAME = config.get<string>("project_name");
const ENV = config.get<string>("env");
const REGION = config.get<string>("region");
const COMPONENT_NAME = config.get<string>("component_name");
const RETENTION_PERIOD = config.get<RetentionDays>("lambda_retention_period");
const LAMBDA_TRACING = config.get<Tracing>("tracing");
const STAGE_NAME = config.get<string>("env");
const PREFIX = `${PROJECT_NAME}-${ENV}-${COMPONENT_NAME}`;

export { PROJECT_NAME, ENV, REGION, COMPONENT_NAME, RETENTION_PERIOD, LAMBDA_TRACING, STAGE_NAME, PREFIX };
