import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PREFIX } from "../configs";
import { Bucket, BucketEncryption, HttpMethods, ObjectOwnership } from "aws-cdk-lib/aws-s3";

export class IdealOctoWaffleS3 extends Construct {
  private _bucket: Bucket;

  public get bucket(): Bucket {
    return this._bucket;
  }
  public set bucket(value: Bucket) {
    this._bucket = value;
  }

  private _bucketName: string;

  public get bucketName(): string {
    return this._bucketName;
  }
  public set bucketName(value: string) {
    this._bucketName = value;
  }

  constructor(
    scope: Construct,
    id: string,
    versioned = false,
    isLoggingBucket = false,
    bucketName = id,
    abortIncompleteMultipartUploadAfter = 1
  ) {
    super(scope, `${id}-bkt`);
    this.bucketName = `${PREFIX}-${bucketName}`;

    this.bucket = new Bucket(this, id, {
      bucketName: this._bucketName,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: Duration.days(abortIncompleteMultipartUploadAfter)
        }
      ],
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      },
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      transferAcceleration: true,
      versioned,
      cors: [
        {
          allowedOrigins: ["*"], // TODO set origins
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
          exposedHeaders: ["ETag"]
        }
      ],
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: isLoggingBucket ? ObjectOwnership.BUCKET_OWNER_PREFERRED : ObjectOwnership.BUCKET_OWNER_ENFORCED
    });
  }
}
