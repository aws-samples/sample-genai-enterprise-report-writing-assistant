import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
  StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { NagSuppressions } from "cdk-nag";

export class DynamoDbTables extends Construct {
  public readonly conversationMemoryTable: Table;
  public readonly associateSubmissionTable: Table;
  public readonly associateSubmissionTableGsiName: string;

  private SUBMISSION_TABLE_GSI =
    "SubmissionDateIndex";

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a dynamodb table to serve as conversation memory table
    const conversationMemoryTable = new Table(this, "ConversationMemoryTable", {
      partitionKey: { name: "session_id", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Create a dynamodb table for associate submissions
    const associateSubmissionTable = new Table(
      this,
      "SubmissionsTable",
      {
        partitionKey: { name: "name", type: AttributeType.STRING },
        sortKey: { name: "submission_ts", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.DESTROY,
        stream: StreamViewType.NEW_AND_OLD_IMAGES,
      }
    );

    // Add a Global Secondary Index for querying by category, so managers can view all
    // directs' submission within a time range
    associateSubmissionTable.addGlobalSecondaryIndex({
      indexName: this.SUBMISSION_TABLE_GSI,
      partitionKey: { name: "category", type: AttributeType.STRING },
      sortKey: { name: "submission_ts", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    NagSuppressions.addResourceSuppressions(
      conversationMemoryTable,
      [
        {
          id: "AwsSolutions-DDB3",
          reason: "Point-in-time Recovery not required for demo solution.",
        },
      ],
      true
    );
    NagSuppressions.addResourceSuppressions(
      associateSubmissionTable,
      [
        {
          id: "AwsSolutions-DDB3",
          reason: "Point-in-time Recovery not required for demo solution.",
        },
      ],
      true
    );

    this.conversationMemoryTable = conversationMemoryTable;
    this.associateSubmissionTable = associateSubmissionTable;
    this.associateSubmissionTableGsiName =
      this.SUBMISSION_TABLE_GSI;
  }
}
