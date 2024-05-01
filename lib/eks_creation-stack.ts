import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {PrivateCluster} from './cluster';
import {aws_ec2 as ec2} from 'aws-cdk-lib';

export class EksCreationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, 'AS3Bucket',{
      versioned:true,
    })


  //Get the curnet vpc
    const vpc = ec2.Vpc.fromLookup(this, 'VPC',{
      vpcId:"vpc-0e7a7fc9ede3b6bbb",
    })
    new cdk.CfnOutput(this,'vpcLookup', {value:vpc.vpcArn});

  // //create EKS cluster
  // new PrivateCluster(this, 'dpsCluster', vpc).cluster;
};
}
