import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics, MetricUnits } from "@aws-lambda-powertools/metrics";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { LogLevel } from "@aws-lambda-powertools/logger/lib/types";
import { LambdaInterface } from "@aws-lambda-powertools/commons";

const namespace: string = process.env.NAMESPACE || "";
const serviceName: string = process.env.SERVICE_NAME || "";

const logger: Logger = new Logger({
  serviceName: process.env.SERVICE_NAME,
  logLevel: (process.env.LOG_LEVEL || "INFO") as LogLevel
});

const tracer = new Tracer({ serviceName: namespace });

const metrics = new Metrics({ namespace, serviceName });

class AppLambda {}

export { logger, metrics, tracer, AppLambda, LambdaInterface, MetricUnits };
