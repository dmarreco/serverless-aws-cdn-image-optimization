# AWS Serverless On-the-fly Image Resizing Service

This project deploys shared infrastructure resources using AWS CDK.

## Test

Original image: http://<cdn-url>/large_image.jpg
Resized (200px wide) image: http://<cdn-url>/large_image.jpg?w=200

## Bootstrap

`cdk bootstrap [--profile <profile>] [--verbose]`

## DEPLOY

`cdk deploy <StackName | '--all'> [--profile <profile>]`

## Useful commands

- `npm run build`   Compile TypeScript to JavaScript.
- `npm run watch`   Watch for changes and compile automatically.
- `npm run synth`   Synthesize the CloudFormation template.
- `npm run deploy`  Deploy the stack to AWS.
- `npm run destroy` Destroy the stack from AWS.

## CDK Resources

- **Lambdas**:
    -- **cf-edge-origin-response-img-resize**: An [Origin Response](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-response) Lambda@Edge function that will actually compress/resize and return the resized payload while storing the resized version (long cache) so future requests can be provided without compressing computational effort.
    -- **cf-s3-viewer-request-url-rewrite**: A [Viewer Request](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-request) function that will remap the origin request to target the requested size of the image.
- **CloudFront Deployment**: The CDN
- **Primary S3 Bucket**: A versioned S3 bucket - source of the original images
- **Optimized Versions S3 Bucket**: A non-versioned S3 bucket containing resized versions, that are kept for 90 days (a long-term cache - longer than CDN caching)


## TODO

- add trigger function to cognito onUserCreate

