#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="QnaInfraStack"
PROFILE="cdk-admin"
DIST_DIR="dist"

echo "🔨 Building frontend…"
npm run build

echo "🔎 Reading CloudFormation outputs for stack: $STACK_NAME"
OUTPUTS_JSON=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output json \
  --profile "$PROFILE")

# OutputKey は CDK SiteBucketName / SiteDistributionId / SiteUrl と一致しなければならない
BUCKET=$(echo "$OUTPUTS_JSON" | node -e "let a=JSON.parse(fs.readFileSync(0,'utf8'));let o=a.find(x=>x.OutputKey==='SiteBucketName');console.log(o?o.OutputValue:'')" )
DIST_ID=$(echo "$OUTPUTS_JSON" | node -e "let a=JSON.parse(fs.readFileSync(0,'utf8'));let o=a.find(x=>x.OutputKey==='SiteDistributionId');console.log(o?o.OutputValue:'')" )
SITE_URL=$(echo "$OUTPUTS_JSON" | node -e "let a=JSON.parse(fs.readFileSync(0,'utf8'));let o=a.find(x=>x.OutputKey==='SiteUrl');console.log(o?o.OutputValue:'')" )

if [[ -z "$BUCKET" || -z "$DIST_ID" ]]; then
  echo "❌ Missing outputs: SiteBucketName or SiteDistributionId."
  echo "   Please ensure your CDK stack outputs these keys and run 'npx cdk deploy' in ../infra once."
  exit 1
fi

echo "📦 Syncing $DIST_DIR → s3://$BUCKET"
aws s3 sync "$DIST_DIR/" "s3://$BUCKET" --delete --profile "$PROFILE"

echo "🚀 Creating CloudFront invalidation /* on $DIST_ID"
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --profile "$PROFILE" > /dev/null

echo "✅ Done. Visit: ${SITE_URL:-'(open CloudFront domain from stack outputs)'}"
