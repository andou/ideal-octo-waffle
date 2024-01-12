import { Construct } from "constructs";
import { PREFIX } from "../configs";
import { Attribute, BillingMode, ProjectionType, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";

export class IdealOctoWaffleDynamoTable extends Construct {
  private _table: Table;

  public get table(): Table {
    return this._table;
  }
  public set table(value: Table) {
    this._table = value;
  }

  private _name: string;

  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }

  private _arn: string;

  public get arn(): string {
    return this._arn;
  }
  public set arn(value: string) {
    this._arn = value;
  }

  constructor(
    scope: Construct,
    id: string,
    partitionKey: Attribute,
    sortKey: Attribute | undefined = undefined,
    removalPolicy = RemovalPolicy.DESTROY,
    billingMode: BillingMode | undefined = BillingMode.PAY_PER_REQUEST,
    tableName = id
  ) {
    super(scope, `${id}-tbl`);
    this.name = `${PREFIX}-${tableName}`;
    this.table = new Table(this, `${PREFIX}-${tableName}`, {
      tableName: this.name,
      partitionKey,
      sortKey,
      removalPolicy,
      billingMode
    });
    this.arn = this.table.tableArn;
  }

  public addGSI(
    indexName: string,
    partitionKey: Attribute,
    sortKey: Attribute | undefined = undefined,
    projectionType = ProjectionType.ALL
  ): IdealOctoWaffleDynamoTable {
    this.table.addGlobalSecondaryIndex({
      indexName,
      partitionKey,
      sortKey,
      projectionType
    });
    return this;
  }
}
