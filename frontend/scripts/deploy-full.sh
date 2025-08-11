#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="QnaInfraStack"
PROFILE="cdk-admin"

echo "🔨 Building frontend…"
npm run build

echo "🧱 Deploying infra stack: $STACK_NAME"
pushd ../infra >/dev/null
npx cdk deploy "$STACK_NAME" --profile "$PROFILE"
popd >/dev/null

echo "✅ Full deploy finished."
