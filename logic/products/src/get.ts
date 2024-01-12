import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { AppLambda, LambdaInterface, logger, metrics, tracer } from "../common/powertools";

const TABLE_NAME = process.env.TABLE_NAME || "";

const dynamodbClient = tracer.captureAWSv3Client(new DynamoDBClient({}));

type TProduct = {
  sku: string;
  name: string;
  price: number;
  quantity: number;
};

class Lambda extends AppLambda implements LambdaInterface {
  @tracer.captureLambdaHandler({ captureResponse: false })
  @logger.injectLambdaContext({ logEvent: true })
  @metrics.logMetrics({ throwOnEmptyMetrics: false, captureColdStartMetric: true })
  public async handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const awsRequestId = context.awsRequestId;
    logger.appendKeys({ awsRequestId });

    const sku = this.getSkuParameter(event);

    logger.appendKeys({
      sku
    });

    if (sku === false) {
      const products = await this.getAllProducts();

      return {
        statusCode: 200,
        body: JSON.stringify({
          products
        })
      };
    } else {
      const product = await this.getProductBySku(sku as string);

      return {
        statusCode: product.length ? 200 : 404,
        body: JSON.stringify({
          product
        })
      };
    }
  }

  public getSkuParameter(event: APIGatewayProxyEvent): string | boolean {
    if (event.pathParameters && event.pathParameters.sku) {
      const sku = event.pathParameters.sku;
      return sku;
    }
    return false;
  }

  @tracer.captureMethod()
  public async getProductBySku(sku: string): Promise<TProduct[]> {
    const queryParams: QueryCommandInput = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "sku = :sku",
      ExpressionAttributeValues: marshall({
        ":sku": `${sku}`
      })
    };

    const productsReq = await dynamodbClient.send(new QueryCommand(queryParams));
    const products = productsReq.Items as unknown;

    return (products as TProduct[]) || [];
  }

  @tracer.captureMethod()
  public async getAllProducts(): Promise<TProduct[]> {
    const queryParams: ScanCommandInput = {
      TableName: TABLE_NAME
    };

    const productsReq = await dynamodbClient.send(new ScanCommand(queryParams));
    const products = productsReq.Items as unknown;

    return (products as TProduct[]) || [];
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
