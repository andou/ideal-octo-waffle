import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { AppLambda, LambdaInterface, logger, metrics, tracer } from "../common/powertools";

class Lambda extends AppLambda implements LambdaInterface {
  // eslint-disable-next-line @typescript-eslint/require-await
  @tracer.captureLambdaHandler({ captureResponse: false })
  @logger.injectLambdaContext({ logEvent: true })
  @metrics.logMetrics({ throwOnEmptyMetrics: false, captureColdStartMetric: true })
  public async handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const awsRequestId = context.awsRequestId;
    logger.appendKeys({ awsRequestId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "hello"
      })
    };
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
