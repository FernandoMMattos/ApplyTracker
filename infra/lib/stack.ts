import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as iam from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

export class ApplyTrackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ─── VPC ──────────────────────────────────────────────────────────────────
    // 2 AZs, 1 NAT gateway (cost: ~$32/mo). Set natGateways: 0 and
    // assignPublicIp: true in the service to remove the NAT but sacrifice
    // private-subnet placement for ECS tasks.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    })

    // ─── ECR Repository ───────────────────────────────────────────────────────
    const repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'applytrack',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{ maxImageCount: 10, description: 'Keep last 10 images' }],
    })

    // ─── App Secrets ──────────────────────────────────────────────────────────
    // Created with placeholder values. After cdk deploy, open the AWS console,
    // navigate to Secrets Manager → applytrack/app, and replace all UPDATE_ME
    // values with real credentials before updating the ECS service.
    //
    // Required keys:
    //   DATABASE_URL            — postgresql://user:pass@rds-endpoint:5432/applytrack
    //   AUTH_SECRET             — output of: openssl rand -base64 32
    //   AUTH_URL                — http://<load-balancer-dns> (from stack Outputs)
    //   AUTH_GOOGLE_ID/SECRET   — Google OAuth app credentials
    //   AUTH_GITHUB_ID/SECRET   — GitHub OAuth app credentials
    //   ANTHROPIC_API_KEY       — Anthropic console → API keys
    //   NEXT_SERVER_ACTIONS_ENCRYPTION_KEY — output of: openssl rand -base64 32
    const appSecrets = new secretsmanager.Secret(this, 'AppSecrets', {
      secretName: 'applytrack/app',
      description: 'ApplyTrack app secrets — update all UPDATE_ME values before first deploy',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        JSON.stringify({
          DATABASE_URL: 'UPDATE_ME',
          AUTH_SECRET: 'UPDATE_ME',
          AUTH_URL: 'UPDATE_ME',
          AUTH_GOOGLE_ID: 'UPDATE_ME',
          AUTH_GOOGLE_SECRET: 'UPDATE_ME',
          AUTH_GITHUB_ID: 'UPDATE_ME',
          AUTH_GITHUB_SECRET: 'UPDATE_ME',
          ANTHROPIC_API_KEY: 'UPDATE_ME',
          NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: 'UPDATE_ME',
        }),
      ),
    })

    // ─── RDS PostgreSQL ───────────────────────────────────────────────────────
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Allow PostgreSQL from ECS tasks only',
      allowAllOutbound: false,
    })

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSecurityGroup],
      databaseName: 'applytrack',
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      storageEncrypted: true,
      multiAz: false,
      backupRetention: cdk.Duration.days(0),
      enablePerformanceInsights: false,
    })

    // ─── ECS Cluster ──────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'applytrack',
      containerInsights: true,
    })

    // ─── CloudWatch Log Group ─────────────────────────────────────────────────
    const logGroup = new logs.LogGroup(this, 'AppLogs', {
      logGroupName: '/applytrack/app',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // ─── Task IAM Role ────────────────────────────────────────────────────────
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ECS task role - grants read access to app secrets',
    })
    appSecrets.grantRead(taskRole)

    // ─── Task Definition ──────────────────────────────────────────────────────
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      taskRole,
    })

    taskDefinition.addContainer('app', {
      // Placeholder image used for initial CDK bootstrap only.
      // The CD pipeline replaces this with the real image on first push to main.
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:20-alpine'),
      command: [
        'node',
        '-e',
        "require('http').createServer((_,r)=>{r.writeHead(200);r.end('ok')}).listen(3000)",
      ],
      logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'app' }),
      environment: {
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(appSecrets, 'DATABASE_URL'),
        AUTH_SECRET: ecs.Secret.fromSecretsManager(appSecrets, 'AUTH_SECRET'),
        AUTH_URL: ecs.Secret.fromSecretsManager(appSecrets, 'AUTH_URL'),
        AUTH_GOOGLE_ID: ecs.Secret.fromSecretsManager(appSecrets, 'AUTH_GOOGLE_ID'),
        AUTH_GOOGLE_SECRET: ecs.Secret.fromSecretsManager(appSecrets, 'AUTH_GOOGLE_SECRET'),
        AUTH_GITHUB_ID: ecs.Secret.fromSecretsManager(appSecrets, 'AUTH_GITHUB_ID'),
        AUTH_GITHUB_SECRET: ecs.Secret.fromSecretsManager(appSecrets, 'AUTH_GITHUB_SECRET'),
        ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(appSecrets, 'ANTHROPIC_API_KEY'),
        NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: ecs.Secret.fromSecretsManager(
          appSecrets,
          'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY',
        ),
      },
      portMappings: [{ containerPort: 3000 }],
    })

    // ─── ALB + Fargate Service ────────────────────────────────────────────────
    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      taskDefinition,
      publicLoadBalancer: true,
      desiredCount: 1,
      listenerPort: 80,
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.seconds(120),
      circuitBreaker: { rollback: true },
    })

    // /api/health returns 200 — used as the ALB health check target
    service.targetGroup.configureHealthCheck({
      path: '/api/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
    })

    // Allow ECS tasks → RDS on port 5432
    dbSecurityGroup.addIngressRule(
      service.service.connections.securityGroups[0],
      ec2.Port.tcp(5432),
      'ECS tasks to PostgreSQL',
    )

    // ─── Auto-scaling ─────────────────────────────────────────────────────────
    const scaling = service.service.autoScaleTaskCount({ minCapacity: 1, maxCapacity: 4 })
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    })

    // ─── Stack Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: service.loadBalancer.loadBalancerDnsName,
      description: 'Set as AUTH_URL in Secrets Manager (prefix with http://)',
    })

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
      description: 'Push Docker images here: docker push <uri>:latest',
    })

    new cdk.CfnOutput(this, 'AppSecretsArn', {
      value: appSecrets.secretArn,
      description: 'Update all UPDATE_ME values in Secrets Manager before first deploy',
    })

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: database.instanceEndpoint.hostname,
      description:
        'RDS endpoint — use in DATABASE_URL: postgresql://user:pass@<this>:5432/applytrack',
    })

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
    })
  }
}
