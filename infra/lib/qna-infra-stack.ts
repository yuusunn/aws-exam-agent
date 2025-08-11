import { Stack, StackProps, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
// import * as events from 'aws-cdk-lib/aws-events';
// import * as targets from 'aws-cdk-lib/aws-events-targets';

export class QnaInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1) DynamoDB：Users / Questions
    const usersTable = new dynamodb.Table(this, 'Users', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // Demo 用；正式請改 RETAIN
    });

    const questionsTable = new dynamodb.Table(this, 'Questions', {
      partitionKey: { name: 'qId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // 2) Lambda 共通設定
    const common: Omit<lambdaNode.NodejsFunctionProps, 'entry'> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(20),
      bundling: {
        target: 'es2022',
        format: lambdaNode.OutputFormat.ESM,
        banner: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
        externalModules: ['aws-sdk'],
      },
      environment: {
        USERS_TABLE: usersTable.tableName,
        QUESTIONS_TABLE: questionsTable.tableName,
        APP_URL: process.env.APP_URL ?? 'http://localhost:5173',
        SES_FROM: process.env.SES_FROM ?? 'no-reply@example.com', // sendWeekly 會用
      },
    };

    // 3) Lambdas
    const subscribeFn = new lambdaNode.NodejsFunction(this, 'SubscribeFn', {
      entry: path.join(__dirname, 'lambdas/subscribe.ts'),
      ...common,
    });
    const unsubscribeFn = new lambdaNode.NodejsFunction(this, 'UnsubscribeFn', {
      entry: path.join(__dirname, 'lambdas/unsubscribe.ts'),
      ...common,
    });
    const questionCurrentFn = new lambdaNode.NodejsFunction(this, 'QuestionCurrentFn', {
      entry: path.join(__dirname, 'lambdas/questionCurrent.ts'),
      ...common,
    });
    const sendWeeklyFn = new lambdaNode.NodejsFunction(this, 'SendWeeklyFn', {
      entry: path.join(__dirname, 'lambdas/sendWeekly.ts'),
      ...common,
    });
    const cleanupFn = new lambdaNode.NodejsFunction(this, "CleanupQuestionsFn", {
      entry: path.join(__dirname, "tools/cleanupQuestions.ts"),
      ...common,
      environment: {
        ...common.environment,
      },
    });
    const listQuestionsFn = new lambdaNode.NodejsFunction(this, 'ListQuestionsFn', {
      entry: path.join(__dirname, 'lambdas/listQuestions.ts'),
      ...common,
    });
    // ===== Frontend Hosting (S3 + CloudFront) =====
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(siteBucket);
    const distribution = new cf.Distribution(this, "SiteDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      // SPA fallback
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: "/index.html" },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: "/index.html" },
      ],
    });
    // dist ディレクトリを S3 にデプロイ
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
        sources: [s3deploy.Source.asset('../frontend/dist')],
        destinationBucket: siteBucket,
        distribution,
        distributionPaths: ['/*'],
    });


    usersTable.grantReadWriteData(subscribeFn);
    usersTable.grantReadWriteData(unsubscribeFn);
    usersTable.grantReadData(sendWeeklyFn);

    questionsTable.grantReadData(questionCurrentFn);
    questionsTable.grantReadData(sendWeeklyFn);
    questionsTable.grantReadWriteData(cleanupFn);
    questionsTable.grantReadData(listQuestionsFn);

    // SES 權限
    sendWeeklyFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'], // TODO: 開発時限定。本番は特定の SES Identity を指定すること
    }));

    // 4) API Gateway
    const api = new apigw.RestApi(this, 'QnaApi', {
      restApiName: "QnaApi",
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      },
    });

    api.root.addResource('subscribe')
      .addMethod('POST', new apigw.LambdaIntegration(subscribeFn));
    api.root.addResource('unsubscribe')
      .addMethod('POST', new apigw.LambdaIntegration(unsubscribeFn));
    api.root.addResource('question')
      .addResource('current')
      .addMethod('GET', new apigw.LambdaIntegration(questionCurrentFn));
    api.root.addResource('send-weekly')
      .addMethod('POST', new apigw.LambdaIntegration(sendWeeklyFn));
    api.root.addResource('questions')
      .addMethod('GET', new apigw.LambdaIntegration(listQuestionsFn));

    // 5) 定時 Lambda（週一配信）
    // 開発時は手動で sendWeeklyFn を実行するので、ここではコメントアウト
    // new events.Rule(this, 'WeeklyRule', {
    //   schedule: events.Schedule.cron({ minute: '0', hour: '0', weekDay: 'MON' }), // UTC 0:00 = JST 9:00
    //   targets: [new targets.LambdaFunction(sendWeeklyFn)],
    // });

    // 6) Seed Lambda（一次性インポート questions.json）
    const seedFn = new lambdaNode.NodejsFunction(this, 'SeedQuestionsFn', {
      entry: path.join(__dirname, 'seed/seedQuestions.ts'),
      ...common,
      bundling: { ...common.bundling!, loader: { '.json': 'json' } },
    });
    questionsTable.grantWriteData(seedFn);

    // アウトプット
    new CfnOutput(this, 'ApiUrl', { value: api.url });
    new CfnOutput(this, 'SeedFunctionName', { value: seedFn.functionName });
    new CfnOutput(this, 'UsersTableName', { value: usersTable.tableName });
    new CfnOutput(this, 'QuestionsTableName', { value: questionsTable.tableName });
    new CfnOutput(this, "CleanupFunctionName", { value: cleanupFn.functionName });
    new CfnOutput(this, 'SiteUrl', { value: 'https://' + distribution.domainName });
    new CfnOutput(this, 'SiteBucketName', { value: siteBucket.bucketName });
    new CfnOutput(this, 'SiteDistributionId', { value: distribution.distributionId });
  }
}
