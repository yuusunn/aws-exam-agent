import { DynamoDBClient, ScanCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { ok, bad } from "./_http";

const ddb = new DynamoDBClient({});
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE!;

export const handler = async () => {
  try {
    const res = await ddb.send(new ScanCommand({ TableName: QUESTIONS_TABLE }));
    const items = (res.Items ?? []).map((i) => unmarshall(i) as any);
    items.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
    const latest = items[0] ?? null;
    return ok(latest ?? {});
  } catch (e: any) {
    console.error(e);
    return bad(500, "Failed to load current question");
  }
};