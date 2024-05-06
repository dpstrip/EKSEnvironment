import { StackProps } from 'aws-cdk-lib';
import * as ec2 from'aws-cdk-lib/aws-ec2';
import * as iam from'aws-cdk-lib/aws-iam';
import * as s3Assets from'aws-cdk-lib/aws-s3-assets';
import {Construct} from 'constructs';

export class BastionStack extends Construct {
    readonly host: ec2.BastionHostLinux;

    constructor(scope: Construct, id: string, props?: StackProps){
        super(scope, id);

        //get vpc
        const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
            vpcId: 'vpc-0e7a7fc9ede3b6bbb',
          });

        //define an asset object that contains kubectl
        const asset = new s3Assets.Asset(this, 'S3Asset', {
            path: 'assets/kubectl'
        });

        const userData = ec2.UserData.forLinux();
        userData.addS3DownloadCommand({
            region: 'us-east-1',
            bucket: asset.bucket,
            bucketKey: asset.s3ObjectKey,
            localFile: '/tmp/kubectl'
        });
        userData.addCommands(
            'chmod +x /tmp/kubectl',
            'sudo cp /tmp/kubectl /usr/local/bin'
        );

        //Create security groups for bastion server
        const securityGroup = new ec2.SecurityGroup(this, 'BastionServerSG',{
            vpc: vpc,
            allowAllOutbound: true,
            securityGroupName: 'BastionServerSG'
        });

        securityGroup.addIngressRule(
            ec2.Peer.ipv4('3.83.200.219/32'),
            ec2.Port.tcp(22),
          );
          securityGroup.addIngressRule(
            ec2.Peer.ipv4('3.83.200.219/32'),
            ec2.Port.tcp(80),
          );
          securityGroup.addIngressRule(
            ec2.Peer.ipv4('3.83.200.219/32'),
            ec2.Port.tcp(443),
          );

        this.host = new ec2.BastionHostLinux(this, 'BastionHostGroupRuleName', {
            vpc: vpc,
            instanceName: "BastionServer",
            requireImdsv2: true,
            securityGroup,
            machineImage: ec2.MachineImage.latestAmazonLinux2023({userData,})
        });

        const bastionrole = this.host.role;
        bastionrole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
        bastionrole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    }
}