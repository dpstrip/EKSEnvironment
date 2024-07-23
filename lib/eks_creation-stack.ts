import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as s3Assets from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import { KubectlV28Layer } from '@aws-cdk/lambda-layer-kubectl-v28';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as bastion from './bastion';
import * as privateCluster from './cluster';

export class EksCreationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myVPCid = 'vpc-08da75e149a4d7c74'
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: myVPCid,
    });

    new cdk.CfnOutput(this,'VPC',{value : vpc.vpcArn});
    const myBastion =  new bastion.BastionStack(this, 'Bastion','vpc-08da75e149a4d7c74', props, );
    new privateCluster.PrivateCluster(this, "MyCluster", vpc, myBastion);
}
};