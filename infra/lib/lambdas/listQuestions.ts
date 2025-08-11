import { DynamoDBClient, ScanCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { ok, bad } from "./_http";

const ddb = new DynamoDBClient({});
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE!;

// 最近の質問を取得する（デフォルト：20問）
export const handler = async (event: any) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(event?.queryStringParameters?.limit ?? 20)));
    const res = await ddb.send(new ScanCommand({ TableName: QUESTIONS_TABLE }));
    const items = (res.Items ?? []).map((i) => unmarshall(i) as any);
    items.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
    return ok(items.slice(0, limit));
  } catch (e: any) {
    console.error(e);
    return bad(500, "Failed to list questions");
  }
};
