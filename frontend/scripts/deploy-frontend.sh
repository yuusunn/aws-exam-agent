#!/bin/bash
set -e

STACK_NAME=""
PROFILE="default"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --stack) STACK_NAME="$2"; shift ;;
        --profile) PROFILE="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [[ -z "$STACK_NAME" ]]; then
    echo "Error: --stack <stack-name> is required"
    exit 1
fi

echo "🔨 Building frontend..."
npm run build

echo "📦 Uploading to S3 for stack $STACK_NAME..."
cd ../infra
npx cdk deploy --app "npx ts-node --prefer-ts-exts bin/infra.ts" --profile "$PROFILE" "$STACK_NAME"

echo "✅ Frontend deployment completed!"
