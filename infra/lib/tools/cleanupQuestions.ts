import { DynamoDBClient, ScanCommand, DeleteItemCommand, AttributeValue } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE = process.env.QUESTIONS_TABLE!;

type Event = { prefix?: string };

export const handler = async (event: Event = {}) => {
  // invoke 時に prefix の指定で削除対象の qId を絞る
  const prefix = event.prefix ?? process.env.PREFIX ?? "";
  if (!prefix) {
    return { statusCode: 400, body: JSON.stringify({ error: "prefix required" }) };
  }

  let startKey: Record<string, AttributeValue> | undefined;
  let deleted = 0;

  do {
    const res = await ddb.send(new ScanCommand({
      TableName: TABLE,
      ExclusiveStartKey: startKey,
      ProjectionExpression: "qId",
      FilterExpression: "begins_with(#q, :p)",
      ExpressionAttributeNames: { "#q": "qId" },
      ExpressionAttributeValues: { ":p": { S: prefix } },
    }));

    for (const item of res.Items ?? []) {
      const qId = (item as any).qId.S as string;
      await ddb.send(new DeleteItemCommand({
        TableName: TABLE,
        Key: { qId: { S: qId } },
      }));
      deleted++;
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey);

  return { statusCode: 200, body: JSON.stringify({ deleted, prefix }) };
};