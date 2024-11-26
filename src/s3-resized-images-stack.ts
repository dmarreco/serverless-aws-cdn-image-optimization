import { App, CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { ArnPrincipal, Effect, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';

import { CommonProps } from '../utils/common';

/**
 * This stack creates the resized images buckets.
 * It is used by Cloudfront as the primary origin, and contains
 * resized (thumbnails) and compressed versions of the images
 * in the main bucket.
 */
export class S3ResizedImagesBucketStack extends Stack {
  constructor(
    parent: App,
    name: string,
    props: StackProps &
      CommonProps & {
        bucketId: string;
        originalBucketName: string;
        originAccessIdentityUserId: string;
        imgResizeEdgeFunctionRoleArn: string;
      },
  ) {
    super(parent, name, props);

    const resizedImagesBucketName = `${props.originalBucketName}-optmized-imgs`;

    const resizedImagesBuckets = new Bucket(this, props.bucketId, {
      bucketName: resizedImagesBucketName,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{ expiration: Duration.days(90) }],
      cors: [
        {
          allowedMethods: [HttpMethods.GET],
          // TODO: (martin) add FRONTEND_BASE_URL for prod and staging to add extra security
          // allowedOrigins: [FRONTEND_BASE_URL],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // TODO: (martin) I had to move below policy from CDN stack as this S3HomeFilesStack stack would remove it
    resizedImagesBuckets.addToResourcePolicy(
      new PolicyStatement({
        sid: 'GrantCloudFrontAccessToBucket',
        effect: Effect.ALLOW,
        principals: [
          new ArnPrincipal(
            `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${props.originAccessIdentityUserId}`,
          ),
        ],
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [resizedImagesBuckets.bucketArn, `${resizedImagesBuckets.bucketArn}/*`],
      }),
    );

    const resizedImgResizeEdgeFunctionRole = Role.fromRoleArn(
      this,
      'EdgeFunctionExecutionRole',
      props.imgResizeEdgeFunctionRoleArn,
    );

    // TODO CDN stack and edge function role will have to be already created; run it again after CDN stack to add it
    if (resizedImgResizeEdgeFunctionRole != null) {
      resizedImagesBuckets.addToResourcePolicy(
        new PolicyStatement({
          sid: 'GrantReadAccessToResizeEdgeFunction',
          effect: Effect.ALLOW,
          principals: [new ArnPrincipal(resizedImgResizeEdgeFunctionRole.roleArn)],
          actions: ['s3:PutObject'],
          resources: [`${resizedImagesBuckets.bucketArn}/*`],
        }),
      );
    }

    new CfnOutput(this, 'ResizedImagesBucketArn', {
      exportName: `${props.stage}-${props.bucketId}Arn`,
      value: resizedImagesBuckets.bucketArn,
    });

    new CfnOutput(this, 'ResizedImagesBucketName', {
      exportName: `${props.stage}-${props.bucketId}Name`,
      value: resizedImagesBuckets.bucketName,
    });
  }
}
