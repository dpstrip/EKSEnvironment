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
      defaultCapacity: 1,
      mastersRole: iamRole,
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
      kubectlLayer: new KubectlV28Layer(this, 'kubectl')
    });

    const policy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      'AmazonEC2ContainerRegistryReadOnly');
    this.cluster.defaultNodegroup?.role.addManagedPolicy(policy);
  }
}