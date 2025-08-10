import { DynamoDBClient, ScanCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const ddb = new DynamoDBClient({});
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE!;

// 最近の質問を取得する（デフォルト：20問）
export const handler = async (event: any) => {
  const limit = Math.max(1, Math.min(100, Number(event?.queryStringParameters?.limit ?? 20)));
  const res = await ddb.send(new ScanCommand({ TableName: QUESTIONS_TABLE }));
  const raw = (res.Items ?? []) as Record<string, AttributeValue>[];
  const items = raw.map((it) => unmarshall(it)) as Array<{
    qId: string; title?: string; body?: string; tags?: string[]; publishedAt?: string;
  }>;

  items.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  return { statusCode: 200, body: JSON.stringify(items.slice(0, limit)) };
};
