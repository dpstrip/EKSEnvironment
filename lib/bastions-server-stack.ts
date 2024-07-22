import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as assets from 'aws-cdk-lib/aws-s3-assets';
import {Construct} from 'constructs';
import { StackProps } from 'aws-cdk-lib';

export class BastionServerStack extends cdk.Stack{
    constructor(scope: Construct, id: string, props?: cdk.StackProps){
        super(scope,id, props );

        // vpc
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
            vpcId: 'vpc-0fef7c4b45c4f2ad2',
          });



    const bastionSecurityGroup = new ec2.SecurityGroup(this,'BastionSecurityGroup', {
        vpc,
        allowAllOutbound: true
    });
    bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow ssh access');
    bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'allow https access');
    bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow http access');
    bastionSecurityGroup.addIngressRule(
        ec2.Peer.ipv4('3.83.200.219/32'),
        ec2.Port.tcp(22),
      );
    bastionSecurityGroup.addIngressRule(
        ec2.Peer.ipv4('3.83.200.219/32'),
        ec2.Port.tcp(80),
      );

      bastionSecurityGroup.addIngressRule(
        ec2.Peer.ipv4('3.83.200.219/32'),
        ec2.Port.tcp(443),
      );
      bastionSecurityGroup.addIngressRule(
        ec2.Peer.ipv4('10.0.0.0/8'),
        ec2.Port.tcp(443),
      );

                 //trying to get access into server
     [
        ec2.InterfaceVpcEndpointAwsService.AUTOSCALING,
        ec2.InterfaceVpcEndpointAwsService.CLOUDFORMATION,
        ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,      
        ec2.InterfaceVpcEndpointAwsService.ECR,
        ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
        ec2.InterfaceVpcEndpointAwsService.ELASTIC_LOAD_BALANCING,
        ec2.InterfaceVpcEndpointAwsService.KMS,
        ec2.InterfaceVpcEndpointAwsService.LAMBDA,
        ec2.InterfaceVpcEndpointAwsService.STEP_FUNCTIONS,
        ec2.InterfaceVpcEndpointAwsService.STS,    
        ec2.InterfaceVpcEndpointAwsService.EC2,
        ec2.InterfaceVpcEndpointAwsService.SSM,
        ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
        ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES
     ].forEach(e=> vpc.addInterfaceEndpoint(e.shortName,{service: e, securityGroups:[bastionSecurityGroup]}));
      

    const kubectlAsset = new assets.Asset(this, 'KubectlAsset',{
        path: './assets/kubectl'
    });

    const bastion = new ec2.BastionHostLinux(this, 'BastionHost',{
        vpc,
        instanceName: 'BastionHost',
        requireImdsv2: true,
        securityGroup: bastionSecurityGroup,
        machineImage: new ec2.AmazonLinuxImage({ 
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023
        }),
    });

    bastion.instance.userData.addCommands(
        `aws s3 cp s3://${kubectlAsset.s3BucketName}/${kubectlAsset.s3ObjectKey} /tmp/kubectl`,
        `chmod +x /tmp/kubectl`
    );
    kubectlAsset.grantRead(bastion.role);
    bastion.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    bastion.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

    new cdk.CfnOutput(this, 'BastionHostPublicIP',{
        value: bastion.instancePrivateIp,
    });

    }
}
