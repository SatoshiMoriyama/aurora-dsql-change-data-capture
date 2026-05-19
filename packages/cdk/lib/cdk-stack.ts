import * as path from 'node:path';
import * as dsql from '@aws-cdk/aws-dsql-alpha';
import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import type { Construct } from 'constructs';

export class AuroraDsqlCdcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Aurora DSQL クラスタ
    const cluster = new dsql.Cluster(this, 'DsqlCluster', {
      deletionProtection: false,
    });

    // Kinesis Data Stream（CDC イベントの送信先）
    const stream = new kinesis.Stream(this, 'CdcStream', {
      streamName: 'dsql-cdc-stream',
      streamMode: kinesis.StreamMode.ON_DEMAND,
    });

    // CDC 用 IAM ロール（Aurora DSQL が Kinesis に書き込むために使用）
    const cdcRole = new iam.Role(this, 'CdcRole', {
      roleName: 'dsql-cdc-kinesis-role',
      assumedBy: new iam.ServicePrincipal('dsql.amazonaws.com', {
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account,
          },
          ArnLike: {
            'aws:SourceArn': `arn:aws:dsql:${this.region}:${this.account}:cluster/${cluster.clusterIdentifier}/stream/*`,
          },
        },
      }),
    });

    cdcRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'kinesis:PutRecord',
          'kinesis:PutRecords',
          'kinesis:DescribeStreamSummary',
          'kinesis:ListShards',
        ],
        resources: [stream.streamArn],
      }),
    );

    // Lambda（CDC コンシューマ）
    const cdcConsumer = new lambda.Function(this, 'CdcConsumer', {
      functionName: 'dsql-cdc-consumer',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda/cdc-consumer'),
      ),
      timeout: cdk.Duration.seconds(60),
    });

    // Lambda に Kinesis イベントソースを追加
    cdcConsumer.addEventSource(
      new lambdaEventSources.KinesisEventSource(stream, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 100,
      }),
    );

    // Outputs
    new cdk.CfnOutput(this, 'ClusterIdentifier', {
      value: cluster.clusterIdentifier,
      description: 'Aurora DSQL Cluster Identifier',
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: cluster.clusterEndpoint,
      description: 'Aurora DSQL Cluster Endpoint',
    });

    new cdk.CfnOutput(this, 'KinesisStreamArn', {
      value: stream.streamArn,
      description: 'Kinesis Data Stream ARN',
    });

    new cdk.CfnOutput(this, 'CdcRoleArn', {
      value: cdcRole.roleArn,
      description:
        'CDC IAM Role ARN (use this when creating CDC stream in console)',
    });
  }
}
