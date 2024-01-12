import { Context, S3Event } from "aws-lambda";
import { AppLambda, LambdaInterface, logger, metrics, tracer } from "../../common/powertools";
import { BatchWriteItemCommand, BatchWriteItemCommandInput, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, GetObjectCommandInput, GetObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import { marshall } from "@aws-sdk/util-dynamodb";
import { TProductImport, TStockImport } from "../../common/types";
import { parse } from "csv-parse/sync";

const dynamodbClient = tracer.captureAWSv3Client(new DynamoDBClient({}));
const batchWriteItemMax = Number(process.env.BATCH_WRITE_ITEM_MAX || "25");
const TABLE_NAME = process.env.TABLE_NAME || "";

const s3Client = tracer.captureAWSv3Client(
  new S3Client({
    region: process.env.REGION
  })
);
interface ILine {
  sk: string;
}
class Lambda extends AppLambda implements LambdaInterface {
  @tracer.captureLambdaHandler({ captureResponse: false })
  @logger.injectLambdaContext({ logEvent: true })
  @metrics.logMetrics({ throwOnEmptyMetrics: false, captureColdStartMetric: true })
  public async handler(event: S3Event, context: Context): Promise<void> {
    const awsRequestId = context.awsRequestId;
    logger.appendKeys({ awsRequestId });

    if (event && event.Records) {
      for (const record of event.Records) {
        const objectKey = record.s3.object.key;
        const splittedObjectKey = objectKey.split("/");
        if (splittedObjectKey.length === 2 && splittedObjectKey[1] && splittedObjectKey[1] !== "") {
          const importType = splittedObjectKey[0];
          if (importType === "products") {
            const file = await this.getS3Object(record.s3.bucket.name, objectKey);
            const records: TProductImport[] = parse(file, {
              delimiter: ",",
              columns: true,
              skip_empty_lines: true,
              on_record: (line: ILine) => {
                line.sk = "data";
                return line;
              }
            }) as TProductImport[];
            logger.info("records", { records });

            await this.persistData(records);
          } else if (importType === "stock") {
            const file = await this.getS3Object(record.s3.bucket.name, objectKey);

            const records: TStockImport[] = parse(file, {
              delimiter: ",",
              columns: true,
              skip_empty_lines: true,
              on_record: (line: ILine) => {
                line.sk = "stock";
                return line;
              }
            }) as TStockImport[];

            logger.info("records", { records });

            await this.persistData(records);
          }
        }
      }
    }

    return;
  }

  @tracer.captureMethod()
  public async getS3Object(bucketName: string, objectS3Key: string): Promise<string | undefined> {
    try {
      const input: GetObjectCommandInput = {
        Bucket: bucketName,
        Key: objectS3Key
      };
      const command = new GetObjectCommand(input);
      const result: GetObjectCommandOutput = await s3Client.send(command);

      return result.Body?.transformToString("utf-8");
    } catch (error) {
      logger.error(`S3 Client ERROR: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  @tracer.captureMethod()
  public async persistData(data: Array<TProductImport | TStockImport>): Promise<void> {
    const itemsBatchesNumber = Math.ceil(data.length / batchWriteItemMax);
    logger.debug(`${data.length} / ${batchWriteItemMax} = ${itemsBatchesNumber} batches`);
    for (let batchIndex = 0; batchIndex < itemsBatchesNumber; batchIndex++) {
      const batchItems = data.slice(batchWriteItemMax * batchIndex, batchWriteItemMax * (batchIndex + 1));
      const command = new BatchWriteItemCommand(this.marshallData(batchItems));
      const res = await dynamodbClient.send(command);
      if (res.UnprocessedItems) {
        const unprocessedItems = res.UnprocessedItems;
        logger.debug("UnprocessedItems ->", { unprocessedItems });
      }
    }
    return;
  }

  public marshallData(data: Array<TStockImport | TProductImport>): BatchWriteItemCommandInput {
    return {
      RequestItems: {
        [TABLE_NAME]: data.map((item) => ({
          PutRequest: {
            Item: marshall(item)
          }
        }))
      }
    };
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
