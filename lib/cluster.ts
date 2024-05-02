import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { KubectlV28Layer } from '@aws-cdk/lambda-layer-kubectl-v28';

export class PrivateCluster extends Construct {
  readonly cluster : eks.Cluster;
  
  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    const iamRole = new iam.Role(this, `${id}-iam-eksCluster`,{
      roleName: `${id}-iam-eksCluster`,
      assumedBy: new iam.AccountRootPrincipal(),
    });

    this.cluster = new eks.Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'dpsEKSCluster',
      defaultCapacity: 1,  
      defaultCapacityInstance: ec2.InstanceType.of(ec2.InstanceClass.M5,ec2.InstanceSize.XLARGE),
      placeClusterHandlerInVpc: true,
      version: eks.KubernetesVersion.V1_28,
      endpointAccess: eks.EndpointAccess.PRIVATE,
      vpcSubnets: [{ 
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED 
      }],
      kubectlEnvironment: {
          // use vpc endpoint, not the global
          "AWS_STS_REGIONAL_ENDPOINTS": 'regional'
      },
      kubectlLayer: new KubectlV28Layer(this, 'kubectl'),
      mastersRole: iamRole
    });
    //my issue is how to assign the master role to my AWS role
    this.cluster.awsAuth.addMastersRole(iam.Role.fromRoleArn(this, 'masterrole', 'arn:us-east-1:iam::929556976395:role/AWSReservedSSO_AWSAdministratorAccess_d4aeae66894d98fe'));
   
    this.cluster.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'));

    this.cluster.clusterSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'),ec2.Port.tcp(443), 'runner');
    this.cluster.clusterSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.179.253.0/24'),ec2.Port.tcp(443), 'runner');
    this.cluster.clusterSecurityGroup.addIngressRule(ec2.Peer.ipv4('198.18.0.0/22'),ec2.Port.tcp(443), 'runner');
    this.cluster.clusterSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'),ec2.Port.tcp(80), 'runner');
    this.cluster.clusterSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.179.253.0/24'),ec2.Port.tcp(80), 'runner');
    this.cluster.clusterSecurityGroup.addIngressRule(ec2.Peer.ipv4('198.18.0.0/22'),ec2.Port.tcp(80), 'runner');
  }
}