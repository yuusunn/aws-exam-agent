import { DynamoDBClient, ScanCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const ddb = new DynamoDBClient({});
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE!;

export const handler = async () => {
  const res = await ddb.send(new ScanCommand({ TableName: QUESTIONS_TABLE }));

  const raw = (res.Items ?? []) as Record<string, AttributeValue>[];
  const items = raw.map((it) => unmarshall(it)) as any[];

  items.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const q = items[0] || null;
  return { statusCode: 200, body: JSON.stringify(q) };
};
