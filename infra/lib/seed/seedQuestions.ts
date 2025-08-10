import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import questions from './questions.json'; // 直接 import JSON

const ddb = new DynamoDBClient({});
const TABLE = process.env.QUESTIONS_TABLE!;

type SeedEvent = { force?: boolean };

export const handler = async (event?: SeedEvent) => {
  // force=true の場合、既存の qId があっても最新のJSONで上書き
  const force = !!event?.force;

  let inserted = 0, skipped = 0, updated = 0, failed = 0;

  for (const q of questions as any[]) {
    try {
      await ddb.send(new PutItemCommand({
        TableName: TABLE,
        Item: marshall(q, { removeUndefinedValues: true }),
        // デフォルト（force=false）では ConditionExpression の使用で存在している qId をスキップ
        // force=true の場合は最新のJSONで全て上書き
        ...(force ? {} : { ConditionExpression: 'attribute_not_exists(qId)' }),
      }));
      if (force) updated++; else inserted++;
    } catch (e: any) {
      const msg = String(e?.name || e?.message || '');
      if (!force && msg.includes('ConditionalCheckFailed')) { skipped++; continue; }
      failed++; console.error('seed failed', q.qId, msg);
    }
  }
  return { statusCode: 200, body: JSON.stringify({ inserted, updated, skipped, failed }) };
};
