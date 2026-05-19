import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AuroraDsqlCdcStack } from '../lib/cdk-stack';

describe('AuroraDsqlCdcStack', () => {
  test('スナップショットテスト', () => {
    const app = new cdk.App();
    const stack = new AuroraDsqlCdcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    expect(template.toJSON()).toMatchSnapshot();
  });
});
